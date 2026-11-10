/* WIENA — shared site chrome: header, menus, cart, wishlist, search, reveals, cursor */
(function () {
  const W = window.WIENA;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const L = window.I18N, t = L.t;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = L.money;
  L.apply(document);
  const FREE_SHIP = L.freeShip; // display currency (300 KM / €150)

  const ICON = {
    search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    arrow: '<svg class="arrow" viewBox="0 0 22 10" fill="none" stroke="currentColor"><path d="M0 5h21M17 1l4 4-4 4"/></svg>',
    arrowL: '<svg viewBox="0 0 22 10" fill="none" stroke="currentColor"><path d="M22 5H1M5 1L1 5l4 4"/></svg>',
    close: '<svg viewBox="0 0 16 16" fill="none"><path d="M1 1l14 14M15 1L1 15"/></svg>',
    filter: '<svg viewBox="0 0 24 24"><path d="M3 6h18M6 12h12M10 18h4"/></svg>',
    truck: '<svg viewBox="0 0 24 24"><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>',
    leaf: '<svg viewBox="0 0 24 24"><path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19l8-8"/></svg>',
    return: '<svg viewBox="0 0 24 24"><path d="M4 9h11a5 5 0 0 1 0 10H8"/><path d="M8 5L4 9l4 4"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0"/></svg>',
    needle: '<svg viewBox="0 0 24 24"><path d="M4 20L18 6M15 4l5 5M16 5l3 3"/><path d="M6 13c-3 1-3 5 1 5"/></svg>'
  };

  /* ───────────── storage ───────────── */
  const store = {
    // lines for products that were removed or hidden in the admin are dropped
    get cart() { try { return (JSON.parse(localStorage.getItem('wiena_cart')) || []).filter((l) => W.get(l.id)); } catch (e) { return []; } },
    set cart(v) { localStorage.setItem('wiena_cart', JSON.stringify(v)); },
    get wish() { try { return JSON.parse(localStorage.getItem('wiena_wish')) || []; } catch (e) { return []; } },
    set wish(v) { localStorage.setItem('wiena_wish', JSON.stringify(v)); }
  };

  function addToCart(id, size, qty) {
    const p = W.get(id);
    if (!p) return;
    size = size || p.sizes[0];
    qty = qty || 1;
    const cart = store.cart;
    if (p.soldOut) { toast(p, t('toast.soldout', { name: p.name })); return false; }
    // stock is shared by all sizes of a product
    const inCart = cart.filter((l) => l.id === p.id).reduce((a, l) => a + l.qty, 0);
    if (p.stock != null && inCart + qty > p.stock) { toast(p, t('toast.stock', { n: p.stock })); return false; }
    const line = cart.find((l) => l.id === p.id && l.size === size);
    if (line) line.qty += qty; else cart.push({ id: p.id, size, qty });
    store.cart = cart;
    updateCounts(true);
    renderCart();
    toast(p, t('toast.added', { name: p.name }));
    return true;
  }

  function toggleWish(id) {
    let w = store.wish;
    const on = w.includes(id);
    w = on ? w.filter((x) => x !== id) : w.concat(id);
    store.wish = w;
    $$(`[data-wish="${id}"]`).forEach((b) => b.classList.toggle('on', !on));
    updateCounts();
    if (!on) toast(W.get(id), t('toast.saved'));
    return !on;
  }

  function updateCounts(bump) {
    const n = store.cart.reduce((a, l) => a + l.qty, 0);
    $$('.js-cart-count').forEach((el) => { el.innerHTML = `<b>${n}</b>`; if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } });
    const w = store.wish.length;
    $$('.js-wish-count').forEach((el) => { el.innerHTML = `<b>${w}</b>`; el.style.display = w ? '' : 'none'; });
  }

  /* ───────────── product card ───────────── */
  function card(p, i) {
    const sibs = W.siblings(p);
    const wish = store.wish.includes(p.id);
    const badge = p.soldOut ? `<span class="badge badge--soldout">${t('card.soldout')}</span>` : p.badge ? `<span class="badge ${p.badge === 'Sale' ? 'badge--sale' : p.badge === 'Limited' ? 'badge--limited' : ''}">${p.badge === 'Sale' ? '−' + Math.round((1 - p.price / p.compareAt) * 100) + '%' : L.badge(p.badge)}</span>` : '';
    return `<article class="card" data-reveal style="--i:${(i || 0) % 4}">
      <a href="product.html?id=${p.id}" class="card__media" data-cursor="view">
        <div class="card__img">${Art.product(p, 'main')}</div>
        <div class="card__img card__img--alt">${Art.product(p, 'alt')}</div>
        ${badge}
      </a>
      <button class="card__wish ${wish ? 'on' : ''}" data-wish="${p.id}" aria-label="${t('card.save')}">${ICON.heart}</button>
      ${p.soldOut ? '' : `<button class="card__quick" data-add="${p.id}">${t('card.quick')} <span>+</span></button>`}
      <div class="card__info">
        <div>
          <h3 class="card__name"><a href="product.html?id=${p.id}">${p.name}</a></h3>
          <p class="card__meta">${p.colour}</p>
        </div>
        <div class="price">${p.compareAt ? `<span class="now-sale">${money(p.price)}</span><s>${money(p.compareAt)}</s>` : money(p.price)}</div>
      </div>
      ${sibs.length > 1 ? `<div class="card__swatches">${sibs.map((s) => `<a href="product.html?id=${s.id}" class="sw ${s.id === p.id ? 'on' : ''}" style="background:${s.swatch}" title="${s.colour}"></a>`).join('')}</div>` : ''}
    </article>`;
  }

  /* ───────────── layout injection ───────────── */
  function counts() {
    const c = {};
    W.products.forEach((p) => { c[p.cat] = (c[p.cat] || 0) + 1; });
    return c;
  }

  function injectChrome() {
    const page = document.body.dataset.page;
    const cc = counts();
    const textileCats = W.CATS.filter((c) => c.textile);
    const homeCats = W.CATS.filter((c) => !c.textile);

    const announce = `<div class="announce"><div class="announce__track">${Array(2).fill(
      [1, 2, 3, 4, 5].filter((n) => n !== 1 || FREE_SHIP > 0).map((n) => `<span>${t('ann.' + n, { x: L.fmt(FREE_SHIP) })}</span>`).join('')
    ).join('')}</div></div>`;

    const header = `<header class="header" id="header">
      <nav class="nav">
        <button class="js-mega" data-cursor="hover">${t('nav.shop')}</button>
        <a href="shop.html?room=Bedroom" class="${page === 'shop' && /Bedroom/.test(location.search) ? 'active' : ''}">${t('nav.bedroom')}</a>
        <a href="shop.html?cat=bath">${t('nav.bath')}</a>
        <a href="shop.html?room=Living">${t('nav.living')}</a>
        <a href="index.html#story">${t('nav.journal')}</a>
      </nav>
      <button class="burger js-burger" aria-label="${t('nav.menu')}"><span></span><span></span></button>
      <a href="index.html" class="logo" aria-label="WIENA, ${t('shop.home').toLowerCase()}">WIENA<small>${t('nav.tagline')}</small></a>
      <div class="header__right">
        <div class="lang" role="group" aria-label="${t('lang.label')}"><button data-lang="bs" class="${L.lang === 'bs' ? 'on' : ''}" lang="bs">BS</button><i></i><button data-lang="en" class="${L.lang === 'en' ? 'on' : ''}" lang="en">EN</button></div>
        <button class="icon-link js-search" aria-label="${t('nav.search')}">${ICON.search}<span class="label">${t('nav.search')}</span></button>
        <a class="icon-link" href="shop.html?view=wishlist" aria-label="${t('nav.wishlist')}">${ICON.heart}<span class="count js-wish-count"></span></a>
        <button class="icon-link js-cart" aria-label="${t('nav.bag')}">${ICON.bag}<span class="label">${t('nav.bag')}</span><span class="count js-cart-count"><b>0</b></span></button>
      </div>
      <div class="mega" id="mega">
        <div><h4 class="eyebrow">${t('mega.textiles')}</h4><ul>${textileCats.map((c) => `<li><a href="shop.html?cat=${c.key}">${c.label}<sup>${cc[c.key]}</sup></a></li>`).join('')}</ul></div>
        <div><h4 class="eyebrow">${t('mega.home')}</h4><ul>${homeCats.map((c) => `<li><a href="shop.html?cat=${c.key}">${c.label}<sup>${cc[c.key]}</sup></a></li>`).join('')}</ul>
          <h4 class="eyebrow" style="margin-top:30px">${t('mega.discover')}</h4><ul><li><a href="shop.html?view=new">${t('mega.new')}</a></li><li><a href="shop.html?view=sale">${t('mega.sale')}</a></li><li><a href="shop.html">${t('mega.all')}<sup>${W.products.length}</sup></a></li></ul></div>
        <div><h4 class="eyebrow">${t('mega.rooms')}</h4><ul>${['Bedroom', 'Bathroom', 'Living', 'Dining', 'Wardrobe'].map((r) => `<li><a href="shop.html?room=${r}">${L.room(r)}</a></li>`).join('')}</ul></div>
        <a class="mega__feature" href="shop.html?cat=throws"><div class="art">${Art.photo(PHOTOS.site.mega, 900, t('mega.featureTitle'))}</div>
          <div class="cap"><span class="eyebrow" style="color:rgba(244,237,225,.75)">${t('mega.featureKicker')}</span><strong>${t('mega.featureTitle')}</strong></div></a>
      </div>
    </header>`;

    const mobile = `<div class="mobile-menu" id="mobileMenu"><div>
      ${[[t('mob.all'), 'shop.html'], [t('nav.bedroom'), 'shop.html?room=Bedroom'], [t('nav.bath'), 'shop.html?cat=bath'], [t('nav.living'), 'shop.html?room=Living'], [L.room('Dining'), 'shop.html?room=Dining'], [t('mob.fragrance'), 'shop.html?cat=fragrance'], [t('mob.sale'), 'shop.html?view=sale']]
        .map(([l, h], i) => `<a class="big" style="--i:${i}" href="${h}">${l}</a>`).join('')}
      </div><div><div class="lang lang--big"><button data-lang="bs" class="${L.lang === 'bs' ? 'on' : ''}">Bosanski</button><i></i><button data-lang="en" class="${L.lang === 'en' ? 'on' : ''}">English</button></div><p class="eyebrow">${t('mob.est')}</p></div></div>`;

    const cart = `<div class="scrim" id="scrim"></div>
      <aside class="drawer" id="cart" aria-label="${t('cart.title')}">
        <div class="drawer__head"><h3>${t('cart.title')} <sup class="js-cart-n"></sup></h3><button class="close-x js-close" aria-label="${t('cart.close')}">${ICON.close}</button></div>
        <div class="ship-bar"><span class="js-ship-text"></span><div class="ship-bar__track"><i class="js-ship-bar"></i></div></div>
        <div class="drawer__body js-cart-body"></div>
        <div class="drawer__foot js-cart-foot"></div>
      </aside>`;

    const search = `<div class="search" id="search">
      <div class="search__top"><button class="close-x js-close-search" aria-label="${t('cart.close')}">${ICON.close}</button></div>
      <label class="search__field">${ICON.search}<input type="text" placeholder="${t('search.ph')}" autocomplete="off" id="searchInput"></label>
      <div class="search__suggest"><span class="eyebrow" style="margin-right:8px">${t('search.popular')}</span>${t('search.sugg').map((s) => `<button class="chip js-sugg">${s}</button>`).join('')}</div>
      <div class="search__results" id="searchResults"></div>
    </div>`;

    const footer = `<footer class="footer">
      <div class="footer__grid">
        <div><p class="footer__lead">${t('f.lead')}</p>
          <p style="max-width:340px;font-size:14px">${t('f.address', { addr: esc(W.settings.shop_address || ''), phone: esc(W.settings.shop_phone || '') })}</p></div>
        <div><h5>${t('f.shop')}</h5><ul>${textileCats.slice(0, 5).map((c) => `<li><a href="shop.html?cat=${c.key}">${c.label}</a></li>`).join('')}<li><a href="shop.html?view=sale">${t('f.sale')}</a></li></ul></div>
        <div><h5>${t('f.help')}</h5><ul><li><a href="#">${t('f.shipping')}</a></li><li><a href="#">${t('f.returns')}</a></li><li><a href="#">${t('f.care')}</a></li><li><a href="#">${t('f.size')}</a></li><li><a href="#">${t('f.contact')}</a></li></ul></div>
        <div><h5>Wiena</h5><ul><li><a href="index.html#story">${t('f.story')}</a></li><li><a href="#">${t('f.mills')}</a></li><li><a href="#">${t('f.journal')}</a></li><li><a href="#">${t('f.trade')}</a></li><li><a href="#">Instagram</a></li></ul></div>
      </div>
      <div class="footer__big">WIENA</div>
      <div class="footer__bottom"><span>${t('f.copy', { year: new Date().getFullYear(), name: esc(W.settings.shop_name || 'Wiena Group d.o.o.'), jib: W.settings.company_jib ? ' · JIB ' + esc(W.settings.company_jib) : '' })}</span><div class="pay"><span>${t('f.pay1')}</span><span>${t('f.pay2')}</span></div><span>${t('f.legal')}</span></div>
    </footer>`;

    document.body.insertAdjacentHTML('afterbegin', announce + header + mobile);
    const main = $('main');
    main.insertAdjacentHTML('afterend', footer);
    document.body.insertAdjacentHTML('beforeend', cart + search +
      '<div class="toasts" id="toasts"></div><div class="grain"></div><div class="cursor"><span>' + t('cursor.view') + '</span></div><div class="cursor-dot"></div><div class="page-fade"></div>');
  }

  /* ───────────── cart drawer ───────────── */
  function renderCart() {
    const cart = store.cart;
    const body = $('.js-cart-body'), foot = $('.js-cart-foot');
    if (!body) return;
    const total = cart.reduce((a, l) => a + L.price(W.get(l.id).price) * l.qty, 0);
    const n = cart.reduce((a, l) => a + l.qty, 0);
    $('.js-cart-n').textContent = n ? `(${n})` : '';
    const left = FREE_SHIP - total;
    $('.ship-bar').style.display = FREE_SHIP > 0 ? '' : 'none';
    if (FREE_SHIP > 0) {
      $('.js-ship-text').innerHTML = left > 0 ? t('cart.away', { x: L.fmt(left) }) : t('cart.free');
      $('.js-ship-bar').style.width = Math.min(100, (total / FREE_SHIP) * 100) + '%';
    }
    if (!cart.length) {
      body.innerHTML = `<div class="empty"><div class="serif">${t('cart.empty')}</div><p>${t('cart.emptySub')}</p><a href="shop.html" class="btn">${t('cart.explore')} ${ICON.arrow}</a></div>`;
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = cart.map((l, i) => {
      const p = W.get(l.id);
      return `<div class="line-item" style="animation-delay:${i * 60}ms" data-line="${i}">
        <a href="product.html?id=${p.id}" class="line-item__img">${Art.product(p, 'main', 200)}</a>
        <div><h4>${p.name}</h4><div class="meta">${p.colour} · ${L.size(l.size)}</div>
          <div class="qty"><button data-q="-1" aria-label="${t('cart.decrease')}">−</button><span>${l.qty}</span><button data-q="1" aria-label="${t('cart.increase')}">+</button></div>
          <button class="remove" data-rm>${t('cart.remove')}</button></div>
        <div class="price">${money(p.price, l.qty)}</div>
      </div>`;
    }).join('');
    foot.innerHTML = `<div class="subtotal"><span>${t('cart.subtotal')}</span><b>${L.fmt(total)}</b></div>
      <p class="drawer__note">${t('cart.note')}</p>
      <a href="checkout.html" class="btn btn--solid btn--block js-checkout">${t('cart.checkout')} ${ICON.arrow}</a>`;
  }

  function openDrawer(el) {
    el.classList.add('open');
    $('#scrim').classList.add('open');
    document.body.classList.add('lock');
  }
  function closeDrawers() {
    $$('.drawer.open').forEach((d) => d.classList.remove('open'));
    $('#scrim').classList.remove('open');
    document.body.classList.remove('lock');
  }

  /* ───────────── search ───────────── */
  function runSearch(q) {
    const out = $('#searchResults');
    q = q.trim();
    if (!q) { out.innerHTML = ''; return; }
    const terms = L.fold(q).split(/\s+/);
    const res = W.products.filter((p) => {
      const hay = L.fold(`${p.name} ${p.nameEn} ${p.colour} ${p.colourKey} ${p.catLabel} ${p.material} ${p.fibre} ${L.room(p.room)}`);
      return terms.every((x) => L.match(hay, x));
    }).slice(0, 12);
    out.innerHTML = res.length ? res.map((p, i) => `<a class="res" style="--i:${i}" href="product.html?id=${p.id}"><div class="card__media">${Art.product(p, 'main', 400)}</div>
      <div class="card__info"><div><h3 class="card__name">${p.name}</h3><p class="card__meta">${p.colour}</p></div><div class="price">${money(p.price)}</div></div></a>`).join('')
      : `<p class="serif" style="font-size:28px;grid-column:1/-1">${t('search.none', { q: q.replace(/</g, '') })}</p>`;
  }

  /* ───────────── toast ───────────── */
  function toast(p, html) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = (p ? `<div class="toast__img">${Art.product(p, 'main', 120)}</div>` : '') + `<span>${html}</span>`;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 600); }, 2600);
  }

  /* ───────────── motion: reveals, split text, parallax ───────────── */
  function splitText(root) {
    $$('[data-split]', root).forEach((el) => {
      if (el.dataset.splitDone) return;
      el.dataset.splitDone = 1;
      el.classList.add('split');
      let wi = 0;
      const walk = (node) => {
        Array.from(node.childNodes).forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              const w = document.createElement('span');
              w.className = 'w';
              w.innerHTML = `<span style="--wi:${wi++}">${part}</span>`;
              frag.appendChild(w);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
        });
      };
      walk(el);
    });
  }

  let io;
  function observe(root) {
    splitText(root);
    if (!io) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          (e.target._kids || [e.target]).forEach((k) => k.classList.add('in'));
          e.target._kids = null;
          io.unobserve(e.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    }
    $$('[data-reveal]:not(.in), .split:not(.in), .zoom-in:not(.in)', root).forEach((el) => {
      // clip-path hides the element from IntersectionObserver, so watch its parent instead
      const t = /clip/.test(el.dataset.reveal || '') ? el.parentElement : el;
      (t._kids = t._kids || []).push(el);
      io.observe(t);
    });
  }

  function parallax() {
    const els = $$('[data-parallax]');
    if (!els.length) return;
    let ticking = false;
    const run = () => {
      const vh = innerHeight;
      els.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const speed = parseFloat(el.dataset.parallax) || 0.15;
        const off = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }

  /* ───────────── header behaviour ───────────── */
  function headerScroll() {
    const h = $('#header');
    let last = scrollY;
    const run = () => {
      const y = scrollY;
      const hero = document.body.classList.contains('has-hero');
      h.classList.toggle('solid', y > (hero ? 40 : 10));
      if (!h.classList.contains('menu-open') && !$('#mega').classList.contains('open')) h.classList.toggle('hidden', y > 500 && y > last + 4);
      if (y < last - 4) h.classList.remove('hidden');
      last = y;
    };
    addEventListener('scroll', run, { passive: true });
    run();
  }

  /* ───────────── custom cursor ───────────── */
  function cursor() {
    if (matchMedia('(hover: none), (pointer: coarse)').matches) return;
    const ring = $('.cursor'), dot = $('.cursor-dot'), label = $('.cursor span');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`; });
    const loop = () => {
      rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('mouseover', (e) => {
      const v = e.target.closest('[data-cursor="view"]');
      const z = e.target.closest('.pdp__img');
      const h = e.target.closest('a, button, select, label, input');
      ring.classList.toggle('view', !!(v || z));
      label.textContent = z ? t('cursor.zoom') : t('cursor.view');
      ring.classList.toggle('hover', !v && !z && !!h);
      ring.classList.toggle('light', !!e.target.closest('.hero, .materials, .newsletter, .footer'));
    });
    document.addEventListener('mouseleave', () => { ring.style.opacity = 0; dot.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { ring.style.opacity = 1; dot.style.opacity = 1; });
  }

  /* ───────────── page transitions ───────────── */
  function transitions() {
    const fade = $('.page-fade');
    setTimeout(() => fade.classList.add('out'), 40);
    addEventListener('pageshow', (e) => { if (e.persisted) { fade.classList.remove('in'); fade.classList.add('out'); } });
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || /^https?:/.test(href)) return;
      const url = new URL(href, location.href);
      if (url.pathname === location.pathname && url.search === location.search && url.hash) return; // same-page anchor
      e.preventDefault();
      fade.classList.remove('out');
      fade.classList.add('in');
      setTimeout(() => { location.href = href; }, 420);
    });
  }

  /* ───────────── events ───────────── */
  function bind() {
    const header = $('#header'), mega = $('#mega');
    let megaT;
    const openMega = () => { clearTimeout(megaT); mega.classList.add('open'); header.classList.add('menu-open'); };
    const closeMega = () => { megaT = setTimeout(() => { mega.classList.remove('open'); header.classList.remove('menu-open'); }, 180); };
    $('.js-mega').addEventListener('mouseenter', openMega);
    $('.js-mega').addEventListener('click', () => (mega.classList.contains('open') ? closeMega() : openMega()));
    $('.js-mega').addEventListener('mouseleave', closeMega);
    mega.addEventListener('mouseenter', openMega);
    mega.addEventListener('mouseleave', closeMega);

    $('.js-burger').addEventListener('click', () => {
      const open = !$('#mobileMenu').classList.contains('open');
      $('#mobileMenu').classList.toggle('open', open);
      header.classList.toggle('menu-open', open);
      document.body.classList.toggle('lock', open);
    });

    $('.js-cart').addEventListener('click', () => openDrawer($('#cart')));
    $('#scrim').addEventListener('click', closeDrawers);
    document.addEventListener('click', (e) => {
      const lg = e.target.closest('[data-lang]');
      if (lg) { L.setLang(lg.dataset.lang); return; }
      if (e.target.closest('.js-close')) closeDrawers();
      const add = e.target.closest('[data-add]');
      if (add) { e.preventDefault(); if (addToCart(+add.dataset.add)) setTimeout(() => openDrawer($('#cart')), 350); }
      const wish = e.target.closest('[data-wish]');
      if (wish) { e.preventDefault(); toggleWish(+wish.dataset.wish); }
      const q = e.target.closest('[data-q]');
      if (q) {
        const i = +q.closest('[data-line]').dataset.line;
        const cart = store.cart;
        const qp = W.get(cart[i].id);
        const inCart = cart.filter((l) => l.id === qp.id).reduce((a, l) => a + l.qty, 0);
        if (+q.dataset.q > 0 && qp.stock != null && inCart >= qp.stock) { toast(qp, t('toast.stock', { n: qp.stock })); return; }
        cart[i].qty += +q.dataset.q;
        if (cart[i].qty < 1) cart.splice(i, 1);
        store.cart = cart; renderCart(); updateCounts();
      }
      const rm = e.target.closest('[data-rm]');
      if (rm) {
        const row = rm.closest('[data-line]');
        row.classList.add('removing');
        setTimeout(() => { const cart = store.cart; cart.splice(+row.dataset.line, 1); store.cart = cart; renderCart(); updateCounts(); }, 450);
      }
    });

    const search = $('#search'), input = $('#searchInput');
    $('.js-search').addEventListener('click', () => { search.classList.add('open'); document.body.classList.add('lock'); setTimeout(() => input.focus(), 300); });
    $('.js-close-search').addEventListener('click', () => { search.classList.remove('open'); document.body.classList.remove('lock'); });
    input.addEventListener('input', () => runSearch(input.value));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && input.value.trim()) location.href = 'shop.html?q=' + encodeURIComponent(input.value.trim()); });
    $$('.js-sugg').forEach((b) => b.addEventListener('click', () => { input.value = b.textContent; runSearch(b.textContent); }));
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeDrawers(); search.classList.remove('open'); document.body.classList.remove('lock'); }
    });
  }

  /* ───────────── loader (home, once per session) ───────────── */
  function loader(done) {
    if (document.body.dataset.page !== 'home' || sessionStorage.getItem('wiena_loaded')) { done(); return; }
    sessionStorage.setItem('wiena_loaded', '1');
    const el = document.createElement('div');
    el.className = 'loader';
    el.innerHTML = `<div class="loader__inner"><div class="loader__word">${'WIENA'.split('').map((l, i) => `<span style="--i:${i}">${l}</span>`).join('')}</div>
      <div class="loader__line"></div><div class="loader__sub eyebrow">${t('loader.sub')}</div></div>`;
    document.body.appendChild(el);
    document.body.classList.add('lock');
    setTimeout(() => { el.classList.add('done'); document.body.classList.remove('lock'); done(); setTimeout(() => el.remove(), 1400); }, 2300);
  }

  /* ───────────── boot ───────────── */
  injectChrome();
  updateCounts();
  renderCart();
  bind();
  headerScroll();
  cursor();
  transitions();

  window.SITE = { $, $$, esc, money, t, L, card, observe, parallax, ICON, store, addToCart, toggleWish, toast, openCart: () => openDrawer($('#cart')), openDrawer, closeDrawers, loader };

  document.addEventListener('DOMContentLoaded', () => {});
})();
