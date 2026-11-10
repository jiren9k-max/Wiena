// Pravi DEMO verziju shopa u folderu demo/ (za Vercel ili bilo koji statički hosting).
// Katalog se uzima iz TRENUTNE baze (izmjene iz admina, sakriveni proizvodi, cijene, postavke…).
// Narudžba, vaučer (DEMO10) i newsletter se u demu simuliraju u browseru — ništa se ne šalje.
// Pokretanje: npm run demo   (pa commit + push → Vercel objavi novu verziju)
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "demo");
const pub = path.join(root, "public");
const { getSettings, DATA_DIR } = require("../server/db");
const catalog = require("../server/catalog");

// Katalog kao statična skripta na istoj adresi kao na serveru (/api/catalog.js)
const data = JSON.parse(catalog.get().js.replace(/^window\.WIENA_DATA = /, "").replace(/;\s*$/, ""));
data.settings.demo = true;
data.settings.bank_details = getSettings().bank_details || "";

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(pub, out, { recursive: true, filter: (src) => !src.startsWith(path.join(pub, "admin")) });
fs.mkdirSync(path.join(out, "api"), { recursive: true });
fs.mkdirSync(path.join(out, "admin"), { recursive: true });
fs.writeFileSync(path.join(out, "api", "catalog.js"), "window.WIENA_DATA = " + JSON.stringify(data).replace(/</g, "\\u003c") + ";\n");
fs.copyFileSync(path.join(__dirname, "demo", "demo.js"), path.join(out, "js", "demo.js"));
fs.copyFileSync(path.join(__dirname, "demo", "admin.html"), path.join(out, "admin", "index.html"));

// demo.js se učitava prije svega ostalog na svakoj stranici (presreće pozive na /api)
const MARK = '<script src="/api/catalog.js"></script>';
for (const f of fs.readdirSync(out).filter((x) => x.endsWith(".html"))) {
  const file = path.join(out, f);
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes(MARK)) throw new Error(`${f}: nije pronađena skripta kataloga`);
  fs.writeFileSync(file, html.replace(MARK, `<script src="js/demo.js"></script>\n${MARK}`));
}
fs.appendFileSync(path.join(out, "css", "style.css"), "\n/* demo */\n.demo-note { margin-top: 18px; padding: 12px 16px; background: #efe4d0; font-size: 14px; max-width: 640px; }\n");

// Vlastite slike dodane u adminu idu uz demo
let uploads = 0;
for (const p of data.products) for (const u of p.images || []) {
  if (!String(u).startsWith("/uploads/")) continue;
  const src = path.join(DATA_DIR, "uploads", path.basename(u));
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(path.join(out, "uploads"), { recursive: true });
  fs.copyFileSync(src, path.join(out, "uploads", path.basename(u)));
  uploads++;
}

const size = fs.readdirSync(out, { recursive: true }).reduce((s, f) => { const st = fs.statSync(path.join(out, f)); return st.isFile() ? s + st.size : s; }, 0);
console.log(`Demo je napravljen u folderu demo/ — ${data.products.length} proizvoda, ${uploads} vlastitih slika, ${(size / 1024 / 1024).toFixed(1)} MB.`);
