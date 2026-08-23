// Research post: what 269 r/step2 score reports say about NBME/UWSA -> Step 2 CK.
// Semi-academic structure (summary, methods, results, limitations, data), written
// in Danny's voice, with the six figures rendered from the calibration data
// (gunner repo: docs/blog/figures/render.py), an inline "try it" calculator that
// runs the SAME lib/readiness math the predictor uses, and the live out-of-sample
// record pulled server-side from the track_record_json endpoint (decision 0015).
// No em or en dashes anywhere in the copy (site rule).
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { GetServerSideProps } from 'next';
import LabLayout from '../../components/LabLayout';
import { FORMS, computeReadiness, calibratedCenter, CAL, FORM_OFFSETS, type Entry } from '../../lib/readiness';
import { appStoreUrl, track, referrerHost } from '../../lib/analytics';

const CAMPAIGN = 'research_nbme_step2';
const TRACK_RECORD_URL = 'https://us-central1-stepgunner-79ae7.cloudfunctions.net/track_record_json';
const PUBLISHED = '2026-08-23';

type Summary = { n: number; inside: number; within7Pct: number; medianAbsErr?: number };
type Record = { n: number; insideOf10: number; shown: number; medianAbsErr: number; within7PctAll: number;
  bySource?: { app?: Summary; forum?: Summary }; computedAt?: number } | null;

function Fig({ src, alt, caption, n }: { src: string; alt: string; caption: string; n: number }) {
  return (
    <figure className="fig">
      <img src={src} alt={alt} loading="lazy" />
      <figcaption><b>Figure {n}.</b> {caption}</figcaption>
    </figure>
  );
}

// The inline calculator: three rows, same engine as /readiness.
function TryIt() {
  const [rows, setRows] = useState<Entry[]>([
    { form: 'NBME 14', score: '240', days: '21' },
    { form: 'UWSA 2', score: '250', days: '7' },
    { form: 'NBME 9', score: '', days: '' },
  ]);
  const res = useMemo(() => computeReadiness(rows), [rows]);
  const set = (i: number, k: keyof Entry, v: string) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: v } : row)));
  const proj = res.proj;
  return (
    <div className="tryit">
      <div className="tryit-h">Try it with your own forms</div>
      <div className="tryit-sub">Same math as the calculator in the app and at <Link href="/readiness">/readiness</Link>. Nothing you type leaves the page.</div>
      {rows.map((r, i) => (
        <div className="tryit-row" key={i}>
          <select value={r.form} onChange={(e) => set(i, 'form', e.target.value)} aria-label="Form">
            {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <input inputMode="numeric" placeholder="score" value={r.score} onChange={(e) => set(i, 'score', e.target.value)} aria-label="Score" />
          <input inputMode="numeric" placeholder="days before exam" value={r.days} onChange={(e) => set(i, 'days', e.target.value)} aria-label="Days before exam" />
        </div>
      ))}
      <div className="tryit-out">
        {proj ? (
          <>
            <div className="tryit-num">{proj.low}<span>to</span>{proj.high}</div>
            <div className="tryit-cap">Most likely about <b>{proj.center}</b>. {proj.tier} band, half-width {proj.band}.{proj.lowAnchor ? ' Low anchor: the band is widened on purpose.' : ''}</div>
          </>
        ) : (
          <div className="tryit-cap">Enter at least one three-digit NBME or UWSA score.</div>
        )}
      </div>
      <div className="tryit-foot">
        Form offsets applied before the anchor: {Object.entries(FORM_OFFSETS).map(([f, v]) => `${f} ${v > 0 ? '+' : ''}${v}`).join(', ')}. Recency half-life about {Math.round(CAL.tau * Math.log(2))} days. Projection = {CAL.mean} + {CAL.slope} x (anchor minus {CAL.mean}) + {CAL.delta}.
      </div>
    </div>
  );
}

export default function Research({ record }: { record: Record }) {
  const app = record?.bySource?.app;
  const forum = record?.bySource?.forum;
  const asOf = record?.computedAt ? new Date(record.computedAt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  const store = appStoreUrl(CAMPAIGN);
  const title = 'I pulled 269 NBME to Step 2 score pairs off Reddit. Here is what actually predicts your score.';
  const desc = 'A medical student\'s analysis of 269 r/step2 score reports: how far above your NBME average you land, which forms read high or low, how much recency matters, and how the model does on students it never trained on.';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: title,
    description: desc,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    author: { '@type': 'Person', name: 'Danny Varghese', description: 'MS4, Texas A&M College of Medicine', url: 'https://stepgunner.com' },
    publisher: { '@type': 'Organization', name: 'Step Gunner', url: 'https://stepgunner.com' },
    image: 'https://stepgunner.com/og/research-nbme-step2.png',
    mainEntityOfPage: 'https://stepgunner.com/research/nbme-to-step-2',
    about: ['USMLE Step 2 CK', 'NBME self-assessment', 'UWSA', 'score prediction'],
  };

  return (
    <LabLayout
      eyebrow="Research"
      title="What actually predicts your Step 2 score"
      lede={<>269 r/step2 score reports, one calibrated model, and its out-of-sample record, updated every Monday. Written by a medical student who believed the folklore until he checked it.</>}
      crumb={[{ href: '/readiness', label: 'Readiness check' }, { href: '/research/nbme-to-step-2', label: 'Research' }]}
      metaTitle="NBME to Step 2 CK: what 269 Reddit score reports actually show | Step Gunner Research"
      metaDesc={desc}
      campaign={CAMPAIGN}
      head={<>
        <link rel="canonical" href="https://stepgunner.com/research/nbme-to-step-2" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:image" content="https://stepgunner.com/og/research-nbme-step2.png" />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </>}
    >
      <style jsx global>{`
        .prose h2 { font-size: 23px; font-weight: 800; letter-spacing: -0.4px; margin: 44px 0 12px; }
        .prose h3 { font-size: 17px; font-weight: 700; margin: 26px 0 8px; }
        .prose p { color: var(--ink-dim); font-size: 15.5px; line-height: 1.75; margin: 0 0 14px; }
        .prose p strong, .prose li strong { color: var(--ink); }
        .prose ul { margin: 0 0 16px 22px; } .prose li { color: var(--ink-dim); font-size: 15.5px; line-height: 1.7; margin-bottom: 7px; } .prose li::marker { color: var(--green); }
        .prose a { color: var(--blue); } .prose a:hover { text-decoration: underline; }
        .byline { display: flex; flex-wrap: wrap; gap: 8px 18px; font-family: var(--mono); font-size: 11px; color: var(--ink-faint); letter-spacing: 0.3px; margin: -8px 0 24px; }
        .byline b { color: var(--ink-dim); font-weight: 600; }
        .abstract { background: var(--bg-2); border: 1px solid var(--hair-strong); border-radius: 16px; padding: 20px 22px; margin-bottom: 18px; }
        .abstract .k { font-family: var(--mono); font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: var(--green); margin-bottom: 8px; }
        .abstract p { font-size: 15px; margin: 0; color: var(--ink); line-height: 1.75; }
        .pitch { margin: 18px 0 8px; background: var(--ink); border-radius: 18px; padding: 22px 22px 20px; color: #ffffff; position: relative; overflow: hidden; }
        .pitch:before { content: ""; position: absolute; inset: 0; background: radial-gradient(60% 90% at 85% 0%, rgba(240,180,41,0.22), transparent 60%); }
        .pitch > * { position: relative; }
        .pitch .pk { font-family: var(--mono); font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.55); }
        .pitch .ph { font-size: 19px; font-weight: 800; margin: 6px 0 6px; letter-spacing: -0.3px; }
        .pitch .ps { font-size: 14px; color: rgba(255,255,255,0.72); line-height: 1.6; max-width: 56ch; margin: 0 0 14px; }
        .pitch .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .pitch .btn-store { display: inline-flex; align-items: center; gap: 9px; background: var(--gold); color: #1a1403; font-weight: 800; font-size: 14px; padding: 12px 18px; border-radius: 12px; }
        .pitch .btn-store:hover { filter: brightness(1.06); }
        .pitch .btn-calc { display: inline-flex; align-items: center; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.28); color: #fff; font-weight: 700; font-size: 14px; }
        .pitch .ptrust { font-family: var(--mono); font-size: 10.5px; color: rgba(255,255,255,0.5); margin-top: 12px; }
        .fig { margin: 22px 0 28px; }
        .fig img { width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--hair); background: var(--bg); display: block; }
        .fig figcaption { font-size: 13px; color: var(--ink-dim); line-height: 1.6; margin-top: 10px; } .fig figcaption b { color: var(--ink); }
        .tbl { width: 100%; border-collapse: collapse; margin: 8px 0 24px; font-size: 14.5px; background: var(--bg-2); border: 1px solid var(--hair); border-radius: 12px; overflow: hidden; }
        .tbl th { text-align: left; font-family: var(--mono); font-size: 10.5px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-faint); padding: 9px 12px; border-bottom: 1px solid var(--hair-strong); background: var(--bg-3); }
        .tbl td { padding: 9px 12px; border-bottom: 1px solid var(--hair); color: var(--ink-dim); } .tbl tr:last-child td { border-bottom: 0; }
        .tbl td.n, .tbl th.n { text-align: right; font-family: var(--mono); } .tbl td.n b { color: var(--ink); }
        .eq { font-family: var(--mono); font-size: 14px; color: var(--ink); background: var(--bg-2); border: 1px solid var(--hair-strong); border-radius: 10px; padding: 12px 16px; margin: 10px 0 16px; overflow-x: auto; }
        .live { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0 20px; }
        .live .c { background: var(--bg-2); border: 1px solid var(--hair-strong); border-radius: 12px; padding: 14px; }
        .live .c .n { font-family: var(--mono); font-size: 26px; font-weight: 800; color: var(--ink); line-height: 1; } .live .c .n span { font-size: 13px; color: var(--ink-faint); font-weight: 500; }
        .live .c .l { font-family: var(--mono); font-size: 10px; letter-spacing: 1.4px; text-transform: uppercase; color: var(--ink-faint); margin-top: 8px; line-height: 1.5; }
        .tryit { background: var(--bg-2); border: 1px solid var(--hair-strong); border-radius: 16px; padding: 18px; margin: 16px 0 28px; }
        .tryit-h { font-size: 16px; font-weight: 800; } .tryit-sub { font-size: 13px; color: var(--ink-dim); margin: 4px 0 14px; } .tryit-sub a { color: var(--blue); }
        .tryit-row { display: grid; grid-template-columns: 1.3fr 1fr 1.2fr; gap: 8px; margin-bottom: 8px; }
        .tryit select, .tryit input { background: var(--bg-3); border: 1px solid var(--hair-strong); border-radius: 10px; color: var(--ink); font-family: var(--mono); font-size: 13px; padding: 10px 11px; width: 100%; }
        .tryit select:focus, .tryit input:focus { border-color: var(--green); outline: none; }
        .tryit-out { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--hair); text-align: center; }
        .tryit-num { font-family: var(--mono); font-size: 40px; font-weight: 800; letter-spacing: -1px; color: var(--gold); } .tryit-num span { font-size: 15px; color: var(--ink-dim); margin: 0 8px; font-weight: 600; }
        .tryit-cap { font-size: 13.5px; color: var(--ink-dim); margin-top: 6px; } .tryit-cap b { color: var(--ink); }
        .tryit-foot { font-family: var(--mono); font-size: 10.5px; color: var(--ink-faint); margin-top: 12px; line-height: 1.6; text-align: left; }
        .cta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 28px 0 10px; }
        .cta a { display: block; text-align: center; padding: 16px 14px; border-radius: 12px; font-weight: 800; font-size: 14px; }
        .cta a:hover { filter: brightness(1.05); }
        .cta .pri { background: var(--ink); color: #fff; } .cta .sec { border: 1px solid var(--hair-strong); color: var(--ink); background: var(--bg-2); }
        .cta small { display: block; font-family: var(--mono); font-size: 10px; letter-spacing: 1px; text-transform: uppercase; opacity: 0.65; margin-top: 4px; font-weight: 600; }
        .refs li { font-size: 13.5px; }
        @media (max-width: 640px) { .live { grid-template-columns: 1fr; } .tryit-row { grid-template-columns: 1fr; } .cta { grid-template-columns: 1fr; } }
      `}</style>

      <div className="prose">
      <div className="byline">
        <span><b>Danny Varghese</b>, MS4, Texas A&amp;M College of Medicine</span>
        <span>Published {PUBLISHED}</span>
        <span>Data through the 08-19 r/step2 thread</span>
        <span>About 10 minutes</span>
      </div>

      <div className="abstract">
        <div className="k">Summary</div>
        <p>I parsed 269 r/step2 score reports into practice-form histories and real Step 2 CK scores. For the 239 with a three-digit NBME or UWSA on file, the real score beat the practice average 92% of the time, by a median of about 11 points, but the size of that climb depends on where you start: about +20 for averages under 235, about +2 at 265 and up. The most recent form predicts best (half-life about three weeks). Three forms read off scale after controlling for who took them and when: NBME 9 about 6 points low, UWSA 2 about 5 high, UWSA 3 about 8 low. A shrinkage-linear model fit to this data lands within 7 points for 70% of students in-sample; on {forum ? forum.n : 40} later posters it had never seen, {forum ? forum.within7Pct : 80}% within 7. On the first {app ? app.n : 7} users who entered scores in the app it is noticeably worse, and I show that too.</p>
      </div>

      <section className="pitch">
        <div className="pk">The same model, with its record attached</div>
        <div className="ph">Run your forms through it, then watch how it does on real students every Monday.</div>
        <p className="ps">The app carries this projection under a readiness gauge, keeps the track record on the same screen, and lets you add a form in ten seconds. Free to start.</p>
        <div className="row">
          <a href={store} className="btn-store" onClick={() => track('store_click', { source: CAMPAIGN, location: 'pitch_top', ref: referrerHost() })}><svg viewBox="0 0 384 512" fill="currentColor" aria-hidden="true" style={{ width: 15, height: 15 }}><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg> Get Step Gunner free</a>
          <Link href="/readiness" className="btn-calc" onClick={() => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_top' })}>Or use the web calculator</Link>
        </div>
        <div className="ptrust">{forum ? `${forum.inside} of ${forum.n}` : '33 of 40'} r/step2 posters it never trained on landed inside their range. The misses are on this page too.</div>
      </section>

      <h2>1. Why I did this</h2>
      <p>Every score release thread has the same comment under it: "add 10 to your NBME average." Sometimes it's 8, sometimes 15. UWSA 2 is "inflated." NBME 9 is "useless." I believed all of these during dedicated and repeated some of them. After my own exam I wanted to know which were true, and the data to check them is sitting in public on Reddit: people post their forms, then come back weeks later and post the real number.</p>

      <h2>2. Methods</h2>
      <h3>Data</h3>
      <p>Score-report posts from r/step2 (the aggregate scrape plus the 07-29, 08-05 and 08-19 threads), parsed into one row per assessment: form, printed score, days before the exam when available, and the actual three-digit Step 2 CK result. 269 students, 3,737 assessments. Usernames were dropped at parse time; records carry only an id, the forms, the days and the outcome. Free 120 percentages were kept but do not enter the model.</p>
      <h3>Inclusion</h3>
      <p>A student enters the fit when at least one NBME or UWSA three-digit score and a real Step 2 score are present (n=239). Implausible actuals (outside 155 to 300) are dropped. Scores recorded fewer than 13 days after the exam date are excluded on principle, since USMLE releases reports on Wednesdays about two to four weeks after the test and a "score" before then cannot be real.</p>
      <h3>Model</h3>
      <p>Each student's forms are collapsed into one anchor: a recency-weighted mean with weight exp(minus days / 30), after per-form level corrections. The anchor is then shrunk toward the population mean:</p>
      <div className="eq">projection = 250 + 0.79 x (anchor minus 250) + 9</div>
      <p>The slope under one is regression to the mean: a low practice average usually contains a bad day, and bad days don't repeat on purpose. The +9 is the average climb at the middle of the distribution. The slope was deliberately held above the best-fit line through this sample (which lands near 0.55), because the sample skews high and I would rather under-promise a 230 than over-promise it. Band half-widths (7, 11, 15, 18 points) follow how far out the freshest form was taken.</p>
      <h3>Validation</h3>
      <p>In-sample accuracy by leave-one-out on the 239. Then the constants were frozen, and every later outcome is judged against the frozen model: 40 r/step2 posters from threads parsed after the freeze, and the users who enter real scores in the app. That second set updates weekly and is shown below and inside the app.</p>

      <h2>3. Results</h2>
      <h3>3.1 You will probably score above your practice average, by an amount that depends on where you start</h3>
      <Fig n={1} src="/research/fig1_scatter.svg" alt="Scatter of practice average vs actual Step 2 score for 239 students, with the same-score line, the plus-10 rule, and the model line"
        caption="239 students. Dashed line is 'same score'; dotted is the +10 rule; gold is the model. Almost everyone sits above the dashed line, and the cloud is flatter than the dotted one." />
      <p>92% of students beat their recency-weighted practice average, median +11. The fixed number is the part that's wrong:</p>
      <Fig n={2} src="/research/fig2_climb_by_band.svg" alt="Bar chart of mean climb from practice average to real score, by practice-average band, with 95% confidence intervals"
        caption="Mean climb by starting band, bootstrap 95% intervals. The +10 rule is about right only in the middle." />
      <table className="tbl">
        <thead><tr><th>Practice average</th><th className="n">Students</th><th className="n">Climbed by</th></tr></thead>
        <tbody>
          <tr><td>under 235</td><td className="n">35</td><td className="n"><b>+20</b></td></tr>
          <tr><td>235 to 244</td><td className="n">67</td><td className="n"><b>+12</b></td></tr>
          <tr><td>245 to 254</td><td className="n">75</td><td className="n"><b>+11</b></td></tr>
          <tr><td>255 to 264</td><td className="n">38</td><td className="n"><b>+5</b></td></tr>
          <tr><td>265 and up</td><td className="n">24</td><td className="n"><b>+2</b></td></tr>
        </tbody>
      </table>
      <p>If you're averaging 230, "add 10" undersells you. If you're averaging 262, it oversells you by a lot, and that is the group most likely to set a 270 target off it.</p>

      <h3>3.2 Your most recent form matters far more than your first one</h3>
      <p>I tried several ways of collapsing forms into one number: plain mean, last form only, best form, and a recency-weighted mean. The weighted version predicted best, and the weight that worked has a half-life of about three weeks.</p>
      <Fig n={3} src="/research/fig5_recency_weight.svg" alt="Exponential decay curve showing the weight a practice form carries as a function of days before the exam"
        caption="Weight of a form in the anchor by days before the exam. A form from three weeks out counts half; six weeks out, a quarter." />
      <p>This also explains the belief that old forms "deflate." They do read lower, but mostly because of when people take them, not which form it is. Once you account for the student and for timing, NBME 10 through 15 collapse to within a point or two of each other.</p>

      <h3>3.3 Three forms genuinely read off scale, and they're not the ones people complain about</h3>
      <Fig n={4} src="/research/fig3_form_offsets.svg" alt="Horizontal bar chart of how each practice form reads relative to the NBME scale, with 95% confidence intervals and sample sizes"
        caption="Level offsets from a two-way fixed-effects model (student + days out), 160 students and 1,043 dated forms, empirical-Bayes shrunk. Left reads low, right reads high." />
      <table className="tbl">
        <thead><tr><th>Form</th><th>Reads</th><th>Confidence</th></tr></thead>
        <tbody>
          <tr><td>NBME 9</td><td>about 6 points low</td><td>solid, 71 students</td></tr>
          <tr><td>NBME 10 to 16</td><td>on scale</td><td>treated as equated, 788 sittings</td></tr>
          <tr><td>UWSA 1</td><td>on scale</td><td>69 students</td></tr>
          <tr><td>UWSA 2</td><td>about 5 points high</td><td>solid, 93 students</td></tr>
          <tr><td>UWSA 3</td><td>about 8 points low</td><td>thin, 22 students</td></tr>
        </tbody>
      </table>
      <p>So "UWSA 2 is inflated" survives, at about five points, not the fifteen people throw around. "NBME 9 is useless" doesn't: it's a fine form that prints about six under the others. The one nobody warned me about is UWSA 3, which reads low by a lot, though only 22 people had taken it, so hold that one loosely.</p>

      <h3>3.4 How wrong the model is, in sample</h3>
      <Fig n={5} src="/research/fig4_error_hist.svg" alt="Histogram of actual minus projected score for 239 students with the within-7-points band shaded"
        caption="Actual minus projection on the 239 students the model was fit to. These numbers flatter it; see 3.5 for the honest test." />
      <p>Within 7 points for 70%, within 10 for 85%, average miss 5.8. The +10 rule on the same people: within 7 for 62%, average miss 6.8. Using your practice average with no adjustment at all: average miss almost 12.</p>

      <h3>3.5 Out of sample: students the model had never seen</h3>
      <p>This is the section a marketer would cut. After the constants were frozen, two groups of outcomes arrived: r/step2 posters from later threads, and students who entered a real score inside the app. Neither touched the fit.</p>
      <Fig n={6} src="/research/fig6_out_of_sample.svg" alt="Scatter of projected vs actual score for out-of-sample students, r/step2 posters as circles and app users as diamonds, with the within-7-points band"
        caption="Projections made before the real score was known. Circles are r/step2 posters the model never trained on; diamonds are app users. The diamond at 227 projected, 267 actual had a single practice form on file." />
      <div className="live">
        <div className="c"><div className="n">{forum ? forum.inside : 33}<span> / {forum ? forum.n : 40}</span></div><div className="l">r/step2 posters inside their range</div></div>
        <div className="c"><div className="n">{forum ? forum.within7Pct : 80}<span>%</span></div><div className="l">of those posters within 7 points</div></div>
        <div className="c"><div className="n">{app ? app.inside : 4}<span> / {app ? app.n : 7}</span></div><div className="l">app users inside their range</div></div>
      </div>
      <p>On the Reddit posters the frozen model did about as well as in-sample, which is the result you hope for. On the app users it did worse: {app ? app.n : 7} students so far, {app ? app.inside : 4} inside their range, one of them a 40-point miss from a single stale form. Seven is not enough to conclude anything. I am posting it anyway, and it updates every Monday{asOf ? ` (numbers above as of ${asOf})` : ''}, inside the app under the readiness gauge and on the <Link href="/readiness/methodology">methodology page</Link>. If the app population keeps missing worse than the forum population, the model gets refit for that population, not the other way round.</p>

      <h2>4. Try it</h2>
      <TryIt />

      <h2>5. Limitations</h2>
      <ul>
        <li><strong>Self-selection.</strong> People who did well post more. The fit set averages 258 against a national mean in the high 240s, and the lowest real score in it is 216. The "+20 under 235" figure rests on 35 students.</li>
        <li><strong>Recall.</strong> Days-before-exam are what people remembered when they posted; about a third of forms had no usable date and were imputed from form order.</li>
        <li><strong>Small out-of-sample n.</strong> 47 students, 7 of them app users. The in-app population reaches lower than Reddit does and may need its own constants.</li>
        <li><strong>One predictor.</strong> The model uses forms only. Cards answered, accuracy by system and study pacing are measured in the app but are not in the projection until there are enough real outcomes to fit them honestly.</li>
      </ul>

      <h2>6. What I'd actually do with this</h2>
      <ul>
        <li>Take a form inside your last two weeks. The projection is only as good as your freshest data point, and the 40-point miss above came from a student with exactly one form entered.</li>
        <li>Don't average your forms and don't let a week-one NBME drag the number around.</li>
        <li>If your average is under 240, the folklore is too pessimistic about you. If it's over 260, it's too optimistic. Plan off the band table, not off "+10."</li>
        <li>Read NBME 9 about six points up and UWSA 2 about five points down. Leave the rest alone.</li>
      </ul>

      <div className="cta">
        <a className="pri" href={store} onClick={() => track('store_click', { source: CAMPAIGN, location: 'end', ref: referrerHost() })}>Get Step Gunner<small>the same projection, plus its live track record</small></a>
        <Link className="sec" href="/readiness" onClick={() => track('cta_predictor', { surface: CAMPAIGN })}>Run the full calculator<small>free, with exam date and percentile</small></Link>
      </div>

      <h2>7. Data and code</h2>
      <p>The parsed, de-identified forum set (record id, form, printed score, days before exam, outcome) and the fitting scripts live in the Step Gunner repository; the out-of-sample record is served at a public endpoint and recomputed weekly. The model constants on this page are imported from the same module the calculator runs, so the text cannot drift from the code. If you post your own score after exam day, it goes into the next fit, and the next version of this page gets a bigger out-of-sample number.</p>

      <h2>References</h2>
      <ul className="refs">
        <li>USMLE. Step 2 CK Score Interpretation Guidelines (percentile norms, LCME first-takers, July 2022 to June 2025).</li>
        <li>NBME. Comprehensive Clinical Science Self-Assessment: score interpretation and equating notes.</li>
        <li>Thorndike RL. Personnel Selection: Test and Measurement Techniques. Wiley, 1949 (range-restriction correction, Case II).</li>
        <li>r/step2 score-report threads, 2025 to 2026, parsed with usernames removed at ingest.</li>
      </ul>
      </div>
    </LabLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Cache at the edge for an hour; the doc itself changes weekly.
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  let record: Record = null;
  try {
    const r = await fetch(TRACK_RECORD_URL, { headers: { accept: 'application/json' } });
    if (r.ok) record = (await r.json()) as Record;
  } catch {
    record = null;   // static fallbacks in the page
  }
  return { props: { record } };
};
