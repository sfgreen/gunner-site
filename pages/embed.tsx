// Iframe-embeddable readiness card. A blog or webpage drops in an <iframe> pointing
// here with the same ?e= payload the /readiness share link uses; this renders a
// compact, self-contained version of the student's own result (no site nav, no
// footer, no global chrome) that also links back to the full predictor. Framing is
// allowed for any origin via the frame-ancestors header scoped to /embed in
// next.config.js. Server-rendered so embedders and crawlers that hit a bare /embed
// never see a blank or a 500.
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import {
  PASS, PASS_COMFORT, MEAN,
  buildCardCore, computeReadiness, decodeShare,
  percentile, ordinal, shortTier, clamp, SHARE_BASE,
  type CardCore,
} from '../lib/readiness';

// The embed link back to the full predictor keeps the reader's own inputs so the
// card is a clickthrough, not a dead end. Built by swapping /readiness -> /embed is
// unnecessary here because we already hold the raw ?e=; we rebuild the /readiness URL.
const READINESS = SHARE_BASE; // https://stepgunner.com/readiness

type Pill = { text: string; cls: 'ok' | 'warn' | 'low' } | null;

type EmbedProps = {
  core: CardCore | null;
  pill: Pill;
  href: string; // clickthrough target (readiness with the same ?e=, or the bare predictor)
};

// ---- small terminal star + geometry, ported 1:1 from the OG renderer so the
// achieved-score marker matches the shared image. ----
function starPath(cx: number, cy: number, r: number) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.44 : r;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    d += `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`;
  }
  return d + 'Z';
}

// Projected-range band chart: axis 200..280, the gold projection band, the center
// marker, and the dashed 218 pass line. For an actual score it swaps the band for a
// prominent marker (gold star on a pass, dim diamond on a fail) over a faint
// practice-range band. Decorative: every number here is also in the text above.
function Chart({ core }: { core: CardCore }) {
  const AX_L = 12;
  const AX_R = 468;
  const AY = 64;
  const sx = (s: number) => AX_L + ((clamp(s, 200, 280) - 200) / 80) * (AX_R - AX_L);
  const shapes: JSX.Element[] = [];
  let k = 0;
  const key = () => `c${k++}`;
  const fail = core.fail;
  const actual = core.actual;

  shapes.push(<line key={key()} x1={AX_L} y1={AY} x2={AX_R} y2={AY} className="em-axis" />);

  if (actual == null && core.proj) {
    const { low, high, center } = core.proj;
    shapes.push(<rect key={key()} x={sx(low)} y={34} width={Math.max(4, sx(high) - sx(low))} height={24} rx={6} className="em-band" />);
    shapes.push(<line key={key()} x1={sx(center)} y1={24} x2={sx(center)} y2={AY} className="em-mid" />);
    shapes.push(<circle key={key()} cx={sx(center)} cy={46} r={4.5} className="em-cdot" />);
    shapes.push(<text key={key()} x={sx(center)} y={18} textAnchor="middle" className="em-val">{center}</text>);
  }

  if (actual != null) {
    if (core.proj) {
      shapes.push(<rect key={key()} x={sx(core.proj.low)} y={40} width={Math.max(4, sx(core.proj.high) - sx(core.proj.low))} height={12} rx={4} className="em-ghost" />);
    }
    const ax = sx(actual);
    const mc = fail ? 'em-fail' : 'em-hit';
    shapes.push(<line key={key()} x1={ax} y1={24} x2={ax} y2={AY} className={`em-mark ${mc}`} />);
    if (fail) {
      shapes.push(<path key={key()} d={`M${ax},40 L${ax + 7},47 L${ax},54 L${ax - 7},47 Z`} className={`em-diamond ${mc}`} />);
    } else {
      shapes.push(<path key={key()} d={starPath(ax, 46, 7.5)} className={`em-star ${mc}`} />);
    }
    shapes.push(<text key={key()} x={ax} y={18} textAnchor="middle" className={`em-val ${mc}`}>{actual}</text>);
  }

  const px = sx(PASS);
  shapes.push(<line key={key()} x1={px} y1={30} x2={px} y2={AY} className="em-pass" />);
  shapes.push(<text key={key()} x={px} y={26} textAnchor="middle" className="em-passl">PASS {PASS}</text>);

  [200, 220, 240, 260, 280].forEach((t) => {
    shapes.push(<text key={key()} x={sx(t)} y={84} textAnchor="middle" className="em-tick">{t}</text>);
  });

  return <svg viewBox="0 0 480 96" aria-hidden="true">{shapes}</svg>;
}

// Bare 200..280 scale with the 218 pass line and the 250 US average, no band. Used by
// the no-payload fallback: honest (no fabricated score) but on brand.
function ScaleChart() {
  const AX_L = 12;
  const AX_R = 468;
  const AY = 64;
  const sx = (s: number) => AX_L + ((clamp(s, 200, 280) - 200) / 80) * (AX_R - AX_L);
  const px = sx(PASS);
  const mx = sx(MEAN);
  return (
    <svg viewBox="0 0 480 96" aria-hidden="true">
      <line x1={AX_L} y1={AY} x2={AX_R} y2={AY} className="em-axis" />
      <line x1={mx} y1={36} x2={mx} y2={AY} className="em-meanl" />
      <text x={mx} y={30} textAnchor="middle" className="em-meant">US AVG {MEAN}</text>
      <line x1={px} y1={30} x2={px} y2={AY} className="em-pass" />
      <text x={px} y={26} textAnchor="middle" className="em-passl">PASS {PASS}</text>
      {[200, 220, 240, 260, 280].map((t) => (
        <text key={t} x={sx(t)} y={84} textAnchor="middle" className="em-tick">{t}</text>
      ))}
    </svg>
  );
}

// SF Symbols-style strokes, inline: the widget has no AppShell, so no sprite.
const IcCheck = () => <svg className="em-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg>;
const IcOut = () => <svg className="em-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16L16 8M9 8h7v7" /></svg>;

type ChipView = { label: string; value: string; kind: 'nbme' | 'uwsa' | 'gold' | 'more' };

function chipViews(core: CardCore): ChipView[] {
  const chips: ChipView[] = core.parsed.map((p) => ({
    label: p.form || 'Practice',
    value: String(p.s),
    kind: p.form.startsWith('UWSA') ? 'uwsa' : 'nbme',
  }));
  if (core.actual != null) {
    chips.push({ label: 'Actual', value: String(core.actual), kind: 'gold' });
  }
  const MAX = 8;
  if (chips.length > MAX) {
    const head = chips.slice(0, MAX - 1);
    head.push({ label: '', value: `+${chips.length - (MAX - 1)}`, kind: 'more' });
    return head;
  }
  return chips;
}

// ---- result card ----
function ResultCard({ core, pill, href }: { core: CardCore; pill: Pill; href: string }) {
  const projected = core.actual == null;
  const proj = core.proj;
  const n = core.parsed.length;
  const pctText = `${ordinal(core.pct)} percentile`;

  // Hero: white center number + dim range for a projection; the actual score for a
  // reported result. Muted for a below-pass (fail) card.
  let heroBig: string;
  let heroSmall = '';
  if (projected && proj) {
    heroBig = String(proj.center);
    heroSmall = `${proj.low} to ${proj.high}`;
  } else {
    heroBig = String(core.actual);
    heroSmall = core.fromScore != null && core.fromScore !== core.actual ? `from ${core.fromScore}` : '';
  }

  const subline = projected
    ? `about the ${pctText} vs US first-takers · ${n} practice test${n === 1 ? '' : 's'}`
    : core.fromScore != null && core.fromScore !== core.actual
      ? `${pctText} vs US first-takers · from ${core.fromScore}`
      : `${pctText} vs US first-takers`;

  const tierLabel = projected && proj
    ? `Projected range · ${shortTier(proj.tier)}`
    : core.fail
      ? `Below the ${PASS} pass line`
      : `Your score vs the ${PASS} pass line`;

  const chips = chipViews(core);
  const showChips = core.parsed.length > 0;

  const aria = projected && proj
    ? `Projected Step 2 CK ${proj.center}, range ${proj.low} to ${proj.high}, ${pctText}. Open the Step Gunner readiness predictor.`
    : `Step 2 CK ${core.actual}, ${pctText}. Open the Step Gunner readiness predictor.`;

  return (
    <a className="em-card" href={href} target="_blank" rel="noopener noreferrer" aria-label={aria}>
      <div className="em-hd">
        <div className="em-k"><span className="em-dot" aria-hidden="true" />{core.heroKicker}</div>
        <div className={'em-num' + (core.fail ? ' muted' : '')}>
          {heroBig}
          {heroSmall && <small> {heroSmall}</small>}
        </div>
        <div className="em-sub">{subline}</div>
        {pill && (
          <div className={'em-verdict ' + pill.cls}>
            {pill.cls === 'ok' && <IcCheck />}
            {pill.text}
          </div>
        )}
      </div>

      <div className="em-chart">
        <div className="em-tier">{tierLabel}</div>
        <Chart core={core} />
      </div>

      {showChips && (
        <div className="em-scores">
          <div className="em-slab">{projected ? 'Your practice tests (entered)' : 'Practice tests, tracked to exam day'}</div>
          <div className="em-grid">
            {chips.map((c, i) => (
              <div key={i} className={'em-chip ' + c.kind}>
                {c.kind === 'more' ? (
                  <div className="s more">{c.value}</div>
                ) : (
                  <>
                    <div className="f">{c.label}</div>
                    <div className="s">{c.value}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="em-foot">
        <div className="em-disc">A rough range, not a guarantee. It widens the farther your test is from exam day.</div>
        <div className="em-brand">
          <span className="em-wdot" aria-hidden="true" /><span>Powered by <b>Step Gunner</b></span><IcOut />
        </div>
      </div>
    </a>
  );
}

// ---- no-payload / undecodable fallback ----
function GenericCard({ href }: { href: string }) {
  return (
    <a className="em-card" href={href} target="_blank" rel="noopener noreferrer" aria-label="Predict your Step 2 CK score, free. Open the Step Gunner readiness predictor.">
      <div className="em-hd">
        <div className="em-k"><span className="em-dot" aria-hidden="true" />Free readiness check</div>
        <div className="em-headline">Predict your Step 2 CK score, free</div>
        <div className="em-sub">Drop in your NBME or UWSA scores and see your projected range, percentile, and trajectory. No sign-up.</div>
      </div>
      <div className="em-chart">
        <div className="em-tier">Where {PASS} passing and the {MEAN} US average sit</div>
        <ScaleChart />
      </div>
      <div className="em-foot">
        <div className="em-go">Open the predictor <IcOut /></div>
        <div className="em-brand">
          <span className="em-wdot" aria-hidden="true" /><span>Powered by <b>Step Gunner</b></span>
        </div>
      </div>
    </a>
  );
}

export default function Embed({ core, pill, href }: EmbedProps) {
  return (
    <>
      <Head>
        <title>Step 2 CK readiness | Step Gunner</title>
        <meta name="description" content="A projected Step 2 CK range, percentile, and trajectory from your practice tests. Powered by Step Gunner." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta key="theme-light" name="theme-color" content="#f4f8fc" media="(prefers-color-scheme: light)" />
        <meta key="theme-dark" name="theme-color" content="#070a12" media="(prefers-color-scheme: dark)" />
        <meta name="robots" content="noindex, follow" />
      </Head>

      {core ? <ResultCard core={core} pill={pill} href={href} /> : <GenericCard href={href} />}

      {/* The widget sits in someone else's page, so it brings the app-look tokens
          (styles/globals.css, light and dark from the visitor's system) and nothing
          else: no nav, no footer, no analytics (pages/_app.tsx). */}
      <style jsx global>{`
        html, body { overflow-x: hidden; }
        body {
          margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 16px; background: var(--bg); color: var(--ink); font-family: var(--f-sans);
        }
        /* The Next root is the flex item: let it shrink, so the card's max-width can hold it to the frame. */
        #__next { display: flex; justify-content: center; width: 100%; min-width: 0; }
        .em-card {
          display: block; width: 480px; max-width: 100%; color: var(--ink); text-decoration: none;
          background: var(--card); border-radius: var(--r-lg); overflow: hidden;
          box-shadow: 0 1px 2px var(--shadow-a), 0 16px 40px -16px var(--shadow-b), inset 0 0 0 1px var(--line);
          transition: box-shadow var(--d-micro) var(--ease);
        }
        .em-card:hover { text-decoration: none; box-shadow: 0 1px 2px var(--shadow-a), 0 24px 48px -16px var(--shadow-b), inset 0 0 0 1px var(--line-2); }
        .em-card:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px; }

        .em-hd { padding: 24px 24px 8px; }
        .em-k { display: flex; align-items: center; gap: 8px; font: 600 13px/1.3 var(--f-mono); letter-spacing: .1em; text-transform: uppercase; color: var(--ink-2); }
        .em-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--st-gold); box-shadow: 0 0 0 3px var(--ring-gold); }
        .em-num { margin: 12px 0 4px; font: 800 58px/1 var(--f-sans); letter-spacing: -.035em; font-variant-numeric: tabular-nums; color: var(--ink); }
        .em-num.muted { color: var(--ink-3); }
        .em-num small { font: 700 23px/1 var(--f-sans); letter-spacing: -.01em; color: var(--ink-2); }
        .em-headline { margin: 12px 0 8px; font: 800 28px/1.15 var(--f-sans); letter-spacing: -.025em; max-width: 20ch; text-wrap: balance; }
        .em-sub { font: 500 15px/1.5 var(--f-mono); color: var(--ink-2); }

        .em-verdict { display: inline-flex; align-items: center; gap: 4px; margin-top: 12px; padding: 4px 12px; border-radius: 8px; font: 700 13px/1.5 var(--f-mono); letter-spacing: .04em; }
        .em-verdict.ok { color: var(--ok); background: var(--wards-tint); }
        .em-verdict.warn { color: var(--step2); background: var(--step2-tint); }
        .em-verdict.low { color: var(--bad); background: var(--bad-tint); }
        .em-ic { width: 16px; height: 16px; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

        .em-chart { padding: 16px 24px 8px; }
        .em-tier { margin-bottom: 8px; font: 600 13px/1.3 var(--f-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
        .em-chart svg { display: block; width: 100%; height: auto; overflow: visible; }
        .em-chart text { font-family: var(--f-mono); }
        .em-axis { stroke: var(--line-2); stroke-width: 1; }
        .em-band { fill: var(--step2-tint); stroke: var(--step2); stroke-width: 1; }
        .em-mid { stroke: var(--step2); stroke-width: 2; }
        .em-cdot { fill: var(--step2); stroke: var(--card); stroke-width: 1.5; }
        .em-val { font-size: 15px; font-weight: 800; fill: var(--ink); }
        .em-ghost { fill: var(--card-2); stroke: var(--line-2); }
        .em-mark { stroke-width: 2; }
        .em-mark.em-hit { stroke: var(--step2); }
        .em-mark.em-fail { stroke: var(--ink-3); }
        .em-star { fill: var(--step2); }
        .em-diamond { fill: var(--card); stroke: var(--ink-3); stroke-width: 2; }
        .em-val.em-fail { fill: var(--ink-3); }
        .em-pass { stroke: var(--ok); stroke-width: 1.25; stroke-dasharray: 3 3; }
        .em-passl { font-size: 13px; fill: var(--ok); }
        .em-meanl { stroke: var(--ink-3); stroke-width: 1.25; stroke-dasharray: 4 4; }
        .em-meant { font-size: 13px; fill: var(--ink-3); }
        .em-tick { font-size: 13px; fill: var(--ink-3); }

        .em-scores { padding: 12px 24px 20px; }
        .em-slab { margin: 8px 0 12px; font: 600 13px/1.3 var(--f-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
        .em-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
        .em-chip { display: flex; flex-direction: column; justify-content: center; min-height: 48px; padding: 8px 4px; border-radius: 12px; text-align: center; background: var(--card-2); box-shadow: inset 0 0 0 1px var(--line); }
        .em-chip .f { font: 600 13px/1.2 var(--f-mono); color: var(--ink-3); }
        .em-chip .s { margin-top: 4px; font: 800 16px/1.1 var(--f-sans); font-variant-numeric: tabular-nums; color: var(--ink); }
        .em-chip.uwsa .s { color: var(--key); }
        .em-chip.gold { background: var(--step2-tint); box-shadow: inset 0 0 0 1px var(--step2); }
        .em-chip.gold .f, .em-chip.gold .s { color: var(--step2); }
        .em-chip.more .s.more { font: 700 13px/1 var(--f-mono); color: var(--ink-2); }

        .em-foot { display: grid; gap: 8px; padding: 16px 24px; box-shadow: inset 0 1px 0 var(--line); }
        .em-disc { font-size: 13px; line-height: 1.5; color: var(--ink-3); }
        .em-brand { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-2); }
        .em-brand b { color: var(--ink); font-weight: 700; }
        .em-brand .em-ic { color: var(--ink-3); }
        .em-wdot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--st-green); box-shadow: 0 0 0 3px var(--ring-green); }
        .em-go { display: flex; align-items: center; gap: 4px; font: 700 16px/1.3 var(--f-sans); color: var(--key); }

        @media (max-width: 400px) {
          .em-hd { padding: 20px 16px 8px; }
          .em-chart, .em-scores, .em-foot { padding-left: 16px; padding-right: 16px; }
          .em-num { font-size: 46px; }
        }
      `}</style>
    </>
  );
}

// SSR: read ?e=, decode it, rebuild the shared card model + readiness so the framed
// card matches the OG image and the on-page card exactly. Never throws: a bad or
// missing payload falls through to the generic card. Cached at the edge since the
// output is a pure function of ?e=.
export const getServerSideProps: GetServerSideProps<EmbedProps> = async (ctx) => {
  const e = typeof ctx.query.e === 'string' ? ctx.query.e : '';
  const decoded = e ? decodeShare(e) : null;
  const core = decoded ? buildCardCore(decoded.entries, decoded.actual, decoded.status) : null;
  const readiness = decoded ? computeReadiness(decoded.entries) : null;

  let pill: Pill = null;
  if (core) {
    if (core.actual != null) {
      if (core.fail) pill = { text: `Below the ${PASS} pass line`, cls: 'low' };
      else if (core.actual <= PASS_COMFORT) pill = { text: `Clears the ${PASS} pass line`, cls: 'ok' };
    } else if (readiness && readiness.proj) {
      const p = readiness.proj;
      if (p.high < PASS) pill = { text: `Below the ${PASS} pass line`, cls: 'low' };
      else if (p.low < PASS) pill = { text: `Straddles the ${PASS} pass line`, cls: 'warn' };
      else if (p.low <= PASS_COMFORT) pill = { text: `Clears the ${PASS} pass line`, cls: 'ok' };
    }
  }

  const href = core ? `${READINESS}?e=${encodeURIComponent(e)}` : READINESS;

  ctx.res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return { props: { core, pill, href } };
};
