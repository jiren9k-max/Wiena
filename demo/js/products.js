/* WIENA — product catalogue.
   Products, categories and prices live in the shop database and are edited in the admin (/admin/).
   The server sends them as window.WIENA_DATA (/api/catalog.js, loaded just before this file);
   here they are turned into the shape every page uses, in the visitor's language (bs / en). */
(function () {
  const D = window.WIENA_DATA || { categories: [], products: [], settings: {} };
  const L = window.I18N;
  const bs = !L || L.lang === 'bs';
  const pickL = (o, k) => (bs ? o[k + '_bs'] : o[k + '_en'] || o[k + '_bs']);

  // Swatch colours used by the colour filter (key → hex); products can also bring their own colours
  const COLORS = {
    Oat: '#d6c6a9', Chalk: '#ece6db', Ivory: '#f2ece1', Sand: '#dcc8a3', Stone: '#a39b8f',
    Sage: '#9dab92', Olive: '#6b6a43', Forest: '#2f4236', 'Mist Blue': '#a2b3c0', Ink: '#27303d',
    Charcoal: '#3a3835', Clay: '#b47458', Terracotta: '#a4553a', 'Rose Dust': '#cfa398',
    Ochre: '#c4943f', Camel: '#b98d5e', Mocha: '#6f5444', Bordeaux: '#5a2230', Lavender: '#ab9fbc',
    Champagne: '#e2cda4'
  };

  const CATS = D.categories.map((c) => ({ key: c.key, label: pickL(c, 'name'), labelEn: c.name_en, blurb: pickL(c, 'blurb'), room: c.room, textile: c.textile }));
  const catMap = Object.fromEntries(CATS.map((c) => [c.key, c]));

  const families = [];
  const products = D.products.filter((r) => catMap[r.cat]).map((r) => {
    if (!families.includes(r.family)) families.push(r.family);
    const c = catMap[r.cat];
    const art = r.art || {};
    const price = bs ? r.price : r.price_eur;
    const compareAt = bs ? r.old_price : r.old_price_eur;
    if (r.colour_key && !COLORS[r.colour_key]) COLORS[r.colour_key] = r.swatch;
    const badge = r.badge === 'Sale' ? (compareAt ? 'Sale' : null) : r.badge || (compareAt ? 'Sale' : null);
    return {
      id: r.id,
      code: r.code,
      slug: r.slug,
      family: r.family,
      familyIndex: families.indexOf(r.family),
      name: pickL(r, 'name'),
      nameEn: r.name_en,
      cat: r.cat,
      catLabel: c.label,
      room: c.room,
      textile: c.textile,
      colour: pickL(r, 'colour'),
      colourKey: r.colour_key || r.colour_en,
      colourName: L && L.colour ? L.colour(r.colour_key) : r.colour_key,
      swatch: r.swatch,
      base: art.base || r.swatch,
      accent: art.accent || null,
      accentShade: art.accentShade == null ? undefined : art.accentShade,
      material: pickL(r, 'material'),
      fibre: L && L.fibre ? L.fibre(r.fibre) : r.fibre,
      fibreKey: r.fibre,
      kind: art.kind || 'linen',
      shape: art.shape || 'stack',
      price,
      compareAt: compareAt || null,
      priceKm: r.price,               // orders are always charged in KM
      sizes: r.sizes && r.sizes.length ? r.sizes : ['One size'],
      badge,
      isNew: !!r.is_new,
      best: !!(art.opts && art.opts.best) || r.badge === 'Bestseller',
      rating: r.rating || 5,
      reviews: r.reviews || 0,
      desc: pickL(r, 'desc'),
      details: [pickL(r, 'material')].concat(bs ? r.details_bs : r.details_en && r.details_en.length ? r.details_en : r.details_bs).filter(Boolean),
      care: pickL(r, 'care'),
      stock: r.stock,                 // null = not tracked (always available)
      soldOut: r.stock === 0,
      images: r.images || [],
      opts: art.opts || {}
    };
  });

  const byId = Object.fromEntries(products.map((p) => [String(p.id), p]));

  window.WIENA = {
    COLORS,
    CATS,
    catMap,
    products,
    settings: D.settings || {},
    get: (pid) => byId[String(pid)],
    siblings: (p) => products.filter((x) => x.family === p.family),
    // representative product per family (first colour)
    families: () => products.filter((p, i, a) => a.findIndex((x) => x.family === p.family) === i)
  };
})();
