// Pravi kompletan backup shopa (baza + slike dodane u adminu) kao .zip — radi i dok shop radi i kad je ugašen.
// Sačuva ga na Desktop\Wiena-Backups, a ako postoji Google Drive (My Drive\WIENA Shop) i tamo.
// Pokretanje: node tools/backup.js [folder]
const fs = require("fs");
const path = require("path");
const os = require("os");
const { createBackupZip, cloudBackupDir } = require("../server/backup");

const dir = process.argv[2] || path.join(os.homedir(), "Desktop", "Wiena-Backups");
fs.mkdirSync(dir, { recursive: true });
const { zip, name, counts } = createBackupZip();
const file = path.join(dir, name);
fs.writeFileSync(file, zip);

console.log("");
console.log("  Backup je napravljen:");
console.log("  " + file);
console.log(`  (${counts.products} proizvoda, ${counts.orders} narudžbi, ${counts.users} korisnika, ${(zip.length / 1024 / 1024).toFixed(1)} MB)`);

const cloud = cloudBackupDir();
if (cloud) {
  try {
    fs.mkdirSync(cloud, { recursive: true });
    fs.writeFileSync(path.join(cloud, name), zip);
    console.log("");
    console.log("  Kopija u Google Drive:");
    console.log("  " + path.join(cloud, name));
    console.log("  Google Drive je sam šalje u cloud (ikonica u traci pored sata).");
  } catch (e) {
    console.log("  Google Drive kopija NIJE uspjela: " + e.message);
  }
} else {
  console.log("");
  console.log("  (Google Drive for desktop nije pronađen — backup je samo na ovom računaru.)");
}
console.log("");
