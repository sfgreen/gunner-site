import Head from 'next/head';
import Link from 'next/link';
import { ReactNode } from 'react';
import { StoreButton, StoreLoc } from '../store';

// Blocks the research, tool and reference pages need on top of components/app
// (research/*, the ED study guide, percentiles, score by specialty, the per-form
// predictor pages, partner). Each renders the .mk vocabulary from styles/wards.css in
// its own island, like the foundation blocks; what the vocabulary lacks is in
// ResearchStyles below, every class prefixed rs-. Colors only from the tokens.
//
// Why these exist (each is a candidate for components/app once a second group needs it):
// - Pitch: DrillCard's dark card, but the primary action can be a link (the readiness
//   check) and a second, quiet action sits beside it. DrillCard's button is always the
//   store and has no secondary.
// - BodyCont: an article grid that continues after a mid-article Stage band (a tool in
//   section 4 of 7), keeping the sticky "On this page" list on the right.
// - PageHead: the exact <Head> LabLayout wrote, so porting off LabLayout changes no tag.

/** The head LabLayout wrote: title, description, the og:image set, then the page's own tags. */
export function PageHead({ metaTitle, metaDesc, ogImage, ogAlt, children }: {
  metaTitle: string;
  metaDesc: string;
  /** A 1200x630 card under public/, e.g. /og/research/<slug>.png. */
  ogImage?: string;
  /** og:image:alt, the page's H1. */
  ogAlt?: string;
  children?: ReactNode;
}) {
  return (
    <Head>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDesc} />
      {ogImage && <meta property="og:image" content={`https://stepgunner.com${ogImage}`} />}
      {ogImage && <meta property="og:image:width" content="1200" />}
      {ogImage && <meta property="og:image:height" content="630" />}
      {ogImage && <meta property="og:image:alt" content={ogAlt} />}
      {ogImage && <meta name="twitter:image" content={`https://stepgunner.com${ogImage}`} />}
      {children}
    </Head>
  );
}

/** The extractable answer under the header: a white sheet with a mono label. */
export function Summary({ label = 'Summary', tone = 'step2', children }: { label?: string; tone?: 'step2' | 'ed'; children: ReactNode }) {
  return (
    <div className="mk isl">
      <section className={`sheet rs-sum rs-c-${tone}`} aria-labelledby="rs-sum-h">
        <div className="sheet-hd"><h2 className="lbl" id="rs-sum-h">{label}</h2></div>
        <div className="sheet-bd">{children}</div>
      </section>
    </div>
  );
}

export type PitchAction =
  | { store: true; label: ReactNode; loc: StoreLoc }
  | { href: string; label: ReactNode; onClick?: () => void };

function act(a: PitchAction, variant: 'act' | 'q') {
  if ('store' in a) return <StoreButton loc={a.loc} variant={variant}>{a.label}</StoreButton>;
  return <Link className={`btn btn-${variant}`} href={a.href} onClick={a.onClick}>{a.label}</Link>;
}

/** The dark glowing app card (DrillCard's .cta.glow) with one primary action, an
 *  optional quiet second action and an optional mono trust line. `top` sits under the
 *  header (820 wide, like the CtaCard slot); `inline` sits in the article column. */
export function Pitch({ kicker, title, body, primary, secondary, trust, placement = 'inline' }: {
  kicker: string;
  title: ReactNode;
  body?: ReactNode;
  primary: PitchAction;
  secondary?: PitchAction;
  trust?: ReactNode;
  placement?: 'top' | 'inline';
}) {
  return (
    <div className="mk isl">
      <aside className={`cta glow rs-pitch${placement === 'top' ? ' rs-top' : ''}`} aria-label={kicker}>
        <div className="cta-in">
          <p className="k lbl"><span className="dot" aria-hidden="true" />{kicker}</p>
          <p className="t">{title}</p>
          {body && <p className="b">{body}</p>}
          <div className="act">{act(primary, 'act')}{secondary && act(secondary, 'q')}</div>
          {trust && <p className="rs-trust">{trust}</p>}
        </div>
      </aside>
    </div>
  );
}

/** The closing pair: the store button and the free web tool, each with its one-line sub. */
export function ChoicePair({ store, alt }: {
  store: { label: ReactNode; sub: ReactNode };
  alt: { href: string; label: ReactNode; sub: ReactNode; onClick?: () => void };
}) {
  return (
    <div className="mk isl">
      <div className="rs-pair">
        <div className="rs-opt"><StoreButton loc="end" lg block>{store.label}</StoreButton><span className="fine">{store.sub}</span></div>
        <div className="rs-opt"><Link className="btn btn-q btn-lg btn-block" href={alt.href} onClick={alt.onClick}>{alt.label}</Link><span className="fine">{alt.sub}</span></div>
      </div>
    </div>
  );
}

/** The article grid again, after a full-bleed Stage band in the middle of an article.
 *  The sticky list on the right continues (from 1040px); the collapsed phone list
 *  stays above the first section only. */
export function BodyCont({ toc, children }: { toc?: [string, string][]; children: ReactNode }) {
  return (
    <div className="mk isl">
      <div className="wrap art-b">
        <div className="art-g">
          <div className="art-col">{children}</div>
          {toc && toc.length > 0 && (
            <aside className="toc" aria-label="On this page, continued">
              <p className="lbl">On this page</p>
              <ol>{toc.map(([id, t]) => <li key={id}><a href={`#${id}`}>{t}</a></li>)}</ol>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

/** A heading for a numbered section that sits inside a Stage band (the tool's section). */
export function StageHead({ id, n, title }: { id: string; n: string; title: ReactNode }) {
  return (
    <div className="mk isl">
      <div className="s-hd rs-shd" id={id}><span className="ix">{n}</span><h2 className="h-2">{title}</h2></div>
    </div>
  );
}

/** Content constrained to the 820px opening column (the header, the summary, the CtaCard slot). */
export function W820({ children }: { children: ReactNode }) {
  return <div className="rs-w820">{children}</div>;
}

/** The space under a header that runs straight into a Stage band (the CtaCard gives
 *  the ABG page this 32px; a page without one needs it from somewhere). */
export function HeroEnd() {
  return <div className="rs-hend" />;
}

/** Everything the blocks above (and the ported pages) need that the vocabulary lacks. */
export function ResearchStyles() {
  return (
    <style jsx global>{`
      .rs-w820 { max-width: 820px; }
      .rs-hend { height: 32px; }
      @media (min-width: 760px) { .rs-hend { height: 40px; } }

      /* a Section with no index (unnumbered headings: "Data and method", "Questions") */
      .mk .s-hd .ix:empty { display: none; }
      .mk .prs strong { color: var(--ink); font-weight: 600; }
      .mk .prs em { font-style: italic; }

      /* a stat strip label that carries its own mono heading (the old key-figure tile) */
      .mk .sts .rs-sk { display: block; margin-bottom: 4px; font: 600 13px/1.3 var(--f-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
      .mk .sts .v small { font: 600 19px/1 var(--f-sans); letter-spacing: 0; color: var(--ink-3); }

      /* summary */
      .mk .rs-sum { margin-top: 24px; max-width: 820px; }
      .mk .rs-sum.rs-c-step2 { --rs-c: var(--step2); }
      .mk .rs-sum.rs-c-ed { --rs-c: var(--ed); }
      .mk .rs-sum .sheet-hd .lbl { color: var(--rs-c); }
      .mk .rs-sum .sheet-bd p { font-size: 18px; line-height: 1.65; color: var(--ink); max-width: 66ch; text-wrap: pretty; }
      .mk .rs-sum .sheet-bd p + p { margin-top: 12px; }

      /* pitch: the dark card, two actions, a trust line */
      .mk .rs-pitch { margin-top: 32px; }
      .mk .rs-pitch.rs-top { margin-top: 24px; max-width: 820px; }
      .mk .rs-pitch .act .btn { min-width: 232px; }
      .mk .rs-pitch .btn-q { background: var(--st-card-2); color: var(--st-ink); box-shadow: inset 0 0 0 1px var(--st-line-2); }
      .mk .rs-pitch .btn-q:hover { box-shadow: inset 0 0 0 1px var(--st-blue); }
      .mk .rs-pitch .rs-trust { grid-column: 1 / -1; font: 500 13px/1.65 var(--f-mono); color: var(--st-ink-3); }
      .mk .rs-pitch .rs-trust a { color: var(--st-blue); text-decoration: underline; text-decoration-color: var(--blue-35); text-underline-offset: .2em; }
      @media (max-width: 599px) { .mk .rs-pitch .act .btn { min-width: 0; width: 100%; } }

      /* closing pair */
      .mk .rs-pair { display: grid; gap: 16px; margin-top: 48px; padding: 16px; border-radius: var(--r-lg); background: var(--card); box-shadow: 0 1px 2px var(--shadow-a), 0 12px 32px -16px var(--shadow-b), inset 0 0 0 1px var(--line); }
      .mk .rs-opt { display: grid; gap: 8px; align-content: start; }
      .mk .rs-opt .fine { text-align: center; }
      @media (min-width: 600px) { .mk .rs-pair { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 20px; } }

      /* lists in prose */
      .mk .rs-ul { display: grid; gap: 12px; margin-top: 16px; max-width: 66ch; }
      .mk .rs-ul > li { position: relative; padding-left: 24px; font-size: 18px; line-height: 1.65; color: var(--ink-2); }
      .mk .rs-ul > li::before { content: ""; position: absolute; left: 4px; top: 12px; width: 6px; height: 6px; border-radius: 50%; background: var(--ctl); }
      .mk .rs-ul :is(b, strong) { color: var(--ink); font-weight: 600; }
      .mk .rs-ul a, .mk .rs-fine a { color: var(--key); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .2em; }
      .mk .steps .st-t a { color: var(--key); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .2em; }
      .mk .steps .st-t :is(b, strong) { font-weight: 700; }

      /* small print, figures' neighbours, the formula, per-topic rate line */
      .mk .rs-fine { margin-top: 12px; font-size: 15px; line-height: 1.55; color: var(--ink-3); max-width: 66ch; }
      .mk .rs-fine b { color: var(--ink-2); font-weight: 600; }
      .mk .rs-rate { margin-top: 8px; font: 500 15px/1.5 var(--f-mono); color: var(--ink-2); font-variant-numeric: tabular-nums; }
      .mk .fxf.rs-eq { margin-top: 16px; overflow-x: auto; }
      .mk .rs-act { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; margin-top: 24px; }

      /* tables: an interval under the number, a muted cell, amber risk rows */
      .mk .tbl .rs-ci { display: block; margin-top: 2px; font: 500 13px/1.4 var(--f-mono); color: var(--ink-3); white-space: nowrap; }
      .mk .tbl td.rs-muted { color: var(--ink-3); }
      .mk.rs-risk .tbl tr.hl > * { background: var(--step2-tint); }
      .mk .rs-mag { display: inline-flex; align-items: center; justify-content: flex-end; gap: 8px; width: 100%; }
      .mk .rs-bar { display: block; flex: 1 1 auto; max-width: 96px; min-width: 40px; height: 8px; border-radius: 999px; background: var(--card-2); box-shadow: inset 0 0 0 1px var(--line); overflow: hidden; }
      .mk .rs-bar i { display: block; height: 100%; border-radius: inherit; background: var(--step2); }
      .mk .rs-mag b { min-width: 40px; text-align: right; }
      .mk .tbl .rs-how { color: var(--ink-2); font-size: 15px; }
      .mk .tbl .rs-fail { color: var(--step2); font-weight: 600; }

      /* a section heading inside a Stage band */
      .mk .rs-shd { margin-bottom: 24px; scroll-margin-top: calc(var(--nav-h) + 24px); }
      .mk .stage-band .rs-shd .ix { color: var(--st-gold); }
      .mk .stage-band .rs-cal { margin-top: 16px; font: 500 13px/1.65 var(--f-mono); color: var(--st-ink-3); max-width: 90ch; }

      /* dark tools in a Stage */
      .mk .rs-tool .h-3 { color: var(--st-ink); }
      .mk .rs-tool .fld label { color: var(--st-ink); }
      .mk .rs-tool li { color: var(--st-ink-2); }
      .mk .rs-tool .range { color: var(--st-ink); }
      .mk .rs-tool p.lbl { color: var(--st-ink-3); }
      .mk .rs-tool b { color: var(--st-ink); }
      .mk .rs-tool a:not(.btn) { color: var(--st-blue); text-decoration: underline; text-decoration-color: var(--blue-35); text-underline-offset: .2em; }
      .mk .rs-tool .fine { margin-top: 12px; font-size: 15px; line-height: 1.55; color: var(--st-ink-3); }
      .mk .rs-tool .rs-ul > li::before { background: var(--st-ink-3); }
      .mk .rs-read { padding: 12px 16px; border-radius: var(--r-md); background: var(--st-card-2); box-shadow: inset 3px 0 0 var(--st-ink-3); font-size: 18px; line-height: 1.55; }
      .mk .rs-tool p.rs-read { color: var(--st-ink); }
      .mk .rs-read.ok { box-shadow: inset 3px 0 0 var(--st-green); }
      .mk .rs-read.warn { box-shadow: inset 3px 0 0 var(--st-gold); }
      .mk .rs-read + .rs-read { margin-top: 8px; }
      .mk .rs-dk .tbl-w { background: var(--st-card-2); box-shadow: inset 0 0 0 1px var(--st-line); }
      .mk .rs-dk .tbl thead th { background: var(--st-card); color: var(--st-ink-3); }
      .mk .rs-dk .tbl td, .mk .rs-dk .tbl tbody th { color: var(--st-ink-2); box-shadow: inset 0 1px 0 var(--st-line); }
      .mk .rs-dk .tbl tbody th, .mk .rs-dk .tbl b { color: var(--st-ink); }
      .mk .rs-dk .tbl tr.hl > * { background: var(--focus-ring); color: var(--st-ink); }
      .mk .rs-dk .tbl-w:focus-visible { outline-color: var(--st-blue); }
      .mk .rs-dk .rs-bar { background: var(--st-card); box-shadow: inset 0 0 0 1px var(--st-line-2); }
      .mk .rs-dk .rs-bar i { background: var(--st-green); }
      .mk .rs-you { margin-left: 8px; font: 700 13px/1 var(--f-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--st-green); }
      .mk .rs-thin { color: var(--st-gold); }
      .mk .rs-solid { font: 500 13px/1.4 var(--f-mono); color: var(--st-ink-2); }
    `}</style>
  );
}
