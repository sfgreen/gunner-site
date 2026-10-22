// The research archive. /research was a 404 while the pieces under it existed,
// so every article had to be hand-linked and crawlers had no archive to walk.
// Entries live in lib/research.ts. Built from the app-look blocks
// (components/app/README.md): the header, then one card per piece, newest first.
// No em or en dashes in the copy (site rule).
import Link from 'next/link';
import { AppShell, ArticleHeader, Hero, Icon, Wrap } from '../../components/app';
import { PageHead, ResearchStyles } from '../../components/app/research';
import { RESEARCH } from '../../lib/research';

const CAMPAIGN = 'research_index';
const H1 = 'Step 2 folklore, checked against data';

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
    <>
      <PageHead metaTitle="Step 2 CK Research: Score Reports, NBME Forms and the Free 120" metaDesc={desc} ogImage="/og/research/index.png" ogAlt={H1}>
        <link rel="canonical" href="https://stepgunner.com/research" />
        <meta property="og:title" content="Step Gunner research" />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </PageHead>

      <AppShell campaign={CAMPAIGN} pageType="research">
        <ResearchStyles />
        <Hero>
          <ArticleHeader
            category="step2"
            crumb={[{ label: 'Research' }]}
            eyebrow="Research"
            title={H1}
            accent="checked against data"
            dek={<>Each piece opens on something students repeat, tests it against data nobody else has, and reports what survives, including the parts that make us look worse. The sample and its bias are stated up front, every time.</>}
            byline={false}
          />
        </Hero>
        <Wrap>
          <ol className="cards rs-arc">
            {RESEARCH.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="card">
                  <p className="lbl"><time dateTime={r.published}>{fmt(r.published)}</time></p>
                  <h2 className="card-t">{r.title}</h2>
                  <p className="card-d">{r.finding}</p>
                  <p className="card-f"><span className="rs-n">{r.sample}</span><Icon name="arrow" sm /></p>
                </Link>
              </li>
            ))}
          </ol>
        </Wrap>
      </AppShell>

      <style jsx global>{`
        .mk .rs-arc { margin-top: 32px; padding-bottom: 64px; }
        .mk .rs-arc .card-t { margin-top: 8px; }
        .mk .rs-arc .card-f .rs-n { font: 500 15px/1.4 var(--f-mono); color: var(--step2); }
        .mk .rs-arc .card-f { flex-wrap: nowrap; align-items: flex-end; }
        .mk .rs-arc .card-f .ic { color: var(--ink-3); }
        .mk .rs-arc .card:hover .card-t { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .2em; }
        @media (min-width: 960px) { .mk .rs-arc { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 760px) { .mk .rs-arc { padding-bottom: 88px; } }
      `}</style>
    </>
  );
}
