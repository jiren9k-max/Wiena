/* WIENA — home page */
(function () {
  const W = window.WIENA, S = window.SITE, $ = S.$, $$ = S.$$, t = S.t, L = S.L;
  const C = W.COLORS;
  const arrow = '<svg viewBox="0 0 22 10" width="22" fill="none" stroke="currentColor"><path d="M0 5h21M17 1l4 4-4 4"/></svg>';

  /* ───────── hero ───────── */
  const SLIDES = [
    { kicker: t('hero.1.k'), title: t('hero.1.t'), lead: t('hero.1.l'),
      art: { c: '#5a2230', kind: 'solid', k: 0.42, folds: 9, angle: 18, scale: 1, vignette: 0.5 } },
    { kicker: t('hero.2.k'), title: t('hero.2.t'), lead: t('hero.2.l'),
      art: { c: '#c9b597', kind: 'linen', k: 0.32, folds: 8, angle: 32, scale: 2.6, vignette: 0.45 } },
    { kicker: t('hero.3.k'), title: t('hero.3.t'), lead: t('hero.3.l'),
      art: { c: '#9c7650', kind: 'herringbone', k: 0.3, folds: 7, angle: 24, scale: 3.4, vignette: 0.5 } }
  ];
  const DUR = 7000;
  const slidesEl = $('#heroSlides'), capsEl = $('#heroCaptions'), dotsEl = $('#heroDots');
  const SITE_PH = PHOTOS.site;
  const heroPhotos = [SITE_PH.hero[0], SITE_PH.hero[2], SITE_PH.hero[1]];
  // drawn fabric sits underneath as a backdrop while the photo loads
  slidesEl.innerHTML = SLIDES.map((s, i) => `<div class="hero__slide ${i === 0 ? 'active' : ''}"><div class="art">${Art.fabric(Object.assign({ w: 1600, h: 1000, seed: 40 + i }, s.art))}${Art.photo(heroPhotos[i], 1920, s.kicker)}</div></div>`).join('');
  capsEl.innerHTML = SLIDES.map((s, i) => `<div class="hero__caption ${i === 0 ? 'active' : ''}">
      <p class="hero__kicker eyebrow">${s.kicker}</p>
      <h1 data-split>${s.title}</h1>
      <p class="hero__lead">${s.lead}</p></div>`).join('');
  dotsEl.innerHTML = SLIDES.map((s, i) => `<button class="hero__dot ${i === 0 ? 'active' : ''}" style="--dur:${DUR}ms" aria-label="${t('hero.slide')} ${i + 1}">0${i + 1}<i></i></button>`).join('');

  let cur = 0, timer;
  function go(n) {
    const slides = $$('.hero__slide'), caps = $$('.hero__caption'), dots = $$('.hero__dot');
    slides[cur].classList.remove('active'); caps[cur].classList.remove('active'); dots[cur].classList.remove('active');
    caps[cur].querySelector('h1').classList.remove('in');
    cur = (n + SLIDES.length) % SLIDES.length;
    slides[cur].classList.add('active'); caps[cur].classList.add('active');
    void dots[cur].offsetWidth; dots[cur].classList.add('active');
    const h = caps[cur].querySelector('h1');
    h.classList.remove('in'); void h.offsetWidth;
    setTimeout(() => h.classList.add('in'), 40);
    clearTimeout(timer); timer = setTimeout(() => go(cur + 1), DUR);
  }
  $$('.hero__dot').forEach((d, i) => d.addEventListener('click', () => go(i)));

  /* ───────── marquee ───────── */
  const fibres = t('marquee');
  $('#marquee').innerHTML = fibres.concat(fibres).map((f) => `<span class="marquee__item">${f}</span>`).join('');

  /* ───────── rooms ───────── */
  // featured pieces; falls back to another colour or product if one was hidden or renamed in the admin
  const pick = (name, colour) => W.products.find((p) => p.nameEn === name && (!colour || p.colourKey === colour)) || W.products.find((p) => p.nameEn === name) || W.products[0];
  const ROOMS = [
    { title: 'Bedroom', href: 'shop.html?room=Bedroom', p: pick('Stonewashed Linen Duvet Cover', 'Oat') },
    { title: 'Bath', href: 'shop.html?cat=bath', p: pick('Turkish Cotton Bath Towel', 'Sage') },
    { title: 'Living', href: 'shop.html?room=Living', p: pick('Alpaca Bouclé Throw', 'Mocha') },
    { title: 'Dining', href: 'shop.html?room=Dining', p: pick('Speckled Stoneware Vase', 'Clay') },
    { title: 'Fragrance', href: 'shop.html?cat=fragrance', p: pick('Fig & Cedar Candle'), view: 'alt' }
  ];
  const roomCount = (r) => W.products.filter((p) => (r.href.includes('cat=') ? p.cat === r.href.split('cat=')[1] : p.room === r.title)).length;
  $('#rooms').innerHTML = ROOMS.map((r, i) => `<a class="room" href="${r.href}" data-reveal="${i === 0 ? 'clip' : ''}" style="--i:${i}" data-cursor="view">
      <div class="art">${Art.photo(SITE_PH.rooms[r.title], i === 0 ? 1100 : 800, t('rooms.' + r.title))}</div>
      <span class="room__num">0${i + 1}</span>
      <div class="room__info"><p class="eyebrow">${t('rooms.sub.' + r.title)} · ${L.count.pieces(roomCount(r))}</p><h3>${t('rooms.' + r.title)}</h3><span class="room__more">${t('rooms.explore')} ${arrow}</span></div>
    </a>`).join('');

  /* ───────── edit carousel ───────── */
  const editNames = ['Cashmere Windowpane Throw', 'Alpaca Bouclé Throw', 'Velvet Cushion Cover', 'Smoked Amber Candle', 'Merino Herringbone Blanket', 'Cashmere Wrap Scarf', 'Velvet Blackout Curtain', 'Mohair Stripe Throw', 'Bouclé Lumbar Cushion', 'Fig & Cedar Candle', 'Wool Check Stole'];
  const edit = editNames.map((n) => W.products.find((p) => p.nameEn === n));
  $('#edit').innerHTML = edit.map((p, i) => S.card(p, i)).join('');
  const car = $('#edit'), prog = $('#editProgress');
  const step = () => car.firstElementChild.getBoundingClientRect().width + 20;
  $('.js-prev').addEventListener('click', () => car.scrollBy({ left: -step() * 2, behavior: 'smooth' }));
  $('.js-next').addEventListener('click', () => car.scrollBy({ left: step() * 2, behavior: 'smooth' }));
  const updProg = () => {
    const max = car.scrollWidth - car.clientWidth;
    const vis = car.clientWidth / car.scrollWidth;
    prog.style.width = vis * 100 + '%';
    prog.style.transform = `translateX(${(max ? car.scrollLeft / max : 0) * (1 / vis - 1) * 100}%)`;
  };
  car.addEventListener('scroll', updProg, { passive: true });
  addEventListener('resize', updProg);
  // drag to scroll
  let down = false, sx = 0, sl = 0, moved = false;
  car.addEventListener('mousedown', (e) => { down = true; moved = false; sx = e.pageX; sl = car.scrollLeft; });
  addEventListener('mouseup', () => { if (down) { down = false; car.classList.remove('dragging'); } });
  car.addEventListener('mousemove', (e) => {
    if (!down) return;
    const dx = e.pageX - sx;
    if (Math.abs(dx) > 5) { moved = true; car.classList.add('dragging'); }
    car.scrollLeft = sl - dx;
  });
  car.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

  /* ───────── story ───────── */
  $('#storyArt').innerHTML = Art.photo(SITE_PH.story[0], 1000, t('mat.Linen'));
  $('#storyArt2').innerHTML = Art.photo(SITE_PH.story[1], 500, '');

  // counters
  const cio = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target, to = +el.dataset.count, t0 = performance.now();
    const tick = (t) => { const k = Math.min(1, (t - t0) / 1800); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick); cio.unobserve(el);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach((el) => cio.observe(el));

  /* ───────── materials (sticky crossfade) ───────── */
  const MATS = [
    { name: 'Linen', em: 'Flax', art: { c: '#d3c2a4', kind: 'linen', scale: 3.2 } },
    { name: 'Cashmere', em: 'Goat', art: { c: '#b98d5e', kind: 'herringbone', scale: 3.2 } },
    { name: 'Alpaca', em: 'Andes', art: { c: '#e9e1d2', kind: 'boucle', scale: 2.6 } },
    { name: 'Cotton', em: 'Aegean', art: { c: '#9dab92', kind: 'waffle', scale: 2.8 } },
    { name: 'Silk', em: 'Mulberry', art: { c: '#cfa398', kind: 'solid', scale: 1, k: 0.4 } }
  ];
  $('#matList').innerHTML = MATS.map((m, i) => `<li class="${i === 0 ? 'active' : ''}"><span>${t('mat.' + m.name)}</span><sup>0${i + 1}</sup></li>`).join('');
  $('#matDesc').innerHTML = MATS.map((m, i) => `<p class="${i === 0 ? 'active' : ''}">${t('mat.' + m.name + '.d')}</p>`).join('');
  $('#matImgs').innerHTML = MATS.map((m, i) => `<div class="materials__img ${i === 0 ? 'active' : ''}">${Art.photo(SITE_PH.fibres[m.name], 1200, t('mat.' + m.name))}</div>`).join('');
  let matIdx = 0;
  const track = $('.materials__track');
  function matScroll() {
    const r = track.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));
    $('#matBar').style.transform = `scaleX(${p})`;
    const idx = Math.min(MATS.length - 1, Math.floor(p * MATS.length));
    if (idx !== matIdx) {
      matIdx = idx;
      $$('#matList li').forEach((li, i) => li.classList.toggle('active', i === idx));
      $$('#matDesc p').forEach((el, i) => el.classList.toggle('active', i === idx));
      $$('.materials__img').forEach((el, i) => el.classList.toggle('active', i === idx));
      $('#matCounter').textContent = `0${idx + 1} / 0${MATS.length}`;
    }
  }

  /* ───────── bestsellers ───────── */
  const bestNames = [['Stonewashed Linen Duvet Cover', 'Sage'], ['Alpaca Bouclé Throw', 'Ivory'], ['Turkish Cotton Bath Towel', 'Clay'], ['Velvet Cushion Cover', 'Forest'],
    ['Fig & Cedar Candle'], ['Gingham Linen Bedding Set', 'Sage'], ['Merino Herringbone Blanket', 'Oat'], ['Speckled Stoneware Vase', 'Chalk']];
  $('#best').innerHTML = bestNames.map(([n, c], i) => S.card(pick(n, c), i)).join('');

  /* ───────── quote word-by-word ───────── */
  const q = $('#quote');
  const wrapWords = (node) => Array.from(node.childNodes).forEach((n) => {
    if (n.nodeType === 3) {
      const f = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) f.appendChild(document.createTextNode(' ')); else { const s = document.createElement('span'); s.className = 'qw'; s.textContent = w; f.appendChild(s); } });
      n.replaceWith(f);
    } else wrapWords(n);
  });
  wrapWords(q);
  const qws = $$('.qw', q);
  function quoteScroll() {
    const r = q.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
    const lit = Math.round(p * qws.length);
    qws.forEach((w, i) => w.classList.toggle('lit', i < lit));
  }

  /* ───────── lookbook ───────── */
  const look = [
    { art: Art.photo(SITE_PH.lookbook[0], 700, t('look.1')), p: pick('Percale Stripe Duvet Set', 'Ink'), pos: 'left:18px;bottom:18px' },
    { art: Art.photo(SITE_PH.lookbook[1], 900, t('look.2')), p: pick('Velvet Blackout Curtain', 'Charcoal'), pos: 'right:22px;top:40%', dp: 0.08 },
    { art: Art.photo(SITE_PH.lookbook[2], 700, t('look.3')), p: pick('Waffle Bath Sheet', 'Oat'), pos: 'left:18px;top:24px' }
  ];
  $('#lookbook').innerHTML = look.map((l, i) => `<div class="lookbook__item" data-reveal="clip" style="--i:${i}">
      <div class="art" data-parallax="${l.dp || 0.1}">${l.art}</div>
      <a class="lookbook__tag" href="product.html?id=${l.p.id}" style="${l.pos}"><i>+</i>${l.p.name} · ${S.money(l.p.price)}</a></div>`).join('');

  /* ───────── values ───────── */
  const I = S.ICON;
  $('#values').innerHTML = [
    [I.leaf, t('val.1.t'), t('val.1.p')],
    [I.truck, t('val.2.t'), t('val.2.p')],
    [I.return, t('val.3.t'), t('val.3.p')],
    [I.gift, t('val.4.t'), t('val.4.p')]
  ].map(([ic, h, p], i) => `<div class="value" data-reveal style="--i:${i}">${ic}<h4>${h}</h4><p>${p}</p></div>`).join('');

  /* ───────── newsletter ───────── */
  $('#nlArt').innerHTML = Art.photo(SITE_PH.newsletter, 1920, '');
  $('#nlForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target, email = form.querySelector('input').value.trim();
    form.querySelector('button').disabled = true;
    fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      .then((r) => { if (!r.ok) throw new Error(); form.innerHTML = '<p class="serif" style="font-size:26px;margin:14px auto;color:var(--cream)">' + t('nl.thanks') + '</p>'; })
      .catch(() => { form.querySelector('button').disabled = false; S.toast(null, t('co.err.generic')); });
  });

  /* ───────── scroll loop ───────── */
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { matScroll(); quoteScroll(); ticking = false; });
  }, { passive: true });

  /* ───────── boot ───────── */
  S.loader(() => {
    S.observe(document);
    S.parallax();
    go(0);
    updProg();
    matScroll(); quoteScroll();
  });
})();
