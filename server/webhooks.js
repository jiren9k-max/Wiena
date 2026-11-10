// Webhookovi: shop sam javlja vanjskom sistemu (npr. knjigovodstvu) kad se nešto desi — nova narudžba, promjena statusa.
// Svaka isporuka se prvo upiše u bazu (webhook_deliveries), pa se šalje; neuspjele se ponavljaju i nakon restarta servera.
// Potpis: X-Wiena-Signature: t=<unix vrijeme>,v1=<HMAC-SHA256(secret, "<t>.<tijelo zahtjeva>") u hex>
const crypto = require("crypto");
const { db } = require("./db");

const EVENTS = {
  "order.created": "Nova narudžba",
  "order.status_changed": "Promjena statusa narudžbe",
};
const TIMEOUT_MS = 10000;
// Pauze prije ponovnog pokušaja: 1 min, 5 min, 30 min, 2 h, 6 h → ukupno 6 pokušaja
const BACKOFF_MS = [60e3, 5 * 60e3, 30 * 60e3, 2 * 3600e3, 6 * 3600e3];
const MAX_ATTEMPTS = BACKOFF_MS.length + 1;
const USER_AGENT = "WienaShop-Webhooks/1.0";

const newSecret = () => "whsec_" + crypto.randomBytes(24).toString("hex");
const newUid = () => "evt_" + crypto.randomUUID().replace(/-/g, "");
const sign = (secret, t, body) => crypto.createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");

// Adresa mora biti https (podaci kupaca), osim lokalne adrese za testiranje
function checkUrl(raw) {
  let u;
  try { u = new URL(String(raw || "").trim()); } catch { return "Unesite ispravnu adresu (npr. https://primjer.ba/webhook)."; }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  if (u.protocol !== "https:" && !(u.protocol === "http:" && local)) return "Adresa mora počinjati sa https:// (http:// je dozvoljen samo za localhost).";
  if (u.username || u.password) return "Adresa ne smije sadržavati korisničko ime i lozinku.";
  if (u.href.length > 500) return "Adresa je preduga.";
  return null;
}

const insertDelivery = db.prepare("INSERT INTO webhook_deliveries(webhook_id, uid, event, payload, next_at) VALUES (?, ?, ?, ?, ?)");

function makePayload(event, data) {
  const uid = newUid();
  return { uid, body: JSON.stringify({ id: uid, event, created_at: new Date().toISOString(), data }) };
}

// Poziva se iz shopa/admina/API-ja. Nikad ne baca grešku — narudžba mora proći i kad webhook ne radi.
function emit(event, data) {
  try {
    const hooks = db.prepare("SELECT id, events FROM webhooks WHERE active = 1").all().filter((h) => h.events.split(",").includes(event));
    if (!hooks.length) return;
    for (const h of hooks) {
      const p = makePayload(event, data);
      insertDelivery.run(h.id, p.uid, event, p.body, Date.now());
    }
    setImmediate(processQueue);
  } catch (e) {
    console.error("[webhook]", e.message);
  }
}

const inflight = new Set();

async function attempt(deliveryId) {
  if (inflight.has(deliveryId)) return { ok: false, error: "Isporuka se upravo šalje." };
  inflight.add(deliveryId);
  try {
    const d = db.prepare("SELECT * FROM webhook_deliveries WHERE id = ?").get(deliveryId);
    if (!d) return { ok: false, error: "Isporuka ne postoji." };
    const hook = db.prepare("SELECT * FROM webhooks WHERE id = ?").get(d.webhook_id);
    if (!hook) return { ok: false, error: "Webhook ne postoji." };

    const t = Math.floor(Date.now() / 1000);
    let code = null, body = "", error = null;
    try {
      const res = await fetch(hook.url, {
        method: "POST",
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "Content-Type": "application/json",
          "User-Agent": USER_AGENT,
          "X-Wiena-Event": d.event,
          "X-Wiena-Delivery": d.uid,
          "X-Wiena-Signature": `t=${t},v1=${sign(hook.secret, t, d.payload)}`,
        },
        body: d.payload,
      });
      code = res.status;
      body = (await res.text().catch(() => "")).slice(0, 500);
      if (code < 200 || code >= 300) error = `Odgovor HTTP ${code}`;
    } catch (e) {
      error = e.name === "TimeoutError" ? `Nema odgovora u ${TIMEOUT_MS / 1000} s` : `Nije moguće povezati se (${e.cause?.code || e.message})`;
    }

    const attempts = d.attempts + 1;
    if (!error) {
      db.prepare("UPDATE webhook_deliveries SET status = 'ok', attempts = ?, response_code = ?, response_body = ?, error = NULL, delivered_at = datetime('now'), next_at = NULL WHERE id = ?")
        .run(attempts, code, body, d.id);
    } else {
      const failed = attempts >= MAX_ATTEMPTS;
      db.prepare("UPDATE webhook_deliveries SET status = ?, attempts = ?, response_code = ?, response_body = ?, error = ?, next_at = ? WHERE id = ?")
        .run(failed ? "failed" : "pending", attempts, code, body, error, failed ? null : Date.now() + BACKOFF_MS[attempts - 1], d.id);
    }
    db.prepare("UPDATE webhooks SET last_at = datetime('now'), last_ok = ?, last_error = ? WHERE id = ?").run(error ? 0 : 1, error, hook.id);
    return { ok: !error, code, error, attempts, body };
  } finally {
    inflight.delete(deliveryId);
  }
}

let running = false;
async function processQueue() {
  if (running) return;
  running = true;
  try {
    for (;;) {
      const due = db.prepare("SELECT id FROM webhook_deliveries WHERE status = 'pending' AND next_at <= ? ORDER BY id LIMIT 10").all(Date.now());
      const todo = due.filter((d) => !inflight.has(d.id));
      if (!todo.length) break;
      for (const d of todo) await attempt(d.id);
    }
  } catch (e) {
    console.error("[webhook]", e.message);
  } finally {
    running = false;
  }
}

// Probna poruka (dugme "Pošalji test" u adminu) — šalje se odmah, rezultat se vidi u adminu
async function sendTest(hookId) {
  const p = makePayload("ping", { message: "Test poruka iz WIENA web shopa (Wiena Group d.o.o.). Ako ovo vidite, webhook radi." });
  const id = Number(insertDelivery.run(hookId, p.uid, "ping", p.body, null).lastInsertRowid);
  // Test se ne ponavlja automatski
  const r = await attempt(id);
  if (!r.ok) db.prepare("UPDATE webhook_deliveries SET status = 'failed', next_at = NULL WHERE id = ?").run(id);
  return r;
}

// Ručno ponovno slanje (iz dnevnika isporuka)
async function retry(deliveryId) {
  db.prepare("UPDATE webhook_deliveries SET status = 'pending', next_at = NULL, attempts = min(attempts, ?) WHERE id = ?").run(MAX_ATTEMPTS - 1, deliveryId);
  const r = await attempt(deliveryId);
  if (!r.ok) db.prepare("UPDATE webhook_deliveries SET status = 'failed', next_at = NULL WHERE id = ? AND status = 'pending'").run(deliveryId);
  return r;
}

function start() {
  const prune = () => db.prepare("DELETE FROM webhook_deliveries WHERE status != 'pending' AND created_at < datetime('now', '-30 days')").run();
  prune();
  setInterval(prune, 24 * 3600e3).unref();
  setInterval(processQueue, 30e3).unref();
  setImmediate(processQueue); // isporuke koje su čekale dok je server bio ugašen
}

module.exports = { EVENTS, MAX_ATTEMPTS, BACKOFF_MS, newSecret, sign, checkUrl, emit, sendTest, retry, start, processQueue };
