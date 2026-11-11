// The /pro look (decision 0051's approved board), shared by /pro, /pro/done and
// /earnings. Every class is .pro- prefixed (components/app/README.md rule 3).
export default function ProStyles() {
  return (
    <style jsx global>{`
        .pro-wrap { max-width: 1200px; margin: 0 auto; padding: 40px 16px 32px; /* the .ax-page gutters, so the column sits under the wordmark */ display: flex; flex-wrap: wrap; align-items: flex-start; gap: 48px; }
        .pro-pitch { flex: 1 1 420px; min-width: 0; display: flex; flex-direction: column; gap: 24px; padding-top: 8px; }
        .pro-eyebrow { font: 600 12px/1 var(--f-mono); letter-spacing: .18em; color: var(--key); }
        .pro-pitch h1 { margin: 0; font-size: 46px; line-height: 1.04; font-weight: 700; letter-spacing: -1px; color: var(--ink); text-wrap: balance; }
        .pro-lede { margin: 0; max-width: 46ch; font-size: 18px; line-height: 1.55; color: var(--ink-2); }
        .pro-feats { list-style: none; margin: 0; padding: 0; max-width: 520px; }
        .pro-feats li { display: flex; gap: 14px; padding: 14px 0; border-top: 1px solid var(--line); color: var(--wards); }
        .pro-feats li > svg { flex: none; }
        .pro-feats li > div { display: flex; flex-direction: column; gap: 4px; }
        .pro-feat-t { font: 600 13px/1.3 var(--f-mono); letter-spacing: .12em; color: var(--ink); }
        .pro-feat-d { font-size: 15px; line-height: 1.45; color: var(--ink-2); }

        /* The Pro video (components/ProVideo.tsx) beside the list it shows: side by side
           once the column fits 288 + 24 + 272, else stacked with the video centered.
           Its own stage is dark, so the frame is a dark island in both themes, the same
           elevation as .pro-card. The 9:16 box is reserved before the poster loads. */
        .pro-show { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 24px; }
        .pro-show > .pro-feats { flex: 1 1 272px; min-width: 0; max-width: none; }
        .pro-vid { flex: none; width: 288px; max-width: 100%; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px 12px; align-items: center; }
        .pro-vid-frame { grid-column: 1 / -1; position: relative; aspect-ratio: 9 / 16; border-radius: var(--r-lg); overflow: hidden; isolation: isolate;
          background: var(--st-bg); box-shadow: 0 40px 80px -24px var(--st-shadow); }
        .pro-vid-frame::after { content: ""; position: absolute; inset: 0; z-index: 2; border-radius: inherit; box-shadow: inset 0 0 0 1px var(--st-line-2); pointer-events: none; }
        .pro-vid-v { position: absolute; inset: 0; display: block; width: 100%; height: 100%; max-width: none; object-fit: cover; border-radius: inherit; background: var(--st-bg); }
        .pro-vid-play { position: absolute; left: 50%; top: 50%; z-index: 1; width: 72px; height: 72px; margin: -36px 0 0 -36px; padding: 0 0 0 4px;
          display: grid; place-items: center; border: 0; border-radius: 50%; cursor: pointer; color: var(--st-screen); background: var(--st-white);
          box-shadow: 0 0 0 8px var(--st-line), 0 16px 40px -8px var(--st-shadow); transition: background-color var(--d-micro) var(--ease); }
        .pro-vid-play:hover { background: var(--st-ink); }
        .pro-vid-play:focus-visible { border-radius: 50%; outline: 2px solid var(--st-blue); outline-offset: 4px; }
        .pro-vid-play.is-init { display: none; }
        .pro-vid-pp { grid-column: 2; grid-row: 2; display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 50%;
          cursor: pointer; color: var(--ink); background: var(--card); box-shadow: inset 0 0 0 1px var(--line-2); transition: box-shadow var(--d-micro) var(--ease); }
        .pro-vid-pp:hover { box-shadow: inset 0 0 0 1px var(--ctl); }
        .pro-vid-pp:focus-visible { border-radius: 50%; }
        .pro-vid-cap { grid-column: 1; grid-row: 2; min-height: 44px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
        .pro-vid-k { font: 600 12px/1.3 var(--f-mono); letter-spacing: .14em; color: var(--ink-3); }
        .pro-vid-l { font-size: 15px; line-height: 1.45; color: var(--ink-2); text-wrap: balance; }
        /* Before hydration, Reduced Motion visitors already see the Play button. */
        @media (prefers-reduced-motion: reduce) {
          .pro-vid-play.is-init { display: grid; }
        }

        .pro-card { flex: 1 1 400px; max-width: 480px; min-width: 0; display: flex; flex-direction: column; gap: 20px; padding: 28px;
          border-radius: 20px; color: var(--st-ink);
          background: radial-gradient(90% 60% at 100% 0%, var(--st-card-glow), transparent 60%), linear-gradient(180deg, var(--st-card), var(--st-card-2));
          box-shadow: inset 0 0 0 1px var(--st-line-2), 0 40px 80px -24px var(--st-shadow); }
        .pro-card h2 { margin: 0; font-size: 21px; line-height: 1.25; font-weight: 600; color: var(--st-white); }
        .pro-card .pro-h2-lg { font-size: 28px; font-weight: 700; }
        .pro-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .pro-steps li { display: flex; flex-direction: column; gap: 8px; }
        .pro-steps .bar { height: 3px; border-radius: 2px; background: var(--st-line-2); }
        .pro-steps .lbl { font: 500 11px/1 var(--f-mono); letter-spacing: .14em; color: var(--st-ctl); }
        .pro-steps li.done .bar { background: var(--st-green); }
        .pro-steps li.now .bar { background: var(--st-blue); }
        .pro-steps li.done .lbl, .pro-steps li.now .lbl { color: var(--st-ink); }
        .pro-stack { display: flex; flex-direction: column; gap: 12px; }
        .pro-muted { margin: 0; font-size: 15px; line-height: 1.55; color: var(--st-ink-2); }
        .pro-fine { margin: 0; font-size: 13px; line-height: 1.55; color: var(--st-ink-3); }
        .pro-fine a, .pro-link { color: var(--st-blue); }
        .pro-link { background: none; border: 0; padding: 0; font: inherit; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
        .pro-ok { margin: 0; font-size: 13px; line-height: 1.5; color: var(--st-green); }
        .pro-bad { margin: 0; font-size: 13px; line-height: 1.5; color: var(--st-red); }
        .pro-mono { font-family: var(--f-mono); color: var(--st-ink); }

        .pro-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; height: 48px; padding: 0 18px; border-radius: 12px;
          font: 600 15px/1 var(--f-sans); cursor: pointer; border: 0; }
        .pro-btn:disabled { opacity: .55; cursor: default; }
        .pro-apple { background: var(--st-white); color: var(--st-screen); }
        .pro-ghost { background: transparent; color: var(--st-ink); box-shadow: inset 0 0 0 1px var(--st-line-2); }
        .pro-ghost:hover:not(:disabled) { background: var(--st-line); }
        .pro-primary { height: 52px; margin-top: 4px; background: var(--st-act); color: var(--st-on-act); font-size: 16px; box-shadow: 0 12px 30px -8px var(--st-glow-a); }
        .pro-primary:hover:not(:disabled) { background: var(--st-act-hov); }
        .pro-auto { align-self: flex-start; }

        .pro-found { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; font-size: 14px; line-height: 1.45;
          color: var(--st-ink-2); background: var(--st-ok-tint); box-shadow: inset 0 0 0 1px var(--ring-green); }
        .pro-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--st-green); }

        .pro-plan { display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 14px; border: 0; text-align: left; cursor: pointer;
          color: var(--st-ink); background: var(--st-card-2); box-shadow: inset 0 0 0 1px var(--st-line-2); font: inherit; }
        .pro-plan.on { background: var(--focus-ring); box-shadow: inset 0 0 0 1px var(--st-blue); }
        .pro-radio { flex: none; width: 20px; height: 20px; border-radius: 50%; box-shadow: inset 0 0 0 2px var(--st-ctl); display: inline-flex; align-items: center; justify-content: center; }
        .pro-radio span { width: 10px; height: 10px; border-radius: 50%; }
        .pro-plan.on .pro-radio { box-shadow: inset 0 0 0 2px var(--st-blue); }
        .pro-plan.on .pro-radio span { background: var(--st-blue); }
        .pro-plan-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .pro-plan-name { font-size: 16px; font-weight: 600; }
        .pro-plan-sub { font: 500 11.5px/1.2 var(--f-mono); letter-spacing: .06em; color: var(--st-ink-3); }
        .pro-plan-price { font: 500 18px/1 var(--f-mono); color: var(--st-white); font-variant-numeric: tabular-nums; }

        .pro-code { display: flex; gap: 8px; align-items: flex-end; margin: 0; }
        .pro-code-field { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
        .pro-code-field label { font-size: 13px; color: var(--st-ink-2); }
        .pro-code-field input { height: 44px; padding: 0 14px; border-radius: 11px; border: 0; outline: none; color: var(--st-ink);
          background: var(--st-bg); box-shadow: inset 0 0 0 1px var(--st-line-2); font: 500 15px/1 var(--f-mono); letter-spacing: .06em; }
        .pro-code-field input:focus { box-shadow: inset 0 0 0 1px var(--st-blue), 0 0 0 3px var(--focus-ring); }
        .pro-apply { height: 44px; font-size: 14px; }

        .pro-done { align-items: flex-start; }
        .pro-check { width: 56px; height: 56px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
          color: var(--st-green); background: var(--st-ok-tint); box-shadow: inset 0 0 0 1px var(--glow-green), 0 0 30px var(--ring-green); }
        .pro-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
        .pro-who { padding-top: 12px; border-top: 1px solid var(--st-line); overflow-wrap: anywhere; }
        .pro-foot { max-width: 1200px; margin: 0 auto; padding: 16px 16px 40px; font-size: 13px; color: var(--ink-3); }

        /* /pro only: headline, then the checkout card, then the video and features, so the
           sign-in sits right under the headline on a phone. From 960px the card moves to
           its own column beside both, as before. The DOM is in the phone's order. */
        .pro-buy { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "card" "show"; gap: 32px; }
        .pro-buy > .pro-head { grid-area: head; }
        .pro-buy > .pro-show { grid-area: show; }
        .pro-buy > .pro-card { grid-area: card; width: 100%; }
        @media (min-width: 960px) {
          .pro-buy { grid-template-columns: minmax(0, 1fr) minmax(0, 480px); grid-template-areas: "head card" "show card"; column-gap: 48px; row-gap: 24px; align-items: start; }
        }

        @media (min-width: 760px) {
          .pro-wrap, .pro-foot { padding-left: 40px; padding-right: 40px; }
        }
        @media (max-width: 600px) {
          .pro-wrap { padding-top: 24px; gap: 32px; }
          .pro-pitch h1 { font-size: 38px; }
          .pro-card { padding: 20px; }
        }
    `}</style>
  );
}
