// Research post: when 269 r/step2 students actually sat each practice form.
// Third in the series after nbme-to-step-2 and free-120-to-step-2, same dataset
// and same limitations. This one fills the site's largest content gap: there was
// no dedicated-period planning content at all.
// Figures render from the gunner repo (docs/blog/figures/render_calendar.py).
// Built from the app-look blocks (components/app/README.md).
// No em or en dashes anywhere in the copy (site rule).
import Link from 'next/link';
import {
  AppShell, ArticleBody, ArticleHeader, Figure, Hero, Section, Table,
} from '../../components/app';
import { ChoicePair, PageHead, Pitch, ResearchStyles, Summary } from '../../components/app/research';
import { track } from '../../lib/analytics';

const CAMPAIGN = 'research_dedicated_calendar';
const PUBLISHED = '2026-09-19';
const H1 = 'The dedicated schedule nobody wrote down';

const TOC: [string, string][] = [
  ['schedule', 'The schedule nobody wrote down'],
  ['length', 'How long the whole thing runs'],
  ['count', 'How many forms'],
  ['worth', 'What the calendar converts into'],
  ['do', 'What I would actually do with this'],
  ['limits', 'What this cannot tell you'],
  ['short', 'The short version'],
  ['method', 'Data and method'],
];

export default function DedicatedCalendar() {
  const title = 'Nobody tells you when to take each NBME. Here is when 269 people actually did.';
  const desc = 'The Step 2 CK dedicated schedule from 269 real score reports: the median day each NBME and UWSA gets sat, how many forms people take, and what more time is worth.';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: title,
    description: desc,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    author: { '@type': 'Person', name: 'Danny Varghese', description: 'MS4, Texas A&M College of Medicine', url: 'https://stepgunner.com' },
    publisher: { '@type': 'Organization', name: 'Step Gunner', url: 'https://stepgunner.com' },
    mainEntityOfPage: 'https://stepgunner.com/research/dedicated-calendar',
    about: ['USMLE Step 2 CK', 'dedicated study period', 'NBME self-assessment', 'study schedule'],
  };

  return (
    <>
      <PageHead metaTitle="Step 2 CK Dedicated Schedule: When to Take Each NBME, 269 Reports" metaDesc={desc} ogImage="/og/research/dedicated-calendar.png" ogAlt={H1}>
        <link rel="canonical" href="https://stepgunner.com/research/dedicated-calendar" />
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
            crumb={[{ href: '/readiness', label: 'Readiness check' }, { href: '/research', label: 'Research' }]}
            eyebrow="Research"
            title={H1}
            accent="nobody wrote down"
            dek={<>269 students, 2,042 reported practice scores, and the form calendar almost all of them converged on without being told. When each NBME actually gets sat, how many people take, and what another week is worth.</>}
            meta={[`Published ${PUBLISHED}`, '269 students, 199 with dates', 'About 7 minutes']}
          />
          <Summary>
            <p>There is no official schedule for dedicated, and there turns out to be a real one anyway. Across 269 r/step2 score reports, the median day each form gets sat runs perfectly in order: NBME 9 at 56 days out, NBME 13 at 21, NBME 15 and UWSA 2 at 10, NBME 16 at 6, and the Free 120 at 3. Nobody coordinated that. The median student sits seven forms across about six weeks, finishing a week before the exam, and improves at 1.73 points per week while doing it. The two places the crowd&apos;s instinct costs them are at the end, where the most informative forms arrive too late to act on.</p>
          </Summary>
          <Pitch
            placement="top"
            kicker="Your dates, against this calendar"
            title="Put your exam date in and see where you actually are."
            body="The readiness check takes your forms with the dates you sat them, applies the per-form corrections from this research, and gives you a projected range instead of one fake precise number. Free, no account needed."
            primary={{ href: '/readiness', label: 'Run the readiness check', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_top' }) }}
            secondary={{ store: true, loc: 'top', label: 'Get the app free' }}
          />
        </Hero>

        <ArticleBody toc={TOC}>
          <Section id="schedule" n="01" title="The schedule nobody wrote down">
            <p className="prs">There is no official plan for dedicated. There is a stack of practice forms, an exam date, and a group chat where somebody confidently says to take NBME 9 first because it is the hardest. I planned mine that way.</p>
            <p className="prs">So I went back to the 269 score reports and asked a different question from <Link href="/research/nbme-to-step-2">last time</Link>. Not what the forms predict, but when people sit them.</p>
            <Figure n={1} src="/research/cal_fig1_schedule.svg" width={619} height={461} alt="Median days before the exam that each NBME, UWSA and the Free 120 is sat, with the interquartile range for each" caption="Gold dot is the median day; the bar is the middle half of students. Time runs right to left toward exam day." />
            <Table
              label="Median days before the exam each form is sat"
              head={['form', 'students', 'median days out', 'middle half']}
              num={[1, 2, 3]}
              hl={[11]}
              rows={[
                ['NBME 9', '88', <b key="b">56</b>, '35 to 95'],
                ['NBME 10', '140', <b key="b">45</b>, '28 to 72'],
                ['UWSA 1', '75', <b key="b">37</b>, '24 to 60'],
                ['NBME 11', '152', <b key="b">35</b>, '23 to 57'],
                ['NBME 12', '137', <b key="b">25</b>, '18 to 42'],
                ['NBME 13', '162', <b key="b">21</b>, '14 to 31'],
                ['UWSA 3', '25', <b key="b">21</b>, '9 to 30'],
                ['NBME 14', '165', <b key="b">15</b>, '10 to 24'],
                ['NBME 15', '165', <b key="b">10</b>, '7 to 16'],
                ['UWSA 2', '104', <b key="b">10</b>, '7 to 22'],
                ['NBME 16', '47', <b key="b">6</b>, '4 to 7'],
                ['Free 120', '171', <b key="b">3</b>, '2 to 4'],
              ]}
            />
            <p className="prs">Read that column again. It is in order. Perfectly in order, from NBME 9 at eight weeks out down to the Free 120 at three days, and nobody coordinated it.</p>
            <p className="prs">What happened is that everyone independently decided the newest forms are the most representative and should go last, closest to the real thing, where they work as a final read. NBME 9 is the oldest so it goes first, when a bad number does the least damage. It is a sensible instinct and the whole population had it.</p>
            <p className="prs">The one that surprised me is UWSA 2 at ten days out, level with NBME 15. People save it because it has a reputation as the hardest, and in the <Link href="/research/nbme-to-step-2">NBME analysis</Link> it turned out to print about five points <strong>high</strong> rather than low. A lot of people are sitting an inflated form at the exact moment they are most likely to believe it.</p>
          </Section>

          <Section id="length" n="02" title="How long the whole thing runs">
            <ul className="rs-ul">
              <li>The first dated form goes <strong>47 days</strong> before the exam, middle half 30 to 86.</li>
              <li>The last one goes <strong>7 days</strong> before, middle half 5 to 10.</li>
              <li>First form to last spans <strong>40 days</strong>, middle half 25 to 78.</li>
              <li><strong>64%</strong> sit a form inside the final week. Only <strong>10%</strong> sit one in the final three days.</li>
            </ul>
            <p className="prs">So the shape of a dedicated period as actually lived is about six weeks of forms, the last one roughly a week out, then a quiet stretch. That last part is worth noticing. The final week is mostly not for testing. It is for the Free 120 and for stopping.</p>
          </Section>

          <Section id="count" n="03" title="How many forms">
            <Figure n={2} src="/research/cal_fig2_howmany.svg" width={576} height={288} alt="Distribution of how many NBME and UWSA forms each student took" caption="Median seven, middle half five to eight, maximum eleven. Only 4% took a single form." />
            <p className="prs">The median student sits <strong>seven</strong> NBME or UWSA forms, middle half five to eight, most anyone took eleven. Only <strong>4%</strong> took one.</p>
            <p className="prs">That 4% matters more than it looks, because it is the group whose number you should trust least. Running the predictor across the whole set, students with a single form on file miss their real score by <strong>10.9 points</strong> on average. Students with several miss by about five. The buckets in between hold nine to thirteen students each, so I am not going to pretend there is a clean curve. The only claim the data supports is that one is not enough, and it supports that clearly.</p>
            <p className="prs">If you have taken exactly one form and you are making decisions off it, you are working from the noisiest possible version of your own ability.</p>
            <p className="prs">Once you have several, expect them to disagree. The median student&apos;s best and worst forms sat 23 points apart, and what that gap is made of is in <Link href="/research/which-nbme-is-most-predictive">which NBME is the real you</Link>.</p>
          </Section>

          <Section id="worth" n="04" title="What the calendar converts into">
            <p className="prs">A schedule is only useful if it tells you what moving it buys. From the same set, 178 students with three or more dated forms improved at a median of <strong>1.73 points per week</strong>. The fast quarter managed 3.5, the slow quarter 0.8, and 91% improved at all.</p>
            <Table
              label="What more time is worth to the median student"
              head={['more time', 'what the median student gains']}
              num={[1]}
              rows={[
                ['one more week', <b key="b">about 2 points</b>],
                ['two more weeks', <b key="b">about 3 points</b>],
                ['four more weeks', <b key="b">about 7 points</b>],
              ]}
            />
            <p className="prs">That is the number to hold against whatever a delay costs you. Some people should absolutely push. What the data kills is the specific fantasy that two more weeks turns a 245 into a 260.</p>
            <Pitch
              kicker="The part between the forms"
              title="Six weeks is a long time to study without a system."
              body="Step Gunner is built for the days between practice tests: a daily case, spaced repetition that brings your misses back until they stick, and a readiness range that moves as you add each score. Free to start."
              primary={{ store: true, loc: 'mid', label: 'Get Step Gunner free' }}
              secondary={{ href: '/research/free-120-to-step-2', label: 'Read the Free 120 post', onClick: () => track('cta_free120_post', { surface: CAMPAIGN }) }}
            />
          </Section>

          <Section id="do" n="05" title="What I would actually do with this">
            <p className="prs"><strong>Do not save the newest forms for last just because they are newest.</strong> The population does, and the logic is sound, but it means most people arrive at the final fortnight holding their most informative reads with no time left to act on any of them. Consider moving one of NBME 14 or 15 earlier, into the three to four week window, where a bad result is still a problem you can work on.</p>
            <p className="prs"><strong>Take the Free 120 early.</strong> Same argument in its strongest form, and it has <Link href="/research/free-120-to-step-2">its own post</Link>. The median student sits it three days out, where it can only be a mood.</p>
            <p className="prs"><strong>Do not take one form and plan around it.</strong> Two is a different object from one.</p>
            <p className="prs"><strong>Expect a quiet last week.</strong> Two thirds sit something in the final seven days, but only one in ten sits anything in the final three. The end of dedicated is not more testing.</p>
          </Section>

          <Section id="limits" n="06" title="What this cannot tell you">
            <ul className="rs-ul">
              <li><strong>It is descriptive, not prescriptive.</strong> This is what a self-selected group of high scorers did. It is not evidence the order caused the scores, and I have not tried to test that, because with this data I could not separate the schedule from the person following it.</li>
              <li><strong>Dates come from what people reported.</strong> Not every post carried them. Rows run from 25 students on UWSA 3 to 165 on NBME 14 and 15, and the n is on every row so you can weight them yourself. I would not plan around the UWSA 3 line.</li>
              <li><strong>The sample posts.</strong> Mean real score 258 against a national mean of about 250, lowest in the set a 216. If you are aiming below that range the timing probably transfers but the score levels do not.</li>
            </ul>
          </Section>

          <Section id="short" n="07" title="The short version">
            <p className="prs">There is a schedule. NBME 9 at eight weeks, the 10s and 11s through the second month, the 13s and 14s in the last three weeks, NBME 15 and UWSA 2 at ten days, NBME 16 at six, the Free 120 at three. Seven forms, about six weeks, last one a week out.</p>
            <p className="prs">Almost everyone converges on it without being told, which is decent evidence it is sane.</p>
            <p className="prs"><strong>The two places I would deviate are where the crowd&apos;s instinct costs them information at the moment they can still use it: pull one recent form earlier, and pull the Free 120 much earlier.</strong></p>
          </Section>

          <ChoicePair
            store={{ label: 'Get Step Gunner free', sub: 'daily case, spaced repetition, readiness range' }}
            alt={{ href: '/readiness', label: 'Run the readiness check', sub: 'free, with exam date and percentile', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'cta_bottom' }) }}
          />

          <Section id="method" n="" title="Data and method">
            <p className="prs">Score-report posts from r/step2, parsed into one row per assessment with usernames dropped at ingest. 269 students and 3,737 parsed rows (2,042 reported practice scores); 239 have a real Step 2 score and at least one three-digit practice form, and 199 reported dates for at least one form. Form rows show the median days before the exam among students who dated that form. Prediction error by form count uses the same shrinkage-linear model as the <Link href="/readiness/methodology">predictor</Link>. Improvement rate is a within-student regression of offset-corrected form score against date, for the 178 students with three or more dated forms. Figures rebuild from the source data rather than being stored.</p>
          </Section>
        </ArticleBody>
      </AppShell>
    </>
  );
}
