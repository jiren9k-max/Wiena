// Kreira admin račun (ili postojećem korisniku da admin pristup i novu lozinku).
// Upotreba: npm run create-admin -- email@primjer.ba lozinka
const { db } = require("./db");
const { hashPassword } = require("./auth");

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.log("Upotreba: npm run create-admin -- email@primjer.ba lozinka   (lozinka najmanje 8 znakova)");
  process.exit(1);
}
const e = email.trim().toLowerCase();
const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(e);
if (existing) {
  db.prepare("UPDATE users SET role = 'owner', password_hash = ? WHERE id = ?").run(hashPassword(password), existing.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(existing.id); // stara prijava više ne vrijedi
  console.log(`Korisnik ${e} je sada vlasnik (lozinka promijenjena).`);
} else {
  db.prepare("INSERT INTO users(email, password_hash, first_name, last_name, role) VALUES (?, ?, 'Admin', '', 'owner')").run(e, hashPassword(password));
  console.log(`Vlasnik (admin) račun ${e} je kreiran.`);
}
