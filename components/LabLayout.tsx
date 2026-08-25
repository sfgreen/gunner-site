import Head from 'next/head';
import { ReactNode } from 'react';
import SiteShell, { Measure } from './SiteShell';

// The light "Score Report" register for tool and article pages.
//
// Chrome now comes from SiteShell, so the nav is identical to every other page
// instead of this file's own 720px one. What is left here is the page opening
// (eyebrow, title, lede) and the shared prose styling that makes an article
// read as designed rather than as a wall of default text.
//
// The typographic system, since it is the thing that was missing: a display
// size that is genuinely large and tightly tracked, section headings anchored
// by a mono eyebrow rather than sitting alone, prose held near 68 characters,
// and exactly one shadowed object per page. Every previous page shadowed all
// of its cards, which flattens hierarchy: if everything lifts, nothing does.

export default function LabLayout({
  title, eyebrow, lede, crumb, metaTitle, metaDesc, campaign, children, head,
  measure = 'article',
}: {
  title: string;
  eyebrow?: string;
  lede?: ReactNode;
  crumb?: { href: string; label: string }[];
  metaTitle: string;
  metaDesc: string;
  campaign: string;
  children: ReactNode;
  head?: ReactNode;
  measure?: Measure;
  /** Accepted for source compatibility with older call sites; measure wins. */
  maxWidth?: number;
}) {
  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#faf9f6" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        {head}
      </Head>

      <div className="tint">
        <SiteShell campaign={campaign} measure={measure} crumb={crumb}>
          <article className="lab">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1>{title}</h1>
            {lede && <p className="lede">{lede}</p>}
            <div className="body">{children}</div>
          </article>
        </SiteShell>
      </div>

      <style jsx global>{`
        /* Page wash. Very low amplitude on purpose: it should register as warmth
           at the top of the page, not as a gradient someone applied. */
        .tint {
          background:
            radial-gradient(88% 52% at 50% -10%, var(--green-soft), transparent 62%),
            radial-gradient(54% 20% at 50% 0%, var(--gold-soft), transparent 64%),
            var(--bg);
        }

        .lab .eyebrow {
          display: inline-block; font-family: var(--mono); font-size: 11px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold-ink);
          border: 1px solid var(--gold-soft); background: var(--gold-soft);
          border-radius: 999px; padding: 5px 13px; margin-bottom: 18px;
        }
        .lab h1 {
          font-size: clamp(32px, 5.4vw, 47px); font-weight: 800; letter-spacing: -0.028em;
          line-height: 1.06; margin: 0 0 14px;
        }
        .lab .lede {
          color: var(--ink-dim); font-size: clamp(17px, 2.2vw, 19.5px); line-height: 1.55;
          margin: 0 0 34px; max-width: 60ch;
        }

        /* ---- shared prose rhythm for everything a page drops in ---- */
        .lab .body > section { padding-top: 42px; }
        .lab .body > section:first-child { padding-top: 0; }

        .lab .body h2 {
          font-size: clamp(22px, 3vw, 28px); font-weight: 700; letter-spacing: -0.018em;
          line-height: 1.2; margin: 0 0 10px;
        }
        .lab .body h3 {
          font-size: 19px; font-weight: 700; letter-spacing: -0.01em; margin: 30px 0 8px;
        }
        .lab .body p { margin: 0 0 15px; max-width: 68ch; }
        .lab .body ul, .lab .body ol { margin: 0 0 15px; padding-left: 22px; max-width: 68ch; }
        .lab .body li { margin-bottom: 8px; }
        .lab .body strong { font-weight: 700; }
        .lab .body a { color: var(--blue); text-decoration: none; border-bottom: 1px solid var(--blue-soft); }
        .lab .body a:hover { border-bottom-color: var(--blue); text-decoration: none; }
        .lab .body code {
          font-family: var(--mono); font-size: 0.86em; background: var(--bg-3);
          border: 1px solid var(--hair); border-radius: 5px; padding: 1.5px 5px;
        }

        /* Tables: one house style, and they scroll rather than push the page. */
        .lab .body .tw {
          overflow-x: auto; -webkit-overflow-scrolling: touch;
          border: 1px solid var(--hair-strong); border-radius: var(--radius-sm);
          margin: 0 0 22px; background: var(--panel);
        }
        .lab .body table { border-collapse: collapse; width: 100%; font-size: 15px; }
        .lab .body th {
          text-align: left; font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--ink-faint); font-weight: 700;
          padding: 12px 15px; background: var(--bg-3);
          border-bottom: 1px solid var(--hair-strong); white-space: nowrap;
        }
        .lab .body td {
          padding: 11px 15px; border-bottom: 1px solid var(--hair); vertical-align: top;
        }
        .lab .body tr:last-child td { border-bottom: none; }
        .lab .body td.r, .lab .body th.r { text-align: right; }
        .lab .body td.n { font-variant-numeric: tabular-nums; white-space: nowrap; }

        @media (max-width: 560px) {
          .lab .body > section { padding-top: 34px; }
          .lab .body table { font-size: 14px; }
          .lab .body th, .lab .body td { padding: 10px 12px; }
        }
      `}</style>
    </>
  );
}
