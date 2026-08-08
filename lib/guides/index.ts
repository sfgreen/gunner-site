import type { GuideData, ComingSoonGuide } from './types';
import { pediatrics } from './pediatrics';
import { internalMedicine } from './internal-medicine';
import { surgery } from './surgery';
import { obgyn } from './obgyn';
import { psychiatry } from './psychiatry';
import { neurology } from './neurology';
import { familyMedicine } from './family-medicine';
import { emergencyMedicine } from './emergency-medicine';
import { foundations } from './foundations';

// Registry of live clerkship guides, keyed by slug. Add a rotation by writing
// lib/guides/<slug>.ts and adding one line here; the route (pages/guides/[slug]),
// the hub (pages/guides), and the sitemap all read from this map.
export const guides: Record<string, GuideData> = {
  pediatrics,
  'internal-medicine': internalMedicine,
  surgery,
  obgyn,
  psychiatry,
  neurology,
  'family-medicine': familyMedicine,
  'emergency-medicine': emergencyMedicine,
  foundations,
};

// Announced but not yet written. Shown as disabled cards on the hub so the
// section reads as a growing library, not a single orphan page. These do NOT
// generate routes or sitemap entries until promoted into `guides` above. All
// nine confirmed clerkship blocks are now live.
export const comingSoon: ComingSoonGuide[] = [];

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
