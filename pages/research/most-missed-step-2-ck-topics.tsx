// Research post: which Step 2 CK topics app users miss most, and what the hardest
// share. From the app's own answer telemetry (GA4 card_answered via BigQuery),
// 998 people and 315,216 first tries. Teaches each topic from the matching cards'
// own explanations only; card ids live in the draft, never on the page, and no
// stem or answer choice is reproduced.
// Numbers: gunner repo analysis/answer_telemetry/telemetry.py (aggregates.json).
// Figures: gunner repo docs/blog/figures/render_telemetry.py --light.
// Draft with card ids per statement: gunner repo docs/blog/most-missed-step-2-ck-topics.md.
// Built from the app-look blocks (components/app/README.md).
// No em or en dashes anywhere in the copy (site rule).
import Link from 'next/link';
import {
  AppShell, ArticleBody, ArticleHeader, Figure, Hero, Section, Table,
} from '../../components/app';
import { ChoicePair, PageHead, Pitch, ResearchStyles, Summary } from '../../components/app/research';
import { track } from '../../lib/analytics';

const CAMPAIGN = 'research_missed_topics';
const PUBLISHED = '2026-10-22';
const PATH = '/research/most-missed-step-2-ck-topics';

const TOC: [string, string][] = [
  ['folklore', 'Two things every study group says'],
  ['same', 'Do people miss the same questions?'],
  ['hard', 'How many questions are actually hard'],
  ['common', 'What the hard ones have in common'],
  ['topics', 'The four topics, briefly'],
  ['survive', 'What did not survive'],
  ['limits', 'What this cannot tell you'],
  ['do', 'What I would actually do'],
  ['short', 'The short version'],
  ['method', 'Data and method'],
  ['refs', 'References'],
];

export default function MostMissedTopics() {
  const title = 'Everyone misses the same questions. Here is what they have in common.';
  const desc = 'Stronger and weaker students miss the same Step 2 CK questions. The four topics where misses cluster, what they share, and a short lesson on each.';
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
    about: ['USMLE Step 2 CK', 'high yield topics', 'most missed questions'],
  };

  return (
    <>
      <PageHead metaTitle="The Most Missed Step 2 CK Topics, from 315,216 First Tries" metaDesc={desc} ogImage="/og/research/most-missed-step-2-ck-topics.png" ogAlt={title}>
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
            crumb={[{ href: '/readiness', label: 'Readiness check' }, { href: '/research', label: 'Research' }]}
            eyebrow="Research"
            title={title}
            accent="Here is what they have in common."
            dek={<>998 people, 315,216 first tries at 7,763 questions in a Step 2 CK app. The stronger half and the weaker half find the same questions hard, and the hard ones are not rare diseases. They are the less famous half of familiar topics.</>}
            meta={[`Published ${PUBLISHED}`, '998 people, 315,216 first tries', 'About 9 minutes']}
          />
          <Summary>
            <p>&ldquo;Everyone misses the same stuff&rdquo; turns out to be true. Split 564 students at their median accuracy, and the questions the stronger half found hard are the ones the weaker half found hard: the correlation is 0.87 across 691 questions, close to the 0.90 you get by splitting the same students at random. Stronger students do not miss different things. They miss less of the same things. After removing questions that look broken rather than hard, the misses cluster in four topics: health-system terms (59% right on the first try), bites, stings and cold injury (60%), urine sediment (61%), and vitamins and trace minerals (62%), against 75% for the whole bank. In each one, the best-known fact was answered right by about 9 in 10 people and the least-known by about 3 in 10. Below is a short lesson on each, taken from the explanations in the bank.</p>
          </Summary>
          <Pitch
            placement="top"
            kicker="Your forms, your exam date, one projected range"
            title="Find out where you stand before you decide what to review."
            body="The readiness check takes your NBME and UWSA scores with the dates you sat them and gives you a projected range instead of one fake precise number. Free, no account needed for the web version."
            primary={{ href: '/readiness', label: 'Run the readiness check', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_top' }) }}
            secondary={{ store: true, loc: 'top', label: 'Get the app free' }}
          />
        </Hero>

        <ArticleBody toc={TOC}>
          <Section id="folklore" n="01" title="Two things every study group says">
            <p className="prs">Everyone misses the same stuff. And the stuff everyone misses is the obscure stuff, the zebras you could never have prepared for. I wanted to know whether either was true, and a study app is one of the few places you can check, because it watches thousands of people answer the same questions.</p>
            <p className="prs">Who this is, before any number: 998 people who used Step Gunner, a Step 2 CK app, between June 12 and October 20, 2026, with test and developer accounts removed. They chose to use a study app. The questions are ours, not the NBME&apos;s, so a topic is hard here partly because of how we wrote it, and nothing below is a claim about what the exam tests most.</p>
            <p className="prs">I count each person&apos;s <strong>first try</strong> at each question, because the app brings missed questions back and repeats would make the hard ones look easier than they are. That is 315,216 first tries, and 74.8% of them were right.</p>
          </Section>

          <Section id="same" n="02" title="Do people miss the same questions?">
            <Figure n={1} src="/research/missed_fig1_same.svg" width={475} height={446} alt="Scatter of 691 questions comparing the first-try rate among the stronger half of students with the rate among the weaker half; the points run along a tight diagonal band, correlation 0.87" caption="Each dot is one question with at least 30 first tries in each half. The stronger half (median accuracy and up) sits higher, but the order of difficulty is nearly the same: r = 0.87." />
            <p className="prs">I split the 564 people with at least 50 answers at their median accuracy (76.7%) and compared how each question went for each half. The correlation is <strong>0.87</strong> (interval 0.85 to 0.89) across 691 questions. Splitting the same people at random, which tells you how high it could possibly go given the noise, gives 0.90.</p>
            <p className="prs">So the folklore holds. The stronger half got 78% of first tries right and the weaker half 66%, but the questions that were hard for one were hard for the other. Of the hardest tenth for each half, 72% were the same questions. Stronger students do not have different blind spots. They have the same ones, a bit smaller.</p>
          </Section>

          <Section id="hard" n="03" title="How many questions are actually hard">
            <p className="prs">Of the 763 questions with at least 100 attempts, <strong>9 sit under 35% correct and 46 under 50%</strong>. Counting only first tries, 245 questions have 100 or more, and 35 of them sit under 50%. The typical question among those 245 is answered right 77% of the time.</p>
            <p className="prs">Before reading a single explanation, I removed 17 of the 72 questions that were hard by either count. Four had their answer key edited while the data was being collected, so their rate may describe more than one version of the question. Thirteen showed no sign that stronger students did better on them than weaker ones, which is what a broken or ambiguous question looks like. Those are not hard topics. They are our bugs, and they are being reviewed rather than taught.</p>
          </Section>

          <Section id="common" n="04" title="What the hard ones have in common">
            <p className="prs">I grouped the remaining questions by topic and set the rule in advance: a topic counts if at least two of its questions are hard and the topic as a whole sits in the hardest quarter of the 310 topics with enough data. Four real topics pass, and all four are among the 15 hardest. They also stay there when I drop everything before a late-June rewrite of many answer choices.</p>
            <Figure n={2} src="/research/missed_fig2_topics.svg" width={576} height={353} alt="Strip plot of first-try rates for individual questions within four hard topics and one easy contrast topic; within each hard topic the questions range from below 35 percent to above 85 percent" caption="Blue dots are single questions with 50 or more first tries; gold is the whole topic. The dashed line is the bank as a whole. Within each hard topic the questions run from near the floor to near the ceiling. The lone dot near 5% failed the quality screen and is not taught." />
            <Table
              label="First try right, by hard topic"
              head={['topic', 'first try right', '95% interval', 'people']}
              num={[1, 2, 3]}
              hl={[4]}
              rows={[
                ['Health-system terms', <b key="b">59.0%</b>, '56.1 to 61.8', '329'],
                ['Bites, stings and cold', <b key="b">60.3%</b>, '57.8 to 62.7', '382'],
                ['Urine sediment', <b key="b">61.1%</b>, '57.8 to 64.4', '320'],
                ['Vitamins and trace minerals', <b key="b">62.4%</b>, '59.8 to 65.0', '329'],
                ['Whole bank', <b key="b">74.8%</b>, '', '998'],
              ]}
            />
            <p className="prs">None of these is a rare-disease topic. And look at what happens <strong>inside</strong> each one. The best-answered question in every hard topic sits at 89% or higher. The worst sits at 31% or lower. Wernicke encephalopathy was answered right by 99% of 77 people; the other thing thiamine deficiency does, a few rows down in the same topic, by 27% of 77. Red cell casts: 89%. The tubular epithelial cast: 29%. Malignant hyperthermia: 95%. A jellyfish sting: 31%.</p>
            <p className="prs">That is the pattern. The hard material is <strong>the less famous neighbour of a famous fact</strong>. My read, which the data cannot prove, is that these are topics you meet once as a list and rarely use on the wards, so the famous member of each list crowds out the rest.</p>
            <p className="prs">For contrast, the easy end. Cardiac and airway emergencies were answered right 91% of the time on the first try (249 people). Ethics questions about autonomy and refusing treatment: 97% (162 people), the easiest topic in the bank. By whole system the spread is small, from 68% in biostatistics to 79% in ethics. No system is a cliff. The cliffs are inside topics.</p>
            <Pitch
              kicker="The neighbours, on repeat"
              title="The fix for a shared blind spot is seeing the neighbour again until it sticks."
              body="Step Gunner covers these topics across Buzzwords, CK Gold vignettes and Next Best Step drills, plus Visual Dx images and LFX drills, and spaced repetition brings back the questions you miss. Free to download."
              primary={{ store: true, loc: 'mid', label: 'Get Step Gunner free' }}
              secondary={{ href: '/research/step-2-ck-time-per-question', label: 'Read: does going slower help?', onClick: () => track('cta_research_post', { surface: CAMPAIGN, target: 'step-2-ck-time-per-question' }) }}
            />
          </Section>

          <Section id="topics" n="05" title="The four topics, briefly" lead="Everything below comes from the explanations already in the bank for these questions. The rates are first tries.">
            <h3 className="h-3 subh">Vitamins and trace minerals</h3>
            <p className="rs-rate">62.4% right on the first try, 329 people, 23 questions</p>
            <p className="prs">The famous facts are near the ceiling: Wernicke (99%), B12 needing intrinsic factor (95%), pellagra (93%), scurvy (88%). The misses are the trace minerals and the second presentations, mostly between 27% and 48%.</p>
            <ul className="rs-ul">
              <li><strong>Thiamine has two faces.</strong> Wernicke encephalopathy is confusion, eye-movement problems and an unsteady gait in a heavy drinker, made worse by IV glucose, which is why thiamine goes in before or with dextrose. Thiamine deficiency also causes a symmetric glove-and-stocking sensorimotor neuropathy in heavy drinkers, dry beriberi. The neuropathy that belongs to B6 is the isoniazid one; B12 causes subacute combined degeneration of the dorsal columns and corticospinal tracts.</li>
              <li><strong>Copper</strong> accounts for three of the misses. Copper deficiency causes anemia with neutropenia and a spinal cord and nerve picture that looks just like B12&apos;s subacute combined degeneration, but with a normal B12. Classic causes are too much zinc (zinc switches on a gut protein, metallothionein, that holds copper and sheds it into the gut) and bariatric surgery. It is also tied to fragile blood vessels.</li>
              <li><strong>Selenium:</strong> a reversible dilated cardiomyopathy, either Keshan disease where the soil is selenium-poor or long-term TPN without trace elements. <strong>Chromium:</strong> impaired glucose tolerance, also in long-term TPN.</li>
              <li><strong>Zinc:</strong> poor growth and impaired sexual development in children, and a rash around the mouth and on the hands and feet with hair loss and diarrhea.</li>
              <li><strong>Pantothenic acid (B5)</strong>, the building block of coenzyme A: burning feet with dermatitis and enteritis, in severe malnutrition.</li>
              <li><strong>Folate:</strong> a megaloblastic anemia without neurologic signs. B12 deficiency adds the neurology and a raised methylmalonic acid; folate leaves methylmalonic acid normal.</li>
            </ul>

            <h3 className="h-3 subh">Urine sediment</h3>
            <p className="rs-rate">61.1% right on the first try, 320 people, 6 questions</p>
            <p className="prs">Red cell casts (89%) and white cell casts with fever and flank pain (74%) are well known. Tubular epithelial casts (29%), waxy casts (43%) and sterile pyuria (49%) are not.</p>
            <ul className="rs-ul">
              <li><strong>Casts tell you where the injury is.</strong> Red cell casts are glomerular: glomerulonephritis. White cell casts mean inflammation in the kidney tissue: pyelonephritis with fever and flank pain, or drug-induced interstitial nephritis with a recent drug, rash and eosinophils. Fatty casts and oval fat bodies, Maltese crosses under polarized light, mean nephrotic syndrome.</li>
              <li><strong>Tubular epithelial casts</strong> are sloughed cells from the tubule lining, an acute toxic or viral injury to the tubule. Acute tubular necrosis sheds muddy brown granular casts and tubular cells within days of ischemia or a nephrotoxin.</li>
              <li><strong>Waxy casts</strong> are broad, formed in dilated, shrunken nephrons: chronic, end-stage kidney disease.</li>
              <li><strong>Sterile pyuria</strong>, white cells with a negative routine culture, in a sexually active young adult is urethritis from chlamydia or gonorrhea, which do not grow on routine culture. The next step is nucleic acid amplification testing. Interstitial nephritis also gives culture-negative pyuria; the context separates them.</li>
            </ul>

            <h3 className="h-3 subh">Bites, stings and cold</h3>
            <p className="rs-rate">60.3% right on the first try, 382 people, 15 questions</p>
            <p className="prs">Malignant hyperthermia, a volatile anesthetic or succinylcholine followed by rising end-tidal CO2, rigidity and fever, treated with dantrolene, was answered right 94 to 95% of the time. Most of the bites, stings and cold injuries filed next to it sat between 31% and 65%.</p>
            <ul className="rs-ul">
              <li><strong>Two kinds of snake.</strong> Pit vipers (rattlesnakes, copperheads, water moccasins) cause swelling, bruising and a clotting problem, treated with Crotalidae immune Fab antivenom. Tourniquets, ice, and cutting and sucking are obsolete and make the local injury worse, and fasciotomy is only for a true compartment syndrome. Coral snakes (red on yellow) are the opposite: little at the bite, then drooping eyelids, double vision and trouble swallowing hours later, from a neurotoxin that blocks the neuromuscular junction. Coral snake antivenom goes in as soon as envenomation is suspected, because the block is hard to reverse once it sets in, and the pit viper antivenom does not cover it. Watch the airway and admit for at least 24 hours.</li>
              <li><strong>Black widow:</strong> a rigid, board-like abdomen with cramps, sweating and high blood pressure. IV opioids for the pain and a benzodiazepine for the spasm, antivenom for severe cases; calcium gluconate is no longer used. A brown recluse causes a local ulcer instead.</li>
              <li><strong>Frostbite:</strong> rapid rewarming in circulating water at 37 to 39 C. Never rub it, no dry heat, and do not let it thaw and refreeze. Amputation waits weeks, until the dead tissue has declared itself.</li>
              <li><strong>A cold drowning victim without a pulse</strong> gets CPR now, with rewarming alongside it, never first. &ldquo;Not dead until warm and dead&rdquo; means keep resuscitating through the cold.</li>
              <li><strong>Jellyfish.</strong> Vinegar and hot water are not rivals: they do different jobs at different moments. While tentacles from a box jellyfish, the kind in tropical waters such as northern Australia, are still on the skin, vinegar poured on for 30 seconds disarms the stingers that have not fired yet, so the tentacles can come off without more venom. Once the tentacles are off, hot water at about 45 C for 20 minutes is the best-supported treatment for the pain: the venom breaks down with heat, and hot water beat ice packs in a randomized trial. Never rinse with fresh water while stingers are still on the skin, because it makes unfired stingers discharge. Alcohol and scrubbing can fire more of them, and meat tenderizer did worse than hot water in a trial that compared them. For the Portuguese man-of-war, hot water is what the trials support; whether vinegar disarms or fires its stingers is still argued.</li>
            </ul>

            <h3 className="h-3 subh">Health-system terms</h3>
            <p className="rs-rate">59.0% right on the first try, 329 people, 14 questions</p>
            <p className="prs">The clinical-sounding questions were easy: recognising elder abuse (97%), teach-back for low health literacy (94%), a latent system failure behind an error (92%). The vocabulary was not: a Pareto chart (29%), a flexible spending account (38 to 54% across three questions), which insurer pays first (61%), a deductible (63%).</p>
            <ul className="rs-ul">
              <li><strong>FSA or HSA.</strong> Both take pretax money for medical costs. A flexible spending account is employer-sponsored and use it or lose it: money left at the end of the plan year is forfeited, and it does not move with you. A health savings account rolls over, belongs to you when you leave, and requires a high-deductible plan. A health reimbursement arrangement is paid in by the employer, not out of your paycheck. The bank&apos;s mnemonic: FSA, forfeit; HSA, held and hauled with you.</li>
              <li><strong>Cost sharing.</strong> The deductible is the fixed amount you pay each plan year before the plan pays anything, and it resets every year. A copay is a flat fee per visit or prescription, coinsurance is a percentage of the bill, the premium is what you pay to keep coverage, and the out-of-pocket maximum is the yearly ceiling.</li>
              <li><strong>Two payers.</strong> For someone eligible for both Medicare and Medicaid, Medicare pays first and Medicaid is the payer of last resort.</li>
              <li><strong>Pareto chart.</strong> Causes ranked from the tallest bar to the shortest with a cumulative percentage line, to find the vital few behind about 80% of events. A histogram bins a continuous measure and has no cumulative line, control and run charts plot a measure over time, and a fishbone diagram is a cause-and-effect tree.</li>
              <li><strong>Timeliness.</strong> The right care delivered late is a timeliness failure, not an effectiveness one.</li>
            </ul>
          </Section>

          <Section id="survive" n="06" title="What did not survive">
            <p className="prs"><strong>The counts moved.</strong> A first pass in September said 712 questions had 100 or more attempts, with 10 under 35% and 48 under 50%. On the same definition, with more data and with test installs and duplicate events removed, it is 763, 9 and 46.</p>
            <p className="prs"><strong>Seventeen &ldquo;hard&rdquo; questions were suspect, not hard.</strong> One had its answer changed outright in July, so its miss rate described two different questions. Without the quality screen, two more topics would have made this list, pediatric pigment skin disease and toxicology, each on the strength of questions that failed it.</p>
            <p className="prs"><strong>The zebra theory mostly fails.</strong> A couple of genuinely rare diagnoses do sit very low as single questions, but they are scattered one to a topic. The topics where misses pile up are vitamins, casts, stings and insurance words.</p>
          </Section>

          <Section id="limits" n="07" title="What this cannot tell you">
            <ul className="rs-ul">
              <li><strong>These are our questions.</strong> A topic can be hard here because we wrote it hard. Difficulty in this bank is not the same as how often the exam tests something.</li>
              <li><strong>The sample chose itself.</strong> App users who kept studying are not every test taker.</li>
              <li><strong>First try means first in our log</strong>, which starts in June. Anything someone saw before then is invisible.</li>
              <li><strong>Who reaches a question is not random.</strong> People pick their decks, and the first questions in a deck get more first tries than the last.</li>
              <li><strong>Topic labels are ours.</strong> One topic that passed the rule turned out to be a filing mistake (two unrelated surgical questions under the wrong heading) and is not taught here.</li>
            </ul>
          </Section>

          <Section id="do" n="08" title="What I would actually do" lead="This part is my judgment, not something the data proves.">
            <p className="prs"><strong>Review the neighbours, not the headline.</strong> You already know Wernicke, red cell casts and dantrolene, and so does everyone else. When you open one of these topics, skip the famous fact and spend the time on the ones next to it: the second thing a vitamin does, the casts that are not red cell casts, the snake that is not a pit viper, the account that is not an HSA.</p>
            <p className="prs">And if you are worried you have a blind spot nobody else has, you probably do not. The same questions were hard for nearly everyone here.</p>
          </Section>

          <Section id="short" n="09" title="The short version">
            <p className="prs">Stronger and weaker students miss the same questions; the stronger ones just miss fewer of them. The questions everyone misses are not zebras. They are the less famous half of familiar topics: trace minerals, uncommon urine casts, bites and stings, and insurance vocabulary.</p>
            <p className="prs"><strong>In every hard topic, the best-known fact was right about 9 times in 10 and the least-known about 3 times in 10. Study the neighbours.</strong></p>
          </Section>

          <ChoicePair
            store={{ label: 'Get Step Gunner free', sub: 'vignettes, drills, spaced repetition' }}
            alt={{ href: '/readiness', label: 'Run the readiness check', sub: 'free, with exam date and percentile', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'cta_bottom' }) }}
          />

          <Section id="method" n="" title="Data and method">
            <p className="prs">Every answer event the app logged from June 12 to October 20, 2026, minus simulator installs, duplicate events and the developer&apos;s own accounts: 450,766 answers by 998 people on 7,763 questions, of which 315,216 were a person&apos;s first try at a question. Hard means under 50% correct, either across all attempts (questions with 100 or more) or on first tries (questions with 100 or more first tries). A question was removed if its answer key changed during the window (checked against every version of the question bank since June) or if first-try correctness did not rise with a person&apos;s accuracy on everything else. Topic rates pool every first try in the topic, with 95% intervals from resampling people. The rule for a topic (two or more hard questions, hardest quarter of the 310 topics with at least 50 people and 5 questions) was set before any explanation was read. The lessons use only the explanations attached to those questions in the bank. Every cell shown has at least 10 people; no question stem, answer choice or individual record is published.</p>
          </Section>

          <Section id="refs" n="" title="References">
            <div className="refs"><ol>
              <li>Step Gunner answer telemetry, June 12 to October 20, 2026, aggregated; no individual records published.</li>
              <li>Step Gunner question bank explanations for the questions in each topic above, as live in the app on October 22, 2026.</li>
            </ol></div>
          </Section>
        </ArticleBody>
      </AppShell>
    </>
  );
}
