import type { GuideData, ComingSoonGuide } from './types';
import { pediatrics } from './pediatrics';
import { internalMedicine } from './internal-medicine';

// Registry of live clerkship guides, keyed by slug. Add a rotation by writing
// lib/guides/<slug>.ts and adding one line here; the route (pages/guides/[slug]),
// the hub (pages/guides), and the sitemap all read from this map.
export const guides: Record<string, GuideData> = {
  pediatrics,
  'internal-medicine': internalMedicine,
};

// Announced but not yet written. Shown as disabled cards on the hub so the
// section reads as a growing library, not a single orphan page. These do NOT
// generate routes or sitemap entries until promoted into `guides` above.
export const comingSoon: ComingSoonGuide[] = [
  { slug: 'surgery', clerkship: 'Surgery', teaser: 'Pre-op, intra-op, and the shelf that hides medicine inside it.' },
  { slug: 'obgyn', clerkship: 'OB/GYN', teaser: 'Two specialties, one shelf, a lot of algorithms.' },
  { slug: 'psychiatry', clerkship: 'Psychiatry', teaser: 'High-yield, pattern-heavy, and very learnable.' },
  { slug: 'family-medicine', clerkship: 'Family Medicine', teaser: 'Everything at once: screen, prevent, manage.' },
  { slug: 'neurology', clerkship: 'Neurology', teaser: 'Localize first, then treat.' },
];

export function getGuide(slug: string): GuideData | null {
  return guides[slug] ?? null;
}

export function allGuideSlugs(): string[] {
  return Object.keys(guides);
}

/** Live guides as light hub cards, in registry order. */
export function liveGuideCards(): { slug: string; clerkship: string; teaser: string }[] {
  return Object.values(guides).map((g) => ({
    slug: g.meta.slug,
    clerkship: g.meta.clerkship,
    teaser: g.answer.question,
  }));
}
