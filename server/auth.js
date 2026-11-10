// Lozinke (scrypt), sesije (HttpOnly kolačić) i zaštita od pogađanja lozinke
const crypto = require("crypto");
const { db } = require("./db");

db.exec(`CREATE TABLE IF NOT EXISTS password_resets (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
)`);

const SESSION_DAYS = 30;
const COOKIE = "sid";
const SECURE = process.env.COOKIE_SECURE === "1"; // uključiti kad sajt radi na HTTPS-u

function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
function verifyPassword(pw, stored) {
  const [, saltHex, hashHex] = String(stored).split("$");
  if (!saltHex || !hashHex) return false;
  const hash = crypto.scryptSync(pw, Buffer.from(saltHex, "hex"), 64);
  return crypto.timingSafeEqual(hash, Buffer.from(hashHex, "hex"));
}

function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || "").split(";")) {
    const i = part.indexOf("=");
    if (i <= 0) continue;
    try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* neispravan kolačić se ignoriše */ }
  }
  return out;
}

function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + SESSION_DAYS * 864e5;
  db.prepare("INSERT INTO sessions(token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expires);
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${SECURE ? "; Secure" : ""}`);
}
function destroySession(req, res) {
  const token = parseCookies(req)[COOKIE];
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
function currentUser(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  const row = db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?`).get(token, Date.now());
  return row || null;
}
const publicUser = (u) => u && ({
  id: u.id, email: u.email, first_name: u.first_name, last_name: u.last_name,
  phone: u.phone, address: u.address, city: u.city, zip: u.zip, role: u.role,
});

// Najviše 10 neuspjelih prijava po IP adresi u 15 minuta
const attempts = new Map();
function loginAllowed(ip) {
  const a = attempts.get(ip);
  if (!a || a.reset < Date.now()) return true;
  return a.count < 10;
}
function loginFailed(ip) {
  const a = attempts.get(ip);
  if (!a || a.reset < Date.now()) attempts.set(ip, { count: 1, reset: Date.now() + 15 * 6e4 });
  else a.count++;
}

function createResetToken(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("DELETE FROM password_resets WHERE user_id = ?").run(userId);
  db.prepare("INSERT INTO password_resets(token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, Date.now() + 3600e3);
  return token;
}
function consumeResetToken(token) {
  const row = db.prepare("SELECT * FROM password_resets WHERE token = ? AND expires_at > ?").get(String(token), Date.now());
  if (row) db.prepare("DELETE FROM password_resets WHERE token = ?").run(row.token);
  return row;
}

// Čišćenje isteklih sesija i starih pokušaja prijave
setInterval(() => {
  for (const [ip, a] of attempts) if (a.reset < Date.now()) attempts.delete(ip);
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  db.prepare("DELETE FROM password_resets WHERE expires_at < ?").run(Date.now());
}, 3600e3).unref();

module.exports = {
  hashPassword, verifyPassword, createSession, destroySession, currentUser, publicUser,
  loginAllowed, loginFailed, createResetToken, consumeResetToken,
};
