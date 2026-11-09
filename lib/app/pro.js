// Step Gunner Pro on the marketing site, as HTML strings: the nav item and its panel, the
// phone-menu entry, the footer bar and column, and the home page band. Strings for the same
// reason as lib/app/chrome.js: the wards pages (lib/wards/render.js) and every React page
// (components/app/AppShell) get one implementation, so nothing drifts. chrome.js imports
// this file, never the other way, so anything that needs the store link takes it as an
// argument. Behavior (the plan toggle, the nav panel, pro_click) is chromeClient.js.
//
// Every Pro link carries data-pro="<location>" and chromeClient fires one GA4 pro_click
// {location, item, plan, target}. Locations: nav, nav_panel, home, footer_bar, footer_col
// (readiness and predictor are React: components/app/ProNext.tsx).
//
// Prices are the Stripe prices (scripts/stripe_ids.json) and the App Store prices. Friend
// price is the two coupons in scripts/stripe_setup.mjs: 40% off the first year of yearly
// ($59.99) and $5 off the first month of monthly ($9.99); both duration "once". Copy rules:
// no em or en dashes, no emoji.

export const PRO = {
  yearly: { price: '$99.99', per: '/ year', save: 'save 44%', sub: '$8.33 a month, billed once a year. Everything in Pro, through test day.', friend: 'Your first year is $59.99.' },
  monthly: { price: '$14.99', per: '/ month', save: '', sub: 'Month to month. Switch to yearly any time and keep your climb.', friend: 'Your first month is $9.99.' },
};

const FLAG = '<svg class="pr-flag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V4"/><path d="M4 4h12l-2 4 2 4H4"/></svg>';
const ARROW = '<svg class="pr-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const CHEV = '<svg class="ic sm" aria-hidden="true"><use href="#i-chev"/></svg>';
const STAR = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.6l2.85 6 6.55.75-4.86 4.5 1.3 6.5L12 17.1l-5.84 3.25 1.3-6.5L2.6 9.35l6.55-.75z"/></svg>';
const GIFT = '<svg class="pr-gift" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/></svg>';

/* ---------- the climb: an example, never a visitor's data ---------- */
// id: unique per SVG on the page (gradient ids). kind: 'card' (the home card, desktop labels
// and a phone layer) or 'mini' (the nav panel).
export function climbSvg(id, kind, label) {
  const grad = `<defs><linearGradient id="${id}-l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D98E00"/><stop offset=".6" stop-color="#FFC83D"/><stop offset="1" stop-color="#FFE9A8"/></linearGradient>
    <linearGradient id="${id}-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC83D" stop-opacity=".30"/><stop offset="1" stop-color="#FFC83D" stop-opacity="0"/></linearGradient>
    <filter id="${id}-g" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5"/></filter></defs>`;
  const PTS = 'M44 241.2 L144 204.4 L244 167.6 L344 135.4 L444 103.2';
  if (kind === 'mini') {
    return `<svg class="pr-svg" viewBox="0 0 548 300" role="img" aria-label="${label}">${grad}
      <path d="M0 300 L0 236 L60 214 L110 230 L170 184 L230 206 L300 150 L360 176 L420 120 L470 140 L548 90 L548 300 Z" fill="#13203a"/>
      <line x1="0" y1="48" x2="548" y2="48" stroke="rgba(255,200,61,.4)" stroke-width="3" stroke-dasharray="6 12"/>
      <path d="${PTS} L444 300 L44 300 Z" fill="url(#${id}-a)"/>
      <path d="${PTS}" fill="none" stroke="url(#${id}-l)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M444 103.2 L512 48" fill="none" stroke="#FFE9A8" stroke-width="6" stroke-dasharray="4 14" stroke-linecap="round"/>
      <line x1="512" y1="48" x2="512" y2="4" stroke="#EEF2F8" stroke-width="5"/><path d="M512 5 L548 16 L512 27 Z" fill="#FFC83D"/></svg>`;
  }
  return `<svg class="pr-svg" viewBox="0 0 548 300" role="img" aria-label="${label}">${grad}
    <path d="M0 300 L0 236 L60 214 L110 230 L170 184 L230 206 L300 150 L360 176 L420 120 L470 140 L548 90 L548 300 Z" fill="#0e1830"/>
    <path d="M0 300 L0 262 L80 244 L150 258 L230 226 L300 240 L380 206 L450 222 L548 186 L548 300 Z" fill="#0b1324"/>
    <g class="pr-svg-d" stroke="rgba(255,255,255,.08)" stroke-dasharray="3 6"><line x1="0" y1="232" x2="548" y2="232"/><line x1="0" y1="140" x2="548" y2="140"/></g>
    <line x1="0" y1="48" x2="548" y2="48" stroke="rgba(255,200,61,.35)" stroke-dasharray="3 6"/>
    <g class="pr-svg-d" font-family="JetBrains Mono, monospace" font-size="11" fill="#8592A6"><text x="0" y="226">230</text><text x="0" y="134">250</text></g>
    <text class="pr-svg-d" x="0" y="42" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="#FFC83D">270</text>
    <text class="pr-svg-p" x="0" y="40" font-family="JetBrains Mono, monospace" font-size="16" font-weight="700" fill="#FFC83D">270</text>
    <path d="${PTS} L444 300 L44 300 Z" fill="url(#${id}-a)"/>
    <path class="pr-glow" d="${PTS}" fill="none" stroke="#FFC83D" stroke-linecap="round" stroke-linejoin="round" filter="url(#${id}-g)" opacity=".55"/>
    <path class="pr-line" d="${PTS}" fill="none" stroke="url(#${id}-l)" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="pr-proj" d="M444 103.2 L512 48" fill="none" stroke="#FFE9A8" stroke-linecap="round"/>
    <g fill="#0a101d" stroke="#FFC83D" stroke-width="2.5"><circle class="pr-node" cx="44" cy="241.2"/><circle class="pr-node" cx="144" cy="204.4"/><circle class="pr-node" cx="244" cy="167.6"/><circle class="pr-node" cx="344" cy="135.4"/></g>
    <circle cx="444" cy="103.2" r="8" fill="#FFE9A8"/><circle class="pr-svg-d" cx="444" cy="103.2" r="14" fill="none" stroke="rgba(255,233,168,.35)" stroke-width="2"/>
    <line x1="512" y1="48" x2="512" y2="6" stroke="#EEF2F8" stroke-width="2.5"/><path d="M512 7 L542 15 L512 23 Z" fill="#FFC83D"/>
    <g class="pr-svg-d" font-family="JetBrains Mono, monospace" font-size="10.5" fill="#97A2B4"><text x="30" y="270">NBME 11</text><text x="130" y="232">NBME 12</text><text x="232" y="195">UWSA 1</text><text x="330" y="163">NBME 13</text></g>
    <text class="pr-svg-d" x="404" y="88" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="700" fill="#FFE9A8">NBME 14 · 258</text></svg>`;
}

/* ---------- the top menu: a Pro item and its panel ---------- */
export function proNavItem(p) {
  const pid = `${p}-dd-pro`;
  return `<div class="dd dd-pro"><button type="button" class="dd-b pro-b" aria-expanded="false" aria-controls="${pid}" data-pro-open="nav">${FLAG}<span>Pro</span>${CHEV}</button>
    <div class="dd-p pro-p" id="${pid}" hidden>
      <div class="pro-p-c">
        <p class="pr-eyebrow">STEP GUNNER PRO</p>
        <p class="pro-p-h">Your plan <span class="pr-gold">to 270.</span></p>
        <p class="pro-p-d">NBME intelligence, a daily plan, Visual Dx and no caps. Same account as the app.</p>
        <p class="pro-p-pr"><b>${PRO.yearly.price}</b> a year <span aria-hidden="true">·</span> <b>${PRO.monthly.price}</b> a month</p>
        <div class="pro-p-act"><a class="pr-btn sm" href="/pro" data-pro="nav_panel" data-item="see_pro">See Pro</a><a class="pr-ghost sm" href="/pro" data-pro="nav_panel" data-item="friend_code">Have a friend&rsquo;s code?</a></div>
      </div>
      <div class="pro-p-m" aria-hidden="true"><span class="pr-cap">EXAMPLE CLIMB</span>${climbSvg('npc', 'mini', 'An example climb toward 270')}<p class="pro-p-n"><span class="pr-gold">258</span><span>to 270 by Dec 18</span></p></div>
    </div></div>`;
}
// The phone menu: one dark row, the same link.
export function proMenuEntry() {
  return `<div><p class="lbl">Pro</p><ul><li><a class="m-pro" href="/pro" data-pro="nav" data-item="menu"><span class="m-pro-t">${FLAG}<span><b>Step Gunner Pro</b><i>Your plan to 270. ${PRO.yearly.price} a year or ${PRO.monthly.price} a month.</i></span></span>${ARROW}</a></li></ul></div>`;
}

/* ---------- the footer: a slim bar above the columns, and a PRO column ---------- */
export function proFootBar() {
  return `<a class="pr-bar" href="/pro" data-pro="footer_bar" data-item="bar">${FLAG}<span class="pr-bar-k">STEP GUNNER PRO</span><span class="pr-bar-h">Your plan <span class="pr-gold">to 270.</span></span><span class="pr-bar-d">${PRO.yearly.price} a year or ${PRO.monthly.price} a month. Same account as the app.</span><span class="pr-bar-go">See Pro${ARROW}</span></a>`;
}
export const PRO_FOOT = [['Step Gunner Pro', '/pro'], ['Friend price', '/pro'], ['Manage subscription', '/pro'], ['Sharer earnings', '/earnings']];
export function proFootCol() {
  return `<div class="foot-pro"><h3 class="lbl"><span class="pr-dot" aria-hidden="true"></span>PRO</h3><ul>${PRO_FOOT.map(([x, h], i) => `<li><a href="${h}" data-pro="footer_col" data-item="${['pro', 'friend_price', 'manage', 'earnings'][i]}">${x}</a></li>`).join('')}</ul></div>`;
}

/* ---------- the home band ---------- */
const FEATS = [
  ['NBME INTELLIGENCE', 'Every NBME you log plants a flag on your climb, and Pro ranks the leaks that move it.', '<path d="M4 21V4"/><path d="M4 4h12l-2 4 2 4H4"/>'],
  ['YOUR PLAN TO TEST DAY', 'Every day ranked by your weakest systems and what Step 2 tests most.', '<rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 2.5v4M16 2.5v4M8 14l2.5 2.5L16 12"/>'],
  ['RETENTION FORECAST', 'What fades before your exam, and the reviews a day that hold it.', '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7.5V12l3 2"/>'],
  ['VISUAL DX', '892 questions on 532 images: H&amp;E, skin, smears, Gram stains, ECGs and CT.', '<circle cx="12" cy="12" r="8.5"/><circle cx="10" cy="10" r="2"/><circle cx="15" cy="14" r="1.5"/><circle cx="9.5" cy="15.5" r="1"/>'],
  ['WHERE YOUR POINTS ARE', 'Every system ranked by the points it holds, each with a one-tap Drill 10.', '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'],
  ['NO DAILY CAPS', 'Unlimited cram and all nine LFX formats, as much as your day allows.', '<path d="M6.5 8.5a4.5 4.5 0 1 0 0 7c2.5 0 3.5-3.5 5.5-3.5s3 3.5 5.5 3.5a4.5 4.5 0 1 0 0-7c-2.5 0-3.5 3.5-5.5 3.5S9 8.5 6.5 8.5z"/>'],
];
// p: the page's id prefix. appLink: the "Or get it in the app" store anchor, built by the
// caller (chrome.js owns the store link and its attribution).
export function proBand(p, appLink) {
  const y = PRO.yearly;
  return `<section class="pr-band" aria-labelledby="${p}-pro-h" id="${p}-pro"><div class="wrap pr-in">
    <div class="pr-copy">
      <p class="pr-eyebrow"><span class="pr-dot" aria-hidden="true"></span>STEP GUNNER PRO</p>
      <h2 class="pr-h" id="${p}-pro-h">Every NBME, one climb <span class="pr-gold">to 270.</span></h2>
      <p class="pr-lede">Pro turns your practice scores into a plan: what to study today, what fades before test day, and the day you are ready.</p>
      <div class="pr-proof"><span class="pr-stars" role="img" aria-label="4.8 out of 5 stars">${STAR.repeat(5)}</span><b>4.8 on the App Store</b><span class="pr-sep" aria-hidden="true"></span><span class="pr-one">One account, app and web</span></div>
    </div>
    <figure class="pr-quote"><blockquote><p>&ldquo;&hellip;the answers include the whole algorithm of treatment.&rdquo;</p></blockquote><figcaption>APP STORE REVIEW</figcaption></figure>
    <div class="pr-climb">
      <div class="pr-climb-hd"><span class="pr-cap"><span class="pr-cap-d">YOUR CLIMB · </span>EXAMPLE SCORES</span><span class="pr-pill">ON PACE</span></div>
      <p class="pr-big"><span class="pr-num pr-gold">258</span><span class="pr-big-t">most likely today<br><b>270 by <span class="pr-ex">your exam on </span>Dec 18</b></span></p>
      ${climbSvg('hpc', 'card', 'An example climb: NBME 11 at 228, NBME 12 at 236, UWSA 1 at 244, NBME 13 at 251, NBME 14 at 258, projected to 270 by the exam')}
      <div class="pr-tiles"><div><span class="pr-cap">BIGGEST LEAK</span><b>Renal, +4 pts</b></div><div class="pr-t-fade"><span class="pr-cap">FADING</span><b>38 cards by Fri</b></div><div><span class="pr-cap">NEXT FORM</span><b>NBME 15, Dec 2</b></div></div>
    </div>
    <ul class="pr-feats">${FEATS.map(([t, d, svg]) => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg}</svg><div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}</ul>
    <div class="pr-price" data-pro-card data-plan="yearly">
      <div class="pr-price-l">
        <div class="pr-tog" role="group" aria-label="Billing period"><button type="button" data-pro-plan="yearly" aria-pressed="true">Yearly · ${y.save}</button><button type="button" data-pro-plan="monthly" aria-pressed="false">Monthly</button></div>
        <p class="pr-amt" aria-live="polite"><span class="pr-num" data-pro-price>${y.price}</span><span class="pr-per" data-pro-per>${y.per}</span></p>
        <p class="pr-sub" data-pro-sub>${y.sub}</p>
        <p class="pr-friend">${GIFT}<span>Invited by a friend? <b data-pro-friend>${y.friend}</b></span></p>
      </div>
      <div class="pr-price-r">
        <a class="pr-btn lg" href="/pro?plan=yearly" data-pro="home" data-item="get_pro" data-pro-go>Get Pro${ARROW}</a>
        ${appLink}
        <p class="pr-note">Sign in with the Google account you use in the app. Signed in with Apple? Buy in the app; it is the same Pro.</p>
        <p class="pr-trust"><span>SECURE CHECKOUT</span><span aria-hidden="true">·</span><span>CANCEL ANYTIME</span><span aria-hidden="true">·</span><span>ON YOUR PHONE AT ONCE</span></p>
      </div>
    </div>
  </div></section>`;
}
