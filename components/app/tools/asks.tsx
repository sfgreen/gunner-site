import { ReactNode } from 'react';
import { StoreButton, type StoreLoc } from '../store';
import { FREE } from '../../../lib/app/chrome';

// Store asks for the tool pages (/readiness, /step-2-score-predictor, the methodology),
// in the same markup and classes as the foundation blocks (EndBand, StickyStoreBar,
// DrillCard in components/app/store.tsx), plus the two things those blocks do not pass
// through yet: a campaign (ct) and extra GA4 params per button. The tool pages have
// always sent a GA4 `source` that differs from their App Store campaign (for example
// ct=readiness_web with source=readiness); `params` keeps that value exactly, so the
// admin growth table's history per source does not split on the port.

type Attribution = {
  /** App Store campaign for this button, when it differs from the page's. */
  ct?: string;
  /** Extra GA4 fields; a `source` here overrides the campaign as the GA4 source. */
  params?: Record<string, unknown>;
};

/** The full-bleed dark closing band (EndBand) with attribution and a secondary node. */
export function ToolEndBand({
  id = 'end', kicker = 'Step Gunner for iPhone', title, body, button, fine, ct, params, secondary,
}: Attribution & {
  id?: string;
  kicker?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  button?: ReactNode;
  fine?: ReactNode;
  /** A quiet second action under the button, e.g. a tracked internal link. */
  secondary?: ReactNode;
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
            <StoreButton loc="end" lg ct={ct} params={params}>{button || 'Get Step Gunner free'}</StoreButton>
            <p className="fine">{fine || `${FREE}.`}</p>
            {secondary}
          </div>
        </div>
      </section>
    </div>
  );
}

/** The phone sticky bar (StickyStoreBar) with attribution. Pass it to AppShell `sticky`. */
export function ToolStickyBar({ title, sub = FREE, button = 'Get it free', ct, params }: Attribution & {
  title: ReactNode;
  sub?: ReactNode;
  button?: ReactNode;
}) {
  return (
    <div className="mk isl">
      <div className="sticky" role="region" aria-label="Get the app">
        <div className="sticky-t"><b>{title}</b><span>{sub}</span></div>
        <StoreButton loc="sticky" ct={ct} params={params}>{button}</StoreButton>
      </div>
    </div>
  );
}

/** "The part you control": the glowing app card after a tool result, with the two
 *  beat figures from the score reports. `end` marks it as the page's closing ask (the
 *  phone sticky bar hides once it is on screen); leave it off when content follows. */
export function BeatPitch({
  kicker, title, stats, body, button = 'Get Step Gunner free', fine, note, loc = 'result', ct, params, id, end = false,
}: Attribution & {
  kicker: ReactNode;
  title: ReactNode;
  stats: { v: ReactNode; l: ReactNode }[];
  body: ReactNode;
  button?: ReactNode;
  fine?: ReactNode;
  /** A second fine line under the button. */
  note?: ReactNode;
  loc?: StoreLoc;
  id?: string;
  end?: boolean;
}) {
  return (
    <div className="mk isl">
      <aside className="cta glow tl-beat" aria-labelledby={id ? `${id}-h` : undefined} aria-label={id ? undefined : 'Step Gunner'} id={id} {...(end ? { 'data-sticky-end': '' } : {})}>
        <div className="tl-beat-c">
          <p className="k lbl"><span className="dot gold" aria-hidden="true" />{kicker}</p>
          <h2 className="t" id={id ? `${id}-h` : undefined}>{title}</h2>
          <p className="b">{body}</p>
        </div>
        <div className="tl-beat-x">
          <dl className="tl-stats">
            {stats.map((s, i) => <div key={i}><dt className="num">{s.v}</dt><dd>{s.l}</dd></div>)}
          </dl>
          <div className="tl-beat-act">
            <StoreButton loc={loc} ct={ct} params={params} block>{button}</StoreButton>
            {fine && <p className="fine">{fine}</p>}
            {note && <p className="fine">{note}</p>}
          </div>
        </div>
      </aside>
      <style jsx global>{`
        .mk .tl-beat { display: grid; gap: 24px; }
        .mk .tl-beat-c { display: grid; gap: 12px; align-content: start; min-width: 0; }
        .mk .tl-beat .k .dot { margin-right: 0; }
        .mk .tl-beat-x { display: grid; gap: 20px; align-content: start; min-width: 0; }
        .mk .tl-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); box-shadow: inset 0 1px 0 var(--st-line-2); }
        .mk .tl-stats > div { min-width: 0; padding: 16px 16px 0 0; }
        .mk .tl-stats > div + div { padding-left: 16px; box-shadow: inset 1px 0 0 var(--st-line-2); }
        .mk .tl-stats dt { font: 800 28px/1.1 var(--f-sans); letter-spacing: -.02em; color: var(--st-gold); white-space: nowrap; }
        .mk .tl-stats dd { margin-top: 8px; font: 600 13px/1.35 var(--f-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--st-ink-3); }
        .mk .tl-beat-act { display: grid; gap: 8px; justify-items: stretch; }
        .mk .tl-beat-act .fine { color: var(--st-ink-3); }
        @media (min-width: 960px) {
          .mk .tl-beat { grid-template-columns: minmax(0, 1fr) minmax(0, 380px); column-gap: 48px; align-items: start; }
        }
      `}</style>
    </div>
  );
}
