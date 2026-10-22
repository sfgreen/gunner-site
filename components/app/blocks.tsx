import { Fragment, ReactNode } from 'react';
import { BYLINE, CREDENTIAL } from '../../lib/app/chrome';

// The content blocks of the app look. Each renders the .mk vocabulary from
// styles/wards.css (plus styles/app.css) inside its own island (.mk.isl, no box), so a
// block looks the same on a React page as on a wards page, and works inside the
// wrappers that still carry page-local styles. Usage: components/app/README.md.

/** A page's category: the eyebrow dot and the accent half of the H1. site = the home page's blue. */
export type Category = 'wards' | 'shelf' | 'step2' | 'ed' | 'site';
const DOT: Record<Category, string> = { wards: 'dot green', shelf: 'dot purple', step2: 'dot gold', ed: 'dot gray', site: 'dot' };

/** An SF Symbols-style stroke icon from the sprite AppShell renders once per page. */
export function Icon({ name, sm = false }: { name: 'menu' | 'x' | 'chev' | 'chev-r' | 'arrow' | 'search' | 'check' | 'checkc' | 'xc' | 'warn' | 'plus' | 'copy' | 'load' | 'flask' | 'note' | 'drop' | 'pulse' | 'gauge' | 'steth' | 'book' | 'target' | 'lock' | 'star' | 'phone'; sm?: boolean }) {
  return <svg className={`ic${sm ? ' sm' : ''}`} aria-hidden="true"><use href={`#i-${name}`} /></svg>;
}

/** Copy that marks emphasis with **double asterisks** (the guides and pathways data). */
export function Rich({ text }: { text: string }) {
  const parts = String(text || '').split('**');
  return <>{parts.map((p, i) => (i % 2 === 1 ? <b key={i}>{p}</b> : <Fragment key={i}>{p}</Fragment>))}</>;
}
export const plain = (s: string): string => String(s || '').replace(/\*\*/g, '');

/** The 1200px page grid with the site gutters (16px, 40px from 760px). */
export function Wrap({ children }: { children: ReactNode }) {
  return <div className="mk isl"><div className="wrap">{children}</div></div>;
}

/** The page opening: ArticleHeader and the CtaCard, in the grid. */
export function Hero({ children, id }: { children: ReactNode; id?: string }) {
  return <div className="mk isl"><div className="wrap"><div className="art" id={id}>{children}</div></div></div>;
}

export type Crumb = { href?: string; label: string };

/** Breadcrumb (mono). Home is added; a crumb without an href is the current page. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="crumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      {items.map((c, i) => (
        <Fragment key={i}>
          <span aria-hidden="true">/</span>
          {c.href ? <a href={c.href}>{c.label}</a> : <span aria-current="page">{c.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}

/** Eyebrow with the category dot, the two-tone 800 H1, the dek, the byline and the
 *  disclaimer line: the opening of every article and hub page. */
export function ArticleHeader({
  category, eyebrow, title, accent, dek, crumb, byline = true, meta, reviewed, disclaimer, id = 'h1',
}: {
  category: Category;
  eyebrow: ReactNode;
  /** The whole H1 as plain text. */
  title: string;
  /** The part of the title set in the category color (must occur in `title`). */
  accent?: string;
  dek?: ReactNode;
  crumb?: Crumb[];
  /** "By Danny Varghese, MS4, Texas A&M College of Medicine". false on hubs and legal pages. */
  byline?: boolean;
  /** More facts after the byline: ['14 sources', 'About 12 min read']. */
  meta?: ReactNode[];
  /** A green check plus this label after the byline, e.g. "Reviewed for accuracy". */
  reviewed?: string;
  disclaimer?: ReactNode;
  id?: string;
}) {
  const k = accent && title.includes(accent) ? title.indexOf(accent) : -1;
  const h1 = k < 0 ? title : <>{title.slice(0, k)}<span className="key">{accent}</span>{title.slice(k + accent.length)}</>;
  const facts = [
    ...(byline ? [<span key="by">By <b>{BYLINE}</b>, {CREDENTIAL}</span>] : []),
    ...(reviewed ? [<span key="rv" className="rv"><Icon name="checkc" sm />{reviewed}</span>] : []),
    ...(meta || []).map((m, i) => <span key={`m${i}`}>{m}</span>),
  ];
  return (
    <div className="mk isl">
      <header className={`art-hd c-${category}`}>
        {crumb && crumb.length > 0 && <Breadcrumb items={crumb} />}
        <p className="kick"><span className={DOT[category]} aria-hidden="true" />{eyebrow}</p>
        <h1 className="h-1" id={id}>{h1}</h1>
        {dek && <p className="stand">{dek}</p>}
        {facts.length > 0 && <p className="meta">{facts}</p>}
        {disclaimer && <p className="disc-top"><Icon name="warn" sm /><span>{disclaimer}</span></p>}
      </header>
    </div>
  );
}

/** The dark grid band that holds an interactive tool. Full bleed: a direct child of
 *  AppShell, never inside ArticleBody. Put dark cards (.sheet.dark-card) and a DrillCard in it. */
export function Stage({ category, children, id, stickyStart = false }: { category?: 'wards' | 'step2'; children: ReactNode; id?: string; stickyStart?: boolean }) {
  return (
    <div className="mk isl">
      <div className={`stage-band tool-band${category ? ` c-${category}` : ''}`} id={id} {...(stickyStart ? { 'data-sticky-start': '' } : {})}>
        <div className="wrap">{children}</div>
      </div>
    </div>
  );
}

/** The article column with the sticky "On this page" list (from 1040px) and the
 *  collapsed list above the first section on smaller screens. The active pill follows
 *  the scroll (lib/app/chromeClient.js). `aside` sits under the list, e.g. a DrillCard. */
export function ArticleBody({ toc, aside, children }: { toc?: [string, string][]; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="mk isl">
      <div className="wrap art-b">
        <div className="art-g">
          <div className="art-col">
            {toc && toc.length > 0 && (
              <details className="otp">
                <summary><span className="lbl">On this page</span><Icon name="chev" sm /></summary>
                <ol>{toc.map(([id, t]) => <li key={id}><a href={`#${id}`}>{t}</a></li>)}</ol>
              </details>
            )}
            {children}
          </div>
          {toc && toc.length > 0 && <Toc items={toc} aside={aside} />}
        </div>
      </div>
    </div>
  );
}

/** The sticky list on its own, for a page that builds its own .art-g grid. */
export function Toc({ items, aside }: { items: [string, string][]; aside?: ReactNode }) {
  return (
    <aside className="toc" aria-label="On this page">
      <p className="lbl">On this page</p>
      <ol>{items.map(([id, t], i) => <li key={id}><a href={`#${id}`} aria-current={i === 0 ? 'true' : undefined}>{t}</a></li>)}</ol>
      {aside && <div className="toc-x">{aside}</div>}
    </aside>
  );
}

/** A numbered section: mono index (01) and an 800 H2. `id` is the anchor the TOC links to. */
export function Section({ id, n, title, lead, children }: { id: string; n: string; title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mk isl">
      <section className="asec" id={id} aria-labelledby={`${id}-h`}>
        <div className="s-hd"><span className="ix">{n}</span><h2 className="h-2" id={`${id}-h`}>{title}</h2></div>
        {lead && <p className="prs">{lead}</p>}
        {children}
      </section>
    </div>
  );
}

/** Cards with green numbers: an ordered how-to. `cite` is the mono source line under a step. */
export function NumberedSteps({ steps }: { steps: { text: ReactNode; cite?: ReactNode }[] }) {
  return (
    <div className="mk isl">
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={i}><div><p className="st-t">{s.text}</p>{s.cite && <p className="srcl">{s.cite}</p>}</div></li>
        ))}
      </ol>
    </div>
  );
}

/** tip: the green callout. trap: the red one, for the wrong answer the exam wants. */
export function Callout({ tone = 'tip', label, title, children }: { tone?: 'tip' | 'trap'; label?: ReactNode; title?: ReactNode; children?: ReactNode }) {
  const body = typeof children === 'string' ? <p>{children}</p> : children;
  return (
    <div className="mk isl">
      <aside className={tone}>
        {label && <p className="lbl"><Icon name={tone === 'trap' ? 'warn' : 'checkc'} sm />{label}</p>}
        {title && <p className="tt">{title}</p>}
        {body}
      </aside>
    </div>
  );
}

/** A table in a scrolling container: the page never scrolls sideways, the table does.
 *  `num` lists the column indexes that hold numbers (right-aligned, tabular figures).
 *  The first cell of each row is its header. `hl` lists rows to highlight. */
export function Table({ label, head, rows, num = [], hl = [], minWidth }: {
  /** Names the table for screen readers (caption) and the scroll region. */
  label: string;
  head: ReactNode[];
  rows: ReactNode[][];
  num?: number[];
  hl?: number[];
  /** Below this width the table scrolls instead of squeezing, e.g. 560 for three text columns. */
  minWidth?: number;
}) {
  const n = (i: number) => (num.includes(i) ? 'n' : undefined);
  return (
    <div className="mk isl">
      <div className="tbl-w" role="region" aria-label={label} tabIndex={0}>
        <table className="tbl" style={minWidth ? { minWidth } : undefined}>
          <caption>{label}</caption>
          <thead><tr>{head.map((h, i) => <th key={i} scope="col" className={n(i)}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, j) => (
              <tr key={j} className={hl.includes(j) ? 'hl' : undefined}>
                {r.map((c, i) => (i === 0 ? <th key={i} scope="row" className={n(i)}>{c}</th> : <td key={i} className={n(i)}>{c}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The numbers that answer the page, each with what it counts. tone colors the number;
 *  the label always says what it means, so color is never the only signal. */
export function StatStrip({ items, source }: { items: { value: ReactNode; label: ReactNode; tone?: 'bad' | 'good' }[]; source?: ReactNode }) {
  return (
    <div className="mk isl">
      <div className="sts" style={{ ['--n' as string]: String(items.length) }}>
        {items.map((s, i) => (
          <div key={i}><span className={`v${s.tone ? ` ${s.tone}` : ''}`}>{s.value}</span><span className="c">{s.label}</span></div>
        ))}
      </div>
      {source && <p className="sts-src">{source}</p>}
    </div>
  );
}

export type FaqItem = { q: string; a: string };

/** Questions as disclosures. Answers take **bold**. Pair with faqJsonLd(items) in the
 *  page head: the JSON-LD text is the visible text, which seo_verify checks word for word. */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="mk isl">
      <div className="faq">
        {items.map((f) => (
          <details key={f.q}>
            <summary><span>{f.q}</span><Icon name="plus" sm /></summary>
            <div className="fa"><p><Rich text={f.a} /></p></div>
          </details>
        ))}
      </div>
    </div>
  );
}
export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: plain(f.a) } })),
  };
}

/** A chart or image drawn for a white page, on a white "paper" card in both themes so
 *  it stays legible in dark mode. Give width and height when known (no layout shift). */
export function Figure({ src, alt, caption, n, width, height }: { src: string; alt: string; caption?: ReactNode; n?: number; width?: number; height?: number }) {
  return (
    <div className="mk isl">
      <figure className="figp">
        <div className="pp"><img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" /></div>
        {caption && <figcaption>{n != null && <b>Figure {n}. </b>}{caption}</figcaption>}
      </figure>
    </div>
  );
}
