// Admin API — samo vlasnik (owner). WIENA nema uloge zaposlenika.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { db, getSettings, tx, DATA_DIR } = require("./db");
const catalog = require("./catalog");
const mail = require("./mail");
const activity = require("./activity");
const backup = require("./backup");
const orders = require("./orders");
const auth = require("./auth");
const { HttpError, sendJson, readJson, readBody, str, required, email, num } = require("./http");

const UPLOADS = path.join(DATA_DIR, "uploads");
fs.mkdirSync(UPLOADS, { recursive: true });
const STATUSES = Object.keys(mail.STATUS);
const PER_PAGE = 50;

const page = (q) => Math.max(1, parseInt(q.page) || 1);
const like = (s) => `%${String(s).replace(/[%_]/g, "")}%`;
const csvCell = (v) => {
  let t = String(v ?? "");
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(t)) t = "'" + t; // zaštita od formula u Excelu
  return `"${t.replace(/"/g, '""')}"`;
};
const pick = (obj, key) => (Object.hasOwn(obj, key) ? obj[key] : undefined);
function sendCsv(res, name, header, rows) {
  const body = "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n");
  res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` });
  res.end(body);
}

function staffOnly(ctx) {
  if (!ctx.user) throw new HttpError(401, "Prijavite se.");
  if (!activity.isStaff(ctx.user)) throw new HttpError(403, "Nemate pristup.");
}
function ownerOnly(ctx) {
  staffOnly(ctx);
  if (!activity.isOwner(ctx.user)) throw new HttpError(403, "Ovu radnju može uraditi samo vlasnik.");
}

function productRow(id) {
  const p = db.prepare(`SELECT p.*, c.name_bs AS category_name FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ?`).get(id);
  if (!p) throw new HttpError(404, "Proizvod nije pronađen.");
  const J = (s, d) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };
  const variants = db.prepare("SELECT id, code, colour_bs, swatch, active, stock FROM products WHERE family = ? ORDER BY sort, id").all(p.family);
  return { ...p, images: J(p.images, []), sizes: J(p.sizes, []), details_bs: J(p.details_bs, []), details_en: J(p.details_en, []), art: J(p.art, null), variants };
}

const BADGES = ["", "New", "Bestseller", "Limited", "Sale"];
const slugify = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const lines = (v, max = 12) => (Array.isArray(v) ? v : String(v ?? "").split(/\r?\n/)).map((x) => str(x, 200)).filter(Boolean).slice(0, max);

function productInput(b) {
  required(b, ["code", "name_bs", "category_id", "price"]);
  const price = num(b.price, { min: 0, max: 1e6 });
  const old = num(b.old_price, { min: 0, max: 1e6, allowNull: true });
  if (old !== null && old <= price) throw new HttpError(400, "Stara cijena mora biti veća od nove (ili ostavite prazno).", { fields: ["old_price"] });
  const priceEur = num(b.price_eur, { min: 0, max: 1e6, allowNull: true });
  const oldEur = num(b.old_price_eur, { min: 0, max: 1e6, allowNull: true });
  const cat = db.prepare("SELECT id FROM categories WHERE id = ?").get(+b.category_id);
  if (!cat) throw new HttpError(400, "Odaberite kategoriju.", { fields: ["category_id"] });
  // Samo vlastite slike (/uploads/ime.jpg) ili čisti https linkovi — bez navodnika i razmaka koji bi mogli ubaciti kod u stranicu
  const SAFE_IMG = /^(\/uploads\/[\w.-]+|https:\/\/[^\s"'<>`\\]+)$/;
  const images = Array.isArray(b.images) ? b.images.map((u) => str(u, 400)).filter((u) => SAFE_IMG.test(u)).slice(0, 12) : [];
  const sizes = lines(b.sizes, 12);
  const swatch = /^#[0-9a-f]{6}$/i.test(str(b.swatch)) ? str(b.swatch) : "#d6c6a9";
  const name = str(b.name_bs, 200);
  return {
    code: str(b.code, 40), name_bs: name, name_en: str(b.name_en, 200),
    family: slugify(str(b.family, 120) || str(b.name_en, 200) || name) || slugify(str(b.code, 40)),
    category_id: +b.category_id,
    desc_bs: str(b.desc_bs, 5000), desc_en: str(b.desc_en, 5000),
    colour_bs: str(b.colour_bs, 80), colour_en: str(b.colour_en, 80), colour_key: str(b.colour_key, 40) || str(b.colour_en, 40) || str(b.colour_bs, 40),
    swatch, fibre: str(b.fibre, 40), material_bs: str(b.material_bs, 200), material_en: str(b.material_en, 200),
    details_bs: JSON.stringify(lines(b.details_bs)), details_en: JSON.stringify(lines(b.details_en)),
    care_bs: str(b.care_bs, 1000), care_en: str(b.care_en, 1000),
    sizes: JSON.stringify(sizes.length ? sizes : ["One size"]),
    price, old_price: old, price_eur: priceEur, old_price_eur: old === null ? null : oldEur,
    stock: b.stock === null || b.stock === "" || b.stock === undefined ? null : Math.floor(num(b.stock, { min: 0, max: 1e6 })),
    badge: BADGES.includes(b.badge) ? b.badge : "",
    is_new: b.is_new ? 1 : 0, active: b.active === false || b.active === 0 ? 0 : 1,
    images: JSON.stringify(images),
  };
}
const PRODUCT_FIELDS = ["code", "name_bs", "name_en", "family", "category_id", "desc_bs", "desc_en", "colour_bs", "colour_en", "colour_key", "swatch", "fibre",
  "material_bs", "material_en", "details_bs", "details_en", "care_bs", "care_en", "sizes", "price", "old_price", "price_eur", "old_price_eur", "stock", "badge", "is_new", "active", "images"];

module.exports = function adminRoutes(r) {
  const A = (fn) => async (ctx) => { staffOnly(ctx); return fn(ctx); }; // prijavljeni vlasnik
  const O = (fn) => async (ctx) => { ownerOnly(ctx); return fn(ctx); }; // samo vlasnik
  const log = (ctx, action, target) => activity.log(ctx.user, action, target);

  /* ---------- Pregled ---------- */
  r.get("/api/admin/stats", A((ctx) => {
    const one = (sql, ...a) => db.prepare(sql).get(...a);
    const days = db.prepare(`SELECT date(created_at) d, count(*) n, sum(total) t FROM orders
      WHERE status != 'otkazana' AND created_at >= datetime('now', '-13 days') GROUP BY d`).all();
    sendJson(ctx.res, 200, {
      today: one("SELECT count(*) n, coalesce(sum(total),0) t FROM orders WHERE status != 'otkazana' AND date(created_at) = date('now')"),
      month: one("SELECT count(*) n, coalesce(sum(total),0) t FROM orders WHERE status != 'otkazana' AND created_at >= datetime('now','-30 days')"),
      pending: one("SELECT count(*) n FROM orders WHERE status = 'nova'").n,
      unread: one("SELECT count(*) n FROM messages WHERE is_read = 0").n,
      products: one("SELECT count(*) n, sum(active) a, sum(stock = 0) out_of_stock, sum(stock > 0 AND stock <= 3) low FROM products"),
      customers: one("SELECT count(DISTINCT lower(email)) n FROM orders").n, // kupci = svi koji su naručili
      subscribers: one("SELECT count(*) n FROM newsletter").n,
      days,
      recent: db.prepare("SELECT id, number, first_name, last_name, total, status, created_at FROM orders ORDER BY id DESC LIMIT 8").all(),
      top: db.prepare(`SELECT oi.code, oi.name, max(oi.colour) colour, max(oi.product_id) pid, sum(oi.qty) qty, sum(oi.qty * oi.price) revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE o.status != 'otkazana' AND o.created_at >= datetime('now','-30 days') GROUP BY oi.code ORDER BY qty DESC LIMIT 6`).all(),
    });
  }));

  /* ---------- Narudžbe ---------- */
  function orderQuery(q) {
    const where = [], args = [];
    if (STATUSES.includes(q.status)) { where.push("status = ?"); args.push(q.status); }
    if (q.q) { where.push("(number LIKE ? OR first_name || ' ' || last_name LIKE ? OR email LIKE ? OR phone LIKE ?)"); args.push(...Array(4).fill(like(q.q))); }
    return { sql: where.length ? "WHERE " + where.join(" AND ") : "", args };
  }
  r.get("/api/admin/orders", A((ctx) => {
    const { sql, args } = orderQuery(ctx.query);
    const total = db.prepare(`SELECT count(*) n FROM orders ${sql}`).get(...args).n;
    const rows = db.prepare(`SELECT o.*, (SELECT sum(qty) FROM order_items WHERE order_id = o.id) items FROM orders o ${sql} ORDER BY id DESC LIMIT ? OFFSET ?`)
      .all(...args, PER_PAGE, (page(ctx.query) - 1) * PER_PAGE);
    const counts = Object.fromEntries(db.prepare("SELECT status, count(*) n FROM orders GROUP BY status").all().map((x) => [x.status, x.n]));
    sendJson(ctx.res, 200, { rows, total, perPage: PER_PAGE, counts });
  }));
  r.get("/api/admin/orders.csv", A((ctx) => {
    const { sql, args } = orderQuery(ctx.query);
    const rows = db.prepare(`SELECT * FROM orders ${sql} ORDER BY id DESC`).all(...args);
    sendCsv(ctx.res, "narudzbe.csv", ["Broj", "Datum", "Status", "Ime", "Prezime", "Email", "Telefon", "Dostava", "Adresa", "Grad", "Poštanski", "Plaćanje", "Međuzbir", "Vaučer", "Popust KM", "Dostava KM", "Ukupno"],
      rows.map((o) => [o.number, o.created_at, mail.STATUS[o.status], o.first_name, o.last_name, o.email, o.phone, o.delivery, o.address, o.city, o.zip, o.payment, o.subtotal, o.voucher_code || "", o.discount || 0, o.shipping, o.total]));
  }));
  r.get("/api/admin/orders/:id", A((ctx) => {
    const o = db.prepare("SELECT * FROM orders WHERE id = ?").get(+ctx.params.id);
    if (!o) throw new HttpError(404, "Narudžba nije pronađena.");
    o.items = db.prepare(`SELECT oi.*, p.id AS pid, p.stock, p.swatch, json_extract(p.images, '$[0]') AS image FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE order_id = ?`).all(o.id);
    o.customer_orders = db.prepare("SELECT count(*) n FROM orders WHERE email = ?").get(o.email).n;
    sendJson(ctx.res, 200, o);
  }));
  r.patch("/api/admin/orders/:id", A(async (ctx) => {
    const b = await readJson(ctx.req);
    const o = db.prepare("SELECT * FROM orders WHERE id = ?").get(+ctx.params.id);
    if (!o) throw new HttpError(404, "Narudžba nije pronađena.");
    // Zaliha, vaučer, email kupcu i webhookovi — ista logika kao kad status mijenja API (server/orders.js)
    const { order: updated } = orders.update(o, {
      status: b.status,
      adminNote: b.admin_note !== undefined ? str(b.admin_note, 4000) : undefined,
      notify: b.notify !== false,
    });
    const status = updated.status;
    const target = { type: "order", id: o.id, label: o.number };
    if (status !== o.status) log(ctx, "Promijenio status narudžbe", { ...target, details: `${mail.STATUS[o.status]} → ${mail.STATUS[status]}${b.notify === false ? " (bez emaila kupcu)" : ""}` });
    if ((updated.admin_note || "") !== (o.admin_note || "")) log(ctx, "Izmijenio internu bilješku", target);
    sendJson(ctx.res, 200, updated);
  }));

  /* ---------- Proizvodi ---------- */
  r.get("/api/admin/products", A((ctx) => {
    const q = ctx.query, where = [], args = [];
    if (q.q) { where.push("(p.name_bs LIKE ? OR p.name_en LIKE ? OR p.code LIKE ? OR p.colour_bs LIKE ?)"); args.push(like(q.q), like(q.q), like(q.q), like(q.q)); }
    if (q.cat) { where.push("p.category_id = ?"); args.push(+q.cat); }
    if (q.fibre) { where.push("p.fibre = ?"); args.push(String(q.fibre)); }
    const filters = { sale: "p.old_price IS NOT NULL", hidden: "p.active = 0", nostock: "p.stock = 0", low: "p.stock > 0 AND p.stock <= 3", tracked: "p.stock IS NOT NULL", new: "p.is_new = 1", nodesc: "(p.desc_bs IS NULL OR p.desc_bs = '')", noen: "(p.name_en = '' OR p.desc_en = '')" };
    if (pick(filters, q.filter)) where.push(filters[q.filter]);
    const FROM = "FROM products p JOIN categories c ON c.id = p.category_id";
    // Brojevi za kartice "Svi / Prikazani / Sakriveni" (uz trenutnu pretragu i filtere)
    const cnt = db.prepare(`SELECT count(*) n, coalesce(sum(p.active), 0) visible ${FROM} ${where.length ? "WHERE " + where.join(" AND ") : ""}`).get(...args);
    const counts = { all: cnt.n, visible: cnt.visible, hidden: cnt.n - cnt.visible };
    if (q.vis === "visible") where.push("p.active = 1");
    if (q.vis === "hidden") where.push("p.active = 0");
    const sql = `${FROM} ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
    const sorts = { name: "p.name_bs", price: "p.price", "-price": "p.price DESC", stock: "p.stock IS NULL, p.stock", updated: "p.updated_at DESC", default: "p.sort, p.id" };
    const total = db.prepare(`SELECT count(*) n ${sql}`).get(...args).n;
    const rows = db.prepare(`SELECT p.id, p.code, p.name_bs, p.colour_bs, p.swatch, p.price, p.old_price, p.stock, p.active, p.is_new, p.badge, p.images, p.sizes, c.name_bs AS category_name ${sql}
      ORDER BY ${pick(sorts, q.sort) || sorts.default} LIMIT ? OFFSET ?`).all(...args, PER_PAGE, (page(q) - 1) * PER_PAGE);
    const J = (s) => { try { return JSON.parse(s || "[]"); } catch { return []; } };
    sendJson(ctx.res, 200, { rows: rows.map((p) => ({ ...p, images: J(p.images), sizes: J(p.sizes) })), total, perPage: PER_PAGE, counts });
  }));
  r.get("/api/admin/products/:id", A((ctx) => sendJson(ctx.res, 200, productRow(+ctx.params.id))));
  // Prijedlozi za formu: porodice (isti model u više boja), vlakna, veličine
  r.get("/api/admin/product-options", A((ctx) => {
    sendJson(ctx.res, 200, {
      families: db.prepare("SELECT family, max(name_bs) name, count(*) n FROM products GROUP BY family ORDER BY name COLLATE NOCASE").all(),
      fibres: db.prepare("SELECT fibre, count(*) n FROM products WHERE fibre != '' GROUP BY fibre ORDER BY n DESC").all().map((x) => x.fibre),
      nextCode: "WN-" + String((db.prepare("SELECT max(CAST(substr(code, 4) AS INTEGER)) m FROM products WHERE code LIKE 'WN-%'").get().m || 0) + 1).padStart(3, "0"),
    });
  }));
  r.post("/api/admin/products", A(async (ctx) => {
    const p = productInput(await readJson(ctx.req));
    if (db.prepare("SELECT 1 FROM products WHERE code = ?").get(p.code)) throw new HttpError(409, "Proizvod sa ovom šifrom već postoji.", { fields: ["code"] });
    p.slug = slugify(`${p.name_en || p.name_bs}-${p.colour_en || p.colour_bs}`);
    // Novi proizvod nasljeđuje podatke za crtež (rezervna slika) od iste porodice, ako postoji
    const famArt = db.prepare("SELECT art FROM products WHERE family = ? AND art IS NOT NULL LIMIT 1").get(p.family);
    const art = famArt ? JSON.parse(famArt.art) : { kind: "linen", shape: "stack", opts: {} };
    art.base = p.swatch; art.accent = null;
    const cols = [...PRODUCT_FIELDS, "slug", "art"];
    const res = db.prepare(`INSERT INTO products(${cols.join(", ")}, sort) VALUES (${cols.map(() => "?").join(", ")}, (SELECT coalesce(min(sort), 0) - 1 FROM products))`)
      .run(...PRODUCT_FIELDS.map((k) => p[k]), p.slug, JSON.stringify(art));
    catalog.invalidate();
    const created = productRow(Number(res.lastInsertRowid));
    log(ctx, "Dodao novi proizvod", { type: "product", id: created.id, label: created.name_bs, details: `${p.code} · ${p.colour_bs} · ${activity.km(p.price)}` });
    sendJson(ctx.res, 201, created);
  }));
  r.put("/api/admin/products/:id", A(async (ctx) => {
    const id = +ctx.params.id;
    const before = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!before) throw new HttpError(404, "Proizvod nije pronađen.");
    const p = productInput(await readJson(ctx.req));
    if (db.prepare("SELECT 1 FROM products WHERE code = ? AND id != ?").get(p.code, id)) throw new HttpError(409, "Druga stavka već koristi ovu šifru.", { fields: ["code"] });
    // Boja kružića se koristi i za nacrtanu sliku kad nema fotografije
    let art = null;
    try { art = JSON.parse(before.art || "null"); } catch { /* nema */ }
    if (art && before.swatch !== p.swatch) { if (art.base === before.swatch) art.base = p.swatch; else art.accent = p.swatch; }
    db.prepare(`UPDATE products SET ${PRODUCT_FIELDS.map((k) => k + " = ?").join(", ")}, art = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(...PRODUCT_FIELDS.map((k) => p[k]), art ? JSON.stringify(art) : before.art, id);
    catalog.invalidate();
    const changes = activity.productChanges(before, p);
    if (changes) log(ctx, "Izmijenio proizvod", { type: "product", id, label: p.name_bs, details: changes });
    sendJson(ctx.res, 200, productRow(id));
  }));
  // Nova boja istog modela: kopija proizvoda sa novom šifrom, bez slika (dodaju se u formi)
  r.post("/api/admin/products/:id/duplicate", A((ctx) => {
    const src = db.prepare("SELECT * FROM products WHERE id = ?").get(+ctx.params.id);
    if (!src) throw new HttpError(404, "Proizvod nije pronađen.");
    const m = db.prepare("SELECT max(CAST(substr(code, 4) AS INTEGER)) m FROM products WHERE code LIKE 'WN-%'").get().m || 0;
    const code = "WN-" + String(m + 1).padStart(3, "0");
    const skip = new Set(["id", "code", "created_at", "updated_at", "images", "active", "colour_bs", "colour_en", "colour_key", "slug", "sort", "reviews", "rating"]);
    const cols = Object.keys(src).filter((k) => !skip.has(k));
    const res = db.prepare(`INSERT INTO products(${cols.join(", ")}, code, images, active, colour_bs, colour_en, colour_key, slug, sort, rating, reviews)
      VALUES (${cols.map(() => "?").join(", ")}, ?, '[]', 0, 'Nova boja', 'New colour', '', '', ?, 5, 0)`).run(...cols.map((k) => src[k]), code, src.sort);
    catalog.invalidate();
    const id = Number(res.lastInsertRowid);
    log(ctx, "Dodao novu boju proizvoda", { type: "product", id, label: src.name_bs, details: `${code} (kopija od ${src.code}, sakriven dok se ne dovrši)` });
    sendJson(ctx.res, 201, { id });
  }));
  // Brisanje proizvoda (umjesto brisanja proizvod se može i samo sakriti)
  r.delete("/api/admin/products/:id", O((ctx) => {
    const p = db.prepare("SELECT id, code, name_bs FROM products WHERE id = ?").get(+ctx.params.id);
    db.prepare("DELETE FROM products WHERE id = ?").run(+ctx.params.id);
    catalog.invalidate();
    if (p) log(ctx, "Obrisao proizvod", { type: "product", id: p.id, label: p.name_bs, details: p.code });
    sendJson(ctx.res, 200, { ok: true });
  }));
  r.post("/api/admin/products/bulk", A(async (ctx) => {
    const b = await readJson(ctx.req);
    const ids = (Array.isArray(b.ids) ? b.ids : []).map(Number).filter(Number.isInteger).slice(0, 1000);
    if (!ids.length) throw new HttpError(400, "Niste odabrali proizvode.");
    if (b.action === "delete") ownerOnly(ctx);
    const names = db.prepare(`SELECT id, name_bs AS name, colour_bs FROM products WHERE id IN (${ids.map(() => "?").join(",")})`).all(...ids);
    const marks = ids.map(() => "?").join(",");
    const run = (sql, ...a) => db.prepare(sql.replace("{ids}", marks)).run(...a, ...ids);
    tx(() => {
      switch (b.action) {
        case "activate": run("UPDATE products SET active = 1, updated_at = datetime('now') WHERE id IN ({ids})"); break;
        case "deactivate": run("UPDATE products SET active = 0, updated_at = datetime('now') WHERE id IN ({ids})"); break;
        case "new-on": run("UPDATE products SET is_new = 1 WHERE id IN ({ids})"); break;
        case "new-off": run("UPDATE products SET is_new = 0 WHERE id IN ({ids})"); break;
        case "discount": {
          const pct = num(b.value, { min: 1, max: 90 });
          // Popust se računa od redovne (stare) cijene, pa ponovljeni popust ne "gomila" sniženja. KM se zaokružuje na 5, € na cijeli broj.
          run(`UPDATE products SET old_price = coalesce(old_price, price), price = max(5, round(coalesce(old_price, price) * (100 - ?) / 100 / 5) * 5),
            old_price_eur = CASE WHEN price_eur IS NULL THEN NULL ELSE coalesce(old_price_eur, price_eur) END,
            price_eur = CASE WHEN price_eur IS NULL THEN NULL ELSE max(1, round(coalesce(old_price_eur, price_eur) * (100 - ?) / 100)) END,
            updated_at = datetime('now') WHERE id IN ({ids})`, pct, pct);
          break;
        }
        case "clear-discount": run(`UPDATE products SET price = coalesce(old_price, price), old_price = NULL,
          price_eur = coalesce(old_price_eur, price_eur), old_price_eur = NULL, updated_at = datetime('now') WHERE id IN ({ids})`); break;
        case "stock": run("UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id IN ({ids})", b.value === null || b.value === "" ? null : Math.floor(num(b.value, { min: 0, max: 1e6 }))); break;
        case "move": {
          if (!db.prepare("SELECT 1 FROM categories WHERE id = ?").get(+b.value)) throw new HttpError(400, "Odaberite kategoriju.");
          run("UPDATE products SET category_id = ?, updated_at = datetime('now') WHERE id IN ({ids})", +b.value);
          break;
        }
        case "delete": run("DELETE FROM products WHERE id IN ({ids})"); break;
        default: throw new HttpError(400, "Nepoznata akcija.");
      }
    });
    catalog.invalidate();
    const ACTIONS = {
      activate: "Vratio u shop", deactivate: "Sakrio iz shopa", "new-on": "Označio kao novo", "new-off": "Uklonio oznaku novo",
      discount: `Postavio popust ${b.value}%`, "clear-discount": "Uklonio popust", stock: `Postavio zalihu na ${b.value === "" || b.value == null ? "∞" : b.value}`,
      move: `Premjestio u kategoriju „${db.prepare("SELECT name_bs FROM categories WHERE id = ?").get(+b.value)?.name_bs || ""}”`, delete: "Obrisao proizvod",
    };
    // Jedan red po proizvodu (do 50), a za veće grupne izmjene jedan zbirni red
    if (names.length <= 50) for (const n of names) log(ctx, ACTIONS[b.action], { type: "product", id: n.id, label: `${n.name} · ${n.colour_bs}` });
    else log(ctx, `${ACTIONS[b.action]} (grupno)`, { type: "product", label: `${names.length} proizvoda`, details: names.slice(0, 10).map((n) => n.name).join(", ") + "…" });
    sendJson(ctx.res, 200, { ok: true, count: ids.length });
  }));

  r.post("/api/admin/upload", A(async (ctx) => {
    if (!/^image\/(jpeg|png|webp)$/.test(ctx.req.headers["content-type"] || "")) throw new HttpError(415, "Dozvoljene su samo JPG, PNG i WEBP slike.");
    const buf = await readBody(ctx.req, 8e6);
    // Provjera stvarnog formata (ne vjerujemo samo zaglavlju)
    const ext = buf[0] === 0xff && buf[1] === 0xd8 ? "jpg"
      : buf.slice(0, 8).toString("hex") === "89504e470d0a1a0a" ? "png"
      : buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP" ? "webp" : null;
    if (!ext) throw new HttpError(400, "Dozvoljene su samo JPG, PNG i WEBP slike.");
    const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS, name), buf);
    sendJson(ctx.res, 201, { url: `/uploads/${name}` });
  }));

  /* ---------- Kategorije ---------- */
  const ROOMS = ["Bedroom", "Bathroom", "Living", "Dining", "Wardrobe"];
  r.get("/api/admin/categories", A((ctx) => {
    const cats = db.prepare(`SELECT c.*, (SELECT count(*) FROM products WHERE category_id = c.id) count,
      (SELECT count(*) FROM products WHERE category_id = c.id AND active = 1) active FROM categories c ORDER BY sort, id`).all();
    sendJson(ctx.res, 200, { cats, rooms: ROOMS });
  }));
  function categoryInput(b) {
    required(b, ["name_bs", "name_en"]);
    return {
      name_bs: str(b.name_bs, 80), name_en: str(b.name_en, 80), blurb_bs: str(b.blurb_bs, 400), blurb_en: str(b.blurb_en, 400),
      room: ROOMS.includes(b.room) ? b.room : "Living", textile: b.textile === false || b.textile === 0 ? 0 : 1,
    };
  }
  // Kategorije: pregled smiju svi, izmjene samo vlasnik
  r.post("/api/admin/categories", O(async (ctx) => {
    const c = categoryInput(await readJson(ctx.req));
    let slug = slugify(c.name_en) || "kategorija";
    while (db.prepare("SELECT 1 FROM categories WHERE slug = ?").get(slug)) slug += "-2";
    const res = db.prepare("INSERT INTO categories(slug, name_bs, name_en, blurb_bs, blurb_en, room, textile, sort) VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT coalesce(max(sort),0)+1 FROM categories))")
      .run(slug, c.name_bs, c.name_en, c.blurb_bs, c.blurb_en, c.room, c.textile);
    catalog.invalidate();
    log(ctx, "Dodao kategoriju", { type: "category", id: Number(res.lastInsertRowid), label: c.name_bs });
    sendJson(ctx.res, 201, { id: Number(res.lastInsertRowid) });
  }));
  r.put("/api/admin/categories/:id", O(async (ctx) => {
    const c = categoryInput(await readJson(ctx.req));
    const before = db.prepare("SELECT * FROM categories WHERE id = ?").get(+ctx.params.id);
    if (!before) throw new HttpError(404, "Kategorija nije pronađena.");
    db.prepare("UPDATE categories SET name_bs = ?, name_en = ?, blurb_bs = ?, blurb_en = ?, room = ?, textile = ? WHERE id = ?")
      .run(c.name_bs, c.name_en, c.blurb_bs, c.blurb_en, c.room, c.textile, before.id);
    catalog.invalidate();
    const d = [];
    if (before.name_bs !== c.name_bs) d.push(`${before.name_bs} → ${c.name_bs}`);
    if (before.name_en !== c.name_en) d.push(`EN: ${before.name_en} → ${c.name_en}`);
    if (before.blurb_bs !== c.blurb_bs || before.blurb_en !== c.blurb_en) d.push("opis izmijenjen");
    if (before.room !== c.room || before.textile !== c.textile) d.push("prostorija/vrsta izmijenjena");
    if (d.length) log(ctx, "Izmijenio kategoriju", { type: "category", id: before.id, label: c.name_bs, details: d.join(" · ") });
    sendJson(ctx.res, 200, { ok: true });
  }));
  r.post("/api/admin/categories/:id/move", O(async (ctx) => {
    const b = await readJson(ctx.req);
    const list = db.prepare("SELECT id FROM categories ORDER BY sort, id").all().map((x) => x.id);
    const i = list.indexOf(+ctx.params.id), j = i + (b.dir === "up" ? -1 : 1);
    if (i < 0 || j < 0 || j >= list.length) return sendJson(ctx.res, 200, { ok: true });
    [list[i], list[j]] = [list[j], list[i]];
    tx(() => list.forEach((id, k) => db.prepare("UPDATE categories SET sort = ? WHERE id = ?").run(k + 1, id)));
    catalog.invalidate();
    sendJson(ctx.res, 200, { ok: true });
  }));
  r.delete("/api/admin/categories/:id", O((ctx) => {
    if (db.prepare("SELECT 1 FROM products WHERE category_id = ?").get(+ctx.params.id)) throw new HttpError(409, "Kategorija nije prazna — prvo premjestite proizvode.");
    const c = db.prepare("SELECT name_bs FROM categories WHERE id = ?").get(+ctx.params.id);
    db.prepare("DELETE FROM categories WHERE id = ?").run(+ctx.params.id);
    catalog.invalidate();
    if (c) log(ctx, "Obrisao kategoriju", { type: "category", id: ctx.params.id, label: c.name_bs });
    sendJson(ctx.res, 200, { ok: true });
  }));

  /* ---------- Kupci (iz narudžbi — kupci nemaju račune) ---------- */
  r.get("/api/admin/customers", A((ctx) => {
    const q = ctx.query;
    const { sql, args } = orders.buyers({ q: q.q });
    const total = db.prepare(`SELECT count(*) n FROM (${sql})`).get(...args).n;
    const sorts = { last: "last_at DESC", orders: "orders DESC, last_at DESC", spent: "spent DESC" };
    const rows = db.prepare(`${sql} ORDER BY ${pick(sorts, q.sort) || sorts.last} LIMIT ? OFFSET ?`).all(...args, PER_PAGE, (page(q) - 1) * PER_PAGE);
    sendJson(ctx.res, 200, { rows, total, perPage: PER_PAGE });
  }));
  r.get("/api/admin/customers.csv", O((ctx) => {
    const { sql, args } = orders.buyers({ q: ctx.query.q });
    const rows = db.prepare(`${sql} ORDER BY last_at DESC`).all(...args);
    log(ctx, "Izvezao listu kupaca (CSV)", { type: "user", details: `${rows.length} kupaca` });
    sendCsv(ctx.res, "kupci.csv", ["Email", "Ime", "Prezime", "Telefon", "Adresa", "Grad", "Poštanski", "Narudžbi", "Potrošeno KM", "Prva narudžba", "Zadnja narudžba"],
      rows.map((b) => [b.email, b.first_name, b.last_name, b.phone, b.address, b.city, b.zip, b.orders, b.spent, b.first_at, b.last_at]));
  }));

  /* ---------- Poruke i newsletter ---------- */
  r.get("/api/admin/messages", A((ctx) => sendJson(ctx.res, 200, { rows: db.prepare("SELECT * FROM messages ORDER BY id DESC LIMIT 500").all() })));
  r.patch("/api/admin/messages/:id", A(async (ctx) => {
    const b = await readJson(ctx.req);
    db.prepare("UPDATE messages SET is_read = ? WHERE id = ?").run(b.is_read ? 1 : 0, +ctx.params.id);
    sendJson(ctx.res, 200, { ok: true });
  }));
  r.delete("/api/admin/messages/:id", A((ctx) => {
    const m = db.prepare("SELECT name, subject FROM messages WHERE id = ?").get(+ctx.params.id);
    db.prepare("DELETE FROM messages WHERE id = ?").run(+ctx.params.id);
    if (m) log(ctx, "Obrisao poruku", { type: "message", id: ctx.params.id, label: m.subject || "Bez teme", details: `od: ${m.name}` });
    sendJson(ctx.res, 200, { ok: true });
  }));
  // Newsletter (lista emailova kupaca) — samo vlasnik
  r.get("/api/admin/newsletter", O((ctx) => sendJson(ctx.res, 200, { rows: db.prepare("SELECT * FROM newsletter ORDER BY created_at DESC").all() })));
  r.get("/api/admin/newsletter.csv", O((ctx) => {
    log(ctx, "Izvezao newsletter listu (CSV)", { type: "newsletter" });
    sendCsv(ctx.res, "newsletter.csv", ["Email", "Datum prijave"], db.prepare("SELECT email, created_at FROM newsletter ORDER BY created_at DESC").all().map((x) => [x.email, x.created_at]));
  }));
  r.delete("/api/admin/newsletter/:email", O((ctx) => {
    db.prepare("DELETE FROM newsletter WHERE email = ?").run(ctx.params.email);
    log(ctx, "Uklonio sa newsletter liste", { type: "newsletter", label: ctx.params.email });
    sendJson(ctx.res, 200, { ok: true });
  }));

  /* ---------- Vaučeri ---------- */
  function voucherInput(b) {
    required(b, ["code", "value"]);
    const code = str(b.code, 40).toUpperCase();
    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) throw new HttpError(400, "Kod smije imati samo slova, brojeve, - i _ (najmanje 3 znaka).", { fields: ["code"] });
    const type = b.type === "fixed" ? "fixed" : "percent";
    const value = num(b.value, { min: 0.01, max: type === "percent" ? 90 : 1e6 });
    const valid = str(b.valid_until, 10);
    if (valid && !/^\d{4}-\d{2}-\d{2}$/.test(valid)) throw new HttpError(400, "Neispravan datum.", { fields: ["valid_until"] });
    return {
      code, type, value,
      min_total: num(b.min_total, { min: 0, max: 1e6, allowNull: true }) || 0,
      max_uses: b.max_uses === "" || b.max_uses == null ? null : Math.floor(num(b.max_uses, { min: 1, max: 1e6 })),
      valid_until: valid || null,
      active: b.active === false || b.active === 0 ? 0 : 1,
      note: str(b.note, 200),
    };
  }
  // Vaučeri — samo vlasnik
  const voucherText = (v) => `${v.type === "fixed" ? activity.km(v.value) : String(v.value).replace(".", ",") + "%"}${v.min_total > 0 ? ` od ${activity.km(v.min_total)}` : ""}${v.max_uses != null ? `, max ${v.max_uses}×` : ""}${v.valid_until ? `, do ${v.valid_until}` : ""}${v.active ? "" : " (isključen)"}`;
  r.get("/api/admin/vouchers", O((ctx) => {
    const rows = db.prepare(`SELECT v.*, (SELECT count(*) FROM orders o WHERE o.voucher_code = v.code AND o.status != 'otkazana') orders,
      (SELECT coalesce(sum(discount), 0) FROM orders o WHERE o.voucher_code = v.code AND o.status != 'otkazana') given FROM vouchers v ORDER BY v.id DESC`).all();
    sendJson(ctx.res, 200, { rows });
  }));
  r.post("/api/admin/vouchers", O(async (ctx) => {
    const v = voucherInput(await readJson(ctx.req));
    if (db.prepare("SELECT 1 FROM vouchers WHERE code = ?").get(v.code)) throw new HttpError(409, "Vaučer sa ovim kodom već postoji.", { fields: ["code"] });
    const res = db.prepare("INSERT INTO vouchers(code, type, value, min_total, max_uses, valid_until, active, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(v.code, v.type, v.value, v.min_total, v.max_uses, v.valid_until, v.active, v.note);
    log(ctx, "Napravio vaučer", { type: "voucher", id: Number(res.lastInsertRowid), label: v.code, details: voucherText(v) });
    sendJson(ctx.res, 201, { ok: true });
  }));
  r.put("/api/admin/vouchers/:id", O(async (ctx) => {
    const v = voucherInput(await readJson(ctx.req));
    if (db.prepare("SELECT 1 FROM vouchers WHERE code = ? AND id != ?").get(v.code, +ctx.params.id)) throw new HttpError(409, "Vaučer sa ovim kodom već postoji.", { fields: ["code"] });
    const before = db.prepare("SELECT * FROM vouchers WHERE id = ?").get(+ctx.params.id);
    db.prepare("UPDATE vouchers SET code = ?, type = ?, value = ?, min_total = ?, max_uses = ?, valid_until = ?, active = ?, note = ? WHERE id = ?")
      .run(v.code, v.type, v.value, v.min_total, v.max_uses, v.valid_until, v.active, v.note, +ctx.params.id);
    if (before && voucherText(before) !== voucherText(v)) log(ctx, before.active && !v.active ? "Isključio vaučer" : !before.active && v.active ? "Uključio vaučer" : "Izmijenio vaučer", { type: "voucher", id: ctx.params.id, label: v.code, details: `${voucherText(before)} → ${voucherText(v)}` });
    sendJson(ctx.res, 200, { ok: true });
  }));
  r.delete("/api/admin/vouchers/:id", O((ctx) => {
    const v = db.prepare("SELECT code FROM vouchers WHERE id = ?").get(+ctx.params.id);
    db.prepare("DELETE FROM vouchers WHERE id = ?").run(+ctx.params.id);
    if (v) log(ctx, "Obrisao vaučer", { type: "voucher", id: ctx.params.id, label: v.code });
    sendJson(ctx.res, 200, { ok: true });
  }));

  /* ---------- Postavke ---------- */
  const EDITABLE = ["shop_name", "company_jib", "shop_email", "shop_phone", "shop_address", "pickup_enabled", "order_notify_email", "shipping_fee", "free_shipping_over", "bank_details", "smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from"];
  const SETTING_LABELS = {
    shop_name: "Naziv firme", company_jib: "JIB", shop_email: "Email za kupce", shop_phone: "Telefon", shop_address: "Adresa studija", pickup_enabled: "Preuzimanje u studiju",
    order_notify_email: "Email za obavijesti", shipping_fee: "Cijena dostave", free_shipping_over: "Besplatna dostava iznad",
    bank_details: "Podaci za uplatu", smtp_host: "SMTP server", smtp_port: "SMTP port", smtp_user: "SMTP korisnik", smtp_pass: "SMTP lozinka", smtp_from: "Pošiljalac",
  };
  // Postavke — samo vlasnik
  r.get("/api/admin/settings", O((ctx) => {
    const s = getSettings();
    const out = Object.fromEntries(EDITABLE.map((k) => [k, s[k] ?? ""]));
    out.smtp_pass = s.smtp_pass ? "••••••••" : "";
    sendJson(ctx.res, 200, out);
  }));
  r.put("/api/admin/settings", O(async (ctx) => {
    const b = await readJson(ctx.req);
    if (b.shipping_fee !== undefined) b.shipping_fee = String(b.shipping_fee).trim() === "" ? "0" : String(num(b.shipping_fee, { min: 0, max: 1000 }));
    if (b.free_shipping_over !== undefined) b.free_shipping_over = String(b.free_shipping_over).trim() === "" ? "0" : String(num(b.free_shipping_over, { min: 0, max: 1e6 }));
    if (b.order_notify_email) email(b.order_notify_email);
    if (b.pickup_enabled !== undefined) b.pickup_enabled = b.pickup_enabled === true || b.pickup_enabled === "1" ? "1" : "0";
    const before = getSettings();
    const set = db.prepare("UPDATE settings SET value = ? WHERE key = ?");
    const changed = [];
    tx(() => {
      for (const k of EDITABLE) {
        if (b[k] === undefined) continue;
        if (k === "smtp_pass" && b[k] === "••••••••") continue; // nije mijenjano
        const v = str(b[k], 2000);
        if (v !== (before[k] ?? "")) changed.push(k === "smtp_pass" || k === "bank_details" ? SETTING_LABELS[k] : `${SETTING_LABELS[k]}: ${before[k] || "—"} → ${v || "—"}`);
        set.run(v, k);
      }
    });
    catalog.invalidate();
    if (changed.length) log(ctx, "Izmijenio postavke", { type: "settings", details: changed.join(" · ") });
    sendJson(ctx.res, 200, { ok: true });
  }));
  r.post("/api/admin/test-email", O(async (ctx) => {
    const b = await readJson(ctx.req);
    try {
      const r2 = await mail.send(email(b.to), "Test email", "<p>Ovo je testna poruka iz web shopa. Slanje emailova radi ispravno.</p>");
      sendJson(ctx.res, 200, { ok: true, outbox: r2.outbox || null });
    } catch (e) {
      throw new HttpError(502, "Slanje nije uspjelo: " + e.message);
    }
  }));

  /* ---------- Backup i vraćanje (samo vlasnik) ---------- */
  r.get("/api/admin/backup", O((ctx) => {
    const { zip, name, counts } = backup.createBackupZip();
    log(ctx, "Preuzeo kompletan backup", { type: "backup", label: name, details: `${counts.products} proizvoda, ${counts.orders} narudžbi, ${counts.users} korisnika` });
    ctx.res.writeHead(200, { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${name}"`, "Content-Length": zip.length, "Cache-Control": "no-store" });
    ctx.res.end(zip);
  }));
  r.get("/api/admin/backups", O((ctx) => sendJson(ctx.res, 200, { rows: backup.listAutoBackups() })));
  r.get("/api/admin/backups/:name", O((ctx) => {
    const name = ctx.params.name;
    const found = backup.listAutoBackups().find((b) => b.name === name); // samo postojeći automatski backupi
    if (!found) throw new HttpError(404, "Backup nije pronađen.");
    const data = fs.readFileSync(path.join(backup.AUTO_DIR, name));
    ctx.res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="wiena-${name}"`, "Content-Length": data.length, "Cache-Control": "no-store" });
    ctx.res.end(data);
  }));
  r.post("/api/admin/restore", O(async (ctx) => {
    // Samo binarni upload (forma sa drugog sajta ne može poslati ovaj tip — zaštita od CSRF)
    if (!/^application\/(zip|x-zip-compressed|octet-stream)$/.test(ctx.req.headers["content-type"] || "")) throw new HttpError(415, "Odaberite backup fajl (.zip ili .db).");
    const buf = await readBody(ctx.req, 500e6);
    if (!buf.length) throw new HttpError(400, "Fajl je prazan.");
    // Sigurnosna kopija trenutnog stanja prije vraćanja
    const before = backup.createBackupZip();
    fs.mkdirSync(backup.AUTO_DIR, { recursive: true });
    fs.writeFileSync(path.join(backup.AUTO_DIR, `prije-vracanja-${before.name}`), before.zip);
    let result;
    try { result = backup.restoreBackup(buf); } catch (e) { throw new HttpError(400, e.message); }
    catalog.invalidate();
    // Sesije su obrisane pri vraćanju — dnevnik se upisuje bez prijavljenog korisnika u novoj bazi
    activity.log({ id: null, first_name: activity.personName(ctx.user) }, "Vratio shop iz backupa", { type: "backup", details: `${result.products} proizvoda, ${result.orders} narudžbi, ${result.users} korisnika, ${result.images} slika` });
    sendJson(ctx.res, 200, { ok: true, ...result, safety: `prije-vracanja-${before.name}` });
  }));

  /* ---------- API i integracije ---------- */
  require("./integrations-admin")(r, { A, O, log });

  /* ---------- Dnevnik aktivnosti ---------- */
  // Cijeli dnevnik — samo vlasnik
  r.get("/api/admin/activity", O((ctx) => {
    const q = ctx.query, where = [], args = [];
    if (q.user) { where.push("user_id = ?"); args.push(+q.user); }
    if (q.type) { where.push("target_type = ?"); args.push(String(q.type)); }
    if (q.q) { where.push("(target_label LIKE ? OR details LIKE ? OR action LIKE ?)"); args.push(like(q.q), like(q.q), like(q.q)); }
    const sql = where.length ? "WHERE " + where.join(" AND ") : "";
    const total = db.prepare(`SELECT count(*) n FROM activity_log ${sql}`).get(...args).n;
    const rows = db.prepare(`SELECT * FROM activity_log ${sql} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args, PER_PAGE, (page(q) - 1) * PER_PAGE);
    const people = db.prepare("SELECT DISTINCT user_id, user_name FROM activity_log WHERE user_id IS NOT NULL ORDER BY user_name").all();
    sendJson(ctx.res, 200, { rows, total, perPage: PER_PAGE, people });
  }));
  // Zadnje izmjene jedne narudžbe/proizvoda (na stranici te narudžbe/proizvoda)
  r.get("/api/admin/activity/:type/:id", A((ctx) => {
    if (!["order", "product"].includes(ctx.params.type)) throw new HttpError(400, "Nepoznata vrsta.");
    const rows = db.prepare("SELECT user_name, action, details, created_at FROM activity_log WHERE target_type = ? AND target_id = ? ORDER BY id DESC LIMIT 15")
      .all(ctx.params.type, String(ctx.params.id));
    sendJson(ctx.res, 200, { rows });
  }));
};
