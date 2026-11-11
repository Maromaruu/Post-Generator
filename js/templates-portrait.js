// Portrait templates, 1080 x 1350, rebuilt 1:1 from Figma (file Je7RFQscEKud8DLm93jxUW):
// "Hiring" (2895:295), "Most discussed" (2895:417), "Case study" (2895:530) and "Market moves" (2895:595).
// Every number is in canvas pixels and comes from the Figma frames. Only the data changes.
(function () {
  const P = window.PostTemplates, K = P.kit, C = K.C;
  const X = 88, CW = 904, RIGHT = 992;
  const BLUE = '#5eb1ef'; // --cf-market-exposure-management
  const A = (name) => `assets/portrait/${name}.svg`;
  const num = (v) => { const n = parseFloat(String(v == null ? '' : v).replace(/[^\d.,-]/g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
  const T = (key, label, opts) => Object.assign({ type: 'text', key, label }, opts);

  // Header (brand + right-hand label), title and footer shared by the four frames.
  function frame(ctx, d, t) {
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, K.W, K.H_PORTRAIT);
    K.brand(ctx, t, X, t.key === 'dark' ? 78.5 : 80.5); // on the content edge
    K.text(ctx, d.context, RIGHT - 1, 92, { size: 24, lh: 18, color: t.text, alpha: 0.7, align: 'right', box: true, maxW: CW - K.BRAND_W * t.logoScale - 24, fit: true, min: 15, label: 'The header label' });
    // Figma top 1238; its baseline sits 1px higher than the browser's rounding
    K.text(ctx, d.footer, X, 1237, { size: 18, lh: 20, color: t.text, alpha: 0.7, maxW: CW, fit: true, min: 13, label: 'The footer' });
  }
  function title(ctx, d, t, maxLines) {
    return K.text(ctx, d.title, X, 168, { size: 80, weight: 500, lh: 1.04, ls: -1.6, color: t.title, maxW: CW, maxLines, box: true, fit: true, min: 44, label: 'The title' });
  }
  // Legend: 14px key, 8px gap, 16px label, 24px between items.
  function legend(ctx, x, y, items, color) {
    items.forEach((it) => {
      it.key(x, y + 3);
      const w = K.text(ctx, it.label, x + 22, y, { size: 16, lh: 20, color, alpha: 0.7 }).w;
      x += 22 + Math.ceil(w + 0.1) + 24; // Figma's text boxes measure a touch wider than the browser's
    });
  }

  // ---------- 1. Hiring: top 5 vendors by open roles (2895:295) ----------
  // Stacked bars. Origin x = 388; the vendor with the most open roles spans 514px, so one role is
  // 514 / max(total) px. The track is the vendor's total; each function is a segment in descending
  // order, with a 2px gap after it. What is left of the track is "not itemised".
  const FUNCTIONS = [
    { key: 'engineering', label: 'Engineering', color: BLUE },
    { key: 'sales', label: 'Sales', color: C.europe },
    { key: 'marketing', label: 'Marketing', color: C.securing },
    { key: 'other', label: 'Other', color: C.neutral }
  ];
  const BAR_X = X + 300, BAR_W = 514;
  function renderHiring(ctx, d) {
    const t = K.THEME.dark;
    frame(ctx, d, t);
    title(ctx, d, t, 2);
    K.text(ctx, d.subtitle, X, 388, { size: 40, lh: 31, ls: -0.4, color: C.strong, alpha: 0.7, maxW: CW, fit: true, min: 24, label: 'The subtitle' });
    K.dashedRule(ctx, X, 476, CW, t.line);
    const big = K.text(ctx, d.stat, X, 498, { size: 72, lh: 1, ls: -1.44, color: C.strong, maxW: 360, fit: true, min: 40, label: 'The number' });
    const lx = X + Math.round(big.w) + 22;
    K.text(ctx, d.statLabel, lx, 522, { size: 26, lh: 28, color: t.text, alpha: 0.7, maxW: RIGHT - lx, box: true, fit: true, min: 16, label: 'The number label' });

    const rows = (d.rows || []).slice(0, 5).map((r) => {
      const parts = FUNCTIONS.map((f) => ({ f, n: Math.max(0, num(r[f.key])) })).filter((p) => p.n > 0).sort((a, b) => b.n - a.n);
      const sum = parts.reduce((s, p) => s + p.n, 0);
      const total = Math.max(num(r.total), sum);
      return { r, parts, total };
    });
    const unit = BAR_W / Math.max(1, ...rows.map((o) => o.total));
    rows.forEach((o, i) => {
      const r = o.r, y = 616 + i * 96;
      ctx.save();
      ctx.beginPath(); ctx.rect(X, y, CW, 80); ctx.clip();
      K.logoTile(ctx, X, y + 8, 48, r);
      K.text(ctx, r.name, X + 64, y + 10, { size: 26, lh: 28.8, ls: -0.26, color: C.strong, maxW: 228, box: true, fit: true, min: 16, label: `Company name ${i + 1}` });
      const detail = o.parts.slice(0, 3).map((p) => `${p.f.label.toLowerCase()} ${p.n}`).join(', ');
      K.text(ctx, detail, X + 64, y + 44, { size: 16, lh: 20, color: t.text, alpha: 0.7, maxW: 230, maxLines: 2 });
      if (o.total > 0) K.fillRR(ctx, BAR_X, y + 22, o.total * unit, 24, 4, C.onDark, 0.15);
      let at = 0;
      o.parts.forEach((p, k) => {
        const w = p.n * unit - 2;
        if (w > 0) K.fillRR(ctx, BAR_X + at * unit, y + 22, w, 24, k === 0 ? 4 : 0, p.f.color);
        at += p.n;
      });
      K.text(ctx, r.total || String(o.total || ''), RIGHT - 1, y + 12, { size: 40, lh: 1, ls: -0.8, color: C.strong, align: 'right', maxW: 82, fit: true, min: 22, label: `Open roles ${i + 1}` });
      ctx.restore();
    });
    const keys = FUNCTIONS.map((f) => ({ label: f.label, key: (x, y) => K.fillRR(ctx, x, y, 14, 14, 3, f.color) }));
    keys.push({ label: 'Not itemised', key: (x, y) => K.fillRR(ctx, x, y, 14, 14, 3, C.onDark, 0.15) });
    legend(ctx, BAR_X, 1100, keys, t.text);
    if (rows.length < 5) K.warn(`This template has 5 rows; only ${rows.length} filled.`);
  }

  // ---------- 2. Most discussed: earned mentions, this period vs the one before (2895:417) ----------
  // Dumbbell chart: 0 is at x = 388 and the axis end at x = 882. The axis runs 0–100 as in Figma
  // (4.94px per mention) and grows to the next round number when a value is above 100.
  // Each row has a 20px ring at the previous value, a 22px dot at the current value (blue when it
  // went up or stayed, pink when it went down) and a 4px line between the two centres.
  const AXIS_X = X + 300, AXIS_W = 494;
  const axisMax = (peak) => [100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000].find((m) => peak <= m) || Math.ceil(peak / 10000) * 10000;
  const PT = { before: A('point-before'), up: A('point-up'), down: A('point-down'), keyBefore: A('key-before'), keyUp: A('key-up'), keyDown: A('key-down') };
  function renderDiscussed(ctx, d) {
    const t = K.THEME.light;
    frame(ctx, d, t);
    title(ctx, d, t, 2);
    K.text(ctx, d.subtitle, X, 354, { size: 26, lh: 36, scaleLh: true, color: t.text, alpha: 0.7, maxW: 760, maxLines: 2, fit: true, min: 18, label: 'The subtitle' });
    const top = 497;
    const rows = (d.rows || []).slice(0, 5);
    const max = axisMax(Math.max(0, ...rows.map((r) => Math.max(num(r.previous), num(r.current)))));
    const AXIS_UNIT = AXIS_W / max;
    [0, max / 2, max].forEach((v) => {
      const gx = AXIS_X + Math.round(v * AXIS_UNIT);
      ctx.globalAlpha = 0.12; ctx.fillStyle = C.heading;
      ctx.fillRect(gx, top, 1, 560);
      ctx.globalAlpha = 1;
      K.text(ctx, String(v), gx - 6, top + 566, { size: 14, lh: 20, color: t.text, alpha: 0.7, box: true });
    });
    const image = (src, x, y, s) => { const im = K.img(src); if (im) ctx.drawImage(im, x, y, s, s); };
    let clipped = false;
    rows.forEach((r, i) => {
      const y = top + 24 + i * 108;
      const before = num(r.previous), now = num(r.current), diff = Math.round((now - before) * 10) / 10;
      if (before < 0 || now < 0) clipped = true;
      const at = (v) => AXIS_X + Math.max(0, Math.min(max, v)) * AXIS_UNIT;
      const xb = at(before), xn = at(now);
      K.logoTile(ctx, X, y + 4, 48, r);
      K.text(ctx, r.name, X + 64, y + 14, { size: 26, lh: 28.8, ls: -0.26, color: C.heading, maxW: 224, box: true, fit: true, min: 16, label: `Company name ${i + 1}` });
      if (xb !== xn) K.fillRR(ctx, Math.min(xb, xn), y + 26, Math.abs(xn - xb), 4, 2, C.heading, 0.35);
      image(PT.before, xb - 10, y + 18, 20);
      image(diff < 0 ? PT.down : PT.up, xn - 11, y + 17, 22);
      K.text(ctx, r.current, RIGHT - 1, y + 8, { size: 40, lh: 1, ls: -0.8, color: C.heading, align: 'right', maxW: 96, fit: true, min: 22, label: `Mentions ${i + 1}` });
      const label = diff > 0 ? `+${diff}` : diff < 0 ? `−${Math.abs(diff)}` : '0';
      K.text(ctx, label, RIGHT, y + 52, { size: 16, lh: 20, color: t.text, alpha: 0.7, align: 'right', maxW: 96, fit: true, min: 11 });
    });
    legend(ctx, AXIS_X, top + 600, [
      { label: 'Period before', key: (x, y) => image(PT.keyBefore, x, y, 14) },
      { label: 'This period, up', key: (x, y) => image(PT.keyUp, x, y, 14) },
      { label: 'This period, down', key: (x, y) => image(PT.keyDown, x, y, 14) }
    ], t.text);
    if (clipped) K.warn('The chart axis starts at 0; negative values sit at the edge.');
    if (rows.length < 5) K.warn(`This template has 5 rows; only ${rows.length} filled.`);
  }

  // ---------- 3. Case study: three-step outcome diagram (2895:530) ----------
  // Line heights are the frame's (1.06 and 1.4 em) as Figma lays them out: whole pixels.
  const ARROW = 'assets/portrait/arrow.png';
  function renderCaseStudy(ctx, d) {
    const t = K.THEME.light;
    frame(ctx, d, t);
    K.logoTile(ctx, X, 168, 96, d);
    K.text(ctx, d.title, X, 296, { size: 72, weight: 500, lh: 76, scaleLh: true, ls: -1.44, color: t.title, maxW: CW, maxLines: 3, fit: true, min: 40, label: 'The title' });
    const steps = (d.steps || []).slice(0, 3);
    steps.forEach((s, i) => {
      const x = X + i * 322, y = 638;
      K.fillRR(ctx, x, y, 260, 220, 8, C.darkBg);
      K.text(ctx, s.text, x + 24, y + 24, { size: 30, lh: 1.15, ls: -0.3, color: C.strong, maxW: 212, maxLines: 4, fit: true, min: 18, label: `Step ${i + 1}` });
      K.text(ctx, s.label, x + 24, y + 176, { size: 16, lh: 20, color: C.onDark, alpha: 0.7, maxW: 212, fit: true, min: 11, label: `Step label ${i + 1}` });
      if (i > 0) { // the "→" between two steps: Geist's own arrow, exported from Figma (the web font has none)
        const arrow = K.img(ARROW);
        if (arrow) ctx.drawImage(arrow, x - 48, y + 92, arrow.naturalWidth, arrow.naturalHeight);
      }
    });
    K.text(ctx, d.summary, X, 957, { size: 28, lh: 39, scaleLh: true, color: t.text, alpha: 0.7, maxW: 800, maxLines: 5, fit: true, min: 20, label: 'The summary' });
    if (steps.length < 3) K.warn(`This template has 3 steps; only ${steps.length} filled.`);
  }

  // ---------- 4. Market moves: weekly digest, three cards (2895:595) ----------
  // Chip colours in the frame: partnership blue, funding gold. Any other kind uses the neutral chip.
  const chipColor = (label) => (/fund|rais|invest|series|seed/i.test(label) ? C.europe : /partner|alliance|integrat/i.test(label) ? BLUE : C.neutral);
  function renderMoves(ctx, d) {
    const t = K.THEME.light;
    frame(ctx, d, t);
    title(ctx, d, t, 1);
    const items = (d.items || []).slice(0, 3);
    items.forEach((m, i) => {
      const x = X, y = 331 + i * 270;
      K.softCard(ctx, x, y, CW, 246, i % 2 ? C.card : C.cardAlt);
      K.logoTile(ctx, x + 28, y + 28, 64, m);
      const date = K.text(ctx, m.date, x + 876, y + 47, { size: 18, lh: 20, color: t.text, alpha: 0.7, align: 'right', maxW: 300, fit: true, min: 13 });
      if (m.chip) {
        K.setFont(ctx, 18, 400);
        const room = 876 - 112 - date.w - 24 - 24;
        const label = K.width(ctx, m.chip, 18, 400, 0) > room ? (K.warn(`Chip ${i + 1} is too long and was cut.`), cut(ctx, m.chip, room)) : m.chip;
        K.chip(ctx, x + 112, y + 44, label, chipColor(m.chip), 18);
      }
      K.text(ctx, m.headline, x + 28, y + 112, { size: 32, lh: 1.15, ls: -0.32, color: C.heading, maxW: 848, maxLines: 2, fit: true, min: 22, label: `Headline ${i + 1}` });
      K.text(ctx, m.detail, x + 28, y + 198, { size: 20, lh: 22.4, color: t.text, alpha: 0.7, maxW: 848, fit: true, min: 14, label: `Detail ${i + 1}` });
    });
    if (items.length < 3) K.warn(`This template has 3 cards; only ${items.length} filled.`);
  }
  function cut(ctx, str, maxW) {
    let s = String(str);
    while (s.length > 1 && K.width(ctx, s + '…', 18, 400, 0) > maxW) s = s.slice(0, -1);
    return s.trim() + '…';
  }

  // ---------- registration: sample data is the copy in the Figma frames ----------
  const L = K.logoPath;
  const FOOTER = T('footer', 'Footer');

  P.register({
    key: 'hiring', group: 'Market', theme: 'dark', label: 'Hiring', file: 'hiring', h: K.H_PORTRAIT, render: renderHiring,
    sample: {
      context: 'Hiring · open now', title: 'Who’s Hiring in AI for the SOC', subtitle: 'Top 5 vendors by open roles',
      stat: '281', statLabel: 'open roles across 31 of 123 tracked vendors',
      rows: [
        { name: '7AI', logo: L('7ai'), total: '45', engineering: '11', sales: '20', marketing: '9', other: '' },
        { name: 'TENEX.AI', logo: L('tenex-ai'), total: '41', engineering: '23', sales: '9', marketing: '', other: '7' },
        { name: 'Daylight Security', logo: L('daylight-security'), total: '31', engineering: '7', sales: '16', marketing: '', other: '6' },
        { name: 'Artemis Security', logo: L('artemis-security'), total: '23', engineering: '18', sales: '2', marketing: '', other: '2' },
        { name: 'Qevlar', logo: L('qevlar'), total: '22', engineering: '', sales: '10', marketing: '3', other: '5' }
      ],
      footer: 'Source: aisocnews.com · Job listings open now, 11 Nov 2026'
    },
    fields: [
      T('stat', 'Open roles, all vendors'), T('statLabel', 'Label beside the number'),
      { type: 'group', key: 'rows', label: 'Row', noteKey: 'name', fields: [
        T('name', 'Company'), { type: 'logo' }, T('total', 'Open roles'),
        T('engineering', 'Engineering roles'), T('sales', 'Sales roles'), T('marketing', 'Marketing roles'), T('other', 'Other roles')
      ] },
      FOOTER
    ]
  });

  P.register({
    key: 'discussed', group: 'Market', theme: 'light', label: 'Most discussed', file: 'most-discussed', h: K.H_PORTRAIT, render: renderDiscussed,
    sample: {
      context: 'Most discussed', title: 'Who the Market Is Talking About',
      subtitle: 'Articles and posts by others that name the vendor, this period vs the period before.',
      rows: [
        { name: 'Microsoft', logo: L('microsoft'), previous: '56', current: '87' },
        { name: 'Splunk (Cisco)', logo: L('splunk'), previous: '85', current: '80' },
        { name: '7AI', logo: L('7ai'), previous: '13', current: '37' },
        { name: 'Sekoia', logo: L('sekoia'), previous: '1', current: '31' },
        { name: 'Mave', logo: L('mave'), previous: '1', current: '27' }
      ],
      footer: 'Source: aisocnews.com · Most discussed, earned mentions'
    },
    fields: [
      { type: 'group', key: 'rows', label: 'Row', noteKey: 'name', fields: [
        T('name', 'Company'), { type: 'logo' }, T('current', 'Mentions this period'), T('previous', 'Mentions the period before')
      ] },
      FOOTER
    ],
    assets: Object.values(PT)
  });

  P.register({
    key: 'casestudy', group: 'Analysis', theme: 'light', label: 'Case study', file: 'case-study', h: K.H_PORTRAIT, render: renderCaseStudy,
    sample: {
      context: 'Case study · 6 Nov 2026', title: 'Quartermaster Deploys Artemis Security for SmartMast OT Security',
      name: 'Artemis Security', logo: L('artemis-security'),
      steps: [
        { text: 'Raw sensor logs', label: 'Input' },
        { text: 'Security detections', label: 'Artemis Security' },
        { text: 'None added', label: 'Analyst hires needed' }
      ],
      summary: 'The platform converts raw sensor logs into security detections without requiring additional analyst hires.',
      footer: 'Source: aisocnews.com · 2 sources, vendor sources only'
    },
    fields: [
      T('name', 'Company'), { type: 'logo' },
      { type: 'group', key: 'steps', label: 'Step', noteKey: 'text', fields: [T('text', 'Step', { area: true }), T('label', 'Label under it')] },
      T('summary', 'Summary', { area: true }),
      FOOTER
    ],
    assets: [ARROW]
  });

  P.register({
    key: 'moves', group: 'Market', theme: 'light', label: 'Market moves', file: 'market-moves', h: K.H_PORTRAIT, render: renderMoves,
    sample: {
      context: 'Market moves · 6–9 Nov 2026', title: 'Market Moves',
      items: [
        { name: 'Arctic Wolf', logo: L('arctic-wolf'), chip: 'Partnership', date: '9 Nov 2026', headline: 'Arctic Wolf partners with AWS for coordinated incident response', detail: 'Faster threat containment and cloud-native security visibility.' },
        { name: 'Cognna', logo: L('cognna'), chip: 'Funding', date: '8 Nov 2026', headline: 'Cognna receives backing from Wa’ed Ventures', detail: 'The Saudi venture capital firm is supporting the company’s growth.' },
        { name: 'Elastic', logo: L('elastic'), chip: 'Partnership', date: '6 Nov 2026', headline: 'Elastic supports Community Cyber Resilience Foundation via Dragos Platform', detail: 'Protecting under-resourced US water, electric and natural gas utilities.' }
      ],
      footer: 'Source: aisocnews.com · Market moves, vendor sources only'
    },
    fields: [
      { type: 'group', key: 'items', label: 'Move', noteKey: 'name', fields: [
        T('name', 'Company'), { type: 'logo' }, T('chip', 'Kind of move'), T('date', 'Date'),
        T('headline', 'Headline', { area: true }), T('detail', 'Detail', { area: true })
      ] },
      FOOTER
    ]
  });
})();
