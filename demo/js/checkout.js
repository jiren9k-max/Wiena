/* WIENA — checkout: contact, delivery, payment, discount code, order summary.
   Prices shown are in the visitor's currency; the server recalculates everything in KM
   from the database, so nothing sent from the browser decides the amount charged. */
(function () {
  const W = window.WIENA, S = window.SITE, $ = S.$, $$ = S.$$, t = S.t, L = S.L, esc = S.esc;
  const body = $('#coBody');
  const set = W.settings || {};
  const bs = L.lang === 'bs';
  const EUR_BAM = 1.95583;
  const kmFmt = (n) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' KM';
  const fmt2 = (n) => (Math.round(n) === n ? L.fmt(n) : bs ? kmFmt(n) : '€' + n.toFixed(2));

  let voucher = null;           // { code, type, value, min_total }
  const saved = (() => { try { return JSON.parse(localStorage.getItem('wiena_checkout')) || {}; } catch (e) { return {}; } })();
  const state = { delivery: saved.delivery === 'studio' && set.pickup ? 'studio' : 'posta', payment: saved.payment === 'racun' ? 'racun' : 'pouzece' };

  function totals() {
    const cart = S.store.cart;
    const sub = cart.reduce((a, l) => a + W.get(l.id).price * l.qty, 0);
    const subKm = cart.reduce((a, l) => a + W.get(l.id).priceKm * l.qty, 0);
    let disc = 0, discKm = 0;
    if (voucher && subKm >= (voucher.min_total || 0)) {
      if (voucher.type === 'fixed') { discKm = Math.min(voucher.value, subKm); disc = Math.min(bs ? voucher.value : voucher.value / EUR_BAM, sub); }
      else { discKm = (subKm * voucher.value) / 100; disc = (sub * voucher.value) / 100; }
    }
    const freeKm = set.free_shipping_over || 0, feeKm = set.shipping_fee || 0;
    const free = state.delivery !== 'posta' || (freeKm > 0 && subKm - discKm >= freeKm);
    const ship = free ? 0 : L.shipFee, shipKm = free ? 0 : feeKm;
    return { cart, sub, disc, ship, total: sub - disc + ship, totalKm: subKm - discKm + shipKm };
  }

  const field = (name, label, type, attrs) => `<label class="co-field"><span>${label}</span><input name="${name}" type="${type || 'text'}" value="${esc(saved[name] || '')}" ${attrs || ''}></label>`;
  const option = (group, val, title, sub) => `<label class="co-opt ${state[group] === val ? 'on' : ''}"><input type="radio" name="${group}" value="${val}" ${state[group] === val ? 'checked' : ''}><i></i><span><b>${title}</b><small>${sub}</small></span></label>`;

  function render() {
    const cart = S.store.cart;
    if (!cart.length) {
      body.innerHTML = `<div class="co-empty" data-reveal><p class="serif">${t('co.empty')}</p><a href="shop.html" class="btn">${t('co.back')} ${S.ICON.arrow}</a></div>`;
      S.observe(body);
      return;
    }
    body.innerHTML = `<form class="co-grid" id="coForm" novalidate>
      <div class="co-main">
        <fieldset class="co-sec" data-reveal><legend><em>01</em>${t('co.contact')}</legend>
          <div class="co-row">${field('first_name', t('co.first'), 'text', 'required autocomplete="given-name"')}${field('last_name', t('co.last'), 'text', 'required autocomplete="family-name"')}</div>
          <div class="co-row">${field('email', t('co.email'), 'email', 'required autocomplete="email"')}${field('phone', t('co.phone'), 'tel', 'required autocomplete="tel"')}</div>
        </fieldset>
        <fieldset class="co-sec" data-reveal style="--i:1"><legend><em>02</em>${t('co.delivery')}</legend>
          <div class="co-opts">${option('delivery', 'posta', t('co.d.posta'), t('co.d.postaSub'))}${set.pickup ? option('delivery', 'studio', t('co.d.studio'), t('co.d.studioSub', { addr: esc(set.shop_address || '') })) : ''}</div>
          <div class="co-addr" ${state.delivery === 'posta' ? '' : 'hidden'}>
            ${field('address', t('co.address'), 'text', 'autocomplete="street-address"')}
            <div class="co-row">${field('city', t('co.city'), 'text', 'autocomplete="address-level2"')}${field('zip', t('co.zip'), 'text', 'autocomplete="postal-code" inputmode="numeric"')}</div>
          </div>
        </fieldset>
        <fieldset class="co-sec" data-reveal style="--i:2"><legend><em>03</em>${t('co.payment')}</legend>
          <div class="co-opts">${option('payment', 'pouzece', t('co.p.pouzece'), t('co.p.pouzeceSub'))}${option('payment', 'racun', t('co.p.racun'), t('co.p.racunSub'))}</div>
          <label class="co-field co-field--area"><span>${t('co.note')}</span><textarea name="note" rows="3" placeholder="${esc(t('co.notePh'))}"></textarea></label>
        </fieldset>
      </div>
      <aside class="co-side" data-reveal="fade">
        <div class="co-card">
          <div class="co-card__head"><h3>${t('co.summary')}</h3><button type="button" class="link-u js-edit-bag">${t('co.edit')}</button></div>
          <div class="co-lines" id="coLines"></div>
          <div class="co-voucher" id="coVoucher"></div>
          <div class="co-sums" id="coSums"></div>
          <div class="co-err" id="coErr" hidden></div>
          <button class="btn btn--solid btn--block" type="submit" id="coSubmit"></button>
          <p class="co-terms">${t('co.terms')}</p>
        </div>
      </aside>
    </form>`;
    renderSummary();
    S.observe(body);
    bind();
  }

  function renderSummary() {
    const T = totals();
    $('#coLines').innerHTML = T.cart.map((l) => {
      const p = W.get(l.id);
      return `<div class="co-line"><div class="co-line__img">${Art.product(p, 'main', 160)}<b>${l.qty}</b></div>
        <div><h4>${esc(p.name)}</h4><small>${esc(p.colour)}${p.sizes.length > 1 || l.size !== 'One size' ? ' · ' + esc(L.size(l.size)) : ''}</small></div>
        <span>${S.money(p.price, l.qty)}</span></div>`;
    }).join('');
    $('#coVoucher').innerHTML = voucher
      ? `<div class="co-vchip"><span>${t('co.voucher')}: <b>${esc(voucher.code)}</b></span><button type="button" class="link-u js-vrm">${t('co.remove')}</button></div>`
      : `<div class="co-vform"><input id="vCode" placeholder="${t('co.voucher')}" autocomplete="off"><button type="button" class="js-vapply">${t('co.apply')}</button></div><small class="co-vmsg" id="vMsg"></small>`;
    $('#coSums').innerHTML = `
      <div><span>${t('co.subtotal')}</span><span>${L.fmt(T.sub)}</span></div>
      ${T.disc > 0 ? `<div class="co-disc"><span>${t('co.discount')}</span><span>−${fmt2(T.disc)}</span></div>` : ''}
      <div><span>${t('co.shipping')}</span><span>${T.ship > 0 ? L.fmt(T.ship) : t('co.free')}</span></div>
      <div class="co-total"><span>${t('co.total')}</span><span>${fmt2(T.total)}</span></div>
      ${bs ? '' : `<p class="co-km">${t('co.kmNote', { km: kmFmt(T.totalKm) })}</p>`}`;
    $('#coSubmit').innerHTML = `${t('co.place', { p: fmt2(T.total) })} ${S.ICON.arrow}`;
  }

  function remember(form) {
    const d = Object.fromEntries(new FormData(form));
    delete d.note;
    localStorage.setItem('wiena_checkout', JSON.stringify(d));
  }

  function bind() {
    const form = $('#coForm');
    form.addEventListener('change', (e) => {
      const r = e.target;
      if (r.type === 'radio') {
        state[r.name] = r.value;
        $$(`input[name="${r.name}"]`).forEach((x) => x.closest('.co-opt').classList.toggle('on', x.checked));
        if (r.name === 'delivery') $('.co-addr').hidden = r.value !== 'posta';
        renderSummary();
      }
    });
    form.addEventListener('input', (e) => e.target.closest('.co-field') && e.target.closest('.co-field').classList.remove('bad'));
    form.addEventListener('click', (e) => {
      if (e.target.closest('.js-edit-bag')) S.openCart();
      if (e.target.closest('.js-vrm')) { voucher = null; renderSummary(); }
      if (e.target.closest('.js-vapply')) applyVoucher();
    });
    form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'vCode') { e.preventDefault(); applyVoucher(); } });
    form.addEventListener('submit', (e) => { e.preventDefault(); submit(form); });
  }

  function applyVoucher() {
    const code = ($('#vCode').value || '').trim();
    if (!code) return;
    const items = S.store.cart.map((l) => ({ id: l.id, qty: l.qty }));
    post('/api/vouchers/check', { code, items })
      .then((d) => { voucher = d.voucher; renderSummary(); })
      .catch((err) => { $('#vMsg').textContent = bs && err.message ? err.message : t('co.err.voucher'); });
  }

  function post(url, data) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .catch(() => { throw Object.assign(new Error(t('co.err.net')), { net: true }); })
      .then((r) => r.json().catch(() => ({})).then((d) => { if (!r.ok) throw Object.assign(new Error(d.error || ''), { status: r.status, data: d }); return d; }));
  }

  function submit(form) {
    const need = ['first_name', 'last_name', 'email', 'phone'].concat(state.delivery === 'posta' ? ['address', 'city', 'zip'] : []);
    let bad = need.filter((n) => !form.elements[n].value.trim());
    if (form.elements.email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.elements.email.value.trim())) bad.push('email');
    $$('.co-field').forEach((f) => f.classList.remove('bad'));
    bad.forEach((n) => form.elements[n].closest('.co-field').classList.add('bad'));
    const err = $('#coErr');
    if (bad.length) { err.hidden = false; err.textContent = t('co.required'); form.elements[bad[0]].focus(); return; }
    err.hidden = true;
    remember(form);
    const btn = $('#coSubmit');
    btn.disabled = true; btn.textContent = t('co.placing');
    const d = Object.fromEntries(new FormData(form));
    const cart = S.store.cart;
    post('/api/orders', Object.assign(d, {
      delivery: state.delivery, payment: state.payment, lang: L.lang,
      voucher: voucher ? voucher.code : undefined,
      items: cart.map((l) => ({ id: l.id, size: l.size, qty: l.qty }))
    }))
      .then((res) => {
        S.store.cart = [];
        done(res, d);
      })
      .catch((e) => {
        btn.disabled = false; renderSummary();
        err.hidden = false;
        if (e.status === 409 && e.data && e.data.problems) {
          // drop or reduce what is no longer available, then let the visitor review
          const next = cart.map((l) => {
            const pr = e.data.problems.find((x) => x.id === l.id);
            if (!pr) return l;
            if (pr.reason === 'zaliha' && pr.available > 0) return Object.assign({}, l, { qty: Math.min(l.qty, pr.available) });
            return null;
          }).filter(Boolean);
          S.store.cart = next;
          err.textContent = t('co.err.stock');
          renderSummary();
          return;
        }
        err.textContent = e.net ? e.message : bs && e.message ? e.message : t('co.err.generic');
      });
  }

  function done(res, d) {
    const bank = res.bank_details ? `<div class="co-bank"><h4>${t('co.bank')}</h4><p>${esc(res.bank_details).replace(/\n/g, '<br>')}</p></div>` : '';
    document.querySelector('.co-head').remove();
    body.innerHTML = `<div class="co-done">
      <p class="eyebrow" data-reveal>${t('co.done.k')} · ${esc(res.number)}</p>
      <h1 data-split>${t('co.done.t', { name: esc(d.first_name) })}</h1>
      <p class="lede" data-reveal style="--i:2">${t('co.done.p', { n: esc(res.number), email: esc(d.email) })}</p>
      <div class="co-done__sum" data-reveal style="--i:3"><span>${t('co.done.total')}</span><b>${kmFmt(res.total)}</b></div>
      ${bank}
      <a href="shop.html" class="btn" data-reveal style="--i:4">${t('co.back')} ${S.ICON.arrow}</a>
    </div>`;
    document.querySelectorAll('.js-cart-count').forEach((el) => { el.innerHTML = '<b>0</b>'; });
    S.observe(body);
    scrollTo({ top: 0, behavior: 'smooth' });
  }

  render();
  // keep the summary in sync when the bag is edited in the drawer
  addEventListener('storage', render);
  document.addEventListener('click', (e) => { if (e.target.closest('[data-q], [data-rm]')) setTimeout(() => (S.store.cart.length ? $('#coLines') && renderSummary() : render()), 500); });
})();
