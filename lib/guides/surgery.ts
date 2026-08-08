import type { GuideData } from './types';
import { deckCounts, fitStats, modeWord } from './counts';

// Surgery clerkship guide. Same GuideData schema + voice as pediatrics.ts. The `fit`
// deck counts + total are AUTO-COMPUTED from lib/guides/clerkship_counts.json (generated
// in the app repo from live card data), keyed by rotation id "surgery", which sums the
// surgical worlds (general surgery, orthopedics/MSK, ENT, ophthalmology). Numbers update
// as content ships with no edit here. FAQ answers and any medical claim are pending
// Danny's sign-off. No em or en dashes.
const c = deckCounts('surgery');

export const surgery: GuideData = {
  meta: {
    slug: 'surgery',
    clerkship: 'Surgery',
    title: 'How to Study for the Surgery Shelf: Resources and a Week-by-Week Plan | Step Gunner',
    description:
      'How to study for the NBME Surgery shelf: the honest clerkship resource stack (UWorld, Pestana, De Virgilio, Case Files, OnlineMedEd, Anki, Divine Intervention, AMBOSS, Pretest), a week-by-week plan, and answers to the questions students actually search.',
    ogTitle: 'How to Study for the Surgery Shelf: Resources and a Week-by-Week Plan',
    ogDescription:
      'The real MS3 resource stack for the surgery shelf, positioned by role, a week-by-week plan, and a plain-English shelf FAQ. Written by an MS4 who has been through it.',
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

  eyebrow: 'Surgery, Clerkship Guide',
  h1: 'Surgery clerkship: the resource stack, and a free shelf tool.',

  answer: {
    question: 'How do you study for the Surgery shelf?',
    body:
      'To study for the Surgery shelf, remember most of it is medicine in a surgical patient: make **UWorld Step 2 CK** your backbone and read every explanation. Use **Pestana Surgery Notes** for the high-yield decision rules, add **Case Files** or **De Virgilio** for case reasoning, build frameworks with **OnlineMedEd**, and keep **Anki** running. Then take an **NBME practice shelf** before exam day.',
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
    'Nobody clears the Surgery shelf with one resource, and most of it is not even the operating room, it is perioperative medicine and the next best step. You build a small stack and use each piece for the one job it is good at. This is that stack, positioned honestly by role, plus a **week-by-week plan** that weaves it together. Step Gunner is one tool in it, the fast daily recall layer, and we will tell you exactly where it fits and where it does not.',

  stackSection: {
    num: '01',
    eyebrow: 'The resource stack',
    h2: 'What resources do you need for the Surgery clerkship?',
    intro:
      'Each of these earns its slot for one reason. Do not run all of them at full volume, the hours on a surgery service are already long. Pick your qbank, pick your decision-rule text, pick one case source, and keep a spaced-repetition habit running underneath. The rest are supplements you reach for when a weak area shows up.',
  },
  resources: [
    {
      role: 'Qbank backbone',
      name: 'UWorld Step 2 CK',
      use: 'your primary learning engine. Most surgery questions are perioperative and next-best-step reasoning, so a huge share of the qbank is fair game; read every explanation.',
      note: 'Highest yield for both the shelf and Step 2 itself. If you do one thing well, do UWorld well.',
    },
    {
      role: 'Decision-rule text',
      name: 'Pestana Surgery Notes',
      use: 'the high-yield spine for the surgery shelf. It is short, algorithm-first, and maps almost exactly to the trauma, acute abdomen, and postop calls the shelf loves.',
      note: 'The single best surgery-specific read. Finish it once, then re-skim the algorithms the week before.',
    },
    {
      role: 'Case reasoning',
      name: 'De Virgilio Surgery',
      also: 'Case Files Surgery',
      use: 'working the logic case by case. De Virgilio walks the full workup and reasoning; Case Files is the lighter vignette-based alternative if you are short on time.',
      note: 'Pick one as your main case source. De Virgilio is deeper; Case Files is faster.',
    },
    {
      role: 'Video framework',
      name: 'OnlineMedEd',
      use: 'building the mental scaffold before the details. Watch the general surgery and GI videos when a topic is brand new, then reinforce with questions.',
      note: 'Great for the big-picture approach to the acute abdomen and perioperative care. Not a substitute for question volume.',
    },
    {
      role: 'Spaced repetition',
      name: 'AnKing, on Anki',
      use: 'keeping what you already learned from leaking out. Unsuspend the surgery-relevant subdecks as you cover topics, then do your reviews daily.',
      note: 'Long service hours make retention the whole game. Skip reviews and you relearn the same facts three times.',
    },
    {
      role: 'Extra questions',
      name: 'AMBOSS',
      also: 'Pretest Surgery',
      use: 'more reps once you have worked the surgery-relevant questions in UWorld. AMBOSS doubles as a fast ward reference; Pretest is a large surgery-only bank, often more detailed than the shelf.',
      note: 'Supplements, not a second full curriculum. Reach for them if you have the time and want volume.',
    },
  ],

  fitSection: {
    num: '02',
    eyebrow: 'Where Step Gunner fits',
    h2: 'Where does Step Gunner fit in the surgery stack?',
    intro:
      'Step Gunner is not your qbank and it is not your textbook. It is the 5 to 15 minute pattern-recognition tool you open between the big resources: between OR cases, in the workroom, while a UWorld block loads. It drills **retrieval, not recognition**, so the cardinal features stick. Here is the Surgery content, summed straight from the app across general surgery and the surgical subspecialties, no rounding up.',
  },
  fit: {
    intro: '',
    tag: 'Step Gunner, Surgery content',
    cardTitle: 'What is actually in the app for surgery.',
    cardIntro:
      'Surgery pools general surgery with the surgical subspecialties, orthopedics and MSK, ENT, and ophthalmology, across three question decks plus a small image set. These are real counts from the current build, not projections.',
    stats: fitStats('surgery', [
      {
        deck: 'ckGold',
        k: 'CK Gold, Surgery',
        d: 'Diagnosis and next-step questions across the acute abdomen, trauma, perioperative care, ortho, ENT, and ophtho.',
      },
      {
        deck: 'nbs',
        k: 'Next Best Step, Surgery',
        d: 'Management-chain questions: given the presentation, what do you do next, and then what.',
      },
      {
        deck: 'buzzwords',
        k: 'Buzzwords, Surgery',
        d: 'Rapid pattern triggers: read the cardinal clue, name the diagnosis, move on.',
      },
      {
        deck: 'visualDx',
        k: 'Visual Dx, Surgery',
        d: 'Classic surgical and orthopedic images: name the diagnosis from the film or slide.',
      },
    ]),
    total: `**${c.display.total}** Surgery cards across ${modeWord('surgery')} study modes.`,
    coverageHeading: 'CK Gold Surgery coverage, by area',
    coverage: [
      { name: 'Orthopedics and MSK', count: 109 },
      { name: 'General surgery', count: 47 },
      { name: 'Ophthalmology', count: 37 },
      { name: 'ENT', count: 26 },
    ],
    coverageSource:
      'Source: Step Gunner app content database, current build, counted August 2026. Surgery sums general surgery with the surgical subspecialty worlds. Counts grow as content ships, which is why they carry a plus.',
    visualDxHeading: 'Plus classic surgical and orthopedic images in Visual Dx',
    visualDxChips: [
      'Osteosarcoma, Codman triangle',
      'Giant cell tumor, soap-bubble',
      'Osteochondroma',
      'Chondrosarcoma',
    ],
    visualDxNote:
      'The Visual Dx image bank carries a small set of classic bone and soft-tissue images, worth a few reps before the shelf. Most surgical decision-making lives in the text decks above.',
    honest:
      '**The honest part:** this is a supplement, not a spine. It will not replace UWorld, Pestana, Anki, or your reading. It replaces the ten minutes you would otherwise spend scrolling. The core is free to study; the Visual Dx image bank is the paid upgrade.',
    quote: {
      text: 'Gotten me multiple questions on practice tests. Helpful for those not keen on the Anki burden but who like spaced repetition.',
      cite: 'From a 5-star App Store review titled "Solid Step 2 studying addon"',
    },
    ctaLabel: 'Get Step Gunner, free',
    ctaNote: 'No account needed to start. The core surgery decks are free.',
  },

  planSection: {
    num: '03',
    eyebrow: 'The plan',
    h2: 'How do you study for the surgery shelf, week by week?',
    intro:
      'Surgery blocks usually run 4 to 8 weeks, so treat these as phases, not fixed dates. The order matters more than the calendar. Early, you build the perioperative and acute-abdomen frameworks. In the middle, you turn up question volume. In the final stretch, you consolidate and stop learning new things. Step Gunner runs daily underneath all three phases.',
  },
  plan: [
    {
      num: 1,
      weeks: 'Early block, orient',
      title: 'Build the framework, go slow on purpose.',
      body:
        'Do not chase volume yet. You are learning how surgery thinks: preop optimization, the acute abdomen, trauma primary survey, and the next-best-step reflex.',
      bullets: [
        '**Pestana Surgery Notes** front to back, it is short and algorithm-first.',
        '**UWorld** on tutor mode, untimed, 10 to 20 a day, read every explanation.',
        '**OnlineMedEd** general surgery videos for the service you are on that week.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 minutes of Buzzwords Surgery daily.** Build the reflex of clue to diagnosis before the OR days eat your time.',
    },
    {
      num: 2,
      weeks: 'Middle block, build',
      title: 'Turn up the questions, start banking retention.',
      body:
        'This is the volume phase. Move UWorld to timed blocks and start a spaced-repetition habit so the early weeks stop leaking.',
      bullets: [
        '**UWorld**, 20 to 40 a day, timed blocks now, still reading every explanation.',
        '**De Virgilio or Case Files** aimed at whatever your incorrects keep exposing.',
        '**AnKing** surgery-relevant cards: unsuspend what you have covered, do reviews daily.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**10 to 15 minutes of CK Gold and Next Best Step Surgery daily.** Use it as the between-case warm-up.',
    },
    {
      num: 3,
      weeks: 'Final stretch, the shelf approach',
      title: 'Consolidate, and stop learning new things.',
      body:
        'The last stretch is about firming up what you know and finding the last gaps, not opening new material. Take a practice NBME to calibrate.',
      bullets: [
        '**UWorld** finished, then a second pass on your incorrects and marked questions.',
        '**Pestana** algorithms re-skimmed; **Divine Intervention** surgery episodes on commutes.',
        'Take an **NBME practice Surgery shelf** a week out and treat the review as a study session.',
      ],
      slotLabel: 'Step Gunner slot',
      slot: '**Warm-up and palate cleanser between blocks,** and run the readiness check to see where you actually stand.',
    },
  ],

  faqSection: {
    num: '04',
    eyebrow: 'Surgery shelf FAQ',
    h2: 'Surgery shelf questions students actually ask.',
    intro:
      "Short, honest answers to the queries that come up every rotation. Where your school's rules differ from anything here, your school's rules win.",
  },
  faqs: [
    {
      q: 'What is a good NBME Surgery shelf score?',
      a: "A good score is usually defined by your school's honors cutoff, which often sits somewhere around the 70th percentile or higher on the NBME norm table. The exact scaled-score threshold varies by school and by year, so check your clerkship's grading rubric. Passing is typically well below the honors line.",
    },
    {
      q: 'Is Pestana enough for the surgery shelf?',
      a: 'Pestana Surgery Notes is the best high-yield read, but few students pass on it alone. Pair it with UWorld and spaced repetition: Pestana gives you the algorithms, the questions teach you how the shelf asks, and Anki keeps it from leaking. Most of the shelf is perioperative medicine, which UWorld covers best.',
    },
    {
      q: 'Is the surgery shelf mostly medicine?',
      a: 'Largely, yes. A big share tests perioperative management, fluids and electrolytes, the acute abdomen, and next best step in a surgical patient rather than operative technique. That is why a strong medicine base and UWorld carry you further than memorizing procedures.',
    },
    {
      q: 'How many UWorld questions should I do for surgery?',
      a: 'Because surgery pulls from so much of the qbank, aim to work through the surgery-relevant and GI questions at least once during the rotation, then a second pass on your incorrects. Total volume matters less than reading and understanding every explanation.',
    },
    {
      q: 'When should I take the surgery shelf?',
      a: 'Take it on your scheduled exam day at the end of the rotation. Do a full NBME practice shelf about a week out to calibrate, and treat reviewing that practice test as a study session.',
    },
  ],

  ctaLine: 'Two free things worth doing before the shelf, and one for later.',
  endPrimaryLabel: 'Check your readiness, free',
  endSecondaryLabel: 'Study surgery in Step Gunner',
  bridge: {
    label: 'later',
    pre: "Leaning toward a surgical specialty? When you get there, Rezumab's free ",
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
