import type { GetServerSideProps } from 'next';
import { allGuideSlugs } from '../lib/guides';
import { allFormSlugs } from '../lib/forms';

// The site's XML sitemap, generated on request so new clerkship guides appear the
// moment they are registered in lib/guides/index.ts (no build step to remember).
const BASE = 'https://stepgunner.com';

function urlNode(loc: string, changefreq: string, priority: string): string {
  return `  <url><loc>${BASE}${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const staticPages = [
    urlNode('/', 'weekly', '1.0'),
    urlNode('/readiness', 'weekly', '0.9'),
    urlNode('/step-2-score-predictor', 'weekly', '0.9'),
    urlNode('/guides', 'weekly', '0.8'),
    urlNode('/research/nbme-to-step-2', 'weekly', '0.9'),
    urlNode('/readiness/methodology', 'monthly', '0.7'),
    // The Free 120 interfaces are static pages under public/, so they are easy to
    // forget here; scripts/seo_verify.py fails the build if a live route goes
    // missing from this list again.
    urlNode('/free120', 'monthly', '0.9'),
    urlNode('/free120step2021', 'monthly', '0.8'),
    urlNode('/free120step2019', 'monthly', '0.8'),
    urlNode('/support', 'yearly', '0.4'),
    urlNode('/privacy', 'yearly', '0.3'),
    urlNode('/terms', 'yearly', '0.3'),
  ];
  const guidePages = allGuideSlugs().map((slug) => urlNode(`/guides/${slug}`, 'monthly', '0.8'));
  // Per-form conversion pages: the hub owns the broad query, each child owns
  // its own form query, so they do not compete.
  const formPages = allFormSlugs().map((slug) => urlNode(`/step-2-score-predictor/${slug}`, 'monthly', '0.8'));

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [...staticPages, ...guidePages, ...formPages].join('\n') +
    `\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate');
  res.write(xml);
  res.end();
  return { props: {} };
};

// Never renders; the response is written in getServerSideProps.
export default function Sitemap() {
  return null;
}
