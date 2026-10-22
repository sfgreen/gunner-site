import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AppShell, ArticleBody, ArticleHeader, Callout, Hero, Icon, NumberedSteps, Section, Stage, StatStrip, StoreButton, Table,
} from '../components/app';
import { BodyCont, PageHead, ResearchStyles, W820 } from '../components/app/research';
import benchmarks from '../lib/specialty_benchmarks.json';
import { PASS, percentile, ordinal } from '../lib/readiness';
import { track } from '../lib/analytics';

// Cluster 3 of the search strategy. Every competitor publishes the same thing:
// the AVERAGE Step 2 score of matched applicants, as prose. That answers the
// wrong question. "The average matched dermatologist scored 253" tells a 244
// nothing about their odds. NRMP publishes P(match | score band), which is the
// question students actually have, and nobody puts it in a tool.
//
// Honesty rules this page lives by, because the whole strategy rests on being
// trusted with numbers: US MD seniors only (stated, not buried), cells with
// thin n flagged rather than smoothed, non-monotonic wobble shown rather than
// tidied, and the causal claim explicitly NOT made.
// Built from the app-look blocks (components/app/README.md): the tool sits in a
// Stage band between the two halves of the article grid.

type Spec = {
  abbr: string;
  matchedAvg: number;
  pMatchPct: Record<string, number | null>;
  nBySeniors: Record<string, number>;
};
const SPECIALTIES = benchmarks.specialties as unknown as Record<string, Spec>;
const META = benchmarks.meta as unknown as { source: string; note: string; passingScore: number };
const BANDS = ['210-219', '220-229', '230-239', '240-249', '250+'];
const THIN = 30; // below this many seniors in a cell, the percentage is noise

const NAMES = Object.keys(SPECIALTIES).sort(
  (a, b) => SPECIALTIES[b].matchedAvg - SPECIALTIES[a].matchedAvg,
);

/** Points of match probability bought by moving from the 230s to 250+. */
function marginal(name: string): number | null {
  const p = SPECIALTIES[name].pMatchPct;
  const lo = p['230-239'];
  const hi = p['250+'];
  return lo == null || hi == null ? null : hi - lo;
}

const LEVERAGE = NAMES
  .map((n) => ({ name: n, gain: marginal(n) }))
  .filter((x): x is { name: string; gain: number } => x.gain != null)
  .sort((a, b) => b.gain - a.gain);

const bandLabel = (b: string) => (b === '250+' ? '250 and up' : `${b.slice(0, 3)}s`);

const TOC: [string, string][] = [
  ['average', 'The average is the wrong number'],
  ['points', 'Whether the next 20 points are worth anything depends entirely on your specialty'],
  ['limits', 'What this data cannot tell you'],
  ['related', 'Related'],
];

export default function ScoreBySpecialty() {
  const [name, setName] = useState('Orthopaedic Surgery');
  const [score, setScore] = useState('');
  const spec = SPECIALTIES[name];

  const n = parseInt(score, 10);
  const valid = !Number.isNaN(n) && n >= 180 && n <= 300;
  const yourBand = useMemo(() => {
    if (!valid) return null;
    if (n >= 250) return '250+';
    if (n >= 240) return '240-249';
    if (n >= 230) return '230-239';
    if (n >= 220) return '220-229';
    if (n >= 210) return '210-219';
    return '<210';
  }, [n, valid]);

  const yourP = yourBand && yourBand !== '<210' ? spec.pMatchPct[yourBand] : null;
  const yourN = yourBand && yourBand !== '<210' ? spec.nBySeniors[yourBand] ?? 0 : 0;

  return (
    <>
      <PageHead metaTitle="Step 2 CK Score by Specialty: Your Odds, Not the Average" metaDesc="Probability of matching at your actual Step 2 CK score, by specialty, from NRMP data on US MD seniors. Not the average score of people who matched.">
        <link rel="canonical" href="https://stepgunner.com/step-2-score-by-specialty" />
        <meta property="og:title" content="What Step 2 score do you need for your specialty?" />
        <meta property="og:description" content="Probability of matching at your actual Step 2 CK score, by specialty, from NRMP data on US MD seniors." />
        <meta property="og:url" content="https://stepgunner.com/step-2-score-by-specialty" />
        <meta property="og:image" content="https://stepgunner.com/api/og" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://stepgunner.com/api/og" />
      </PageHead>

      <AppShell campaign="specialty_targets" pageType="tool">
        <ResearchStyles />
        <Hero>
          <ArticleHeader
            category="step2"
            eyebrow="Match data"
            title="What Step 2 score do you need for your specialty?"
            accent="for your specialty?"
            dek="Every other page answers this with the average score of people who matched. That is the wrong number. Here is the probability of matching at your score."
            byline={false}
          />
          <W820>
            <StatStrip items={[
              { value: '+43', tone: 'good', label: <><span className="rs-sk">Plastic Surgery</span>points of match probability, going from the 230s to 250 and up</> },
              { value: '+1', label: <><span className="rs-sk">Family Medicine</span>the same twenty points, in a specialty that already matches nearly everyone</> },
              { value: '22', label: <><span className="rs-sk">Specialties covered</span>US MD seniors, NRMP pooled 2020 to 2024</> },
            ]} />
            <Callout>
              <p className="rs-pull">
                Twenty more points is the same amount of work in every specialty.{' '}
                <b>What it buys differs by a factor of forty.</b>
              </p>
            </Callout>
          </W820>
        </Hero>

        <ArticleBody toc={TOC}>
          <Section id="average" n="" title="The average is the wrong number">
            <p className="prs">
              &quot;The average matched dermatologist scored 253&quot; is the most repeated sentence in
              Step 2 advice, and it is close to useless. It describes people who already matched. It
              says nothing about what happens to <em>you</em> at 244.
            </p>
            <p className="prs">
              The NRMP publishes the number that actually answers the question: among US MD seniors
              who applied to a specialty, what fraction matched, broken out by Step 2 band. That is
              below, for all 22 specialties, with the sample size of every cell so you can see which
              numbers to trust.
            </p>
          </Section>
        </ArticleBody>

        <Stage category="step2">
          <div className="mk isl">
            <div className="sheet dark-card rs-tool rs-dk rs-sp">
              <div className="sheet-bd rs-sp-g">
                <div className="rs-sp-in">
                  <div className="rs-sp-f">
                    <div className="fld">
                      <label htmlFor="rs-sp-name">Specialty</label>
                      <span className="sel">
                        <select id="rs-sp-name" className="inp" value={name} onChange={(e) => { setName(e.target.value); track('specialty_select', { specialty: e.target.value }); }}>
                          {NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <Icon name="chev" sm />
                      </span>
                    </div>
                    <div className="fld">
                      <label htmlFor="rs-sp-score">Your Step 2 score</label>
                      <input
                        id="rs-sp-score"
                        className="inp"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="245"
                        value={score}
                        onChange={(e) => setScore(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                      />
                    </div>
                  </div>
                  <div aria-live="polite">
                    {valid && yourBand === '<210' && (
                      <p className="rs-read warn">
                        Below 210 the published bands run out of usable data for most specialties, and a
                        score under {PASS} is a fail rather than a low pass. The honest read at that level is
                        that the score is not the thing to optimise next.
                      </p>
                    )}
                    {valid && yourP != null && (
                      <p className={'rs-read ' + (yourN < THIN ? 'warn' : 'ok')}>
                        <b>{n} in {name}:</b> {yourP}% of US MD seniors in the {bandLabel(yourBand!)} matched,
                        out of {yourN.toLocaleString()} applicants in that band.
                        {yourN < THIN && ' That cell has fewer than 30 people in it, so treat the percentage as a rumour, not a rate.'}
                        {' '}Your score sits at the {ordinal(percentile(n))} percentile of all first-takers.
                      </p>
                    )}
                  </div>
                </div>
                <div className="rs-sp-out">
                  <Table
                    label={`Match rate by Step 2 band, ${name}`}
                    head={['Step 2 band', 'Matched', 'Applicants', 'How solid']}
                    num={[1, 2]}
                    hl={BANDS.map((b, i) => (yourBand === b ? i : -1)).filter((i) => i >= 0)}
                    minWidth={460}
                    rows={BANDS.map((b) => {
                      const p = spec.pMatchPct[b];
                      const cn = spec.nBySeniors[b] ?? 0;
                      return [
                        <><b>{bandLabel(b)}</b>{yourBand === b ? <span className="rs-you">you</span> : null}</>,
                        p == null ? '--' : <span className="rs-mag"><span className="rs-bar"><i style={{ width: `${p}%` }} /></span><b>{p}%</b></span>,
                        cn.toLocaleString(),
                        <span key="s" className="rs-solid">
                          {cn === 0 ? 'no data'
                            : cn < THIN ? <span className="rs-thin">too few to trust</span>
                              : cn < 200 ? 'usable' : 'solid'}
                        </span>,
                      ];
                    })}
                  />
                  <p className="fine">
                    Matched average for {name}: <b>{spec.matchedAvg}</b>. {META.source}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Stage>

        <BodyCont toc={TOC}>
          <Section id="points" n="" title="Whether the next 20 points are worth anything depends entirely on your specialty">
            <p className="prs">
              This is the finding worth carrying away, and it is invisible if you only ever read
              average scores. Moving from the 230s to 250 and up is the same amount of work in every
              specialty. It buys wildly different things.
            </p>
            <Table
              label="Match probability bought by moving from the 230s to 250 and up"
              head={['Specialty', '230s', '250+', 'Points bought']}
              num={[1, 2, 3]}
              hl={LEVERAGE.map((l, i) => (l.gain >= 20 ? i : -1)).filter((i) => i >= 0)}
              minWidth={520}
              rows={LEVERAGE.map((l) => {
                const p = SPECIALTIES[l.name].pMatchPct;
                return [
                  l.name,
                  `${p['230-239']}%`,
                  `${p['250+']}%`,
                  <span key="m" className="rs-mag"><span className="rs-bar"><i style={{ width: `${Math.max(0, l.gain) / 43 * 100}%` }} /></span><b>{l.gain > 0 ? `+${l.gain}` : l.gain}</b></span>,
                ];
              })}
            />
            <p className="prs">
              If you are going into primary care with a 235, the honest advice is that more Step 2
              points are close to the least valuable thing you can buy with your remaining weeks.
              If you are going into a surgical subspecialty at the same score, they may be the most
              valuable thing available to you.
            </p>
            <div className="mk isl">
              <div className="rs-act"><Link href="/readiness" className="btn btn-q">See where your practice forms project</Link></div>
            </div>
          </Section>

          <Section id="limits" n="" title="What this data cannot tell you">
            <p className="prs">
              Four limits, stated plainly, because a page that hides them is not worth trusting with
              a decision this size.
            </p>
            <NumberedSteps steps={[
              { text: <><b>It is US MD seniors only.</b> DO students and international graduates face different distributions and often different score expectations. These numbers do not transfer.</> },
              { text: <><b>It is a correlation, not a lever.</b> Students who score 250 also tend to have stronger research, letters, and clerkship grades. The percentage attached to a band is what happened to people in that band, not what a score change would do for you. Nobody has run the experiment where the same applicant applies twice with different scores.</> },
              { text: <><b>Thin cells wobble.</b> Radiation Oncology reads 100% in the 220s and 99% at 250 and up, which is not a real inversion, it is twenty people. Every cell under 30 applicants is marked. Do not build a plan on a marked cell.</> },
              { text: <><b>The top band is open-ended.</b> 250+ has no ceiling, so a specialty whose applicants cluster at 265 looks the same here as one clustering at 252.</> },
            ]} />
            <p className="rs-fine">
              {META.note} Pages still quoting 214 as the passing score are using the pre-2022 number;
              it has been {PASS} since.
            </p>
          </Section>

          <Section id="related" n="" title="Related">
            <div className="mk isl">
              <div className="rel">
                <Link href="/step-2-ck-percentiles"><span className="rt">What your Step 2 score means in percentiles</span><Icon name="arrow" /></Link>
                <Link href="/step-2-score-predictor"><span className="rt">Project your score from practice forms</span><Icon name="arrow" /></Link>
                <Link href="/research/nbme-to-step-2"><span className="rt">The research behind the projection</span><Icon name="arrow" /></Link>
              </div>
              <div className="rs-act"><StoreButton loc="end">Get Step Gunner</StoreButton></div>
            </div>
          </Section>
        </BodyCont>
      </AppShell>
      <style jsx global>{`
        .mk .rs-pull { font-size: 19px; line-height: 1.5; font-weight: 500; color: var(--ink); }
        .mk .rs-pull b { font-weight: 800; }
        .mk .rs-sp-g { display: grid; gap: 24px; }
        .mk .rs-sp-in { display: grid; gap: 16px; align-content: start; min-width: 0; }
        .mk .rs-sp-f { display: grid; gap: 12px; }
        .mk .rs-sp-out { min-width: 0; }
        .mk .rs-sp-out .tbl-w { margin-top: 0; }
        @media (min-width: 600px) { .mk .rs-sp-f { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); } }
        @media (min-width: 960px) { .mk .rs-sp-g { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); gap: 32px; } .mk .rs-sp .sheet-bd { padding: 28px; } }
      `}</style>
    </>
  );
}
