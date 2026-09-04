import Head from 'next/head';
import SiteShell from '../../components/SiteShell';
import Link from 'next/link';
import {
  PASS, MEAN, GMIN, GMAX, CAL, NORM,
  computeReadiness, decayAnchor, effectiveDays, bandHalfWidth, shortTier,
  percentile, ordinal, gpct,
  type Entry, type Parsed,
} from '../../lib/readiness';
import { track, referrerHost, appStoreUrl } from '../../lib/analytics';

const APP = appStoreUrl('methodology_web');

// Empirical facts from the calibration record (analysis/readiness_calibration,
// RESULTS_anchor_fallback_2026-08-03.md + decision 0008). These are DATA findings,
// not model parameters, so they live here as prose constants, not in lib/readiness.
// The MODEL numbers (slope, delta, tau, pass line, band, norm table) are imported
// above and rendered from the live model so this page cannot drift from it.
const SAMPLE_N = 223;          // real paired practice->actual outcomes fit against
const NORM_N = '67,934';       // LCME first-takers in the USMLE norm table
const PCT_UWSA_LISTED_LAST = 62;   // % of students who list a UWSA last
const PCT_UWSA_ACTUALLY_FRESHEST = 36; // % of the time that UWSA is truly their freshest

// The one worked example we thread through every step. Undated, in this entry order.
const EXAMPLE: Entry[] = [
  { form: 'NBME 12', score: '218', days: '' },
  { form: 'NBME 13', score: '235', days: '' },
  { form: 'NBME 14', score: '235', days: '' },
  { form: 'UWSA 1', score: '232', days: '' },
  { form: 'UWSA 3', score: '204', days: '' },
  { form: 'NBME 15', score: '240', days: '' },
  { form: 'UWSA 2', score: '214', days: '' },
  { form: 'NBME 16', score: '245', days: '' },
];

const isUWSA = (form: string) => /uwsa/i.test(form);

type WRow = { form: string; score: number; wpct: number; isU: boolean; freshest: boolean };

// Build the anchor-weight rows LIVE from the model: effectiveDays + the exp(-eff/tau)
// weights the anchor is actually computed from. Sorted freshest (heaviest) first.
function anchorWeights(parsed: Parsed[]): WRow[] {
  const eff = effectiveDays(parsed);
  const w = eff.map((d) => Math.exp(-d / CAL.tau));
  const sum = w.reduce((a, b) => a + b, 0);
  const rows = parsed.map((p, i) => ({
    form: p.form, score: p.s, wpct: (w[i] / sum) * 100, isU: isUWSA(p.form), idx: i,
  }));
  rows.sort((a, b) => (b.wpct - a.wpct) || (a.idx - b.idx)); // stable ties -> entry order
  return rows.map((r, i) => ({ form: r.form, score: r.score, wpct: r.wpct, isU: r.isU, freshest: i === 0 }));
}

export default function Methodology() {
  const { proj, parsed } = computeReadiness(EXAMPLE);
  // proj is always defined for this fixed, valid example; guard for the type only.
  const p = proj!;
  const anchor = Math.round(decayAnchor(parsed));
  const rows = anchorWeights(parsed);
  const maxW = rows.length ? rows[0].wpct : 1;
  const pct = percentile(p.center);

  const halfLife = Math.round(CAL.tau * Math.LN2);
  const shrunk = CAL.mean + CAL.slope * (anchor - CAL.mean); // toward-the-mean value, pre-gain
  const rawCenter = shrunk + CAL.delta;                      // exact, before the model's round

  // Band tiers, pulled from the live bandHalfWidth so the table cannot drift.
  const tiers = [
    { when: 'Within 15 days of exam', ...bandHalfWidth(10) },
    { when: '15 to 30 days out', ...bandHalfWidth(20) },
    { when: '31 to 56 days out', ...bandHalfWidth(40) },
    { when: '57 or more days out', ...bandHalfWidth(70) },
    { when: 'No exam date given', ...bandHalfWidth(null) },
  ];
  const guardBand = Math.max(bandHalfWidth(null).band + 4, 15); // low-anchor guardrail floor

  // Norm strip: the 10-point marks straight out of the imported NORM table, each read
  // back through the live percentile() so the strip is the same interpolation the
  // projection uses (not a re-typed copy).
  const normMarks = NORM
    .filter(([s]) => s >= 210 && s <= 270 && s % 10 === 0)
    .map(([s]) => ({ s, pctl: percentile(s) }));

  const CANON = 'https://stepgunner.com/readiness/methodology';
  const TITLE = 'How the Step 2 CK score predictor works';
  const DESC = 'How the Step 2 CK score predictor works: how NBME and UWSA practice scores become a projected range, the exact constants used, and where the model stops.';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: TITLE,
    description: DESC,
    author: { '@type': 'Organization', name: 'Rezumab LLC' },
    publisher: { '@type': 'Organization', name: 'Step Gunner' },
    mainEntityOfPage: CANON,
    about: 'USMLE Step 2 CK score prediction methodology',
  };

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESC} />
        <link rel="canonical" href={CANON} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESC} />
        <meta property="og:url" content={CANON} />
        <meta property="og:image" content="https://stepgunner.com/api/og" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESC} />
        <meta name="twitter:image" content="https://stepgunner.com/api/og" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#faf9f6" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <SiteShell campaign={'methodology_web'} measure="article">
        <div className="wrap">
          <div className="crumb"><Link href="/readiness">Readiness check</Link><span className="sep">/</span><span>Methodology</span></div>
          <span className="eyebrow">Methodology</span>
          <h1>How the Step 2 CK score predictor works</h1>
          <p className="lede">
            The only Step 2 CK score predictor that shows its work. Every number on this page is the live
            output of the same model that runs in the app and on the readiness check, the same code, no
            marketing math. Here is exactly how your practice tests become a projected range.
          </p>

          {/* 1. WHAT IT PREDICTS */}
          <section className="block">
            <div className="beyebrow"><i>01</i> What it predicts</div>
            <h2>A projected Step 2 CK score, as a range.</h2>
            <p>
              You enter your NBME and UWorld Self-Assessment scores. The model returns a projected Step 2 CK
              score as a <b>range</b>, not a single number and not a guarantee. It is free, needs no sign-up,
              and runs entirely in your browser. A range is the honest output: any single practice test carries
              roughly 8 to 9 points of form noise, so a lone point estimate would imply a precision the data
              does not support.
            </p>
          </section>

          {/* 2. THE MODEL STEP BY STEP */}
          <section className="block">
            <div className="beyebrow"><i>02</i> The model, step by step</div>
            <h2>From your scores to a range, in six steps.</h2>
            <p>
              We will follow one real set of eight practice tests through all six steps. Every figure below,
              including the card, is computed on this page by calling the model directly, so what you read is
              what a student with these scores actually sees.
            </p>

            {/* live worked-example result card */}
            <div className="card" role="figure" aria-label="Worked example result">
              <div className="tag">Projected Step 2 CK</div>
              <div className="num">{p.center}<small>&nbsp; {p.low} to {p.high}</small></div>
              <div className="csub">anchor <b>{anchor}</b> <span className="mid">&middot;</span> about the <b>{ordinal(pct)}</b> percentile vs US first-takers</div>
              <div className="cmeta">
                <div>Anchor<b>{anchor}</b></div>
                <div>Range<b>{p.low} to {p.high}</b></div>
                <div>Percentile<b>{ordinal(pct)}</b></div>
                <div>Tests<b>{parsed.length}</b></div>
              </div>
            </div>

            {/* a. inputs */}
            <div className="step">
              <div className="skey">a</div>
              <div className="sbody">
                <h3>Your inputs</h3>
                <p>
                  Two kinds of practice test, each a three-digit score: NBME forms 9 to 16, and UWorld
                  Self-Assessments 1 to 3. Optionally, how many days before your exam you took each one. Dates
                  make the projection sharper, but the model works without them.
                </p>
                <p className="ex">
                  Worked example, undated: NBME 12 = 218, NBME 13 = 235, NBME 14 = 235, UWSA 1 = 232,
                  UWSA 3 = 204, NBME 15 = 240, UWSA 2 = 214, NBME 16 = 245.
                </p>
              </div>
            </div>

            {/* b. anchor */}
            <div className="step">
              <div className="skey">b</div>
              <div className="sbody">
                <h3>The anchor: a recency-weighted average</h3>
                <p>
                  Your scores collapse into one number, the <b>anchor</b>. Not a flat average: each test is
                  weighted by how recent it is, because a test from last week predicts exam day better than one
                  from two months ago. The weight decays exponentially with how many days before the exam you
                  took it.
                </p>
                <div className="formula">
                  weight = exp( -daysOut / tau ),&nbsp;&nbsp; tau = {CAL.tau}
                </div>
                <p>
                  That is a <b>{halfLife} day half-life</b>: a test taken {halfLife} days earlier counts about
                  half as much as your freshest one. The anchor is the weighted average of every score under
                  those weights.
                </p>
              </div>
            </div>

            {/* c. hybrid fallback + weight bars */}
            <div className="step">
              <div className="skey">c</div>
              <div className="sbody">
                <h3>No dates? A hybrid recency fallback</h3>
                <p>
                  When you skip the dates, the model still needs an order. It reads the order you entered your
                  tests, so the one you added last is treated as freshest, which correctly handles adding an
                  older form out of sequence. But there is a trap: <b>{PCT_UWSA_LISTED_LAST}%</b> of students
                  list a UWSA last, yet a UWSA is actually their most recent test only
                  <b> {PCT_UWSA_ACTUALLY_FRESHEST}%</b> of the time. So each undated UWSA is pinned to the
                  median NBME recency. A UWSA you happened to type last cannot pose as your freshest test by
                  listing convention alone. Your real NBME climb carries the number.
                </p>
              </div>
            </div>

            {/* weight panel, on the live example */}
            <div className="panel" role="figure" aria-label="Anchor weights on the worked example">
              <div className="plabel">Anchor weights</div>
              <div className="ptitle">How much each test counts, freshest first</div>
              <div className="pnote">
                NBME 16 (245) is the latest real form, so it carries <b>{rows[0].wpct.toFixed(1)}%</b>. The
                three UWSAs sit together at the median NBME recency, so none of them, including the 214, gets
                to masquerade as freshest.
              </div>
              <div className="legend">
                <span><i className="nb" />NBME</span>
                <span><i className="uw" />UWSA (pinned to median NBME recency)</span>
              </div>
              {rows.map((r) => {
                const pin = r.freshest && !r.isU ? 'latest real form' : r.isU ? 'pinned to median' : '';
                return (
                  <div className={'wrow ' + (r.isU ? 'uwsa' : 'nbme')} key={r.form}>
                    <div className="wname">
                      {r.form}<span className="wsc">{r.score}</span>
                      {pin && <span className="wpin">{pin}</span>}
                    </div>
                    <div className="wbar">
                      <div className="wfill" style={{ width: (r.wpct / maxW) * 100 + '%' }} />
                      {r.freshest && <span className="wlead">freshest</span>}
                      <span className="wwt">{r.wpct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
              <div className="pfoot">
                The number tracks the NBME line, not the typing order. The latest real NBME is 245 and the
                NBME trend is 240 then 245, so the anchor lands at {anchor}, and the projection just above the
                freshest form. A trailing UWSA can still lower the anchor if it genuinely is one of the recent
                tests, it just no longer wins freshest by convention.
              </div>
            </div>

            {/* d. shrinkage */}
            <div className="step">
              <div className="skey">d</div>
              <div className="sbody">
                <h3>Shrink toward the mean, then add the measured gain</h3>
                <p>The anchor is not the projection. Two corrections turn it into a center.</p>
                <div className="formula">
                  center = {CAL.mean} + {CAL.slope} x ( anchor - {CAL.mean} ) + {CAL.delta}
                </div>
                <p>
                  The <b>{CAL.slope}</b> multiplier is a Thorndike Case II range-restriction correction.
                  Practice tests spread wider than the real exam does, so raw highs and lows are pulled back
                  toward the population mean of {CAL.mean}. An anchor below the mean is nudged up, a high anchor
                  is nudged down. The <b>+{CAL.delta}</b> is the level offset: across the validation cohort,
                  students outscored their recency-decay anchor by about {CAL.delta} points on the real exam,
                  on average.
                </p>
                <p className="ex">
                  Worked example: anchor {anchor} shrinks to {CAL.mean} + {CAL.slope} x ({anchor} - {CAL.mean})
                  = {shrunk.toFixed(1)}, plus {CAL.delta} gives {rawCenter.toFixed(1)}, rounded to a center of <b>{p.center}</b>.
                </p>
              </div>
            </div>

            {/* e. band */}
            <div className="step">
              <div className="skey">e</div>
              <div className="sbody">
                <h3>The band width: tight when close, wide when far</h3>
                <p>
                  The half-width of the range depends on how near your freshest test is to exam day. The closer
                  you are, the more your practice scores have converged, so the tighter the honest interval.
                </p>
                <div className="tiers">
                  {tiers.map((t) => (
                    <div className="tier" key={t.when}>
                      <span className="twhen">{t.when}</span>
                      <span className="tband">plus or minus {t.band}</span>
                      <span className="ttier">{shortTier(t.tier)}</span>
                    </div>
                  ))}
                </div>
                <p>
                  A guardrail widens the band whenever the anchor sits at or below the {PASS} pass line, where
                  the low tail is least tested. There the band opens to at least {guardBand} points and the read
                  is flagged high uncertainty.
                </p>
                <p className="ex">
                  Worked example: the freshest test is undated, so the band is plus or minus {p.band}, giving
                  the {p.low} to {p.high} range below. Add your exam date and it tightens.
                </p>
                <BandDiagram low={p.low} high={p.high} center={p.center} />
              </div>
            </div>

            {/* f. percentile */}
            <div className="step">
              <div className="skey">f</div>
              <div className="sbody">
                <h3>Where that lands nationally</h3>
                <p>
                  The center is turned into a percentile by interpolating the official USMLE Score
                  Interpretation Guidelines norm table (LCME first-takers, N about {NORM_N}). It answers a
                  different question than pass or fail: of every US first-taker, how many scored at or below
                  this.
                </p>
                <div className="norm" role="figure" aria-label="Score to percentile norm marks">
                  {normMarks.map((n) => {
                    const near = p.center >= n.s - 5 && p.center < n.s + 5;
                    return (
                      <div className={'ncell' + (near ? ' near' : '')} key={n.s}>
                        <span className="ns">{n.s}</span>
                        <span className="np">{ordinal(n.pctl)}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="ex">
                  Worked example: a center of {p.center} interpolates to about the {ordinal(pct)} percentile,
                  between the {percentile(245)} at 245 and the {percentile(250)} at 250.
                </p>
              </div>
            </div>
          </section>

          {/* 2b. FORM SCALE QUIRKS (decision 0013) */}
          <section className="block">
            <div className="beyebrow"><i>02b</i> Form scale quirks</div>
            <h2>Three forms print off the common scale, so they get translated.</h2>
            <p>
              Fit on 160 students and 1,043 dated forms with person and timing controls: old
              <b> NBME 9 prints about 5.5 low</b> (we credit it back), <b>UWSA 2 prints about 4.8
              hot</b> (translated down), and <b>UWSA 3 about 6.3 low</b> on thinner data. Modern
              NBMEs, forms 10 through 16, are equated by NBME itself and enter at face value: a
              printed NBME score is never counted down here. NBME 16 does print a few points high,
              but students who print high on 16 really do score high, so translating it away would
              under-project; it stays at face value. And no, forms do not carry hidden weights
              beyond their dates: we tested that too, and recency carries all of it.
            </p>
          </section>

          {/* 3. CALIBRATION AND LIMITS */}
          <section className="block">
            <div className="beyebrow"><i>03</i> Calibration and its limits</div>
            <h2>How it is calibrated, and where it stops.</h2>
            <p>
              Those constants are not guesses. They were fit against about <b>{SAMPLE_N}</b> real paired
              outcomes: a student's pre-exam practice scores, then their actual Step 2 CK, gathered from public
              r/step2 score-release threads. Three choices we made on purpose, in the name of not overselling.
            </p>
            <div className="limits">
              <div className="limit">
                <div className="ltag">Held wide on purpose</div>
                <p>
                  The sample is high-performer selected. People who post score releases skew high, the actuals
                  average well above the national mean, and the low tail is thin. So the band is deliberately
                  held <b>wide</b> rather than tightened to fit this rosy sample. A narrower band would look
                  more confident and be less honest.
                </p>
              </div>
              <div className="limit">
                <div className="ltag">Ranges, not fake precision</div>
                <p>
                  The interval targets roughly the middle 60% of outcomes, not a 95% guarantee. The slope is
                  held at {CAL.slope} rather than the flatter value this restricted sample suggests, because a
                  flatter slope would badly over-project weak students, the ones who most need an honest low
                  read.
                </p>
              </div>
              <div className="limit">
                <div className="ltag">Not a guarantee</div>
                <p>
                  It is a projection from practice tests. Any individual can land outside the range. Treat it as
                  a compass heading, not a diagnosis.
                </p>
              </div>
            </div>
            <p className="willsharpen">
              It will sharpen as real in-app outcomes accrue, students who log a practice score and later log
              their actual Step 2, a sample that is not high-performer truncated. When that set is large enough
              to disagree with this one, the constants move, on data, not on vibes.
            </p>
          </section>

          {/* 04. THE BLIND TEST (out-of-sample, Aug 2026 wave) */}
          <section className="block">
            <div className="beyebrow"><i>04</i> The blind test</div>
            <h2>Fit on the past, scored on the future.</h2>
            <p>
              Most score converters have never been tested on people they were not fit on. This one has.
              Before the August 2026 score release, the model's projections were locked for <b>32 students</b>
              from the newest release thread, none of whom were in the calibration set. When their real
              scores dropped: <b>average miss 4.1 points</b>, average signed error <b>+0.97</b> (essentially
              unbiased), <b>88% landed within 7 points</b> and 94% within 8. Those numbers are what the band
              width claims they should be, which is the whole point of publishing them.
            </p>
          </section>

          {/* 05. THE BEAT CURVE */}
          <section className="block">
            <div className="beyebrow"><i>05</i> The beat curve</div>
            <h2>How far past their last practice form do people actually land?</h2>
            <p>
              Across <b>150 reports</b> with an exact outcome and a dated final form, actual score minus the
              freshest practice form has a <b>median of +9</b>. Half of students land between <b>+1 and +14</b>.
              The full range runs <b>-20 to +35</b>, and about <b>1 in 6 land below</b> their freshest form,
              which is why a projection that just adds a fixed bonus to your last NBME is flattering rather
              than honest. The model earns the middle of this curve through recency weighting and calibration,
              and the band width covers its tails.
            </p>
            <div className="norm" role="figure" aria-label="Beat distribution percentiles">
              <div className="ncell"><span className="ns">p10</span><span className="np">-3</span></div>
              <div className="ncell"><span className="ns">p25</span><span className="np">+1</span></div>
              <div className="ncell near"><span className="ns">median</span><span className="np">+9</span></div>
              <div className="ncell"><span className="ns">p75</span><span className="np">+14</span></div>
              <div className="ncell"><span className="ns">p90</span><span className="np">+18</span></div>
            </div>
          </section>

          {/* 06. CLOSING THE LOOP */}
          <section className="block">
            <div className="beyebrow"><i>06</i> Closing the loop</div>
            <h2>Predictions locked before the exam, paired with real scores after.</h2>
            <p>
              Since July 2026 the app freezes every student's projection on their exam day, before any result
              exists. When they later report their real score, one tap in the app or from an email, the pair
              becomes a true blind data point: what the model said then, against what actually happened. These
              app-native pairs have none of the good-news bias of public score threads, and as they accumulate
              they drive the next refit. Scores are anonymous, linked only to the account, and only ever used
              in aggregate.
            </p>
          </section>

          {/* 4. SOFT CTA */}
          <section className="cta">
            <p className="ctline">Help make it sharper. When you get your real Step 2 score, log it, every real outcome pulls these numbers closer to the truth.</p>
            <div className="ctrow">
              <Link href="/readiness" className="ct-primary" onClick={() => track('methodology_run_check', { location: 'cta', ref: referrerHost() })}>Run your readiness check</Link>
              <a href={APP} className="ct-secondary" onClick={() => track('store_click', { source: 'methodology', location: 'cta', ref: referrerHost() })}>Get Step Gunner</a>
            </div>
          </section>
        </div>
      </SiteShell>

      <style jsx global>{`
`}</style>

      <style jsx>{`
          radial-gradient(90% 55% at 50% -8%, rgba(13,148,72,0.08), transparent 60%), radial-gradient(56% 22% at 50% 0%, rgba(240,180,41,0.13), transparent 62%), var(--bg); }
        .wm .wt b.g { color: var(--green); font-weight: 700; }
        .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 26px rgba(13,148,72,0.32); }

        .wrap { padding: 4px 0 30px; }
        .crumb { font-family: var(--mono); font-size: 11px; color: var(--faint); display: flex; align-items: center; gap: 9px; margin-bottom: 20px; letter-spacing: 0.4px; }
        .crumb :global(a) { color: var(--dim); }
        .crumb :global(a):hover { color: var(--green); }
        .crumb .sep { color: var(--hair); }

        .eyebrow { display: inline-block; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); }
        h1 { font-size: 34px; font-weight: 800; letter-spacing: -0.6px; line-height: 1.12; margin: 10px 0 14px; text-wrap: balance; }
        .lede { color: var(--dim); font-size: 17px; line-height: 1.6; margin: 0 0 10px; max-width: 58ch; }
        .lede b { color: var(--ink); font-weight: 600; }

        .block { margin-top: 46px; padding-top: 30px; border-top: 1px solid var(--hair); }
        .beyebrow { font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--faint); display: flex; align-items: center; gap: 10px; }
        .beyebrow i { color: var(--gold); font-style: normal; }
        h2 { font-size: 25px; font-weight: 800; letter-spacing: -0.4px; line-height: 1.2; margin: 12px 0 12px; }
        .block > p { color: var(--dim); font-size: 15.5px; line-height: 1.65; margin: 0 0 14px; max-width: 62ch; }
        .block > p b { color: var(--ink); font-weight: 600; }

        /* worked-example card */
        .card { margin: 24px 0 10px; background: linear-gradient(180deg, var(--bg2), var(--bg1));
          border: 1px solid rgba(13,148,72,0.32); border-radius: 18px; padding: 22px 24px; position: relative; overflow: hidden;
          box-shadow: 0 0 0 1px rgba(13,148,72,0.06), 0 22px 60px -34px rgba(13,148,72,0.55); }
        .tag { font-family: var(--mono); font-weight: 700; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--green); }
        .num { font-size: 62px; font-weight: 800; letter-spacing: -2px; line-height: 0.95; margin: 10px 0 2px; color: var(--green); }
        .num small { font-size: 21px; font-weight: 700; color: var(--dim); letter-spacing: -0.4px; }
        .csub { font-family: var(--mono); font-weight: 600; font-size: 12.5px; color: var(--dim); margin-top: 5px; }
        .csub b { color: var(--ink); } .csub .mid { color: var(--faint); }
        .cmeta { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--hair); display: flex; gap: 26px; flex-wrap: wrap; }
        .cmeta div { font-family: var(--mono); font-weight: 600; font-size: 11px; color: var(--faint); text-transform: uppercase; letter-spacing: 0.06em; }
        .cmeta b { display: block; font-family: var(--sans); font-weight: 800; font-size: 18px; color: var(--ink); letter-spacing: -0.3px; margin-top: 3px; text-transform: none; }

        /* steps */
        .step { display: grid; grid-template-columns: 34px 1fr; gap: 16px; margin-top: 26px; }
        .skey { width: 30px; height: 30px; border-radius: 9px; border: 1px solid var(--hair); background: var(--bg2); color: var(--gold); font-family: var(--mono); font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .sbody h3 { font-size: 17px; font-weight: 700; letter-spacing: -0.2px; margin: 4px 0 8px; }
        .sbody p { color: var(--dim); font-size: 15px; line-height: 1.65; margin: 0 0 12px; max-width: 58ch; }
        .sbody p b { color: var(--ink); font-weight: 600; }
        .sbody p.ex { color: var(--faint); font-family: var(--mono); font-size: 12.5px; line-height: 1.6; border-left: 2px solid var(--hair); padding-left: 12px; }
        .sbody p.ex b { color: var(--dim); }

        .formula { font-family: var(--mono); font-size: 14px; font-weight: 700; color: var(--ink); background: var(--bg1); border: 1px solid var(--hair); border-radius: 12px; padding: 14px 16px; margin: 4px 0 14px; letter-spacing: 0.2px; overflow-x: auto; white-space: nowrap; }

        /* weight panel */
        .panel { margin: 20px 0 6px; background: linear-gradient(180deg, var(--bg1), var(--bg)); border: 1px solid var(--hair); border-radius: 18px; padding: 22px 22px 18px; }
        .plabel { font-family: var(--mono); font-weight: 600; font-size: 10.5px; letter-spacing: 0.14em; color: var(--faint); text-transform: uppercase; margin-bottom: 4px; }
        .ptitle { font-size: 16px; font-weight: 700; letter-spacing: -0.2px; margin-bottom: 4px; }
        .pnote { color: var(--dim); font-size: 13px; line-height: 1.55; margin-bottom: 16px; max-width: 58ch; }
        .pnote b { color: var(--ink); font-weight: 600; }
        .legend { display: flex; gap: 18px; flex-wrap: wrap; margin: 0 0 12px; font-family: var(--mono); font-weight: 600; font-size: 11px; color: var(--dim); }
        .legend i { display: inline-block; width: 11px; height: 11px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
        .legend .nb { background: var(--green); } .legend .uw { background: var(--blue); }

        .wrow { display: grid; grid-template-columns: 150px 1fr; gap: 14px; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--hair2); }
        .wrow:last-of-type { border-bottom: 0; }
        .wname { font-family: var(--mono); font-weight: 700; font-size: 13px; letter-spacing: -0.2px; }
        .wname .wsc { color: var(--faint); font-weight: 600; margin-left: 6px; }
        .wrow.uwsa .wname { color: var(--blue); } .wrow.nbme .wname { color: var(--ink); }
        .wpin { display: block; font-family: var(--mono); font-weight: 600; font-size: 9px; color: var(--faint); letter-spacing: 0.02em; margin-top: 2px; }
        .wbar { position: relative; height: 24px; background: var(--bg3); border: 1px solid var(--hair); border-radius: 6px; overflow: hidden; }
        .wfill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 5px 0 0 5px; }
        .wrow.nbme .wfill { background: linear-gradient(90deg, rgba(13,148,72,0.45), var(--green)); }
        .wrow.uwsa .wfill { background: linear-gradient(90deg, rgba(47,111,237,0.45), var(--blue)); }
        .wwt { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-family: var(--mono); font-weight: 700; font-size: 11.5px; color: var(--ink); text-shadow: 0 1px 2px rgba(25,28,35,0.12); }
        .wlead { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); font-family: var(--mono); font-weight: 700; font-size: 9px; letter-spacing: 0.08em; color: rgba(255,255,255,0.82); text-transform: uppercase; }
        .pfoot { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--hair); color: var(--faint); font-size: 12.5px; line-height: 1.6; max-width: 60ch; }

        /* band tiers */
        .tiers { border: 1px solid var(--hair); border-radius: 12px; overflow: hidden; margin: 6px 0 14px; }
        .tier { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; padding: 11px 15px; border-bottom: 1px solid var(--hair2); }
        .tier:last-child { border-bottom: 0; }
        .twhen { font-size: 13.5px; color: var(--ink); }
        .tband { font-family: var(--mono); font-weight: 700; font-size: 12.5px; color: var(--gold); }
        .ttier { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--dim); border: 1px solid var(--hair); border-radius: 999px; padding: 3px 9px; min-width: 78px; text-align: center; }

        /* norm strip */
        .norm { display: flex; gap: 6px; margin: 4px 0 14px; overflow-x: auto; padding-bottom: 4px; }
        .ncell { flex: 1 0 auto; min-width: 58px; text-align: center; background: var(--bg1); border: 1px solid var(--hair); border-radius: 10px; padding: 10px 6px; }
        .ncell .ns { display: block; font-family: var(--mono); font-weight: 800; font-size: 15px; color: var(--ink); }
        .ncell .np { display: block; font-family: var(--mono); font-weight: 600; font-size: 11px; color: var(--dim); margin-top: 3px; }
        .ncell.near { border-color: rgba(240,180,41,0.55); background: rgba(240,180,41,0.06); }
        .ncell.near .ns { color: var(--gold); }

        /* limits */
        .limits { display: grid; gap: 12px; margin: 8px 0 16px; }
        .limit { border-left: 2px solid var(--gold); background: linear-gradient(90deg, rgba(240,180,41,0.06), transparent); border-radius: 0 12px 12px 0; padding: 14px 18px; }
        .ltag { font-family: var(--mono); font-weight: 700; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; }
        .limit p { color: var(--dim); font-size: 14.5px; line-height: 1.6; margin: 0; max-width: 62ch; }
        .limit p b { color: var(--ink); font-weight: 600; }
        .willsharpen { color: var(--dim); font-size: 15px; line-height: 1.65; max-width: 62ch; }

        /* cta */
        /* Scoped to section.cta on purpose. This block is styled-jsx GLOBAL and
   SiteShell's nav button is an <a> with class cta, so an unscoped .cta rule
   put a 46px top margin on the NAV button and pushed it below the wordmark
   and the links. */
section.cta { margin-top: 46px; padding-top: 30px; border-top: 1px solid var(--hair); }
        .ctline { color: var(--ink); font-size: 16px; font-weight: 500; line-height: 1.6; margin: 0 0 18px; max-width: 60ch; }
        .ctrow { display: flex; gap: 12px; flex-wrap: wrap; }
        .ct-primary { background: var(--green); color: #ffffff; font-family: var(--mono); font-weight: 800; font-size: 13px; letter-spacing: 0.3px; padding: 13px 20px; border-radius: 12px; box-shadow: 0 6px 26px rgba(13,148,72,0.28); transition: transform 0.15s ease; }
        .ct-primary:hover { transform: translateY(-1px); }
        .ct-secondary { border: 1px solid var(--hair); color: var(--ink); font-family: var(--mono); font-weight: 700; font-size: 13px; letter-spacing: 0.3px; padding: 13px 20px; border-radius: 12px; }
        .ct-secondary:hover { border-color: var(--green); color: var(--green); }

        .foot :global(a) { color: var(--dim); }

        @media (max-width: 560px) {
          h1 { font-size: 28px; }
          h2 { font-size: 22px; }
          .num { font-size: 52px; }
          .cmeta { gap: 18px; }
          .step { grid-template-columns: 28px 1fr; gap: 12px; }
          .skey { width: 26px; height: 26px; font-size: 12px; }
          .wrow { grid-template-columns: 118px 1fr; gap: 10px; }
          .tier { grid-template-columns: 1fr auto; }
          .ttier { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
        }
      `}</style>
    </>
  );
}

// Small band diagram: the projected range on the 205 to 275 gauge scale, with the
// pass line and national mean marked. Reuses gpct() so the geometry matches the app gauge.
function BandDiagram({ low, high, center }: { low: number; high: number; center: number }) {
  return (
    <div className="bd">
      <div className="track">
        <div className="band" style={{ left: gpct(low) + '%', width: (gpct(high) - gpct(low)) + '%' }} />
        <div className="ctr" style={{ left: gpct(center) + '%' }} />
        <div className="mk pass" style={{ left: gpct(PASS) + '%' }} />
        <div className="mk mean" style={{ left: gpct(MEAN) + '%' }} />
        <div className="lbl pass" style={{ left: gpct(PASS) + '%' }}>{PASS} pass</div>
        <div className="lbl mean" style={{ left: gpct(MEAN) + '%' }}>avg {MEAN}</div>
        <div className="lbl ctr" style={{ left: gpct(center) + '%' }}>{center}</div>
      </div>
      <div className="scale"><span>{GMIN}</span><span>{low} to {high}</span><span>{GMAX}</span></div>
      <style jsx>{`
        .bd { margin: 6px 0 4px; max-width: 440px; }
        .track { position: relative; height: 12px; background: var(--bg3); border: 1px solid var(--hair); border-radius: 999px; margin-top: 34px; }
        .band { position: absolute; top: -1px; bottom: -1px; background: linear-gradient(90deg, rgba(240,180,41,0.5), var(--gold)); border-radius: 999px; box-shadow: 0 0 14px rgba(240,180,41,0.4); }
        .ctr { position: absolute; top: -3px; width: 2px; height: 18px; background: var(--ink); transform: translateX(-1px); box-shadow: 0 0 6px rgba(25,28,35,0.35); }
        .mk { position: absolute; top: -4px; width: 2px; height: 20px; transform: translateX(-1px); }
        .mk.pass { background: var(--red); } .mk.mean { background: var(--dim); }
        .lbl { position: absolute; top: -28px; transform: translateX(-50%); font-family: var(--mono); font-size: 9px; letter-spacing: 0.3px; white-space: nowrap; }
        .lbl.pass { color: var(--red); } .lbl.mean { color: var(--dim); } .lbl.ctr { color: var(--gold); font-weight: 700; top: -46px; }
        .scale { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; color: var(--faint); margin-top: 10px; }
      `}</style>
    </div>
  );
}
