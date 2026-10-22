// Research post: how far apart one student's own NBME and UWSA forms land, how
// much of that is improvement versus noise, whether any single form predicts the
// real score better than the others, and which one-number rule lands closest.
// Fourth in the series after nbme-to-step-2, free-120-to-step-2 and
// dedicated-calendar; same 269 r/step2 reports, same limitations.
//
// Every number on this page is computed by the gunner repo's
// docs/blog/figures/render_which_nbme.py from the canonical
// analysis/readiness_calibration/data/forum_scores.csv. The figures in
// public/research/wn_*.svg and the calculator constants in
// lib/which_nbme_calc.json are that script's output, copied verbatim; rerun it
// rather than editing either by hand. The prose source is
// docs/blog/which-nbme-is-real.md in the same repo.
//
// Slug: "which NBME is most predictive" is how r/step2 asks this, and it does not
// compete with the per-form pages (which own "NBME 15 score conversion") or the
// predictor hub (which owns "score predictor"). The headline keeps the better
// sentence, "Which NBME is the real you?".
// Built from the app-look blocks (components/app/README.md); the calculator sits in a
// Stage band between the two halves of the article grid.
// No em or en dashes anywhere in the copy (site rule).
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppShell, ArticleBody, ArticleHeader, Figure, Hero, Section, Stage, StatStrip, Table,
} from '../../components/app';
import {
  BodyCont, ChoicePair, PageHead, Pitch, ResearchStyles, StageHead, Summary, W820,
} from '../../components/app/research';
import { FORMS, FORM_OFFSETS, ordinal } from '../../lib/readiness';
import { track } from '../../lib/analytics';
import CALC from '../../lib/which_nbme_calc.json';

const CAMPAIGN = 'research_which_nbme';
const PUBLISHED = '2026-10-22';
const PATH = '/research/which-nbme-is-most-predictive';

const formSlug = (form: string) => form.toLowerCase().replace(' ', '-');

// ---------------------------------------------------------------- calculator
// Percentile rank of v inside a distribution given as values at fixed percentile
// points (CALC.grid = 0, 5, ..., 100). Ties span a range of percentiles, so the
// rank is the middle of [first percentile reaching v, last percentile at or below v].
function percentileRank(points: number[], v: number): number {
  const g = CALC.grid;
  const last = points.length - 1;
  let lower = 100;
  if (v <= points[0]) lower = 0;
  else {
    for (let i = 1; i <= last; i++) {
      if (points[i] >= v) {
        lower = g[i - 1] + ((g[i] - g[i - 1]) * (v - points[i - 1])) / (points[i] - points[i - 1]);
        break;
      }
    }
  }
  let upper = 0;
  if (v >= points[last]) upper = 100;
  else {
    for (let i = last - 1; i >= 0; i--) {
      if (points[i] <= v) {
        upper = g[i] + ((g[i + 1] - g[i]) * (v - points[i])) / (points[i + 1] - points[i]);
        break;
      }
    }
  }
  return Math.round(Math.max(0, Math.min(100, (lower + upper) / 2)));
}

type Ref = { label: string; n: number; points: number[]; unit: string };

function referenceFor(count: number): Ref {
  if (count === 2) {
    return { label: 'two forms', n: CALC.twoForms.nPairs, points: CALC.twoForms.points, unit: 'pairs of different forms the 230 students sat' };
  }
  const key = count <= 4 ? '3-4' : count <= 6 ? '5-6' : count <= 8 ? '7-8' : '9+';
  const b = CALC.byCount[key as keyof typeof CALC.byCount];
  const label = key === '9+' ? 'nine or more forms' : `${key.replace('-', ' or ')} forms`;
  return { label, n: b.n, points: b.points, unit: `students who also sat ${label}` };
}

const signed = (v: number) => (v > 0 ? `+${v}` : `${v}`);

const EXAMPLE: Record<string, string> = { 'NBME 11': '231', 'NBME 13': '244', 'NBME 14': '238', 'NBME 15': '249', 'UWSA 2': '252' };

function SpreadCheck() {
  const [vals, setVals] = useState<Record<string, string>>(EXAMPLE);
  const [isExample, setIsExample] = useState(true);
  const fired = useRef(false);

  const entered = useMemo(() => FORMS
    .map((form) => ({ form, raw: (vals[form] || '').trim() }))
    .filter((e) => e.raw !== ''), [vals]);
  const valid = entered
    .map((e) => ({ form: e.form, s: Number(e.raw) }))
    .filter((e) => Number.isInteger(e.s) && e.s >= 150 && e.s <= 300);
  const ignored = entered.length - valid.length;
  const count = valid.length;

  useEffect(() => {
    if (!isExample && count >= 2 && !fired.current) {
      fired.current = true;
      track('which_nbme_calc', { surface: CAMPAIGN, forms: count });
    }
  }, [count, isExample]);

  const set = (form: string, v: string) => {
    if (isExample) setIsExample(false);
    setVals((cur) => ({ ...cur, [form]: v.replace(/[^0-9]/g, '').slice(0, 3) }));
  };
  const clear = () => { setVals({}); setIsExample(false); };

  let result = null;
  if (count >= 2) {
    const sorted = [...valid].sort((a, b) => b.s - a.s);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const gap = best.s - worst.s;
    const ref = referenceFor(count);
    const rank = percentileRank(ref.points, gap);
    const p = (q: number) => ref.points[CALC.grid.indexOf(q)];
    const scaleMax = Math.max(Math.ceil((p(90) * 1.25) / 5) * 5, gap + 5, 20);
    const at = (v: number) => `${Math.min(100, (v / scaleMax) * 100)}%`;
    const band = CALC.vsBestByBand.find((b) => best.s >= b.lo && best.s < b.hi) ?? CALC.vsBestByBand[CALC.vsBestByBand.length - 1];
    const lonely = sorted.length >= 2 && sorted[0].s - sorted[1].s >= CALC.lonelyBest.gap;
    const notes: JSX.Element[] = [];
    if (count >= CALC.manyForms.minForms) {
      notes.push(<li key="many">With nine or more forms, the best one is more likely a lucky day. The {CALC.manyForms.n} students who sat that many landed a median {Math.abs(CALC.manyForms.median)} point below their best, and {CALC.manyForms.belowPct}% fell short of it.</li>);
    }
    if (lonely) {
      notes.push(<li key="lonely">Your best sits {CALC.lonelyBest.gap} or more points clear of your next best. {CALC.lonelyBest.n} students had that, and {CALC.lonelyBest.belowPct}% scored below the best one. A small group, so treat it as a hint.</li>);
    }
    if (best.form === 'UWSA 2') {
      notes.push(<li key="u2">Your best is UWSA 2, which prints about {Math.abs(FORM_OFFSETS['UWSA 2'])} points high on average. See the <Link href="/step-2-score-predictor/uwsa-2">UWSA 2 page</Link>.</li>);
    }
    if (worst.form === 'NBME 9' || worst.form === 'UWSA 3') {
      notes.push(<li key="low">Your worst is {worst.form}, which prints about {FORM_OFFSETS[worst.form]} points low on average, so part of your gap is the form rather than you. See the <Link href={`/step-2-score-predictor/${formSlug(worst.form)}`}>{worst.form} page</Link>.</li>);
    }
    result = (
      <>
        <div className="rs-sc-stats">
          <div className="rs-sc-stat">
            <span className="lbl">Your gap, best to worst</span>
            <span className="v">{gap}<small> points</small></span>
            <span className="c">{best.form} {best.s} to {worst.form} {worst.s}</span>
          </div>
          <div className="rs-sc-stat">
            <span className="lbl">Compared with {ref.label}</span>
            <span className="v">{rank}<small>{ordinal(rank).slice(String(rank).length)} percentile</small></span>
            <span className="c">Wider than about {rank}% of the {ref.n.toLocaleString('en-US')} {ref.unit}.</span>
          </div>
        </div>
        <div className="rs-sc-strip" aria-hidden="true">
          <div className="rs-sc-iqr" style={{ left: at(p(25)), width: `calc(${at(p(75))} - ${at(p(25))})` }} />
          <div className="rs-sc-med" style={{ left: at(p(50)) }} />
          <div className="rs-sc-you" style={{ left: at(gap) }}><span>you</span></div>
        </div>
        <div className="rs-sc-axis"><span>0</span><span>median {p(50)}, middle half {p(25)} to {p(75)}</span><span>{scaleMax}</span></div>
        <p className="rs-sc-line">For comparison, two different forms sat in the same week landed a median {CALC.sameWeek.median} points apart, and {Math.round(CALC.sameWeek.ge10)}% of students who did that saw a gap of 10 or more.</p>
        <div className="rs-sc-best">
          <span className="lbl">Your best form against how people landed</span>
          <p>Students whose best form was {band.label} ({band.n} of them) scored a median <b>{signed(band.median)}</b> against it, middle half {signed(Math.round(band.p25))} to {signed(Math.round(band.p75))}, and {band.belowPct}% fell short of it. If you landed like that middle half, that is <b>{Math.round(best.s + band.p25)} to {Math.round(best.s + band.p75)}</b>.</p>
          {notes.length > 0 && <ul className="rs-ul">{notes}</ul>}
        </div>
      </>
    );
  }

  return (
    <div className="mk isl">
      <section className="sheet dark-card rs-tool rs-sc" aria-label="Your forms, against 230 students">
        <div className="sheet-hd"><span className="lbl">Your forms, against 230 students</span><span className="lbl"><span className="dot green" aria-hidden="true" />NOTHING LEAVES THIS PAGE</span></div>
        <div className="abg-g">
          <div className="abg-in">
            <p className="rs-sc-help">{isExample ? 'Example scores below. Replace them with yours, ' : 'Type the three-digit score for each form you sat, '}and leave the rest blank.</p>
            <div className="rs-sc-in">
              {FORMS.map((form) => (
                <div key={form} className="fld">
                  <label htmlFor={`rs-sc-${formSlug(form)}`}>{form}</label>
                  <input id={`rs-sc-${formSlug(form)}`} className="inp" inputMode="numeric" autoComplete="off" placeholder="score" value={vals[form] || ''} onChange={(e) => set(form, e.target.value)} />
                </div>
              ))}
              <button type="button" className="chip clr rs-sc-clear" onClick={clear}>Clear all</button>
            </div>
            {ignored > 0 && <p className="rs-sc-warn">Ignored {ignored} {ignored === 1 ? 'entry' : 'entries'} that {ignored === 1 ? 'is not a' : 'are not'} three-digit score{ignored === 1 ? '' : 's'} between 150 and 300.</p>}
          </div>
          <div className="abg-out" aria-live="polite">
            {result ?? <div className="rep-empty"><p className="rs-sc-empty">Enter at least two forms to see your gap.</p></div>}
            <p className="fine">This describes {CALC.students} people who posted their scores on r/step2, most of whom did well. It is not a projection for you. For one that uses the dates you sat each form, run the <Link href="/readiness" onClick={() => track('cta_predictor', { surface: CAMPAIGN, location: 'calc_fine' })}>readiness check</Link>.</p>
          </div>
        </div>
      </section>
      <style jsx global>{`
        .mk .rs-sc .abg-in { gap: 16px; }
        .mk .rs-sc .rs-sc-help { font-size: 16px; line-height: 1.5; }
        .mk .rs-sc-in { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 12px; }
        .mk .rs-sc-in .fld label { font-size: 13px; }
        .mk .rs-sc-in .inp { min-height: 44px; }
        .mk .rs-sc-clear { align-self: end; justify-content: center; }
        .mk .rs-tool p.rs-sc-warn { font-size: 15px; color: var(--st-gold); }
        .mk .rs-tool .rs-sc-empty { color: var(--st-ink); font-weight: 600; }
        .mk .rs-sc-stats { display: grid; gap: 8px; }
        .mk .rs-sc-stat { display: grid; gap: 4px; align-content: start; padding: 16px; border-radius: var(--r-md); background: var(--st-card-2); box-shadow: inset 0 0 0 1px var(--st-line); }
        .mk .rs-sc-stat .v { font: 800 38px/1.05 var(--f-sans); letter-spacing: -.03em; font-variant-numeric: tabular-nums; color: var(--st-ink); }
        .mk .rs-sc-stat .v small { font: 600 15px/1 var(--f-mono); letter-spacing: 0; color: var(--st-ink-3); }
        .mk .rs-sc-stat .c { font-size: 15px; line-height: 1.45; color: var(--st-ink-2); }
        .mk .rs-sc-strip { position: relative; height: 12px; margin: 40px 4px 8px; border-radius: 999px; background: var(--st-card-2); box-shadow: inset 0 0 0 1px var(--st-line); }
        .mk .rs-sc-iqr { position: absolute; top: 0; bottom: 0; border-radius: 999px; background: var(--blue-35); }
        .mk .rs-sc-med { position: absolute; top: -6px; bottom: -6px; width: 3px; margin-left: -1px; border-radius: 2px; background: var(--st-ink); }
        .mk .rs-sc-you { position: absolute; top: -8px; width: 12px; height: 28px; margin-left: -6px; border-radius: 6px; background: var(--st-gold); box-shadow: 0 0 0 2px var(--st-card), 0 0 16px var(--glow-gold); }
        .mk .rs-sc-you span { position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%); font: 700 13px/1 var(--f-mono); color: var(--st-gold); }
        .mk .rs-sc-axis { display: flex; justify-content: space-between; gap: 8px; margin: 0 4px; font: 500 13px/1.4 var(--f-mono); color: var(--st-ink-3); }
        .mk .rs-tool p.rs-sc-line { margin-top: 16px; font-size: 16px; line-height: 1.5; }
        .mk .rs-sc-best { display: grid; gap: 8px; margin-top: 16px; padding: 16px; border-radius: var(--r-md); background: var(--st-card-2); box-shadow: inset 0 0 0 1px var(--st-line); }
        .mk .rs-sc-best p { font-size: 16px; line-height: 1.55; }
        .mk .rs-sc-best .rs-ul { margin-top: 4px; gap: 8px; }
        .mk .rs-sc-best .rs-ul > li { font-size: 15px; line-height: 1.55; }
        .mk .rs-sc-best .rs-ul > li::before { top: 10px; }
        @media (min-width: 600px) { .mk .rs-sc-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------- page
const TOC: [string, string][] = [
  ['counts', 'The form you have decided does not count'],
  ['apart', 'How far apart your forms are'],
  ['better', 'Some of the gap is you getting better'],
  ['noise', 'Most of it is noise'],
  ['predictive', 'Is one form more predictive than the others?'],
  ['one', 'If you want one number'],
  ['yours', 'Put your own forms in'],
  ['do', 'What I would actually do with this'],
  ['limits', 'What this cannot tell you'],
  ['changed', 'What changed while I checked it'],
  ['short', 'The short version'],
  ['method', 'Data and method'],
  ['refs', 'References'],
];
const H1 = 'Which NBME is the real you?';

export default function WhichNbme() {
  const title = 'Which NBME is the real you? 230 students, their own forms side by side.';
  const desc = 'Which NBME is most predictive of Step 2 CK? 230 students: how far apart best and worst forms land, how much is noise, and when your best form misleads you.';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: title,
    description: desc,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    author: { '@type': 'Person', name: 'Danny Varghese', description: 'MS4, Texas A&M College of Medicine', url: 'https://stepgunner.com' },
    publisher: { '@type': 'Organization', name: 'Step Gunner', url: 'https://stepgunner.com' },
    mainEntityOfPage: `https://stepgunner.com${PATH}`,
    about: ['USMLE Step 2 CK', 'NBME self-assessment', 'UWSA', 'score variability', 'score prediction'],
  };

  return (
    <>
      <PageHead metaTitle="Which NBME Is Most Predictive of Step 2 CK? 230 Real Reports" metaDesc={desc} ogImage="/og/research/which-nbme-is-most-predictive.png" ogAlt={H1}>
        <link rel="canonical" href={`https://stepgunner.com${PATH}`} />
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
            crumb={[{ href: '/research', label: 'Research' }, { label: 'Which NBME is real' }]}
            eyebrow="Research"
            title={H1}
            accent="the real you?"
            dek={<>230 students who posted two or more NBME or UWSA scores and then a real Step 2 score. How far apart one person&apos;s forms land, how much of that is noise, whether any form predicts better than the others, and when your best form misleads you.</>}
            meta={[`Published ${PUBLISHED}`, '230 students, 1,592 forms', 'About 9 minutes']}
          />
          <Summary>
            <p>Across 230 r/step2 score reports with two or more three-digit NBME or UWSA forms, the median gap between a student&apos;s own best and worst form was 23 points. Part of that is improvement: for 90% of the 188 students with dates, the best form came after the worst. Most of it is noise. Two different forms sat within a week of each other landed a median 6 points apart, and a third of the students who did that saw a gap of 10 or more. No single form predicts better than the rest once you account for when it was sat: in the last three weeks, every form with enough data correlates with the real score between 0.72 and 0.77. Read as is, your best form is the single closest number to your real score, but only in the middle of the range: students whose best form was under 240 beat it by a median 13, and those at 270 and up fell a median 4 short.</p>
          </Summary>
          <W820>
            <StatStrip items={[
              { value: '23', label: <><span className="rs-sk">Best minus worst</span>median gap between one student&apos;s own forms, 230 students</> },
              { value: '6', label: <><span className="rs-sk">Same week</span>median gap between two forms sat within 7 days, 168 students</> },
              { value: '+2', tone: 'good', label: <><span className="rs-sk">Real vs best form</span>median, and it swings from +13 to -4 with where the best form sat</> },
            ]} />
          </W820>
          <Pitch
            placement="top"
            kicker="Your forms, your dates, one range"
            title="Stop arguing with yourself about which form counts."
            body="The readiness check takes every NBME and UWSA you have sat with the dates, weights the recent ones more, applies the three per-form corrections from this research, and gives you a range instead of one fake precise number. Free, no account needed."
            primary={{ href: '/readiness', label: 'Run the readiness check', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_top' }) }}
            secondary={{ store: true, loc: 'top', label: 'Get the app free' }}
          />
        </Hero>

        <ArticleBody toc={TOC}>
          <Section id="counts" n="01" title="The form you have decided does not count">
            <p className="prs">Everyone in dedicated has a form they treat as real and a form they treat as a fluke. &quot;My 241 on NBME 11 was a bad day, the 258 on 14 is me.&quot; &quot;UWSA 2 is the most predictive.&quot; &quot;Ignore NBME 9.&quot; It is never the same form for two people, and I did it too: I had a form I quietly decided did not count.</p>
            <p className="prs">So I went back to the r/step2 score reports behind the <Link href="/research/nbme-to-step-2">NBME</Link>, <Link href="/research/free-120-to-step-2">Free 120</Link> and <Link href="/research/dedicated-calendar">dedicated calendar</Link> posts and lined up each student&apos;s own forms side by side. 230 students had two or more three-digit NBME or UWSA scores plus a real Step 2 score, 1,592 forms between them.</p>
            <p className="prs">The caveat that governs everything here, before any numbers: these are people who chose to post. The 230 averaged <strong>258</strong> on the real exam (median 259) against a national median near <strong>251</strong>, and the lowest real score among them is a 220. In the full set of 269 reports the lowest is a 216, and exactly one person scored under the 218 pass line. Everything below describes students who mostly did fine. Where that bias pushes a number in a known direction, I say which way.</p>
          </Section>

          <Section id="apart" n="02" title="How far apart your forms are">
            <Figure n={1} src="/research/wn_fig1_spread.svg" width={576} height={346} alt="Histogram of the gap between each student's best and worst practice form, 230 students, median 23 points, middle half 17 to 32" caption="Best printed form minus worst, one bar per 4 points. Gold line is the median; the shaded band is the middle half of students." />
            <Table
              label="Best form minus worst, 230 students"
              head={['Best form minus worst, 230 students', 'points']}
              num={[1]}
              hl={[0]}
              rows={[
                ['Median gap', <b key="b">23</b>],
                ['95% interval on that median (bootstrap)', '21.5 to 25'],
                ['Middle half of students', '17 to 32'],
                ['90th percentile', '44'],
                ['Widest', '71'],
                ['Gap of 10 or more', '95% of students'],
                ['Gap of 20 or more', '64%'],
                ['Gap of 30 or more', '30%'],
              ]}
            />
            <p className="prs">The gap grows with how many forms you sit, which is what you would expect of a best minus worst: more draws, wider range. Students who sat three or four forms (23 of them) had a median gap of 18; five or six (66), 20; seven or eight (83), 24; nine or more (53), 28.</p>
            <p className="prs">The widest gap, 71, belongs to a student whose two lowest forms were sat 250 and 300 days before the exam. That is not the same person on two days. It is the same person eight months apart, which is the first hint about what the gap is made of.</p>
            <p className="prs"><strong>Does it hold up?</strong> Applying the per-form corrections the predictor uses: median 22. NBME forms only (227 students): 21. Dropping anyone with a form outside the 1st to 99th percentile of all scores (209 left): 23. Leaving out the thread that served as a blind test for an earlier post (199 left): 23.</p>
          </Section>

          <Section id="better" n="03" title="Some of the gap is you getting better">
            <p className="prs">For the 188 students with dates on at least two forms, the best form came <strong>after</strong> the worst one 90% of the time. The worst was sat a median 41 days before the exam, the best a median 13 days before.</p>
            <p className="prs">So part of the folklore is backwards. The low early form is not a fluke to ignore. It was an accurate reading of you six weeks earlier.</p>
            <p className="prs">How much of the gap is improvement? For the 178 students with three or more dated forms, I fit each student&apos;s own straight line of score against date and took it out. The median gap falls from <strong>22 to 16 points</strong>. The median student in that group improved 1.73 points a week, the same figure the <Link href="/research/dedicated-calendar">dedicated calendar post</Link> found from the same students, which is a useful check that the two analyses agree.</p>
          </Section>

          <Section id="noise" n="04" title="Most of it is noise">
            <Figure n={2} src="/research/wn_fig2_same_week.svg" width={576} height={331} alt="Histogram of the gap between two different practice forms sat within seven days of each other, 168 students, median 6 points, one third 10 or more" caption="For each student, the closest-together pair of different forms sat 7 or fewer days apart. Gold bars are gaps of 10 points or more." />
            <p className="prs">The cleanest way to see noise is to look at forms sat so close together that nobody improved much in between. For each of the 168 students who sat two different forms within a week of each other, I took their closest-together pair. The median gap was <strong>6 points</strong>, middle half 3 to 11. <strong>One in three</strong> of them had a same-week pair 10 or more apart, and about one in ten had one 15 or more apart.</p>
            <p className="prs">Every same-week pair rather than one per student (977 pairs) gives the same median, 6. NBME pairs only (687 pairs): also 6. In the final 14 days, the 127 students who sat two or more forms in that window had a median best minus worst of <strong>10 points</strong>.</p>
            <p className="prs">Two different measurements agree on how big this noise is. The same-week gaps above are what you would expect if each form lands about 6 points either side of where you really are. Separately, with each student&apos;s improvement line removed, a single form wobbles around that line by a median of about <strong>6 points</strong> (178 students). Seven forms wobbling that much would span about <strong>16 points</strong> by chance alone, which is the size of the gap left in section 3 once improvement came out. That last figure is a simulation, so it is an estimate rather than an observation.</p>
            <p className="prs">For scale: on the NRMP data behind the <Link href="/step-2-score-by-specialty">specialty page</Link>, the average Step 2 of matched US MD seniors runs from 241 in Family Medicine to 253 in Dermatology, Orthopaedics, ENT and Plastics, a 12 point spread across 22 specialties (understated at the top, because the source data stops at a 250-and-up band). A third of the students who sat two forms in the same week saw them disagree by 10 or more.</p>
            <p className="prs"><strong>So which one is the real you?</strong> Each of them, give or take about six points, and the older ones were the real you when you sat them.</p>
          </Section>

          <Section id="predictive" n="05" title="Is one form more predictive than the others?">
            <Figure n={3} src="/research/wn_fig3_by_form.svg" width={576} height={403} alt="Dot plot of the correlation between each practice form and the real Step 2 score, for every sitting and for sittings in the last three weeks" caption="Hollow dots use every sitting of the form; filled dots use only sittings 21 or fewer days before the exam, with 95% intervals, for forms with 30 or more such students. The late dots sit together." />
            <p className="prs">This is the version of the question that gets asked most. Across every sitting, the correlation between a form&apos;s printed score and the real score runs from 0.59 (NBME 10, 176 students) to 0.75 (UWSA 2, 128 students), which looks like an answer. It is mostly an answer about timing: UWSA 2, NBME 15 and NBME 16 are the forms people sit last.</p>
            <p className="prs">Restrict every form to sittings 21 or fewer days before the exam, keeping forms with 30 or more students, and the correlations land between <strong>0.72 and 0.77</strong>:</p>
            <Table
              label="Correlation with the real score, forms sat 21 or fewer days out"
              head={['Form, sat 21 or fewer days out', 'students', 'correlation', '95% interval']}
              num={[1, 2, 3]}
              minWidth={520}
              rows={[
                ['NBME 11', '30', <b key="b">0.74</b>, '0.51 to 0.87'],
                ['NBME 12', '55', <b key="b">0.76</b>, '0.62 to 0.85'],
                ['NBME 13', '87', <b key="b">0.72</b>, '0.60 to 0.81'],
                ['NBME 14', '115', <b key="b">0.76</b>, '0.67 to 0.83'],
                ['NBME 15', '147', <b key="b">0.77</b>, '0.70 to 0.83'],
                ['NBME 16', '47', <b key="b">0.76</b>, '0.60 to 0.86'],
                ['UWSA 2', '78', <b key="b">0.77</b>, '0.66 to 0.84'],
              ]}
            />
            <p className="prs">Every interval overlaps every other. NBME 9, NBME 10, UWSA 1 and UWSA 3 are too rarely sat late to say anything (6, 19, 14 and 13 students). Pooling all forms by when they were sat says the same thing from the other side: correlation 0.74 in the final week (176 sittings), 0.71 at 15 to 28 days (346) and 0.54 at 57 days or more (204). Those are sittings, not students, so read them as description.</p>
            <p className="prs"><strong>It is when, not which.</strong> The small differences in how each form prints are real, and each form has its own page with its conversion table:</p>
            <div className="mk isl">
              <div className="gjump">
                {FORMS.map((form) => (
                  <Link key={form} href={`/step-2-score-predictor/${formSlug(form)}`} onClick={() => track('form_page_click', { surface: CAMPAIGN, form })}>{form}</Link>
                ))}
              </div>
            </div>
          </Section>

          <Section id="one" n="06" title="If you want one number">
            <p className="prs">Most people collapse their forms into one number by averaging them. Here is every simple rule I could build, scored against the real score on the same 230 students:</p>
            <Table
              label="One-number rules scored against the real score"
              head={['Rule', 'average miss, read as is', 'within 7 points', 'average miss, corrected']}
              num={[1, 2, 3]}
              hl={[0, 2]}
              minWidth={600}
              rows={[
                ['Best form', <b key="b">6.7</b>, '66%', <b key="c">6.6</b>],
                ['Last form sat', '8.7', '50%', '7.4'],
                ['Recency-weighted average', '11.6', '30%', <b key="c">6.6</b>],
                ['Plain average of every form', '14.2', '20%', '7.1'],
                ['First form sat', '22.8', '17%', '12.4'],
                ['Worst form', '28.0', '3%', '11.1'],
              ]}
            />
            <p className="prs">Read as is, your best form is the closest single number on your score sheet. The median student beat their own best form by <strong>2 points</strong> (middle half 3 below to 7 above): 54% beat it, 8% matched it exactly, and 38% fell short, mostly by a little (17% by more than 5, 5% by more than 10). 99% beat their worst.</p>
            <p className="prs"><strong>What does not survive.</strong> The last column is the fairer test: each rule gets its own average climb, learned on the other 229 students and applied to the one left out. Corrected that way, best form and the recency-weighted average tie at 6.6 (paired bootstrap difference 0.06 points, 95% interval from 0.51 one way to 0.35 the other), and the plain average is barely behind at 7.1. With a fuller straight-line correction those three all land between 5.2 and 5.4. The last form you sat is the one rule that stays measurably worse once corrected: best form beats it by 0.9 points (95% interval 0.3 to 1.5), which fits a single form carrying all of its noise with nothing to average it against.</p>
            <p className="prs">So &quot;averaging is the worst rule&quot; is only true if you read the average raw. The average is not wrong. It is low, by a median 13 points in this set, because almost everyone climbs.</p>
            <p className="prs">Why does best form work at all? My read, and it is a read: two biases happen to cancel. Your best form is inflated by luck, because it is the highest of several noisy draws. Your real score sits above your practice forms, because you keep improving until exam day and because this sample skews high. In the middle of the range the two roughly offset. At the edges they do not:</p>
            <Figure n={4} src="/research/wn_fig4_vs_best.svg" width={576} height={331} alt="Dot plot of real score minus best practice form by where the best form landed: plus 13 under 240, plus 5, plus 4, minus 1, minus 4 at 270 and up" caption="Real score minus best printed form, grouped by where the best form landed. Dot is the median, bar the middle half. Right of the line means the real score beat the best form." />
            <Table
              label="Real score minus best form, by where the best form landed"
              head={['Best form', 'students', 'real minus best, median', 'middle half', 'fell short']}
              num={[1, 2, 3, 4]}
              minWidth={600}
              rows={CALC.vsBestByBand.map((b) => [b.label, String(b.n), <b key="b">{signed(b.median)}</b>, `${signed(Math.round(b.p25))} to ${signed(Math.round(b.p75))}`, `${b.belowPct}%`])}
            />
            <p className="prs">This is the same pull toward the middle that the <Link href="/research/nbme-to-step-2">NBME analysis</Link> found for practice averages, showing up in best forms. And the more forms you sit, the luckier your best one tends to be: students with nine or more forms (53) landed a median 1 point below their best and 53% fell short, against a median 8 above for students with two to four forms (28). When the best form stood 10 or more points clear of the next best (26 students), 54% fell short of it. I went looking for that last group after seeing the rest, and it is small, so treat it as a hint rather than a finding.</p>
          </Section>
        </ArticleBody>

        <Stage category="step2">
          <StageHead id="yours" n="07" title="Put your own forms in" />
          <SpreadCheck />
        </Stage>

        <BodyCont toc={TOC}>
          <Pitch
            kicker="Between forms"
            title="The gap closes when the weak spots do."
            body="Step Gunner is built for the days between practice tests: CK Gold cards and Next Best Step chains, LFX drills, spaced repetition that brings your misses back until they stick, and a readiness range that moves as you add each score. Free to start."
            primary={{ store: true, loc: 'mid', label: 'Get Step Gunner free' }}
            secondary={{ href: '/research/dedicated-calendar', label: 'When people sit each form', onClick: () => track('cta_calendar_post', { surface: CAMPAIGN }) }}
          />

          <Section id="do" n="08" title="What I would actually do with this">
            <p className="prs"><strong>Stop crowning a form.</strong> A 10 point disagreement between two forms sat in the same week happened to a third of the students who did that. It is not information about which form is real.</p>
            <p className="prs"><strong>Treat your early forms as history, not noise.</strong> For 90% of students the worst form came first. It was right at the time.</p>
            <p className="prs"><strong>Read your last two or three forms as a group.</strong> No form is privileged once you account for when it was sat, and the one rule that stays worse after correction is trusting your single most recent form.</p>
            <p className="prs"><strong>If you want one number without doing any math, use your best form, then adjust for where it sits.</strong> Under 240, the students here cleared it by a median 13. At 270 and up, 79% did not reach it. If you sat nine or more forms, expect to land around it rather than above it.</p>
            <p className="prs"><strong>If you will do the math, let something do it with your dates.</strong> The <Link href="/readiness">readiness check</Link> weights recent forms more, applies the three per-form corrections and gives a range.</p>
          </Section>

          <Section id="limits" n="09" title="What this cannot tell you">
            <ul className="rs-ul">
              <li><strong>The sample posts.</strong> Mean real score 258 against a national median near 251. The gap between forms was wider for lower scorers here: median 25 for the 21 students who scored under 245 and 27 for the 60 at 245 to 254, against 20 for the 62 at 265 and up, even though the top group sat more forms. If that holds outside Reddit, a typical student&apos;s forms spread more than this page says, not less.</li>
              <li><strong>Dates are what people remembered.</strong> 1,255 of the 1,592 forms carry a days-out figure. The improvement and same-week numbers use dated forms only.</li>
              <li><strong>The best-form table describes these 230 people.</strong> It was not tested on students outside the set, and its bottom row rests on 21 of them.</li>
              <li><strong>A good correlation is not a promise.</strong> A correlation of 0.77 accounts for about 60% of the variation in real scores among these students. The other 40% is not in any single form.</li>
            </ul>
          </Section>

          <Section id="changed" n="10" title="What changed while I checked it">
            <p className="prs">The outline for this post said averaging your forms is the worst rule there is, and that your best form beats it. I recomputed both from the raw file. The best-form numbers held: average miss 6.7 against 14.2, and a median student 2 points above their best. The &quot;worst rule&quot; part did not. It is only true if you read the average raw; give each rule its own correction and the average lands within half a point of the best form.</p>
            <p className="prs">The outline also read the whole 23 point gap as two versions of the same you. Taking it apart changed that: some of it is you six weeks earlier, and most of the rest is about six points of noise per form. And the best-form rule turned out to depend on where your best form sits, which the outline did not have. I am telling you because the same score reports feed the predictor on this site, and you should know how it gets checked.</p>
          </Section>

          <Section id="short" n="11" title="The short version">
            <p className="prs">Your forms will probably sit about 23 points apart. Some of that is you improving. Most of it is each form landing a few points either side of you, and two forms in the same week disagree by 10 or more for a third of the people who sit them that way. No form is the most predictive once you account for when it was sat.</p>
            <p className="prs"><strong>None of your forms is the real you. The recent ones together are.</strong></p>
          </Section>

          <ChoicePair
            store={{ label: 'Get Step Gunner free', sub: 'CK Gold, Next Best Step, LFX, readiness range' }}
            alt={{ href: '/readiness', label: 'Run the readiness check', sub: 'free, uses your dates and corrections', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'cta_bottom' }) }}
          />

          <Section id="method" n="" title="Data and method">
            <p className="prs">Score-report posts from r/step2 (the aggregate scrape plus the 07-29, 08-05 and 08-19 threads), parsed into one row per assessment with usernames dropped at ingest: 269 reports. A practice form counts when it is an NBME or UWSA marked taken with a three-digit score; percentage and question-count rows for those forms are parser misfires (values like 600% appear) and are excluded, as in every earlier post. The analysis set is the 230 students with a real Step 2 score and two or more forms.</p>
            <p className="prs">Spread is best minus worst printed score. Improvement is each student&apos;s own least-squares line of corrected score against days out, for students with three or more distinct dated forms. Same-week noise is the absolute gap between two different forms sat 7 or fewer days apart. Per-form predictiveness is the Pearson correlation of the printed score with the real score, with Fisher intervals. Rules are scored as average absolute miss read as is, then leave-one-out with each rule&apos;s own average climb, then leave-one-out with a straight-line correction; differences between rules use a paired bootstrap over students (4,000 resamples). &quot;Last form&quot; places undated forms by form order, the same way the <Link href="/readiness/methodology">predictor</Link> does; restricted to the 169 students whose forms are all dated, no rule moves by more than half a point. Figures and calculator constants rebuild from the source data rather than being stored, so neither can drift from what it claims to show.</p>
          </Section>

          <Section id="refs" n="" title="References">
            <div className="refs"><ol>
              <li>USMLE. Step 2 CK Score Interpretation Guidelines (percentile norms, LCME first-takers, July 2022 to June 2025). National median interpolated from that table.</li>
              <li>NRMP. Charting Outcomes in the Match, US MD seniors, pooled 2020 to 2024 (specialty averages on <Link href="/step-2-score-by-specialty">the specialty page</Link>).</li>
              <li>r/step2 score-report threads, 2025 to 2026, parsed with usernames removed at ingest.</li>
            </ol></div>
          </Section>
        </BodyCont>
      </AppShell>
    </>
  );
}
