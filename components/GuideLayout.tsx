import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { appStoreUrl } from '../lib/analytics';
import type { GuideData } from '../lib/guides/types';

// Renders one clerkship guide from its GuideData. This is the design template the
// approved Peds mock was signed off on: extractable answer, question-phrased H2s,
// honest resource stack, the Step Gunner "fit" data, a week-by-week plan, a FAQ,
// the trust strip, a named MS4 byline, a sticky mobile CTA, one mid-page CTA, and
// full GEO structured data (Article + FAQPage + Organization + SoftwareApplication).

// Rich text: **double asterisks** become <strong>. Even segments are plain text
// (strings in a React array need no key); odd segments are bolded.
function Rich({ text }: { text: string }) {
  const parts = text.split('**');
  return <>{parts.map((p, i) => (i % 2 === 1 ? <b key={i}>{p}</b> : p))}</>;
}

function stripRich(text: string): string {
  return text.replace(/\*\*/g, '');
}

const STAR =
  'M9 1 L11.1 6.3 L16.8 6.8 L12.4 10.5 L13.8 16 L9 13 L4.2 16 L5.6 10.5 L1.2 6.8 L6.9 6.3 Z';
const STAR_OFFSETS = [0, 18.4, 36.8, 55.2, 73.6];

function StarSvg() {
  return (
    <svg className="rowsvg" viewBox="0 0 92 18">
      {STAR_OFFSETS.map((x) => (
        <path key={x} d={STAR} transform={x ? `translate(${x},0)` : undefined} />
      ))}
    </svg>
  );
}

export default function GuideLayout({ guide }: { guide: GuideData }) {
  const { meta, author, trust, fit } = guide;
  const canonical = `https://stepgunner.com/guides/${meta.slug}`;
  // App Store CTAs tag the install with the clerkship so each clone attributes
  // its own installs (App Store Connect -> App Analytics -> Campaigns).
  const appHref = appStoreUrl(`guides_${meta.slug}`);
  const ratingPct = `${(trust.rating / 5) * 100}%`;

  const answerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLElement>(null);
  const [stickyShow, setStickyShow] = useState(false);

  // Reveal the sticky bar after the hero answer scrolls past; hide it when the end
  // CTA is in view so the two never compete. Passive listeners, cheap layout reads.
  useEffect(() => {
    const update = () => {
      const a = answerRef.current;
      const e = endRef.current;
      if (!a || !e) return;
      const heroPassed = a.getBoundingClientRect().bottom < 0;
      const endVisible = e.getBoundingClientRect().top < window.innerHeight - 40;
      setStickyShow(heroPassed && !endVisible);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // --- structured data (GEO / citation layer) ---
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.ogTitle,
    description: meta.description,
    image: [meta.ogImage],
    datePublished: meta.datePublished,
    dateModified: meta.dateModified,
    inLanguage: 'en-US',
    author: {
      '@type': 'Person',
      name: author.name,
      jobTitle: 'Medical Student',
      description: author.credential,
      affiliation: { '@type': 'CollegeOrUniversity', name: 'Texas A&M College of Medicine' },
    },
    publisher: {
      '@type': 'Organization',
      name: 'Step Gunner',
      legalName: 'Rezumab LLC',
      url: 'https://stepgunner.com',
      logo: { '@type': 'ImageObject', url: meta.ogImage },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: stripRich(f.a) },
    })),
  };

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Step Gunner',
    legalName: 'Rezumab LLC',
    url: 'https://stepgunner.com',
    logo: { '@type': 'ImageObject', url: meta.ogImage },
    founder: { '@type': 'Person', name: author.name, description: author.credential },
    sameAs: ['https://rezumab.app', 'https://apps.apple.com/us/app/step-gunner/id6761317357'],
  };

  // Real 5-star App Store reviews (truthful, individually cited). No aggregateRating
  // is asserted because we do not have a verified rating count to publish.
  const appLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Step Gunner',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'iOS 17.0 or later',
    url: 'https://apps.apple.com/us/app/step-gunner/id6761317357',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    review: [
      {
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
        author: { '@type': 'Person', name: 'App Store reviewer' },
        reviewBody: trust.quote,
      },
      {
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
        author: { '@type': 'Person', name: 'App Store reviewer' },
        reviewBody: fit.quote.text,
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#faf9f6" />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={meta.ogTitle} />
        <meta property="og:description" content={meta.ogDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={meta.ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.ogTitle} />
        <meta name="twitter:description" content={meta.ogDescription} />
        <meta name="twitter:image" content={meta.ogImage} />
        <meta name="author" content={author.name} />
      </Head>

      {/* GEO / citation layer: rendered into the static HTML so crawlers and AI
          engines can lift the answer set, the byline, and the publisher. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }}
      />

      <style jsx global>{`
        :root {
          /* Score Report register (light) */
          --bg: #faf9f6; --bg1: #ffffff; --bg2: #ffffff; --bg3: #f3f2ee;
          --ink: #191c23; --dim: #5d6470; --faint: #9aa0ab;
          --hair: rgba(25,28,35,0.12); --hair2: rgba(25,28,35,0.08);
          --green: #0d9448; --gold: #e08e00; --blue: #2f6fed; --red: #d64545;
          --mono: ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Consolas, monospace;
          --sans: 'DM Sans', -apple-system, system-ui, sans-serif;
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body { font-family: var(--sans); color: var(--ink); background: var(--bg); -webkit-font-smoothing: antialiased; }
        a { color: inherit; text-decoration: none; }

        .page { min-height: 100vh; background: radial-gradient(90% 55% at 50% -8%, rgba(13,148,72,0.08), transparent 60%), radial-gradient(56% 22% at 50% 0%, rgba(240,180,41,0.13), transparent 62%), var(--bg); }

        .nav { display: flex; align-items: center; justify-content: space-between; max-width: 720px; margin: 0 auto; padding: 20px 22px; }
        .wm { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-weight: 700; letter-spacing: 2.5px; font-size: 14px; }
        .wm .wt b.g { color: var(--green); font-weight: 700; }
        .wm .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 9px var(--green); flex: 0 0 auto; }
        .nav-cta { background: var(--green); color: #ffffff; padding: 9px 18px; border-radius: 10px; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 1px; box-shadow: 0 4px 18px rgba(13,148,72,0.24); transition: transform 0.15s ease, box-shadow 0.2s ease; }
        .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 26px rgba(13,148,72,0.32); }

        .wrap { max-width: 720px; margin: 0 auto; padding: 20px 22px 90px; line-height: 1.5; }

        .crumb { font-family: var(--mono); font-size: 11px; color: var(--faint); display: flex; align-items: center; gap: 9px; margin-bottom: 20px; letter-spacing: 0.4px; }
        .crumb a { color: var(--dim); }
        .crumb a:hover { color: var(--green); }
        .crumb .sep { color: var(--hair); }

        .eyebrow { display: inline-block; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); }
        h1 { font-size: 34px; font-weight: 800; letter-spacing: -0.6px; line-height: 1.12; margin: 10px 0 14px; text-wrap: balance; }
        .lede { color: var(--dim); font-size: 17px; line-height: 1.6; margin: 0 0 12px; max-width: 60ch; }
        .lede b { color: var(--ink); font-weight: 600; }

        .author { display: flex; align-items: center; gap: 12px; margin: 18px 0 2px; padding: 11px 14px; border: 1px solid var(--hair); background: var(--bg1); border-radius: 12px; }
        .author .ava { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(180deg, rgba(13,148,72,0.22), rgba(13,148,72,0.10)); border: 1px solid rgba(13,148,72,0.35); color: var(--green); font-family: var(--mono); font-weight: 800; font-size: 12px; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; letter-spacing: 0.5px; }
        .author .aline { font-size: 13.5px; font-weight: 600; color: var(--ink); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .author .verified { display: inline-flex; align-items: center; gap: 4px; font-family: var(--mono); font-size: 9.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--green); border: 1px solid rgba(13,148,72,0.35); border-radius: 999px; padding: 2px 8px; }
        .author .verified svg { width: 9px; height: 9px; fill: none; stroke: var(--green); stroke-width: 3; }
        .author .ameta { font-family: var(--mono); font-size: 11px; color: var(--faint); margin-top: 4px; letter-spacing: 0.2px; line-height: 1.45; }

        .answer { margin: 18px 0 20px; background: linear-gradient(180deg, var(--bg2), var(--bg1)); border: 1px solid var(--hair); border-left: 3px solid var(--gold); border-radius: 0 14px 14px 0; padding: 18px 20px; }
        .answer .alabel { font-family: var(--mono); font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); margin-bottom: 9px; }
        .answer p { margin: 0; color: var(--ink); font-size: 16.5px; line-height: 1.62; font-weight: 500; max-width: 64ch; }
        .answer p b { font-weight: 700; }

        .cov { margin-top: 16px; padding-top: 15px; border-top: 1px solid var(--hair); }
        .cov .ch { font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); margin-bottom: 11px; }
        .covgrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 20px; }
        .covrow { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; border-bottom: 1px solid var(--hair2); padding: 6px 0; }
        .covrow .cn { font-size: 13px; color: var(--dim); }
        .covrow .cc { font-family: var(--mono); font-size: 12.5px; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; }
        .src { font-family: var(--mono); font-size: 10.5px; color: var(--faint); margin: 13px 0 0; letter-spacing: 0.2px; line-height: 1.5; }

        .faq { margin-top: 20px; border: 1px solid var(--hair); border-radius: 14px; overflow: hidden; }
        .qa { padding: 16px 18px; border-bottom: 1px solid var(--hair); background: var(--bg1); }
        .qa:last-child { border-bottom: 0; }
        .qa h3 { font-size: 16px; font-weight: 700; letter-spacing: -0.2px; margin: 0 0 8px; color: var(--ink); display: flex; gap: 9px; align-items: baseline; }
        .qa h3 .q { color: var(--gold); font-family: var(--mono); font-weight: 800; flex: 0 0 auto; }
        .qa p { margin: 0; color: var(--dim); font-size: 14.5px; line-height: 1.65; max-width: 64ch; }
        .qa p b { color: var(--ink); font-weight: 600; }

        .trust { margin: 0 0 22px; padding: 13px 16px; border: 1px solid var(--hair); background: var(--bg1); border-radius: 12px; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 20px; }
        .trust-metrics { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 18px; }
        .tm { display: inline-flex; align-items: center; gap: 8px; }
        .rating { position: relative; display: inline-block; width: 86px; height: 16px; flex: 0 0 auto; }
        .rating-track, .rating-fill { position: absolute; top: 0; left: 0; height: 16px; overflow: hidden; }
        .rating-track { width: 100%; }
        .rating .rowsvg { display: block; width: 86px; height: 16px; }
        .rating-track .rowsvg { fill: #d9d7d0; }
        .rating-fill .rowsvg { fill: var(--gold); }
        .tm .tmv { font-size: 13px; color: var(--dim); font-weight: 500; }
        .tm .tmn { color: var(--gold); font-family: var(--mono); font-weight: 800; }
        .trust-quote { margin: 0; padding-left: 18px; border-left: 1px solid var(--hair); font-size: 13.5px; color: var(--ink); line-height: 1.55; font-weight: 500; flex: 1 1 240px; min-width: 200px; }
        .trust-quote cite { display: block; font-style: normal; font-weight: 400; font-family: var(--mono); font-size: 11px; color: var(--faint); margin-top: 6px; letter-spacing: 0.2px; }

        .sgquote { margin-top: 16px; padding: 14px 16px; border: 1px solid var(--hair); border-radius: 12px; background: var(--bg); }
        .sgquote p { margin: 0; color: var(--ink); font-size: 14px; line-height: 1.6; font-weight: 500; }
        .sgquote cite { display: block; font-style: normal; font-family: var(--mono); font-size: 10.5px; color: var(--faint); margin-top: 9px; letter-spacing: 0.2px; }

        .sgcta { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--hair); display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .sgcta .sgcta-note { font-family: var(--mono); font-size: 11px; color: var(--faint); letter-spacing: 0.2px; }

        .stickybar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; background: rgba(250,249,246,0.9); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-top: 1px solid var(--hair); transform: translateY(110%); visibility: hidden; transition: transform 0.28s ease, visibility 0.28s ease; }
        .stickybar.show { transform: translateY(0); visibility: visible; }
        .sb-inner { max-width: 720px; margin: 0 auto; padding: 10px 22px calc(10px + env(safe-area-inset-bottom)); display: flex; align-items: center; justify-content: space-between; gap: 14px; }
        .sb-label { font-size: 13px; color: var(--dim); font-weight: 500; }
        .sb-cta { background: var(--green); color: #ffffff; font-family: var(--mono); font-weight: 800; font-size: 12px; letter-spacing: 0.3px; padding: 10px 16px; border-radius: 10px; box-shadow: 0 4px 18px rgba(13,148,72,0.24); flex: 0 0 auto; white-space: nowrap; transition: transform 0.15s ease; }
        .sb-cta:hover { transform: translateY(-1px); }

        .block { margin-top: 46px; padding-top: 30px; border-top: 1px solid var(--hair); }
        .beyebrow { font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--faint); display: flex; align-items: center; gap: 10px; }
        .beyebrow i { color: var(--gold); font-style: normal; }
        h2 { font-size: 25px; font-weight: 800; letter-spacing: -0.4px; line-height: 1.2; margin: 12px 0 12px; }
        .block > p { color: var(--dim); font-size: 15.5px; line-height: 1.65; margin: 0 0 14px; max-width: 62ch; }
        .block > p b { color: var(--ink); font-weight: 600; }

        .stack { display: grid; gap: 12px; margin: 22px 0 6px; }
        .res { display: grid; grid-template-columns: 128px 1fr; gap: 16px; border: 1px solid var(--hair); background: linear-gradient(180deg, var(--bg1), var(--bg)); border-radius: 14px; padding: 16px 18px; }
        .res .role { font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--dim); border-left: 2px solid var(--hair); padding-left: 11px; align-self: start; margin-top: 3px; line-height: 1.5; }
        .res .rname { font-size: 16px; font-weight: 700; letter-spacing: -0.2px; color: var(--ink); margin: 0 0 6px; }
        .res .use { font-size: 14.5px; line-height: 1.6; color: var(--dim); margin: 0 0 7px; max-width: 56ch; }
        .res .use b { color: var(--ink); font-weight: 600; }
        .res .note { font-size: 13px; line-height: 1.55; color: var(--faint); margin: 0; max-width: 58ch; }
        .res .tier { font-family: var(--mono); font-size: 9.5px; letter-spacing: 0.05em; color: var(--faint); text-transform: uppercase; margin-left: 8px; border: 1px solid var(--hair); border-radius: 999px; padding: 2px 7px; vertical-align: 1px; }

        .sg { margin: 24px 0 8px; background: linear-gradient(180deg, var(--bg2), var(--bg1)); border: 1px solid rgba(13,148,72,0.32); border-radius: 18px; padding: 24px 24px 20px; box-shadow: 0 0 0 1px rgba(13,148,72,0.06), 0 22px 60px -34px rgba(13,148,72,0.55); }
        .sg .tag { font-family: var(--mono); font-weight: 700; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--green); }
        .sg h3 { font-size: 19px; font-weight: 800; letter-spacing: -0.3px; margin: 8px 0 8px; }
        .sg p { color: var(--dim); font-size: 15px; line-height: 1.65; margin: 0 0 14px; max-width: 60ch; }
        .sg p b { color: var(--ink); font-weight: 600; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0 6px; }
        /* A rotation with 4 study modes (e.g. IM, which carries Visual Dx) lays out
           as a comfortable 2x2 above the mobile breakpoint; below it, the rule at
           max-width 560px collapses every stats grid to a single column. */
        @media (min-width: 561px) { .stats.stats-4 { grid-template-columns: repeat(2, 1fr); } }
        .stat { border: 1px solid var(--hair); background: var(--bg1); border-radius: 12px; padding: 15px 14px; }
        .stat .n { font-size: 30px; font-weight: 800; letter-spacing: -1.2px; color: var(--green); line-height: 1; }
        .stat .k { font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink); margin-top: 9px; }
        .stat .d { font-size: 12px; line-height: 1.45; color: var(--faint); margin-top: 5px; }
        .sgtotal { font-family: var(--mono); font-size: 12.5px; color: var(--dim); margin: 14px 0 0; letter-spacing: 0.2px; }
        .sgtotal b { color: var(--green); font-weight: 700; }
        .vdx { margin-top: 16px; padding-top: 15px; border-top: 1px solid var(--hair); }
        .vdx .vh { font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); margin-bottom: 9px; }
        .vdx .chips { display: flex; flex-wrap: wrap; gap: 7px; }
        .vdx .chip { font-family: var(--mono); font-size: 11.5px; color: var(--dim); border: 1px solid var(--hair); background: var(--bg); border-radius: 999px; padding: 5px 11px; }
        .vdx .vnote { font-size: 12.5px; line-height: 1.55; color: var(--faint); margin: 11px 0 0; max-width: 60ch; }
        .honest { display: flex; gap: 10px; align-items: flex-start; margin: 18px 0 2px; padding: 13px 15px; background: var(--bg1); border: 1px solid var(--hair); border-radius: 12px; }
        .honest .g { color: var(--gold); font-family: var(--mono); font-weight: 800; font-size: 13px; flex: 0 0 auto; margin-top: 1px; }
        .honest p { margin: 0; color: var(--dim); font-size: 13.5px; line-height: 1.6; max-width: 58ch; }
        .honest p b { color: var(--ink); font-weight: 600; }

        .phase { display: grid; grid-template-columns: 34px 1fr; gap: 16px; margin-top: 26px; }
        .pnum { width: 30px; height: 30px; border-radius: 9px; border: 1px solid var(--hair); background: var(--bg2); color: var(--gold); font-family: var(--mono); font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .pbody .pweeks { font-family: var(--mono); font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); }
        .pbody h3 { font-size: 17px; font-weight: 700; letter-spacing: -0.2px; margin: 4px 0 8px; }
        .pbody > p { color: var(--dim); font-size: 15px; line-height: 1.65; margin: 0 0 12px; max-width: 58ch; }
        .lean { list-style: none; padding: 0; margin: 0 0 12px; }
        .lean li { position: relative; padding-left: 18px; color: var(--dim); font-size: 14.5px; line-height: 1.6; margin-bottom: 6px; max-width: 58ch; }
        .lean li::before { content: ""; position: absolute; left: 2px; top: 9px; width: 5px; height: 5px; border-radius: 50%; background: var(--gold); }
        .lean li b { color: var(--ink); font-weight: 600; }
        .slot { display: flex; gap: 10px; align-items: flex-start; background: linear-gradient(90deg, rgba(13,148,72,0.07), transparent); border-left: 2px solid var(--green); border-radius: 0 10px 10px 0; padding: 11px 14px; }
        .slot .sk { font-family: var(--mono); font-weight: 700; font-size: 9.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--green); flex: 0 0 auto; margin-top: 2px; }
        .slot p { margin: 0; color: var(--dim); font-size: 13.5px; line-height: 1.6; max-width: 54ch; }
        .slot p b { color: var(--ink); font-weight: 600; }

        .cta { margin-top: 46px; padding-top: 30px; border-top: 1px solid var(--hair); }
        .ctline { color: var(--ink); font-size: 16px; font-weight: 500; line-height: 1.6; margin: 0 0 18px; max-width: 60ch; }
        .ctrow { display: flex; gap: 12px; flex-wrap: wrap; }
        .ct-primary { background: var(--green); color: #ffffff; font-family: var(--mono); font-weight: 800; font-size: 13px; letter-spacing: 0.3px; padding: 13px 20px; border-radius: 12px; box-shadow: 0 6px 26px rgba(13,148,72,0.28); transition: transform 0.15s ease; }
        .ct-primary:hover { transform: translateY(-1px); }
        .ct-secondary { border: 1px solid var(--hair); color: var(--ink); font-family: var(--mono); font-weight: 700; font-size: 13px; letter-spacing: 0.3px; padding: 13px 20px; border-radius: 12px; transition: border-color 0.15s ease, color 0.15s ease; }
        .ct-secondary:hover { border-color: var(--green); color: var(--green); }
        /* 44px minimum tap target (Apple HIG / WCAG) for every CTA */
        .nav-cta, .sb-cta, .ct-primary, .ct-secondary { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
        .bridge { margin-top: 22px; display: flex; gap: 11px; align-items: flex-start; color: var(--faint); font-size: 13.5px; line-height: 1.6; max-width: 62ch; }
        .bridge a { color: var(--dim); text-decoration: underline; text-underline-offset: 2px; }
        .bridge a:hover { color: var(--green); }
        .bridge .b { font-family: var(--mono); color: var(--faint); font-weight: 700; font-size: 12px; flex: 0 0 auto; margin-top: 1px; }

        .foot { display: flex; justify-content: space-between; align-items: center; margin-top: 44px; font-family: var(--mono); font-size: 11px; color: var(--faint); }
        .foot a { color: var(--dim); }

        @media (max-width: 560px) {
          h1 { font-size: 28px; }
          h2 { font-size: 22px; }
          .res { grid-template-columns: 1fr; gap: 9px; }
          .res .role { border-left: 0; border-top: 2px solid var(--hair); padding-left: 0; padding-top: 8px; margin-top: 0; }
          .stats { grid-template-columns: 1fr; }
          .covgrid { grid-template-columns: 1fr; }
          .phase { grid-template-columns: 26px 1fr; gap: 12px; }
          .pnum { width: 24px; height: 24px; font-size: 12px; }
          .trust-quote { border-left: 0; padding-left: 0; flex-basis: 100%; }
          .sb-label { display: none; }
          .sb-inner { padding: 9px 16px calc(9px + env(safe-area-inset-bottom)); }
          .sb-cta { flex: 1 1 auto; text-align: center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nav-cta, .ct-primary, .ct-secondary, .sb-cta, .stickybar { transition: none; }
        }
      `}</style>

      <div className="page">
        <nav className="nav">
          <a href="/" className="wm"><span className="dot" /><span className="wt">STEP <b className="g">GUNNER</b></span></a>
          <a href="/readiness" className="nav-cta">{guide.navCta}</a>
        </nav>

        <main className="wrap">
          <div className="crumb">
            <a href="/guides">Clerkship guides</a>
            <span className="sep">/</span>
            <span>{meta.clerkship}</span>
          </div>

          <span className="eyebrow">{guide.eyebrow}</span>
          <h1>{guide.h1}</h1>

          <div className="author">
            <div className="ava">{author.initials}</div>
            <div>
              <div className="aline">By {author.name}
                <span className="verified">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="4 12 10 18 20 6" fill="none" /></svg> {author.reviewedLabel}
                </span>
              </div>
              <div className="ameta">{author.credentialLine}</div>
            </div>
          </div>

          <div className="answer" ref={answerRef}>
            <div className="alabel">{guide.answer.question}</div>
            <p><Rich text={guide.answer.body} /></p>
          </div>

          <div className="trust" role="group" aria-label="App Store rating and student proof">
            <div className="trust-metrics">
              <div className="tm">
                <span className="rating" role="img" aria-label={`Rated ${trust.rating} out of 5 on the App Store`}>
                  <span className="rating-track" aria-hidden="true"><StarSvg /></span>
                  <span className="rating-fill" style={{ width: ratingPct }} aria-hidden="true"><StarSvg /></span>
                </span>
                <span className="tmv"><b className="tmn">{trust.rating}</b> {trust.ratingLabel}</span>
              </div>
              <div className="tm">
                <span className="tmv"><b className="tmn">{trust.studentsCount}</b> {trust.studentsLabel}</span>
              </div>
            </div>
            <blockquote className="trust-quote">
              &ldquo;{trust.quote}&rdquo;
              <cite>{trust.quoteCite}</cite>
            </blockquote>
          </div>

          <p className="lede"><Rich text={guide.lede} /></p>

          {/* 01: THE STACK */}
          <section className="block">
            <div className="beyebrow"><i>{guide.stackSection.num}</i> {guide.stackSection.eyebrow}</div>
            <h2>{guide.stackSection.h2}</h2>
            <p><Rich text={guide.stackSection.intro} /></p>

            <div className="stack">
              {guide.resources.map((r) => (
                <div className="res" key={r.name}>
                  <div className="role">{r.role}</div>
                  <div>
                    <p className="rname">{r.name}{r.also && (<> <span className="tier">and</span> {r.also}</>)}</p>
                    <p className="use"><b>Use it for:</b> {r.use}</p>
                    <p className="note">{r.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 02: WHERE STEP GUNNER FITS */}
          <section className="block">
            <div className="beyebrow"><i>{guide.fitSection.num}</i> {guide.fitSection.eyebrow}</div>
            <h2>{guide.fitSection.h2}</h2>
            <p><Rich text={guide.fitSection.intro} /></p>

            <div className="sg">
              <div className="tag">{fit.tag}</div>
              <h3>{fit.cardTitle}</h3>
              <p>{fit.cardIntro}</p>

              <div className={`stats${fit.stats.length === 4 ? ' stats-4' : ''}`}>
                {fit.stats.map((s) => (
                  <div className="stat" key={s.k}>
                    <div className="n">{s.n}</div>
                    <div className="k">{s.k}</div>
                    <div className="d">{s.d}</div>
                  </div>
                ))}
              </div>
              <p className="sgtotal"><Rich text={fit.total} /></p>

              <div className="cov">
                <div className="ch">{fit.coverageHeading}</div>
                <div className="covgrid">
                  {fit.coverage.map((c) => (
                    <div className="covrow" key={c.name}>
                      <span className="cn">{c.name}</span>
                      <span className="cc">{c.count}</span>
                    </div>
                  ))}
                </div>
                <p className="src">{fit.coverageSource}</p>
              </div>

              {fit.visualDxChips.length > 0 && (
                <div className="vdx">
                  <div className="vh">{fit.visualDxHeading}</div>
                  <div className="chips">
                    {fit.visualDxChips.map((chip) => (
                      <span className="chip" key={chip}>{chip}</span>
                    ))}
                  </div>
                  <p className="vnote">{fit.visualDxNote}</p>
                </div>
              )}

              <div className="honest">
                <span className="g">i</span>
                <p><Rich text={fit.honest} /></p>
              </div>

              <figure className="sgquote">
                <p>&ldquo;{fit.quote.text}&rdquo;</p>
                <figcaption><cite>{fit.quote.cite}</cite></figcaption>
              </figure>

              <div className="sgcta">
                <a href={appHref} target="_blank" rel="noopener noreferrer" className="ct-primary">{fit.ctaLabel}</a>
                <span className="sgcta-note">{fit.ctaNote}</span>
              </div>
            </div>
          </section>

          {/* 03: THE PLAN */}
          <section className="block">
            <div className="beyebrow"><i>{guide.planSection.num}</i> {guide.planSection.eyebrow}</div>
            <h2>{guide.planSection.h2}</h2>
            <p><Rich text={guide.planSection.intro} /></p>

            {guide.plan.map((ph) => (
              <div className="phase" key={ph.num}>
                <div className="pnum">{ph.num}</div>
                <div className="pbody">
                  <div className="pweeks">{ph.weeks}</div>
                  <h3>{ph.title}</h3>
                  <p>{ph.body}</p>
                  <ul className="lean">
                    {ph.bullets.map((b, i) => (
                      <li key={i}><Rich text={b} /></li>
                    ))}
                  </ul>
                  <div className="slot">
                    <span className="sk">{ph.slotLabel}</span>
                    <p><Rich text={ph.slot} /></p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* 04: FAQ */}
          <section className="block">
            <div className="beyebrow"><i>{guide.faqSection.num}</i> {guide.faqSection.eyebrow}</div>
            <h2>{guide.faqSection.h2}</h2>
            <p><Rich text={guide.faqSection.intro} /></p>
            <div className="faq">
              {guide.faqs.map((f) => (
                <div className="qa" key={f.q}>
                  <h3><span className="q">Q</span> {f.q}</h3>
                  <p><Rich text={f.a} /></p>
                </div>
              ))}
            </div>
          </section>

          {/* 05: SOFT CTAs */}
          <section className="cta" ref={endRef}>
            <p className="ctline">{guide.ctaLine}</p>
            <div className="ctrow">
              <a href="/readiness" className="ct-primary">{guide.endPrimaryLabel}</a>
              <a href={appHref} target="_blank" rel="noopener noreferrer" className="ct-secondary">{guide.endSecondaryLabel}</a>
            </div>
            <div className="bridge">
              <span className="b">{guide.bridge.label}</span>
              <p>
                {guide.bridge.pre}
                <a href={guide.bridge.linkHref} target="_blank" rel="noopener noreferrer">{guide.bridge.linkText}</a>
                {guide.bridge.post}
              </p>
            </div>
          </section>

          <footer className="foot">
            <a href="/">stepgunner.com</a>
            <span>Rezumab LLC</span>
          </footer>
        </main>
      </div>

      <div className={`stickybar${stickyShow ? ' show' : ''}`}>
        <div className="sb-inner">
          <span className="sb-label">{guide.sticky.label}</span>
          <a href="/readiness" className="sb-cta">{guide.sticky.cta}</a>
        </div>
      </div>
    </>
  );
}
