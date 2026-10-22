import Head from 'next/head';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import AppShell from './app/AppShell';
import { ArticleHeader, Category } from './app/blocks';
import type { Measure } from './SiteShell';

// The research, tool and reference pages (research/*, percentiles, score by
// specialty, the per-form predictor pages, the ED study guide, partner): the app-look
// chrome, the article header (eyebrow with the category dot, two-tone H1, dek) and a
// long-form body in the app's type. The body still carries each page's own markup;
// the shared vocabulary those pages use (h2/h3 prose, .keystat, .pull, .tw tables,
// figures) is restyled here so it reads as the app look in both themes until the
// page is ported to blocks (components/app/README.md).

/** Research and Step 2 tools take the Step 2 gold, the ED guide the ED gray. */
function categoryOf(path: string): Category {
  if (path.startsWith('/step-2-ck-emergency-medicine')) return 'ed';
  if (path.startsWith('/research') || path.startsWith('/step-2')) return 'step2';
  return 'site';
}

/** The accent half of a title: what follows its last ", " or ": " (as in "ABG
 *  interpretation, step by step"). A title without one stays one color. */
function accentOf(title: string): string | undefined {
  const i = Math.max(title.lastIndexOf(': '), title.lastIndexOf(', '));
  return i > 0 ? title.slice(i + 2) : undefined;
}

export default function LabLayout({
  title, eyebrow, lede, crumb, metaTitle, metaDesc, campaign, children, head, ogImage, accent,
  measure = 'article',
}: {
  title: string;
  eyebrow?: string;
  lede?: ReactNode;
  /** Trail after Home; the entry whose href is this page renders as the current page. */
  crumb?: { href: string; label: string }[];
  metaTitle: string;
  metaDesc: string;
  campaign: string;
  children: ReactNode;
  head?: ReactNode;
  /** A 1200x630 card under public/ (e.g. /og/research/<slug>.png, made by
   *  scripts/og_cards.mjs): og:image and twitter:image, absolute. */
  ogImage?: string;
  /** The part of the title in the category color. Defaults to what follows the last ", " or ": ". */
  accent?: string;
  measure?: Measure;
  /** Accepted for source compatibility with older call sites; measure wins. */
  maxWidth?: number;
}) {
  const path = (useRouter().asPath || '/').split(/[?#]/)[0];
  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        {ogImage && <meta property="og:image" content={`https://stepgunner.com${ogImage}`} />}
        {ogImage && <meta property="og:image:width" content="1200" />}
        {ogImage && <meta property="og:image:height" content="630" />}
        {ogImage && <meta property="og:image:alt" content={title} />}
        {ogImage && <meta name="twitter:image" content={`https://stepgunner.com${ogImage}`} />}
        {head}
      </Head>

      <AppShell campaign={campaign} pageType={path.startsWith('/research') ? 'research' : 'tool'}>
        <div className={`ax-page m-${measure}`}>
          <article className="lab">
            <ArticleHeader
              category={categoryOf(path)}
              eyebrow={eyebrow || 'Step Gunner'}
              title={title}
              accent={accent ?? accentOf(title)}
              dek={lede}
              crumb={crumb?.map((c) => (c.href === path ? { label: c.label } : c))}
              byline={false}
            />
            <div className="ax-col body">{children}</div>
          </article>
        </div>
      </AppShell>

      <style jsx global>{`
        /* ---- the long-form body, in the app's type (the .mk .prs, .h-2 and .h-3 sizes) ---- */
        .lab .body { font-size: 18px; line-height: 1.65; color: var(--ink-2); overflow-wrap: break-word; }
        .lab .body > section { padding-top: 56px; }
        .lab .body > section:first-child { padding-top: 0; }
        .lab .body h2 {
          font: 800 32px/1.1 var(--f-sans); letter-spacing: -0.03em; color: var(--ink);
          margin: 56px 0 16px; scroll-margin-top: calc(var(--nav-h) + 24px);
        }
        .lab .body h3 { font: 700 23px/1.25 var(--f-sans); letter-spacing: -0.015em; color: var(--ink); margin: 32px 0 8px; }
        .lab .body p { margin: 0 0 16px; max-width: 66ch; }
        .lab .body ul, .lab .body ol { margin: 0 0 16px; padding-left: 24px; max-width: 66ch; }
        .lab .body li { margin-bottom: 8px; }
        .lab .body li::marker { color: var(--ink-3); }
        .lab .body strong, .lab .body b { color: var(--ink); font-weight: 600; }
        /* links in running text only: a page's own buttons are links too */
        .lab .body :where(p, li, td, dd, figcaption) a { color: var(--key); text-decoration: underline; text-decoration-color: var(--line-2); text-underline-offset: 0.2em; text-decoration-thickness: 1px; }
        .lab .body :where(p, li, td, dd, figcaption) a:hover { text-decoration-color: currentColor; }
        .lab .body code {
          font-family: var(--f-mono); font-size: 0.86em; color: var(--ink); background: var(--card-2);
          border-radius: 6px; padding: 2px 6px;
        }
        @media (min-width: 760px) { .lab .body h2 { font-size: 46px; letter-spacing: -0.04em; } }

        /* ---- key figures: one white card, a hairline between tiles ---- */
        .lab .body .keystat {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1px; background: var(--line); border-radius: var(--r-lg); overflow: hidden;
          margin: 0 0 24px; box-shadow: 0 1px 2px var(--shadow-a), 0 0 0 1px var(--line);
        }
        .lab .body .keystat > div { background: var(--card); padding: 20px; }
        .lab .body .keystat .k {
          display: block; font: 600 13px/1.3 var(--f-mono); letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--ink-3); margin-bottom: 8px;
        }
        .lab .body .keystat .v {
          display: block; font: 800 38px/1 var(--f-sans); letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums; color: var(--ink);
        }
        .lab .body .keystat .v.up { color: var(--ok); }
        .lab .body .keystat .v.flat { color: var(--ink-3); }
        .lab .body .keystat .v.warn { color: var(--step2); }
        .lab .body .keystat .cap { display: block; font-size: 15px; line-height: 1.45; color: var(--ink-2); margin-top: 8px; }

        /* ---- the one loud claim: the green callout (gold and red variants) ---- */
        .lab .body .pull {
          margin: 24px 0; padding: 16px 20px; border-radius: var(--r-md); background: var(--wards-tint);
          color: var(--ink); font-size: 19px; line-height: 1.5; font-weight: 500;
        }
        .lab .body .pull b { font-weight: 800; }
        .lab .body .pull.warn { background: var(--step2-tint); }
        .lab .body .pull.red { background: var(--bad-tint); box-shadow: inset 4px 0 0 var(--bad); }
        .lab .body .pull p { margin: 0; max-width: none; font-size: inherit; }

        /* ---- tables scroll inside their card, never the page ---- */
        .lab .body .tw {
          overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 0 24px;
          border-radius: var(--r-md); background: var(--card); box-shadow: inset 0 0 0 1px var(--line);
        }
        .lab .body table { border-collapse: collapse; width: 100%; font-size: 16px; line-height: 1.5; }
        .lab .body th {
          text-align: left; font: 600 13px/1.3 var(--f-mono); letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--ink-3); padding: 12px 16px; background: var(--card-2); white-space: nowrap;
        }
        .lab .body td { padding: 12px 16px; border-top: 1px solid var(--line); vertical-align: top; }
        .lab .body td.r, .lab .body th.r, .lab .body th.n { text-align: right; }
        .lab .body td.n { font-variant-numeric: tabular-nums; white-space: nowrap; }

        /* ---- figures drawn for a white page sit on paper in both themes ---- */
        .lab .body figure img { background: var(--paper); border-radius: var(--r-sm); padding: 8px; }

        @media (max-width: 599px) {
          .lab .body .keystat .v { font-size: 32px; }
          .lab .body .pull { font-size: 18px; }
          .lab .body th, .lab .body td { padding: 12px; }
        }
      `}</style>
    </>
  );
}
