import Head from 'next/head';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useRef } from 'react';
import { SPRITE, nav, foot } from '../../lib/app/chrome';
import { mountChrome } from '../../lib/app/chromeClient';
import { sectionOf, Section } from '../../lib/nav';
import { StoreCtx } from './store';

// The frame of every React page in the app look: the page root (.m3vp: the ground,
// the type, focus rings), the icon sprite, the skip link, the nav and the footer.
// The nav and footer are the same HTML strings the wards pages render
// (lib/app/chrome.js, links from lib/nav.ts), so they cannot drift; their behavior
// (dropdowns, phone menu, store_click, the sticky bar, the TOC pill) is
// lib/app/chromeClient.js, mounted on this root. Children are NOT inside a .mk scope:
// blocks bring their own (components/app/blocks.tsx), and page-local legacy styles
// are not caught by .mk rules.

export type AppSeo = {
  title: string;
  description: string;
  /** The page's path, e.g. '/research/nbme-to-step-2': canonical and og:url. */
  path: string;
  /** Absolute URL or a path under public/, 1200x630. */
  ogImage?: string;
  ogType?: 'website' | 'article';
  jsonLd?: object[];
  noindex?: boolean;
};

const ORIGIN = 'https://stepgunner.com';

export default function AppShell({
  campaign, page, pageType = 'page', section, navCta, seo, sticky, children,
}: {
  /** The App Store campaign (ct=) for every store link on the page, nav and footer included. */
  campaign: string;
  /** GA4 `page` on store_click. Defaults to the path. */
  page?: string;
  /** GA4 `page_type` on store_click: guide, research, tool, pathway, doc, hub... */
  pageType?: string;
  /** Which nav section to underline. Defaults from the route (lib/nav.ts sectionOf); null for none. */
  section?: Section | null;
  /** The page's own nav button in place of "Get the app" (same style). A store href keeps the campaign. */
  navCta?: { label: string; href: string };
  /** Title, description, canonical, Open Graph and JSON-LD. Pages that write their own <Head> leave it out. */
  seo?: AppSeo;
  /** <StickyStoreBar/>: rendered after the footer, where position: sticky works for the whole page. */
  sticky?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const path = (router.asPath || '/').split(/[?#]/)[0];
  const ctx = { ct: campaign, page: page || (path === '/' ? 'home' : path.slice(1)), type: pageType };
  const cur = section === undefined ? sectionOf(path) : section || undefined;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    return mountChrome(ref.current);
  }, [router.asPath]);

  const og = seo?.ogImage ? (seo.ogImage.startsWith('http') ? seo.ogImage : `${ORIGIN}${seo.ogImage}`) : null;
  return (
    <StoreCtx.Provider value={ctx}>
      <Head>
        <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta key="theme-light" name="theme-color" content="#f4f8fc" media="(prefers-color-scheme: light)" />
        <meta key="theme-dark" name="theme-color" content="#070a12" media="(prefers-color-scheme: dark)" />
        {seo && <title>{seo.title}</title>}
        {seo && <meta name="description" content={seo.description} />}
        {seo && <link rel="canonical" href={`${ORIGIN}${seo.path}`} />}
        {seo?.noindex && <meta name="robots" content="noindex" />}
        {seo && <meta property="og:title" content={seo.title} />}
        {seo && <meta property="og:description" content={seo.description} />}
        {seo && <meta property="og:type" content={seo.ogType || 'article'} />}
        {seo && <meta property="og:url" content={`${ORIGIN}${seo.path}`} />}
        {og && <meta property="og:image" content={og} />}
        {og && <meta name="twitter:image" content={og} />}
        {seo && <meta name="twitter:card" content="summary_large_image" />}
        {(seo?.jsonLd || []).map((j, i) => (
          <script key={`ld${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j).replace(/</g, '\\u003c') }} />
        ))}
      </Head>
      <div className="m3vp" ref={ref}>
        <div dangerouslySetInnerHTML={{ __html: SPRITE }} />
        <a className="skip" href="#page">Skip to the page</a>
        <div className="mk isl" dangerouslySetInnerHTML={{ __html: nav('app', ctx, { cur, cta: navCta }) }} />
        <main id="page">{children}</main>
        <div className="mk isl" dangerouslySetInnerHTML={{ __html: foot(ctx) }} />
        {sticky}
      </div>
    </StoreCtx.Provider>
  );
}
