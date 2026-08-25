// Per-form conversion pages under /step-2-score-predictor/<slug>.
//
// Structure mirrors the incumbents (a page per form is what students actually
// search: "nbme 15 score conversion", "uwsa 2 accurate"), but the numbers come
// from the same calibrated model the app and /readiness use, not from a linear
// formula. Nothing here restates a printed score as a lower number: decision
// 0013 is that a printed score is never DISPLAYED reduced, the translation
// lives in the math. The `note` copy says which way a form prints and why, and
// the table shows printed -> projected range.
//
// Every claim below is either a model constant (lib/readiness.ts FORM_OFFSETS)
// or a statement about how the correction is applied. No invented difficulty
// rankings: NBME equates 10 to 16 onto a common scale, so there is nothing
// honest to say about one being "harder" in scale terms.

export type FormPage = {
  slug: string;
  form: string;            // must match a member of FORMS in lib/readiness.ts
  title: string;           // <= 65 chars
  description: string;     // 70..165 chars
  h1: string;
  lede: string;
  /** How this form prints, and what the converter does about it. */
  note: string;
  /** Answered inline; also becomes this page's FAQPage structured data. */
  faq: { q: string; a: string }[];
};

const EQUATED_NOTE =
  'NBME equates forms 10 through 16 onto a common score scale, so this one carries no '
  + 'correction: the printed score enters the projection exactly as printed. What changes '
  + 'the projection is how recently you took it, not which of these forms it was.';

const equatedFaq = (n: number): { q: string; a: string }[] => [
  {
    q: `Does NBME ${n} convert directly to a Step 2 CK score?`,
    a: `Not one to one. A practice form and the real exam are different tests taken on different days, `
      + `so the honest output is a range, not a single number. The projection shrinks your form toward `
      + `the population mean and adds the measured practice to real gain, then reports a band around it.`,
  },
  {
    q: `Is NBME ${n} accurate?`,
    a: `It is vendor-equated onto the same scale as the other modern forms, so it needs no correction here. `
      + `Accuracy in the sense that matters, how close the projection lands to a real score, was tested blind `
      + `on 32 score reports the model had never seen: average miss 4.1 points.`,
  },
  {
    q: 'How much does the date I took it matter?',
    a: 'A lot, and more than most converters admit. Forms are weighted by recency with a roughly 21 day '
      + 'half-life, and the width of the projected range depends on how far out your exam is. A form from '
      + 'three months ago tells you much less than one from last week.',
  },
];

export const FORM_PAGES: FormPage[] = [
  {
    slug: 'nbme-9',
    form: 'NBME 9',
    title: 'NBME 9 Score Conversion for Step 2 CK',
    description:
      'NBME 9 prints about 5 to 6 points low, so the conversion credits it back. See the projected Step 2 CK range for any printed NBME 9 score.',
    h1: 'NBME 9 to Step 2 CK',
    lede: 'The oldest form still in circulation, and the one most likely to be read wrong.',
    note:
      'NBME 9 prints roughly 5.5 points low against the common scale, so the converter credits '
      + 'those points back before projecting. Your printed number does not change on screen. It is '
      + 'an old form and it fades quickly under recency weighting, but it is not worthless: a '
      + 'recent 9 still carries real signal.',
    faq: [
      {
        q: 'Is NBME 9 still worth taking?',
        a: 'It is worth counting if you already took it. As a form to sit down and take now, prefer a newer '
          + 'one: 9 is old, it fades fast under recency weighting, and the correction it needs is a sign it '
          + 'sits slightly off the modern scale.',
      },
      {
        q: 'Why does NBME 9 print low?',
        a: 'It was equated in an older era against a different cohort. Fit on 160 students and 1,043 dated '
          + 'forms with person and timing controls, form 9 reads about 5.5 points below where the same '
          + 'student lands on the modern scale, so the model credits that back.',
      },
      ...equatedFaq(9).slice(2),
    ],
  },
  {
    slug: 'nbme-10',
    form: 'NBME 10',
    title: 'NBME 10 Score Conversion for Step 2 CK',
    description:
      'Convert a printed NBME 10 score into a projected Step 2 CK range, from a model fit on 258 real score reports and tested blind on 32 more.',
    h1: 'NBME 10 to Step 2 CK',
    lede: 'Vendor-equated, so it enters the projection exactly as printed.',
    note: EQUATED_NOTE,
    faq: equatedFaq(10),
  },
  {
    slug: 'nbme-11',
    form: 'NBME 11',
    title: 'NBME 11 Score Conversion for Step 2 CK',
    description:
      'Convert a printed NBME 11 score into a projected Step 2 CK range, with the honest band rather than a single number pulled from a formula.',
    h1: 'NBME 11 to Step 2 CK',
    lede: 'Vendor-equated, so it enters the projection exactly as printed.',
    note: EQUATED_NOTE,
    faq: equatedFaq(11),
  },
  {
    slug: 'nbme-12',
    form: 'NBME 12',
    title: 'NBME 12 Score Conversion for Step 2 CK',
    description:
      'Convert a printed NBME 12 score into a projected Step 2 CK range, and see how much the date you took it changes the answer.',
    h1: 'NBME 12 to Step 2 CK',
    lede: 'Vendor-equated, so it enters the projection exactly as printed.',
    note: EQUATED_NOTE,
    faq: equatedFaq(12),
  },
  {
    slug: 'nbme-13',
    form: 'NBME 13',
    title: 'NBME 13 Score Conversion for Step 2 CK',
    description:
      'Convert a printed NBME 13 score into a projected Step 2 CK range, from a calibrated model that publishes how often it is right.',
    h1: 'NBME 13 to Step 2 CK',
    lede: 'Vendor-equated, so it enters the projection exactly as printed.',
    note: EQUATED_NOTE,
    faq: equatedFaq(13),
  },
  {
    slug: 'nbme-14',
    form: 'NBME 14',
    title: 'NBME 14 Score Conversion for Step 2 CK',
    description:
      'Convert a printed NBME 14 score into a projected Step 2 CK range, with a band that widens honestly the further out your exam is.',
    h1: 'NBME 14 to Step 2 CK',
    lede: 'Vendor-equated, so it enters the projection exactly as printed.',
    note: EQUATED_NOTE,
    faq: equatedFaq(14),
  },
  {
    slug: 'nbme-15',
    form: 'NBME 15',
    title: 'NBME 15 Score Conversion for Step 2 CK',
    description:
      'Convert a printed NBME 15 score into a projected Step 2 CK range. No correction is applied: form 15 is equated onto the common scale.',
    h1: 'NBME 15 to Step 2 CK',
    lede: 'Vendor-equated, so it enters the projection exactly as printed.',
    note: EQUATED_NOTE,
    faq: equatedFaq(15),
  },
  {
    slug: 'nbme-16',
    form: 'NBME 16',
    title: 'NBME 16 Score Conversion for Step 2 CK',
    description:
      'NBME 16 prints higher than the older forms, and it is counted at face value. See the projected Step 2 CK range for any printed 16.',
    h1: 'NBME 16 to Step 2 CK',
    lede: 'The newest form, and one of the strongest single signals you can get.',
    note:
      'NBME 16 prints a few points higher than the older forms for the same student, which makes '
      + 'people suspicious of it. The data does not support discounting it: students who print high '
      + 'on 16 really do score high on the exam. It is counted at face value, with no correction.',
    faq: [
      {
        q: 'Is NBME 16 inflated?',
        a: 'It prints higher than older forms, but that is not the same as inflated. High printers on 16 go on '
          + 'to score high, so counting it at face value predicts better than discounting it would. No '
          + 'correction is applied.',
      },
      ...equatedFaq(16).slice(1),
    ],
  },
  {
    slug: 'uwsa-1',
    form: 'UWSA 1',
    title: 'UWSA 1 Score Conversion for Step 2 CK',
    description:
      'UWSA 1 sits roughly on the NBME scale, so it converts without a correction. See the projected Step 2 CK range for any printed UWSA 1.',
    h1: 'UWSA 1 to Step 2 CK',
    lede: 'The UWorld self-assessment that sits closest to the NBME scale.',
    note:
      'UWSA 1 reads roughly on scale against the NBMEs, so no correction is applied. That makes it '
      + 'more directly comparable to an NBME than UWSA 2 is, and it is the UWorld form least likely '
      + 'to mislead you in either direction.',
    faq: [
      {
        q: 'Is UWSA 1 accurate for Step 2 CK?',
        a: 'It sits roughly on the NBME scale, so it enters the projection without a correction. Like any '
          + 'single form it is one noisy read: the projection reports a range, and the range narrows as your '
          + 'exam approaches and as you add more recent forms.',
      },
      {
        q: 'UWSA 1 or UWSA 2, which should I trust?',
        a: 'UWSA 1 sits on scale; UWSA 2 prints about 4.8 points hot and is translated down before blending. '
          + 'Neither is wrong, they are just on slightly different scales, and the converter handles the '
          + 'difference so you do not have to.',
      },
      ...equatedFaq(1).slice(2),
    ],
  },
  {
    slug: 'uwsa-2',
    form: 'UWSA 2',
    title: 'UWSA 2 Score Conversion: Does It Print High?',
    description:
      'UWSA 2 prints about 4.8 points hot against the NBME scale, so it is translated down before projecting. See the honest Step 2 CK range.',
    h1: 'UWSA 2 to Step 2 CK',
    lede: 'The form most often accused of running hot, and the accusation is roughly right.',
    note:
      'UWSA 2 prints about 4.8 points hot against the NBME scale, so the converter translates it '
      + 'down before projecting. This is the single most common reason a student is disappointed on '
      + 'exam day: they anchored on a UWSA 2 taken at face value. Your printed number is never '
      + 'changed on screen, only inside the math.',
    faq: [
      {
        q: 'Does UWSA 2 inflate your score?',
        a: 'Relative to the NBME scale, yes, by about 4.8 points on average. That is small enough that it is '
          + 'not a reason to distrust the form, and large enough that taking it at face value will '
          + 'systematically flatter you. The converter subtracts it inside the math.',
      },
      {
        q: 'Should I still take UWSA 2?',
        a: 'Yes. A form that needs a known, measured correction is more useful than one whose bias you cannot '
          + 'quantify. Take it, and let the conversion put it on the common scale.',
      },
      ...equatedFaq(2).slice(2),
    ],
  },
  {
    slug: 'uwsa-3',
    form: 'UWSA 3',
    title: 'UWSA 3 Score Conversion for Step 2 CK',
    description:
      'UWSA 3 reads a few points low on thinner data, so the correction is shrunk toward zero. See the projected Step 2 CK range and the caveat.',
    h1: 'UWSA 3 to Step 2 CK',
    lede: 'The newest UWorld form, and the one with the least data behind its correction.',
    note:
      'UWSA 3 reads about 6.3 points low against the NBME scale, so those points are credited back. '
      + 'The honest caveat: that estimate rests on thinner data than the others, so it is deliberately '
      + 'shrunk toward zero rather than applied at full strength. Treat a UWSA 3 projection as '
      + 'slightly less certain than an NBME one.',
    faq: [
      {
        q: 'Does UWSA 3 run low?',
        a: 'It reads about 6.3 points below the NBME scale, so the converter credits that back. The estimate '
          + 'comes from fewer observations than the other corrections, so it is shrunk toward zero on '
          + 'purpose rather than trusted at full strength.',
      },
      {
        q: 'Why is the UWSA 3 correction less certain?',
        a: 'Fewer students have posted a dated UWSA 3 alongside a real score. Less data means a noisier '
          + 'estimate, and applying a noisy correction at full strength would add error rather than remove '
          + 'it. Shrinking it is the conservative choice.',
      },
      ...equatedFaq(3).slice(2),
    ],
  },
];

export const formPageBySlug = (slug: string): FormPage | null =>
  FORM_PAGES.find((f) => f.slug === slug) ?? null;

export const allFormSlugs = (): string[] => FORM_PAGES.map((f) => f.slug);
