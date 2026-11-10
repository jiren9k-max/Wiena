/* WIENA — product detail page */
(function () {
  const W = window.WIENA, S = window.SITE, $ = S.$, $$ = S.$$, I = S.ICON, t = S.t, L = S.L;
  const id = new URLSearchParams(location.search).get('id');
  const p = W.get(id) || W.products[0];
  const sibs = W.siblings(p);
  let size = p.sizes.length === 1 ? p.sizes[0] : null;
  let qty = 1;

  document.title = `${p.name}, ${p.colour} | WIENA`;
  $('#crumbs').innerHTML = `<a href="index.html">${t('shop.home')}</a><span>/</span><a href="shop.html">${t('shop.shop')}</a><span>/</span><a href="shop.html?cat=${p.cat}">${p.catLabel}</a><span>/</span>${p.name}`;

  const stars = '★★★★★'.slice(0, Math.round(p.rating)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(p.rating));
  const views = ['main', 'alt', 'detail', 'mood'];
  const wish = S.store.wish.includes(p.id);
  const price = p.compareAt ? `<span style="color:var(--sale)">${S.money(p.price)}</span><s>${S.money(p.compareAt)}</s>` : S.money(p.price);

  $('#pdp').innerHTML = `
    <div class="pdp__gallery">
      ${views.map((v, i) => `<div class="pdp__img" data-reveal="${i === 0 ? 'clip' : 'fade'}" style="--i:${i}"><div class="zoomer">${Art.product(p, v, i === 0 ? 1400 : 900)}</div></div>`).join('')}
    </div>
    <div class="pdp__info">
      <div class="pdp__row"><span class="eyebrow" data-reveal="fade">${p.catLabel} · ${p.fibre}</span>${p.badge ? `<span class="badge ${p.badge === 'Sale' ? 'badge--sale' : p.badge === 'Limited' ? 'badge--limited' : ''}" style="position:static">${L.badge(p.badge)}</span>` : ''}</div>
      <h1 data-split>${p.name}</h1>
      <div class="pdp__row" data-reveal style="--i:2">
        <div class="pdp__price">${price}</div>
        <div class="stars"><i>${stars}</i>${L.lang === 'bs' ? String(p.rating).replace('.', ',') : p.rating} · ${L.count.reviews(p.reviews)}</div>
      </div>
      <p class="pdp__desc" data-reveal style="--i:3">${p.desc}</p>

      ${sibs.length > 1 ? `<div class="opt" data-reveal style="--i:4">
        <div class="opt__label">${t('pdp.colour')} <span>${p.colour}</span></div>
        <div class="opt__swatches">${sibs.map((s) => `<a href="product.html?id=${s.id}" class="sw ${s.id === p.id ? 'on' : ''}" style="background:${s.swatch}" title="${s.colour}"></a>`).join('')}</div>
      </div>` : `<div class="opt" data-reveal style="--i:4"><div class="opt__label">${t('pdp.colour')} <span>${p.colour}</span></div></div>`}

      ${p.sizes.length > 1 ? `<div class="opt" data-reveal style="--i:5">
        <div class="opt__label">${t('pdp.size')} <span id="sizeHint">${t('pdp.pick')}</span></div>
        <div class="sizes">${p.sizes.map((s) => `<button class="size" data-size="${s}">${L.size(s)}</button>`).join('')}</div>
      </div>` : `<div class="opt" data-reveal style="--i:5"><div class="opt__label">${t('pdp.size')} <span>${L.size(p.sizes[0])}</span></div></div>`}

      <div class="buy" data-reveal style="--i:6">
        <div class="qty"><button data-pq="-1" aria-label="Decrease">−</button><span id="pq">1</span><button data-pq="1" aria-label="Increase">+</button></div>
        <button class="btn btn--solid" id="addBtn" ${p.soldOut ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>${p.soldOut ? t('pdp.soldout') : t('pdp.add', { p: S.money(p.price) })}</button>
        <button class="wish-btn ${wish ? 'on' : ''}" data-wish="${p.id}" aria-label="${t('pdp.save')}">${I.heart}</button>
      </div>

      ${!p.soldOut && p.stock != null && p.stock <= 3 ? `<p class="pdp__low" data-reveal style="--i:6">${t('pdp.low', { n: p.stock })}</p>` : ''}
      <div class="perks" data-reveal style="--i:7">
        <div>${I.truck}<span>${t('pdp.perk1')}</span></div>
        <div>${I.return}<span>${t('pdp.perk2')}</span></div>
        <div>${I.gift}<span>${t('pdp.perk3')}</span></div>
      </div>

      <div data-reveal style="--i:8">
        <div class="acc open"><button>${t('pdp.details')}<i></i></button><div class="acc__body"><div><ul>${p.details.map((d) => `<li>${d}</li>`).join('')}</ul></div></div></div>
        <div class="acc"><button>${t('pdp.care')}<i></i></button><div class="acc__body"><div><p>${p.care}</p></div></div></div>
        <div class="acc"><button>${t('pdp.ship')}<i></i></button><div class="acc__body"><div><p>${t('pdp.shipText')}</p></div></div></div>
      </div>
    </div>`;

  /* interactions */
  const addBtn = $('#addBtn');
  $$('.size').forEach((b) => b.addEventListener('click', () => {
    $$('.size').forEach((x) => x.classList.remove('on'));
    b.classList.add('on'); size = b.dataset.size;
    $('#sizeHint').textContent = L.size(size);
    $('#sizeHint').style.color = '';
  }));
  $$('[data-pq]').forEach((b) => b.addEventListener('click', () => {
    qty = Math.max(1, Math.min(p.stock != null ? Math.max(1, p.stock) : 10, 10, qty + +b.dataset.pq));
    $('#pq').textContent = qty;
    addBtn.textContent = t('pdp.add', { p: S.money(p.price, qty) });
  }));
  addBtn.addEventListener('click', () => {
    if (p.soldOut) return;
    if (!size) {
      const hint = $('#sizeHint');
      hint.textContent = t('pdp.pickErr'); hint.style.color = 'var(--sale)';
      $('.sizes').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 400 });
      return;
    }
    if (!S.addToCart(p.id, size, qty)) return;
    addBtn.classList.remove('added'); void addBtn.offsetWidth; addBtn.classList.add('added');
    setTimeout(() => S.openCart(), 700);
  });
  $$('.acc button').forEach((b) => b.addEventListener('click', () => b.parentElement.classList.toggle('open')));

  // hover zoom following the cursor
  $$('.pdp__img').forEach((box) => {
    const z = box.querySelector('.zoomer');
    box.addEventListener('mousemove', (e) => {
      const r = box.getBoundingClientRect();
      z.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    });
    box.addEventListener('mouseenter', () => box.classList.add('zooming'));
    box.addEventListener('mouseleave', () => box.classList.remove('zooming'));
  });

  /* related */
  // one piece per category, same room first, so the row feels like a styled room
  const fams = W.families().filter((x) => x.cat !== p.cat);
  const seen = new Set();
  const pairList = fams.filter((x) => x.room === p.room).concat(fams.filter((x) => x.room !== p.room))
    .filter((x) => !seen.has(x.cat) && seen.add(x.cat)).slice(0, 4);
  $('#pairGrid').innerHTML = pairList.map((x, i) => S.card(x, i)).join('');
  const others = W.families().filter((x) => x.family !== p.family && !pairList.includes(x));
  const moreList = others.filter((x) => x.cat === p.cat).concat(others.filter((x) => x.cat !== p.cat && x.textile === p.textile)).slice(0, 4);
  $('#moreGrid').innerHTML = moreList.map((x, i) => S.card(x, i)).join('');
  $('#moreTitle').innerHTML = t('pdp.moreT', { c: p.catLabel.toLowerCase() });
  $('#moreLink').href = `shop.html?cat=${p.cat}`;

  S.observe(document);
})();
