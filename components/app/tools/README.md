# Tool-page pieces (app look)

Built for the readiness tools (`/readiness`, `/step-2-score-predictor`, `/readiness/methodology`)
on top of the blocks in `components/app` (see `../README.md`). Same markup and classes as the
blocks, so they render the `.mk` vocabulary from `styles/wards.css`; page-only CSS is prefixed
`.tl-`.

| Export | File | What it is |
|---|---|---|
| `ToolEndBand` | `asks.tsx` | `EndBand` plus `ct`, `params` and a `secondary` node (a tracked internal link). |
| `ToolStickyBar` | `asks.tsx` | `StickyStoreBar` plus `ct` and `params`. |
| `BeatPitch` | `asks.tsx` | "The part you control": the glowing app card with the two beat figures and one `StoreButton`. `end` marks it as the page's closing ask (the sticky bar hides on it). |
| `RangeGauge` | `ReadinessViz.tsx` | The home page's readiness gauge plus the US mean; dark by default, `light` for a white page. |
| `Trajectory` | `ReadinessViz.tsx` | Scores over days before the exam, projected to exam day, drawn at the container's pixel width so labels stay 13px. |

Why `ct` and `params`: the tool pages always sent a GA4 `source` that differs from their App Store
campaign (`/readiness`: ct `readiness_web`, source `readiness`; the methodology: ct
`methodology_web`, source `methodology`). `params={{ source }}` keeps that value, so the admin growth
table's history per source does not split. When the foundation blocks (`EndBand`,
`StickyStoreBar`, `DrillCard`, `CtaCard`) forward `ct`/`params` to `StoreButton`, `ToolEndBand` and
`ToolStickyBar` can be deleted in favor of them.
