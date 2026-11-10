# WIENA — web shop za prirodni tekstil

Firma: **Wiena Group d.o.o.**, Kurta Schorka 24A, 71000 Sarajevo · JIB 4203027710002

Shop (bosanski + engleski), narudžbe, zaliha, emailovi i admin panel za upravljanje svime.
Katalog: 100 proizvoda (80 tekstil, 20 dom i mirisi), cijene u KM (engleska verzija u €).
Online plaćanje karticom nije uključeno — kupci plaćaju pouzećem ili uplatom na račun.

Potrebno: **Node.js 22.5 ili noviji** (baza podataka je ugrađena, nije potreban MySQL).

## Pokretanje

**Najlakše (Windows):** dvoklik na **`Pokreni shop.bat`**. Shop se otvori u browseru;
prozor ostavite otvoren dok koristite shop, a zatvorite ga kad želite ugasiti shop.

Ili ručno u terminalu (u ovom folderu):

    npm install
    npm start

- Shop: http://localhost:5174
- Admin: http://localhost:5174/admin/

(Raca shop koristi port 5173, pa oba mogu raditi istovremeno.)

### Admin račun

Testni račun za lokalno testiranje je u `data/admin-test-login.txt`.
Pravi račun vlasnika (ista komanda mijenja i zaboravljenu lozinku):

    npm run create-admin -- vas@email.ba vasa-lozinka

## Admin panel

Admin je **samo za vlasnika** — nema uloga zaposlenika. Prijava postoji samo na /admin/ (kupci naručuju bez računa).
Vanjski programi (knjigovodstvo, ERP…) se ne prijavljuju kao osobe nego dobiju svoj API ključ (vidi Integracije).

- **Pregled** — prodaja danas / 30 dana, nove narudžbe, najprodavaniji proizvodi, rasprodano.
- **Narudžbe** — statusi (nova → potvrđena → poslana → isporučena / otkazana), email kupcu pri promjeni, bilješke, štampa, CSV.
- **Proizvodi** — naziv, opis, boja, materijal, detalji i njega na **bosanskom i engleskom**; cijena u KM (€ se računa sama ili se upiše ručno);
  stara cijena za akciju; zaliha; veličine; oznaka (Novo, Najprodavanije, Ograničeno); slike (upload ili link).
  Svaka boja je zaseban proizvod sa svojom šifrom i zalihom; boje istog modela su povezane („Dodaj novu boju”).
  Grupne izmjene: sakrij/prikaži, popust %, zaliha, premjesti u kategoriju.
- **Kategorije** — nazivi i opisi BS/EN, prostorija, redoslijed u meniju.
- **Kupci**, **Poruke**, **Newsletter** (prijave sa sajta), **Vaučeri** (kodovi za popust).
- **Aktivnosti** — ko je šta promijenio.
- **Backup**, **Postavke** (kontakt, adresa studija, dostava, preuzimanje u studiju, podaci za uplatu, SMTP).

## Integracije (knjigovodstvo, ERP, fiskalizacija, kurirske službe…)

Vanjski sistemi se povezuju preko API-ja `/api/v1` i webhookova — **Admin → API i integracije** (ključevi sa ovlastima,
webhookovi za novu narudžbu i promjenu statusa, potpisani HMAC-SHA256) i **Admin → API dokumentacija**
(sve adrese, primjeri, dugme *Isprobaj*). OpenAPI: `/api/v1/openapi.json`.
Vanjski sistemi mogu pristupiti tek kad je shop objavljen na internetu — postavite `SITE_URL`.

## Emailovi

Dok SMTP nije podešen (Admin → Postavke), emailovi se ne šalju nego se čuvaju kao HTML u `data/outbox/`.
Kupac dobija email na jeziku na kojem je naručio.

## Podaci i backup

Sve je u folderu `data/` (ne ide u git): `shop.db` (baza), `uploads/` (slike iz admina), `outbox/`, `backups/`.

- **Dvoklik na `Napravi backup.bat`** → .zip u **Desktop\Wiena-Backups**.
- Shop sam pravi **dnevni backup** u `data/backups/` (zadnjih 14 dana), a ako je instaliran Google Drive for desktop,
  i u **My Drive\WIENA Shop\Backups**.
- Admin → Backup: preuzimanje i vraćanje iz backupa.

Pri prvom pokretanju (prazna baza) shop uveze početni katalog iz `server/seed-catalog.json`.

## Objavljivanje na internetu

Isto kao Raca shop (Railway ili VPS): volume za `/data`, varijable `DATA_DIR`, `NODE_ENV=production`, `COOKIE_SECURE=1`,
`TRUST_PROXY=1`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SITE_URL`.

## Struktura

- `server/` — server, baza, API, emailovi, backup
- `public/` — shop (`index.html`, `shop.html`, `product.html`, `checkout.html`, `css/`, `js/`) i admin (`public/admin/`)
- `tools/backup.js` — backup iz komandne linije
- `data/` — baza, slike, emailovi (lokalno)

Fotografije: Unsplash (besplatna licenca); vlastite fotografije se dodaju po proizvodu u adminu.

## Demo verzija (Vercel)

Folder `demo/` je verzija shopa koja radi **bez servera** (za prezentaciju): katalog iz trenutne baze,
a narudžba, vaučer `DEMO10` i newsletter se simuliraju u browseru posjetioca — ništa se ne šalje.
Admin panel u demu nije dostupan (samo informativna stranica).

- Osvježavanje dema iz trenutnih podataka: `npm run demo`, pa commit + push (Vercel sam objavi novu verziju).
- Vercel: **Add New → Project → Import** repozitorij **Wiena** → Framework: **Other**, bez build komande → Deploy
  (postavke su već u `vercel.json`: objavljuje se folder `demo`).
