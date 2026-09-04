import type { GuideData } from './types';
import { deckCounts, fitStats, modeWord } from './counts';

// OB/GYN clerkship guide. Same GuideData schema + voice as pediatrics.ts. The `fit`
// deck counts + total are AUTO-COMPUTED from lib/guides/clerkship_counts.json (generated
// in the app repo from live card data), keyed by rotation id "obgyn". Numbers update as
// content ships with no edit here. FAQ answers and any medical claim are pending Danny's
// sign-off. No em or en dashes.
const c = deckCounts('obgyn');

export const obgyn: GuideData = {
  meta: {
    slug: 'obgyn',
    clerkship: 'OB/GYN',
    title: 'How to Study for the OB/GYN Shelf: Resources and a Plan',
    description:
      'The honest OB/GYN shelf resource stack (UWorld, uWise, Case Files, Blueprints, OnlineMedEd, Anki), plus a week-by-week plan from an MS4.',
    ogTitle: 'How to Study for the OB/GYN Shelf: Resources and a Week-by-Week Plan',
    ogDescription:
      'The real MS3 resource stack for the OB/GYN shelf, positioned by role, a week-by-week plan, and a plain-English shelf FAQ. Written by an MS4 who has been through it.',
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

  eyebrow: 'OB/GYN, Clerkship Guide',
  h1: 'OB/GYN clerkship: the resource stack, and a free shelf tool.',

  answer: {
    question: 'How do you study for the OB/GYN shelf?',
    body:
      'To study for the OB/GYN shelf, make **UWorld Step 2 CK** your backbone and read every explanation. Add the free **APGO uWise** question bank for OB/GYN-specific reps, read **Case Files** or **Blueprints OB/GYN**, build frameworks with **OnlineMedEd**, and keep a daily spaced-repetition habit running in **Step Gunner**. Then take an **NBME practice shelf** before exam day.',
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
    'OB/GYN is two specialties on one shelf, and it lives on algorithms: prenatal care, labor abnormalities, the abnormal bleeding workup, and the screening calendar. You build a small stack and use each piece for the one job it is good at. This is that stack, positioned honestly by role, plus a **week-by-week plan** that weaves it together. Step Gunner is one tool in it, the fast daily recall layer, and we will tell you exactly where it fits and where it does not.',

  stackSection: {
    num: '01',
    eyebrow: 'The resource stack',
    h2: 'What resources do you need for the OB/GYN clerkship?',
    intro:
      'Each of these earns its slot for one reason. Do not run all of them at full volume. Pick your qbank, add the OB/GYN-specific bank, pick one reading source, and keep a spaced-repetition habit running underneath. The rest are supplements you reach for when a weak area shows up.',
  },
  resources: [
    {
      role: 'Qbank backbone',
      name: 'UWorld Step 2 CK',
      use: 'your primary learning engine. Do the OB/GYN blocks and read every explanation, the explanations are the real curriculum here.',
      note: 'Highest yield for both the shelf and Step 2 itself. If you do one thing well, do UWorld OB/GYN well.',
    },
    {
      role: 'Specialty qbank',
      name: 'APGO uWise',
      use: 'OB/GYN-specific question volume. It is the free bank written by the OB/GYN educators, mapped to the clerkship objectives the shelf follows.',
      note: 'A strong second bank, and free. Great for topics UWorld covers lightly.',
    },
    {
      role: 'Reading',
      name: 'Case Files OB/GYN',
      also: 'Blueprints OB/GYN',
      use: 'your read-along text. Case Files teaches through vignettes that mirror shelf logic; Blueprints is the denser reference for targeted review.',
      note: 'Pick one as your main read. A chapter a night, or aimed at whatever weak area the questions exposed.',
    },
    {
      role: 'Video framework',
      name: 'OnlineMedEd',
      use: 'building the mental scaffold before the details. Watch the OB and GYN videos when a topic is brand new, then reinforce with questions.',
      note: 'Great for the prenatal and labor algorithms. Not a substitute for question volume.',
    },
    {
      role: 'Spaced repetition',
      name: 'Step Gunner',
      also: 'AnKing, on Anki',
      use: 'keeping what you already learned from leaking out. Study the OB/GYN decks as you cover each topic and let the review queue bring them back; if you already run AnKing, keep it.',
      note: 'The habit that makes week 6 not erase week 1. Skip it and you relearn the same facts three times.',
    },
    {
      role: 'Audio and extra questions',
      name: 'Divine Intervention Podcast',
      also: 'AMBOSS',
      use: 'patching weak areas hands-free and adding reps. The Divine OB/GYN episodes are dense, high-yield audio; AMBOSS is a fast ward reference plus a second question bank.',
      note: 'Supplements, not a second full curriculum. Reach for them once you know which topics are shaky.',
    },
  ],

  fitSection: {
    num: '02',
    eyebrow: 'Where Step Gunner fits',
    h2: 'Where does Step Gunner fit in the OB/GYN stack?',
    intro:
      'Step Gunner is not your qbank and it is not your textbook. It is the 5 to 15 minute pattern-recognition tool you open between the big resources: between deliveries, in clinic downtime, while a UWorld block loads. It drills **retrieval, not recognition**, so the cardinal features stick. Here is the OB/GYN content, counted straight from the app, no rounding up.',
  },
  fit: {
    intro: '',
    tag: 'Step Gunner, OB/GYN content',
    cardTitle: 'What is actually in the app for OB/GYN.',
    cardIntro:
      'Three question decks are tagged OB/GYN, each a different study mode, plus a small image set. These are real counts from the current build, not projections.',
    stats: fitStats('obgyn', [
      {
        deck: 'ckGold',
        k: 'CK Gold, OB/GYN',
        d: 'Diagnosis and next-step questions across obstetrics, benign and oncologic gynecology, and the breast.',
      },
      {
        deck: 'nbs',
        k: 'Next Best Step, OB/GYN',
        d: 'Management-chain questions: given the presentation, what do you do next, and then what.',
      },
      {
        deck: 'buzzwords',
        k: 'Buzzwords, OB/GYN',
        d: 'Rapid pattern triggers: read the cardinal clue, name the diagnosis, move on.',
      },
      {
        deck: 'visualDx',
        k: 'Visual Dx, OB/GYN',
        d: 'Classic gynecologic and breast images: name the diagnosis from the slide.',
      },
    ]),
    total: `**${c.display.total}** OB/GYN cards across ${modeWord('obgyn')} study modes.`,
    coverageHeading: 'CK Gold OB/GYN coverage, by subtopic',
    coverage: [
      { name: 'Benign gynecology', count: 57 },
      { name: 'Obstetric complications', count: 37 },
      { name: 'Labor and delivery', count: 35 },
      { name: 'Breast', count: 17 },
      { name: 'Antepartum and prenatal', count: 17 },
      { name: 'Gyn oncology', count: 11 },
      { name: 'Gyn infections and STI', count: 8 },
      { name: 'Contraception and family planning', count: 7 },
    ],
    coverageSource:
      'Source: Step Gunner app content database, current build, counted August 2026. Counts grow as content ships, which is why they carry a plus.',
    visualDxHeading: 'Plus classic GYN and breast images in Visual Dx',
    visualDxChips: [
      'Cervical dysplasia, koilocytes',
      'Endometrial hyperplasia',
      'Serous carcinoma, psammoma bodies',
      'Fibroadenoma',
      'Invasive ductal carcinoma',
      'Paget disease of the breast',
    ],
    visualDxNote:
      'The Visual Dx image bank carries the classic gynecologic and breast slides above, worth a few reps before the shelf.',
    honest:
      '**The honest part:** this is a supplement, not a spine. It will not replace UWorld, uWise or your reading. It replaces the ten minutes you would otherwise spend scrolling. The core is free to study; the Visual Dx image bank is the paid upgrade.',
    quote: {
      text: 'This app makes studying so effortless and fun. Highly recommend.',
      cite: 'From a 5-star App Store review titled "Best Step 2 supplement"',
    },
    ctaLabel: 'Get Step Gunner free, OB/GYN decks included',
    ctaNote: 'No account needed to start. The core OB/GYN decks are free.',
  },

  planSection: {
    num: '03',
    eyebrow: 'The plan',
    h2: 'How do you study for the OB/GYN shelf, week by week?',
    intro:
      'OB/GYN blocks usually run 6 to 8 weeks, so treat these as phases, not fixed dates. The order matters more than the calendar. Early, you build the prenatal and labor frameworks. In the middle, you turn up question volume. In the final stretch, you consolidate and stop learning new things. Step Gunner runs daily underneath all three phases.',
  },
  plan: [
    {
      num: 1,
      weeks: 'Weeks 1 to 2, orient',
      title: 'Build the framework, go slow on purpose.',
      body:
        'Do not chase volume yet. You are learning how OB/GYN thinks: prenatal visit logic, the labor curve, and the abnormal-bleeding workup.',
      bullets: [
        '**OnlineMedEd** OB and GYN videos for the topics on your current service, framework first.',
        '**UWorld** on tutor mode, untimed, 10 to 20 a day, read every explanation.',
        '**Case Files** chapters that match the patients you are seeing that week.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 minutes of Buzzwords OB/GYN daily.** Build the reflex of clue to diagnosis before you drown in algorithms.',
    },
    {
      num: 2,
      weeks: 'Weeks 3 to 5, build',
      title: 'Turn up the questions, start banking retention.',
      body:
        'This is the volume phase. Move UWorld to timed blocks, add uWise for OB/GYN-specific reps, and start a spaced-repetition habit so the early weeks stop leaking.',
      bullets: [
        '**UWorld** OB/GYN, 20 to 40 a day, timed blocks now, still reading every explanation.',
        '**APGO uWise** blocks on the objectives UWorld skimmed.',
        '**AnKing** OB/GYN cards: unsuspend what you have covered, do reviews daily without fail.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 to 15 minutes of CK Gold and Next Best Step OB/GYN daily,** plus Visual Dx for slide reps. Use it as the between-block warm-up.',
    },
    {
      num: 3,
      weeks: 'Weeks 6 to 8, the shelf approach',
      title: 'Consolidate, and stop learning new things.',
      body:
        'The last stretch is about firming up what you know and finding the last gaps, not opening new material. Take a practice NBME to calibrate.',
      bullets: [
        '**UWorld** finished, then a second pass on your incorrects and marked questions.',
        '**Divine Intervention** OB/GYN episodes on commutes to patch weak areas.',
        '**AnKing** reviews stay daily; **uWise or AMBOSS** only if you want extra volume.',
        'Take an **NBME practice OB/GYN shelf** a week out and treat the review as a study session.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**Warm-up and palate cleanser between blocks,** and run the readiness check to see where you actually stand.',
    },
  ],

  faqSection: {
    num: '04',
    eyebrow: 'OB/GYN shelf FAQ',
    h2: 'OB/GYN shelf questions students actually ask.',
    intro:
      "Short, honest answers to the queries that come up every rotation. Where your school's rules differ from anything here, your school's rules win.",
  },
  faqs: [
    {
      q: 'What is a good NBME OB/GYN shelf score?',
      a: "A good score is usually defined by your school's honors cutoff, which often sits somewhere around the 70th percentile or higher on the NBME norm table. The exact scaled-score threshold varies by school and by year, so check your clerkship's grading rubric. Passing is typically well below the honors line.",
    },
    {
      q: 'Is uWise worth doing for the OB/GYN shelf?',
      a: 'Yes, for many students. APGO uWise is free, written by OB/GYN educators, and mapped to the clerkship objectives, so it fills gaps UWorld covers lightly. Use it as a second bank after UWorld rather than your primary one.',
    },
    {
      q: 'How many UWorld OB/GYN questions should I do?',
      a: 'Aim to finish every OB/GYN-tagged question in UWorld Step 2 CK at least once during the rotation, then do a second pass on your incorrects. Total volume matters less than reading and understanding every explanation.',
    },
    {
      q: 'Do I need both Case Files and Blueprints?',
      a: 'No. Pick one as your main read: Case Files if you learn through clinical vignettes, Blueprints if you prefer a denser reference. Use the other only to look up a specific weak topic.',
    },
    {
      q: 'When should I take the OB/GYN shelf?',
      a: 'Take it on your scheduled exam day at the end of the rotation. Do a full NBME practice shelf about a week out to calibrate, and treat reviewing that practice test as a study session.',
    },
  ],

  ctaLine: 'Two free things worth doing before the shelf, and one for later.',
  endPrimaryLabel: 'Get the free OB/GYN deck',
  endSecondaryLabel: 'Check your readiness, free',
  bridge: {
    label: 'later',
    pre: "Leaning toward OB/GYN as a specialty? When you get there, Rezumab's free ",
    linkText: 'Match Probability Calculator',
    linkHref: 'https://rezumab.app',
    post: ' shows your odds by program from NRMP data. No rush, that is a fourth-year problem.',
  },

  sticky: {
    label: 'Free OB/GYN decks. No sign-up.',
    cta: 'Get the app',
  },
  navCta: 'Get the free OB/GYN deck',
};
