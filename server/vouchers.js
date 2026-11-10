// Vaučeri (kodovi za popust): ista pravila za provjeru u korpi i za stvarnu narudžbu
const { db } = require("./db");
const { HttpError } = require("./http");

const round2 = (n) => Math.round(n * 100) / 100;
const today = () => new Date().toISOString().slice(0, 10);
const kmText = (n) => n.toFixed(2).replace(".", ",") + " KM";

// Vraća { voucher, discount } ili baca grešku sa porukom za kupca
function evaluate(code, subtotal) {
  const v = db.prepare("SELECT * FROM vouchers WHERE code = ?").get(String(code || "").trim());
  if (!v || !v.active) throw new HttpError(400, "Vaučer ne postoji ili nije aktivan.");
  if (v.valid_until && v.valid_until < today()) throw new HttpError(400, "Ovaj vaučer je istekao.");
  if (v.max_uses != null && v.used >= v.max_uses) throw new HttpError(400, "Ovaj vaučer je već iskorišten.");
  if (subtotal < (v.min_total || 0)) throw new HttpError(400, `Vaučer vrijedi za narudžbe od ${kmText(v.min_total)} naviše.`);
  const discount = v.type === "fixed" ? Math.min(v.value, subtotal) : round2((subtotal * v.value) / 100);
  return { voucher: v, discount: round2(discount) };
}

// Javni podaci o vaučeru (bez internih napomena i brojača)
const publicInfo = (v) => ({ code: v.code, type: v.type, value: v.value, min_total: v.min_total || 0 });

module.exports = { evaluate, publicInfo, round2 };
