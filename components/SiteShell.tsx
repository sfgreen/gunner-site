import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useState } from 'react';
import { appStoreUrl, track, referrerHost } from '../lib/analytics';

// The one nav and container system for the whole site.
//
// Before this, the nav was built five times at four different widths (index
// 1040, research/methodology 860, Lab/GuideLayout 720, readiness/predictor
// 660), so moving from the homepage to a tool page shrank the chrome by 380px
// and the site stopped reading as one product.
//
// The rule here: the CHROME never moves, the text MEASURE does. One nav width
// sitewide; content picks a measure from what it contains, not from which file
// it lives in. A form is easier to use narrow, prose reads best near 65
// characters, and neither should shift the wordmark.
//
// Breakpoints are declared once (720 tablet, 560 phone) instead of the six
// different values that were scattered across files.

export type Measure = 'wide' | 'article' | 'tool';

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/readiness', label: 'Readiness check' },
  { href: '/step-2-score-predictor', label: 'Predictor' },
  { href: '/research/nbme-to-step-2', label: 'Research' },
  { href: '/guides', label: 'Guides' },
];

export default function SiteShell({
  children, campaign, measure = 'article', crumb, dark = false, footer = true,
}: {
  children: ReactNode;
  /** ct= for the nav store button, and the analytics `source`. */
  campaign: string;
  measure?: Measure;
  crumb?: { href: string; label: string }[];
  /** The homepage is the one dark surface; every other page is Score Report light. */
  dark?: boolean;
  footer?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const store = appStoreUrl(campaign);
  const path = useRouter().pathname;
  // A nav link should say where you are, not just where you could go. Without
  // this the row reads as four pieces of grey text rather than as navigation.
  const isActive = (href: string) => path === href || (href !== '/' && path.startsWith(href));

  return (
    <div className={'shell' + (dark ? ' dark' : '')}>
      <nav className="nav">
        <Link href="/" className="lg" aria-label="Step Gunner home">
          <span className="d" />
          <span className="wt">STEP <b>GUNNER</b></span>
        </Link>

        <div className="links">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActive(l.href) ? 'on' : undefined}
              aria-current={isActive(l.href) ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="right">
          <a
            href={store}
            className="cta"
            onClick={() => track('store_click', { source: campaign, location: 'nav', ref: referrerHost() })}
          >
            Get the app
          </a>
          <button
            type="button"
            className="burger"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <i /><i /><i />
          </button>
        </div>
      </nav>

      {open && (
        <div className="sheet">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
        </div>
      )}

      {crumb && crumb.length > 0 && (
        <div className={'measure ' + measure}>
          <div className="crumb">
            {crumb.map((c) => <Link key={c.href} href={c.href}>{c.label}</Link>)}
          </div>
        </div>
      )}

      <main className={'measure ' + measure}>{children}</main>

      {footer && (
        <footer className={'measure ' + measure}>
          <div className="foot">
            <Link href="/">stepgunner.com</Link>
            <Link href="/readiness">Readiness check</Link>
            <Link href="/step-2-score-by-specialty">By specialty</Link>
            <Link href="/guides">Guides</Link>
            <Link href="/support">Support</Link>
            <Link href="/privacy">Privacy</Link>
            <span>Rezumab LLC</span>
          </div>
        </footer>
      )}

      <style jsx>{`
        .shell { min-height: 100vh; display: flex; flex-direction: column; }

        /* ---- nav: identical geometry on every page ---- */
        .nav {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          width: 100%; max-width: 1080px; margin: 0 auto;
          padding: 15px 22px;
        }
        .shell :global(a.lg) {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--mono); font-weight: 700; letter-spacing: 2.2px;
          font-size: 14px; color: var(--ink); text-decoration: none; white-space: nowrap;
        }
        /* flex:0 0 auto and no positioning: the homepage bug was an unscoped
           .dot rule elsewhere absolutely positioning this out of the row. */
        .shell :global(a.lg) :global(.d) {
          width: 8px; height: 8px; border-radius: 50%; background: var(--green);
          box-shadow: 0 0 9px var(--green); flex: 0 0 auto;
        }
        .shell :global(a.lg) :global(b) { color: var(--green); font-weight: 700; }

        .links { display: flex; gap: 4px; }
        /* Mono uppercase is the brand register, so the affordance has to come
           from weight, contrast and a rule that answers on hover rather than
           from changing the typeface. Base weight 600 and ink-dim rather than
           faint: at 11px, light grey small caps read as a caption, not a link. */
        .links :global(a) {
          position: relative; font-family: var(--mono); font-size: 11.5px; font-weight: 600;
          letter-spacing: 0.09em; text-transform: uppercase; color: var(--ink-dim);
          text-decoration: none; white-space: nowrap; padding: 7px 11px;
          border-radius: 7px; transition: color .16s ease, background .16s ease;
        }
        .links :global(a)::after {
          content: ""; position: absolute; left: 11px; right: 11px; bottom: 3px;
          height: 2px; border-radius: 2px; background: var(--green);
          transform: scaleX(0); transform-origin: left; transition: transform .18s ease;
        }
        .links :global(a:hover) { color: var(--ink); background: var(--bg-3); }
        .links :global(a:hover)::after { transform: scaleX(1); }
        .links :global(a.on) { color: var(--ink); }
        .links :global(a.on)::after { transform: scaleX(1); }

        .right { display: flex; align-items: center; gap: 10px; }
        .shell :global(a.cta), .cta {
          background: var(--ink); color: var(--bg); border-radius: 999px;
          padding: 9px 17px; font-size: 13px; font-weight: 700; text-decoration: none;
          white-space: nowrap;
        }
        .burger {
          display: none; flex-direction: column; gap: 3.5px; cursor: pointer;
          background: none; border: 1px solid var(--hair-strong); border-radius: 8px;
          padding: 9px 10px; min-width: 40px; min-height: 40px;
          align-items: center; justify-content: center;
        }
        .burger i { display: block; width: 16px; height: 1.5px; background: var(--ink); }

        .sheet {
          display: none; flex-direction: column;
          border-top: 1px solid var(--hair); border-bottom: 1px solid var(--hair);
          background: var(--bg-2);
        }
        .sheet :global(a) {
          padding: 14px 22px; font-family: var(--mono); font-size: 12.5px;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink);
          text-decoration: none; border-bottom: 1px solid var(--hair);
        }
        .sheet :global(a:last-child) { border-bottom: none; }

        /* ---- three measures, one set of paddings ---- */
        .measure { width: 100%; margin: 0 auto; padding: 0 22px; }
        .measure.wide { max-width: 1080px; }
        .measure.article { max-width: 760px; }
        .measure.tool { max-width: 680px; }
        main.measure { flex: 1 0 auto; padding-top: 26px; padding-bottom: 64px; }

        .crumb { display: flex; gap: 10px; padding-top: 18px; }
        .crumb :global(a) {
          font-family: var(--mono); font-size: 11px; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--ink-faint); text-decoration: none;
        }
        .crumb :global(a:hover) { color: var(--ink-dim); }

        footer { padding-top: 22px; padding-bottom: 44px; }
        .foot {
          display: flex; flex-wrap: wrap; gap: 10px 20px; align-items: center;
          border-top: 1px solid var(--hair); padding-top: 20px;
          font-size: 13.5px; color: var(--ink-faint);
        }
        .foot :global(a) { color: var(--ink-dim); text-decoration: none; }
        .foot :global(a:hover) { color: var(--ink); text-decoration: underline; }

        /* ---- 720: nav links give way, they are the first thing to crowd ---- */
        @media (max-width: 720px) {
          .links { display: none; }
          .burger { display: flex; }
          .sheet { display: flex; }
        }

        /* ---- 560: phone ---- */
        @media (max-width: 560px) {
          .nav { padding: 12px 16px; }
          .measure { padding-left: 16px; padding-right: 16px; }
          main.measure { padding-top: 20px; padding-bottom: 48px; }
          .shell :global(a.lg) { font-size: 12.5px; letter-spacing: 1.8px; }
          .shell :global(a.cta) { padding: 8px 14px; font-size: 12.5px; }
        }
      `}</style>
    </div>
  );
}
