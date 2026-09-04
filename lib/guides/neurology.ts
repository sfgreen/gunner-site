import type { GuideData } from './types';
import { deckCounts, fitStats, modeWord } from './counts';

// Neurology clerkship guide. Same GuideData schema + voice as pediatrics.ts. The `fit`
// deck counts + total are AUTO-COMPUTED from lib/guides/clerkship_counts.json (generated
// in the app repo from live card data), keyed by rotation id "neurology". Numbers update
// as content ships with no edit here. FAQ answers and any medical claim are pending
// Danny's sign-off. No em or en dashes.
const c = deckCounts('neurology');

export const neurology: GuideData = {
  meta: {
    slug: 'neurology',
    clerkship: 'Neurology',
    title: 'How to Study for the Neurology Shelf: Resources and a Plan',
    description:
      'The honest Neurology shelf resource stack (UWorld, Blueprints Neurology, Case Files, OnlineMedEd, Anki), plus a week-by-week plan from an MS4.',
    ogTitle: 'How to Study for the Neurology Shelf: Resources and a Week-by-Week Plan',
    ogDescription:
      'The real MS3 resource stack for the neurology shelf, positioned by role, a week-by-week plan, and a plain-English shelf FAQ. Written by an MS4 who has been through it.',
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

  eyebrow: 'Neurology, Clerkship Guide',
  h1: 'Neurology clerkship: the resource stack, and a free shelf tool.',

  answer: {
    question: 'How do you study for the Neurology shelf?',
    body:
      'To study for the Neurology shelf, learn to **localize first, then treat**: make **UWorld Step 2 CK** your backbone and read every explanation. Read **Blueprints Neurology** or **Case Files** for the localization and workup logic, build frameworks with **OnlineMedEd**, and keep a daily spaced-repetition habit running in **Step Gunner**. Then take an **NBME practice shelf** before exam day.',
  },

  trust: {
    rating: 4.8,
    ratingLabel: 'on the App Store',
    studentsCount: '1,200+',
    studentsLabel: 'students studying',
    quote: 'Gotten me multiple questions on practice tests. Helpful for those not keen on the Anki burden but who like spaced repetition.',
    quoteCite: 'From a 5-star App Store review titled "Solid Step 2 studying addon"',
  },

  lede:
    'Neurology has one master skill under everything else: localize the lesion, then reason about cause and treatment. You build a small stack and use each piece for the one job it is good at. This is that stack, positioned honestly by role, plus a **week-by-week plan** that weaves it together. Step Gunner is one tool in it, the fast daily recall layer, and we will tell you exactly where it fits and where it does not.',

  stackSection: {
    num: '01',
    eyebrow: 'The resource stack',
    h2: 'What resources do you need for the Neurology clerkship?',
    intro:
      'Each of these earns its slot for one reason. Neuro is often a shorter rotation, so keep the stack lean. Pick your qbank, pick one reading source, and keep a spaced-repetition habit running underneath. The rest are supplements you reach for when a weak area shows up.',
  },
  resources: [
    {
      role: 'Qbank backbone',
      name: 'UWorld Step 2 CK',
      use: 'your primary learning engine. Do the Neurology blocks and read every explanation, the explanations are the real curriculum here.',
      note: 'Highest yield for both the shelf and Step 2 itself. If you do one thing well, do UWorld Neuro well.',
    },
    {
      role: 'Reading',
      name: 'Blueprints Neurology',
      also: 'Case Files Neurology',
      use: 'the localization framework and the workup logic. Blueprints is the concise reference; Case Files is the vignette-based alternative if you learn through cases.',
      note: 'Pick one as your main read. Blueprints is denser; Case Files is faster.',
    },
    {
      role: 'Video framework',
      name: 'OnlineMedEd',
      use: 'building the mental scaffold before the details. Watch the neurology videos when a topic is brand new, then reinforce with questions.',
      note: 'Great for the stroke, seizure, and neuromuscular approaches. Not a substitute for question volume.',
    },
    {
      role: 'Spaced repetition',
      name: 'Step Gunner',
      also: 'AnKing, on Anki',
      use: 'keeping the localization patterns and drug names from leaking out. Study the neuro decks as you cover each topic and let the review queue bring them back; if you already run AnKing, keep it.',
      note: 'Neuro is detail-dense, so retention is the whole game. Skip reviews and you relearn the same facts three times.',
    },
    {
      role: 'Audio and extra questions',
      name: 'Divine Intervention Podcast',
      also: 'AMBOSS',
      use: 'patching weak areas hands-free and adding reps. The Divine neurology and localization episodes are dense, high-yield audio; AMBOSS is a fast reference plus a second bank.',
      note: 'Supplements, not a second full curriculum. Reach for them once you know which topics are shaky.',
    },
  ],

  fitSection: {
    num: '02',
    eyebrow: 'Where Step Gunner fits',
    h2: 'Where does Step Gunner fit in the neurology stack?',
    intro:
      'Step Gunner is not your qbank and it is not your textbook. It is the 5 to 15 minute pattern-recognition tool you open between the big resources: between consults, in downtime, while a UWorld block loads. It drills **retrieval, not recognition**, so the localization patterns stick. Here is the Neurology content, counted straight from the app, no rounding up.',
  },
  fit: {
    intro: '',
    tag: 'Step Gunner, Neurology content',
    cardTitle: 'What is actually in the app for neurology.',
    cardIntro:
      'Three question decks are tagged Neurology, each a different study mode, plus a small image set. These are real counts from the current build, not projections.',
    stats: fitStats('neurology', [
      {
        deck: 'ckGold',
        k: 'CK Gold, Neuro',
        d: 'Diagnosis and next-step questions across stroke, seizure, headache, movement, and neuromuscular disease.',
      },
      {
        deck: 'nbs',
        k: 'Next Best Step, Neuro',
        d: 'Management-chain questions: given the presentation, what do you do next, and then what.',
      },
      {
        deck: 'buzzwords',
        k: 'Buzzwords, Neuro',
        d: 'Rapid pattern triggers: read the cardinal clue, name the diagnosis, move on.',
      },
      {
        deck: 'visualDx',
        k: 'Visual Dx, Neuro',
        d: 'Classic neuropathology images: name the diagnosis from the slide.',
      },
    ]),
    total: `**${c.display.total}** Neurology cards across ${modeWord('neurology')} study modes.`,
    coverageHeading: 'CK Gold Neuro coverage, by subtopic',
    coverage: [
      { name: 'Neuromuscular and peripheral', count: 26 },
      { name: 'Headache', count: 22 },
      { name: 'Seizure and epilepsy', count: 20 },
      { name: 'Movement disorders', count: 19 },
      { name: 'Spinal cord and other', count: 18 },
      { name: 'Stroke and cerebrovascular', count: 18 },
      { name: 'Dementia and cognition', count: 17 },
      { name: 'Demyelinating', count: 8 },
    ],
    coverageSource:
      'Source: Step Gunner app content database, current build, counted August 2026. Counts grow as content ships, which is why they carry a plus.',
    visualDxHeading: 'Plus classic neuropathology images in Visual Dx',
    visualDxChips: [
      'Glioblastoma, pseudopalisading necrosis',
      'Meningioma, psammoma bodies',
      'Alzheimer, neurofibrillary tangles',
      'Multiple sclerosis plaques',
    ],
    visualDxNote:
      'The Visual Dx image bank carries a small set of classic neuropathology slides, worth a few reps before the shelf.',
    honest:
      '**The honest part:** this is a supplement, not a spine. It will not replace UWorld, Blueprints or your reading. It replaces the ten minutes you would otherwise spend scrolling. The core is free to study; the Visual Dx image bank is the paid upgrade.',
    quote: {
      text: 'This app makes studying so effortless and fun. Highly recommend.',
      cite: 'From a 5-star App Store review titled "Best Step 2 supplement"',
    },
    ctaLabel: 'Get Step Gunner free, neurology decks included',
    ctaNote: 'No account needed to start. The core neurology decks are free.',
  },

  planSection: {
    num: '03',
    eyebrow: 'The plan',
    h2: 'How do you study for the neurology shelf, week by week?',
    intro:
      'Neuro blocks are often 4 weeks, so compress these phases to fit. The order matters more than the calendar. Early, you build the localization framework. In the middle, you turn up question volume. In the final stretch, you consolidate. Step Gunner runs daily underneath all three phases.',
  },
  plan: [
    {
      num: 1,
      weeks: 'Early block, orient',
      title: 'Learn to localize, go slow on purpose.',
      body:
        'Do not chase volume yet. You are building the one skill everything rests on: localizing the lesion, then reasoning about cause and next step.',
      bullets: [
        '**OnlineMedEd** neurology videos for the topics on your current service, framework first.',
        '**UWorld** on tutor mode, untimed, 10 to 20 a day, read every explanation.',
        '**Blueprints or Case Files** chapters that match what you are seeing that week.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 minutes of Buzzwords Neuro daily.** Build the reflex of clue to localization before you drown in detail.',
    },
    {
      num: 2,
      weeks: 'Middle block, build',
      title: 'Turn up the questions, start banking retention.',
      body:
        'This is the volume phase. Move UWorld to timed blocks and start a spaced-repetition habit so the early weeks stop leaking.',
      bullets: [
        '**UWorld** Neuro, 20 to 40 a day, timed blocks now, still reading every explanation.',
        '**AnKing** neuro cards: unsuspend what you have covered, do reviews daily without fail.',
        '**Blueprints** aimed at whatever your incorrects keep exposing.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 to 15 minutes of CK Gold and Next Best Step Neuro daily,** plus Visual Dx for slide reps. Use it as the between-block warm-up.',
    },
    {
      num: 3,
      weeks: 'Final stretch, the shelf approach',
      title: 'Consolidate, and stop learning new things.',
      body:
        'The last stretch is about firming up what you know and finding the last gaps, not opening new material. Take a practice NBME to calibrate.',
      bullets: [
        '**UWorld** finished, then a second pass on your incorrects and marked questions.',
        '**Divine Intervention** neurology and localization episodes on commutes to patch weak areas.',
        'Take an **NBME practice Neurology shelf** a week out and treat the review as a study session.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**Warm-up and palate cleanser between blocks,** and run the readiness check to see where you actually stand.',
    },
  ],

  faqSection: {
    num: '04',
    eyebrow: 'Neuro shelf FAQ',
    h2: 'Neurology shelf questions students actually ask.',
    intro:
      "Short, honest answers to the queries that come up every rotation. Where your school's rules differ from anything here, your school's rules win.",
  },
  faqs: [
    {
      q: 'What is a good NBME Neurology shelf score?',
      a: "A good score is usually defined by your school's honors cutoff, which often sits somewhere around the 70th percentile or higher on the NBME norm table. The exact scaled-score threshold varies by school and by year, so check your clerkship's grading rubric. Passing is typically well below the honors line.",
    },
    {
      q: 'Is localization really that important for the neuro shelf?',
      a: 'Yes. A large share of questions expect you to localize the lesion from the exam before you pick a diagnosis or next step. Investing early in a clean localization framework pays off across the whole shelf.',
    },
    {
      q: 'How much reading do I need for the neuro shelf?',
      a: 'One concise source is usually enough: Blueprints Neurology or Case Files Neurology. Pair it with UWorld and spaced repetition rather than adding a second heavy text.',
    },
    {
      q: 'How many UWorld Neuro questions should I do?',
      a: 'Aim to finish every Neurology-tagged question in UWorld Step 2 CK at least once during the rotation, then a second pass on your incorrects. Total volume matters less than reading and understanding every explanation.',
    },
    {
      q: 'When should I take the neurology shelf?',
      a: 'Take it on your scheduled exam day at the end of the rotation. Do a full NBME practice shelf about a week out to calibrate, and treat reviewing that practice test as a study session.',
    },
  ],

  ctaLine: 'Two free things worth doing before the shelf, and one for later.',
  endPrimaryLabel: 'Get the free neurology deck',
  endSecondaryLabel: 'Check your readiness, free',
  bridge: {
    label: 'later',
    pre: "Leaning toward Neurology as a specialty? When you get there, Rezumab's free ",
    linkText: 'Match Probability Calculator',
    linkHref: 'https://rezumab.app',
    post: ' shows your odds by program from NRMP data. No rush, that is a fourth-year problem.',
  },

  sticky: {
    label: 'Free Neuro decks. No sign-up.',
    cta: 'Get the app',
  },
  navCta: 'Get the free Neuro deck',
};
