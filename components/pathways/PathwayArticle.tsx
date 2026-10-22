import Head from 'next/head';
import { Fragment, ReactNode, useState } from 'react';
import {
  AppShell, ArticleBody, ArticleHeader, Callout, CtaCard, DrillCard, EndBand, Faq, faqJsonLd, Hero, Icon,
  NumberedSteps, Rich, Section, Stage, StickyStoreBar, StoreButton, Table, Wrap,
} from '../app';
import QuickChecks from './QuickChecks';
import Calculator from './Calculator';
import PwStyles from './PwStyles';
import { CellLabel, Cites, Mk, NewTabNote, PwIcon, Source, SourceLine, StatusChip, sentence } from './ui';
import { PATHWAYS_LIVE, articleSlot } from '../../lib/pathways/config';
import { endAnchor, forkAnchor, lookupOf, nodeAnchor } from '../../lib/pathways/view';
import type { ArticleVM, Block, ForkVM, Lookup, NextVM, OrderVM, StepVM } from '../../lib/pathways/view';

// /pathways/<slug>: one ED pathway as an article, in the app look (components/app,
// the recipe in its README; the ABG article is the nearest page). The opening is
// the ArticleHeader, the trust line and the top ask; the dark Stage band holds the
// interactive heart: the algorithm at a glance and every step's quick check; the
// article body numbers its sections beside the sticky contents list, with the
// calculators as dark app cards in "The bedside math". Doses, forks, quick checks,
// conflicts, cases, calculators and sources come from the pathway JSON; the
// hero, short answer, section questions, checklist, rounds, traps and FAQ from
// its editorial layer. The page data holds each string once; `lk`
// (lib/pathways/view) resolves the references.
//
// Store slots (GA4 store_click location): inline (the top card), toc (the card
// under the contents list), case (each practice patient), end (the closing
// band), sticky (phones). While PATHWAYS_LIVE is false every one of them sells
// the Next Best Step drills, never ED Pathways in the app.

const BASE = 'https://stepgunner.com';

type Ctx = { sources: Source[]; lk: Lookup };

/** The accent half of a pathway H1: everything after its first ": ". */
const accentOf = (h1: string): string | undefined => {
  const i = h1.indexOf(': ');
  return i > 0 ? h1.slice(i + 2) : undefined;
};

const nn = (i: number) => String(i).padStart(2, '0');

function OrderCell({ o, ctx }: { o: OrderVM; ctx: Ctx }) {
  return (
    <>
      <StatusChip status={o.status} />
      {o.dose}
      {o.note && <span className="pw-onote">{o.note}</span>}
      <Cites cites={ctx.lk.cites(o.cites)} sources={ctx.sources} />
    </>
  );
}

function Orders({ orders, ctx, label }: { orders: OrderVM[] | undefined; ctx: Ctx; label: string }) {
  if (!orders || !orders.length) return null;
  return (
    <div className="pw-tbl pw-t2">
      <Table
        label={label}
        head={['Order', 'Dose and detail']}
        rows={orders.map((o) => [o.item, <OrderCell key="d" o={o} ctx={ctx} />])}
      />
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
  const id = forkAnchor(fork.id);
  return (
    <div className="pw-fork" id={id}>
      <p className="lbl pw-fk"><PwIcon name="branch" />Fork</p>
      <h3 className="pw-fh">{fork.label}</h3>
      <div className="pw-tbl pw-t3">
        <Table
          label={`Fork: ${fork.label}`}
          head={['Result', 'What it means', 'Next step']}
          rows={fork.rows.map((r) => [
            r.result,
            <Fragment key="m">
              <CellLabel>What it means</CellLabel>
              {r.meaning || <span className="pw-muted">As stated</span>}
              {(r.lead || r.out) && (
                <span className="pw-ddx">
                  {r.lead && <>Leading: {r.lead.join(', ')}. </>}
                  {r.out && <>Struck: {r.out.join(', ')}.</>}
                </span>
              )}
              {r.orders && (
                <ul className="pw-olist" aria-label="Orders on this result">
                  {r.orders.map((o, i) => (
                    <li key={i}>
                      <StatusChip status={o.status} />
                      <b>{o.item}:</b> {o.dose}
                      {o.note && <span className="pw-onote">{o.note}</span>}
                      <Cites cites={ctx.lk.cites(o.cites)} sources={ctx.sources} />
                    </li>
                  ))}
                </ul>
              )}
            </Fragment>,
            <Fragment key="n"><CellLabel>Next step</CellLabel><NextText next={r.next} lk={ctx.lk} /></Fragment>,
          ])}
        />
      </div>
    </div>
  );
}

function Step({ step, ctx }: { step: StepVM; ctx: Ctx }) {
  const id = nodeAnchor(step.id);
  return (
    <article className="pw-step" id={id} aria-labelledby={`${id}-h`}>
      <p className="lbl">{step.stage}</p>
      <h3 className="pw-sh" id={`${id}-h`}>{step.ask}</h3>
      <p className="pw-nbs"><b>Next best step:</b> {sentence(step.chainStep)}</p>
      {step.note && <p className="pw-note">{step.note}</p>}
      <Orders orders={step.orders} ctx={ctx} label={`Orders: ${step.ask}`} />
      {step.calcs && (
        <p className="pw-mathl">
          Bedside math:{' '}
          {step.calcs.map((c, k) => (
            <Fragment key={c}>
              {k > 0 && ', '}
              <a href={`#calc-${c}`}>{ctx.lk.calc(c)?.title}</a>
            </Fragment>
          ))}
        </p>
      )}
      {step.end && <p className="pw-endl"><NextText next={step.end} lk={ctx.lk} /></p>}
    </article>
  );
}

function BlockView({ block, ctx }: { block: Block; ctx: Ctx }) {
  const { lk } = ctx;
  if (block.kind === 'step') return <Step step={block} ctx={ctx} />;
  if (block.kind === 'fork') return <Fork fork={block} ctx={ctx} />;
  if (block.kind === 'forkIndex') {
    return (
      <ul className="pw-fx">
        {block.forks.map((id) => {
          const f = lk.fork(id);
          if (!f) return null;
          return (
            <li key={id}>
              <h3 className="pw-fxh"><a href={`#${forkAnchor(id)}`}><PwIcon name="branch" />{f.label}</a></h3>
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

/** The typical route: each step on it and the forks right after, linked into the article. */
function Glance({ vm, lk }: { vm: ArticleVM; lk: Lookup }) {
  return (
    <section className="sheet dark-card" id="glance" aria-labelledby="glance-h">
      <div className="sheet-hd">
        <h2 className="lbl" id="glance-h">The algorithm at a glance</h2>
      </div>
      <div className="sheet-bd">
        <p className="pw-gli">The typical route through this pathway, step by step, with the forks along the way.</p>
        <ol className="pw-route">
          {vm.glance.map((g, i) => {
            const st = lk.step(g.step);
            return (
              <li key={g.step}>
                <span className="pw-rn num" aria-hidden="true">{i + 1}</span>
                <div className="pw-rb">
                  <p className="lbl">{st?.stage}</p>
                  <p className="pw-rt"><a href={`#${nodeAnchor(g.step)}`}>{st?.chainStep}</a></p>
                  {g.forks.map((id) => {
                    const f = lk.fork(id);
                    if (!f) return null;
                    return (
                      <div className="pw-rf" key={id}>
                        <a href={`#${forkAnchor(id)}`}><PwIcon name="branch" />{f.label}</a>
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
      </div>
    </section>
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
  const inline = articleSlot('inline', live, slotCtx);
  const tocSlot = articleSlot('toc', live, slotCtx);
  const endSlot = articleSlot('end', live, slotCtx);
  const sticky = articleSlot('sticky', live, slotCtx);
  const caseCopy = articleSlot('case', live, slotCtx);
  const steps = vm.sections.flatMap((s) => s.blocks.filter((b): b is StepVM => b.kind === 'step'));

  // ---- the numbered sections, and the contents list beside them ----
  // A section's contents label is its jump link (the short name the editorial
  // gives it: "First moves", "Criteria") where it has one, else its question.
  const jumpLabel = new Map(vm.jump.map((j) => [j.anchor, j.label]));
  type Sec = { id: string; toc: string; title: ReactNode; lead?: ReactNode; body: ReactNode };
  const secs: Sec[] = [];
  if (vm.shortAnswer.length) {
    secs.push({
      id: 'short', toc: 'The short answer', title: 'The short answer',
      body: (
        <NumberedSteps
          steps={vm.shortAnswer.map((s) => ({
            text: <><b><Rich text={s.lead} /></b> <Rich text={s.text} /></>,
            cite: s.src && s.src.length ? <SourceLine src={s.src} sources={sources} /> : undefined,
          }))}
        />
      ),
    });
  }
  for (const s of vm.sections) {
    secs.push({
      id: s.anchor, toc: jumpLabel.get(s.anchor) || s.heading, title: s.heading,
      lead: s.intro ? <Rich text={s.intro} /> : undefined,
      body: s.blocks.map((b, i) => <BlockView key={`${b.kind}-${i}`} block={b} ctx={ctx} />),
    });
  }
  if (vm.checklist) {
    secs.push({
      id: 'checklist', toc: jumpLabel.get('checklist') || vm.checklist.heading, title: vm.checklist.heading,
      body: (
        <ul className="pw-check">
          {vm.checklist.items.map((it, i) => (
            <li key={i}>
              <PwIcon name="box" sm={false} />
              <p>{it.label && <b>{it.label}: </b>}<Rich text={it.text} /></p>
            </li>
          ))}
        </ul>
      ),
    });
  }
  if (vm.calculators.length) {
    secs.push({
      id: 'math', toc: 'The bedside math', title: 'The bedside math',
      lead: <>{vm.calculators.length === 1 ? 'The calculation' : `The ${vm.calculators.length} calculations`} this pathway uses, with the formulas, cutoffs and bands exactly as the cited sources give them. Change a value to recalculate.</>,
      body: <div className="pw-calcs">{vm.calculators.map((c) => <Calculator key={c.id} calc={c} sources={sources} lk={lk} />)}</div>,
    });
  }
  if (vm.rounds) {
    const pr = vm.rounds.present;
    secs.push({
      id: 'rounds', toc: 'On rounds', title: 'On rounds: how to present it, and what you will be asked',
      body: (
        <>
          {pr && (
            <>
              {pr.intro && <p className="prs"><Rich text={pr.intro} /></p>}
              <div className="script pw-present">
                <p className="lbl">{pr.oneLiner ? 'One-liner' : 'How to present it'}</p>
                {pr.oneLiner && <p><Rich text={pr.oneLiner} /></p>}
                {pr.paragraphs.map((t, i) => (
                  <p key={i}>{t.lead && <b>{t.lead}: </b>}<Rich text={t.text} /></p>
                ))}
                {pr.plan.length > 0 && (
                  <>
                    <p className="lbl">Assessment and plan</p>
                    <ol className="pw-plan">
                      {pr.plan.map((x, i) => (
                        <li key={i}>{x.lead && <b><Rich text={x.lead} /> </b>}<Rich text={x.text} /></li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
            </>
          )}
          {vm.rounds.pimp.length > 0 && (
            <>
              <h3 className="h-3 subh">The pimp questions</h3>
              <div className="faq">
                {vm.rounds.pimp.map((x, i) => (
                  <details key={i}>
                    <summary><span><Rich text={x.q} /></span><Icon name="plus" sm /></summary>
                    <div className="fa"><p><Rich text={x.a} /></p></div>
                  </details>
                ))}
              </div>
            </>
          )}
        </>
      ),
    });
  }
  if (vm.traps.length) {
    secs.push({
      id: 'traps', toc: 'Traps', title: 'Shelf and Step 2 traps, in one list',
      body: (
        <div className="pw-traps">
          {vm.traps.map((t, i) => (
            <Callout key={i} tone="trap" title={t.lead || undefined}><p><Rich text={t.text} /></p></Callout>
          ))}
        </div>
      ),
    });
  }
  if (vm.disagree.length) {
    const rows = vm.disagree.map((d) => lk.order(d)).filter(Boolean) as NonNullable<ReturnType<Lookup['order']>>[];
    secs.push({
      id: 'disagree', toc: 'Where the guidelines disagree', title: 'Where the guidelines disagree',
      lead: 'A question can only key one answer. These are the places the sources split; each row links back to the step it sits on.',
      body: (
        <div className="pw-tbl pw-t2">
          <Table
            label="Where the guidelines disagree"
            head={['Question', 'What the sources say']}
            rows={rows.map((at) => [
              <Fragment key="q">{at.order.item}<a className="pw-ctx" href={`#${at.anchor}`}>{at.context}</a></Fragment>,
              <OrderCell key="d" o={{ ...at.order, status: 'conflict' }} ctx={ctx} />,
            ])}
          />
        </div>
      ),
    });
  }
  if (vm.cases.length) {
    secs.push({
      id: 'patients', toc: 'Practice patients', title: 'Practice patients',
      lead: <>{vm.cases.length} of the {vm.counts.cases} patients in this pathway, chosen to walk the most forks between them. Open a fork to see the result and the next step.</>,
      body: vm.cases.map((c) => (
        <div className="pw-case" key={c.id}>
          <p className="lbl">Practice patient</p>
          <h3 className="pw-sh">{c.label}</h3>
          <p className="vig">{c.vignette}</p>
          <div className="faq">
            {c.forks.map((f, i) => {
              const fork = lk.fork(f.fork);
              const row = fork?.rows[f.row];
              if (!fork || !row) return null;
              const next = lk.next(row.next).text;
              return (
                <details key={i}>
                  <summary><span>Fork {i + 1}: {fork.label}</span><Icon name="plus" sm /></summary>
                  <div className="fa">
                    <p>
                      {f.result && <>{sentence(f.result)} </>}
                      <b>{row.result}.</b>
                      {next && <> Next: {sentence(next)}</>}
                    </p>
                  </div>
                </details>
              );
            })}
          </div>
          <div className="pw-case-a">
            <StoreButton loc="case" variant="q">{caseCopy.button}<Icon name="arrow" sm /></StoreButton>
          </div>
        </div>
      )),
    });
  }
  if (vm.faq.length) {
    secs.push({ id: 'faq', toc: 'FAQ', title: 'Frequently asked questions', body: <Faq items={vm.faq} /> });
  }
  secs.push({
    id: 'sources', toc: 'Sources', title: 'Sources',
    body: (
      <div className="refs pw-refs">
        <ol>
          {vm.sources.map((s) => (
            <li key={s.url}>
              <span>
                <a href={s.url} target="_blank" rel="nofollow noopener noreferrer" aria-describedby="pw-newtab"><b>{s.label}</b></a>{' '}
                {s.title}
              </span>
            </li>
          ))}
        </ol>
      </div>
    ),
  });
  secs.push({
    id: 'related', toc: 'Related', title: vm.related.length ? 'Related pathways' : 'Keep studying',
    body: (
      <div className="rel">
        {vm.related.map((r) => (
          <a key={r.slug} href={`/pathways/${r.slug}`}>
            <span className="lbl">ED pathway</span><span className="rt">{r.title}</span><Icon name="arrow" sm />
          </a>
        ))}
        {vm.also.map((a) => (
          <a key={a.href} href={a.href}>
            <span className="lbl">{a.kind}</span><span className="rt">{a.label}</span><Icon name="arrow" sm />
          </a>
        ))}
      </div>
    ),
  });

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
  const crumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
      { '@type': 'ListItem', position: 2, name: 'ED Pathways', item: `${BASE}/pathways` },
      { '@type': 'ListItem', position: 3, name: vm.short, item: url },
    ],
  };
  const ld = [pageLd, vm.faq.length ? faqJsonLd(vm.faq) : null, crumbLd].filter(Boolean);

  const meta: ReactNode[] = [
    ...(vm.updated ? [<>Updated <b>{vm.updated}</b></>] : []),
    <><b>{vm.counts.steps}</b> decision steps</>,
    <><b>{vm.counts.forks}</b> forks</>,
    <><b>{vm.counts.sources}</b> sources</>,
    <>About {vm.counts.minutes} minutes</>,
  ];

  return (
    <AppShell
      campaign={vm.id}
      page={vm.slug}
      pageType="pathway"
      navCta={{ label: 'Check readiness', href: '/readiness' }}
      sticky={<StickyStoreBar title={sticky.heading || ''} sub={sticky.body} button={sticky.button} />}
    >
      <Head>
        <title>{vm.seoTitle}</title>
        <meta name="description" content={vm.metaDescription} />
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
      <NewTabNote />
      <div className="pw-a">
        <Hero>
          {vm.draft && (
            <Mk>
              <div className="pw-draft" role="note">
                <Icon name="warn" sm />
                <p>
                  <b>Draft: not yet medically reviewed.</b> A preview, not indexed and not on the live site.
                  {vm.editorialPending && ' The article layer for this pathway is still being written; what shows is the pathway itself.'}
                  {vm.fixture && ' Editorial text here is the approved mock, standing in until the real file lands.'}
                </p>
              </div>
            </Mk>
          )}
          <ArticleHeader
            category="ed"
            crumb={[{ href: '/pathways', label: 'ED Pathways' }, { label: vm.short }]}
            eyebrow={<>ED pathway · {vm.worldLabel}</>}
            title={vm.h1}
            accent={accentOf(vm.h1)}
            dek={vm.dek ? <Rich text={vm.dek} /> : undefined}
            meta={meta}
            reviewed={vm.signedOff ? `Medically reviewed by Danny Varghese${vm.reviewedDate ? `, ${vm.reviewedDate}` : ''}` : undefined}
          />
          <Mk>
            <p className="disc-top pw-trust">
              <Icon name="checkc" sm />
              <span>Every dose and threshold below is quoted from the source it cites, and a second pass tried to break each fork. Where guidelines disagree, both sides are shown; where a source could not be read in full, the step says so.</span>
            </p>
          </Mk>
          <CtaCard title={inline.heading} sub={inline.body} button={inline.button} loc="inline" stickyStart />
        </Hero>

        <Stage>
          <div className="pw-sg">
            {vm.glance.length > 0 && <Glance vm={vm} lk={lk} />}
            <QuickChecks steps={steps} lk={lk} sources={sources} page={vm.slug} />
          </div>
        </Stage>

        <ArticleBody
          toc={secs.map((s) => [s.id, s.toc] as [string, string])}
          aside={<DrillCard kicker={tocSlot.kicker || 'Step Gunner'} title={tocSlot.heading} body={tocSlot.body} button={tocSlot.button} loc="toc" />}
        >
          {secs.map((s, i) => (
            <Section key={s.id} id={s.id} n={nn(i + 1)} title={s.title} lead={s.lead}>{s.body}</Section>
          ))}
        </ArticleBody>

        <EndBand kicker={endSlot.kicker} title={endSlot.heading} body={endSlot.body} button={endSlot.button} />
        <Wrap><p className="disc">For exam preparation, not clinical advice. Real patients get local protocols and a senior.</p></Wrap>
      </div>
    </AppShell>
  );
}
