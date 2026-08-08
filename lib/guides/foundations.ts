import type { GuideData } from './types';
import { deckCounts, fitStats, modeWord } from './counts';

// Foundations (Ethics & Biostats) guide. Same GuideData schema + voice as pediatrics.ts,
// but reframed: this is NOT a clerkship shelf, it is the quantitative + professionalism
// block that shows up on EVERY shelf and on Step 2 CK. The `fit` deck counts + total are
// AUTO-COMPUTED from lib/guides/clerkship_counts.json (generated in the app repo from live
// card data), keyed by rotation id "foundations". No Visual Dx set, so visualDxChips is
// empty and GuideLayout omits that section. FAQ answers pending Danny's sign-off. No em or
// en dashes.
const c = deckCounts('foundations');

export const foundations: GuideData = {
  meta: {
    slug: 'foundations',
    clerkship: 'Ethics & Biostats',
    title: 'How to Study Biostatistics and Ethics for Step 2 CK: Resources and a Plan | Step Gunner',
    description:
      'How to study the biostatistics and medical ethics that show up on every NBME shelf and on Step 2 CK: the honest resource stack (UWorld, Randy Neil, First Aid, Divine Intervention, Anki), a simple plan, and answers to the questions students actually search.',
    ogTitle: 'How to Study Biostatistics and Ethics for Step 2 CK',
    ogDescription:
      'The cross-cutting block that appears on every shelf: biostatistics and ethics, positioned by resource, a running plan, and a plain-English FAQ. Written by an MS4 who has been through it.',
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

  eyebrow: 'Ethics and Biostats, Foundations',
  h1: 'Biostatistics and ethics: the block on every shelf, and a free tool.',

  answer: {
    question: 'How do you study biostatistics and ethics for Step 2 CK?',
    body:
      'Biostatistics and ethics are not a shelf of their own, they show up on every NBME shelf and on Step 2 CK, so study them a little all year rather than cramming. Learn the core **biostats formulas** (sensitivity, specificity, predictive values, relative and absolute risk, number needed to treat) until they are automatic, learn the **ethics principles** and the standard responses to consent, capacity, and confidentiality, then drill both with **UWorld** and daily recall.',
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
    'Biostatistics and ethics are the quietest points on the exam: a handful of questions on every shelf and a reliable block on Step 2 CK, all of it very learnable. The trap is treating them as an afterthought and losing easy points. You build a small stack and drill them a little all year. This is that stack, positioned honestly by role, plus a simple running plan. Step Gunner is one tool in it, the fast daily recall layer, and we will tell you exactly where it fits and where it does not.',

  stackSection: {
    num: '01',
    eyebrow: 'The resource stack',
    h2: 'What resources do you need for biostatistics and ethics?',
    intro:
      'This block is small, so the stack is small. Pick one biostats explainer, learn the ethics principles once, and drill both with questions and spaced repetition. There is no reason to buy a dedicated textbook for it.',
  },
  resources: [
    {
      role: 'Qbank backbone',
      name: 'UWorld Step 2 CK',
      use: 'your primary source for both. The biostats and ethics questions are scattered through the bank, and the explanations teach the exact reasoning the exam wants.',
      note: 'Highest yield here too. Flag every biostats and ethics question so you can re-drill them as a set before the exam.',
    },
    {
      role: 'Biostats explainer',
      name: 'Randy Neil biostatistics videos',
      also: 'First Aid biostatistics section',
      use: 'making the formulas click. Randy Neil walks the 2x2 table and the core calculations clearly; the First Aid section is a concise reference to review from.',
      note: 'Watch or read once, then practice, biostats is a doing skill, not a reading one.',
    },
    {
      role: 'Ethics framework',
      name: 'Ethics principles and standard responses',
      use: 'the four principles and the model answers for consent, capacity, confidentiality, minors, and end-of-life. Most ethics questions reward the patient-centered, least-restrictive response.',
      note: 'Learn the pattern of the correct answer once and most questions become recognizable.',
    },
    {
      role: 'Audio review',
      name: 'Divine Intervention Podcast',
      use: 'patching both hands-free. The Divine ethics and biostatistics episodes are well known for turning these into easy points.',
      note: 'Great on a commute in the week or two before any shelf or before Step 2.',
    },
    {
      role: 'Spaced repetition',
      name: 'AnKing, on Anki',
      use: 'keeping the formulas and ethics patterns sharp between the exams that test them. A small, steady deck is all you need.',
      note: 'Because these points appear all year, a light daily habit beats a cram the night before.',
    },
  ],

  fitSection: {
    num: '02',
    eyebrow: 'Where Step Gunner fits',
    h2: 'Where does Step Gunner fit for biostats and ethics?',
    intro:
      'Step Gunner is not your qbank and it is not your textbook. It is the 5 to 15 minute pattern-recognition tool you open between the big resources. For this block it is a strong fit: the formulas and ethics patterns are exactly the kind of clean recall daily drilling locks in. It drills **retrieval, not recognition**. Here is the Ethics and Biostats content, counted straight from the app, no rounding up.',
  },
  fit: {
    intro: '',
    tag: 'Step Gunner, Ethics and Biostats content',
    cardTitle: 'What is actually in the app for this block.',
    cardIntro:
      'Two question decks cover the block, the CK Gold reasoning deck and the Next Best Step management deck. These are real counts from the current build, not projections.',
    stats: fitStats('foundations', [
      {
        deck: 'ckGold',
        k: 'CK Gold, Ethics and Biostats',
        d: 'Reasoning questions across the biostats calculations and the core ethics scenarios.',
      },
      {
        deck: 'nbs',
        k: 'Next Best Step, Ethics and Biostats',
        d: 'What is the right next action: the consent, capacity, and communication call the exam expects.',
      },
    ]),
    total: `**${c.display.total}** Ethics and Biostats cards across ${modeWord('foundations')} study modes.`,
    coverageHeading: 'CK Gold coverage, by area',
    coverage: [
      { name: 'Biostatistics', count: 169 },
      { name: 'Ethics and communication', count: 123 },
    ],
    coverageSource:
      'Source: Step Gunner app content database, current build, counted August 2026. Counts grow as content ships, which is why they carry a plus.',
    visualDxHeading: '',
    visualDxChips: [],
    visualDxNote: '',
    honest:
      '**The honest part:** this is a supplement, not a spine. It will not replace UWorld or a clear biostats explainer. But of everything on the exam, this block is where clean daily recall pays off most, because the points are formula- and pattern-based. The core is free to study.',
    quote: {
      text: 'Gotten me multiple questions on practice tests. Helpful for those not keen on the Anki burden but who like spaced repetition.',
      cite: 'From a 5-star App Store review titled "Solid Step 2 studying addon"',
    },
    ctaLabel: 'Get Step Gunner, free',
    ctaNote: 'No account needed to start. The core Ethics and Biostats decks are free.',
  },

  planSection: {
    num: '03',
    eyebrow: 'The plan',
    h2: 'How do you fit biostats and ethics into the year?',
    intro:
      'Do not save this block for a Step 2 cram. Because a few questions appear on every shelf, a little all year turns it into free points. Here is the running approach, three light passes rather than three phases of a single rotation.',
  },
  plan: [
    {
      num: 1,
      weeks: 'Early third year, learn it once',
      title: 'Make the formulas automatic.',
      body:
        'Before your first shelf, spend a short block getting the core biostats calculations and the ethics principles down cold. It is a small amount of material.',
      bullets: [
        '**Randy Neil or First Aid** for the 2x2 table and the core formulas, once.',
        'The **four ethics principles** and the standard responses for consent, capacity, and confidentiality.',
        '**UWorld** biostats and ethics questions on tutor mode, flagged as a set to revisit.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 minutes of Ethics and Biostats daily for a week.** Drill the formulas until the calculation is automatic.',
    },
    {
      num: 2,
      weeks: 'Across every clerkship, keep it warm',
      title: 'A light habit so it never leaks.',
      body:
        'You do not need a big time block, just enough to keep the formulas and ethics patterns from fading between the exams that test them.',
      bullets: [
        'A **small AnKing** biostats and ethics deck reviewed a few minutes a day.',
        'Re-drill your **flagged UWorld** biostats and ethics set before each shelf.',
        '**Divine Intervention** biostats and ethics episodes on a commute before an exam.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**A short Ethics and Biostats round before each shelf.** It doubles as a warm-up and a leak check.',
    },
    {
      num: 3,
      weeks: 'Before Step 2 CK, consolidate',
      title: 'Turn it into guaranteed points.',
      body:
        'Step 2 has a reliable biostats and ethics block, and it is very scorable. In your dedicated period, make sure this is not where you lose easy questions.',
      bullets: [
        'Re-work your **flagged UWorld** set until the calculations are instant.',
        'Re-read the **ethics response patterns**; most correct answers are patient-centered and least-restrictive.',
        'Take the **NBME practice exams** and treat every biostats and ethics miss as a fixable point.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**Daily Ethics and Biostats reps in dedicated,** and run the readiness check to see where you actually stand.',
    },
  ],

  faqSection: {
    num: '04',
    eyebrow: 'Ethics and biostats FAQ',
    h2: 'Biostats and ethics questions students actually ask.',
    intro:
      "Short, honest answers to the queries that come up every year. Where your school's rules differ from anything here, your school's rules win.",
  },
  faqs: [
    {
      q: 'Is there a biostatistics or ethics shelf?',
      a: 'No. There is no standalone NBME shelf for either. They appear as a handful of questions on every clerkship shelf and as a reliable block on Step 2 CK, which is why it pays to study them a little all year rather than as a single rotation.',
    },
    {
      q: 'How much biostatistics is on Step 2 CK?',
      a: 'Enough to matter, but it is very learnable. Expect the core calculations, sensitivity and specificity, predictive values, relative and absolute risk, and number needed to treat, plus study design. Getting these automatic turns them into easy points.',
    },
    {
      q: 'What is the trick to Step 2 ethics questions?',
      a: 'Most correct answers are patient-centered, honest, and least-restrictive: address the patient directly, respect capacity and confidentiality, and avoid answers that are paternalistic or that defer to family over a capable patient. Learn that pattern once and most questions become recognizable.',
    },
    {
      q: 'Do I need a textbook for biostats?',
      a: 'No. A single explainer such as Randy Neil or the First Aid biostatistics section, plus UWorld questions and a little spaced repetition, is enough. Buying a dedicated book for this small block is usually overkill.',
    },
    {
      q: 'When should I study biostats and ethics?',
      a: 'A little all year. Learn the material once early in third year, keep it warm with a light daily habit and a quick re-drill before each shelf, then consolidate during your Step 2 dedicated period.',
    },
  ],

  ctaLine: 'Two free things worth doing before your next exam, and one for later.',
  endPrimaryLabel: 'Check your readiness, free',
  endSecondaryLabel: 'Study Ethics and Biostats in Step Gunner',
  bridge: {
    label: 'later',
    pre: "Thinking ahead to the Match? When you get there, Rezumab's free ",
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
