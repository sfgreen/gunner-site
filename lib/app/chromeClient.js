// Browser behavior for the site chrome, on every app-look page: the nav dropdowns and
// the phone menu, store_click for every store link rendered from lib/app/chrome.js
// (data-ct), the phone sticky bar, and the "On this page" active pill. One set of
// delegated listeners on the page root, removed on unmount. lib/wards/client.js calls
// this for the wards pages; components/app/AppShell calls it for every React page.
//
// Events (GA4, lib/analytics): store_click {source, location, page_type, page, ref},
// nav_cta_click {source, location, target, ref}. React store buttons
// (components/app/StoreButton) track their own clicks and carry no data-ct, so a
// click is never counted twice.
import { track, referrerHost } from '../analytics';
import { ic } from './chrome';

export function mountChrome(root, opts = {}) {
  const $ = (s, r = root) => r.querySelector(s);
  const $$ = (s, r = root) => Array.from(r.querySelectorAll(s));
  const off = [];
  const on = (el, type, fn, o) => { el.addEventListener(type, fn, o); off.push(() => el.removeEventListener(type, fn, o)); };

  function closeMenus(except) {
    $$('.dd-b[aria-expanded="true"]').forEach((b) => { if (b === except) return; b.setAttribute('aria-expanded', 'false'); const pn = document.getElementById(b.getAttribute('aria-controls')); if (pn) pn.hidden = true; });
  }

  on(root, 'click', (e) => {
    const t = e.target;
    const storeA = t.closest('a[data-ct]');
    if (storeA) {
      if (opts.onStore) opts.onStore(storeA);
      track('store_click', { source: storeA.dataset.ct, location: storeA.dataset.loc, page_type: storeA.dataset.type, page: storeA.dataset.page, ref: referrerHost() });
      return;
    }
    const navCta = t.closest('a[data-nav-cta]');
    if (navCta) {
      track('nav_cta_click', { source: navCta.dataset.navCta, location: 'nav', target: navCta.getAttribute('href'), ref: referrerHost() });
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
    if (bg) { const pn = document.getElementById(bg.getAttribute('aria-controls')); const open = bg.getAttribute('aria-expanded') !== 'true'; bg.setAttribute('aria-expanded', String(open)); pn.hidden = !open; bg.innerHTML = ic(open ? 'x' : 'menu'); }
  });
  on(document, 'keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = $('.dd-b[aria-expanded="true"]');
    if (open) { closeMenus(); open.focus(); return; }
    const bg = $('.burger[aria-expanded="true"]');
    if (bg) { const pn = document.getElementById(bg.getAttribute('aria-controls')); bg.setAttribute('aria-expanded', 'false'); if (pn) pn.hidden = true; bg.innerHTML = ic('menu'); bg.focus(); }
  });
  on(document, 'click', (e) => { if (!root.contains(e.target)) closeMenus(); });

  /* ---------- scroll-driven: the sticky bar and the TOC pill, one rAF per frame ---------- */
  // Sticky: shows after the first visible [data-sticky-start] has scrolled past, hides
  // while [data-sticky-end] (the closing ask) is on screen, so two asks never compete.
  // TOC: the pill sits on the last section whose top has passed under the nav.
  const s = $('.sticky');
  const tocs = $$('.toc').map((toc) => {
    const links = $$('a[href^="#"]', toc);
    return { links, targets: links.map((a) => document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)))) };
  }).filter((x) => x.links.length);
  if (!s && !tocs.length) return () => off.forEach((f) => f());

  let ticking = false;
  const update = () => {
    ticking = false;
    if (s) {
      const start = $$('[data-sticky-start]').find((el) => el.offsetParent !== null);
      const end = $('[data-sticky-end]');
      if (!start || getComputedStyle(s).display === 'none') s.classList.remove('on');
      else {
        const passed = start.getBoundingClientRect().bottom < 0;
        const endIn = end ? end.getBoundingClientRect().top < window.innerHeight - 40 : false;
        s.classList.toggle('on', passed && !endIn);
      }
    }
    tocs.forEach(({ links, targets }) => {
      let cur = 0;
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      targets.forEach((el, i) => { if (el && el.getBoundingClientRect().top < 120) cur = i; });
      if (atEnd) cur = links.length - 1;
      links.forEach((a, i) => { if (i === cur) { if (!a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'true'); } else a.removeAttribute('aria-current'); });
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  on(window, 'scroll', onScroll, { passive: true });
  on(window, 'resize', onScroll);
  update();
  return () => off.forEach((f) => f());
}
