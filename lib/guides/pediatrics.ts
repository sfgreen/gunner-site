import type { GuideData } from './types';
import { deckCounts, fitStats, modeWord } from './counts';

// Pediatrics clerkship guide. The `fit` deck counts + total are AUTO-COMPUTED from
// lib/guides/clerkship_counts.json (generated in the app repo from live card data),
// keyed by rotation id "pediatrics", so adding questions updates them with no edit
// here; the numbers are the rounded "N+" display strings from that file. Trust-strip figures (App Store 4.8,
// 1,200+ students, the two 5-star reviews) are real and verified. To clone a
// rotation, copy this file, swap the content, and register it in ./index.ts. No em
// or en dashes.
const c = deckCounts('pediatrics');

export const pediatrics: GuideData = {
  meta: {
    slug: 'pediatrics',
    clerkship: 'Pediatrics',
    title: 'How to Study for the Pediatrics Shelf: Resources and a Plan',
    description:
      'The honest Pediatrics shelf resource stack (UWorld, Anki, OnlineMedEd, Case Files, BRS, Divine Intervention), plus a 6 to 8 week plan from an MS4.',
    ogTitle: 'How to Study for the Pediatrics Shelf: Resources and a 6 to 8 Week Plan',
    ogDescription:
      'The real MS3 resource stack for the Peds shelf, positioned by role, a week-by-week plan, and a plain-English shelf FAQ. Written by an MS4 who has been through it.',
    ogImage: 'https://stepgunner.com/api/og',
    datePublished: '2026-08-01',
    dateModified: '2026-08-03',
  },

  author: {
    name: 'Danny Varghese',
    initials: 'DV',
    credential: 'MS4, Texas A&M College of Medicine',
    credentialLine: 'MS4, Texas A&M College of Medicine. Reviewed for accuracy. Updated August 2026.',
    reviewedLabel: 'Reviewed',
  },

  eyebrow: 'Pediatrics, Clerkship Guide',
  h1: 'Pediatrics clerkship: the resource stack, and a free shelf tool.',

  answer: {
    question: 'How do you study for the Pediatrics shelf?',
    body:
      'To study for the Pediatrics shelf, make **UWorld Step 2 CK** your backbone: do every Peds-tagged question and read each explanation. Build frameworks early with **OnlineMedEd**, lock facts in with daily spaced repetition in **Step Gunner**, and read **Case Files** or **BRS** for weak areas. Add short daily pattern-recognition reps, then take an **NBME practice shelf** before exam day.',
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
    'Nobody clears the Peds shelf with one resource. You build a small stack and use each piece for the one job it is good at. This is that stack, positioned honestly by role, plus a **6 to 8 week plan** that weaves it together. Step Gunner is one tool in it, the fast daily recall layer, and we will tell you exactly where it fits and where it does not.',

  stackSection: {
    num: '01',
    eyebrow: 'The resource stack',
    h2: 'What resources do you need for the Pediatrics clerkship?',
    intro:
      'Each of these earns its slot for one reason. Do not run all of them at full volume, you will burn out by week three. Pick your qbank, pick your framework, pick one reading source, and keep a spaced-repetition habit running underneath. The rest are supplements you reach for when a weak area shows up.',
  },
  resources: [
    {
      role: 'Qbank backbone',
      name: 'UWorld Step 2 CK',
      use: 'your primary learning engine. Do the Pediatrics-tagged blocks and read every explanation, the explanations are the real curriculum here.',
      note: 'Highest yield for both the shelf and Step 2 itself. If you do one thing well, do UWorld Peds well.',
    },
    {
      role: 'Spaced repetition',
      name: 'Step Gunner',
      also: 'AnKing, on Anki',
      use: 'keeping what you already learned from leaking out. Study the Peds decks as you cover each topic and let the review queue bring them back; if you already run AnKing, keep it.',
      note: 'The habit that makes week 6 not erase week 1. Skip it and you relearn the same facts three times.',
    },
    {
      role: 'Video framework',
      name: 'OnlineMedEd',
      use: 'building the mental scaffold before the details. Watch the Peds videos when a topic is brand new, then reinforce with questions.',
      note: 'Great for illness scripts and the big-picture approach. Not a substitute for question volume.',
    },
    {
      role: 'Reading',
      name: 'Case Files Pediatrics',
      also: 'BRS Pediatrics',
      use: 'your read-along text. Case Files teaches through vignettes that mirror shelf logic; BRS is the denser outline-plus-questions reference for targeted review.',
      note: 'Pick one as your main read. A chapter a night, or aimed at whatever weak area the questions exposed.',
    },
    {
      role: 'Audio review',
      name: 'Divine Intervention Podcast',
      use: 'patching weak areas hands-free. The Peds and rapid-review episodes are dense, high-yield audio for your commute and the gym.',
      note: 'Best in the two weeks before the shelf, once you know which topics are shaky.',
    },
    {
      role: 'Extra questions',
      name: 'AMBOSS',
      also: 'Pretest Pediatrics',
      use: 'more reps when you have finished UWorld Peds. AMBOSS doubles as a fast ward reference with attached articles; Pretest is a large Peds-only bank, often harder and more detailed than the shelf.',
      note: 'Supplements, not a second full curriculum. Reach for them if you have the time and want volume.',
    },
  ],

  fitSection: {
    num: '02',
    eyebrow: 'Where Step Gunner fits',
    h2: 'Where does Step Gunner fit in the Peds stack?',
    intro:
      'Step Gunner is not your qbank and it is not your textbook. It is the 5 to 15 minute pattern-recognition tool you open between the big resources: on the wards between patients, in line for coffee, while a UWorld block loads. It drills **retrieval, not recognition**, so the cardinal features stick. Here is the Pediatrics content, counted straight from the app, no rounding up.',
  },
  fit: {
    intro: '',
    tag: 'Step Gunner, Pediatrics content',
    cardTitle: 'What is actually in the app for Peds.',
    cardIntro:
      'Three question decks are tagged Pediatrics, each a different study mode. These are real counts from the current build, not projections.',
    stats: fitStats('pediatrics', [
      {
        deck: 'ckGold',
        k: 'CK Gold, Peds',
        d: 'Diagnosis and next-step questions across neonatology, development, congenital, and well-child.',
      },
      {
        deck: 'nbs',
        k: 'Next Best Step, Peds',
        d: 'Management-chain questions: given the presentation, what do you do next, and then what.',
      },
      {
        deck: 'buzzwords',
        k: 'Buzzwords, Peds',
        d: 'Rapid pattern triggers: read the cardinal clue, name the diagnosis, move on.',
      },
      {
        deck: 'visualDx',
        k: 'Visual Dx, Peds',
        d: 'Classic Pediatrics images: name the diagnosis from the rash, film, or exam finding.',
      },
    ]),
    total: `**${c.display.total}** Pediatrics-tagged cards across ${modeWord('pediatrics')} study modes.`,
    coverageHeading: 'CK Gold Peds coverage, by subtopic',
    coverage: [
      { name: 'Neonatology', count: 32 },
      { name: 'Well-child and general', count: 20 },
      { name: 'Peds GI and nutrition', count: 16 },
      { name: 'Congenital and genetic', count: 15 },
      { name: 'Development and growth', count: 14 },
      { name: 'Peds infectious and vaccines', count: 9 },
      { name: 'Peds orthopedics', count: 7 },
      { name: 'Dysmorphology', count: 7 },
      { name: 'Peds oncology', count: 6 },
    ],
    coverageSource:
      'Source: Step Gunner app content database, current build, counted August 2026. Counts grow as content ships, which is why they carry a plus.',
    visualDxHeading: 'Plus classic Peds imaging in Visual Dx',
    visualDxChips: [
      'Intussusception, target sign',
      'Pyloric stenosis, US',
      'Legg-Calve-Perthes',
      'Measles, Koplik spots',
      'Roseola',
      'Hand-foot-mouth',
      'Erythema infectiosum',
    ],
    visualDxNote:
      'The Visual Dx image bank has no dedicated Peds tag, so we are not quoting a number for it. It does carry the classic Peds visuals above, worth a few reps before the shelf.',
    honest:
      '**The honest part:** this is a supplement, not a spine. It will not replace UWorld or your reading. It replaces the ten minutes you would otherwise spend scrolling. The core is free to study; the Visual Dx image bank is the paid upgrade.',
    quote: {
      text: 'Gotten me multiple questions on practice tests. Helpful for those not keen on the Anki burden but who like spaced repetition.',
      cite: 'From a 5-star App Store review titled "Solid Step 2 studying addon"',
    },
    ctaLabel: 'Get Step Gunner, free',
    ctaNote: 'No account needed to start. The core Peds decks are free.',
  },

  planSection: {
    num: '03',
    eyebrow: 'The plan',
    h2: 'How do you study for the Peds shelf, week by week?',
    intro:
      'Compress the weeks if your rotation is shorter; the order matters more than the exact dates. Early, you build frameworks and go slow. In the middle, you turn up question volume. In the final stretch, you consolidate and stop learning new things. Step Gunner runs daily underneath all three phases.',
  },
  plan: [
    {
      num: 1,
      weeks: 'Weeks 1 to 2, orient',
      title: 'Build the framework, go slow on purpose.',
      body:
        'Do not chase volume yet. You are learning how Peds thinks: age-based differentials, growth and development, the newborn.',
      bullets: [
        '**OnlineMedEd** Peds videos for the topics on your current service, framework first.',
        '**UWorld** Peds on tutor mode, untimed, 10 to 20 a day, read every explanation.',
        '**Case Files** chapters that match the patients you are seeing that week.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 minutes of Buzzwords Peds daily.** Build the reflex of clue to diagnosis before you drown in detail.',
    },
    {
      num: 2,
      weeks: 'Weeks 3 to 5, build',
      title: 'Turn up the questions, start banking retention.',
      body:
        'This is the volume phase. Move UWorld to timed blocks and start a spaced-repetition habit so the early weeks stop leaking.',
      bullets: [
        '**UWorld** Peds, 20 to 40 a day, timed blocks now, still reading every explanation.',
        '**AnKing** Peds cards: unsuspend what you have covered, do reviews daily without fail.',
        '**BRS or Case Files** aimed at whatever your incorrects keep exposing.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 to 15 minutes of CK Gold and Next Best Step Peds daily,** plus Visual Dx for imaging reps. Use it as the between-block warm-up.',
    },
    {
      num: 3,
      weeks: 'Weeks 6 to 8, the shelf approach',
      title: 'Consolidate, and stop learning new things.',
      body:
        'The last stretch is about firming up what you know and finding the last gaps, not opening new material. Take a practice NBME to calibrate.',
      bullets: [
        '**UWorld** finished, then a second pass on your incorrects and marked questions.',
        '**Divine Intervention** Peds and rapid-review episodes on commutes to patch weak areas.',
        '**AnKing** reviews stay daily; **Pretest or AMBOSS** only if you want extra volume.',
        'Take an **NBME practice Peds shelf** a week out and treat the review as a study session.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**Warm-up and palate cleanser between blocks,** and run the readiness check to see where you actually stand.',
    },
  ],

  faqSection: {
    num: '04',
    eyebrow: 'Peds shelf FAQ',
    h2: 'Pediatrics shelf questions students actually ask.',
    intro:
      "Short, honest answers to the queries that come up every rotation. Where your school's rules differ from anything here, your school's rules win.",
  },
  faqs: [
    {
      q: 'What is a good NBME Pediatrics shelf score?',
      a: "A good score is usually defined by your school's honors cutoff, which often sits somewhere around the 70th percentile or higher on the NBME norm table. The exact scaled-score threshold varies by school and by year, so check your clerkship's grading rubric. Passing is typically well below the honors line.",
    },
    {
      q: 'How many UWorld Peds questions should I do?',
      a: 'Aim to finish every Pediatrics-tagged question in UWorld Step 2 CK at least once during the rotation, then do a second pass on your incorrects. Total volume matters less than reading and understanding every explanation.',
    },
    {
      q: 'How long should I study for the Peds shelf?',
      a: 'Most Pediatrics clerkships run 6 to 8 weeks, with the shelf at the end. Study a little every day from week one rather than cramming the final days; daily questions plus spaced repetition beat a last-minute sprint.',
    },
    {
      q: 'Do I need both Case Files and BRS Pediatrics?',
      a: 'No. Pick one as your main read: Case Files if you learn through clinical vignettes, BRS if you prefer a denser outline with practice questions. Use the other only to look up a specific weak topic.',
    },
    {
      q: 'When should I take the Peds shelf?',
      a: 'Take it on your scheduled exam day at the end of the rotation. Do a full NBME practice shelf about a week out to calibrate, and treat reviewing that practice test as a study session.',
    },
    {
      q: 'Is UWorld enough for the Peds shelf?',
      a: 'UWorld is the single most important resource, but most students pair it with a framework source and spaced repetition so the material sticks. If you finish UWorld Peds early, add practice from AMBOSS or Pretest rather than leaning on one bank alone.',
    },
  ],

  ctaLine: 'Two free things worth doing before the shelf, and one for later.',
  endPrimaryLabel: 'Check your readiness, free',
  endSecondaryLabel: 'Study Peds in Step Gunner',
  bridge: {
    label: 'later',
    pre: "Leaning toward Pediatrics as a specialty? When you get there, Rezumab's free ",
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
