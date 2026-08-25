import Head from 'next/head';
import SiteShell from './SiteShell';
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
`}</style>

      <SiteShell campaign={`guides_${meta.slug}`} measure="article">
        <div className="wrap">
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
        </div>
      </SiteShell>

      <div className={`stickybar${stickyShow ? ' show' : ''}`}>
        <div className="sb-inner">
          <span className="sb-label">{guide.sticky.label}</span>
          <a href="/readiness" className="sb-cta">{guide.sticky.cta}</a>
        </div>
      </div>
    </>
  );
}
