import Head from 'next/head';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppShell, ArticleHeader, CtaCard, EndBand, Hero, Icon, NumberedSteps, StickyStoreBar, Wrap,
} from '../app';
import PwStyles from './PwStyles';
import { Mk } from './ui';
import { PATHWAYS_LIVE, hubSlot } from '../../lib/pathways/config';
import type { HubVM } from '../../lib/pathways/data';

// /pathways: every published pathway, grouped by world, in the app look of the
// /wards hub (header, top ask, search, cards by group, closing band). A search-
// as-you-type filter runs over titles and synonyms (the words students type:
// HONK, torsion, AMS). The query lives in ?q= so a filtered view is shareable;
// the canonical stays the bare hub. Filtering 34 items in memory keeps every
// keystroke well inside an INP budget, with no network.
//
// Sixteen worlds hold 34 pathways, half of them one card, so each group is a
// row: its name in a left column, its cards beside it (stacked on phones).

const BASE = 'https://stepgunner.com';
const CT = 'pw_hub';
const OG = 'https://stepgunner.com/og/pathways/index.png';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9%.]+/g, ' ').trim();

export default function PathwaysHub({ vm }: { vm: HubVM }) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
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

  // "/" focuses the search from anywhere on the page.
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
  const inline = hubSlot('inline', live);
  const end = hubSlot('end', live);
  const sticky = hubSlot('sticky', live);
  const h1 = 'ED pathways for Step 2 CK and EM rotations';

  return (
    <AppShell
      campaign={CT}
      page="pathways"
      pageType="hub"
      navCta={{ label: 'Check readiness', href: '/readiness' }}
      sticky={<StickyStoreBar title={sticky.heading || ''} sub={sticky.body} button={sticky.button} />}
    >
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
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
      <div className="pw-a">
        <Hero>
          {drafts > 0 && (
            <Mk>
              <div className="pw-draft" role="note">
                <Icon name="warn" sm />
                <p>
                  <b>{drafts === total ? 'Draft: none of these pathways is published yet.' : `${drafts} of ${total} pathways are unpublished drafts.`}</b> A preview, not indexed and not on the live site; on production only published pathways are listed.
                </p>
              </div>
            </Mk>
          )}
          <ArticleHeader
            category="ed"
            crumb={[{ label: 'ED Pathways' }]}
            eyebrow="ED pathways"
            title={h1}
            accent="for Step 2 CK and EM rotations"
            dek={dek}
            meta={[
              <><b>{total}</b> presentations</>,
              <><b>{vm.counts.cases}</b> practice patients</>,
              <><b>{vm.counts.sources}</b> cited sources</>,
            ]}
          />
          <CtaCard title={inline.heading} sub={inline.body} button={inline.button} loc="inline" placement="inline" stickyStart />
          <Mk>
            <div className="find pw-find">
              <label className="lbl" htmlFor="pw-q">Find a presentation</label>
              <div className="sbox">
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
                <kbd className="pw-kbd" aria-hidden="true">/</kbd>
              </div>
            </div>
            <p className="lbl count" id="pw-count" aria-live="polite">
              {terms.length ? `${shown} of ${total} match` : `${total} presentations`}
            </p>
          </Mk>
        </Hero>

        <Wrap>
          <div className="pw-groups">
            {groups.map((g) => (
              <section className="pw-grp" key={g.world} aria-labelledby={`w-${g.world}`}>
                <div className="pw-grp-hd">
                  <h2 className="pw-grp-t" id={`w-${g.world}`}>{g.label}</h2>
                  <p className="lbl">{g.cards.length} {g.cards.length === 1 ? 'pathway' : 'pathways'}</p>
                </div>
                <ul className="pw-cards">
                  {g.cards.map((c) => (
                    <li key={c.slug}>
                      <div className="card pw-hc">
                        <h3 className="pw-hct"><a href={`/pathways/${c.slug}`}>{c.title}</a></h3>
                        {(c.first || c.trap) && (
                          <dl className="pw-hdl">
                            {c.first && <div><dt className="lbl">First</dt><dd>{c.first}</dd></div>}
                            {c.trap && <div><dt className="lbl">Trap</dt><dd>{c.trap}</dd></div>}
                          </dl>
                        )}
                        <p className="card-f">
                          <span className="pw-hcm">
                            <span>{c.steps} steps</span>
                            <span>{c.cases} patients</span>
                            {c.draft && <span className="pw-tag">{c.pending ? 'Draft, editorial pending' : 'Draft'}</span>}
                          </span>
                          <span className="go" aria-hidden="true">Open<Icon name="arrow" sm /></span>
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {shown === 0 && (
              <div className="empty">
                <p><b>No presentation matches that yet.</b></p>
                <p>Search a symptom (chest pain), a finding (stridor), a drug (naloxone) or an eponym (Fournier). Every pathway carries the synonyms students type.</p>
                <button type="button" className="btn btn-q" onClick={() => { setQ(''); inputRef.current?.focus(); }}>Clear the search</button>
              </div>
            )}
          </div>
          <section className="asec pw-how" aria-labelledby="how-h">
            <div className="s-hd"><h2 className="h-2" id="how-h">How the ED question is built</h2></div>
            <NumberedSteps
              steps={[
                { text: <><b>Is the patient unstable?</b> Shock, a threatened airway or a falling GCS gets its own route before any diagnosis.</> },
                { text: <><b>What is the one bedside test?</b> If the stem has not given you its result, ordering it is usually the answer.</> },
                { text: <><b>Does treatment beat the test?</b> Tension pneumothorax, anaphylaxis, meningitis and cord compression from cancer are treated before anyone images them.</> },
                { text: <><b>Which result is the fork?</b> The stem hands you a number; the answer changes on which side of the line it falls.</> },
                { text: <><b>Where is the trap?</b> Usually a contraindication, or a test that delays treatment.</> },
              ]}
            />
          </section>
        </Wrap>

        <EndBand
          kicker={end.kicker}
          title={end.heading}
          body={end.body}
          button={end.button}
          secondary={{ href: '/readiness', label: 'Run the readiness check' }}
        />
        <Wrap><p className="disc">For exam preparation, not clinical advice. Real patients get local protocols and a senior.</p></Wrap>
      </div>
    </AppShell>
  );
}
