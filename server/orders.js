// Zajednička logika narudžbi: promjena statusa (admin i API rade potpuno isto) i javni prikaz narudžbe (API, webhookovi)
const { db, tx } = require("./db");
const { HttpError } = require("./http");
const catalog = require("./catalog");
const mail = require("./mail");
const webhooks = require("./webhooks");

const STATUS = mail.STATUS; // { nova: "Nova", potvrdjena: "Potvrđena", ... }
const STATUSES = Object.keys(STATUS);
const DELIVERY = { posta: "Dostava na adresu", studio: "Preuzimanje u studiju" };
const PAYMENT = { pouzece: "Pouzećem", racun: "Uplata na račun" };

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
// Baza čuva vrijeme u UTC bez oznake zone ("2026-11-08 14:05:00") → ISO 8601 ("2026-11-08T14:05:00Z")
const iso = (s) => (s ? String(s).replace(" ", "T") + "Z" : null);

function itemsFor(orderIds) {
  if (!orderIds.length) return new Map();
  const rows = db.prepare(`SELECT order_id, code, name, size, colour, price, qty FROM order_items WHERE order_id IN (${orderIds.map(() => "?").join(",")}) ORDER BY id`).all(...orderIds);
  const map = new Map(orderIds.map((id) => [id, []]));
  for (const r of rows) map.get(r.order_id).push(r);
  return map;
}

// Narudžba onako kako je vide vanjski sistemi (API i webhookovi)
function payload(o, items) {
  if (!items) items = itemsFor([o.id]).get(o.id);
  return {
    id: o.id,
    number: o.number,
    status: o.status,
    status_label: STATUS[o.status] || o.status,
    created_at: iso(o.created_at),
    updated_at: iso(o.updated_at),
    currency: "BAM",
    customer: { first_name: o.first_name || "", last_name: o.last_name || "", email: o.email || "", phone: o.phone || "" },
    delivery: { method: o.delivery, label: DELIVERY[o.delivery] || o.delivery, address: o.address || "", city: o.city || "", zip: o.zip || "" },
    payment: { method: o.payment, label: PAYMENT[o.payment] || o.payment },
    voucher_code: o.voucher_code || null,
    subtotal: r2(o.subtotal),
    discount: r2(o.discount),
    shipping: r2(o.shipping),
    total: r2(o.total),
    language: o.lang || "bs",
    customer_note: o.note || "",
    internal_note: o.admin_note || "",
    items: items.map((i) => ({ code: i.code, name: i.name, colour: i.colour || "", size: i.size || "", price: r2(i.price), qty: i.qty, total: r2(i.price * i.qty) })),
  };
}

const byId = (id) => db.prepare("SELECT * FROM orders WHERE id = ?").get(id);

// Promjena statusa i/ili interne bilješke. Otkazivanje vraća zalihu i korištenje vaučera, ponovno aktiviranje ih opet uzima.
// Vraća { order (nova verzija), before, statusChanged }.
function update(o, { status, adminNote, notify = true } = {}) {
  const next = status && STATUSES.includes(status) ? status : o.status;
  tx(() => {
    if (next !== o.status && (next === "otkazana" || o.status === "otkazana")) {
      const items = db.prepare("SELECT product_id, name, qty FROM order_items WHERE order_id = ?").all(o.id).filter((it) => it.product_id);
      if (next === "otkazana") {
        const back = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL");
        for (const it of items) back.run(it.qty, it.product_id);
      } else {
        // Ponovno aktiviranje otkazane narudžbe: artikli moraju opet biti na stanju
        const take = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND (stock IS NULL OR stock >= ?)");
        for (const it of items) {
          if (take.run(it.qty, it.product_id, it.qty).changes !== 1 && db.prepare("SELECT 1 FROM products WHERE id = ?").get(it.product_id)) {
            throw new HttpError(409, `Nema dovoljno na zalihi za "${it.name}" — povećajte zalihu prije ponovnog aktiviranja narudžbe.`, { code: "insufficient_stock" });
          }
        }
      }
      if (o.voucher_code) {
        db.prepare(next === "otkazana" ? "UPDATE vouchers SET used = max(used - 1, 0) WHERE code = ?" : "UPDATE vouchers SET used = used + 1 WHERE code = ?").run(o.voucher_code);
      }
      catalog.invalidate();
    }
    db.prepare("UPDATE orders SET status = ?, admin_note = ?, updated_at = datetime('now') WHERE id = ?")
      .run(next, adminNote !== undefined ? adminNote : o.admin_note, o.id);
  });
  const order = byId(o.id);
  const statusChanged = next !== o.status;
  if (statusChanged) {
    if (notify) mail.statusEmail(order);
    webhooks.emit("order.status_changed", { previous_status: o.status, order: payload(order) });
  }
  return { order, before: o, statusChanged };
}

// Kupci = svi koji su naručili (kupci nemaju račune), grupisano po emailu; ime, telefon i adresa iz zadnje narudžbe.
// filter: { q, since } → { sql, args } za upotrebu u listama (admin i API)
function buyers({ q, since } = {}) {
  const where = [], args = [];
  if (q) {
    const l = `%${String(q).replace(/[%_]/g, "")}%`;
    where.push("(b.email LIKE ? OR l.first_name || ' ' || l.last_name LIKE ? OR l.phone LIKE ? OR l.city LIKE ?)");
    args.push(l, l, l, l);
  }
  if (since) { where.push("b.first_at >= ?"); args.push(since); }
  const sql = `WITH b AS (
      SELECT lower(email) email, max(id) last_id, count(*) orders,
        coalesce(sum(CASE WHEN status != 'otkazana' THEN total END), 0) spent,
        min(created_at) first_at, max(created_at) last_at
      FROM orders WHERE email IS NOT NULL AND email != '' GROUP BY lower(email))
    SELECT b.email, b.orders, b.spent, b.first_at, b.last_at, l.first_name, l.last_name, l.phone, l.address, l.city, l.zip
    FROM b JOIN orders l ON l.id = b.last_id ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  return { sql, args };
}

module.exports = { STATUS, STATUSES, DELIVERY, PAYMENT, payload, itemsFor, update, byId, iso, r2, buyers };
