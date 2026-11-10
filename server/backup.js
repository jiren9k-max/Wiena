// Backup i vraćanje (restore) cijelog shopa: baza + slike dodane u adminu, u jednom .zip fajlu.
// Koristi ga admin (Backup stranica), automatski dnevni backup i "Napravi backup.bat".
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { DatabaseSync } = require("node:sqlite");
const { db, DATA_DIR } = require("./db");

const UPLOADS = path.join(DATA_DIR, "uploads");
const AUTO_DIR = path.join(DATA_DIR, "backups");
const KEEP_AUTO = 14;

// Tabele koje se vraćaju iz backupa (sesije i linkovi za lozinku se namjerno ne vraćaju)
const TABLES = ["settings", "categories", "products", "users", "orders", "order_items", "messages", "newsletter", "vouchers", "activity_log", "api_keys", "webhooks"];
const REQUIRED = ["products", "users", "orders", "settings"];
// Backup napravljen prije uvođenja ovih tabela ne briše postojeće API ključeve i webhookove
const KEEP_IF_MISSING = new Set(["api_keys", "webhooks"]);

const stamp = () => new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");

// Konzistentna kopija baze (radi i dok shop radi)
function snapshotDb(file) {
  fs.rmSync(file, { force: true });
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  return file;
}

/* ---------- Minimalni ZIP (bez dodatnih paketa) ---------- */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeZip(files) {
  const parts = [], central = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, "utf8");
    const raw = f.data;
    const deflated = zlib.deflateRawSync(raw, { level: 6 });
    const useDeflate = deflated.length < raw.length;
    const body = useDeflate ? deflated : raw;
    const crc = crc32(raw);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); // UTF-8 nazivi
    local.writeUInt16LE(useDeflate ? 8 : 0, 8); local.writeUInt32LE(0, 10);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(body.length, 18); local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
    parts.push(local, name, body);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(useDeflate ? 8 : 0, 10); cen.writeUInt32LE(0, 12);
    cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(body.length, 20); cen.writeUInt32LE(raw.length, 24);
    cen.writeUInt16LE(name.length, 28); cen.writeUInt32LE(offset, 42);
    central.push(cen, name);
    offset += 30 + name.length + body.length;
  }
  const cenBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cenBuf.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cenBuf, end]);
}

function readZip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("Fajl nije ispravan backup (.zip).");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("Oštećen backup fajl.");
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32), localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(localOff + 26), lExtraLen = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const body = buf.subarray(start, start + size);
    out.push({ name, data: method === 8 ? zlib.inflateRawSync(body) : method === 0 ? Buffer.from(body) : null });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

/* ---------- Pravljenje backupa ---------- */
function createBackupZip() {
  const tmp = path.join(DATA_DIR, `.backup-${process.pid}-${Date.now()}.db`);
  try {
    snapshotDb(tmp);
    const files = [{ name: "shop.db", data: fs.readFileSync(tmp) }];
    if (fs.existsSync(UPLOADS)) for (const f of fs.readdirSync(UPLOADS)) {
      const full = path.join(UPLOADS, f);
      if (fs.statSync(full).isFile()) files.push({ name: "uploads/" + f, data: fs.readFileSync(full) });
    }
    const counts = db.prepare("SELECT (SELECT count(*) FROM products) products, (SELECT count(*) FROM orders) orders, (SELECT count(*) FROM users) users").get();
    files.push({ name: "PROCITAJ.txt", data: Buffer.from(
      `WIENA web shop (Wiena Group d.o.o.) — backup\r\nNapravljeno: ${new Date().toLocaleString("bs-BA")}\r\n` +
      `Proizvoda: ${counts.products}, narudžbi: ${counts.orders}, korisnika: ${counts.users}, slika: ${files.length - 1}\r\n\r\n` +
      `Vraćanje: Admin → Backup → "Vrati iz backupa" i odaberite ovaj .zip fajl.\r\n`, "utf8") });
    return { zip: makeZip(files), name: `wiena-backup-${stamp()}.zip`, counts };
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/* ---------- Vraćanje iz backupa ---------- */
// Prima .zip (iz ovog shopa) ili samo .db fajl. Zamjenjuje sve podatke u bazi; slike iz backupa se dodaju.
function restoreBackup(buf) {
  let dbBuf, uploads = [];
  if (buf.subarray(0, 16).toString("latin1") === "SQLite format 3\u0000") dbBuf = buf;
  else {
    const entries = readZip(buf);
    dbBuf = entries.find((e) => e.name === "shop.db")?.data;
    uploads = entries.filter((e) => e.name.startsWith("uploads/") && e.data);
  }
  if (!dbBuf) throw new Error("U fajlu nema baze shopa (shop.db).");

  const tmp = path.join(DATA_DIR, `.restore-${process.pid}-${Date.now()}.db`);
  fs.writeFileSync(tmp, dbBuf);
  try {
    // Provjera da je to zaista baza ovog shopa
    let src;
    try { src = new DatabaseSync(tmp, { readOnly: true }); } catch { throw new Error("Fajl nije ispravna baza shopa."); }
    const srcTables = new Set(src.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((t) => t.name));
    const colsOf = (conn, t) => conn.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
    const srcCols = Object.fromEntries(TABLES.filter((t) => srcTables.has(t)).map((t) => [t, colsOf(src, t)]));
    src.close();
    const missing = REQUIRED.filter((t) => !srcTables.has(t));
    if (missing.length) throw new Error("Ovo nije backup ovog shopa (nedostaju podaci: " + missing.join(", ") + ").");

    // Zamjena podataka: tabela po tabela, samo kolone koje postoje u obje baze (radi i sa starijim backupom)
    db.exec("PRAGMA foreign_keys = OFF");
    try {
      db.exec(`ATTACH DATABASE '${tmp.replace(/'/g, "''")}' AS src`);
      try {
        db.exec("BEGIN");
        try {
          for (const t of TABLES) {
            if (!srcCols[t] && KEEP_IF_MISSING.has(t)) continue;
            if (t === "webhooks") db.exec("DELETE FROM main.webhook_deliveries"); // isporuke pripadaju starim webhookovima
            db.exec(`DELETE FROM main.${t}`);
            if (!srcCols[t]) continue;
            const mine = new Set(colsOf(db, t));
            const cols = srcCols[t].filter((c) => mine.has(c)).join(", ");
            db.exec(`INSERT INTO main.${t} (${cols}) SELECT ${cols} FROM src.${t}`);
          }
          db.exec("DELETE FROM sessions; DELETE FROM password_resets;"); // svi se ponovo prijavljuju
          db.exec("COMMIT");
        } catch (e) { db.exec("ROLLBACK"); throw e; }
      } finally { db.exec("DETACH DATABASE src"); }
    } finally { db.exec("PRAGMA foreign_keys = ON"); }
  } finally {
    fs.rmSync(tmp, { force: true });
  }

  // Slike iz backupa (samo sigurni nazivi fajlova)
  fs.mkdirSync(UPLOADS, { recursive: true });
  let restoredImages = 0;
  for (const u of uploads) {
    const name = path.basename(u.name);
    if (!/^[\w.-]+\.(jpe?g|png|webp)$/i.test(name)) continue;
    fs.writeFileSync(path.join(UPLOADS, name), u.data);
    restoredImages++;
  }
  const counts = db.prepare("SELECT (SELECT count(*) FROM products) products, (SELECT count(*) FROM orders) orders, (SELECT count(*) FROM users) users").get();
  return { ...counts, images: restoredImages };
}

/* ---------- Google Drive (ili drugi cloud folder) ---------- */
// Ako je instaliran "Google Drive for desktop", backupi se kopiraju i u "My Drive\WIENA Shop\Backups"
// pa ih Google Drive sam pošalje u cloud. Drugi folder se može zadati sa BACKUP_CLOUD_DIR.
function cloudBackupDir() {
  if (process.env.BACKUP_CLOUD_DIR) return process.env.BACKUP_CLOUD_DIR;
  if (process.platform !== "win32") return null;
  for (const letter of "DEFGHIJKLMNOPQRSTUVWXYZ") {
    for (const name of ["My Drive", "Moj disk"]) {
      const drive = `${letter}:\\${name}`;
      try { if (fs.statSync(drive).isDirectory()) return path.join(drive, "WIENA Shop", "Backups"); } catch { /* nema */ }
    }
  }
  return null;
}

// Kopira slike proizvoda koje još ne postoje u odredištu (prvi put sve, kasnije samo nove)
function syncFolder(from, to) {
  if (!fs.existsSync(from)) return 0;
  fs.mkdirSync(to, { recursive: true });
  const have = new Set(fs.readdirSync(to));
  let copied = 0;
  for (const f of fs.readdirSync(from)) {
    if (have.has(f) || f.endsWith(".part")) continue;
    fs.copyFileSync(path.join(from, f), path.join(to, f));
    copied++;
  }
  return copied;
}

/* ---------- Automatski dnevni backup ---------- */
function autoBackup() {
  try {
    fs.mkdirSync(AUTO_DIR, { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    const file = path.join(AUTO_DIR, `auto-${day}.db`);
    if (!fs.existsSync(file)) {
      snapshotDb(file);
      for (const b of listAutoBackups().slice(KEEP_AUTO)) fs.rmSync(path.join(AUTO_DIR, b.name), { force: true });
      console.log(`[backup] Automatski backup: ${path.basename(file)}`);
    }
    // Kopija u Google Drive (kompletan .zip sa slikama iz admina), čuva se zadnjih 30
    const cloud = cloudBackupDir();
    if (cloud) {
      const dir = path.join(cloud, "Automatski");
      const target = path.join(dir, `wiena-auto-${day}.zip`);
      if (!fs.existsSync(target)) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(target, createBackupZip().zip);
        const old = fs.readdirSync(dir).filter((f) => /^wiena-auto-\d{4}-\d{2}-\d{2}\.zip$/.test(f)).sort().reverse().slice(30);
        for (const f of old) fs.rmSync(path.join(dir, f), { force: true });
        console.log(`[backup] Kopija u Google Drive: ${target}`);
      }
    }
  } catch (e) {
    console.error("[backup] Greška:", e.message);
  }
}
function listAutoBackups() {
  if (!fs.existsSync(AUTO_DIR)) return [];
  return fs.readdirSync(AUTO_DIR).filter((f) => /^auto-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort().reverse()
    .map((name) => ({ name, size: fs.statSync(path.join(AUTO_DIR, name)).size, date: name.slice(5, 15) }));
}
function startAutoBackups() {
  autoBackup();
  setInterval(autoBackup, 3600e3).unref(); // provjera svaki sat; pravi se jednom dnevno
}

module.exports = { createBackupZip, restoreBackup, listAutoBackups, startAutoBackups, AUTO_DIR, makeZip, readZip, cloudBackupDir, syncFolder };
