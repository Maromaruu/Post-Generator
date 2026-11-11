// Post templates — canvas renderers rebuilt 1:1 from the Figma section
// "Website content · Square · Set 2" (file Je7RFQscEKud8DLm93jxUW, node 2901:316).
// Every number below is in canvas pixels and comes from the Figma frames. Only the data changes.
(function () {
  const W = 1080, H = 1080, H_PORTRAIT = 1350;
  const C = {
    darkBg: '#212225', strong: '#f5f5f7', onDark: '#c5c6d1', cardDark: '#25262b', lineDark: '#343543',
    lightBg: '#c5c6d1', heading: '#16191a', primary: '#212225', lineLight: '#babbc9',
    cardAlt: '#e2e3eb', card: '#d1d2de',
    neutral: '#e3dfe6', aiSoc: '#8da4ef', europe: '#d5ae39', securing: '#5bb98b', euBadge: '#0e39a8'
  };
  const THEME = {
    dark: { key: 'dark', bg: C.darkBg, title: C.strong, text: C.onDark, line: C.lineDark, logoScale: 1 },
    light: { key: 'light', bg: C.lightBg, title: C.heading, text: C.primary, line: C.lineLight, logoScale: 0.84 }
  };
  const X = 80, CW = 920, RIGHT = 1000;
  const DASH = [2, 2]; // measured on the Figma renders
  const FONT = 'Geist, -apple-system, "Helvetica Neue", sans-serif';

  // "cyber futurists" wordmark: 14 glyph SVGs, offsets from the Figma "Brand logo" frame (on-dark size;
  // the on-light variant is the same artwork at 0.84).
  const BRAND = [
    [0, 11.9, 19.903, 23.809], [24.18, 11.9, 22.396, 38.095], [50.86, 0, 19.903, 35.714],
    [75.53, 11.9, 19.903, 23.809], [99.71, 11.9, 15.904, 23.809], [132.3, 0, 17.039, 35.714],
    [154.12, 11.9, 19.959, 23.809], [178.35, 2.38, 17.057, 33.333], [199.69, 11.9, 19.959, 23.809],
    [223.92, 11.9, 15.904, 23.809], [244.6, 2.38, 3.571, 33.333], [253.88, 11.9, 18.192, 23.809],
    [276.35, 2.38, 17.057, 33.333], [297.69, 11.9, 18.192, 23.809]
  ];
  // The wordmark starts on the content edge and is centred on y = 94.67 in the square frames
  // (the on-dark version is 50 high, the on-light one 42).
  const BRAND_X = 80;
  const brandY = (theme) => (theme.key === 'dark' ? 69.67 : 73.67);
  const BRAND_W = 315.88;
  const brandSrc = (theme, i) => `assets/brand/${theme.key}-${String(i).padStart(2, '0')}.svg`;
  const EU_BADGE = 'assets/eu-badge.svg';
  // Top 1 mover artwork: three background hairlines and the rocket illustration (16 Figma SVGs).
  // Each rocket part: [file index, inset top, right, bottom, left (% of the 734 x 781.342 frame),
  // then how far the SVG bleeds past that box: top/bottom %, left/right % of the part's own size].
  const TOP1 = {
    hair: [1, 2, 3].map((n) => `assets/top1/hairline-${n}.svg`),
    part: (i) => `assets/top1/rocket-${String(i).padStart(2, '0')}.svg`,
    box: { x: 371, y: 105, w: 734, h: 781.342 },
    parts: [
      [0, 67.5, 12.91, 20.71, 74.13, 0.54, 0.53],
      [1, 55.19, 46.12, 11.08, 21.05, 0, 0],
      [2, 61.89, 53.93, 26.39, 36.47, 0.55, 0.71],
      [3, 37.7, 71.82, 56.86, 23.1, 1.18, 1.34],
      [4, 38.5, 47.86, 46.74, 29.26, 0.43, 0.3],
      [5, 50.15, 31.12, 25.74, 55.77, 0.27, 0.52],
      [6, 53.56, 45.1, 33.56, 38.91, 0.5, 0.43],
      [7, 14.25, 13.84, 36.17, 41.62, 0, 0],
      'detail', // part 8, masked by part 9
      [10, 13.51, 13.33, 36.32, 41.02, 0.13, 0.15],
      [11, 13.52, 13.34, 73.76, 72.59, 0, 0],
      [12, 28.75, 27.22, 59.72, 60.47, 0.56, 0.55],
      [13, 46.65, 38.79, 40.6, 44.56, 0.5, 0.41],
      [14, 51.28, 82.58, 40.99, 9.02, 0.83, 0.81],
      [15, 31.19, 29.78, 61.91, 62.86, 0.93, 0.925]
    ],
    detail: { inset: [16.58, 7.41, 26.24, 49.38], maskAt: [-61.4, -35.078], maskSize: [335.911, 403.122] }
  };
  const STATIC_ASSETS = [EU_BADGE, ...TOP1.hair];
  for (let i = 0; i < 16; i++) STATIC_ASSETS.push(TOP1.part(i));
  for (let i = 0; i < 14; i++) STATIC_ASSETS.push(brandSrc(THEME.dark, i), brandSrc(THEME.light, i));

  // ---------- drawing helpers ----------
  let warn = [];
  let getImg = () => null;

  function setFont(ctx, size, weight) { ctx.font = `${weight || 400} ${size}px ${FONT}`; }
  function width(ctx, str, size, weight, ls) {
    setFont(ctx, size, weight);
    ctx.letterSpacing = (ls || 0) + 'px';
    const w = ctx.measureText(str).width - (ls || 0) * (str ? 1 : 0);
    ctx.letterSpacing = '0px';
    return w;
  }
  function wrap(ctx, str, maxW) {
    const out = [];
    String(str).split(/\n/).forEach((para) => {
      const words = para.split(/\s+/).filter(Boolean);
      let line = '';
      words.forEach((word) => {
        const next = line ? line + ' ' + word : word;
        if (line && ctx.measureText(next).width > maxW) { out.push(line); line = word; }
        else line = next;
      });
      out.push(line);
    });
    return out;
  }
  function ellipsize(ctx, str, maxW) {
    if (ctx.measureText(str).width <= maxW) return str;
    let s = str;
    while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
    return s.replace(/[\s,.;:·–-]+$/, '') + '…';
  }
  // Draws text whose box starts at `top`, the way Figma and CSS place it: the font's own
  // ascent + descent is centred in the line height.
  //   o: size, weight, lh (px, or a multiplier when <= 3; default = the font's natural height),
  //      color, alpha, ls (px at the design size), align, maxW, maxLines (wraps when set),
  //      fit (shrink to `min` before cutting), min, label (for warnings)
  function text(ctx, str, x, top, o) {
    str = str == null ? '' : String(str);
    let size = o.size;
    const lsEm = (o.ls || 0) / o.size;
    const maxLines = o.maxLines || 1;
    const measure = (s) => {
      setFont(ctx, s, o.weight);
      ctx.letterSpacing = (lsEm * s) + 'px';
      return o.maxW && maxLines > 1 ? wrap(ctx, str, o.maxW) : [str];
    };
    let lines = measure(size);
    const fits = () => lines.length <= maxLines && (!o.maxW || lines.every((l) => ctx.measureText(l).width <= o.maxW + 0.5));
    if (o.maxW && o.fit) {
      const min = o.min || Math.round(o.size * 0.55);
      while (!fits() && size > min) { size -= 1; lines = measure(size); }
    }
    if (o.maxW && !fits()) {
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        lines[maxLines - 1] = ellipsize(ctx, lines[maxLines - 1] + ' …', o.maxW);
      }
      lines = lines.map((l) => ellipsize(ctx, l, o.maxW));
      if (o.label) warn.push(`${o.label} is too long and was cut.`);
    }
    const m = ctx.measureText('Hg');
    const A = m.fontBoundingBoxAscent, D = m.fontBoundingBoxDescent;
    const ratio = size / o.size;
    let lh = o.lh == null ? A + D : (o.lh <= 3 ? o.lh * size : o.lh * (o.scaleLh ? ratio : 1));
    ctx.fillStyle = o.color;
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = o.align || 'left';
    // Figma snaps baselines to whole pixels: rounded for auto-width text, rounded up in fixed-width
    // (wrapping) text boxes. Measured against the Figma renders.
    const snap = maxLines > 1 || o.box ? Math.ceil : Math.round;
    let maxWidth = 0;
    lines.forEach((line, i) => {
      const y = snap(top + i * lh + (lh - (A + D)) / 2 + A);
      ctx.fillText(line, x, y);
      maxWidth = Math.max(maxWidth, ctx.measureText(line).width - lsEm * size);
    });
    ctx.globalAlpha = 1;
    ctx.letterSpacing = '0px';
    ctx.textAlign = 'left';
    return { w: maxWidth, h: lines.length * lh, lines: lines.length, size };
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }
  function fillRR(ctx, x, y, w, h, r, color, alpha) {
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = color;
    rr(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // 2px dashed stroke, drawn inside the box like Figma's inside stroke
  function dashedRR(ctx, x, y, w, h, r, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash(DASH);
    rr(ctx, x + 1, y + 1, w - 2, h - 2, Math.max(0, r - 1));
    ctx.stroke();
    ctx.restore();
  }
  function dashedRule(ctx, x, y, w, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash(DASH);
    ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x + w, y + 1); ctx.stroke();
    ctx.restore();
  }
  function darkCard(ctx, x, y, w, h) {
    fillRR(ctx, x, y, w, h, 8, C.cardDark);
    dashedRR(ctx, x, y, w, h, 8, C.lineDark);
  }
  // CF/Shadow Soft: 0 12 32 -8 rgba(33,34,37,0.06)
  function softCard(ctx, x, y, w, h, color) {
    ctx.save();
    ctx.shadowColor = 'rgba(33,34,37,0.06)'; ctx.shadowBlur = 32; ctx.shadowOffsetY = 12;
    ctx.fillStyle = color;
    rr(ctx, x + 8, y + 8, w - 16, h - 16, 8);
    ctx.fill();
    ctx.restore();
    fillRR(ctx, x, y, w, h, 8, color);
  }
  function chip(ctx, x, y, label, bg, size) {
    size = size || 16;
    setFont(ctx, size, 400);
    const m = ctx.measureText('Hg');
    const th = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
    const w = ctx.measureText(label).width + 24;
    fillRR(ctx, x, y, w, th + 12, 6, bg);
    text(ctx, label, x + 12, y + 6, { size, color: C.primary });
    return { w, h: th + 12 };
  }
  function initials(name) {
    const parts = String(name || '').replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase();
  }
  // Standard logo tile: #e2e3eb, 6px radius, logo fitted inside 75% of the tile, never stretched.
  // Without a logo the tile shows the company's initials.
  function logoTile(ctx, x, y, s, vendor) {
    fillRR(ctx, x, y, s, s, 6, C.cardAlt);
    const image = vendor && vendor.logo ? getImg(vendor.logo) : null;
    const box = s * 0.75, bx = x + s * 0.125, by = y + s * 0.125;
    if (image && image.naturalWidth) {
      const k = Math.min(box / image.naturalWidth, box / image.naturalHeight);
      const w = image.naturalWidth * k, h = image.naturalHeight * k;
      ctx.save();
      rr(ctx, bx, by, box, box, 4); ctx.clip();
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, bx + (box - w) / 2, by + (box - h) / 2, w, h);
      ctx.restore();
    } else {
      const label = initials(vendor && vendor.name);
      if (label) {
        const size = Math.round(s * 0.36);
        setFont(ctx, size, 500);
        const m = ctx.measureText('Hg');
        text(ctx, label, x + s / 2, y + (s - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2,
          { size, weight: 500, color: C.primary, alpha: 0.7, align: 'center' });
      }
      if (vendor && vendor.name && !vendor.logo) warn.push(`No logo for ${vendor.name}: showing initials. Upload one in its row.`);
    }
  }

  // Film grain (Figma noise effects "CF/Grain / Fine" on dark, "CF/Grain / Paper Dark" on light).
  const grainCache = {};
  function grain(ctx, theme) {
    let g = grainCache[theme.key];
    if (!g) {
      g = document.createElement('canvas');
      g.width = W; g.height = H_PORTRAIT;
      const gx = g.getContext('2d');
      const data = gx.createImageData(W, H_PORTRAIT);
      let seed = theme.key === 'dark' ? 0x9e3779b9 : 0x7f4a7c15;
      const rnd = () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      // Measured on the Figma renders: about a third of the pixels are untouched, the rest are
      // lightened (dark frames) or darkened (light frames) by 1 + an exponential step, capped.
      const dark = theme.key === 'dark';
      const zero = dark ? 0.35 : 0.39, mean = dark ? 2.4 : 2.8, cap = dark ? 14 : 21, base = dark ? 221 : 198;
      for (let i = 0; i < data.data.length; i += 4) {
        const v = dark ? 255 : 0;
        data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
        if (rnd() < zero) { data.data[i + 3] = 0; continue; }
        const step = Math.min(cap, 1 - mean * Math.log(1 - rnd()));
        data.data[i + 3] = Math.round(255 * step / base);
      }
      gx.putImageData(data, 0, 0);
      grainCache[theme.key] = g;
    }
    ctx.drawImage(g, 0, 0);
  }

  function brand(ctx, theme, x, y) {
    BRAND.forEach((p, i) => {
      const image = getImg(brandSrc(theme, i));
      if (!image) return;
      const k = theme.logoScale;
      ctx.drawImage(image, x + p[0] * k, y + p[1] * k, p[2] * k, p[3] * k);
    });
  }
  function frame(ctx, d, theme) {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);
    brand(ctx, theme, BRAND_X, brandY(theme));
    const maxW = CW - BRAND_W * theme.logoScale - 24;
    text(ctx, d.context, RIGHT, 84, { size: 22, lh: 18, color: theme.text, alpha: 0.7, align: 'right', maxW, fit: true, min: 15, label: 'The header label' });
    text(ctx, d.footer, X, 976, { size: 17, lh: 20, color: theme.text, alpha: 0.7, maxW: CW, fit: true, min: 13, label: 'The footer' });
  }
  function title(ctx, d, theme, o) {
    return text(ctx, d.title, o.x || X, o.top || 168, {
      size: o.size, weight: 500, lh: 1.04, ls: -0.02 * o.size, color: theme.title,
      maxW: o.maxW || CW, maxLines: o.maxLines || 1, box: o.box, fit: true, min: 36, label: 'The title'
    });
  }
  const pct = (v) => Math.max(0, Math.min(100, parseFloat(String(v).replace(',', '.')) || 0)) / 100;

  // ---------- 1. Market in numbers (2901:317) ----------
  function renderNumbers(ctx, d) {
    const t = THEME.dark;
    frame(ctx, d, t);
    title(ctx, d, t, { size: 68 });
    text(ctx, d.subtitle, X, 259, { size: 22, lh: 1.35, color: t.text, alpha: 0.7, maxW: 820, fit: true, label: 'The subtitle' });
    d.stats.slice(0, 6).forEach((s, i) => {
      const x = X + (i % 3) * 312, y = 352 + Math.floor(i / 3) * 278;
      darkCard(ctx, x, y, 296, 262);
      text(ctx, s.value, x + 24, y + 24, { size: 96, weight: 500, lh: 1, ls: -2.88, color: C.strong, maxW: 252, fit: true, min: 44, label: `Number ${i + 1}` });
      text(ctx, s.label, x + 24, y + 210, { size: 22, lh: 28, color: t.text, alpha: 0.7, maxW: 248, fit: true, min: 15, label: `Label ${i + 1}` });
    });
  }

  // ---------- 2. Top 40 movers list, five rows (2901:386) ----------
  function renderTopList(ctx, d) {
    const t = THEME.light;
    frame(ctx, d, t);
    title(ctx, d, t, { size: 72 });
    text(ctx, d.subtitle, X, 263, { size: 24, lh: 28, color: t.text, alpha: 0.7, maxW: CW, fit: true, label: 'The subtitle' });
    const rows = d.rows.slice(0, 5);
    for (let i = 0; i <= 5; i++) dashedRule(ctx, X, 346 + i * 112, CW, t.line);
    rows.forEach((r, i) => {
      const y = 354 + i * 112;
      text(ctx, r.rank, X, y + 22, { size: 48, lh: 1, ls: -0.96, color: C.heading, maxW: 56, fit: true, min: 28 });
      text(ctx, r.delta, X + 62, y + 36, { size: 17, color: t.text, alpha: 0.7, maxW: 56, fit: true, min: 12 });
      logoTile(ctx, X + 124, y + 20, 56, r);
      text(ctx, r.name, X + 196, y + 16, { size: 28, lh: 1.1, ls: -0.28, color: C.heading, maxW: 570, fit: true, min: 18, label: `Company name ${i + 1}` });
      text(ctx, r.detail, X + 196, y + 56, { size: 17, lh: 20, color: t.text, alpha: 0.7, maxW: 570, fit: true, min: 13, label: `Detail ${i + 1}` });
      text(ctx, r.score, RIGHT, y + 14, { size: 48, lh: 1, ls: -0.96, color: C.heading, align: 'right', maxW: 130, fit: true, min: 28 });
      fillRR(ctx, X + 790, y + 74, 130, 8, 2, C.heading, 0.12);
      const bw = 130 * pct(r.score);
      if (bw > 0) fillRR(ctx, X + 790, y + 74, bw, 8, 2, C.heading, 0.6);
    });
    if (rows.length < 5) warn.push(`This template has 5 rows; only ${rows.length} filled.`);
  }

  // ---------- 3. European movers, three cards (2901:493) ----------
  function renderEurope(ctx, d) {
    const t = THEME.dark;
    frame(ctx, d, t);
    // Title row at (80, 209): the 68px EU badge and the title, 19px apart, centred on each other
    const to = { size: 54, weight: 500, lh: 1.04, ls: -1.08, color: t.title, maxW: 825, maxLines: 2, fit: true, min: 36 };
    const th = text(ctx, d.title, 0, -2000, to).h; // measuring pass, off canvas
    const rowH = Math.max(68, th);
    const badge = getImg(EU_BADGE);
    if (badge) ctx.drawImage(badge, X, 209 + (rowH - 68) / 2, 68, 68);
    text(ctx, d.title, X + 68 + 19, 209 + (rowH - th) / 2, Object.assign({ label: 'The title' }, to));
    const cards = d.cards.slice(0, 3);
    cards.forEach((c, i) => {
      const x = X + i * 312, y = 365;
      darkCard(ctx, x, y, 296, 548);
      const ix = x + 2, iy = y + 2; // children sit inside the 2px border
      logoTile(ctx, ix + 22, iy + 22, 72, c);
      text(ctx, c.name, ix + 22, iy + 114, { size: 28, lh: 28.8, ls: -0.28, color: C.strong, maxW: 252, fit: true, min: 17, label: `Company name ${i + 1}` });
      text(ctx, c.sub, ix + 22, iy + 156, { size: 17, lh: 20, color: t.text, alpha: 0.7, maxW: 252, fit: true, min: 12 });
      text(ctx, c.score, ix + 16, iy + 208, { size: 120, weight: 500, lh: 1, ls: -4.8, color: C.strong, maxW: 262, fit: true, min: 56, label: `Number ${i + 1}` });
      text(ctx, c.scoreLabel, ix + 22, iy + 338, { size: 17, lh: 20, color: t.text, alpha: 0.7, maxW: 252, fit: true, min: 12 });
      fillRR(ctx, ix + 22, iy + 370, 248, 8, 2, C.strong, 0.12);
      const bw = 248 * pct(c.score);
      if (bw > 0) fillRR(ctx, ix + 22, iy + 370, bw, 8, 2, C.euBadge);
      if (c.chip) chip(ctx, ix + 22, iy + 408, c.chip, C.europe, 16);
      text(ctx, c.detail, ix + 22, iy + 468, { size: 18, lh: 22.4, color: t.text, alpha: 0.7, maxW: 248, maxLines: 3, fit: true, min: 14, label: `Detail ${i + 1}` });
    });
    if (cards.length < 3) warn.push(`This template has 3 cards; only ${cards.length} filled.`);
  }

  // ---------- 4. One company featured above a top-five list (2901:592) ----------
  function renderIncumbent(ctx, d) {
    const t = THEME.light;
    frame(ctx, d, t);
    title(ctx, d, t, { size: 64, box: true });
    const f = d.feature, cx = X, cy = 283;
    fillRR(ctx, cx, cy, 920, 322, 8, C.darkBg);
    logoTile(ctx, cx + 32, cy + 32, 88, f);
    text(ctx, f.name, cx + 140, cy + 40, { size: 34, lh: 28.8, ls: -0.34, color: C.strong, maxW: 748, fit: true, min: 20, label: 'The featured company name' });
    if (f.chip) chip(ctx, cx + 140, cy + 90, f.chip, C.neutral, 16);
    const big = text(ctx, f.rank, cx + 28, cy + 140, { size: 150, weight: 500, lh: 1, ls: -6, color: C.strong, maxW: 420, fit: true, min: 70, label: 'The featured rank' });
    const tx = Math.max(330, 28 + big.w + 30);
    const tw = 920 - 28 - tx;
    text(ctx, f.line1, cx + tx, cy + 178, { size: 24, lh: 33.6, color: C.onDark, alpha: 0.7, maxW: tw, fit: true, min: 15 });
    text(ctx, f.line2, cx + tx, cy + 178 + 33.6, { size: 24, lh: 33.6, color: C.onDark, alpha: 0.7, maxW: tw, fit: true, min: 15, label: 'The featured detail' });
    const rows = d.rows.slice(0, 5);
    rows.forEach((r, i) => {
      const y = 639 + i * 58, a = r.highlight ? 1 : 0.7;
      text(ctx, r.rank, X, y + 14, { size: 26, lh: 28.8, ls: -0.26, color: C.heading, alpha: a, maxW: 34, fit: true, min: 15 });
      logoTile(ctx, X + 40, y + 8, 44, r);
      text(ctx, r.name, X + 100, y + 16, { size: 22, lh: 28, color: C.heading, alpha: a, maxW: 284, fit: true, min: 14, label: `Company name ${i + 1}` });
      fillRR(ctx, X + 400, y + 26, 420, 10, 2, C.heading, 0.1);
      const bw = 420 * pct(r.score);
      if (bw > 0) fillRR(ctx, X + 400, y + 26, bw, 10, 2, r.highlight ? C.aiSoc : C.heading, r.highlight ? 1 : 0.35);
      text(ctx, r.score, RIGHT, y + 16, { size: 22, lh: 28, color: C.heading, alpha: a, align: 'right', maxW: 80, fit: true, min: 14 });
    });
    if (rows.length < 5) warn.push(`This template has 5 rows; only ${rows.length} filled.`);
  }

  // ---------- 5. Market Maturity Map, four stages (2902:330) ----------
  const STAGE_BOX = [
    { x: 80, y: 714, h: 204 }, { x: 314, y: 644, h: 274 }, { x: 548, y: 574, h: 344 }, { x: 782, y: 504, h: 414 }
  ];
  const STAGE_CAP = [3, 6, 9, 12]; // logos that fit each stage (three per row)
  function renderMaturity(ctx, d) {
    const t = THEME.dark;
    frame(ctx, d, t);
    title(ctx, d, t, { size: 72 });
    text(ctx, d.subtitle, X, 263, { size: 24, lh: 28, color: t.text, alpha: 0.7, maxW: CW, fit: true, label: 'The subtitle' });
    let hx = X;
    const colors = [C.aiSoc, C.europe, C.securing];
    d.highlights.slice(0, 3).forEach((h, i) => {
      if (!h.value && !h.label) return;
      const nw = width(ctx, h.value, 24, 400, -0.24), lw = width(ctx, h.label, 18, 400, 0);
      const w = 14 + nw + 8 + lw + 14;
      fillRR(ctx, hx, 344, w, 44.8, 6, colors[i]);
      text(ctx, h.value, hx + 14, 352, { size: 24, lh: 28.8, ls: -0.24, color: C.primary });
      setFont(ctx, 18, 400);
      const m = ctx.measureText('Hg');
      text(ctx, h.label, hx + 14 + nw + 8, 344 + (44.8 - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2, { size: 18, color: C.primary });
      hx += w + 12;
    });
    if (hx - 12 > RIGHT) warn.push('The highlight chips are wider than the layout.');
    d.stages.slice(0, 4).forEach((s, i) => {
      const b = STAGE_BOX[i], last = i === 3, pad = 20; // 18 + the 2px border on the dashed cards
      if (last) fillRR(ctx, b.x, b.y, 218, b.h, 8, C.card);
      else darkCard(ctx, b.x, b.y, 218, b.h);
      text(ctx, s.label, b.x + pad, b.y + pad + 24, { size: 28, lh: 28.8, ls: -0.28, color: last ? C.heading : C.strong, maxW: 218 - pad * 2, fit: true, min: 17, label: `Stage ${i + 1}` });
      const list = s.vendors.filter((v) => v.name || v.logo);
      list.slice(0, STAGE_CAP[i]).forEach((v, k) => {
        logoTile(ctx, b.x + pad + (k % 3) * 58, b.y + pad + 80 + Math.floor(k / 3) * 58, 48, v);
      });
      if (list.length > STAGE_CAP[i]) warn.push(`${s.label} fits ${STAGE_CAP[i]} logos; ${list.length - STAGE_CAP[i]} left out.`);
    });
  }

  // ---------- 6. Analyst radar, two report cards (2902:432) ----------
  function renderRadar(ctx, d) {
    const t = THEME.light;
    frame(ctx, d, t);
    title(ctx, d, t, { size: 72 });
    text(ctx, d.subtitle, X, 263, { size: 22, lh: 1.35, color: t.text, alpha: 0.7, maxW: 820, fit: true, label: 'The subtitle' });
    const cards = d.cards.slice(0, 2);
    cards.forEach((c, i) => {
      const x = X, y = 343 + i * 300;
      softCard(ctx, x, y, 920, 280, i === 0 ? C.cardAlt : C.card);
      if (c.chip) chip(ctx, x + 28, y + 28, c.chip, C.neutral, 16);
      text(ctx, c.title, x + 28, y + 82, { size: 30, lh: 1.15, ls: -0.3, color: C.heading, maxW: 864, maxLines: 3, fit: true, min: 22, label: `Report title ${i + 1}` });
      text(ctx, c.label, x + 28, y + 190, { size: 16, lh: 20, color: t.text, alpha: 0.7, maxW: 864, fit: true });
      let vx = x + 28;
      const list = c.vendors.filter((v) => v.name);
      let left = 0;
      list.forEach((v) => {
        const tw = width(ctx, v.name, 19, 400, 0);
        if (vx + 60 + tw > x + 920 - 28 && vx > x + 28) { left++; return; }
        logoTile(ctx, vx, y + 214, 48, { name: v.name.split(' · ')[0], logo: v.logo });
        text(ctx, v.name, vx + 60, y + 226, { size: 19, lh: 22.4, color: C.heading, maxW: x + 920 - 28 - vx - 60, fit: true, min: 14 });
        vx += 60 + tw + 32;
      });
      if (left) warn.push(`Report ${i + 1}: ${left} vendor${left > 1 ? 's' : ''} did not fit on the row.`);
    });
    if (cards.length < 2) warn.push(`This template has 2 cards; only ${cards.length} filled.`);
  }

  // ---------- 7. Practitioner pulse, three statements (2902:502) ----------
  function renderPulse(ctx, d) {
    const t = THEME.dark;
    frame(ctx, d, t);
    title(ctx, d, t, { size: 64, maxLines: 2 });
    for (let i = 0; i <= 3; i++) dashedRule(ctx, X, 352 + i * 170, CW, t.line);
    const items = d.items.slice(0, 3);
    items.forEach((it, i) => {
      const y = 352 + i * 170;
      text(ctx, String(i + 1).padStart(2, '0'), X, y + 30, { size: 18, lh: 20, color: t.text, alpha: 0.7 });
      text(ctx, it.text, X + 80, y + 24, { size: 34, lh: 1.2, ls: -0.34, color: C.strong, maxW: 840, maxLines: 3, fit: true, min: 24, label: `Statement ${i + 1}` });
    });
    if (d.chip) chip(ctx, X, 892, d.chip, C.neutral, 16);
    if (items.length < 3) warn.push(`This template has 3 statements; only ${items.length} filled.`);
  }

  // ---------- 8. Vendor debates, two quote cards (2902:564) ----------
  function renderDebates(ctx, d) {
    const t = THEME.light;
    frame(ctx, d, t);
    title(ctx, d, t, { size: 68, maxLines: 2 });
    const cards = d.cards.slice(0, 2);
    cards.forEach((c, i) => {
      const x = X + i * 468, y = 361;
      softCard(ctx, x, y, 452, 560, i === 0 ? C.cardAlt : C.card);
      if (c.chip) chip(ctx, x + 28, y + 28, c.chip, i === 0 ? C.aiSoc : C.europe, 18);
      logoTile(ctx, x + 28, y + 90, 64, c);
      text(ctx, c.name, x + 108, y + 106, { size: 28, lh: 28.8, ls: -0.28, color: C.heading, maxW: 316, fit: true, min: 17, label: `Company name ${i + 1}` });
      text(ctx, c.quote, x + 28, y + 190, { size: 32, lh: 1.2, ls: -0.32, color: C.heading, maxW: 396, maxLines: 7, fit: true, min: 22, label: `Quote ${i + 1}` });
      text(ctx, c.source, x + 28, y + 512, { size: 16, lh: 20, color: t.text, alpha: 0.7, maxW: 396, fit: true, min: 12 });
    });
    if (cards.length < 2) warn.push(`This template has 2 cards; only ${cards.length} filled.`);
  }


  // ---------- 9. Single post for one of the top five movers (2869:1573, and 1762 / 1868 / 1974 / 2080) ----------
  function drawRocket(ctx) {
    const B = TOP1.box;
    const place = (t, r, b, l) => ({ x: B.x + B.w * l / 100, y: B.y + B.h * t / 100, w: B.w * (100 - l - r) / 100, h: B.h * (100 - t - b) / 100 });
    ctx.save();
    ctx.beginPath(); ctx.rect(B.x, B.y, B.w, B.h); ctx.clip();
    TOP1.parts.forEach((p) => {
      if (p === 'detail') {
        const image = getImg(TOP1.part(8)), mask = getImg(TOP1.part(9));
        if (!image || !mask) return;
        const d = TOP1.detail, r = place(...d.inset), k = 2;
        const off = document.createElement('canvas');
        off.width = Math.ceil(r.w * k); off.height = Math.ceil(r.h * k);
        const o = off.getContext('2d');
        o.scale(k, k);
        o.drawImage(image, 0, 0, r.w, r.h);
        o.globalCompositeOperation = 'destination-in';
        o.drawImage(mask, d.maskAt[0], d.maskAt[1], d.maskSize[0], d.maskSize[1]);
        ctx.drawImage(off, r.x, r.y, off.width / k, off.height / k);
        return;
      }
      const image = getImg(TOP1.part(p[0]));
      if (!image) return;
      const r = place(p[1], p[2], p[3], p[4]);
      const by = r.h * p[5] / 100, bx = r.w * p[6] / 100;
      ctx.drawImage(image, r.x - bx, r.y - by, r.w + 2 * bx, r.h + 2 * by);
    });
    ctx.restore();
  }
  function renderTop1(ctx, d) {
    const t = THEME.light;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, W, H);
    [[-420, 180, 1500, 900], [300, -520, 1300, 1300], [-200, 620, 1700, 700]].forEach((b, i) => {
      const image = getImg(TOP1.hair[i]);
      if (image) ctx.drawImage(image, b[0], b[1], b[2], b[3]);
    });
    brand(ctx, t, 88, 70);
    text(ctx, d.context, 992, 82, { size: 26, lh: 18, color: C.heading, align: 'right', maxW: 917 - BRAND_W * 0.84 - 24, fit: true, min: 16, label: 'The header label' });
    drawRocket(ctx);

    // the card: 620 x 420, rotated 7 degrees around its centre
    ctx.save();
    ctx.translate(178.81 + 666.564 / 2, 200 + 492.428 / 2);
    ctx.rotate(7 * Math.PI / 180);
    ctx.translate(-310, -210);
    ctx.save(); // CF/Shadow Strong: 0 24 48 -12 rgba(33,34,37,0.25), turned with the card
    ctx.shadowColor = 'rgba(33,34,37,0.25)'; ctx.shadowBlur = 48;
    ctx.shadowOffsetX = -24 * Math.sin(7 * Math.PI / 180); ctx.shadowOffsetY = 24 * Math.cos(7 * Math.PI / 180);
    ctx.fillStyle = C.darkBg;
    rr(ctx, 18 + 12, 34 + 12, 620 - 24, 420 - 24, 8); ctx.fill();
    ctx.restore();
    fillRR(ctx, 18, 34, 620, 420, 8, C.darkBg);
    // CF/Gradient/Pink Deep: linear-gradient(145.89deg, #de63a8, #d84898)
    const ang = 145.88552705465875 * Math.PI / 180, dx = Math.sin(ang), dy = -Math.cos(ang);
    const len = Math.abs(620 * dx) + Math.abs(420 * dy);
    const grad = ctx.createLinearGradient(310 - dx * len / 2, 210 - dy * len / 2, 310 + dx * len / 2, 210 + dy * len / 2);
    grad.addColorStop(0, 'rgb(222,99,168)'); grad.addColorStop(1, 'rgb(216,72,152)');
    ctx.save();
    rr(ctx, 0, 0, 620, 420, 8); ctx.clip();
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 620, 420);
    const mark = 'rgba(52,53,67,0.5)';
    dashedRR(ctx, 24, 24, 572, 372, 6, mark);
    ctx.fillStyle = mark;
    [[16, 23], [588, 23], [16, 395], [588, 395]].forEach((p) => ctx.fillRect(p[0], p[1], 16, 2));
    [[23, 16], [595, 16], [23, 388], [595, 388]].forEach((p) => ctx.fillRect(p[0], p[1], 2, 16));
    text(ctx, d.score, 42.59, 208.82, { size: 220, weight: 700, lh: 76, ls: -4.4, color: C.primary, maxW: 330, fit: true, min: 110, label: 'The number' });
    logoTile(ctx, 56, 48, 56, d);
    // change chip: an arrow (the design turns a "→") and the number of places
    const move = String(d.delta || '').trim().match(/^([↑↓])?\s*(.*)$/);
    if (move && (move[1] || move[2])) {
      const label = move[2], aw = move[1] ? 18.749 : 0;
      const cw = 28 + aw + width(ctx, label, 20, 400, 0);
      fillRR(ctx, 118.55, 47.91, cw, 56, 6, '#e1e1e5');
      setFont(ctx, 20, 400);
      const m = ctx.measureText('Hg'), th = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
      if (move[1]) {
        ctx.save();
        ctx.translate(118.55 + 14 + aw / 2, 47.91 + 28);
        ctx.rotate(move[1] === '↑' ? -Math.PI / 2 : Math.PI / 2);
        ctx.fillStyle = C.primary; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('→', 0, 0);
        ctx.restore();
      }
      text(ctx, label, 118.55 + 14 + aw, 47.91 + (56 - th) / 2, { size: 20, color: C.primary });
    }
    // momentum of the top five
    const bars = String(d.chart || '').split(/[,;\s]+/).filter(Boolean).slice(0, 5);
    bars.forEach((v, i) => {
      const x = 388 + i * 36, h = 110 * pct(v);
      fillRR(ctx, x, 110, 20, 110, 2, '#050809', 0.1);
      const on = i === (parseInt(d.rank, 10) || 1) - 1; // the featured company's own bar is solid
      if (h > 0) fillRR(ctx, x, 110 + 110 - h, 20, h, 2, on ? C.darkBg : '#050809', on ? 1 : 0.35);
    });
    text(ctx, d.chartLabel, 388, 230, { size: 14, color: '#050809', alpha: 0.7, maxW: 200, fit: true, min: 10 });
    ctx.restore();
    ctx.restore();

    text(ctx, d.name, 88, 782, { size: 76, weight: 500, lh: 1.04, ls: -1.52, color: C.heading, maxW: 904, fit: true, min: 40, box: true, label: 'The company name' });
    text(ctx, d.tagline, 88, 782 + 79.04, { size: 76, lh: 1.04, ls: -1.52, color: C.heading, maxW: 904, fit: true, min: 40, box: true, label: 'The second title line' });
    text(ctx, d.footer, 88, 996, { size: 20, lh: 52, color: C.heading, maxW: 904, fit: true, min: 14, label: 'The footer' });
  }

  // ---------- 10. Top 4 movers, 2 x 2 grid, portrait 1080 x 1350 (2869:4152) ----------
  function renderTop4(ctx, d) {
    const t = THEME.light;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, W, H_PORTRAIT);
    brand(ctx, t, 88, 89.5);
    text(ctx, d.context, 992, 102, { size: 26, lh: 18, color: C.primary, align: 'right', maxW: 904 - BRAND_W * 0.84 - 24, fit: true, min: 16, label: 'The header label' });
    text(ctx, d.title, 88, 220, { size: 84, weight: 500, lh: 1.04, ls: -1.68, color: C.heading, maxW: 904, maxLines: 2, fit: true, min: 44, label: 'The title' });
    const gx = 88, gy = 460;
    ctx.save();
    rr(ctx, gx, gy, 904, 802, 8); ctx.clip();
    const tiles = d.tiles.slice(0, 4);
    for (let i = 0; i < 4; i++) {
      const x = gx + (i % 2) * 452, y = gy + Math.floor(i / 2) * 401;
      ctx.fillStyle = i === 0 || i === 3 ? C.cardAlt : C.card;
      ctx.fillRect(x, y, 452, 401);
    }
    ctx.strokeStyle = C.lineLight; ctx.lineWidth = 2; ctx.setLineDash(DASH);
    ctx.beginPath(); ctx.moveTo(gx + 451, gy); ctx.lineTo(gx + 451, gy + 802); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx, gy + 402); ctx.lineTo(gx + 904, gy + 402); ctx.stroke();
    ctx.setLineDash([]);
    tiles.forEach((v, i) => {
      const x = gx + (i % 2) * 452, y = gy + Math.floor(i / 2) * 401;
      logoTile(ctx, x + 40, y + 24, 56, v);
      text(ctx, `#${v.rank} · Momentum ${v.score}`, x + 412, y + 43, { size: 24, lh: 18, color: C.primary, align: 'right', maxW: 300, fit: true, min: 15 });
      const n = text(ctx, v.score, x + 40, y + 130, { size: 64, lh: 50.4, ls: -1.28, color: C.heading, maxW: 250, fit: true, min: 36, label: `Number ${i + 1}` });
      text(ctx, '/100', x + 40 + n.w + 10, y + 147, { size: 18, color: C.primary, alpha: 0.7 });
      fillRR(ctx, x + 40, y + 193, 372, 10, 2, C.heading, 0.1);
      const bw = 372 * pct(v.score);
      if (bw > 0) fillRR(ctx, x + 40, y + 193, bw, 10, 2, C.aiSoc);
      text(ctx, v.name, x + 40, y + 317, { size: 40, lh: 1.1, ls: -0.4, color: C.heading, maxW: 372, fit: true, min: 22, box: true, label: `Company name ${i + 1}` });
    });
    ctx.restore();
    if (tiles.length < 4) warn.push(`This template has 4 tiles; only ${tiles.length} filled.`);
  }

  // ---------- sample data: the copy in the Figma frames ----------
  const L = (slug) => `assets/logos/${slug}.png`;
  const SAMPLE = {
    top1: {
      context: 'Agentic SOC Top 40 Movers', rank: '1', name: 'Artemis Security', logo: L('artemis-security'), tagline: 'Tops the List',
      score: '92', delta: '↑ 1', chart: '92, 90, 81, 80, 79', chartLabel: 'Momentum, top 5 (0–100)',
      footer: 'Source: aisocnews.com · Start-ups, 2–8 Nov 2026'
    },
    top4: {
      context: 'Week of 2–8 Nov 2026', title: 'Agentic SOC Top 4 Movers',
      tiles: [
        { rank: '1', name: 'Artemis Security', logo: L('artemis-security'), score: '92' },
        { rank: '2', name: 'Exaforce', logo: L('exaforce'), score: '90' },
        { rank: '3', name: 'Detections AI', logo: L('detections-ai'), score: '81' },
        { rank: '4', name: '7AI', logo: L('7ai'), score: '80' }
      ]
    },
    numbers: {
      context: '12 Oct–11 Nov 2026', title: '30 Days in the AI SOC Market', subtitle: '123 vendors tracked.',
      stats: [
        { value: '584', label: 'articles' }, { value: '257', label: 'thought leadership' },
        { value: '164', label: 'practitioner posts' }, { value: '68', label: 'product launches' },
        { value: '30', label: 'market moves' }, { value: '18', label: 'case studies' }
      ],
      footer: 'Source: aisocnews.com'
    },
    toplist: {
      context: 'Agentic SOC Top 40 Movers · 2–8 Nov', title: 'Next Five to Watch', subtitle: 'Ranks 6–10',
      rows: [
        { rank: '6', delta: '↓ 3', name: 'Daylight Security', logo: L('daylight-security'), detail: 'Headcount +10%, 18 open roles per 100 staff', score: '78' },
        { rank: '7', delta: '↑ 12', name: 'VigilBase', logo: L('vigilbase'), detail: '200 open roles per 100 staff, 4 launches and partnerships', score: '77' },
        { rank: '8', delta: '↑ 2', name: 'Prophet Security', logo: L('prophet-security'), detail: '17 earned mentions, 10 open roles per 100 staff', score: '77' },
        { rank: '9', delta: '↓ 3', name: 'Nebulock', logo: L('nebulock'), detail: '9 launches and partnerships, headcount +25%', score: '76' },
        { rank: '10', delta: '↓ 2', name: 'Method Security', logo: L('method-security'), detail: 'Headcount +19%, 26 open roles per 100 staff', score: '75' }
      ],
      footer: 'Source: aisocnews.com · Momentum 0–100'
    },
    europe: {
      context: 'European vendors · 2–8 Nov', title: 'Europe’s Top Agentic SOC Movers',
      cards: [
        { name: 'Qevlar', logo: L('qevlar'), sub: '#20 overall · ↑ 4', score: '68', scoreLabel: 'momentum', chip: 'Executing', detail: 'Headcount +11%, 24 open roles per 100 staff' },
        { name: 'Binalyze', logo: L('binalyze'), sub: '#27 overall · ↑ 3', score: '61', scoreLabel: 'momentum', chip: 'Scaling', detail: '8 launches and partnerships' },
        { name: 'Huntbase', logo: L('huntbase'), sub: '#37 overall · =', score: '57', scoreLabel: 'momentum', chip: 'Emerging', detail: '6 launches and partnerships, headcount +8%' }
      ],
      footer: 'Source: aisocnews.com · Start-ups'
    },
    incumbent: {
      context: 'Agentic SOC Top 40 · 2–8 Nov', title: 'One Incumbent in the Top 5',
      feature: { name: 'Google SecOps', logo: L('google-secops'), chip: 'Large incumbent', rank: '#3', line1: 'Momentum 86', line2: '11 launches and partnerships, 32 earned mentions' },
      rows: [
        { rank: '1', name: 'Artemis Security', logo: L('artemis-security'), score: '92', highlight: false },
        { rank: '2', name: 'Exaforce', logo: L('exaforce'), score: '90', highlight: false },
        { rank: '3', name: 'Google SecOps', logo: L('google-secops'), score: '86', highlight: true },
        { rank: '4', name: 'Detections AI', logo: L('detections-ai'), score: '81', highlight: false },
        { rank: '5', name: '7AI', logo: L('7ai'), score: '80', highlight: false }
      ],
      footer: 'Source: aisocnews.com · Start-ups and incumbents'
    },
    maturity: {
      context: 'Market Maturity Map · 11 Nov 2026', title: 'Where the Market Stands', subtitle: '103 of 104 vendors mapped.',
      highlights: [{ value: '36', label: 'innovating' }, { value: '13', label: 'hiring' }, { value: '29', label: 'raised in the last year' }],
      stages: [
        { label: 'Emerging', vendors: [{ name: 'VigilBase', logo: L('vigilbase') }, { name: 'Huntbase', logo: L('huntbase') }] },
        { label: 'Building', vendors: [{ name: 'Detections AI', logo: L('detections-ai') }, { name: 'Bricklayer AI', logo: L('bricklayer-ai') }] },
        { label: 'Scaling', vendors: [{ name: 'Nebulock', logo: L('nebulock') }, { name: 'Method Security', logo: L('method-security') }, { name: 'Binalyze', logo: L('binalyze') }] },
        { label: 'Executing', vendors: [{ name: 'Artemis Security', logo: L('artemis-security') }, { name: 'Exaforce', logo: L('exaforce') }, { name: '7AI', logo: L('7ai') }, { name: 'Daylight Security', logo: L('daylight-security') }, { name: 'Prophet Security', logo: L('prophet-security') }, { name: 'Qevlar', logo: L('qevlar') }] }
      ],
      footer: 'Source: aisocnews.com · Examples from this week’s rankings'
    },
    radar: {
      context: 'Research firms · Oct–Nov 2026', title: 'On the Analyst Radar', subtitle: 'Vendors named in analyst reports.',
      cards: [
        { chip: 'Gartner · 27 Oct', title: 'Magic Quadrant for Privileged Access Management, 2026', label: 'Cited by',
          vendors: [{ name: 'Palo Alto Networks · Leader', logo: L('palo-alto-networks') }, { name: 'Anvilogic', logo: L('anvilogic') }] },
        { chip: 'Gartner · 2 Nov', title: 'Emerging Tech: Agentic DFIR Must Be Governed and Defensible', label: 'Named',
          vendors: [{ name: 'Binalyze · Sample vendor', logo: L('binalyze') }] }
      ],
      footer: 'Source: aisocnews.com'
    },
    pulse: {
      context: 'Social · 9–10 Nov', title: 'What SOC Practitioners Say About Alert Triage',
      items: [
        { text: 'AI speeds defenders up rather than replacing them.' },
        { text: 'Automating triage frees analysts for the real incident.' },
        { text: 'Triage is the cheapest work to automate at machine speed.' }
      ],
      chip: 'Paraphrased from public posts',
      footer: 'Source: aisocnews.com · 164 practitioner posts in 30 days'
    },
    debates: {
      context: 'Thought leadership · 9 Nov 2026', title: 'What Vendors Are Arguing About',
      cards: [
        { chip: 'AI autonomy', name: 'Arctic Wolf', logo: L('arctic-wolf'), quote: '“AI now resolves the majority of security investigations in the Aurora Agentic SOC.”', source: 'Vendor claim · LinkedIn' },
        { chip: 'SIEM cost', name: 'Spectrum Security', logo: L('spectrum-security'), quote: '“Better SIEM coverage for less spend, without replacing anything.”', source: 'Vendor claim · LinkedIn' }
      ],
      footer: 'Source: aisocnews.com'
    }
  };

  const SAMPLE_TOP5 = [
    { rank: '1', name: 'Artemis Security', delta: '↑ 1', score: '92', siteLogo: '' },
    { rank: '2', name: 'Exaforce', delta: '↓ 1', score: '90', siteLogo: '' },
    { rank: '3', name: 'Detections AI', delta: '↑ 4', score: '81', siteLogo: '' },
    { rank: '4', name: '7AI', delta: '=', score: '80', siteLogo: '' },
    { rank: '5', name: 'Bricklayer AI', delta: '=', score: '79', siteLogo: '' }
  ];

  const TEMPLATES = [
    { key: 'top1', group: 'Movers', theme: 'light', label: 'Single post', file: 'top-1-mover', render: renderTop1 },
    { key: 'top4', group: 'Movers', theme: 'light', label: 'Top 4 grid', file: 'top-4-movers', h: H_PORTRAIT, render: renderTop4 },
    { key: 'numbers', group: 'Market', theme: 'dark', label: 'In numbers', file: 'market-in-numbers', render: renderNumbers },
    { key: 'toplist', group: 'Movers', theme: 'light', label: 'Ranked list', file: 'top-movers', render: renderTopList },
    { key: 'europe', group: 'Movers', theme: 'dark', label: 'Europe', file: 'european-movers', render: renderEurope },
    { key: 'incumbent', group: 'Movers', theme: 'light', label: 'Incumbents', file: 'incumbents', render: renderIncumbent },
    { key: 'maturity', group: 'Market', theme: 'dark', label: 'Maturity map', file: 'maturity-map', render: renderMaturity },
    { key: 'radar', group: 'Analysis', theme: 'light', label: 'Analyst radar', file: 'analyst-radar', render: renderRadar },
    { key: 'pulse', group: 'Voices', theme: 'dark', label: 'Practitioners', file: 'practitioner-pulse', render: renderPulse },
    { key: 'debates', group: 'Voices', theme: 'light', label: 'Vendor debates', file: 'vendor-debates', render: renderDebates }
  ];

  // Draws one post. `images(src)` returns a loaded image or null. Returns the layout warnings.
  function draw(ctx, key, data, images) {
    const tpl = TEMPLATES.find((t) => t.key === key);
    warn = [];
    getImg = images;
    ctx.save();
    ctx.clearRect(0, 0, W, tpl.h || H);
    tpl.render(ctx, data);
    grain(ctx, THEME[tpl.theme] || THEME.light);
    ctx.restore();
    return Array.from(new Set(warn));
  }

  // More templates live in their own files (js/templates-*.js) and join through register().
  // def: { key, group, theme: 'dark' | 'light', label, file, h (omit for 1080), render(ctx, data),
  //        sample, fields, assets: [static image paths to preload] }
  function register(def) {
    TEMPLATES.push(def);
    SAMPLE[def.key] = def.sample;
    (def.assets || []).forEach((src) => STATIC_ASSETS.push(src));
  }
  // The drawing kit those files use; see the helpers above for what each one does.
  const kit = {
    C, THEME, W, H, H_PORTRAIT, X, CW, RIGHT, BRAND_W, DASH, FONT,
    text, width, setFont, wrap, rr, fillRR, dashedRR, dashedRule, darkCard, softCard, chip, logoTile, brand, pct,
    img: (src) => getImg(src),
    warn: (message) => warn.push(message),
    logoPath: L
  };

  window.PostTemplates = {
    W, H, sizeOf: (key) => ({ w: W, h: (TEMPLATES.find((t) => t.key === key) || {}).h || H }),
    TEMPLATES, SAMPLE, SAMPLE_TOP5, STATIC_ASSETS, STAGE_CAP, draw, register, kit, logoPath: L
  };
})();
