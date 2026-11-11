// Ranking templates, portrait 1080 x 1350, rebuilt 1:1 from Figma (file Je7RFQscEKud8DLm93jxUW):
// "Ranking / Dark" (2886:286), "Ranking / Light" (2886:355) and "Data / Artemis #1 · Split finding" (2869:8339).
// Every number is in canvas pixels and comes from the Figma frames. Only the data changes.
(function () {
  const P = window.PostTemplates, K = P.kit, C = K.C;
  const X = 88, CW = 904, RIGHT = 992;
  const ACCENT = '#de63a8'; // --cf-text-accent

  // ---------- Top 5 ranking, dark and light (2886:286, 2886:355) ----------
  const RANK_THEME = {
    dark: { t: K.THEME.dark, strong: C.strong, text: C.onDark, footer: C.onDark, brand: [88, 85.5] },
    light: { t: K.THEME.light, strong: C.heading, text: C.primary, footer: C.heading, brand: [88, 89.5] }
  };
  function renderRanking(ctx, d, theme) {
    const s = RANK_THEME[theme], t = s.t;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, K.W, K.H_PORTRAIT);
    K.brand(ctx, t, s.brand[0], s.brand[1]);
    K.text(ctx, d.context, RIGHT - 1, 102, { size: 26, lh: 18, color: s.text, alpha: 0.7, align: 'right', maxW: CW - K.BRAND_W * t.logoScale - 24, fit: true, min: 16, label: 'The header label' });
    K.text(ctx, d.title, X, 200, { size: 96, weight: 500, lh: 1, ls: -1.92, color: s.strong, maxW: CW, fit: true, min: 48, label: 'The title' });
    K.text(ctx, d.title2, X, 296, { size: 96, lh: 1, ls: -1.92, color: s.strong, alpha: 0.7, maxW: CW, fit: true, min: 48, label: 'The second title line' });
    K.text(ctx, d.subtitle, X, 416, { size: 22, lh: 1.4, color: s.text, alpha: 0.7, maxW: 720, maxLines: 2, fit: true, min: 16, label: 'The subtitle' });
    K.text(ctx, d.scoreLabel, RIGHT - 1, 499.5, { size: 18, lh: 20, color: s.text, alpha: 0.7, align: 'right', maxW: 300, fit: true, min: 12, label: 'The score label' });
    const rows = (d.rows || []).slice(0, 5);
    for (let i = 0; i <= 5; i++) K.dashedRule(ctx, X, 536 + i * 134, CW, t.line);
    rows.forEach((r, i) => {
      const y = 536 + i * 134;
      K.text(ctx, r.rank, X, y + 30, { size: 56, lh: 1, ls: -1.12, color: s.strong, maxW: 44, fit: true, min: 28 });
      K.text(ctx, r.delta, X + 48, y + 44, { size: 18, color: s.text, alpha: 0.7, maxW: 48, fit: true, min: 12 });
      K.logoTile(ctx, X + 104, y + 30, 64, r);
      K.text(ctx, r.name, X + 188, y + 22, { size: 32, lh: 1.1, ls: -0.32, color: s.strong, maxW: 546, fit: true, min: 20, label: `Company name ${i + 1}` });
      K.text(ctx, r.stage, X + 188, y + 63.5, { size: 18, lh: 20, color: s.text, alpha: 0.7, maxW: 546, fit: true, min: 12, label: `Stage ${i + 1}` });
      K.text(ctx, r.detail, X + 188, y + 89.5, { size: 20, lh: 22.4, color: s.text, alpha: 0.7, maxW: 546, fit: true, min: 14, label: `Detail ${i + 1}` });
      K.text(ctx, r.score, RIGHT - 2, y + 22, { size: 56, lh: 1, ls: -1.12, color: s.strong, align: 'right', maxW: 150, fit: true, min: 28, label: `Number ${i + 1}` });
      K.fillRR(ctx, X + 754, y + 90, 150, 8, 2, s.strong, 0.12);
      const bw = 150 * K.pct(r.score);
      if (bw > 0) K.fillRR(ctx, X + 754, y + 90, bw, 8, 2, s.strong, i === 0 ? 1 : 0.5);
    });
    K.text(ctx, d.footer, X, 1238, { size: 20, lh: 52, color: s.footer, maxW: CW, fit: true, min: 14, label: 'The footer' });
    if (rows.length < 5) K.warn(`This template has 5 rows; only ${rows.length} filled.`);
  }

  const L = K.logoPath;
  const rankSample = () => ({
    context: 'Week of 2–8 Nov 2026', title: 'Agentic SOC', title2: 'Top 5 Movers',
    subtitle: 'Start-ups ranked by 90-day momentum. All five are accelerating.',
    scoreLabel: 'Momentum',
    rows: [
      { rank: '1', delta: '↑ 1', name: 'Artemis Security', logo: L('artemis-security'), stage: 'Executing', detail: '37 open roles per 100 staff, 15 earned mentions', score: '92' },
      { rank: '2', delta: '↓ 1', name: 'Exaforce', logo: L('exaforce'), stage: 'Executing', detail: '10 launches and partnerships, 35 earned mentions', score: '90' },
      { rank: '3', delta: '↑ 4', name: 'Detections AI', logo: L('detections-ai'), stage: 'Building', detail: 'Headcount +30%, 26 earned mentions', score: '81' },
      { rank: '4', delta: '=', name: '7AI', logo: L('7ai'), stage: 'Executing', detail: '53 earned mentions, headcount +19%', score: '80' },
      { rank: '5', delta: '=', name: 'Bricklayer AI', logo: L('bricklayer-ai'), stage: 'Building', detail: '8 launches and partnerships, headcount +8%', score: '79' }
    ],
    footer: 'Source: aisocnews.com · 2–8 Nov 2026'
  });
  const rankFields = () => [
    { type: 'text', key: 'scoreLabel', label: 'Score label' },
    { type: 'group', key: 'rows', label: 'Row', noteKey: 'name', fields: [
      { type: 'text', key: 'rank', label: 'Rank' },
      { type: 'text', key: 'delta', label: 'Change' },
      { type: 'text', key: 'name', label: 'Company' },
      { type: 'logo' },
      { type: 'text', key: 'stage', label: 'Stage' },
      { type: 'text', key: 'detail', label: 'Detail' },
      { type: 'text', key: 'score', label: 'Momentum (0–100)' }
    ] },
    { type: 'text', key: 'footer', label: 'Footer' }
  ];
  P.register({
    key: 'rank5dark', group: 'Movers', theme: 'dark', label: 'Top 5, dark', file: 'top-5-ranking-dark', h: 1350,
    render: (ctx, d) => renderRanking(ctx, d, 'dark'), sample: rankSample(), fields: rankFields(), assets: []
  });
  P.register({
    key: 'rank5light', group: 'Movers', theme: 'light', label: 'Top 5, light', file: 'top-5-ranking-light', h: 1350,
    render: (ctx, d) => renderRanking(ctx, d, 'light'), sample: rankSample(), fields: rankFields(), assets: []
  });

  // ---------- #1 finding: light heading panel over a dark score panel (2869:8339) ----------
  function renderSplit(ctx, d) {
    ctx.fillStyle = C.darkBg;
    ctx.fillRect(0, 0, K.W, K.H_PORTRAIT);
    // heading panel, 760 high, with a dashed bottom border inside it
    ctx.fillStyle = C.lightBg;
    ctx.fillRect(0, 0, K.W, 760);
    K.dashedRule(ctx, 0, 758, K.W, C.lineDark);
    K.brand(ctx, K.THEME.light, 88, 88);
    K.text(ctx, d.context, RIGHT - 1, 102, { size: 26, lh: 18, color: C.primary, align: 'right', maxW: CW - K.BRAND_W * 0.84 - 24, fit: true, min: 16, label: 'The header label' });
    K.logoTile(ctx, X, 196, 72, d);
    K.text(ctx, d.title, X, 300, { size: 84, weight: 500, lh: 1.04, ls: -1.68, color: C.heading, maxW: CW, maxLines: 3, fit: true, min: 44, label: 'The title' });
    if (d.chip) {
      K.setFont(ctx, 22, 400);
      const m = ctx.measureText('Hg'), th = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
      const label = String(d.chip);
      const size = K.text(ctx, label, 0, -500, { size: 22, color: C.primary, maxW: CW - 32, fit: true, min: 14, label: 'The chip' }).size;
      const w = K.width(ctx, label, size, 400, 0) + 32;
      K.fillRR(ctx, X, 627, Math.min(w, CW), th + 16, 6, C.aiSoc);
      K.setFont(ctx, size, 400);
      const m2 = ctx.measureText('Hg');
      K.text(ctx, label, X + 16, 627 + (th + 16 - (m2.fontBoundingBoxAscent + m2.fontBoundingBoxDescent)) / 2, { size, color: C.primary, maxW: CW - 32 });
    }

    // score panel
    K.text(ctx, d.scoreLabel, X, 804, { size: 20, lh: 52, color: C.onDark, maxW: CW, fit: true, min: 14, label: 'The score label' });
    K.text(ctx, d.score, 76, 888, { size: 300, weight: 500, lh: 1, ls: -12, color: ACCENT, maxW: 430, fit: true, min: 130, label: 'The number' });
    const cx = 530, cy = 920;
    const rows = (d.rows || []).slice(0, 5);
    let on = rows.findIndex((r) => r.name && r.name === d.name);
    if (on < 0) on = 0;
    rows.forEach((r, i) => {
      const y = cy + i * 56, hi = i === on, a = hi ? 1 : 0.7;
      K.logoTile(ctx, cx, y, 36, r);
      K.text(ctx, `${r.rank}. ${r.name}`, cx + 48, y + 8, { size: 17, color: C.onDark, alpha: a, maxW: 154, fit: true, min: 11, label: `Company name ${i + 1}` });
      K.fillRR(ctx, cx + 210, y + 13, 240, 12, 2, C.onDark, 0.12);
      const bw = 240 * K.pct(r.score);
      if (bw > 0) K.fillRR(ctx, cx + 210, y + 13, bw, 12, 2, C.strong, hi ? 1 : 0.45);
      K.text(ctx, r.score, cx + 491, y + 8, { size: 17, color: C.onDark, alpha: a, align: 'right', maxW: 34, fit: true, min: 11 });
    });
    K.text(ctx, d.chartLabel, cx, cy + 288, { size: 14, color: C.onDark, alpha: 0.7, maxW: 492, fit: true, min: 10, label: 'The chart caption' });
    K.text(ctx, d.footer, X, 1262, { size: 20, lh: 52, color: C.onDark, maxW: 430, fit: true, min: 14, label: 'The footer' });
    if (rows.length < 5) K.warn(`This template has 5 chart rows; only ${rows.length} filled.`);
  }
  P.register({
    key: 'split', group: 'Movers', theme: 'light', label: '#1 finding', file: 'top-mover-finding', h: 1350,
    render: renderSplit,
    sample: {
      context: 'Agentic SOC Top 40 Movers',
      name: 'Artemis Security', logo: L('artemis-security'),
      title: 'Artemis Security Moves Up to #1 Among Agentic SOC Start-ups',
      chip: 'AI and Agentic SOC',
      scoreLabel: 'Momentum score, week of 2–8 Nov 2026', score: '92',
      rows: [
        { rank: '1', name: 'Artemis Security', logo: L('artemis-security'), score: '92' },
        { rank: '2', name: 'Exaforce', logo: L('exaforce'), score: '90' },
        { rank: '3', name: 'Detections AI', logo: L('detections-ai'), score: '81' },
        { rank: '4', name: '7AI', logo: L('7ai'), score: '80' },
        { rank: '5', name: 'Bricklayer AI', logo: L('bricklayer-ai'), score: '79' }
      ],
      chartLabel: 'Momentum score (0–100), start-ups only',
      footer: 'Source: aisocnews.com'
    },
    fields: [
      { type: 'text', key: 'name', label: 'Company' },
      { type: 'logo' },
      { type: 'text', key: 'chip', label: 'Chip' },
      { type: 'text', key: 'scoreLabel', label: 'Score label' },
      { type: 'text', key: 'score', label: 'Momentum (0–100)' },
      { type: 'group', key: 'rows', label: 'Chart row', noteKey: 'name', fields: [
        { type: 'text', key: 'rank', label: 'Rank' },
        { type: 'text', key: 'name', label: 'Company' },
        { type: 'logo' },
        { type: 'text', key: 'score', label: 'Momentum (0–100)' }
      ] },
      { type: 'text', key: 'chartLabel', label: 'Chart caption' },
      { type: 'text', key: 'footer', label: 'Footer' }
    ],
    assets: []
  });
})();
