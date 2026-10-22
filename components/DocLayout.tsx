import Head from 'next/head';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import AppShell from './app/AppShell';
import { ArticleHeader } from './app/blocks';

// The legal and support pages (privacy, terms, support): the app-look chrome, a plain
// header (no byline, no category color) and the document in the app's type. The
// pages pass only their content; the classes they use (.highlight-box,
// .contact-box, .faq-item) are styled here.
export default function DocLayout({
  title, subtitle, metaTitle, metaDesc, children,
}: {
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDesc: string;
  children: ReactNode;
}) {
  // Self-referential canonical off the route, so every page through this layout
  // gets one without each having to remember. Query strings are dropped: a
  // legal page is the same document however it was linked.
  const path = useRouter().pathname;
  const canonical = `https://stepgunner.com${path}`;

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonical} />
      </Head>

      <AppShell campaign="doc" pageType="doc" section={null}>
        <div className="ax-page m-article">
          <ArticleHeader category="site" eyebrow={path === '/support' ? 'Support' : 'Legal'} title={title} dek={subtitle} byline={false} />
          <div className="ax-col doc">{children}</div>
        </div>
      </AppShell>

      <style jsx global>{`
        .doc { font-size: 18px; line-height: 1.65; color: var(--ink-2); overflow-wrap: break-word; }
        .doc h2 { font: 800 28px/1.15 var(--f-sans); letter-spacing: -0.025em; color: var(--ink); margin: 48px 0 12px; }
        .doc h2:first-child { margin-top: 0; }
        .doc h3 { font: 700 19px/1.3 var(--f-sans); letter-spacing: -0.01em; color: var(--ink); margin: 0 0 8px; }
        .doc p { margin: 0 0 16px; max-width: 66ch; }
        .doc ul { margin: 0 0 16px; padding-left: 24px; max-width: 66ch; }
        .doc li { margin-bottom: 8px; }
        .doc li::marker { color: var(--wards); }
        .doc strong { color: var(--ink); font-weight: 600; }
        .doc a { color: var(--key); text-decoration: underline; text-decoration-color: var(--line-2); text-underline-offset: 0.2em; }
        .doc a:hover { text-decoration-color: currentColor; }
        /* the green callout */
        .doc .highlight-box { margin-bottom: 40px; padding: 16px 20px; border-radius: var(--r-md); background: var(--wards-tint); }
        .doc .highlight-box strong { display: block; margin-bottom: 8px; color: var(--ink); }
        .doc .highlight-box p { margin: 0; color: var(--ink-2); }
        /* a white card */
        .doc .contact-box {
          margin: 40px 0; padding: 24px; border-radius: var(--r-lg); background: var(--card);
          box-shadow: 0 1px 2px var(--shadow-a), inset 0 0 0 1px var(--line);
        }
        .doc .contact-box:first-child { margin-top: 0; }
        .doc .contact-box h2 { margin-top: 0; }
        .doc .contact-box p:last-child { margin-bottom: 0; }
        .doc .faq-item { padding: 16px 0; box-shadow: inset 0 1px 0 var(--line); }
        .doc .faq-item p { margin: 0; }
        @media (min-width: 760px) { .doc h2 { font-size: 32px; } }
      `}</style>
    </>
  );
}
