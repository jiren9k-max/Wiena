// WIENA web shop — server
// Pokretanje: npm start   (ili: node server/server.js)
const http = require("http");
const fs = require("fs");
const path = require("path");
const { db, DATA_DIR } = require("./db");
const auth = require("./auth");
const { HttpError, sendJson, router } = require("./http");

const PORT = +process.env.PORT || 5174;
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
const PUBLIC = path.join(__dirname, "..", "public");
const UPLOADS = path.join(DATA_DIR, "uploads");

// Prvo pokretanje: prazna baza se napuni početnim katalogom (server/seed-catalog.json)
if (db.prepare("SELECT count(*) n FROM products").get().n === 0) {
  console.log("Baza je prazna — uvozim početni katalog…");
  console.log(`Uvezeno proizvoda: ${require("./seed").importSeed()}`);
}

// Admin račun iz varijabli okruženja (ADMIN_EMAIL + ADMIN_PASSWORD) — pravi se samo ako još nijedan admin ne postoji
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && !db.prepare("SELECT 1 FROM users WHERE role = 'owner'").get()) {
  if (process.env.ADMIN_PASSWORD.length < 8) console.warn("⚠ ADMIN_PASSWORD mora imati najmanje 8 znakova — admin nije napravljen.");
  else {
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) db.prepare("UPDATE users SET role = 'owner', password_hash = ? WHERE id = ?").run(auth.hashPassword(process.env.ADMIN_PASSWORD), existing.id);
    else db.prepare("INSERT INTO users(email, password_hash, first_name, role) VALUES (?, ?, 'Admin', 'owner')").run(email, auth.hashPassword(process.env.ADMIN_PASSWORD));
    console.log(`Admin račun ${email} je napravljen.`);
  }
}

// Automatski dnevni backup baze u data/backups (čuva se zadnjih 14 dana)
require("./backup").startAutoBackups();

// Integracije: API v1 (dnevnik poziva) i webhookovi (slanje i ponovni pokušaji)
const apiV1 = require("./api-v1");
apiV1.start();
require("./webhooks").start();

const r = router();
require("./shop-api")(r);
require("./admin-api")(r);

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".ico": "image/x-icon", ".txt": "text/plain" };

function serveFile(res, file, cache) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Nije pronađeno"); }
    const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type + (/^text|javascript|json/.test(type) ? "; charset=utf-8" : ""), "Content-Length": st.size, "Cache-Control": cache });
    fs.createReadStream(file).on("error", () => res.destroy()).pipe(res);
  });
}

function safeJoin(root, urlPath) {
  if (urlPath.includes("\0")) return null;
  const file = path.join(root, urlPath);
  return file.startsWith(root + path.sep) || file === root ? file : null;
}

function clientIp(req) {
  // Iza vlastitog proxyja (TRUST_PROXY=1) uzima se adresa koju je dodao proxy (zadnja u nizu) — prve vrijednosti šalje klijent i mogu biti lažne
  if (TRUST_PROXY && req.headers["x-forwarded-for"]) return req.headers["x-forwarded-for"].split(",").pop().trim();
  return req.socket.remoteAddress;
}

async function handle(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  let url, pathname;
  try {
    url = new URL(req.url, "http://localhost");
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    return res.end();
  }

  // Javni API za vanjske sisteme (prijava API ključem, ne kolačićem)
  if (url.pathname === "/api/v1" || url.pathname.startsWith("/api/v1/")) return apiV1.handle(req, res, url, clientIp(req));

  if (pathname.startsWith("/api/")) {
    const ctx = { req, res, params: {}, query: Object.fromEntries(url.searchParams), ip: clientIp(req), user: null };
    try {
      // Rute se upoređuju sa nedekodiranom putanjom; parametri se dekodiraju tačno jednom (u routeru)
      const m = r.match(req.method, url.pathname);
      if (!m) throw new HttpError(404, "Nepostojeća adresa.");
      ctx.params = m.params;
      ctx.user = auth.currentUser(req);
      for (const h of m.handlers) await h(ctx);
    } catch (e) {
      if (!(e instanceof HttpError)) console.error(e);
      if (!res.headersSent) sendJson(res, e.status || 500, { error: e instanceof HttpError ? e.message : "Greška na serveru. Pokušajte ponovo.", ...(e.extra || {}) });
    }
    return;
  }

  if (pathname.startsWith("/uploads/")) {
    const file = safeJoin(UPLOADS, pathname.slice("/uploads/".length));
    return file ? serveFile(res, file, "public, max-age=31536000, immutable") : res.writeHead(403).end();
  }
  if (pathname === "/admin") { res.writeHead(301, { Location: "/admin/" }); return res.end(); }
  const file = safeJoin(PUBLIC, pathname.endsWith("/") ? pathname + "index.html" : pathname);
  if (!file) { res.writeHead(403); return res.end(); }
  serveFile(res, file, "no-cache");
}

const server = http.createServer((req, res) => {
  // Nijedan zahtjev ne smije srušiti server
  handle(req, res).catch((e) => {
    console.error(e);
    if (!res.headersSent) { res.writeHead(500); res.end(); } else res.destroy();
  });
});
process.on("unhandledRejection", (e) => console.error("[unhandledRejection]", e));

server.listen(PORT, () => {
  const admins = db.prepare("SELECT count(*) n FROM users WHERE role = 'owner'").get().n;
  console.log(`Shop:  http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin/`);
  if (!admins) console.log("⚠ Nema admin računa. Napravite ga: npm run create-admin -- email@primjer.ba lozinka");
  if (process.env.NODE_ENV === "production") {
    if (!process.env.SITE_URL) console.warn("⚠ SITE_URL nije postavljen — linkovi i logo u emailovima će pokazivati na localhost.");
    if (process.env.COOKIE_SECURE !== "1") console.warn("⚠ COOKIE_SECURE=1 nije postavljen — obavezno kad sajt radi na HTTPS-u.");
  }
});
