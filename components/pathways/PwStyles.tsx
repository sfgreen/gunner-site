// Styles for the pathway article and hub, scoped under .pw, in the Score Report
// register (styles/globals.css supplies the base palette). Only what these pages
// add is declared here.
//
// Tokens added (SITE_REDESIGN 3.0, the AA fixes):
//   --pw-ink-3 #6b717d   labels and meta on bg and bg-2 (4.66 and 4.90:1); on bg-3
//                        panels labels use --ink-dim (5.32:1) instead
//   --pw-link  #2459c9   links (5.96:1 on bg; the site blue #2f6fed is 4.32:1)
//   --pw-green-ink #086b33  green text (5.36:1 or better on every surface here)
//   --pw-gold-ink  #8a5700  amber text on the gold tint (5.21:1)
//   --pw-red-ink   #a83224  red text on the red tint (5.83:1)
//   --pw-control   #858a93  input and option borders (3.29:1, the 3:1 UI floor)
// Type: 1.2 ratio from 17px (12, 14, 17, 20, 24, 29, 35, 42). Space: 4/8 grid.
// Motion: 140ms micro, 240ms for the sticky bar, ease-out, transform and opacity
// only; globals.css zeroes it under prefers-reduced-motion.
export default function PwStyles() {
  return (
    <style jsx global>{`
      .pw {
        --pw-ink-3: #6b717d;
        --pw-link: #2459c9;
        --pw-green-ink: #086b33;
        --pw-gold-ink: #8a5700;
        --pw-red-ink: #a83224;
        --pw-control: #858a93;
        --pw-band: #191c23;
        --pw-on-band-2: #c3c5c9;
        --pw-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
        color-scheme: light;
        overflow-wrap: break-word;
      }
      .pw-srcs, .pw-cites, .pw-tab, .pw-ends, .pw-draft { overflow-wrap: anywhere; }
      .pw .pw-sr {
        position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden;
        clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
      }
      .pw .pw-ic { width: 16px; height: 16px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
      .pw a { color: var(--pw-link); }
      :where(.pw) p { margin: 0 0 16px; }

      /* ---------- layout: article column plus a sticky contents rail ---------- */
      .pw-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 48px; }
      .pw-main { min-width: 0; max-width: 720px; }
      .pw-toc { display: none; }
      @media (min-width: 1024px) {
        .pw-grid { grid-template-columns: minmax(0, 720px) 240px; justify-content: space-between; }
        .pw-toc { display: block; position: sticky; top: 24px; align-self: start; max-height: calc(100vh - 48px); overflow: auto; margin-top: 112px; }
      }

      /* ---------- hero ---------- */
      .pw-crumb ol { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 16px; padding: 0; font: 600 12px/1.5 var(--mono); letter-spacing: 0.04em; color: var(--pw-ink-3); }
      .pw-crumb li + li::before { content: '/'; margin-right: 8px; }
      .pw-crumb a { color: var(--ink-dim); text-decoration: none; }
      .pw-crumb a:hover { color: var(--ink); text-decoration: underline; }
      .pw-draft { display: flex; gap: 12px; align-items: flex-start; background: var(--gold-soft); border: 1px solid rgba(224, 142, 0, 0.4); border-radius: 12px; padding: 12px 16px; margin: 0 0 24px; font-size: 14px; line-height: 1.5; }
      .pw-draft .pw-ic { color: var(--pw-gold-ink); margin-top: 2px; }
      .pw-draft p { margin: 0; }
      .pw-draft b { color: var(--pw-gold-ink); }
      .pw-eyebrow { font: 700 12px/1.4 var(--mono); letter-spacing: 0.12em; text-transform: uppercase; color: var(--pw-green-ink); margin: 0 0 8px; }
      .pw h1 { font-size: clamp(29px, 6.2vw, 42px); line-height: 1.08; letter-spacing: -0.028em; font-weight: 800; margin: 0 0 16px; }
      .pw-dek { font-size: 20px; line-height: 1.5; color: var(--ink-dim); max-width: 62ch; }
      .pw-meta { list-style: none; display: flex; flex-wrap: wrap; gap: 4px 16px; padding: 0; margin: 0 0 24px; font: 600 12px/1.6 var(--mono); color: var(--pw-ink-3); }
      .pw-meta b { color: var(--ink); }
      .pw-reviewed { display: flex; gap: 8px; align-items: center; font-size: 14px; font-weight: 600; color: var(--pw-green-ink); margin: -8px 0 24px; }
      .pw-jump { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 0 16px; padding: 0 0 4px; }
      .pw-jump::-webkit-scrollbar { display: none; }
      .pw-jump a { flex: 0 0 auto; min-height: 44px; display: inline-flex; align-items: center; text-decoration: none; }
      .pw-jump a span { font: 700 12px/1 var(--mono); letter-spacing: 0.04em; border: 1px solid var(--hair-strong); border-radius: 999px; padding: 8px 12px; color: var(--ink); background: var(--bg-2); transition: background 140ms var(--pw-ease); }
      .pw-jump a:hover span { background: var(--bg-3); }
      @media (max-width: 1023px) {
        .pw-jump { position: sticky; top: 0; z-index: 4; background: var(--bg); border-bottom: 1px solid var(--hair); padding: 4px 0; }
      }
      .pw-trust { display: flex; gap: 12px; align-items: flex-start; background: var(--green-soft); border: 1px solid rgba(13, 148, 72, 0.22); border-radius: 12px; padding: 12px 16px; margin: 0 0 24px; font-size: 14px; line-height: 1.5; }
      .pw-trust .pw-ic { color: var(--pw-green-ink); margin-top: 2px; }
      .pw-trust p { margin: 0; }

      /* The one lifted object on the page: the answer. */
      .pw-short { background: var(--bg-2); border: 1px solid var(--hair-strong); border-radius: 16px; padding: 24px; margin: 0 0 24px; box-shadow: var(--lift); scroll-margin-top: 64px; }
      .pw .pw-k { font: 700 12px/1.4 var(--mono); letter-spacing: 0.14em; text-transform: uppercase; color: var(--pw-green-ink); margin: 0 0 12px; }
      .pw-short ol { margin: 0; padding-left: 24px; }
      .pw-short li { margin: 0 0 8px; }
      .pw-short li:last-child { margin-bottom: 0; }

      /* ---------- store asks: flat ink band, gold only on the action ---------- */
      .pw-band { background: var(--pw-band); color: #fff; border-radius: 16px; padding: 24px; margin: 32px 0; }
      .pw-band-k { font: 700 12px/1.4 var(--mono); letter-spacing: 0.14em; text-transform: uppercase; color: var(--pw-on-band-2); margin: 0 0 8px; }
      .pw-band-h { font-size: 20px; line-height: 1.3; font-weight: 800; letter-spacing: -0.01em; margin: 0 0 8px; }
      .pw-band-p { color: var(--pw-on-band-2); font-size: 14px; line-height: 1.55; max-width: 56ch; }
      .pw-band-row { display: flex; flex-wrap: wrap; gap: 12px; }
      .pw .pw-btn-act { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; background: var(--gold); color: #1a1403; font-weight: 800; font-size: 14px; padding: 12px 16px; border-radius: 12px; text-decoration: none; transition: transform 140ms var(--pw-ease); }
      .pw .pw-btn-act:hover { text-decoration: none; transform: translateY(-1px); }
      .pw .pw-btn-ghost { display: inline-flex; align-items: center; min-height: 44px; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.35); color: #fff; font-weight: 700; font-size: 14px; text-decoration: none; }
      .pw .pw-btn-quiet { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 16px; border-radius: 12px; border: 1px solid var(--pw-control); background: var(--bg-2); color: var(--ink); font-weight: 700; font-size: 14px; text-decoration: none; }
      .pw .pw-btn-quiet:hover { background: var(--bg-3); text-decoration: none; }
      .pw .pw-btn-block { width: 100%; }

      /* ---------- section rhythm ---------- */
      .pw-main > section { scroll-margin-top: 64px; }
      .pw .pw-h2 { font-size: 29px; line-height: 1.2; letter-spacing: -0.018em; font-weight: 800; margin: 48px 0 16px; scroll-margin-top: 64px; }
      .pw .pw-h3 { font-size: 20px; line-height: 1.3; margin: 32px 0 8px; }
      .pw-intro { color: var(--ink-dim); max-width: 68ch; }
      .pw-muted { color: var(--ink-dim); }

      /* ---------- at a glance ---------- */
      .pw-glance { list-style: none; padding: 0; margin: 0; }
      .pw-glance > li { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 12px; padding: 12px 0; border-top: 1px solid var(--hair); }
      .pw-gn { width: 28px; height: 28px; border-radius: 14px; background: var(--ink); color: #fff; font: 700 12px/28px var(--mono); text-align: center; }
      .pw-gs { font: 700 12px/1.4 var(--mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--pw-ink-3); margin: 0 0 4px; }
      .pw-gt { font-weight: 600; margin: 0; }
      .pw-gt a { color: var(--ink); text-decoration: none; }
      .pw-gt a:hover { text-decoration: underline; }
      .pw-gf { margin-top: 8px; font-size: 14px; }
      .pw-gf > a { display: inline-flex; gap: 4px; align-items: center; color: var(--pw-green-ink); font-weight: 700; text-decoration: none; }
      .pw-gf > a:hover { text-decoration: underline; }
      .pw-chips { display: flex; flex-wrap: wrap; gap: 4px 8px; margin-top: 8px; }
      .pw-gc { font: 600 12px/1.4 var(--mono); background: var(--bg-3); border: 1px solid var(--hair); padding: 4px 8px; border-radius: 999px; color: var(--ink); }

      /* ---------- steps ---------- */
      .pw-step { background: var(--bg-2); border: 1px solid var(--hair); border-radius: 16px; padding: 24px; margin: 16px 0; scroll-margin-top: 64px; }
      .pw-sk { display: block; font: 700 12px/1.4 var(--mono); letter-spacing: 0.14em; text-transform: uppercase; color: var(--pw-ink-3); margin: 0 0 8px; }
      .pw-step h3, .pw-case h3 { font-size: 20px; line-height: 1.3; letter-spacing: -0.01em; margin: 0 0 12px; }
      .pw-nbs { margin: 0 0 12px; }
      .pw-nbs b { font-weight: 800; }
      .pw-snote { font-size: 14px; line-height: 1.55; color: var(--ink-dim); background: var(--bg-3); border-radius: 8px; padding: 12px 16px; }
      .pw-calclinks { font-size: 14px; color: var(--ink-dim); margin: 12px 0 0; }
      .pw-endline { font-size: 14px; color: var(--ink-dim); border-top: 1px dashed var(--hair-strong); padding-top: 12px; margin: 16px 0 0; }

      /* ---------- tables: orders, forks, disagreements; stacked on phones ---------- */
      .pw-tw { margin: 12px 0; }
      .pw-tab { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.5; }
      .pw-tab thead th { text-align: left; font: 700 12px/1.4 var(--mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--pw-ink-3); padding: 8px 12px; border-bottom: 1px solid var(--hair-strong); }
      .pw-tab tbody th, .pw-tab td { text-align: left; vertical-align: top; padding: 12px; border-bottom: 1px solid var(--hair); }
      .pw-tab tbody th { font-weight: 700; }
      @media (min-width: 640px) { .pw-tab tbody th { width: 30%; } }
      .pw-tab tbody tr:last-child th, .pw-tab tbody tr:last-child td { border-bottom: 0; }
      .pw-ctx { display: block; margin-top: 4px; font-weight: 500; font-size: 12px; line-height: 1.4; }
      @media (max-width: 639px) {
        .pw-tab thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
        .pw-tab, .pw-tab tbody, .pw-tab tr, .pw-tab tbody th, .pw-tab td { display: block; width: auto; }
        .pw-tab tr { padding: 12px 0; border-bottom: 1px solid var(--hair); }
        .pw-tab tbody tr:last-child { border-bottom: 0; }
        .pw-tab tbody th, .pw-tab td { padding: 4px 0; border: 0; }
        .pw-tab td[data-l]::before { content: attr(data-l); display: block; font: 700 12px/1.4 var(--mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--pw-ink-3); margin: 8px 0 4px; }
      }
      .pw-chip { display: inline-flex; align-items: center; gap: 4px; font: 700 12px/1.4 var(--mono); letter-spacing: 0.04em; text-transform: uppercase; padding: 2px 8px; border-radius: 6px; margin: 0 8px 4px 0; vertical-align: 1px; }
      .pw-chip .pw-ic { width: 12px; height: 12px; stroke-width: 2.4; }
      .pw-chip.ok { background: var(--green-soft); color: var(--pw-green-ink); }
      .pw-chip.avoid { background: var(--red-soft); color: var(--pw-red-ink); }
      .pw-chip.conflict, .pw-chip.pending { background: var(--gold-soft); color: var(--pw-gold-ink); }
      .pw-onote { font-size: 14px; color: var(--ink-dim); margin: 4px 0 0; }
      .pw-cites { list-style: none; display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 8px 0 0; padding: 0; font-size: 12px; line-height: 1.6; }
      .pw .pw-cite { display: inline; font: 600 12px/1.6 var(--mono); color: var(--pw-link); text-decoration: none; }
      .pw .pw-cite:hover { text-decoration: underline; }
      .pw-cite span { color: var(--ink-dim); font-weight: 500; }
      .pw-cite .pw-ic { display: inline-block; width: 12px; height: 12px; margin-left: 4px; vertical-align: -1px; }
      .pw-cite-plain { color: var(--ink-dim); }

      /* ---------- forks ---------- */
      .pw-fork { border-left: 3px solid var(--green); background: var(--bg-3); border-radius: 0 12px 12px 0; padding: 16px; margin: 16px 0; scroll-margin-top: 64px; }
      .pw-fork h3 { font-size: 17px; line-height: 1.35; margin: 0 0 4px; }
      .pw-fk { display: inline-flex; gap: 4px; align-items: center; font: 700 12px/1.4 var(--mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--pw-green-ink); margin-right: 8px; vertical-align: 1px; }
      .pw-fork .pw-tab thead th, .pw-fork .pw-tab td[data-l]::before { color: var(--ink-dim); }
      .pw-fork .pw-tab tbody th, .pw-fork .pw-tab td { border-bottom-color: var(--hair-strong); }
      @media (min-width: 640px) { .pw-forktab tbody th { width: 24%; } }
      .pw-forktab td a { color: var(--ink); text-decoration: underline; text-decoration-color: var(--pw-control); text-underline-offset: 3px; }
      .pw-forktab td a:hover { text-decoration-color: var(--ink); }
      .pw-ddx { font-size: 12px; line-height: 1.5; color: var(--ink-dim); margin: 4px 0 0; }
      .pw-olist { list-style: none; padding: 0; margin: 8px 0 0; }
      .pw-olist li { padding: 8px 0; border-top: 1px dashed var(--hair-strong); }
      .pw-findex { list-style: none; padding: 0; margin: 0; }
      .pw-findex > li { padding: 12px 0; border-top: 1px solid var(--hair); }
      .pw-findex h3 { font-size: 17px; margin: 0; }
      .pw-findex h3 a { color: var(--ink); text-decoration: none; }
      .pw-findex h3 a:hover { text-decoration: underline; }
      .pw-ends { list-style: none; padding: 0; margin: 0; }
      .pw-ends > li { background: var(--bg-2); border: 1px solid var(--hair); border-radius: 12px; padding: 16px; margin: 0 0 12px; scroll-margin-top: 64px; }
      .pw-ends p { margin: 0; }
      .pw-from { font-size: 14px; color: var(--ink-dim); margin-top: 8px; }

      /* ---------- quick check ---------- */
      .pw-quiz { border: 1px dashed var(--hair-strong); border-radius: 12px; padding: 16px; margin: 16px 0 0; }
      .pw-qk { font: 700 12px/1.4 var(--mono); letter-spacing: 0.14em; text-transform: uppercase; color: var(--pw-link); margin: 0; }
      .pw-qa { font-weight: 700; margin: 4px 0 12px; }
      .pw-opts { display: grid; gap: 8px; }
      .pw-opt { display: flex; gap: 12px; align-items: flex-start; width: 100%; min-height: 44px; text-align: left; font: 500 14px/1.45 var(--sans); padding: 12px 16px; border-radius: 12px; border: 1px solid var(--pw-control); background: var(--bg); color: var(--ink); cursor: pointer; transition: background-color 140ms var(--pw-ease), border-color 140ms var(--pw-ease); }
      .pw-opt:hover { background: var(--bg-3); }
      .pw-opt[aria-disabled='true'] { cursor: default; }
      .pw-opt[aria-disabled='true']:hover { background: var(--bg); }
      .pw-opt-l { flex: 0 0 16px; display: inline-flex; justify-content: center; font: 700 12px/20px var(--mono); color: var(--ink-dim); }
      .pw-opt-l .pw-ic { margin-top: 2px; }
      .pw-opt.is-right { border-color: var(--green); background: var(--green-soft); }
      .pw-opt.is-right .pw-opt-l { color: var(--pw-green-ink); }
      .pw-opt.is-wrong { border-color: var(--pw-red-ink); background: var(--red-soft); }
      .pw-opt.is-wrong .pw-opt-l { color: var(--pw-red-ink); }
      .pw-opt.is-right:hover { background: var(--green-soft); }
      .pw-opt.is-wrong:hover { background: var(--red-soft); }
      .pw-why { font-size: 14px; line-height: 1.6; color: var(--ink-dim); margin-top: 12px; animation: pw-rise 140ms var(--pw-ease) both; }
      .pw-why p { margin: 0; }
      .pw-why b { color: var(--ink); }
      @keyframes pw-rise { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

      /* ---------- checklist ---------- */
      .pw-check { list-style: none; padding: 0; margin: 0; border: 1px solid var(--hair-strong); border-radius: 16px; background: var(--bg-2); }
      .pw-check li { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 12px; padding: 12px 16px; border-top: 1px solid var(--hair); }
      .pw-check li:first-child { border-top: 0; }
      .pw-check .pw-ic { width: 20px; height: 20px; color: var(--pw-control); margin-top: 2px; }
      .pw-check p { margin: 0; }

      /* ---------- calculators ---------- */
      .pw-calcs { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); }
      @media (min-width: 640px) { .pw-calcs { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      .pw-calc { background: var(--bg-2); border: 1px solid var(--hair-strong); border-radius: 16px; padding: 16px; scroll-margin-top: 64px; min-width: 0; }
      .pw-calc h3 { font: 700 12px/1.4 var(--mono); letter-spacing: 0.12em; text-transform: uppercase; color: var(--pw-green-ink); margin: 0 0 12px; }
      .pw-fields { display: grid; gap: 8px; grid-template-columns: minmax(0, 1fr); }
      .pw-field { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-width: 0; }
      .pw-field label { flex: 1 1 auto; min-width: 0; font-size: 14px; color: var(--ink-dim); line-height: 1.35; overflow-wrap: anywhere; }
      .pw-unit { color: var(--pw-ink-3); }
      .pw-field input, .pw-field select { min-height: 44px; font: 600 17px var(--mono); padding: 8px 12px; border: 1px solid var(--pw-control); border-radius: 8px; background: var(--bg); color: var(--ink); }
      .pw-field input { width: 96px; flex: 0 0 auto; text-align: right; font-variant-numeric: tabular-nums; }
      .pw-field select { min-width: 0; font-family: var(--sans); font-weight: 500; }
      .pw-field-wide { flex-direction: column; align-items: stretch; gap: 4px; }
      .pw-field-wide select { max-width: none; width: 100%; }
      .pw-out { margin-top: 12px; border-top: 1px solid var(--hair); padding-top: 12px; display: grid; gap: 8px; }
      .pw-out-row { display: grid; gap: 2px; }
      .pw-out-l { font: 700 12px/1.4 var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--pw-ink-3); }
      .pw-out-v { font: 800 24px/1.2 var(--mono); font-variant-numeric: tabular-nums; color: var(--ink); }
      .pw-out-v small { font: 600 14px var(--sans); color: var(--ink-dim); }
      .pw-out-b { font-size: 14px; line-height: 1.45; color: var(--ink); }
      .pw-out-warn { font-size: 14px; color: var(--pw-gold-ink); margin: 0; }
      .pw-formula { margin-top: 12px; font: 500 12px/1.6 var(--mono); color: var(--ink-dim); background: var(--bg-3); border-radius: 8px; padding: 8px 12px; overflow-wrap: anywhere; }
      .pw-formula p { margin: 0; }
      .pw-formula span { color: var(--ink); font-weight: 700; }
      .pw-bands { margin: 12px 0 0; padding-left: 16px; font-size: 12px; line-height: 1.5; color: var(--ink-dim); }
      .pw-calc-note { font-size: 12px; line-height: 1.55; color: var(--ink-dim); margin: 12px 0 0; }
      .pw-usedby { font-size: 12px; line-height: 1.5; color: var(--ink-dim); margin: 8px 0 0; }

      /* ---------- rounds, details lists, traps ---------- */
      .pw-present { background: var(--bg-2); border: 1px solid var(--hair-strong); border-radius: 16px; padding: 16px 24px; }
      .pw-present p:last-child, .pw-present ol:last-child { margin-bottom: 0; }
      .pw-pk { font: 700 12px/1.4 var(--mono); letter-spacing: 0.12em; text-transform: uppercase; color: var(--pw-ink-3); margin: 8px 0 4px; }
      .pw-present ol { padding-left: 24px; margin: 4px 0 0; }
      .pw-present li { margin: 8px 0; }
      .pw-dets details { border-top: 1px solid var(--hair); }
      .pw-dets details:last-child { border-bottom: 1px solid var(--hair); }
      .pw-dets summary { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 44px; padding: 12px 0; font-weight: 700; cursor: pointer; list-style: none; }
      .pw-dets summary::-webkit-details-marker { display: none; }
      .pw-dets summary .pw-ic { transition: transform 140ms var(--pw-ease); color: var(--ink-dim); }
      .pw-dets details[open] summary .pw-ic { transform: rotate(180deg); }
      .pw-dets details p { color: var(--ink-dim); margin: 0 0 16px; }
      .pw-traps { list-style: none; padding: 0; margin: 0; }
      .pw-traps li { display: grid; grid-template-columns: 16px minmax(0, 1fr); gap: 12px; padding: 12px 0; border-top: 1px solid var(--hair); }
      .pw-traps .pw-ic { color: var(--pw-gold-ink); margin-top: 4px; }
      .pw-traps p { margin: 0; }

      /* ---------- practice patients ---------- */
      .pw-case { background: var(--bg-2); border: 1px solid var(--hair); border-radius: 16px; padding: 16px 24px 24px; margin: 16px 0; }
      .pw-vig { color: var(--ink-dim); }
      .pw-case .pw-dets { margin: 0 0 16px; }
      .pw-case .pw-btn-quiet .pw-ic { width: 16px; height: 16px; }

      /* ---------- sources, related, close ---------- */
      .pw-srcs { padding-left: 24px; margin: 0; font-size: 14px; line-height: 1.55; }
      .pw-srcs li { margin: 8px 0; }
      .pw-rels { display: flex; flex-wrap: wrap; gap: 8px; }
      .pw .pw-rels a { display: inline-flex; align-items: center; min-height: 44px; border: 1px solid var(--hair-strong); border-radius: 999px; padding: 8px 16px; font-weight: 600; font-size: 14px; color: var(--ink); background: var(--bg-2); text-decoration: none; }
      .pw .pw-rels a:hover { background: var(--bg-3); }
      .pw-also { display: grid; gap: 8px; grid-template-columns: minmax(0, 1fr); margin-top: 16px; }
      @media (min-width: 640px) { .pw-also { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      .pw .pw-also a { display: block; border: 1px solid var(--hair); border-radius: 12px; padding: 12px 16px; background: var(--bg-2); color: var(--ink); text-decoration: none; }
      .pw .pw-also a:hover { border-color: var(--hair-strong); }
      .pw-also b { display: block; }
      .pw-also .pw-sk { margin: 0 0 4px; }
      .pw-disc { font-size: 14px; color: var(--pw-ink-3); border-top: 1px solid var(--hair); margin-top: 48px; padding-top: 16px; }

      /* ---------- contents rail ---------- */
      .pw-toc ol { list-style: none; padding: 0; margin: 0 0 24px; border-left: 1px solid var(--hair); }
      .pw-toc li a { display: block; padding: 4px 12px; margin-left: -1px; border-left: 2px solid transparent; font-size: 14px; line-height: 1.4; color: var(--ink-dim); text-decoration: none; }
      .pw-toc li a:hover { color: var(--ink); }
      .pw-toc li a[aria-current='true'] { color: var(--ink); font-weight: 600; border-left-color: var(--green); }
      .pw-mini { background: var(--pw-band); color: #fff; border-radius: 16px; padding: 16px; }
      .pw-mini b { display: block; font-size: 14px; }
      .pw-mini p { color: var(--pw-on-band-2); font-size: 14px; line-height: 1.45; margin: 4px 0 12px; }

      /* ---------- mobile sticky ask: earned, one promise, never on desktop ---------- */
      .pw-sticky { position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--pw-band); color: #fff; padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)); opacity: 0; transform: translateY(8px); visibility: hidden; transition: opacity 240ms var(--pw-ease), transform 240ms var(--pw-ease), visibility 0s linear 240ms; }
      .pw-sticky.show { opacity: 1; transform: none; visibility: visible; transition-delay: 0s; }
      .pw-sticky b { display: block; font-size: 14px; line-height: 1.3; }
      .pw-sticky span { display: block; font-size: 12px; color: var(--pw-on-band-2); }
      .pw-sticky .pw-btn-act { white-space: nowrap; }
      @media (min-width: 1024px) { .pw-sticky { display: none; } }

      /* ---------- hub ---------- */
      .pw-hub { max-width: 860px; }
      .pw-search { margin: 0 0 16px; }
      .pw-search label { display: block; font: 700 12px/1.4 var(--mono); letter-spacing: 0.12em; text-transform: uppercase; color: var(--pw-ink-3); margin: 0 0 8px; }
      .pw-sbox { position: relative; display: flex; align-items: center; }
      .pw-sbox .pw-ic { position: absolute; left: 16px; width: 20px; height: 20px; color: var(--ink-dim); pointer-events: none; }
      .pw-sbox input { width: 100%; min-height: 52px; font: 500 17px var(--sans); padding: 12px 48px; border: 1px solid var(--pw-control); border-radius: 12px; background: var(--bg-2); color: var(--ink); -webkit-appearance: none; appearance: none; }
      .pw-sbox kbd { position: absolute; right: 16px; font: 600 12px var(--mono); color: var(--ink-dim); border: 1px solid var(--hair-strong); border-radius: 6px; padding: 2px 8px; }
      @media (hover: none) { .pw-sbox kbd { display: none; } }
      .pw-count { font: 600 12px/1.4 var(--mono); color: var(--pw-ink-3); margin: 0 0 8px; }
      .pw-group h2 { font-size: 24px; line-height: 1.25; letter-spacing: -0.012em; margin: 32px 0 12px; }
      .pw-cards { display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr); list-style: none; padding: 0; margin: 0; }
      @media (min-width: 640px) { .pw-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      .pw-card { position: relative; background: var(--bg-2); border: 1px solid var(--hair-strong); border-radius: 16px; padding: 16px; transition: border-color 140ms var(--pw-ease); }
      .pw-card:hover { border-color: var(--pw-control); }
      .pw-card:focus-within { outline: 2px solid var(--blue); outline-offset: 2px; }
      .pw-card h3 { font-size: 17px; line-height: 1.3; margin: 0 0 8px; }
      .pw-card h3 a { color: var(--ink); text-decoration: none; }
      .pw-card h3 a::after { content: ''; position: absolute; inset: 0; border-radius: 16px; }
      .pw-card h3 a:focus-visible { outline: none; }
      .pw-card dl { margin: 0; font-size: 14px; line-height: 1.5; }
      .pw-card dt { font: 700 12px/1.4 var(--mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--pw-ink-3); margin-top: 8px; }
      .pw-card dd { margin: 0; color: var(--ink-dim); }
      .pw-card-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font: 600 12px/1.4 var(--mono); color: var(--pw-ink-3); margin: 12px 0 0; }
      .pw-tag { color: var(--pw-gold-ink); }
      .pw-empty { border: 1px dashed var(--hair-strong); border-radius: 16px; padding: 24px; margin: 16px 0; }
      .pw-empty h2 { font-size: 20px; margin: 0 0 8px; }
      .pw-empty button { min-height: 44px; padding: 8px 16px; border-radius: 12px; border: 1px solid var(--pw-control); background: var(--bg-2); color: var(--ink); font: 700 14px var(--sans); cursor: pointer; }
      .pw-rules { padding-left: 24px; margin: 0; }
      .pw-rules li { margin: 0 0 12px; }

      @media (max-width: 639px) {
        .pw .pw-h2 { font-size: 24px; margin-top: 40px; }
        .pw-dek { font-size: 17px; }
        .pw-step { padding: 16px; }
        .pw-step h3, .pw-case h3 { font-size: 17px; }
        .pw-short { padding: 16px; }
        .pw-band { padding: 16px; }
        .pw-case { padding: 16px; }
        .pw-present { padding: 16px; }
      }
    `}</style>
  );
}
