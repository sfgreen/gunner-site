import Head from 'next/head';
import Link from 'next/link';
import { Fragment, useEffect, useRef, useState } from 'react';
import SiteShell from '../SiteShell';
import QuickCheck from './QuickCheck';
import Calculator from './Calculator';
import PwStyles from './PwStyles';
import {
  Cites, Icon, NewTabNote, Rich, Source, StatusChip, StickyBar, StoreBand, StoreLink, plainText, sentence, useStickyBar,
} from './ui';
import { PATHWAYS_LIVE, articleSlot } from '../../lib/pathways/config';
import { endAnchor, forkAnchor, lookupOf, nodeAnchor } from '../../lib/pathways/view';
import type { ArticleVM, Block, ForkVM, Lookup, NextVM, OrderVM, StepVM } from '../../lib/pathways/view';

// /pathways/<slug>: one ED pathway as an article, from PATHWAY_ARTICLE_MOCK.html
// with the SITE_REDESIGN 3.4 changes (shuffled quick checks, four store slots
// plus the sticky, no crumb without a URL, fork rows that show the next step,
// AA label ink). Doses, forks, quick checks, conflicts, cases, calculators and
// sources come from the pathway JSON; the hero, short answer, section questions,
// checklist, rounds, traps and FAQ from its editorial layer. The page data holds
// each string once; `lk` (lib/pathways/view) resolves the references.

const BASE = 'https://stepgunner.com';

type Ctx = { sources: Source[]; lk: Lookup };

function Orders({ orders, ctx, head = true }: { orders: OrderVM[] | undefined; ctx: Ctx; head?: boolean }) {
  if (!orders || !orders.length) return null;
  return (
    <div className="pw-tw">
      <table className="pw-tab">
        {head && (
          <thead>
            <tr><th scope="col">Order</th><th scope="col">Dose and detail</th></tr>
          </thead>
        )}
        <tbody>
          {orders.map((o, i) => (
            <tr key={i}>
              <th scope="row">{o.item}</th>
              <td>
                <StatusChip status={o.status} />
                {o.dose}
                {o.note && <p className="pw-onote">{o.note}</p>}
                <Cites cites={ctx.lk.cites(o.cites)} sources={ctx.sources} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NextText({ next, lk }: { next: NextVM | undefined; lk: Lookup }) {
  const r = lk.next(next);
  if (r.kind === 'missing') return null;
  const body = r.anchor ? <a href={`#${r.anchor}`}>{r.text}</a> : <>{r.text}</>;
  if (r.kind === 'fork') return <>Next fork: {body}</>;
  if (r.kind === 'end') return <>Route ends: {body}</>;
  return body;
}

function Fork({ fork, ctx }: { fork: ForkVM; ctx: Ctx }) {
  return (
    <div className="pw-fork" id={forkAnchor(fork.id)}>
      <h3>
        <span className="pw-fk"><Icon name="branch" />Fork</span>
        {fork.label}
      </h3>
      <div className="pw-tw">
        <table className="pw-tab pw-forktab">
          <thead>
            <tr><th scope="col">Result</th><th scope="col">What it means</th><th scope="col">Next step</th></tr>
          </thead>
          <tbody>
            {fork.rows.map((r, k) => (
              <tr key={k}>
                <th scope="row">{r.result}</th>
                <td data-l="What it means">
                  {r.meaning || <span className="pw-muted">As stated</span>}
                  {(r.lead || r.out) && (
                    <p className="pw-ddx">
                      {r.lead && <>Leading: {r.lead.join(', ')}. </>}
                      {r.out && <>Struck: {r.out.join(', ')}.</>}
                    </p>
                  )}
                  {r.orders && (
                    <ul className="pw-olist" aria-label="Orders on this result">
                      {r.orders.map((o, i) => (
                        <li key={i}>
                          <StatusChip status={o.status} />
                          <b>{o.item}:</b> {o.dose}
                          {o.note && <p className="pw-onote">{o.note}</p>}
                          <Cites cites={ctx.lk.cites(o.cites)} sources={ctx.sources} />
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td data-l="Next step"><NextText next={r.next} lk={ctx.lk} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Step({ step, ctx }: { step: StepVM; ctx: Ctx }) {
  return (
    <div className="pw-step" id={nodeAnchor(step.id)}>
      <p className="pw-sk">{step.stage}</p>
      <h3>{step.ask}</h3>
      <p className="pw-nbs"><b>Next best step:</b> {sentence(step.chainStep)}</p>
      {step.note && <p className="pw-snote">{step.note}</p>}
      <Orders orders={step.orders} ctx={ctx} />
      {step.calcs && (
        <p className="pw-calclinks">
          Bedside math:{' '}
          {step.calcs.map((c, k) => (
            <Fragment key={c}>
              {k > 0 && ', '}
              <a href={`#calc-${c}`}>{ctx.lk.calc(c)?.title}</a>
            </Fragment>
          ))}
        </p>
      )}
      <QuickCheck id={step.id} ask={step.ask} options={step.options} answer={step.answer} why={step.why} cites={ctx.lk.cites(step.cites)} sources={ctx.sources} />
      {step.end && (
        <p className="pw-endline"><NextText next={step.end} lk={ctx.lk} /></p>
      )}
    </div>
  );
}

function BlockView({ block, ctx }: { block: Block; ctx: Ctx }) {
  const { lk } = ctx;
  if (block.kind === 'step') return <Step step={block} ctx={ctx} />;
  if (block.kind === 'fork') return <Fork fork={block} ctx={ctx} />;
  if (block.kind === 'forkIndex') {
    return (
      <ul className="pw-findex">
        {block.forks.map((id) => {
          const f = lk.fork(id);
          if (!f) return null;
          return (
            <li key={id}>
              <h3><a href={`#${forkAnchor(id)}`}>{f.label}</a></h3>
              <div className="pw-chips">{f.rows.map((r) => <span className="pw-gc" key={r.result}>{r.result}</span>)}</div>
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <ul className="pw-ends">
      {block.items.map((e) => (
        <li key={e.id} id={endAnchor(e.id)}>
          <p>{e.label && <b>{e.label}: </b>}{e.rest}</p>
          {e.from && (
            <p className="pw-from">
              Reached from:{' '}
              {e.from.map((f, k) => {
                const at = 'fork' in f
                  ? { label: lk.rowLabel(f.fork, f.row), anchor: forkAnchor(f.fork) }
                  : { label: lk.step(f.step)?.ask || '', anchor: nodeAnchor(f.step) };
                return (
                  <Fragment key={`${at.anchor}-${k}`}>
                    {k > 0 && '; '}
                    <a href={`#${at.anchor}`}>{at.label}</a>
                  </Fragment>
                );
              })}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function PathwayArticle({ vm }: { vm: ArticleVM }) {
  const url = `${BASE}/pathways/${vm.slug}`;
  const image = `${BASE}/og/pathways/${vm.slug}.png`;
  const sources: Source[] = vm.sources;
  // Built from the props alone, so the server render and hydration agree.
  const [lk] = useState(() => lookupOf(vm));
  const ctx: Ctx = { sources, lk };
  const live = PATHWAYS_LIVE;
  const slotCtx = { count: vm.appCount, term: vm.searchTerm, short: vm.short };
  const shortRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLElement>(null);
  const showSticky = useStickyBar(shortRef, endRef);
  const sticky = articleSlot('sticky', live, slotCtx);
  const caseCopy = articleSlot('case', live, slotCtx);

  // ---- on this page, with the section in view marked ----
  const toc: { id: string; label: string }[] = [
    ...(vm.shortAnswer.length ? [{ id: 'short', label: 'The short answer' }] : []),
    ...(vm.glance.length ? [{ id: 'glance', label: 'At a glance' }] : []),
    ...vm.sections.map((s) => ({ id: s.anchor, label: s.heading })),
    ...(vm.checklist ? [{ id: 'checklist', label: vm.checklist.heading }] : []),
    ...(vm.calculators.length ? [{ id: 'math', label: 'The bedside math' }] : []),
    ...(vm.rounds ? [{ id: 'rounds', label: 'On rounds' }] : []),
    ...(vm.traps.length ? [{ id: 'traps', label: 'Traps' }] : []),
    ...(vm.disagree.length ? [{ id: 'disagree', label: 'Where the guidelines disagree' }] : []),
    ...(vm.cases.length ? [{ id: 'patients', label: 'Practice patients' }] : []),
    ...(vm.faq.length ? [{ id: 'faq', label: 'FAQ' }] : []),
    { id: 'sources', label: 'Sources' },
  ];
  const [current, setCurrent] = useState<string>(toc[0]?.id || '');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const els = toc.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setCurrent(vis[0].target.id);
      },
      { rootMargin: '0px 0px -70% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // The page's sections never change after render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- structured data: exactly what the page shows ----
  // datePublished and dateModified are the article's `updated` date (the one
  // date the editorial carries). lastReviewed is Danny's sign-off date and
  // exists only once he has signed the pathway off; there is no reviewedBy
  // because the reviewer is the author.
  const author = { '@type': 'Person', name: 'Danny Varghese', url: `${BASE}/` };
  const publisher = { '@type': 'Organization', name: 'Step Gunner', legalName: 'Rezumab LLC', url: `${BASE}/` };
  const dates = vm.updated ? { datePublished: vm.updated, dateModified: vm.updated } : {};
  const pageLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': `${url}#page`,
    url,
    name: vm.seoTitle,
    headline: vm.h1,
    description: vm.metaDescription,
    inLanguage: 'en-US',
    image,
    audience: { '@type': 'MedicalAudience', audienceType: 'Medical students' },
    about: { '@type': 'MedicalCondition', name: vm.title },
    ...(vm.mentions.length ? { mentions: vm.mentions.map((d) => ({ '@type': 'MedicalCondition', name: d })) } : {}),
    author,
    publisher,
    citation: vm.sources.map((s) => s.url),
    ...dates,
    ...(vm.signedOff && vm.reviewedDate ? { lastReviewed: vm.reviewedDate } : {}),
    mainEntity: {
      '@type': 'Article',
      headline: vm.h1,
      description: vm.metaDescription,
      image,
      author,
      publisher,
      mainEntityOfPage: url,
      ...dates,
    },
  };
  const faqLd = vm.faq.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: vm.faq.map((f) => ({ '@type': 'Question', name: plainText(f.q), acceptedAnswer: { '@type': 'Answer', text: plainText(f.a) } })),
      }
    : null;
  const crumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
      { '@type': 'ListItem', position: 2, name: 'ED Pathways', item: `${BASE}/pathways` },
      { '@type': 'ListItem', position: 3, name: vm.short, item: url },
    ],
  };
  const ld = [pageLd, faqLd, crumbLd].filter(Boolean);

  const inline = articleSlot('inline', live, slotCtx);
  const tocSlot = articleSlot('toc', live, slotCtx);
  const endSlot = articleSlot('end', live, slotCtx);
  const store = { ct: vm.id, pageType: 'pathway' as const, page: vm.slug };

  return (
    <>
      <Head>
        <title>{vm.seoTitle}</title>
        <meta name="description" content={vm.metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#faf9f6" />
        {vm.draft && <meta name="robots" content="noindex" />}
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Step Gunner" />
        <meta property="og:title" content={vm.seoTitle} />
        <meta property="og:description" content={vm.metaDescription} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`Step Gunner ED pathway card, ${vm.title}`} />
        {vm.updated && <meta property="article:modified_time" content={vm.updated} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={vm.seoTitle} />
        <meta name="twitter:description" content={vm.metaDescription} />
        <meta name="twitter:image" content={image} />
        {ld.map((j, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j).replace(/</g, '\\u003c') }} />
        ))}
      </Head>
      <PwStyles />
      <div className="pw">
        <SiteShell campaign={vm.id} measure="wide" cta={{ label: 'Check readiness', href: '/readiness' }}>
          <NewTabNote />
          <div className="pw-grid">
            <article className="pw-main" aria-labelledby="pw-h1">
              <nav className="pw-crumb" aria-label="Breadcrumb">
                <ol>
                  <li><Link href="/">Home</Link></li>
                  <li><Link href="/pathways">ED Pathways</Link></li>
                  <li aria-current="page">{vm.short}</li>
                </ol>
              </nav>

              {vm.draft && (
                <div className="pw-draft" role="note">
                  <Icon name="warn" />
                  <p>
                    <b>Draft: not yet medically reviewed.</b> A preview, not indexed and not on the live site.
                    {vm.editorialPending && ' The article layer for this pathway is still being written; what shows is the pathway itself.'}
                    {vm.fixture && ' Editorial text here is the approved mock, standing in until the real file lands.'}
                  </p>
                </div>
              )}

              <p className="pw-eyebrow">ED pathway · {vm.worldLabel}</p>
              <h1 id="pw-h1">{vm.h1}</h1>
              {vm.dek && <p className="pw-dek"><Rich text={vm.dek} /></p>}
              <ul className="pw-meta">
                <li>By <b>Danny Varghese</b></li>
                {vm.updated && <li>Updated <b>{vm.updated}</b></li>}
                <li><b>{vm.counts.steps}</b> decision steps</li>
                <li><b>{vm.counts.forks}</b> forks</li>
                <li><b>{vm.counts.sources}</b> sources</li>
                <li>About {vm.counts.minutes} minutes</li>
              </ul>
              {vm.signedOff && (
                <p className="pw-reviewed">
                  <Icon name="shield" />
                  Medically reviewed by Danny Varghese{vm.reviewedDate ? `, ${vm.reviewedDate}` : ''}
                </p>
              )}

              {vm.jump.length > 0 && (
                <nav className="pw-jump" aria-label="Jump to a section">
                  {vm.jump.map((j) => (
                    <a key={j.anchor} href={`#${j.anchor}`}><span>{j.label}</span></a>
                  ))}
                </nav>
              )}

              <div className="pw-trust">
                <Icon name="check" />
                <p>Every dose and threshold below is quoted from the source it cites, and a second pass tried to break each fork. Where guidelines disagree, both sides are shown; where a source could not be read in full, the step says so.</p>
              </div>

              {vm.shortAnswer.length > 0 ? (
                <section className="pw-short" id="short" aria-labelledby="h-short" ref={shortRef}>
                  <h2 className="pw-k" id="h-short">The short answer</h2>
                  <ol>
                    {vm.shortAnswer.map((s, i) => (
                      <li key={i}><b><Rich text={s.lead} /></b> <Rich text={s.text} /></li>
                    ))}
                  </ol>
                </section>
              ) : (
                <span ref={shortRef} />
              )}

              <StoreBand copy={inline} loc="inline" {...store} />

              {vm.glance.length > 0 && (
                <section id="glance" aria-labelledby="h-glance">
                  <h2 className="pw-h2" id="h-glance">The algorithm at a glance</h2>
                  <p className="pw-intro">The typical route through this pathway, step by step, with the forks along the way.</p>
                  <ol className="pw-glance">
                    {vm.glance.map((g, i) => {
                      const st = lk.step(g.step);
                      return (
                        <li key={g.step}>
                          <span className="pw-gn" aria-hidden="true">{i + 1}</span>
                          <div>
                            <p className="pw-gs">{st?.stage}</p>
                            <p className="pw-gt"><a href={`#${nodeAnchor(g.step)}`}>{st?.chainStep}</a></p>
                            {g.forks.map((id) => {
                              const f = lk.fork(id);
                              if (!f) return null;
                              return (
                                <div className="pw-gf" key={id}>
                                  <a href={`#${forkAnchor(id)}`}><Icon name="branch" />{f.label}</a>
                                  {vm.glanceChips && (
                                    <div className="pw-chips">{f.rows.map((r) => <span className="pw-gc" key={r.result}>{r.result}</span>)}</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}

              {vm.sections.map((s) => (
                <section key={s.anchor} id={s.anchor} aria-labelledby={`h-${s.anchor}`}>
                  <h2 className="pw-h2" id={`h-${s.anchor}`}>{s.heading}</h2>
                  {s.intro && <p className="pw-intro"><Rich text={s.intro} /></p>}
                  {s.blocks.map((b, i) => <BlockView key={`${b.kind}-${i}`} block={b} ctx={ctx} />)}
                </section>
              ))}

              {vm.checklist && (
                <section id="checklist" aria-labelledby="h-checklist">
                  <h2 className="pw-h2" id="h-checklist">{vm.checklist.heading}</h2>
                  <ul className="pw-check">
                    {vm.checklist.items.map((it, i) => (
                      <li key={i}>
                        <Icon name="box" />
                        <p>{it.label && <b>{it.label}: </b>}<Rich text={it.text} /></p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {vm.calculators.length > 0 && (
                <section id="math" aria-labelledby="h-math">
                  <h2 className="pw-h2" id="h-math">The bedside math</h2>
                  <p className="pw-intro">
                    {vm.calculators.length === 1 ? 'The calculation' : `The ${vm.calculators.length} calculations`} this pathway uses, with the formulas, cutoffs and bands exactly as the cited sources give them. Change a value to recalculate.
                  </p>
                  <div className="pw-calcs">
                    {vm.calculators.map((c) => <Calculator key={c.id} calc={c} sources={sources} lk={lk} />)}
                  </div>
                </section>
              )}

              {vm.rounds && (
                <section id="rounds" aria-labelledby="h-rounds">
                  <h2 className="pw-h2" id="h-rounds">On rounds: how to present it, and what you will be asked</h2>
                  {vm.rounds.present && (
                    <div className="pw-present">
                      {vm.rounds.present.intro && <p className="pw-intro"><Rich text={vm.rounds.present.intro} /></p>}
                      <p className="pw-pk">{vm.rounds.present.oneLiner ? 'One-liner' : 'How to present it'}</p>
                      {vm.rounds.present.oneLiner && <p><Rich text={vm.rounds.present.oneLiner} /></p>}
                      {vm.rounds.present.paragraphs.map((t, i) => (
                        <p key={i}>{t.lead && <b>{t.lead}: </b>}<Rich text={t.text} /></p>
                      ))}
                      {vm.rounds.present.plan.length > 0 && (
                        <>
                          <p className="pw-pk">Assessment and plan</p>
                          <ol>
                            {vm.rounds.present.plan.map((x, i) => (
                              <li key={i}>{x.lead && <b><Rich text={x.lead} /> </b>}<Rich text={x.text} /></li>
                            ))}
                          </ol>
                        </>
                      )}
                    </div>
                  )}
                  {vm.rounds.pimp.length > 0 && (
                    <>
                      <h3 className="pw-h3">The pimp questions</h3>
                      <div className="pw-dets">
                        {vm.rounds.pimp.map((x, i) => (
                          <details key={i}>
                            <summary><span><Rich text={x.q} /></span><Icon name="chev" /></summary>
                            <p><Rich text={x.a} /></p>
                          </details>
                        ))}
                      </div>
                    </>
                  )}
                </section>
              )}

              {vm.traps.length > 0 && (
                <section id="traps" aria-labelledby="h-traps">
                  <h2 className="pw-h2" id="h-traps">Shelf and Step 2 traps, in one list</h2>
                  <ul className="pw-traps">
                    {vm.traps.map((t, i) => (
                      <li key={i}><Icon name="warn" /><p>{t.lead && <b>{t.lead} </b>}<Rich text={t.text} /></p></li>
                    ))}
                  </ul>
                </section>
              )}

              {vm.disagree.length > 0 && (
                <section id="disagree" aria-labelledby="h-disagree">
                  <h2 className="pw-h2" id="h-disagree">Where the guidelines disagree</h2>
                  <p className="pw-intro">A question can only key one answer. These are the places the sources split; each row links back to the step it sits on.</p>
                  <div className="pw-tw">
                    <table className="pw-tab">
                      <thead><tr><th scope="col">Question</th><th scope="col">What the sources say</th></tr></thead>
                      <tbody>
                        {vm.disagree.map((d, i) => {
                          const at = lk.order(d);
                          if (!at) return null;
                          return (
                            <tr key={i}>
                              <th scope="row">
                                {at.order.item}
                                <a className="pw-ctx" href={`#${at.anchor}`}>{at.context}</a>
                              </th>
                              <td>
                                <StatusChip status="conflict" />
                                {at.order.dose}
                                {at.order.note && <p className="pw-onote">{at.order.note}</p>}
                                <Cites cites={lk.cites(at.order.cites)} sources={sources} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {vm.cases.length > 0 && (
                <section id="patients" aria-labelledby="h-patients">
                  <h2 className="pw-h2" id="h-patients">Practice patients</h2>
                  <p className="pw-intro">
                    {vm.cases.length} of the {vm.counts.cases} patients in this pathway, chosen to walk the most forks between them. Open a fork to see the result and the next step.
                  </p>
                  {vm.cases.map((c) => (
                    <div className="pw-case" key={c.id}>
                      <p className="pw-sk">Practice patient</p>
                      <h3>{c.label}</h3>
                      <p className="pw-vig">{c.vignette}</p>
                      <div className="pw-dets">
                        {c.forks.map((f, i) => {
                          const fork = lk.fork(f.fork);
                          const row = fork?.rows[f.row];
                          if (!fork || !row) return null;
                          const next = lk.next(row.next).text;
                          return (
                            <details key={i}>
                              <summary><span>Fork {i + 1}: {fork.label}</span><Icon name="chev" /></summary>
                              <p>
                                {f.result && <>{sentence(f.result)} </>}
                                <b>{row.result}.</b>
                                {next && <> Next: {sentence(next)}</>}
                              </p>
                            </details>
                          );
                        })}
                      </div>
                      <StoreLink {...store} loc="case" className="pw-btn-quiet">
                        {caseCopy.button}<Icon name="arrow" />
                      </StoreLink>
                    </div>
                  ))}
                </section>
              )}

              {vm.faq.length > 0 && (
                <section id="faq" aria-labelledby="h-faq">
                  <h2 className="pw-h2" id="h-faq">Frequently asked questions</h2>
                  <div className="pw-dets">
                    {vm.faq.map((f, i) => (
                      <details key={i}>
                        <summary><span><Rich text={f.q} /></span><Icon name="chev" /></summary>
                        <p><Rich text={f.a} /></p>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              <section id="sources" aria-labelledby="h-sources">
                <h2 className="pw-h2" id="h-sources">Sources</h2>
                <ol className="pw-srcs">
                  {vm.sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="nofollow noopener noreferrer" aria-describedby="pw-newtab"><b>{s.label}</b></a>{' '}
                      {s.title}
                    </li>
                  ))}
                </ol>
              </section>

              <section id="related" aria-labelledby="h-related">
                <h2 className="pw-h2" id="h-related">{vm.related.length ? 'Related pathways' : 'Keep studying'}</h2>
                {vm.related.length > 0 && (
                  <div className="pw-rels">
                    {vm.related.map((r) => <Link key={r.slug} href={`/pathways/${r.slug}`}>{r.title}</Link>)}
                  </div>
                )}
                <div className="pw-also">
                  {vm.also.map((a) => (
                    <Link key={a.href} href={a.href}>
                      <span className="pw-sk">{a.kind}</span>
                      <b>{a.label}</b>
                    </Link>
                  ))}
                </div>
              </section>

              <StoreBand copy={endSlot} loc="end" {...store} bandRef={endRef} />
              <p className="pw-disc">For exam preparation, not clinical advice. Real patients get local protocols and a senior.</p>
            </article>

            <aside className="pw-toc" aria-label="On this page">
              <p className="pw-k">On this page</p>
              <ol>
                {toc.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} aria-current={current === t.id ? 'true' : undefined}>{t.label}</a>
                  </li>
                ))}
              </ol>
              <div className="pw-mini">
                <b>{tocSlot.heading}</b>
                {tocSlot.body && <p>{tocSlot.body}</p>}
                <StoreLink {...store} loc="toc" className="pw-btn-act pw-btn-block">{tocSlot.button}</StoreLink>
              </div>
            </aside>
          </div>
        </SiteShell>
        <StickyBar show={showSticky} heading={sticky.heading || ''} body={sticky.body} button={sticky.button} {...store} />
      </div>
    </>
  );
}
