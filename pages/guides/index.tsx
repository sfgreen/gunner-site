import Head from 'next/head';
import { AppShell, ArticleHeader, Hero, Icon } from '../../components/app';
import type { GetStaticProps } from 'next';
import { comingSoon, liveGuideCards } from '../../lib/guides';
import type { ComingSoonGuide } from '../../lib/guides/types';
import { publishedEntries } from '../../lib/pathways/data';

type LiveCard = { slug: string; clerkship: string; teaser: string };

// The /guides hub: a growing library of clerkship shelf guides. Live guides link
// to their page; announced ones show as disabled cards so the section reads as a
// library in progress, not a single orphan page.
export default function GuidesHub({ live, soon, pathways }: { live: LiveCard[]; soon: ComingSoonGuide[]; pathways: number }) {
  const canonical = 'https://stepgunner.com/guides';

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Clerkship shelf study guides',
    url: canonical,
    description:
      'Honest, resource-by-role study guides for the NBME shelf exams, with a week-by-week plan and a plain-English FAQ for each rotation.',
    isPartOf: { '@type': 'WebSite', name: 'Step Gunner', url: 'https://stepgunner.com' },
    hasPart: live.map((g) => ({
      '@type': 'Article',
      name: `${g.clerkship} clerkship guide`,
      url: `https://stepgunner.com/guides/${g.slug}`,
    })),
  };

  return (
    <>
      <Head>
        <title>Clerkship Shelf Study Guides | Step Gunner</title>
        <meta
          name="description"
          content="Study guides for all nine NBME shelf exams: the real resource stack, a week-by-week plan, and a plain-English FAQ, written by a med student who took them."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Clerkship Shelf Study Guides" />
        <meta property="og:description" content="The real resource stack, a week-by-week plan, and a shelf FAQ for each clerkship rotation." />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content="https://stepgunner.com/api/og" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />

      <AppShell campaign="guides">
        <Hero>
          <ArticleHeader
            category="shelf"
            byline={false}
            crumb={[{ label: 'Clerkship guides' }]}
            eyebrow="Clerkship guides"
            title="Shelf study guides, one rotation at a time."
            accent="one rotation at a time."
            dek={<>
              The <b>honest</b> resource stack for each clerkship, positioned by role, with a week-by-week
              plan and a plain-English shelf FAQ. Written by a med student who has been through it, updated
              as the rotations turn over.
            </>}
          />
        </Hero>

        <div className="mk isl">
          <div className="wrap gi-wrap">
            <ul className="cards gi-cards">
              {live.map((g) => (
                <li key={g.slug}>
                  <a className="card gi-card" href={`/guides/${g.slug}`}>
                    <span className="card-k"><span className="lbl">Guide</span></span>
                    <h2 className="card-t">{g.clerkship}</h2>
                    <p className="card-d">{g.teaser}</p>
                    <span className="card-f"><span /><span className="go">Read the guide<Icon name="arrow" sm /></span></span>
                  </a>
                </li>
              ))}
              <li>
                <a className="card gi-card gi-ed" href="/step-2-ck-emergency-medicine">
                  <span className="card-k"><span className="lbl">Study guide</span></span>
                  <h2 className="card-t">The ED next best step</h2>
                  <p className="card-d">26 emergency presentations: the first move, the fork that decides the next step, and the trap the exam sets, from audited pathways.</p>
                  <span className="card-f"><span /><span className="go">Read the guide<Icon name="arrow" sm /></span></span>
                </a>
              </li>
              {pathways > 0 && (
                <li>
                  <a className="card gi-card gi-ed" href="/pathways">
                    <span className="card-k"><span className="lbl">ED pathways</span></span>
                    <h2 className="card-t">ED pathways, fork by fork</h2>
                    <p className="card-d">{pathways} emergency presentations as branching algorithms: the first move, each fork and its threshold, and the orders with their doses, each quoted from its source.</p>
                    <span className="card-f"><span /><span className="go">Open the pathways<Icon name="arrow" sm /></span></span>
                  </a>
                </li>
              )}
              {soon.map((g) => (
                <li key={g.slug}>
                  <div className="card soon gi-card" aria-disabled="true">
                    <span className="card-k"><span className="tag soon">Coming soon</span></span>
                    <h2 className="card-t">{g.clerkship}</h2>
                    <p className="card-d">{g.teaser}</p>
                    <span className="card-f"><span /><span>In the works</span></span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </AppShell>

      <style jsx global>{`
        .mk .gi-wrap { padding-bottom: 88px; }
        .mk .gi-cards { margin-top: 32px; }
        .mk .gi-cards > li { display: flex; min-width: 0; }
        .mk .gi-card { width: 100%; }
        .mk .gi-card .card-k .lbl { background: var(--shelf-tint); color: var(--shelf); }
        .mk .gi-ed .card-k .lbl { background: var(--ed-tint); color: var(--ed); }
        .mk .gi-card .card-t { font-size: 23px; }
        .mk .gi-card .go .ic { transition: transform var(--d-micro) var(--ease); }
        .mk a.gi-card:hover .go .ic { transform: translateX(2px); }
        .mk .gi-card.soon .card-f { color: var(--ink-3); }
      `}</style>
    </>
  );
}

// The pathways card counts what this build publishes (lib/pathways/data's gate),
// so it never links an empty hub.
export const getStaticProps: GetStaticProps = async () => ({
  props: { live: liveGuideCards(), soon: comingSoon, pathways: publishedEntries().length },
});
