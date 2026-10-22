// The research archive. /research was a 404 while the pieces under it existed,
// so every article had to be hand-linked and crawlers had no archive to walk.
// Entries live in lib/research.ts. No em or en dashes in the copy (site rule).
import Link from 'next/link';
import LabLayout from '../../components/LabLayout';
import { RESEARCH } from '../../lib/research';

const CAMPAIGN = 'research_index';

function fmt(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

export default function ResearchIndex() {
  const desc = 'Step 2 CK research from real score reports and app data: what predicts your score, what a Free 120 is worth, and when people actually sit each NBME.';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Step Gunner research',
    description: desc,
    url: 'https://stepgunner.com/research',
    hasPart: RESEARCH.map((r) => ({
      '@type': 'ScholarlyArticle',
      headline: r.title,
      url: `https://stepgunner.com${r.href}`,
      datePublished: r.published,
    })),
  };

  return (
    <LabLayout
      eyebrow="Research"
      title="Step 2 folklore, checked against data"
      lede={<>Each piece opens on something students repeat, tests it against data nobody else has, and reports what survives, including the parts that make us look worse. The sample and its bias are stated up front, every time.</>}
      crumb={[{ href: '/research', label: 'Research' }]}
      metaTitle="Step 2 CK Research: Score Reports, NBME Forms and the Free 120"
      metaDesc={desc}
      campaign={CAMPAIGN}
      head={<>
        <link rel="canonical" href="https://stepgunner.com/research" />
        <meta property="og:title" content="Step Gunner research" />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </>}
    >
      <ol className="archive">
        {RESEARCH.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="entry">
              <span className="meta">
                <time dateTime={r.published}>{fmt(r.published)}</time>
                <span className="n">{r.sample}</span>
              </span>
              <span className="t">{r.title}</span>
              <span className="f">{r.finding}</span>
            </Link>
          </li>
        ))}
      </ol>

      <style jsx>{`
        .archive { list-style: none; padding: 0; margin: 0; max-width: none; border-top: 1px solid var(--hair-strong); }
        .archive li { margin: 0; border-bottom: 1px solid var(--hair-strong); }
        .archive :global(a.entry) {
          display: grid; gap: 6px; padding: 22px 2px; border-bottom: none; color: var(--ink);
        }
        .archive :global(a.entry:hover .t) { color: var(--blue); }
        .meta {
          display: flex; flex-wrap: wrap; gap: 6px 14px; font-family: var(--mono); font-size: 11px;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint);
        }
        .meta .n { color: var(--gold-ink); }
        .t { font-size: clamp(20px, 2.6vw, 24px); font-weight: 700; letter-spacing: -0.015em; line-height: 1.25; text-wrap: balance; }
        .f { color: var(--ink-dim); font-size: 16px; line-height: 1.55; max-width: 64ch; }
      `}</style>
    </LabLayout>
  );
}
