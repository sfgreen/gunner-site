import type { GuideData } from './types';
import { deckCounts, fitStats, modeWord } from './counts';

// Internal Medicine clerkship guide. Cloned from pediatrics.ts (same GuideData
// schema + voice). IM is an AGGREGATE of the medicine subspecialty worlds, so its
// `fit` deck counts + total are AUTO-COMPUTED from lib/guides/clerkship_counts.json
// (generated in the app repo from live card data), keyed by rotation id
// "internal_medicine". The gen script sums every medicine subspecialty deck, so the
// numbers update as content ships with no edit here: CK Gold, Next Best Step,
// Buzzwords, and the 102 IM-tagged Visual Dx images (an earlier hand count wrongly
// showed none, which is why IM now carries a Visual Dx row). FAQ answers and any
// medical claim are pending Danny's sign-off. No em or en dashes.
const c = deckCounts('internal_medicine');

export const internalMedicine: GuideData = {
  meta: {
    slug: 'internal-medicine',
    clerkship: 'Internal Medicine',
    title: 'How to Study for the Internal Medicine Shelf: Resources and Plan',
    description:
      'The honest IM shelf resource stack (UWorld, Step-Up to Medicine, OnlineMedEd, Anki, Divine Intervention, AMBOSS), plus a week-by-week plan from an MS4.',
    ogTitle: 'How to Study for the Internal Medicine Shelf: Resources and a Week-by-Week Plan',
    ogDescription:
      'The real MS3 resource stack for the medicine shelf, positioned by role, a week-by-week plan, and a plain-English shelf FAQ. Written by an MS4 who has been through it.',
    ogImage: 'https://stepgunner.com/api/og',
    datePublished: '2026-08-04',
    dateModified: '2026-08-04',
  },

  author: {
    name: 'Danny Varghese',
    initials: 'DV',
    credential: 'MS4, Texas A&M College of Medicine',
    credentialLine: 'MS4, Texas A&M College of Medicine. Reviewed for accuracy. Updated August 2026.',
    reviewedLabel: 'Reviewed',
  },

  eyebrow: 'Internal Medicine, Clerkship Guide',
  h1: 'Internal Medicine clerkship: the resource stack, and a free shelf tool.',

  answer: {
    question: 'How do you study for the Internal Medicine shelf?',
    body:
      'To study for the Internal Medicine shelf, make **UWorld Step 2 CK** your backbone: do every medicine-relevant question and read each explanation. Use **Step-Up to Medicine** as your main text, build frameworks with **OnlineMedEd**, and lock facts in with daily spaced repetition in **Step Gunner**. Keep daily pattern-recognition reps, then take an **NBME practice shelf** before exam day.',
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
    'Nobody clears the Internal Medicine shelf with one resource. You build a small stack and use each piece for the one job it is good at. This is that stack, positioned honestly by role, plus a **week-by-week plan** that weaves it together. Step Gunner is one tool in it, the fast daily recall layer, and we will tell you exactly where it fits and where it does not.',

  stackSection: {
    num: '01',
    eyebrow: 'The resource stack',
    h2: 'What resources do you need for the Internal Medicine clerkship?',
    intro:
      'Each of these earns its slot for one reason. Do not run all of them at full volume, you will burn out fast on a rotation this broad. Pick your qbank, pick your framework, pick one reading source, and keep a spaced-repetition habit running underneath. The rest are supplements you reach for when a weak area shows up.',
  },
  resources: [
    {
      role: 'Qbank backbone',
      name: 'UWorld Step 2 CK',
      use: 'your primary learning engine. Medicine is the biggest slice of Step 2, so most of the qbank is fair game; read every explanation, they are the real curriculum here.',
      note: 'Highest yield for both the shelf and Step 2 itself. If you do one thing well, do UWorld well.',
    },
    {
      role: 'Reading bible',
      name: 'Step-Up to Medicine',
      use: 'your main read for the medicine shelf. It is the closest thing to a single source that maps to what the shelf tests, from the workup to the next step.',
      note: 'Read the section for whatever you are seeing on service, then the high-yield boxes. Do not try to memorize it cover to cover.',
    },
    {
      role: 'Video framework',
      name: 'OnlineMedEd',
      use: 'building the mental scaffold before the details. Watch the medicine videos when a topic is brand new, then reinforce with questions.',
      note: 'Great for illness scripts and the big-picture approach. Not a substitute for question volume.',
    },
    {
      role: 'Spaced repetition',
      name: 'Step Gunner',
      also: 'AnKing, on Anki',
      use: 'keeping what you already learned from leaking out. Study the medicine decks as you cover each topic and let the review queue bring them back; if you already run AnKing, keep it.',
      note: 'Medicine is broad and runs long, so retention is the whole game. Skip reviews and you relearn the same facts three times.',
    },
    {
      role: 'Audio review',
      name: 'Divine Intervention Podcast',
      use: 'patching weak areas hands-free. The medicine and rapid-review episodes are dense, high-yield audio for your commute and the gym.',
      note: 'Best in the two weeks before the shelf, once you know which topics are shaky.',
    },
    {
      role: 'Extra questions',
      name: 'AMBOSS',
      also: 'Pretest Medicine',
      use: 'more reps once you have worked the medicine questions in UWorld. AMBOSS doubles as a fast ward reference with attached articles; Pretest is a large medicine-only bank, often harder and more detailed than the shelf.',
      note: 'Supplements, not a second full curriculum. Reach for them if you have the time and want volume.',
    },
  ],

  fitSection: {
    num: '02',
    eyebrow: 'Where Step Gunner fits',
    h2: 'Where does Step Gunner fit in the medicine stack?',
    intro:
      'Step Gunner is not your qbank and it is not your textbook. It is the 5 to 15 minute pattern-recognition tool you open between the big resources: on the wards between patients, in line for coffee, while a UWorld block loads. It drills **retrieval, not recognition**, so the cardinal features stick. Here is the Internal Medicine content, summed straight from the app across every medicine subspecialty, no rounding up.',
  },
  fit: {
    intro: '',
    tag: 'Step Gunner, Internal Medicine content',
    cardTitle: 'What is actually in the app for medicine.',
    cardIntro:
      'Internal Medicine is not one deck, it is every medicine subspecialty added together, tagged across cardiology, ID, endocrine, heme, GI, pulmonology, and renal. These are real counts from the current build, not projections.',
    stats: fitStats('internal_medicine', [
      {
        deck: 'ckGold',
        k: 'CK Gold, IM',
        d: 'Diagnosis and next-step questions across cardiology, ID, endocrine, heme, GI, pulm, and renal.',
      },
      {
        deck: 'nbs',
        k: 'Next Best Step, IM',
        d: 'Management-chain questions: given the presentation, what do you do next, and then what.',
      },
      {
        deck: 'buzzwords',
        k: 'Buzzwords, IM',
        d: 'Rapid pattern triggers: read the cardinal clue, name the diagnosis, move on.',
      },
      {
        deck: 'visualDx',
        k: 'Visual Dx, IM',
        d: 'Classic medicine images: ECGs, blood smears, and biopsy histology, read the film, name the diagnosis.',
      },
    ]),
    total: `**${c.display.total}** Internal Medicine cards across ${modeWord('internal_medicine')} study modes.`,
    coverageHeading: 'CK Gold IM coverage, by subspecialty',
    coverage: [
      { name: 'Cardiology', count: 185 },
      { name: 'Infectious disease', count: 177 },
      { name: 'Endocrine', count: 168 },
      { name: 'Heme and oncology', count: 161 },
      { name: 'GI and hepatology', count: 152 },
      { name: 'Pulmonology', count: 146 },
      { name: 'Nephrology', count: 118 },
      { name: 'Allergy and immunology', count: 2 },
    ],
    coverageSource:
      'Source: Step Gunner app content database, current build, counted August 2026. The Internal Medicine total sums these subspecialty worlds. Counts grow as content ships, which is why they carry a plus.',
    visualDxHeading: 'Plus classic IM imaging and slides in Visual Dx',
    visualDxChips: [
      'Atrial fibrillation, ECG',
      'Complete heart block, ECG',
      'Torsades de pointes, ECG',
      'Acute myeloid leukemia, Auer rods',
      'Sickle cell disease, smear',
      'Sarcoidosis, noncaseating granulomas',
      'Diabetic nephropathy, renal biopsy',
    ],
    visualDxNote:
      'The Visual Dx image bank carries the classic IM visuals above, from ECGs to blood smears to biopsy histology, worth a few reps before the shelf.',
    honest:
      '**The honest part:** this is a supplement, not a spine. It will not replace UWorld, Step-Up or your reading. It replaces the ten minutes you would otherwise spend scrolling. The core is free to study; the Visual Dx image bank is the paid upgrade.',
    quote: {
      text: 'This app makes studying so effortless and fun. Highly recommend.',
      cite: 'From a 5-star App Store review titled "Best Step 2 supplement"',
    },
    ctaLabel: 'Get Step Gunner, free',
    ctaNote: 'No account needed to start. The core medicine decks are free.',
  },

  planSection: {
    num: '03',
    eyebrow: 'The plan',
    h2: 'How do you study for the medicine shelf, week by week?',
    intro:
      'Medicine blocks run anywhere from 4 to 12 weeks, so treat these as phases, not fixed dates: compress or stretch them to fit your rotation. The order matters more than the calendar. Early, you build frameworks and go slow. In the middle, you turn up question volume. In the final stretch, you consolidate and stop learning new things. Step Gunner runs daily underneath all three phases.',
  },
  plan: [
    {
      num: 1,
      weeks: 'Early block, orient',
      title: 'Build the framework, go slow on purpose.',
      body:
        'Do not chase volume yet. You are learning how medicine thinks: problem lists, workups, and the next-best-step reflex the shelf lives on.',
      bullets: [
        '**OnlineMedEd** medicine videos for the topics on your current service, framework first.',
        '**UWorld** on tutor mode, untimed, 10 to 20 a day, read every explanation.',
        '**Step-Up to Medicine** sections that match the patients you are seeing that week.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 minutes of Buzzwords daily.** Build the reflex of clue to diagnosis across the subspecialties before you drown in detail.',
    },
    {
      num: 2,
      weeks: 'Middle block, build',
      title: 'Turn up the questions, start banking retention.',
      body:
        'This is the volume phase. Move UWorld to timed blocks and start a spaced-repetition habit so the early weeks stop leaking, medicine is too broad to hold in your head otherwise.',
      bullets: [
        '**UWorld**, 20 to 40 a day, timed blocks now, still reading every explanation.',
        '**AnKing** medicine cards: unsuspend what you have covered, do reviews daily without fail.',
        '**Step-Up to Medicine** aimed at whatever your incorrects keep exposing.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 to 15 minutes of CK Gold and Next Best Step daily,** plus Visual Dx for ECG and smear reps. Use it as the between-block warm-up.',
    },
    {
      num: 3,
      weeks: 'Final stretch, the shelf approach',
      title: 'Consolidate, and stop learning new things.',
      body:
        'The last stretch is about firming up what you know and finding the last gaps, not opening new material. Take a practice NBME to calibrate.',
      bullets: [
        '**UWorld** finished, then a second pass on your incorrects and marked questions.',
        '**Divine Intervention** medicine and rapid-review episodes on commutes to patch weak areas.',
        '**AnKing** reviews stay daily; **Pretest or AMBOSS** only if you want extra volume.',
        'Take an **NBME practice medicine shelf** a week out and treat the review as a study session.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**Warm-up and palate cleanser between blocks,** and run the readiness check to see where you actually stand.',
    },
  ],

  faqSection: {
    num: '04',
    eyebrow: 'Medicine shelf FAQ',
    h2: 'Internal Medicine shelf questions students actually ask.',
    intro:
      "Short, honest answers to the queries that come up every rotation. Where your school's rules differ from anything here, your school's rules win.",
  },
  faqs: [
    {
      q: 'What is a good NBME Medicine shelf score?',
      a: "A good score is usually defined by your school's honors cutoff, which often sits somewhere around the 70th percentile or higher on the NBME norm table. The exact scaled-score threshold varies by school and by year, so check your clerkship's grading rubric. Passing is typically well below the honors line.",
    },
    {
      q: 'Is Step-Up to Medicine enough for the medicine shelf?',
      a: 'Step-Up to Medicine is the best single text for the shelf, but few students pass on it alone. Pair it with UWorld and spaced repetition: Step-Up builds the framework, the questions teach you how the shelf actually asks, and Anki keeps it from leaking.',
    },
    {
      q: 'How many UWorld IM questions should I do?',
      a: 'Medicine is the largest share of Step 2, so aim to work through the medicine-relevant questions at least once during the rotation, then do a second pass on your incorrects. Total volume matters less than reading and understanding every explanation.',
    },
    {
      q: 'How long should I study for the medicine shelf?',
      a: 'Medicine clerkships range from about 4 to 12 weeks, with the shelf at the end. Study a little every day from week one rather than cramming the final days; because the material is so broad, daily questions plus spaced repetition beat a last-minute sprint.',
    },
    {
      q: 'Is the medicine shelf the hardest?',
      a: 'It is widely considered one of the broadest, since it spans every medicine subspecialty, which is why many students find it the most demanding shelf. Breadth is the real challenge more than trick questions, so consistent daily coverage and question volume matter more than any single resource.',
    },
  ],

  ctaLine: 'Two free things worth doing before the shelf, and one for later.',
  endPrimaryLabel: 'Check your readiness, free',
  endSecondaryLabel: 'Study medicine in Step Gunner',
  bridge: {
    label: 'later',
    pre: "Leaning toward Internal Medicine as a specialty? When you get there, Rezumab's free ",
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
