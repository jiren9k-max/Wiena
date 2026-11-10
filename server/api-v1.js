// Javni API v1 za vanjske sisteme: finansije, knjigovodstvo, ERP / skladište.
// Prijava API ključem: "Authorization: Bearer <ključ>" (ili "X-API-Key: <ključ>").
// Ključeve pravi vlasnik u Admin → API i integracije; dokumentacija je u Admin → API dokumentacija.
const crypto = require("crypto");
const { db, getSettings } = require("./db");
const { HttpError, sendJson, readJson, router, str, num, limiter } = require("./http");
const orders = require("./orders");
const catalog = require("./catalog");
const activity = require("./activity");
const spec = require("./api-spec");

const RATE_LIMIT = Math.max(10, +process.env.API_RATE_LIMIT || 120); // zahtjeva u minuti po ključu
const MAX_PER_PAGE = 200;
const CSV_MAX = 50000;
const TZ = spec.TIMEZONE;
const { r2, iso } = orders;

const fail = (status, code, message) => new HttpError(status, message, { code });
const CODES = { 400: "bad_request", 401: "unauthorized", 403: "forbidden", 404: "not_found", 409: "conflict", 413: "payload_too_large", 415: "unsupported_media_type", 429: "rate_limited" };

/* ---------- API ključevi ---------- */
const hashKey = (k) => crypto.createHash("sha256").update(k).digest("hex");
function generateKey() {
  const key = "wnk_" + crypto.randomBytes(24).toString("base64url");
  return { key, prefix: key.slice(0, 12), hash: hashKey(key) };
}
const normIp = (ip) => String(ip || "").replace(/^::ffff:/, "");
const listOf = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);

/* ---------- Vrijeme ---------- */
// Datumi bez vremena (2026-11-08) računaju se po vremenu shopa (Europe/Sarajevo), a odgovori su uvijek u UTC (…Z).
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const partsFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
function tzOffsetMs(ms) {
  const p = Object.fromEntries(partsFmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
}
// Ponoć lokalnog dana → trenutak u UTC
function localMidnight(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  return guess - tzOffsetMs(guess - tzOffsetMs(guess));
}
const nextDay = (ymd) => { const [y, m, d] = ymd.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10); };
const toDb = (ms) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");
const localDay = (dbTs) => dayFmt.format(new Date(String(dbTs).replace(" ", "T") + "Z"));
const todayLocal = () => dayFmt.format(new Date());
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/;

// Početak perioda (uključivo) ili kraj perioda (isključivo) kao "YYYY-MM-DD HH:MM:SS" u UTC
function timeParam(q, name, end = false) {
  const v = q[name];
  if (v === undefined || v === "") return null;
  const s = String(v).trim();
  let ms = null;
  if (DATE_RE.test(s) && !Number.isNaN(Date.parse(s))) ms = localMidnight(end ? nextDay(s) : s);
  else if (DATETIME_RE.test(s) && !Number.isNaN(Date.parse(s))) ms = Date.parse(s) + (end ? 1000 : 0);
  if (ms === null) throw fail(400, "invalid_parameter", `Parametar "${name}" mora biti datum (2026-11-08) ili vrijeme ISO 8601 (2026-11-08T14:00:00Z).`);
  return toDb(ms);
}

/* ---------- Pomoćnici ---------- */
function paging(q) {
  const page = q.page === undefined ? 1 : parseInt(q.page);
  const per = q.per_page === undefined ? 50 : parseInt(q.per_page);
  if (!(page >= 1)) throw fail(400, "invalid_parameter", 'Parametar "page" mora biti broj od 1 naviše.');
  if (!(per >= 1 && per <= MAX_PER_PAGE)) throw fail(400, "invalid_parameter", `Parametar "per_page" mora biti od 1 do ${MAX_PER_PAGE}.`);
  return { page, per, offset: (page - 1) * per };
}
const pagination = (p, total) => ({ page: p.page, per_page: p.per, total, pages: Math.max(1, Math.ceil(total / p.per)) });

function wantsCsv(q) {
  if (q.format === undefined || q.format === "json") return false;
  if (q.format === "csv") return true;
  throw fail(400, "invalid_parameter", 'Parametar "format" može biti "json" ili "csv".');
}
function boolParam(q, name) {
  const v = q[name];
  if (v === undefined || v === "") return null;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  throw fail(400, "invalid_parameter", `Parametar "${name}" može biti true ili false.`);
}
const like = (s) => `%${String(s).replace(/[%_]/g, "")}%`;

// CSV: UTF-8 sa BOM, odvojeno tačka-zarezom, decimalna tačka (za uvoz u Excel i knjigovodstvene programe)
function sendCsv(res, name, header, rows) {
  const cell = (v) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    let t = String(v);
    if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; // zaštita od formula u Excelu
    return `"${t.replace(/"/g, '""')}"`;
  };
  const body = "﻿" + [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" });
  res.end(body);
}

function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  const host = String(req.headers.host || "localhost").replace(/[^\w.:[\]-]/g, "");
  return `http://${host}`;
}

// Vanjski sistem u dnevniku aktivnosti: "API: <naziv ključa>"
const actor = (ctx) => ({ id: null, first_name: `API: ${ctx.key.name}` });

/* ---------- Prijava i ograničenja ---------- */
const failedAuth = limiter(30, 10 * 60e3); // pogađanje ključeva: najviše 30 neuspjelih pokušaja u 10 min po IP adresi
const windows = new Map();
setInterval(() => { const now = Date.now(); for (const [k, w] of windows) if (w.reset <= now) windows.delete(k); }, 5 * 60e3).unref();

function rateLimit(ctx) {
  const now = Date.now();
  let w = windows.get(ctx.key.id);
  if (!w || w.reset <= now) { w = { count: 0, reset: now + 60e3 }; windows.set(ctx.key.id, w); }
  w.count++;
  const res = ctx.res;
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, RATE_LIMIT - w.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil(w.reset / 1000));
  if (w.count > RATE_LIMIT) {
    res.setHeader("Retry-After", Math.ceil((w.reset - now) / 1000));
    throw fail(429, "rate_limited", `Previše zahtjeva — najviše ${RATE_LIMIT} u minuti. Pokušajte ponovo za ${Math.ceil((w.reset - now) / 1000)} s.`);
  }
}

const auth = (scope) => (ctx) => {
  const h = ctx.req.headers;
  let raw = "";
  const a = String(h.authorization || "");
  if (/^Bearer\s+/i.test(a)) raw = a.replace(/^Bearer\s+/i, "").trim();
  else if (h["x-api-key"]) raw = String(h["x-api-key"]).trim();
  if (!raw) throw fail(401, "missing_key", "Nedostaje API ključ. Pošaljite zaglavlje: Authorization: Bearer <ključ>.");
  const k = raw.length <= 200 ? db.prepare("SELECT * FROM api_keys WHERE key_hash = ?").get(hashKey(raw)) : null;
  if (!k || k.revoked_at) {
    failedAuth.check(normIp(ctx.ip));
    throw fail(401, "invalid_key", "API ključ nije ispravan ili je opozvan.");
  }
  ctx.key = k;
  if (k.expires_at && k.expires_at < todayLocal()) throw fail(401, "key_expired", `API ključ je istekao (${k.expires_at}).`);
  const ips = listOf(k.allowed_ips);
  if (ips.length && !ips.includes(normIp(ctx.ip))) throw fail(403, "ip_not_allowed", `Pristup sa adrese ${normIp(ctx.ip)} nije dozvoljen za ovaj ključ.`);
  rateLimit(ctx);
  db.prepare("UPDATE api_keys SET last_used_at = datetime('now'), last_ip = ?, requests = requests + 1 WHERE id = ?").run(normIp(ctx.ip), k.id);
  if (scope && !listOf(k.scopes).includes(scope)) throw fail(403, "insufficient_scope", `Ovaj ključ nema ovlast "${scope}". Vlasnik je može dodati u Admin → API i integracije.`);
};

/* ---------- Narudžbe ---------- */
function orderFilter(q) {
  const where = [], args = [];
  const from = timeParam(q, "from"), to = timeParam(q, "to", true), since = timeParam(q, "updated_since");
  if (from) { where.push("o.created_at >= ?"); args.push(from); }
  if (to) { where.push("o.created_at < ?"); args.push(to); }
  if (since) { where.push("o.updated_at >= ?"); args.push(since); }
  if (q.status) {
    const st = listOf(q.status);
    const bad = st.filter((s) => !orders.STATUSES.includes(s));
    if (bad.length) throw fail(400, "invalid_parameter", `Nepoznat status: ${bad.join(", ")}. Dozvoljeno: ${orders.STATUSES.join(", ")}.`);
    where.push(`o.status IN (${st.map(() => "?").join(",")})`); args.push(...st);
  }
  if (q.payment) {
    if (!Object.hasOwn(orders.PAYMENT, q.payment)) throw fail(400, "invalid_parameter", `Nepoznat način plaćanja. Dozvoljeno: ${Object.keys(orders.PAYMENT).join(", ")}.`);
    where.push("o.payment = ?"); args.push(q.payment);
  }
  if (q.email) { where.push("o.email = ? COLLATE NOCASE"); args.push(str(q.email, 200)); }
  const sorts = { id: "o.id", "-id": "o.id DESC", updated_at: "o.updated_at, o.id", "-updated_at": "o.updated_at DESC, o.id DESC" };
  if (q.sort !== undefined && !Object.hasOwn(sorts, q.sort)) throw fail(400, "invalid_parameter", `Parametar "sort" može biti: ${Object.keys(sorts).join(", ")}.`);
  return { sql: where.length ? "WHERE " + where.join(" AND ") : "", args, order: sorts[q.sort] || sorts.id };
}

function findOrder(ref) {
  const o = /^\d+$/.test(ref) ? orders.byId(+ref) : db.prepare("SELECT * FROM orders WHERE number = ? COLLATE NOCASE").get(ref);
  if (!o) throw fail(404, "not_found", `Narudžba "${ref}" ne postoji.`);
  return o;
}

/* ---------- Proizvodi ---------- */
const PRODUCT_FROM = `FROM products p JOIN categories c ON c.id = p.category_id`;
const PRODUCT_COLS = `p.*, c.name_bs AS category_name, c.slug AS category_slug`;

function productPayload(p, site) {
  const own = p.images ? JSON.parse(p.images)[0] : null;
  const img = own ? (own.startsWith("/") ? site + own : own) : null;
  let sizes = [];
  try { sizes = JSON.parse(p.sizes || "[]"); } catch { /* bez veličina */ }
  return {
    id: p.id,
    code: p.code,
    name: p.name_bs,
    name_en: p.name_en,
    family: p.family,
    colour: p.colour_bs,
    sizes,
    fibre: p.fibre,
    category: { id: p.category_id, name: p.category_name, slug: p.category_slug },
    price: r2(p.price),
    old_price: p.old_price == null ? null : r2(p.old_price),
    on_sale: p.old_price != null,
    stock: p.stock,
    in_stock: p.stock == null || p.stock > 0,
    active: !!p.active,
    is_new: !!p.is_new,
    url: `${site}/product.html?id=${p.id}`,
    image: img,
    created_at: iso(p.created_at),
    updated_at: iso(p.updated_at),
  };
}
function findProduct(code) {
  const p = db.prepare(`SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} WHERE p.code = ?`).get(code);
  if (!p) throw fail(404, "not_found", `Proizvod sa šifrom "${code}" ne postoji.`);
  return p;
}

/* ---------- Rute ---------- */
const r = router();

r.get("/api/v1/openapi.json", (ctx) => sendJson(ctx.res, 200, spec.openapi(siteUrl(ctx.req)), { "Access-Control-Allow-Origin": "*" }));

r.get("/api/v1", auth(), (ctx) => {
  const k = ctx.key;
  sendJson(ctx.res, 200, { data: {
    api_version: 1,
    shop: getSettings().shop_name,
    key: { name: k.name, prefix: k.prefix, scopes: listOf(k.scopes), expires_at: k.expires_at || null },
    server_time: new Date().toISOString(),
    timezone: TZ,
    currency: "BAM",
    rate_limit_per_minute: RATE_LIMIT,
  } });
});

r.get("/api/v1/orders", auth("orders:read"), (ctx) => {
  const q = ctx.query;
  const f = orderFilter(q);
  if (wantsCsv(q)) {
    const rows = db.prepare(`SELECT o.*, (SELECT coalesce(sum(qty), 0) FROM order_items WHERE order_id = o.id) items FROM orders o ${f.sql} ORDER BY ${f.order} LIMIT ${CSV_MAX}`).all(...f.args);
    return sendCsv(ctx.res, "narudzbe.csv",
      ["number", "created_at", "updated_at", "status", "first_name", "last_name", "email", "phone", "delivery", "address", "city", "zip", "payment", "voucher_code", "items", "subtotal", "discount", "shipping", "total", "currency"],
      rows.map((o) => [o.number, iso(o.created_at), iso(o.updated_at), o.status, o.first_name, o.last_name, o.email, o.phone, o.delivery, o.address, o.city, o.zip, o.payment, o.voucher_code, o.items, r2(o.subtotal), r2(o.discount), r2(o.shipping), r2(o.total), "BAM"]));
  }
  const p = paging(q);
  const total = db.prepare(`SELECT count(*) n FROM orders o ${f.sql}`).get(...f.args).n;
  const rows = db.prepare(`SELECT o.* FROM orders o ${f.sql} ORDER BY ${f.order} LIMIT ? OFFSET ?`).all(...f.args, p.per, p.offset);
  const items = orders.itemsFor(rows.map((o) => o.id));
  sendJson(ctx.res, 200, { data: rows.map((o) => orders.payload(o, items.get(o.id))), pagination: pagination(p, total) });
});

r.get("/api/v1/order-items", auth("orders:read"), (ctx) => {
  const q = ctx.query;
  const f = orderFilter(q);
  const SQL = `FROM order_items oi JOIN orders o ON o.id = oi.order_id ${f.sql}`;
  const COLS = "o.number, o.created_at, o.status, o.payment, oi.code, oi.name, oi.colour, oi.size, oi.qty, oi.price";
  const map = (x) => ({ order_number: x.number, order_created_at: iso(x.created_at), order_status: x.status, payment: x.payment, code: x.code, name: x.name, colour: x.colour || "", size: x.size || "", qty: x.qty, price: r2(x.price), total: r2(x.price * x.qty) });
  if (wantsCsv(q)) {
    const rows = db.prepare(`SELECT ${COLS} ${SQL} ORDER BY ${f.order}, oi.id LIMIT ${CSV_MAX}`).all(...f.args).map(map);
    return sendCsv(ctx.res, "stavke-narudzbi.csv", ["order_number", "order_created_at", "order_status", "payment", "code", "name", "colour", "size", "qty", "price", "total"], rows.map((x) => Object.values(x)));
  }
  const p = paging(q);
  const total = db.prepare(`SELECT count(*) n ${SQL}`).get(...f.args).n;
  const rows = db.prepare(`SELECT ${COLS} ${SQL} ORDER BY ${f.order}, oi.id LIMIT ? OFFSET ?`).all(...f.args, p.per, p.offset);
  sendJson(ctx.res, 200, { data: rows.map(map), pagination: pagination(p, total) });
});

r.get("/api/v1/orders/:ref", auth("orders:read"), (ctx) => {
  sendJson(ctx.res, 200, { data: orders.payload(findOrder(ctx.params.ref)) });
});

r.patch("/api/v1/orders/:ref", auth("orders:write"), async (ctx) => {
  const o = findOrder(ctx.params.ref);
  const b = await readJson(ctx.req);
  const unknown = Object.keys(b).filter((k) => !["status", "notify", "internal_note"].includes(k));
  if (unknown.length) throw fail(400, "invalid_body", `Nepoznata polja: ${unknown.join(", ")}. Dozvoljeno: status, notify, internal_note.`);
  if (b.status === undefined && b.internal_note === undefined) throw fail(400, "invalid_body", 'Pošaljite "status" i/ili "internal_note".');
  if (b.status !== undefined && !orders.STATUSES.includes(b.status)) throw fail(400, "invalid_body", `Nepoznat status. Dozvoljeno: ${orders.STATUSES.join(", ")}.`);
  if (b.notify !== undefined && typeof b.notify !== "boolean") throw fail(400, "invalid_body", '"notify" mora biti true ili false.');
  if (b.internal_note !== undefined && typeof b.internal_note !== "string") throw fail(400, "invalid_body", '"internal_note" mora biti tekst.');
  let adminNote;
  const note = b.internal_note !== undefined ? str(b.internal_note, 1000) : "";
  if (note) {
    // Bilješka se dodaje na postojeću (ne briše ono što je već upisano u adminu)
    const line = `[${todayLocal()} · API: ${ctx.key.name}] ${note}`;
    adminNote = ((o.admin_note ? o.admin_note + "\n" : "") + line).slice(-4000);
  }
  const { order, statusChanged } = orders.update(o, { status: b.status, adminNote, notify: b.notify !== false });
  const target = { type: "order", id: o.id, label: o.number };
  if (statusChanged) activity.log(actor(ctx), "Promijenio status narudžbe", { ...target, details: `${orders.STATUS[o.status]} → ${orders.STATUS[order.status]}${b.notify === false ? " (bez emaila kupcu)" : ""}` });
  if (note) activity.log(actor(ctx), "Dodao internu bilješku", { ...target, details: note.slice(0, 200) });
  sendJson(ctx.res, 200, { data: orders.payload(order) });
});

r.get("/api/v1/products", auth("products:read"), (ctx) => {
  const q = ctx.query;
  const where = [], args = [];
  if (q.q) { where.push("(p.name_bs LIKE ? OR p.name_en LIKE ? OR p.code LIKE ?)"); args.push(like(q.q), like(q.q), like(q.q)); }
  if (q.code) {
    const codes = listOf(q.code).slice(0, 200);
    where.push(`p.code IN (${codes.map(() => "?").join(",")})`); args.push(...codes);
  }
  const since = timeParam(q, "updated_since");
  if (since) { where.push("p.updated_at >= ?"); args.push(since); }
  const active = boolParam(q, "active");
  if (active !== null) { where.push("p.active = ?"); args.push(active ? 1 : 0); }
  const sale = boolParam(q, "on_sale");
  if (sale !== null) where.push(sale ? "p.old_price IS NOT NULL" : "p.old_price IS NULL");
  if (q.category) { where.push("(p.category_id = ? OR c.slug = ?)"); args.push(parseInt(q.category) || 0, String(q.category)); }
  const sql = `${PRODUCT_FROM} ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  const site = siteUrl(ctx.req);
  if (wantsCsv(q)) {
    const rows = db.prepare(`SELECT ${PRODUCT_COLS} ${sql} ORDER BY p.id LIMIT ${CSV_MAX}`).all(...args).map((p) => productPayload(p, site));
    return sendCsv(ctx.res, "proizvodi.csv", ["code", "name", "colour", "sizes", "category", "fibre", "price", "old_price", "stock", "active", "is_new", "updated_at", "url"],
      rows.map((p) => [p.code, p.name, p.colour, p.sizes.join(" / "), p.category.name, p.fibre, p.price, p.old_price, p.stock, p.active, p.is_new, p.updated_at, p.url]));
  }
  const p = paging(q);
  const total = db.prepare(`SELECT count(*) n ${sql}`).get(...args).n;
  const rows = db.prepare(`SELECT ${PRODUCT_COLS} ${sql} ORDER BY p.id LIMIT ? OFFSET ?`).all(...args, p.per, p.offset);
  sendJson(ctx.res, 200, { data: rows.map((x) => productPayload(x, site)), pagination: pagination(p, total) });
});

r.get("/api/v1/products/:code", auth("products:read"), (ctx) => {
  sendJson(ctx.res, 200, { data: productPayload(findProduct(ctx.params.code), siteUrl(ctx.req)) });
});

r.patch("/api/v1/products/:code", auth("products:write"), async (ctx) => {
  const p = findProduct(ctx.params.code);
  const b = await readJson(ctx.req);
  const FIELDS = ["price", "old_price", "stock", "active"];
  const unknown = Object.keys(b).filter((k) => !FIELDS.includes(k));
  if (unknown.length) throw fail(400, "invalid_body", `Nepoznata polja: ${unknown.join(", ")}. Dozvoljeno: ${FIELDS.join(", ")}.`);
  if (!Object.keys(b).length) throw fail(400, "invalid_body", `Pošaljite bar jedno polje: ${FIELDS.join(", ")}.`);
  const has = (k) => Object.hasOwn(b, k);
  const number = (k, opts) => { try { return num(b[k], opts); } catch { throw fail(400, "invalid_body", `"${k}" nije ispravan broj.`); } };
  const price = has("price") ? number("price", { min: 0, max: 1e6 }) : p.price;
  let old = has("old_price") ? number("old_price", { min: 0, max: 1e6, allowNull: true }) : p.old_price;
  // Nova cijena jednaka ili veća od stare: proizvod više nije na akciji
  if (has("price") && !has("old_price") && old != null && price >= old) old = null;
  if (old != null && old <= price) throw fail(400, "invalid_body", '"old_price" mora biti veća od "price" (ili null za proizvod koji nije na akciji).');
  let stock = p.stock;
  if (has("stock")) {
    stock = b.stock === null ? null : number("stock", { min: 0, max: 1e6 });
    if (stock !== null && !Number.isInteger(stock)) throw fail(400, "invalid_body", '"stock" mora biti cijeli broj (ili null = zaliha se ne prati).');
  }
  if (has("active") && typeof b.active !== "boolean") throw fail(400, "invalid_body", '"active" mora biti true ili false.');
  const active = has("active") ? (b.active ? 1 : 0) : p.active;
  db.prepare("UPDATE products SET price = ?, old_price = ?, stock = ?, active = ?, updated_at = datetime('now') WHERE id = ?").run(price, old, stock, active, p.id);
  catalog.invalidate();
  const changes = activity.productChanges(p, { ...p, price, old_price: old, stock, active });
  if (changes) activity.log(actor(ctx), "Izmijenio proizvod", { type: "product", id: p.id, label: p.name_bs, details: changes });
  sendJson(ctx.res, 200, { data: productPayload(findProduct(p.code), siteUrl(ctx.req)) });
});

// Kupci = svi koji su naručili (shop nema korisničke račune), grupisano po emailu
r.get("/api/v1/customers", auth("customers:read"), (ctx) => {
  const q = ctx.query;
  const { sql, args } = orders.buyers({ q: q.q, since: timeParam(q, "first_order_since") });
  const map = (b) => ({
    email: b.email, first_name: b.first_name || "", last_name: b.last_name || "", phone: b.phone || "",
    address: b.address || "", city: b.city || "", zip: b.zip || "",
    orders_count: b.orders, total_spent: r2(b.spent), first_order_at: iso(b.first_at), last_order_at: iso(b.last_at),
  });
  if (wantsCsv(q)) {
    const rows = db.prepare(`${sql} ORDER BY first_at LIMIT ${CSV_MAX}`).all(...args).map(map);
    return sendCsv(ctx.res, "kupci.csv", ["email", "first_name", "last_name", "phone", "address", "city", "zip", "orders_count", "total_spent", "first_order_at", "last_order_at"], rows.map((u) => Object.values(u)));
  }
  const p = paging(q);
  const total = db.prepare(`SELECT count(*) n FROM (${sql})`).get(...args).n;
  const rows = db.prepare(`${sql} ORDER BY first_at LIMIT ? OFFSET ?`).all(...args, p.per, p.offset);
  sendJson(ctx.res, 200, { data: rows.map(map), pagination: pagination(p, total) });
});

// Period izvještaja: zadano zadnjih 30 dana (uključujući danas)
function reportRange(q) {
  const toDay = q.to ? String(q.to) : todayLocal();
  const fromDay = q.from ? String(q.from) : (() => { const [y, m, d] = toDay.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d - 29)).toISOString().slice(0, 10); })();
  for (const [k, v] of [["from", fromDay], ["to", toDay]]) if (!DATE_RE.test(v) || Number.isNaN(Date.parse(v))) throw fail(400, "invalid_parameter", `Parametar "${k}" mora biti datum u obliku 2026-11-08.`);
  if (fromDay > toDay) throw fail(400, "invalid_parameter", '"from" mora biti prije "to".');
  if (Date.parse(toDay) - Date.parse(fromDay) > 3 * 366 * 864e5) throw fail(400, "invalid_parameter", "Period izvještaja može biti najviše 3 godine.");
  return { fromDay, toDay, from: toDb(localMidnight(fromDay)), to: toDb(localMidnight(nextDay(toDay))) };
}

r.get("/api/v1/reports/sales", auth("reports:read"), (ctx) => {
  const q = ctx.query;
  const range = reportRange(q);
  const groupBy = q.group_by || "day";
  if (!["day", "month"].includes(groupBy)) throw fail(400, "invalid_parameter", 'Parametar "group_by" može biti "day" ili "month".');
  const rows = db.prepare(`SELECT o.id, o.status, o.payment, o.delivery, o.subtotal, o.discount, o.shipping, o.total, o.created_at,
    (SELECT coalesce(sum(qty), 0) FROM order_items WHERE order_id = o.id) items FROM orders o WHERE o.created_at >= ? AND o.created_at < ?`).all(range.from, range.to);

  const blank = () => ({ orders: 0, items: 0, subtotal: 0, discount: 0, shipping: 0, total: 0 });
  const add = (acc, o) => { acc.orders++; acc.items += o.items; acc.subtotal += o.subtotal || 0; acc.discount += o.discount || 0; acc.shipping += o.shipping || 0; acc.total += o.total || 0; };
  const round = (acc) => ({ ...acc, subtotal: r2(acc.subtotal), discount: r2(acc.discount), shipping: r2(acc.shipping), total: r2(acc.total) });
  const totals = blank(), cancelled = blank(), byStatus = {}, byPayment = {}, byDelivery = {}, periods = new Map();
  // Svi dani/mjeseci u periodu, i oni bez prodaje (lakše za grafikone i tabele)
  for (let d = range.fromDay; d <= range.toDay; d = nextDay(d)) { const k = groupBy === "month" ? d.slice(0, 7) : d; if (!periods.has(k)) periods.set(k, blank()); }
  for (const o of rows) {
    (byStatus[o.status] ??= { orders: 0, total: 0 }).orders++;
    byStatus[o.status].total += o.total || 0;
    if (o.status === "otkazana") { add(cancelled, o); continue; }
    add(totals, o);
    add((byPayment[o.payment] ??= blank()), o);
    add((byDelivery[o.delivery] ??= blank()), o);
    const day = localDay(o.created_at);
    add(periods.get(groupBy === "month" ? day.slice(0, 7) : day), o);
  }
  const mapObj = (obj, f) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, f(v)]));
  sendJson(ctx.res, 200, { data: {
    from: range.fromDay, to: range.toDay, timezone: TZ, currency: "BAM", group_by: groupBy,
    note: "Otkazane narudžbe nisu uključene u prihod (vidi 'cancelled').",
    totals: { ...round(totals), average_order: totals.orders ? r2(totals.total / totals.orders) : 0 },
    cancelled: round(cancelled),
    by_status: mapObj(byStatus, (v) => ({ ...v, total: r2(v.total) })),
    by_payment: mapObj(byPayment, round),
    by_delivery: mapObj(byDelivery, round),
    periods: [...periods].map(([period, v]) => ({ period, ...round(v) })),
  } });
});

r.get("/api/v1/reports/products", auth("reports:read"), (ctx) => {
  const q = ctx.query;
  const range = reportRange(q);
  const limit = q.limit === undefined ? 50 : parseInt(q.limit);
  if (!(limit >= 1 && limit <= 1000)) throw fail(400, "invalid_parameter", 'Parametar "limit" mora biti od 1 do 1000.');
  const rows = db.prepare(`SELECT oi.code, max(oi.name) name, sum(oi.qty) qty, sum(oi.qty * oi.price) revenue, count(DISTINCT o.id) orders
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'otkazana' AND o.created_at >= ? AND o.created_at < ?
    GROUP BY oi.code ORDER BY revenue DESC LIMIT ?`).all(range.from, range.to, limit);
  sendJson(ctx.res, 200, { data: {
    from: range.fromDay, to: range.toDay, timezone: TZ, currency: "BAM",
    products: rows.map((x) => ({ ...x, revenue: r2(x.revenue) })),
  } });
});

/* ---------- Obrada zahtjeva ---------- */
const logRequest = db.prepare("INSERT INTO api_requests(key_id, key_name, method, path, status, ms, ip) VALUES (?, ?, ?, ?, ?, ?, ?)");
// Ključ poslan greškom u adresi (?api_key=…) ne smije završiti u dnevniku
function safePath(url) {
  const u = new URL(url.href);
  for (const k of [...u.searchParams.keys()]) if (/key|token|secret|password/i.test(k)) u.searchParams.set(k, "***");
  return (u.pathname + u.search).slice(0, 300);
}

async function handle(req, res, url, ip) {
  const started = Date.now();
  const ctx = { req, res, ip, params: {}, query: Object.fromEntries(url.searchParams), key: null };
  res.setHeader("X-API-Version", "1");
  try {
    const m = r.match(req.method, url.pathname);
    if (!m) {
      const exists = ["GET", "POST", "PUT", "PATCH", "DELETE"].some((x) => x !== req.method && r.match(x, url.pathname));
      throw exists ? fail(405, "method_not_allowed", `Metoda ${req.method} nije dozvoljena za ovu adresu.`)
        : fail(404, "not_found", "Nepostojeća adresa. Spisak adresa je u dokumentaciji (Admin → API dokumentacija).");
    }
    ctx.params = m.params;
    for (const h of m.handlers) await h(ctx);
  } catch (e) {
    if (!(e instanceof HttpError)) console.error("[api]", e);
    if (!res.headersSent) {
      const status = e instanceof HttpError ? e.status : 500;
      const code = e.extra?.code || CODES[status] || "server_error";
      sendJson(res, status, { error: { code, message: e instanceof HttpError ? e.message : "Greška na serveru. Pokušajte ponovo." } });
    }
  } finally {
    if (url.pathname !== "/api/v1/openapi.json") {
      try {
        logRequest.run(ctx.key?.id ?? null, ctx.key?.name ?? null, req.method, safePath(url), res.statusCode, Date.now() - started, normIp(ip));
      } catch (e) { console.error("[api log]", e.message); }
    }
  }
}

function start() {
  const prune = () => db.prepare("DELETE FROM api_requests WHERE created_at < datetime('now', '-30 days')").run();
  prune();
  setInterval(prune, 24 * 3600e3).unref();
}

module.exports = { handle, start, generateKey, hashKey, normIp, listOf, RATE_LIMIT };
