// Structured data for the wards pages: Article + FAQPage + BreadcrumbList, built from
// the same content JSON the page renders, so the markup never claims what the page
// does not show.
import { BYLINE, CREDENTIAL } from '../app/chrome';

const BASE = 'https://stepgunner.com';
export const PUBLISHED = '2026-10-21';

type Faq = { q: string; a: string };
type Article = { seo_title: string; meta_description: string; h1: string; faq: Faq[] };

export function articleLd(A: Article, path: string, crumb: string): object[] {
  return [
    {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: A.h1, description: A.meta_description,
      author: { '@type': 'Person', name: BYLINE, description: CREDENTIAL },
      publisher: { '@type': 'Organization', name: 'Rezumab LLC', url: BASE },
      datePublished: PUBLISHED, dateModified: PUBLISHED,
      mainEntityOfPage: `${BASE}${path}`,
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: A.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    crumbsLd([['Home', '/'], ['On the wards', '/wards'], [crumb, path]]),
  ];
}

export function crumbsLd(items: [string, string][]): object {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${BASE}${p}` })),
  };
}
