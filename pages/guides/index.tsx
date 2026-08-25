import Head from 'next/head';
import SiteShell from '../../components/SiteShell';
import type { GetStaticProps } from 'next';
import { comingSoon, liveGuideCards } from '../../lib/guides';
import type { ComingSoonGuide } from '../../lib/guides/types';

type LiveCard = { slug: string; clerkship: string; teaser: string };

// The /guides hub: a growing library of clerkship shelf guides. Live guides link
// to their page; announced ones show as disabled cards so the section reads as a
// library in progress, not a single orphan page.
export default function GuidesHub({ live, soon }: { live: LiveCard[]; soon: ComingSoonGuide[] }) {
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#faf9f6" />
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

      <style jsx global>{`
`}</style>

      <SiteShell campaign={'guides'} measure="wide">
        <div className="wrap">
          <div className="crumb"><a href="/">Home</a> / Clerkship guides</div>
          <span className="eyebrow">Clerkship guides</span>
          <h1>Shelf study guides, one rotation at a time.</h1>
          <p className="lede">
            The <b>honest</b> resource stack for each clerkship, positioned by role, with a week-by-week
            plan and a plain-English shelf FAQ. Written by a med student who has been through it, updated
            as the rotations turn over.
          </p>

          <div className="grid">
            {live.map((g) => (
              <a key={g.slug} className="card live" href={`/guides/${g.slug}`}>
                <span className="ctag">Guide</span>
                <h2>{g.clerkship}</h2>
                <p>{g.teaser}</p>
                <span className="go">Read the guide &rarr;</span>
              </a>
            ))}
            {soon.map((g) => (
              <div key={g.slug} className="card soon" aria-disabled="true">
                <span className="ctag">Coming soon</span>
                <h2>{g.clerkship}</h2>
                <p>{g.teaser}</p>
                <span className="go">In the works</span>
              </div>
            ))}
          </div>
        </div>
      </SiteShell>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => ({
  props: { live: liveGuideCards(), soon: comingSoon },
});
