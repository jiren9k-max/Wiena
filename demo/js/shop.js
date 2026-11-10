/* WIENA — shop / collection page */
(function () {
  const W = window.WIENA, S = window.SITE, $ = S.$, $$ = S.$$, t = S.t, L = S.L;
  // "Bed Linen" → "Bed <em>Linen</em>", single words go fully italic
  const italicTail = (label) => { const [a, ...b] = label.split(' '); return b.length ? `${a} <em class="italic">${b.join(' ')}</em>` : `<em class="italic">${a}</em>`; };
  const PAGE = 24;
  const params = new URLSearchParams(location.search);

  const B = L.priceBands;
  const PRICES = [
    // bands are in the display currency: KM for Bosnian, EUR for English
    { key: 'u75', label: t('shop.p.u75'), test: (p) => L.price(p.price) < B[0] },
    { key: '75-150', label: t('shop.p.75-150'), test: (p) => L.price(p.price) >= B[0] && L.price(p.price) <= B[1] },
    { key: '150-300', label: t('shop.p.150-300'), test: (p) => L.price(p.price) > B[1] && L.price(p.price) <= B[2] },
    { key: 'o300', label: t('shop.p.o300'), test: (p) => L.price(p.price) > B[2] }
  ];
  const FIBRES = [...new Set(W.products.map((p) => p.fibre))];
  const COLOURS = [...new Set(W.products.map((p) => p.colourKey))];

  const state = {
    cat: params.get('cat') || '',
    room: params.get('room') || '',
    view: params.get('view') || '',
    q: params.get('q') || '',
    colours: [],
    fibres: [],
    price: '',
    sort: 'featured',
    shown: PAGE,
    cols: +(localStorage.getItem('wiena_cols') || 4)
  };

  /* ───────── header copy ───────── */
  function heading() {
    const cat = W.catMap[state.cat];
    let title = t('shop.title'), blurb = t('shop.blurb'), crumb = '';
    let art = { c: '#d6c6a9', kind: 'linen' };
    if (cat) {
      title = italicTail(cat.label);
      blurb = cat.blurb; crumb = cat.label;
      const p = W.products.find((x) => x.cat === cat.key);
      art = { c: p.base, kind: p.kind === 'none' ? 'solid' : p.kind, a: p.accent };
    } else if (state.room) {
      title = italicTail(L.room(state.room));
      blurb = t('shop.room.' + state.room);
      crumb = L.room(state.room);
      art = { c: '#b98d5e', kind: 'herringbone' };
    } else if (state.view === 'sale') { title = t('shop.sale.t'); blurb = t('shop.sale.p'); crumb = t('shop.sale.c'); art = { c: '#8b3a2b', kind: 'solid' }; }
    else if (state.view === 'new') { title = t('shop.new.t'); blurb = t('shop.new.p'); crumb = t('shop.new.c'); art = { c: '#9dab92', kind: 'gingham', a: '#f2ece1' }; }
    else if (state.view === 'wishlist') { title = t('shop.wish.t'); blurb = t('shop.wish.p'); crumb = t('shop.wish.c'); art = { c: '#cfa398', kind: 'solid' }; }
    else if (state.q) { title = `“<em class="italic">${state.q.replace(/</g, '')}</em>”`; blurb = t('shop.search.p'); crumb = t('shop.search.c'); }

    $('#shopTitle').innerHTML = title;
    $('#shopTitle').setAttribute('data-split', '');
    $('#shopBlurb').textContent = blurb;
    $('#crumbs').innerHTML = `<a href="index.html">${t('shop.home')}</a><span>/</span><a href="shop.html">${t('shop.shop')}</a>${crumb ? `<span>/</span>${crumb}` : ''}`;
    const B = PHOTOS.site.banners;
    const banner = B[state.cat] || B[state.room] || B[state.view] || B.all;
    $('#shopArt').innerHTML = Art.fabric(Object.assign({ w: 1600, h: 600, scale: 2.4, k: 0.3, folds: 8, angle: 20, seed: 21, vignette: 0.1 }, art)) + Art.photo(banner, 1920, '');
    document.title = (crumb || t('shop.shop')).replace(/<[^>]+>/g, '') + ' | WIENA';
  }

  /* ───────── category tabs ───────── */
  function tabs() {
    const base = W.products.length;
    const tabs = [['', t('shop.tab.all'), base]].concat(W.CATS.map((c) => [c.key, c.label, W.products.filter((p) => p.cat === c.key).length]));
    $('#catTabs').innerHTML = tabs.map(([k, l, n]) => `<a class="chip ${state.cat === k && !state.room && !state.view && !state.q ? 'on' : ''}" href="shop.html${k ? '?cat=' + k : ''}">${l}<sup>${n}</sup></a>`).join('') +
      `<a class="chip ${state.view === 'new' ? 'on' : ''}" href="shop.html?view=new">${t('shop.tab.new')}</a><a class="chip ${state.view === 'sale' ? 'on' : ''}" href="shop.html?view=sale">${t('shop.tab.sale')}</a>`;
  }

  /* ───────── filter drawer ───────── */
  function filterPanel() {
    const base = baseList();
    const cnt = (fn) => base.filter(fn).length;
    $('#filterBody').innerHTML = `
      <div class="filter-group"><h5>${t('shop.colour')}</h5><div class="filter-colors">${COLOURS.filter((c) => cnt((p) => p.colourKey === c)).map((c) => `<button data-colour="${c}" class="${state.colours.includes(c) ? 'on' : ''}"><span class="sw ${state.colours.includes(c) ? 'on' : ''}" style="background:${W.COLORS[c]}"></span>${L.colour(c)}</button>`).join('')}</div></div>
      <div class="filter-group"><h5>${t('shop.fibre')}</h5>${FIBRES.map((f) => { const n = cnt((p) => p.fibre === f); return n ? `<label class="check"><input type="checkbox" data-fibre="${f}" ${state.fibres.includes(f) ? 'checked' : ''}><i></i>${f}<em>${n}</em></label>` : ''; }).join('')}</div>
      <div class="filter-group"><h5>${t('shop.price')}</h5>${PRICES.map((pr) => `<label class="check"><input type="radio" name="price" data-price="${pr.key}" ${state.price === pr.key ? 'checked' : ''}><i style="border-radius:50%"></i>${pr.label}<em>${cnt(pr.test)}</em></label>`).join('')}</div>`;
  }

  /* ───────── data ───────── */
  function baseList() {
    let list = W.products.slice();
    if (state.cat) list = list.filter((p) => p.cat === state.cat);
    if (state.room) list = list.filter((p) => p.room === state.room || (state.room === 'Bathroom' && p.cat === 'bath'));
    if (state.view === 'sale') list = list.filter((p) => p.compareAt);
    if (state.view === 'new') list = list.filter((p) => p.isNew);
    if (state.view === 'wishlist') { const w = S.store.wish; list = list.filter((p) => w.includes(p.id)); }
    if (state.q) {
      const terms = L.fold(state.q).split(/\s+/);
      list = list.filter((p) => { const h = L.fold(`${p.name} ${p.nameEn} ${p.colour} ${p.colourKey} ${p.catLabel} ${p.material} ${p.fibre}`); return terms.every((x) => L.match(h, x)); });
    }
    return list;
  }

  function filtered() {
    let list = baseList();
    if (state.colours.length) list = list.filter((p) => state.colours.includes(p.colourKey));
    if (state.fibres.length) list = list.filter((p) => state.fibres.includes(p.fibre));
    if (state.price) { const pr = PRICES.find((x) => x.key === state.price); list = list.filter(pr.test); }
    const s = state.sort;
    if (s === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (s === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (s === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (s === 'new') list.sort((a, b) => (b.isNew - a.isNew) || (b.id - a.id));
    else if (!state.cat && !state.q) {
      // featured: interleave categories so the first screen feels editorial, not a list
      const groups = {};
      list.forEach((p) => { (groups[p.cat] = groups[p.cat] || []).push(p); });
      Object.values(groups).forEach((g) => g.sort((a, b) => (b.best - a.best) || (a.familyIndex - b.familyIndex)));
      const order = ['bed-linen', 'throws', 'bath', 'cushions', 'fragrance', 'table', 'wear', 'ceramics', 'curtains', 'objects'];
      const out = [];
      let added = true;
      while (added) { added = false; order.forEach((k) => { if (groups[k] && groups[k].length) { out.push(groups[k].shift()); added = true; } }); }
      list = out;
    }
    return list;
  }

  /* ───────── render ───────── */
  let first = true;
  function render(append) {
    const list = filtered();
    const grid = $('#grid');
    const nActive = state.colours.length + state.fibres.length + (state.price ? 1 : 0);
    $('#filterN').textContent = nActive ? `(${nActive})` : '';
    $('#countLabel').textContent = L.count.pieces(list.length);
    $('#applyBtn').textContent = t('shop.show', { n: list.length });

    // active chips
    const chips = []
      .concat(state.colours.map((c) => `<button class="chip on" data-rm-colour="${c}">${L.colour(c)} ✕</button>`))
      .concat(state.fibres.map((f) => `<button class="chip on" data-rm-fibre="${f}">${f} ✕</button>`))
      .concat(state.price ? [`<button class="chip on" data-rm-price>${PRICES.find((p) => p.key === state.price).label} ✕</button>`] : []);
    $('#activeFilters').innerHTML = chips.length ? chips.join('') + `<button class="chip js-clear">${t('shop.clearAll')}</button>` : '';

    const draw = () => {
      if (!list.length) {
        grid.innerHTML = `<div class="no-results"><p class="serif">${state.view === 'wishlist' ? t('shop.emptyWish') : t('shop.none')}</p>
          <p style="color:var(--muted);margin-bottom:30px">${state.view === 'wishlist' ? t('shop.emptyWishP') : t('shop.noneP')}</p><a href="shop.html" class="btn">${t('shop.browse')}</a></div>`;
      } else if (append) {
        const start = grid.children.length;
        grid.insertAdjacentHTML('beforeend', list.slice(start, state.shown).map((p, i) => S.card(p, i)).join(''));
      } else {
        grid.innerHTML = list.slice(0, state.shown).map((p, i) => S.card(p, i)).join('');
      }
      const shown = Math.min(state.shown, list.length);
      $('#loadMore').innerHTML = list.length ? `<p class="load-more__info">${t('shop.showing', { a: shown, b: list.length })}</p><div class="load-more__bar"><i style="width:${(shown / list.length) * 100}%"></i></div>${shown < list.length ? `<button class="btn js-more">${t('shop.more')}</button>` : ''}` : '';
      grid.classList.remove('fading');
      S.observe(grid);
    };
    if (first || append) { first = false; draw(); }
    else { grid.classList.add('fading'); setTimeout(draw, 380); }
  }

  function setCols(n) {
    state.cols = n;
    localStorage.setItem('wiena_cols', n);
    $('#grid').style.setProperty('--cols', n);
    $$('#density button').forEach((b) => b.classList.toggle('on', +b.dataset.cols === n));
  }

  /* ───────── events ───────── */
  $('.js-filters').addEventListener('click', () => { filterPanel(); S.openDrawer($('#filters')); });
  $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; state.shown = PAGE; render(); });
  $$('#density button').forEach((b) => b.addEventListener('click', () => setCols(+b.dataset.cols)));

  document.addEventListener('click', (e) => {
    const t = e.target;
    const col = t.closest('[data-colour]');
    if (col) {
      const c = col.dataset.colour;
      state.colours = state.colours.includes(c) ? state.colours.filter((x) => x !== c) : state.colours.concat(c);
      state.shown = PAGE; filterPanel(); render();
    }
    if (t.closest('.js-more')) { state.shown += PAGE; render(true); }
    if (t.closest('.js-clear')) { state.colours = []; state.fibres = []; state.price = ''; state.shown = PAGE; filterPanel(); render(); }
    const rc = t.closest('[data-rm-colour]'); if (rc) { state.colours = state.colours.filter((x) => x !== rc.dataset.rmColour); render(); }
    const rf = t.closest('[data-rm-fibre]'); if (rf) { state.fibres = state.fibres.filter((x) => x !== rf.dataset.rmFibre); render(); }
    if (t.closest('[data-rm-price]')) { state.price = ''; render(); }
    // when on wishlist, removing a heart removes the card
    if (state.view === 'wishlist' && t.closest('[data-wish]')) setTimeout(() => render(), 250);
  });
  $('#filterBody').addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.fibre) state.fibres = t.checked ? state.fibres.concat(t.dataset.fibre) : state.fibres.filter((x) => x !== t.dataset.fibre);
    if (t.dataset.price) state.price = t.dataset.price;
    state.shown = PAGE;
    render();
  });

  /* ───────── boot ───────── */
  heading();
  tabs();
  setCols(innerWidth < 900 ? Math.min(state.cols, 3) : state.cols);
  render();
  S.observe(document);
})();
