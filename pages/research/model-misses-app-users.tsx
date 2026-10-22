// Research post: why the readiness model misses Step Gunner app users by twice as
// much as the r/step2 posters it was fit to. Fourth in the series after
// nbme-to-step-2, free-120-to-step-2 and dedicated-calendar. The numbers are a
// snapshot from a read-only pull on 2026-10-22 (gunner repo:
// analysis/readiness_calibration/model_miss.py, ledger RESULTS_model_miss_2026-10-22.md);
// figures render from aggregates only, no cell under 10 students
// (docs/blog/figures/render_model_miss.py --light). Draft with method and the
// corrections: docs/blog/model-misses-app-users.md.
// Built from the app-look blocks (components/app/README.md).
// No em or en dashes anywhere in the copy (site rule).
import Link from 'next/link';
import { ReactNode } from 'react';
import {
  AppShell, ArticleBody, ArticleHeader, Figure, Hero, NumberedSteps, Section, Table,
} from '../../components/app';
import { ChoicePair, PageHead, Pitch, ResearchStyles, Summary } from '../../components/app/research';
import { track } from '../../lib/analytics';

const CAMPAIGN = 'research_model_miss';
const PUBLISHED = '2026-10-22';
const PATH = '/research/model-misses-app-users';
const H1 = 'Why our own model is worse on our own users';

const TOC: [string, string][] = [
  ['objection', 'The objection everyone makes'],
  ['symptom', 'The folklore gets the symptom right'],
  ['one-kind', 'All of the gap is one kind of user'],
  ['obvious', 'The obvious explanation is wrong'],
  ['suspects', 'The other suspects'],
  ['who', 'So who are they?'],
  ['today', 'What the app does about it, today'],
  ['you', 'What this means for you'],
  ['corrected', 'Corrected while writing'],
  ['limits', 'What this cannot tell you'],
  ['method', 'Data and method'],
];

/** A bold value with its 95% interval on the line under it. */
const V = (v: ReactNode, ci: ReactNode) => <><b>{v}</b><span className="rs-ci">{ci}</span></>;
/** A plain value with its interval under it. */
const P = (v: ReactNode, ci: ReactNode) => <>{v}<span className="rs-ci">{ci}</span></>;

export default function ModelMissesAppUsers() {
  const title = 'Our Step 2 model misses our own users twice as badly as Reddit posters. Here is who it misses, and why.';
  const desc = 'A Step 2 predictor fit to r/step2 reports misses app users by 10.9 points against 5.2. All of the gap is one kind of student, and not for the obvious reason.';
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
    about: ['USMLE Step 2 CK', 'score prediction', 'NBME self-assessment', 'selection bias'],
  };

  return (
    <>
      <PageHead metaTitle="Step 2 Score Predictor Accuracy: Who Our Model Misses, and Why" metaDesc={desc} ogImage="/og/research/model-misses-app-users.png" ogAlt={H1}>
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
            crumb={[{ href: '/research', label: 'Research' }, { label: 'Model misses app users' }]}
            eyebrow="Research"
            title={H1}
            accent="worse on our own users"
            dek={<>The score model on this site misses Step Gunner users by twice as much as the Reddit posters it learned from. The folklore has an explanation for that. The data has a different one.</>}
            meta={[`Published ${PUBLISHED}`, '29 app users, 40 r/step2 posters', 'About 9 minutes']}
          />
          <Summary>
            <p>The readiness model was fit to r/step2 score reports. On 40 later Reddit posters it had never seen, it missed the real Step 2 score by 5.2 points on average. On 29 Step Gunner users who entered their forms and then their real score, it missed by 10.9 (gap 5.6 points, 95% interval 1.3 to 10.5), and it projected too high for 21 of the 29. All of that gap sits in the 19 app users with one to three practice forms on file, who were missed by 14.8; the 10 with four or more were missed by 3.3, no worse than Reddit posters with four or more (4.2). It is not because fewer forms carry less information: the same model given only one, two or three of a Reddit poster&apos;s forms still lands within about 5 to 6 points. Students with thin histories are a different population, two thirds of app users and one Reddit poster in ten, and a model fit on Reddit had almost never met them.</p>
          </Summary>
          <Pitch
            placement="top"
            kicker="The same model, misses included"
            title="See your projection next to its own track record."
            body="Step Gunner shows this projection under a readiness gauge, with the last ten real outcomes and how many forms each of those students had on the same screen. For the hours between forms: Next Best Step drills, CK Gold questions and LFX. Free to start."
            primary={{ store: true, loc: 'top', label: 'Get Step Gunner free' }}
            secondary={{ href: '/readiness', label: 'Or use the web calculator', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_top' }) }}
            trust="Data pulled October 22, 2026. Every app number on this page is an aggregate of at least 10 students."
          />
        </Hero>

        <ArticleBody toc={TOC}>
          <Section id="objection" n="01" title="The objection everyone makes">
            <p className="prs">Every time someone links a Step 2 score predictor built from Reddit score reports, somebody replies with the same objection: only the people who did well come back to post, so the predictor runs hot. I built one of those predictors. It is the projection on this site and inside the Step Gunner app, fit to r/step2 score reports in <Link href="/research/nbme-to-step-2">the original analysis</Link>, and for two months it has been meeting students who reached it through the app instead of through a Reddit thread.</p>
            <p className="prs">It has not gone as well. On 40 later Reddit posters the model had never seen, it missed the real score by <strong>5.2 points</strong> on average. On the 29 app users who entered their practice forms and then their real score, it missed by <strong>10.9</strong>. Twice as far off, on the people the product is actually for.</p>
            <p className="prs">Both groups chose themselves, in different ways, and the difference is the subject of this piece. The Reddit set averages 258, around the 68th percentile nationally, and its lowest real score is a 216. The 29 app users average 251, almost exactly the national middle. They are not a random draw from the app either: 78 users have entered a real score, 36 of them never entered a three-digit practice form so there was nothing to judge, and 13 more failed the legitimacy check, which mainly asks whether the score was entered too soon after the exam date to be real. Every app number below rests on 29 people or fewer, so each one carries a wide interval, and I give it.</p>
          </Section>

          <Section id="symptom" n="02" title="The folklore gets the symptom right">
            <Figure n={1} src="/research/mm_fig1_headline.svg" width={475} height={324} alt="Dot plot of average miss with 95% intervals: r/step2 posters the model never saw, 5.2 points, n 40; Step Gunner app users, 10.9 points, n 29"
              caption="Average distance between the projection and the real score, with 95% bootstrap intervals. Both groups are students the frozen model was never fit to." />
            <Table
              label="How far off the frozen model was, by group it had never seen"
              head={['never seen', 'n', 'avg miss', 'median', 'inside range', 'within 7', 'landed below']}
              num={[1, 2, 3, 4, 5, 6]}
              hl={[1]}
              minWidth={640}
              rows={[
                ['r/step2 posters', '40', V('5.2', '3.7 to 7.3'), '4', '32 (80%)', '78%', '18'],
                ['app users', '29', V('10.9', '7.1 to 15.5'), '7', '18 (62%)', '52%', '21'],
              ]}
            />
            <p className="prs">The gap in average miss is 5.6 points, 95% interval 1.3 to 10.5. The size is uncertain; that there is a gap is not.</p>
            <p className="prs">And it ran high, meaning the projection sat above the real score. 21 of the 29 app users landed below their projection, by 5.3 points on average. The interval on that average runs from 10.8 points high all the way to zero, so the size is soft. The direction is not: 21 of 29 falling the same way would happen about 2 times in 100 if the model were centred on these students.</p>
            <p className="prs">So the folklore&apos;s prediction holds. A model fit to people who post runs high on people it meets another way. The interesting part is why, because the folklore&apos;s explanation is not what drives it.</p>
          </Section>

          <Section id="one-kind" n="03" title="All of the gap is one kind of user">
            <p className="prs">In September, with 20 of these 29 outcomes in hand, I wrote down a hunch: the misses seemed to follow how many practice forms a student had entered, not where they came from. The cut I wrote down then was one to three forms against four or more. Here it is on all 29.</p>
            <Figure n={2} src="/research/mm_fig2_by_forms.svg" width={475} height={387} alt="Dot plot of average miss by number of forms: r/step2 with 4 or more forms 4.2, app with 4 or more forms 3.3, app with 1 to 3 forms 14.8; r/step2 with 1 to 3 forms not shown because fewer than 10 students"
              caption="Average miss by how many NBME or UWSA forms fed the projection, with 95% intervals. Any group under 10 students is withheld." />
            <div className="mk isl">
              <div className="tbl-w" role="region" aria-label="Average miss by forms on file" tabIndex={0}>
                <table className="tbl" style={{ minWidth: 600 }}>
                  <caption>Average miss by forms on file</caption>
                  <thead><tr><th scope="col">forms on file</th><th scope="col" className="n">n</th><th scope="col" className="n">avg miss</th><th scope="col" className="n">inside range</th><th scope="col">projection, on average</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">r/step2, 4 or more</th><td className="n">36</td><td className="n">{V('4.2', '3.3 to 5.3')}</td><td className="n">29 of 36</td><td>{P('0.8 under', '1.0 over to 2.5 under')}</td></tr>
                    <tr><th scope="row">app, 4 or more</th><td className="n">10</td><td className="n">{V('3.3', '2.2 to 4.8')}</td><td className="n">9 of 10</td><td>{P('0.5 over', '3.0 over to 1.8 under')}</td></tr>
                    <tr className="hl"><th scope="row">app, 1 to 3</th><td className="n">19</td><td className="n">{V('14.8', '9.7 to 20.8')}</td><td className="n">9 of 19</td><td>{P('7.9 over', '15.9 over to 0.2 under')}</td></tr>
                    <tr><th scope="row">r/step2, 1 to 3</th><td className="n">4</td><td className="rs-muted" colSpan={3}>fewer than 10 students, not shown</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="prs">App users who gave the model four or more forms were predicted as well as Reddit posters with four or more: 3.3 against 4.2, a difference of 0.9 in the app&apos;s favour (interval 2.5 better to 0.9 worse). That row is also the cleanest test of the folklore. These are comparable students who came to the model through the app rather than a Reddit post, and if &quot;only the winners post&quot; had inflated the model, this is where it would show. It does not show by more than about 3 points, on 10 people.</p>
            <p className="prs">The 19 with one to three forms are a different story: an average miss of 14.8, 9 of them off by more than 10 points, fewer than half inside their range, and 15 of the 19 below their projection. Two thirds of app users are in this group. On Reddit it is one poster in ten (24 of 239).</p>
            <p className="prs">Hold the form count fixed and the app versus Reddit gap disappears. A regression of the miss on source plus a one-to-three-forms flag puts the app&apos;s own effect at <strong>minus 0.4 points</strong> (interval minus 5.0 to plus 3.6), and the form flag at <strong>plus 10.9</strong> (5.6 to 17.2).</p>
          </Section>

          <Section id="obvious" n="04" title="The obvious explanation is wrong">
            <p className="prs">Fewer forms, less information, noisier projection. That was my explanation in September, and the fix I wrote down for it was to shrink a thin history harder toward the middle. It can be tested directly, because 166 of the Reddit posters have four or more dated forms. Delete all but their freshest one, two or three, run the frozen model again, and see whether they start missing like app users.</p>
            <Figure n={3} src="/research/mm_fig3_truncation.svg" width={475} height={443} alt="Dot plot of average miss for 166 r/step2 posters given every form 5.1, freshest three 4.7, freshest two 5.0, freshest one 6.0, against app users with 1 to 3 forms 14.8"
              caption="The same 166 posters, re-scored after deleting all but their freshest forms. Cutting them down barely moves the miss. The app users with one to three forms are the bottom row." />
            <Table
              label="Average miss when posters are cut down to fewer forms"
              head={['what the model was given', 'n', 'average miss']}
              num={[1, 2]}
              hl={[5]}
              minWidth={480}
              rows={[
                ['posters, every form', '166', V('5.1', '4.5 to 5.7')],
                ['same posters, freshest 3 only', '166', V('4.7', '4.1 to 5.3')],
                ['same posters, freshest 2 only', '166', V('5.0', '4.4 to 5.6')],
                ['same posters, freshest 1 only', '166', V('6.0', '5.3 to 6.7')],
                ["same posters, cut to each app user's form count and staleness", '166', V('5.7', '5.2 to 6.3')],
                ['app users with 1 to 3 forms', '19', V('14.8', '9.7 to 20.8')],
              ]}
            />
            <p className="prs">One form from a Reddit poster gets within 6 points on average. One to three forms from an app user, 14.8. The difference, against posters cut to the same form counts, is 9.5 points (interval 4.3 to 15.5). Restricting the test to the 29 of those posters from threads the model never trained on gives the same answer: 6.2 with one form, 5.5 cut to the app profile.</p>
            <p className="prs">So the model is not starving for data. A thin history from a Reddit poster is fine. A thin history from an app user is not. What differs is the student, or the forms the student chose to type in, not the count.</p>
          </Section>

          <Section id="suspects" n="05" title="The other suspects">
            <Table
              label="Other explanations checked, and what each check found"
              head={['suspect', 'check', 'verdict']}
              minWidth={640}
              rows={[
                ['A stale last form', 'Median days from the last form to the exam: app 7 (23 dated), Reddit 6 (36 dated)', <>Not it. App users with one to three forms whose last form was inside two weeks ran <b>14.2 high</b> (n = 10, interval 6.0 to 24.2)</>],
                ['Different forms', 'NBME 16 was the last form for 16 of 29 app users and 29 of 40 posters', 'Not it. With NBME 16 last: app 5.2 high, Reddit 0.5 high'],
                ['A wider score range', 'App scores spread wider (SD 14.7 against 11.8) and sit lower: a quarter of app users scored 239 or below, against 248 on Reddit', 'Not it. Projections between 240 and 270 only: app miss 8.8 and 5.8 high (n = 22); Reddit 5.3 and 1.5 high (n = 31)'],
                ['Two wild records', 'Two app records sit 40 or more points from their projection, one in each direction', 'Changes the size, not the story. Without both (n = 27): average miss 8.3 (5.9 to 11.0), and the over-projection gets clearer, 5.4 high (1.9 to 9.0)'],
                ['The email score page', 'Some scores came through an email form rather than the app', 'Not it. The one-to-three-form group entering in the app alone (n = 13) ran 12.2 high (4.7 to 20.5)'],
                ['Late entry', 'Scores entered more than 30 days after the exam (n = 11) missed by 15.1; sooner (n = 17), by 8.6', 'Maybe part of the size. Both ran high (6.7 and 4.9)'],
              ]}
            />
            <p className="prs">Dropping two records because they are far from the line is a diagnostic, not an analysis. Both passed every check, they stay in every headline number, and that row only shows how much weight they carry.</p>
            <p className="prs">One more pattern, and it is the most informative one. In the app, the higher the projection, the further it overshot. Projections of 260 and up ran <strong>11.0 points high</strong> (n = 13, interval 4.4 to 19.3); under 260 they were nearly centred (0.8 high, n = 16). On Reddit the same split is 1.8 high and 0.2 high. That is the shape you get when the forms on file overstate the student, and the model&apos;s pull back toward the middle is sized for people whose forms do not.</p>
          </Section>

          <Section id="who" n="06" title="So who are they?">
            <p className="prs">The data cannot tell me, so these are hypotheses, not findings.</p>
            <NumberedSteps steps={[
              { text: <><strong>Selective entry.</strong> You type in the forms you are happy with.</> },
              { text: <><strong>Stopping after a good one.</strong> A student who sits forms until one looks right and then stops has a last form that is partly luck. A Reddit poster who sat all seven does not.</> },
              { text: <><strong>Less runway.</strong> The +9 in the model is how much a typical Reddit poster keeps climbing after their forms. Someone with fewer forms may have had a shorter dedicated period and less climb left in it.</> },
              { text: <><strong>Typos.</strong> The legitimacy check catches a score entered before a real release could exist. It cannot catch a mistyped form.</> },
            ]} />
            <p className="prs">What they do not look like, on the one measure I have, is disengaged. App users with one to three forms answered a median of 1,723 questions in the app, against 770 for those with four or more. That is a lifetime count and confounded by how long each person has had the app, so it is a description, not an explanation.</p>
            <p className="prs">Reddit has a version of this too. Posters who themselves had only one to three forms were harder to predict, 8.4 points against about 5.5 for everyone else (n = 24, and they were in the fit, which flatters them). But they were not over-projected (0.1 points on average). The app users were.</p>
            <p className="prs"><strong>So the selection is real, and it sits one level below where the folklore puts it.</strong> Reddit does not just over-represent students who did well. It over-represents students who sat seven forms and wrote every one of them down. A model fit there has almost never met the student who entered two, and that student is two thirds of the people who use the app.</p>
            <Pitch
              kicker="Where your projection stands"
              title="Enter every form, including the bad ones."
              body="The app keeps your forms, your projection and the model's own record together, and the record updates every Monday. Between forms it is built for the daily work: Next Best Step drills, CK Gold questions and LFX. Free to start."
              primary={{ store: true, loc: 'mid', label: 'Get Step Gunner free' }}
              secondary={{ href: '/readiness/methodology', label: 'Read the methodology', onClick: () => track('cta_methodology', { surface: CAMPAIGN, location: 'pitch_mid' }) }}
            />
          </Section>

          <Section id="today" n="07" title="What the app does about it, today">
            <ul className="rs-ul">
              <li><strong>The model has not been refit, on purpose.</strong> The original post said that if app users kept missing worse, the model would be refit for them. In September I tried exactly that, with app outcomes weighted up. Every candidate was worse on students held out of the fit, so the frozen model stayed. This piece is the most likely reason it failed: lowering the projection for everyone would have broken the people it currently gets right, including the app users with four or more forms.</li>
              <li><strong>The fix for thin histories was written down before it was tested.</strong> It gets tested at the next scheduled review, no earlier than December 1 and only once the out-of-sample pool has grown by 50 outcomes since September (it has grown by 9). The test in section 4 changes how that fix should be sized: its size has to come from app outcomes, not from Reddit, because on Reddit a thin history is not the problem.</li>
              <li><strong>The record is on the screen.</strong> Every Monday the track record under the readiness gauge recomputes, shows the last ten outcomes with how many forms each student had, and reports app users and Reddit posters separately.</li>
              <li><strong>With a single form on file, the app asks for another.</strong></li>
              <li><strong>What it does not do yet:</strong> the range on your screen depends on how recent your last form is, not how many you have, so one fresh form gets the tightest range. I am not changing that by hand between reviews. Changing the model whenever it embarrasses me is precisely what the freeze exists to prevent.</li>
            </ul>
          </Section>

          <Section id="you" n="08" title="What this means for you">
            <ul className="rs-ul">
              <li><strong>Four or more forms entered:</strong> the record on people like you is good. 9 of 10 app users landed inside their range, average miss 3.3. Ten people is not a guarantee.</li>
              <li><strong>One to three forms entered:</strong> read the number as optimistic. Students in that position landed 8 points below the centre on average (the interval runs from 16 below to roughly on target), and 9 of 19 missed by more than 10. For scale, 15 points is the distance from a 250 (47th percentile nationally) to a 265 (85th).</li>
              <li><strong>A recent form does not rescue a thin history.</strong> <Link href="/research/nbme-to-step-2">The original post</Link> advises taking a form inside your last two weeks, and that still holds for weighting the forms you have. It was never tested on students with only one or two, and here the ones whose last form was inside two weeks ran 14 points high (n = 10).</li>
              <li><strong>Enter every form you sit, including the bad ones.</strong> If selective entry is any part of this, that fixes it for you. If it is not, it costs nothing.</li>
              <li><strong>Do not sit an extra form only to make the projection more accurate.</strong> On Reddit data the count alone barely moves the miss. Sit one because its result is something you can still act on.</li>
            </ul>
          </Section>

          <Section id="corrected" n="09" title="Corrected while writing">
            <p className="prs"><strong>The comparison in my own notes was unfair, in the model&apos;s favour.</strong> My planning notes said the model misses app users by 10.9 &quot;against 5.8 for forum posters.&quot; 5.8 is the in-sample number, the model graded on the people it was fit to. The fair comparison is the 40 posters it never saw: 5.2. The gap is bigger than I had written, not smaller.</p>
            <p className="prs"><strong>&quot;About 5.5 points below their projection&quot; is 5.3, and soft.</strong> The interval runs to zero. The direction (21 of 29) is solid; the size is not established.</p>
            <p className="prs"><strong>A labelling bug in the public record.</strong> The Reddit outcomes in the weekly record store forms as &quot;NBME 9.0&quot; instead of &quot;NBME 9,&quot; so the three form corrections were never applied to those posters. Fixed in this analysis: 32 of 40 land inside their range, not 33, average miss 5.2 rather than 5.1, within 7 points 78% rather than 80%. Small, but it flattered the Reddit side, so the stored outcomes were corrected on 2026-10-22 and the weekly record shows the right number from its next refresh.</p>
            <p className="prs"><strong>My September explanation was wrong.</strong> I had this down as a reliability problem (fewer forms, noisier anchor) and the fix as shrinking thin histories harder. The truncation test says a thin anchor from a Reddit poster is not noisy enough to matter. The fix still keys on form count, because that is what the app can see, but the reason is the population, and the size has to be estimated from app outcomes.</p>
          </Section>

          <Section id="limits" n="10" title="What this cannot tell you">
            <ul className="rs-ul">
              <li><strong>29 people.</strong> The app&apos;s four-or-more group is 10. Every app-side number has a wide interval, and the cut at four forms is not something 29 people can locate precisely: cut at three instead and the three-or-more group (n = 15) still runs high.</li>
              <li><strong>The split is partly post hoc.</strong> I proposed it in September after seeing 20 of these 29. The 9 since are too few to confirm or refute it on their own. The truncation test is new.</li>
              <li><strong>Taking few forms and entering few forms look identical here.</strong> I cannot tell a student who sat two from one who sat seven and typed in two.</li>
              <li><strong>The app sample chose itself too.</strong> 29 of the 78 app users with a real score entered both forms and a score the check accepts. The 36 who entered a score but no form average 249, so the judged group does not look unusual on score, but they are still volunteers.</li>
              <li><strong>Days before the exam on Reddit are what people remembered.</strong> The truncation test uses dated forms only.</li>
              <li><strong>&quot;Never seen&quot; has one asterisk.</strong> The 40 Reddit posters are out of sample for the slope, the +9 and the recency weight. I cannot rule out that the 32 from the August 5 thread were in the data when the three small form corrections were estimated, which could only flatter them slightly.</li>
              <li><strong>Nothing here is causal.</strong> It does not show that entering more forms, or sitting more, would make your own projection more accurate.</li>
            </ul>
          </Section>

          <ChoicePair
            store={{ label: 'Get Step Gunner free', sub: 'projection, track record, Next Best Step drills' }}
            alt={{ href: '/readiness', label: 'Run the readiness check', sub: 'free, the same model, on the web', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'cta_bottom' }) }}
          />

          <Section id="method" n="" title="Data and method">
            <p className="prs"><strong>Data.</strong> App: every non-staff Step Gunner account with a real Step 2 score, at least one three-digit NBME or UWSA form, and a capture that passes the legitimacy check (entered at least 10 days after the exam date, a plausible score, not changed between entries), read on October 22, 2026. Row selection mirrors the weekly track record exactly, and the counts match its public endpoint. Reddit: the 40 posters from the August 5 and August 19 threads, collected after the model was frozen, plus all 239 posters in the dataset for the truncation test. No user is identifiable from anything on this page, and any group under 10 students is withheld.</p>
            <p className="prs"><strong>Model.</strong> The served model, version 2026.08, run through the same server code the app&apos;s twin uses: a recency-weighted anchor over form-corrected scores (NBME 9 +5.5, UWSA 2 minus 4.8, UWSA 3 +6.3), projection = 250 + 0.79 x (anchor minus 250) + 9, and a range set by how far out the last form was. Error is the real score minus the projection. Full detail on the <Link href="/readiness/methodology">methodology page</Link>.</p>
            <p className="prs"><strong>Statistics.</strong> Percentile bootstrap with 20,000 resamples for every interval; permutation tests for the two-group gaps (average miss p = 0.008, signed miss p = 0.11); an exact sign test for direction; least squares with a source-stratified bootstrap for the adjusted gap. In the truncation test each poster with four or more dated forms is re-scored on their freshest k dated forms, or on each app user&apos;s form count and days since last form, and contributes one average. The truncation result reproduces with a second, independent implementation of the model to within 0.05 points.</p>
          </Section>
        </ArticleBody>
      </AppShell>
    </>
  );
}
