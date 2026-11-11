// Pill nav, copied verbatim from the banner generator (docs/03-component-source.md).
  function createPillNav(nav, opts) {
    const items = opts.items;
    const bounce = Math.min(1, Math.max(0, opts.bounce ?? 0.3));
    const stretch = Math.min(1, Math.max(0, opts.stretch ?? 0.5));
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const el = (tag, cls, attrs) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      return e;
    };
    let activeIndex = opts.activeIndex || 0;

    // bar + track
    const bar = el('div', 'pill-nav__bar pill-nav__surface');
    const track = el('div', 'pill-nav__track');
    const list = el('ul', 'pill-nav__list');
    const slots = items.map((item, index) => {
      const li = el('li', 'pill-nav__slot');
      const btn = el('button', 'pill-nav__item', { type: 'button', 'data-template': item.key });
      const face = el('span', 'pill-nav__face');
      face.textContent = item.label;
      btn.appendChild(face);
      btn.addEventListener('click', () => choose(index));
      li.appendChild(btn);
      li.addEventListener('pointerenter', (e) => engine.enter(index, e));
      li.addEventListener('pointerdown', (e) => engine.press(e));
      li.addEventListener('focusin', (e) => engine.focus(index, e));
      li.addEventListener('focusout', () => engine.blur());
      list.appendChild(li);
      return li;
    });
    const glideEl = el('span', 'pill-nav__glide', { 'aria-hidden': 'true' });
    const ink = el('div', 'pill-nav__ink', { 'aria-hidden': 'true' });
    items.forEach((item) => {
      const s = el('span', 'pill-nav__ink-item');
      s.textContent = item.label;
      ink.appendChild(s);
    });
    track.append(list, glideEl, ink);
    track.addEventListener('pointerleave', () => engine.leave());
    bar.append(track, el('span', 'pill-nav__rim'));

    // collapsed: menu toggle + panel
    const toggleBtn = el('button', 'pill-nav__toggle pill-nav__surface', {
      type: 'button', 'aria-expanded': 'false', 'aria-controls': 'templateTabsPanel', 'aria-label': 'Open menu'
    });
    toggleBtn.innerHTML = '<span class="pill-nav__burger" aria-hidden="true"><span class="pill-nav__line pill-nav__line--top"></span><span class="pill-nav__line pill-nav__line--bottom"></span></span><span class="pill-nav__rim"></span>';
    const panel = el('div', 'pill-nav__panel pill-nav__surface', { id: 'templateTabsPanel' });
    const menu = el('ul', 'pill-nav__menu');
    const rows = items.map((item, index) => {
      const li = el('li');
      const row = el('button', 'pill-nav__row', { type: 'button', tabindex: '-1' });
      row.textContent = item.label;
      row.addEventListener('click', () => { choose(index); setOpen(false); });
      li.appendChild(row);
      menu.appendChild(li);
      return row;
    });
    panel.append(menu, el('span', 'pill-nav__rim'));

    // hidden copy used to decide when the labels stop fitting
    const measureEl = el('div', 'pill-nav__measure', { 'aria-hidden': 'true' });
    const measureList = el('div', 'pill-nav__list');
    items.forEach((item) => {
      const s = el('span', 'pill-nav__ink-item');
      s.textContent = item.label;
      measureList.appendChild(s);
    });
    measureEl.appendChild(measureList);

    nav.replaceChildren(bar, toggleBtn, panel, measureEl);

    // ---- spring engine ----
    const state = {
      x0: 0, x1: 0, v0: 0, v1: 0, alpha: 0, pop: 1, press: 1, pressVelocity: 0,
      hover: -1, focus: false, sliding: false, pressing: false, waiting: !reduce
    };
    const rects = [];
    let trackWidth = 0, trackHeight = 0, raf = 0, last = 0;

    function measure() {
      trackWidth = track.offsetWidth;
      trackHeight = track.offsetHeight;
      slots.forEach((slot, i) => { rects[i] = { left: slot.offsetLeft, width: slot.offsetWidth }; });
    }
    const glideIndex = () => (state.hover >= 0 ? state.hover : activeIndex);
    function sync() {
      slots.forEach((slot, i) => slot.toggleAttribute('data-lit', state.hover === i));
      nav.toggleAttribute('data-focus', state.focus && state.hover >= 0);
    }
    function render() {
      const width = Math.max(0, state.x1 - state.x0);
      const scale = state.press * state.pop;
      const target = rects[glideIndex()];
      const squash = target ? 1 - clamp((width / Math.max(target.width, 1) - 1) * 0.3, 0, 0.14) : 1;
      glideEl.style.width = width + 'px';
      glideEl.style.transform = `translate3d(${state.x0}px, 0, 0) scale(${scale}, ${scale * squash})`;
      glideEl.style.opacity = String(state.alpha);
      const half = (width * scale) / 2;
      const center = (state.x0 + state.x1) / 2;
      const inset = (trackHeight * (1 - scale * squash)) / 2;
      ink.style.clipPath = `inset(${inset}px ${trackWidth - center - half}px ${inset}px ${center - half}px round ${trackHeight / 2}px)`;
      ink.style.opacity = String(state.alpha);
    }
    function tick(now) {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const target = rects[glideIndex()];
      const zeta = 1 - 0.55 * bounce;
      const base = 520;
      let busy = false;
      if (target && target.width > 0 && !state.waiting) {
        const t0 = target.left, t1 = target.left + target.width;
        if (state.alpha < 0.02 && !state.sliding) {
          state.x0 = t0; state.x1 = t1; state.v0 = 0; state.v1 = 0; state.pop = 0.9;
        }
        if (reduce) {
          state.x0 = t0; state.x1 = t1; state.v0 = 0; state.v1 = 0;
        } else {
          // leading edge springs stiffer than the trailing one -> the pill stretches toward its target
          const direction = Math.sign((t0 + t1) / 2 - (state.x0 + state.x1) / 2);
          const lead = base * (1 + 0.9 * stretch);
          const trail = base * (1 - 0.5 * stretch);
          const k0 = direction < 0 ? lead : direction > 0 ? trail : base;
          const k1 = direction > 0 ? lead : direction < 0 ? trail : base;
          const steps = Math.ceil(dt / (1 / 240));
          const h = dt / steps;
          for (let i = 0; i < steps; i++) {
            state.v0 += (-k0 * (state.x0 - t0) - 2 * zeta * Math.sqrt(k0) * state.v0) * h;
            state.x0 += state.v0 * h;
            state.v1 += (-k1 * (state.x1 - t1) - 2 * zeta * Math.sqrt(k1) * state.v1) * h;
            state.x1 += state.v1 * h;
          }
        }
        state.alpha += (1 - state.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.06));
        busy = Math.abs(state.x0 - t0) > 0.05 || Math.abs(state.x1 - t1) > 0.05 ||
          Math.abs(state.v0) > 0.5 || Math.abs(state.v1) > 0.5 || state.alpha < 0.999;
        if (!busy) state.sliding = false;
      } else if (!state.waiting) {
        state.alpha += (0 - state.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.07));
        if (state.alpha > 0.002) busy = true; else state.alpha = 0;
      }
      state.pop += (1 - state.pop) * (reduce ? 1 : 1 - Math.exp(-dt / 0.09));
      if (Math.abs(1 - state.pop) > 0.001) busy = true;
      const pressTarget = state.pressing ? 0.95 : 1;
      if (reduce) {
        state.press = pressTarget; state.pressVelocity = 0;
      } else {
        state.pressVelocity += (-700 * (state.press - pressTarget) - 30 * state.pressVelocity) * dt;
        state.press += state.pressVelocity * dt;
      }
      if (Math.abs(state.press - pressTarget) > 0.0005 || Math.abs(state.pressVelocity) > 0.01) busy = true;
      render();
      if (busy) raf = requestAnimationFrame(tick);
    }
    function wake() {
      if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
    }
    const engine = {
      enter(index, e) {
        if (e?.pointerType === 'touch') return;
        state.hover = index; state.focus = false; sync(); wake();
      },
      leave() {
        if (state.focus) return;
        state.hover = -1; sync(); wake();
      },
      focus(index, e) {
        const visible = e?.target instanceof Element && e.target.matches(':focus-visible');
        state.focus = visible;
        state.hover = visible ? index : state.hover;
        sync(); wake();
      },
      blur() {
        if (!state.focus) return;
        state.focus = false; state.hover = -1; sync(); wake();
      },
      press(e) {
        if (e && e.button > 0) return;
        state.pressing = true; wake();
      },
      release() {
        if (!state.pressing) return;
        state.pressing = false; wake();
      },
      refresh() { measure(); sync(); wake(); }
    };
    window.addEventListener('pointerup', engine.release);
    window.addEventListener('pointercancel', engine.release);

    // ---- active item ----
    function paintActive() {
      slots.forEach((slot, i) => {
        const b = slot.firstChild;
        if (i === activeIndex) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      });
      rows.forEach((row, i) => {
        if (i === activeIndex) row.setAttribute('aria-current', 'page'); else row.removeAttribute('aria-current');
      });
    }
    function choose(index) {
      if (index !== activeIndex) {
        activeIndex = index;
        paintActive();
        opts.onSelect?.(items[index], index);
      }
      wake();
    }

    // ---- collapse to a menu when the labels don't fit ----
    let collapsed = false;
    function evaluate() {
      const parent = nav.parentElement;
      if (!parent) return;
      const cs = getComputedStyle(parent);
      const available = parent.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      const pad = parseFloat(getComputedStyle(nav).getPropertyValue('--pn-pad')) || 0;
      const next = measureList.offsetWidth + pad * 2 > available + 0.5;
      if (next === collapsed) return;
      collapsed = next;
      nav.toggleAttribute('data-collapsed', collapsed);
      if (!collapsed) {
        setOpen(false);
        panelAnims.forEach((a) => { a.onfinish = null; a.cancel(); });
        panelAnims = [];
        nav.removeAttribute('data-panel');
        state.alpha = 0; // re-appear in place instead of sliding in from 0
        engine.refresh();
      }
    }

    // ---- menu panel ----
    let open = false;
    let panelAnims = [];
    function setOpen(next) {
      if (next === open) return;
      open = next;
      panelAnims.forEach((a) => { a.onfinish = null; a.cancel(); });
      panelAnims = [];
      nav.toggleAttribute('data-open', open);
      toggleBtn.setAttribute('aria-expanded', String(open));
      toggleBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      rows.forEach((r) => (open ? r.removeAttribute('tabindex') : r.setAttribute('tabindex', '-1')));
      if (open) nav.setAttribute('data-panel', '');
      const width = panel.offsetWidth, height = panel.offsetHeight;
      const header = toggleBtn.offsetHeight || 44;
      const start = `inset(0px 0px ${Math.max(0, height - header)}px ${Math.max(0, width - header)}px round ${header / 2}px)`;
      const end = 'inset(0px 0px 0px 0px round 24px)';
      const lis = panel.querySelectorAll('li');
      if (open) {
        if (reduce) return;
        panelAnims.push(panel.animate([{ clipPath: start }, { clipPath: end }], { duration: 560, easing: EASE_OUT }));
        lis.forEach((li, i) => panelAnims.push(li.animate(
          [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 420, delay: 90 + i * 40, easing: EASE_OUT, fill: 'backwards' })));
      } else {
        if (reduce || !nav.hasAttribute('data-panel')) { nav.removeAttribute('data-panel'); return; }
        const morph = panel.animate([{ clipPath: end }, { clipPath: start }],
          { duration: 380, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' });
        morph.onfinish = () => { nav.removeAttribute('data-panel'); morph.cancel(); };
        panelAnims.push(morph);
        lis.forEach((li) => panelAnims.push(li.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' })));
      }
    }
    toggleBtn.addEventListener('click', () => setOpen(!open));
    document.addEventListener('pointerdown', (e) => {
      if (open && !(e.target instanceof Node && nav.contains(e.target))) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (open && e.key === 'Escape') { setOpen(false); toggleBtn.focus(); }
    });

    // ---- boot ----
    paintActive();
    evaluate();
    measure(); sync(); render();
    if (!collapsed && !reduce) {
      // intro: unroll the bar, stagger the labels in, then slide the pill to the active item
      const w = bar.offsetWidth, h = bar.offsetHeight;
      bar.animate(
        [{ clipPath: `inset(0px ${Math.max(0, w - h)}px 0px 0px round ${h / 2}px)` },
         { clipPath: `inset(0px 0px 0px 0px round ${h / 2}px)` }],
        { duration: 760, delay: 90, easing: EASE_OUT, fill: 'backwards' });
      slots.forEach((slot, i) => slot.animate(
        [{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'translateX(0)' }],
        { duration: 560, delay: 200 + i * 50, easing: EASE_OUT, fill: 'backwards' }));
      setTimeout(() => {
        state.waiting = false;
        state.alpha = 1;
        state.sliding = true;
        wake();
      }, 420);
    } else {
      state.waiting = false;
    }
    wake();
    const ro = new ResizeObserver(() => { evaluate(); measure(); render(); wake(); });
    ro.observe(track);
    ro.observe(measureEl);
    if (nav.parentElement) ro.observe(nav.parentElement);
    document.fonts?.ready?.then(() => { engine.refresh(); evaluate(); }).catch(() => {});

    return {
      setActive(index) { if (index !== activeIndex) { activeIndex = index; paintActive(); wake(); } }
    };
  }
