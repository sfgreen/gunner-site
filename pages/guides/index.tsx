import Head from 'next/head';
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
          content="Honest, resource-by-role study guides for the NBME shelf exams: the real resource stack, a 6 to 8 week plan, and a plain-English FAQ for each clerkship. Written by a med student who has been through it."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#05070b" />
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
        :root {
          --bg: #05070b; --bg1: #0a0d13; --bg2: #0f1520;
          --ink: #eaf0f8; --dim: #8a97a8; --faint: #5a6676;
          --hair: #1e2836; --hair2: rgba(30,40,54,0.55);
          --green: #46d877; --gold: #f0b429;
          --mono: ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Consolas, monospace;
          --sans: 'DM Sans', -apple-system, system-ui, sans-serif;
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body { font-family: var(--sans); color: var(--ink); background: var(--bg); -webkit-font-smoothing: antialiased; }
        a { color: inherit; text-decoration: none; }
        .page { min-height: 100vh; background: radial-gradient(1100px 640px at 50% -10%, #0c1220, var(--bg)); }

        .nav { display: flex; align-items: center; justify-content: space-between; max-width: 860px; margin: 0 auto; padding: 20px 22px; }
        .wm { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-weight: 700; letter-spacing: 2.5px; font-size: 14px; }
        .wm .g { color: var(--green); }
        .wm .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 9px var(--green); flex: 0 0 auto; }
        .nav-cta { background: var(--green); color: #05130a; padding: 9px 18px; border-radius: 10px; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 1px; box-shadow: 0 4px 18px rgba(70,216,119,0.24); transition: transform 0.15s ease, box-shadow 0.2s ease; }
        .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 26px rgba(70,216,119,0.32); }

        .wrap { max-width: 860px; margin: 0 auto; padding: 26px 22px 90px; }
        .crumb { font-family: var(--mono); font-size: 11px; color: var(--faint); margin-bottom: 20px; letter-spacing: 0.4px; }
        .crumb a { color: var(--dim); }
        .crumb a:hover { color: var(--green); }
        .eyebrow { display: inline-block; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); }
        h1 { font-size: 34px; font-weight: 800; letter-spacing: -0.6px; line-height: 1.12; margin: 10px 0 14px; text-wrap: balance; }
        .lede { color: var(--dim); font-size: 17px; line-height: 1.6; margin: 0 0 6px; max-width: 62ch; }
        .lede b { color: var(--ink); font-weight: 600; }

        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 30px; }
        .card { border: 1px solid var(--hair); background: linear-gradient(180deg, var(--bg1), var(--bg)); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 10px; min-height: 150px; }
        .card.live { border-color: rgba(70,216,119,0.32); box-shadow: 0 20px 54px -36px rgba(70,216,119,0.5); transition: transform 0.15s ease, border-color 0.2s ease; }
        .card.live:hover { transform: translateY(-2px); border-color: var(--green); }
        .card.soon { opacity: 0.72; }
        .card .ctag { font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
        .card.live .ctag { color: var(--green); }
        .card.soon .ctag { color: var(--faint); border: 1px solid var(--hair); border-radius: 999px; padding: 3px 9px; align-self: flex-start; }
        .card h2 { font-size: 20px; font-weight: 800; letter-spacing: -0.3px; margin: 0; }
        .card p { color: var(--dim); font-size: 14px; line-height: 1.55; margin: 0; flex: 1 1 auto; }
        .card .go { font-family: var(--mono); font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color: var(--green); }
        .card.soon .go { color: var(--faint); }

        .foot { display: flex; justify-content: space-between; align-items: center; margin-top: 44px; padding-top: 22px; border-top: 1px solid var(--hair); font-family: var(--mono); font-size: 11px; color: var(--faint); }
        .foot a { color: var(--dim); }
        .foot a:hover { color: var(--green); }

        @media (max-width: 620px) {
          h1 { font-size: 28px; }
          .grid { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nav-cta, .card.live { transition: none; }
        }
      `}</style>

      <div className="page">
        <nav className="nav">
          <a href="/" className="wm"><span className="dot" /><span>STEP <span className="g">GUNNER</span></span></a>
          <a href="/readiness" className="nav-cta">Free score predictor</a>
        </nav>

        <main className="wrap">
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

          <div className="foot">
            <a href="/">stepgunner.com</a>
            <span>Rezumab LLC</span>
          </div>
        </main>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => ({
  props: { live: liveGuideCards(), soon: comingSoon },
});
