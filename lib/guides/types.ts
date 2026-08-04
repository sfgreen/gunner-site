// Typed data model for a single clerkship study guide. Every /guides/[slug] page
// is rendered by GuideLayout from one of these objects, so adding a new rotation
// is adding one data entry (lib/guides/<slug>.ts) and registering it in index.ts.
//
// Rich strings use **double asterisks** for emphasis; GuideLayout's <Rich> helper
// turns them into <strong>. This keeps the data JSON-serializable (required by
// getStaticProps) while preserving the mock's bolding. No em or en dashes anywhere.

export interface GuideMeta {
  /** URL slug, also the App Store campaign suffix (ct=guides_<slug>). */
  slug: string;
  /** Display name of the rotation, e.g. "Pediatrics". */
  clerkship: string;
  /** <title> text. */
  title: string;
  /** <meta name="description">. */
  description: string;
  ogTitle: string;
  ogDescription: string;
  /** Absolute OG/Twitter image URL. */
  ogImage: string;
  /** ISO date (YYYY-MM-DD) for Article.datePublished. */
  datePublished: string;
  /** ISO date (YYYY-MM-DD) for Article.dateModified. */
  dateModified: string;
}

export interface GuideAuthor {
  name: string;
  /** Avatar monogram, e.g. "DV". */
  initials: string;
  /** Short credential, e.g. "MS4, Texas A&M College of Medicine". */
  credential: string;
  /** Full byline meta line under the name. */
  credentialLine: string;
  /** Pill label next to the name, e.g. "Reviewed". */
  reviewedLabel: string;
}

export interface AnswerBlock {
  /** The label above the extractable answer (the primary query, phrased as a question). */
  question: string;
  /** The standalone, quotable answer. Rich. */
  body: string;
}

export interface TrustStrip {
  /** App Store rating out of 5, e.g. 4.8. Drives the star fill. */
  rating: number;
  ratingLabel: string;
  studentsCount: string;
  studentsLabel: string;
  quote: string;
  quoteCite: string;
}

export interface ResourceItem {
  /** Role tag, e.g. "Qbank backbone". */
  role: string;
  /** Primary resource name. */
  name: string;
  /** Optional second resource, joined by "and" (e.g. Case Files and BRS). */
  also?: string;
  /** Plain text rendered after a bold "Use it for:" label. */
  use: string;
  note: string;
}

export interface FitStat {
  /** Big number, e.g. "145+". Auto-filled from lib/guides/clerkship_counts.json via
   *  fitStats() in ./counts; do not hand-type it. */
  n: string;
  /** Label under the number. */
  k: string;
  /** One-line description. */
  d: string;
}

export interface CoverageRow {
  name: string;
  count: number;
}

export interface StepGunnerFit {
  /** Section-intro paragraph before the branded card. Rich. */
  intro: string;
  tag: string;
  cardTitle: string;
  cardIntro: string;
  stats: FitStat[];
  /** Total line under the stats, e.g. "**350+** Pediatrics-tagged cards ...". The
   *  number comes from clerkship_counts.json display.total; do not hand-type it. Rich. */
  total: string;
  coverageHeading: string;
  coverage: CoverageRow[];
  coverageSource: string;
  visualDxHeading: string;
  visualDxChips: string[];
  visualDxNote: string;
  /** The honest-limitation callout. Rich. */
  honest: string;
  quote: { text: string; cite: string };
  /** Label for the mid-page CTA button. */
  ctaLabel: string;
  ctaNote: string;
}

export interface PlanPhase {
  num: number;
  /** e.g. "Weeks 1 to 2, orient". */
  weeks: string;
  title: string;
  body: string;
  /** Bullet list. Each is rich. */
  bullets: string[];
  slotLabel: string;
  /** The Step Gunner slot line. Rich. */
  slot: string;
}

export interface Faq {
  q: string;
  /** Answer. Rich. Also emitted verbatim (markers stripped) into FAQPage schema. */
  a: string;
}

export interface Bridge {
  label: string;
  pre: string;
  linkText: string;
  linkHref: string;
  post: string;
}

export interface SectionHead {
  /** Two-digit index, e.g. "01". */
  num: string;
  eyebrow: string;
  h2: string;
  /** Intro paragraph. Rich. */
  intro: string;
}

export interface GuideData {
  meta: GuideMeta;
  author: GuideAuthor;
  /** Gold eyebrow above the H1, e.g. "Pediatrics, Clerkship Guide". */
  eyebrow: string;
  h1: string;
  answer: AnswerBlock;
  trust: TrustStrip;
  /** Lede paragraph under the trust strip. Rich. */
  lede: string;

  stackSection: SectionHead;
  resources: ResourceItem[];

  fitSection: SectionHead;
  fit: StepGunnerFit;

  planSection: SectionHead;
  plan: PlanPhase[];

  faqSection: SectionHead;
  faqs: Faq[];

  /** Closing CTA line. */
  ctaLine: string;
  /** End CTA button to /readiness. */
  endPrimaryLabel: string;
  /** End CTA button to the App Store. */
  endSecondaryLabel: string;
  bridge: Bridge;

  /** Sticky mobile bar copy. */
  sticky: { label: string; cta: string };
  /** Nav CTA label (links to /readiness). */
  navCta: string;
}

/** Lightweight hub entry for guides that are announced but not yet written. */
export interface ComingSoonGuide {
  slug: string;
  clerkship: string;
  teaser: string;
}
