import { ReactNode, useEffect, useState, RefObject } from 'react';
import { appStoreUrl, track, referrerHost } from '../../lib/analytics';
import { PATHWAYS_LIVE, StoreLoc } from '../../lib/pathways/config';
import type { Cite, OrderVM } from '../../lib/pathways/data';

// Shared atoms for the pathway article and hub. Icons are SF Symbols-style
// strokes drawn inline (no icon font, no emoji); status is always icon + word,
// never colour alone.

const PATHS: Record<string, string> = {
  check: 'M5 12.5l4.5 4.5L19 7',
  x: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  warn: 'M12 4l9 16H3zM12 10v4M12 17.2v.1',
  dash: 'M6 12h12',
  branch: 'M7 21V3M7 13c0-4.5 3.5-7 10-7M14 3l3 3-3 3',
  ext: 'M8 16L16 8M10 8h6v6',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20',
  chev: 'M6 9l6 6 6-6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  box: 'M6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4z',
  shield: 'M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6zM8.8 12.2l2.3 2.3 4.4-4.6',
};

export function Icon({ name, className = '' }: { name: keyof typeof PATHS | string; className?: string }) {
  return (
    <svg className={`pw-ic ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={PATHS[name] || ''} />
    </svg>
  );
}

/** Editorial text may mark emphasis with **double asterisks**, as the guides do. */
export function Rich({ text }: { text: string }) {
  const parts = String(text || '').split('**');
  return <>{parts.map((p, i) => (i % 2 === 1 ? <b key={i}>{p}</b> : p))}</>;
}
export const plainText = (s: string): string => String(s || '').replace(/\*\*/g, '');

/** End a line with a full stop unless it already has closing punctuation. */
export const sentence = (s: string): string => (/[.!?:)]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

export type Source = { label: string; title: string; url: string };

export function Cites({ cites, sources }: { cites: Cite[]; sources: Source[] }) {
  if (!cites.length) return null;
  return (
    <ul className="pw-cites" aria-label="Sources">
      {cites.map((c, i) => {
        const s = c.src >= 0 ? sources[c.src] : null;
        const label = s ? s.label : c.label || 'Source';
        const body = (
          <>
            {label}
            {c.where && <span> {c.where}</span>}
          </>
        );
        return (
          <li key={i}>
            {s && s.url ? (
              <a className="pw-cite" href={s.url} target="_blank" rel="nofollow noopener noreferrer" aria-describedby="pw-newtab">
                {body}
                <Icon name="ext" />
              </a>
            ) : (
              <span className="pw-cite pw-cite-plain">{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const STATUS: Record<OrderVM['status'], { word: string; icon: string }> = {
  ok: { word: 'Use', icon: 'check' },
  avoid: { word: 'Avoid', icon: 'x' },
  conflict: { word: 'Sources differ', icon: 'warn' },
  pending: { word: 'Not stated', icon: 'dash' },
};

export function StatusChip({ status }: { status: OrderVM['status'] }) {
  const s = STATUS[status] || STATUS.ok;
  return (
    <span className={`pw-chip ${status}`}>
      <Icon name={s.icon} />
      {s.word}
    </span>
  );
}

/** One App Store link. Every store button on these pages goes through here, so
 *  the ct, the location and the GA4 store_click shape stay uniform. */
export function StoreLink({
  ct, loc, pageType, page, className, children, tabIndex,
}: {
  ct: string; loc: StoreLoc; pageType: 'pathway' | 'hub'; page: string; className: string; children: ReactNode; tabIndex?: number;
}) {
  return (
    <a
      className={className}
      href={appStoreUrl(ct)}
      data-loc={loc}
      tabIndex={tabIndex}
      onClick={() => track('store_click', { source: ct, location: loc, page_type: pageType, page, live: PATHWAYS_LIVE, ref: referrerHost() })}
    >
      {children}
    </a>
  );
}

/** The mobile sticky store bar is earned: it shows once `start` has scrolled
 *  past the top, and hides again while `end` (the closing ask) is on screen,
 *  so two asks never compete. */
export function useStickyBar(start: RefObject<HTMLElement>, end: RefObject<HTMLElement>): boolean {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const a = start.current;
      const e = end.current;
      if (!a || !e) return;
      const passed = a.getBoundingClientRect().bottom < 0;
      const endIn = e.getBoundingClientRect().top < window.innerHeight - 40;
      setShow(passed && !endIn);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [start, end]);
  return show;
}

export function StickyBar({ show, heading, body, button, ct, pageType, page }: {
  show: boolean; heading: string; body?: string; button: string; ct: string; pageType: 'pathway' | 'hub'; page: string;
}) {
  return (
    <div className={`pw-sticky${show ? ' show' : ''}`} role="region" aria-label="Get the app" aria-hidden={!show}>
      <div>
        <b>{heading}</b>
        {body && <span>{body}</span>}
      </div>
      <StoreLink ct={ct} loc="sticky" pageType={pageType} page={page} className="pw-btn-act" tabIndex={show ? undefined : -1}>
        {button}
      </StoreLink>
    </div>
  );
}

/** A dark store band: the inline and closing asks. */
export function StoreBand({
  copy, ct, loc, pageType, page, bandRef, secondary,
}: {
  copy: { kicker?: string; heading?: string; body?: string; button: string };
  ct: string; loc: StoreLoc; pageType: 'pathway' | 'hub'; page: string;
  bandRef?: RefObject<HTMLElement>;
  secondary?: { href: string; label: string };
}) {
  return (
    <aside className="pw-band" aria-label={copy.kicker || 'Step Gunner'} ref={bandRef as RefObject<HTMLElement>}>
      {copy.kicker && <p className="pw-band-k">{copy.kicker}</p>}
      {copy.heading && <p className="pw-band-h">{copy.heading}</p>}
      {copy.body && <p className="pw-band-p">{copy.body}</p>}
      <div className="pw-band-row">
        <StoreLink ct={ct} loc={loc} pageType={pageType} page={page} className="pw-btn-act">
          {copy.button}
        </StoreLink>
        {secondary && (
          <a className="pw-btn-ghost" href={secondary.href}>
            {secondary.label}
          </a>
        )}
      </div>
    </aside>
  );
}

/** Screen-reader text for "opens in a new tab", referenced by every citation. */
export function NewTabNote() {
  return (
    <span id="pw-newtab" className="pw-sr">
      Opens in a new tab
    </span>
  );
}
