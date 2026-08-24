import type { GuideData } from './types';
import { deckCounts, fitStats, modeWord } from './counts';

// Emergency Medicine clerkship guide. Same GuideData schema + voice as pediatrics.ts. The
// `fit` deck counts + total are AUTO-COMPUTED from lib/guides/clerkship_counts.json
// (generated in the app repo from live card data), keyed by rotation id
// "emergency_medicine" (underscore id, hyphen slug). EM carries the large radiology and
// ECG image bank. Numbers update as content ships with no edit here. FAQ answers and any
// medical claim are pending Danny's sign-off. No em or en dashes.
const c = deckCounts('emergency_medicine');

export const emergencyMedicine: GuideData = {
  meta: {
    slug: 'emergency-medicine',
    clerkship: 'Emergency Medicine',
    title: 'How to Study for the Emergency Medicine Shelf: A Study Plan',
    description:
      'The honest EM shelf resource stack (UWorld, Case Files, OnlineMedEd, Anki, WikEM, Divine Intervention), plus a week-by-week plan from an MS4.',
    ogTitle: 'How to Study for the Emergency Medicine Shelf: Resources and a Plan',
    ogDescription:
      'The real MS3 resource stack for the emergency medicine subject exam, positioned by role, a week-by-week plan, and a plain-English FAQ. Written by an MS4 who has been through it.',
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

  eyebrow: 'Emergency Medicine, Clerkship Guide',
  h1: 'Emergency Medicine clerkship: the resource stack, and a free shelf tool.',

  answer: {
    question: 'How do you study for the Emergency Medicine shelf?',
    body:
      'To study for the Emergency Medicine subject exam, think in terms of the sickest-first differential and the immediate next step: make **UWorld Step 2 CK** your backbone and read every explanation. Read **Case Files Emergency Medicine**, build frameworks with **OnlineMedEd**, drill toxicology antidotes and reading films fast, and keep **Anki** running. Then take an **NBME practice exam** before test day.',
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
    'Emergency Medicine rewards one instinct: rule out the killer first, then act. It is undifferentiated complaints, fast triage, toxicology, and reading a film or an ECG under pressure. You build a small stack and use each piece for the one job it is good at. This is that stack, positioned honestly by role, plus a **week-by-week plan** that weaves it together. Step Gunner is one tool in it, the fast daily recall layer, and we will tell you exactly where it fits and where it does not.',

  stackSection: {
    num: '01',
    eyebrow: 'The resource stack',
    h2: 'What resources do you need for the Emergency Medicine clerkship?',
    intro:
      'Each of these earns its slot for one reason. EM draws on your whole medicine base plus a few EM-specific skills, toxicology and rapid imaging. Pick your qbank, pick one reading source, and keep a spaced-repetition habit running underneath. The rest are supplements.',
  },
  resources: [
    {
      role: 'Qbank backbone',
      name: 'UWorld Step 2 CK',
      use: 'your primary learning engine. EM pulls from across the qbank with an emphasis on acute presentations and next best step; read every explanation.',
      note: 'Highest yield for both the exam and Step 2 itself. If you do one thing well, do UWorld well.',
    },
    {
      role: 'Reading',
      name: 'Case Files Emergency Medicine',
      use: 'your read-along text. It teaches the sickest-first differential and the immediate action through vignettes that mirror the exam.',
      note: 'A single concise read is usually enough for EM; use it for the acute presentations you see least on service.',
    },
    {
      role: 'Video framework',
      name: 'OnlineMedEd',
      use: 'building the mental scaffold before the details. Watch the acute-care and relevant system videos when a topic is new, then reinforce with questions.',
      note: 'Great for the resuscitation and shock frameworks. Not a substitute for question volume.',
    },
    {
      role: 'Rapid reference',
      name: 'WikEM',
      use: 'a fast ward reference on shift. When you see a presentation you do not know, look up the workup and disposition in the moment, then reinforce it later.',
      note: 'Ward tool more than a study text, but the on-shift lookups stick because they are tied to a real patient.',
    },
    {
      role: 'Spaced repetition',
      name: 'AnKing, on Anki',
      use: 'keeping antidotes, ECG patterns, and acute management steps from leaking out. Unsuspend the relevant subdecks as you cover topics, then review daily.',
      note: 'Shift work is irregular, so a steady review habit matters more than long sit-down sessions.',
    },
    {
      role: 'Audio and extra questions',
      name: 'Divine Intervention Podcast',
      also: 'AMBOSS',
      use: 'patching weak areas hands-free and adding reps. The Divine emergency and rapid-review episodes are dense audio; AMBOSS is a fast reference plus a second bank.',
      note: 'Supplements, not a second full curriculum. Reach for them once you know which topics are shaky.',
    },
  ],

  fitSection: {
    num: '02',
    eyebrow: 'Where Step Gunner fits',
    h2: 'Where does Step Gunner fit in the emergency medicine stack?',
    intro:
      'Step Gunner is not your qbank and it is not your textbook. It is the 5 to 15 minute pattern-recognition tool you open between the big resources: between patients on shift, in downtime, while a UWorld block loads. It drills **retrieval, not recognition**, so the antidotes, ECGs, and cardinal features stick. Here is the Emergency Medicine content, counted straight from the app, no rounding up.',
  },
  fit: {
    intro: '',
    tag: 'Step Gunner, Emergency Medicine content',
    cardTitle: 'What is actually in the app for emergency medicine.',
    cardIntro:
      'Three question decks are tagged Emergency Medicine, each a different study mode, plus a large radiology and ECG image bank, the biggest Visual Dx set of any rotation. These are real counts from the current build, not projections.',
    stats: fitStats('emergency_medicine', [
      {
        deck: 'ckGold',
        k: 'CK Gold, EM',
        d: 'Diagnosis and next-step questions across trauma, shock, toxicology, and acute presentations.',
      },
      {
        deck: 'nbs',
        k: 'Next Best Step, EM',
        d: 'Management-chain questions: given the acute presentation, what do you do next, and then what.',
      },
      {
        deck: 'buzzwords',
        k: 'Buzzwords, Antidotes',
        d: 'Rapid pattern triggers, including the toxin-to-antidote reflex EM tests hard.',
      },
      {
        deck: 'visualDx',
        k: 'Visual Dx, Imaging and ECG',
        d: 'A large bank of radiographs and ECGs: read the film or tracing under pressure and name the diagnosis.',
      },
    ]),
    total: `**${c.display.total}** Emergency Medicine cards across ${modeWord('emergency_medicine')} study modes.`,
    coverageHeading: 'CK Gold EM coverage, by subtopic',
    coverage: [
      { name: 'Toxicology and overdose', count: 33 },
      { name: 'Environmental', count: 15 },
      { name: 'Trauma and shock', count: 8 },
      { name: 'Cardiac and airway emergencies', count: 7 },
    ],
    coverageSource:
      'Source: Step Gunner app content database, current build, counted August 2026. The text decks are focused; the imaging strength is in Visual Dx. Counts grow as content ships, which is why they carry a plus.',
    visualDxHeading: 'Plus the largest radiology and ECG image bank in Visual Dx',
    visualDxChips: [
      'Tension pneumothorax, CXR',
      'Free air under the diaphragm',
      'STEMI, ECG',
      'Complete heart block, ECG',
      'Boot-shaped heart',
      'Classic fracture patterns',
    ],
    visualDxNote:
      'Reading a film or ECG fast is an EM skill in itself, and this is the largest image set in the app. Worth steady reps before the exam.',
    honest:
      '**The honest part:** this is a supplement, not a spine. It will not replace UWorld, your reading, or Anki. It replaces the ten minutes you would otherwise spend scrolling. The core is free to study; the Visual Dx imaging bank is the paid upgrade, and it is EM\'s strongest surface.',
    quote: {
      text: 'This app makes studying so effortless and fun. Highly recommend.',
      cite: 'From a 5-star App Store review titled "Best Step 2 supplement"',
    },
    ctaLabel: 'Get Step Gunner, free',
    ctaNote: 'No account needed to start. The core emergency medicine decks are free.',
  },

  planSection: {
    num: '03',
    eyebrow: 'The plan',
    h2: 'How do you study for the emergency medicine exam, week by week?',
    intro:
      'EM rotations are often 4 weeks and the exam format varies by school, so compress these phases to fit. The order matters more than the calendar. Early, you build the sickest-first approach. In the middle, you turn up question volume. In the final stretch, you consolidate. Step Gunner runs daily underneath all three phases.',
  },
  plan: [
    {
      num: 1,
      weeks: 'Early block, orient',
      title: 'Build the sickest-first reflex, go slow on purpose.',
      body:
        'Do not chase volume yet. You are learning how EM thinks: rule out the killer first, stabilize, then work up the undifferentiated complaint.',
      bullets: [
        '**OnlineMedEd** acute-care videos and **Case Files EM** for the presentations you see on shift.',
        '**UWorld** on tutor mode, untimed, 10 to 20 a day, read every explanation.',
        '**WikEM** lookups on shift for anything you do not know in the moment.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 minutes of Antidotes Buzzwords and Visual Dx imaging daily.** Build the toxin-to-antidote and read-the-film reflexes.',
    },
    {
      num: 2,
      weeks: 'Middle block, build',
      title: 'Turn up the questions, start banking retention.',
      body:
        'This is the volume phase. Move UWorld to timed blocks and start a spaced-repetition habit so the antidotes and ECG patterns stop leaking.',
      bullets: [
        '**UWorld**, 20 to 40 a day, timed blocks now, still reading every explanation.',
        '**AnKing** cards for antidotes, ECGs, and acute management; do reviews daily.',
        '**Case Files EM** aimed at whatever your incorrects keep exposing.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 to 15 minutes of CK Gold and Next Best Step EM daily,** plus heavy Visual Dx for imaging and ECG reps. Use it as the between-shift warm-up.',
    },
    {
      num: 3,
      weeks: 'Final stretch, the exam approach',
      title: 'Consolidate, and stop learning new things.',
      body:
        'The last stretch is about firming up what you know and finding the last gaps, not opening new material. Take a practice NBME to calibrate.',
      bullets: [
        '**UWorld** finished, then a second pass on your incorrects and marked questions.',
        '**Divine Intervention** emergency and rapid-review episodes on commutes to patch weak areas.',
        'Take an **NBME practice Emergency Medicine exam** a week out and treat the review as a study session.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**Warm-up and palate cleanser between blocks,** and run the readiness check to see where you actually stand.',
    },
  ],

  faqSection: {
    num: '04',
    eyebrow: 'EM exam FAQ',
    h2: 'Emergency Medicine exam questions students actually ask.',
    intro:
      "Short, honest answers to the queries that come up every rotation. Where your school's rules differ from anything here, your school's rules win.",
  },
  faqs: [
    {
      q: 'Does emergency medicine have an NBME shelf?',
      a: 'Many schools use the NBME Emergency Medicine Advanced Clinical Science subject exam, but not all do; some grade EM by a school-written exam or by clinical evaluation instead. Check your clerkship\'s rules for the exact format and passing standard.',
    },
    {
      q: 'What is a good EM exam score?',
      a: "A good score is usually defined by your school's honors cutoff. If your school uses the NBME EM exam, that often sits somewhere around the 70th percentile or higher on the norm table, but the exact threshold varies by school and year.",
    },
    {
      q: 'How is the EM exam different from other shelves?',
      a: 'It leans on undifferentiated presentations, immediate next steps, toxicology, and reading imaging or ECGs quickly. A strong medicine base carries most of it, with a few EM-specific skills layered on top.',
    },
    {
      q: 'How much do I need to read for EM?',
      a: 'One concise source such as Case Files Emergency Medicine is usually enough, paired with UWorld and spaced repetition. WikEM is better as an on-shift reference than a study text.',
    },
    {
      q: 'When should I take the EM exam?',
      a: 'Take it on your scheduled exam day at the end of the rotation. If your school uses the NBME exam, do a full practice exam about a week out to calibrate, and treat reviewing it as a study session.',
    },
  ],

  ctaLine: 'Two free things worth doing before the exam, and one for later.',
  endPrimaryLabel: 'Check your readiness, free',
  endSecondaryLabel: 'Study emergency medicine in Step Gunner',
  bridge: {
    label: 'later',
    pre: "Leaning toward Emergency Medicine as a specialty? When you get there, Rezumab's free ",
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
