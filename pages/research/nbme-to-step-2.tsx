// Research post: what 269 r/step2 score reports say about NBME/UWSA -> Step 2 CK.
// Semi-academic structure (summary, methods, results, limitations, data), written
// in Danny's voice, with the six figures rendered from the calibration data
// (gunner repo: docs/blog/figures/render.py), an inline "try it" calculator that
// runs the SAME lib/readiness math the predictor uses, and the live out-of-sample
// record pulled server-side from the track_record_json endpoint (decision 0015).
// Built from the app-look blocks (components/app/README.md); the calculator sits in a
// Stage band between the two halves of the article grid.
// No em or en dashes anywhere in the copy (site rule).
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import {
  AppShell, ArticleBody, ArticleHeader, Figure, Hero, Section, Stage, StatStrip, Table,
} from '../../components/app';
import {
  BodyCont, ChoicePair, PageHead, Pitch, ResearchStyles, StageHead, Summary,
} from '../../components/app/research';
import { CAL, FORM_OFFSETS } from '../../lib/readiness';
import ReadinessCheck from '../../components/ReadinessCheck';
import { track } from '../../lib/analytics';

const CAMPAIGN = 'research_nbme_step2';
const TRACK_RECORD_URL = 'https://us-central1-stepgunner-79ae7.cloudfunctions.net/track_record_json';
const PUBLISHED = '2026-08-23';
const H1 = 'What actually predicts your Step 2 score';

type SourceSummary = { n: number; inside: number; within7Pct: number; medianAbsErr?: number };
type Record = { n: number; insideOf10: number; shown: number; medianAbsErr: number; within7PctAll: number;
  bySource?: { app?: SourceSummary; forum?: SourceSummary }; computedAt?: number } | null;

const TOC: [string, string][] = [
  ['why', 'Why I did this'],
  ['methods', 'Methods'],
  ['results', 'Results'],
  ['try', 'Try it'],
  ['limits', 'Limitations'],
  ['do', 'What I\'d actually do with this'],
  ['data', 'Data and code'],
  ['refs', 'References'],
];

export default function Research({ record }: { record: Record }) {
  const app = record?.bySource?.app;
  const forum = record?.bySource?.forum;
  const asOf = record?.computedAt ? new Date(record.computedAt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  const title = 'I pulled 269 NBME to Step 2 score pairs off Reddit. Here is what actually predicts your score.';
  const desc = 'An analysis of 269 r/step2 score reports: how far above your NBME average you land, which forms read high or low, and how much recency matters.';
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
    <>
      <PageHead metaTitle="NBME to Step 2 CK: What 269 Real Score Reports Show" metaDesc={desc} ogImage="/og/research/nbme-to-step-2.png" ogAlt={H1}>
        <link rel="canonical" href="https://stepgunner.com/research/nbme-to-step-2" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </PageHead>

      <AppShell campaign={CAMPAIGN} pageType="research">
        <ResearchStyles />
        <Hero>
          <ArticleHeader
            category="step2"
            crumb={[{ href: '/research', label: 'Research' }, { label: 'NBME to Step 2' }]}
            eyebrow="Research"
            title={H1}
            accent="your Step 2 score"
            dek={<>269 r/step2 score reports, one calibrated model, and its out-of-sample record, updated every Monday. Written by a medical student who believed the folklore until he checked it.</>}
            meta={[`Published ${PUBLISHED}`, 'Data through the 08-19 r/step2 thread', 'About 10 minutes']}
          />
          <Summary>
            <p>I parsed 269 r/step2 score reports into practice-form histories and real Step 2 CK scores. For the 239 with a three-digit NBME or UWSA on file, the real score beat the practice average 92% of the time, by a median of about 11 points, but the size of that climb depends on where you start: about +20 for averages under 235, about +2 at 265 and up. The most recent form predicts best (half-life about three weeks). Three forms read off scale after controlling for who took them and when: NBME 9 about 6 points low, UWSA 2 about 5 high, UWSA 3 about 8 low. A shrinkage-linear model fit to this data lands within 7 points for 70% of students in-sample; on {forum ? forum.n : 40} later posters it had never seen, {forum ? forum.within7Pct : 80}% within 7. On the first {app ? app.n : 7} users who entered scores in the app it is noticeably worse, and I show that too.</p>
          </Summary>
          <Pitch
            placement="top"
            kicker="The same model, with its record attached"
            title="Run your forms through it, then watch how it does on real students every Monday."
            body="The app carries this projection under a readiness gauge, keeps the track record on the same screen, and lets you add a form in ten seconds. Free to start."
            primary={{ store: true, loc: 'top', label: 'Get Step Gunner free' }}
            secondary={{ href: '/readiness', label: 'Or use the web calculator', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_top' }) }}
            trust={<>{forum ? `${forum.inside} of ${forum.n}` : '32 of 40'} r/step2 posters it never trained on landed inside their range. The misses are on this page too.</>}
          />
        </Hero>

        <ArticleBody toc={TOC}>
          <Section id="why" n="01" title="Why I did this">
            <p className="prs">Every score release thread has the same comment under it: &quot;add 10 to your NBME average.&quot; Sometimes it&apos;s 8, sometimes 15. UWSA 2 is &quot;inflated.&quot; NBME 9 is &quot;useless.&quot; I believed all of these during dedicated and repeated some of them. After my own exam I wanted to know which were true, and the data to check them is sitting in public on Reddit: people post their forms, then come back weeks later and post the real number.</p>
          </Section>

          <Section id="methods" n="02" title="Methods">
            <h3 className="h-3 subh">Data</h3>
            <p className="prs">Score-report posts from r/step2 (the aggregate scrape plus the 07-29, 08-05 and 08-19 threads), parsed into one row per assessment: form, printed score, days before the exam when available, and the actual three-digit Step 2 CK result. 269 students and 3,737 parsed rows: each real score plus every form the post mentioned, 2,042 of them with a reported practice score. Usernames were dropped at parse time; records carry only an id, the forms, the days and the outcome. Free 120 percentages were kept but do not enter the model; they are analysed separately in <Link href="/research/free-120-to-step-2">the Free 120 post</Link>.</p>
            <h3 className="h-3 subh">Inclusion</h3>
            <p className="prs">A student enters the fit when at least one NBME or UWSA three-digit score and a real Step 2 score are present (n=239). Implausible actuals (outside 155 to 300) are dropped. Scores recorded fewer than 13 days after the exam date are excluded on principle, since USMLE releases reports on Wednesdays about two to four weeks after the test and a &quot;score&quot; before then cannot be real.</p>
            <h3 className="h-3 subh">Model</h3>
            <p className="prs">Each student&apos;s forms are collapsed into one anchor: a recency-weighted mean with weight exp(minus days / 30), after per-form level corrections. The anchor is then shrunk toward the population mean:</p>
            <div className="mk isl"><p className="fxf rs-eq">projection = 250 + 0.79 x (anchor minus 250) + 9</p></div>
            <p className="prs">The slope under one is regression to the mean: a low practice average usually contains a bad day, and bad days don&apos;t repeat on purpose. The +9 is the average climb at the middle of the distribution. The slope was deliberately held above the best-fit line through this sample (which lands near 0.55), because the sample skews high and I would rather under-promise a 230 than over-promise it. Band half-widths (7, 11, 15, 18 points) follow how far out the freshest form was taken.</p>
            <h3 className="h-3 subh">Validation</h3>
            <p className="prs">In-sample accuracy by leave-one-out on the 239. Then the constants were frozen, and every later outcome is judged against the frozen model: 40 r/step2 posters from threads parsed after the freeze, and the users who enter real scores in the app. That second set updates weekly and is shown below and inside the app.</p>
          </Section>

          <Section id="results" n="03" title="Results">
            <h3 className="h-3 subh">3.1 You will probably score above your practice average, by an amount that depends on where you start</h3>
            <Figure n={1} src="/research/fig1_scatter.svg" width={576} height={432} alt="Scatter of practice average vs actual Step 2 score for 239 students, with the same-score line, the plus-10 rule, and the model line"
              caption="239 students. Dashed line is 'same score'; dotted is the +10 rule; gold is the model. Almost everyone sits above the dashed line, and the cloud is flatter than the dotted one." />
            <p className="prs">92% of students beat their recency-weighted practice average, median +11. The fixed number is the part that&apos;s wrong:</p>
            <Figure n={2} src="/research/fig2_climb_by_band.svg" width={576} height={331} alt="Bar chart of mean climb from practice average to real score, by practice-average band, with 95% confidence intervals"
              caption="Mean climb by starting band, bootstrap 95% intervals. The +10 rule is about right only in the middle." />
            <Table
              label="Climb from practice average to real score, by starting band"
              head={['Practice average', 'Students', 'Climbed by']}
              num={[1, 2]}
              rows={[
                ['under 235', '35', <b key="b">+20</b>],
                ['235 to 244', '67', <b key="b">+12</b>],
                ['245 to 254', '75', <b key="b">+11</b>],
                ['255 to 264', '38', <b key="b">+5</b>],
                ['265 and up', '24', <b key="b">+2</b>],
              ]}
            />
            <p className="prs">If you&apos;re averaging 230, &quot;add 10&quot; undersells you. If you&apos;re averaging 262, it oversells you by a lot, and that is the group most likely to set a 270 target off it.</p>

            <h3 className="h-3 subh">3.2 Your most recent form matters far more than your first one</h3>
            <p className="prs">I tried several ways of collapsing forms into one number: plain mean, last form only, best form, and a recency-weighted mean. The weighted version predicted best, and the weight that worked has a half-life of about three weeks.</p>
            <Figure n={3} src="/research/fig5_recency_weight.svg" width={576} height={302} alt="Exponential decay curve showing the weight a practice form carries as a function of days before the exam"
              caption="Weight of a form in the anchor by days before the exam. A form from three weeks out counts half; six weeks out, a quarter." />
            <p className="prs">This also explains the belief that old forms &quot;deflate.&quot; They do read lower, but mostly because of when people take them, not which form it is. Once you account for the student and for timing, NBME 10 through 15 collapse to within a point or two of each other.</p>
            <p className="prs">How far apart one student&apos;s own forms land, and whether any single form deserves more trust than the rest, has <Link href="/research/which-nbme-is-most-predictive">its own post</Link>.</p>

            <h3 className="h-3 subh">3.3 Three forms genuinely read off scale, and they&apos;re not the ones people complain about</h3>
            <Figure n={4} src="/research/fig3_form_offsets.svg" width={576} height={317} alt="Horizontal bar chart of how each practice form reads relative to the NBME scale, with 95% confidence intervals and sample sizes"
              caption="Level offsets from a two-way fixed-effects model (student + days out), 160 students and 1,043 dated forms, empirical-Bayes shrunk. Left reads low, right reads high." />
            <Table
              label="How each practice form reads against the NBME scale"
              head={['Form', 'Reads', 'Confidence']}
              minWidth={480}
              rows={[
                ['NBME 9', 'about 6 points low', 'solid, 71 students'],
                ['NBME 10 to 16', 'on scale', 'treated as equated, 788 sittings'],
                ['UWSA 1', 'on scale', '69 students'],
                ['UWSA 2', 'about 5 points high', 'solid, 93 students'],
                ['UWSA 3', 'about 8 points low', 'thin, 22 students'],
              ]}
            />
            <p className="prs">So &quot;UWSA 2 is inflated&quot; survives, at about five points, not the fifteen people throw around. &quot;NBME 9 is useless&quot; doesn&apos;t: it&apos;s a fine form that prints about six under the others. The one nobody warned me about is UWSA 3, which reads low by a lot, though only 22 people had taken it, so hold that one loosely.</p>

            <h3 className="h-3 subh">3.4 How wrong the model is, in sample</h3>
            <Figure n={5} src="/research/fig4_error_hist.svg" width={576} height={317} alt="Histogram of actual minus projected score for 239 students with the within-7-points band shaded"
              caption="Actual minus projection on the 239 students the model was fit to. These numbers flatter it; see 3.5 for the honest test." />
            <p className="prs">Within 7 points for 70%, within 10 for 85%, average miss 5.8. The +10 rule on the same people: within 7 for 62%, average miss 6.8. Using your practice average with no adjustment at all: average miss almost 12.</p>

            <h3 className="h-3 subh">3.5 Out of sample: students the model had never seen</h3>
            <p className="prs">This is the section a marketer would cut. After the constants were frozen, two groups of outcomes arrived: r/step2 posters from later threads, and students who entered a real score inside the app. Neither touched the fit.</p>
            <Figure n={6} src="/research/fig6_out_of_sample.svg" width={576} height={432} alt="Scatter of projected vs actual score for out-of-sample students, r/step2 posters as circles and app users as diamonds, with the within-7-points band"
              caption="Projections made before the real score was known. Circles are r/step2 posters the model never trained on; diamonds are app users. The diamond at 227 projected, 267 actual had a single practice form on file." />
            <StatStrip items={[
              { value: <>{forum ? forum.inside : 33}<small> / {forum ? forum.n : 40}</small></>, label: 'r/step2 posters inside their range' },
              { value: <>{forum ? forum.within7Pct : 80}<small>%</small></>, label: 'of those posters within 7 points' },
              { value: <>{app ? app.inside : 4}<small> / {app ? app.n : 7}</small></>, label: 'app users inside their range' },
            ]} />
            <p className="prs">On the Reddit posters the frozen model did about as well as in-sample, which is the result you hope for. On the app users it did worse: {app ? app.n : 29} students so far, {app ? app.inside : 18} inside their range. That is still a small group. I am posting it anyway, and it updates every Monday{asOf ? ` (numbers above as of ${asOf})` : ''}, inside the app under the readiness gauge and on the <Link href="/readiness/methodology">methodology page</Link>. If the app population keeps missing worse than the forum population, the model gets refit for that population, not the other way round. It did keep missing worse, and the refit failed its own test; <Link href="/research/model-misses-app-users">the follow-up</Link> is about who it misses and why.</p>
          </Section>
        </ArticleBody>

        <Stage category="step2">
          <StageHead id="try" n="04" title="Try it" />
          <ReadinessCheck surface="research_nbme_step2" title="Your forms, the model's projection" initial={[{ form: 'NBME 14', score: '240', days: '21' }, { form: 'UWSA 2', score: '250', days: '7' }, { form: 'NBME 9', score: '', days: '' }]} />
          <div className="mk isl"><p className="rs-cal">Form offsets applied before the anchor: {Object.entries(FORM_OFFSETS).map(([f, v]) => `${f} ${v > 0 ? '+' : ''}${v}`).join(', ')}. Recency half-life about {Math.round(CAL.tau * Math.log(2))} days. Projection = {CAL.mean} + {CAL.slope} x (anchor minus {CAL.mean}) + {CAL.delta}.</p></div>
        </Stage>

        <BodyCont toc={TOC}>
          <Section id="limits" n="05" title="Limitations">
            <ul className="rs-ul">
              <li><strong>Self-selection.</strong> People who did well post more. The fit set averages 258 against a national mean of about 250, and the lowest real score in it is 216. The &quot;+20 under 235&quot; figure rests on 35 students.</li>
              <li><strong>Recall.</strong> Days-before-exam are what people remembered when they posted; about a third of forms had no usable date and were imputed from form order.</li>
              <li><strong>Small out-of-sample n.</strong> {forum && app ? forum.n + app.n : 69} students, {app ? app.n : 29} of them app users. The in-app population reaches lower than Reddit does and may need its own constants.</li>
              <li><strong>One predictor.</strong> The model uses forms only. Cards answered, accuracy by system and study pacing are measured in the app but are not in the projection until there are enough real outcomes to fit them honestly.</li>
            </ul>
          </Section>

          <Section id="do" n="06" title="What I'd actually do with this">
            <ul className="rs-ul">
              <li>Take a form inside your last two weeks. The projection is only as good as your freshest data point, and the 40-point miss above came from a student with exactly one form entered.</li>
              <li>Don&apos;t average your forms and don&apos;t let a week-one NBME drag the number around.</li>
              <li>If your average is under 240, the folklore is too pessimistic about you. If it&apos;s over 260, it&apos;s too optimistic. Plan off the band table, not off &quot;+10.&quot;</li>
              <li>Read NBME 9 about six points up and UWSA 2 about five points down. Leave the rest alone.</li>
            </ul>
          </Section>

          <ChoicePair
            store={{ label: 'Get Step Gunner', sub: 'the same projection, plus its live track record' }}
            alt={{ href: '/readiness', label: 'Run the full calculator', sub: 'free, with exam date and percentile', onClick: () => track('cta_predictor', { surface: CAMPAIGN }) }}
          />

          <Section id="data" n="07" title="Data and code">
            <p className="prs">The parsed, de-identified forum set (record id, form, printed score, days before exam, outcome) and the fitting scripts live in the Step Gunner repository; the out-of-sample record is served at a public endpoint and recomputed weekly. The model constants on this page are imported from the same module the calculator runs, so the text cannot drift from the code. If you post your own score after exam day, it goes into the next fit, and the next version of this page gets a bigger out-of-sample number.</p>
          </Section>

          <Section id="refs" n="" title="References">
            <div className="refs"><ol>
              <li>USMLE. Step 2 CK Score Interpretation Guidelines (percentile norms, LCME first-takers, July 2022 to June 2025).</li>
              <li>NBME. Comprehensive Clinical Science Self-Assessment: score interpretation and equating notes.</li>
              <li>Thorndike RL. Personnel Selection: Test and Measurement Techniques. Wiley, 1949 (range-restriction correction, Case II).</li>
              <li>r/step2 score-report threads, 2025 to 2026, parsed with usernames removed at ingest.</li>
            </ol></div>
          </Section>
        </BodyCont>
      </AppShell>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Cache at the edge for an hour; the doc itself changes weekly.
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  let record: Record = null;
  try {
    // A cold function must not hold the page: give it 1.5 s, then fall back to the static numbers.
    const r = await fetch(TRACK_RECORD_URL, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(1500) });
    if (r.ok) record = (await r.json()) as Record;
  } catch {
    record = null;   // static fallbacks in the page
  }
  return { props: { record } };
};
