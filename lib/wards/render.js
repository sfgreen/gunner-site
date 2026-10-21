// The wards pages (home, /wards, the ABG and SOAP articles) as HTML strings.
//
// Ported from the approved SITE_M3_VISUAL mock (2026-10-21). The same functions run on
// the server (the static page) and in the browser (client.js repaints the live parts:
// the ABG read, the one-liner, the readiness range), so both always say the same thing.
// Every store button carries data-ct/data-loc/data-page/data-type; client.js sends them
// as the store_click event. Copy rules: no em or en dashes, no emoji, live features only.
import SITE from './site.json';
import { appStoreUrl } from '../analytics';
import { computeReadiness, FORMS, percentile, ordinal, GMIN, GMAX, PASS } from '../readiness';

export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const ic = (n, c = '') => `<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const PAGES = Object.fromEntries(SITE.pages.map((p) => [p.id, p]));
const LOCS = new Set(SITE.locs);
const FREE = 'Free to start on iPhone';
export const CARDS = '6,000+';

/* ---------- the icon sprite: SF Symbols-style strokes, drawn once per page ---------- */
export const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
<symbol id="i-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>
<symbol id="i-chev-r" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></symbol>
<symbol id="i-checkc" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.4 2.4 4.8-5"/></symbol>
<symbol id="i-xc" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/></symbol>
<symbol id="i-warn" viewBox="0 0 24 24"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.2v.1"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
<symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></symbol>
<symbol id="i-load" viewBox="0 0 24 24"><path d="M12 4v10M8 10l4 4 4-4M5 19h14"/></symbol>
<symbol id="i-flask" viewBox="0 0 24 24"><path d="M9 3h6M10 3v6.5L5 18.2A1.9 1.9 0 0 0 6.7 21h10.6a1.9 1.9 0 0 0 1.7-2.8L14 9.5V3M7.6 15h8.8"/></symbol>
<symbol id="i-note" viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 11h5M9.5 14.5h5M9.5 18h3"/></symbol>
<symbol id="i-drop" viewBox="0 0 24 24"><path d="M12 3.5s6 6.4 6 10.8a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z"/></symbol>
<symbol id="i-pulse" viewBox="0 0 24 24"><path d="M3 12h4l2-5 4 10 2-5h6"/></symbol>
<symbol id="i-gauge" viewBox="0 0 24 24"><path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/></symbol>
<symbol id="i-steth" viewBox="0 0 24 24"><path d="M6 3.5v5a4.5 4.5 0 0 0 9 0v-5"/><path d="M10.5 13v2.5a4.5 4.5 0 0 0 9 0V13"/><circle cx="19.5" cy="11" r="2"/></symbol>
<symbol id="i-book" viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8.5 7.5h7"/></symbol>
<symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></symbol>
<symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></symbol>
</svg>`;

/* ---------- shared atoms ---------- */
export function store(ctx, loc, label, cls = 'btn-act') {
  if (!LOCS.has(loc)) throw new Error(`store CTA location not in the enum: ${loc}`);
  return `<a class="btn ${cls}" href="${esc(appStoreUrl(ctx.ct))}" data-ct="${ctx.ct}" data-loc="${loc}" data-page="${ctx.page}" data-type="${ctx.type}">${label}</a>`;
}
const WM = '<a class="wm" href="/" aria-label="Step Gunner home"><span class="dot" aria-hidden="true"></span><span class="w1">STEP</span><span class="w2">GUNNER</span></a>';
const ALT = {
  home: "App screen: Home, with the readiness range, today's plan and the question decks",
  readiness: 'App screen: Exam Readiness, most likely 266, a range of 262 to 270 from two NBME forms (example scores)',
  pathway: 'App screen: the DKA management chain from Chain Search, each step in order with its guideline source',
};
// A full-width 4:5 window into the app screen (cut from the full-resolution recordings),
// big enough that the app's own text reads at its real size on the page.
function win(k, o = {}) {
  const load = o.eager ? ' fetchpriority="high"' : ' loading="lazy"';
  return `<figure class="win${o.cls ? ` ${o.cls}` : ''}"><div class="dv"><img src="/wards/win-${k}.jpg" width="800" height="1000" alt="${esc(ALT[k])}" decoding="async"${load}></div></figure>`;
}
// The signature: a hand-drawn ECG strip, seeded so it is the same on every load.
function ecg(cls = '') {
  let a = 41;
  const rnd = () => { a = (a * 9301 + 49297) % 233280; return a / 233280; };
  const W = 1200; const M = 96; let x = 0; let d = `M0 ${M}`;
  const L = (dx, dy) => { x += dx; d += ` L${x.toFixed(1)} ${(M + dy).toFixed(1)}`; };
  while (x < W - 120) {
    const j = () => (rnd() - 0.5) * 3;
    L(34 + rnd() * 18, j()); L(10, -9 + j()); L(10, -12 + j()); L(10, -6 + j()); L(8, j());
    L(14, j()); L(5, 10 + j()); L(9, -70 - rnd() * 8); L(9, 26 + j()); L(6, j());
    L(22, j()); L(14, -14 + j()); L(14, -20 + j()); L(14, -10 + j()); L(10, j());
  }
  L(W - x, 0);
  return `<svg class="ecg ${cls}" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${d}" pathLength="1"/></svg>`;
}
const keyed = (h, k) => (k && h.includes(k) ? esc(h).replace(esc(k), `<span class="key">${esc(k)}</span>`) : esc(h));

function cta(ctx, loc, o) {
  return `<aside class="cta glow${o.cls ? ` ${o.cls}` : ''}" aria-label="Step Gunner"${o.id ? ` id="${o.id}"` : ''}${o.hidden ? ' hidden' : ''}${o.start ? ' data-sticky-start' : ''}><div class="cta-in">
    <p class="k lbl"><span class="dot" aria-hidden="true"></span>${o.k || 'Step Gunner'}</p>
    <p class="t"${o.tid ? ` id="${o.tid}"` : ''}>${o.t}</p>
    <p class="b">${o.b}</p>
    <div class="act">${store(ctx, loc, o.btn || 'Get Step Gunner free')}<span class="fine">${o.fine || FREE}</span></div>
  </div></aside>`;
}
function strip(ctx, o) {
  return `<div class="strip"><div class="st"><b>${o.t}</b><span>${o.s}</span></div><div class="sa">${store(ctx, 'top', o.btn || 'Get Step Gunner free')}<span class="fine">${o.f || `${CARDS} Step 2 CK cards. Free to start on iPhone.`}</span></div></div>`;
}
function band(ctx, p, o) {
  return `<section class="band" aria-labelledby="${p}-band" data-sticky-end><div class="wrap band-g">
    <div><p class="lbl">Step Gunner for iPhone</p><h2 class="h-2" id="${p}-band">${o.h}</h2><p class="band-b">${o.b}</p></div>
    <div class="band-act">${store(ctx, 'end', 'Get Step Gunner free', 'btn-act btn-lg')}<p class="fine">${FREE}.</p></div>
  </div></section>`;
}
const sticky = (ctx, t) => `<div class="sticky" role="region" aria-label="Get the app"><div class="sticky-t"><b>${t}</b><span>${FREE}</span></div>${store(ctx, 'sticky', 'Get it free')}</div>`;

/* ---------- nav and footer: every link is a live page ---------- */
const NAV = [
  { id: 'wards', label: 'On the wards', panel: 'wide', all: ['/wards', 'Everything on the wards'], groups: [
    { t: 'Labs and ABGs', links: [['ABG interpretation', 'Interpreter and step by step', '/wards/abg-interpretation'], ["Winter's formula", 'Expected PaCO2', '/wards/abg-interpretation#abg-fx-winters'], ['Delta-delta gap', 'The second disorder', '/wards/abg-interpretation#abg-fx-delta_gap'], ['A-a gradient', 'Calculator and normal for age', '/wards/abg-interpretation#abg-fx-aa_gradient']] },
    { t: 'Notes', links: [['SOAP note', 'Template and example', '/wards/soap-note'], ['H&P template', 'Ready to paste', '/wards/soap-note#soap-tool'], ['One-liner builder', 'The first line of the note', '/wards/soap-note#soap-oneliner']] },
  ] },
  { id: 'shelf', label: 'Shelf exams', panel: 'narrow', all: ['/guides', 'Every shelf guide'], groups: [
    { t: 'By rotation', links: SITE.shelf.map(([, n, slug]) => [n, '', `/guides/${slug}`]) },
  ] },
  { id: 'step2', label: 'Step 2', panel: 'wide', groups: [
    { t: 'Your number', links: [['Readiness check', 'NBME and UWSA scores to a Step 2 range', '/readiness'], ['Score predictor', 'One page per form', '/step-2-score-predictor'], ['Percentiles', 'What a Step 2 score means', '/step-2-ck-percentiles'], ['Score by specialty', 'Your odds, not the average', '/step-2-score-by-specialty']] },
    { t: 'Your plan', links: [['Study schedule', 'The dedicated calendar, week by week', '/research/dedicated-calendar'], ['Free 120', 'Your own PDF in the real interface', '/free120'], ['NBME to Step 2', 'What 269 score reports show', '/research/nbme-to-step-2']] },
  ] },
  { id: 'research', label: 'Research', href: '/research/nbme-to-step-2' },
];
function nav(p, ctx, o = {}) {
  const items = NAV.map((n) => {
    const cur = o.cur === n.id ? ' aria-current="page"' : '';
    if (!n.groups) return `<a href="${n.href}"${cur}>${n.label}</a>`;
    const pid = `${p}-dd-${n.id}`;
    const groups = n.groups.map((g) => `<div class="dd-g"><span class="lbl">${g.t}</span><ul${g.links.length > 5 ? ' class="two"' : ''}>${g.links.map(([t, d, h]) => `<li><a href="${h}"><b>${esc(t)}</b>${d ? `<span>${esc(d)}</span>` : ''}</a></li>`).join('')}</ul></div>`).join('');
    const all = n.all ? `<div class="dd-all"><a href="${n.all[0]}">${n.all[1]} ${ic('arrow', 'sm')}</a></div>` : '';
    return `<div class="dd"><button type="button" class="dd-b" aria-expanded="false" aria-controls="${pid}"${cur}>${n.label}${ic('chev', 'sm')}</button><div class="dd-p ${n.panel}" id="${pid}" hidden>${groups}${all}</div></div>`;
  }).join('');
  const mg = [
    ['On the wards', [['ABG interpretation', '/wards/abg-interpretation'], ['SOAP note', '/wards/soap-note'], ['Everything on the wards', '/wards']]],
    ['Shelf exams', [['Shelf guides by rotation', '/guides']]],
    ['Step 2', [['Readiness check', '/readiness'], ['Study schedule', '/research/dedicated-calendar'], ['Free 120', '/free120'], ['Percentiles', '/step-2-ck-percentiles'], ['Score by specialty', '/step-2-score-by-specialty']]],
    ['Research', [['NBME to Step 2', '/research/nbme-to-step-2']]],
  ];
  return `<header class="sn"><div class="wrap sn-in">${WM}
    <nav class="sn-links" aria-label="Primary">${items}</nav>
    ${store(ctx, 'nav', 'Get the app', 'btn-q sn-cta')}
    <button type="button" class="burger" aria-expanded="false" aria-controls="${p}-menu" aria-label="Menu">${ic('menu')}</button>
  </div>
  <div class="menu" id="${p}-menu" hidden><nav class="wrap" aria-label="Primary">
    ${mg.map(([t, xs]) => `<div><p class="lbl">${t}</p><ul>${xs.map(([x, h]) => `<li><a href="${h}">${x}${ic('chev-r', 'sm')}</a></li>`).join('')}</ul></div>`).join('')}
    <div class="m-cta">${store(ctx, 'nav', 'Get Step Gunner free', 'btn-act btn-lg btn-block')}<p class="fine">${FREE}. ${CARDS} Step 2 CK cards.</p></div>
  </nav></div></header>`;
}
function foot(ctx) {
  const cols = [
    ['On the wards', [['ABG interpretation', '/wards/abg-interpretation'], ['SOAP note', '/wards/soap-note'], ['Everything on the wards', '/wards']]],
    ['Shelf exams', [['By rotation', '/guides'], ['Internal medicine', '/guides/internal-medicine'], ['Surgery', '/guides/surgery'], ['Pediatrics', '/guides/pediatrics']]],
    ['Step 2', [['Readiness check', '/readiness'], ['Score predictor', '/step-2-score-predictor'], ['Percentiles', '/step-2-ck-percentiles'], ['Score by specialty', '/step-2-score-by-specialty'], ['Study schedule', '/research/dedicated-calendar'], ['Free 120', '/free120']]],
    ['Research', [['NBME to Step 2', '/research/nbme-to-step-2'], ['Free 120 to Step 2', '/research/free-120-to-step-2'], ['How the check works', '/readiness/methodology']]],
    ['App', [['Step Gunner for iPhone', null], ['Chiefs', '/chiefs'], ['Support', '/support']]],
    ['Legal', [['Privacy', '/privacy'], ['Terms', '/terms']]],
  ];
  const link = (x, h) => (h ? `<a href="${h}">${x}</a>` : `<a href="${esc(appStoreUrl(ctx.ct))}" data-ct="${ctx.ct}" data-loc="footer" data-page="${ctx.page}" data-type="${ctx.type}">${x}</a>`);
  return `<footer class="foot"><div class="wrap"><div class="foot-g">${cols.map(([t, xs]) => `<div><h3 class="lbl">${t}</h3><ul>${xs.map(([x, h]) => `<li>${link(x, h)}</li>`).join('')}</ul></div>`).join('')}</div>
    <div class="foot-b">${WM}<p>For exam preparation, not clinical advice. Rezumab LLC</p></div></div></footer>`;
}

/* ---------- the walkthrough: the live app, recorded on the simulator, one chapter per move ----------
   Each chapter is a screen recording (scripted UI test, status bar at 9:41, blue rings drawn where
   the test tapped). client.js plays them in order on two stacked <video> layers, so the next chapter is
   already buffered when the current one ends. Example readiness scores come from a debug launch flag
   that never writes to Firestore; the screens are otherwise the live 2.2.11 app. */
export const WALK = [
  { id: 'home', c: 'blue', t: 'Home is your day', d: 'Your readiness range sits on top. The TODAY card lays out the plan: your reviews first, then the next thing to do.', s: 9.7 },
  { id: 'today', c: 'gold', t: 'Tap START and answer', d: 'Pick an answer, then read why it is right and why every other choice loses.', s: 20.0 },
  { id: 'decks', c: 'purple', t: 'Pick a deck', d: 'NEW holds what you have not seen yet, deck by deck. REVIEW brings back what you have, weakest first.', s: 11.2 },
  { id: 'search', c: 'blue', t: 'Search any topic', d: 'Type a diagnosis. Each match opens its management chain, step by step, with the guideline it comes from.', s: 22.0 },
  { id: 'ward', c: 'green', t: 'Walk the ward round', d: 'Play the case one decision at a time, the way it gets asked on rounds.', s: 9.6 },
  { id: 'readiness', c: 'gold', t: 'Check your number', d: 'Readiness turns your NBME and UWSA scores into a Step 2 range, with the track record underneath. Example scores shown.', s: 14.0 },
];
// The ED Pathways preview: recorded on the ed-pathways test build (drafts shown under a DEBUG
// launch flag). Not in a released build, so it plays in its own player marked Preview.
export const WALK_PW = [
  { id: 'pw-find', c: 'blue', t: 'Pick what walked in', d: 'Open ED Pathways and pick the presentation. Airway, breathing and circulation come first, whatever walked in.', s: 9.7 },
  { id: 'pw-walk', c: 'green', t: 'Tap what the patient shows', d: 'Each fork is a finding: the ECG, V4R, how far the cath lab is. The pathway follows it down to the doses and the full chain.', s: 29.7 },
];
const totalS = (ch) => Math.round(ch.reduce((a, w) => a + w.s, 0));
function walkHtml(p, o) {
  const ch = o.chapters;
  const n = (i) => String(i + 1).padStart(2, '0');
  const data = esc(JSON.stringify(ch.map(({ id, c, t }) => ({ id, c, t }))));
  return `<div class="walk c-${ch[0].c}${o.flip ? ' walk-flip' : ''}" data-walk data-chapters="${data}"${o.band ? ' data-walk-aura' : ''}>
    <div class="walk-hd">
      <p class="kick">${o.badge ? `<span class="pv-badge">${o.badge}</span>` : '<span class="dot" aria-hidden="true"></span>'}${o.kick}</p>
      <h2 class="h-2" id="${p}-h">${o.h}</h2>
      <p class="sec-sub">${o.sub}</p>
    </div>
    <div class="walk-g">
      <ol class="walk-steps">${ch.map((w, i) => `<li><button type="button" class="walk-st c-${w.c}" data-step="${i}"${i === 0 ? ' aria-current="step"' : ''}>
        <span class="n num">${n(i)}</span><span class="tx"><b>${w.t}</b><span class="dsc"><span>${w.d}</span></span></span><span class="pr" aria-hidden="true"><i></i></span></button></li>`).join('')}</ol>
      <div class="walk-stage">
        <div class="walk-hud"><span class="rec" aria-hidden="true"></span><span class="lbl">${o.hud}</span><span class="lbl num" data-walk-count>01 / ${n(ch.length - 1)}</span></div>
        <div class="walk-bars" aria-hidden="true">${ch.map((w) => `<span style="flex-grow:${w.s}"><i></i></span>`).join('')}</div>
        <div class="walk-dev-w">
          <span class="walk-ghost num" aria-hidden="true" data-walk-ghost>01</span>
          <figure class="walk-win"><div class="dv">
            <video class="walk-v on" muted playsinline preload="none" width="800" height="1000" data-layer="0" aria-label="Screen recording of Step Gunner: ${esc(ch[0].t)}"></video>
            <video class="walk-v" muted playsinline preload="none" width="800" height="1000" data-layer="1" aria-hidden="true"></video>
            <button type="button" class="walk-play" data-walk-play hidden>${ic('arrow')}<span>Play the ${o.noun}</span></button>
          </div></figure>
        </div>
        <div class="walk-ctl">
          <p class="walk-now" aria-live="polite"><span class="lbl num" data-walk-num>01</span><b data-walk-title>${esc(ch[0].t)}</b></p>
          <button type="button" class="walk-pp" data-walk-pp aria-pressed="false" aria-label="Pause the ${o.noun}" data-noun="${o.noun}"><span class="i-pause" aria-hidden="true"></span><span class="i-play" aria-hidden="true"></span></button>
        </div>
      </div>
    </div>
  </div>`;
}
const walkLive = (p) => walkHtml(`${p}-walk`, {
  chapters: WALK, band: true, hud: 'Walkthrough', noun: 'walkthrough',
  kick: `The app in ${Math.round(totalS(WALK) / 10) * 10} seconds`,
  h: 'How to use Step Gunner, <span class="key">one tap at a time.</span>',
  sub: 'Recorded in the app at real speed. <span class="tapkey"><span class="tapring" aria-hidden="true"></span>Blue rings are taps.</span>',
});
const walkPreview = (p) => walkHtml(`${p}-pw`, {
  chapters: WALK_PW, flip: true, hud: 'Preview', noun: 'preview', badge: 'Preview',
  kick: 'Coming next',
  h: 'ED Pathways: from what walked in <span class="key">to the last order.</span>',
  sub: 'Being tested now, for a later release. This is the chest pain pathway on a test build: tap what the patient shows at each fork.',
});

/* ---------- the reel: the AI gunner clips, captioned with the moment the app plays them ---------- */
export const REEL = [
  { id: 'splash-15', c: 'blue', k: 'Every launch', t: 'A new clip opens the app each time. 15 of them, and none repeats until you have seen them all.', r: -4, y: 24 },
  { id: 'victory-1', c: 'gold', k: 'Perfect round', t: 'Get every card in a round right and a victory clip can go off.', r: -2.5, y: 8 },
  { id: 'kamehameha-2', c: 'green', k: 'Nine in a row', t: 'Charge the combo with eight right answers. The ninth unleashes the blast and 40 bonus XP.', r: -1, y: 0 },
  { id: 'victory-4', c: 'gold', k: 'Perfect round', t: 'Eleven clips in the perfect-round pool, drawn so you see them all.', r: 1, y: 4 },
  { id: 'splash-7', c: 'blue', k: 'Every launch', t: 'Women and men in the white coat, painted and photoreal.', r: 2.5, y: 12 },
  { id: 'overwhelmed-1', c: 'red', k: 'Rough round', t: 'Under 40 percent, the gunner gets swarmed. Next round, get even.', r: 4, y: 28 },
];
function reelHtml(p) {
  return `<div class="reel-w" data-reel>
    <div class="sec-hd reel-hd"><h2 class="h-2" id="${p}-reel-h">The gunner shows up <span class="key">when you earn it.</span></h2>
      <button type="button" class="reel-pp lbl" data-reel-pp aria-pressed="false">Pause the clips</button></div>
    <p class="sec-sub">AI-made clips that play inside the app at the moments that count.</p>
    <ul class="reel" aria-labelledby="${p}-reel-h">${REEL.map((r) => `<li class="rl c-${r.c}" style="--r:${r.r}deg;--y:${r.y}px">
      <video muted playsinline loop preload="none" width="480" height="854" data-src="/wards/reel/reel-${r.id}.mp4" data-poster="/wards/reel/reel-${r.id}.jpg" aria-hidden="true"></video>
      <div class="rl-cap"><span class="lbl">${r.k}</span><p>${r.t}</p></div></li>`).join('')}</ul>
  </div>`;
}

/* ---------- home: the readiness check, live ---------- */
const gx = (v) => `${(((Math.max(GMIN, Math.min(GMAX, v)) - GMIN) / (GMAX - GMIN)) * 100).toFixed(3)}%`;
export const HOME_ROWS = [['NBME 14', '240', '21'], ['UWSA 2', '250', '7']];
export function readinessOut(rows) {
  const res = computeReadiness(rows.map(([form, score, days]) => ({ form, score, days })));
  const P = res.proj;
  const ticks = [210, 220, 230, 240, 250, 260, 270];
  if (!P) {
    return `<p class="lbl">Projected Step 2 CK</p><p class="range"><span class="num">Enter a score</span></p>
      <ul class="facts"><li>One three-digit NBME or UWSA score is enough to start.</li></ul>`;
  }
  return `<p class="lbl">Projected Step 2 CK</p>
    <p class="range"><span class="num">${P.low}</span><span class="to">to</span><span class="num">${P.high}</span></p>
    <ul class="facts"><li>Most likely <b class="num">${P.center}</b></li><li><b class="num">${ordinal(percentile(P.center))}</b> percentile</li></ul>
    <div class="gauge" role="img" aria-label="Projected range ${P.low} to ${P.high} on a ${GMIN} to ${GMAX} scale, most likely ${P.center}, pass line ${PASS}">
      <div class="g-trk"><span class="g-pass" style="left:${gx(PASS)}"><span class="g-pl">Pass ${PASS}</span></span>
      <span class="g-band" style="left:${gx(P.low)};width:${(((Math.min(GMAX, P.high) - Math.max(GMIN, P.low)) / (GMAX - GMIN)) * 100).toFixed(3)}%"></span>
      <span class="g-mid" style="left:${gx(P.center)}"></span></div>
      <div class="g-ax" aria-hidden="true">${ticks.map((t) => `<span style="left:${gx(t)}">${t}</span>`).join('')}</div></div>`;
}
export function readinessRow(row, i, n) {
  const [f, s, d] = row;
  return `<tr data-row="${i}">
    <td><label class="sel"><span class="sr">Form ${i + 1}</span><select class="inp" data-rk="0">${FORMS.map((x) => `<option${x === f ? ' selected' : ''}>${x}</option>`).join('')}</select>${ic('chev', 'sm')}</label></td>
    <td><input class="inp" data-rk="1" inputmode="numeric" autocomplete="off" value="${esc(s)}" placeholder="240" aria-label="Score, form ${i + 1}"></td>
    <td><input class="inp" data-rk="2" inputmode="numeric" autocomplete="off" value="${esc(d)}" placeholder="21" aria-label="Days before the exam, form ${i + 1}"></td>
    <td class="c-rm">${n > 1 ? `<button type="button" class="rm" data-rrm="${i}" aria-label="Remove form ${i + 1}">${ic('x', 'sm')}</button>` : ''}</td></tr>`;
}
export const readinessRows = (rows) => rows.map((r, i) => readinessRow(r, i, rows.length)).join('');

export function homeHtml({ within7 = 80 } = {}) {
  const p = 'home';
  const ctx = { ct: 'home', page: 'home', type: 'home' };
  const proof = [['269', 'real score reports'], [`${within7}%`, 'within 7 points, out of sample'], [CARDS, 'Step 2 CK cards in the app'], ['4.8', 'App Store rating']];
  const routes = [
    { code: 'WARDS', cat: 'wards', icon: 'steth', t: 'On the wards', d: 'Notes, labs and gases: what to write, and what to say on rounds.', h: '/wards' },
    { code: 'SHELF', cat: 'shelf', icon: 'book', t: 'Shelf in a few weeks', d: 'What each shelf covers, the resources that matter, and a plan for the block.', h: '/guides' },
    { code: 'STEP 2', cat: 'step2', icon: 'target', t: 'Step 2 dedicated', d: '<b>Readiness check:</b> turn your NBME and UWSA scores into a Step 2 range.', h: '/readiness' },
    { code: 'ED', cat: 'ed', icon: 'pulse', t: 'ED rotation', d: 'What the emergency medicine shelf covers, and how to study for it on shift.', h: '/guides/emergency-medicine' },
  ];
  const tool = `<div class="sheet dark-card" data-rd>
    <div class="sheet-hd"><span class="lbl"><span class="dot gold" aria-hidden="true"></span>Readiness check</span><span class="lbl">Same math as the app</span></div>
    <div class="sheet-bd">
      <table class="forms">
        <thead><tr><th class="lbl c-form" scope="col">Form</th><th class="lbl" scope="col">Score</th><th class="lbl" scope="col">Days out</th><th class="c-rm" scope="col"><span class="sr">Remove</span></th></tr></thead>
        <tbody data-rrows>${readinessRows(HOME_ROWS)}</tbody>
      </table>
      <div class="rd-tools"><button type="button" class="chip" data-radd>${ic('plus', 'sm')}Add a form</button><a class="lnk" href="/readiness">Add your exam date in the full check${ic('arrow', 'sm')}</a></div>
      <div class="res" data-rres aria-live="polite">${readinessOut(HOME_ROWS)}</div>
    </div></div>`;
  const ask = cta(ctx, 'result', { t: 'Your forms are the floor. The weeks left decide the rest.', b: `Step Gunner carries this same readiness range, next to ${CARDS} Step 2 CK cards with spaced repetition.` });
  return `${nav(p, ctx)}<main id="page">
    <section class="hero" aria-labelledby="${p}-h1"><div class="wrap">
      <p class="refb" data-refb hidden></p>
      <div class="hero-g">
        <div class="hero-c">
          <p class="kick"><span class="dot" aria-hidden="true"></span>The clerkship year, then Step 2 CK</p>
          <h1 class="h-disp" id="${p}-h1">From your first pre&#8209;round to <span class="key">your Step 2 score.</span></h1>
          <p class="lede">Templates and lab reads for the wards, shelf guides by rotation, and a Step 2 readiness check that shows its work.</p>
          <div class="hero-act"><div class="row">${store(ctx, 'hero', 'Get Step Gunner free', 'btn-act btn-lg')}<a class="btn btn-q btn-lg hide-ph" href="#${p}-rd">Check your readiness</a></div>
            <p class="fine">${FREE}. ${CARDS} Step 2 CK cards.</p></div>
        </div>
        <div class="hero-stage stage" role="img" aria-label="${esc(ALT.home)}">
          <p class="stage-cap lbl">App screens</p>
          ${ecg('hero-ecg')}
          ${win('home', { eager: true, cls: 'hero-win' })}
        </div>
      <nav class="router" aria-labelledby="${p}-rt" data-sticky-start>
        <h2 class="router-t" id="${p}-rt">Where are you this week?</h2>
        <ul>${routes.map((r) => `<li><a class="route c-${r.cat}" href="${r.h}"><span class="badge" aria-hidden="true">${ic(r.icon)}</span><span class="rt-b"><span class="code">${r.code}</span><span class="t">${r.t}</span><span class="d">${r.d}</span></span>${ic('arrow', 'sm go')}</a></li>`).join('')}</ul>
      </nav>
      <dl class="proof">${proof.map(([n, l]) => `<div><dt>${n}</dt><dd>${l}</dd></div>`).join('')}</dl>
      </div>
    </div></section>
    <section class="stage-band rd-band c-step2" aria-labelledby="${p}-rd-h" id="${p}-rd"><div class="wrap">
      <div class="rd-g">
        <div class="rd-main">
          <p class="kick"><span class="dot gold" aria-hidden="true"></span>Step 2</p>
          <h2 class="h-2" id="${p}-rd-h">Step 2 dedicated? <span class="key">Start with your number.</span></h2>
          <p class="sec-sub">Enter your NBME and UWSA forms and get the range a calibrated model projects.</p>
          ${tool}
          <div class="rd-cta">${ask}</div>
        </div>
        <div class="rd-side">
          <ul class="rd-why">
            <li>${ic('checkc')}<div><b>Built on 269 real score reports</b><p>${within7}% landed within 7 points, out of sample.</p></div></li>
            <li>${ic('phone')}<div><b>The same range lives in the app</b><p>Check it on the web for free, then study against it.</p></div></li>
            <li>${ic('lock')}<div><b>Nothing you type here leaves the page</b><p>The check runs in your browser.</p></div></li>
          </ul>
          <a class="lnk on-dark" href="/research/nbme-to-step-2">How accurate it has been${ic('arrow', 'sm')}</a>
          <div class="rd-dev"><p class="stage-cap lbl">App screens</p>${win('readiness')}</div>
        </div>
      </div>
    </div></section>
    <section class="sec" aria-labelledby="${p}-wd"><div class="wrap">
      <div class="sec-hd"><h2 class="h-2" id="${p}-wd">On the wards <span class="key k-wards">this week</span></h2><a class="lnk" href="/wards">Everything on the wards${ic('arrow', 'sm')}</a></div>
      <p class="sec-sub">The pages students reach for between patients, each with the Step 2 angle.</p>
      <ul class="cards">${SITE.homeWards.map((id) => card(PAGES[id])).join('')}</ul>
    </div></section>
    <section class="sec" aria-labelledby="${p}-sh"><div class="wrap">
      <div class="sec-hd"><h2 class="h-2" id="${p}-sh">Shelf exams, <span class="key k-shelf">by rotation</span></h2><a class="lnk" href="/guides">Every shelf guide${ic('arrow', 'sm')}</a></div>
      <p class="sec-sub">What each shelf covers, and how to study for it during the rotation.</p>
      <ul class="tiles">${SITE.shelf.map(([c, n, slug]) => `<li><a class="tile c-shelf" href="/guides/${slug}"><span class="code">${c}</span><b>${n}</b><span class="s">Shelf guide</span></a></li>`).join('')}</ul>
    </div></section>
    <section class="stage-band app-band c-blue" aria-labelledby="${p}-walk-h" data-walk-band><div class="walk-aura" aria-hidden="true"></div><div class="wrap">
      ${walkLive(p)}
      ${reelHtml(p)}
      <div class="pw-w">${walkPreview(p)}</div>
      <div class="sec-hd app-hd"><h2 class="h-2" id="${p}-ap">What is in the app <span class="key">today</span></h2></div>
      <div class="live-g">
        <div><p class="lbl">Live now</p><ul class="ledger">${SITE.live.map(([t, d]) => `<li>${ic('check', 'sm')}<div><b>${t}</b><p>${d}</p></div><span class="tag live">Live</span></li>`).join('')}</ul></div>
        <div><p class="lbl">Coming</p><ul class="ledger">${SITE.coming.map(([t, d]) => `<li>${ic('plus', 'sm')}<div><b>${t}</b><p>${d}</p></div><span class="tag soon">Coming</span></li>`).join('')}</ul></div>
      </div>
    </div></section>
    ${band(ctx, p, { h: 'Read it on the wards. Answer it on Step 2.', b: `${CARDS} Step 2 CK cards, Next Best Step chains and spaced repetition, with your readiness range in the same app.` })}
    </main>${foot(ctx)}${sticky(ctx, `${CARDS} Step 2 CK cards`)}`;
}

/* ---------- page cards: a live page links, a planned one says so ---------- */
function card(pg) {
  const q = [pg.t, pg.d, pg.kw, ...(pg.get || [])].join(' ').toLowerCase().replace(/"/g, '');
  const kinds = `<span class="card-k">${pg.get.map((g) => `<span class="lbl">${g}</span>`).join('')}</span>`;
  if (!pg.href) {
    return `<li data-q="${esc(q)}"><div class="card c-wards soon">${kinds}<h3 class="card-t">${pg.t}</h3><p class="card-d">${pg.d}</p><span class="card-f"><span></span><span class="tag soon">Coming</span></span></div></li>`;
  }
  return `<li data-q="${esc(q)}"><a class="card c-wards" href="${pg.href}">${kinds}<h3 class="card-t">${pg.t}</h3><p class="card-d">${pg.d}</p>
    <span class="card-f">${pg.in ? `<span>On the ${pg.in} page</span>` : '<span></span>'}<span class="go">Open${ic('arrow', 'sm')}</span></span></a></li>`;
}

/* ---------- wards hub ---------- */
export function hubHtml() {
  const p = 'wards';
  const ctx = { ct: 'wards', page: 'wards', type: 'hub' };
  const nLive = SITE.pages.filter((x) => x.href).length;
  const nSoon = SITE.pages.length - nLive;
  const groups = SITE.groups.map((g, gi) => {
    const items = SITE.pages.filter((x) => x.g === g.id).sort((a, b) => (b.href ? 1 : 0) - (a.href ? 1 : 0));
    const live = items.filter((x) => x.href).length;
    return `<section class="grp" id="${p}-g-${g.id}" aria-labelledby="${p}-gh-${g.id}" data-grp${gi === 0 ? ' data-sticky-start' : ''}>
      <div class="grp-hd"><span class="badge" aria-hidden="true">${ic(g.icon)}</span><div class="grp-t"><h2 class="h-2" id="${p}-gh-${g.id}">${g.t}</h2><p class="when">${g.when}</p></div><span class="lbl">${live ? `${live} live` : 'Coming'}</span></div>
      <ul class="cards">${items.map((x) => card(x)).join('')}</ul></section>`;
  }).join('');
  return `${nav(p, ctx, { cur: 'wards' })}<main id="page">
    <section class="hub-hd" aria-labelledby="${p}-h1"><div class="wrap hub-g"><div class="hub-c">
      <nav class="crumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">On the wards</span></nav>
      <p class="kick"><span class="dot green" aria-hidden="true"></span>For the clerkship year</p>
      <h1 class="h-1" id="${p}-h1">On the <span class="key k-wards">wards</span></h1>
      <p class="stand">The templates, lab reads and bedside math you need between pre-rounds and sign-out. Each page gives you the thing first, then the method, then the Step 2 angle.</p>
      <div class="hub-top">${strip(ctx, { t: 'Studying for Step 2 between patients?', s: 'Spaced repetition that fits in the gaps of a ward day, a few minutes at a time.' })}</div>
      <div class="find"><label class="lbl" for="${p}-q">Find a page</label><div class="sbox">${ic('search')}<input id="${p}-q" type="search" autocomplete="off" placeholder="ABG, SOAP, Winter's, H&amp;P" data-hubq></div></div>
      <nav class="gjump" aria-label="Groups">${SITE.groups.map((g, i) => `<a href="#${p}-g-${g.id}"><span class="n">0${i + 1}</span>${g.t}</a>`).join('')}</nav>
      <p class="lbl count" aria-live="polite" data-hubc data-total="${SITE.pages.length}">${nLive} pages live, ${nSoon} coming</p>
    </div><div class="hub-stage stage c-wards" role="img" aria-label="${esc(ALT.pathway)}"><p class="stage-cap lbl">App screens</p>${win('pathway', { eager: true })}</div></div></section>
    <div class="wrap">${groups}
      <div class="empty" data-hube hidden><p><b>No page matches that yet.</b></p><p>Try a lab (ABG, gap), a note (SOAP, H&amp;P), or a task (fluids, insulin, EKG).</p><button type="button" class="btn btn-q" data-hubclr>Clear the search</button></div>
      <div style="height:48px"></div>
    </div></main>
    ${band(ctx, p, { h: 'Pages for the wards. Questions for Step 2.', b: `Step Gunner has ${CARDS} Step 2 CK cards and Next Best Step chains, with spaced repetition bringing back what you miss.` })}
    ${foot(ctx)}${sticky(ctx, 'Step 2 CK, between patients')}`;
}

/* ---------- article parts ---------- */
function citer(A) {
  const SRC = Object.fromEntries(A.sources.map((s) => [s.docId, s]));
  // A compact, linked source line: label and location for each citation, deduplicated.
  function cite(srcs, cls = 'srcl') {
    if (!srcs || !srcs.length) return '';
    const seen = new Set();
    const xs = srcs.filter((s) => { const k = `${s.docId}|${s.where}`; if (seen.has(k)) return false; seen.add(k); return true; });
    return `<p class="${cls}">${xs.map((s) => { const S = SRC[s.docId]; return `<a href="${esc(S.url)}" target="_blank" rel="noopener">${esc(S.label)}</a>, ${esc(s.where)}`; }).join('<span aria-hidden="true"> · </span>')}</p>`;
  }
  // Compact form: one linked label per source, locations in the title.
  function citeShort(srcs) {
    if (!srcs || !srcs.length) return '';
    const by = new Map();
    srcs.forEach((s) => { if (!by.has(s.docId)) by.set(s.docId, []); by.get(s.docId).push(s.where); });
    return `<p class="srcl srcs">${[...by.entries()].map(([id, ws]) => { const S = SRC[id]; return `<a href="${esc(S.url)}" target="_blank" rel="noopener" title="${esc(ws.join('; '))}">${esc(S.label.replace(/, a (review|teaching case)$/, ''))}</a>`; }).join('<span aria-hidden="true"> · </span>')}</p>`;
  }
  return { cite, citeShort };
}
const RULE = (t) => `<p class="rule"><span class="tagr">Our rule</span>${esc(t)}</p>`;
const DIFFER = (t) => `<p class="differ"><span class="tagd">Sources differ</span>${esc(t)}</p>`;
function shuffle(n, seed) {
  let a = seed | 0;
  const r = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const o = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i -= 1) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
  return o;
}
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// Display order per question: seeded, so a reload never moves the key; consecutive questions never key the same letter.
function orders(checks) {
  const os = checks.map((q) => shuffle(q.options.length, hash(q.id)));
  const key = (i) => os[i].indexOf(checks[i].answer_index);
  for (let i = 1; i < os.length; i += 1) { let guard = 0; while (key(i) === key(i - 1) && guard < 5) { os[i].push(os[i].shift()); guard += 1; } }
  return os;
}
function checksBlock(p, checks, cite) {
  const os = orders(checks);
  return `<div class="qcs">${checks.map((q, qi) => {
    const o = os[qi];
    const key = o.indexOf(q.answer_index);
    return `<div class="qc" data-key="${key}" data-qid="${q.id}">
      <p class="lbl">Quick check ${qi + 1} of ${checks.length}</p>
      <p class="qc-stem">${esc(q.stem)}</p>
      <p class="qc-q" id="${p}-${q.id}-q">${esc(q.question)}</p>
      <ol class="qc-o" aria-labelledby="${p}-${q.id}-q">${o.map((oi, i) => `<li><button type="button" class="opt" data-i="${i}"><span class="k">${'ABCDE'[i]}</span><span>${esc(q.options[oi])}</span><span class="m"></span></button></li>`).join('')}</ol>
      <div class="qc-r" aria-live="polite"><div class="qc-why" hidden><p>${esc(q.why)}</p>${cite(q.sources)}</div></div>
    </div>`;
  }).join('')}</div><p class="qscore" aria-live="polite" data-qscore data-n="${checks.length}">Answer all ${checks.length} to see your score.</p>`;
}
const faqBlock = (faq, cite) => `<div class="faq">${faq.map((f) => `<details><summary><span>${esc(f.q)}</span>${ic('plus', 'sm')}</summary><div class="fa"><p>${esc(f.a)}</p>${cite(f.sources)}</div></details>`).join('')}</div>`;
const relBlock = (rel) => `<div class="rel">${rel.map((r) => `<a href="${esc(r.href)}"><span class="lbl">${r.k}</span><span class="rt">${esc(r.t)}</span>${ic('arrow', 'sm')}</a>`).join('')}</div>`;
const refsBlock = (srcs) => `<div class="refs"><ol>${srcs.map((s) => `<li><span><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>. ${esc(s.title)}. <span class="lic">${esc(s.licence)}</span></span></li>`).join('')}</ol></div>`;
const sec = (p, id, ix, title, body) => `<section class="asec" id="${p}-${id}" aria-labelledby="${p}-${id}-h"><div class="s-hd"><span class="ix">${ix}</span><h2 class="h-2" id="${p}-${id}-h">${title}</h2></div>${body}</section>`;
const toc = (p, items) => `<aside class="toc" aria-label="On this page"><p class="lbl">On this page</p><ol>${items.map(([id, t], i) => `<li><a href="#${p}-${id}"${i === 0 ? ' aria-current="true"' : ''}>${t}</a></li>`).join('')}</ol></aside>`;
const otp = (p, items) => `<details class="otp"><summary><span class="lbl">On this page</span>${ic('chev', 'sm')}</summary><ol>${items.map(([id, t]) => `<li><a href="#${p}-${id}">${t}</a></li>`).join('')}</ol></details>`;
const words = (o) => JSON.stringify(o).replace(/"(docId|where|url|licence|id|sources)":"[^"]*"/g, '').split(/\s+/).length;
export const BYLINE = 'Danny Varghese';
export const CREDENTIAL = 'MS4, Texas A&M College of Medicine';
function artHead(p, A, o) {
  const mins = Math.max(1, Math.round(words(o.countFrom) / 230));
  return `<header class="art-hd">
    <nav class="crumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/wards">On the wards</a><span aria-hidden="true">/</span><span aria-current="page">${o.crumb}</span></nav>
    <p class="kick"><span class="dot green" aria-hidden="true"></span>${o.eyebrow}</p>
    <h1 class="h-1" id="${p}-h1">${keyed(A.h1, o.key)}</h1>
    <p class="stand">${o.promise}</p>
    <p class="meta"><span>By <b>${BYLINE}</b>, ${esc(CREDENTIAL)}</span><span><b>${A.sources.length}</b> sources</span><span>About <b>${mins}</b> min read</span></p>
    <p class="disc-top">${ic('warn', 'sm')}<span>${esc(A.disclaimer)}</span></p>
  </header>`;
}

/* ---------- try the case: one live Next Best Step chain, word for word from the app ----------
   Stakes: the vitals strip and the marked stem. Big question: the card's own question.
   A wrong pick gets the card's whyWrong, never a fake "correct". The reveal opens the
   next fork with its written options, unanswered; the rest of the chain is in the app
   (Chain Search, then Walk the ward round). */
const VLV = { panic: 'pn', crit: 'cr', warn: 'wn' };
const VTR = { up: '▲', down: '▼' };   // the app's own glyphs: above or below the normal range
const marked = (t) => esc(t).replace(/\[([+-])([^\]]+)\]/g, (m, k, x) => `<mark class="${k === '+' ? 'pos' : 'neg'}">${x}</mark>`);
const WORLD = { emergency: 'Emergency', endo: 'Endocrine' };
function caseBlock(p, c, ctx, o) {
  const at = c.chainAnswer;
  const ord = shuffle(c.choices.length, hash(`case-${c.id}`));
  if (ord[0] === c.choices.indexOf(c.correctAnswer)) ord.push(ord.shift());   // never key the first slot
  const key = ord.indexOf(c.choices.indexOf(c.correctAnswer));
  const nx = [c.chain[at + 1], ...c.chainDistractors[at + 1]];
  const nord = shuffle(nx.length, hash(`case-${c.id}-next`));
  if (nord[0] === 0) nord.push(nord.shift());
  const ev = c.evidence;
  return `<div class="tc" data-tc data-key="${key}" data-nbs="${c.id}">
    <div class="tc-hd"><span class="lbl">${ic('pulse', 'sm')}${esc(WORLD[c.world] || c.world)} · Next Best Step · NBS ${c.id}</span><span class="lbl">Step ${at + 1} of ${c.chain.length}</span></div>
    <ul class="tc-vit" aria-label="Vitals and labs">${c.vitalsStrip.map((v) => `<li data-l="${VLV[v.level] || ''}"><span class="vl">${esc(v.label)}</span><span class="vv">${esc(v.value)}${v.unit ? `<small> ${esc(v.unit)}</small>` : ''}${VTR[v.trend] ? `<span class="tr" title="${v.trend === 'up' ? 'above normal' : 'below normal'}">${VTR[v.trend]}</span>` : ''}</span></li>`).join('')}</ul>
    <p class="tc-stem">${marked(c.triggerMarked)}</p>
    <p class="tc-q" id="${p}-tc-q">${esc(c.question)}</p>
    <ol class="tc-o" aria-labelledby="${p}-tc-q">${ord.map((oi, i) => `<li><button type="button" class="opt tco" data-i="${i}"><span class="k">${'ABCDE'[i]}</span><span>${esc(c.choices[oi])}</span><span class="m"></span></button></li>`).join('')}</ol>
    <div class="tc-r" aria-live="polite" hidden>
      <p class="tc-res"></p>
      <div><p class="lbl">${ic('checkc', 'sm')}Why it is first</p><p>${esc(c.whyRight)}</p></div>
      <div><p class="lbl">${ic('xc', 'sm')}Why the others lose</p><p>${esc(c.whyWrong)}</p></div>
      ${c.trap ? `<div class="tc-trap"><p class="lbl">${ic('warn', 'sm')}The Step 2 trap</p><p>${esc(c.trap)}</p></div>` : ''}
      <p class="srcl">Source: <a href="${esc(ev.url)}" target="_blank" rel="noopener">${esc(ev.body)} ${ev.year}, ${esc(ev.title)}</a></p>
      <div class="tc-next">
        <p class="lbl">Step ${at + 2} of ${c.chain.length}</p>
        <p class="tc-done">${ic('check', 'sm')}<span>${esc(c.chain[at])}</span></p>
        <p class="tc-q">What comes next?</p>
        <ul class="tc-o2">${nord.map((oi) => `<li>${esc(nx[oi])}</li>`).join('')}</ul>
        <div class="tc-cta"><div><b>${o.t}</b><span>${o.b}</span></div>${store(ctx, 'case', 'Get Step Gunner free')}</div>
      </div>
    </div>
  </div>`;
}

/* ---------- the ABG interpreter: interpreter_spec, step by step ---------- */
const n1 = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(1));
const n2 = (x) => x.toFixed(2);
const sgn = (x) => (x > 0 ? `+${n1(x)}` : n1(x));
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const flagH = (f) => (f ? `<span class="flag">${f}</span>` : '<span class="flag nil"><span class="sr">No flag</span></span>');
const rr = (o) => `<li class="rr${o.cls ? ` ${o.cls}` : ''}">${o.flagHtml || flagH(o.flag)}<div class="rr-n"><b>${o.name}</b>${o.sub ? `<span>${o.sub}</span>` : ''}${o.notes || ''}${o.src || ''}</div><span class="rr-v">${o.val == null ? '' : o.val}${o.unit ? `<small>${o.unit}</small>` : ''}</span></li>`;
const PRIMARY_LABEL = { 'mixed: respiratory acidosis and metabolic alkalosis': 'respiratory acidosis plus metabolic alkalosis', 'mixed: metabolic acidosis and respiratory alkalosis': 'metabolic acidosis plus respiratory alkalosis', none: 'no primary disorder on the gas' };

export function abgEngine(A) {
  const SPEC = A.interpreter_spec;
  const SIN = Object.fromEntries(SPEC.inputs.map((i) => [i.id, i]));
  const KON = Object.fromEntries(SPEC.constants.map((c) => [c.name, c.value]));
  const STEP = Object.fromEntries(SPEC.steps.map((s) => [s.id, s]));
  const WORKED = SPEC.tests.filter((t) => /^Worked case/.test(t.note));
  const { citeShort } = citer(A);
  const sc = (id) => citeShort(STEP[id].sources);

  function compute(v) {
    const { ph, paco2, hco3, na, cl, albumin, pao2, fio2, age } = v;
    const albRef = v.albumin_ref == null ? 4.0 : v.albumin_ref;
    const timing = v.timing || 'acute';
    const V = {};
    const R = { V, timing, albRef };
    // s0 consistency
    V.calc_pH = 6.1 + Math.log10(hco3 / (0.03 * paco2));
    R.inconsistent = Math.abs(V.calc_pH - ph) > 0.05;
    // s1 pH
    V.status = ph < 7.35 ? 'acidemia' : ph > 7.45 ? 'alkalemia' : 'normal range';
    V.side = ph < 7.40 ? 'acid' : ph > 7.40 ? 'alkaline' : 'neutral';
    // s2 primary
    let primary = null;
    R.tie = false; R.recheck = false;
    if (V.side === 'acid') {
      if (hco3 < 24) { primary = 'metabolic acidosis'; R.tie = paco2 > 40; } else if (paco2 > 40) primary = 'respiratory acidosis'; else R.recheck = true;
    } else if (V.side === 'alkaline') {
      if (hco3 > 24) { primary = 'metabolic alkalosis'; R.tie = paco2 < 40; } else if (paco2 < 40) primary = 'respiratory alkalosis'; else R.recheck = true;
    } else if (paco2 > 45 && hco3 > 26) primary = 'mixed: respiratory acidosis and metabolic alkalosis';
    else if (paco2 < 35 && hco3 < 22) primary = 'mixed: metabolic acidosis and respiratory alkalosis';
    else primary = 'none';
    if (primary) V.primary = primary;
    R.advisory = V.status === 'normal range' && ((paco2 > 45 && hco3 > 26) || (paco2 < 35 && hco3 < 22));
    // s3 compensation (a single primary process only)
    if (primary === 'metabolic acidosis' || primary === 'metabolic alkalosis') {
      const exp = primary === 'metabolic acidosis' ? 1.5 * hco3 + 8 : 0.7 * hco3 + 20;
      const tol = primary === 'metabolic acidosis' ? 2 : 5;
      V.expected_paco2 = exp; V.expected_range = [exp - tol, exp + tol];
      R.comp = paco2 > exp + tol ? 'plus a respiratory acidosis' : paco2 < exp - tol ? 'plus a respiratory alkalosis' : 'appropriate respiratory compensation';
      R.compFlag = paco2 > exp + tol ? 'H' : paco2 < exp - tol ? 'L' : null;
    } else if (primary === 'respiratory acidosis' || primary === 'respiratory alkalosis') {
      let lo; let hi;
      if (primary === 'respiratory acidosis') {
        const d = paco2 - 40;
        V.expected_hco3_acute = 24 + 0.1 * d; V.expected_hco3_chronic = 24 + 0.4 * d;
        const exp = timing === 'acute' ? V.expected_hco3_acute : V.expected_hco3_chronic;
        V.expected_hco3 = exp; lo = 0.9 * exp; hi = 1.1 * exp;
      } else {
        const d = 40 - paco2;
        V.expected_hco3_acute = 24 - 0.2 * d; V.expected_hco3_chronic = [24 - 0.5 * d, 24 - 0.4 * d];
        if (timing === 'acute') { lo = 0.9 * V.expected_hco3_acute; hi = 1.1 * V.expected_hco3_acute; } else { lo = 0.9 * (24 - 0.5 * d); hi = 1.1 * (24 - 0.4 * d); }
      }
      V.expected_range = [lo, hi];
      R.comp = hco3 < lo ? 'plus a metabolic acidosis' : hco3 > hi ? 'plus a metabolic alkalosis' : `appropriate ${timing} compensation`;
      R.compFlag = hco3 < lo ? 'L' : hco3 > hi ? 'H' : null;
    }
    // s4 anion gap. The spec keys this on "s2 named a metabolic acidosis", which includes the mixed label.
    const namesMetAcid = /metabolic acidosis/.test(primary || '');
    if (na != null && cl != null) {
      V.ag = na - (cl + hco3);
      if (albumin != null) V.ag_corrected = V.ag + 2.5 * (albRef - albumin);
      V.ag_used = albumin != null ? V.ag_corrected : V.ag;
      const u = V.ag_used;
      if (u > 12 && (namesMetAcid || u >= 20)) { R.gap = 'hagma'; R.gap20 = u >= 20; } else if (u > 12) R.gap = 'mild'; else if (u >= 8) R.gap = namesMetAcid ? 'nagma' : 'normal'; else R.gap = 'low';
      // s5 delta
      if (R.gap === 'hagma') {
        V.delta_gap = (u - 12) - (24 - hco3);
        R.dg = V.delta_gap > 6 ? 'alk' : V.delta_gap < -6 ? 'nagma' : 'none';
        if (hco3 < 24) { V.delta_ratio = (u - 12) / (24 - hco3); R.dr = V.delta_ratio < 1 ? 'nagma' : V.delta_ratio > 2 ? 'alk' : 'none'; } else { V.delta_ratio = null; R.dr = null; }
        R.borderline = R.dr != null && R.dr !== R.dg;
      }
    }
    // s6 oxygenation
    if (pao2 != null && fio2 != null) {
      V.PAO2 = fio2 * (KON.PATM - KON.PH2O) - paco2 / KON.RQ;
      V.Aa = V.PAO2 - pao2;
      V.pao2_expected_rough = fio2 * 100 * 5;
      R.room = Math.abs(fio2 - 0.21) < 1e-9;
      if (R.room) {
        V.hypoxemia_grade = pao2 >= 80 ? 'none' : pao2 >= 60 ? 'mild' : pao2 >= 40 ? 'moderate' : 'severe';
        if (age != null) {
          V.age_adjusted_pao2 = 100 - 0.3 * age;
          V.Aa_expected_breathe = (age + 10) / 4; V.Aa_expected_secco = 2.5 + 0.21 * age; V.Aa_expected_statpearls = age / 4 + 4;
          const ex = [V.Aa_expected_breathe, V.Aa_expected_secco, V.Aa_expected_statpearls];
          V.Aa_class = V.Aa <= Math.min(...ex) ? 'normal for age' : V.Aa > Math.max(...ex) ? 'raised' : 'borderline';
        }
      }
    }
    return R;
  }
  // The frozen tests in interpreter_spec.tests: numbers within 0.01, labels exact.
  function tests() {
    return SPEC.tests.map((t) => {
      const R = compute(t.inputs);
      const bad = [];
      Object.entries(t.expect).forEach(([k, e]) => {
        const g = R.V[k];
        const eq = (a, b) => (typeof a === 'number' ? typeof b === 'number' && Math.abs(a - b) <= 0.01 + 1e-9 : a === b);
        const ok = Array.isArray(e) ? Array.isArray(g) && e.length === g.length && e.every((x, i) => eq(x, g[i])) : eq(e, g);
        if (!ok) bad.push({ k, expect: e, got: g });
      });
      return { name: t.name, pass: bad.length === 0, bad };
    });
  }
  function summary(R, v) {
    const V = R.V;
    if (!V.primary || V.primary === 'none') {
      const head = R.recheck ? 'Recheck the sample: the values do not point one way' : 'No primary disorder on the gas';
      const gap = R.gap === 'hagma' ? `; high anion gap metabolic acidosis (gap ${n1(V.ag_used)})` : '';
      return { head, line: `${R.inconsistent ? `Calculated pH ${n2(V.calc_pH)} does not match ${v.ph}; ` : ''}${head.toLowerCase()}${gap}.` };
    }
    let core = PRIMARY_LABEL[V.primary] || V.primary;
    if (V.primary === 'metabolic acidosis' && R.gap === 'hagma') core = 'high anion gap metabolic acidosis';
    if (V.primary === 'metabolic acidosis' && R.gap === 'nagma') core = 'normal anion gap metabolic acidosis';
    const parts = [];
    if (R.comp) parts.push(/^appropriate/.test(R.comp) ? `with ${R.comp}` : R.comp);
    if (R.gap === 'hagma' && V.primary !== 'metabolic acidosis') parts.push(`with a high anion gap (${n1(V.ag_used)})`);
    if (R.gap === 'hagma') {
      const add = { alk: 'an added metabolic alkalosis', nagma: 'an added normal gap acidosis', none: null }[R.dg];
      if (R.borderline) parts.push('delta-delta borderline');
      else if (add) parts.push(`and ${add} on the delta-delta`);
    }
    if (R.gap === 'mild') parts.push(`gap ${n1(V.ag_used)}, mildly raised`);
    if (R.gap === 'low') parts.push(`low gap (${n1(V.ag_used)})`);
    const head = cap1(`${core}${parts.length ? ` ${parts[0]}` : ''}`);
    const oxy = V.Aa != null ? `; A-a gradient ${n1(V.Aa)}${V.Aa_class ? `, ${V.Aa_class}` : ''}${V.hypoxemia_grade && V.hypoxemia_grade !== 'none' ? `, ${V.hypoxemia_grade} hypoxemia` : ''}` : '';
    const status = V.status === 'normal range' ? 'pH in the normal range' : cap1(V.status);
    const line = `${R.inconsistent ? `Check the sample (calculated pH ${n2(V.calc_pH)}). ` : ''}${status}: ${core}${parts.length ? ` ${parts.join(', ')}` : ''}${oxy}.`;
    return { head, line };
  }
  // st = { v: inputs, bad: {field: true} }; sets st.summary for the copy button.
  function read(st) {
    const v = st.v;
    const missing = ['ph', 'paco2', 'hco3'].filter((k) => v[k] == null || st.bad[k]);
    if (missing.length) {
      st.summary = null;
      return `<div class="rep-hd"><span class="lbl">The read</span><span class="lbl">Updates as you type</span></div>
        <div class="rep-empty"><p class="verdict">Enter pH, PaCO<sub>2</sub> and HCO<sub>3</sub> to read the gas.</p>
        <p>Sodium and chloride add the anion gap and the delta-delta. PaO<sub>2</sub> with FiO<sub>2</sub> and age adds the A-a gradient. Or load a worked case.</p></div>`;
    }
    const opt = (k) => (st.bad[k] ? null : v[k]);
    const R = compute({ ph: v.ph, paco2: v.paco2, hco3: v.hco3, na: opt('na'), cl: opt('cl'), albumin: opt('albumin'), albumin_ref: v.albumin_ref, timing: v.timing, pao2: opt('pao2'), fio2: opt('fio2'), age: opt('age') });
    const V = R.V;
    const rows = [];
    if (R.inconsistent) rows.push(rr({ cls: 'warn', flagHtml: '<span class="flag warnf" aria-hidden="true">!</span>', name: 'Check the sample', sub: esc(`Calculated pH ${n2(V.calc_pH)} does not match ${v.ph}: check the sample or the numbers.`), val: n2(V.calc_pH), src: sc('s0_consistency') }));
    const stTxt = V.status === 'normal range' ? `pH in the normal range, ${V.side === 'neutral' ? 'exactly 7.40' : `${V.side} side of 7.40`}` : `${cap1(V.status)}, ${V.status === 'acidemia' ? 'under 7.35' : 'over 7.45'}`;
    rows.push(rr({ flag: V.status === 'acidemia' ? 'L' : V.status === 'alkalemia' ? 'H' : null, name: 'pH', sub: esc(stTxt), val: n2(v.ph), src: sc('s1_ph') }));
    let pNotes = '';
    if (R.recheck) pNotes += '<p class="warnline">The pH and values do not point the same way: recheck.</p>';
    if (R.advisory) pNotes += '<p class="advl">A normal pH with PaCO<sub>2</sub> and HCO<sub>3</sub> both abnormal is a clue to a mixed disorder.</p>';
    if (R.tie) pNotes += RULE('HCO3 and PaCO2 both point the same way, so the metabolic process is named primary and the compensation check finds the respiratory one. The final read does not depend on which is called primary.');
    rows.push(rr({ name: 'Primary process', sub: V.primary ? `<strong>${esc(cap1(PRIMARY_LABEL[V.primary] || V.primary))}</strong>` : '<strong>None named</strong>', notes: pNotes, src: sc('s2_primary') }));
    if (R.comp) {
      const met = /^metabolic/.test(V.primary);
      const rng = `${n1(V.expected_range[0])} to ${n1(V.expected_range[1])}`;
      let sub; let name;
      if (met) {
        name = V.primary === 'metabolic acidosis' ? "Expected PaCO<sub>2</sub>, Winter's" : 'Expected PaCO<sub>2</sub>';
        sub = `${esc(V.primary === 'metabolic acidosis' ? `1.5 x ${v.hco3} + 8 = ${n1(V.expected_paco2)}, range ${rng}` : `0.7 x ${v.hco3} + 20 = ${n1(V.expected_paco2)}, range ${rng}`)}. <strong>${cap1(R.comp)}.</strong>`;
      } else {
        name = `Expected HCO<sub>3</sub>, ${R.timing}`;
        const other = R.timing === 'acute' ? 'chronic' : 'acute';
        const ov = other === 'acute' ? V.expected_hco3_acute : V.expected_hco3_chronic;
        const ovTxt = Array.isArray(ov) ? `${n1(ov[0])} to ${n1(ov[1])}` : n1(ov);
        sub = `${esc(`Range ${rng}`)}. <strong>${cap1(R.comp)}.</strong> ${esc(`If ${other}, expected ${ovTxt}.`)}`;
      }
      rows.push(rr({ flag: R.compFlag, name, sub, val: n1(met ? v.paco2 : v.hco3), unit: met ? 'mmHg' : 'mmol/L', src: sc('s3_compensation') }));
    }
    if (V.ag != null) {
      const gapTxt = {
        hagma: 'High anion gap metabolic acidosis.',
        mild: 'Gap mildly raised without a low HCO3: read it with the clinical picture.',
        nagma: 'Normal anion gap (hyperchloremic) acidosis: bicarbonate loss (often GI) or chloride gain (saline); a urine anion gap separates gut from kidney.',
        normal: 'Normal gap.',
        low: 'Low gap: check albumin, then paraproteins, calcium, magnesium, lithium.',
      }[R.gap];
      const corr = V.ag_corrected != null;
      let notes = '';
      if (!corr && R.gap20) notes += '<p class="advl">A gap of 20 or more means a metabolic acidosis whatever the pH.</p>';
      if (!corr && R.gap === 'mild') notes += RULE(STEP.s4_anion_gap.judgment);
      notes += DIFFER('Normal 8 to 12 (Habib, Tucker; the ADA calls over 12 high), or 8 to 16 in a 2009 poisoning review. This read uses 12. Use your own lab\'s range.');
      rows.push(rr({ flag: V.ag > 12 ? 'H' : V.ag < 8 ? 'L' : null, name: 'Anion gap', sub: `${esc(`${v.na} - (${v.cl} + ${v.hco3}) = ${n1(V.ag)}.`)}${corr ? '' : ` <strong>${esc(gapTxt)}</strong>`}`, notes, val: n1(V.ag), src: sc('s4_anion_gap') }));
      if (corr) {
        let cn = '';
        if (R.gap20) cn += '<p class="advl">A gap of 20 or more means a metabolic acidosis whatever the pH.</p>';
        if (R.gap === 'mild') cn += RULE(STEP.s4_anion_gap.judgment);
        cn += DIFFER(`Normal albumin 4.0 g/dL (StatPearls formula, Habib) or 4.5 g/dL (Tucker). This read uses ${R.albRef.toFixed(1)}; switch it above.`);
        rows.push(rr({ flag: V.ag_corrected > 12 ? 'H' : V.ag_corrected < 8 ? 'L' : null, name: 'Gap, corrected for albumin', sub: `${esc(`${n1(V.ag)} + 2.5 x (${R.albRef.toFixed(1)} - ${v.albumin.toFixed(1)}) = ${n1(V.ag_corrected)}.`)} <strong>${esc(gapTxt)}</strong>`, notes: cn, val: n1(V.ag_corrected) }));
      }
    }
    if (V.delta_gap != null) {
      const dgTxt = { alk: 'plus a metabolic alkalosis', nagma: 'plus a normal gap acidosis', none: 'no second metabolic process' }[R.dg];
      rows.push(rr({ flag: V.delta_gap > 6 ? 'H' : V.delta_gap < -6 ? 'L' : null, name: 'Delta gap', sub: `${esc(`(${n1(V.ag_used)} - 12) - (24 - ${v.hco3}) = ${sgn(V.delta_gap)}; -6 to +6 is none.`)} <strong>${cap1(dgTxt)}.</strong>`, val: sgn(V.delta_gap), src: sc('s5_delta') }));
      if (V.delta_ratio != null) {
        const drTxt = { nagma: 'plus a normal gap acidosis', alk: 'plus a metabolic alkalosis, or a high baseline HCO3', none: 'pure high gap acidosis' }[R.dr];
        let dn = DIFFER('Cut points 1 and 2 (StatPearls, Bruno); Tucker uses 0.8 and 1.2.');
        if (R.borderline) dn = `<p class="warnline">Borderline: the delta gap and the delta ratio disagree.</p>${RULE('Calling it borderline when the two disagree is our rule.')}${dn}`;
        rows.push(rr({ flag: V.delta_ratio < 1 ? 'L' : V.delta_ratio > 2 ? 'H' : null, name: 'Delta ratio', sub: `${esc(`(${n1(V.ag_used)} - 12) / (24 - ${v.hco3}) = ${n2(V.delta_ratio)}; 1 to 2 is pure.`)} <strong>${esc(cap1(drTxt))}.</strong>`, notes: dn, val: n2(V.delta_ratio) }));
      } else {
        rows.push(rr({ name: 'Delta ratio', sub: 'Not defined with HCO<sub>3</sub> 24 or more; the delta gap decides.' }));
      }
    }
    if (V.PAO2 != null) {
      const fio2 = opt('fio2');
      const gradeTxt = V.hypoxemia_grade ? (V.hypoxemia_grade === 'none' ? 'No hypoxemia on room air' : `${cap1(V.hypoxemia_grade)} hypoxemia on room air`) : 'On supplemental oxygen';
      const adj = V.age_adjusted_pao2 != null ? ` Age-adjusted room-air PaO2 ${n1(V.age_adjusted_pao2)}.` : '';
      rows.push(rr({ flag: V.hypoxemia_grade && V.hypoxemia_grade !== 'none' ? 'L' : null, name: 'PaO<sub>2</sub>', sub: esc(`${gradeTxt}. Rough check: about ${n1(V.pao2_expected_rough)} expected on FiO2 ${n2(fio2)}.${adj}`), val: n1(v.pao2), unit: 'mmHg' }));
      let an = '';
      let sub = esc(`PAO2 = ${n2(fio2)} x (760 - 47) - ${v.paco2} / 0.8 = ${n1(V.PAO2)}; gradient ${n1(V.PAO2)} - ${v.pao2}.`);
      if (V.Aa_class) {
        const why = V.Aa_class === 'raised' ? 'Raised: V/Q mismatch, shunt or diffusion limitation.' : V.Aa_class === 'borderline' ? 'Borderline: between the age formulas.' : `Normal for age.${V.hypoxemia_grade !== 'none' ? (v.paco2 > 45 ? ' Hypoventilation explains the hypoxemia.' : v.paco2 >= 35 ? ' Consider low inspired oxygen (altitude).' : '') : ''}`;
        sub += ` <strong>${esc(why)}</strong>`;
        an += DIFFER(`Expected at ${v.age}, three published formulas: StatPearls age / 4 + 4 = ${n1(V.Aa_expected_statpearls)}; Breathe (age + 10) / 4 = ${n1(V.Aa_expected_breathe)}; Secco 2.5 + 0.21 x age = ${n1(V.Aa_expected_secco)}.`);
        an += RULE('Raised only above all three formulas, normal only at or below all three, borderline in between.');
      } else if (R.room) {
        sub += ' Enter age to compare with the expected gradient.';
      } else {
        sub += ' No age comparison on supplemental oxygen: the expected gradient assumes room air.';
      }
      rows.push(rr({ flag: V.Aa_class === 'raised' ? 'H' : null, name: 'A-a gradient', sub, notes: an, val: n1(V.Aa), unit: 'mmHg', src: sc('s6_oxygenation') }));
    }
    const sum = summary(R, v);
    st.summary = sum;
    return `<div class="rep-hd"><span class="lbl">The read</span><span class="lbl">Updates as you type</span></div>
      <p class="verdict">${esc(sum.head)}</p>
      <ol class="rep">${rows.map((r, i) => r.replace('<li class="rr', `<li style="--i:${i}" class="rr`)).join('')}</ol>
      <div class="readline"><span class="lbl">For your note</span><p data-sum>${esc(sum.line)}</p>
        <div class="row"><button type="button" class="btn btn-q" data-copy="read">${ic('copy', 'sm')}<span>Copy the read</span></button><span class="status" data-status aria-live="polite"></span></div></div>`;
  }
  function initial() {
    const v = {};
    SPEC.inputs.forEach((i) => { v[i.id] = i.default != null ? i.default : null; });
    return { v, bad: {} };
  }
  return { SPEC, SIN, WORKED, compute, tests, read, initial };
}

function abgField(p, f, req) {
  const id = `${p}-f-${f.id}`;
  const nm = { ph: 'pH', paco2: 'PaCO<sub>2</sub>', hco3: 'HCO<sub>3</sub>', na: 'Na', cl: 'Cl', albumin: 'Albumin', pao2: 'PaO<sub>2</sub>', fio2: 'FiO<sub>2</sub>', age: 'Age' }[f.id];
  const unit = { mmHg: 'mmHg', 'mmol/L': 'mmol/L', 'g/dL': 'g/dL', fraction: 'fraction', years: 'yr' }[f.unit] || '';
  const dflt = f.default != null ? ` value="${f.default}"` : '';
  return `<div class="fld"><label for="${id}"><span>${nm}</span>${unit ? `<span class="u">${unit}</span>` : ''}</label>
    <input class="inp" id="${id}" data-f="${f.id}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false"${dflt} aria-describedby="${id}-e"${req ? ' aria-required="true"' : ''}>
    <span class="err" id="${id}-e" hidden></span>${f.id === 'albumin' ? '<span class="fopt">Optional</span>' : ''}</div>`;
}
const seg = (p, inp) => `<div class="segf" role="group" aria-labelledby="${p}-sg-${inp.id}"><span class="lbl" id="${p}-sg-${inp.id}">${esc(inp.label)}</span><div class="segb">${inp.choices.map((c) => `<button type="button" data-seg="${inp.id}" data-v="${c.value}" aria-pressed="${c.value === inp.default}">${esc(c.label)}</button>`).join('')}</div></div>`;
function abgTool(p, ctx, A, E) {
  const g = (ids) => ids.map((id) => abgField(p, E.SIN[id], E.SIN[id].required)).join('');
  const caseNames = { dka: 'DKA', vomiting: 'Vomiting', copd: 'COPD', aspirin: 'Aspirin' };
  return `<section class="tool" aria-labelledby="${p}-tool-h" id="${p}-tool">
    <div class="sheet dark-card">
      <div class="sheet-hd"><h2 class="lbl" id="${p}-tool-h">ABG interpreter</h2><span class="lbl"><span class="dot green" aria-hidden="true"></span>Stays in your browser</span></div>
      <div class="abg-g">
        <form class="abg-in" data-abg="${p}" novalidate>
          <fieldset class="fs"><legend class="lbl">Blood gas</legend><div class="fgrid">${g(['ph', 'paco2', 'hco3'])}</div>${seg(p, E.SIN.timing)}</fieldset>
          <fieldset class="fs"><legend class="lbl">Chemistry, for the gap</legend><div class="fgrid">${g(['na', 'cl', 'albumin'])}</div>${seg(p, E.SIN.albumin_ref)}</fieldset>
          <fieldset class="fs"><legend class="lbl">Oxygenation, optional, for the A-a gradient</legend><div class="fgrid">${g(['pao2', 'fio2', 'age'])}</div><p class="fine">Sea level assumed. FiO<sub>2</sub> as a fraction: 0.21 on room air.</p></fieldset>
          <div class="presets"><span class="lbl">Or load a worked case</span>${A.worked_cases.map((c, i) => `<button type="button" class="chip" data-preset="${i}">${caseNames[c.id] || esc(c.title)}</button>`).join('')}<button type="button" class="chip clr" data-abgclr>Clear</button></div>
        </form>
        <div class="abg-out" id="${p}-out" aria-live="polite">${E.read(E.initial())}</div>
      </div>
    </div>
    <div class="tool-cta">${cta(ctx, 'result', { start: true, t: 'Drill acid-base until it is automatic.', b: `On exam day there is no interpreter. Practice acid-base questions in Step Gunner's ${CARDS} Step 2 CK cards, and spaced repetition brings back the ones you miss until the read is a reflex.` })}</div>
  </section>`;
}

/* ---------- ABG article ---------- */
export function abgHtml(A, cases) {
  const p = 'abg';
  const ctx = { ct: 'wards', page: A.slug, type: 'wards_article' };
  const E = abgEngine(A);
  const { cite } = citer(A);
  const T = [['short', 'The short answer'], ['formulas', 'Formulas and sources'], ['cases', 'Worked cases'], ['step2', 'The Step 2 angle'], ['case', 'Try the case'], ['checks', 'Quick checks'], ['faq', 'Questions'], ['related', 'Related']];
  const SA = A.short_answer;
  const short = `<p class="prs">${esc(SA.lead)}</p><ol class="steps">${SA.steps.map((s) => `<li><div><p class="st-t">${esc(s.text)}</p>${cite(s.sources)}</div></li>`).join('')}</ol>
    <aside class="tip"><p class="lbl">${ic('checkc', 'sm')}Before you start</p><p>${esc(SA.pro_tip)}</p>${cite(SA.pro_tip_sources)}</aside>`;
  const fx = `<div class="fxl">${A.formulas.map((f) => `<article class="fxi" id="${p}-fx-${f.id}" aria-labelledby="${p}-fx-${f.id}-h">
      <h3 class="h-3" id="${p}-fx-${f.id}-h">${esc(f.name)}</h3>
      <p class="fxf">${esc(f.formula).replace(/ \| /g, '<br>')}</p>
      ${f.variables && f.variables.length ? `<dl class="fxv">${f.variables.map((x) => `<div><dt>${esc(x.symbol)}</dt><dd>${esc(x.meaning)}${x.unit ? `, ${esc(x.unit)}` : ''}</dd></div>`).join('')}</dl>` : ''}
      <p class="fxn"><b>Normal and cut points.</b> ${esc(f.normal)}</p>
      <p class="fxe">${esc(f.explanation)}</p>
      ${(f.conflicts || []).map((c) => DIFFER(c)).join('')}
      ${cite(f.sources)}
    </article>`).join('')}</div>`;
  const wcases = A.worked_cases.map((c, i) => {
    const g = c.gas;
    const gl = [`pH ${g.pH}`, `PaCO2 ${g.PaCO2}`, `HCO3 ${g.HCO3}`, g.Na != null ? `Na ${g.Na}` : '', g.Cl != null ? `Cl ${g.Cl}` : '', g.PaO2 != null ? `PaO2 ${g.PaO2}` : '', g.FiO2 != null ? `FiO2 ${g.FiO2}` : ''].filter(Boolean).join(' · ');
    return `<details class="case"><summary><span class="ct">${esc(c.title)}</span><span class="cg">${esc(gl)}</span>${ic('chev', 'sm')}</summary>
      <div class="case-b"><p class="vig">${esc(c.vignette)}</p><ol class="steps">${c.steps.map((s) => `<li><div><p>${esc(s)}</p></div></li>`).join('')}</ol>
      <div class="read"><p class="lbl">Bottom line</p><p class="v">${esc(c.bottom_line)}</p></div>
      ${cite(c.sources)}
      <button type="button" class="btn btn-q" data-load="${i}">${ic('load', 'sm')}Load this gas into the interpreter</button></div></details>`;
  }).join('');
  const S2 = A.step2_angle;
  const facts = S2.points.filter((x) => x.kind === 'exam fact');
  const teach = S2.points.filter((x) => x.kind !== 'exam fact');
  const step2 = `<p class="prs">${esc(S2.intro)}</p>
    <div class="sheet" style="margin-top:16px"><div class="sheet-hd"><span class="lbl">How the exam is built</span><span class="lbl">USMLE</span></div><div class="sheet-bd"><ul class="pts">${facts.map((x) => `<li><p>${esc(x.text)}</p>${cite(x.sources)}</li>`).join('')}</ul></div></div>
    <ul class="pts tp">${teach.map((x) => `<li><p>${esc(x.text)}</p>${cite(x.sources)}</li>`).join('')}</ul>`;
  const quiz = cta(ctx, 'quiz', { tid: `${p}-qcta`, t: `Three quick checks. Step Gunner has ${CARDS} more.`, b: 'Step 2 CK cards, acid-base questions included, with spaced repetition bringing back the ones you miss.' });
  const rel = [
    { k: 'On the wards', t: 'How to write a SOAP note', href: '/wards/soap-note' },
    { k: 'Shelf exams', t: 'The internal medicine shelf, week by week', href: '/guides/internal-medicine' },
    { k: 'Step 2', t: 'Readiness check: your forms to a Step 2 range', href: '/readiness' },
  ];
  return `${nav(p, ctx, { cur: 'wards' })}<main id="page">
    <article class="art" aria-labelledby="${p}-h1"><div class="wrap">
      ${artHead(p, A, { crumb: 'ABG interpretation', key: 'step by step', eyebrow: 'On the wards · Labs and ABGs', promise: 'Type in the gas and get the read your resident wants to hear: the primary disorder, whether it is compensated, the gap, and what is hiding under it.', countFrom: [A.short_answer, A.formulas, A.worked_cases, A.step2_angle, A.faq] })}
      <div class="art-top">${strip(ctx, { t: 'Acid-base is all over Step 2 CK.', s: 'Practice acid-base questions in Step Gunner, with spaced repetition bringing back the ones you miss.' })}</div>
    </div>
    <div class="stage-band tool-band c-wards"><div class="wrap">${abgTool(p, ctx, A, E)}</div></div>
    <div class="wrap">
      <div class="art-g"><div class="art-col">
        ${otp(p, T)}
        ${sec(p, 'short', '01', 'The short answer', short)}
        ${sec(p, 'formulas', '02', 'Formulas and sources', `<p class="prs">Every number the interpreter uses, with the source it comes from and every place the sources disagree.</p>${fx}`)}
        ${sec(p, 'cases', '03', 'Worked cases', `<p class="prs">Open a case to see the read step by step, or load its gas into the interpreter.</p>${wcases}`)}
        ${sec(p, 'step2', '04', 'The Step 2 angle', step2)}
        ${sec(p, 'case', '05', 'Try the case', `<p class="prs">A pH of 7.15 with a bicarbonate of 8 reads as a metabolic acidosis. Here is that gas in a patient: make the first call. The case is one of Step Gunner's Next Best Step chains, word for word.</p>${caseBlock(p, cases.abg, ctx, { t: 'Steps 2 to 6 are in the app.', b: 'Search DKA in Step Gunner and walk the ward round: each decision in order, with the guideline it comes from.' })}`)}
        ${sec(p, 'checks', '06', 'Quick checks', `<p class="prs">Tap an answer to see the key and why.</p>${checksBlock(p, A.quick_checks, cite)}<div style="margin-top:16px">${quiz}</div>`)}
        ${sec(p, 'faq', '07', 'Questions students ask', faqBlock(A.faq, cite))}
        ${sec(p, 'related', '08', 'Related', relBlock(rel))}
        <section class="asec" aria-labelledby="${p}-src-h"><h2 class="lbl" id="${p}-src-h">Sources</h2>${refsBlock(A.sources)}</section>
      </div>${toc(p, T)}</div>
    </div>
    <div style="height:48px"></div></article>
    ${band(ctx, p, { h: 'Read the gas on the wards. Answer it on Step 2.', b: `${CARDS} Step 2 CK cards with acid-base questions, Next Best Step chains and spaced repetition.` })}
    <div class="wrap"><p class="disc">${esc(A.disclaimer)}</p></div></main>
    ${foot(ctx)}${sticky(ctx, 'Practice acid-base for Step 2')}`;
}

/* ---------- SOAP article ---------- */
export const TPL_TABS = [['progress_note', 'Progress note'], ['admission_hp', 'Admission H&P']];
function noteLine(line) {
  const br = (x) => esc(x).replace(/\[[^\]]*\]/g, (m) => `<span class="tp">${m}</span>`);
  if (/^(S|O|A\/P|Exam|Data|Assessment|Plan by problem)$/.test(line)) return `<b class="sh">${esc(line)}</b>`;
  let m = line.match(/^([A-Z][A-Z &/]*[A-Z])( \|.*)$/);
  if (m) return `<b>${esc(m[1])}</b>${br(m[2])}`;
  m = line.match(/^(\s*#\d+)(.*)$/);
  if (m) return `<b>${esc(m[1])}</b>${br(m[2])}`;
  if (/^\s/.test(line) || line.startsWith('   ')) return br(line);
  m = line.match(/^([A-Z](?:[A-Za-z0-9&/ ().,-]|:(?=\d))*?:)(?!\d)(.*)$/);
  return m ? `<b>${br(m[1])}</b>${br(m[2])}` : br(line);
}
const tplHtml = (text) => text.split('\n').map(noteLine).join('\n');
// Which example-note line carries which plan_sources entry (index) or which "our call" (n0..n2).
const EXCITE = [
  [/^One-liner:/, [0]], [/^History update:/, [8]], [/^Infusions:/, [3, 12]], [/^Fingerstick glucose overnight/, [4]],
  [/^#1 DKA/, [0, 1]], [/^ {3}Ketones 0\.4/, [1, 2]], [/Restart her home basal-bolus/, [5, 'n1']], [/Keep the insulin infusion running/, [6]],
  [/Fingerstick glucose per the unit/, ['n0']], [/^#2 Insulin omission/, [7, 8]], [/Missed insulin is one of/, [7]], [/Social work and case management/, [8]],
  [/Diabetes team to see her/, [9]], [/Education before discharge/, [10]], [/Follow-up within 2 to 4 weeks/, [11]], [/K 4\.2 on KCl/, [12]],
  [/^#4 Raised creatinine/, ['n2']], [/^FEN:/, ['n2']], [/^Prophylaxis:/, [13]], [/^Dispo:/, ['n2']],
];
function exampleNote(p, S, cite) {
  const E = S.example_note;
  const lines = E.text.split('\n');
  const blocks = [];
  let cur = { k: '', lines: [] };
  lines.forEach((l) => { if (/^(S|O|A\/P)$/.test(l)) { blocks.push(cur); cur = { k: l, lines: [] }; } else cur.lines.push(l); });
  blocks.push(cur);
  const marks = (l) => {
    const hit = EXCITE.find(([re]) => re.test(l));
    if (!hit) return '';
    return `<sup class="cites">${hit[1].map((x) => (typeof x === 'number' ? `<a href="#${p}-ps-${x}" aria-label="Source ${x + 1}">${x + 1}</a>` : `<a href="#${p}-nf-${x.slice(1)}" class="our" aria-label="Our call ${x.slice(1)}">*</a>`)).join('')}</sup>`;
  };
  const lineHtml = (l) => (l.trim() === '' ? '<span class="gapl" aria-hidden="true"></span>' : /^ {3}/.test(l) ? `<span class="nl ind">${esc(l.slice(3))}${marks(l)}</span>` : `<span class="nl">${noteLine(l)}${marks(l)}</span>`);
  const body = blocks.map((b) => `<div class="nx${b.k ? '' : ' head'}">${b.k ? `<span class="L" aria-hidden="true">${b.k === 'A/P' ? 'A/P' : b.k}</span>` : '<span class="L" aria-hidden="true"></span>'}<div class="B">${b.lines.map(lineHtml).join('')}</div></div>`).join('');
  const ledger = `<ol class="ledg">${E.plan_sources.map((x, i) => `<li id="${p}-ps-${i}"><span class="ln">${i + 1}</span><div><p>${esc(x.line)}</p>${cite(x.sources)}</div></li>`).join('')}</ol>`;
  const ours = `<ul class="ours">${E.not_from_sources.map((x, i) => `<li id="${p}-nf-${i}"><span class="ln">*</span><p>${esc(x)}</p></li>`).join('')}</ul>`;
  const callouts = `<ul class="pts tp">${E.teaching_callouts.map((x) => `<li><p>${esc(x.text)}</p>${cite(x.sources)}</li>`).join('')}</ul>`;
  return `<p class="prs"><b>Patient values.</b> ${esc(E.patient)} Superscript numbers point to the source for each threshold or step; an asterisk marks a routine team call that no source sets.</p>
    <div class="sheet note-ex"><div class="sheet-hd"><span class="lbl">Example progress note</span><span class="lbl">Fictional patient</span></div>${body}</div>
    <h3 class="h-3 subh">Where each number comes from</h3>${ledger}
    <h3 class="h-3 subh">Our calls, not from a source</h3>${ours}
    <h3 class="h-3 subh">Why the note looks like this</h3>${callouts}`;
}
export const OL_DEFAULT = { age: '24', sex: 'woman', hx: 'type 1 diabetes', when: 'yesterday', dx: 'moderate DKA after 2 days without insulin', now: 'resolved and moving to subcutaneous insulin' };
export function olSentence(v) {
  const gap = (t) => `<span class="gap">[${t}]</span>`;
  const val = (k, t) => (v[k] && String(v[k]).trim() ? esc(String(v[k]).trim()) : gap(t));
  const hx = v.hx && v.hx.trim() ? ` with ${esc(v.hx.trim())}` : '';
  const when = v.when && v.when.trim() ? ` ${esc(v.when.trim())}` : '';
  return `${val('age', 'age')}-year-old ${val('sex', 'sex')}${hx} admitted${when} for ${val('dx', 'problem')}, now ${val('now', "today's status")}.`;
}
export function soapHtml(S, cases) {
  const p = 'soap';
  const ctx = { ct: 'wards', page: S.slug, type: 'wards_article' };
  const { cite, citeShort } = citer(S);
  const v = OL_DEFAULT;
  const T = [['short', 'The short answer'], ['example', 'A filled example'], ['sections', 'Section by section'], ['oneliner', 'The one-liner'], ['oral', 'Saying it on rounds'], ['bridge', 'The Step 2 bridge'], ['case', 'Try the case'], ['checks', 'Quick checks'], ['faq', 'Questions']];
  const TT = S.template_text;
  const tpl = `<section class="tool" aria-labelledby="${p}-tool-h" id="${p}-tool" data-sticky-start>
    <div class="sheet dark-card" data-tpl="${p}" data-tab="progress_note">
      <h2 class="sr" id="${p}-tool-h">Copy-ready template</h2>
      <div class="tpl-hd"><div class="ttabs" role="tablist" aria-label="Template">${TPL_TABS.map(([k, t], i) => `<button type="button" class="ttab" role="tab" id="${p}-tt-${k}" aria-controls="${p}-tp-${k}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tt="${k}">${esc(t)}</button>`).join('')}</div>
        <button type="button" class="btn btn-ink" data-copy="tpl">${ic('copy', 'sm')}<span>Copy template</span></button></div>
      <div class="tpl-bd">${TPL_TABS.map(([k], i) => `<pre class="tplpre" id="${p}-tp-${k}" role="tabpanel" aria-labelledby="${p}-tt-${k}" tabindex="0" data-src="${k}"${i === 0 ? '' : ' hidden'}>${tplHtml(TT[k])}</pre>`).join('')}</div>
      <div class="tpl-ft"><span class="status" data-status aria-live="polite">Plain text. ${esc(TT.notes.split('. ')[0])}.</span><span class="fine">Pastes into any EHR</span></div>
    </div>
    ${citeShort(TT.sources).replace('class="srcl srcs"', 'class="srcl tsrc"')}
    <div class="tool-cta">${cta(ctx, 'after_copy', { cls: 'reveal', hidden: true, id: `${p}-aftercopy`, t: 'Copied. Now practice the part attendings grade: the plan.', b: "Step Gunner's Next Best Step chains walk a case one decision at a time, the same order your plan should run." })}</div>
  </section>`;
  const SA = S.short_answer;
  const short = `<p class="prs">${esc(SA.lead)}</p><ol class="soapl">${SA.steps.map((s) => `<li><span class="L" aria-hidden="true">${s.letter}</span><div><p>${esc(s.text)}</p>${cite(s.sources)}</div></li>`).join('')}</ol>
    <aside class="tip"><p class="lbl">${ic('checkc', 'sm')}The bar</p><p>${esc(SA.bar)}</p>${cite(SA.bar_sources)}</aside>`;
  const sbs = S.sections.map((s) => `<div class="sx"><div class="sx-hd"><span class="L" aria-hidden="true">${s.key}</span><h3 class="h-3">${esc(s.name)}</h3></div>
    <div class="sx-g"><div class="sx-c"><p class="lbl">${ic('checkc', 'sm')}Belongs here</p><ul>${s.belongs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="sx-c"><p class="lbl">${ic('chev-r', 'sm')}Goes elsewhere</p><ul>${s.does_not_belong.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
    <div class="sx-c bad" style="margin-top:16px"><p class="lbl">${ic('xc', 'sm')}Mistakes that cost you</p><ul>${s.common_mistakes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    ${cite(s.sources)}</div>`).join('');
  const olf = (k, label, type = 'text', cls = '') => `<div class="fld ${cls}"><label for="${p}-ol-${k}"><span>${label}</span></label><input class="inp${type === 'text' ? ' txt' : ''}" id="${p}-ol-${k}" data-ol="${k}" type="text"${type === 'num' ? ' inputmode="numeric"' : ''} autocomplete="off" value="${esc(v[k])}"></div>`;
  const ols = (k, label, opts) => `<div class="fld"><label for="${p}-ol-${k}"><span>${label}</span></label><span class="sel"><select class="inp" id="${p}-ol-${k}" data-ol="${k}">${opts.map((o) => `<option${o === v[k] ? ' selected' : ''}>${o}</option>`).join('')}</select>${ic('chev', 'sm')}</span></div>`;
  const OL = S.one_liner;
  const olb = `<p class="olf">${tplHtml(OL.formula)}</p><p class="prs">${esc(OL.why)}</p>
    <div class="sheet" style="margin-top:16px" data-olb="${p}"><div class="sheet-hd"><h3 class="lbl">One-liner builder</h3><span class="lbl">Updates as you type</span></div><div class="sheet-bd">
    <div class="olb-g">${olf('age', 'Age', 'num')}${ols('sex', 'Sex', ['woman', 'man', 'patient'])}${olf('when', 'Admitted when')}${olf('hx', 'Only the history that matters', 'text', 'wide')}${olf('dx', 'Problem, with qualifiers', 'text', 'wide')}${olf('now', "Today's status", 'text', 'wide')}</div>
    <div class="olb-out"><span class="lbl">Your one-liner</span><p class="olb-s" data-ols aria-live="polite">${olSentence(v)}</p>
      <div class="readline"><div class="row"><button type="button" class="btn btn-ink" data-copy="ol">${ic('copy', 'sm')}<span>Copy the one-liner</span></button><span class="status" data-status aria-live="polite"></span></div></div></div>
  </div></div>
    <h3 class="h-3 subh">Three that work</h3><ul class="pts">${OL.examples.map((x) => `<li><p class="q1">${esc(x.text)}</p><p class="note">${esc(x.note)}</p></li>`).join('')}</ul>
    <aside class="trap" aria-label="A one-liner that does not work"><p class="lbl">${ic('warn', 'sm')}One that does not</p><p class="tt">${esc(OL.bad_example.text)}</p><p>${esc(OL.bad_example.why_bad)}</p></aside>
    <h3 class="h-3 subh">The same shape for each problem in the A/P</h3><p class="olf">${tplHtml(OL.ap_pattern.formula)}</p><p class="prs"><b>Example.</b> ${esc(OL.ap_pattern.example)}</p>
    ${cite(OL.sources)}`;
  const OP = S.oral_presentation;
  const oral = `<p class="prs">${esc(OP.principle)}</p>${cite(OP.principle_sources)}
    <ol class="steps">${OP.how.map((x) => `<li><div><p class="st-t">${esc(x.text)}</p>${cite(x.sources)}</div></li>`).join('')}</ol>
    <p class="prs"><span class="tagr">Our judgment</span>${esc(OP.timing_note.replace(/^Our judgment, not a sourced rule: /, ''))}</p>
    <figure class="script"><figcaption class="lbl">Said aloud, about 80 to 90 seconds. Built from the example note above.</figcaption><blockquote><p>${esc(OP.sample_script)}</p></blockquote></figure>`;
  const ps = S.example_note.plan_sources;
  const chainSteps = [
    { q: 'Is the DKA resolved?', a: 'Ketones 0.4, venous pH 7.34, HCO3 19: yes, by the ADA criteria.', s: ps[1].sources },
    { q: 'Next step', a: 'Her home basal-bolus insulin at her pre-admission doses, with breakfast.', s: ps[5].sources },
    { q: 'Then', a: 'The insulin infusion comes off 1 to 2 hours after the first subcutaneous dose.', s: ps[6].sources },
    { q: 'Why it happened', a: 'Insulin she could not afford: social work and case management today.', s: ps[8].sources },
  ];
  const S2 = S.step2_angle;
  const bridge = `<p class="prs">${esc(S2.intro)}</p>
    <div class="sheet" style="margin-top:16px"><div class="sheet-hd"><span class="lbl">How the exam is built</span><span class="lbl">USMLE</span></div><div class="sheet-bd"><ul class="pts">${S2.points.filter((x) => x.kind === 'exam fact').map((x) => `<li><p>${esc(x.text)}</p>${cite(x.sources)}</li>`).join('')}</ul></div></div>
    <ul class="pts tp">${S2.points.filter((x) => x.kind !== 'exam fact').map((x) => `<li><p>${esc(x.text)}</p>${cite(x.sources)}</li>`).join('')}</ul>
    <h3 class="h-3 subh">The example's #1, read as a chain</h3>
    <ol class="chain">${chainSteps.map((c) => `<li><div><p class="q">${esc(c.q)}</p><p class="a">${esc(c.a)}</p>${cite(c.s)}</div></li>`).join('')}</ol>`;
  const quiz = cta(ctx, 'quiz', { tid: `${p}-qcta`, t: 'Two next steps down.', b: `Step Gunner's Next Best Step chains and ${CARDS} Step 2 CK cards drill the same decisions, with spaced repetition.` });
  const rel = [
    { k: 'On the wards', t: 'ABG interpretation, step by step', href: '/wards/abg-interpretation' },
    { k: 'Shelf exams', t: 'The internal medicine shelf, week by week', href: '/guides/internal-medicine' },
    { k: 'Step 2', t: 'Readiness check: your forms to a Step 2 range', href: '/readiness' },
  ];
  return `${nav(p, ctx, { cur: 'wards' })}<main id="page">
    <article class="art" aria-labelledby="${p}-h1"><div class="wrap">
      ${artHead(p, S, { crumb: 'SOAP note', key: 'template and example', eyebrow: 'On the wards · Writing notes', promise: 'A template you can paste into the chart now, a filled example from a real admission day, and what attendings actually read.', countFrom: [S.short_answer, S.example_note, S.sections, S.one_liner, S.oral_presentation, S.step2_angle, S.faq] })}
      <div class="art-top">${strip(ctx, { t: 'Your plan is a chain of next best steps.', s: "Step Gunner's Next Best Step chains drill that order, case by case." })}</div>
    </div>
    <div class="stage-band tool-band c-wards"><div class="wrap">${tpl}</div></div>
    <div class="wrap">
      <div class="art-g"><div class="art-col">
        ${otp(p, T)}
        ${sec(p, 'short', '01', 'The short answer', short)}
        ${sec(p, 'example', '02', 'A filled example: DKA, hospital day 2', exampleNote(p, S, cite))}
        ${sec(p, 'sections', '03', 'Section by section', sbs)}
        ${sec(p, 'oneliner', '04', 'Build the one-liner', olb)}
        ${sec(p, 'oral', '05', 'Saying it on rounds', oral)}
        ${sec(p, 'bridge', '06', 'The plan is a chain of next best steps', bridge)}
        ${sec(p, 'case', '07', 'Try the case', `<p class="prs">A different DKA patient, a few hours into the insulin drip, and the potassium is falling. Make the call your plan would carry. The case is one of Step Gunner's Next Best Step chains, word for word.</p>${caseBlock(p, cases.soap, ctx, { t: 'The rest of this plan is in the app.', b: 'Search DKA in Step Gunner and walk the ward round, one decision at a time, the way a good plan reads.' })}`)}
        ${sec(p, 'checks', '08', 'Quick checks', `<p class="prs">Tap an answer to see the key and why.</p>${checksBlock(p, S.quick_checks, cite)}<div style="margin-top:16px">${quiz}</div>`)}
        ${sec(p, 'faq', '09', 'Questions students ask', faqBlock(S.faq, cite))}
        ${sec(p, 'related', '10', 'Related', relBlock(rel))}
        <section class="asec" aria-labelledby="${p}-src-h"><h2 class="lbl" id="${p}-src-h">Sources</h2>${refsBlock(S.sources)}</section>
      </div>${toc(p, T)}</div>
    </div><div style="height:48px"></div></article>
    ${band(ctx, p, { h: 'Write the plan on the wards. Answer it on Step 2.', b: `${CARDS} Step 2 CK cards, Next Best Step chains and spaced repetition.` })}
    <div class="wrap"><p class="disc">${esc(S.disclaimer)}</p></div></main>
    ${foot(ctx)}${sticky(ctx, 'Practice the plan, case by case')}`;
}
