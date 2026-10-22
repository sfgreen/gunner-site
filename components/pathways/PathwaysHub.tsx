import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import SiteShell from '../SiteShell';
import PwStyles from './PwStyles';
import { Icon, StickyBar, StoreBand } from './ui';
import { PATHWAYS_LIVE, hubSlot } from '../../lib/pathways/config';
import type { HubVM } from '../../lib/pathways/data';

// /pathways: every published pathway, grouped by world, with a search-as-you-type
// filter over titles and synonyms (the words students type: HONK, torsion, AMS).
// The query lives in ?q= so a filtered view is shareable; the canonical stays
// the bare hub. Filtering 34 items in memory keeps every keystroke well inside
// an INP budget, with no network.

const BASE = 'https://stepgunner.com';
const CT = 'pw_hub';
const OG = 'https://stepgunner.com/og/pathways/index.png';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9%.]+/g, ' ').trim();

export default function PathwaysHub({ vm }: { vm: HubVM }) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLElement>(null);
  const live = PATHWAYS_LIVE;

  // ?q= in, ?q= out, without a navigation per keystroke.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q');
    if (initial) setQ(initial);
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (q.trim()) url.searchParams.set('q', q.trim());
    else url.searchParams.delete('q');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }, [q]);

  // "/" focuses the search from anywhere on the page, as on the redesign mock.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const terms = norm(q).split(' ').filter(Boolean);
  const groups = useMemo(
    () => vm.groups
      .map((g) => ({ ...g, cards: g.cards.filter((c) => terms.every((t) => norm(c.haystack).includes(t))) }))
      .filter((g) => g.cards.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, vm.groups],
  );
  const shown = groups.reduce((a, g) => a + g.cards.length, 0);
  const total = vm.counts.pathways;

  const [sticky, setSticky] = useState(false);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const a = searchRef.current;
      const e = endRef.current;
      if (!a || !e) return;
      setSticky(a.getBoundingClientRect().bottom < 0 && !(e.getBoundingClientRect().top < window.innerHeight - 40));
    };
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Search intent first: students type "ED algorithms" and "EM rotation", and
  // the ED study guide (/step-2-ck-emergency-medicine) already owns "Step 2 CK
  // emergency medicine", so this page leads with pathways and algorithms.
  const title = `ED Pathways for Step 2 CK and EM Rotations: ${total} Algorithms`;
  const description = `${total} ED algorithms for Step 2 CK and your EM rotation: the first move, each fork and its thresholds, and every dose quoted from the source it cites.`;
  const dek = `${total} emergency presentations as branching algorithms: the first move, each fork and the threshold that decides it, the orders with their doses, and the source line behind every one. For Step 2 CK and for the shift.`;
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url: `${BASE}/pathways`,
      image: OG,
      inLanguage: 'en-US',
      author: { '@type': 'Person', name: 'Danny Varghese', url: `${BASE}/` },
      publisher: { '@type': 'Organization', name: 'Step Gunner', legalName: 'Rezumab LLC', url: `${BASE}/` },
      ...(vm.updated ? { dateModified: vm.updated } : {}),
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: vm.groups.flatMap((g) => g.cards).map((c, i) => ({
          '@type': 'ListItem', position: i + 1, name: c.title, url: `${BASE}/pathways/${c.slug}`,
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
        { '@type': 'ListItem', position: 2, name: 'ED Pathways', item: `${BASE}/pathways` },
      ],
    },
  ];
  const drafts = vm.groups.reduce((a, g) => a + g.cards.filter((c) => c.draft).length, 0);
  const stickyCopy = hubSlot('sticky', live);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#faf9f6" />
        {vm.noindex && <meta name="robots" content="noindex" />}
        <link rel="canonical" href={`${BASE}/pathways`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Step Gunner" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${BASE}/pathways`} />
        <meta property="og:image" content={OG} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="ED pathways for Step 2 CK and EM rotations, Step Gunner" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={OG} />
        {ld.map((j, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j).replace(/</g, '\\u003c') }} />
        ))}
      </Head>
      <PwStyles />
      <div className="pw">
        <SiteShell campaign={CT} measure="wide" cta={{ label: 'Check readiness', href: '/readiness' }}>
          <div className="pw-hub">
            <nav className="pw-crumb" aria-label="Breadcrumb">
              <ol>
                <li><Link href="/">Home</Link></li>
                <li aria-current="page">ED Pathways</li>
              </ol>
            </nav>
            {drafts > 0 && (
              <div className="pw-draft" role="note">
                <Icon name="warn" />
                <p>
                  <b>{drafts === total ? 'Draft: none of these pathways is published yet.' : `${drafts} of ${total} pathways are unpublished drafts.`}</b> A preview, not indexed and not on the live site; on production only published pathways are listed.
                </p>
              </div>
            )}
            <p className="pw-eyebrow">ED pathways</p>
            <h1>ED pathways for Step 2 CK and EM rotations</h1>
            <p className="pw-dek">{dek}</p>
            <ul className="pw-meta">
              <li>By <b>Danny Varghese</b></li>
              <li><b>{total}</b> presentations</li>
              <li><b>{vm.counts.cases}</b> practice patients</li>
              <li><b>{vm.counts.sources}</b> cited sources</li>
            </ul>

            <div className="pw-search" ref={searchRef}>
              <label htmlFor="pw-q">Find a presentation</label>
              <div className="pw-sbox">
                <Icon name="search" />
                <input
                  id="pw-q"
                  ref={inputRef}
                  type="search"
                  placeholder="Try HONK or torsion"
                  autoComplete="off"
                  spellCheck={false}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setQ(''); }}
                  aria-describedby="pw-count"
                />
                <kbd aria-hidden="true">/</kbd>
              </div>
            </div>
            <p className="pw-count" id="pw-count" aria-live="polite">
              {terms.length ? `${shown} of ${total} match` : `${total} presentations`}
            </p>

            {groups.map((g) => (
              <section className="pw-group" key={g.world} aria-labelledby={`w-${g.world}`}>
                <h2 id={`w-${g.world}`}>{g.label}</h2>
                <ul className="pw-cards">
                  {g.cards.map((c) => (
                    <li className="pw-card" key={c.slug}>
                      <h3><Link href={`/pathways/${c.slug}`}>{c.title}</Link></h3>
                      <dl>
                        {c.first && (<><dt>First</dt><dd>{c.first}</dd></>)}
                        {c.trap && (<><dt>Trap</dt><dd>{c.trap}</dd></>)}
                      </dl>
                      <p className="pw-card-meta">
                        <span>{c.steps} steps</span>
                        <span>{c.cases} patients</span>
                        {c.draft && <span className="pw-tag">{c.pending ? 'Draft, editorial pending' : 'Draft'}</span>}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {shown === 0 && (
              <div className="pw-empty">
                <h2>No presentation matches that yet.</h2>
                <p>Search a symptom (chest pain), a finding (stridor), a drug (naloxone) or an eponym (Fournier). Every pathway carries the synonyms students type.</p>
                <button type="button" onClick={() => { setQ(''); inputRef.current?.focus(); }}>Clear the search</button>
              </div>
            )}

            <StoreBand copy={hubSlot('inline', live)} ct={CT} loc="inline" pageType="hub" page="pathways" />

            <h2 className="pw-h2">How the ED question is built</h2>
            <ol className="pw-rules">
              <li><b>Is the patient unstable?</b> Shock, a threatened airway or a falling GCS gets its own route before any diagnosis.</li>
              <li><b>What is the one bedside test?</b> If the stem has not given you its result, ordering it is usually the answer.</li>
              <li><b>Does treatment beat the test?</b> Tension pneumothorax, anaphylaxis, meningitis and cord compression from cancer are treated before anyone images them.</li>
              <li><b>Which result is the fork?</b> The stem hands you a number; the answer changes on which side of the line it falls.</li>
              <li><b>Where is the trap?</b> Usually a contraindication, or a test that delays treatment.</li>
            </ol>

            <StoreBand
              copy={hubSlot('end', live)} ct={CT} loc="end" pageType="hub" page="pathways" bandRef={endRef}
              secondary={{ href: '/readiness', label: 'Run the readiness check' }}
            />
            <p className="pw-disc">For exam preparation, not clinical advice. Real patients get local protocols and a senior.</p>
          </div>
        </SiteShell>
        <StickyBar show={sticky} heading={stickyCopy.heading || ''} body={stickyCopy.body} button={stickyCopy.button} ct={CT} pageType="hub" page="pathways" />
      </div>
    </>
  );
}
