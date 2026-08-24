import type { GuideData } from './types';
import { deckCounts, fitStats, modeWord } from './counts';

// Psychiatry clerkship guide. Same GuideData schema + voice as pediatrics.ts. The `fit`
// deck counts + total are AUTO-COMPUTED from lib/guides/clerkship_counts.json (generated
// in the app repo from live card data), keyed by rotation id "psychiatry". Psych has no
// Visual Dx image set, so visualDxChips is empty and GuideLayout omits that section.
// FAQ answers and any medical claim are pending Danny's sign-off. No em or en dashes.
const c = deckCounts('psychiatry');

export const psychiatry: GuideData = {
  meta: {
    slug: 'psychiatry',
    clerkship: 'Psychiatry',
    title: 'How to Study for the Psychiatry Shelf: Resources and a Plan',
    description:
      'The honest Psychiatry shelf resource stack (UWorld, First Aid for the Psychiatry Clerkship, Case Files, Anki), plus a week-by-week plan from an MS4.',
    ogTitle: 'How to Study for the Psychiatry Shelf: Resources and a Week-by-Week Plan',
    ogDescription:
      'The real MS3 resource stack for the psychiatry shelf, positioned by role, a week-by-week plan, and a plain-English shelf FAQ. Written by an MS4 who has been through it.',
    ogImage: 'https://stepgunner.com/api/og',
    datePublished: '2026-08-05',
    dateModified: '2026-08-05',
  },

  author: {
    name: 'Danny Varghese',
    initials: 'DV',
    credential: 'MS4, Texas A&M College of Medicine',
    credentialLine: 'MS4, Texas A&M College of Medicine. Reviewed for accuracy. Updated August 2026.',
    reviewedLabel: 'Reviewed',
  },

  eyebrow: 'Psychiatry, Clerkship Guide',
  h1: 'Psychiatry clerkship: the resource stack, and a free shelf tool.',

  answer: {
    question: 'How do you study for the Psychiatry shelf?',
    body:
      'To study for the Psychiatry shelf, make **UWorld Step 2 CK** your backbone and read every explanation. Read **First Aid for the Psychiatry Clerkship** for the diagnostic criteria and first-line treatments, build frameworks with **OnlineMedEd**, and keep **Anki** running. Psych is pattern-heavy and very learnable, so daily reps pay off. Then take an **NBME practice shelf** before exam day.',
  },

  trust: {
    rating: 4.8,
    ratingLabel: 'on the App Store',
    studentsCount: '1,200+',
    studentsLabel: 'students studying',
    quote: 'This app makes studying so effortless and fun. Highly recommend.',
    quoteCite: 'From a 5-star App Store review titled "Best Step 2 supplement"',
  },

  lede:
    'Psychiatry is one of the most learnable shelves: the diagnoses hinge on time criteria and cardinal features, and the treatments are first-line patterns you can drill. You build a small stack and use each piece for the one job it is good at. This is that stack, positioned honestly by role, plus a **week-by-week plan** that weaves it together. Step Gunner is one tool in it, the fast daily recall layer, and we will tell you exactly where it fits and where it does not.',

  stackSection: {
    num: '01',
    eyebrow: 'The resource stack',
    h2: 'What resources do you need for the Psychiatry clerkship?',
    intro:
      'Each of these earns its slot for one reason. Psych is a shorter, high-yield rotation, so the stack is lean. Pick your qbank, pick one reading source, and keep a spaced-repetition habit running underneath. The rest are supplements you reach for when a weak area shows up.',
  },
  resources: [
    {
      role: 'Qbank backbone',
      name: 'UWorld Step 2 CK',
      use: 'your primary learning engine. Do the Psychiatry blocks and read every explanation, the explanations are the real curriculum here.',
      note: 'Highest yield for both the shelf and Step 2 itself. If you do one thing well, do UWorld Psych well.',
    },
    {
      role: 'Reading',
      name: 'First Aid for the Psychiatry Clerkship',
      also: 'Case Files Psychiatry',
      use: 'the diagnostic criteria, time cutoffs, and first-line treatments, laid out to match the shelf. Case Files is the vignette-based alternative if you prefer to learn through cases.',
      note: 'Pick one as your main read. First Aid is criteria-first; Case Files is case-first.',
    },
    {
      role: 'Video framework',
      name: 'OnlineMedEd',
      use: 'building the mental scaffold before the details. Watch the psychiatry videos when a topic is brand new, then reinforce with questions.',
      note: 'Great for the diagnostic approach and the medication classes. Not a substitute for question volume.',
    },
    {
      role: 'Spaced repetition',
      name: 'AnKing, on Anki',
      use: 'keeping the criteria and first-line drugs from blurring together. Unsuspend the psych subdecks as you cover topics, then do your reviews daily.',
      note: 'Psych rewards clean recall of criteria and treatments, exactly what spaced repetition is for.',
    },
    {
      role: 'Audio and extra questions',
      name: 'Divine Intervention Podcast',
      also: 'AMBOSS',
      use: 'patching weak areas hands-free and adding reps. The Divine psychiatry episodes are dense, high-yield audio; AMBOSS is a fast reference plus a second bank.',
      note: 'Supplements, not a second full curriculum. Reach for them once you know which topics are shaky.',
    },
  ],

  fitSection: {
    num: '02',
    eyebrow: 'Where Step Gunner fits',
    h2: 'Where does Step Gunner fit in the psychiatry stack?',
    intro:
      'Step Gunner is not your qbank and it is not your textbook. It is the 5 to 15 minute pattern-recognition tool you open between the big resources: between interviews, in downtime, while a UWorld block loads. It drills **retrieval, not recognition**, so the criteria and first-line treatments stick. Here is the Psychiatry content, counted straight from the app, no rounding up.',
  },
  fit: {
    intro: '',
    tag: 'Step Gunner, Psychiatry content',
    cardTitle: 'What is actually in the app for psychiatry.',
    cardIntro:
      'Three question decks are tagged Psychiatry, each a different study mode. These are real counts from the current build, not projections.',
    stats: fitStats('psychiatry', [
      {
        deck: 'ckGold',
        k: 'CK Gold, Psych',
        d: 'Diagnosis and next-step questions across mood, psychotic, anxiety, substance, and personality disorders.',
      },
      {
        deck: 'nbs',
        k: 'Next Best Step, Psych',
        d: 'Management-chain questions: given the presentation, what do you do next, and then what.',
      },
      {
        deck: 'buzzwords',
        k: 'Buzzwords, Psych',
        d: 'Rapid pattern triggers: read the cardinal clue, name the diagnosis, move on.',
      },
    ]),
    total: `**${c.display.total}** Psychiatry cards across ${modeWord('psychiatry')} study modes.`,
    coverageHeading: 'CK Gold Psych coverage, by subtopic',
    coverage: [
      { name: 'Psychotic disorders', count: 33 },
      { name: 'Substance use', count: 30 },
      { name: 'Personality and somatic', count: 22 },
      { name: 'Anxiety, OCD and trauma', count: 22 },
      { name: 'Child and neurodevelopmental', count: 20 },
      { name: 'Mood disorders', count: 20 },
      { name: 'Psychopharmacology', count: 10 },
      { name: 'Eating disorders', count: 5 },
    ],
    coverageSource:
      'Source: Step Gunner app content database, current build, counted August 2026. Counts grow as content ships, which is why they carry a plus.',
    visualDxHeading: '',
    visualDxChips: [],
    visualDxNote: '',
    honest:
      '**The honest part:** this is a supplement, not a spine. It will not replace UWorld, your reading, or Anki. It replaces the ten minutes you would otherwise spend scrolling. The core is free to study; the Visual Dx image bank is the paid upgrade, though psychiatry leans on the text decks rather than images.',
    quote: {
      text: 'Gotten me multiple questions on practice tests. Helpful for those not keen on the Anki burden but who like spaced repetition.',
      cite: 'From a 5-star App Store review titled "Solid Step 2 studying addon"',
    },
    ctaLabel: 'Get Step Gunner, free',
    ctaNote: 'No account needed to start. The core psychiatry decks are free.',
  },

  planSection: {
    num: '03',
    eyebrow: 'The plan',
    h2: 'How do you study for the psychiatry shelf, week by week?',
    intro:
      'Psych blocks are often shorter, 4 to 6 weeks, so compress these phases to fit. The order matters more than the calendar. Early, you learn the diagnostic criteria and time cutoffs. In the middle, you turn up question volume. In the final stretch, you consolidate. Step Gunner runs daily underneath all three phases.',
  },
  plan: [
    {
      num: 1,
      weeks: 'Early block, orient',
      title: 'Learn the criteria, go slow on purpose.',
      body:
        'Do not chase volume yet. You are nailing the diagnostic criteria, the time cutoffs that separate look-alike diagnoses, and the first-line treatments.',
      bullets: [
        '**OnlineMedEd** psychiatry videos for the topics on your current service, framework first.',
        '**UWorld** on tutor mode, untimed, 10 to 20 a day, read every explanation.',
        '**First Aid for the Psychiatry Clerkship** chapters that match what you are seeing.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 minutes of Buzzwords Psych daily.** Build the reflex of clue to diagnosis, psych rewards it more than most shelves.',
    },
    {
      num: 2,
      weeks: 'Middle block, build',
      title: 'Turn up the questions, start banking retention.',
      body:
        'This is the volume phase. Move UWorld to timed blocks and start a spaced-repetition habit so the criteria stop blurring together.',
      bullets: [
        '**UWorld** Psych, 20 to 40 a day, timed blocks now, still reading every explanation.',
        '**AnKing** psych cards: unsuspend what you have covered, do reviews daily without fail.',
        '**First Aid or Case Files** aimed at whatever your incorrects keep exposing.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 to 15 minutes of CK Gold and Next Best Step Psych daily.** Use it as the between-block warm-up.',
    },
    {
      num: 3,
      weeks: 'Final stretch, the shelf approach',
      title: 'Consolidate, and stop learning new things.',
      body:
        'The last stretch is about firming up what you know and finding the last gaps, not opening new material. Take a practice NBME to calibrate.',
      bullets: [
        '**UWorld** finished, then a second pass on your incorrects and marked questions.',
        '**Divine Intervention** psychiatry episodes on commutes to patch weak areas.',
        'Take an **NBME practice Psychiatry shelf** a week out and treat the review as a study session.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**Warm-up and palate cleanser between blocks,** and run the readiness check to see where you actually stand.',
    },
  ],

  faqSection: {
    num: '04',
    eyebrow: 'Psych shelf FAQ',
    h2: 'Psychiatry shelf questions students actually ask.',
    intro:
      "Short, honest answers to the queries that come up every rotation. Where your school's rules differ from anything here, your school's rules win.",
  },
  faqs: [
    {
      q: 'What is a good NBME Psychiatry shelf score?',
      a: "A good score is usually defined by your school's honors cutoff, which often sits somewhere around the 70th percentile or higher on the NBME norm table. The exact scaled-score threshold varies by school and by year, so check your clerkship's grading rubric. Passing is typically well below the honors line.",
    },
    {
      q: 'Is the psychiatry shelf easy?',
      a: 'Many students find it one of the more learnable shelves because diagnoses hinge on clear criteria and time cutoffs, and treatments are first-line patterns. That does not make it trivial; the exam tests fine distinctions between look-alike diagnoses, which is exactly where daily recall helps.',
    },
    {
      q: 'How much reading do I need for the psych shelf?',
      a: 'One concise source is usually enough: either First Aid for the Psychiatry Clerkship or Case Files Psychiatry. Pair it with UWorld and spaced repetition rather than adding a second heavy text.',
    },
    {
      q: 'How many UWorld Psych questions should I do?',
      a: 'Aim to finish every Psychiatry-tagged question in UWorld Step 2 CK at least once during the rotation, then a second pass on your incorrects. The bank is smaller than medicine, so completing it is realistic.',
    },
    {
      q: 'When should I take the psychiatry shelf?',
      a: 'Take it on your scheduled exam day at the end of the rotation. Do a full NBME practice shelf about a week out to calibrate, and treat reviewing that practice test as a study session.',
    },
  ],

  ctaLine: 'Two free things worth doing before the shelf, and one for later.',
  endPrimaryLabel: 'Check your readiness, free',
  endSecondaryLabel: 'Study psychiatry in Step Gunner',
  bridge: {
    label: 'later',
    pre: "Leaning toward Psychiatry as a specialty? When you get there, Rezumab's free ",
    linkText: 'Match Probability Calculator',
    linkHref: 'https://rezumab.app',
    post: ' shows your odds by program from NRMP data. No rush, that is a fourth-year problem.',
  },

  sticky: {
    label: 'Free Step 2 score predictor. No sign-up.',
    cta: 'Free score predictor',
  },
  navCta: 'Free score predictor',
};
