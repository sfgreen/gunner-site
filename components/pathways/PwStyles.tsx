// What the pathway article and hub add to the app look. Everything else is the
// shared vocabulary: tokens in styles/globals.css, the .mk classes in
// styles/wards.css, the blocks in styles/app.css (components/app/README.md).
// Global, so every class here is .pw- prefixed (README rule 3) and sits under
// .mk, which outranks the vocabulary's own `.mk x` element rules. Colors come
// only from the tokens; dark surfaces (the Stage band, the calculators) use the
// --st-* set. Spacing is the 4/8 grid; type is the site scale (13, 15, 16, 18,
// 19, 21, 23, 32); motion is the vocabulary's own, zeroed under reduced motion.
export default function PwStyles() {
  return (
    <style jsx global>{`
      .pw-a { display: contents; }

      /* ---------- the opening ---------- */
      .mk .pw-draft { display: flex; gap: 12px; align-items: flex-start; max-width: 820px; margin: 0 0 16px; padding: 12px 16px; border-radius: var(--r-md); background: var(--step2-tint); color: var(--ink); font-size: 15px; line-height: 1.5; }
      .mk .pw-draft .ic { margin-top: 2px; color: var(--step2); }
      .mk .pw-draft b { color: var(--step2); }
      .mk .pw-trust .ic { color: var(--ok); }

      /* ---------- the Stage: the route at a glance beside the quick checks ---------- */
      .mk .pw-sg { display: grid; gap: 16px; align-items: start; }
      .mk .pw-sg > .tc.pw-qp { margin-top: 0; }
      /* The band's overflow: hidden (styles/wards.css) makes it a scroll container, so
         nothing inside a Stage can stick; clip still clips without that. */
      .pw-a .mk .stage-band { overflow: clip; }
      @media (min-width: 1040px) {
        .mk .pw-sg { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 24px; }
        .mk .pw-sg > .tc.pw-qp { position: sticky; top: calc(var(--nav-h) + 16px); max-height: calc(100vh - var(--nav-h) - 32px); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
        .mk .pw-sg > .tc.pw-qp:only-child { grid-column: 1 / -1; position: static; max-width: 800px; }
      }
      .mk .pw-gli { color: var(--st-ink-2); font-size: 16px; line-height: 1.5; max-width: 52ch; }
      .mk .pw-route { display: grid; margin-top: 20px; }
      .mk .pw-route > li { position: relative; display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 12px; padding-bottom: 20px; }
      .mk .pw-route > li::after { content: ""; position: absolute; left: 15px; top: 32px; bottom: 0; width: 2px; background: var(--st-line-2); }
      .mk .pw-route > li:last-child { padding-bottom: 0; }
      .mk .pw-route > li:last-child::after { display: none; }
      .mk .pw-rn { position: relative; z-index: 1; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; background: var(--st-card-2); box-shadow: inset 0 0 0 1px var(--st-line-2); color: var(--st-ink); font: 700 15px/1 var(--f-mono); }
      .mk .pw-rb { min-width: 0; padding-top: 4px; }
      .mk .pw-rt { margin-top: 4px; font-size: 16px; line-height: 1.5; font-weight: 600; }
      .mk .pw-rt a { color: var(--st-ink); text-decoration: none; }
      .mk .pw-rt a:hover { text-decoration: underline; text-decoration-color: var(--st-ink-3); }
      .mk .pw-rf > a { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; color: var(--st-blue); font-size: 15px; font-weight: 600; line-height: 1.35; text-decoration: none; }
      .mk .pw-rf > a:hover { text-decoration: underline; }
      .mk .pw-rf > a .ic { flex: none; }

      /* the quick checks: the wards "try the case" card (.tc), one question at a time */
      .mk .pw-qp .tc-hd h2 { margin: 0; }
      .mk .pw-qbar { display: flex; gap: 4px; margin-top: 16px; }
      .mk .pw-qbar i { flex: 1 1 0; min-width: 0; height: 4px; border-radius: 4px; background: var(--st-line-2); transition: background-color var(--d-micro) var(--ease); }
      .mk .pw-qbar i.now { background: var(--st-ink); }
      .mk .pw-qbar i.ok { background: var(--st-green); }
      .mk .pw-qbar i.no { background: var(--st-red); }
      .mk .pw-qc { margin-top: 16px; }
      /* .mk .stage-band p (wards.css) outranks .tc-q and p.lbl; restore the card's own inks */
      .mk .pw-sg .tc-q { margin-top: 8px; color: var(--st-ink); }
      .mk .pw-sg p.lbl { color: var(--st-ink-3); }
      .mk .pw-qp .tc-q:focus { outline: none; }
      .mk .pw-qp .tc-q:focus-visible { outline: 2px solid var(--st-blue); outline-offset: 4px; border-radius: 4px; }
      .mk .pw-qp .opt { font-size: 16px; }
      .mk .pw-qr { gap: 12px; }
      .mk .pw-qr .tc-res { display: flex; align-items: center; gap: 8px; }
      .mk .pw-qr .tc-res.ok .ic { color: var(--st-green); }
      .mk .pw-qr .tc-res.no .ic { color: var(--st-red); }
      .mk .pw-qr .lnk { justify-self: start; }
      .mk .pw-qnav { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-top: 20px; padding-top: 16px; box-shadow: inset 0 1px 0 var(--st-line); }
      .mk .pw-qp .btn-q { background: var(--st-card-2); color: var(--st-ink); box-shadow: inset 0 0 0 1px var(--st-line-2); }
      .mk .pw-qp .btn-q:hover:not([disabled]) { box-shadow: inset 0 0 0 1px var(--st-blue); }
      .mk .pw-qp :focus-visible { outline-color: var(--st-blue); }
      .mk .pw-flip { display: inline-flex; transform: scaleX(-1); }
      .mk .pw-sg .pw-qsc { flex: 1 1 160px; text-align: center; font: 600 13px/1.4 var(--f-mono); letter-spacing: .04em; color: var(--st-ink-3); }
      @media (max-width: 599px) {
        .mk .pw-sg .pw-qsc { flex-basis: 100%; order: -1; text-align: left; }
        .mk .pw-qnav .btn { flex: 1 1 0; }
      }

      /* ---------- the article body ---------- */
      .mk .pw-step, .mk .pw-fork, .mk .pw-ends > li, .mk .pw-calc { scroll-margin-top: calc(var(--nav-h) + 16px); }
      .mk .pw-step { margin-top: 16px; padding: 20px; border-radius: var(--r-lg); background: var(--card); box-shadow: 0 1px 2px var(--shadow-a), inset 0 0 0 1px var(--line); }
      .mk .pw-step:target { box-shadow: 0 1px 2px var(--shadow-a), inset 0 0 0 2px var(--key); }
      .mk .pw-sh { margin-top: 8px; font: 700 21px/1.3 var(--f-sans); letter-spacing: -.01em; color: var(--ink); text-wrap: balance; }
      .mk .pw-nbs { margin-top: 12px; max-width: 66ch; color: var(--ink); }
      .mk .pw-nbs b { font-weight: 700; }
      .mk .pw-note { margin-top: 12px; padding: 12px 16px; border-radius: var(--r-sm); background: var(--card-2); color: var(--ink-2); font-size: 15px; line-height: 1.55; }
      .mk .pw-mathl, .mk .pw-endl { margin-top: 12px; font-size: 15px; line-height: 1.5; color: var(--ink-2); }
      .mk .pw-endl { padding-top: 12px; box-shadow: inset 0 1px 0 var(--line); }
      .mk .pw-muted { color: var(--ink-3); }
      .mk :is(.pw-mathl, .pw-endl, .pw-from, .pw-ctx, .pw-tbl td) a:not(.btn) { color: var(--key); text-decoration: underline; text-decoration-color: var(--line-2); text-underline-offset: .2em; }
      .mk :is(.pw-mathl, .pw-endl, .pw-from, .pw-ctx, .pw-tbl td) a:not(.btn):hover { text-decoration-color: currentColor; }
      @media (min-width: 760px) { .mk .pw-step { padding: 24px 28px; } }

      /* tables (orders, forks, disagreements): rows stack on phones, each cell with its column label */
      .mk .pw-tbl .tbl { font-size: 15px; }
      .mk .pw-t2 .tbl tbody th { width: 32%; }
      .mk .pw-t3 .tbl tbody th { width: 24%; }
      .mk .pw-tbl .srcl { margin-top: 4px; }
      .mk .pw-cl { display: none; }
      .mk .pw-onote { display: block; margin-top: 4px; color: var(--ink-2); }
      .mk .pw-ddx { display: block; margin-top: 4px; color: var(--ink-3); }
      .mk .pw-ctx { display: flex; align-items: center; min-height: 44px; font-weight: 500; font-size: 15px; line-height: 1.4; }
      .mk .pw-olist { margin-top: 8px; }
      .mk .pw-olist li { padding: 8px 0; box-shadow: inset 0 1px 0 var(--line); }
      .mk .pw-olist b { color: var(--ink); font-weight: 600; }
      .mk .pw-fork:target .tbl-w { box-shadow: inset 0 0 0 2px var(--key); }
      @media (max-width: 599px) {
        .mk .pw-tbl .tbl thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
        .mk .pw-tbl .tbl, .mk .pw-tbl .tbl tbody, .mk .pw-tbl .tbl tr, .mk .pw-tbl .tbl tbody th, .mk .pw-tbl .tbl td { display: block; width: auto; }
        .mk .pw-tbl .tbl tr { padding: 12px 16px; box-shadow: inset 0 1px 0 var(--line); }
        .mk .pw-tbl .tbl tbody tr:first-child { box-shadow: none; }
        .mk .pw-tbl .tbl tbody th, .mk .pw-tbl .tbl td { padding: 4px 0; box-shadow: none; }
        .mk .pw-cl { display: block; margin: 8px 0 4px; font: 600 13px/1.3 var(--f-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
      }

      /* status: icon plus word */
      .mk .pw-chip { display: inline-flex; align-items: center; gap: 4px; margin: 0 8px 4px 0; padding: 0 8px; border-radius: 8px; font: 700 13px/24px var(--f-mono); letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; vertical-align: 1px; }
      .mk .pw-chip .ic { width: 14px; height: 14px; stroke-width: 2.25; }
      .mk .pw-chip.ok { color: var(--ok); background: var(--wards-tint); }
      .mk .pw-chip.avoid { color: var(--bad); background: var(--bad-tint); }
      .mk .pw-chip.conflict { color: var(--on-differ); background: var(--differ-fill); }
      .mk .pw-chip.pending { color: var(--ink-2); box-shadow: inset 0 0 0 1px var(--line-2); }

      /* forks */
      .mk .pw-fork { margin-top: 24px; }
      .mk .pw-fk { display: flex; align-items: center; gap: 8px; }
      .mk .pw-fh { margin-top: 4px; font: 700 19px/1.35 var(--f-sans); letter-spacing: -.01em; color: var(--ink); text-wrap: balance; }

      /* the fork index, the endpoints, the checklist: ruled white cards */
      .mk .pw-fx, .mk .pw-check { margin-top: 16px; border-radius: var(--r-lg); background: var(--card); box-shadow: 0 1px 2px var(--shadow-a), inset 0 0 0 1px var(--line); }
      .mk .pw-fx > li { padding: 8px 20px 16px; box-shadow: inset 0 1px 0 var(--line); }
      .mk .pw-fx > li:first-child, .mk .pw-check > li:first-child { box-shadow: none; }
      .mk .pw-fxh { font: 700 18px/1.35 var(--f-sans); }
      .mk .pw-fxh a { display: inline-flex; align-items: flex-start; gap: 8px; min-height: 44px; padding-block: 10px; color: var(--ink); text-decoration: none; }
      .mk .pw-fxh a .ic { margin-top: 4px; color: var(--ink-3); }
      .mk .pw-fxh a:hover { text-decoration: underline; }
      .mk .pw-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
      .mk .pw-gc { padding: 4px 8px; border-radius: 8px; font: 500 13px/1.4 var(--f-mono); color: var(--ink-2); background: var(--card-2); box-shadow: inset 0 0 0 1px var(--line); }
      .mk .dark-card .pw-gc { color: var(--st-ink-2); background: var(--st-card-2); box-shadow: inset 0 0 0 1px var(--st-line); }
      .mk .pw-ends { display: grid; gap: 8px; margin-top: 16px; }
      .mk .pw-ends > li { padding: 16px 20px; border-radius: var(--r-md); background: var(--card); box-shadow: inset 0 0 0 1px var(--line); }
      .mk .pw-ends > li:target { box-shadow: inset 0 0 0 2px var(--key); }
      .mk .pw-ends p { color: var(--ink-2); max-width: 66ch; }
      .mk .pw-ends b { color: var(--ink); font-weight: 600; }
      .mk .pw-ends .pw-from { margin-top: 8px; font-size: 15px; color: var(--ink-3); }
      .mk .pw-check > li { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 12px; padding: 16px 20px; box-shadow: inset 0 1px 0 var(--line); }
      .mk .pw-check .ic { margin-top: 4px; color: var(--ctl); }
      .mk .pw-check p { color: var(--ink-2); }
      .mk .pw-check b { color: var(--ink); font-weight: 600; }

      /* the bedside math: dark app cards, the ABG interpreter's fields */
      .mk .pw-calcs { display: grid; gap: 16px; margin-top: 16px; }
      .mk .pw-calc .sheet-hd .lbl { color: var(--st-ink-2); }
      .mk .pw-flds { display: grid; grid-template-columns: repeat(auto-fill, minmax(176px, 1fr)); gap: 16px; }
      .mk .pw-flds .pw-wide { grid-column: 1 / -1; }
      .mk .pw-pts { grid-template-columns: repeat(auto-fill, minmax(256px, 1fr)); }
      .mk .pw-calc .fld label { align-items: flex-end; min-height: 40px; }
      .mk .pw-calc .sel select.inp { font-size: 16px; padding-right: 32px; text-overflow: ellipsis; }
      .mk .pw-out { display: grid; gap: 12px; margin-top: 20px; padding-top: 16px; box-shadow: inset 0 1px 0 var(--st-line); }
      .mk .pw-out .err { font-size: 15px; }
      .mk .pw-orow { display: grid; gap: 4px; }
      .mk .pw-ov { font: 700 32px/1.1 var(--f-mono); font-variant-numeric: tabular-nums; font-feature-settings: "zero" 1; color: var(--st-ink); overflow-wrap: anywhere; }
      .mk .pw-ov small { font: 500 15px/1 var(--f-sans); color: var(--st-ink-3); }
      .mk .pw-ob { margin-top: 4px; padding: 8px 12px; border-radius: var(--r-sm); background: var(--st-card-2); box-shadow: inset 3px 0 0 var(--st-blue); font-size: 16px; line-height: 1.45; color: var(--st-ink); }
      .mk .pw-form { margin-top: 16px; padding: 12px 16px; border-radius: var(--r-sm); background: var(--st-card-2); font: 500 15px/1.6 var(--f-mono); font-feature-settings: "zero" 1; color: var(--st-ink-2); overflow-wrap: anywhere; }
      .mk .pw-form b { color: var(--st-ink); font-weight: 700; }
      .mk .pw-bands { display: grid; gap: 4px; margin-top: 12px; font-size: 15px; line-height: 1.5; color: var(--st-ink-2); }
      .mk .pw-bands li { position: relative; padding-left: 16px; }
      .mk .pw-bands li::before { content: ""; position: absolute; left: 0; top: .6em; width: 6px; height: 6px; border-radius: 50%; background: var(--st-ink-3); }
      .mk .pw-cnote { margin-top: 12px; font-size: 15px; line-height: 1.55; color: var(--st-ink-2); }
      .mk .pw-used { margin-top: 12px; font-size: 15px; line-height: 1.5; color: var(--st-ink-3); }
      .mk .pw-used a { color: var(--st-blue); text-decoration: underline; text-decoration-color: var(--blue-35); }
      .mk .pw-calc .srcl { margin-top: 12px; }

      /* on rounds: the script card, numbered plan */
      .mk .pw-present { display: grid; gap: 12px; }
      .mk .pw-present .lbl + p { margin-top: -4px; }
      .mk .pw-plan { display: grid; gap: 8px; counter-reset: pl; }
      .mk .pw-plan li { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 8px; counter-increment: pl; font-size: 18px; line-height: 1.6; color: var(--ink); }
      .mk .pw-plan li::before { content: counter(pl) "."; font: 600 15px/1.9 var(--f-mono); color: var(--ink-3); }

      /* traps: one red callout each */
      .mk .pw-traps { display: grid; gap: 8px; margin-top: 16px; }
      .mk .pw-traps .trap { margin-top: 0; }
      .mk .pw-traps .trap p:not(.tt) { color: var(--ink-2); }

      /* practice patients */
      .mk .pw-case { margin-top: 16px; padding: 20px; border-radius: var(--r-lg); background: var(--card); box-shadow: 0 1px 2px var(--shadow-a), inset 0 0 0 1px var(--line); }
      .mk .pw-case .vig { margin: 8px 0 0; color: var(--ink-2); }
      .mk .pw-case .faq details { background: var(--card-2); box-shadow: none; }
      .mk .pw-case-a { margin-top: 16px; }
      @media (min-width: 760px) { .mk .pw-case { padding: 24px 28px; } }

      .mk .pw-refs li { overflow-wrap: anywhere; }
      .mk .pw-refs b { font-weight: 600; }

      /* The contents list scrolls inside itself when it is taller than the window
         (16 sections and the app card); the card shows where the column is wide enough. */
      .pw-a .mk .toc { max-height: calc(100vh - 96px); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; padding-bottom: 24px; }
      /* Wide windows: only the list scrolls, so the app card under it always shows. */
      @media (min-width: 1040px) {
        .pw-a .mk .toc { display: flex; flex-direction: column; overflow: visible; }
        .pw-a .mk .toc ol { min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
        .pw-a .mk .toc .toc-x { flex: none; }
      }
      .pw-a .mk .toc-x { display: none; }
      @media (min-width: 1200px) { .pw-a .mk .toc-x { display: block; } }

      /* ---------- the hub ---------- */
      .mk .pw-find .sbox input { padding-right: 48px; }
      .mk .pw-kbd { position: absolute; right: 16px; padding: 0 8px; border-radius: 6px; font: 600 13px/24px var(--f-mono); color: var(--ink-3); box-shadow: inset 0 0 0 1px var(--line-2); }
      @media (hover: none) { .mk .pw-kbd { display: none; } }
      .mk .pw-groups { padding-top: 24px; }
      .mk .pw-grp { display: grid; gap: 16px; padding: 24px 0; box-shadow: inset 0 1px 0 var(--line); }
      .mk .pw-grp-hd { display: flex; align-items: baseline; justify-content: space-between; gap: 8px 16px; flex-wrap: wrap; }
      .mk .pw-grp-t { font: 800 23px/1.2 var(--f-sans); letter-spacing: -.02em; color: var(--ink); }
      .mk .pw-cards { display: grid; gap: 16px; }
      .mk .pw-hc { padding: 20px; }
      .mk .pw-hct { font: 700 21px/1.25 var(--f-sans); letter-spacing: -.015em; text-wrap: balance; }
      .mk .pw-hct a { color: var(--ink); text-decoration: none; }
      .mk .pw-hct a::after { content: ""; position: absolute; inset: 0; border-radius: var(--r-lg); }
      .mk .pw-hct a:focus-visible { outline: none; }
      .mk .pw-hct a:focus-visible::after { outline: 2px solid var(--focus); outline-offset: 2px; }
      .mk .pw-hc:hover .pw-hct a { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .2em; }
      .mk .pw-hdl { display: grid; gap: 8px; margin-top: 12px; }
      .mk .pw-hdl dd { margin-top: 4px; font-size: 16px; line-height: 1.5; color: var(--ink-2); }
      .mk .pw-hcm { display: inline-flex; flex-wrap: wrap; gap: 4px 12px; font: 500 13px/1.4 var(--f-mono); color: var(--ink-3); }
      .mk .pw-tag { color: var(--step2); font-weight: 700; }
      .mk .pw-how { max-width: 720px; padding-bottom: 56px; }
      @media (min-width: 600px) { .mk .pw-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (min-width: 960px) {
        .mk .pw-grp { grid-template-columns: 232px minmax(0, 1fr); gap: 32px; padding: 32px 0; }
        .mk .pw-grp-hd { position: sticky; top: calc(var(--nav-h) + 24px); align-self: start; flex-direction: column; align-items: flex-start; gap: 8px; }
      }
    `}</style>
  );
}
