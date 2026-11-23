// Research post: do students beat their last NBME on the real Step 2 CK, and how
// far off the score projection is, on the r/step2 dataset (239 posters) and on
// Step Gunner users whose real score Danny reviewed by hand on 2026-11-15 (66
// kept, 36 with a three-digit form before the exam). Ninth in the series. The
// numbers are a snapshot from read-only pulls on 2026-11-23 (gunner repo:
// analysis/real_scores_2026-11-23/, aggregates only, no cell under 10 students).
// Built from the app-look blocks (components/app/README.md).
// No em or en dashes anywhere in the copy (site rule).
import Link from 'next/link';
import { ReactNode } from 'react';
import {
  AppShell, ArticleBody, ArticleHeader, Hero, Section, Table,
} from '../../components/app';
import { ChoicePair, PageHead, Pitch, ResearchStyles, Summary } from '../../components/app/research';
import { track } from '../../lib/analytics';

const CAMPAIGN = 'research_beat_last_nbme';
const PUBLISHED = '2026-11-23';
const PATH = '/research/beat-your-last-nbme';
const H1 = 'Will you beat your last NBME?';

const TOC: [string, string][] = [
  ['question', 'The question behind every converter'],
  ['reddit', 'On Reddit, most people climb'],
  ['app', 'On app users, half do'],
  ['split', 'The climb belongs to students with four or more forms'],
  ['predictor', 'What that does to a score predictor'],
  ['you', 'What this means for you'],
  ['limits', 'What this cannot tell you'],
  ['method', 'Data and method'],
];

/** A bold value with its 95% interval on the line under it. */
const V = (v: ReactNode, ci: ReactNode) => <><b>{v}</b><span className="rs-ci">{ci}</span></>;

export default function BeatYourLastNbme() {
  const title = 'Will you beat your last NBME on Step 2 CK? 275 real scores, checked';
  const desc = 'On r/step2, 72% of posters beat their last practice form, by 7 points on average. On app users it is half, and the difference is how many forms they sat.';
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
    about: ['USMLE Step 2 CK', 'NBME self-assessment', 'score prediction', 'NBME score conversion'],
  };

  return (
    <>
      <PageHead metaTitle="Do You Beat Your Last NBME on Step 2 CK? 275 Real Scores" metaDesc={desc} ogImage="/og/research/beat-your-last-nbme.png" ogAlt={H1}>
        <link rel="canonical" href={`https://stepgunner.com${PATH}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </PageHead>

      <AppShell campaign={CAMPAIGN} pageType="research">
        <ResearchStyles />
        {/* Phone: four short columns fit without a sideways scroll. */}
        <style dangerouslySetInnerHTML={{ __html: '@media (max-width: 480px) { .bl-t .mk .tbl thead th, .bl-t .mk .tbl td, .bl-t .mk .tbl tbody th { padding: 10px 8px; } .bl-t .mk .tbl thead th { font-size: 12px; letter-spacing: .03em; } .bl-t .mk .tbl { font-size: 15px; } }' }} />
        <Hero>
          <ArticleHeader
            category="step2"
            crumb={[{ href: '/research', label: 'Research' }, { label: 'Beat your last NBME' }]}
            eyebrow="Research"
            title={H1}
            accent="beat your last NBME"
            dek={<>Every Step 2 score converter quietly assumes you will. On Reddit score reports, most people do. On the students who use this app, it depends almost entirely on how many practice forms they sat.</>}
            meta={[`Published ${PUBLISHED}`, '239 r/step2 posters, 36 app users', 'About 6 minutes']}
          />
          <Summary>
            <p>Of 199 r/step2 posters with a dated last form, 72% scored higher on the real Step 2 CK than on that form, by 7.0 points on average (95% interval 5.6 to 8.4). Of 36 Step Gunner users whose real score I checked by hand, 19 beat their last form and the average gain was 0.9 points (minus 3.8 to plus 4.8). The split is form count. App users with four or more forms gained 4.9 on average and 11 of 18 beat their last form; the score projection landed an average of 4.5 points from their real score, and 14 of 18 landed inside the range it showed. App users with one to three forms lost 3.2 on average, only 8 of 18 beat their last form, and the projection ran 12.3 points high for them, because it assumes the climb.</p>
          </Summary>
          <Pitch
            placement="top"
            kicker="Your forms, tracked"
            title="Plan your forms, then watch the projection move."
            body="Step Gunner schedules your practice forms from eight weeks out, keeps every score you enter next to a projection, and shows how far that projection has missed on real students. Between forms: Next Best Step drills and CK Gold questions. Free to start."
            primary={{ store: true, loc: 'top', label: 'Get Step Gunner free' }}
            secondary={{ href: '/step-2-score-predictor', label: 'Or convert a form on the web', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_top' }) }}
            trust="Data pulled November 23, 2026. Every app number on this page is an aggregate of at least 10 students."
          />
        </Hero>

        <ArticleBody toc={TOC}>
          <Section id="question" n="01" title="The question behind every converter">
            <p className="prs">Type an NBME score into any Step 2 converter, including <Link href="/step-2-score-predictor">the one on this site</Link>, and the number that comes back is almost always higher than the one you typed. That gap is the climb: the points students usually add between their last practice form and test day. Ours builds in about 9. The folklore on r/step2 says something similar, and you will hear &quot;your NBME is your floor&quot; in most threads about it.</p>
            <p className="prs">Whether that holds for you is the real question behind every search for a score converter. So I checked it on two groups. The first is the r/step2 dataset the model was built from: 239 posters who wrote down their practice forms and their real score. The second is Step Gunner users who entered their forms in the app and later their real Step 2 score. On November 15 I read every one of those 89 real scores by hand and kept 66 I could trust; 36 of those had at least one three-digit NBME or UWSA before the exam. That is 275 real scores between the two.</p>
          </Section>

          <Section id="reddit" n="02" title="On Reddit, most people climb">
            <div className="bl-t">
<Table
              label="Real Step 2 score against the last practice form, r/step2 posters"
              head={['r/step2', 'n', 'vs last form', 'beat it']}
              num={[1, 2, 3]}
              rows={[
                ['all, dated', '199', V('+7.0', '5.6 to 8.4'), '72%'],
                ['4+ forms', '180', V('+7.1', '5.7 to 8.6'), '73%'],
                ['1 to 3 forms', '19', V('+6.2', '0.3 to 11.7'), '68%'],
              ]}
            />
            </div>
            <p className="prs">On Reddit the folklore mostly holds. Nearly three in four posters beat their last form, by about 7 points, and it barely depends on how many forms they sat. Still, 41 of 199 scored below it and 14 matched it exactly, so &quot;floor&quot; is too strong a word even here.</p>
            <p className="prs">These posters chose to post, and the set averages a real score of 258, around the 68th percentile nationally. Nine in ten of them sat four or more forms. Keep both of those in mind for the next section.</p>
          </Section>

          <Section id="app" n="03" title="On app users, half do">
            <div className="bl-t">
<Table
              label="Real Step 2 score against the last practice form, Step Gunner users"
              head={['group', 'n', 'vs last form', 'beat it']}
              num={[1, 2, 3]}
              hl={[1]}
              rows={[
                ['r/step2', '199', V('+7.0', '5.6 to 8.4'), '72%'],
                ['app users', '36', V('+0.9', '-3.8 to 4.8'), '19 of 36'],
              ]}
            />
            </div>
            <p className="prs">App users average a real score of 250, close to the national middle, and their last form was close to the exam: a median of 6 days before it, against 7 on Reddit. Even so, the average climb is about one point, and only 19 of 36 beat their last form. Four scored exactly the same.</p>
          </Section>

          <Section id="split" n="04" title="The climb belongs to students with four or more forms">
            <div className="bl-t">
<Table
              label="Real minus last form, app users by forms on file"
              head={['app users', 'n', 'vs last form', 'beat it']}
              num={[1, 2, 3]}
              hl={[1]}
              rows={[
                ['4+ forms', '18', V('+4.9', '0.8 to 9.2'), '11 of 18'],
                ['1 to 3 forms', '18', V('-3.2', '-10.6 to 2.9'), '8 of 18'],
              ]}
            />
            </div>
            <p className="prs">Split the app users at four forms and the picture separates. Those with four or more climbed about 5 points and most beat their last form, a smaller version of the Reddit pattern. Those with one to three did not climb at all on average: 10 of 18 scored at or below their last form.</p>
            <p className="prs">I wrote about the same split in October, in <Link href="/research/model-misses-app-users">why our own model is worse on our own users</Link>, on 29 students picked by an automatic check. This set is picked by hand and has 36, and the split is the same. What is new here is where the gap comes from. It is not that thin histories are noisy. It is that students with one to three forms on file did not climb past their last form, and every converter assumes they will.</p>
            <p className="prs">Reddit posters with one to three forms did climb (plus 6.2, on 19 people). So a short history alone is not the explanation. The October piece lists the candidates: students typing in only the forms they liked, stopping after a lucky one, or having a shorter dedicated period with less climb left in it. This data cannot pick between them.</p>
          </Section>

          <Section id="predictor" n="05" title="What that does to a score predictor">
            <div className="bl-t">
<Table
              label="How far the projection landed from the real score, app users (18 in each group)"
              head={['app users', 'avg miss', 'ran', 'within 7']}
              num={[1, 3]}
              hl={[1]}
              rows={[
                ['4+ forms', V('4.5', '3.0 to 6.2'), 'centred', '14 of 18'],
                ['1 to 3', V('13.4', '8.4 to 19.2'), '12.3 high', '6 of 18'],
              ]}
            />
            </div>
            <p className="prs">The projection is the same model as the converter on this site, run on each student&apos;s forms dated before the exam. For students with four or more forms it projected about 5 points above their last form, they climbed about 5, and it landed an average of 4.5 points from the real score. For students with one to three it projected about 9 above their last form, they did not climb, and it ran 12.3 points high on average (95% interval 6.8 to 18.6). 15 of those 18 scored below their projection.</p>
            <p className="prs">One more comparison is worth stating plainly. Across all 36, the projection missed by 8.9 points on average and simply taking the last form at face value missed by 9.0. For a student with a thin history, the converter&apos;s extra points did not help.</p>
            <Pitch
              kicker="Where your forms stand"
              title="Enter every form, including the bad ones."
              body="The app keeps your forms, plans the next ones and shows the projection with its own record on real students. Free to start; the web converter stays free either way."
              primary={{ store: true, loc: 'mid', label: 'Get Step Gunner free' }}
              secondary={{ href: '/readiness', label: 'Run the full readiness check', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_mid' }) }}
            />
          </Section>

          <Section id="you" n="06" title="What this means for you">
            <ul className="rs-ul">
              <li><strong>Four or more forms, last one recent:</strong> a modest climb is the likely outcome. App users like you gained about 5 points over their last form, and the projection landed within 7 points for 14 of 18.</li>
              <li><strong>One to three forms:</strong> treat your last form as your estimate, not your floor. Fewer than half of app users in that position beat it, and the converter&apos;s number ran about 12 points high for them.</li>
              <li><strong>&quot;Your NBME is your floor&quot; is a Reddit average, not a rule.</strong> Even on Reddit, about one poster in five scored below their last form.</li>
              <li><strong>Enter every form you sit.</strong> If selective entry is part of this, it fixes it for you. If it is not, it costs nothing.</li>
              <li><strong>Sit a form when you can still act on the result.</strong> Nothing here shows that sitting a fourth form causes a climb. It shows that students who sat four or more were the ones who climbed.</li>
            </ul>
          </Section>

          <Section id="limits" n="07" title="What this cannot tell you">
            <ul className="rs-ul">
              <li><strong>36 app users, 18 in each group.</strong> Every app number has a wide interval, given beside it. The four-form cut was proposed in September on an earlier, overlapping set, so it is not a fresh test.</li>
              <li><strong>Both groups chose themselves.</strong> Reddit posters chose to post. App users chose to enter a real score, and 30 of the 66 I kept had no three-digit form dated before the exam, so there was nothing to compare.</li>
              <li><strong>The app set is my judgment.</strong> I read each real score once, with its forms and dates, and set aside 23 of 89 that I could not trust (most often a score entered days or weeks before the exam date it belonged to). Adding back the set-aside scores and 6 that arrived after November 15 moves the average projection miss from 8.9 to 11.4, and students with four or more forms are still missed by about half as much (7.3 against 14.3).</li>
              <li><strong>Taking few forms and entering few forms look the same here.</strong> I cannot tell a student who sat two from one who sat seven and typed in two.</li>
              <li><strong>Reddit dates are remembered.</strong> 40 posters gave no usable date for their last form and are left out of the last-form rows.</li>
              <li><strong>Nothing here is causal.</strong></li>
            </ul>
          </Section>

          <ChoicePair
            store={{ label: 'Get Step Gunner free', sub: 'form plan, projection, track record' }}
            alt={{ href: '/step-2-score-predictor', label: 'Convert a form', sub: 'free, the same model, on the web', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'cta_bottom' }) }}
          />

          <Section id="method" n="" title="Data and method">
            <p className="prs"><strong>Reddit.</strong> All 239 r/step2 posters in the dataset with at least one three-digit NBME or UWSA and a real score between 155 and 300. Last form = the form with the fewest days before the exam, among the 199 who gave days. Beat = real score above that form&apos;s printed score.</p>
            <p className="prs"><strong>App.</strong> Every non-staff Step Gunner account with a real Step 2 score that I marked to keep on November 15, 2026 (66 of 89), restricted to the 36 with at least one three-digit NBME or UWSA dated before the exam. Last form = the latest dated form before the exam. No user is identifiable from anything on this page, and any group under 10 students is withheld.</p>
            <p className="prs"><strong>Projection.</strong> The served model, run through the same server code the app uses, on forms dated before the exam: a recency-weighted anchor over form-corrected scores, projection = 250 + 0.79 x (anchor minus 250) + 9, with a range set by how far out the last form was. Full detail on the <Link href="/readiness/methodology">methodology page</Link>.</p>
            <p className="prs"><strong>Statistics.</strong> Percentile bootstrap with 4,000 resamples for every interval. Miss = absolute distance between projection and real score.</p>
          </Section>
        </ArticleBody>
      </AppShell>
    </>
  );
}
