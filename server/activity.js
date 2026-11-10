// Uloge u adminu i dnevnik aktivnosti ("ko je šta promijenio")
const { db } = require("./db");

const ROLES = { owner: "Vlasnik", customer: "Kupac" };
// Admin je samo za vlasnika (WIENA nema uloge zaposlenika); vanjski programi se spajaju API ključem
const isStaff = (u) => !!u && u.role === "owner"; // smije u admin
const isOwner = (u) => !!u && u.role === "owner";

const personName = (u) => [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.email;
const km = (n) => (n == null || n === "" ? "—" : Number(n).toFixed(2).replace(".", ",") + " KM");

const insert = db.prepare(`INSERT INTO activity_log(user_id, user_name, action, target_type, target_id, target_label, details)
  VALUES (?, ?, ?, ?, ?, ?, ?)`);

// Upis u dnevnik; greška pri upisu nikad ne smije srušiti samu izmjenu
function log(user, action, { type = null, id = null, label = null, details = null } = {}) {
  try {
    insert.run(user?.id ?? null, user ? personName(user) : "Sistem", action, type, id == null ? null : String(id), label, details);
  } catch (e) {
    console.error("[dnevnik]", e.message);
  }
}

// Razlike između starog i novog proizvoda, čitljivo (npr. "Cijena: 139,00 KM → 129,00 KM")
function productChanges(before, after) {
  const out = [];
  const add = (label, a, b, fmt = (x) => (x == null || x === "" ? "—" : String(x))) => { if (String(a ?? "") !== String(b ?? "")) out.push(`${label}: ${fmt(a)} → ${fmt(b)}`); };
  add("Cijena", before.price, after.price, km);
  add("Stara cijena", before.old_price, after.old_price, km);
  add("Cijena €", before.price_eur, after.price_eur);
  add("Zaliha", before.stock, after.stock, (x) => (x == null ? "∞" : String(x)));
  add("Naziv", before.name_bs, after.name_bs);
  add("Naziv (EN)", before.name_en, after.name_en);
  add("Šifra", before.code, after.code);
  add("Boja", before.colour_bs, after.colour_bs);
  add("Oznaka", before.badge, after.badge);
  if (String(before.category_id) !== String(after.category_id)) out.push("Kategorija promijenjena");
  if (!!before.active !== !!after.active) out.push(after.active ? "Vraćen u shop" : "Sakriven iz shopa");
  if (!!before.is_new !== !!after.is_new) out.push(after.is_new ? "Označen kao novo" : "Uklonjena oznaka novo");
  if ((before.desc_bs || "") !== (after.desc_bs || "") || (before.desc_en || "") !== (after.desc_en || "")) out.push("Opis izmijenjen");
  if ((before.sizes || "") !== (after.sizes || "")) out.push("Veličine izmijenjene");
  if ((before.images || null) !== (after.images || null)) out.push("Slike izmijenjene");
  return out.join(" · ");
}

module.exports = { ROLES, isStaff, isOwner, personName, log, productChanges, km };
