import Head from 'next/head';
import type { GuideData } from '../lib/guides/types';
import AppShell from './app/AppShell';
import {
  ArticleBody, ArticleHeader, Callout, Faq, faqJsonLd, Hero, Icon, Rich, Section, StatStrip, Table,
} from './app/blocks';
import { CtaCard, EndBand, StickyStoreBar, StoreButton } from './app/store';

// Renders one clerkship guide from its GuideData, in the app look, from the shared
// blocks (components/app): the shelf category (purple), the extractable answer under
// the header, the white store card, the resource stack, where Step Gunner fits, the
// week-by-week plan as a chain, the FAQ, the closing band, and the phone sticky bar.
// Structured data (Article + FAQPage + Organization + SoftwareApplication) as before.
// Every store button carries ct=guides_<slug>, so each rotation attributes its own
// installs (App Store Connect, App Analytics, Campaigns). No em or en dashes.

/** "Pediatrics clerkship: the resource stack, and a free shelf tool." accents what follows the colon. */
const accentOf = (h1: string) => (h1.includes(': ') ? h1.slice(h1.indexOf(': ') + 2) : undefined);

export default function GuideLayout({ guide }: { guide: GuideData }) {
  const { meta, author, trust, fit } = guide;
  const canonical = `https://stepgunner.com/guides/${meta.slug}`;
  // "MS4, Texas A&M College of Medicine. Reviewed for accuracy. Updated August 2026."
  // The credential is in the byline already; the rest follows it.
  const after = author.credentialLine.startsWith(`${author.credential}. `)
    ? author.credentialLine.slice(author.credential.length + 2).replace(/\.$/, '').split('. ')
    : [];
  const toc: [string, string][] = [
    ['stack', guide.stackSection.eyebrow],
    ['fit', guide.fitSection.eyebrow],
    ['plan', guide.planSection.eyebrow],
    ['faq', guide.faqSection.eyebrow],
  ];

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
    review: [trust.quote, fit.quote.text].map((reviewBody) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      author: { '@type': 'Person', name: 'App Store reviewer' },
      reviewBody,
    })),
  };

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
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
      {[articleLd, faqJsonLd(guide.faqs), orgLd, appLd].map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      ))}

      <AppShell
        campaign={`guides_${meta.slug}`}
        pageType="guide"
        section="shelf"
        sticky={<StickyStoreBar title={guide.sticky.label} button={guide.sticky.cta} />}
      >
        <Hero>
          <ArticleHeader
            category="shelf"
            crumb={[{ href: '/guides', label: 'Shelf exams' }, { label: meta.clerkship }]}
            eyebrow={guide.eyebrow}
            title={guide.h1}
            accent={accentOf(guide.h1)}
            reviewed={after[0]}
            meta={after.slice(1)}
          />
          <div className="mk isl">
            <section className="sheet gd-ans" aria-labelledby="gd-ans-q">
              <div className="sheet-hd"><h2 className="lbl" id="gd-ans-q">{guide.answer.question}</h2></div>
              <div className="sheet-bd"><p><Rich text={guide.answer.body} /></p></div>
            </section>
          </div>
          <CtaCard title={guide.sticky.label} sub={fit.ctaNote} button={guide.navCta} stickyStart />
        </Hero>

        <ArticleBody toc={toc}>
          <div className="mk isl">
            <div className="gd-trust" role="group" aria-label="App Store rating and student proof">
              <p className="gd-tm">
                <span className="stars" role="img" aria-label={`Rated ${trust.rating} out of 5 on the App Store`}>
                  {[0, 1, 2, 3, 4].map((i) => <svg key={i} className="ic star" aria-hidden="true"><use href="#i-star" /></svg>)}
                </span>
                <span><b className="num">{trust.rating}</b> {trust.ratingLabel}</span>
                <span><b className="num">{trust.studentsCount}</b> {trust.studentsLabel}</span>
              </p>
              <blockquote><p>&ldquo;{trust.quote}&rdquo;</p><footer className="rev-c">{trust.quoteCite}</footer></blockquote>
            </div>
            <p className="prs gd-lede"><Rich text={guide.lede} /></p>
          </div>

          <Section id="stack" n={guide.stackSection.num} title={guide.stackSection.h2} lead={<Rich text={guide.stackSection.intro} />}>
            <ul className="gd-res">
              {guide.resources.map((r) => (
                <li key={r.name}>
                  <span className="lbl">{r.role}</span>
                  <div>
                    <h3 className="gd-rn">{r.name}{r.also && <> <span className="gd-and">and</span> {r.also}</>}</h3>
                    <p className="gd-use"><b>Use it for:</b> {r.use}</p>
                    <p className="fine">{r.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="fit" n={guide.fitSection.num} title={guide.fitSection.h2} lead={<Rich text={guide.fitSection.intro} />}>
            <div className="sheet gd-fit">
              <div className="sheet-hd"><span className="lbl"><span className="dot purple" aria-hidden="true" />{fit.tag}</span></div>
              <div className="sheet-bd">
                <h3 className="h-3">{fit.cardTitle}</h3>
                <p className="prs">{fit.cardIntro}</p>
                <StatStrip items={fit.stats.map((s) => ({ value: s.n, label: <><b>{s.k}</b>. {s.d}</> }))} />
                <p className="prs"><Rich text={fit.total} /></p>
                <h4 className="lbl gd-h4">{fit.coverageHeading}</h4>
                <Table label={fit.coverageHeading} head={['Topic', 'Cards']} rows={fit.coverage.map((c) => [c.name, c.count])} num={[1]} />
                <p className="srcl">{fit.coverageSource}</p>
                {fit.visualDxChips.length > 0 && (
                  <>
                    <h4 className="lbl gd-h4">{fit.visualDxHeading}</h4>
                    <ul className="gd-chips">{fit.visualDxChips.map((c) => <li key={c}>{c}</li>)}</ul>
                    <p className="fine gd-note">{fit.visualDxNote}</p>
                  </>
                )}
                <Callout><p><Rich text={fit.honest} /></p></Callout>
                <figure className="gd-q">
                  <blockquote><p>&ldquo;{fit.quote.text}&rdquo;</p></blockquote>
                  <figcaption className="rev-c">{fit.quote.cite}</figcaption>
                </figure>
                <div className="gd-cta"><StoreButton loc="mid">{fit.ctaLabel}</StoreButton><span className="fine">{fit.ctaNote}</span></div>
              </div>
            </div>
          </Section>

          <Section id="plan" n={guide.planSection.num} title={guide.planSection.h2} lead={<Rich text={guide.planSection.intro} />}>
            <ol className="chain gd-plan">
              {guide.plan.map((ph) => (
                <li key={ph.num}>
                  <div>
                    <p className="q">{ph.weeks}</p>
                    <h3 className="a gd-pt">{ph.title}</h3>
                    <p className="gd-pb">{ph.body}</p>
                    <ul className="gd-lean">{ph.bullets.map((b, i) => <li key={i}><Rich text={b} /></li>)}</ul>
                    <Callout label={ph.slotLabel}><p><Rich text={ph.slot} /></p></Callout>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="faq" n={guide.faqSection.num} title={guide.faqSection.h2} lead={<Rich text={guide.faqSection.intro} />}>
            <Faq items={guide.faqs} />
          </Section>
        </ArticleBody>

        <EndBand
          title={guide.ctaLine}
          button={guide.endPrimaryLabel}
          secondary={{ href: '/readiness', label: <>{guide.endSecondaryLabel}<Icon name="arrow" sm /></> }}
          body={<>{guide.bridge.pre}<a href={guide.bridge.linkHref} target="_blank" rel="noopener noreferrer">{guide.bridge.linkText}</a>{guide.bridge.post}</>}
        />
      </AppShell>

      <style jsx global>{`
        .mk .gd-ans { max-width: 820px; margin-top: 24px; }
        .mk .gd-ans .sheet-bd p { font-size: 19px; line-height: 1.6; color: var(--ink); max-width: 66ch; }
        .mk .gd-ans .sheet-bd b { font-weight: 700; }
        .mk .gd-ans .sheet-hd h2 { color: var(--shelf); }
        .mk .gd-trust { display: grid; gap: 12px; margin-top: 16px; padding: 16px 20px; border-radius: var(--r-lg); background: var(--card); box-shadow: inset 0 0 0 1px var(--line); }
        .mk .gd-tm { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 20px; font-size: 16px; color: var(--ink-2); }
        .mk .gd-tm b { color: var(--ink); font-weight: 700; }
        .mk .gd-trust blockquote p { font-weight: 600; color: var(--ink); max-width: 60ch; }
        .mk .gd-trust .rev-c { margin-top: 4px; }
        .mk .gd-lede { margin-top: 24px; }
        .mk .gd-res { display: grid; gap: 12px; margin-top: 24px; }
        .mk .gd-res > li { display: grid; gap: 8px 20px; padding: 20px; border-radius: var(--r-lg); background: var(--card); box-shadow: 0 1px 2px var(--shadow-a), inset 0 0 0 1px var(--line); }
        .mk .gd-res .lbl { color: var(--shelf); }
        .mk .gd-rn { font: 700 21px/1.25 var(--f-sans); letter-spacing: -0.01em; }
        .mk .gd-and { font: 600 13px/1 var(--f-mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); }
        .mk .gd-use { margin-top: 8px; color: var(--ink-2); max-width: 60ch; }
        .mk .gd-use b { color: var(--ink); font-weight: 600; }
        .mk .gd-res .fine { margin-top: 8px; max-width: 60ch; }
        .mk .gd-fit { margin-top: 24px; }
        .mk .gd-fit .sheet-hd .lbl { display: inline-flex; align-items: center; gap: 8px; }
        .mk .gd-fit .prs { margin-top: 12px; }
        .mk .gd-h4 { margin-top: 32px; }
        .mk .gd-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .mk .gd-chips li { padding: 4px 12px; border-radius: 999px; background: var(--card-2); box-shadow: inset 0 0 0 1px var(--line); font: 500 15px/1.5 var(--f-mono); color: var(--ink-2); }
        .mk .gd-note { margin-top: 12px; max-width: 60ch; }
        .mk .gd-fit .tip { margin-top: 24px; }
        .mk .gd-q { margin-top: 24px; padding-left: 16px; box-shadow: inset 3px 0 0 var(--line-2); }
        .mk .gd-q blockquote p { font-weight: 600; color: var(--ink); max-width: 60ch; }
        .mk .gd-q figcaption { margin-top: 8px; }
        .mk .gd-cta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-top: 24px; padding-top: 24px; box-shadow: inset 0 1px 0 var(--line); }
        .mk .gd-plan { margin-top: 24px; }
        .mk .gd-pt { font-size: 21px; line-height: 1.3; letter-spacing: -0.01em; }
        .mk .gd-pb { margin-top: 8px; color: var(--ink-2); max-width: 60ch; }
        .mk .gd-lean { display: grid; gap: 8px; margin-top: 12px; }
        /* .mk .chain li (the numbered steps) is a descendant rule: reset it for the bullets inside */
        .mk .chain .gd-lean li { position: relative; display: block; padding: 0 0 0 20px; counter-increment: none; color: var(--ink-2); max-width: 60ch; }
        .mk .chain .gd-lean li::before { content: ""; position: absolute; left: 4px; top: 12px; width: 6px; height: 6px; border-radius: 50%; background: var(--shelf); box-shadow: none; z-index: auto; }
        .mk .chain .gd-lean li::after { content: none; }
        .mk .gd-lean b { color: var(--ink); font-weight: 600; }
        @media (min-width: 760px) {
          .mk .gd-res > li { grid-template-columns: 160px minmax(0, 1fr); align-items: start; }
          .mk .gd-res .lbl { padding-top: 6px; }
        }
      `}</style>
    </>
  );
}
