// Browser behaviour for the wards pages: one set of delegated listeners on the page
// root, removed again on unmount. The server already rendered every static part;
// this file repaints only what the visitor changes (the ABG read, the one-liner,
// the readiness range) with the same functions render.js used on the server.
//
// Events (GA4, lib/analytics): store_click {source, location, page_type, page, ref},
// wards_case_answer, wards_check_answer, wards_copy, abg_case_load, hub_search,
// readiness_add_row. Feature fingerprinting: each carries the page and what was done.
import { track, referrerHost, appStoreUrl } from '../analytics';
import { ic, esc, abgEngine, olSentence, OL_DEFAULT, TPL_TABS, readinessOut, readinessRows, HOME_ROWS } from './render';

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

  /* ---------- helpers ---------- */
  function closeMenus(except) {
    $$('.dd-b[aria-expanded="true"]').forEach((b) => { if (b === except) return; b.setAttribute('aria-expanded', 'false'); const pn = document.getElementById(b.getAttribute('aria-controls')); if (pn) pn.hidden = true; });
  }
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
    const storeA = t.closest('a[data-ct]');
    if (storeA) {
      if (refCode) { try { navigator.clipboard.writeText(`GUNNERREF:${refCode}`); } catch (err) { /* manual entry in the app still works */ } }
      track('store_click', { source: storeA.dataset.ct, location: storeA.dataset.loc, page_type: storeA.dataset.type, page: storeA.dataset.page, ref: referrerHost() });
      return;
    }
    const dd = t.closest('.dd-b');
    if (dd) {
      const open = dd.getAttribute('aria-expanded') !== 'true';
      closeMenus(dd);
      dd.setAttribute('aria-expanded', String(open));
      document.getElementById(dd.getAttribute('aria-controls')).hidden = !open;
      return;
    }
    if (!t.closest('.dd')) closeMenus();
    const bg = t.closest('.burger');
    if (bg) { const pn = document.getElementById(bg.getAttribute('aria-controls')); const open = bg.getAttribute('aria-expanded') !== 'true'; bg.setAttribute('aria-expanded', String(open)); pn.hidden = !open; bg.innerHTML = ic(open ? 'x' : 'menu'); return; }
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
      i = (i + tabs.length) % tabs.length; tabs[i].focus(); selectTpl(tabs[i]); e.preventDefault(); return;
    }
    if (e.key === 'Escape') {
      const open = $('.dd-b[aria-expanded="true"]');
      if (open) { closeMenus(); open.focus(); }
    }
  });
  on(document, 'click', (e) => { if (!root.contains(e.target)) closeMenus(); });

  /* ---------- sticky: shows after the page's first answer, hides at the end band ---------- */
  const s = $('.sticky');
  if (s) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const start = $$('[data-sticky-start]').find((el) => el.offsetParent !== null);
      const end = $('[data-sticky-end]');
      if (!start || getComputedStyle(s).display === 'none') { s.classList.remove('on'); return; }
      const passed = start.getBoundingClientRect().bottom < 0;
      const endIn = end ? end.getBoundingClientRect().top < window.innerHeight - 40 : false;
      s.classList.toggle('on', passed && !endIn);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    on(window, 'scroll', onScroll, { passive: true });
    on(window, 'resize', onScroll);
    update();
  }

  return () => off.forEach((f) => f());
}
