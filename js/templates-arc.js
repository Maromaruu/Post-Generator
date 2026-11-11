// Market Maturity Map as an arc (Figma 2919:348, 1080 x 1350): every start-up as a dot placed by
// size (left to right) and momentum (distance from the base), the top ten numbered and listed below.
(function () {
  const P = window.PostTemplates, K = P.kit, C = K.C, L = K.logoPath;
  const X = 88, RIGHT = 992, CW = 904;
  const A = (name) => `assets/arc/${name}.svg`;
  const ART = { outer: A('arc-outer'), holding: A('arc-holding'), growing: A('arc-growing'), d1: A('divider-1'), d2: A('divider-2'), d3: A('divider-3'), dot: A('dot'), top: A('dot-top') };
  // The arc: centre (540, 812), radius 452. The website draws the same map with centre (450, 460)
  // and radius 400, so a site point maps here as centre + (point - siteCentre) * 452 / siteRadius.
  const ARC = { cx: 540, cy: 812, r: 452 };

  // Number label beside a top-ten dot: the first spot that hits no other top dot and no other label.
  // (dx, dy) are from the dot's top-left corner; the dot is 16px, the label 15px text.
  function placeLabels(ctx, tops) {
    K.setFont(ctx, 15, 400);
    const boxes = tops.map((t) => ({ x: t.x - 8, y: t.y - 8, w: 16, h: 16 }));
    const hit = (a, b) => a.x < b.x + b.w + 2 && b.x < a.x + a.w + 2 && a.y < b.y + b.h + 1 && b.y < a.y + a.h + 1;
    const labels = [];
    return tops.map((t, i) => {
      if (t.dx != null && t.dy != null && t.dx !== '' && t.dy !== '') return { dx: +t.dx, dy: +t.dy };
      const w = ctx.measureText(String(t.rank)).width;
      const spots = [[20, -1], [-w - 5, -1], [14, -17], [14, 15], [-w - 3, -17], [-w - 3, 15], [8 - w / 2, -20], [8 - w / 2, 17]];
      let best = spots[0];
      for (const s of spots) {
        const box = { x: t.x - 8 + s[0], y: t.y - 8 + s[1] + 2, w, h: 15 };
        const clash = boxes.some((b, k) => k !== i && hit(box, b)) || labels.some((b) => hit(box, b));
        if (!clash) { best = s; labels.push(box); break; }
        if (s === spots[spots.length - 1]) labels.push({ x: t.x - 8 + best[0], y: t.y - 8 + best[1] + 2, w, h: 15 });
      }
      return { dx: best[0], dy: best[1] };
    });
  }

  function renderArc(ctx, d) {
    const t = K.THEME.dark;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, K.W, K.H_PORTRAIT);
    K.brand(ctx, t, X, 78);
    K.text(ctx, d.context, RIGHT, 92, { size: 22, lh: 18, color: t.text, alpha: 0.7, align: 'right', maxW: CW - K.BRAND_W - 24, fit: true, min: 15, label: 'The header label' });
    K.text(ctx, d.title, X, 167.9, { size: 76, weight: 500, lh: 1.04, ls: -1.52, color: t.title, maxW: CW, fit: true, min: 40, label: 'The title' });
    K.text(ctx, d.subtitle, X, 267, { size: 24, lh: 28, color: t.text, alpha: 0.7, maxW: CW, fit: true, min: 16, label: 'The subtitle' });

    // the arc, its two momentum rings and three stage dividers (Figma SVGs, at their own size)
    const put = (src, x, y) => { const im = K.img(src); if (im) ctx.drawImage(im, x, y, im.naturalWidth, im.naturalHeight); };
    put(ART.outer, 88, 360);
    put(ART.holding, 390.84 - 1, 662.84 - 1);
    put(ART.growing, 237.16 - 1, 509.16 - 1);
    put(ART.d1, 540 - 0.707, 492.39 - 0.707);
    put(ART.d2, 539, 360);
    put(ART.d3, 220.39 - 0.707, 492.39 - 0.707);
    ctx.fillStyle = C.lineDark;
    ctx.fillRect(78, 812, 924, 2);
    const stage = (label, x, y) => K.text(ctx, label, x, y, { size: 20, lh: 18, color: t.text, alpha: 0.85 });
    stage('Emerging', 39.31, 636.78); stage('Building', 297.11, 362.53); stage('Scaling', 710.89, 362.53); stage('Executing', 951.19, 636.78);
    const ring = (label, x, y) => K.text(ctx, label, x, y, { size: 15, lh: 20, color: t.text, alpha: 0.5 });
    ring('holding', 514.5, 727.42); ring('growing', 512, 576); ring('accelerating', 497.5, 412.15);
    ring('← smaller', 88, 824); ring('larger →', 936, 824);

    // every vendor as a 9px dot, then the top ten as 16px dots with their number
    const dot = K.img(ART.dot), big = K.img(ART.top);
    (d.dots || []).forEach((p) => { if (dot) ctx.drawImage(dot, p[0] - 4.5, p[1] - 4.5, 9, 9); });
    const tops = (d.top || []).slice(0, 10).filter((v) => v.x !== '' && v.x != null);
    tops.forEach((v) => { v.x = +v.x; v.y = +v.y; });
    const where = placeLabels(ctx, tops);
    tops.forEach((v, i) => {
      if (big) ctx.drawImage(big, v.x - 8, v.y - 8, 16, 16);
      K.text(ctx, String(v.rank), v.x - 8 + where[i].dx, v.y - 8 + where[i].dy, { size: 15, color: C.strong });
    });

    // legend: two columns of five
    const list = (d.top || []).slice(0, 10);
    list.forEach((v, i) => {
      const x = X + (i < 5 ? 0 : 468), y = 876 + (i % 5) * 62;
      K.text(ctx, String(v.rank), x, y + 11.5, { size: 24, lh: 28.8, ls: -0.24, color: C.strong, maxW: 34, fit: true, min: 14 });
      K.logoTile(ctx, x + 40, y + 6, 40, v);
      K.text(ctx, v.name, x + 94, y + 12, { size: 22, lh: 28, color: C.strong, maxW: 342, fit: true, min: 14, label: `Company name ${i + 1}` });
    });
    K.text(ctx, d.footer, X, 1238, { size: 18, lh: 20, color: t.text, alpha: 0.7, maxW: CW, fit: true, min: 13, label: 'The footer' });
    if (d.partial) K.warn('The full map could not be read from the site: only the top 40 vendors are drawn.');
    if (list.length < 10) K.warn(`This template lists 10 companies; only ${list.length} filled.`);
  }

  // Figma sample: dot positions are the frame's own (top-left corners, as listed there).
  const SMALL = [
    788.62, 623.31, 786.36, 709.19, 768.28, 693.37, 719.69, 539.69, 727.6, 587.15, 845.12, 660.6, 630.42, 480.93, 755.85, 623.31,
    690.31, 562.29, 679.01, 512.57, 599.91, 478.67, 570.53, 462.85, 655.28, 543.08, 660.93, 563.42, 728.73, 782.64, 723.08, 649.3,
    846.25, 588.28, 633.81, 633.48, 446.23, 462.85, 650.76, 588.28, 477.87, 392.79, 650.76, 452.68, 573.92, 521.61, 668.84, 640.26,
    378.43, 476.41, 666.58, 702.41, 556.97, 445.9, 613.47, 584.89, 747.94, 514.83, 788.62, 737.44, 756.98, 572.46, 494.82, 484.32,
    430.41, 514.83, 494.82, 537.43, 598.78, 526.13, 588.61, 604.1, 467.7, 428.95, 545.67, 398.44, 564.88, 612.01, 597.65, 658.34,
    523.07, 580.37, 594.26, 428.95, 464.31, 574.72, 451.88, 497.88, 352.44, 552.12, 217.97, 660.6, 424.76, 582.63, 362.61, 535.17,
    433.8, 552.12, 570.53, 675.29, 577.31, 689.98, 476.74, 609.75, 561.49, 663.99, 451.88, 607.49, 638.33, 765.69, 353.57, 627.83,
    354.7, 571.33, 346.79, 641.39, 300.46, 665.12, 437.19, 643.65, 500.47, 636.87, 514.03, 673.03, 412.33, 665.12, 307.24, 595.06,
    295.94, 713.71, 333.23, 694.5, 224.75, 683.2, 334.36, 727.27, 247.35, 643.65, 466.57, 684.33, 355.83, 601.84, 419.11, 685.46,
    659.8, 752.13, 598.78, 735.18, 507.25, 725.01, 395.38, 712.58, 425.89, 795.07, 325.32, 793.94, 463.18, 670.77, 492.56, 783.77,
    511.77, 766.82, 451.88, 760.04, 307.24, 751, 466.57, 654.95, 387.47, 738.57, 347.92, 812.02, 494.82, 741.96, 581.83, 791.68,
    329.84, 773.6, 567.14, 771.34, 269.95, 741.96, 425.89, 778.12, 414.59, 761.17
  ];
  const sampleDots = [];
  for (let i = 0; i < SMALL.length; i += 2) sampleDots.push([SMALL[i] + 4.5, SMALL[i + 1] + 4.5]);
  // top ten: dot corner, then where Figma put the number (offset from that corner)
  const TOP = [
    ['Exaforce', 'exaforce', 922.98, 705.69, 20, -1], ['7AI', '7ai', 889.08, 757.67, 20, -1],
    ['Artemis Security', 'artemis-security', 887.95, 600.6, 20, -1], ['Prophet Security', 'prophet-security', 840.49, 640.15, 20, -1],
    ['Daylight Security', 'daylight-security', 851.79, 545.23, 20, -1], ['Kai Security', 'kai-security', 883.43, 624.33, 20, -1],
    ['Dropzone AI', 'dropzone-ai', 823.54, 669.53, 22, -22], ['BlinkOps', 'blinkops', 812.24, 715.86, -14, 0],
    ['Stellar Cyber', 'stellar-cyber', 814.5, 680.83, -16, -1], ['Qevlar', 'qevlar', 797.55, 655.97, -20, -5]
  ];

  P.register({
    key: 'arc', group: 'Market', theme: 'dark', label: 'Maturity arc', file: 'maturity-arc', h: 1350, render: renderArc,
    arc: ARC,
    sample: {
      context: 'Market Maturity Map · last 90 days', title: 'Where the Market Stands',
      subtitle: '103 vendors placed by size, growth and momentum.',
      dots: sampleDots,
      top: TOP.map((v, i) => ({ rank: String(i + 1), name: v[0], logo: L(v[1]), x: v[2] + 8, y: v[3] + 8, dx: v[4], dy: v[5] })),
      footer: 'Source: aisocnews.com · Start-ups, computed 10 Nov 2026'
    },
    fields: [
      { type: 'group', key: 'top', label: 'Company', noteKey: 'name', fields: [{ type: 'text', key: 'name', label: 'Company' }, { type: 'logo' }] }
    ],
    assets: Object.values(ART)
  });
})();
