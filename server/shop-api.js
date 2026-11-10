// API za kupce: katalog, narudžbe, korisnički račun, kontakt, newsletter
const { db, getSettings, tx } = require("./db");
const catalog = require("./catalog");
const auth = require("./auth");
const mail = require("./mail");
const vouchers = require("./vouchers");
const orders = require("./orders");
const webhooks = require("./webhooks");
const { HttpError, sendJson, readJson, str, required, email, num, limiter } = require("./http");

// Zaštita od spama: najviše toliko zahtjeva po IP adresi u zadanom periodu
const LIMITS = {
  order: limiter(15, 3600e3),
  forgot: limiter(5, 3600e3),
  contact: limiter(10, 3600e3),
  newsletter: limiter(10, 3600e3),
  voucher: limiter(30, 600e3), // sprječava pogađanje kodova
};

const DELIVERY = ["posta", "studio"];
const PAYMENT = ["pouzece", "racun"];

// Prijava postoji samo za vlasnika (admin) — kupci naručuju bez računa
const isTeam = (u) => !!u && u.role === "owner";
const teamRequired = (ctx) => { if (!isTeam(ctx.user)) throw new HttpError(401, "Prijavite se."); };

function orderWithItems(o) {
  return { ...o, items: db.prepare("SELECT code, name, size, colour, price, qty FROM order_items WHERE order_id = ?").all(o.id) };
}

module.exports = function shopRoutes(r) {
  // Provjera da server radi (koristi je hosting, npr. Railway)
  r.get("/api/health", (ctx) => sendJson(ctx.res, 200, { ok: true }));

  // Katalog kao skripta (window.WIENA_DATA) — shop je učita prije js/products.js
  r.get("/api/catalog.js", (ctx) => {
    const { js, etag } = catalog.get();
    if (ctx.req.headers["if-none-match"] === etag) { ctx.res.writeHead(304, { ETag: etag }); return ctx.res.end(); }
    ctx.res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", ETag: etag, "Cache-Control": "no-cache" });
    ctx.res.end(js);
  });

  // Trenutna zaliha (stranica proizvoda je provjeri prije dodavanja u korpu)
  r.get("/api/stock/:id", (ctx) => {
    const p = db.prepare("SELECT stock FROM products WHERE id = ? AND active = 1").get(+ctx.params.id);
    if (!p) throw new HttpError(404, "Proizvod nije pronađen.");
    sendJson(ctx.res, 200, { stock: p.stock });
  });

  /* ---------- Vaučeri ---------- */
  // Provjera koda u korpi: cijene se uzimaju iz baze, ne od browsera
  r.post("/api/vouchers/check", async (ctx) => {
    const b = await readJson(ctx.req);
    LIMITS.voucher.check(ctx.ip);
    let subtotal = 0;
    for (const it of Array.isArray(b.items) ? b.items.slice(0, 100) : []) {
      if (!it || typeof it !== "object" || !it.id) continue;
      const p = db.prepare("SELECT price FROM products WHERE id = ? AND active = 1").get(+it.id);
      if (p) subtotal += p.price * Math.floor(num(it.qty, { min: 1, max: 99 }));
    }
    const { voucher, discount } = vouchers.evaluate(b.code, vouchers.round2(subtotal));
    sendJson(ctx.res, 200, { voucher: vouchers.publicInfo(voucher), discount });
  });

  /* ---------- Narudžbe ---------- */
  r.post("/api/orders", async (ctx) => {
    const b = await readJson(ctx.req);
    required(b, ["first_name", "last_name", "phone", "email"]);
    const delivery = DELIVERY.includes(b.delivery) ? b.delivery : null;
    const payment = PAYMENT.includes(b.payment) ? b.payment : null;
    if (!delivery || !payment) throw new HttpError(400, "Odaberite način dostave i plaćanja.");
    if (delivery === "posta") required(b, ["address", "city", "zip"]);
    if (delivery === "studio" && getSettings().pickup_enabled !== "1") throw new HttpError(400, "Preuzimanje u studiju trenutno nije moguće.");
    // Isti proizvod u istoj veličini (ako je poslan u više redova) saberi u jedan red
    const merged = new Map();
    for (const it of Array.isArray(b.items) ? b.items.slice(0, 100) : []) {
      if (!it || typeof it !== "object" || !it.id) continue;
      const key = +it.id + "|" + str(it.size, 60);
      merged.set(key, (merged.get(key) || 0) + Math.floor(num(it.qty, { min: 1, max: 99 })));
    }
    const items = [...merged].map(([k, qty]) => ({ id: +k.split("|")[0], size: k.slice(k.indexOf("|") + 1), qty }));
    if (!items.length) throw new HttpError(400, "Korpa je prazna.");
    if (items.some((it) => it.qty > 99)) throw new HttpError(400, "Najviše 99 komada istog artikla po narudžbi.");
    LIMITS.order.check(ctx.ip);
    const lang = b.lang === "en" ? "en" : "bs";

    const s = getSettings();
    const order = tx(() => {
      const lines = [];
      const problems = [];
      const need = new Map(); // ukupno traženo po proizvodu (sve veličine zajedno dijele zalihu)
      for (const it of items) {
        const p = db.prepare("SELECT id, code, name_bs, colour_bs, sizes, price, stock FROM products WHERE id = ? AND active = 1").get(it.id);
        if (!p) { problems.push({ id: it.id, reason: "nedostupan" }); continue; }
        let sizes = [];
        try { sizes = JSON.parse(p.sizes || "[]"); } catch { /* bez veličina */ }
        const size = sizes.length <= 1 ? sizes[0] || "" : it.size;
        if (sizes.length > 1 && !sizes.includes(size)) { problems.push({ id: p.id, code: p.code, name: p.name_bs, reason: "velicina" }); continue; }
        need.set(p.id, (need.get(p.id) || 0) + it.qty);
        if (p.stock !== null && p.stock < need.get(p.id)) { problems.push({ id: p.id, code: p.code, name: p.name_bs, reason: "zaliha", available: p.stock }); continue; }
        lines.push({ ...p, name: p.name_bs, colour: p.colour_bs, size, qty: it.qty });
      }
      if (problems.length) throw new HttpError(409, "Neki artikli više nisu dostupni u traženoj količini.", { problems });

      const subtotal = vouchers.round2(lines.reduce((sum, l) => sum + l.price * l.qty, 0));
      // Vaučer se provjerava ovdje, na serveru — iznos popusta koji pošalje browser se ne koristi
      let voucher = null, discount = 0;
      if (b.voucher) ({ voucher, discount } = vouchers.evaluate(b.voucher, subtotal));
      const afterDiscount = vouchers.round2(subtotal - discount);
      const fee = +s.shipping_fee || 0, freeOver = +s.free_shipping_over || 0;
      const shipping = delivery === "posta" && !(freeOver > 0 && afterDiscount >= freeOver) ? fee : 0;
      const total = vouchers.round2(afterDiscount + shipping);

      if (voucher && db.prepare("UPDATE vouchers SET used = used + 1 WHERE id = ? AND (max_uses IS NULL OR used < max_uses)").run(voucher.id).changes !== 1) {
        throw new HttpError(400, "Ovaj vaučer je upravo iskorišten.");
      }

      const res = db.prepare(`INSERT INTO orders(user_id, first_name, last_name, email, phone, delivery, address, city, zip, payment, note, subtotal, shipping, total, voucher_code, discount, lang)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        null, str(b.first_name, 80), str(b.last_name, 80), email(b.email), str(b.phone, 40), delivery,
        delivery === "posta" ? str(b.address, 200) : "", delivery === "posta" ? str(b.city, 80) : "", delivery === "posta" ? str(b.zip, 12) : "",
        payment, str(b.note, 1000), subtotal, shipping, total, voucher ? voucher.code : null, discount, lang);
      const id = Number(res.lastInsertRowid);
      const number = `WN-${new Date().getFullYear()}-${String(id).padStart(5, "0")}`;
      db.prepare("UPDATE orders SET number = ? WHERE id = ?").run(number, id);
      const addItem = db.prepare("INSERT INTO order_items(order_id, product_id, code, name, size, colour, price, qty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      // Zaliha se skida samo ako je još ima dovoljno (zaštita od prodaje u minus)
      const takeStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL AND stock >= ?");
      for (const l of lines) {
        addItem.run(id, l.id, l.code, l.name, l.size, l.colour, l.price, l.qty);
        if (l.stock !== null && takeStock.run(l.qty, l.id, l.qty).changes !== 1) {
          throw new HttpError(409, "Neki artikli više nisu dostupni u traženoj količini.", { problems: [{ code: l.code, name: l.name, reason: "zaliha", available: 0 }] });
        }
      }
      return db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    });

    const full = orderWithItems(order);
    catalog.invalidate(); // zalihe su se možda promijenile
    mail.orderEmails(order, full.items);
    webhooks.emit("order.created", { order: orders.payload(order, full.items) }); // npr. knjigovodstvo dobije narudžbu odmah
    sendJson(ctx.res, 201, { number: order.number, subtotal: order.subtotal, shipping: order.shipping, total: order.total, discount: order.discount, payment: order.payment, bank_details: order.payment === "racun" ? s.bank_details.replace("{broj}", order.number) : null });
  });

  /* ---------- Prijava (samo vlasnik) ---------- */
  r.get("/api/auth/me", (ctx) => sendJson(ctx.res, 200, { user: isTeam(ctx.user) ? auth.publicUser(ctx.user) : null }));

  r.post("/api/auth/login", async (ctx) => {
    if (!auth.loginAllowed(ctx.ip)) throw new HttpError(429, "Previše pokušaja. Pokušajte ponovo za 15 minuta.");
    const b = await readJson(ctx.req);
    const u = db.prepare("SELECT * FROM users WHERE email = ?").get(str(b.email).toLowerCase());
    // Isti odgovor i za račun bez pristupa adminu (ne otkrivamo koji emailovi postoje)
    if (!u || !auth.verifyPassword(String(b.password || ""), u.password_hash) || !isTeam(u)) {
      auth.loginFailed(ctx.ip);
      throw new HttpError(401, "Pogrešan email ili lozinka.");
    }
    auth.createSession(ctx.res, u.id);
    sendJson(ctx.res, 200, { user: auth.publicUser(u) });
  });

  r.post("/api/auth/logout", (ctx) => { auth.destroySession(ctx.req, ctx.res); sendJson(ctx.res, 200, { ok: true }); });

  r.post("/api/auth/forgot", async (ctx) => {
    const b = await readJson(ctx.req);
    LIMITS.forgot.check(ctx.ip);
    const u = db.prepare("SELECT * FROM users WHERE email = ?").get(str(b.email).toLowerCase());
    if (isTeam(u)) mail.resetEmail(u, auth.createResetToken(u.id));
    // Isti odgovor bez obzira postoji li račun (ne otkrivamo ko je registrovan)
    sendJson(ctx.res, 200, { ok: true });
  });

  r.post("/api/auth/reset", async (ctx) => {
    const b = await readJson(ctx.req);
    if (String(b.password || "").length < 8) throw new HttpError(400, "Lozinka mora imati najmanje 8 znakova.");
    const row = auth.consumeResetToken(b.token);
    if (row && !isTeam(db.prepare("SELECT role FROM users WHERE id = ?").get(row.user_id))) throw new HttpError(400, "Link je istekao ili je već iskorišten. Zatražite novi.");
    if (!row) throw new HttpError(400, "Link je istekao ili je već iskorišten. Zatražite novi.");
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(auth.hashPassword(String(b.password)), row.user_id);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(row.user_id);
    auth.createSession(ctx.res, row.user_id);
    sendJson(ctx.res, 200, { ok: true });
  });

  r.put("/api/account", async (ctx) => {
    teamRequired(ctx);
    const b = await readJson(ctx.req);
    required(b, ["first_name"]);
    db.prepare("UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?").run(str(b.first_name, 80), str(b.last_name, 80), str(b.phone, 40), ctx.user.id);
    sendJson(ctx.res, 200, { user: auth.publicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(ctx.user.id)) });
  });

  r.put("/api/account/password", async (ctx) => {
    teamRequired(ctx);
    const b = await readJson(ctx.req);
    if (!auth.verifyPassword(String(b.current || ""), ctx.user.password_hash)) throw new HttpError(400, "Trenutna lozinka nije tačna.", { fields: ["current"] });
    if (String(b.next || "").length < 8) throw new HttpError(400, "Nova lozinka mora imati najmanje 8 znakova.", { fields: ["next"] });
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(auth.hashPassword(String(b.next)), ctx.user.id);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(ctx.user.id); // odjava sa svih drugih uređaja
    auth.createSession(ctx.res, ctx.user.id);
    sendJson(ctx.res, 200, { ok: true });
  });

  /* ---------- Kontakt i newsletter ---------- */
  r.post("/api/contact", async (ctx) => {
    const b = await readJson(ctx.req);
    LIMITS.contact.check(ctx.ip);
    required(b, ["name", "email", "body"]);
    const m = { name: str(b.name, 100), email: email(b.email), phone: str(b.phone, 40), subject: str(b.subject, 150), body: str(b.body, 5000) };
    db.prepare("INSERT INTO messages(name, email, phone, subject, body) VALUES (?, ?, ?, ?, ?)").run(m.name, m.email, m.phone, m.subject, m.body);
    mail.contactEmail(m);
    sendJson(ctx.res, 201, { ok: true });
  });

  r.post("/api/newsletter", async (ctx) => {
    const b = await readJson(ctx.req);
    LIMITS.newsletter.check(ctx.ip);
    db.prepare("INSERT OR IGNORE INTO newsletter(email) VALUES (?)").run(email(b.email));
    sendJson(ctx.res, 201, { ok: true });
  });
};
