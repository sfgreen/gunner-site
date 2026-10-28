import Link from 'next/link';
import { useState } from 'react';
import {
  AppShell, ArticleBody, ArticleHeader, Callout, Faq, faqJsonLd, Hero, Icon, Section, Stage,
  StatStrip, Table,
} from '../../components/app';
import {
  BodyCont, ChoicePair, PageHead, Pitch, ResearchStyles, StageHead, Summary, W820,
} from '../../components/app/research';
import { FORM_PAGES } from '../../lib/forms';
import {
  APP, Band, BANDS, DOWNLOAD, FORUM, INDEX, MIN_CELL, NATIONAL, TOTAL_PAIRS, TOTAL_STUDENTS,
  bandCell, bandOf, bandTitle, fmt, formCell, generatedDate, generatedOn, signed, usable,
} from '../../lib/scoreIndex';
import { track } from '../../lib/analytics';

// /data/nbme-step2: the outcome index published as data rather than as a
// conclusion. The site already has the model (/step-2-score-predictor), the
// per-form pages and the research write-up; what none of them do is hand over
// the cells, which is the thing other people can cite and link to.
//
// Every number on this page is read from lib/scoreIndex.ts, which reads the
// generator's output. Nothing is typed in by hand, so the copy cannot drift
// from the file in the download section, and a regenerated index updates the
// prose with it. A cell the generator suppressed renders as a count only.
//
// Built from the app-look blocks (components/app/README.md): the lookup sits in
// a Stage band between the two halves of the article grid, like the specialty
// tool. No em or en dashes anywhere in the copy (site rule).
const CAMPAIGN = 'data_nbme_step2';
const CANONICAL = 'https://stepgunner.com/data/nbme-step2';
const PUBLISHED = '2026-10-27';
const H1 = 'NBME to Step 2 CK score conversion, as data';

// The forms the index actually carries, in the order the site lists them
// (NBME 9 up, then the UWSAs), each one a page that already exists.
const FORMS = FORM_PAGES.filter((f) => formCell('forum', f.slug));

// The worked example in section 01. NBME 13 carries the most students with
// every band populated, so it is the one form where the shape is visible
// without a suppressed cell interrupting it.
const LEDE = 'nbme-13';
const LEDE_FORM = FORM_PAGES.find((f) => f.slug === LEDE)!;

// The claim in the summary, counted rather than asserted: forms where both the
// bottom and the top band have enough students to report, and of those, the
// ones where the bottom band gained more than the top band did.
const ENDS = FORMS.filter(
  (f) => usable(bandCell('forum', f.slug, 'below 230')) && usable(bandCell('forum', f.slug, '260 and up')),
);
const ENDS_FALLING = ENDS.filter(
  (f) => (bandCell('forum', f.slug, 'below 230')!.medianDelta ?? 0)
    > (bandCell('forum', f.slug, '260 and up')!.medianDelta ?? 0),
);

const TOC: [string, string][] = [
  ['gain', 'The gain is not a property of the form'],
  ['look', 'Look up your form and printed score'],
  ['cohorts', 'Two cohorts, and one of them runs hot'],
  ['forms', 'Every form in the index'],
  ['download', 'Download, licence, citation'],
  ['method', 'Method'],
  ['limits', 'Limits'],
  ['faq', 'Questions'],
];

const FAQ = [
  {
    q: 'Is there an official NBME to Step 2 CK conversion table?',
    a: 'No. NBME reports a self-assessment score on the same three-digit scale as Step 2 CK but publishes '
      + 'no conversion, because a practice form and the real exam are different tests taken on different '
      + 'days. What can be measured is what happened to students who printed a given score, which is what '
      + 'this index is: 1,741 printed scores paired with the real Step 2 CK score that followed.',
  },
  {
    q: 'How much do people gain from their NBME to the real exam?',
    a: 'It depends almost entirely on where they started, which is why a single number is misleading. In '
      + 'the forum cohort, students who printed below 230 on NBME 13 gained a median 33 points, and students '
      + 'who printed 260 or more gained 1.5. The same pattern holds in every form here with enough students '
      + 'at both ends.',
  },
  {
    q: 'Why would the gain shrink as the printed score rises?',
    a: 'Mostly regression to the mean. A low printed score usually contains a bad day, and bad days do not '
      + 'repeat on purpose, so the next measurement of the same student lands higher. A very high printed '
      + 'score has the opposite problem: some of it was a good day, and there is also less room above it. '
      + 'None of that is a claim about studying harder.',
  },
  {
    q: 'Can I use this data in my own post or paper?',
    a: 'Yes. It is published under CC BY 4.0, so you can reuse and republish it with attribution. The CSV '
      + 'and JSON are linked on this page, and the citation line is in the file itself.',
  },
];

type Read = { band: Band; forum: ReturnType<typeof bandCell>; app: ReturnType<typeof bandCell> };

export default function ScoreIndex() {
  const [slug, setSlug] = useState(LEDE);
  const [printed, setPrinted] = useState('');

  const form = FORM_PAGES.find((f) => f.slug === slug)!;
  const cell = formCell('forum', slug)!;
  const appCell = formCell('app', slug);
  const score = Number(printed);
  const band = printed.length === 3 ? bandOf(score) : null;
  const read: Read | null = band
    ? { band, forum: bandCell('forum', slug, band), app: bandCell('app', slug, band) }
    : null;

  const lede = formCell('forum', LEDE)!;
  const nine = formCell('forum', 'nbme-9');
  const nineLow = bandCell('forum', 'nbme-9', 'below 230');
  const nineHigh = bandCell('forum', 'nbme-9', '260 and up');

  const desc = `Every NBME and UWSA printed score paired with the real Step 2 CK score that followed: `
    + `${TOTAL_PAIRS.toLocaleString()} pairs from ${TOTAL_STUDENTS} students, by form and printed band, free to download.`;

  const dataset = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'NBME to Step 2 CK Outcome Index',
    description: `Practice-form printed scores (NBME 9 to 16, UWSA 1 to 3) paired with the real USMLE `
      + `Step 2 CK score that followed, summarised by form and by printed-score band, from two `
      + `independently sampled cohorts: ${FORUM.students} students whose r/step2 score-release reports `
      + `were parsed and de-identified, and ${APP ? APP.students : 0} Step Gunner users who reported a `
      + `score after exam day. Cells under ${MIN_CELL} students report a count only.`,
    url: CANONICAL,
    version: String(INDEX.version),
    datePublished: PUBLISHED,
    dateModified: generatedDate(),
    license: 'https://creativecommons.org/licenses/by/4.0/',
    isAccessibleForFree: true,
    keywords: ['USMLE Step 2 CK', 'NBME self-assessment', 'UWSA', 'score conversion', 'medical education'],
    measurementTechnique: 'Per-student pairing of a self-reported practice-form score with a self-reported real Step 2 CK score',
    variableMeasured: ['printed practice-form score', 'real Step 2 CK score', 'score gain from form to exam'],
    creator: {
      '@type': 'Person',
      name: 'Danny Varghese',
      description: 'MS4, Texas A&M College of Medicine',
      url: 'https://stepgunner.com',
    },
    publisher: { '@type': 'Organization', name: 'Step Gunner', url: 'https://stepgunner.com' },
    distribution: [
      {
        '@type': 'DataDownload',
        name: 'NBME to Step 2 CK Outcome Index, CSV',
        encodingFormat: 'text/csv',
        contentUrl: `https://stepgunner.com${DOWNLOAD.csv}`,
      },
      {
        '@type': 'DataDownload',
        name: 'NBME to Step 2 CK Outcome Index, JSON',
        encodingFormat: 'application/json',
        contentUrl: `https://stepgunner.com${DOWNLOAD.json}`,
      },
    ],
  };

  return (
    <>
      <PageHead
        metaTitle="NBME to Step 2 CK Conversion: 1,741 Real Score Pairs"
        metaDesc={desc}
        ogImage="/og/research/nbme-to-step-2.png"
        ogAlt={H1}
      >
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content="NBME to Step 2 CK score conversion, as data" />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }} />
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQ)) }} />
      </PageHead>

      <AppShell campaign={CAMPAIGN} pageType="data" section="research">
        <ResearchStyles />
        <Hero>
          <ArticleHeader
            category="step2"
            crumb={[{ href: '/research', label: 'Research' }, { label: 'NBME to Step 2 index' }]}
            eyebrow="Open data"
            title={H1}
            accent="as data"
            dek={<>
              Every NBME and UWSA printed score we hold, paired with the real Step 2 CK score that
              followed, broken out by the score you actually printed. The cells, not a conclusion
              drawn from them.
            </>}
            meta={[
              <><b>{TOTAL_PAIRS.toLocaleString()}</b> score pairs</>,
              <><b>{TOTAL_STUDENTS}</b> students, two cohorts</>,
              <>{INDEX.license}</>,
              <>Built {generatedOn()}</>,
            ]}
          />
          <Summary>
            <p>
              A form-level number like &quot;{nine ? `NBME 9 adds ${fmt(nine.medianDelta)} points` : 'NBME 9 adds points'}&quot;
              is mostly a statement about who takes NBME 9, not about the form.
              {usable(nineLow) && usable(nineHigh) && <>
                {' '}Inside form 9, students who printed below 230 gained a median
                of <b>{signed(nineLow.medianDelta)}</b>, and students who printed 260 or more
                gained <b>{signed(nineHigh.medianDelta)}</b>.
              </>}
              {' '}The gain falls as the printed score rises in {ENDS_FALLING.length} of
              the {ENDS.length} forms here with enough students at both ends, which is most of what a
              conversion table hides when it reports one number per form.
            </p>
            <p>
              So this page publishes the cells instead: for each form, and for each band of printed
              score inside it, how many students, what they really scored, and how far they moved.
              Two independently sampled cohorts, {TOTAL_PAIRS.toLocaleString()} pairs,
              every cell carrying its own sample size, under {INDEX.license}. The file is at
              the bottom and you may republish it.
            </p>
          </Summary>
          <W820>
            <Callout label="Read this first">
              <p>{INDEX.readThisFirst.both}</p>
            </Callout>
          </W820>
        </Hero>

        <ArticleBody toc={TOC}>
          <Section id="gain" n="01" title="The gain is not a property of the form">
            <p className="prs">
              Every conversion table, including the ones on this site, reports something like
              &quot;this form reads a few points low.&quot; That is a real effect and it is small.
              The large effect is where you started. Here is one form, the one with the most
              students and no thin cells, split by what the student printed.
            </p>
            <Table
              label={`${LEDE_FORM.form}: real Step 2 CK outcome by printed score, forum cohort`}
              head={[`${LEDE_FORM.form} printed`, 'Students', 'Median real Step 2', 'Median gain']}
              num={[1, 2, 3]}
              minWidth={440}
              rows={BANDS.filter((b) => lede.bands[b]).map((b) => {
                const c = lede.bands[b];
                return usable(c)
                  ? [
                    <b key="b">{bandTitle(b)}</b>,
                    String(c.n),
                    fmt(c.medianActual),
                    <b key="d">{signed(c.medianDelta)}</b>,
                  ]
                  : [<b key="b">{bandTitle(b)}</b>, String(c.n), <span key="x" className="rs-thin">too few</span>, ''];
              })}
            />
            <p className="rs-fine">
              {LEDE_FORM.form}, {cellCount(LEDE)} students who printed a score on it and later posted a
              real one. The median gain across all of them is <b>{signed(lede.medianDelta)}</b>, which is
              the number a conversion table would print, and which is right for nobody in particular.
            </p>
            <p className="prs">
              Most of that slope is regression to the mean rather than anything about effort. A low
              printed score usually contains a bad day, and bad days do not repeat on purpose, so the
              next measurement of the same student lands higher. A very high printed score has the
              opposite problem, plus less room above it. The practical read is the one the folklore
              gets backwards: if you printed in the 220s the common advice is too pessimistic about
              you, and if you printed in the 260s it is too optimistic.
            </p>
          </Section>
        </ArticleBody>

        <Stage category="step2">
          <StageHead id="look" n="02" title="Look up your form and printed score" />
          <div className="mk isl">
            <div className="sheet dark-card rs-tool rs-dk rs-ix">
              <div className="sheet-bd rs-ix-g">
                <div className="rs-ix-in">
                  <div className="rs-ix-f">
                    <div className="fld">
                      <label htmlFor="rs-ix-form">Form</label>
                      <span className="sel">
                        <select
                          id="rs-ix-form"
                          className="inp"
                          value={slug}
                          onChange={(e) => { setSlug(e.target.value); track('index_form_select', { form: e.target.value }); }}
                        >
                          {FORMS.map((f) => <option key={f.slug} value={f.slug}>{f.form}</option>)}
                        </select>
                        <Icon name="chev" sm />
                      </span>
                    </div>
                    <div className="fld">
                      <label htmlFor="rs-ix-score">Printed score</label>
                      <input
                        id="rs-ix-score"
                        className="inp"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="240"
                        value={printed}
                        onChange={(e) => setPrinted(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                      />
                    </div>
                  </div>
                  <div aria-live="polite">
                    {!read && (
                      <p className="rs-read">
                        Type the three-digit score your {form.form} report printed. The table beside this
                        shows every band; entering your score highlights the row you are in and reads it
                        out here.
                      </p>
                    )}
                    {read && !usable(read.forum) && (
                      <p className="rs-read warn">
                        Only {read.forum ? read.forum.n : 0} students in the index printed {bandTitle(read.band)} on{' '}
                        {form.form}, under the {MIN_CELL} needed to report a median, so there is nothing
                        honest to tell you about that cell yet. The whole-form row is still worth reading,
                        and so is a neighbouring form.
                      </p>
                    )}
                    {read && usable(read.forum) && (
                      <>
                        <p className="rs-read ok">
                          <b>{read.forum.n} students</b> printed {bandTitle(read.band).toLowerCase()} on {form.form}.
                          Their median real Step 2 was <b>{fmt(read.forum.medianActual)}</b>, the middle half
                          landed between <b>{fmt(read.forum.p25Actual)}</b> and <b>{fmt(read.forum.p75Actual)}</b>,
                          and the median gain was <b>{signed(read.forum.medianDelta)}</b> points
                          (middle half {signed(read.forum.deltaP25)} to {signed(read.forum.deltaP75)}).
                        </p>
                        {usable(read.app) ? (
                          <p className="rs-read">
                            In the app cohort, which sits much closer to the national mean, the
                            same cell holds <b>{read.app.n} students</b> with a median real score
                            of <b>{fmt(read.app.medianActual)}</b> and a median gain
                            of <b>{signed(read.app.medianDelta)}</b>.
                          </p>
                        ) : (
                          <p className="rs-read warn">
                            The app cohort has {read.app ? read.app.n : 0} students in this cell, too few to
                            report. That cohort is the one without the Reddit skew, and it only grows when
                            people come back and enter a real score.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <p className="fine">
                    Forum cohort unless stated. {INDEX.readThisFirst.forum}
                  </p>
                </div>
                <div className="rs-ix-out">
                  <Table
                    label={`${form.form}: real Step 2 CK outcome by printed score`}
                    head={[`${form.form} printed`, 'Students', 'Median real', 'Median gain']}
                    num={[1, 2, 3]}
                    hl={BANDS.filter((b) => cell.bands[b]).map((b, i) => (read?.band === b ? i : -1)).filter((i) => i >= 0)}
                    minWidth={420}
                    rows={BANDS.filter((b) => cell.bands[b]).map((b) => {
                      const c = cell.bands[b];
                      return usable(c)
                        ? [
                          <><b>{bandTitle(b)}</b>{read?.band === b ? <span className="rs-you">you</span> : null}</>,
                          String(c.n),
                          fmt(c.medianActual),
                          <b key="d">{signed(c.medianDelta)}</b>,
                        ]
                        : [
                          <><b>{bandTitle(b)}</b>{read?.band === b ? <span className="rs-you">you</span> : null}</>,
                          String(c.n),
                          <span key="x" className="rs-thin">too few</span>,
                          '',
                        ];
                    })}
                  />
                  <p className="fine">
                    All {form.form} students in the index: <b>{cell.n}</b>, median printed{' '}
                    <b>{fmt(cell.medianPrinted)}</b>, median real <b>{fmt(cell.medianActual)}</b>,
                    median gain <b>{signed(cell.medianDelta)}</b>.{' '}
                    <Link href={`/step-2-score-predictor/${form.slug}`}>
                      The {form.form} page
                    </Link>{' '}
                    runs the same printed score through the projection model instead.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <style jsx global>{`
            .mk .rs-ix-g { display: grid; gap: 24px; }
            .mk .rs-ix-in { display: grid; gap: 16px; align-content: start; min-width: 0; }
            .mk .rs-ix-f { display: grid; gap: 12px; }
            .mk .rs-ix-out { min-width: 0; }
            .mk .rs-ix-out .tbl-w { margin-top: 0; }
            @media (min-width: 600px) { .mk .rs-ix-f { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); } }
            @media (min-width: 960px) {
              .mk .rs-ix-g { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); gap: 32px; }
              .mk .rs-ix .sheet-bd { padding: 28px; }
            }
          `}</style>
        </Stage>

        <BodyCont toc={TOC}>
          <Section id="cohorts" n="03" title="Two cohorts, and one of them runs hot">
            <p className="prs">
              The two halves of this index were sampled in completely different ways, which is the
              reason to publish both. One is public score-release posts on r/step2. The other is
              students who used the app and entered a real score after exam day. Neither is a random
              sample of test takers, and they are not skewed the same way.
            </p>
            <StatStrip
              items={[
                { value: <>{fmt(FORUM.level.medianActual)}</>, label: `Median real score, forum cohort (${FORUM.students} students)` },
                { value: <>{APP ? fmt(APP.level.medianActual) : '--'}</>, label: `Median real score, app cohort (${APP ? APP.students : 0} students)` },
                { value: <>{NATIONAL.mean}</>, label: `National mean, ${NATIONAL.population}` },
              ]}
              source={NATIONAL.source}
            />
            <Table
              label="How the two cohorts compare, and where each sits against the national mean"
              head={['Cohort', 'Students', 'Mean real score', 'Against national mean']}
              num={[1, 2, 3]}
              minWidth={460}
              rows={[
                [
                  <b key="b">r/step2 reports</b>, String(FORUM.students),
                  fmt(FORUM.level.meanActual),
                  <b key="v">{signed(FORUM.level.vsNationalMean)}</b>,
                ],
                ...(APP && !APP.level.suppressed ? [[
                  <b key="b">App reports</b>, String(APP.students),
                  fmt(APP.level.meanActual),
                  <b key="v">{signed(APP.level.vsNationalMean)}</b>,
                ]] : []),
              ]}
            />
            <p className="rs-fine">
              One real score per student, not per pair, so a student who posted six forms counts
              once. Forum: {FORUM.pairs.toLocaleString()} pairs, median {fmt(FORUM.level.medianActual)},
              SD {fmt(FORUM.level.sdActual)}, range {fmt(FORUM.level.minActual)} to{' '}
              {fmt(FORUM.level.maxActual)}.
              {APP && !APP.level.suppressed && <>
                {' '}App: {APP.pairs.toLocaleString()} pairs, median {fmt(APP.level.medianActual)},
                SD {fmt(APP.level.sdActual)}, range {fmt(APP.level.minActual)} to{' '}
                {fmt(APP.level.maxActual)}.
              </>}
              {' '}National reference: {NATIONAL.source}, {NATIONAL.population}, SD {NATIONAL.sd}.
            </p>
            <p className="prs">
              The forum cohort is a narrow slice sitting
              about <b>{fmt(Math.abs(FORUM.level.vsNationalMean ?? 0))} points above</b> the national
              mean, with a standard deviation of {fmt(FORUM.level.sdActual)} against a national 15: it
              is missing most of the bottom half of the distribution. People who did well post more.
              {APP && !APP.level.suppressed && <>
                {' '}The app cohort is smaller but wider, with a spread
                of {fmt(APP.level.sdActual)} and a range from {fmt(APP.level.minActual)}{' '}
                to {fmt(APP.level.maxActual)}, and its mean sits {fmt(Math.abs(APP.level.vsNationalMean ?? 0))}{' '}
                {(APP.level.vsNationalMean ?? 0) < 0 ? 'below' : 'above'} the national mean.
              </>}
            </p>
            <p className="prs">
              The practical consequence: read a gain from the forum cohort as a ceiling. It describes
              what happened to students who were already scoring well. The app cohort is the less
              skewed one, and it is too small to carry per-band detail yet, which is a problem that
              fixes itself only if people come back after exam day and type a number in.
            </p>
            <Pitch
              kicker="How the second cohort grows"
              title="The app asks for your real score after exam day, and that is the whole mechanism."
              body="Post-exam mode goes quiet on study prompts once your date passes and asks for the one number that makes this dataset better. It is the same ask whether or not you paid for anything."
              primary={{ store: true, loc: 'mid', label: 'Get Step Gunner free' }}
              secondary={{ href: '/step-2-score-predictor', label: 'Or run the projection', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_mid' }) }}
              trust={<>{APP ? APP.students : 0} students have entered a real score and the forms behind it, against {FORUM.students} parsed from Reddit. Every entry widens the half of this dataset that is not a Reddit sample.</>}
            />
          </Section>

          <Section id="forms" n="04" title="Every form in the index">
            <p className="prs">
              Whole-form rows, forum cohort. The band detail behind each one is in the lookup above
              and in the file below. Each form name links to its own page, which runs a printed score
              through the projection model rather than reporting what happened to other people.
            </p>
            <Table
              label="Every form in the index: students, printed score, real score and gain"
              head={['Form', 'Students', 'Median printed', 'Median real', 'Median gain']}
              num={[1, 2, 3, 4]}
              minWidth={520}
              rows={FORMS.map((f) => {
                const c = formCell('forum', f.slug)!;
                return usable(c)
                  ? [
                    <Link key="l" href={`/step-2-score-predictor/${f.slug}`}>{f.form}</Link>,
                    String(c.n),
                    fmt(c.medianPrinted),
                    fmt(c.medianActual),
                    <b key="d">{signed(c.medianDelta)}</b>,
                  ]
                  : [
                    <Link key="l" href={`/step-2-score-predictor/${f.slug}`}>{f.form}</Link>,
                    String(c.n),
                    <span key="x" className="rs-thin">too few</span>, '', '',
                  ];
              })}
            />
            <p className="rs-fine">
              A median gain is the median of per-student gains, so it is not the difference between
              the two medians beside it. The quartiles of gain, and the same cells split by printed
              band, are in the file. Forms differ here mostly because different students take
              them at different points in dedicated, not because one form is harder: NBME equates 10
              through 16 onto a common scale.{' '}
              <Link href="/research/which-nbme-is-most-predictive">Which form predicts best</Link> is
              a separate question with a separate answer.
            </p>
          </Section>

          <Section id="download" n="05" title="Download, licence, citation">
            <p className="prs">
              Both files are the same build of the index, generated {generatedOn()}. The CSV is one
              row per cell, which is what you want for a chart or a post. The JSON carries the same
              cells plus the provenance block and the per-cohort caveats.
            </p>
            <div className="mk isl">
              <div className="rs-act">
                <a className="btn btn-q" href={DOWNLOAD.csv} download onClick={() => track('index_download', { format: 'csv' })}>
                  Download the CSV
                </a>
                <a className="btn btn-q" href={DOWNLOAD.json} download onClick={() => track('index_download', { format: 'json' })}>
                  Download the JSON
                </a>
              </div>
            </div>
            <Table
              label="What each column in the CSV means"
              head={['Column', 'What it is']}
              minWidth={520}
              rows={[
                [<b key="b">cohort</b>, <span key="v" className="rs-how">forum (parsed r/step2 reports) or app (first-party post-exam reports)</span>],
                [<b key="b">form</b>, <span key="v" className="rs-how">nbme-9 through nbme-16, uwsa-1 through uwsa-3</span>],
                [<b key="b">band</b>, <span key="v" className="rs-how">the printed-score band, or &quot;all forms&quot; for the whole-form row</span>],
                [<b key="b">n</b>, <span key="v" className="rs-how">students in the cell. Under {MIN_CELL} and every other column is blank by design</span>],
                [<b key="b">median_printed</b>, <span key="v" className="rs-how">median score the practice form printed</span>],
                [<b key="b">median_actual</b>, <span key="v" className="rs-how">median real Step 2 CK score that followed</span>],
                [<b key="b">median_delta</b>, <span key="v" className="rs-how">median of per-student gains, real minus printed</span>],
                [<b key="b">p25_actual, p75_actual</b>, <span key="v" className="rs-how">where the middle half of real scores landed</span>],
                [<b key="b">delta_p25, delta_p75</b>, <span key="v" className="rs-how">where the middle half of gains landed</span>],
              ]}
            />
            <p className="prs">
              Licensed <b>{INDEX.license}</b>: reuse it, chart it, republish it, build on it, as long
              as you say where it came from. The citation line travels inside the file:
            </p>
            <div className="mk isl"><p className="fxf rs-eq">{INDEX.citeAs}</p></div>
            <p className="rs-fine">
              What is published is the cell summary, not the underlying records. The forum rows are
              parsed from public posts and carry no usernames, and the app rows are first-party
              reports given for a stated purpose; aggregating before release is the line that keeps
              both of those defensible.
            </p>
          </Section>

          <Section id="method" n="06" title="Method">
            <p className="prs">
              A pair is one practice form with a printed three-digit score, belonging to a student who
              later reported a real Step 2 CK score. A student with six forms contributes six pairs to
              the cells and one score to the cohort-level table. Free 120 percentages are excluded
              because they are not on the three-digit scale; they have{' '}
              <Link href="/research/free-120-to-step-2">their own analysis</Link>.
            </p>
            <p className="prs">
              The forum cohort comes from r/step2 score-release threads, parsed into form, printed
              score, days before the exam where stated, and the outcome, with usernames dropped at
              ingest. Nothing after the 2026-07-29 thread is included. The app cohort comes from
              post-exam mode: once a student&apos;s exam date passes the app stops prompting study and
              asks for the score, by hand in the app or by replying to one email.
            </p>
            <p className="prs">
              Within a cohort and a form, students are split into five printed-score bands, and each
              cell reports n, the median printed score, the median real score, the quartiles of real
              scores, the median gain and the quartiles of gain. Medians rather than means throughout,
              because a handful of very large gains would otherwise set the number. A cell
              under {MIN_CELL} students reports n and nothing else, since a median of four people is
              noise with a decimal point on it.
            </p>
            <p className="prs">
              The generator is a single script in the app repository and the page reads its output
              directly, so every figure above, including the ones inside sentences, changes when the
              index is rebuilt. There is no hand-typed number on this page to go stale.
            </p>
          </Section>

          <Section id="limits" n="07" title="Limits">
            <ul className="rs-ul">
              <li>
                <strong>Self-report on both ends.</strong> Printed scores and real scores are what
                people said they got. Nothing here is verified against a score report, and the
                incentive to round up is obvious.
              </li>
              <li>
                <strong>The forum cohort is the bigger half and the skewed one.</strong> Mean{' '}
                {fmt(FORUM.level.meanActual)} against a national {NATIONAL.mean}, nothing below{' '}
                {fmt(FORUM.level.minActual)}. Gains measured on students who were already scoring
                well are a ceiling, not an expectation.
              </li>
              <li>
                <strong>Timing is pooled, and this is the biggest flaw in version 1.</strong> A form
                taken four months out and the same form taken last week sit in the same cell. Recency
                is known to matter, and it is not in this cut.
              </li>
              <li>
                <strong>Band edges are arbitrary.</strong> A 229 and a 230 are one point apart and
                land in different rows. Read a band as a neighbourhood, not a boundary.
              </li>
              <li>
                <strong>The app cohort is small.</strong> {APP ? APP.students : 0} students,
                so most of its per-band cells are suppressed. It is the cohort worth trusting and
                the one with the least in it.
              </li>
              <li>
                <strong>This is description, not prediction.</strong> What happened to other students
                who printed your score is not a projection for you.{' '}
                <Link href="/step-2-score-predictor">The predictor</Link> is the part that tries to
                answer that, with a published error record.
              </li>
            </ul>
          </Section>

          <Section id="faq" n="" title="Questions">
            <Faq items={FAQ} />
          </Section>

          <ChoicePair
            store={{ label: 'Get Step Gunner', sub: 'and the ask that grows the honest column' }}
            alt={{ href: '/research/nbme-to-step-2', label: 'Read the analysis', sub: 'the model this data was built for, and its misses' }}
          />
        </BodyCont>
      </AppShell>
    </>
  );
}

/** Students on a whole-form row, for a sentence that names the form. */
function cellCount(slug: string): number {
  return formCell('forum', slug)?.n ?? 0;
}
