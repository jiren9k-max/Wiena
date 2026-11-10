// Opis javnog API-ja (v1): iz ovoga se pravi dokumentacija u adminu i OpenAPI fajl (/api/v1/openapi.json)
const TIMEZONE = process.env.SHOP_TIMEZONE || "Europe/Sarajevo";

const SCOPES = {
  "orders:read": "Čitanje narudžbi i stavki (uključuje ime, email, telefon i adresu kupca)",
  "orders:write": "Promjena statusa narudžbe i dodavanje interne bilješke",
  "products:read": "Čitanje proizvoda, cijena i zaliha",
  "products:write": "Izmjena cijene, akcijske cijene, zalihe i vidljivosti proizvoda",
  "customers:read": "Čitanje liste kupaca iz narudžbi (lični podaci)",
  "reports:read": "Zbirni izvještaji o prodaji (bez ličnih podataka)",
};

// Gotovi izbori ovlasti u formi za novi ključ
const PRESETS = {
  finance: { label: "Finansije / knjigovodstvo", scopes: ["orders:read", "reports:read"] },
  reports: { label: "Samo izvještaji (bez ličnih podataka)", scopes: ["reports:read"] },
  erp: { label: "ERP / skladište (zalihe i cijene)", scopes: ["products:read", "products:write", "orders:read", "orders:write"] },
  readonly: { label: "Sve samo za čitanje", scopes: ["orders:read", "products:read", "customers:read", "reports:read"] },
};

const ERRORS = [
  [400, "invalid_parameter", "Neispravan parametar u adresi (npr. pogrešan datum ili status)."],
  [400, "invalid_body", "Neispravno tijelo zahtjeva (nepoznato polje, pogrešan tip)."],
  [401, "missing_key", "Zahtjev nema API ključ."],
  [401, "invalid_key", "Ključ ne postoji ili je opozvan."],
  [401, "key_expired", "Ključu je istekao rok važenja."],
  [403, "insufficient_scope", "Ključ nema potrebnu ovlast za ovu adresu."],
  [403, "ip_not_allowed", "Zahtjev dolazi sa IP adrese koja nije dozvoljena za ovaj ključ."],
  [404, "not_found", "Narudžba, proizvod ili adresa ne postoji."],
  [405, "method_not_allowed", "Pogrešna HTTP metoda za ovu adresu."],
  [409, "insufficient_stock", "Otkazanu narudžbu nije moguće ponovo aktivirati — nema dovoljno na zalihi."],
  [415, "unsupported_media_type", "Tijelo zahtjeva mora biti JSON (Content-Type: application/json)."],
  [429, "rate_limited", "Previše zahtjeva u minuti. Sačekajte broj sekundi iz zaglavlja Retry-After."],
  [500, "server_error", "Neočekivana greška na serveru."],
];

const ORDER_EXAMPLE = {
  id: 128, number: "WN-2026-00128", status: "potvrdjena", status_label: "Potvrđena",
  created_at: "2026-11-08T09:14:22Z", updated_at: "2026-11-08T10:02:05Z", currency: "BAM",
  customer: { first_name: "Amir", last_name: "Hodžić", email: "amir@primjer.ba", phone: "061 123 456" },
  delivery: { method: "posta", label: "Dostava na adresu", address: "Zmaja od Bosne 12", city: "Sarajevo", zip: "71000" },
  payment: { method: "racun", label: "Uplata na račun" },
  voucher_code: "DOBRODOSLI10", subtotal: 455, discount: 45.5, shipping: 0, total: 409.5,
  customer_note: "", internal_note: "",
  items: [
    { code: "WN-001", name: "Navlaka za poplun od kamenom pranog lana", colour: "Zob", size: "Double", price: 225, qty: 1, total: 225 },
    { code: "WN-019", name: "Peškir od turskog pamuka", colour: "Kreda", size: "Bath 70×140", price: 115, qty: 2, total: 230 },
  ],
};
const PRODUCT_EXAMPLE = {
  id: 1, code: "WN-001", name: "Navlaka za poplun od kamenom pranog lana", name_en: "Stonewashed Linen Duvet Cover",
  family: "stonewashed-linen-duvet-cover", colour: "Zob", sizes: ["Single", "Double", "King", "Super King"], fibre: "Linen",
  category: { id: 1, name: "Posteljina", slug: "bed-linen" },
  price: 450, old_price: null, on_sale: false, stock: 19, in_stock: true, active: true, is_new: false,
  url: "https://www.wiena.ba/product.html?id=1", image: "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2",
  created_at: "2026-11-10T13:57:10Z", updated_at: "2026-11-10T14:00:00Z",
};
const PAGINATION_EXAMPLE = { page: 1, per_page: 50, total: 1, pages: 1 };

const P = {
  page: ["page", "broj", "Stranica (od 1). Zadano 1."],
  per_page: ["per_page", "broj", "Broj zapisa po stranici, 1–200. Zadano 50."],
  format: ["format", "json | csv", "csv = preuzimanje svih rezultata (do 50.000) kao CSV fajla, bez stranica."],
  from: ["from", "datum ili vrijeme", "Narudžbe napravljene od (uključivo). 2026-11-01 ili 2026-11-01T00:00:00Z."],
  to: ["to", "datum ili vrijeme", "Narudžbe napravljene do (uključivo). Datum bez vremena uključuje cijeli dan."],
  updated_since: ["updated_since", "datum ili vrijeme", "Samo zapisi izmijenjeni od tog trenutka — za redovnu sinhronizaciju."],
  status: ["status", "tekst", "Jedan ili više statusa odvojenih zarezom: nova, potvrdjena, poslana, isporucena, otkazana."],
  payment: ["payment", "tekst", "pouzece ili racun."],
  email: ["email", "tekst", "Samo narudžbe sa ovim emailom kupca."],
  sort: ["sort", "tekst", "id (zadano, od najstarije), -id (od najnovije), updated_at, -updated_at."],
};

const ENDPOINTS = [
  {
    id: "ping", method: "GET", path: "/api/v1", scope: null, title: "Provjera ključa",
    desc: "Provjerava da li ključ radi i vraća njegov naziv, ovlasti i vrijeme servera. Dobro za prvi test veze.",
    response: { data: { api_version: 1, shop: "Wiena Group d.o.o.", key: { name: "Knjigovodstvo", prefix: "wnk_Ab12Cd34", scopes: ["orders:read", "reports:read"], expires_at: null }, server_time: "2026-11-08T10:00:00.000Z", timezone: "Europe/Sarajevo", currency: "BAM", rate_limit_per_minute: 120 } },
  },
  {
    id: "orders", method: "GET", path: "/api/v1/orders", scope: "orders:read", title: "Lista narudžbi", csv: true,
    desc: "Narudžbe sa stavkama, kupcem, dostavom, plaćanjem i iznosima. Za redovnu sinhronizaciju koristite updated_since sa vremenom zadnjeg uspješnog preuzimanja.",
    params: [P.from, P.to, P.updated_since, P.status, P.payment, P.email, P.sort, P.page, P.per_page, P.format],
    query: "?from=2026-11-01&to=2026-11-30&status=potvrdjena,poslana",
    response: { data: [ORDER_EXAMPLE], pagination: PAGINATION_EXAMPLE },
  },
  {
    id: "order", method: "GET", path: "/api/v1/orders/:ref", scope: "orders:read", title: "Jedna narudžba",
    desc: "Narudžba po broju (WN-2026-00128) ili internom ID-u (128).",
    params: [[":ref", "tekst", "Broj narudžbe ili ID (u adresi)."]],
    sample: "/api/v1/orders/WN-2026-00128",
    response: { data: ORDER_EXAMPLE },
  },
  {
    id: "order-update", method: "PATCH", path: "/api/v1/orders/:ref", scope: "orders:write", title: "Promjena statusa narudžbe",
    desc: "Mijenja status (npr. kad knjigovodstvo potvrdi uplatu) i/ili dodaje internu bilješku. Radi isto kao u adminu: otkazivanje vraća artikle na zalihu, kupac dobija email o promjeni statusa (osim ako je notify: false). Bilješka se dodaje na postojeće, ne briše ih. Svaka izmjena se vidi u Admin → Aktivnosti kao \"API: <naziv ključa>\".",
    params: [[":ref", "tekst", "Broj narudžbe ili ID (u adresi)."]],
    body: [
      ["status", "tekst", "nova, potvrdjena, poslana, isporucena ili otkazana."],
      ["notify", "true / false", "Poslati kupcu email o promjeni statusa. Zadano true."],
      ["internal_note", "tekst", "Interna bilješka (do 1000 znakova) — vidi je samo vlasnik u adminu."],
    ],
    sample: "/api/v1/orders/WN-2026-00128",
    requestBody: { status: "potvrdjena", notify: true, internal_note: "Uplata primljena 08.11. (izvod br. 214)" },
    response: { data: { ...ORDER_EXAMPLE, internal_note: "[2026-11-08 · API: Knjigovodstvo] Uplata primljena 08.11. (izvod br. 214)" } },
  },
  {
    id: "order-items", method: "GET", path: "/api/v1/order-items", scope: "orders:read", title: "Stavke narudžbi (red po artiklu)", csv: true,
    desc: "Jedan red po prodanom artiklu — pogodno za uvoz u knjigovodstvo i analizu. Isti filteri kao lista narudžbi.",
    params: [P.from, P.to, P.updated_since, P.status, P.payment, P.sort, P.page, P.per_page, P.format],
    query: "?from=2026-11-01&to=2026-11-30&format=csv",
    response: { data: [{ order_number: "WN-2026-00128", order_created_at: "2026-11-08T09:14:22Z", order_status: "potvrdjena", payment: "racun", code: "WN-001", name: "Navlaka za poplun od kamenom pranog lana", colour: "Zob", size: "Double", qty: 1, price: 450, total: 450 }], pagination: PAGINATION_EXAMPLE },
  },
  {
    id: "products", method: "GET", path: "/api/v1/products", scope: "products:read", title: "Lista proizvoda", csv: true,
    desc: "Proizvodi sa cijenama i zalihom. stock: null znači da se zaliha ne prati (uvijek dostupno). Uključuje i sakrivene proizvode (active: false), osim ako filtrirate.",
    params: [
      ["q", "tekst", "Pretraga po nazivu ili šifri."],
      ["code", "tekst", "Jedna ili više šifri odvojenih zarezom (do 200)."],
      ["active", "true / false", "Samo prikazani (true) ili samo sakriveni (false)."],
      ["on_sale", "true / false", "Samo proizvodi na akciji."],
      ["category", "broj", "ID podkategorije."],
      P.updated_since, P.page, P.per_page, P.format,
    ],
    query: "?on_sale=true&per_page=100",
    response: { data: [PRODUCT_EXAMPLE], pagination: PAGINATION_EXAMPLE },
  },
  {
    id: "product", method: "GET", path: "/api/v1/products/:code", scope: "products:read", title: "Jedan proizvod",
    desc: "Proizvod po šifri. Šifre sa razmakom ili posebnim znakovima moraju biti URL-kodirane (BR 2412 → BR%202412).",
    params: [[":code", "tekst", "Šifra proizvoda (u adresi)."]],
    sample: "/api/v1/products/WN-001",
    response: { data: PRODUCT_EXAMPLE },
  },
  {
    id: "product-update", method: "PATCH", path: "/api/v1/products/:code", scope: "products:write", title: "Izmjena cijene / zalihe",
    desc: "Za sinhronizaciju sa skladištem ili ERP-om. Šaljite samo polja koja mijenjate. Ako je nova cijena jednaka ili veća od akcijske stare cijene, akcija se automatski ukida.",
    params: [[":code", "tekst", "Šifra proizvoda (u adresi)."]],
    body: [
      ["price", "broj", "Nova cijena u KM."],
      ["old_price", "broj ili null", "Stara (precrtana) cijena za akciju; mora biti veća od price. null = nije na akciji."],
      ["stock", "cijeli broj ili null", "Zaliha. null = zaliha se ne prati."],
      ["active", "true / false", "Prikazan u shopu ili sakriven."],
    ],
    sample: "/api/v1/products/WN-001",
    requestBody: { price: 139, old_price: 149, stock: 4 },
    response: { data: { ...PRODUCT_EXAMPLE, price: 139, old_price: 149, on_sale: true, stock: 4 } },
  },
  {
    id: "customers", method: "GET", path: "/api/v1/customers", scope: "customers:read", title: "Kupci", csv: true,
    desc: "Svi koji su naručili u shopu (kupci nemaju korisničke račune), grupisano po emailu. Ime, telefon i adresa su iz zadnje narudžbe; ukupna potrošnja je bez otkazanih narudžbi.",
    params: [["q", "tekst", "Pretraga po emailu, imenu, telefonu ili gradu."], ["first_order_since", "datum ili vrijeme", "Samo kupci čija je prva narudžba od tada (novi kupci)."], P.page, P.per_page, P.format],
    query: "?first_order_since=2026-11-01",
    response: { data: [{ email: "amir@primjer.ba", first_name: "Amir", last_name: "Hodžić", phone: "061 123 456", address: "Zmaja od Bosne 12", city: "Sarajevo", zip: "71000", orders_count: 3, total_spent: 642.4, first_order_at: "2026-10-30T17:20:00Z", last_order_at: "2026-11-08T09:14:22Z" }], pagination: PAGINATION_EXAMPLE },
  },
  {
    id: "report-sales", method: "GET", path: "/api/v1/reports/sales", scope: "reports:read", title: "Izvještaj o prodaji",
    desc: "Zbirni prihod po danima ili mjesecima, po načinu plaćanja, dostavi i statusu. Otkazane narudžbe nisu u prihodu (posebno u cancelled). Dani se računaju po vremenu shopa (Europe/Sarajevo).",
    params: [
      ["from", "datum", "Početak perioda (uključivo). Zadano: prije 29 dana."],
      ["to", "datum", "Kraj perioda (uključivo). Zadano: danas."],
      ["group_by", "day | month", "Grupisanje perioda. Zadano day."],
    ],
    query: "?from=2026-11-01&to=2026-11-30&group_by=day",
    response: { data: {
      from: "2026-11-01", to: "2026-11-30", timezone: "Europe/Sarajevo", currency: "BAM", group_by: "day",
      totals: { orders: 41, items: 97, subtotal: 9120.5, discount: 212.3, shipping: 315, total: 9223.2, average_order: 224.96 },
      cancelled: { orders: 2, items: 3, subtotal: 189, discount: 0, shipping: 15, total: 204 },
      by_status: { potvrdjena: { orders: 12, total: 2740 }, isporucena: { orders: 29, total: 6483.2 }, otkazana: { orders: 2, total: 204 } },
      by_payment: { pouzece: { orders: 30, items: 70, subtotal: 6400, discount: 100, shipping: 240, total: 6540 }, racun: { orders: 11, items: 27, subtotal: 2720.5, discount: 112.3, shipping: 75, total: 2683.2 } },
      by_delivery: { posta: { orders: 21, items: 50, subtotal: 4800, discount: 112.3, shipping: 315, total: 5002.7 } },
      periods: [{ period: "2026-11-01", orders: 2, items: 5, subtotal: 410, discount: 0, shipping: 15, total: 425 }],
    } },
  },
  {
    id: "report-products", method: "GET", path: "/api/v1/reports/products", scope: "reports:read", title: "Najprodavaniji proizvodi",
    desc: "Prodane količine i prihod po proizvodu u periodu (bez otkazanih narudžbi), od najvećeg prihoda.",
    params: [["from", "datum", "Početak perioda. Zadano: prije 29 dana."], ["to", "datum", "Kraj perioda. Zadano: danas."], ["limit", "broj", "Broj proizvoda, 1–1000. Zadano 50."]],
    query: "?from=2026-11-01&to=2026-11-30&limit=20",
    response: { data: { from: "2026-11-01", to: "2026-11-30", timezone: "Europe/Sarajevo", currency: "BAM", products: [{ code: "WN-001", name: "Navlaka za poplun od kamenom pranog lana", qty: 9, revenue: 1341, orders: 7 }] } },
  },
];

/* ---------- OpenAPI 3 (za Postman, Insomnia, generatore klijenata) ---------- */
function openapi(baseUrl) {
  const paths = {};
  for (const e of ENDPOINTS) {
    const p = e.path.replace(/:(\w+)/g, "{$1}");
    const parameters = (e.params || []).map(([name, type, desc]) => name.startsWith(":")
      ? { name: name.slice(1), in: "path", required: true, description: desc, schema: { type: "string" } }
      : { name, in: "query", required: false, description: `${desc} (${type})`, schema: { type: /broj/.test(type) && !/datum/.test(type) ? "integer" : "string" } });
    const op = {
      operationId: e.id,
      summary: e.title,
      description: e.desc + (e.scope ? `\n\nPotrebna ovlast: ${e.scope}` : ""),
      parameters,
      responses: {
        200: { description: "Uspješno", content: { "application/json": { example: e.response }, ...(e.csv ? { "text/csv": { schema: { type: "string" } } } : {}) } },
        default: { description: "Greška", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      },
    };
    if (e.scope) op["x-required-scope"] = e.scope;
    if (e.body) {
      op.requestBody = {
        required: true,
        content: { "application/json": {
          schema: { type: "object", additionalProperties: false, properties: Object.fromEntries(e.body.map(([n, t, d]) => [n, { description: `${d} (${t})` }])) },
          example: e.requestBody,
        } },
      };
    }
    (paths[p] ??= {})[e.method.toLowerCase()] = op;
  }
  return {
    openapi: "3.0.3",
    info: {
      title: "WIENA web shop API (Wiena Group d.o.o.)",
      version: "1.0.0",
      description: `API za vanjske sisteme (finansije, knjigovodstvo, ERP). Prijava: Authorization: Bearer <API ključ>. Iznosi su u KM (BAM). Vremena u odgovorima su UTC (ISO 8601); datumi bez vremena u parametrima računaju se po vremenu shopa (${TIMEZONE}).\n\nOvlasti: ${Object.entries(SCOPES).map(([k, v]) => `${k} — ${v}`).join("; ")}`,
    },
    servers: [{ url: baseUrl }],
    security: [{ bearer: [] }],
    components: {
      securitySchemes: { bearer: { type: "http", scheme: "bearer", description: "API ključ (wnk_…) iz Admin → API i integracije" } },
      schemas: { Error: { type: "object", properties: { error: { type: "object", properties: { code: { type: "string", enum: [...new Set(ERRORS.map((x) => x[1]))] }, message: { type: "string" } } } } } },
    },
    paths,
  };
}

module.exports = { TIMEZONE, SCOPES, PRESETS, ERRORS, ENDPOINTS, openapi };
