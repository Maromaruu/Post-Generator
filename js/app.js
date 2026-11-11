// App: paste a link, read the page, pick the post, edit any field, export PNG.
(function () {
  const { W, sizeOf, TEMPLATES, SAMPLE, STATIC_ASSETS, draw } = window.PostTemplates;
  const Extract = window.PostExtract;
  const $ = (id) => document.getElementById(id);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  const canvas = $('banner');
  const ctx = canvas.getContext('2d');
  const tplOf = (key) => TEMPLATES.find((t) => t.key === key);
  let current = TEMPLATES[0].key;
  let group = TEMPLATES[0].group;
  let posts = clone(SAMPLE);      // what is on screen, edited by the fields
  let page = null;                // last page read: { base, europe, days, logo }
  let filled = {};                // which posts the last page filled
  let topStart = 6;                // first rank on the ranked list
  let singleRank = 1;              // company on the single post

  // ---------- images ----------
  const images = new Map();
  function loadImage(src) {
    let rec = images.get(src);
    if (!rec) {
      const image = new Image();
      rec = { image, ready: false, promise: null };
      rec.promise = new Promise((resolve) => {
        image.onload = () => { rec.ready = true; resolve(); scheduleRender(); };
        image.onerror = () => resolve();
      });
      image.src = src;
      images.set(src, rec);
    }
    return rec;
  }
  const getImage = (src) => { const rec = loadImage(src); return rec.ready ? rec.image : null; };
  function logosIn(data) {
    const out = [];
    (function walk(o) {
      if (!o || typeof o !== 'object') return;
      if (typeof o.logo === 'string' && o.logo) out.push(o.logo);
      Object.values(o).forEach(walk);
    })(data);
    return out;
  }

  // ---------- render ----------
  let queued = false;
  function scheduleRender() {
    refreshThumbs();
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; render(); });
  }
  function render() {
    const size = sizeOf(current);
    if (canvas.height !== size.h) canvas.height = size.h;
    $('canvasSizeLabel').textContent = `${size.w} × ${size.h} · PNG`;
    const warnings = draw(ctx, current, posts[current], getImage);
    if (page && !filled[current]) warnings.unshift('Not found on the page: this post still shows the Figma sample copy, not live data.');
    const box = $('warnings');
    box.replaceChildren();
    if (warnings.length) {
      const ul = el('ul');
      warnings.forEach((w) => ul.appendChild(el('li', null, w)));
      box.appendChild(ul);
    }
    box.style.display = warnings.length ? '' : 'none';
  }

  // ---------- fields ----------
  const T = (key, label, opts) => Object.assign({ type: 'text', key, label }, opts);
  const LOGO = { type: 'logo', key: 'logo', label: 'Logo' };
  // the header label, title and subtitle come from the website and have no fields
  const FOOTER = T('footer', 'Footer');
  const FIELDS = {
    top1: [{ type: 'single' }, T('name', 'Company'), LOGO, T('tagline', 'Second title line'), T('score', 'Momentum, 0–100'), T('delta', 'Change since last week'),
      T('chart', 'Top 5 momentum, in rank order'), T('chartLabel', 'Chart caption'), FOOTER],
    top4: [
      { type: 'group', key: 'tiles', label: 'Tile', note: (o) => o.name, fields: [T('name', 'Company'), LOGO, T('rank', 'Rank'), T('score', 'Momentum, 0–100')] }],
    numbers: [
      { type: 'group', key: 'stats', label: 'Number', note: (o) => [o.value, o.label].filter(Boolean).join(' '), fields: [T('value', 'Number'), T('label', 'Label')] },
      FOOTER],
    toplist: [{ type: 'ranks' },
      { type: 'group', key: 'rows', label: 'Row', note: (o) => o.name, fields: [T('name', 'Company'), LOGO, T('rank', 'Rank'), T('delta', 'Change since last week'), T('detail', 'Detail'), T('score', 'Momentum, 0–100')] },
      FOOTER],
    europe: [
      { type: 'group', key: 'cards', label: 'Card', note: (o) => o.name, fields: [T('name', 'Company'), LOGO, T('sub', 'Rank line'), T('score', 'Number'), T('scoreLabel', 'Number label'), T('chip', 'Stage chip'), T('detail', 'Detail', { area: true })] },
      FOOTER],
    incumbent: [
      { type: 'object', key: 'feature', label: 'Featured company', note: (o) => o.name, fields: [T('name', 'Company'), LOGO, T('chip', 'Chip'), T('rank', 'Rank'), T('line1', 'First line'), T('line2', 'Second line')] },
      { type: 'group', key: 'rows', label: 'Row', note: (o) => o.name, fields: [T('name', 'Company'), LOGO, T('rank', 'Rank'), T('score', 'Momentum, 0–100'), { type: 'check', key: 'highlight', label: 'Highlight this row' }] },
      FOOTER],
    maturity: [
      { type: 'group', key: 'highlights', label: 'Highlight', note: (o) => [o.value, o.label].filter(Boolean).join(' '), fields: [T('value', 'Number'), T('label', 'Label')] },
      { type: 'group', key: 'stages', label: 'Stage', note: (o) => o.label, fields: [T('label', 'Stage name'), { type: 'vendors', key: 'vendors', label: 'Companies' }] },
      FOOTER],
    radar: [
      { type: 'group', key: 'cards', label: 'Report', note: (o) => o.chip, fields: [T('chip', 'Firm and date chip'), T('title', 'Report title', { area: true }), T('label', 'Label above the companies'), { type: 'vendors', key: 'vendors', label: 'Companies' }] },
      FOOTER],
    pulse: [
      { type: 'group', key: 'items', label: 'Statement', note: (o) => o.text, fields: [T('text', 'Statement', { area: true })] },
      T('chip', 'Chip'), FOOTER],
    debates: [
      { type: 'group', key: 'cards', label: 'Card', note: (o) => o.name, fields: [T('chip', 'Topic chip'), T('name', 'Company'), LOGO, T('quote', 'Quote', { area: true }), T('source', 'Source line')] },
      FOOTER]
  };

  let uploadTarget = null;
  function initialsOf(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    return !parts.length ? '' : (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase();
  }
  function paintTile(tile, obj) {
    tile.replaceChildren();
    if (obj.logo) { const i = el('img'); i.src = obj.logo; i.alt = ''; tile.appendChild(i); }
    else tile.textContent = initialsOf(obj.name);
  }
  function pickLogo(obj, tile) {
    uploadTarget = { obj, tile };
    $('uploadInput').value = '';
    $('uploadInput').click();
  }
  // when a company is renamed, swap in its known logo (unless the logo was uploaded by hand)
  function relinkLogo(obj, tile) {
    if (obj._uploaded || !('logo' in obj)) return;
    const name = String(obj.name || '').split(' · ')[0];
    const resolve = page ? page.logo : Extract.makeLogoResolver([]);
    obj.logo = resolve(name, '');
    if (tile) paintTile(tile, obj);
  }

  function textField(def, obj, onChange) {
    const wrap = el('div', 'field');
    const id = 'f' + Math.random().toString(36).slice(2, 9);
    const label = el('label', null, def.label);
    label.htmlFor = id;
    const input = el(def.area ? 'textarea' : 'input');
    if (!def.area) input.type = 'text';
    input.id = id;
    input.value = obj[def.key] == null ? '' : obj[def.key];
    input.addEventListener('input', () => { obj[def.key] = input.value; if (onChange) onChange(def.key); scheduleRender(); });
    wrap.append(label, input);
    return wrap;
  }
  function logoField(obj) {
    const wrap = el('div', 'field');
    wrap.appendChild(el('label', null, 'Logo'));
    const row = el('div', 'logo-row');
    const tile = el('span', 'logo-tile');
    paintTile(tile, obj);
    const btn = el('button', 'upload-btn', 'Upload logo');
    btn.type = 'button';
    btn.addEventListener('click', () => pickLogo(obj, tile));
    row.append(tile, btn);
    wrap.appendChild(row);
    wrap._tile = tile;
    return wrap;
  }
  function vendorsField(def, obj) {
    const wrap = el('div', 'field');
    wrap.appendChild(el('label', null, def.label));
    const list = el('div');
    const add = el('button', 'forget-link', 'Add a company');
    add.type = 'button';
    function paint() {
      list.replaceChildren();
      obj[def.key].forEach((v, i) => {
        const row = el('div', 'vendor-row');
        const tile = el('span', 'logo-tile');
        tile.title = 'Upload logo';
        tile.addEventListener('click', () => pickLogo(v, tile));
        paintTile(tile, v);
        const input = el('input');
        input.type = 'text'; input.value = v.name || ''; input.placeholder = 'Company';
        input.addEventListener('input', () => { v.name = input.value; relinkLogo(v, tile); scheduleRender(); });
        const remove = el('button', 'icon-btn');
        remove.type = 'button'; remove.title = 'Remove';
        remove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
        remove.addEventListener('click', () => { obj[def.key].splice(i, 1); paint(); scheduleRender(); });
        row.append(tile, input, remove);
        list.appendChild(row);
      });
    }
    add.addEventListener('click', () => { obj[def.key].push({ name: '', logo: '' }); paint(); scheduleRender(); });
    paint();
    wrap.append(list, add);
    return wrap;
  }
  function checkField(def, obj) {
    const label = el('label', 'remember-row');
    const input = el('input');
    input.type = 'checkbox'; input.checked = !!obj[def.key];
    input.addEventListener('change', () => { obj[def.key] = input.checked; scheduleRender(); });
    label.append(input, document.createTextNode(' ' + def.label));
    const wrap = el('div', 'field');
    wrap.appendChild(label);
    return wrap;
  }
  function fold(title, noteOf, obj, fields) {
    const details = el('details', 'field key-fold');
    const summary = el('summary', 'key-fold-summary');
    const note = el('span', 'fold-note');
    const paintNote = () => { note.textContent = !noteOf ? '' : typeof noteOf === 'function' ? (noteOf(obj) || '') : (obj[noteOf] || ''); };
    summary.append(document.createTextNode(title), note);
    paintNote();
    const body = el('div', 'fold-body');
    let tile = null;
    fields.forEach((f) => {
      let node;
      if (f.type === 'logo') { node = logoField(obj); tile = node._tile; }
      else if (f.type === 'vendors') node = vendorsField(f, obj);
      else if (f.type === 'check') node = checkField(f, obj);
      else node = textField(f, obj, (key) => { paintNote(); if (key === 'name') relinkLogo(obj, tile); });
      body.appendChild(node);
    });
    details.append(summary, body);
    return details;
  }
  // a labelled strip of chips; `pick(value)` runs on click
  function chipsField(label, options, active, pick) {
    const wrap = el('div', 'field');
    wrap.appendChild(el('label', null, label));
    const strip = el('div', 'size-chips');
    options.forEach((o) => {
      const chip = el('button', 'chip' + (o.value === active ? ' active' : ''), o.label);
      chip.type = 'button';
      if (o.attr) chip.setAttribute(o.attr[0], o.attr[1]);
      chip.addEventListener('click', () => pick(o.value, chip));
      strip.appendChild(chip);
    });
    wrap.appendChild(strip);
    return wrap;
  }
  // Rank chips need the live ranking. If no page has been read yet, read aisocnews.com first.
  async function needPage() {
    if (page) return true;
    if (!$('url').value.trim()) $('url').value = 'https://aisocnews.com/';
    await readLink({ stay: true });
    return !!page;
  }
  function ranksField() {
    const options = [];
    for (let start = 1; start <= 36; start += 5) options.push({ value: start, label: `${start}–${start + 4}` });
    return chipsField('Ranks shown', options, topStart, async (start) => {
      if (!(await needPage())) return;
      const filled = Extract.fillTopList(page.base, start, page.logo);
      if (!filled) { setStatus(`The page has no ranks ${start}–${start + 4}.`, true); return; }
      topStart = start;
      posts.toplist = filled;
      if (current === 'toplist') show('toplist');
    });
  }
  // The single post exists for each of the top five; before a page is read it uses the Figma sample ranking.
  function singleField() {
    const options = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: '#' + n }));
    return chipsField('Company shown', options, singleRank, (rank) => {
      const filled = page
        ? Extract.fillSingle(page.base.startups.rows, rank, page.logo, Extract.singleFooter(page.base))
        : Extract.fillSingle(Extract.SAMPLE_TOP5, rank, Extract.makeLogoResolver([]));
      if (!filled) { setStatus(`The page has no rank ${rank}.`, true); return; }
      singleRank = rank;
      posts.top1 = filled;
      show('top1');
    });
  }
  // Only company names and logos are editable; every other value comes from the website as it is.
  // (The rank choosers stay: they pick which website rows a post shows.)
  // The exception is content the website does not have at all, which someone has to write:
  const WRITTEN = {
    pulse: ['items.text'],                         // the three paraphrased statements
    debates: ['cards.chip'],                       // the topic chip on each card
    casestudy: ['steps.text', 'steps.label']       // the three steps of the diagram
  };
  function companyFields(fields, path) {
    const out = [], open = WRITTEN[current] || [];
    fields.forEach((f) => {
      const at = (path ? path + '.' : '') + (f.key || '');
      if (f.type === 'logo' || f.type === 'vendors' || f.type === 'ranks' || f.type === 'single') out.push(f);
      else if (f.type === 'text' && f.key === 'name') out.push(Object.assign({}, f, { label: 'Company' }));
      else if (f.type === 'text' && open.includes(at)) out.push(f);
      else if (f.type === 'group' || f.type === 'object') {
        const inner = companyFields(f.fields || [], at);
        if (inner.length) out.push(Object.assign({}, f, { fields: inner }));
      }
    });
    return out;
  }
  function buildFields() {
    const root = $('fields'), data = posts[current];
    root.replaceChildren();
    companyFields(FIELDS[current] || tplOf(current).fields || []).forEach((f) => {
      if (f.type === 'text') root.appendChild(textField(f, data, (key) => { if (key === 'name') relinkLogo(data, root._tile); }));
      else if (f.type === 'logo') { const node = logoField(data); root._tile = node._tile; root.appendChild(node); }
      else if (f.type === 'ranks') root.appendChild(ranksField());
      else if (f.type === 'single') root.appendChild(singleField());
      else if (f.type === 'check') root.appendChild(checkField(f, data));
      else if (f.type === 'vendors') root.appendChild(vendorsField(f, data));
      else if (f.type === 'object') root.appendChild(fold(f.label, f.note || f.noteKey, data[f.key], f.fields));
      else if (f.type === 'group') data[f.key].forEach((item, i) => root.appendChild(fold(`${f.label} ${i + 1}`, f.note || f.noteKey, item, f.fields)));
    });
  }
  $('uploadInput').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !uploadTarget) return;
    const reader = new FileReader();
    const { obj, tile } = uploadTarget;
    reader.onload = () => {
      obj.logo = String(reader.result);
      obj._uploaded = true;
      paintTile(tile, obj);
      scheduleRender();
    };
    reader.readAsDataURL(file);
  });

  // ---------- tabs ----------
  // Categories in the header; the posts of the current category are chips at the top of the panel.
  const GROUPS = ['Movers', 'Market', 'Analysis', 'Voices'].filter((g) => TEMPLATES.some((t) => t.group === g));
  const lastIn = {};
  function show(key) {
    current = key;
    group = tplOf(key).group;
    lastIn[group] = key;
    nav.setActive(GROUPS.indexOf(group));
    buildStrip();
    buildFields();
    render();
  }

  // ---------- post picker: a strip of live thumbnails for the current category ----------
  const thumbStage = document.createElement('canvas');
  const thumbs = new Map(); // key -> small canvas
  let stripGroup = null;
  function paintThumb(key) {
    const small = thumbs.get(key);
    if (!small) return;
    const size = sizeOf(key);
    thumbStage.width = size.w; thumbStage.height = size.h;
    draw(thumbStage.getContext('2d'), key, posts[key], getImage);
    const c = small.getContext('2d');
    c.imageSmoothingQuality = 'high';
    c.clearRect(0, 0, small.width, small.height);
    c.drawImage(thumbStage, 0, 0, small.width, small.height);
  }
  function buildStrip() {
    const strip = $('postStrip');
    if (stripGroup !== group) {
      stripGroup = group;
      thumbs.clear();
      strip.replaceChildren();
      TEMPLATES.filter((t) => t.group === group).forEach((t) => {
        const size = sizeOf(t.key);
        const btn = el('button', 'post-thumb');
        btn.type = 'button';
        btn.setAttribute('role', 'tab');
        btn.setAttribute('data-post', t.key);
        const small = document.createElement('canvas');
        small.height = 144; small.width = Math.round(144 * size.w / size.h);
        thumbs.set(t.key, small);
        btn.append(small, el('span', null, t.label));
        btn.addEventListener('click', () => show(t.key));
        strip.appendChild(btn);
      });
      refreshThumbs(0);
    }
    strip.querySelectorAll('.post-thumb').forEach((b) => {
      const on = b.getAttribute('data-post') === current;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
      if (on && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }
  let thumbTimer = null;
  function refreshThumbs(delay) {
    clearTimeout(thumbTimer);
    thumbTimer = setTimeout(() => { thumbs.forEach((_, key) => paintThumb(key)); render(); }, delay == null ? 350 : delay);
  }
  const nav = createPillNav($('templateTabs'), {
    items: GROUPS.map((g) => ({ key: g, label: g })),
    activeIndex: 0,
    onSelect(item) { show(lastIn[item.key] || TEMPLATES.find((t) => t.group === item.key).key); }
  });

  // ---------- read a page ----------
  function setStatus(message, error) {
    const s = $('status');
    s.textContent = message || '';
    s.classList.toggle('error', !!error);
  }
  async function fetchPage(url) {
    const r = await fetch('/api/fetch?url=' + encodeURIComponent(url));
    const body = await r.text();
    if (!r.ok) throw new Error(body || 'The page could not be read.');
    return body;
  }
  // opts.stay keeps the current post on screen instead of jumping to the one the link points at
  async function readLink(opts) {
    const stay = opts && opts.stay === true;
    let raw = $('url').value.trim();
    if (!raw) { setStatus('Paste an aisocnews.com link first.', true); return; }
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
    let url;
    try { url = new URL(raw); } catch { setStatus('That does not look like a link.', true); return; }
    if (!/^(www\.)?aisocnews\.com$/i.test(url.hostname)) { setStatus('Only aisocnews.com links are supported.', true); return; }
    const days = [7, 30, 90].includes(+url.searchParams.get('days')) ? +url.searchParams.get('days') : 30;
    const base = `https://aisocnews.com/?days=${days}&view=v2`;
    const btn = $('fetchBtn');
    btn.disabled = true;
    setStatus('Reading the page…');
    try {
      // the European ranking lives on its own view of the same page
      // (and the full maturity map only on the report view)
      const [baseHtml, euHtml, reportHtml] = await Promise.all([
        fetchPage(base), fetchPage(base + '&region=europe').catch(() => ''),
        fetchPage(`https://aisocnews.com/?days=${days}&view=report`).catch(() => '')
      ]);
      const basePage = Extract.readPage(baseHtml);
      const euPage = euHtml ? Extract.readPage(euHtml) : null;
      const built = Extract.build(basePage, euPage, days, reportHtml ? Extract.readArcMap(reportHtml) : null);
      filled = built.found;
      const count = Object.keys(built.found).length;
      if (!count) throw new Error('No post data was found on that page.');
      posts = built.posts;
      page = { base: basePage, europe: euPage, days, logo: Extract.makeLogoResolver([basePage, euPage]) };
      topStart = +posts.toplist.rows[0].rank || 6;
      singleRank = +posts.top1.rank || 1;
      stripGroup = null; // new data: redraw the thumbnails
      show(stay ? current : Extract.pick(url));
      // when the site last updated its data, and when this tool read it
      const now = new Date(), two = (n) => String(n).padStart(2, '0');
      const siteDate = basePage.generated ? Extract.fullDate(basePage.generated) + (basePage.generatedTime ? ', ' + basePage.generatedTime : '') : '';
      $('updated').textContent = (siteDate ? `Site data last updated ${siteDate}. ` : '') + `Read ${Extract.fullDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())))}, ${two(now.getHours())}:${two(now.getMinutes())}.`;
      $('updated').hidden = false;
      // say something only when a post could not be filled and still shows the Figma sample copy
      const kept = TEMPLATES.filter((t) => !built.found[t.key]).map((t) => t.label);
      setStatus(kept.length ? `Not found on the page, still showing sample copy: ${kept.join(', ')}.` : '', kept.length > 0);
      $('sourceInfo').textContent = `Filled from aisocnews.com, last ${days} days. Check each post before exporting.`;
    } catch (e) {
      setStatus(e.message || String(e), true);
    } finally {
      btn.disabled = false;
    }
  }
  $('fetchBtn').addEventListener('click', () => readLink());
  $('url').addEventListener('keydown', (e) => { if (e.key === 'Enter') readLink(); });
  // pasting a link reads it straight away
  $('url').addEventListener('paste', () => setTimeout(() => readLink(), 0));

  // ---------- export ----------
  const stamp = () => new Date().toISOString().slice(0, 10);
  const fileName = (key) => `aisocnews-${TEMPLATES.find((t) => t.key === key).file}-${stamp()}.png`;
  function save(source, name) {
    return new Promise((resolve) => source.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      resolve();
    }, 'image/png'));
  }
  $('dlBtn').addEventListener('click', () => { render(); save(canvas, fileName(current)); });
  $('dlAllBtn').addEventListener('click', async () => {
    const btn = $('dlAllBtn');
    btn.disabled = true;
    const off = document.createElement('canvas');
    const octx = off.getContext('2d');
    for (const t of TEMPLATES) {
      off.width = W; off.height = sizeOf(t.key).h;
      await Promise.all(logosIn(posts[t.key]).map((src) => loadImage(src).promise));
      draw(octx, t.key, posts[t.key], getImage);
      await save(off, fileName(t.key));
      await new Promise((r) => setTimeout(r, 250));
    }
    btn.disabled = false;
    render();
  });
  // layout is all CSS: the page fills the window, the preview scales to the space left (index.html)

  // ---------- boot ----------
  buildStrip();
  buildFields();
  const fonts = document.fonts
    ? Promise.all([document.fonts.load('400 22px Geist'), document.fonts.load('500 72px Geist'), document.fonts.load('700 220px Geist')]).catch(() => {})
    : Promise.resolve();
  Promise.all([fonts, ...STATIC_ASSETS.map((src) => loadImage(src).promise)]).then(() => { render(); refreshThumbs(0); });
  render();

  // for checks from the console: render any post to a data URL
  window.PostApp = {
    snapshot(key) {
      const off = document.createElement('canvas');
      off.width = W; off.height = sizeOf(key).h;
      draw(off.getContext('2d'), key, posts[key], getImage);
      return off.toDataURL('image/png');
    },
    posts: () => posts
  };
})();
