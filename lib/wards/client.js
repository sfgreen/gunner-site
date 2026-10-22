// Browser behaviour for the wards pages: one set of delegated listeners on the page
// root, removed again on unmount. The server already rendered every static part;
// this file repaints only what the visitor changes (the ABG read, the one-liner,
// the readiness range) with the same functions render.js used on the server.
//
// The chrome (nav dropdowns, phone menu, store_click, sticky bar, TOC pill) is
// lib/app/chromeClient.js, shared with every React page.
//
// Events (GA4, lib/analytics): wards_case_answer, wards_check_answer, wards_copy, abg_case_load, hub_search,
// readiness_add_row, walk_play, walk_step, walk_complete, reel_toggle. Feature fingerprinting:
// each carries the page and what was done.
import { track, appStoreUrl } from '../analytics';
import { ic, esc } from '../app/chrome';
import { mountChrome } from '../app/chromeClient';
import { abgEngine, olSentence, OL_DEFAULT, TPL_TABS, readinessOut, readinessRows, HOME_ROWS } from './render';

export function mount(root, opts = {}) {
  const $ = (s, r = root) => r.querySelector(s);
  const $$ = (s, r = root) => Array.from(r.querySelectorAll(s));
  const off = [];
  const on = (el, type, fn, o) => { el.addEventListener(type, fn, o); off.push(() => el.removeEventListener(type, fn, o)); };
  const pageName = (opts.content && opts.content.slug) || root.dataset.page || 'home';

  /* ---------- referral bridge (home): ?ref=CODE ---------- */
  // A referred visit is its own channel: every store button switches to ct=referral and
  // the tap copies GUNNERREF:<code>, which the app reads once on first launch.
  let refCode = null;
  if (opts.referral) {
    try {
      const r = new URLSearchParams(window.location.search).get('ref');
      if (r && r.trim()) refCode = r.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32);
    } catch (err) { refCode = null; }
    if (refCode) {
      $$('a[data-ct]').forEach((a) => { a.dataset.ct = 'referral'; a.href = appStoreUrl('referral'); });
      const b = $('[data-refb]');
      if (b) { b.innerHTML = `<strong>${esc(refCode)}</strong> A classmate invited you. Tap the store button and the code comes along.`; b.hidden = false; }
    }
  }

  /* ---------- ABG interpreter ---------- */
  const E = opts.abg ? abgEngine(opts.abg) : null;
  const ABG = {};
  function paintRead(p) {
    const out = document.getElementById(`${p}-out`);
    if (!out) return;
    const st = ABG[p];
    const prev = st.head;
    out.innerHTML = E.read(st);
    const v = out.querySelector('.rep') ? out.querySelector('.verdict').textContent : '';
    st.head = v;
    if (v && v !== prev) { out.classList.remove('anim'); void out.offsetWidth; out.classList.add('anim'); }
  }
  function abgLoad(p, inputs) {
    const f = $(`[data-abg="${p}"]`);
    const st = E.initial();
    Object.entries(inputs).forEach(([k, x]) => { st.v[k] = x; });
    ABG[p] = st;
    $$('input[data-f]', f).forEach((inp) => { const x = st.v[inp.dataset.f]; inp.value = x == null ? '' : String(x); inp.setAttribute('aria-invalid', 'false'); document.getElementById(`${inp.id}-e`).hidden = true; });
    $$('[data-seg]', f).forEach((b) => b.setAttribute('aria-pressed', String(String(st.v[b.dataset.seg]) === b.dataset.v)));
    paintRead(p);
  }
  if (E) $$('[data-abg]').forEach((f) => { ABG[f.dataset.abg] = E.initial(); on(f, 'submit', (e) => e.preventDefault()); });

  /* ---------- SOAP one-liner ---------- */
  const OL = {};
  $$('[data-olb]').forEach((sh) => { OL[sh.dataset.olb] = { ...OL_DEFAULT }; });
  const olPlain = (p) => { const d = document.createElement('div'); d.innerHTML = olSentence(OL[p]); return d.textContent; };
  function olUpdate(t) {
    const sh = t.closest('[data-olb]');
    const p = sh.dataset.olb;
    OL[p][t.dataset.ol] = t.value;
    $('[data-ols]', sh).innerHTML = olSentence(OL[p]);
  }

  /* ---------- readiness check (home) ---------- */
  const rd = $('[data-rd]');
  let RD = HOME_ROWS.map((r) => r.slice());
  function rdPaint(rows) {
    if (rows) $('[data-rrows]', rd).innerHTML = readinessRows(RD);
    $('[data-rres]', rd).innerHTML = readinessOut(RD);
  }

  /* ---------- the chrome: nav, store_click, sticky bar, TOC pill ---------- */
  // A referred tap copies GUNNERREF:<code>, which the app reads once on first launch.
  off.push(mountChrome(root, { onStore: () => { if (refCode) { try { navigator.clipboard.writeText(`GUNNERREF:${refCode}`); } catch (err) { /* manual entry in the app still works */ } } } }));

  /* ---------- helpers ---------- */
  function selectNode(node) {
    try { const r = document.createRange(); r.selectNodeContents(node); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (err) { /* selection API unavailable */ }
  }
  function copyText(text, node, done) {
    let pr;
    try {
      pr = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : Promise.reject(new Error('Clipboard API unavailable'));
    } catch (err) { pr = Promise.reject(err); }
    pr.then(() => done(true)).catch(() => { selectNode(node); done(false); });
  }
  function markCopied(btn, ok) {
    if (!ok) return;
    const lbl = $('span', btn);
    if (!btn.dataset.was) btn.dataset.was = lbl.textContent;
    lbl.textContent = 'Copied';
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { lbl.textContent = btn.dataset.was; }, 2000);
  }
  function tcAnswer(btn) {
    const tc = btn.closest('[data-tc]');
    const key = +tc.dataset.key;
    const pick = +btn.dataset.i;
    $$('.tco', tc).forEach((b) => {
      const i = +b.dataset.i;
      b.setAttribute('aria-disabled', 'true');
      const m = $('.m', b);
      if (i === key) { b.dataset.s = 'right'; m.innerHTML = `${ic('check', 'sm')}First step`; } else if (i === pick) { b.dataset.s = 'wrong'; m.innerHTML = `${ic('x', 'sm')}Your pick`; } else { b.dataset.s = 'dim'; }
    });
    tc.dataset.done = pick === key ? 'right' : 'wrong';
    const r = $('.tc-r', tc);
    $('.tc-res', r).innerHTML = pick === key ? '<b>Correct.</b> That is the first step.' : `<b>Not this one.</b> The first step is ${'ABCDE'[key]}.`;
    r.hidden = false;
    requestAnimationFrame(() => r.classList.add('on'));
    track('wards_case_answer', { page: pageName, nbs: tc.dataset.nbs, correct: pick === key });
  }
  function score(s) {
    const qcs = $$('.qc', s);
    const done = qcs.filter((q) => q.dataset.done);
    const right = qcs.filter((q) => q.dataset.done === 'right').length;
    const out = $('[data-qscore]', s);
    const ctaT = $('.cta .t', s);
    if (done.length === qcs.length) {
      out.textContent = `You got ${right} of ${qcs.length}.`;
      if (ctaT) ctaT.textContent = pageName === 'abg-interpretation' ? `You got ${right} of ${qcs.length}. Step Gunner has 6,000+ more.` : `You got ${right} of ${qcs.length}. The plan is where the Step 2 points are.`;
    } else {
      out.textContent = `Answer all ${qcs.length} to see your score.`;
    }
  }
  function answer(opt) {
    const qc = opt.closest('.qc');
    const key = +qc.dataset.key;
    const pick = +opt.dataset.i;
    $$('.opt', qc).forEach((b) => {
      const i = +b.dataset.i;
      b.setAttribute('aria-disabled', 'true');
      const m = $('.m', b);
      if (i === key) { b.dataset.s = 'right'; m.innerHTML = `${ic('check', 'sm')}Answer`; } else if (i === pick) { b.dataset.s = 'wrong'; m.innerHTML = `${ic('x', 'sm')}Your pick`; } else { b.dataset.s = 'dim'; }
    });
    qc.dataset.done = pick === key ? 'right' : 'wrong';
    const r = $('.qc-r', qc);
    const why = $('.qc-why', r);
    r.insertAdjacentHTML('afterbegin', `<p class="qc-res"><b>${pick === key ? 'Correct.' : 'Not this one.'}</b> The answer is ${'ABCDE'[key]}.</p>`);
    why.hidden = false;
    requestAnimationFrame(() => why.classList.add('on'));
    r.insertAdjacentHTML('beforeend', '<button type="button" class="again">Try again</button>');
    score(qc.closest('.asec'));
    track('wards_check_answer', { page: pageName, qid: qc.dataset.qid, correct: pick === key });
  }
  function resetQ(qc) {
    $$('.opt', qc).forEach((b) => { b.removeAttribute('aria-disabled'); delete b.dataset.s; $('.m', b).innerHTML = ''; });
    delete qc.dataset.done;
    const r = $('.qc-r', qc);
    $$('.qc-res, .again', r).forEach((x) => x.remove());
    const why = $('.qc-why', r); why.hidden = true; why.classList.remove('on');
    $('.opt', qc).focus();
    score(qc.closest('.asec'));
  }
  function selectTpl(tt) {
    const sh = tt.closest('[data-tpl]');
    const p = sh.dataset.tpl;
    sh.dataset.tab = tt.dataset.tt;
    $$('.ttab', sh).forEach((b) => { const sel = b === tt; b.setAttribute('aria-selected', String(sel)); b.tabIndex = sel ? 0 : -1; });
    TPL_TABS.forEach(([k]) => { document.getElementById(`${p}-tp-${k}`).hidden = k !== tt.dataset.tt; });
    $('[data-status]', sh).textContent = 'Plain text. Square brackets are prompts.';
  }
  let searched = false;
  function filterHub(inp) {
    const terms = inp.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    $$('[data-grp]').forEach((g) => {
      let n = 0;
      $$('.cards > li', g).forEach((li) => { const hit = terms.every((t) => li.dataset.q.includes(t)); li.hidden = !hit; if (hit) n += 1; });
      g.hidden = n === 0; shown += n;
    });
    $('[data-hube]').hidden = shown > 0;
    const c = $('[data-hubc]');
    if (!c.dataset.idle) c.dataset.idle = c.textContent;
    c.textContent = terms.length ? `${shown} of ${c.dataset.total} pages` : c.dataset.idle;
    if (terms.length && !searched) { searched = true; track('hub_search', { page: 'wards' }); }
  }

  /* ---------- clicks ---------- */
  on(root, 'click', (e) => {
    const t = e.target;
    if (t.closest('a[data-ct], .dd-b, .burger')) return;   // the chrome's own clicks (mountChrome)
    const tco = t.closest('.tco');
    if (tco) { if (tco.getAttribute('aria-disabled') !== 'true') tcAnswer(tco); return; }
    const opt = t.closest('.opt');
    if (opt && opt.getAttribute('aria-disabled') !== 'true') { answer(opt); return; }
    const again = t.closest('.again');
    if (again) { resetQ(again.closest('.qc')); return; }
    const tt = t.closest('.ttab');
    if (tt) { selectTpl(tt); return; }
    const cb = t.closest('[data-copy]');
    if (cb) {
      const kind = cb.dataset.copy;
      if (kind === 'tpl') {
        const sh = cb.closest('[data-tpl]');
        const p = sh.dataset.tpl;
        const pre = document.getElementById(`${p}-tp-${sh.dataset.tab}`);
        const status = $('[data-status]', sh);
        copyText(opts.soap.template_text[sh.dataset.tab], pre, (ok) => {
          status.textContent = ok ? 'Copied. Paste it into the note and fill the brackets.' : 'Copying is blocked here, so the template is selected. Press Command C or Ctrl C.';
          markCopied(cb, ok);
          const after = document.getElementById(`${p}-aftercopy`);
          if (after && after.hidden) { after.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => after.classList.add('on'))); }
        });
        track('wards_copy', { page: pageName, kind: sh.dataset.tab });
      } else if (kind === 'read') {
        const out = cb.closest('.abg-out'); const p = out.id.replace(/-out$/, '');
        const status = $('[data-status]', out);
        copyText(ABG[p].summary.line, $('[data-sum]', out), (ok) => { status.textContent = ok ? 'Copied.' : 'Copying is blocked here, so the read is selected.'; markCopied(cb, ok); });
        track('wards_copy', { page: pageName, kind: 'abg_read' });
      } else if (kind === 'ol') {
        const sh = cb.closest('[data-olb]');
        const status = $('[data-status]', sh);
        copyText(olPlain(sh.dataset.olb), $('[data-ols]', sh), (ok) => { status.textContent = ok ? 'Copied.' : 'Copying is blocked here, so the sentence is selected.'; markCopied(cb, ok); });
        track('wards_copy', { page: pageName, kind: 'one_liner' });
      }
      return;
    }
    const clr = t.closest('[data-hubclr]');
    if (clr) { const q = $('[data-hubq]'); q.value = ''; filterHub(q); q.focus(); return; }
    const aclr = t.closest('[data-abgclr]');
    if (aclr) { abgLoad(aclr.closest('[data-abg]').dataset.abg, {}); return; }
    const sg = t.closest('[data-seg]');
    if (sg) {
      const f = sg.closest('[data-abg]'); const p = f.dataset.abg; const k = sg.dataset.seg;
      ABG[p].v[k] = k === 'timing' ? sg.dataset.v : parseFloat(sg.dataset.v);
      $$(`[data-seg="${k}"]`, f).forEach((b) => b.setAttribute('aria-pressed', String(b === sg)));
      paintRead(p);
      return;
    }
    const pre = t.closest('[data-preset]');
    if (pre) { abgLoad(pre.closest('[data-abg]').dataset.abg, E.WORKED[+pre.dataset.preset].inputs); track('abg_case_load', { page: pageName, from: 'chip', i: +pre.dataset.preset }); return; }
    const ld = t.closest('[data-load]');
    if (ld) {
      const p = $('[data-abg]').dataset.abg;
      abgLoad(p, E.WORKED[+ld.dataset.load].inputs);
      track('abg_case_load', { page: pageName, from: 'worked_case', i: +ld.dataset.load });
      const smooth = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      document.getElementById(`${p}-tool`).scrollIntoView({ block: 'start', behavior: smooth });
      return;
    }
    if (rd && t.closest('[data-radd]')) {
      if (RD.length < 8) { RD.push(['NBME 15', '', '']); rdPaint(true); track('readiness_add_row', { surface: 'home' }); const last = $$('[data-rk="1"]', rd).pop(); if (last) last.focus(); }
      return;
    }
    const rm = rd && t.closest('[data-rrm]');
    if (rm) { RD.splice(+rm.dataset.rrm, 1); rdPaint(true); }
  });

  /* ---------- typing ---------- */
  on(root, 'input', (e) => {
    const t = e.target;
    if (t.matches('[data-hubq]')) { filterHub(t); return; }
    if (E && t.matches('[data-abg] input')) {
      const p = t.closest('[data-abg]').dataset.abg; const k = t.dataset.f; const spec = E.SIN[k];
      const raw = t.value.trim();
      const num = /^\d*\.?\d+$/.test(raw) ? parseFloat(raw) : NaN;
      const st = ABG[p];
      let msg = '';
      if (raw === '') { st.v[k] = null; } else if (Number.isNaN(num)) { msg = 'Numbers only'; } else if (num < spec.min || num > spec.max) { msg = `Enter ${spec.min} to ${spec.max}`; } else { st.v[k] = num; }
      st.bad[k] = !!msg;
      if (msg) st.v[k] = null;
      t.setAttribute('aria-invalid', String(!!msg));
      const err = document.getElementById(`${t.id}-e`); err.hidden = !msg; err.textContent = msg;
      paintRead(p);
      return;
    }
    if (t.matches('[data-ol]')) { olUpdate(t); return; }
    if (rd && t.matches('[data-rk]')) { const i = +t.closest('[data-row]').dataset.row; RD[i][+t.dataset.rk] = t.value; rdPaint(false); }
  });
  on(root, 'change', (e) => {
    const t = e.target;
    if (t.matches('select[data-ol]')) olUpdate(t);
    else if (rd && t.matches('select[data-rk]')) { const i = +t.closest('[data-row]').dataset.row; RD[i][0] = t.value; rdPaint(false); }
  });
  on(document, 'keydown', (e) => {
    const tt = e.target.closest && e.target.closest('.ttab');
    if (tt && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      const tabs = $$('.ttab', tt.parentElement); let i = tabs.indexOf(tt) + (e.key === 'ArrowRight' ? 1 : -1);
      i = (i + tabs.length) % tabs.length; tabs[i].focus(); selectTpl(tabs[i]); e.preventDefault();
    }
  });

  /* ---------- the walkthrough (home): chapters on two stacked video layers ----------
     The active layer plays; past halfway the other layer buffers the next chapter, and on
     'ended' the two swap with a crossfade. Plays only while on screen; never autoplays under
     Reduced Motion (a Play button instead); the pause button stops the auto-advance. */
  const reduce = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (err) { return false; } })();
  const observers = [];
  const setupWalk = (walk) => {
    let WALK;
    try { WALK = JSON.parse(walk.dataset.chapters); } catch (err) { return; }
    const band = walk.hasAttribute('data-walk-aura') ? root.querySelector('[data-walk-band]') : null;
    const stage = $('.walk-stage', walk);
    const vids = $$('.walk-v', walk);
    const steps = $$('.walk-st', walk);
    const bars = $$('.walk-bars span', walk);
    const ghost = $('[data-walk-ghost]', walk);
    const pp = $('[data-walk-pp]', walk);
    const noun = pp.dataset.noun || 'walkthrough';
    const playBtn = $('[data-walk-play]', walk);
    const n2 = (i) => String(i + 1).padStart(2, '0');
    const COLORS = ['c-blue', 'c-gold', 'c-purple', 'c-green', 'c-red'];
    const label = walk.querySelector('h2') ? walk.querySelector('h2').id : 'walk';
    let idx = 0; let cur = 0; let paused = reduce; let inView = false; let raf = 0; let played = false; let done = false;
    const load = (layer, i) => {
      const v = vids[layer];
      if (v.dataset.i === String(i)) return;
      v.dataset.i = String(i);
      v.poster = `/wards/walk/walk-${WALK[i].id}.jpg`;
      v.src = `/wards/walk/walk-${WALK[i].id}.mp4`;
      v.preload = 'auto';
    };
    const paint = () => {
      steps.forEach((b, k) => { if (k === idx) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.style.setProperty('--p', '0'); });
      bars.forEach((b, k) => { b.classList.toggle('now', k === idx); b.style.setProperty('--p', k < idx ? '1' : '0'); });
      [walk, band].forEach((el) => { if (el) { el.classList.remove(...COLORS); el.classList.add(`c-${WALK[idx].c}`); } });
      ghost.classList.add('out');
      setTimeout(() => { ghost.textContent = n2(idx); ghost.classList.remove('out'); }, 220);
      $('[data-walk-num]', walk).textContent = n2(idx);
      $('[data-walk-title]', walk).textContent = WALK[idx].t;
      $('[data-walk-count]', walk).textContent = `${n2(idx)} / ${n2(WALK.length - 1)}`;
      vids.forEach((v, k) => {
        if (k === cur) { v.removeAttribute('aria-hidden'); v.setAttribute('aria-label', `Screen recording of Step Gunner: ${WALK[idx].t}`); } else { v.setAttribute('aria-hidden', 'true'); v.removeAttribute('aria-label'); }
      });
    };
    const tick = () => {
      raf = 0;
      const v = vids[cur];
      const p = v.duration ? Math.min(1, v.currentTime / v.duration) : 0;
      bars[idx].style.setProperty('--p', String(p));
      steps[idx].style.setProperty('--p', String(p));
      if (p > 0.5) load(1 - cur, (idx + 1) % WALK.length);
      if (!v.paused) raf = requestAnimationFrame(tick);
    };
    const run = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const setPaused = (v) => {
      paused = v;
      pp.setAttribute('aria-pressed', String(v));
      pp.setAttribute('aria-label', `${v ? 'Play' : 'Pause'} the ${noun}`);
    };
    const blocked = () => { setPaused(true); playBtn.hidden = false; };
    const playCur = () => {
      const v = vids[cur];
      if (paused || !inView) return;
      const pr = v.play();
      // AbortError = interrupted by a pause or a new source (scrolling, a chapter tap): not a block.
      if (pr && pr.catch) pr.then(run).catch((err) => { if (err && err.name === 'NotAllowedError') blocked(); }); else run();
      if (!played) { played = true; track('walk_play', { page: pageName, player: label, reduced: reduce }); }
    };
    const go = (i) => {
      const next = (i + WALK.length) % WALK.length;
      const layer = 1 - cur;
      load(layer, next);
      const nv = vids[layer];
      const ov = vids[cur];
      try { nv.currentTime = 0; } catch (err) { /* not loaded yet; it starts at 0 anyway */ }
      nv.classList.add('on');
      ov.classList.remove('on');
      ov.pause();
      cur = layer; idx = next;
      paint();
      playCur();
    };
    vids.forEach((v, k) => on(v, 'ended', () => {
      if (k !== cur) return;
      bars[idx].style.setProperty('--p', '1');
      if (idx === WALK.length - 1 && !done) { done = true; track('walk_complete', { page: pageName, player: label }); }
      if (!paused) go(idx + 1);
    }));
    vids.forEach((v) => on(v, 'play', run));
    steps.forEach((b, k) => on(b, 'click', () => {
      setPaused(false); playBtn.hidden = true;
      track('walk_step', { page: pageName, player: label, step: WALK[k].id });
      go(k);
      // On a phone the steps sit under the player: bring it back into view, and the
      // observer starts it once it is there.
      const r = stage.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) stage.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }));
    on(pp, 'click', () => {
      setPaused(!paused);
      if (paused) vids[cur].pause(); else { playBtn.hidden = true; playCur(); }
    });
    on(playBtn, 'click', () => { setPaused(false); playBtn.hidden = true; playCur(); });
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      inView = e.isIntersecting;
      if (inView) { load(cur, idx); playCur(); } else vids[cur].pause();
    }), { threshold: 0.35 });
    io.observe(stage);
    observers.push(io);
    if (reduce) playBtn.hidden = false;
  };
  if (typeof IntersectionObserver !== 'undefined') $$('[data-walk]').forEach(setupWalk);

  /* ---------- the reel: each clip loads and plays only while it is on screen ---------- */
  const reel = $('[data-reel]');
  if (reel && typeof IntersectionObserver !== 'undefined') {
    const btn = $('[data-reel-pp]', reel);
    let rpaused = reduce;
    const seen = new Set();
    const label = () => { btn.textContent = rpaused ? 'Play the clips' : 'Pause the clips'; btn.setAttribute('aria-pressed', String(rpaused)); };
    label();
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) {
        if (!v.getAttribute('src')) { v.poster = v.dataset.poster; v.src = v.dataset.src; }
        seen.add(v);
        if (!rpaused) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
      } else { seen.delete(v); v.pause(); }
    }), { rootMargin: '200px 0px', threshold: 0.2 });
    $$('.rl video', reel).forEach((v) => io.observe(v));
    observers.push(io);
    on(btn, 'click', () => {
      rpaused = !rpaused; label();
      seen.forEach((v) => { if (rpaused) v.pause(); else { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } });
      track('reel_toggle', { page: pageName, paused: rpaused });
    });
  }

  return () => { observers.forEach((o) => o.disconnect()); $$('video').forEach((v) => v.pause()); off.forEach((f) => f()); };
}
