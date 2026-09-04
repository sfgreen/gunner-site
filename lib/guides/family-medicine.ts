import type { GuideData } from './types';
import { deckCounts, fitStats, modeWord } from './counts';

// Family Medicine clerkship guide. Same GuideData schema + voice as pediatrics.ts. The
// `fit` deck counts + total are AUTO-COMPUTED from lib/guides/clerkship_counts.json
// (generated in the app repo from live card data), keyed by rotation id "family_medicine"
// (underscore id, hyphen slug). It pools the ambulatory worlds, preventive/screening and
// dermatology. Numbers update as content ships with no edit here. FAQ answers and any
// medical claim are pending Danny's sign-off. No em or en dashes.
const c = deckCounts('family_medicine');

export const familyMedicine: GuideData = {
  meta: {
    slug: 'family-medicine',
    clerkship: 'Family Medicine',
    title: 'How to Study for the Family Medicine Shelf: Resources and Plan',
    description:
      'The honest Family Medicine shelf resource stack (UWorld, AAFP questions, Case Files, OnlineMedEd, USPSTF), plus a week-by-week plan from an MS4.',
    ogTitle: 'How to Study for the Family Medicine Shelf: Resources and a Week-by-Week Plan',
    ogDescription:
      'The real MS3 resource stack for the family medicine shelf, positioned by role, a week-by-week plan, and a plain-English shelf FAQ. Written by an MS4 who has been through it.',
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

  eyebrow: 'Family Medicine, Clerkship Guide',
  h1: 'Family Medicine clerkship: the resource stack, and a free shelf tool.',

  answer: {
    question: 'How do you study for the Family Medicine shelf?',
    body:
      'To study for the Family Medicine shelf, expect breadth: it screens, prevents, and manages a bit of everything. Make **UWorld Step 2 CK** your backbone and read every explanation, learn the **USPSTF screening and prevention** guidelines cold, add the free **AAFP** questions, read **Case Files**, and keep a daily spaced-repetition habit running in **Step Gunner**. Then take an **NBME practice shelf** before exam day.',
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
    'Family Medicine is everything at once: screen, prevent, and manage across every organ system in the ambulatory setting. The one topic it tests harder than any other shelf is prevention, the screening calendar and the USPSTF grades. You build a small stack and use each piece for the one job it is good at. This is that stack, positioned honestly by role, plus a **week-by-week plan** that weaves it together. Step Gunner is one tool in it, the fast daily recall layer, and we will tell you exactly where it fits and where it does not.',

  stackSection: {
    num: '01',
    eyebrow: 'The resource stack',
    h2: 'What resources do you need for the Family Medicine clerkship?',
    intro:
      'Each of these earns its slot for one reason. FM is broad, so your medicine base carries most of it; the shelf-specific work is prevention and screening. Pick your qbank, learn the guidelines, pick one reading source, and keep a spaced-repetition habit running underneath.',
  },
  resources: [
    {
      role: 'Qbank backbone',
      name: 'UWorld Step 2 CK',
      use: 'your primary learning engine. FM pulls from across the qbank, so most of it is fair game; read every explanation, especially the screening and outpatient management ones.',
      note: 'Highest yield for both the shelf and Step 2 itself. If you do one thing well, do UWorld well.',
    },
    {
      role: 'Guidelines',
      name: 'USPSTF screening and prevention',
      use: 'the single most FM-specific topic. Know who gets screened for what, when to start and stop, and the grade behind each recommendation.',
      note: 'This is where FM differs from medicine. Worth a dedicated pass and frequent review.',
    },
    {
      role: 'Specialty questions',
      name: 'AAFP questions',
      also: 'Case Files Family Medicine',
      use: 'FM-flavored reps and read-along cases. The AAFP student questions are free and ambulatory-focused; Case Files walks the outpatient reasoning case by case.',
      note: 'Use AAFP as a second bank after UWorld; use Case Files as your main read.',
    },
    {
      role: 'Video framework',
      name: 'OnlineMedEd',
      use: 'building the mental scaffold before the details. Watch the ambulatory and preventive videos when a topic is brand new, then reinforce with questions.',
      note: 'Great for the outpatient approach. Not a substitute for question volume.',
    },
    {
      role: 'Spaced repetition',
      name: 'Step Gunner',
      also: 'AnKing, on Anki',
      use: 'keeping the screening intervals and outpatient management steps from leaking out. Study the relevant decks as you cover each topic and let the review queue bring them back; if you already run AnKing, keep it.',
      note: 'Breadth makes retention the whole game. Skip reviews and you relearn the same facts three times.',
    },
    {
      role: 'Audio and extra questions',
      name: 'Divine Intervention Podcast',
      also: 'AMBOSS',
      use: 'patching weak areas hands-free and adding reps. The Divine family medicine and rapid-review episodes are dense audio; AMBOSS is a fast reference plus a second bank.',
      note: 'Supplements, not a second full curriculum. Reach for them once you know which topics are shaky.',
    },
  ],

  fitSection: {
    num: '02',
    eyebrow: 'Where Step Gunner fits',
    h2: 'Where does Step Gunner fit in the family medicine stack?',
    intro:
      'Step Gunner is not your qbank and it is not your textbook. It is the 5 to 15 minute pattern-recognition tool you open between the big resources: between clinic patients, in downtime, while a UWorld block loads. It drills **retrieval, not recognition**, so the screening rules and cardinal features stick. Here is the Family Medicine content, summed straight from the app across the ambulatory and dermatology worlds, no rounding up.',
  },
  fit: {
    intro: '',
    tag: 'Step Gunner, Family Medicine content',
    cardTitle: 'What is actually in the app for family medicine.',
    cardIntro:
      'Family Medicine pools the ambulatory worlds, preventive and screening plus dermatology, across three question decks and a large dermatology image set. These are real counts from the current build, not projections.',
    stats: fitStats('family_medicine', [
      {
        deck: 'ckGold',
        k: 'CK Gold, FM',
        d: 'Diagnosis and next-step questions across screening, prevention, and outpatient dermatology.',
      },
      {
        deck: 'nbs',
        k: 'Next Best Step, FM',
        d: 'Management-chain questions: given the presentation, what do you do next, and then what.',
      },
      {
        deck: 'buzzwords',
        k: 'Buzzwords, FM',
        d: 'Rapid pattern triggers: read the cardinal clue, name the diagnosis, move on.',
      },
      {
        deck: 'visualDx',
        k: 'Visual Dx, Derm',
        d: 'A large dermatology image bank: name the diagnosis from the rash or lesion.',
      },
    ]),
    total: `**${c.display.total}** Family Medicine cards across ${modeWord('family_medicine')} study modes.`,
    coverageHeading: 'CK Gold FM coverage, by area',
    coverage: [
      { name: 'Dermatology', count: 89 },
      { name: 'Preventive and screening', count: 54 },
    ],
    coverageSource:
      'Source: Step Gunner app content database, current build, counted August 2026. Family Medicine pools the preventive and dermatology worlds. Counts grow as content ships, which is why they carry a plus.',
    visualDxHeading: 'Plus a large dermatology image bank in Visual Dx',
    visualDxChips: [
      'Melanoma, ABCDE',
      'Basal cell carcinoma',
      'Psoriasis plaques',
      'Tinea, KOH prep',
      'Pemphigus vulgaris',
      'Seborrheic keratosis',
    ],
    visualDxNote:
      'Dermatology is the most image-driven part of FM, and the Visual Dx bank leans into it. Worth steady reps before the shelf.',
    honest:
      '**The honest part:** this is a supplement, not a spine. It will not replace UWorld, the USPSTF guidelines or your reading. It replaces the ten minutes you would otherwise spend scrolling. The core is free to study; the Visual Dx image bank is the paid upgrade.',
    quote: {
      text: 'Gotten me multiple questions on practice tests. Helpful for those not keen on the Anki burden but who like spaced repetition.',
      cite: 'From a 5-star App Store review titled "Solid Step 2 studying addon"',
    },
    ctaLabel: 'Get Step Gunner, free',
    ctaNote: 'No account needed to start. The core family medicine decks are free.',
  },

  planSection: {
    num: '03',
    eyebrow: 'The plan',
    h2: 'How do you study for the family medicine shelf, week by week?',
    intro:
      'FM blocks usually run 4 to 8 weeks, so treat these as phases, not fixed dates. The order matters more than the calendar. Early, you lock in the screening and prevention guidelines. In the middle, you turn up question volume across systems. In the final stretch, you consolidate. Step Gunner runs daily underneath all three phases.',
  },
  plan: [
    {
      num: 1,
      weeks: 'Early block, orient',
      title: 'Lock in prevention, go broad on purpose.',
      body:
        'Do not chase depth in any one system yet. You are building the FM-specific spine: the screening calendar, the USPSTF grades, and the ambulatory approach.',
      bullets: [
        '**USPSTF screening and prevention** front to back, this is the FM-specific content.',
        '**UWorld** on tutor mode, untimed, 10 to 20 a day, read every explanation.',
        '**OnlineMedEd** ambulatory and preventive videos for the topics on your schedule.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 minutes of Buzzwords and Visual Dx Derm daily.** Build the reflex of clue to diagnosis across systems and rashes.',
    },
    {
      num: 2,
      weeks: 'Middle block, build',
      title: 'Turn up the questions, start banking retention.',
      body:
        'This is the volume phase. Move UWorld to timed blocks, add AAFP for FM-flavored reps, and start a spaced-repetition habit so the breadth stops leaking.',
      bullets: [
        '**UWorld**, 20 to 40 a day, timed blocks now, still reading every explanation.',
        '**AAFP questions** for ambulatory reps on topics UWorld skimmed.',
        '**AnKing** cards: unsuspend what you have covered, do reviews daily without fail.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 to 15 minutes of CK Gold and Next Best Step FM daily,** plus Visual Dx for dermatology reps. Use it as the between-block warm-up.',
    },
    {
      num: 3,
      weeks: 'Final stretch, the shelf approach',
      title: 'Consolidate, and stop learning new things.',
      body:
        'The last stretch is about firming up what you know and finding the last gaps, not opening new material. Re-drill the screening calendar and take a practice NBME to calibrate.',
      bullets: [
        '**UWorld** finished, then a second pass on your incorrects and marked questions.',
        '**USPSTF guidelines** re-reviewed; **Divine Intervention** FM episodes on commutes.',
        'Take an **NBME practice Family Medicine shelf** a week out and treat the review as a study session.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**Warm-up and palate cleanser between blocks,** and run the readiness check to see where you actually stand.',
    },
  ],

  faqSection: {
    num: '04',
    eyebrow: 'FM shelf FAQ',
    h2: 'Family Medicine shelf questions students actually ask.',
    intro:
      "Short, honest answers to the queries that come up every rotation. Where your school's rules differ from anything here, your school's rules win.",
  },
  faqs: [
    {
      q: 'What is a good NBME Family Medicine shelf score?',
      a: "A good score is usually defined by your school's honors cutoff, which often sits somewhere around the 70th percentile or higher on the NBME norm table. The exact scaled-score threshold varies by school and by year, so check your clerkship's grading rubric. Passing is typically well below the honors line.",
    },
    {
      q: 'Why is the family medicine shelf so broad?',
      a: 'FM tests outpatient care across every organ system plus prevention, so it draws on your entire medicine base. Breadth is the real challenge more than depth, which is why consistent daily coverage beats cramming one system.',
    },
    {
      q: 'How important are the USPSTF guidelines?',
      a: 'Very. Screening and prevention is the most FM-specific content on the shelf, and questions expect you to know who gets screened, when, and with what. It is worth a dedicated pass and frequent review.',
    },
    {
      q: 'Is UWorld enough for the FM shelf?',
      a: 'UWorld is the single most important resource, but pair it with the USPSTF guidelines and spaced repetition. If you finish early, the free AAFP questions add ambulatory-flavored volume.',
    },
    {
      q: 'When should I take the family medicine shelf?',
      a: 'Take it on your scheduled exam day at the end of the rotation. Do a full NBME practice shelf about a week out to calibrate, and treat reviewing that practice test as a study session.',
    },
  ],

  ctaLine: 'Two free things worth doing before the shelf, and one for later.',
  endPrimaryLabel: 'Check your readiness, free',
  endSecondaryLabel: 'Study family medicine in Step Gunner',
  bridge: {
    label: 'later',
    pre: "Leaning toward Family Medicine as a specialty? When you get there, Rezumab's free ",
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
