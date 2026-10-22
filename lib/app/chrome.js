// The site chrome as HTML strings: the icon sprite, the wordmark, the store button,
// the nav and the footer. One implementation for every page: lib/wards/render.js
// builds the wards pages from it, and components/app/AppShell renders the same
// strings, so the nav and footer cannot drift between the two. Behavior lives in
// ./chromeClient.js. Links come from lib/nav.ts. Copy rules: no em or en dashes,
// no emoji, live features only.
import SITE from '../wards/site.json';
import { appStoreUrl, APP_STORE } from '../analytics';
import { NAV, MENU, FOOT } from '../nav';

export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const ic = (n, c = '') => `<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
export const FREE = 'Free to start on iPhone';
export const CARDS = '6,000+';
export const BYLINE = 'Danny Varghese';
export const CREDENTIAL = 'MS4, Texas A&M College of Medicine';
/** GA4 store_click `location` values. One per slot on a page, so clicks split cleanly. */
export const LOCS = new Set(SITE.locs);

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
<symbol id="i-star" viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></symbol>
</svg>`;

/* ---------- shared atoms ---------- */
// A store button. ctx = { ct, page, type }: the App Store campaign and the GA4 page
// fields. chromeClient.js sends data-ct/data-loc/data-page/data-type as store_click.
export function store(ctx, loc, label, cls = 'btn-act') {
  if (!LOCS.has(loc)) throw new Error(`store CTA location not in the enum: ${loc}`);
  return `<a class="btn ${cls}" href="${esc(appStoreUrl(ctx.ct))}" data-ct="${ctx.ct}" data-loc="${loc}" data-page="${ctx.page}" data-type="${ctx.type}">${label}</a>`;
}
// The brand mark: the green dot and the STEP GUNNER mono wordmark, nothing else.
export const WM = '<a class="wm" href="/" aria-label="Step Gunner home"><span class="dot" aria-hidden="true"></span><span class="w1">STEP</span><span class="w2">GUNNER</span></a>';

/* ---------- nav and footer: every link is a live page ---------- */
// p: an id prefix, unique per page. o.cur: the Section to underline. o.cta: a page's
// own nav button ({ label, href }) in place of "Get the app"; same style, and a store
// href still carries the page's campaign.
export function nav(p, ctx, o = {}) {
  const items = NAV.map((n) => {
    const cur = o.cur === n.id ? ' aria-current="page"' : '';
    if (!n.groups) return `<a href="${n.href}"${cur}>${n.label}</a>`;
    const pid = `${p}-dd-${n.id}`;
    const groups = n.groups.map((g) => `<div class="dd-g"><span class="lbl">${g.t}</span><ul${g.links.length > 5 ? ' class="two"' : ''}>${g.links.map(([t, d, h]) => `<li><a href="${h}"><b>${esc(t)}</b>${d ? `<span>${esc(d)}</span>` : ''}</a></li>`).join('')}</ul></div>`).join('');
    const all = n.all ? `<div class="dd-all"><a href="${n.all[0]}">${n.all[1]} ${ic('arrow', 'sm')}</a></div>` : '';
    return `<div class="dd"><button type="button" class="dd-b" aria-expanded="false" aria-controls="${pid}"${cur}>${n.label}${ic('chev', 'sm')}</button><div class="dd-p ${n.panel}" id="${pid}" hidden>${groups}${all}</div></div>`;
  }).join('');
  let btn = store(ctx, 'nav', 'Get the app', 'btn-q sn-cta');
  if (o.cta && !o.cta.href.startsWith(APP_STORE)) btn = `<a class="btn btn-q sn-cta" href="${esc(o.cta.href)}" data-nav-cta="${esc(ctx.ct)}">${esc(o.cta.label)}</a>`;
  else if (o.cta) btn = store(ctx, 'nav', esc(o.cta.label), 'btn-q sn-cta');
  return `<header class="sn"><div class="wrap sn-in">${WM}
    <nav class="sn-links" aria-label="Primary">${items}</nav>
    ${btn}
    <button type="button" class="burger" aria-expanded="false" aria-controls="${p}-menu" aria-label="Menu">${ic('menu')}</button>
  </div>
  <div class="menu" id="${p}-menu" hidden><nav class="wrap" aria-label="Primary">
    ${MENU.map(([t, xs]) => `<div><p class="lbl">${t}</p><ul>${xs.map(([x, h]) => `<li><a href="${h}">${x}${ic('chev-r', 'sm')}</a></li>`).join('')}</ul></div>`).join('')}
    <div class="m-cta">${store(ctx, 'nav', 'Get Step Gunner free', 'btn-act btn-lg btn-block')}<p class="fine">${FREE}. ${CARDS} Step 2 CK cards.</p></div>
  </nav></div></header>`;
}
export function foot(ctx) {
  const link = (x, h) => (h ? `<a href="${h}">${x}</a>` : `<a href="${esc(appStoreUrl(ctx.ct))}" data-ct="${ctx.ct}" data-loc="footer" data-page="${ctx.page}" data-type="${ctx.type}">${x}</a>`);
  return `<footer class="foot"><div class="wrap"><div class="foot-g">${FOOT.map(([t, xs]) => `<div><h3 class="lbl">${t}</h3><ul>${xs.map(([x, h]) => `<li>${link(x, h)}</li>`).join('')}</ul></div>`).join('')}</div>
    <div class="foot-b">${WM}<p>For exam preparation, not clinical advice. Rezumab LLC</p></div></div></footer>`;
}
