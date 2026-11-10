/* WIENA — DEMO verzija (Vercel / statički hosting, bez servera).
   Presreće pozive na /api: narudžba, vaučer i newsletter se simuliraju u browseru posjetioca.
   Ništa se ne šalje i ništa se ne naplaćuje. Vaučer za probu: DEMO10 (10 %). */
(function () {
  const realFetch = window.fetch.bind(window);
  const ok = (status, data) => Promise.resolve(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }));
  const D = () => window.WIENA_DATA || { products: [], settings: {} };
  const body = (init) => { try { return JSON.parse((init && init.body) || '{}'); } catch (e) { return {}; } };
  const r2 = (n) => Math.round(n * 100) / 100;

  function voucher(code, subtotal) {
    if (String(code || '').trim().toUpperCase() !== 'DEMO10') return null;
    return { voucher: { code: 'DEMO10', type: 'percent', value: 10, min_total: 0 }, discount: r2(subtotal * 0.1) };
  }
  const subtotalOf = (items) => (items || []).reduce((s, it) => {
    const p = D().products.find((x) => x.id === +it.id);
    return p ? s + p.price * Math.max(1, Math.floor(+it.qty || 1)) : s;
  }, 0);

  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input.url;
    const method = ((init && init.method) || 'GET').toUpperCase();
    const path = url.replace(location.origin, '').split('?')[0];

    if (path === '/api/newsletter' && method === 'POST') return ok(201, { ok: true });

    if (path === '/api/vouchers/check' && method === 'POST') {
      const b = body(init);
      const v = voucher(b.code, subtotalOf(b.items));
      return v ? ok(200, v) : ok(400, { error: 'Vaučer ne postoji ili nije aktivan. U demo verziji probajte DEMO10.' });
    }

    if (path === '/api/orders' && method === 'POST') {
      const b = body(init), s = D().settings || {};
      const problems = [];
      for (const it of b.items || []) {
        const p = D().products.find((x) => x.id === +it.id);
        if (!p) problems.push({ id: +it.id, reason: 'nedostupan' });
        else if (p.stock != null && p.stock < it.qty) problems.push({ id: p.id, reason: 'zaliha', available: p.stock });
      }
      if (problems.length) return ok(409, { error: 'Neki artikli više nisu dostupni u traženoj količini.', problems });
      const subtotal = r2(subtotalOf(b.items));
      const v = b.voucher ? voucher(b.voucher, subtotal) : null;
      const discount = v ? v.discount : 0;
      const after = subtotal - discount;
      const shipping = b.delivery === 'posta' && !(s.free_shipping_over > 0 && after >= s.free_shipping_over) ? s.shipping_fee || 0 : 0;
      const n = (+localStorage.getItem('wiena_demo_orders') || 0) + 1;
      localStorage.setItem('wiena_demo_orders', n);
      const number = `DEMO-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`;
      return ok(201, {
        number, subtotal, shipping, total: r2(after + shipping), discount, payment: b.payment,
        bank_details: b.payment === 'racun' ? String(s.bank_details || '').replace('{broj}', number) : null
      });
    }

    if (path.indexOf('/api/') === 0 && path !== '/api/catalog.js') return ok(503, { error: 'Demo verzija — ova funkcija radi u punoj verziji shopa.' });
    return realFetch(input, init);
  };

  // Jasna oznaka na stranici za narudžbu
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.page !== 'checkout') return;
    const bs = (localStorage.getItem('wiena_lang') || 'bs') !== 'en';
    const note = document.createElement('div');
    note.className = 'demo-note';
    note.innerHTML = bs
      ? '<b>Demo verzija</b> — narudžba se ne šalje i ništa se ne naplaćuje. Kod za popust za probu: <b>DEMO10</b>'
      : '<b>Demo version</b> — orders are not sent and nothing is charged. Try the discount code <b>DEMO10</b>';
    const head = document.querySelector('.co-head');
    if (head) head.appendChild(note);
  });
})();
