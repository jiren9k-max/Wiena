// Mali HTTP pomoćnici: router, JSON tijelo zahtjeva, validacija
class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}

function sendJson(res, status, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  res.end(body);
}

function readBody(req, limit = 1e6) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        // Ostatak se pročita i odbaci, da bi klijent dobio odgovor 413 umjesto prekinute veze
        if (!req.tooLarge) { req.tooLarge = true; chunks.length = 0; }
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => (req.tooLarge ? reject(new HttpError(413, "Zahtjev je prevelik.")) : resolve(Buffer.concat(chunks))));
    req.on("error", reject);
  });
}

async function readJson(req) {
  // Zahtjevi koji mijenjaju podatke moraju biti JSON — štiti od CSRF napada sa drugih sajtova
  if (!(req.headers["content-type"] || "").startsWith("application/json")) throw new HttpError(415, "Očekivan JSON.");
  const buf = await readBody(req);
  if (!buf.length) return {};
  let data;
  try { data = JSON.parse(buf.toString("utf8")); } catch { throw new HttpError(400, "Neispravan JSON."); }
  // Očekujemo objekat — null, niz ili broj bi inače izazvali grešku na serveru
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new HttpError(400, "Neispravan zahtjev.");
  return data;
}

function router() {
  const routes = [];
  const add = (method) => (pattern, ...handlers) => {
    const keys = [];
    const re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "/?$");
    routes.push({ method, re, keys, handlers });
  };
  return {
    get: add("GET"), post: add("POST"), put: add("PUT"), patch: add("PATCH"), delete: add("DELETE"),
    match(method, pathname) {
      for (const r of routes) {
        if (r.method !== method) continue;
        const m = pathname.match(r.re);
        if (!m) continue;
        try {
          return { handlers: r.handlers, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
        } catch {
          throw new HttpError(400, "Neispravna adresa.");
        }
      }
      return null;
    },
  };
}

// Ograničenje broja zahtjeva po IP adresi (zaštita od spama i pogađanja lozinke)
function limiter(max, windowMs) {
  const hits = new Map();
  setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.reset < now) hits.delete(k); }, windowMs).unref();
  return {
    check(key) {
      const now = Date.now();
      const h = hits.get(key);
      if (!h || h.reset < now) { hits.set(key, { count: 1, reset: now + windowMs }); return; }
      if (++h.count > max) throw new HttpError(429, "Previše zahtjeva. Pokušajte ponovo malo kasnije.");
    },
  };
}

// Validacija
const str = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function required(obj, fields) {
  const missing = fields.filter((f) => !str(obj[f]));
  if (missing.length) throw new HttpError(400, "Popunite sva obavezna polja.", { fields: missing });
}
function email(v) {
  const e = str(v, 200).toLowerCase();
  if (!EMAIL_RE.test(e)) throw new HttpError(400, "Unesite ispravnu email adresu.", { fields: ["email"] });
  return e;
}
const NUM_RE = /^-?\d+(?:[.,]\d+)?$/; // npr. 12, 12.5, 12,50 — bez "1e3", "0x10" i praznog teksta
const THOUSANDS_RE = /^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/; // lokalni zapis: 1.000 ili 1.234,50
const num = (v, { min = -Infinity, max = Infinity, allowNull = false } = {}) => {
  if (allowNull && (v === null || v === "" || v === undefined)) return null;
  let s = typeof v === "number" ? String(v) : String(v ?? "").trim();
  if (THOUSANDS_RE.test(s)) s = s.replace(/\./g, "");
  if (typeof v !== "number" && !NUM_RE.test(s)) throw new HttpError(400, "Neispravan broj.");
  const n = Number(s.replace(",", "."));
  if (!Number.isFinite(n) || n < min || n > max) throw new HttpError(400, "Neispravan broj.");
  return n;
};

module.exports = { HttpError, sendJson, readBody, readJson, router, str, required, email, num, limiter };
