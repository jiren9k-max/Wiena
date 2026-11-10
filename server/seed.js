// Početni katalog: pri prvom pokretanju (prazna baza) uvozi kategorije i proizvode iz server/seed-catalog.json.
// (Katalog se nakon prvog pokretanja mijenja samo u adminu.)
const path = require("path");
const fs = require("fs");
const { db, tx } = require("./db");

const FILE = path.join(__dirname, "seed-catalog.json");
const J = (v) => JSON.stringify(v ?? []);

function importSeed() {
  if (!fs.existsSync(FILE)) return 0;
  const { categories, products } = JSON.parse(fs.readFileSync(FILE, "utf8"));
  return tx(() => {
    const addCat = db.prepare(`INSERT INTO categories(slug, name_bs, name_en, blurb_bs, blurb_en, room, textile, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO NOTHING`);
    for (const c of categories) addCat.run(c.slug, c.name_bs, c.name_en, c.blurb_bs, c.blurb_en, c.room, c.textile, c.sort);
    const catId = Object.fromEntries(db.prepare("SELECT id, slug FROM categories").all().map((c) => [c.slug, c.id]));
    const add = db.prepare(`INSERT INTO products(code, slug, family, category_id, name_bs, name_en, desc_bs, desc_en, colour_key, colour_bs, colour_en, swatch,
      fibre, material_bs, material_en, details_bs, details_en, care_bs, care_en, sizes, price, old_price, price_eur, old_price_eur, stock, badge, is_new,
      rating, reviews, images, art, sort) VALUES (${Array(32).fill("?").join(", ")}) ON CONFLICT(code) DO NOTHING`);
    let n = 0;
    for (const p of products) {
      n += add.run(p.code, p.slug, p.family, catId[p.category], p.name_bs, p.name_en, p.desc_bs, p.desc_en, p.colour_key, p.colour_bs, p.colour_en, p.swatch,
        p.fibre, p.material_bs, p.material_en, J(p.details_bs), J(p.details_en), p.care_bs, p.care_en, J(p.sizes), p.price, p.old_price, p.price_eur, p.old_price_eur,
        p.stock, p.badge || "", p.is_new, p.rating, p.reviews, J(p.images), JSON.stringify(p.art || null), p.sort).changes;
    }
    return n;
  });
}

module.exports = { importSeed };
