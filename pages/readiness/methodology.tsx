import Head from 'next/head';
import Link from 'next/link';
import { AppShell, ArticleBody, ArticleHeader, Hero, Icon, Section } from '../../components/app';
import { ToolEndBand } from '../../components/app/tools/asks';
import { RangeGauge } from '../../components/app/tools/ReadinessViz';
import {
  PASS, CAL, NORM,
  computeReadiness, decayAnchor, effectiveDays, bandHalfWidth, shortTier,
  percentile, ordinal,
  type Entry, type Parsed,
} from '../../lib/readiness';
import { track, referrerHost } from '../../lib/analytics';

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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <AppShell campaign="methodology_web">
        <Hero>
          <ArticleHeader
            category="step2"
            byline={false}
            crumb={[{ href: '/readiness', label: 'Readiness check' }, { label: 'Methodology' }]}
            eyebrow="Methodology"
            title={TITLE}
            accent="score predictor works"
            dek={<>
              The only Step 2 CK score predictor that shows its work. Every number on this page is the live
              output of the same model that runs in the app and on the readiness check, the same code, no
              marketing math. Here is exactly how your practice tests become a projected range.
            </>}
          />
        </Hero>

        <ArticleBody toc={[
          ['predicts', 'What it predicts'], ['model', 'The model, step by step'], ['quirks', 'Form scale quirks'],
          ['limits', 'Calibration and its limits'], ['blind', 'The blind test'], ['beat', 'The beat curve'], ['loop', 'Closing the loop'],
        ]}>
          {/* 1. WHAT IT PREDICTS */}
          <Section id="predicts" n="01" title="A projected Step 2 CK score, as a range.">
            <div className="mk isl">
              <p className="prs">
                You enter your NBME and UWorld Self-Assessment scores. The model returns a projected Step 2 CK
                score as a <b>range</b>, not a single number and not a guarantee. It is free, needs no sign-up,
                and runs entirely in your browser. A range is the honest output: any single practice test carries
                roughly 8 to 9 points of form noise, so a lone point estimate would imply a precision the data
                does not support.
              </p>
            </div>
          </Section>

          {/* 2. THE MODEL STEP BY STEP */}
          <Section id="model" n="02" title="From your scores to a range, in six steps.">
            <div className="mk isl">
              <p className="prs">
                We will follow one real set of eight practice tests through all six steps. Every figure below,
                including the card, is computed on this page by calling the model directly, so what you read is
                what a student with these scores actually sees.
              </p>

              {/* live worked-example result card */}
              <div className="sheet mt-card" role="figure" aria-label="Worked example result">
                <div className="sheet-hd"><span className="lbl"><span className="dot gold" aria-hidden="true" />Projected Step 2 CK</span></div>
                <div className="sheet-bd">
                  <p className="mt-num"><span className="num">{p.center}</span><small className="num">{p.low} to {p.high}</small></p>
                  <p className="mt-csub">anchor <b>{anchor}</b> <span aria-hidden="true">&middot;</span> about the <b>{ordinal(pct)}</b> percentile vs US first-takers</p>
                  <dl className="mt-meta">
                    <div><dt className="lbl">Anchor</dt><dd className="num">{anchor}</dd></div>
                    <div><dt className="lbl">Range</dt><dd className="num">{p.low} to {p.high}</dd></div>
                    <div><dt className="lbl">Percentile</dt><dd className="num">{ordinal(pct)}</dd></div>
                    <div><dt className="lbl">Tests</dt><dd className="num">{parsed.length}</dd></div>
                  </dl>
                </div>
              </div>

              <ol className="mt-steps">
                {/* a. inputs */}
                <li className="mt-step">
                  <span className="mt-key" aria-hidden="true">a</span>
                  <div className="mt-sb">
                    <h3 className="h-3">Your inputs</h3>
                    <p>
                      Two kinds of practice test, each a three-digit score: NBME forms 9 to 16, and UWorld
                      Self-Assessments 1 to 3. Optionally, how many days before your exam you took each one. Dates
                      make the projection sharper, but the model works without them.
                    </p>
                    <p className="mt-ex">
                      Worked example, undated: NBME 12 = 218, NBME 13 = 235, NBME 14 = 235, UWSA 1 = 232,
                      UWSA 3 = 204, NBME 15 = 240, UWSA 2 = 214, NBME 16 = 245.
                    </p>
                  </div>
                </li>

                {/* b. anchor */}
                <li className="mt-step">
                  <span className="mt-key" aria-hidden="true">b</span>
                  <div className="mt-sb">
                    <h3 className="h-3">The anchor: a recency-weighted average</h3>
                    <p>
                      Your scores collapse into one number, the <b>anchor</b>. Not a flat average: each test is
                      weighted by how recent it is, because a test from last week predicts exam day better than one
                      from two months ago. The weight decays exponentially with how many days before the exam you
                      took it.
                    </p>
                    <p className="mt-fx">
                      weight = exp( -daysOut / tau ),&nbsp;&nbsp; tau = {CAL.tau}
                    </p>
                    <p>
                      That is a <b>{halfLife} day half-life</b>: a test taken {halfLife} days earlier counts about
                      half as much as your freshest one. The anchor is the weighted average of every score under
                      those weights.
                    </p>
                  </div>
                </li>

                {/* c. hybrid fallback + weight bars */}
                <li className="mt-step">
                  <span className="mt-key" aria-hidden="true">c</span>
                  <div className="mt-sb">
                    <h3 className="h-3">No dates? A hybrid recency fallback</h3>
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
                </li>
              </ol>

              {/* weight panel, on the live example */}
              <div className="sheet mt-panel" role="figure" aria-label="Anchor weights on the worked example">
                <div className="sheet-hd"><span className="lbl">Anchor weights</span></div>
                <div className="sheet-bd">
                  <p className="mt-pt">How much each test counts, freshest first</p>
                  <p className="mt-pnote">
                    NBME 16 (245) is the latest real form, so it carries <b>{rows[0].wpct.toFixed(1)}%</b>. The
                    three UWSAs sit together at the median NBME recency, so none of them, including the 214, gets
                    to masquerade as freshest.
                  </p>
                  <p className="mt-legend">
                    <span><i className="nb" aria-hidden="true" />NBME</span>
                    <span><i className="uw" aria-hidden="true" />UWSA (pinned to median NBME recency)</span>
                  </p>
                  <ul className="mt-wrows">
                    {rows.map((r) => {
                      const pin = r.freshest && !r.isU ? 'latest real form' : r.isU ? 'pinned to median' : '';
                      return (
                        <li className={'mt-wrow ' + (r.isU ? 'uwsa' : 'nbme')} key={r.form}>
                          <div className="mt-wname">
                            <span className="mt-wf">{r.form}</span><span className="mt-wsc num">{r.score}</span>
                            {pin && <span className="mt-wpin">{pin}</span>}
                          </div>
                          <div className="mt-wbar">
                            <div className="mt-wfill" style={{ width: (r.wpct / maxW) * 100 + '%' }} />
                            {r.freshest && <span className="mt-wlead">freshest</span>}
                            <span className="mt-wwt num">{r.wpct.toFixed(1)}%</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-pfoot">
                    The number tracks the NBME line, not the typing order. The latest real NBME is 245 and the
                    NBME trend is 240 then 245, so the anchor lands at {anchor}, and the projection just above the
                    freshest form. A trailing UWSA can still lower the anchor if it genuinely is one of the recent
                    tests, it just no longer wins freshest by convention.
                  </p>
                </div>
              </div>

              <ol className="mt-steps" start={4}>
                {/* d. shrinkage */}
                <li className="mt-step">
                  <span className="mt-key" aria-hidden="true">d</span>
                  <div className="mt-sb">
                    <h3 className="h-3">Shrink toward the mean, then add the measured gain</h3>
                    <p>The anchor is not the projection. Two corrections turn it into a center.</p>
                    <p className="mt-fx">
                      center = {CAL.mean} + {CAL.slope} x ( anchor - {CAL.mean} ) + {CAL.delta}
                    </p>
                    <p>
                      The <b>{CAL.slope}</b> multiplier is a Thorndike Case II range-restriction correction.
                      Practice tests spread wider than the real exam does, so raw highs and lows are pulled back
                      toward the population mean of {CAL.mean}. An anchor below the mean is nudged up, a high anchor
                      is nudged down. The <b>+{CAL.delta}</b> is the level offset: across the validation cohort,
                      students outscored their recency-decay anchor by about {CAL.delta} points on the real exam,
                      on average.
                    </p>
                    <p className="mt-ex">
                      Worked example: anchor {anchor} shrinks to {CAL.mean} + {CAL.slope} x ({anchor} - {CAL.mean})
                      = {shrunk.toFixed(1)}, plus {CAL.delta} gives {rawCenter.toFixed(1)}, rounded to a center of <b>{p.center}</b>.
                    </p>
                  </div>
                </li>

                {/* e. band */}
                <li className="mt-step">
                  <span className="mt-key" aria-hidden="true">e</span>
                  <div className="mt-sb">
                    <h3 className="h-3">The band width: tight when close, wide when far</h3>
                    <p>
                      The half-width of the range depends on how near your freshest test is to exam day. The closer
                      you are, the more your practice scores have converged, so the tighter the honest interval.
                    </p>
                    <ul className="mt-tiers">
                      {tiers.map((t) => (
                        <li key={t.when}>
                          <span className="mt-twhen">{t.when}</span>
                          <span className="mt-tband num">plus or minus {t.band}</span>
                          <span className="mt-ttier">{shortTier(t.tier)}</span>
                        </li>
                      ))}
                    </ul>
                    <p>
                      A guardrail widens the band whenever the anchor sits at or below the {PASS} pass line, where
                      the low tail is least tested. There the band opens to at least {guardBand} points and the read
                      is flagged high uncertainty.
                    </p>
                    <p className="mt-ex">
                      Worked example: the freshest test is undated, so the band is plus or minus {p.band}, giving
                      the {p.low} to {p.high} range below. Add your exam date and it tightens.
                    </p>
                    <BandDiagram low={p.low} high={p.high} center={p.center} />
                  </div>
                </li>

                {/* f. percentile */}
                <li className="mt-step">
                  <span className="mt-key" aria-hidden="true">f</span>
                  <div className="mt-sb">
                    <h3 className="h-3">Where that lands nationally</h3>
                    <p>
                      The center is turned into a percentile by interpolating the official USMLE Score
                      Interpretation Guidelines norm table (LCME first-takers, N about {NORM_N}). It answers a
                      different question than pass or fail: of every US first-taker, how many scored at or below
                      this.
                    </p>
                    <ul className="mt-norm" role="figure" aria-label="Score to percentile norm marks">
                      {normMarks.map((n) => {
                        const near = p.center >= n.s - 5 && p.center < n.s + 5;
                        return (
                          <li className={'mt-ncell' + (near ? ' near' : '')} key={n.s}>
                            <span className="ns num">{n.s}</span>
                            <span className="np num">{ordinal(n.pctl)}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-ex">
                      Worked example: a center of {p.center} interpolates to about the {ordinal(pct)} percentile,
                      between the {percentile(245)} at 245 and the {percentile(250)} at 250.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </Section>

          {/* 2b. FORM SCALE QUIRKS (decision 0013) */}
          <Section id="quirks" n="02b" title="Three forms print off the common scale, so they get translated.">
            <div className="mk isl">
              <p className="prs">
                Fit on 160 students and 1,043 dated forms with person and timing controls: old
                <b> NBME 9 prints about 5.5 low</b> (we credit it back), <b>UWSA 2 prints about 4.8
                hot</b> (translated down), and <b>UWSA 3 about 6.3 low</b> on thinner data. Modern
                NBMEs, forms 10 through 16, are equated by NBME itself and enter at face value: a
                printed NBME score is never counted down here. NBME 16 does print a few points high,
                but students who print high on 16 really do score high, so translating it away would
                under-project; it stays at face value. And no, forms do not carry hidden weights
                beyond their dates: we tested that too, and recency carries all of it.
              </p>
            </div>
          </Section>

          {/* 3. CALIBRATION AND LIMITS */}
          <Section id="limits" n="03" title="How it is calibrated, and where it stops.">
            <div className="mk isl">
              <p className="prs">
                Those constants are not guesses. They were fit against about <b>{SAMPLE_N}</b> real paired
                outcomes: a student&apos;s pre-exam practice scores, then their actual Step 2 CK, gathered from public
                r/step2 score-release threads. Three choices we made on purpose, in the name of not overselling.
              </p>
              <ul className="mt-limits">
                <li>
                  <p className="lbl">Held wide on purpose</p>
                  <p>
                    The sample is high-performer selected. People who post score releases skew high, the actuals
                    average well above the national mean, and the low tail is thin. So the band is deliberately
                    held <b>wide</b> rather than tightened to fit this rosy sample. A narrower band would look
                    more confident and be less honest.
                  </p>
                </li>
                <li>
                  <p className="lbl">Ranges, not fake precision</p>
                  <p>
                    The interval targets roughly the middle 60% of outcomes, not a 95% guarantee. The slope is
                    held at {CAL.slope} rather than the flatter value this restricted sample suggests, because a
                    flatter slope would badly over-project weak students, the ones who most need an honest low
                    read.
                  </p>
                </li>
                <li>
                  <p className="lbl">Not a guarantee</p>
                  <p>
                    It is a projection from practice tests. Any individual can land outside the range. Treat it as
                    a compass heading, not a diagnosis.
                  </p>
                </li>
              </ul>
              <p className="prs">
                It will sharpen as real in-app outcomes accrue, students who log a practice score and later log
                their actual Step 2, a sample that is not high-performer truncated. When that set is large enough
                to disagree with this one, the constants move, on data, not on vibes.
              </p>
            </div>
          </Section>

          {/* 04. THE BLIND TEST (out-of-sample, Aug 2026 wave) */}
          <Section id="blind" n="04" title="Fit on the past, scored on the future.">
            <div className="mk isl">
              <p className="prs">
                Most score converters have never been tested on people they were not fit on. This one has.
                Before the August 2026 score release, the model&apos;s projections were locked for <b>32 students</b>
                {' '}from the newest release thread, none of whom were in the calibration set. When their real
                scores dropped: <b>average miss 4.1 points</b>, average signed error <b>+0.97</b> (essentially
                unbiased), <b>88% landed within 7 points</b> and 94% within 8. Those numbers are what the band
                width claims they should be, which is the whole point of publishing them.
              </p>
            </div>
          </Section>

          {/* 05. THE BEAT CURVE */}
          <Section id="beat" n="05" title="How far past their last practice form do people actually land?">
            <div className="mk isl">
              <p className="prs">
                Across <b>150 reports</b> with an exact outcome and a dated final form, actual score minus the
                freshest practice form has a <b>median of +9</b>. Half of students land between <b>+1 and +14</b>.
                The full range runs <b>-20 to +35</b>, and about <b>1 in 6 land below</b> their freshest form,
                which is why a projection that just adds a fixed bonus to your last NBME is flattering rather
                than honest. The model earns the middle of this curve through recency weighting and calibration,
                and the band width covers its tails.
              </p>
              <ul className="mt-norm mt-beat" role="figure" aria-label="Beat distribution percentiles">
                <li className="mt-ncell"><span className="ns">p10</span><span className="np num">-3</span></li>
                <li className="mt-ncell"><span className="ns">p25</span><span className="np num">+1</span></li>
                <li className="mt-ncell near"><span className="ns">median</span><span className="np num">+9</span></li>
                <li className="mt-ncell"><span className="ns">p75</span><span className="np num">+14</span></li>
                <li className="mt-ncell"><span className="ns">p90</span><span className="np num">+18</span></li>
              </ul>
            </div>
          </Section>

          {/* 06. CLOSING THE LOOP */}
          <Section id="loop" n="06" title="Predictions locked before the exam, paired with real scores after.">
            <div className="mk isl">
              <p className="prs">
                Since July 2026 the app freezes every student&apos;s projection on their exam day, before any result
                exists. When they later report their real score, one tap in the app or from an email, the pair
                becomes a true blind data point: what the model said then, against what actually happened. These
                app-native pairs have none of the good-news bias of public score threads, and as they accumulate
                they drive the next refit. Scores are anonymous, linked only to the account, and only ever used
                in aggregate.
              </p>
            </div>
          </Section>
        </ArticleBody>

        {/* The soft ask: ct=methodology_web, GA4 source=methodology, as before; the old `cta` slot reports as `end`. */}
        <ToolEndBand
          id="mt-end"
          title="Help make it sharper."
          body="When you get your real Step 2 score, log it, every real outcome pulls these numbers closer to the truth."
          button="Get Step Gunner"
          params={{ source: 'methodology' }}
          secondary={
            <Link href="/readiness" className="lnk on-dark" onClick={() => track('methodology_run_check', { location: 'cta', ref: referrerHost() })}>
              Run your readiness check<Icon name="arrow" sm />
            </Link>
          }
        />
      </AppShell>

      <style jsx global>{`
        .mk .mt-card { margin-top: 24px; max-width: 560px; }
        .mk .mt-card .sheet-hd .lbl { display: inline-flex; align-items: center; gap: 8px; }
        .mk .mt-num { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 16px; font: 800 58px/1 var(--f-sans); letter-spacing: -.03em; color: var(--ink); }
        .mk .mt-num .num { font-family: var(--f-sans); }
        .mk .mt-num small { font: 700 23px/1.2 var(--f-sans); letter-spacing: -.01em; color: var(--ink-2); }
        .mk .mt-csub { margin-top: 12px; font: 500 15px/1.5 var(--f-mono); color: var(--ink-2); }
        .mk .mt-csub b { color: var(--ink); }
        .mk .mt-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 20px; padding-top: 16px; box-shadow: inset 0 1px 0 var(--line); }
        .mk .mt-meta dd { margin-top: 4px; font: 800 21px/1.2 var(--f-sans); color: var(--ink); }
        .mk .mt-steps { display: grid; gap: 32px; margin-top: 32px; }
        .mk .mt-step { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 16px; }
        .mk .mt-key { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; background: var(--step2-tint); color: var(--step2); font: 700 16px/1 var(--f-mono); }
        .mk .mt-sb { min-width: 0; }
        .mk .mt-sb .h-3 { font-size: 21px; padding-top: 2px; }
        .mk .mt-sb p { margin-top: 12px; font-size: 18px; line-height: 1.65; color: var(--ink-2); max-width: 66ch; }
        .mk .mt-sb p b { color: var(--ink); font-weight: 600; }
        .mk .mt-ex, .mk .mt-sb p.mt-ex { padding-left: 12px; box-shadow: inset 2px 0 0 var(--line-2); font: 500 15px/1.65 var(--f-mono); color: var(--ink-3); }
        .mk .mt-sb p.mt-ex b { color: var(--ink-2); }
        .mk .mt-fx, .mk .mt-sb p.mt-fx { padding: 12px 16px; border-radius: var(--r-sm); background: var(--st-card); color: var(--st-ink); font: 600 16px/1.6 var(--f-mono); font-feature-settings: "zero" 1; overflow-wrap: anywhere; }
        .mk .mt-panel { margin-top: 32px; }
        .mk .mt-pt { font: 700 19px/1.3 var(--f-sans); color: var(--ink); }
        .mk .mt-pnote { margin-top: 8px; font-size: 16px; line-height: 1.55; color: var(--ink-2); max-width: 60ch; }
        .mk .mt-pnote b { color: var(--ink); font-weight: 600; }
        .mk .mt-legend { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 16px; font: 600 13px/1.4 var(--f-mono); color: var(--ink-2); }
        .mk .mt-legend span { display: inline-flex; align-items: center; gap: 8px; }
        .mk .mt-legend i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; }
        .mk .mt-legend .nb, .mk .mt-wrow.nbme .mt-wfill { background: var(--wards); }
        .mk .mt-legend .uw, .mk .mt-wrow.uwsa .mt-wfill { background: var(--key); }
        .mk .mt-wrows { margin-top: 12px; }
        .mk .mt-wrow { display: grid; grid-template-columns: minmax(0, 132px) minmax(0, 1fr); gap: 12px; align-items: center; padding: 8px 0; box-shadow: inset 0 -1px 0 var(--line); }
        .mk .mt-wrow:last-child { box-shadow: none; }
        .mk .mt-wname { font: 700 15px/1.3 var(--f-mono); color: var(--ink); min-width: 0; }
        .mk .mt-wrow.uwsa .mt-wf { color: var(--key); }
        .mk .mt-wsc { margin-left: 8px; color: var(--ink-3); font-weight: 600; }
        .mk .mt-wpin { display: block; margin-top: 2px; font: 600 13px/1.3 var(--f-mono); color: var(--ink-3); }
        .mk .mt-wbar { position: relative; height: 28px; border-radius: 8px; background: var(--card-2); box-shadow: inset 0 0 0 1px var(--line); overflow: hidden; }
        .mk .mt-wfill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 8px 0 0 8px; opacity: .9; }
        .mk .mt-wwt { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font: 700 13px/1 var(--f-mono); color: var(--ink); padding: 2px 4px; border-radius: 4px; background: var(--card); }
        .mk .mt-wlead { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font: 700 13px/1 var(--f-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--on-act); }
        .mk .mt-pfoot { margin-top: 16px; padding-top: 16px; box-shadow: inset 0 1px 0 var(--line); font-size: 15px; line-height: 1.6; color: var(--ink-3); max-width: 64ch; }
        .mk .mt-tiers { margin-top: 12px; border-radius: var(--r-md); background: var(--card); box-shadow: inset 0 0 0 1px var(--line); max-width: 560px; }
        .mk .mt-tiers li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 12px; align-items: center; padding: 12px 16px; }
        .mk .mt-tiers li + li { box-shadow: inset 0 1px 0 var(--line); }
        .mk .mt-twhen { font-size: 16px; color: var(--ink); }
        .mk .mt-tband { font-size: 15px; font-weight: 700; color: var(--ink); white-space: nowrap; }
        .mk .mt-ttier { grid-column: 1 / -1; justify-self: start; padding: 0 8px; border-radius: 8px; font: 600 13px/24px var(--f-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--step2); background: var(--step2-tint); }
        .mk .mt-norm { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 8px; margin-top: 16px; max-width: 560px; }
        .mk .mt-ncell { min-width: 0; padding: 12px 4px; border-radius: 12px; text-align: center; background: var(--card); box-shadow: inset 0 0 0 1px var(--line); }
        .mk .mt-ncell .ns { display: block; font: 800 16px/1.2 var(--f-mono); color: var(--ink); }
        .mk .mt-ncell .np { display: block; margin-top: 4px; font: 600 13px/1.2 var(--f-mono); color: var(--ink-2); }
        .mk .mt-ncell.near { background: var(--step2-tint); box-shadow: inset 0 0 0 2px var(--step2); }
        .mk .mt-beat .ns { font-size: 13px; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-3); }
        .mk .mt-beat .np { font: 800 19px/1.2 var(--f-mono); color: var(--ink); }
        .mk .mt-limits { display: grid; gap: 12px; margin-top: 16px; }
        .mk .mt-limits li { padding: 16px 20px; border-radius: var(--r-md); background: var(--card); box-shadow: inset 4px 0 0 var(--step2), inset 0 0 0 1px var(--line); }
        .mk .mt-limits .lbl { color: var(--step2); }
        .mk .mt-limits p + p { margin-top: 8px; color: var(--ink-2); line-height: 1.6; }
        .mk .mt-limits b { color: var(--ink); font-weight: 600; }
        @media (min-width: 600px) { .mk .mt-meta { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        @media (min-width: 760px) {
          .mk .mt-tiers li { grid-template-columns: minmax(0, 1fr) auto 120px; }
          .mk .mt-ttier { grid-column: auto; justify-self: end; }
        }
      `}</style>
    </>
  );
}

// Small band diagram: the projected range on the 205 to 275 gauge scale, with the
// pass line and national mean marked. The same gauge as the readiness tool, drawn for
// a white page.
function BandDiagram({ low, high, center }: { low: number; high: number; center: number }) {
  return (
    <div className="mk isl"><div className="mt-bd"><RangeGauge low={low} high={high} center={center} light showCenterLabel /></div>
      <style jsx global>{`.mk .mt-bd { max-width: 480px; margin-top: 8px; padding-bottom: 4px; }`}</style>
    </div>
  );
}
