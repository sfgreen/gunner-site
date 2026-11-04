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
        .pro-feats li > div { display: flex; flex-direction: column; gap: 4px; }
        .pro-feat-t { font: 600 13px/1.3 var(--f-mono); letter-spacing: .12em; color: var(--ink); }
        .pro-feat-d { font-size: 15px; line-height: 1.45; color: var(--ink-2); }

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
