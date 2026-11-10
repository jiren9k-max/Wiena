// Slanje emailova. Ako SMTP nije podešen (Admin → Postavke), emailovi se snimaju u data/outbox/.
// Kupac dobija email na jeziku na kojem je naručio (bosanski ili engleski); obavijesti za tim su na bosanskom.
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { getSettings, DATA_DIR } = require("./db");

const OUTBOX = path.join(DATA_DIR, "outbox");
const SITE_URL = (process.env.SITE_URL || "http://localhost:5174").replace(/\/$/, "");

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const km = (n) => {
  const [i, d] = Number(n).toFixed(2).split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + d + " KM";
};

async function send(to, subject, html) {
  const s = getSettings();
  const from = s.smtp_from || `${s.shop_name} <${s.shop_email}>`;
  const doc = layout(s, subject, html);
  if (!s.smtp_host) {
    fs.mkdirSync(OUTBOX, { recursive: true });
    const name = `${new Date().toISOString().replace(/[:.]/g, "-")}-${subject.replace(/[^\w]+/g, "-").slice(0, 40)}.html`;
    fs.writeFileSync(path.join(OUTBOX, name), `<!-- To: ${esc(to)} | From: ${esc(from)} -->\n${doc}`);
    console.log(`[email → outbox] ${to}: ${subject}`);
    return { outbox: name };
  }
  const transport = nodemailer.createTransport({
    host: s.smtp_host,
    port: +s.smtp_port || 587,
    secure: +s.smtp_port === 465,
    auth: s.smtp_user ? { user: s.smtp_user, pass: s.smtp_pass } : undefined,
  });
  return transport.sendMail({ from, to, subject, html: doc });
}

// Greške pri slanju se bilježe, ali ne ruše narudžbu
const sendSafe = (...a) => send(...a).catch((e) => console.error("[email greška]", e.message));

const SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif";
const btn = (href, text) => `<a href="${href}" style="display:inline-block;background:#1f1c19;color:#f4ede1;padding:13px 26px;text-decoration:none;font-size:12px;letter-spacing:.14em;text-transform:uppercase">${text}</a>`;

function layout(s, title, body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f4ede1;font-family:Helvetica,Arial,sans-serif;color:#1f1c19">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fbf8f2">
<tr><td align="center" style="padding:30px 32px 22px;border-bottom:1px solid #e4dccd"><a href="${SITE_URL}" style="font-family:${SERIF};font-size:30px;letter-spacing:.32em;color:#1f1c19;text-decoration:none">WIENA</a></td></tr>
<tr><td style="padding:34px 36px;font-size:15px;line-height:1.65">${body}</td></tr>
<tr><td style="padding:22px 36px;border-top:1px solid #e4dccd;font-size:12px;color:#7a7268;line-height:1.7">
${esc(s.shop_name)}${s.company_jib ? " · JIB " + esc(s.company_jib) : ""}<br>${esc(s.shop_address || "")}<br>${esc(s.shop_phone)} · <a href="mailto:${esc(s.shop_email)}" style="color:#8a5a3c">${esc(s.shop_email)}</a></td></tr>
</table></td></tr></table></body></html>`;
}

const T = {
  bs: {
    delivery: { posta: "Dostava na adresu", studio: "Preuzimanje u studiju" },
    payment: { pouzece: "Plaćanje pouzećem", racun: "Uplata na račun" },
    subtotal: "Međuzbir", voucher: "Vaučer", shipping: "Dostava", free: "Besplatno", total: "Ukupno", size: "Veličina", code: "Šifra",
    pay: "Plaćanje", note: "Napomena", bank: "Podaci za uplatu", deliveryTitle: "Podaci za dostavu",
    confirmSubject: (n) => `Potvrda narudžbe ${n}`, thanks: "Hvala na narudžbi",
    confirmText: (n) => `Zaprimili smo vašu narudžbu <b>${esc(n)}</b>. Javit ćemo vam se uskoro radi potvrde i dogovora oko dostave.`,
    statusSubject: (n, st) => `Narudžba ${n}: ${st}`, status: "Status", order: "Narudžba",
    statusText: {
      potvrdjena: "Vaša narudžba je potvrđena i pripremamo je za slanje.",
      poslana: "Vaša narudžba je poslana. Kurir će vas kontaktirati prije isporuke.",
      isporucena: "Vaša narudžba je isporučena. Hvala vam na povjerenju!",
      otkazana: "Vaša narudžba je otkazana. Za sva pitanja slobodno nas kontaktirajte.",
    },
    statusName: { nova: "Nova", potvrdjena: "Potvrđena", poslana: "Poslana", isporucena: "Isporučena", otkazana: "Otkazana" },
  },
  en: {
    delivery: { posta: "Home delivery", studio: "Studio pick-up" },
    payment: { pouzece: "Cash on delivery", racun: "Bank transfer" },
    subtotal: "Subtotal", voucher: "Voucher", shipping: "Shipping", free: "Free", total: "Total", size: "Size", code: "SKU",
    pay: "Payment", note: "Note", bank: "Bank transfer details", deliveryTitle: "Delivery details",
    confirmSubject: (n) => `Order confirmation ${n}`, thanks: "Thank you for your order",
    confirmText: (n) => `We have received your order <b>${esc(n)}</b>. We will be in touch shortly to confirm it and arrange delivery. Amounts are charged in convertible marks (KM).`,
    statusSubject: (n, st) => `Order ${n}: ${st}`, status: "Status", order: "Order",
    statusText: {
      potvrdjena: "Your order has been confirmed and we are preparing it for dispatch.",
      poslana: "Your order is on its way. The courier will contact you before delivery.",
      isporucena: "Your order has been delivered. Thank you for shopping with us!",
      otkazana: "Your order has been cancelled. Please get in touch if you have any questions.",
    },
    statusName: { nova: "New", potvrdjena: "Confirmed", poslana: "Shipped", isporucena: "Delivered", otkazana: "Cancelled" },
  },
};
const STATUS = T.bs.statusName;
const tr = (o) => T[o.lang === "en" ? "en" : "bs"];

function itemsTable(order, items, L) {
  const rows = items.map((i) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e4dccd">${esc(i.name)}<br><small style="color:#7a7268">${[i.colour, i.size ? `${L.size}: ${i.size}` : "", `${L.code}: ${i.code}`].filter(Boolean).map(esc).join(" · ")} · ${i.qty} × ${km(i.price)}</small></td>
    <td align="right" style="padding:10px 0;border-bottom:1px solid #e4dccd;white-space:nowrap">${km(i.price * i.qty)}</td></tr>`).join("");
  const ship = order.delivery === "posta" ? (order.shipping > 0 ? km(order.shipping) : L.free) : L.free;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}
    <tr><td style="padding:12px 0 0">${L.subtotal}</td><td align="right" style="padding:12px 0 0">${km(order.subtotal)}</td></tr>
    ${order.discount > 0 ? `<tr><td style="color:#8a5a3c">${L.voucher} ${esc(order.voucher_code)}</td><td align="right" style="color:#8a5a3c">−${km(order.discount)}</td></tr>` : ""}
    <tr><td>${L.shipping}</td><td align="right">${ship}</td></tr>
    <tr><td style="padding-top:10px;font-family:${SERIF};font-size:22px">${L.total}</td><td align="right" style="padding-top:10px;font-family:${SERIF};font-size:22px">${km(order.total)}</td></tr></table>`;
}

function customerBlock(o, L) {
  return `<p style="font-size:14px;color:#4a443d">
    <b>${esc(o.first_name)} ${esc(o.last_name)}</b><br>${esc(o.phone)} · ${esc(o.email)}<br>
    ${o.delivery === "posta" ? `${esc(o.address)}, ${esc(o.zip)} ${esc(o.city)}<br>` : ""}
    ${L.delivery[o.delivery] || ""}<br>${L.pay}: ${L.payment[o.payment] || ""}
    ${o.note ? `<br>${L.note}: <i>${esc(o.note)}</i>` : ""}</p>`;
}

const h2 = (t) => `<h2 style="font-family:${SERIF};font-weight:400;font-size:30px;margin:0 0 14px">${t}</h2>`;

function orderEmails(order, items) {
  const s = getSettings();
  const L = tr(order);
  const bank = order.payment === "racun"
    ? `<div style="background:#efe6d6;padding:16px 18px;margin:20px 0;font-size:14px"><b>${L.bank}</b><br>${esc(s.bank_details.replace("{broj}", order.number)).replace(/\n/g, "<br>")}</div>`
    : "";
  sendSafe(order.email, L.confirmSubject(order.number), `
    ${h2(L.thanks)}<p>${L.confirmText(order.number)}</p>
    ${bank}${itemsTable(order, items, L)}<h3 style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin:28px 0 6px">${L.deliveryTitle}</h3>${customerBlock(order, L)}`);
  if (s.order_notify_email) sendSafe(s.order_notify_email, `Nova narudžba ${order.number} — ${km(order.total)}`, `
    ${h2(`Nova narudžba ${esc(order.number)}`)}
    ${order.lang === "en" ? `<p style="font-size:13px;color:#7a7268">Kupac je naručio na engleskoj verziji sajta.</p>` : ""}
    ${customerBlock(order, T.bs)}${itemsTable(order, items, T.bs)}
    <p style="margin-top:24px">${btn(`${SITE_URL}/admin/#/narudzbe/${order.id}`, "Otvori u adminu")}</p>`);
}

function statusEmail(order) {
  const L = tr(order);
  const msg = L.statusText[order.status];
  if (!msg) return;
  sendSafe(order.email, L.statusSubject(order.number, L.statusName[order.status]), `
    ${h2(`${L.order} ${esc(order.number)}`)}
    <p>${msg}</p><p>${L.status}: <b>${L.statusName[order.status]}</b></p>`);
}

function resetEmail(user, token) {
  sendSafe(user.email, "Promjena lozinke", `
    ${h2("Promjena lozinke")}
    <p>Zatražili ste promjenu lozinke za WIENA admin. Link vrijedi 1 sat:</p>
    <p>${btn(`${SITE_URL}/admin/#/nova-lozinka/${token}`, "Postavi novu lozinku")}</p>
    <p style="color:#7a7268;font-size:13px">Ako niste vi zatražili promjenu, zanemarite ovaj email.</p>`);
}

function contactEmail(m) {
  const s = getSettings();
  sendSafe(s.order_notify_email || s.shop_email, `Nova poruka: ${m.subject || "Kontakt forma"}`, `
    ${h2("Nova poruka sa sajta")}
    <p><b>${esc(m.name)}</b> · ${esc(m.email)} ${m.phone ? "· " + esc(m.phone) : ""}</p>
    <p style="white-space:pre-wrap;background:#efe6d6;padding:16px">${esc(m.body)}</p>`);
}

module.exports = { send, orderEmails, statusEmail, resetEmail, contactEmail, STATUS };
