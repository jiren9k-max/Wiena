// Katalog za shop: /api/catalog.js (window.WIENA_DATA = {...}) — keširan dok admin nešto ne promijeni.
// Shop ga učitava kao običnu skriptu prije js/products.js, pa sve stranice odmah imaju proizvode.
const crypto = require("crypto");
const { db, getSettings } = require("./db");

let cache = null;
const EUR_BAM = 1.95583;
const parse = (s, d) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };
// € cijena za englesku verziju: ručno unesena, ili preračunata iz KM (fiksni kurs) i zaokružena na cijeli euro
const eur = (km, manual) => (manual != null && manual !== "" ? +manual : km == null ? null : Math.max(1, Math.round(km / EUR_BAM)));

function build() {
  const cats = db.prepare("SELECT * FROM categories ORDER BY sort, id").all();
  const catSlug = Object.fromEntries(cats.map((c) => [c.id, c.slug]));
  const rows = db.prepare("SELECT * FROM products WHERE active = 1 ORDER BY sort, id").all();
  const s = getSettings();
  const freeKm = +s.free_shipping_over || 0, feeKm = +s.shipping_fee || 0;

  const data = {
    settings: {
      shop_name: s.shop_name, company_jib: s.company_jib || "", shop_email: s.shop_email, shop_phone: s.shop_phone, shop_address: s.shop_address,
      shipping_fee: feeKm, free_shipping_over: freeKm, shipping_fee_eur: eur(feeKm), free_shipping_over_eur: freeKm ? Math.max(10, Math.round(freeKm / EUR_BAM / 10) * 10) : 0,
      pickup: s.pickup_enabled === "1",
    },
    categories: cats.map((c) => ({ key: c.slug, name_bs: c.name_bs, name_en: c.name_en, blurb_bs: c.blurb_bs, blurb_en: c.blurb_en, room: c.room, textile: !!c.textile })),
    products: rows.map((p) => ({
      id: p.id, code: p.code, slug: p.slug, family: p.family, cat: catSlug[p.category_id],
      name_bs: p.name_bs, name_en: p.name_en || p.name_bs, desc_bs: p.desc_bs, desc_en: p.desc_en || p.desc_bs,
      colour_key: p.colour_key, colour_bs: p.colour_bs, colour_en: p.colour_en || p.colour_bs, swatch: p.swatch,
      fibre: p.fibre, material_bs: p.material_bs, material_en: p.material_en || p.material_bs,
      details_bs: parse(p.details_bs, []), details_en: parse(p.details_en, []), care_bs: p.care_bs, care_en: p.care_en || p.care_bs,
      sizes: parse(p.sizes, ["One size"]),
      price: p.price, old_price: p.old_price, price_eur: eur(p.price, p.price_eur), old_price_eur: p.old_price ? eur(p.old_price, p.old_price_eur) : null,
      stock: p.stock, badge: p.badge || "", is_new: !!p.is_new, rating: p.rating, reviews: p.reviews,
      images: parse(p.images, []), art: parse(p.art, null),
    })),
  };
  const js = "window.WIENA_DATA = " + JSON.stringify(data).replace(/</g, "\\u003c") + ";\n";
  return { js, etag: '"' + crypto.createHash("sha1").update(js).digest("hex").slice(0, 16) + '"' };
}

module.exports = {
  get: () => (cache ??= build()),
  invalidate: () => { cache = null; },
  eur,
  EUR_BAM,
};
