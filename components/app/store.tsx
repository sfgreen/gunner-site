import { createContext, ReactNode, useContext } from 'react';
import { appStoreUrl, track, referrerHost } from '../../lib/analytics';
import { CARDS, FREE, LOCS } from '../../lib/app/chrome';

// Every App Store link on a React page goes through StoreButton: the attributed URL
// (appStoreUrl, the page's campaign) and one store_click on tap, with the slot it sits
// in. AppShell provides the campaign and the GA4 page fields; a button can override
// the campaign. These buttons carry no data-ct, so the chrome's delegated listener
// (lib/app/chromeClient.js, which tracks the nav and footer links) never counts them twice.

/** GA4 store_click `location`: one value per slot on a page. Same enum as lib/wards/site.json `locs`. */
export type StoreLoc = 'nav' | 'hero' | 'top' | 'result' | 'after_copy' | 'quiz' | 'inline' | 'end' | 'sticky' | 'case' | 'footer' | 'mid' | 'toc';

export type StoreCtxValue = { ct: string; page: string; type: string };
export const StoreCtx = createContext<StoreCtxValue>({ ct: 'web', page: 'unknown', type: 'page' });

export function StoreButton({
  loc, children = 'Get Step Gunner free', variant = 'act', lg = false, block = false, ct, params,
}: {
  loc: StoreLoc;
  children?: ReactNode;
  /** act: the blue action (the one accent). q: the outlined quiet button. ink: inverted. */
  variant?: 'act' | 'q' | 'ink';
  lg?: boolean;
  block?: boolean;
  /** Override the page's App Store campaign for this one button. */
  ct?: string;
  /** Extra GA4 params, e.g. { topic: 'brown-recluse' }. */
  params?: Record<string, unknown>;
}) {
  const s = useContext(StoreCtx);
  if (!LOCS.has(loc)) throw new Error(`StoreButton location not in the enum (lib/wards/site.json locs): ${loc}`);
  const campaign = ct || s.ct;
  const cls = `btn btn-${variant}${lg ? ' btn-lg' : ''}${block ? ' btn-block' : ''}`;
  return (
    <span className="mk isl">
      <a
        className={cls}
        href={appStoreUrl(campaign)}
        onClick={() => track('store_click', { source: campaign, location: loc, page_type: s.type, page: s.page, ref: referrerHost(), ...params })}
      >
        {children}
      </a>
    </span>
  );
}

/** The white inline card with the blue button: the ask right under the page header. */
export function CtaCard({
  title, sub, button, fine, loc = 'top', placement = 'top', stickyStart = false,
}: {
  title: ReactNode;
  /** One line under the title; hidden on phones, as on the wards pages. */
  sub?: ReactNode;
  button?: ReactNode;
  fine?: ReactNode;
  loc?: StoreLoc;
  /** top: the slot under the article header. inline: anywhere else in a column. */
  placement?: 'top' | 'inline';
  /** The phone sticky bar appears once this card has scrolled past. */
  stickyStart?: boolean;
}) {
  return (
    <div className="mk isl">
      <div className={placement === 'top' ? 'art-top' : 'hub-top'} {...(stickyStart ? { 'data-sticky-start': '' } : {})}>
        <div className="strip">
          <div className="st"><b>{title}</b>{sub && <span>{sub}</span>}</div>
          <div className="sa">
            <StoreButton loc={loc}>{button || 'Get Step Gunner free'}</StoreButton>
            <span className="fine">{fine || `${CARDS} Step 2 CK cards. Free to start on iPhone.`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The dark app card: the ask after a moment of intent (a tool result, a quiz reveal). */
export function DrillCard({
  kicker = 'Step Gunner', title, body, button, fine, loc = 'inline', stickyStart = false, id,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  button?: ReactNode;
  fine?: ReactNode;
  loc?: StoreLoc;
  stickyStart?: boolean;
  id?: string;
}) {
  return (
    <div className="mk isl">
      <aside className="cta glow" aria-label="Step Gunner" id={id} {...(stickyStart ? { 'data-sticky-start': '' } : {})}>
        <div className="cta-in">
          <p className="k lbl"><span className="dot" aria-hidden="true" />{kicker}</p>
          <p className="t">{title}</p>
          {body && <p className="b">{body}</p>}
          <div className="act">
            <StoreButton loc={loc}>{button || 'Get Step Gunner free'}</StoreButton>
            <span className="fine">{fine || FREE}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

/** The full-bleed dark closing band. The phone sticky bar hides while it is on screen. */
export function EndBand({
  id = 'end', kicker = 'Step Gunner for iPhone', title, body, button, fine, secondary,
}: {
  id?: string;
  kicker?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  button?: ReactNode;
  fine?: ReactNode;
  /** A second, quiet link under the button, e.g. { href: '/readiness', label: 'Check your readiness, free' }. */
  secondary?: { href: string; label: ReactNode };
}) {
  return (
    <div className="mk isl">
      <section className="band" aria-labelledby={`${id}-h`} data-sticky-end="">
        <div className="wrap band-g">
          <div>
            <p className="lbl">{kicker}</p>
            <h2 className="h-2" id={`${id}-h`}>{title}</h2>
            {body && <p className="band-b">{body}</p>}
          </div>
          <div className="band-act">
            <StoreButton loc="end" lg>{button || 'Get Step Gunner free'}</StoreButton>
            <p className="fine">{fine || `${FREE}.`}</p>
            {secondary && <a className="lnk on-dark" href={secondary.href}>{secondary.label}</a>}
          </div>
        </div>
      </section>
    </div>
  );
}

/** The phone-only sticky store bar (hidden at 760px and up). Pass it to AppShell's
 *  `sticky` slot. It shows once the first visible [data-sticky-start] has scrolled past
 *  (CtaCard, DrillCard and Stage take a stickyStart prop) and hides while the EndBand is
 *  on screen; without a start marker it never shows. */
export function StickyStoreBar({ title, sub = FREE, button = 'Get it free' }: { title: ReactNode; sub?: ReactNode; button?: ReactNode }) {
  return (
    <div className="mk isl">
      <div className="sticky" role="region" aria-label="Get the app">
        <div className="sticky-t"><b>{title}</b><span>{sub}</span></div>
        <StoreButton loc="sticky">{button}</StoreButton>
      </div>
    </div>
  );
}
