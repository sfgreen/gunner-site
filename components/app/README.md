# The app look: building blocks

One look for all of stepgunner.com: the approved "app look" of `/`, `/wards` and the
wards articles. These blocks render the same CSS those pages use, so a React page and
a wards page cannot drift.

```tsx
import { AppShell, Hero, ArticleHeader, CtaCard, Stage, DrillCard, ArticleBody, Section,
  NumberedSteps, Callout, Table, StatStrip, Faq, faqJsonLd, Figure, EndBand, StickyStoreBar } from '../components/app';
```

## Where things live

| What | File |
|---|---|
| Tokens, light and dark (the only place a color is declared), legacy aliases, page base | `styles/globals.css` |
| The `.mk` component vocabulary (nav, cards, steps, callouts, FAQ, TOC, bands) | `styles/wards.css` |
| What the blocks add (islands, category accents, table, stat strip, paper figure, `.ax-page`, bridge) | `styles/app.css` |
| The nav config: dropdowns, phone menu, footer columns, `sectionOf()` | `lib/nav.ts` |
| Nav, footer, sprite, store button as HTML strings (wards pages and AppShell share them) | `lib/app/chrome.js` |
| Chrome behavior: dropdowns, phone menu, `store_click` for nav/footer, sticky bar, TOC pill | `lib/app/chromeClient.js` |
| The blocks | `components/app/AppShell.tsx`, `store.tsx`, `blocks.tsx` |

## Rules

1. **Every page sits in `AppShell`.** It renders the root (`.m3vp`), the sprite, the skip
   link, the nav, the footer, keyed viewport and theme-color tags, and mounts the chrome.
2. **Blocks are islands.** Each renders inside `<div class="mk isl">` (`display: contents`:
   no box, so sticky and grid behave). Inside a block the `.mk` vocabulary applies:
   `p.prs` (prose paragraph), `h3.h-3`, `h3.h-3.subh`, `.sheet` + `.sheet-hd` + `.sheet-bd`
   (white card), `.sheet.dark-card` (dark card, in a Stage), `.lbl` (mono label), `.fine`,
   `.srcl` (mono source line, blue links), `.pts` (ruled list), `.rel` (related links),
   `.refs` (numbered sources), `.chain` (numbered vertical chain), `.tag.live`/`.tag.soon`.
   Outside a block nothing is `.mk`: write `<div className="mk isl">` around your own
   markup to use the vocabulary.
3. **Page-specific CSS** is `<style jsx>` (scoped) or, if global, prefixed with a page code
   (`.gd-` guides, `.pw-` pathways). Never a bare generic class in a global block:
   `.cta`, `.card`, `.faq`, `.wrap`, `.steps`, `.chip`, `.row`, `.sec` are all `.mk` names.
4. **Colors only from tokens** (`var(--ink)`, `var(--card)`, `var(--act)`, `--st-*` on dark
   surfaces). Never `#fff` on `var(--ink)`: ink flips in dark mode. Dark surfaces use
   `--st-card`/`--st-bg` with `--st-ink`; the action on them is `--st-act`.
5. **One accent.** The blue action (`--act`) only on the thing to do (the store button).
   Category color only for the eyebrow dot, the H1 accent and small labels.
6. **4/8 spacing grid, type from the scale** (13, 15, 16, 18, 19, 21, 23, 28/32, 38, 46, 58),
   Inter + JetBrains Mono only. Tabular figures for numbers (`.num`, `Table` `num`).
7. **Store links only through `StoreButton`** (or the CTA blocks): attributed URL from
   `appStoreUrl(campaign)`, one `store_click {source, location, page_type, page, ref}`.
   `loc` must be in `lib/wards/site.json` `locs`. Promise only live app features: ED
   Pathways are not in the app yet (`lib/pathways/config.ts` `PATHWAYS_LIVE`).
8. **Copy:** no em or en dashes, no emoji, never a word starting "affil" in copy. Brand mark is the
   green dot + STEP GUNNER mono wordmark (the nav and footer already render it).
9. **Breakpoints:** 600, 760, 960 (nav), 1040 (article grid + TOC). `--nav-h` is the sticky
   nav height (64px, 72px from 960): offset anything else that sticks.

## Page recipe (an article)

```tsx
<AppShell campaign="topic" pageType="topic" seo={{ title, description, path: '/x', ogImage: '/og/x.png', jsonLd: [faqJsonLd(FAQ)] }}
  sticky={<StickyStoreBar title="Missed it? Most do." />}>
  <Hero>
    <ArticleHeader category="step2" crumb={[{ href: '/readiness', label: 'Step 2' }, { label: 'Brown recluse' }]}
      eyebrow="Step 2 CK · Environmental" title="Brown recluse bite, what Step 2 asks" accent="what Step 2 asks"
      dek="The vignette, the next step, the look-alikes." meta={[<><b>3</b> sources</>, <>About <b>6</b> min read</>]}
      disclaimer="Exam prep and clinical teaching, not clinical advice." />
    <CtaCard title="Only 55% get the management question right." sub="Practice the 3 questions in Step Gunner." stickyStart />
  </Hero>
  <Stage category="step2">{/* .sheet.dark-card tool */}<div className="tool-cta"><DrillCard title="..." body="..." /></div></Stage>
  <ArticleBody toc={[['short', 'The short answer'], ['faq', 'Questions']]}>
    <Section id="short" n="01" title="The short answer" lead="Five things decide every question.">
      <NumberedSteps steps={[{ text: <><b>Supportive care.</b> Wound care and tetanus.</>, cite: 'StatPearls' }]} />
      <Callout label="Before she goes home">Dark urine means come back.</Callout>
    </Section>
    <Section id="faq" n="02" title="Questions"><Faq items={FAQ} /></Section>
  </ArticleBody>
  <EndBand title="..." body="..." />
</AppShell>
```

## API

**`AppShell`** `campaign` (App Store ct for every store link, nav and footer included),
`page?` (GA4 page, default the path), `pageType?` (GA4 page_type), `section?` (nav underline;
default from the route via `sectionOf`, `null` for none), `navCta?` `{label, href}` (the
page's own nav button, same style), `seo?` `{title, description, path, ogImage?, ogType?,
jsonLd?, noindex?}` (pages that write their own `<Head>` leave it out), `sticky?` (a
`<StickyStoreBar/>`), `children`.

**`Hero`** the page opening in the 1200px grid (`.wrap .art`). **`Wrap`** the grid alone.

**`ArticleHeader`** `category` (`wards` green, `shelf` purple, `step2` gold, `ed` gray,
`site` the home blue), `eyebrow`, `title` (plain string), `accent?` (substring of the title
set in the category color), `dek?`, `crumb?` (after Home; an item without `href` is the
current page), `byline?` (default true: "By Danny Varghese, MS4, Texas A&M College of
Medicine"), `reviewed?` (green check + label), `meta?` (more facts), `disclaimer?`, `id?` (h1 id).

**`Breadcrumb`** `items` (same shape as `crumb`), for a page without an ArticleHeader.

**`CtaCard`** the white card with the blue button. `title`, `sub?` (hidden on phones), `button?`
(default "Get Step Gunner free"), `fine?` (default "6,000+ Step 2 CK cards. Free to start on
iPhone."), `loc?` (default `top`), `placement?` (`top` under the header, `inline`), `stickyStart?`.

**`DrillCard`** the dark glowing card. `kicker?`, `title`, `body?`, `button?`, `fine?`, `loc?`
(default `inline`), `stickyStart?`, `id?`.

**`Stage`** the full-bleed dark grid band for a tool. `category?` (`wards` green glow, `step2`
gold glow, none blue). A direct child of AppShell, never inside ArticleBody. `stickyStart?`.

**`ArticleBody`** the article grid: `toc?` (`[id, label][]`: the sticky "On this page" from
1040px with the active pill, a collapsed list above the content below that), `aside?`
(under the TOC), `children` (Sections). **`Toc`** the list alone for a custom `.art-g` grid.

**`Section`** `id` (anchor), `n` (`'01'`), `title`, `lead?`, `children`.

**`NumberedSteps`** `steps: {text, cite?}[]` (green numbers, card per step).

**`Callout`** `tone?` (`tip` green, `trap` red), `label?`, `title?`, `children`.

**`Table`** `label` (caption + scroll region name), `head`, `rows` (first cell is the row
header), `num?` (column indexes: right-aligned tabular figures), `hl?` (rows to highlight),
`minWidth?` (scroll below this instead of squeezing). Keyboard-scrollable.

**`StatStrip`** `items: {value, label, tone?}[]` (`bad` red, `good` green; the label always
says what it counts), `source?` (mono line under).

**`Faq`** `items: {q, a}[]` (answers take `**bold**`). Put `faqJsonLd(items)` in the head:
the JSON-LD text equals the visible text, which `scripts/seo_verify.py` checks.

**`Figure`** `src`, `alt`, `caption?`, `n?`, `width?`, `height?`: a white paper card in both
themes, for charts drawn for a white page.

**`EndBand`** the full-bleed dark closing band (`data-sticky-end`). `title`, `body?`, `kicker?`,
`button?`, `fine?`, `secondary?` `{href, label}`, `id?`.

**`StickyStoreBar`** phones only. `title`, `sub?`, `button?`. Shows once the first visible
`stickyStart` block has scrolled past; hides while the EndBand is on screen.

**`StoreButton`** `loc`, `children?`, `variant?` (`act` | `q` | `ink`), `lg?`, `block?`, `ct?`
(override the campaign), `params?` (extra GA4 fields).

**`Icon`** `name` (the sprite: arrow, chev, check, checkc, xc, warn, plus, copy, search, ...),
`sm?`. **`Rich`** renders `**bold**` copy; **`plain`** strips it.

## The wrappers (not built from blocks, already in the app look)

`SiteShell` (`campaign`, `measure` article 720 | tool 680 | wide, `crumb?`, `cta?`),
`LabLayout` (adds the ArticleHeader: category from the route, accent after the title's last
", " or ": " unless `accent` is given), `GuideLayout` (built from blocks), `DocLayout`.
Their children sit in `.ax-page .ax-col`, outside `.mk`, so page-local styles keep working
with the new palette through the aliases in `globals.css`. Porting a page means replacing
its children with blocks and deleting its page-local CSS; once a wrapper has no legacy
children left, the page uses AppShell directly.

`styles/app.css` ends with a **bridge** for two Score Report patterns copy-pasted across
unported pages (`.pitch`, `.cta .pri`). Delete it when grep finds neither.

## Verify

```
npx next build && npx next start -p 3417
python3 scripts/style_verify.py --base http://localhost:3417   # shell contract + class coverage; warns on retired palette
python3 scripts/seo_verify.py --base http://localhost:3417
```
Screenshot light and dark at 400 and 1280; zero horizontal scroll at 400.
