// Reads an aisocnews.com page (HTML string) and turns it into the data each post template needs.
// The site is one dashboard with views; everything is read from its markup with DOMParser.
(function () {
  const { SAMPLE, SAMPLE_TOP5, STAGE_CAP, logoPath } = window.PostTemplates;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const STAGES = ['Emerging', 'Building', 'Scaling', 'Executing'];
  // logos that ship with the Figma file; anything else uses the logo embedded in the site
  const BUNDLED = ['7ai', 'anvilogic', 'arctic-wolf', 'artemis-security', 'binalyze', 'blinkops', 'bricklayer-ai', 'cognna', 'crogl', 'crowdstrike', 'daylight-security', 'detections-ai', 'dropzone-ai', 'elastic', 'exaforce', 'google-secops', 'huntbase', 'kai-security', 'mave', 'method-security', 'microsoft', 'nebulock', 'palo-alto-networks', 'prophet-security', 'qevlar', 'sekoia', 'senseon', 'spectrum-security', 'splunk', 'stellar-cyber', 'tenex-ai', 'vigilbase'];

  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const slug = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const cleanName = (s) => String(s).replace(/\s*\([^)]*\)\s*$/, '').trim();
  const num = (s) => { const m = String(s || '').replace(/,/g, '').match(/\d+/); return m ? m[0] : ''; };

  function parseDate(s) {
    const m = String(s || '').match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/);
    if (!m) return null;
    const month = MONTHS.findIndex((x) => x.toLowerCase() === m[2].toLowerCase());
    return month < 0 ? null : new Date(Date.UTC(+m[3], month, +m[1]));
  }
  const dm = (d) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  // "9 Nov", "9–10 Nov", "12 Oct–11 Nov", optionally with the year
  function range(a, b, year) {
    if (!a) return '';
    if (!b || +a === +b) return dm(a) + (year ? ' ' + a.getUTCFullYear() : '');
    if (a > b) [a, b] = [b, a];
    const same = a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear();
    return (same ? `${a.getUTCDate()}–${dm(b)}` : `${dm(a)}–${dm(b)}`) + (year ? ' ' + b.getUTCFullYear() : '');
  }
  function monthRange(a, b) {
    if (!a) return '';
    if (!b) b = a;
    if (a > b) [a, b] = [b, a];
    const ma = MONTHS[a.getUTCMonth()], mb = MONTHS[b.getUTCMonth()];
    return (ma === mb ? ma : `${ma}–${mb}`) + ' ' + b.getUTCFullYear();
  }
  function firstSentence(s, max) {
    s = String(s).replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
    const m = s.match(/^(.{25,}?[.!?])(\s|$)/);
    let out = m ? m[1] : s;
    if (out.length > max) out = out.slice(0, max).replace(/\s+\S*$/, '').replace(/[,;:–-]+$/, '') + '…';
    return out;
  }
  const sentenceCase = (s) => s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
  const SMALL = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'for', 'to', 'at', 'by', 'vs', 'with', 'as', 'from']);
  // Headline capitals, keeping words that already carry capitals (SOC, FedRAMP)
  const titleCase = (s) => String(s).split(' ').map((w, i) =>
    (i && SMALL.has(w.toLowerCase())) || /[A-Z]/.test(w.slice(1)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  // split on sentence ends only (a full stop inside a name such as Fal.Con does not count)
  const sentences = (s) => String(s).replace(/…$/, '').split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/).filter(Boolean);
  const fullDate = (d) => (d ? `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` : '');

  // ---------- reading the page ----------
  function readMovers(doc, index) {
    const panel = doc.querySelector(`[data-switch-panel="movers:${index}"]`);
    if (!panel) return { week: '', rows: [] };
    const week = (txt(panel).match(/Week of\s+([^·]+?)\s*·/) || [])[1] || '';
    const rows = [];
    panel.querySelectorAll('ol > li').forEach((li) => {
      const a = li.querySelector('a[href*="vendor="]');
      if (!a) return;
      const rank = num(txt(li.querySelector('span')));
      const move = (li.querySelector('span[title]') || { getAttribute: () => '' }).getAttribute('title') || '';
      const from = num(move);
      let delta = '';
      if (/^up/i.test(move) && from) delta = '↑ ' + Math.abs(+from - +rank);
      else if (/^down/i.test(move) && from) delta = '↓ ' + Math.abs(+from - +rank);
      else if (/same/i.test(move)) delta = '=';
      else if (/new/i.test(move)) delta = 'new';
      const info = Array.from(a.parentElement.children).filter((el) => el.tagName === 'SPAN');
      const stageLine = txt(info[0]);
      const parts = stageLine.split(/\s*·\s*/);
      const spans = Array.from(li.children).filter((el) => el.tagName === 'SPAN');
      const img = a.querySelector('img');
      rows.push({
        rank, delta,
        name: cleanName(txt(a.querySelector('span') || a)),
        siteLogo: img ? img.getAttribute('src') || '' : '',
        stage: parts.find((p) => STAGES.includes(p)) || '',
        trend: parts.find((p) => /^(accelerating|steady|slowing|cooling|decelerating)/i.test(p)) || '',
        kind: /incumbent/i.test(parts[0]) ? parts[0] : '',
        detail: txt(info[1]),
        score: num(txt(spans[spans.length - 1]).replace(/momentum/i, ''))
      });
    });
    const seen = new Set();
    return { week, rows: rows.filter((r) => r.rank && !seen.has(r.rank + r.name) && seen.add(r.rank + r.name)) };
  }
  function sectionOf(doc, id) {
    const h = doc.getElementById(id);
    return h ? h.closest('section') : null;
  }
  function readQuotes(doc, id) {
    const section = sectionOf(doc, id);
    const out = [], seen = new Set();
    if (!section) return out;
    section.querySelectorAll('article').forEach((article) => {
      const ps = Array.from(article.children).filter((el) => el.tagName === 'P');
      const meta = txt(ps[0]), quote = txt(ps[1]);
      if (!quote || seen.has(quote)) return;
      seen.add(quote);
      const m = meta.match(/^(.*?)\s+on\s+(.+?)\s*·\s*(.+)$/);
      out.push({ who: m ? m[1] : meta, platform: m ? m[2] : '', date: parseDate(meta), quote });
    });
    return out;
  }
  function readResearch(doc) {
    const section = sectionOf(doc, 'research-title');
    const out = [], seen = new Set();
    if (!section) return out;
    section.querySelectorAll('article').forEach((article) => {
      const ps = Array.from(article.children).filter((el) => el.tagName === 'P');
      const meta = txt(ps[0]), title = txt(ps[1]);
      if (!title || seen.has(title)) return;
      seen.add(title);
      const firm = meta.split(/\s*·\s*/)[0];
      const third = ps[2];
      const label = third ? (third.childNodes[0] && third.childNodes[0].nodeType === 3 ? third.childNodes[0].textContent.trim() : 'Cited by') : '';
      const vendors = third ? Array.from(third.children).map((el) => txt(el)).filter(Boolean) : [];
      out.push({ firm, date: parseDate(meta), title, label, vendors });
    });
    return out;
  }
  // Every vendor's dot inside one arc drawing: its place, its rank on the map and its name.
  function arcDots(root) {
    const base = (root.innerHTML.match(/<path d="M\s*([\d.]+)\s+([\d.]+)\s+A\s*([\d.]+)[^"]*Z"/) || []).slice(1).map(Number);
    const arc = base.length === 3 ? { cx: base[0] + base[2], cy: base[1], r: base[2] } : { cx: 450, cy: 460, r: 400 };
    const dots = [];
    root.querySelectorAll('[data-tip]').forEach((g) => {
      const core = g.querySelector('circle.mm-core') || g.querySelector('circle:last-of-type');
      const m = (g.getAttribute('data-tip') || '').match(/<strong>(.*?)<\/strong>/);
      if (!core || !m) return;
      dots.push({ name: cleanName(m[1]), rank: +g.getAttribute('data-rank') || 0, tail: g.hasAttribute('data-tail'), x: +core.getAttribute('cx'), y: +core.getAttribute('cy') });
    });
    return { arc, dots };
  }
  // The full start-up map lives on the site's report view (?view=report): the first drawing
  // labelled "position and balance" has every vendor at its real position.
  function readArcMap(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const svg = Array.from(doc.querySelectorAll('svg[aria-label]')).find((s) => /position and balance/i.test(s.getAttribute('aria-label')));
    return svg ? arcDots(svg) : { arc: null, dots: [] };
  }
  function readMap(doc) {
    const panel = doc.querySelector('[data-switch-panel="map:0"]') || doc;
    const flags = { innovating: 0, hiring: 0, funded: 0, total: 0 };
    panel.querySelectorAll('[data-m][data-tip]').forEach((g) => {
      flags.total++;
      const m = g.getAttribute('data-m') || '';
      ['innovating', 'hiring', 'funded'].forEach((k) => { if (m.split(/\s+/).includes(k)) flags[k]++; });
    });
    // read it from its own paragraph: in the flattened panel text the count runs into the legend numbers
    const para = Array.from(panel.querySelectorAll('p')).map(txt).find((t) => /^\d+ of \d+ vendors mapped/.test(t)) || '';
    const mapped = para.match(/^(\d+) of (\d+) vendors mapped/);
    // each dot's tooltip starts "<strong>Vendor</strong> · Category"
    const categories = {};
    doc.querySelectorAll('[data-tip]').forEach((g) => {
      const m = (g.getAttribute('data-tip') || '').match(/<strong>(.*?)<\/strong>\s*·\s*([^<]+)/);
      if (m) categories[slug(cleanName(m[1]))] = m[2].trim();
    });
    // On this dashboard view the vendors outside the top 40 are hidden ("tail") and their
    // positions are placeholders, so only the others are usable here. readArcMap() has them all.
    const drawn = arcDots(panel);
    return { flags, mapped: mapped ? [mapped[1], mapped[2]] : null, categories, arc: drawn.arc, dots: drawn.dots.filter((p) => !p.tail) };
  }
  // Developments (market moves, product launches, case studies): one <article> each.
  function readDevs(doc, id) {
    const section = sectionOf(doc, id);
    const out = [], seen = new Set();
    if (!section) return out;
    section.querySelectorAll('article').forEach((article) => {
      const h = article.querySelector('h3');
      const title = txt(h);
      if (!title || seen.has(title)) return;
      seen.add(title);
      const box = h.parentElement;
      const ps = Array.from(box.children).filter((el) => el.tagName === 'P');
      const meta = ps.find((p) => p.querySelector('img')) || ps[1];
      const img = meta ? meta.querySelector('img') : null;
      const parts = txt(meta).split(/\s*·\s*/);
      out.push({
        kind: txt(box.querySelector('span')), title, summary: ps[0] && ps[0] !== meta ? txt(ps[0]) : '',
        vendor: cleanName(parts[0] || ''), siteLogo: img ? img.getAttribute('src') || '' : '',
        date: parseDate(txt(meta)), sources: parts.find((x) => /source/i.test(x)) || '', provenance: parts[parts.length - 1] || ''
      });
    });
    return out;
  }
  // Our own analysis pieces
  function readAnalysis(doc) {
    const section = sectionOf(doc, 'analysis-title');
    const out = [];
    if (!section) return out;
    section.querySelectorAll('article').forEach((article) => {
      const h = article.querySelector('h3');
      if (!h) return;
      const ps = Array.from(h.parentElement.children).filter((el) => el.tagName === 'P');
      const meta = txt(ps[ps.length - 1]);
      out.push({
        kind: txt(h.parentElement.querySelector('span')), title: txt(h), summary: ps.length > 1 ? txt(ps[0]) : '',
        by: (meta.match(/^By\s+(.*?)\s*·/) || [])[1] || '', date: parseDate(meta)
      });
    });
    return out;
  }
  // Hiring: top vendors by open roles, with the split by function
  function readHiring(doc) {
    const section = sectionOf(doc, 'hiring-title');
    if (!section) return null;
    const body = txt(section);
    const rows = [];
    const article = section.querySelector('article');
    (article ? article.querySelectorAll('li') : []).forEach((li) => {
      const img = li.querySelector('img');
      const info = li.querySelector('div');
      const spans = info ? Array.from(info.children).filter((el) => el.tagName === 'SPAN') : [];
      const split = {};
      txt(spans[1]).split(/\s*,\s*/).forEach((part) => { const m = part.match(/^(.*?)\s+(\d+)$/); if (m) split[m[1].toLowerCase()] = m[2]; });
      rows.push({
        name: cleanName(txt(spans[0])), siteLogo: img ? img.getAttribute('src') || '' : '',
        breakdown: txt(spans[1]), split, roles: num(txt(li.lastElementChild))
      });
    });
    const m = body.match(/([\d,]+)\s*open roles;\s*(\d+) of (\d+) vendors/);
    return { total: m ? m[1].replace(/,/g, '') : '', listing: m ? [m[2], m[3]] : null, rows };
  }
  // A ranked list under an <h3> ("Most discussed", "Being discussed"): label, value, change
  function readRanked(doc, heading) {
    const h = Array.from(doc.querySelectorAll('h3')).find((el) => txt(el) === heading);
    const out = [];
    if (!h) return out;
    const box = h.parentElement.parentElement;
    box.querySelectorAll('ul > li').forEach((li) => {
      const cells = Array.from(li.children);
      const img = li.querySelector('img');
      const extra = cells[2] ? Array.from(cells[2].querySelectorAll('span')).filter((el) => !el.children.length).map(txt).filter(Boolean) : [];
      out.push({
        name: cleanName(txt(cells[0])), siteLogo: img ? img.getAttribute('src') || '' : '',
        value: num(txt(cells[1])), change: extra.find((t) => /^[\d.,]+×?$/.test(t)) || '',
        note: extra.find((t) => /\s/.test(t)) || ''
      });
    });
    return out;
  }

  function readPage(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const body = txt(doc.body);
    const count = (key) => {
      const a = doc.querySelector(`a[href*="section=${key}"]`);
      return a ? num((txt(a).match(/All\s+([\d,]+)/) || [])[1]) : '';
    };
    const tracked = Array.from(body.matchAll(/ of (\d+) vendors (?:mapped|had a development)/g)).map((m) => +m[1]);
    return {
      generated: parseDate((body.match(/Generated\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/) || [])[1]),
      generatedTime: (body.match(/Generated\s+\d{1,2}\s+[A-Za-z]+\s+\d{4},?\s+(\d{1,2}:\d{2}\s*(?:UTC|GMT)?)/) || [])[1] || '',
      startups: readMovers(doc, 0),
      all: readMovers(doc, 1),
      counts: {
        articles: num((body.match(/From\s+([\d,]+)\s+articles/) || [])[1]),
        articlesDays: +((body.match(/From\s+[\d,]+\s+articles over the last (\d+) days/) || [])[1] || 0),
        voices: count('voices'), social: count('social'), launches: count('launches'),
        moves: count('moves'), cases: count('cases'), research: count('research')
      },
      vendors: tracked.length ? String(Math.max(...tracked)) : '',
      map: readMap(doc),
      research: readResearch(doc),
      social: readQuotes(doc, 'social-title'),
      voices: readQuotes(doc, 'voices-title'),
      moves: readDevs(doc, 'moves-title'),
      launches: readDevs(doc, 'launches-title'),
      cases: readDevs(doc, 'cases-title'),
      analysis: readAnalysis(doc),
      hiring: readHiring(doc),
      discussed: readRanked(doc, 'Most discussed'),
      subjects: readRanked(doc, 'Being discussed')
    };
  }

  // ---------- filling the templates ----------
  function makeLogoResolver(pages) {
    const site = {};
    // every logo the page embeds: both rankings, developments, hiring and most discussed
    pages.forEach((p) => p && [].concat(
      p.startups.rows, p.all.rows, p.moves || [], p.launches || [], p.cases || [], p.discussed || [], p.hiring ? p.hiring.rows : []
    ).forEach((r) => {
      const key = slug(cleanName(r.vendor || r.name || ''));
      if (r.siteLogo && key && !site[key]) site[key] = r.siteLogo;
    }));
    return (name, own) => {
      const key = slug(cleanName(name));
      if (BUNDLED.includes(key)) return logoPath(key);
      return own || site[key] || '';
    };
  }
  const vendorRow = (r, logo) => ({ rank: r.rank, delta: r.delta, name: r.name, logo: logo(r.name, r.siteLogo), detail: r.detail, score: r.score });

  // Single post for the company at `rank` in a ranking (rows as readMovers returns them).
  function fillSingle(rows, rank, logo, footer) {
    const f = rows.find((r) => +r.rank === +rank);
    if (!f) return null;
    const d = clone(SAMPLE.top1), n = '#' + f.rank;
    d.rank = f.rank; d.name = f.name; d.logo = logo(f.name, f.siteLogo); d.score = f.score; d.delta = f.delta;
    d.tagline = f.rank === '1' ? 'Tops the List'
      : /^↑/.test(f.delta) ? `Climbs to ${n}` : /^↓/.test(f.delta) ? `Slips to ${n}` : f.delta === 'new' ? `Enters at ${n}` : `Holds ${n}`;
    d.chart = rows.slice(0, 5).map((r) => r.score).join(', ');
    if (footer) d.footer = footer;
    return d;
  }
  const singleFooter = (page) => {
    const week = page.startups.week, yr = page.generated ? ' ' + page.generated.getUTCFullYear() : '';
    return `Source: aisocnews.com · Start-ups${week ? ', ' + week + yr : ''}`;
  };

  function fillTopList(page, start, logo) {
    const d = clone(SAMPLE.toplist);
    const rows = page.startups.rows.filter((r) => +r.rank >= start).slice(0, 5);
    if (!rows.length) return null;
    const end = rows[rows.length - 1].rank;
    d.context = `Agentic SOC Top 40 Movers${page.startups.week ? ' · ' + page.startups.week : ''}`;
    d.title = start === 1 ? 'Top Five Movers' : start === 6 ? 'Next Five to Watch' : `Movers Ranked ${start}–${end}`;
    d.subtitle = `Ranks ${rows[0].rank}–${end}`;
    d.rows = rows.map((r) => vendorRow(r, logo));
    return d;
  }

  // Returns { posts, notes, found } — posts falls back to the Figma sample copy for anything not found.
  function build(base, europe, days, fullMap) {
    const logo = makeLogoResolver([base, europe]);
    const posts = clone(SAMPLE), notes = [], found = {};
    const gen = base.generated;
    const week = base.startups.week || base.all.week;
    const miss = (label) => notes.push(`${label}: not found on the page, sample copy kept.`);

    // 1. market in numbers
    const c = base.counts;
    if (c.articles || c.voices || c.social) {
      const d = posts.numbers;
      if (gen) d.context = range(new Date(+gen - days * 864e5), gen, true);
      d.title = `${days} Days in the AI SOC Market`;
      if (base.vendors) d.subtitle = `${base.vendors} vendors tracked.`;
      [c.articles, c.voices, c.social, c.launches, c.moves, c.cases].forEach((v, i) => { d.stats[i].value = v || '–'; });
      // the page counts articles over its own window; say so when that is not the reporting period
      if (c.articlesDays && c.articlesDays !== days) d.stats[0].label = `articles in ${c.articlesDays} days`;
      found.numbers = true;
    } else miss('Market in numbers');

    // top 1 mover and top 4: the head of the start-up ranking
    const head = base.startups.rows;
    const yr = gen ? ' ' + gen.getUTCFullYear() : '';
    if (head.length) {
      posts.top1 = fillSingle(head, head[0].rank, logo, singleFooter(base));
      found.top1 = true;
      const four = head.slice(0, 4);
      if (week) posts.top4.context = `Week of ${week}${yr}`;
      posts.top4.tiles = four.map((r) => ({ rank: r.rank, name: r.name, logo: logo(r.name, r.siteLogo), score: r.score }));
      found.top4 = true;
      if (four.length < 4) notes.push(`Top 4: only ${four.length} vendor${four.length > 1 ? 's' : ''} on the page.`);

      // top 5 ranking (dark and light share the data) and the #1 finding
      const five = head.slice(0, 5);
      const words = ['', 'One is', 'Two are', 'Three are', 'Four are', 'All five are'];
      const fast = five.filter((r) => /^accelerating/i.test(r.trend)).length;
      ['rank5dark', 'rank5light'].forEach((key) => {
        const d = posts[key];
        if (!d) return;
        if (week) { d.context = `Week of ${week}${yr}`; d.footer = `Source: aisocnews.com · ${week}${yr}`; }
        d.title2 = `Top ${five.length} Movers`;
        d.subtitle = 'Start-ups ranked by 90-day momentum.' + (fast && five.length === 5 ? ` ${words[fast]} accelerating.` : '');
        d.rows = five.map((r) => Object.assign(vendorRow(r, logo), { stage: r.stage }));
        found[key] = true;
      });
      if (posts.split) {
        const f = head[0], d = posts.split;
        const verb = /^↑/.test(f.delta) ? 'Moves Up to' : f.delta === 'new' ? 'Enters at' : 'Holds';
        d.name = f.name; d.logo = logo(f.name, f.siteLogo); d.score = f.score;
        d.chip = base.map.categories[slug(f.name)] || ''; // the vendor's category on the map; no chip if unknown
        d.title = `${f.name} ${verb} #${f.rank} Among Agentic SOC Start-ups`;
        if (week) d.scoreLabel = `Momentum score, week of ${week}${yr}`;
        d.rows = five.map((r) => ({ rank: r.rank, name: r.name, logo: logo(r.name, r.siteLogo), score: r.score }));
        found.split = true;
      }
    } else { miss('Top mover'); miss('Top 4'); }

    // every vendor name the page mentions, longest first, to spot vendors inside free text
    const names = Array.from(new Set([].concat(
      base.all.rows, base.startups.rows, base.moves, base.launches, base.cases, base.discussed, base.hiring ? base.hiring.rows : []
    ).map((r) => r.vendor || r.name).filter(Boolean))).sort((a, b) => b.length - a.length);
    const vendorAtStart = (t) => names.find((n) => t.toLowerCase().startsWith(n.toLowerCase() + ' ')) || '';
    const vendorsIn = (t) => names.filter((n) => new RegExp('(^|[^A-Za-z0-9])' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^A-Za-z0-9]|$)').test(t));
    const span = (list) => { const ds = list.map((r) => r.date).filter(Boolean).sort((a, b) => a - b); return ds.length ? range(ds[0], ds[ds.length - 1], true) : ''; };

    // product launches: the three newest
    if (posts.launches && base.launches.length) {
      const d = posts.launches, picks = base.launches.slice(0, 3);
      if (span(picks)) d.context = `Product launches · ${span(picks)}`;
      d.rows = picks.map((r) => ({ name: r.vendor, logo: logo(r.vendor, r.siteLogo), chip: r.kind, date: fullDate(r.date), title: r.title, detail: r.summary }));
      d.footer = 'Source: aisocnews.com · Product launches' + (picks.every((r) => /vendor sources only/i.test(r.provenance)) ? ', vendor sources only' : '');
      found.launches = true;
    } else if (posts.launches) miss('Launches');

    // most covered: the two subjects with the most articles in the last 7 days
    if (posts.covered && base.subjects.length) {
      const d = posts.covered;
      d.cards = base.subjects.slice(0, 2).map((r) => {
        // a vendor the page ranks, else the leading name: one word, or two when the second is an ordinary capitalised word
        const w = r.name.split(' ');
        const v = vendorAtStart(r.name) || (w[1] && /^[A-Z][a-z]+$/.test(w[1]) && !/^(Agentic|Security)$/.test(w[1]) ? w[0] + ' ' + w[1] : w[0]);
        const rest = r.name.slice(v.length).trim();
        return { name: v, logo: logo(v, ''), value: r.value, valueLabel: 'articles in 7 days', detail: rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : '', chip: r.change ? `${r.change} its 30-day pace` : '' };
      });
      if (c.articles) d.footer = `Source: aisocnews.com · From ${c.articles} articles over the last ${c.articlesDays || days} days`;
      found.covered = true;
    } else if (posts.covered) miss('Most covered');

    // our analysis: the newest long-form piece; market brief: the newest note
    const piece = base.analysis.find((a) => !/note/i.test(a.kind)), note = base.analysis.find((a) => /note/i.test(a.kind));
    if (posts.analysis && piece) {
      const d = posts.analysis, ss = sentences(piece.summary).map((x) => x.trim());
      const money = /\$?\s?(\d[\d.,]*)\s*(million|billion|bn|m|b)\b(\s+dollars?)?/i;
      const hit = ss.find((x) => money.test(x));
      d.context = `Our analysis${piece.date ? ' · ' + fullDate(piece.date) : ''}`;
      d.title = titleCase(sentences(piece.title)[0].replace(/[.!?]+$/, '').trim());
      d.vendors = vendorsIn(piece.summary).slice(0, 4).map((n) => ({ name: n, logo: logo(n, '') }));
      if (hit) {
        const m = hit.match(money);
        d.value = '$' + m[1] + (/^b/i.test(m[2]) ? 'B' : 'M');
        d.detail = hit;
        d.note = ss.find((x) => x !== hit) || '';
      } else { d.value = ''; d.detail = ss[0] || ''; d.note = ss[1] || ''; notes.push('Our analysis: no headline figure found in the summary. Add one in the Number field.'); }
      d.footer = `By ${piece.by || 'the Cyberfuturists'} · aisocnews.com`;
      found.analysis = true;
    } else if (posts.analysis) miss('Our analysis');
    if (posts.brief && note) {
      const d = posts.brief, first = (sentences(note.summary)[0] || '').trim();
      const v = vendorAtStart(first);
      const paren = first.match(/\(([^)]{2,24})\)/);
      const head1 = first.replace(/\s*\([^)]*\)/g, '').split(/\s+(?:and|through|via|with)\s+|,/)[0].replace(/[.!?]+$/, '');
      const fig = note.summary.match(/(\d[\d,.]*\+)\s+([a-z][a-z -]{3,40}?)(?=\s+(?:including|across|in|and)\b|[.,…]|$)/i);
      d.context = `AI SOC market brief${note.date ? ' · ' + fullDate(note.date) : ''}`;
      d.title = titleCase(head1);
      d.name = v; d.logo = v ? logo(v, '') : '';
      d.chip = paren ? paren[1] : '';
      if (fig) { d.value = fig[1]; d.detail = fig[2].trim() + (/claims?/i.test(note.summary) ? ',\nas claimed by the vendor' : ''); }
      else { d.value = ''; d.detail = ''; notes.push('Market brief: no headline figure found in the summary. Add one in the Number field.'); }
      d.footer = `By ${note.by || 'the Cyberfuturists'} · aisocnews.com`;
      found.brief = true;
    } else if (posts.brief) miss('Market brief');

    // thought leadership: the newest vendor post, as a single quote
    if (posts.thought && base.voices.length) {
      const d = posts.thought, r = base.voices[0];
      d.context = `Thought leadership${r.date ? ' · ' + fullDate(r.date) : ''}`;
      d.name = r.who; d.logo = logo(r.who, '');
      d.source = r.platform ? `on ${r.platform}` : '';
      d.quote = '“' + firstSentence(r.quote, 130) + '”';
      d.chip = 'Vendor claim'; d.note = '';
      found.thought = true;
    } else if (posts.thought) miss('Thought leadership');

    // maturity arc: every start-up's dot from the site's own map, the ten best-ranked numbered
    const whole = fullMap && fullMap.dots.length ? fullMap : null;
    const mapDots = ((whole || base.map).dots || []).filter((p) => isFinite(p.x) && isFinite(p.y));
    if (posts.arc && mapDots.length) {
      const d = posts.arc, from = (whole || base.map).arc, to = (window.PostTemplates.TEMPLATES.find((t) => t.key === 'arc') || {}).arc || { cx: 540, cy: 812, r: 452 };
      const k = to.r / from.r, at = (p) => [to.cx + (p.x - from.cx) * k, to.cy + (p.y - from.cy) * k];
      const ranked = mapDots.slice().sort((a, b) => (a.rank || 1e9) - (b.rank || 1e9));
      const top = ranked.filter((p) => p.rank).slice(0, 10);
      d.partial = !whole; // the report view could not be read: only the dashboard's top 40 are drawn
      d.subtitle = `${mapDots.length} vendors placed by size, growth and momentum.`;
      d.dots = ranked.filter((p) => !top.includes(p)).map((p) => at(p).map((v) => Math.round(v * 100) / 100));
      d.top = top.map((p, i) => { const xy = at(p); return { rank: String(i + 1), name: p.name, logo: logo(p.name, ''), x: Math.round(xy[0] * 100) / 100, y: Math.round(xy[1] * 100) / 100 }; });
      d.footer = `Source: aisocnews.com · Start-ups${gen ? ', computed ' + fullDate(gen) : ''}`;
      found.arc = true;
      if (top.length < 10) notes.push(`Maturity arc: only ${top.length} ranked vendors on the map.`);
    } else if (posts.arc) miss('Maturity arc');

    // hiring: top vendors by open roles
    const hire = base.hiring;
    if (posts.hiring && hire && hire.rows.length) {
      const d = posts.hiring;
      if (hire.total) d.stat = hire.total;
      if (hire.listing) d.statLabel = `open roles across ${hire.listing[0]} of ${hire.listing[1]} tracked vendors`;
      d.subtitle = `Top ${Math.min(5, hire.rows.length)} vendors by open roles`;
      d.rows = hire.rows.slice(0, 5).map((r) => ({
        name: r.name, logo: logo(r.name, r.siteLogo), total: r.roles,
        engineering: r.split.engineering || '', sales: r.split.sales || '', marketing: r.split.marketing || '', other: r.split.other || ''
      }));
      d.footer = `Source: aisocnews.com · Job listings open now${gen ? ', ' + fullDate(gen) : ''}`;
      found.hiring = true;
    } else if (posts.hiring) miss('Hiring');

    // most discussed: earned mentions, this period against the one before
    if (posts.discussed && base.discussed.length) {
      posts.discussed.rows = base.discussed.slice(0, 5).map((r) => ({ name: r.name, logo: logo(r.name, r.siteLogo), previous: num(r.note) || '0', current: r.value }));
      found.discussed = true;
    } else if (posts.discussed) miss('Most discussed');

    // case study: the newest one; the three-step diagram needs a person
    if (posts.casestudy && base.cases.length) {
      const d = posts.casestudy, r = base.cases[0];
      const same = r.title.toLowerCase() === d.title.toLowerCase();
      d.context = `Case study${r.date ? ' · ' + fullDate(r.date) : ''}`;
      d.title = titleCase(r.title);
      d.name = r.vendor; d.logo = logo(r.vendor, r.siteLogo);
      d.summary = r.summary;
      d.footer = 'Source: aisocnews.com' + (r.sources ? ` · ${r.sources}` : '') + (r.provenance && r.provenance !== r.sources ? `, ${r.provenance.charAt(0).toLowerCase() + r.provenance.slice(1)}` : '');
      if (!same) {
        d.steps = [{ text: 'Before', label: 'Input' }, { text: r.vendor, label: 'Platform' }, { text: 'After', label: 'Outcome' }];
        notes.push('Case study: write the three steps of the diagram; the page only gives the headline and summary.');
      }
      found.casestudy = true;
    } else if (posts.casestudy) miss('Case study');

    // market moves: the newest three, one per vendor
    if (posts.moves && base.moves.length) {
      const d = posts.moves, seen = new Set();
      const picks = base.moves.filter((r) => !seen.has(r.vendor) && seen.add(r.vendor)).slice(0, 3);
      if (span(picks)) d.context = `Market moves · ${span(picks)}`;
      d.items = picks.map((r) => ({ name: r.vendor, logo: logo(r.vendor, r.siteLogo), chip: r.kind, date: fullDate(r.date), headline: r.title, detail: r.summary }));
      d.footer = 'Source: aisocnews.com · Market moves' + (picks.every((r) => /vendor sources only/i.test(r.provenance)) ? ', vendor sources only' : '');
      found.moves = true;
      if (picks.length < 3) notes.push(`Market moves: only ${picks.length} on the page.`);
    } else if (posts.moves) miss('Market moves');

    // 2. top movers
    const top = fillTopList(base, 6, logo) || fillTopList(base, 1, logo);
    if (top) { posts.toplist = top; found.toplist = true; } else miss('Top movers');

    // 3. European movers
    const eu = europe ? europe.startups.rows.slice(0, 3) : [];
    if (eu.length) {
      const d = posts.europe;
      d.context = `European vendors${europe.startups.week ? ' · ' + europe.startups.week : ''}`;
      d.cards = eu.map((r) => ({
        name: r.name, logo: logo(r.name, r.siteLogo), sub: `#${r.rank} overall${r.delta ? ' · ' + r.delta : ''}`,
        score: r.score, scoreLabel: 'momentum', chip: r.stage, detail: r.detail
      }));
      found.europe = true;
      if (eu.length < 3) notes.push(`European movers: only ${eu.length} vendor${eu.length > 1 ? 's' : ''} on the page.`);
    } else miss('European movers');

    // 4. incumbents
    const all = base.all.rows, incs = all.filter((r) => r.kind);
    if (incs.length) {
      const d = posts.incumbent, f = incs[0];
      const top5 = all.slice(0, 5);
      const n = top5.filter((r) => r.kind).length;
      const words = ['No', 'One', 'Two', 'Three', 'Four', 'Five'];
      d.context = `Agentic SOC Top 40${week ? ' · ' + week : ''}`;
      d.title = n ? `${words[n]} Incumbent${n > 1 ? 's' : ''} in the Top 5` : `The Top Incumbent Ranks #${f.rank}`;
      d.feature = { name: f.name, logo: logo(f.name, f.siteLogo), chip: f.kind, rank: '#' + f.rank, line1: `Momentum ${f.score}`, line2: f.detail };
      const rows = top5.includes(f) ? top5 : top5.slice(0, 4).concat(f);
      d.rows = rows.map((r) => ({ rank: r.rank, name: r.name, logo: logo(r.name, r.siteLogo), score: r.score, highlight: r === f }));
      found.incumbent = true;
    } else miss('Incumbents');

    // 5. maturity map: this week's top-ranked start-ups, grouped by stage
    const staged = base.startups.rows.filter((r) => r.stage);
    if (staged.length) {
      const d = posts.maturity;
      if (gen) d.context = `Market Maturity Map · ${range(gen, null, true)}`;
      if (base.map.mapped) d.subtitle = `${base.map.mapped[0]} of ${base.map.mapped[1]} vendors mapped.`;
      const fl = base.map.flags;
      if (fl.total) {
        d.highlights[0].value = String(fl.innovating);
        d.highlights[1].value = String(fl.hiring);
        d.highlights[2].value = String(fl.funded);
      }
      d.stages = STAGES.map((label, i) => ({
        label,
        vendors: staged.slice(0, 13).filter((r) => r.stage === label).slice(0, STAGE_CAP[i])
          .map((r) => ({ name: r.name, logo: logo(r.name, r.siteLogo) }))
      }));
      found.maturity = true;
    } else miss('Maturity map');

    // 6. analyst radar
    if (base.research.length) {
      const d = posts.radar, picks = base.research.filter((r) => r.vendors.length).slice(0, 2);
      const dates = picks.map((r) => r.date).filter(Boolean).sort((a, b) => a - b);
      if (dates.length) d.context = `Research firms · ${monthRange(dates[0], dates[dates.length - 1])}`;
      d.cards = picks.map((r) => ({
        chip: r.firm + (r.date ? ' · ' + dm(r.date) : ''),
        title: r.title.replace(new RegExp('^' + r.firm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[:\\s]+', 'i'), '').replace(/^[“"]|[”"]$/g, ''),
        label: r.label || 'Cited by',
        vendors: r.vendors.map((v) => {
          const m = v.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
          const name = m ? m[1] : v;
          return { name: m ? `${name} · ${sentenceCase(m[2])}` : name, logo: logo(name, '') };
        }).sort((a, b) => b.name.includes(' · ') - a.name.includes(' · '))
      }));
      found.radar = true;
      if (picks.length < 2) notes.push('Analyst radar: only one report with named vendors on the page.');
    } else miss('Analyst radar');

    // 7. practitioner pulse
    if (base.social.length) {
      const d = posts.pulse, picks = base.social.slice(0, 3);
      const dates = picks.map((r) => r.date).filter(Boolean).sort((a, b) => a - b);
      if (dates.length) d.context = `Social · ${range(dates[0], dates[dates.length - 1])}`;
      d.title = 'What SOC Practitioners Are Saying';
      d.items = picks.map((r) => ({ text: firstSentence(r.quote, 120) }));
      d.chip = 'From public posts';
      d.footer = `Source: aisocnews.com${c.social ? ` · ${c.social} practitioner posts in ${days} days` : ''}`;
      found.pulse = true;
      notes.push('Practitioners: the statements are the posts’ own first sentences. Paraphrase them before posting.');
    } else miss('Practitioners');

    // 8. vendor debates
    if (base.voices.length) {
      const d = posts.debates, seen = new Set();
      const picks = base.voices.filter((r) => !seen.has(r.who) && seen.add(r.who)).slice(0, 2);
      const dates = picks.map((r) => r.date).filter(Boolean).sort((a, b) => a - b);
      if (dates.length) d.context = `Thought leadership · ${range(dates[0], dates[dates.length - 1], true)}`;
      d.cards = picks.map((r) => ({
        chip: 'Thought leadership', name: r.who, logo: logo(r.who, ''),
        quote: '“' + firstSentence(r.quote, 150) + '”', source: `Vendor claim${r.platform ? ' · ' + r.platform : ''}`
      }));
      found.debates = true;
      notes.push('Vendor debates: set each card’s topic chip; the page does not name the topic.');
    } else miss('Vendor debates');

    return { posts, notes, found };
  }

  // Which post to show first for a given link.
  function pick(url) {
    const p = url.searchParams, section = p.get('section') || '';
    if (p.get('region') === 'europe') return 'europe';
    if (section === 'social') return 'pulse';
    if (section === 'voices') return 'debates';
    if (section === 'research') return 'radar';
    const bySection = { moves: 'moves', launches: 'launches', cases: 'casestudy', analysis: 'analysis', hiring: 'hiring', wider: 'numbers' };
    if (bySection[section]) return bySection[section];
    if (/mm-/.test(url.hash)) return 'maturity';
    return 'top1';
  }

  window.PostExtract = { fullDate, readArcMap, readPage, build, pick, fillTopList, fillSingle, singleFooter, makeLogoResolver, SAMPLE_TOP5 };
})();
