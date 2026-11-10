/* ==========================================================
   WIENA — admin panel
   ========================================================== */

/* ---------- Helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const km = (n) => {
  const [i, d] = Number(n || 0).toFixed(2).split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + d + " KM";
};
const num = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const toDate = (s) => new Date(String(s).replace(" ", "T") + "Z");
const pad2 = (n) => String(n).padStart(2, "0");
const fmtDate = (s) => { const d = toDate(s); return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}.`; };
const fmtDateTime = (s) => { const d = toDate(s); return `${fmtDate(s)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };

const ICONS = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  orders: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
  cog: '<path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  down: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M9.9 4.2A10.4 10.4 0 0 1 12 4c6.4 0 10 8 10 8a17.6 17.6 0 0 1-3.1 4.2M6.6 6.6C3.9 8.4 2 12 2 12s3.6 8 10 8a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20"/>',
  img: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  plug: '<path d="M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;

async function api(path, { method = "GET", body, raw } = {}) {
  const res = await fetch(path, {
    method,
    headers: raw ? { "Content-Type": raw.type || "application/octet-stream" } : body !== undefined ? { "Content-Type": "application/json" } : {},
    body: raw || (body !== undefined ? JSON.stringify(body) : undefined),
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && me && !path.startsWith("/api/auth/")) {
    // Sesija je istekla: prijava se otvara preko stranice, pa nesačuvane izmjene ostaju
    showRelogin();
    throw Object.assign(new Error("Sesija je istekla — prijavite se ponovo pa kliknite Sačuvaj još jednom."), { status: 401, data });
  }
  if (!res.ok) throw Object.assign(new Error(data.error || "Greška."), { status: res.status, data });
  return data;
}

let toastTimer;
function toast(msg, bad = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast show" + (bad ? " bad" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 2800);
}

const STATUS = { nova: "Nova", potvrdjena: "Potvrđena", poslana: "Poslana", isporucena: "Isporučena", otkazana: "Otkazana" };
const DELIVERY = { posta: "Dostava na adresu", studio: "Preuzimanje u studiju" };
const PAYMENT = { pouzece: "Pouzećem", racun: "Uplata na račun" };
const statusPill = (s) => `<span class="pill st-${s}">${STATUS[s] || s}</span>`;

/* ---------- State ---------- */
let me = null;
let cats = null; // { cats: [...], rooms: [...] }
let badges = { pending: 0, unread: 0 };
let selected = new Set();
let editImages = [];
let pendingImages = null;
let editToken = 0; // mijenja se pri svakom prikazu stranice; upload koji završi kasnije ne smije upasti u drugi proizvod

async function loadCats(force) {
  if (!cats || force) cats = await api("/api/admin/categories");
  return cats;
}
const catOptions = (sel, empty = "") => (empty ? `<option value="">${empty}</option>` : "") +
  [["Tekstil", 1], ["Dom i mirisi", 0]].map(([label, tx]) => `<optgroup label="${label}">${cats.cats.filter((c) => +c.textile === tx).map((c) => `<option value="${c.id}" ${+sel === c.id ? "selected" : ""}>${esc(c.name_bs)}</option>`).join("")}</optgroup>`).join("");

/* ---------- Router ---------- */
function parseHash() {
  const raw = location.hash.slice(1) || "/";
  const [path, qs] = raw.split("?");
  return { parts: path.split("/").filter(Boolean).map(decodeURIComponent), query: Object.fromEntries(new URLSearchParams(qs || "")) };
}
function setQuery(patch) {
  const { parts, query } = parseHash();
  const next = { ...query, ...patch };
  for (const k of Object.keys(next)) if (next[k] === "" || next[k] == null) delete next[k];
  const qs = new URLSearchParams(next).toString();
  location.hash = "#/" + parts.join("/") + (qs ? "?" + qs : "");
}

// [ruta, naziv, ikona, brojač, samo vlasnik]
const NAV = [
  ["", "Pregled", "home"], ["narudzbe", "Narudžbe", "orders", "pending"], ["proizvodi", "Proizvodi", "box"],
  ["kategorije", "Kategorije", "tag"], ["kupci", "Kupci", "users"], ["poruke", "Poruke", "mail", "unread"],
  ["vauceri", "Vaučeri", "ticket", null, true], ["newsletter", "Newsletter", "send", null, true],
  ["aktivnosti", "Aktivnosti", "history", null, true], ["backup", "Backup", "down", null, true],
  ["integracije", "API i integracije", "plug", null, true], ["api-dokumentacija", "API dokumentacija", "book"],
  ["postavke", "Postavke", "cog", null, true],
];
const ROLE_NAMES = { owner: "Vlasnik", customer: "Kupac" };
const isOwner = () => me?.role === "owner";
const myName = () => [me.first_name, me.last_name].filter(Boolean).join(" ") || me.email;
const ownerOnlyPage = () => `<div class="empty">${ic("lock")}<br>Ova stranica je dostupna samo vlasniku.</div>`;

function shell(active, html) {
  return `<div class="shell">
    <aside class="side">
      <a class="brand" href="#/"><span class="wordmark">WIENA</span><small>Admin panel</small></a>
      <nav class="nav">${NAV.filter(([, , , , owner]) => !owner || isOwner()).map(([k, t, i, b]) => `<a href="#/${k}" class="${active === k ? "on" : ""}">${ic(i)}<span>${t}</span>${b && badges[b] ? `<span class="count">${badges[b]}</span>` : ""}</a>`).join("")}</nav>
      <div class="side-foot">
        <a class="who" href="#/profil" title="Moj profil"><b>${esc(myName())}</b><span class="role-tag role-${me.role}">${ROLE_NAMES[me.role] || ""}</span></a>
        <div class="nav"><a href="#/profil" class="${active === "profil" ? "on" : ""}">${ic("users")}<span>Moj profil</span></a><a href="/" target="_blank">${ic("ext")}<span>Otvori shop</span></a><a href="#" data-act="logout">${ic("out")}<span>Odjava</span></a></div>
      </div>
    </aside>
    <main class="main">${html}</main>
  </div>`;
}

async function refreshBadges() {
  try {
    const s = await api("/api/admin/stats");
    badges = { pending: s.pending, unread: s.unread };
    return s;
  } catch { return null; }
}

let renderId = 0;
async function render() {
  const id = ++renderId;
  const root = $("#root");
  const { parts, query } = parseHash();
  // Link iz emaila za novu lozinku radi i bez prijave
  if (parts[0] === "nova-lozinka") { root.innerHTML = resetView(parts[1]); return; }
  if (!me) { root.innerHTML = loginView(); return; }
  const [a, b] = parts;
  try {
    let html;
    if (!a) html = await dashboardView();
    else if (a === "narudzbe" && b) html = await orderView(b);
    else if (a === "narudzbe") html = await ordersView(query);
    else if (a === "proizvodi" && b) html = await productEditView(b);
    else if (a === "proizvodi") html = await productsView(query);
    else if (a === "kategorije") html = await categoriesView();
    else if (a === "kupci") html = await customersView(query);
    else if (a === "profil") html = profileView();
    else if (a === "poruke") html = await messagesView();
    else if (a === "api-dokumentacija") html = await apiDocsView();
    else if (["newsletter", "vauceri", "postavke", "aktivnosti", "backup", "integracije"].includes(a) && !isOwner()) html = ownerOnlyPage();
    else if (a === "integracije") html = await integrationsView(query);
    else if (a === "backup") html = await backupView();
    else if (a === "newsletter") html = await newsletterView();
    else if (a === "vauceri") html = await vouchersView(b);
    else if (a === "postavke") html = await settingsView();
    else if (a === "aktivnosti") html = await activityView(query);
    else html = `<div class="empty">Stranica ne postoji.</div>`;
    if (id !== renderId) return; // u međuvremenu je otvorena druga stranica
    // Slike proizvoda se postavljaju tek kad je baš ta stranica prikazana (ne miješaju se između proizvoda)
    editImages = pendingImages || [];
    pendingImages = null;
    editToken++;
    // Pretraga: zadrži fokus i kursor u polju nakon osvježavanja liste
    const focused = document.activeElement?.dataset?.search ? { key: document.activeElement.dataset.search, pos: document.activeElement.selectionStart } : null;
    root.innerHTML = shell(a || "", html);
    if (focused) {
      const inp = $(`[data-search="${focused.key}"]`);
      if (inp) { inp.focus(); inp.setSelectionRange(focused.pos, focused.pos); }
    }
  } catch (e) {
    if (id !== renderId || !me) return;
    root.innerHTML = shell(a || "", `<div class="err">${esc(e.message)}</div>`);
  }
}

/* ---------- Login ---------- */
const loginView = () => `<div class="login"><form data-f="login">
  <span class="wordmark big">WIENA</span><div style="text-align:center"><h1>Admin prijava</h1><p class="muted">Web shop za prirodni tekstil</p></div>
  <div class="err" hidden></div>
  <label class="lbl">Email<input class="input" name="email" type="email" required autocomplete="username"></label>
  <label class="lbl">Lozinka<input class="input" name="password" type="password" required autocomplete="current-password"></label>
  <button class="btn dark" style="justify-content:center;height:44px" type="submit">Prijavi se</button>
  <a href="#" class="forgot-link muted" data-act="forgot-open" style="text-align:center">Zaboravili ste lozinku?</a>
</form></div>`;

const forgotView = () => `<div class="login"><form data-f="forgot">
  <span class="wordmark big">WIENA</span><div style="text-align:center"><h1>Nova lozinka</h1><p class="muted">Unesite svoj email — poslat ćemo vam link za novu lozinku (vrijedi 1 sat).</p></div>
  <div class="err" hidden></div>
  <label class="lbl">Email<input class="input" name="email" type="email" required autocomplete="username"></label>
  <button class="btn dark" style="justify-content:center;height:44px" type="submit">Pošalji link</button>
  <a href="#" class="muted" data-act="login-open" style="text-align:center">Nazad na prijavu</a>
</form></div>`;

const resetView = (token) => `<div class="login"><form data-f="reset">
  <span class="wordmark big">WIENA</span><div style="text-align:center"><h1>Postavite novu lozinku</h1><p class="muted">Najmanje 8 znakova.</p></div>
  <div class="err" hidden></div>
  <input type="hidden" name="token" value="${esc(token || "")}">
  <label class="lbl">Nova lozinka<input class="input" name="password" type="password" required minlength="8" autocomplete="new-password"></label>
  <button class="btn dark" style="justify-content:center;height:44px" type="submit">Sačuvaj lozinku</button>
</form></div>`;

/* ---------- Pregled ---------- */
async function dashboardView() {
  const s = await refreshBadges();
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    const row = s.days.find((x) => x.d === d);
    days.push({ d, t: row ? row.t : 0, n: row ? row.n : 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.t));
  return `
  <div class="top"><div><h1>Pregled</h1><div class="sub">Dobrodošli nazad${me.first_name ? ", " + esc(me.first_name) : ""}.</div></div>
    <div class="actions"><a class="btn dark" href="#/proizvodi/novi">${ic("plus")} Novi proizvod</a></div></div>
  <div class="kpis">
    <a class="card kpi" href="#/narudzbe?status=nova"><small>Nove narudžbe (čekaju obradu)</small><b>${s.pending}</b><span>Klik za obradu</span></a>
    <div class="card kpi"><small>Danas</small><b>${km(s.today.t)}</b><span>${s.today.n} narudžbi</span></div>
    <div class="card kpi"><small>Zadnjih 30 dana</small><b>${km(s.month.t)}</b><span>${s.month.n} narudžbi</span></div>
    <a class="card kpi" href="#/poruke"><small>Nepročitane poruke</small><b>${s.unread}</b><span>Kontakt forma</span></a>
    <a class="card kpi" href="#/proizvodi"><small>Aktivni proizvodi</small><b>${num(s.products.a || 0)}</b><span>od ${num(s.products.n)} ukupno</span></a>
    <a class="card kpi ${s.products.out_of_stock ? "alert" : ""}" href="#/proizvodi?filter=nostock"><small>Rasprodano</small><b>${s.products.out_of_stock || 0}</b><span>${s.products.low || 0} sa malom zalihom (≤ 3)</span></a>
    <a class="card kpi" href="#/kupci"><small>Kupci</small><b>${num(s.customers)}</b><span>različitih kupaca (po emailu)</span></a>
    <a class="card kpi" href="#/newsletter"><small>Newsletter</small><b>${s.subscribers}</b><span>pretplatnika</span></a>
  </div>
  <div class="grid3">
    <div class="card"><div class="card-h"><h3>Prodaja — zadnjih 14 dana</h3><span class="muted">bez otkazanih</span></div>
      <div class="card-b"><div class="bars">${days.map((d) => `<div title="${fmtDate(d.d + " 00:00:00")}: ${km(d.t)} (${d.n})"><span class="b" style="height:${(d.t / max) * 100}%"></span><small>${d.d.slice(8)}.</small></div>`).join("")}</div></div></div>
    <div class="card"><div class="card-h"><h3>Najprodavanije (30 dana)</h3></div>
      ${s.top.length ? `<table>${s.top.map((t) => `<tr><td><b style="font-weight:500">${esc(t.name)}</b><div class="muted">${esc(t.code)}</div></td><td class="num">${t.qty} kom</td></tr>`).join("")}</table>` : `<div class="empty">Još nema prodaje.</div>`}</div>
  </div>
  <div class="card" style="margin-top:18px"><div class="card-h"><h3>Zadnje narudžbe</h3><a class="btn sm" href="#/narudzbe">Sve narudžbe</a></div>
    ${s.recent.length ? `<div class="table-wrap"><table><tr><th>Broj</th><th>Kupac</th><th>Datum</th><th>Status</th><th class="num">Ukupno</th></tr>
      ${s.recent.map((o) => `<tr class="click" data-go="#/narudzbe/${o.id}"><td><b>${esc(o.number)}</b></td><td>${esc(o.first_name)} ${esc(o.last_name)}</td><td>${fmtDateTime(o.created_at)}</td><td>${statusPill(o.status)}</td><td class="num">${km(o.total)}</td></tr>`).join("")}</table></div>`
      : `<div class="empty">Još nema narudžbi. Kad kupci naruče, pojavit će se ovdje.</div>`}</div>`;
}

/* ---------- Narudžbe ---------- */
async function ordersView(q) {
  const qs = new URLSearchParams(q).toString();
  const [d] = await Promise.all([api("/api/admin/orders?" + qs), refreshBadges()]);
  const pages = Math.max(1, Math.ceil(d.total / d.perPage));
  const page = +q.page || 1;
  const all = Object.values(d.counts).reduce((a, b) => a + b, 0);
  return `
  <div class="top"><div><h1>Narudžbe</h1><div class="sub">${num(d.total)} narudžbi</div></div>
    <div class="actions"><a class="btn" href="/api/admin/orders.csv?${esc(qs)}">${ic("down")} Izvoz CSV</a></div></div>
  <div class="tabs">
    <a class="tab ${!q.status ? "on" : ""}" href="#/narudzbe">Sve <small>${all}</small></a>
    ${Object.entries(STATUS).map(([k, t]) => `<a class="tab ${q.status === k ? "on" : ""}" href="#/narudzbe?status=${k}">${t} <small>${d.counts[k] || 0}</small></a>`).join("")}
  </div>
  <div class="toolbar"><input class="input search-in" data-search="q" placeholder="Broj, ime, email ili telefon…" value="${esc(q.q || "")}"></div>
  <div class="card">
    ${d.rows.length ? `<div class="table-wrap"><table>
      <tr><th>Broj</th><th>Datum</th><th>Kupac</th><th>Dostava</th><th>Plaćanje</th><th class="num">Art.</th><th class="num">Ukupno</th><th>Status</th></tr>
      ${d.rows.map((o) => `<tr class="click" data-go="#/narudzbe/${o.id}">
        <td><b>${esc(o.number)}</b></td><td>${fmtDateTime(o.created_at)}</td>
        <td>${esc(o.first_name)} ${esc(o.last_name)}<div class="muted">${esc(o.phone)}</div></td>
        <td>${DELIVERY[o.delivery] || ""}${o.delivery === "posta" ? `<div class="muted">${esc(o.city)}</div>` : ""}</td>
        <td>${PAYMENT[o.payment] || ""}</td><td class="num">${o.items || 0}</td><td class="num"><b>${km(o.total)}</b></td><td>${statusPill(o.status)}</td></tr>`).join("")}
    </table></div>${pagerHTML(page, pages, d.total)}` : `<div class="empty">Nema narudžbi za odabrani filter.</div>`}
  </div>`;
}

const pagerHTML = (page, pages, total) => pages <= 1 ? "" : `<div class="pager"><span>Stranica ${page} od ${pages} · ${num(total)} ukupno</span>
  <div class="actions"><button class="btn sm" data-act="page" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>‹ Prethodna</button><button class="btn sm" data-act="page" data-page="${page + 1}" ${page >= pages ? "disabled" : ""}>Sljedeća ›</button></div></div>`;

async function orderView(id) {
  const o = await api("/api/admin/orders/" + id);
  const [, recent] = await Promise.all([refreshBadges(), recentActivityHTML("order", o.id)]);
  const addr = o.delivery === "posta" ? `${esc(o.address)}<br>${esc(o.zip)} ${esc(o.city)}` : DELIVERY[o.delivery];
  return `
  <div class="top"><div><a class="muted no-print" href="#/narudzbe">${ic("back")} Narudžbe</a><h1>Narudžba ${esc(o.number)}</h1><div class="sub">${fmtDateTime(o.created_at)} · ${statusPill(o.status)}</div></div>
    <div class="actions no-print"><button class="btn" data-act="print">${ic("print")} Štampaj</button></div></div>
  <div class="grid3">
    <div>
      <div class="card"><div class="card-h"><h3>Artikli</h3></div>
        <div class="table-wrap"><table><tr><th></th><th>Artikal</th><th class="num">Cijena</th><th class="num">Kol.</th><th class="num">Iznos</th></tr>
        ${o.items.map((i) => `<tr><td style="width:60px">${thumbHTML(i.image, i.swatch)}</td>
          <td>${i.pid ? `<a href="#/proizvodi/${i.pid}"><b style="font-weight:500">${esc(i.name)}</b></a>` : esc(i.name)}<div class="muted">${[i.colour, i.size].filter(Boolean).map(esc).join(" · ")}${i.colour || i.size ? " · " : ""}Šifra: ${esc(i.code)}${i.stock !== null && i.stock !== undefined ? ` · na zalihi: ${i.stock}` : ""}</div></td>
          <td class="num">${km(i.price)}</td><td class="num">${i.qty}</td><td class="num"><b>${km(i.price * i.qty)}</b></td></tr>`).join("")}
        <tr><td colspan="4" class="num">Međuzbir</td><td class="num">${km(o.subtotal)}</td></tr>
        ${o.discount > 0 ? `<tr><td colspan="4" class="num"><span class="pill green">${ic("ticket")} ${esc(o.voucher_code)}</span> Vaučer</td><td class="num" style="color:var(--emerald)">−${km(o.discount)}</td></tr>` : ""}
        <tr><td colspan="4" class="num">Dostava</td><td class="num">${o.delivery === "posta" ? (o.shipping > 0 ? km(o.shipping) : "Besplatna") : "Preuzimanje u studiju"}</td></tr>
        <tr><td colspan="4" class="num"><b>Ukupno</b></td><td class="num"><b style="font-size:16px">${km(o.total)}</b></td></tr></table></div></div>
      ${o.note ? `<div class="card" style="margin-top:14px"><div class="card-h"><h3>Napomena kupca</h3></div><div class="card-b" style="white-space:pre-wrap">${esc(o.note)}</div></div>` : ""}
    </div>
    <div style="display:grid;gap:14px">
      <div class="card no-print"><div class="card-h"><h3>Status</h3></div><div class="card-b" style="display:grid;gap:12px">
        <div class="timeline">${Object.entries(STATUS).map(([k, t]) => `<button class="btn sm ${o.status === k ? "dark" : ""}" data-act="status" data-status="${k}" data-id="${o.id}">${t}</button>`).join("")}</div>
        <label class="switch lbl"><input type="checkbox" id="notify" checked> Obavijesti kupca emailom</label>
        <label class="lbl">Interna bilješka<textarea class="input" id="admin-note" rows="3" placeholder="Vidljivo samo adminima">${esc(o.admin_note)}</textarea></label>
        <button class="btn" data-act="save-note" data-id="${o.id}">Sačuvaj bilješku</button>
      </div></div>
      <div class="card"><div class="card-h"><h3>Kupac</h3>${o.customer_orders > 1 ? `<span class="pill gold">${o.customer_orders}. narudžba</span>` : `<span class="pill gray">Prva narudžba</span>`}</div><div class="card-b"><dl class="kv">
        <dt>Ime</dt><dd><b>${esc(o.first_name)} ${esc(o.last_name)}</b></dd>
        <dt>Telefon</dt><dd><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></dd>
        <dt>Email</dt><dd><a href="mailto:${esc(o.email)}?subject=${encodeURIComponent("Narudžba " + o.number)}">${esc(o.email)}</a></dd>
        <dt>Dostava</dt><dd>${addr}</dd>
        <dt>Plaćanje</dt><dd>${PAYMENT[o.payment] || ""}</dd>
      </dl></div></div>
      <div class="no-print">${recent}</div>
    </div>
  </div>`;
}

/* ---------- Proizvodi ---------- */
const oldPriceHTML = (p) => (p.old_price ? `<s>${km(p.old_price)}</s>` : "");
const BADGE_NAMES = { "": "Automatski (Sniženo kad ima staru cijenu)", New: "Novo", Bestseller: "Najprodavanije", Limited: "Ograničeno", Sale: "Sniženo" };
const badgesHTML = (p) => `${p.active ? "" : `<span class="pill gray">Sakriven</span> `}${p.old_price ? `<span class="pill red">−${Math.round((1 - p.price / p.old_price) * 100)}%</span> ` : ""}${p.is_new ? `<span class="pill green">Novo</span> ` : ""}${p.badge && p.badge !== "Sale" && p.badge !== "New" ? `<span class="pill gold">${BADGE_NAMES[p.badge]}</span> ` : ""}${p.stock === 0 ? `<span class="pill red">Rasprodano</span>` : ""}`;
// "1.234,50" → "1234.50"; "12,5" → "12.5"
const parseKm = (v) => { v = String(v).trim(); return v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v; };
const priceIn = (n) => (n === "" || n == null ? "" : Number.isInteger(+n) ? String(+n) : Number(n).toFixed(2));
const swatchDot = (c) => `<i class="sw" style="background:${esc(c || "#ddd")}"></i>`;

// Dugme za sakrivanje / vraćanje proizvoda u shop (jedan klik)
const visibilityBtn = (p) => p.active
  ? `<button class="btn sm" data-act="toggle-active" data-id="${p.id}" data-active="0" title="Sakrij iz shopa — kupci ga neće vidjeti">${ic("eyeOff")} Sakrij</button>`
  : `<button class="btn sm dark" data-act="toggle-active" data-id="${p.id}" data-active="1" title="Ponovo prikaži u shopu">${ic("eye")} Vrati u shop</button>`;

const FILTERS = { "": "Bez dodatnog filtera", sale: "Na akciji", new: "Označeni kao novo", nostock: "Rasprodano", low: "Mala zaliha (≤ 3)", tracked: "Sa praćenjem zalihe", nodesc: "Bez opisa", noen: "Bez engleskog prijevoda" };
async function productsView(q) {
  await loadCats();
  const d = await api("/api/admin/products?" + new URLSearchParams(q));
  const pages = Math.max(1, Math.ceil(d.total / d.perPage));
  const page = +q.page || 1;
  const ids = d.rows.map((p) => p.id);
  return `
  <div class="top"><div><h1>Proizvodi</h1><div class="sub">${num(d.total)} proizvoda · svaka boja je zaseban proizvod sa svojom šifrom i zalihom</div></div>
    <div class="actions"><a class="btn dark" href="#/proizvodi/novi">${ic("plus")} Novi proizvod</a></div></div>
  <div class="tabs">
    ${[["", "Svi", d.counts.all, ""], ["visible", "Prikazani u shopu", d.counts.visible, "eye"], ["hidden", "Sakriveni", d.counts.hidden, "eyeOff"]]
      .map(([k, t, n, icon]) => `<button class="tab ${(q.vis || "") === k ? "on" : ""}" data-act="vis" data-vis="${k}">${icon ? ic(icon) : ""}${t} <small>${num(n)}</small></button>`).join("")}
  </div>
  <div class="toolbar">
    <input class="input search-in" data-search="q" placeholder="Naziv, šifra ili boja…" value="${esc(q.q || "")}">
    <select class="select" data-qs="cat">${catOptions(q.cat, "Sve kategorije")}</select>
    <select class="select" data-qs="filter">${Object.entries(FILTERS).map(([k, t]) => `<option value="${k}" ${(q.filter || "") === k ? "selected" : ""}>${t}</option>`).join("")}</select>
    <select class="select" data-qs="sort">${[["", "Redoslijed u shopu"], ["name", "Naziv"], ["price", "Cijena ↑"], ["-price", "Cijena ↓"], ["stock", "Zaliha"], ["updated", "Zadnje mijenjano"]].map(([k, t]) => `<option value="${k}" ${(q.sort || "") === k ? "selected" : ""}>${t}</option>`).join("")}</select>
  </div>
  <div class="bulk" id="bulk" ${selected.size ? "" : "hidden"}>
    <b id="bulk-n">${selected.size} odabrano</b>
    <button class="btn" data-bulk="deactivate">${ic("eyeOff")} Sakrij</button>
    <button class="btn" data-bulk="activate">${ic("eye")} Vrati u shop</button>
    <button class="btn" data-bulk="discount">Popust %</button>
    <button class="btn" data-bulk="clear-discount">Ukloni popust</button>
    <button class="btn" data-bulk="stock">Postavi zalihu</button>
    <button class="btn" data-bulk="new-on">Označi novo</button>
    <button class="btn" data-bulk="new-off">Ukloni "novo"</button>
    <select class="select" id="bulk-move" style="height:32px;max-width:200px"><option value="">Premjesti u…</option>${catOptions("")}</select>
    ${isOwner() ? `<button class="btn danger" data-bulk="delete">Obriši</button>` : ""}
    <button class="btn" data-act="clear-sel" style="margin-left:auto">Poništi odabir</button>
  </div>
  <div class="card">
    ${d.rows.length ? `<div class="table-wrap"><table>
      <tr><th style="width:36px"><input type="checkbox" data-act="sel-all" data-ids="${ids.join(",")}" ${ids.every((x) => selected.has(x)) ? "checked" : ""}></th><th></th><th>Proizvod</th><th>Kategorija</th>
        <th class="num">Cijena (KM)</th><th class="num">Zaliha</th><th>Status</th><th>U shopu</th></tr>
      ${d.rows.map((p) => `<tr class="${selected.has(p.id) ? "sel" : ""}${p.active ? "" : " is-hidden"}" data-row="${p.id}">
        <td><input type="checkbox" data-sel="${p.id}" ${selected.has(p.id) ? "checked" : ""}></td>
        <td style="width:60px">${thumbHTML(p.images[0], p.swatch)}</td>
        <td class="name-cell"><a href="#/proizvodi/${p.id}"><b>${esc(p.name_bs)}</b></a><div class="muted">${swatchDot(p.swatch)} ${esc(p.colour_bs)} · ${esc(p.code)}${p.sizes.length > 1 ? ` · ${p.sizes.length} veličine` : ""}</div></td>
        <td class="muted">${esc(p.category_name)}</td>
        <td class="num"><input class="input mini" data-quick="price" data-id="${p.id}" value="${priceIn(p.price)}"><div class="muted" data-oldp>${oldPriceHTML(p)}</div></td>
        <td class="num"><input class="input mini" data-quick="stock" data-id="${p.id}" value="${p.stock ?? ""}" placeholder="∞" style="width:70px"></td>
        <td data-badges>${badgesHTML(p)}</td>
        <td>${visibilityBtn(p)}</td>
      </tr>`).join("")}
    </table></div>${pagerHTML(page, pages, d.total)}` : `<div class="empty">Nema proizvoda za ovu pretragu.</div>`}
  </div>
  <p class="muted" style="margin-top:10px">Savjet: cijenu i zalihu možete mijenjati direktno u tabeli (sačuva se kad izađete iz polja). Prazna zaliha (∞) znači da se zaliha ne prati. Zaliha je zajednička za sve veličine jednog proizvoda.</p>`;
}

let productOpts = null;
const EMPTY_PRODUCT = { code: "", name_bs: "", name_en: "", family: "", category_id: "", desc_bs: "", desc_en: "", colour_bs: "", colour_en: "", swatch: "#d6c6a9",
  fibre: "", material_bs: "", material_en: "", details_bs: [], details_en: [], care_bs: "", care_en: "", sizes: ["One size"], price: "", old_price: null,
  price_eur: null, old_price_eur: null, stock: 10, badge: "", is_new: 1, active: 1, images: [], variants: [] };
const EUR_BAM = 1.95583;
const autoEur = (v) => { const n = parseFloat(parseKm(v || "")); return n > 0 ? Math.max(1, Math.round(n / EUR_BAM)) : ""; };
const two = (label, name, a, b, opts = {}) => {
  const tag = (lang, v) => opts.area
    ? `<textarea class="input" name="${name}_${lang}" rows="${opts.rows || 4}" ${opts.req && lang === "bs" ? "required" : ""}>${esc(v)}</textarea>`
    : `<input class="input" name="${name}_${lang}" value="${esc(v)}" ${opts.req && lang === "bs" ? "required" : ""}>`;
  return `<div class="full two"><label><span>${label} <span class="lang">BS</span></span>${tag("bs", a)}</label><label><span>${opts.labelEn || label} <span class="lang">EN</span></span>${tag("en", b)}</label></div>`;
};

async function productEditView(id) {
  await loadCats();
  const isNew = id === "novi";
  const [p, opts] = await Promise.all([isNew ? Promise.resolve({ ...EMPTY_PRODUCT }) : api("/api/admin/products/" + id), api("/api/admin/product-options")]);
  productOpts = opts;
  if (isNew) p.code = opts.nextCode;
  pendingImages = [...(p.images || [])];
  const recent = isNew ? "" : await recentActivityHTML("product", p.id);
  const variants = (p.variants || []);
  return `
  <div class="top"><div><a class="muted" href="#/proizvodi">${ic("back")} Proizvodi</a><h1>${isNew ? "Novi proizvod" : `${esc(p.name_bs)} <span class="h1-sub">${esc(p.colour_bs)}</span>`}</h1>
    ${isNew ? "" : `<div class="sub">${p.active ? `<span class="pill green">${ic("eye")} Prikazan u shopu</span>` : `<span class="pill gray">${ic("eyeOff")} Sakriven — kupci ga ne vide</span>`} · ${esc(p.category_name)} · ${esc(p.code)} · zadnja izmjena ${fmtDateTime(p.updated_at)}</div>`}</div>
    <div class="actions">${isNew ? "" : `${visibilityBtn(p).replace("btn sm", "btn")}${p.active ? `<a class="btn" href="/product.html?id=${p.id}" target="_blank">${ic("ext")} Pogledaj u shopu</a>` : ""}${isOwner() ? `<button class="btn danger" data-act="del-product" data-id="${p.id}">Obriši</button>` : ""}`}</div></div>
  <form data-f="product" data-id="${isNew ? "" : p.id}">
    <div class="err" hidden></div>
    <datalist id="dl-families">${opts.families.map((f) => `<option value="${esc(f.family)}">${esc(f.name)} (${f.n} ${f.n === 1 ? "boja" : "boje"})</option>`).join("")}</datalist>
    <datalist id="dl-fibres">${opts.fibres.map((f) => `<option value="${esc(f)}">`).join("")}</datalist>
    <div class="grid3">
      <div style="display:grid;gap:18px">
        <div class="card"><div class="card-h"><h3>Osnovno</h3><span class="muted">Bosanski je glavni jezik; engleski se prikazuje na EN verziji sajta</span></div><div class="card-b form">
          <label>Šifra<input class="input" name="code" required value="${esc(p.code)}"></label>
          <label>Kategorija<select class="select" name="category_id" required><option value="">— odaberite —</option>${catOptions(p.category_id)}</select></label>
          ${two("Naziv", "name", p.name_bs, p.name_en, { req: true })}
          ${two("Opis", "desc", p.desc_bs, p.desc_en, { area: true, rows: 5 })}
          <label class="full">Model (porodica) <span class="hint">Isti model u više boja dijeli isti naziv modela, pa se na stranici proizvoda prikažu kružići za izbor boje. Prazno = novi model.</span>
            <input class="input" name="family" list="dl-families" value="${esc(p.family)}" placeholder="npr. stonewashed-linen-duvet-cover"></label>
        </div></div>
        <div class="card"><div class="card-h"><h3>Boja, materijal i veličine</h3></div><div class="card-b form">
          ${two("Boja", "colour", p.colour_bs, p.colour_en, { labelEn: "Colour" })}
          <label>Boja kružića <span class="hint">prikazuje se kupcu za izbor boje</span><span class="color-pick"><input type="color" name="swatch" value="${esc(p.swatch || "#d6c6a9")}"><code>${esc(p.swatch || "#d6c6a9")}</code></span></label>
          <label>Vlakno <span class="hint">za filter u shopu</span><input class="input" name="fibre" list="dl-fibres" value="${esc(p.fibre)}" placeholder="Linen, Cotton…"></label>
          ${two("Materijal", "material", p.material_bs, p.material_en, { labelEn: "Material" })}
          <label class="full">Veličine <span class="hint">jedna u svakom redu, npr. 140×200 ili Double. Jedna veličina = kupac ne bira.</span><textarea class="input" name="sizes" rows="4">${esc((p.sizes || []).join("\n"))}</textarea></label>
        </div></div>
        <div class="card"><div class="card-h"><h3>Detalji i njega</h3><span class="muted">detalji: jedan u svakom redu</span></div><div class="card-b form">
          ${two("Detalji", "details", (p.details_bs || []).join("\n"), (p.details_en || []).join("\n"), { area: true, rows: 4, labelEn: "Details" })}
          ${two("Njega", "care", p.care_bs, p.care_en, { area: true, rows: 3, labelEn: "Care" })}
        </div></div>
        <div class="card"><div class="card-h"><h3>Slike</h3><span class="muted">JPG, PNG ili WEBP, do 8 MB · prevucite ili kliknite</span></div><div class="card-b">
          <p class="muted" style="margin:0 0 12px">1. slika je glavna, 2. se prikazuje kad kupac pređe mišem preko kartice, ostale su u galeriji. Bez slika shop prikazuje nacrtanu sliku u boji proizvoda.</p>
          <div class="imgs" id="imgs"></div>
          <div class="actions" style="margin-top:12px"><input class="input" id="img-url" placeholder="ili zalijepite link slike (https://…)" style="flex:1"><button type="button" class="btn" data-act="img-url">Dodaj link</button></div>
        </div></div>
      </div>
      <div style="display:grid;gap:18px;align-content:start">
        <div class="card"><div class="card-h"><h3>Cijena i zaliha</h3></div><div class="card-b form">
          <label>Cijena (KM)<input class="input" name="price" required inputmode="decimal" value="${priceIn(p.price)}"></label>
          <label>Stara cijena (KM) <span class="hint">za akciju</span><input class="input" name="old_price" inputmode="decimal" value="${priceIn(p.old_price)}" placeholder="—"></label>
          <div class="full" id="disc-note"></div>
          <label>Cijena (€) <span class="hint">EN verzija</span><input class="input" name="price_eur" inputmode="decimal" value="${priceIn(p.price_eur)}" placeholder="auto: ${autoEur(p.price)}"></label>
          <label>Stara cijena (€)<input class="input" name="old_price_eur" inputmode="decimal" value="${priceIn(p.old_price_eur)}" placeholder="${p.old_price ? "auto: " + autoEur(p.old_price) : "—"}"></label>
          <p class="full muted" style="margin:-4px 0 0;font-size:12px">Prazna € cijena = preračunata iz KM (1 € = 1,95583 KM). Narudžbe se uvijek naplaćuju u KM.</p>
          <label class="full">Zaliha (kom) <span class="hint">Prazno = ne prati se, uvijek dostupno. 0 = rasprodano.</span><input class="input" name="stock" inputmode="numeric" value="${p.stock ?? ""}" placeholder="∞"></label>
        </div></div>
        <div class="card"><div class="card-h"><h3>Prikaz u shopu</h3></div><div class="card-b form">
          <label class="full">Oznaka na kartici<select class="select" name="badge">${Object.entries(BADGE_NAMES).map(([k, t]) => `<option value="${k}" ${(p.badge || "") === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
          <label class="switch lbl full"><input type="checkbox" name="active" ${p.active ? "checked" : ""}> Prikazan u shopu</label>
          <label class="switch lbl full"><input type="checkbox" name="is_new" ${p.is_new ? "checked" : ""}> Nova kolekcija (filter „Novo“)</label>
        </div></div>
        <button class="btn dark" type="submit" style="height:46px;justify-content:center">${isNew ? "Dodaj proizvod" : "Sačuvaj izmjene"}</button>
        ${isNew ? "" : `<div class="card"><div class="card-h"><h3>Boje ovog modela</h3><span class="muted">${variants.length}</span></div><div class="card-b variants">
          ${variants.map((v) => `<a href="#/proizvodi/${v.id}" class="${v.id === p.id ? "on" : ""}">${swatchDot(v.swatch)}<span>${esc(v.colour_bs)}</span><small>${esc(v.code)}${v.active ? "" : " · sakriven"}${v.stock === 0 ? " · rasprodano" : ""}</small></a>`).join("")}
          <button type="button" class="btn sm" data-act="dup-product" data-id="${p.id}">${ic("plus")} Dodaj novu boju</button>
        </div></div>`}
        ${recent}
      </div>
    </div>
  </form>`;
}

const UNS = "https://images.unsplash.com/photo-";
const imgUrl = (u, w) => (String(u).startsWith(UNS) ? `${String(u).split("?")[0]}?auto=format&fit=crop&w=${w}&q=60` : u);
const thumbHTML = (u, swatch) => u ? `<img class="thumb" loading="lazy" src="${esc(imgUrl(u, 120))}" onerror="this.style.visibility='hidden'" alt="">` : `<span class="thumb thumb--sw" style="background:${esc(swatch || "#ddd")}"></span>`;
const VIEW_NAMES = ["Glavna", "Na prelaz mišem", "Galerija", "Galerija"];

function renderImages() {
  const box = $("#imgs");
  if (!box) return;
  box.innerHTML = editImages.map((u, i) => `<div class="im ${i === 0 ? "first" : ""}"><img src="${esc(imgUrl(u, 300))}" alt=""><small>${VIEW_NAMES[i] || "Galerija"}</small>
      <div class="ctl">${i ? `<button type="button" data-act="img-first" data-i="${i}" title="Pomjeri naprijed">←</button>` : ""}<button type="button" data-act="img-del" data-i="${i}" title="Ukloni">✕</button></div></div>`).join("")
    + `<label class="drop" id="drop">${ic("img")}<span>Dodaj slike</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden data-upload></label>`;
}
function discountNote() {
  const box = $("#disc-note");
  if (!box) return;
  const price = parseFloat(parseKm($('[name="price"]').value || ""));
  const old = parseFloat(parseKm($('[name="old_price"]').value || ""));
  box.innerHTML = old > price && price > 0 ? `<span class="pill red">Akcija −${Math.round((1 - price / old) * 100)}%</span> <span class="muted">kupac štedi ${km(old - price)}</span>` : "";
  const e1 = $('[name="price_eur"]'), e2 = $('[name="old_price_eur"]');
  if (e1) e1.placeholder = "auto: " + autoEur($('[name="price"]').value);
  if (e2) e2.placeholder = old > 0 ? "auto: " + autoEur($('[name="old_price"]').value) : "—";
}
async function uploadFiles(files) {
  const token = editToken;
  for (const f of files) {
    if (f.size > 8e6) { toast(`${f.name}: prevelika slika (max 8 MB)`, true); continue; }
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { toast(`${f.name}: dozvoljene su samo JPG, PNG i WEBP slike`, true); continue; }
    try {
      const { url } = await api("/api/admin/upload", { method: "POST", raw: f });
      if (token !== editToken) return; // u međuvremenu je otvoren drugi proizvod
      editImages.push(url);
      renderImages();
    } catch (e) { toast(e.message, true); }
  }
}

/* ---------- Kategorije ---------- */
const ROOM_NAMES = { Bedroom: "Spavaća soba", Bathroom: "Kupatilo", Living: "Dnevni boravak", Dining: "Trpezarija", Wardrobe: "Garderoba" };
async function categoriesView() {
  await loadCats(true);
  const ro = ""; // admin je samo za vlasnika
  const list = cats.cats;
  return `
  <div class="top"><div><h1>Kategorije</h1><div class="sub">${list.length} kategorija · redoslijed ovdje = redoslijed u meniju shopa</div></div>
    ${ro ? "" : `<div class="actions"><button class="btn dark" data-act="add-cat">${ic("plus")} Nova kategorija</button></div>`}</div>
  ${ro ? `<div class="note">${ic("lock")} Kategorije može mijenjati samo vlasnik. Vi ih možete pregledati i otvoriti proizvode.</div>` : ""}
  <div class="cat-list">${list.map((c, i) => `<div class="card cat-card" data-cat="${c.id}">
    <div class="cat-card__head"><b class="cat-n">${String(i + 1).padStart(2, "0")}</b>
      <div class="cat-card__names"><input class="input" data-c="name_bs" value="${esc(c.name_bs)}" ${ro} title="Naziv (bosanski)"><input class="input" data-c="name_en" value="${esc(c.name_en)}" ${ro} title="Naziv (engleski)"></div>
      <span class="muted">${c.active}/${c.count} u shopu</span>
      <div class="actions">${ro ? "" : `<button class="btn sm" data-act="cat-move" data-id="${c.id}" data-dir="up" ${i ? "" : "disabled"} title="Gore">↑</button><button class="btn sm" data-act="cat-move" data-id="${c.id}" data-dir="down" ${i < list.length - 1 ? "" : "disabled"} title="Dolje">↓</button>`}
        <a class="btn sm" href="#/proizvodi?cat=${c.id}">Proizvodi</a>${c.count || ro ? "" : `<button class="btn sm danger" data-act="del-cat" data-id="${c.id}">Obriši</button>`}</div></div>
    <div class="cat-card__body">
      <label>Opis (BS)<textarea class="input" data-c="blurb_bs" rows="2" ${ro}>${esc(c.blurb_bs)}</textarea></label>
      <label>Opis (EN)<textarea class="input" data-c="blurb_en" rows="2" ${ro}>${esc(c.blurb_en)}</textarea></label>
      <label>Prostorija<select class="select" data-c="room" ${ro}>${cats.rooms.map((r) => `<option value="${r}" ${c.room === r ? "selected" : ""}>${ROOM_NAMES[r] || r}</option>`).join("")}</select></label>
      <label>Vrsta<select class="select" data-c="textile" ${ro}><option value="1" ${c.textile ? "selected" : ""}>Tekstil</option><option value="0" ${c.textile ? "" : "selected"}>Dom i mirisi</option></select></label>
    </div>
  </div>`).join("")}</div>
  ${ro ? "" : `<p class="muted" style="margin-top:10px">Izmjene se čuvaju automatski kad izađete iz polja.</p>`}`;
}

/* ---------- Kupci (svi koji su naručili — kupci nemaju račune) ---------- */
async function customersView(q) {
  const d = await api("/api/admin/customers?" + new URLSearchParams(q));
  const pages = Math.max(1, Math.ceil(d.total / d.perPage));
  const sorts = [["", "Zadnja narudžba"], ["orders", "Najviše narudžbi"], ["spent", "Najviše potrošeno"]];
  return `
  <div class="top"><div><h1>Kupci</h1><div class="sub">${num(d.total)} kupaca — svi koji su naručili, po email adresi</div></div>
    ${isOwner() ? `<div class="actions"><a class="btn" href="/api/admin/customers.csv${q.q ? "?q=" + encodeURIComponent(q.q) : ""}">${ic("down")} Izvoz CSV</a></div>` : ""}</div>
  <div class="toolbar">
    <input class="input search-in" data-search="q" placeholder="Ime, email, telefon ili grad…" value="${esc(q.q || "")}">
    <select class="select" data-qs="sort">${sorts.map(([k, t]) => `<option value="${k}" ${(q.sort || "") === k ? "selected" : ""}>${t}</option>`).join("")}</select>
  </div>
  <div class="card">${d.rows.length ? `<div class="table-wrap"><table>
    <tr><th>Kupac</th><th>Telefon</th><th>Grad</th><th>Prva narudžba</th><th>Zadnja narudžba</th><th class="num">Narudžbi</th><th class="num">Potrošeno</th></tr>
    ${d.rows.map((b) => `<tr class="click" data-go="#/narudzbe?q=${encodeURIComponent(b.email)}">
      <td><b style="font-weight:500">${esc(b.first_name)} ${esc(b.last_name)}</b><div class="muted"><a href="mailto:${esc(b.email)}">${esc(b.email)}</a></div></td>
      <td>${esc(b.phone)}</td><td>${esc(b.city)}</td><td>${fmtDate(b.first_at)}</td><td>${fmtDate(b.last_at)}</td>
      <td class="num"><a href="#/narudzbe?q=${encodeURIComponent(b.email)}">${b.orders}</a></td><td class="num">${km(b.spent)}</td></tr>`).join("")}
  </table></div>${pagerHTML(+q.page || 1, pages, d.total)}`
    : `<div class="empty">${q.q ? "Nema kupaca za ovu pretragu." : "Još nema narudžbi. Svaki kupac koji naruči pojavit će se ovdje."}</div>`}</div>`;
}

/* ---------- Moj profil ---------- */
function profileView() {
  return `
  <div class="top"><div><h1>Moj profil</h1><div class="sub">${esc(me.email)} · ${ROLE_NAMES[me.role] || ""}</div></div></div>
  <div class="grid2" style="max-width:980px">
    <form class="card" data-f="profile"><div class="card-h"><h3>Lični podaci</h3></div><div class="card-b form">
      <div class="err full" hidden></div>
      <label>Ime<input class="input" name="first_name" required maxlength="80" value="${esc(me.first_name)}"></label>
      <label>Prezime<input class="input" name="last_name" maxlength="80" value="${esc(me.last_name)}"></label>
      <label class="full">Telefon<input class="input" name="phone" type="tel" value="${esc(me.phone)}"></label>
      <label class="full">Email <span class="hint">ne može se mijenjati</span><input class="input" value="${esc(me.email)}" disabled></label>
      <button class="btn dark full" type="submit" style="justify-content:center;height:42px">Sačuvaj</button>
    </div></form>
    <form class="card" data-f="my-password"><div class="card-h"><h3>${ic("lock")} Promjena lozinke</h3></div><div class="card-b form">
      <div class="err full" hidden></div>
      <label class="full">Trenutna lozinka<input class="input" name="current" type="password" required autocomplete="current-password"></label>
      <label class="full">Nova lozinka <span class="hint">najmanje 8 znakova</span><input class="input" name="next" type="password" required minlength="8" autocomplete="new-password"></label>
      <button class="btn dark full" type="submit" style="justify-content:center;height:42px">Promijeni lozinku</button>
      <p class="muted full">Nakon promjene bićete odjavljeni sa svih drugih uređaja.</p>
    </div></form>
  </div>`;
}
/* ---------- Poruke ---------- */
async function messagesView() {
  const [{ rows }] = await Promise.all([api("/api/admin/messages"), refreshBadges()]);
  return `
  <div class="top"><div><h1>Poruke</h1><div class="sub">Poruke poslane preko kontakt forme</div></div></div>
  <div class="card">${rows.length ? rows.map((m) => `<div class="msg ${m.is_read ? "" : "unread"}">
    <div class="actions" style="justify-content:space-between"><div><b>${esc(m.subject || "Bez teme")}</b> <span class="muted">· ${esc(m.name)} · ${esc(m.email)}${m.phone ? " · " + esc(m.phone) : ""} · ${fmtDateTime(m.created_at)}</span></div>
      <div class="actions"><a class="btn sm" href="mailto:${esc(m.email)}?subject=${encodeURIComponent("Re: " + (m.subject || "Vaša poruka"))}">Odgovori</a>
        <button class="btn sm" data-act="msg-read" data-id="${m.id}" data-read="${m.is_read ? 0 : 1}">${m.is_read ? "Označi nepročitano" : "Označi pročitano"}</button>
        <button class="btn sm danger" data-act="msg-del" data-id="${m.id}">Obriši</button></div></div>
    <p>${esc(m.body)}</p></div>`).join("") : `<div class="empty">Nema poruka.</div>`}</div>`;
}

/* ---------- Newsletter ---------- */
async function newsletterView() {
  const { rows } = await api("/api/admin/newsletter");
  return `
  <div class="top"><div><h1>Newsletter</h1><div class="sub">${rows.length} pretplatnika</div></div>
    <div class="actions"><a class="btn" href="/api/admin/newsletter.csv">${ic("down")} Izvoz CSV</a>
    ${rows.length ? `<button class="btn" data-act="copy-emails" data-emails="${esc(rows.map((r) => r.email).join(", "))}">Kopiraj sve adrese</button>` : ""}</div></div>
  <div class="card">${rows.length ? `<table><tr><th>Email</th><th>Prijavljen</th><th></th></tr>
    ${rows.map((r) => `<tr><td>${esc(r.email)}</td><td>${fmtDateTime(r.created_at)}</td><td class="num"><button class="btn sm danger" data-act="nl-del" data-email="${esc(r.email)}">Ukloni</button></td></tr>`).join("")}</table>`
    : `<div class="empty">Još nema pretplatnika.</div>`}</div>`;
}

/* ---------- Backup ---------- */
const mb = (n) => (n / 1024 / 1024).toFixed(1).replace(".", ",") + " MB";
async function backupView() {
  const [{ rows }, s] = await Promise.all([api("/api/admin/backups"), api("/api/admin/stats")]);
  return `
  <div class="top"><div><h1>Backup</h1><div class="sub">Sigurnosne kopije cijelog shopa</div></div></div>
  <div class="grid2">
    <div class="card"><div class="card-h"><h3>${ic("down")} Preuzmi kompletan backup</h3></div><div class="card-b" style="display:grid;gap:14px">
      <p>Jedan <b>.zip</b> fajl sa svim podacima: <b>${num(s.products.n)}</b> proizvoda, narudžbe, kupci, vaučeri, postavke, dnevnik aktivnosti i slike dodane u adminu.</p>
      <p class="muted">Savjet: preuzmite backup bar jednom sedmično i sačuvajte ga i van računara (USB, Google Drive…).</p>
      <a class="btn dark" href="/api/admin/backup" download style="justify-content:center;height:46px">${ic("down")} Preuzmi backup sada</a>
    </div></div>
    <div class="card"><div class="card-h"><h3>${ic("history")} Automatski dnevni backupi</h3><span class="muted">zadnjih 14 dana</span></div>
      ${rows.length ? `<table>${rows.map((b) => `<tr><td><b style="font-weight:500">${fmtDate(b.date + " 00:00:00")}</b><div class="muted">${esc(b.name)}</div></td><td class="num muted">${mb(b.size)}</td>
        <td class="num"><a class="btn sm" href="/api/admin/backups/${encodeURIComponent(b.name)}" download>${ic("down")} Preuzmi</a></td></tr>`).join("")}</table>`
        : `<div class="empty">Prvi automatski backup se pravi pri pokretanju shopa.</div>`}
    </div>
  </div>
  <div class="card" style="margin-top:18px"><div class="card-h"><h3>${ic("history")} Vrati shop iz backupa</h3></div><div class="card-b" style="display:grid;gap:14px">
    <div class="note">${ic("lock")} <span><b>Pažnja:</b> svi trenutni podaci (proizvodi, narudžbe, kupci, postavke) biće zamijenjeni podacima iz backupa. Prije vraćanja shop sam napravi sigurnosnu kopiju trenutnog stanja. Nakon vraćanja svi se moraju ponovo prijaviti.</span></div>
    <p class="muted">Koristite ovo i kad prebacujete shop sa svog računara na internet (Railway): preuzmite backup ovdje lokalno, pa ga vratite u online adminu.</p>
    <div class="actions"><input type="file" id="restore-file" accept=".zip,.db" class="input" style="padding:6px;height:auto;flex:1">
      <button class="btn danger" data-act="restore">Vrati iz backupa</button></div>
    <div class="err" id="restore-err" hidden></div>
  </div></div>`;
}

/* ---------- Aktivnosti (dnevnik promjena) ---------- */
const ACT_TYPES = { "": "Sve", order: "Narudžbe", product: "Proizvodi", category: "Kategorije", voucher: "Vaučeri", user: "Uloge", settings: "Postavke", message: "Poruke", newsletter: "Newsletter", integration: "Integracije" };
const actTarget = (a) => {
  const label = esc(a.target_label || "");
  if (a.target_type === "product" && a.target_id) return `<a href="#/proizvodi/${esc(a.target_id)}">${label}</a>`;
  if (a.target_type === "order" && a.target_id) return `<a href="#/narudzbe/${esc(a.target_id)}">${label}</a>`;
  return label;
};

async function activityView(q) {
  const d = await api("/api/admin/activity?" + new URLSearchParams(q));
  const pages = Math.max(1, Math.ceil(d.total / d.perPage));
  return `
  <div class="top"><div><h1>Aktivnosti</h1><div class="sub">Ko je šta promijenio u adminu — ${num(d.total)} zapisa</div></div></div>
  <div class="tabs">${Object.entries(ACT_TYPES).map(([k, t]) => `<button class="tab ${(q.type || "") === k ? "on" : ""}" data-act="act-filter" data-k="type" data-v="${k}">${t}</button>`).join("")}</div>
  <div class="toolbar">
    <select class="select" data-qs="user"><option value="">Sve osobe</option>${d.people.map((p) => `<option value="${p.user_id}" ${+q.user === p.user_id ? "selected" : ""}>${esc(p.user_name)}</option>`).join("")}</select>
    <input class="input search-in" data-search="q" placeholder="Proizvod, broj narudžbe, kod…" value="${esc(q.q || "")}">
  </div>
  <div class="card">${d.rows.length ? `<div class="table-wrap"><table>
    <tr><th>Vrijeme</th><th>Osoba</th><th>Radnja</th><th>Na čemu</th><th>Detalji</th></tr>
    ${d.rows.map((a) => `<tr>
      <td style="white-space:nowrap">${fmtDateTime(a.created_at)}</td>
      <td><b style="font-weight:600">${esc(a.user_name)}</b></td>
      <td>${esc(a.action)}</td>
      <td class="name-cell">${actTarget(a)}</td>
      <td class="muted">${esc(a.details || "")}</td>
    </tr>`).join("")}
  </table></div>${pagerHTML(+q.page || 1, pages, d.total)}` : `<div class="empty">Još nema zapisa za ovaj filter. Svaka izmjena u adminu (cijene, zalihe, statusi narudžbi…) pojavit će se ovdje.</div>`}</div>`;
}

// Mali okvir "Zadnje izmjene" na stranici narudžbe / proizvoda
async function recentActivityHTML(type, id) {
  try {
    const { rows } = await api(`/api/admin/activity/${type}/${id}`);
    return `<div class="card"><div class="card-h"><h3>${ic("history")} Zadnje izmjene</h3></div>
      ${rows.length ? `<div class="card-b timeline-log">${rows.map((a) => `<div class="log-row">
        <div><b>${esc(a.user_name)}</b> · ${esc(a.action.toLowerCase())}${a.details ? `<div class="muted">${esc(a.details)}</div>` : ""}</div>
        <small class="muted">${fmtDateTime(a.created_at)}</small></div>`).join("")}</div>`
        : `<div class="card-b muted">Još nema izmjena.</div>`}</div>`;
  } catch { return ""; }
}

/* ---------- Vaučeri ---------- */
const today = () => new Date().toISOString().slice(0, 10);
const voucherValue = (v) => (v.type === "fixed" ? km(v.value) : `${String(v.value).replace(".", ",")}%`);
function voucherStatus(v) {
  if (!v.active) return `<span class="pill gray">Isključen</span>`;
  if (v.valid_until && v.valid_until < today()) return `<span class="pill gray">Istekao</span>`;
  if (v.max_uses != null && v.used >= v.max_uses) return `<span class="pill gray">Iskorišten</span>`;
  return `<span class="pill green">Aktivan</span>`;
}

async function vouchersView(editId) {
  const { rows } = await api("/api/admin/vouchers");
  const v = editId ? rows.find((x) => x.id === +editId) : null;
  const val = (k, d = "") => esc(v ? v[k] ?? d : d);
  return `
  <div class="top"><div><h1>Vaučeri</h1><div class="sub">Kodovi za popust koje kupci unose u korpi</div></div></div>
  <div class="grid3">
    <div class="card">
      ${rows.length ? `<div class="table-wrap"><table>
        <tr><th>Kod</th><th>Popust</th><th>Uslovi</th><th class="num">Korišten</th><th class="num">Dato popusta</th><th>Status</th><th></th></tr>
        ${rows.map((x) => `<tr>
          <td><b style="letter-spacing:.04em">${esc(x.code)}</b>${x.note ? `<div class="muted">${esc(x.note)}</div>` : ""}</td>
          <td><b>${voucherValue(x)}</b></td>
          <td class="muted">${x.min_total > 0 ? `od ${km(x.min_total)}` : "bez minimuma"}${x.valid_until ? `<br>do ${fmtDate(x.valid_until + " 00:00:00")}` : ""}</td>
          <td class="num">${x.used}${x.max_uses != null ? ` / ${x.max_uses}` : ""}</td>
          <td class="num">${km(x.given)}</td>
          <td>${voucherStatus(x)}</td>
          <td class="num"><div class="actions" style="justify-content:flex-end">
            <button class="btn sm" data-act="voucher-toggle" data-id="${x.id}">${x.active ? "Isključi" : "Uključi"}</button>
            <a class="btn sm" href="#/vauceri/${x.id}">Uredi</a>
            <button class="btn sm danger" data-act="voucher-del" data-id="${x.id}">Obriši</button></div></td>
        </tr>`).join("")}
      </table></div>` : `<div class="empty">Još nema vaučera. Napravite prvi pomoću forme desno — npr. <b>DOBRODOSLI10</b> za 10% popusta.</div>`}
    </div>
    <form class="card" data-f="voucher" data-id="${v ? v.id : ""}">
      <div class="card-h"><h3>${v ? "Uredi vaučer" : "Novi vaučer"}</h3>${v ? `<a class="btn sm" href="#/vauceri">Odustani</a>` : ""}</div>
      <div class="card-b form">
        <div class="err full" hidden></div>
        <label class="full">Kod <span class="hint">slova, brojevi, - i _ (npr. LJETO10)</span><input class="input" name="code" required value="${val("code")}" style="text-transform:uppercase" autocomplete="off"></label>
        <label>Vrsta popusta<select class="select" name="type">
          <option value="percent" ${!v || v.type === "percent" ? "selected" : ""}>Procenat (%)</option>
          <option value="fixed" ${v && v.type === "fixed" ? "selected" : ""}>Iznos (KM)</option></select></label>
        <label>Vrijednost<input class="input" name="value" required inputmode="decimal" value="${val("value")}" placeholder="npr. 10"></label>
        <label>Minimalan iznos korpe (KM)<input class="input" name="min_total" inputmode="decimal" value="${v && v.min_total ? esc(v.min_total) : ""}" placeholder="bez minimuma"></label>
        <label>Najviše korištenja<input class="input" name="max_uses" inputmode="numeric" value="${val("max_uses")}" placeholder="neograničeno"></label>
        <label>Vrijedi do (uključivo)<input class="input" name="valid_until" type="date" value="${val("valid_until")}"></label>
        <label>Napomena <span class="hint">samo za vas</span><input class="input" name="note" value="${val("note")}" placeholder="npr. Instagram akcija"></label>
        <label class="switch lbl full"><input type="checkbox" name="active" ${!v || v.active ? "checked" : ""}> Aktivan</label>
        <button class="btn dark full" type="submit" style="justify-content:center;height:42px">${v ? "Sačuvaj izmjene" : "Napravi vaučer"}</button>
      </div>
    </form>
  </div>`;
}

/* ---------- Postavke ---------- */
async function settingsView() {
  const s = await api("/api/admin/settings");
  const inp = (k, label, hint = "", type = "text", extra = "") => `<label>${label}${hint ? ` <span class="hint">${hint}</span>` : ""}<input class="input" name="${k}" type="${type}" value="${esc(s[k])}" ${extra}></label>`;
  return `
  <div class="top"><div><h1>Postavke</h1></div></div>
  <form data-f="settings" style="display:grid;gap:18px;max-width:900px">
    <div class="err" hidden></div>
    <div class="card"><div class="card-h"><h3>Prodavnica</h3></div><div class="card-b form">
      ${inp("shop_name", "Naziv firme", "prikazuje se u podnožju sajta, emailovima i podacima za uplatu")}${inp("company_jib", "JIB", "identifikacioni broj firme")}${inp("shop_email", "Email za kupce")}
      ${inp("shop_phone", "Telefon")}${inp("shop_address", "Adresa studija", "prikazuje se u podnožju sajta i za preuzimanje")}
      ${inp("order_notify_email", "Email za obavijesti o narudžbama", "ovdje stižu nove narudžbe i poruke")}
    </div></div>
    <div class="card"><div class="card-h"><h3>Dostava i plaćanje</h3></div><div class="card-b form">
      ${inp("shipping_fee", "Cijena dostave (KM)", "0 = besplatna dostava")}
      ${inp("free_shipping_over", "Besplatna dostava iznad (KM)", "0 = isključeno")}
      <label class="switch lbl full"><input type="checkbox" name="pickup_enabled" value="1" ${s.pickup_enabled === "1" ? "checked" : ""}> Kupci mogu preuzeti narudžbu u studiju (besplatno)</label>
      <label class="full">Podaci za uplatu na račun <span class="hint">{broj} se zamjenjuje brojem narudžbe</span><textarea class="input" name="bank_details" rows="4">${esc(s.bank_details)}</textarea></label>
    </div></div>
    <div class="card"><div class="card-h"><h3>Slanje emailova (SMTP)</h3><span class="muted">${s.smtp_host ? `<span class="pill green">Podešeno</span>` : `<span class="pill gold">Nije podešeno — emailovi se čuvaju u data/outbox</span>`}</span></div><div class="card-b form">
      ${inp("smtp_host", "SMTP server", "npr. mail.wiena.ba")}${inp("smtp_port", "Port", "587 ili 465")}
      ${inp("smtp_user", "Korisničko ime", "", "text", 'autocomplete="off"')}${inp("smtp_pass", "Lozinka", "", "password", 'autocomplete="new-password"')}
      ${inp("smtp_from", "Pošiljalac", 'npr. WIENA &lt;hello@wiena.ba&gt;')}
      <div class="actions full"><input class="input" id="test-to" type="email" placeholder="Pošalji test na…" value="${esc(me.email)}" style="flex:1"><button class="btn" type="button" data-act="test-email">Pošalji test email</button></div>
    </div></div>
    <div><button class="btn dark" type="submit" style="height:44px">Sačuvaj postavke</button></div>
  </form>`;
}

/* ---------- API i integracije (samo vlasnik) ---------- */
let reveal = null;     // novi API ključ / tajni ključ webhooka — prikazuje se odmah nakon pravljenja
let intPresets = {};   // gotovi izbori ovlasti (iz servera)
let docsData = null;   // podaci za stranicu dokumentacije (i "Isprobaj")
const scopePills = (s) => String(s || "").split(",").filter(Boolean).map((x) => `<span class="scope">${esc(x)}</span>`).join("");
const keyStatus = (k) => k.revoked_at ? `<span class="pill gray">Opozvan</span>`
  : k.expires_at && k.expires_at < today() ? `<span class="pill red">Istekao</span>` : `<span class="pill green">Aktivan</span>`;
const httpPill = (s) => `<span class="pill ${s >= 500 ? "red" : s >= 400 ? "gold" : "green"}">${s}</span>`;
const DELIVERY_STATUS = { ok: ["green", "Isporučeno"], pending: ["gold", "Čeka ponovni pokušaj"], failed: ["red", "Neuspjelo"] };
const prettyJson = (s) => { try { return JSON.stringify(typeof s === "string" ? JSON.parse(s) : s, null, 2); } catch { return String(s); } };
const timeHM = (ms) => { const d = new Date(ms); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const presetFor = (scopes) => Object.entries(intPresets).find(([, p]) => p.scopes.length === scopes.length && p.scopes.every((s) => scopes.includes(s)))?.[0] || "";

// Nasumična lozinka bez znakova koje je lako pobrkati (0/O, 1/l/I)
function randomPassword(len = 12) {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return [...crypto.getRandomValues(new Uint32Array(len))].map((n) => chars[n % chars.length]).join("");
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return; } catch { /* npr. http adresa bez dozvole za clipboard */ }
  const ta = Object.assign(document.createElement("textarea"), { value: text });
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
}

function revealHTML() {
  if (!reveal) return "";
  return `<div class="card reveal"><div class="card-h"><h3>${ic("key")} ${esc(reveal.title)}</h3><button class="btn sm" data-act="reveal-close">Sačuvao sam — sakrij</button></div>
    <div class="card-b" style="display:grid;gap:12px">
      <div class="secret-row"><input class="input" readonly value="${esc(reveal.value)}" onfocus="this.select()"><button class="btn dark" data-act="copy" data-copy="${esc(reveal.value)}">${ic("copy")} Kopiraj</button></div>
      <div class="note" style="margin:0">${ic("lock")} <span>${reveal.hint}</span></div>
      ${reveal.curl ? `<div><b>Brza provjera veze</b> <span class="muted">(firma koja radi integraciju ovo pokrene kod sebe)</span><pre class="code">${esc(reveal.curl)}</pre></div>` : ""}
    </div></div>`;
}

async function integrationsView(q) {
  const d = await api("/api/admin/integrations");
  intPresets = d.presets;
  const tab = ["kljucevi", "webhooks", "pozivi", "isporuke"].includes(q.tab) ? q.tab : "kljucevi";
  const tabs = [
    ["kljucevi", "API ključevi", d.keys.filter((k) => !k.revoked_at).length],
    ["webhooks", "Webhookovi", d.webhooks.length],
    ["pozivi", "Dnevnik API poziva"],
    ["isporuke", "Isporuke webhookova", d.stats.failedDeliveries ? `${d.stats.failedDeliveries} neuspjelih` : ""],
  ];
  const body = tab === "kljucevi" ? keysTab(d, q) : tab === "webhooks" ? webhooksTab(d, q) : tab === "pozivi" ? requestsTab(d) : deliveriesTab(d);
  return `
  <div class="top"><div><h1>API i integracije</h1><div class="sub">Pristup za vanjske sisteme — finansije, knjigovodstvo, ERP / skladište</div></div>
    <div class="actions"><a class="btn" href="#/api-dokumentacija">${ic("book")} API dokumentacija</a></div></div>
  <div class="kpis">
    <div class="card kpi"><small>Aktivni API ključevi</small><b>${d.stats.keys}</b><span>${d.webhooks.filter((w) => w.active).length} uključenih webhookova</span></div>
    <div class="card kpi"><small>API poziva (24 h)</small><b>${num(d.stats.requests24h)}</b><span>najviše ${d.rate_limit} u minuti po ključu</span></div>
    <div class="card kpi ${d.stats.errors24h ? "alert" : ""}"><small>Odbijeni pozivi (24 h)</small><b>${num(d.stats.errors24h)}</b><span>pogrešan ključ, ovlast ili parametar</span></div>
    <div class="card kpi ${d.stats.failedDeliveries ? "alert" : ""}"><small>Neuspjeli webhookovi (7 dana)</small><b>${d.stats.failedDeliveries}</b><span>nakon svih ponovnih pokušaja</span></div>
  </div>
  ${revealHTML()}
  <div class="tabs">${tabs.map(([k, t, n]) => `<button class="tab ${tab === k ? "on" : ""}" data-act="int-tab" data-tab="${k}">${t}${n ? ` <small>${n}</small>` : ""}</button>`).join("")}</div>
  ${body}`;
}

function keysTab(d, q) {
  const k = q.key ? d.keys.find((x) => x.id === +q.key && !x.revoked_at) : null;
  const chosen = k ? k.scopes.split(",") : d.presets.finance.scopes;
  return `<div class="grid3">
    <div class="card">${d.keys.length ? `<div class="table-wrap"><table>
      <tr><th>Naziv</th><th>Ključ</th><th>Ovlasti</th><th>Zadnje korišten</th><th class="num">Poziva</th><th>Status</th><th></th></tr>
      ${d.keys.map((x) => `<tr class="${x.revoked_at ? "is-hidden" : ""}">
        <td><b style="font-weight:600">${esc(x.name)}</b>${x.note ? `<div class="muted">${esc(x.note)}</div>` : ""}<div class="muted">${esc(x.created_by || "")} · ${fmtDate(x.created_at)}</div></td>
        <td><code class="inline">${esc(x.prefix)}…</code>${x.allowed_ips ? `<div class="muted">IP: ${esc(x.allowed_ips)}</div>` : ""}${x.expires_at ? `<div class="muted">važi do ${fmtDate(x.expires_at + " 00:00:00")}</div>` : ""}</td>
        <td>${scopePills(x.scopes)}</td>
        <td>${x.last_used_at ? `${fmtDateTime(x.last_used_at)}<div class="muted mono">${esc(x.last_ip || "")}</div>` : `<span class="muted">Još nije korišten</span>`}</td>
        <td class="num">${num(x.requests)}</td>
        <td>${keyStatus(x)}</td>
        <td class="num"><div class="actions" style="justify-content:flex-end">${x.revoked_at
          ? `<button class="btn sm danger" data-act="key-del" data-id="${x.id}" data-name="${esc(x.name)}">Obriši</button>`
          : `<a class="btn sm" href="#/integracije?tab=kljucevi&key=${x.id}">Uredi</a><button class="btn sm danger" data-act="key-revoke" data-id="${x.id}" data-name="${esc(x.name)}">Opozovi</button>`}</div></td>
      </tr>`).join("")}</table></div>`
      : `<div class="empty">${ic("key")}<br>Još nema API ključeva.<br>Napravite prvi pomoću forme desno — npr. <b>Knjigovodstvo</b> sa ovlastima za narudžbe i izvještaje.</div>`}
    </div>
    <form class="card" data-f="api-key" data-id="${k ? k.id : ""}">
      <div class="card-h"><h3>${k ? "Uredi API ključ" : "Novi API ključ"}</h3>${k ? `<a class="btn sm" href="#/integracije?tab=kljucevi">Odustani</a>` : ""}</div>
      <div class="card-b form">
        <div class="err full" hidden></div>
        <label class="full">Naziv <span class="hint">ko koristi ključ</span><input class="input" name="name" required maxlength="80" value="${esc(k ? k.name : "")}" placeholder="npr. Knjigovodstvo — agencija X"></label>
        <label class="full">Ovlasti — brzi izbor<select class="select" data-preset><option value="">— prilagođeno —</option>${Object.entries(d.presets).map(([id, p]) => `<option value="${id}" ${presetFor(chosen) === id ? "selected" : ""}>${esc(p.label)}</option>`).join("")}</select></label>
        <div class="full checks">${Object.entries(d.scopes).map(([s, desc]) => `<label><input type="checkbox" name="scopes" value="${s}" ${chosen.includes(s) ? "checked" : ""}><span><span class="scope">${s}</span><small>${esc(desc)}</small></span></label>`).join("")}</div>
        <label class="full">Dozvoljene IP adrese <span class="hint">opcionalno, odvojene zarezom — prazno = sve adrese</span><input class="input mono" name="allowed_ips" value="${esc(k ? k.allowed_ips : "")}" placeholder="npr. 185.12.34.56"></label>
        <label>Važi do <span class="hint">opcionalno</span><input class="input" type="date" name="expires_at" value="${esc(k ? k.expires_at || "" : "")}"></label>
        <label>Napomena <span class="hint">samo za vas</span><input class="input" name="note" maxlength="200" value="${esc(k ? k.note : "")}"></label>
        <button class="btn dark full" type="submit" style="justify-content:center;height:42px">${k ? "Sačuvaj izmjene" : `${ic("key")} Napravi ključ`}</button>
        ${k ? "" : `<p class="muted full">Ključ se prikaže samo jednom, odmah nakon pravljenja. Svaki partner treba dobiti svoj ključ, sa najmanjim ovlastima koje mu trebaju.</p>`}
      </div>
    </form>
  </div>`;
}

function webhooksTab(d, q) {
  const h = q.hook ? d.webhooks.find((x) => x.id === +q.hook) : null;
  return `<div class="grid3">
    <div class="card">${d.webhooks.length ? `<div class="table-wrap"><table>
      <tr><th>Naziv</th><th>Događaji</th><th>Zadnja isporuka</th><th>Status</th><th></th></tr>
      ${d.webhooks.map((w) => `<tr>
        <td><b style="font-weight:600">${esc(w.name)}</b><div class="muted url-cell mono" title="${esc(w.url)}">${esc(w.url)}</div></td>
        <td>${scopePills(w.events)}</td>
        <td>${w.last_at ? `${w.last_ok ? `<span class="pill green">Uspješno</span>` : `<span class="pill red">Greška</span>`}<div class="muted">${fmtDateTime(w.last_at)}${w.last_error ? " · " + esc(w.last_error) : ""}</div>` : `<span class="muted">Još ništa poslano</span>`}
          ${w.pending ? `<div class="muted">${w.pending} čeka ponovni pokušaj</div>` : ""}${w.failed ? `<div class="muted" style="color:var(--sale)">${w.failed} neuspjelih (7 dana)</div>` : ""}</td>
        <td>${w.active ? `<span class="pill green">Uključen</span>` : `<span class="pill gray">Isključen</span>`}</td>
        <td class="num"><div class="actions" style="justify-content:flex-end">
          <button class="btn sm" data-act="hook-test" data-id="${w.id}">${ic("send")} Test</button>
          <a class="btn sm" href="#/integracije?tab=webhooks&hook=${w.id}">Uredi</a>
          <button class="btn sm danger" data-act="hook-del" data-id="${w.id}" data-name="${esc(w.name)}">Obriši</button></div></td>
      </tr>`).join("")}</table></div>`
      : `<div class="empty">${ic("send")}<br>Još nema webhookova.<br>Webhook automatski javlja novu narudžbu ili promjenu statusa sistemu vašeg knjigovodstva ili ERP-a — bez čekanja.</div>`}</div>
    <form class="card" data-f="webhook" data-id="${h ? h.id : ""}">
      <div class="card-h"><h3>${h ? "Uredi webhook" : "Novi webhook"}</h3>${h ? `<a class="btn sm" href="#/integracije?tab=webhooks">Odustani</a>` : ""}</div>
      <div class="card-b form">
        <div class="err full" hidden></div>
        <label class="full">Naziv<input class="input" name="name" required maxlength="80" value="${esc(h ? h.name : "")}" placeholder="npr. Knjigovodstvo — narudžbe"></label>
        <label class="full">Adresa (URL) <span class="hint">dobijete je od firme koja radi integraciju</span><input class="input mono" name="url" required value="${esc(h ? h.url : "")}" placeholder="https://primjer.ba/wiena-webhook"></label>
        <div class="full checks">${Object.entries(d.events).map(([e, label]) => `<label><input type="checkbox" name="events" value="${e}" ${!h || h.events.split(",").includes(e) ? "checked" : ""}><span><span class="scope">${e}</span><small>${esc(label)}</small></span></label>`).join("")}</div>
        <label class="switch lbl full"><input type="checkbox" name="active" ${!h || h.active ? "checked" : ""}> Uključen</label>
        ${h ? `<div class="lbl full">Tajni ključ za potpis <span class="hint">primalac njime provjerava da poruka dolazi iz shopa</span>
          <div class="secret-row"><input class="input" type="password" id="hook-secret" readonly value="${esc(h.secret)}">
          <button class="btn sm" type="button" data-act="secret-show" title="Prikaži">${ic("eye")}</button>
          <button class="btn sm" type="button" data-act="copy" data-copy="${esc(h.secret)}">${ic("copy")} Kopiraj</button>
          <button class="btn sm danger" type="button" data-act="hook-secret" data-id="${h.id}">Novi ključ</button></div></div>` : ""}
        <button class="btn dark full" type="submit" style="justify-content:center;height:42px">${h ? "Sačuvaj izmjene" : "Dodaj webhook"}</button>
      </div>
    </form>
  </div>`;
}

function requestsTab(d) {
  return `<div class="card">${d.requests.length ? `<div class="table-wrap"><table>
    <tr><th>Vrijeme</th><th>Ključ</th><th>Zahtjev</th><th>Odgovor</th><th class="num">Trajanje</th><th>IP adresa</th></tr>
    ${d.requests.map((x) => `<tr><td style="white-space:nowrap">${fmtDateTime(x.created_at)}</td>
      <td>${x.key_name ? esc(x.key_name) : `<span class="muted">bez važećeg ključa</span>`}</td>
      <td><span class="method ${esc(x.method.toLowerCase())}">${esc(x.method)}</span> <span class="mono" style="font-size:12.5px;word-break:break-all">${esc(x.path)}</span></td>
      <td>${httpPill(x.status)}</td><td class="num muted">${x.ms} ms</td><td class="muted mono">${esc(x.ip)}</td></tr>`).join("")}
  </table></div><div class="pager"><span>Zadnjih ${d.requests.length} poziva · dnevnik se čuva 30 dana</span></div>`
    : `<div class="empty">Još nema API poziva. Svaki poziv (uspješan ili odbijen) pojavit će se ovdje.</div>`}</div>`;
}

function deliveriesTab(d) {
  return `<div class="card">${d.deliveries.length ? `<div class="table-wrap"><table>
    <tr><th>Vrijeme</th><th>Webhook</th><th>Događaj</th><th>Status</th><th>Odgovor primaoca</th><th></th></tr>
    ${d.deliveries.map((x) => {
      const [c, t] = DELIVERY_STATUS[x.status] || ["gray", x.status];
      return `<tr><td style="white-space:nowrap">${fmtDateTime(x.created_at)}</td><td>${esc(x.webhook_name || "(obrisan)")}</td>
        <td><span class="scope">${esc(x.event)}</span><details class="payload"><summary>Sadržaj</summary><pre class="code">${esc(prettyJson(x.payload))}</pre></details></td>
        <td><span class="pill ${c}">${t}</span><div class="muted">${x.attempts} ${x.attempts === 1 ? "pokušaj" : "pokušaja"}${x.status === "pending" && x.next_at ? ` · sljedeći u ${timeHM(x.next_at)}` : ""}</div></td>
        <td>${x.response_code ? httpPill(x.response_code) : ""}${x.error ? `<div class="muted">${esc(x.error)}</div>` : ""}</td>
        <td class="num">${x.status !== "ok" && x.webhook_name ? `<button class="btn sm" data-act="delivery-retry" data-id="${x.id}">Pošalji ponovo</button>` : ""}</td></tr>`;
    }).join("")}
  </table></div><div class="pager"><span>Zadnjih ${d.deliveries.length} isporuka · neuspjele se same ponavljaju (do 6 pokušaja tokom ~8,5 sati)</span></div>`
    : `<div class="empty">Još nema isporuka.</div>`}</div>`;
}

/* ---------- API dokumentacija ---------- */
const SIG_NODE = String.raw`// Node.js (Express) — prijem webhooka i provjera potpisa
const crypto = require("crypto");
const express = require("express");
const app = express();
const SECRET = process.env.WIENA_WEBHOOK_SECRET; // whsec_… iz admina

app.post("/wiena-webhook", express.raw({ type: "application/json" }), (req, res) => {
  const body = req.body.toString("utf8"); // tačno tijelo zahtjeva, PRIJE JSON.parse
  const m = /^t=(\d+),v1=([0-9a-f]{64})$/.exec(req.get("X-Wiena-Signature") || "");
  if (!m) return res.sendStatus(401);
  const expected = crypto.createHmac("sha256", SECRET).update(m[1] + "." + body).digest("hex");
  const fresh = Math.abs(Date.now() / 1000 - Number(m[1])) < 300; // ne stariji od 5 minuta
  if (!fresh || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(m[2]))) return res.sendStatus(401);

  const event = JSON.parse(body);
  // event.id je isti u svakom ponovnom pokušaju — preskočite ako je već obrađen
  if (event.event === "order.created") {
    const order = event.data.order;
    // … upis u knjigovodstvo
  }
  res.sendStatus(200); // odgovorite brzo (do 10 s)
});`;

const SIG_PHP = String.raw`<?php
// PHP — prijem webhooka i provjera potpisa
$secret = getenv('WIENA_WEBHOOK_SECRET'); // whsec_… iz admina
$body = file_get_contents('php://input'); // tačno tijelo zahtjeva
$header = $_SERVER['HTTP_X_WIENA_SIGNATURE'] ?? '';

if (!preg_match('/^t=(\d+),v1=([0-9a-f]{64})$/', $header, $m)) { http_response_code(401); exit; }
$expected = hash_hmac('sha256', $m[1] . '.' . $body, $secret);
if (abs(time() - (int)$m[1]) > 300 || !hash_equals($expected, $m[2])) { http_response_code(401); exit; }

$event = json_decode($body, true);
if ($event['event'] === 'order.created') {
    $order = $event['data']['order'];
    // … upis u knjigovodstvo; $event['id'] koristite za prepoznavanje duplikata
}
http_response_code(200);`;

const curlFor = (e, base) => {
  let s = `curl ${e.method === "GET" ? "" : "-X " + e.method + " "}"${base}${(e.sample || e.path) + (e.query || "")}" \\\n  -H "Authorization: Bearer rck_VAS_KLJUC"`;
  if (e.requestBody) s += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(e.requestBody)}'`;
  return s;
};
const tryPath = (e) => (e.sample || e.path) + (e.query || "");

async function apiDocsView() {
  const d = docsData = await api("/api/admin/api-docs");
  const base = d.site_url || location.origin;
  const local = /^https?:\/\/(localhost|127\.|\[::1\])/.test(base);
  const table = (head, rows) => `<div class="table-wrap"><table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
  const params = (rows, title) => rows && rows.length ? `<h4>${title}</h4>${table(["Naziv", "Tip", "Opis"], rows.map(([n, t, x]) => [`<code class="inline">${esc(n)}</code>`, `<span class="muted">${esc(t)}</span>`, esc(x)]))}` : "";
  const sec = (id, title, html) => `<div class="card" id="${id}"><div class="card-b"><h2>${title}</h2>${html}</div></div>`;
  const jump = (id, label) => `<a href="#" data-act="docs-jump" data-to="${id}">${label}</a>`;
  const orderExample = d.endpoints.find((e) => e.id === "order")?.response.data;
  const webhookExample = { id: "evt_3f9a1c0e8b7d4a2f9e6c5b4a3d2e1f00", event: "order.created", created_at: "2026-11-08T09:14:23.512Z", data: { order: orderExample } };

  return `
  <div class="top"><div><h1>API dokumentacija</h1><div class="sub">Za firme koje povezuju svoj sistem (finansije, knjigovodstvo, ERP) sa web shopom</div></div>
    <div class="actions no-print">${isOwner() ? `<a class="btn" href="#/integracije">${ic("key")} API ključevi</a>` : ""}<a class="btn" href="/api/v1/openapi.json" target="_blank">${ic("down")} OpenAPI (Postman)</a><button class="btn" data-act="print">${ic("print")} Štampaj / PDF</button></div></div>
  <div class="docs">
    <nav class="docs-toc">
      <div class="h">Osnove</div>
      ${jump("d-uvod", "Uvod")}${jump("d-start", "Brzi početak")}${jump("d-auth", "Prijava i sigurnost")}${jump("d-scopes", "Ovlasti")}${jump("d-format", "Odgovori, stranice, datumi")}${jump("d-errors", "Greške i ograničenja")}
      <div class="h">Endpointi</div>
      ${d.endpoints.map((e) => jump("ep-" + e.id, `<span class="method ${e.method.toLowerCase()}">${e.method}</span>${esc(e.title)}`)).join("")}
      <div class="h">Ostalo</div>
      ${jump("d-webhooks", "Webhookovi")}${jump("d-try", "Isprobaj API")}
    </nav>
    <div class="docs-body">
      ${sec("d-uvod", "Uvod", `
        <p>API omogućava vanjskim sistemima — knjigovodstvu, finansijskom softveru, ERP-u ili skladištu — da automatski preuzimaju narudžbe, izvještaje o prodaji i proizvode, te da mijenjaju status narudžbi, cijene i zalihe. Svaka izmjena preko API-ja vidi se u adminu (Aktivnosti) kao <b>„API: naziv ključa”</b>.</p>
        <dl class="kv">
          <dt>Osnovna adresa</dt><dd><code class="inline">${esc(base)}/api/v1</code></dd>
          <dt>Format</dt><dd>JSON (UTF-8). Liste se mogu preuzeti i kao CSV (<code class="inline">format=csv</code>).</dd>
          <dt>Iznosi</dt><dd>KM (BAM), brojevi sa decimalnom tačkom (npr. <code class="inline">301.2</code>).</dd>
          <dt>Vrijeme</dt><dd>Odgovori u UTC, ISO 8601 (<code class="inline">2026-11-08T09:14:22Z</code>). Datumi bez vremena u parametrima računaju se po vremenu shopa (${esc(d.timezone)}).</dd>
          <dt>Ograničenje</dt><dd>${d.rate_limit} zahtjeva u minuti po ključu.</dd>
          <dt>Specifikacija</dt><dd><a href="/api/v1/openapi.json" target="_blank" style="color:var(--blue)">openapi.json</a> — uvoz u Postman, Insomnia ili generator klijenta.</dd>
        </dl>
        ${local ? `<div class="note" style="margin:0">${ic("lock")} <span>Shop trenutno radi na ovom računaru (<b>${esc(base)}</b>), pa mu vanjski sistemi ne mogu pristupiti. Kad shop bude objavljen na internetu (Railway / vlastita domena) i postavljen <code class="inline">SITE_URL</code>, ova dokumentacija će automatski pokazivati pravu adresu.</span></div>` : ""}`)}

      ${sec("d-start", "Brzi početak", `
        <ol>
          <li>Vlasnik u ${isOwner() ? `<a href="#/integracije" style="color:var(--blue)">API i integracije</a>` : "API i integracije"} napravi API ključ sa ovlastima koje partner treba (npr. <span class="scope">orders:read</span><span class="scope">reports:read</span> za knjigovodstvo) i pošalje mu ključ i ovu dokumentaciju (dugme „Štampaj / PDF”).</li>
          <li>Partner provjeri vezu:<pre class="code">${esc(curlFor(d.endpoints[0], base))}</pre></li>
          <li>Za preuzimanje narudžbi: svakih 10–15 minuta pozvati <code class="inline">GET /api/v1/orders?updated_since=&lt;vrijeme zadnjeg preuzimanja&gt;&amp;sort=updated_at</code> i proći kroz sve stranice — ili postaviti <b>webhook</b>, pa shop sam javlja svaku novu narudžbu i promjenu statusa.</li>
          <li>Za mjesečno knjiženje: <code class="inline">GET /api/v1/reports/sales?from=2026-11-01&amp;to=2026-11-30</code> ili stavke kao CSV: <code class="inline">GET /api/v1/order-items?from=…&amp;to=…&amp;format=csv</code>.</li>
        </ol>`)}

      ${sec("d-auth", "Prijava i sigurnost", `
        <p>Svaki zahtjev mora imati API ključ u zaglavlju (ključ počinje sa <code class="inline">rck_</code>):</p>
        <pre class="code">Authorization: Bearer rck_VAS_KLJUC
# ili
X-API-Key: rck_VAS_KLJUC</pre>
        <ul>
          <li>Ključ čuvajte kao lozinku — na serveru, nikad u kodu web stranice ili mobilne aplikacije. API je namijenjen pozivima <b>server–server</b> (browser ne može pozvati API sa drugog sajta).</li>
          <li>Ključ se nikad ne šalje u adresi (<code class="inline">?key=</code>) — samo u zaglavlju.</li>
          <li>Svaki partner dobija svoj ključ sa najmanjim potrebnim ovlastima. Ključ može biti ograničen na IP adrese partnera i imati rok važenja.</li>
          <li>Ako ključ procuri, vlasnik ga u adminu <b>opozove</b> — prestaje raditi odmah — i napravi novi.</li>
          <li>Shop čuva samo otisak ključa (SHA-256), ne sam ključ: izgubljen ključ se ne može ponovo prikazati, samo zamijeniti.</li>
          <li>Na internetu shop radi isključivo preko HTTPS-a.</li>
        </ul>`)}

      ${sec("d-scopes", "Ovlasti (scopes)", `
        <p>Ključ smije samo ono za šta ima ovlast; ostalo vraća grešku <code class="inline">403 insufficient_scope</code>.</p>
        ${table(["Ovlast", "Šta omogućava"], Object.entries(d.scopes).map(([s, x]) => [`<span class="scope">${esc(s)}</span>`, esc(x)]))}`)}

      ${sec("d-format", "Odgovori, stranice i datumi", `
        <h4>Oblik odgovora</h4>
        <pre class="code">${esc(`// Lista
{ "data": [ … ], "pagination": { "page": 1, "per_page": 50, "total": 132, "pages": 3 } }

// Jedan zapis
{ "data": { … } }

// Greška
{ "error": { "code": "insufficient_scope", "message": "Ovaj ključ nema ovlast \\"products:read\\"." } }`)}</pre>
        <h4>Stranice</h4>
        <p>Liste vraćaju najviše <code class="inline">per_page</code> zapisa (zadano 50, najviše 200). Povećavajte <code class="inline">page</code> dok ne dođete do <code class="inline">pagination.pages</code>.</p>
        <h4>Datumi i sinhronizacija</h4>
        <ul>
          <li><code class="inline">from=2026-11-01&amp;to=2026-11-30</code> — cijeli dani po vremenu shopa (${esc(d.timezone)}), oba dana uključena.</li>
          <li><code class="inline">updated_since=2026-11-08T10:00:00Z</code> — tačan trenutak (ISO 8601 sa Z ili zonom). Sačuvajte vrijeme početka svakog preuzimanja i koristite ga sljedeći put.</li>
        </ul>
        <h4>CSV</h4>
        <p>Dodajte <code class="inline">format=csv</code> na liste narudžbi, stavki, proizvoda i kupaca: svi rezultati (do 50.000) u jednom fajlu, UTF-8 sa BOM, kolone odvojene tačka-zarezom (<code class="inline">;</code>), decimalna tačka. Otvara se direktno u Excelu.</p>
        <h4>Vrijednosti</h4>
        ${table(["Polje", "Vrijednosti"], [
          [`<code class="inline">status</code>`, Object.entries(STATUS).map(([k, v]) => `<code class="inline">${k}</code> ${v}`).join(" · ")],
          [`<code class="inline">payment.method</code>`, Object.entries(PAYMENT).map(([k, v]) => `<code class="inline">${k}</code> ${v}`).join(" · ")],
          [`<code class="inline">delivery.method</code>`, Object.entries(DELIVERY).map(([k, v]) => `<code class="inline">${k}</code> ${v}`).join(" · ")],
          [`<code class="inline">stock</code>`, "broj komada; <code class=\"inline\">null</code> = zaliha se ne prati (uvijek dostupno)"],
        ])}`)}

      ${sec("d-errors", "Greške i ograničenja", `
        ${table(["HTTP", "Kod", "Značenje"], d.errors.map(([s, c, x]) => [`<b>${s}</b>`, `<code class="inline">${esc(c)}</code>`, esc(x)]))}
        <p>Svaki odgovor ima zaglavlja <code class="inline">X-RateLimit-Limit</code>, <code class="inline">X-RateLimit-Remaining</code> i <code class="inline">X-RateLimit-Reset</code>. Kod greške 429 sačekajte broj sekundi iz <code class="inline">Retry-After</code>. Kod 500 ponovite zahtjev kasnije.</p>`)}

      ${d.endpoints.map((e) => `<div class="card ep" id="ep-${e.id}"><div class="card-b">
        <div class="ep-head"><span class="method ${e.method.toLowerCase()}">${e.method}</span><span class="ep-path">${esc(e.path)}</span>${e.scope ? `<span class="scope">${esc(e.scope)}</span>` : `<span class="scope none">bilo koji ključ</span>`}${e.csv ? `<span class="pill gray">CSV</span>` : ""}</div>
        <h2 style="font-size:19px">${esc(e.title)}</h2>
        <p>${esc(e.desc)}</p>
        ${params(e.params, "Parametri")}
        ${params(e.body, "Tijelo zahtjeva (JSON)")}
        <h4>Primjer zahtjeva</h4><pre class="code">${esc(curlFor(e, base))}</pre>
        <h4>Primjer odgovora</h4><pre class="code">${esc(prettyJson(e.response))}</pre>
      </div></div>`).join("")}

      ${sec("d-webhooks", "Webhookovi", `
        <p>Umjesto stalnog provjeravanja, shop može sam poslati podatke partneru čim se nešto desi. Vlasnik dodaje adresu partnera u <b>API i integracije → Webhookovi</b>.</p>
        ${table(["Događaj", "Kada se šalje", "data"], [
          [`<span class="scope">order.created</span>`, "Kupac je napravio narudžbu", `<code class="inline">{ order }</code>`],
          [`<span class="scope">order.status_changed</span>`, "Status je promijenjen (u adminu ili preko API-ja)", `<code class="inline">{ previous_status, order }</code>`],
          [`<span class="scope">ping</span>`, "Dugme „Test” u adminu", `<code class="inline">{ message }</code>`],
        ])}
        <h4>Zahtjev koji partner prima</h4>
        <pre class="code">${esc(`POST https://partner.ba/wiena-webhook
Content-Type: application/json
User-Agent: WienaShop-Webhooks/1.0
X-Wiena-Event: order.created
X-Wiena-Delivery: evt_3f9a1c0e8b7d4a2f9e6c5b4a3d2e1f00
X-Wiena-Signature: t=1762593263,v1=5d41402abc4b2a76b9719d911017c592…

`)}${esc(prettyJson(webhookExample))}</pre>
        <h4>Odgovor i ponovni pokušaji</h4>
        <ul>
          <li>Partner treba odgovoriti sa bilo kojim <b>2xx</b> statusom u roku od 10 sekundi (obradu raditi nakon toga).</li>
          <li>Ako odgovor ne stigne ili nije 2xx, shop pokušava ponovo nakon ${d.webhook.backoff_minutes.map((m) => (m < 60 ? `${m} min` : `${m / 60} h`)).join(", ")} — ukupno ${d.webhook.max_attempts} pokušaja. Vlasnik vidi sve isporuke i može ručno poslati ponovo.</li>
          <li>Polje <code class="inline">id</code> (i zaglavlje <code class="inline">X-Wiena-Delivery</code>) isto je u svakom ponovnom pokušaju — po njemu partner prepoznaje duplikate.</li>
        </ul>
        <h4>Provjera potpisa</h4>
        <p>Potpis je <code class="inline">HMAC-SHA256(tajni_ključ, t + "." + tijelo_zahtjeva)</code> u heks zapisu. Tajni ključ (<code class="inline">whsec_…</code>) vlasnik vidi u adminu kod webhooka. Provjerite potpis i da <code class="inline">t</code> nije stariji od 5 minuta, prije obrade.</p>
        <pre class="code">${esc(SIG_NODE)}</pre>
        <pre class="code">${esc(SIG_PHP)}</pre>`)}

      <div class="card try-card" id="d-try"><div class="card-b">
        <h2>Isprobaj API</h2>
        <p class="muted">Pošaljite pravi zahtjev iz ovog browsera. Ključ se nigdje ne čuva. <b>Pažnja:</b> PATCH zahtjevi zaista mijenjaju podatke u shopu.</p>
        <div class="form">
          <label class="full">API ključ<input class="input mono" id="try-key" type="password" placeholder="rck_…" autocomplete="off"></label>
          <label>Endpoint<select class="select" id="try-ep">${d.endpoints.map((e, i) => `<option value="${i}">${e.method} ${esc(e.path)} — ${esc(e.title)}</option>`).join("")}</select></label>
          <label>Adresa<input class="input mono" id="try-path" value="${esc(tryPath(d.endpoints[0]))}"></label>
          <label class="full" id="try-body-wrap" hidden>Tijelo zahtjeva (JSON)<textarea class="input mono" id="try-body" rows="4"></textarea></label>
          <div class="full actions"><button class="btn dark" type="button" data-act="try-send">${ic("send")} Pošalji zahtjev</button><span class="muted" id="try-status"></span></div>
        </div>
        <pre class="code try-out" id="try-out" hidden></pre>
      </div></div>
    </div>
  </div>`;
}

function fillTry() {
  const e = docsData?.endpoints[+$("#try-ep").value];
  if (!e) return;
  $("#try-path").value = tryPath(e);
  $("#try-body-wrap").hidden = !e.requestBody;
  $("#try-body").value = e.requestBody ? JSON.stringify(e.requestBody, null, 2) : "";
}

async function trySend(btn) {
  const e = docsData.endpoints[+$("#try-ep").value];
  const key = $("#try-key").value.trim();
  const path = $("#try-path").value.trim();
  const status = $("#try-status"), out = $("#try-out");
  if (!key) { status.textContent = "Unesite API ključ."; return; }
  // Samo ovaj shop — ključ ne smije otići na drugu adresu
  if (!path.startsWith("/api/v1")) { status.textContent = "Adresa mora počinjati sa /api/v1"; return; }
  if (e.method !== "GET" && !confirm(`${e.method} zahtjev MIJENJA podatke u shopu (${path}). Nastaviti?`)) return;
  btn.disabled = true;
  status.textContent = "Šaljem…";
  const t0 = performance.now();
  try {
    const res = await fetch(path, {
      method: e.method, credentials: "omit",
      headers: { Authorization: "Bearer " + key, ...(e.method !== "GET" ? { "Content-Type": "application/json" } : {}) },
      body: e.method !== "GET" ? $("#try-body").value : undefined,
    });
    const text = await res.text();
    const shown = res.headers.get("content-type")?.includes("json") ? prettyJson(text) : text;
    status.innerHTML = `${httpPill(res.status)} · ${Math.round(performance.now() - t0)} ms`;
    out.hidden = false;
    out.textContent = shown.length > 30000 ? shown.slice(0, 30000) + "\n… (skraćeno)" : shown;
  } catch (ex) {
    status.textContent = "Greška: " + ex.message;
  } finally {
    btn.disabled = false;
  }
}

/* ---------- Events ---------- */
document.addEventListener("click", async (e) => {
  const go = e.target.closest("[data-go]");
  if (go && !e.target.closest("a, button, input, select")) { location.hash = go.dataset.go; return; }
  const el = e.target.closest("[data-act], [data-bulk]");
  if (!el) return;
  if (el.dataset.bulk) return bulk(el.dataset.bulk);
  const { act, id } = el.dataset;
  try {
    switch (act) {
      case "logout": e.preventDefault(); await api("/api/auth/logout", { method: "POST", body: {} }); me = null; render(); break;
      case "page": setQuery({ page: el.dataset.page > 1 ? el.dataset.page : "" }); break;
      case "print": window.print(); break;
      case "vis": clearSelection(); setQuery({ vis: el.dataset.vis, page: "" }); break;
      case "role-tab": setQuery({ role: el.dataset.roleTab, page: "" }); break;
      case "restore": {
        const file = $("#restore-file")?.files[0];
        const err = $("#restore-err");
        if (!file) { err.hidden = false; err.textContent = "Prvo odaberite backup fajl (.zip ili .db)."; return; }
        if (!confirm(`Vratiti shop iz backupa "${file.name}"?\n\nSVI trenutni podaci biće zamijenjeni podacima iz ovog fajla. (Shop prije toga sam napravi sigurnosnu kopiju trenutnog stanja.)`)) return;
        el.disabled = true;
        el.textContent = "Vraćam…";
        try {
          const res = await fetch("/api/admin/restore", { method: "POST", headers: { "Content-Type": file.name.endsWith(".zip") ? "application/zip" : "application/octet-stream" }, body: file, credentials: "same-origin" });
          const d = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(d.error || "Vraćanje nije uspjelo.");
          alert(`Shop je vraćen iz backupa.\n\nProizvoda: ${d.products}\nNarudžbi: ${d.orders}\nKorisnika: ${d.users}\nSlika: ${d.images}\n\nPrijavite se ponovo.`);
          me = null;
          location.hash = "#/";
          render();
        } catch (ex) {
          err.hidden = false;
          err.textContent = ex.message;
          el.disabled = false;
          el.textContent = "Vrati iz backupa";
        }
        break;
      }
      case "act-filter": setQuery({ [el.dataset.k]: el.dataset.v, page: "" }); break;
      /* Prijava, tim */
      case "forgot-open": e.preventDefault(); $("#root").innerHTML = forgotView(); break;
      case "login-open": e.preventDefault(); render(); break;
      /* API i integracije */
      case "int-tab": setQuery({ tab: el.dataset.tab, key: "", hook: "" }); break;
      case "reveal-close": reveal = null; render(); break;
      case "copy": await copyText(el.dataset.copy); toast("Kopirano"); break;
      case "secret-show": { const i = $("#hook-secret"); i.type = i.type === "password" ? "text" : "password"; break; }
      case "key-revoke":
        if (!confirm(`Opozvati API ključ „${el.dataset.name}”?\n\nSistem koji ga koristi odmah gubi pristup. Ovo se ne može poništiti — za nastavak rada napravite novi ključ.`)) return;
        await api(`/api/admin/api-keys/${id}/revoke`, { method: "POST", body: {} });
        toast("Ključ je opozvan");
        location.hash = "#/integracije?tab=kljucevi";
        render();
        break;
      case "key-del":
        if (!confirm(`Obrisati opozvani ključ „${el.dataset.name}” sa liste?`)) return;
        await api("/api/admin/api-keys/" + id, { method: "DELETE" });
        toast("Ključ obrisan");
        render();
        break;
      case "hook-test": {
        el.disabled = true;
        const r = await api(`/api/admin/webhooks/${id}/test`, { method: "POST", body: {} }).finally(() => (el.disabled = false));
        toast(r.ok ? `Test uspješan — primalac je odgovorio HTTP ${r.code}` : `Test nije uspio: ${r.error}`, !r.ok);
        render();
        break;
      }
      case "hook-del":
        if (!confirm(`Obrisati webhook „${el.dataset.name}”? Partner više neće dobijati obavještenja.`)) return;
        await api("/api/admin/webhooks/" + id, { method: "DELETE" });
        toast("Webhook obrisan");
        location.hash = "#/integracije?tab=webhooks";
        render();
        break;
      case "hook-secret": {
        if (!confirm("Napraviti novi tajni ključ?\n\nStari prestaje važiti odmah — partner mora unijeti novi, inače će odbijati poruke.")) return;
        const r = await api(`/api/admin/webhooks/${id}/secret`, { method: "POST", body: {} });
        reveal = { title: "Novi tajni ključ webhooka", value: r.secret, hint: "Pošaljite ga partneru koji prima webhookove — njime provjerava da poruke zaista dolaze iz shopa." };
        render();
        break;
      }
      case "delivery-retry": {
        el.disabled = true;
        const r = await api(`/api/admin/webhook-deliveries/${id}/retry`, { method: "POST", body: {} }).finally(() => (el.disabled = false));
        toast(r.ok ? "Isporučeno" : `Nije uspjelo: ${r.error}`, !r.ok);
        render();
        break;
      }
      case "docs-jump": e.preventDefault(); document.getElementById(el.dataset.to)?.scrollIntoView({ behavior: "smooth", block: "start" }); break;
      case "try-send": await trySend(el); break;
      case "voucher-toggle": {
        const { rows } = await api("/api/admin/vouchers");
        const v = rows.find((x) => x.id === +id);
        await api("/api/admin/vouchers/" + id, { method: "PUT", body: { ...v, active: !v.active } });
        toast(v.active ? "Vaučer isključen" : "Vaučer uključen");
        render();
        break;
      }
      case "voucher-del":
        if (!confirm("Obrisati vaučer? Narudžbe koje su ga već koristile ostaju nepromijenjene.")) return;
        await api("/api/admin/vouchers/" + id, { method: "DELETE" });
        toast("Vaučer obrisan");
        location.hash = "#/vauceri";
        render();
        break;
      case "toggle-active": {
        const show = el.dataset.active === "1";
        el.disabled = true;
        await api("/api/admin/products/bulk", { method: "POST", body: { ids: [+id], action: show ? "activate" : "deactivate" } });
        toast(show ? "Proizvod je vraćen u shop" : "Proizvod je sakriven — kupci ga više ne vide");
        render();
        break;
      }
      case "status": {
        if (el.classList.contains("dark")) return; // to je već trenutni status
        const notify = $("#notify")?.checked;
        // Bilješka se šalje zajedno sa statusom da se nesačuvan tekst ne izgubi
        await api("/api/admin/orders/" + id, { method: "PATCH", body: { status: el.dataset.status, notify, admin_note: $("#admin-note")?.value } });
        toast("Status: " + STATUS[el.dataset.status] + (notify ? " — kupac obaviješten" : ""));
        render();
        break;
      }
      case "save-note": await api("/api/admin/orders/" + id, { method: "PATCH", body: { admin_note: $("#admin-note").value } }); toast("Bilješka sačuvana"); break;
      case "sel-all": {
        const ids = el.dataset.ids.split(",").map(Number);
        ids.forEach((x) => (el.checked ? selected.add(x) : selected.delete(x)));
        $$("[data-sel]").forEach((c) => { c.checked = el.checked; c.closest("tr").classList.toggle("sel", el.checked); });
        updateBulk();
        break;
      }
      case "clear-sel": selected.clear(); render(); break;
      case "del-product":
        if (!confirm("Obrisati ovaj proizvod? Ova radnja se ne može poništiti.\n\nSavjet: proizvod možete i samo sakriti.")) return;
        await api("/api/admin/products/" + id, { method: "DELETE" });
        toast("Proizvod obrisan");
        location.hash = "#/proizvodi";
        break;
      case "img-del": editImages.splice(+el.dataset.i, 1); renderImages(); break;
      case "img-first": { const i = +el.dataset.i; [editImages[i - 1], editImages[i]] = [editImages[i], editImages[i - 1]]; renderImages(); break; }
      case "add-cat": {
        const name_bs = prompt("Naziv nove kategorije (bosanski):");
        if (!name_bs) return;
        const name_en = prompt("Naziv na engleskom:", name_bs);
        if (!name_en) return;
        await api("/api/admin/categories", { method: "POST", body: { name_bs, name_en, textile: true, room: "Living" } });
        toast("Kategorija dodana");
        render();
        break;
      }
      case "del-cat": if (confirm("Obrisati praznu kategoriju?")) { await api("/api/admin/categories/" + id, { method: "DELETE" }); toast("Obrisano"); render(); } break;
      case "cat-move": await api(`/api/admin/categories/${id}/move`, { method: "POST", body: { dir: el.dataset.dir } }); render(); break;
      case "dup-product": {
        if (!confirm("Napraviti novu boju ovog modela?\n\nKopiraju se nazivi, opisi, cijene i veličine. Nova boja je sakrivena dok ne upišete boju, dodate slike i uključite „Prikazan u shopu“.")) return;
        const r = await api(`/api/admin/products/${id}/duplicate`, { method: "POST", body: {} });
        toast("Nova boja je napravljena — dopunite je i sačuvajte");
        location.hash = "#/proizvodi/" + r.id;
        break;
      }
      case "img-url": {
        const inp = $("#img-url");
        const u = inp.value.trim();
        if (!/^https:\/\/[^\s"'<>`\\]+$/.test(u)) { toast("Link mora počinjati sa https://", true); return; }
        editImages.push(u); inp.value = ""; renderImages();
        break;
      }
      case "msg-read": await api("/api/admin/messages/" + id, { method: "PATCH", body: { is_read: +el.dataset.read } }); render(); break;
      case "msg-del": if (confirm("Obrisati poruku?")) { await api("/api/admin/messages/" + id, { method: "DELETE" }); render(); } break;
      case "nl-del": if (confirm("Ukloniti " + el.dataset.email + " sa liste?")) { await api("/api/admin/newsletter/" + encodeURIComponent(el.dataset.email), { method: "DELETE" }); render(); } break;
      case "copy-emails": await navigator.clipboard.writeText(el.dataset.emails); toast("Adrese kopirane"); break;
      case "test-email": {
        el.disabled = true;
        const r = await api("/api/admin/test-email", { method: "POST", body: { to: $("#test-to").value } }).finally(() => (el.disabled = false));
        toast(r.outbox ? "SMTP nije podešen — email je sačuvan u data/outbox" : "Test email poslan");
        break;
      }
    }
  } catch (err) { toast(err.message, true); }
});

function clearSelection() {
  selected.clear();
  updateBulk();
}

function showRelogin() {
  if ($("#relogin")) return;
  const box = document.createElement("div");
  box.id = "relogin";
  box.className = "login overlay";
  box.innerHTML = loginView().replace(/^<div class="login">|<\/div>$/g, "");
  document.body.appendChild(box);
}

function updateBulk() {
  const bar = $("#bulk");
  if (!bar) return;
  bar.hidden = !selected.size;
  $("#bulk-n").textContent = selected.size + " odabrano";
}

async function bulk(action, value) {
  const ids = [...selected];
  if (!ids.length) return;
  if (action === "discount") { value = prompt("Popust u % (računa se od redovne cijene):", "20"); if (!value) return; }
  if (action === "stock") { value = prompt("Zaliha za odabrane proizvode (prazno = ne prati se):", ""); if (value === null) return; }
  if (action === "delete" && !confirm(`Trajno obrisati ${ids.length} proizvoda?`)) return;
  try {
    await api("/api/admin/products/bulk", { method: "POST", body: { ids, action, value } });
    toast(`Ažurirano: ${ids.length} proizvoda`);
    if (action === "delete") selected.clear();
    render();
  } catch (err) { toast(err.message, true); }
}

document.addEventListener("change", async (e) => {
  const t = e.target;
  try {
    if (t.dataset.preset !== undefined) {
      // Brzi izbor ovlasti za API ključ
      const p = intPresets[t.value];
      if (p) $$('input[name="scopes"]', t.form).forEach((c) => (c.checked = p.scopes.includes(c.value)));
      return;
    }
    if (t.name === "scopes" && t.form?.dataset.f === "api-key") {
      const sel = $("[data-preset]", t.form);
      if (sel) sel.value = presetFor($$('input[name="scopes"]:checked', t.form).map((c) => c.value));
      return;
    }
    if (t.id === "try-ep") { fillTry(); return; }
    if (t.dataset.sel) {
      t.checked ? selected.add(+t.dataset.sel) : selected.delete(+t.dataset.sel);
      t.closest("tr").classList.toggle("sel", t.checked);
      updateBulk();
    } else if (t.dataset.qs !== undefined) {
      clearSelection(); // novi filter = nova lista; skriveni odabrani proizvodi ne smiju ostati u grupnoj akciji
      setQuery({ [t.dataset.qs]: t.value, page: "" });
    } else if (t.id === "bulk-move" && t.value) {
      await bulk("move", t.value);
    } else if (t.dataset.quick) {
      // Brza izmjena cijene/zalihe direktno iz tabele
      const p = await api("/api/admin/products/" + t.dataset.id);
      const v = t.dataset.quick === "price" ? parseKm(t.value) : t.value.trim();
      const body = { ...p, [t.dataset.quick]: t.dataset.quick === "stock" && v === "" ? null : v };
      if (t.dataset.quick === "price" && p.old_price && +v >= p.old_price) body.old_price = null; // cijena više nije sniženje
      const saved = await api("/api/admin/products/" + t.dataset.id, { method: "PUT", body });
      // Osvježi red (stara cijena, oznake) prema sačuvanom stanju
      const row = t.closest("tr");
      $("[data-oldp]", row).innerHTML = oldPriceHTML(saved);
      $("[data-badges]", row).innerHTML = badgesHTML(saved);
      if (t.dataset.quick === "price") t.value = priceIn(saved.price);
      t.style.borderColor = "var(--emerald)";
      toast("Sačuvano: " + p.name_bs + " · " + p.colour_bs);
    } else if (t.dataset.c) {
      const box = t.closest("[data-cat]");
      const v = (k) => $(`[data-c="${k}"]`, box).value;
      await api("/api/admin/categories/" + box.dataset.cat, { method: "PUT", body: { name_bs: v("name_bs"), name_en: v("name_en"), blurb_bs: v("blurb_bs"), blurb_en: v("blurb_en"), room: v("room"), textile: v("textile") === "1" } });
      toast("Kategorija sačuvana");
    } else if (t.name === "swatch") {
      const c = t.parentElement.querySelector("code");
      if (c) c.textContent = t.value;
    } else if (t.dataset.upload !== undefined) {
      await uploadFiles([...t.files]);
    }
  } catch (err) {
    toast(err.message, true);
    if (t.dataset.quick) t.style.borderColor = "var(--sale)";
  }
});

let searchTimer;
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.search) { clearTimeout(searchTimer); searchTimer = setTimeout(() => { clearSelection(); setQuery({ [t.dataset.search]: t.value, page: "" }); }, 350); }
  if (t.name === "price" || t.name === "old_price") discountNote();
  if (t.name === "swatch") { const c = t.parentElement.querySelector("code"); if (c) c.textContent = t.value; }
});

// Prevlačenje slika na polje za upload (fajl ispušten pored polja ne smije otvoriti sliku i izgubiti izmjene)
document.addEventListener("dragover", (e) => { e.preventDefault(); e.target.closest?.("#drop")?.classList.add("over"); });
document.addEventListener("dragleave", (e) => e.target.closest?.("#drop")?.classList.remove("over"));
document.addEventListener("drop", (e) => {
  e.preventDefault();
  const d = e.target.closest?.("#drop");
  if (!d) return;
  d.classList.remove("over");
  uploadFiles([...e.dataTransfer.files].filter((f) => f.type.startsWith("image/")));
});

document.addEventListener("submit", async (e) => {
  const form = e.target;
  const kind = form.dataset.f;
  if (!kind) return;
  e.preventDefault();
  const err = $(".err", form);
  if (err) err.hidden = true;
  const btn = form.querySelector('[type="submit"]');
  if (btn) btn.disabled = true;
  const d = Object.fromEntries(new FormData(form));
  try {
    if (kind === "login") {
      const { user } = await api("/api/auth/login", { method: "POST", body: d });
      if (user.role !== "owner") {
        await api("/api/auth/logout", { method: "POST", body: {} });
        throw new Error("Ovaj račun nema pristup adminu.");
      }
      me = user;
      // Ponovna prijava nakon isteka sesije: zatvori prozor, stranica i izmjene ostaju
      if (form.closest("#relogin")) { $("#relogin").remove(); toast("Prijavljeni ste — sada ponovo kliknite Sačuvaj."); }
      else render();
    } else if (kind === "product") {
      const body = {
        ...d,
        active: form.elements.active.checked, is_new: form.elements.is_new.checked,
        price: parseKm(d.price),
        stock: d.stock.trim() === "" ? null : d.stock, old_price: d.old_price.trim() === "" ? null : parseKm(d.old_price),
        price_eur: d.price_eur.trim() === "" ? null : parseKm(d.price_eur), old_price_eur: d.old_price_eur.trim() === "" ? null : parseKm(d.old_price_eur),
        images: editImages,
      };
      const id = form.dataset.id;
      const saved = await api(id ? "/api/admin/products/" + id : "/api/admin/products", { method: id ? "PUT" : "POST", body });
      toast(id ? "Izmjene sačuvane" : "Proizvod dodan");
      if (!id) location.hash = "#/proizvodi/" + saved.id; else render();
    } else if (kind === "voucher") {
      const id = form.dataset.id;
      const body = { ...d, code: d.code.trim().toUpperCase(), value: parseKm(d.value), min_total: d.min_total ? parseKm(d.min_total) : "", active: form.elements.active.checked };
      await api(id ? "/api/admin/vouchers/" + id : "/api/admin/vouchers", { method: id ? "PUT" : "POST", body });
      toast(id ? "Vaučer sačuvan" : `Vaučer ${body.code} je napravljen`);
      if (id) location.hash = "#/vauceri"; else render();
    } else if (kind === "forgot") {
      await api("/api/auth/forgot", { method: "POST", body: d });
      form.innerHTML = `<span class="wordmark big">WIENA</span><div style="text-align:center"><h1>Provjerite email</h1>
        <p class="muted">Ako je ${esc(d.email)} email vlasnika, poslali smo link za novu lozinku (vrijedi 1 sat). Ako email ne stigne, novu lozinku možete postaviti na računaru gdje radi shop: npm run create-admin -- email nova-lozinka</p></div>
        <a href="#" class="btn" data-act="login-open" style="justify-content:center">Nazad na prijavu</a>`;
    } else if (kind === "reset") {
      await api("/api/auth/reset", { method: "POST", body: d });
      const r = await api("/api/auth/me");
      me = r.user;
      toast("Lozinka je postavljena");
      location.hash = "#/";
      render();
    } else if (kind === "profile") {
      const r = await api("/api/account", { method: "PUT", body: d });
      me = r.user;
      toast("Podaci sačuvani");
      render();
    } else if (kind === "my-password") {
      await api("/api/account/password", { method: "PUT", body: d });
      form.reset();
      toast("Lozinka je promijenjena");
    } else if (kind === "api-key") {
      const id = form.dataset.id;
      const body = { ...d, scopes: new FormData(form).getAll("scopes") };
      if (id) {
        await api("/api/admin/api-keys/" + id, { method: "PUT", body });
        toast("Ključ sačuvan");
        location.hash = "#/integracije?tab=kljucevi";
      } else {
        const r = await api("/api/admin/api-keys", { method: "POST", body });
        reveal = {
          title: `Novi API ključ: ${r.name}`, value: r.key,
          hint: "<b>Kopirajte ključ sada</b> — iz sigurnosnih razloga više se neće prikazati. Pošaljite ga partneru sigurnim putem. Ako se izgubi, opozovite ga i napravite novi.",
          curl: `curl "${docsData?.site_url || location.origin}/api/v1" -H "Authorization: Bearer ${r.key}"`,
        };
        render();
      }
    } else if (kind === "webhook") {
      const id = form.dataset.id;
      const body = { ...d, events: new FormData(form).getAll("events"), active: form.elements.active.checked };
      if (id) {
        await api("/api/admin/webhooks/" + id, { method: "PUT", body });
        toast("Webhook sačuvan");
        location.hash = "#/integracije?tab=webhooks";
      } else {
        const r = await api("/api/admin/webhooks", { method: "POST", body });
        reveal = { title: `Webhook „${body.name}” je dodan — tajni ključ za potpis`, value: r.secret, hint: "Pošaljite tajni ključ partneru koji prima webhookove — njime provjerava da poruke zaista dolaze iz shopa. Uvijek ga možete ponovo vidjeti klikom na „Uredi”. Kliknite „Test” da provjerite vezu." };
        render();
      }
    } else if (kind === "settings") {
      await api("/api/admin/settings", { method: "PUT", body: { ...d, pickup_enabled: form.elements.pickup_enabled.checked ? "1" : "0" } });
      toast("Postavke sačuvane");
      render();
    }
  } catch (ex) {
    if (err) { err.hidden = false; err.textContent = ex.message; err.scrollIntoView({ block: "center", behavior: "smooth" }); }
    else toast(ex.message, true);
  } finally {
    if (btn && btn.isConnected) btn.disabled = false;
  }
});

window.addEventListener("hashchange", () => {
  if (!location.hash.startsWith("#/proizvodi")) selected.clear();
  if (!location.hash.startsWith("#/integracije")) reveal = null; // novi ključ se ne prikazuje ponovo nakon odlaska sa stranice
  render();
});
// Nakon iscrtavanja forme proizvoda popuni slike i oznaku popusta
new MutationObserver(() => { if ($("#imgs") && !$("#imgs").children.length) { renderImages(); discountNote(); } }).observe($("#root"), { childList: true, subtree: true });

/* ---------- Init ---------- */
api("/api/auth/me").then((r) => { me = r.user && r.user.role === "owner" ? r.user : null; }).catch(() => {}).finally(render);
