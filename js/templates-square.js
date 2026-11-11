// Square post templates, rebuilt 1:1 from the Figma file Je7RFQscEKud8DLm93jxUW:
// Product launches (2897:309), Most covered (2897:386), Our analysis (2897:452),
// Market brief (2897:510), Thought leadership (2897:567). All 1080 x 1080.
// Every number is in canvas pixels and comes from the Figma frames. Only the data changes.
(function () {
  const P = window.PostTemplates, K = P.kit;
  const C = K.C, X = K.X, CW = K.CW, RIGHT = K.RIGHT, W = K.W, H = K.H;
  const BRAND_X = 80, brandY = (t) => (t.key === 'dark' ? 69.67 : 73.67); // on the content edge, centred on y = 94.67
  const EXPOSURE = '#5eb1ef'; // CF/Market/Exposure management, the chip in the Market brief frame

  // Background, wordmark, header label and footer: the same as the Set 2 frames.
  function frame(ctx, d, t) {
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, W, H);
    K.brand(ctx, t, BRAND_X, brandY(t));
    const maxW = CW - K.BRAND_W * t.logoScale - 24;
    rightText(ctx, d.context, RIGHT, 84, { size: 22, lh: 18, color: t.text, alpha: 0.7, maxW, fit: true, min: 15, label: 'The header label' });
    K.text(ctx, d.footer, X, 976, { size: 17, lh: 20, color: t.text, alpha: 0.7, maxW: CW, fit: true, min: 13, label: 'The footer' });
  }
  // Figma hugs text and chip boxes to whole pixels (width rounded up); these two follow that.
  function rightText(ctx, str, right, top, o) {
    str = str == null ? '' : String(str);
    const w = K.width(ctx, str, o.size, o.weight, o.ls);
    if (o.maxW && w > o.maxW) return K.text(ctx, str, right, top, Object.assign({}, o, { align: 'right' }));
    return K.text(ctx, str, right - Math.ceil(w), top, Object.assign({}, o, { maxW: 0, fit: false }));
  }
  // maxW: the widest the chip may be; a longer label is cut with an ellipsis and a warning.
  function chip(ctx, x, y, label, bg, maxW, what) {
    label = String(label);
    K.setFont(ctx, 18, 400);
    if (maxW && ctx.measureText(label).width + 24 > maxW) {
      while (label.length > 1 && ctx.measureText(label + '…').width + 24 > maxW) label = label.slice(0, -1);
      label = label.replace(/[\s,.;:·–-]+$/, '') + '…';
      K.warn(`${what || 'The chip'} is too long and was cut.`);
    }
    const m = ctx.measureText('Hg');
    const h = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent + 12;
    const w = Math.ceil(ctx.measureText(label).width) + 24;
    K.fillRR(ctx, x, y, w, h, 6, bg);
    K.text(ctx, label, x + 12, y + 6, { size: 18, color: C.primary });
    return { w, h };
  }
  function title(ctx, d, t, o) {
    return K.text(ctx, d.title, X, o.top, {
      size: o.size, weight: 500, lh: 1.04, ls: -0.02 * o.size, color: t.title,
      maxW: CW, maxLines: o.maxLines || 1, box: o.box, fit: true, min: o.min || 36, label: 'The title'
    });
  }

  // Two text tops below sit a fraction above the Figma value (233.8 for 234, 441.5 for 442): the canvas
  // rounds font metrics, and without the nudge those baselines land 1px lower than the Figma render.

  // ---------- Product launches, three releases (2897:309) ----------
  function renderLaunches(ctx, d) {
    const t = K.THEME.light;
    frame(ctx, d, t);
    title(ctx, d, t, { size: 72, top: 168 });
    const rows = (d.rows || []).slice(0, 3);
    rows.forEach((r, i) => {
      const y = 319 + i * 196;
      K.dashedRule(ctx, X, y - 20, CW, t.line);
      K.logoTile(ctx, X, y, 64, r);
      const date = rightText(ctx, r.date, RIGHT, y + 22, { size: 17, lh: 20, color: t.text, alpha: 0.7, maxW: 300, fit: true, min: 12 });
      if (r.chip) {
        chip(ctx, X + 84, y + 16, r.chip, C.aiSoc, CW - 84 - date.w - 24, `Chip ${i + 1}`);
      }
      K.text(ctx, r.title, X, y + 84, { size: 30, lh: 1.15, ls: -0.3, color: C.heading, maxW: CW, box: true, fit: true, min: 20, label: `Launch title ${i + 1}` });
      K.text(ctx, r.detail, X, y + 128, { size: 19, lh: 22.4, color: t.text, alpha: 0.7, maxW: CW, maxLines: 2, label: `Launch detail ${i + 1}` });
    });
    if (rows.length < 3) K.warn(`This template has 3 launches; only ${rows.length} filled.`);
  }

  // ---------- Most covered this week, two tiles (2897:386) ----------
  function renderCovered(ctx, d) {
    const t = K.THEME.dark;
    frame(ctx, d, t);
    title(ctx, d, t, { size: 72, top: 168 });
    const cards = (d.cards || []).slice(0, 2);
    cards.forEach((c, i) => {
      const x = X + i * 472, y = 314;
      K.darkCard(ctx, x, y, 448, 560);
      const ix = x + 2, iy = y + 2; // children sit inside the 2px border
      K.logoTile(ctx, ix + 30, iy + 30, 72, c);
      K.text(ctx, c.name, ix + 30, iy + 122, { size: 30, lh: 28.8, ls: -0.3, color: C.strong, maxW: 384, fit: true, min: 18, label: `Company name ${i + 1}` });
      K.text(ctx, c.value, ix + 22, iy + 188, { size: 200, weight: 500, lh: 1, ls: -8, color: C.strong, maxW: 400, fit: true, min: 90, label: `Number ${i + 1}` });
      K.text(ctx, c.valueLabel, ix + 30, iy + 398, { size: 24, lh: 28, color: t.text, alpha: 0.7, maxW: 384, fit: true, min: 15, label: `Number label ${i + 1}` });
      K.text(ctx, c.detail, ix + 30, iy + 441.5, { size: 20, lh: 22.4, color: t.text, alpha: 0.7, maxW: 384, maxLines: 2, fit: true, min: 15, label: `Detail ${i + 1}` });
      if (c.chip) chip(ctx, ix + 30, iy + 498, c.chip, C.aiSoc, 384, `Chip ${i + 1}`);
    });
    if (cards.length < 2) K.warn(`This template has 2 tiles; only ${cards.length} filled.`);
  }

  // ---------- Our analysis, one stat (2897:452) ----------
  function renderAnalysis(ctx, d) {
    const t = K.THEME.light;
    frame(ctx, d, t);
    const list = (d.vendors || []).filter((v) => v.name || v.logo);
    list.slice(0, 10).forEach((v, i) => K.logoTile(ctx, X + i * 88, 168, 72, v));
    if (list.length > 10) K.warn(`The logo row fits 10 logos; ${list.length - 10} left out.`);
    title(ctx, d, t, { size: 76, top: 268, maxLines: 2, min: 44 });
    K.fillRR(ctx, X, 493, 920, 352, 8, C.darkBg);
    K.text(ctx, d.value, X + 32, 493 + 24, { size: 150, weight: 500, lh: 1, ls: -6, color: C.strong, maxW: 856, fit: true, min: 70, label: 'The number' });
    K.text(ctx, d.detail, X + 36, 493 + 200, { size: 26, lh: 1.35, color: C.onDark, alpha: 0.7, maxW: 848, maxLines: 3, fit: true, min: 19, label: 'The text under the number' });
    K.text(ctx, d.note, X, 885, { size: 26, lh: 1.35, color: t.text, alpha: 0.8, maxW: CW, maxLines: 2, fit: true, min: 19, label: 'The closing line' });
  }

  // ---------- Market brief, headline and one number (2897:510) ----------
  function renderBrief(ctx, d) {
    const t = K.THEME.dark;
    frame(ctx, d, t);
    K.logoTile(ctx, X, 168, 112, d);
    title(ctx, d, t, { size: 76, top: 298, maxLines: 3, min: 44 });
    if (d.chip) chip(ctx, X, 611, d.chip, EXPOSURE, CW);
    K.dashedRule(ctx, X, 686, CW, t.line);
    const big = K.text(ctx, d.value, 74, 714, { size: 150, weight: 500, lh: 1, ls: -6, color: C.strong, maxW: 560, fit: true, min: 70, label: 'The number' });
    const tx = Math.max(460, 74 + big.w + 24); // Figma: 460; moves right only for a wider number
    K.text(ctx, d.detail, tx, 754, { size: 26, lh: 1.35, color: t.text, alpha: 0.7, maxW: RIGHT - tx, maxLines: 3, fit: true, min: 18, label: 'The text beside the number' });
  }

  // ---------- Thought leadership, single quote (2897:567) ----------
  function renderThought(ctx, d) {
    const t = K.THEME.light;
    frame(ctx, d, t);
    K.logoTile(ctx, X, 168, 96, d);
    K.text(ctx, d.name, X + 116, 194, { size: 30, lh: 28.8, ls: -0.3, color: C.heading, maxW: 804, fit: true, min: 18, label: 'The company name' });
    K.text(ctx, d.source, X + 116, 233.8, { size: 18, lh: 20, color: t.text, alpha: 0.7, maxW: 804, fit: true, min: 13, label: 'The source line' });
    K.text(ctx, d.quote, X, 328, { size: 70, weight: 500, lh: 1.06, ls: -1.4, color: C.heading, maxW: CW, maxLines: 5, fit: true, min: 36, label: 'The quote' });
    if (d.chip) chip(ctx, X, 722, d.chip, C.neutral, CW);
    K.text(ctx, d.note, X, 782, { size: 24, lh: 28, color: t.text, alpha: 0.7, maxW: CW, maxLines: 3, fit: true, min: 18, label: 'The note' });
  }

  // ---------- registration: sample = the copy in the Figma frames ----------
  const L = K.logoPath;
  const FOOTER = { type: 'text', key: 'footer', label: 'Footer' };

  P.register({
    key: 'launches', group: 'Market', theme: 'light', label: 'Launches', file: 'product-launches', render: renderLaunches,
    sample: {
      context: 'Product launches · 5–9 Nov 2026', title: 'New in the AI SOC',
      rows: [
        { name: 'Crogl', logo: L('crogl'), chip: 'Product launch', date: '9 Nov 2026', title: 'Crogl 2.16.0 Adds Cloud Alert Enrichment', detail: 'New connectors, a REST API, PDF and JSONL export, and token tracking.' },
        { name: 'SenseOn', logo: L('senseon'), chip: 'Product launch', date: '6 Nov 2026', title: 'SenseOn Releases a SecOps Diagnostic', detail: 'Assesses tool sprawl, handoffs, evidence gaps, approval gates and audit trails.' },
        { name: 'Detections AI', logo: L('detections-ai'), chip: 'Product expansion', date: '5 Nov 2026', title: 'Detections AI Launches Continuous Hunt Watching', detail: 'Keeps checking for matches after the first hunt, at an interval teams set.' }
      ],
      footer: 'Source: aisocnews.com · Product launches, vendor sources only'
    },
    fields: [
      { type: 'group', key: 'rows', label: 'Launch', noteKey: 'name', fields: [
        { type: 'text', key: 'name', label: 'Company' },
        { type: 'logo' },
        { type: 'text', key: 'chip', label: 'Chip' },
        { type: 'text', key: 'date', label: 'Date' },
        { type: 'text', key: 'title', label: 'Headline' },
        { type: 'text', key: 'detail', label: 'Detail', area: true }
      ] },
      FOOTER
    ]
  });

  P.register({
    key: 'covered', group: 'Market', theme: 'dark', label: 'Most covered', file: 'most-covered', render: renderCovered,
    sample: {
      context: 'Being discussed · last 7 days', title: 'Most Covered This Week',
      cards: [
        { name: 'CrowdStrike', logo: L('crowdstrike'), value: '12', valueLabel: 'articles in 7 days', detail: 'Agentic SOC expansion', chip: '' },
        { name: 'Sekoia', logo: L('sekoia'), value: '12', valueLabel: 'articles in 7 days', detail: 'Poisoned Source APT29 campaign', chip: '1.8× its 30-day pace' }
      ],
      footer: 'Source: aisocnews.com · From 584 articles over the last 30 days'
    },
    fields: [
      { type: 'group', key: 'cards', label: 'Tile', noteKey: 'name', fields: [
        { type: 'text', key: 'name', label: 'Company' },
        { type: 'logo' },
        { type: 'text', key: 'value', label: 'Number' },
        { type: 'text', key: 'valueLabel', label: 'Number label' },
        { type: 'text', key: 'detail', label: 'Detail', area: true },
        { type: 'text', key: 'chip', label: 'Chip' }
      ] },
      FOOTER
    ]
  });

  P.register({
    key: 'analysis', group: 'Analysis', theme: 'light', label: 'Our analysis', file: 'our-analysis', render: renderAnalysis,
    sample: {
      context: 'Our analysis · 6 Sep 2026', title: 'The Agentic SOC Is a Feature Now',
      vendors: [{ name: 'CrowdStrike', logo: L('crowdstrike') }, { name: '7AI', logo: L('7ai') }],
      value: '$130M', detail: '7AI’s Series A in December 2025, the largest Series A in the AI SOC market.',
      note: 'Nine months later, CrowdStrike made the agentic SOC a feature of Falcon.',
      footer: 'By the Cyberfuturists · aisocnews.com'
    },
    fields: [
      { type: 'vendors', key: 'vendors', label: 'Companies' },
      { type: 'text', key: 'value', label: 'Number' },
      { type: 'text', key: 'detail', label: 'Text under the number', area: true },
      { type: 'text', key: 'note', label: 'Closing line', area: true },
      FOOTER
    ]
  });

  P.register({
    key: 'brief', group: 'Analysis', theme: 'dark', label: 'Market brief', file: 'market-brief', render: renderBrief,
    sample: {
      context: 'AI SOC market brief · 3 Nov 2026', title: 'Dropzone AI Gets FedRAMP High Authorization',
      name: 'Dropzone AI', logo: L('dropzone-ai'), chip: 'Class D',
      value: '400+', detail: 'production environments,\nas claimed by the vendor',
      footer: 'By Oliver Rochford · aisocnews.com · Announced 31 Oct 2026'
    },
    fields: [
      { type: 'text', key: 'name', label: 'Company' },
      { type: 'logo' },
      { type: 'text', key: 'chip', label: 'Chip' },
      { type: 'text', key: 'value', label: 'Number' },
      { type: 'text', key: 'detail', label: 'Text beside the number', area: true },
      FOOTER
    ]
  });

  P.register({
    key: 'thought', group: 'Voices', theme: 'light', label: 'Thought leadership', file: 'thought-leadership', render: renderThought,
    sample: {
      context: 'Thought leadership · 9 Nov 2026',
      name: 'Arctic Wolf', logo: L('arctic-wolf'), source: 'on LinkedIn',
      quote: '“AI Now Resolves the Majority of Security Investigations in the Aurora Agentic SOC.”',
      chip: 'Vendor claim', note: 'From its 2026 Agentic Security Operations Report.',
      footer: 'Source: aisocnews.com · Thought leadership'
    },
    fields: [
      { type: 'text', key: 'name', label: 'Company' },
      { type: 'logo' },
      { type: 'text', key: 'source', label: 'Source line' },
      { type: 'text', key: 'quote', label: 'Quote', area: true },
      { type: 'text', key: 'chip', label: 'Chip' },
      { type: 'text', key: 'note', label: 'Note', area: true },
      FOOTER
    ]
  });
})();
