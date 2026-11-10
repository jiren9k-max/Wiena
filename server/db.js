// Baza podataka (SQLite ugrađen u Node.js — bez dodatne instalacije)
const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, "shop.db"));
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name_bs TEXT NOT NULL,
  name_en TEXT NOT NULL,
  blurb_bs TEXT DEFAULT '',
  blurb_en TEXT DEFAULT '',
  room TEXT DEFAULT 'Living',     -- Bedroom | Bathroom | Living | Dining | Wardrobe
  textile INTEGER DEFAULT 1,      -- 1 = tekstil, 0 = dom i mirisi
  sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,      -- šifra (SKU), npr. WN-001
  slug TEXT DEFAULT '',
  family TEXT NOT NULL,           -- isti model u više boja dijeli istu porodicu
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name_bs TEXT NOT NULL,
  name_en TEXT DEFAULT '',
  desc_bs TEXT DEFAULT '',
  desc_en TEXT DEFAULT '',
  colour_key TEXT DEFAULT '',     -- npr. Oat, Sage (za filter boja)
  colour_bs TEXT DEFAULT '',
  colour_en TEXT DEFAULT '',
  swatch TEXT DEFAULT '#d6c6a9',  -- boja kružića na stranici proizvoda
  fibre TEXT DEFAULT '',          -- Linen, Cotton, Wool & Cashmere, ...
  material_bs TEXT DEFAULT '',
  material_en TEXT DEFAULT '',
  details_bs TEXT DEFAULT '[]',   -- JSON lista
  details_en TEXT DEFAULT '[]',
  care_bs TEXT DEFAULT '',
  care_en TEXT DEFAULT '',
  sizes TEXT DEFAULT '["One size"]', -- JSON lista veličina
  price REAL NOT NULL,            -- KM
  old_price REAL,                 -- KM (prije sniženja)
  price_eur REAL,                 -- € za englesku verziju (prazno = preračunato iz KM)
  old_price_eur REAL,
  stock INTEGER,                  -- NULL = zaliha se ne prati (uvijek dostupno)
  badge TEXT DEFAULT '',          -- '' | New | Bestseller | Limited | Sale
  is_new INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  rating REAL DEFAULT 5,
  reviews INTEGER DEFAULT 0,
  images TEXT,                    -- JSON lista slika (/uploads/... ili https://...)
  art TEXT,                       -- JSON: podaci za nacrtanu sliku kad fotografija ne postoji
  sort INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_family ON products(family);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  zip TEXT DEFAULT '',
  role TEXT DEFAULT 'customer',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'nova',
  first_name TEXT, last_name TEXT, email TEXT, phone TEXT,
  delivery TEXT, address TEXT, city TEXT, zip TEXT,
  payment TEXT, note TEXT, lang TEXT DEFAULT 'bs',
  subtotal REAL, shipping REAL, total REAL,
  admin_note TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  code TEXT, name TEXT, size TEXT DEFAULT '', colour TEXT DEFAULT '', price REAL, qty INTEGER
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, email TEXT, phone TEXT, subject TEXT, body TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS newsletter (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE TABLE IF NOT EXISTS vouchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL COLLATE NOCASE,
  type TEXT NOT NULL DEFAULT 'percent',   -- 'percent' (%) ili 'fixed' (KM)
  value REAL NOT NULL,
  min_total REAL DEFAULT 0,               -- minimalan iznos korpe
  max_uses INTEGER,                       -- NULL = neograničeno
  used INTEGER DEFAULT 0,
  valid_until TEXT,                       -- 'YYYY-MM-DD' (uključivo) ili NULL
  active INTEGER DEFAULT 1,
  note TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Dnevnik aktivnosti: ko je šta promijenio u adminu
db.exec(`CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_name TEXT,
  action TEXT NOT NULL,          -- kratak opis na bosanskom, npr. 'Promijenio cijenu'
  target_type TEXT,              -- 'product' | 'order' | 'voucher' | 'settings' | 'user' | 'category'
  target_id TEXT,
  target_label TEXT,             -- npr. naziv proizvoda ili broj narudžbe
  details TEXT,                  -- npr. '139,00 KM → 129,00 KM'
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_activity_target ON activity_log(target_type, target_id);`);

// Integracije: API ključevi za vanjske sisteme (finansije, ERP), dnevnik API poziva i webhookovi
db.exec(`CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,          -- početak ključa za prepoznavanje (npr. wnk_1a2b3c4d)
  key_hash TEXT UNIQUE NOT NULL, -- SHA-256 cijelog ključa; sam ključ se nigdje ne čuva
  scopes TEXT NOT NULL,          -- ovlasti odvojene zarezom, npr. 'orders:read,reports:read'
  allowed_ips TEXT DEFAULT '',   -- prazno = sve adrese
  expires_at TEXT,               -- 'YYYY-MM-DD' (uključivo) ili NULL
  note TEXT DEFAULT '',
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  last_used_at TEXT,
  last_ip TEXT,
  requests INTEGER DEFAULT 0,
  revoked_at TEXT
);
CREATE TABLE IF NOT EXISTS api_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_id INTEGER,
  key_name TEXT,
  method TEXT, path TEXT, status INTEGER, ms INTEGER, ip TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_api_requests_time ON api_requests(created_at);
CREATE TABLE IF NOT EXISTS webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,          -- za potpis (HMAC-SHA256) koji primalac provjerava
  events TEXT NOT NULL,          -- npr. 'order.created,order.status_changed'
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  last_at TEXT, last_ok INTEGER, last_error TEXT
);
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id INTEGER NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  uid TEXT NOT NULL,             -- isti ID u svakom ponovnom pokušaju (primalac po njemu prepoznaje duplikate)
  event TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'ok' | 'failed'
  attempts INTEGER DEFAULT 0,
  next_at INTEGER,               -- ms; kada je sljedeći pokušaj
  response_code INTEGER,
  response_body TEXT,
  error TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  delivered_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending ON webhook_deliveries(status, next_at);`);

// Uloge: 'owner' (vlasnik — jedini ulaz u admin) i 'customer'. Stari 'admin' postaje vlasnik.
db.exec("UPDATE users SET role = 'owner' WHERE role = 'admin'");
// WIENA: admin samo za vlasnika — eventualni stari računi zaposlenika gube pristup
db.exec("UPDATE users SET role = 'customer' WHERE role = 'staff'");

// Nadogradnja postojeće baze: kolone za vaučer na narudžbi
const orderCols = db.prepare("PRAGMA table_info(orders)").all().map((c) => c.name);
if (!orderCols.includes("voucher_code")) db.exec("ALTER TABLE orders ADD COLUMN voucher_code TEXT");
if (!orderCols.includes("discount")) db.exec("ALTER TABLE orders ADD COLUMN discount REAL DEFAULT 0");

const DEFAULT_SETTINGS = {
  shop_name: "Wiena Group d.o.o.",
  company_jib: "4203027710002",   // JIB (identifikacioni broj) — prikazuje se u podnožju sajta i emailova
  shop_email: "hello@wiena.ba",
  shop_phone: "+387 33 000 000",
  shop_address: "Kurta Schorka 24A, 71000 Sarajevo",
  order_notify_email: "hello@wiena.ba",
  shipping_fee: "10",          // KM; 0 = besplatna dostava
  free_shipping_over: "300",   // KM; 0 = isključeno
  pickup_enabled: "1",         // preuzimanje u studiju
  bank_details: "Wiena Group d.o.o.\nKurta Schorka 24A, 71000 Sarajevo\nBroj računa: (unesite u postavkama)\nSvrha: Narudžba {broj}",
  smtp_host: "", smtp_port: "587", smtp_user: "", smtp_pass: "", smtp_from: "",
};
const insertSetting = db.prepare("INSERT OR IGNORE INTO settings(key, value) VALUES (?, ?)");
for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) insertSetting.run(k, v);

function getSettings() {
  return Object.fromEntries(db.prepare("SELECT key, value FROM settings").all().map((r) => [r.key, r.value]));
}

function tx(fn) {
  db.exec("BEGIN");
  try {
    const r = fn();
    db.exec("COMMIT");
    return r;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

module.exports = { db, getSettings, tx, DATA_DIR };
