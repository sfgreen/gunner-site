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

  shapes.push(<line key={key()} x1={AX_L} y1={AY} x2={AX_R} y2={AY} stroke="#243040" strokeWidth={1} />);

  if (actual == null && core.proj) {
    const { low, high, center } = core.proj;
    shapes.push(<rect key={key()} x={sx(low)} y={34} width={Math.max(4, sx(high) - sx(low))} height={24} rx={6} fill="rgba(240,180,41,.16)" stroke="rgba(240,180,41,.5)" />);
    shapes.push(<line key={key()} x1={sx(center)} y1={24} x2={sx(center)} y2={AY} stroke="#f0b429" strokeWidth={2} />);
    shapes.push(<circle key={key()} cx={sx(center)} cy={46} r={4.5} fill="#f0b429" stroke="#0a0d13" strokeWidth={1.5} />);
    shapes.push(<text key={key()} x={sx(center)} y={18} fill="#f0b429" fontSize={12} fontWeight={800} fontFamily="ui-monospace, monospace" textAnchor="middle">{center}</text>);
  }

  if (actual != null) {
    if (core.proj) {
      shapes.push(<rect key={key()} x={sx(core.proj.low)} y={40} width={Math.max(4, sx(core.proj.high) - sx(core.proj.low))} height={12} rx={4} fill="rgba(138,151,168,.12)" stroke="rgba(138,151,168,.28)" />);
    }
    const ax = sx(actual);
    const mc = fail ? '#8a97a8' : '#f0b429';
    shapes.push(<line key={key()} x1={ax} y1={24} x2={ax} y2={AY} stroke={mc} strokeWidth={2} />);
    if (fail) {
      shapes.push(<path key={key()} d={`M${ax},40 L${ax + 7},47 L${ax},54 L${ax - 7},47 Z`} fill="#0a0d13" stroke={mc} strokeWidth={2} />);
    } else {
      shapes.push(<path key={key()} d={starPath(ax, 46, 7.5)} fill={mc} />);
    }
    shapes.push(<text key={key()} x={ax} y={18} fill={mc} fontSize={12} fontWeight={800} fontFamily="ui-monospace, monospace" textAnchor="middle">{actual}</text>);
  }

  const px = sx(PASS);
  shapes.push(<line key={key()} x1={px} y1={30} x2={px} y2={AY} stroke="#46d877" strokeWidth={1.2} strokeDasharray="3 3" />);
  shapes.push(<text key={key()} x={px} y={26} fill="#46d877" fontSize={9} fontFamily="ui-monospace, monospace" textAnchor="middle">PASS {PASS}</text>);

  [200, 220, 240, 260, 280].forEach((t) => {
    shapes.push(<text key={key()} x={sx(t)} y={80} fill="#5a6676" fontSize={9} fontFamily="ui-monospace, monospace" textAnchor="middle">{t}</text>);
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
      <line x1={AX_L} y1={AY} x2={AX_R} y2={AY} stroke="#243040" strokeWidth={1} />
      <line x1={mx} y1={36} x2={mx} y2={AY} stroke="#8a97a8" strokeWidth={1.2} strokeDasharray="4 4" />
      <text x={mx} y={30} fill="#8a97a8" fontSize={9} fontFamily="ui-monospace, monospace" textAnchor="middle">US AVG {MEAN}</text>
      <line x1={px} y1={30} x2={px} y2={AY} stroke="#46d877" strokeWidth={1.2} strokeDasharray="3 3" />
      <text x={px} y={26} fill="#46d877" fontSize={9} fontFamily="ui-monospace, monospace" textAnchor="middle">PASS {PASS}</text>
      {[200, 220, 240, 260, 280].map((t) => (
        <text key={t} x={sx(t)} y={80} fill="#5a6676" fontSize={9} fontFamily="ui-monospace, monospace" textAnchor="middle">{t}</text>
      ))}
    </svg>
  );
}

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
    <a className="card" href={href} target="_blank" rel="noopener noreferrer" aria-label={aria}>
      <div className="hd">
        <div className="eyebrow">{core.heroKicker}</div>
        <div className={'num' + (core.fail ? ' muted' : '')}>
          {heroBig}
          {heroSmall && <small> {heroSmall}</small>}
        </div>
        <div className="sub">{subline}</div>
        {pill && (
          <div className={'verdict ' + pill.cls}>
            {pill.cls === 'ok' && <span className="ck">{'✓'} </span>}
            {pill.text}
          </div>
        )}
      </div>

      <div className="chart">
        <div className="tier">{tierLabel}</div>
        <Chart core={core} />
      </div>

      {showChips && (
        <div className="scores">
          <div className="slab">{projected ? 'Your practice tests (entered)' : 'Practice tests, tracked to exam day'}</div>
          <div className="grid">
            {chips.map((c, i) => (
              <div key={i} className={'chip ' + c.kind}>
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

      <div className="foot">
        <div className="disc">A rough range, not a guarantee. It widens the farther your test is from exam day.</div>
        <div className="brand">
          <span className="dot" /> Powered by <b>Step Gunner</b> <span className="arr" aria-hidden="true">{'↗'}</span>
        </div>
      </div>
    </a>
  );
}

// ---- no-payload / undecodable fallback ----
function GenericCard({ href }: { href: string }) {
  return (
    <a className="card" href={href} target="_blank" rel="noopener noreferrer" aria-label="Predict your Step 2 CK score, free. Open the Step Gunner readiness predictor.">
      <div className="hd">
        <div className="eyebrow">Free readiness check</div>
        <div className="headline">Predict your Step 2 CK score, free</div>
        <div className="sub">Drop in your NBME or UWSA scores and see your projected range, percentile, and trajectory. No sign-up.</div>
      </div>
      <div className="chart">
        <div className="tier">Where {PASS} passing and the {MEAN} US average sit</div>
        <ScaleChart />
      </div>
      <div className="foot">
        <div className="cta">Open the predictor <span className="arr" aria-hidden="true">{'↗'}</span></div>
        <div className="brand">
          <span className="dot" /> Powered by <b>Step Gunner</b>
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
        <meta name="theme-color" content="#05070b" />
        <meta name="robots" content="noindex, follow" />
      </Head>

      {core ? <ResultCard core={core} pill={pill} href={href} /> : <GenericCard href={href} />}

      <style jsx global>{`
        :root {
          --bg: #05070b; --bg2: #0f1520; --bg3: #131a27; --card: #0a0d13;
          --ink: #eaf0f8; --dim: #8a97a8; --faint: #5a6676; --hair: #1e2836;
          --green: #46d877; --gold: #f0b429; --blue: #5b9dff; --red: #f2637a;
          --mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace;
          --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: hidden; }
        body {
          background: var(--bg); color: var(--ink); font-family: var(--sans);
          -webkit-font-smoothing: antialiased;
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 14px;
        }
      `}</style>

      <style jsx>{`
        .card {
          display: block; width: 480px; max-width: 100%; color: var(--ink);
          background: linear-gradient(180deg, var(--bg2), var(--card));
          border: 1px solid var(--hair); border-radius: 20px; overflow: hidden;
          text-decoration: none; transition: border-color 160ms ease, box-shadow 160ms ease;
        }
        .card:hover { border-color: #2b3a4d; box-shadow: 0 8px 40px rgba(0, 0, 0, 0.35); }
        .card:focus-visible { outline: 2px solid var(--green); outline-offset: 3px; }

        .hd { padding: 22px 24px 6px; }
        .eyebrow {
          font: 600 11px var(--mono); letter-spacing: 0.16em; color: var(--green);
          text-transform: uppercase;
        }
        .num { font: 800 64px/0.95 var(--sans); letter-spacing: -2px; margin: 8px 0 2px; }
        .num.muted { color: var(--dim); }
        .num small { font: 700 21px var(--sans); color: var(--dim); letter-spacing: -0.5px; }
        .headline { font: 800 27px/1.12 var(--sans); letter-spacing: -0.8px; margin: 10px 0 8px; max-width: 20ch; }
        .sub { font: 600 13px var(--mono); color: var(--dim); line-height: 1.5; }
        .sub b { color: var(--ink); }

        .verdict {
          display: inline-block; margin-top: 12px; font: 700 12px var(--mono);
          letter-spacing: 0.04em; padding: 7px 12px; border-radius: 9px;
        }
        .verdict .ck { font-weight: 800; }
        .verdict.ok { color: var(--green); border: 1px solid rgba(70, 216, 119, 0.35); background: rgba(70, 216, 119, 0.07); }
        .verdict.warn { color: var(--gold); border: 1px solid rgba(240, 180, 41, 0.35); background: rgba(240, 180, 41, 0.07); }
        .verdict.low { color: var(--red); border: 1px solid rgba(242, 99, 122, 0.35); background: rgba(242, 99, 122, 0.07); }

        .chart { padding: 14px 24px 6px; }
        .tier {
          font: 600 10.5px var(--mono); letter-spacing: 0.1em; color: var(--faint);
          text-transform: uppercase; margin-bottom: 8px;
        }
        .chart :global(svg) { width: 100%; height: auto; display: block; }

        .scores { padding: 12px 24px 18px; }
        .slab {
          font: 600 10.5px var(--mono); letter-spacing: 0.12em; color: var(--faint);
          text-transform: uppercase; margin: 8px 0 10px;
        }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
        .chip {
          background: var(--bg3); border: 1px solid var(--hair); border-radius: 9px;
          padding: 8px 6px; text-align: center; min-height: 40px;
          display: flex; flex-direction: column; justify-content: center;
        }
        .chip .f { font: 600 9.5px var(--mono); color: var(--faint); letter-spacing: 0.04em; }
        .chip .s { font: 800 16px var(--sans); margin-top: 2px; }
        .chip.nbme .s { color: var(--ink); }
        .chip.uwsa .s { color: var(--blue); }
        .chip.gold { border-color: rgba(240, 180, 41, 0.4); }
        .chip.gold .f { color: var(--gold); }
        .chip.gold .s { color: var(--gold); }
        .chip.more .s.more { color: var(--dim); font: 700 13px var(--mono); }

        .foot {
          border-top: 1px solid var(--hair); padding: 14px 24px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .disc { font: 500 11.5px var(--sans); color: var(--faint); line-height: 1.5; }
        .brand {
          display: flex; align-items: center; gap: 7px;
          font: 500 12px var(--sans); color: var(--dim);
        }
        .brand b { color: var(--ink); font-weight: 700; }
        .brand .dot {
          width: 8px; height: 8px; border-radius: 50%; background: var(--green);
          box-shadow: 0 0 9px var(--green); flex: 0 0 auto;
        }
        .brand .arr { color: var(--faint); font-size: 12px; }
        .cta {
          font: 700 14px var(--sans); color: var(--green); letter-spacing: 0.1px;
          display: flex; align-items: center; gap: 6px;
        }
        .cta .arr { font-size: 13px; }

        @media (prefers-reduced-motion: reduce) {
          .card { transition: none; }
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
