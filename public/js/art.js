/* WIENA — procedural product art (SVG). Every image on the site is drawn here,
   so the shop works offline and stays visually coherent until real photography arrives. */
window.Art = (function () {
  let uid = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function rgb(h) { h = h.replace('#', ''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function hex(r, g, b) { return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
  function shade(h, a) { const [r, g, b] = rgb(h); const t = a < 0 ? 0 : 255, p = Math.abs(a); return hex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p); }
  function lum(h) { const [r, g, b] = rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
  function rnd(seed) { let t = seed >>> 0; return () => { t += 0x6d2b79f5; let x = Math.imul(t ^ (t >>> 15), 1 | t); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }

  /* ───────────── weave patterns ───────────── */
  function pattern(id, kind, c, a, s) {
    s = s || 1;
    const T = `patternUnits="userSpaceOnUse" patternTransform="scale(${s})"`;
    const d = shade(c, -0.1), l = shade(c, 0.13);
    switch (kind) {
      case 'linen': {
        return `<pattern id="${id}" width="24" height="24" ${T}><rect width="24" height="24" fill="${c}"/>
          <path d="M0 1.5h24M0 4.5h24M0 7.5h24M0 10.5h24M0 13.5h24M0 16.5h24M0 19.5h24M0 22.5h24" stroke="${d}" stroke-width=".8" opacity=".45"/>
          <path d="M1.5 0v24M4.5 0v24M7.5 0v24M10.5 0v24M13.5 0v24M16.5 0v24M19.5 0v24M22.5 0v24" stroke="${l}" stroke-width=".7" opacity=".4"/>
          <path d="M2 7.5h7M13 16.5h9M5 22.5h5M15 4.5h4" stroke="${shade(c, -0.16)}" stroke-width="1.1" opacity=".35" stroke-linecap="round"/></pattern>`;
      }
      case 'stripe':
        return `<pattern id="${id}" width="30" height="30" ${T}><rect width="30" height="30" fill="${c}"/><rect width="11" height="30" fill="${a}"/><rect x="15" width="2.5" height="30" fill="${a}" opacity=".7"/>
          <path d="M0 2h30M0 6h30M0 10h30M0 14h30M0 18h30M0 22h30M0 26h30" stroke="#000" stroke-opacity=".04"/></pattern>`;
      case 'pinstripe':
        return `<pattern id="${id}" width="12" height="12" ${T}><rect width="12" height="12" fill="${c}"/><rect width="1.6" height="12" fill="${a}"/></pattern>`;
      case 'gingham':
        return `<pattern id="${id}" width="26" height="26" ${T}><rect width="26" height="26" fill="${c}"/><rect width="13" height="26" fill="${a}" opacity=".42"/><rect width="26" height="13" fill="${a}" opacity=".42"/>
          <path d="M0 3h26M0 8h26M0 18h26M0 23h26" stroke="#fff" stroke-opacity=".08"/></pattern>`;
      case 'check':
        return `<pattern id="${id}" width="46" height="46" ${T}><rect width="46" height="46" fill="${c}"/>
          <path d="M0 4h46M0 12h46M0 20h46M0 28h46M0 36h46M0 44h46" stroke="${d}" stroke-opacity=".25"/>
          <path d="M0 .9H46M.9 0V46" stroke="${a}" stroke-width="1.8"/></pattern>`;
      case 'herringbone': {
        const k = shade(c, -0.2), h = shade(c, 0.12);
        return `<pattern id="${id}" width="16" height="8" ${T}><rect width="16" height="8" fill="${c}"/>
          <path d="M0 8L8 0M0 4L4 0M4 8L8 4" stroke="${k}" stroke-width="1.3" opacity=".7"/>
          <path d="M8 0L16 8M8 4L12 8M12 0L16 4" stroke="${h}" stroke-width="1.3" opacity=".8"/>
          <path d="M8 0V8" stroke="${shade(c, -0.25)}" stroke-width=".6" opacity=".5"/></pattern>`;
      }
      case 'waffle':
        return `<pattern id="${id}" width="14" height="14" ${T}><rect width="14" height="14" fill="${shade(c, -0.12)}"/>
          <rect x="2.2" y="2.2" width="9.6" height="9.6" rx="2.2" fill="${c}"/><path d="M3 3.2h8" stroke="${l}" stroke-width="1" opacity=".7"/></pattern>`;
      case 'boucle': {
        const k = shade(c, -0.14), h = shade(c, 0.16);
        return `<pattern id="${id}" width="18" height="18" ${T}><rect width="18" height="18" fill="${c}"/>
          <circle cx="4" cy="4" r="2.6" fill="none" stroke="${k}" stroke-width="1.1"/><circle cx="13" cy="6" r="2.2" fill="${h}"/>
          <circle cx="8" cy="12" r="2.8" fill="none" stroke="${k}" stroke-width="1"/><circle cx="15" cy="15" r="2" fill="none" stroke="${h}" stroke-width="1.3"/>
          <circle cx="2" cy="15" r="1.6" fill="${h}"/><circle cx="9" cy="2" r="1.2" fill="${k}" opacity=".6"/></pattern>`;
      }
      case 'rib':
        return `<pattern id="${id}" width="8" height="8" ${T}><rect width="8" height="8" fill="${c}"/><rect width="4" height="8" fill="${shade(c, -0.08)}"/>
          <rect width="1" height="8" fill="${l}"/><path d="M0 2h8M0 6h8" stroke="#000" stroke-opacity=".05"/></pattern>`;
      case 'diamond':
        return `<pattern id="${id}" width="28" height="28" ${T}><rect width="28" height="28" fill="${c}"/>
          <path d="M14 2L26 14L14 26L2 14Z" fill="none" stroke="${a}" stroke-width="1.3"/>
          <path d="M14 9L19 14L14 19L9 14Z" fill="${a}" opacity=".45"/></pattern>`;
      default: // solid / velvet / silk
        return `<pattern id="${id}" width="10" height="10" ${T}><rect width="10" height="10" fill="${c}"/></pattern>`;
    }
  }

  /* ───────────── shared gradients ───────────── */
  function folds(id, n, k, rotate, r) {
    let stops = '';
    for (let i = 0; i <= n; i++) {
      const off = clamp(i / n + (r ? (r() - 0.5) * 0.06 : 0), 0, 1);
      const light = i % 2 === 0;
      stops += `<stop offset="${off.toFixed(3)}" stop-color="${light ? '#fff' : '#000'}" stop-opacity="${(light ? k * 0.6 : k).toFixed(3)}"/>`;
    }
    return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0" ${rotate ? `gradientTransform="rotate(${rotate} .5 .5)"` : ''}>${stops}</linearGradient>`;
  }
  const vRound = (id, k) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${0.3 * (k || 1)}"/><stop offset=".28" stop-color="#fff" stop-opacity="0"/><stop offset=".68" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${0.26 * (k || 1)}"/></linearGradient>`;
  const hCyl = (id, k) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="${0.32 * (k || 1)}"/><stop offset=".22" stop-color="#fff" stop-opacity="${0.16 * (k || 1)}"/><stop offset=".38" stop-color="#fff" stop-opacity="${0.22 * (k || 1)}"/><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${0.4 * (k || 1)}"/></linearGradient>`;
  const ceramic = (id, c) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(c, -0.32)}"/><stop offset=".2" stop-color="${shade(c, 0.08)}"/><stop offset=".34" stop-color="${shade(c, 0.22)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.4)}"/></linearGradient>`;

  function backdrop(ctx, dark) {
    const { id } = ctx;
    let b = dark ? '#2b2723' : (lum(ctx.c) > 0.72 ? '#d5ccbe' : '#ebe4d8');
    if (ctx.tone) b = ctx.tone;
    ctx.defs += `<radialGradient id="${id}bg" cx="50%" cy="32%" r="80%"><stop offset="0" stop-color="${shade(b, dark ? 0.08 : 0.3)}"/><stop offset="1" stop-color="${shade(b, -0.08)}"/></radialGradient>
      <linearGradient id="${id}fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(b, -0.1)}" stop-opacity="0"/><stop offset="1" stop-color="${shade(b, -0.16)}" stop-opacity=".95"/></linearGradient>
      <radialGradient id="${id}sh"><stop offset="0" stop-color="#000" stop-opacity="${dark ? 0.5 : 0.3}"/><stop offset=".55" stop-color="#000" stop-opacity=".09"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`;
    return `<rect width="400" height="500" fill="url(#${id}bg)"/><rect y="320" width="400" height="180" fill="url(#${id}fl)"/>`;
  }
  const shadow = (ctx, cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${ctx.id}sh)"/>`;

  /* ───────────── textile shapes ───────────── */
  function stack(ctx) {
    const { id, P, o } = ctx;
    const L = o.layers || 3, h = o.h || 58, w = o.w || 270, rx = o.rx || 16;
    ctx.defs += vRound(id + 'v');
    let s = shadow(ctx, 200, 384, w * 0.64, 22);
    const offs = [0, -7, 6, -4, 3];
    let topY = 0;
    for (let i = 0; i < L; i++) {
      const y = 380 - (i + 1) * h + i * 2, x = 200 - w / 2 + offs[i];
      topY = y;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${P}"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#${id}v)"/>
        <path d="M${x + rx} ${y + 5}h${w - rx * 2}" stroke="#fff" stroke-opacity=".18"/>`;
    }
    if (o.band) {
      s += `<rect x="248" y="${topY - 3}" width="30" height="${383 - topY}" fill="#efe7d8"/><rect x="248" y="${topY - 3}" width="30" height="${383 - topY}" fill="url(#${id}v)" opacity=".7"/>
        <circle cx="263" cy="${(topY + 380) / 2}" r="10" fill="#8c7054"/><text x="263" y="${(topY + 380) / 2 + 4.5}" font-family="Cormorant Garamond,Georgia,serif" font-size="13" fill="#f3ece0" text-anchor="middle">W</text>`;
    }
    return s;
  }

  function towel(ctx) {
    const { id, P, c } = ctx;
    ctx.defs += vRound(id + 'v', 1.2);
    let s = shadow(ctx, 200, 386, 170, 22);
    const offs = [0, -8, 6];
    for (let i = 0; i < 3; i++) {
      const h = 74, w = 250, y = 380 - (i + 1) * h + i * 4, x = 75 + offs[i];
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="30" fill="${P}"/>
        <rect x="${x + w - 52}" y="${y + 2}" width="12" height="${h - 4}" fill="${shade(c, -0.14)}" opacity=".55"/>
        <rect x="${x + w - 36}" y="${y + 2}" width="3" height="${h - 4}" fill="${shade(c, -0.14)}" opacity=".5"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="30" fill="url(#${id}v)"/>`;
    }
    return s;
  }

  function drape(ctx, W, top) {
    const { id, P, c, o, r } = ctx;
    W = W || 230; top = top || 120;
    const L = 200 - W / 2, R = 200 + W / 2;
    ctx.defs += folds(id + 'h', 7, 0.2, 0, r) + vRound(id + 'v', 0.9);
    const frontB = top + 232, backB = top + 330;
    let s = shadow(ctx, 200, backB + 22, W * 0.72, 14);
    s += `<line x1="${L - 46}" y1="${top}" x2="${R + 46}" y2="${top}" stroke="#5c4636" stroke-width="7" stroke-linecap="round"/>
      <circle cx="${L - 50}" cy="${top}" r="8" fill="#4d3a2c"/><circle cx="${R + 50}" cy="${top}" r="8" fill="#4d3a2c"/>`;
    const back = `M${L + 6} ${top + 4}L${R - 6} ${top + 4}L${R + 2} ${backB}Q200 ${backB + 10} ${L - 2} ${backB}Z`;
    s += `<path d="${back}" fill="${P}"/><path d="${back}" fill="url(#${id}h)"/><path d="${back}" fill="#000" opacity=".16"/>`;
    const front = `M${L} ${top + 4}L${R} ${top + 4}L${R + 7} ${frontB}Q200 ${frontB + 10} ${L - 7} ${frontB}Z`;
    if (o.fringe) {
      const fr = (y0, l, rr, len, op) => {
        let f = '';
        for (let x = l; x <= rr; x += 4.5) {
          const t = (x - 200) / ((rr - l) / 2);
          const y = y0 + 5 * (1 - t * t);
          f += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${(r() * 2 - 1).toFixed(1)} ${len + r() * 4}" stroke="${shade(c, op)}" stroke-width="1.7" stroke-linecap="round"/>`;
        }
        return f;
      };
      s += fr(backB - 1, L, R, 15, -0.2);
      s += `<path d="${front}" fill="${P}"/><path d="${front}" fill="url(#${id}h)"/>`;
      s += fr(frontB - 1, L - 6, R + 6, 16, -0.05);
    } else {
      s += `<path d="${front}" fill="${P}"/><path d="${front}" fill="url(#${id}h)"/>`;
    }
    s += `<path d="M${L} ${top + 4}L${R} ${top + 4}L${R + 7} ${frontB}Q200 ${frontB + 10} ${L - 7} ${frontB}Z" fill="url(#${id}v)" opacity=".5"/>
      <rect x="${L - 5}" y="${top - 13}" width="${W + 10}" height="27" rx="13.5" fill="${P}"/><rect x="${L - 5}" y="${top - 13}" width="${W + 10}" height="27" rx="13.5" fill="url(#${id}v)"/>`;
    return s;
  }

  function curtain(ctx) {
    const { id, P, o, r } = ctx;
    ctx.defs += folds(id + 'h', 8, 0.26, 0, r) +
      `<radialGradient id="${id}win" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#fffaf0" stop-opacity=".95"/><stop offset="1" stop-color="#fffaf0" stop-opacity="0"/></radialGradient>`;
    const op = o.sheer ? 0.78 : 1;
    let s = `<rect x="40" y="60" width="320" height="420" fill="url(#${id}win)"/>
      <path d="M90 90h220v360H90z" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/><path d="M200 90v360M90 270h220" stroke="#fff" stroke-opacity=".45" stroke-width="3"/>`;
    s += `<line x1="26" y1="60" x2="374" y2="60" stroke="#6a5543" stroke-width="5" stroke-linecap="round"/><circle cx="22" cy="60" r="7" fill="#5a4535"/><circle cx="378" cy="60" r="7" fill="#5a4535"/>`;
    const panel = (x0, x1) => {
      const p = `M${x0} 66L${x1} 66L${x1 + 6} 476Q${(x0 + x1) / 2} 482 ${x0 - 6} 476Z`;
      let q = `<path d="${p}" fill="${P}" fill-opacity="${op}"/><path d="${p}" fill="url(#${id}h)"/>`;
      for (let x = x0 + 6; x < x1; x += 18) q += `<circle cx="${x}" cy="62" r="5" fill="none" stroke="#7a6350" stroke-width="2"/>`;
      return q;
    };
    s += panel(46, 182) + panel(218, 354);
    return s;
  }

  function cushion(ctx, lumbar) {
    const { id, P, c } = ctx;
    ctx.defs += `<radialGradient id="${id}r" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient>`;
    const p = lumbar
      ? 'M60 196Q200 222 340 196Q322 268 340 340Q200 316 60 340Q78 268 60 196Z'
      : 'M80 128Q200 160 320 128Q290 258 320 388Q200 356 80 388Q110 258 80 128Z';
    let s = shadow(ctx, 200, lumbar ? 352 : 392, 160, lumbar ? 16 : 20);
    s += `<path d="${p}" fill="${P}"/><path d="${p}" fill="url(#${id}r)"/>`;
    if (ctx.o.sheen) s += `<ellipse cx="176" cy="${lumbar ? 248 : 214}" rx="${lumbar ? 110 : 80}" ry="${lumbar ? 22 : 52}" fill="#fff" opacity=".07"/>`;
    s += `<path d="${p}" fill="none" stroke="${shade(c, -0.22)}" stroke-width="3.2"/>`;
    s += lumbar
      ? '<path d="M110 270Q200 262 290 272" stroke="#000" stroke-opacity=".06" stroke-width="10" fill="none"/>'
      : '<path d="M130 250Q200 238 268 254" stroke="#000" stroke-opacity=".05" stroke-width="14" fill="none"/>';
    return s;
  }

  function robe(ctx) {
    const { id, P, c, r } = ctx;
    ctx.defs += folds(id + 'h', 9, 0.14, 0, r);
    let s = `<line x1="0" y1="44" x2="400" y2="44" stroke="#6a5543" stroke-width="5"/>
      <path d="M200 74q0-18 13-24q12-5 12 10" fill="none" stroke="#9a7b45" stroke-width="3"/>`;
    s += shadow(ctx, 200, 468, 120, 10);
    s += `<path d="M150 96L250 96L200 240Z" fill="${shade(c, -0.32)}"/>`;
    const body = 'M150 96L110 108Q78 150 56 236L96 256L130 184L126 460L274 460L270 184L304 256L344 236Q322 150 290 108L250 96L200 240Z';
    s += `<path d="${body}" fill="${P}"/><path d="${body}" fill="url(#${id}h)"/>`;
    s += `<path d="M150 96L200 240L250 96" fill="none" stroke="${P}" stroke-width="18"/><path d="M150 96L200 240L250 96" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="18"/>
      <path d="M126 270h148" stroke="${P}" stroke-width="14"/><path d="M126 270h148" stroke="#000" stroke-opacity=".18" stroke-width="14"/>
      <path d="M220 272q4 40-6 86M232 272q8 34 2 74" stroke="${shade(c, -0.18)}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <rect x="142" y="320" width="44" height="50" rx="4" fill="#000" opacity=".07"/>
      <path d="M110 108L200 74L290 108" fill="none" stroke="#8a6b4c" stroke-width="7" stroke-linecap="round"/>`;
    return s;
  }

  function apron(ctx) {
    const { id, P, c, r } = ctx;
    ctx.defs += folds(id + 'h', 7, 0.12, 0, r);
    let s = `<circle cx="200" cy="58" r="9" fill="#6a5543"/><path d="M200 58Q150 70 150 124M200 58Q250 70 250 124" fill="none" stroke="${shade(c, -0.1)}" stroke-width="5"/>`;
    s += shadow(ctx, 200, 466, 110, 10);
    const b = 'M150 120L250 120L262 222Q300 230 302 250L292 458L108 458L98 250Q100 230 138 222Z';
    s += `<path d="${b}" fill="${P}"/><path d="${b}" fill="url(#${id}h)"/>
      <rect x="148" y="290" width="104" height="70" rx="3" fill="${P}"/><rect x="148" y="290" width="104" height="70" rx="3" fill="#000" opacity=".09"/><path d="M200 290v70" stroke="#000" stroke-opacity=".15"/>
      <path d="M100 252Q60 300 76 380M300 252Q340 300 324 380" fill="none" stroke="${shade(c, -0.08)}" stroke-width="5" stroke-linecap="round"/>`;
    return s;
  }

  /* ───────────── home objects ───────────── */
  function candle(ctx) {
    const { id, c, o } = ctx;
    ctx.defs += ceramic(id + 'cv', c) +
      `<radialGradient id="${id}gl"><stop offset="0" stop-color="#ffd59a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd59a" stop-opacity="0"/></radialGradient>
       <linearGradient id="${id}fm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe8"/><stop offset=".55" stop-color="#ffc263"/><stop offset="1" stop-color="#e3742c"/></linearGradient>`;
    const lab = (o.label || '').toUpperCase();
    return `<circle cx="200" cy="196" r="120" fill="url(#${id}gl)"/>${shadow(ctx, 200, 384, 104, 15)}
      <rect x="132" y="232" width="136" height="150" rx="16" fill="url(#${id}cv)"/>
      <ellipse cx="200" cy="233" rx="68" ry="11" fill="${shade(c, -0.38)}"/><ellipse cx="200" cy="235" rx="60" ry="8" fill="#efe5d2"/>
      <path d="M200 232q1.5-8-1-15" stroke="#2a2420" stroke-width="2" fill="none"/>
      <path d="M200 174C209 190 213 205 200 218C187 205 191 190 200 174Z" fill="url(#${id}fm)"/>
      <rect x="160" y="278" width="80" height="56" fill="#f5efe4"/>
      <text x="200" y="300" font-family="Jost,Arial,sans-serif" font-size="8.5" letter-spacing="3.2" fill="#2b2622" text-anchor="middle">WIENA</text>
      <text x="200" y="318" font-family="Cormorant Garamond,Georgia,serif" font-style="italic" font-size="10" fill="#5d5248" text-anchor="middle">${lab.length > 13 ? lab.slice(0, 13) : lab}</text>`;
  }

  function bottle(ctx, diffuser) {
    const { id, c, o, r } = ctx;
    ctx.defs += `<linearGradient id="${id}gs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(c, -0.35)}" stop-opacity=".95"/><stop offset=".3" stop-color="${shade(c, 0.15)}" stop-opacity=".85"/><stop offset=".7" stop-color="${c}" stop-opacity=".85"/><stop offset="1" stop-color="${shade(c, -0.4)}" stop-opacity=".95"/></linearGradient>
      <linearGradient id="${id}br" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a5524"/><stop offset=".35" stop-color="#e6c27a"/><stop offset="1" stop-color="#6b4a1f"/></linearGradient>`;
    const lab = (o.label || '').toUpperCase();
    let s = '';
    if (diffuser) {
      for (let i = 0; i < 7; i++) {
        const k = i - 3;
        s += `<path d="M${200 + k * 2.4} 252L${(200 + k * 24 + (r() - 0.5) * 10).toFixed(1)} ${70 + Math.abs(k) * 16}" stroke="#7d5f45" stroke-width="2.4" stroke-linecap="round"/>`;
      }
      s += shadow(ctx, 200, 386, 90, 12) + `<rect x="138" y="262" width="124" height="122" rx="28" fill="url(#${id}gs)"/>
        <rect x="150" y="272" width="9" height="96" rx="4.5" fill="#fff" opacity=".35"/>
        <rect x="183" y="234" width="34" height="32" rx="4" fill="${shade(c, -0.25)}"/><rect x="179" y="244" width="42" height="11" fill="url(#${id}br)"/>
        <rect x="166" y="296" width="68" height="52" fill="#f5efe4"/>`;
      s += `<text x="200" y="316" font-family="Jost,Arial,sans-serif" font-size="7.5" letter-spacing="2.8" fill="#2b2622" text-anchor="middle">WIENA</text><text x="200" y="333" font-family="Cormorant Garamond,Georgia,serif" font-style="italic" font-size="9" fill="#5d5248" text-anchor="middle">${lab}</text>`;
    } else {
      s += shadow(ctx, 200, 388, 66, 11) + `<rect x="156" y="194" width="88" height="190" rx="12" fill="url(#${id}gs)"/>
        <rect x="165" y="206" width="8" height="164" rx="4" fill="#fff" opacity=".35"/>
        <rect x="184" y="172" width="32" height="24" fill="url(#${id}br)"/>
        <rect x="178" y="138" width="44" height="36" rx="7" fill="#2b2723"/><rect x="164" y="148" width="16" height="9" rx="2" fill="#2b2723"/>
        <rect x="166" y="262" width="68" height="74" fill="#f5efe4"/>
        <text x="200" y="288" font-family="Jost,Arial,sans-serif" font-size="7.5" letter-spacing="2.8" fill="#2b2622" text-anchor="middle">WIENA</text>
        <text x="200" y="306" font-family="Cormorant Garamond,Georgia,serif" font-style="italic" font-size="8.5" fill="#5d5248" text-anchor="middle">${lab.split(' ')[0] || ''}</text>
        <text x="200" y="318" font-family="Cormorant Garamond,Georgia,serif" font-style="italic" font-size="8.5" fill="#5d5248" text-anchor="middle">${lab.split(' ').slice(1).join(' ')}</text>`;
    }
    return s;
  }

  function speckles(ctx, clipId, x0, x1, y0, y1, n) {
    const { c, r } = ctx;
    let s = `<g clip-path="url(#${clipId})">`;
    for (let i = 0; i < n; i++) s += `<circle cx="${(x0 + r() * (x1 - x0)).toFixed(1)}" cy="${(y0 + r() * (y1 - y0)).toFixed(1)}" r="${(0.5 + r() * 1.3).toFixed(2)}" fill="${shade(c, -0.55)}" opacity="${(0.25 + r() * 0.4).toFixed(2)}"/>`;
    return s + '</g>';
  }

  function vase(ctx, bud) {
    const { id, c, r } = ctx;
    ctx.defs += ceramic(id + 'cv', c);
    const body = bud
      ? 'M186 196Q184 214 190 226Q150 262 156 326Q162 386 200 388Q238 386 244 326Q250 262 210 226Q216 214 214 196Z'
      : 'M176 128Q170 160 180 182Q112 228 120 318Q128 390 200 392Q272 390 280 318Q288 228 220 182Q230 160 224 128Z';
    ctx.defs += `<clipPath id="${id}cl"><path d="${body}"/></clipPath>`;
    let s = '';
    // dried stems
    const stems = bud ? [[200, 200, 214, 92]] : [[196, 132, 140, 40], [204, 132, 252, 30], [200, 132, 206, 18], [192, 134, 110, 80]];
    stems.forEach(([x0, y0, x1, y1]) => {
      const mx = (x0 + x1) / 2 + (r() - 0.5) * 30, my = (y0 + y1) / 2;
      s += `<path d="M${x0} ${y0}Q${mx.toFixed(1)} ${my} ${x1} ${y1}" stroke="#8d7a55" stroke-width="2" fill="none"/>`;
      for (let t = 0.35; t < 1; t += 0.13) {
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1, y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1;
        s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="7" ry="2.6" fill="${r() > 0.5 ? '#a99b6a' : '#bfae80'}" transform="rotate(${(r() * 80 - 40).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      }
    });
    s += shadow(ctx, 200, 392, bud ? 64 : 100, 13);
    s += `<path d="${body}" fill="url(#${id}cv)"/>`;
    if (bud) { let ribs = `<g clip-path="url(#${id}cl)">`; for (let x = 150; x < 252; x += 8) ribs += `<path d="M${x} 196V400" stroke="#000" stroke-opacity=".09" stroke-width="3"/><path d="M${x + 3} 196V400" stroke="#fff" stroke-opacity=".12"/>`; s += ribs + '</g>'; }
    s += speckles(ctx, id + 'cl', 110, 290, 120, 400, bud ? 40 : 90);
    s += bud ? `<ellipse cx="200" cy="196" rx="14" ry="3.5" fill="${shade(c, -0.45)}"/>` : `<ellipse cx="200" cy="128" rx="24" ry="5" fill="${shade(c, -0.45)}"/>`;
    return s;
  }

  function bowl(ctx) {
    const { id, c, o } = ctx;
    const R = o.wide ? 140 : 104, D = o.wide ? 70 : 96, cy = 292;
    ctx.defs += ceramic(id + 'cv', c) + `<linearGradient id="${id}in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c, -0.35)}"/><stop offset="1" stop-color="${shade(c, 0.12)}"/></linearGradient>`;
    const outer = `M${200 - R} ${cy}C${200 - R + 6} ${cy + D * 1.25} ${200 + R - 6} ${cy + D * 1.25} ${200 + R} ${cy}Z`;
    ctx.defs += `<clipPath id="${id}cl"><path d="${outer}"/></clipPath>`;
    const by = cy + D * 0.94;
    let s = shadow(ctx, 200, by + 6, R * 0.8, 14);
    s += `<rect x="${200 - R * 0.32}" y="${by - 10}" width="${R * 0.64}" height="14" rx="4" fill="#c9a985"/>`;
    s += `<path d="${outer}" fill="url(#${id}cv)"/>
      <g clip-path="url(#${id}cl)"><path d="M${200 - R} ${cy + D * 0.68}Q${200 - R / 2} ${cy + D * 0.62} 200 ${cy + D * 0.7}T${200 + R} ${cy + D * 0.66}V${cy + D * 2}H${200 - R}Z" fill="#cdb08e"/></g>`;
    s += speckles(ctx, id + 'cl', 200 - R, 200 + R, cy, cy + D, 70);
    s += `<ellipse cx="200" cy="${cy}" rx="${R}" ry="${R * 0.17}" fill="${shade(c, -0.12)}"/><ellipse cx="200" cy="${cy + 1}" rx="${R - 6}" ry="${R * 0.17 - 3}" fill="url(#${id}in)"/>`;
    return s;
  }

  function tray(ctx) {
    const { c, r } = ctx;
    let s = shadow(ctx, 200, 352, 170, 22);
    s += `<ellipse cx="200" cy="336" rx="156" ry="50" fill="${shade(c, -0.18)}"/><ellipse cx="200" cy="326" rx="156" ry="48" fill="${c}"/>
      <ellipse cx="200" cy="326" rx="136" ry="38" fill="${shade(c, -0.06)}"/><ellipse cx="200" cy="322" rx="134" ry="35" fill="${shade(c, 0.05)}"/>`;
    for (let i = 0; i < 14; i++) {
      const y = 296 + i * 4.6, x = 90 + r() * 60;
      s += `<path d="M${x} ${y}q${40 + r() * 60} ${r() * 4 - 2} ${120 + r() * 80} 0" stroke="${shade(c, -0.2)}" stroke-opacity=".25" fill="none"/>`;
    }
    for (let i = 0; i < 26; i++) s += `<ellipse cx="${(90 + r() * 220).toFixed(0)}" cy="${(300 + r() * 50).toFixed(0)}" rx="${(1 + r() * 3).toFixed(1)}" ry="1" fill="${shade(c, -0.35)}" opacity=".45"/>`;
    // little brass dish with ring
    s += `<ellipse cx="248" cy="322" rx="34" ry="10" fill="#9b7232"/><ellipse cx="248" cy="319" rx="30" ry="8" fill="#d9b267"/><circle cx="244" cy="317" r="6" fill="none" stroke="#f0d79a" stroke-width="2"/>`;
    return s;
  }

  function basket(ctx) {
    const { id, P, c } = ctx;
    ctx.defs += hCyl(id + 'hc') + pattern(id + 'pk', 'linen', '#d6c6a9', '#d6c6a9', 1);
    const body = 'M108 200L292 200L272 396Q200 406 128 396Z';
    let s = shadow(ctx, 200, 398, 110, 15);
    s += `<path d="M150 200Q160 130 214 116Q262 108 262 200Z" fill="url(#${id}pk)"/><path d="M150 200Q160 130 214 116Q262 108 262 200Z" fill="#000" opacity=".08"/>`;
    s += `<path d="${body}" fill="${P}"/><path d="${body}" fill="url(#${id}hc)"/>
      <ellipse cx="200" cy="200" rx="92" ry="16" fill="none" stroke="${shade(c, -0.2)}" stroke-width="9"/>
      <rect x="126" y="214" width="24" height="9" rx="4.5" fill="${shade(c, -0.55)}"/><rect x="250" y="214" width="24" height="9" rx="4.5" fill="${shade(c, -0.55)}"/>`;
    return s;
  }

  function holder(ctx) {
    const { id, o } = ctx;
    ctx.defs += `<linearGradient id="${id}br" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e4a1c"/><stop offset=".3" stop-color="#ecca83"/><stop offset=".55" stop-color="#c8953f"/><stop offset="1" stop-color="#5f4019"/></linearGradient>
      <linearGradient id="${id}tp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9cdb8"/><stop offset=".4" stop-color="#f7f0e3"/><stop offset="1" stop-color="#cbbfa9"/></linearGradient>
      <linearGradient id="${id}fm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe8"/><stop offset=".55" stop-color="#ffc263"/><stop offset="1" stop-color="#e3742c"/></linearGradient>
      <radialGradient id="${id}gl"><stop offset="0" stop-color="#ffd59a" stop-opacity=".5"/><stop offset="1" stop-color="#ffd59a" stop-opacity="0"/></radialGradient>`;
    const one = (cx, sc) => {
      const by = 380, stemTop = by - 130 * sc, candleTop = stemTop - 150 * sc;
      return `<circle cx="${cx}" cy="${candleTop - 10}" r="${70 * sc}" fill="url(#${id}gl)"/>${shadow(ctx, cx, by + 4, 66 * sc, 11)}
        <ellipse cx="${cx}" cy="${by}" rx="${54 * sc}" ry="${11 * sc}" fill="url(#${id}br)"/>
        <path d="M${cx - 40 * sc} ${by - 2}Q${cx} ${by - 44 * sc} ${cx + 40 * sc} ${by - 2}Z" fill="url(#${id}br)"/>
        <rect x="${cx - 6 * sc}" y="${stemTop}" width="${12 * sc}" height="${by - stemTop - 20 * sc}" fill="url(#${id}br)"/>
        <ellipse cx="${cx}" cy="${stemTop + 50 * sc}" rx="${12 * sc}" ry="${9 * sc}" fill="url(#${id}br)"/>
        <rect x="${cx - 17 * sc}" y="${stemTop - 6}" width="${34 * sc}" height="${14 * sc}" rx="3" fill="url(#${id}br)"/>
        <rect x="${cx - 7 * sc}" y="${candleTop}" width="${14 * sc}" height="${stemTop - candleTop - 4}" fill="url(#${id}tp)"/>
        <path d="M${cx} ${candleTop - 30 * sc}C${cx + 7 * sc} ${candleTop - 18 * sc} ${cx + 9 * sc} ${candleTop - 6 * sc} ${cx} ${candleTop - 2}C${cx - 9 * sc} ${candleTop - 6 * sc} ${cx - 7 * sc} ${candleTop - 18 * sc} ${cx} ${candleTop - 30 * sc}Z" fill="url(#${id}fm)"/>`;
    };
    return o.pair ? one(150, 1.05) + one(262, 0.78) : one(200, 1.1);
  }

  function hanger(ctx) {
    const { c } = ctx;
    let s = '<line x1="20" y1="96" x2="380" y2="96" stroke="#6a5543" stroke-width="6" stroke-linecap="round"/>';
    [-14, 0, 14].forEach((rot, i) => {
      const col = shade(c, (i - 1) * 0.12);
      s += `<g transform="rotate(${rot} ${200 + (i - 1) * 40} 96) translate(${(i - 1) * 40} ${i * 6})">
        <path d="M200 96q0-14 10-16q10-1 10 9" fill="none" stroke="#c49a4e" stroke-width="3"/>
        <path d="M200 98v24" stroke="#c49a4e" stroke-width="3"/>
        <path d="M86 196Q200 110 314 196" fill="none" stroke="${col}" stroke-width="15" stroke-linecap="round"/>
        <path d="M90 190Q200 112 310 190" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3"/>
        <path d="M92 202L308 202" stroke="${shade(col, -0.2)}" stroke-width="5" stroke-linecap="round"/></g>`;
    });
    s += shadow(ctx, 200, 420, 120, 10);
    return s;
  }

  /* ───────────── full-bleed fabric (swatches, hero, editorial) ───────────── */
  function fabric(opts) {
    const id = 'f' + (++uid);
    const W = opts.w || 400, H = opts.h || 500;
    const r = rnd(opts.seed || uid * 7);
    const c = opts.c, a = opts.a || shade(c, -0.25);
    let defs = pattern(id + 'p', opts.kind || 'linen', c, a, opts.scale || 1.6);
    defs += folds(id + 'fa', opts.folds || 6, opts.k || 0.2, opts.angle == null ? 28 : opts.angle, r);
    defs += folds(id + 'fb', Math.max(3, Math.round((opts.folds || 6) / 2)), (opts.k || 0.2) * 0.22, (opts.angle == null ? 28 : opts.angle) - 25, r);
    defs += `<radialGradient id="${id}vg" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${opts.vignette == null ? 0.32 : opts.vignette}"/></radialGradient>`;
    const body = `<rect width="${W}" height="${H}" fill="url(#${id}p)"/><rect width="${W}" height="${H}" fill="url(#${id}fa)"/><rect width="${W}" height="${H}" fill="url(#${id}fb)"/><rect width="${W}" height="${H}" fill="url(#${id}vg)"/>`;
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;
  }

  /* ───────────── product entry point ───────────── */
  const SHAPES = {
    stack, towel, curtain, robe, apron, tray, basket, holder, hanger, candle, bowl,
    drape: (ctx) => drape(ctx, 236, 118),
    scarf: (ctx) => drape(ctx, 112, 96),
    cushion: (ctx) => cushion(ctx, false),
    lumbar: (ctx) => cushion(ctx, true),
    bottle: (ctx) => bottle(ctx, false),
    diffuser: (ctx) => bottle(ctx, true),
    vase: (ctx) => vase(ctx, false),
    budvase: (ctx) => vase(ctx, true)
  };

  /** view: 'main' | 'alt' | 'detail' | 'mood' */
  function product(p, view) {
    view = view || 'main';
    const c = p.base;
    const a = p.accent || shade(c, p.accentShade != null ? p.accentShade : -0.25);
    if (p.textile && (view === 'alt' || view === 'detail')) {
      return fabric({ c, a, kind: p.kind, scale: view === 'detail' ? 4.2 : 1.7, folds: view === 'detail' ? 3 : 6, k: p.opts.sheen ? 0.34 : 0.2, seed: p.id * 13 + (view === 'detail' ? 5 : 0) });
    }
    const id = 'a' + (++uid);
    const ctx = { id, c, a, o: p.opts, P: `url(#${id}p)`, r: rnd(p.id * 31 + 7), defs: '' };
    if (p.kind && p.kind !== 'none') ctx.defs += pattern(id + 'p', p.kind, c, a, p.shape === 'basket' ? 1.2 : 1);
    const dark = !p.textile && (view === 'alt' || view === 'mood');
    if (p.textile && view === 'mood') ctx.tone = lum(c) > 0.6 ? '#b9ad9c' : '#cfc4b3';
    const bg = backdrop(ctx, dark);
    let shape = (SHAPES[p.shape] || stack)(ctx);
    if (!p.textile && (view === 'detail' || view === 'mood')) shape = `<g transform="translate(200 250) scale(1.75) translate(-200 -285)">${shape}</g>`;
    return `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${p.name}, ${p.colour}"><defs>${ctx.defs}</defs>${bg}${shape}</svg>`;
  }

  /* ───────────── photography with SVG fallback ─────────────
     Product photos come from the admin (p.images): Unsplash links are resized on the fly,
     uploaded photos (/uploads/…) are used as they are. Site photos (js/photos.js) are Unsplash ids. */
  const UNS = 'https://images.unsplash.com/photo-';
  const url = (src, w) => {
    src = String(src || '');
    if (!/^(https?:\/\/|\/)/.test(src)) src = UNS + src;            // bare Unsplash id
    if (src.indexOf(UNS) !== 0) return src;
    return src.split('?')[0] + '?auto=format&fit=crop&w=' + w + '&q=' + (w > 1200 ? 70 : 75);
  };
  const attr = (s) => String(s || '').replace(/["<>&]/g, '');

  /** <img> for a photo (Unsplash id/link or uploaded file). Fades in on load (.ph → .ph.ok). */
  function photo(src, w, alt, extra) {
    w = w || 800;
    const one = url(src, w), two = url(src, Math.min(w * 2, 2400));
    const set = two !== one ? ` srcset="${attr(one)} 1x, ${attr(two)} 2x"` : '';
    return `<img class="ph" src="${attr(one)}"${set} alt="${attr(alt)}" loading="lazy" decoding="async" onload="this.classList.add('ok')" ${extra || 'onerror="this.remove()"'}>`;
  }

  // Gallery views main / alt / detail / mood = product photos 1–4
  const VIEWS = { main: 0, alt: 1, detail: 2, mood: 3 };
  function photoId(p, view) {
    const imgs = p.images || [];
    return imgs[VIEWS[view || 'main'] || 0] || null;
  }

  /** Product image: real photo when there is one, otherwise the drawn SVG. */
  function productImage(p, view, w) {
    const id = photoId(p, view);
    if (!id) return product(p, view);
    return photo(id, w || 700, `${p.name}, ${p.colour}`, `data-pid="${p.id}" data-view="${view || 'main'}" onerror="Art.fail(this)"`);
  }

  function fail(img) {
    const p = window.WIENA && WIENA.get(img.dataset.pid);
    if (p) img.outerHTML = product(p, img.dataset.view);
  }

  return { product: productImage, svgProduct: product, photo, photoId, fail, fabric, shade, lum };
})();
