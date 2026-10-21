import Head from 'next/head';
import { useEffect, useRef } from 'react';
import { SPRITE } from '../lib/wards/render';
import { mount } from '../lib/wards/client';

// The frame for the app-look pages (home, /wards and the wards articles): head tags,
// the icon sprite, and the server-rendered HTML from lib/wards/render. The styles live
// in styles/wards.css, scoped under .m3vp so the Score Report pages are untouched.
// client.js attaches its listeners once the HTML is in the DOM and removes them on
// unmount; React never re-renders the HTML, so the DOM it edits stays its own.
export type WardsHead = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  jsonLd?: object[];
};

export default function WardsPage({ head, html, page, mountOpts }: {
  head: WardsHead;
  html: string;
  page: string;
  mountOpts?: Parameters<typeof mount>[1];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    return mount(ref.current, mountOpts);
    // The HTML is static per page, so mount once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const url = `https://stepgunner.com${head.path}`;
  const og = head.ogImage || 'https://stepgunner.com/og/research-nbme-step2.png';
  return (
    <>
      <Head>
        <title>{head.title}</title>
        <meta name="description" content={head.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#f4f8fc" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#070a12" media="(prefers-color-scheme: dark)" />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={head.title} />
        <meta property="og:description" content={head.description} />
        <meta property="og:type" content={head.path === '/' ? 'website' : 'article'} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={og} />
        <meta name="twitter:card" content="summary_large_image" />
        {(head.jsonLd || []).map((j, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j).replace(/</g, '\\u003c') }} />
        ))}
      </Head>
      <div className="m3vp">
        <div dangerouslySetInnerHTML={{ __html: SPRITE }} />
        <a className="skip" href="#page">Skip to the page</a>
        <div className="mk" data-page={page} ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </>
  );
}
