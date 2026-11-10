// Admin → API i integracije: API ključevi, webhookovi i dnevnik poziva (samo vlasnik).
// Sve stranice integracija vidi samo vlasnik.
const net = require("net");
const { db } = require("./db");
const { HttpError, sendJson, readJson, str } = require("./http");
const spec = require("./api-spec");
const api = require("./api-v1");
const webhooks = require("./webhooks");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function keyInput(b) {
  const name = str(b.name, 80);
  if (!name) throw new HttpError(400, "Unesite naziv ključa (npr. Knjigovodstvo).", { fields: ["name"] });
  const scopes = Array.isArray(b.scopes) ? [...new Set(b.scopes.filter((s) => Object.hasOwn(spec.SCOPES, s)))] : [];
  if (!scopes.length) throw new HttpError(400, "Odaberite bar jednu ovlast.", { fields: ["scopes"] });
  const ips = api.listOf(String(b.allowed_ips || "").replace(/[\s;]+/g, ","));
  const badIp = ips.find((ip) => !net.isIP(api.normIp(ip)));
  if (badIp) throw new HttpError(400, `"${badIp}" nije ispravna IP adresa.`, { fields: ["allowed_ips"] });
  const expires = str(b.expires_at, 10);
  if (expires && (!DATE_RE.test(expires) || Number.isNaN(Date.parse(expires)))) throw new HttpError(400, "Neispravan datum isteka.", { fields: ["expires_at"] });
  return { name, scopes: scopes.join(","), allowed_ips: ips.map(api.normIp).join(","), expires_at: expires || null, note: str(b.note, 200) };
}

function hookInput(b) {
  const name = str(b.name, 80);
  if (!name) throw new HttpError(400, "Unesite naziv (npr. Knjigovodstvo — nove narudžbe).", { fields: ["name"] });
  const url = str(b.url, 500);
  const bad = webhooks.checkUrl(url);
  if (bad) throw new HttpError(400, bad, { fields: ["url"] });
  const events = Array.isArray(b.events) ? [...new Set(b.events.filter((e) => Object.hasOwn(webhooks.EVENTS, e)))] : [];
  if (!events.length) throw new HttpError(400, "Odaberite bar jedan događaj.", { fields: ["events"] });
  return { name, url: new URL(url).href, events: events.join(","), active: b.active === false || b.active === 0 ? 0 : 1 };
}

const KEY_COLS = "id, name, prefix, scopes, allowed_ips, expires_at, note, created_by, created_at, last_used_at, last_ip, requests, revoked_at";
const keyText = (k) => `ovlasti: ${k.scopes.split(",").join(", ")}${k.allowed_ips ? ` · IP: ${k.allowed_ips}` : ""}${k.expires_at ? ` · važi do ${k.expires_at}` : ""}`;

module.exports = function integrationRoutes(r, { A, O, log }) {
  r.get("/api/admin/integrations", O((ctx) => {
    const one = (sql) => db.prepare(sql).get();
    sendJson(ctx.res, 200, {
      keys: db.prepare(`SELECT ${KEY_COLS} FROM api_keys ORDER BY revoked_at IS NOT NULL, id DESC`).all(),
      webhooks: db.prepare(`SELECT w.*, (SELECT count(*) FROM webhook_deliveries d WHERE d.webhook_id = w.id AND d.status = 'pending') pending,
        (SELECT count(*) FROM webhook_deliveries d WHERE d.webhook_id = w.id AND d.status = 'failed' AND d.created_at >= datetime('now', '-7 days')) failed
        FROM webhooks w ORDER BY w.id DESC`).all(),
      requests: db.prepare("SELECT * FROM api_requests ORDER BY id DESC LIMIT 100").all(),
      deliveries: db.prepare(`SELECT d.id, d.webhook_id, w.name webhook_name, d.uid, d.event, d.status, d.attempts, d.next_at, d.response_code, d.response_body, d.error, d.created_at, d.delivered_at, d.payload
        FROM webhook_deliveries d LEFT JOIN webhooks w ON w.id = d.webhook_id ORDER BY d.id DESC LIMIT 60`).all(),
      stats: {
        keys: one("SELECT count(*) n FROM api_keys WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at >= date('now', 'localtime'))").n,
        requests24h: one("SELECT count(*) n FROM api_requests WHERE created_at >= datetime('now', '-1 day')").n,
        errors24h: one("SELECT count(*) n FROM api_requests WHERE status >= 400 AND created_at >= datetime('now', '-1 day')").n,
        failedDeliveries: one("SELECT count(*) n FROM webhook_deliveries WHERE status = 'failed' AND event != 'ping' AND created_at >= datetime('now', '-7 days')").n,
      },
      scopes: spec.SCOPES, presets: spec.PRESETS, events: webhooks.EVENTS, rate_limit: api.RATE_LIMIT,
    });
  }));

  /* ---------- API ključevi ---------- */
  r.post("/api/admin/api-keys", O(async (ctx) => {
    const k = keyInput(await readJson(ctx.req));
    const gen = api.generateKey();
    const res = db.prepare("INSERT INTO api_keys(name, prefix, key_hash, scopes, allowed_ips, expires_at, note, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(k.name, gen.prefix, gen.hash, k.scopes, k.allowed_ips, k.expires_at, k.note, [ctx.user.first_name, ctx.user.last_name].filter(Boolean).join(" ") || ctx.user.email);
    log(ctx, "Napravio API ključ", { type: "integration", id: Number(res.lastInsertRowid), label: k.name, details: keyText(k) });
    // Cijeli ključ se prikazuje samo sada — u bazi se čuva samo njegov otisak (hash)
    sendJson(ctx.res, 201, { key: gen.key, id: Number(res.lastInsertRowid), name: k.name });
  }));
  r.put("/api/admin/api-keys/:id", O(async (ctx) => {
    const before = db.prepare("SELECT * FROM api_keys WHERE id = ?").get(+ctx.params.id);
    if (!before) throw new HttpError(404, "Ključ nije pronađen.");
    if (before.revoked_at) throw new HttpError(400, "Opozvan ključ se ne može mijenjati — napravite novi.");
    const k = keyInput(await readJson(ctx.req));
    db.prepare("UPDATE api_keys SET name = ?, scopes = ?, allowed_ips = ?, expires_at = ?, note = ? WHERE id = ?").run(k.name, k.scopes, k.allowed_ips, k.expires_at, k.note, before.id);
    if (keyText(before) !== keyText(k) || before.name !== k.name) log(ctx, "Izmijenio API ključ", { type: "integration", id: before.id, label: k.name, details: `${keyText(before)} → ${keyText(k)}` });
    sendJson(ctx.res, 200, { ok: true });
  }));
  r.post("/api/admin/api-keys/:id/revoke", O((ctx) => {
    const k = db.prepare("SELECT * FROM api_keys WHERE id = ?").get(+ctx.params.id);
    if (!k) throw new HttpError(404, "Ključ nije pronađen.");
    if (!k.revoked_at) {
      db.prepare("UPDATE api_keys SET revoked_at = datetime('now') WHERE id = ?").run(k.id);
      log(ctx, "Opozvao API ključ", { type: "integration", id: k.id, label: k.name, details: `${k.prefix}…` });
    }
    sendJson(ctx.res, 200, { ok: true });
  }));
  r.delete("/api/admin/api-keys/:id", O((ctx) => {
    const k = db.prepare("SELECT * FROM api_keys WHERE id = ?").get(+ctx.params.id);
    if (!k) throw new HttpError(404, "Ključ nije pronađen.");
    if (!k.revoked_at) throw new HttpError(400, "Prvo opozovite ključ, pa ga onda obrišite.");
    db.prepare("DELETE FROM api_keys WHERE id = ?").run(k.id);
    log(ctx, "Obrisao API ključ", { type: "integration", id: k.id, label: k.name });
    sendJson(ctx.res, 200, { ok: true });
  }));

  /* ---------- Webhookovi ---------- */
  r.post("/api/admin/webhooks", O(async (ctx) => {
    const h = hookInput(await readJson(ctx.req));
    const secret = webhooks.newSecret();
    const res = db.prepare("INSERT INTO webhooks(name, url, secret, events, active) VALUES (?, ?, ?, ?, ?)").run(h.name, h.url, secret, h.events, h.active);
    log(ctx, "Dodao webhook", { type: "integration", id: Number(res.lastInsertRowid), label: h.name, details: `${h.url} · ${h.events}` });
    sendJson(ctx.res, 201, { id: Number(res.lastInsertRowid), secret });
  }));
  r.put("/api/admin/webhooks/:id", O(async (ctx) => {
    const before = db.prepare("SELECT * FROM webhooks WHERE id = ?").get(+ctx.params.id);
    if (!before) throw new HttpError(404, "Webhook nije pronađen.");
    const h = hookInput(await readJson(ctx.req));
    db.prepare("UPDATE webhooks SET name = ?, url = ?, events = ?, active = ? WHERE id = ?").run(h.name, h.url, h.events, h.active, before.id);
    const d = [];
    if (before.url !== h.url) d.push(`adresa: ${before.url} → ${h.url}`);
    if (before.events !== h.events) d.push(`događaji: ${before.events} → ${h.events}`);
    if (before.active !== h.active) d.push(h.active ? "uključen" : "isključen");
    if (before.name !== h.name) d.push(`naziv: ${before.name} → ${h.name}`);
    if (d.length) log(ctx, "Izmijenio webhook", { type: "integration", id: before.id, label: h.name, details: d.join(" · ") });
    sendJson(ctx.res, 200, { ok: true });
  }));
  r.post("/api/admin/webhooks/:id/secret", O((ctx) => {
    const h = db.prepare("SELECT * FROM webhooks WHERE id = ?").get(+ctx.params.id);
    if (!h) throw new HttpError(404, "Webhook nije pronađen.");
    const secret = webhooks.newSecret();
    db.prepare("UPDATE webhooks SET secret = ? WHERE id = ?").run(secret, h.id);
    log(ctx, "Promijenio tajni ključ webhooka", { type: "integration", id: h.id, label: h.name });
    sendJson(ctx.res, 200, { secret });
  }));
  r.delete("/api/admin/webhooks/:id", O((ctx) => {
    const h = db.prepare("SELECT * FROM webhooks WHERE id = ?").get(+ctx.params.id);
    if (!h) throw new HttpError(404, "Webhook nije pronađen.");
    db.prepare("DELETE FROM webhook_deliveries WHERE webhook_id = ?").run(h.id);
    db.prepare("DELETE FROM webhooks WHERE id = ?").run(h.id);
    log(ctx, "Obrisao webhook", { type: "integration", id: h.id, label: h.name, details: h.url });
    sendJson(ctx.res, 200, { ok: true });
  }));
  r.post("/api/admin/webhooks/:id/test", O(async (ctx) => {
    if (!db.prepare("SELECT 1 FROM webhooks WHERE id = ?").get(+ctx.params.id)) throw new HttpError(404, "Webhook nije pronađen.");
    sendJson(ctx.res, 200, await webhooks.sendTest(+ctx.params.id));
  }));
  r.post("/api/admin/webhook-deliveries/:id/retry", O(async (ctx) => {
    const d = db.prepare("SELECT d.id, w.id wid FROM webhook_deliveries d LEFT JOIN webhooks w ON w.id = d.webhook_id WHERE d.id = ?").get(+ctx.params.id);
    if (!d) throw new HttpError(404, "Isporuka nije pronađena.");
    if (!d.wid) throw new HttpError(400, "Webhook ove isporuke je obrisan.");
    sendJson(ctx.res, 200, await webhooks.retry(d.id));
  }));

  /* ---------- Dokumentacija ---------- */
  r.get("/api/admin/api-docs", A((ctx) => {
    sendJson(ctx.res, 200, {
      endpoints: spec.ENDPOINTS, scopes: spec.SCOPES, errors: spec.ERRORS, events: webhooks.EVENTS,
      timezone: spec.TIMEZONE, rate_limit: api.RATE_LIMIT, site_url: (process.env.SITE_URL || "").replace(/\/+$/, ""),
      webhook: { max_attempts: webhooks.MAX_ATTEMPTS, backoff_minutes: webhooks.BACKOFF_MS.map((x) => x / 60e3) },
    });
  }));
};
