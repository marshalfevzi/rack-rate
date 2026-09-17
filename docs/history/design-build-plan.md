# Divine Machinery build plan

> **Relocation note (appended 2026-09-17, not a rewrite).** This file refers to the
> pre-PM tree: `PLAN.md` and `docs/architecture.md` were superseded by `docs/pm/` and
> `ARCHITECTURE.md` on 2026-09-17 and deleted, and `docs/design/build-plan.md` became
> `docs/history/design-build-plan.md`. Relative links to them no longer resolve; recover
> the old files with `git show d95e6ef:<path>`.

This is the implementation record for the replacement visual world, **Divine
Machinery**, in `apps/site`. It is a design record, not authorization to edit
source during a documentation session. `DESIGN.md` owns the durable system;
[`surfaces.md`](surfaces.md) owns per-route layout; **the dependency order,
task list, acceptance criteria and proof now live in
[`PLAN.md`](../../PLAN.md) Stage 5**, which is the source of truth for scope.
This file keeps the evidence PLAN.md does not carry: what the incumbent actually
looks like, what must not change, the frozen implementation contract every Stage
5 task copies, and the risk register.

## Diagnosis: incumbent evidence

| Capture | Evidence | Defect |
|---|---|---|
| `.impeccable/review/incumbent/home-desktop.png` | At 1440px, the header, hero, calculator, insights and footer sit on almost the same dark field. The content is a centered, single vertical stack with large unused margins. | The surface is undifferentiated and flat. `apps/site/src/layouts/Page.astro` hard-codes `max-w-5xl`; there is no status band, lane rail, panel layer or listing gutter. `Top insights` is five prose paragraphs, not a readout with a value, basis, confidence and source. |
| `.impeccable/review/incumbent/compare-desktop.png` | The comparison chart draws its own chrome — the Pareto `dataZoom` slider and the legend capsule built in `apps/site/src/lib/charts/pareto.ts` — outside the page control row. The table and chart use amber, green and blue marks for different bases. | Chart-drawn chrome sits in the reading path instead of in a labelled control row. The three-accent palette hue-codes cost basis. The page again leaves broad 1440px margins because the `Page.astro` shell is one `max-w-5xl` column. |
| `.impeccable/review/incumbent/home-mobile.png` | At 390px, the budget table becomes a long, compressed stack; `Top insights` remains paragraph text; the attribution is a small dense block at the very end. | The mobile table is difficult to scan as a measurement listing. The readout mechanism is absent. The footer buries attribution away from the figures it qualifies. |
| `.impeccable/review/incumbent/compare-mobile.png` | At 390px, model selectors and the comparison matrix consume a tall narrow column. Multiple values, basis labels and confidence lines compete inside each row. | The desktop comparison matrix is compressed rather than restructured for a narrow listing. Dense rows and weak column grouping make the state of each value hard to follow. |

The code confirms the captures. `global.css` defines only canvas, panel, rule,
ink, dim and three semantic accent colors (`--color-adjusted`,
`--color-measured`, `--color-api`) and applies a system sans stack to the body:
the typography is sans-everywhere, with no instrument voice. `Base.astro` uses a
small sticky navigation and renders all credits as two
`text-meta` footer paragraphs. `Page.astro` supplies the single
`max-w-5xl` content column. `apps/site/scripts/og.ts` still uses Lato for the
social card. These are implementation defects, not changes to product data or
arithmetic.

**Correction, 2026-09-16.** An earlier revision of this table recorded "a
floating ECharts toolbox capsule" on the comparison capture and made its removal
an acceptance criterion. That diagnosis is not supported by the code and has
been replaced above. `apps/site/src/lib/charts/registry.ts` registers no
`ToolboxComponent`, no option in `apps/site/src` sets a `toolbox` block, and
ECharts renders no toolbox it was not given; the capsule in the capture is the
`astro dev` toolbar, which is not app chrome and appears in `home-desktop.png`
on a route that mounts no chart at all. The two real defects are the ones named
in the row: chart-drawn chrome outside the control row, and the three-accent
palette. **Every evidence capture for Stage 5 therefore comes from a built
preview** (`bun run build` then `bun run preview`), never from `astro dev`.

## What does not change

### Product truths and invariants

- Rack Rate remains an independent public decision tool for an individual
  practitioner. Its two questions remain: which model to use, and which coding
  subscription pays for itself at the user's usage.
- Every published figure retains its citation, cost basis, confidence and
  `retrieved` date. A number without a source does not ship.
- `benchmark_version` remains part of row identity. Benchmark versions never
  share a table or composite. `pass@1` feeds scores and composites; `pass@4` is
  display-only and never shares a field, axis or formula.
- Missing values remain missing: never zero, never last place, never silently
  averaged. A composite requires `k >= 2`; otherwise it is suppressed and
  badged `single-source`. Nulls remain null.
- Cost bases remain distinct words and quantities: `API list`, a named plan
  route, and `AA index`. No axis or comparison may hide the basis.
- Confidence remains visibly `measured | high | medium | low`. Vendor
  multiplier arithmetic is `medium` at best; aggregator-only values stay
  `low` and do not become computed rows.
- `known_gaps` records unresolved upstream facts. No benchmark task, prompt,
  verifier or patch content enters the repository.
- The Artificial Analysis branch is published only when both `AA_API_KEY` and
  `AA_PUBLISH=1` are present. The Sources page always states which gate state
  the build uses.

### Routes and URLs

These routes remain available and keep their existing URL meaning:

`/`, `/models`, `/models/[slug]`, `/plans`, `/plans/[slug]`, `/compare`,
`/explore`, `/start`, `/method`, `/sources`, and `404`.

`apps/site/astro.config.mjs` remains the only owner of the deployment `site` and
`base`. Internal links continue through `apps/site/src/lib/url.ts`; canonical,
Open Graph and asset URLs continue to be base-aware. Every interactive control
that affects a selection, metric, filter, axis, or plan writes its state to a
shareable URL. Preferences stay under the planned `rack-rate:prefs:v1`
namespace ([`PLAN.md`](../../PLAN.md) task 6.1); the store does not exist in this tree yet, so
this redesign persists nothing on its own.
No server endpoint or client-side data fetch is introduced.

### Data pipeline and stack

- The site remains Astro 7 static output on GitHub Pages. It imports committed
  `data/*.json` and `@rack-rate/core` at build time.
- `packages/data-cli` remains the only package allowed network or filesystem
  access. `packages/core` remains pure. Browser requests remain zero.
- Bun 1.4.2, strict TypeScript without `any`, Tailwind v4 through
  `@tailwindcss/vite`, CSS `@theme` tokens with no `tailwind.config.js`, Apache
  ECharts 6 through `echarts/core`, nanostores with
  `@nanostores/persistent`, zod 4 at trust boundaries, committed normalized
  JSON, and GitHub Pages remain fixed.
- `bun run data:build`, `bun run data:check`, and the existing offline build
  ritual remain the data proof. Redesign work does not recalculate or hand-edit
  figures.

### Attribution obligations

The verbatim CC BY 4.0 identification block for Awesome Coding Plan by
mahonzhan remains rendered from `data/sources.json` on `/sources`. DeepSWE is
credited to Datacurve; Terminal-Bench to Harbor Hub; and
`real-api-pricing` by FeiZhuLulu remains prior art only, with no figures copied.
When AA is published, its logo, hyperlink, official terminology and
non-endorsement treatment remain required. rack-rate remains an independent
product; **Bosphorus Elevate is credited as maker only in the footer/about** and
its atmospheric photography is not inherited. IBM Plex Sans and IBM Plex Mono
carry their SIL Open Font License 1.1 notice in the repository. The old Lato
social-card implementation is replaced, not retained as a visual dependency.

## Frozen implementation contract

The following values are copied verbatim into every implementation stage. No
stage introduces a second accent, an unlisted design token, or a substitute
value.

### Color tokens

| Token | Dark default | Light inversion |
|---|---:|---:|
| `--color-canvas` | `#0B0C0E` | `#F4F5F6` |
| `--color-panel` | `#121417` | `#FFFFFF` |
| `--color-panel-2` | `#171A1E` | `#EDEEF0` |
| `--color-rule` | `#262A30` | `#D6D9DD` |
| `--color-rule-strong` | `#3A4048` | `#B7BCC3` |
| `--color-ink` | `#E8EAED` | `#14171A` |
| `--color-dim` | `#9AA2AB` | `#5A6169` |
| `--color-faint` | `#808790` | `#646B72` |
| `--color-signal` | `#FFB020` | signal-as-mark `#8F4E00`; signal plate `#FFB020` |
| `--color-on-signal` | `#0B0C0E` | `#14171A` on a signal plate |

`--color-ink` is the primary text. The completed contrast audit records dark
ink `16.24:1`, dim `7.58:1` on canvas and `7.14:1` on panel, and signal
`10.70:1`; light ink is `16.48:1`, dim is `5.75:1`, and the signal mark is
`5.91:1`. `--color-faint` is tertiary/labels only: `#808790` is `4.81:1` on
dark `--color-panel-2` and `#646B72` is `4.65:1` on light
`--color-panel-2`, the rail/band/table-head surface rather than canvas. These
values never fall below the floor. The light scheme changes values, not
structure.

### Type, space and shell metrics

| Contract | Fixed value |
|---|---|
| `--text-micro` | `0.6875rem` (11px) / 16px line-height, mono uppercase legends, tracking `0.08em` |
| `--text-meta` | `0.8125rem` (13px) / 19px line-height, metadata, footnotes, source lines |
| `--text-body` | `0.9375rem` (15px) / 24px line-height, Plex Sans prose, measure `62–72ch` |
| `--text-data` | `0.875rem` (14px) / 20px line-height, mono tabular figures in tables |
| `--text-title` | `1.25rem` (20px) / 25px line-height, section heads |
| `--text-display` | `2rem` (32px) / 36px line-height, page h1, tracking `−0.02em`, never tighter than `−0.03em` |
| Weights | `400 / 500 / 600`; all numerals tabular |
| Space | 4px base; `4/8/12/16/24/32/48/64` |
| Width and gutters | max `1440px`; `24px` mobile, `32px` at `≥768`, `48px` at `≥1280` |
| Rules and corners | 1px structural; 2px to open a section and under table heads; corners `0` everywhere |
| Shell | status band `32px`; desktop lane rail `176px` at `≥1024px`, lanes `01–06` plus the unnumbered `METHOD`/`SOURCES` reference rows, `40px` working rows and `36px` reference rows, 1px rules, rail total `314px` |
| Rows and columns | `36px` desktop / `44px` mobile; line-number gutter `40px` at `≥768px` and dropped first on phones; state column `20px`; numeric columns right-aligned, minimum `72px`; 1px column-group rules |

IBM Plex Sans is prose and IBM Plex Mono is data, legends and measurement. No
fluid `clamp` scale is introduced. No shadow, gradient, blur, glow or radius is
introduced.

### Basis, state and chart grammar

- `plan route` is a solid 1px rule and uses amber only when it is the active
  basis. `API list` is a hairline 1px rule at 50% with an open-ended stroke.
  `AA index` is a doubled rule. Every axis, chart title, table column and chip
  states its basis in words.
- The carriage-control state column contains one glyph only:
  ` ` blank = live; `·` held/shortlisted; `-` excluded and moved to the visible
  set-aside rail; `*` committed/paid/owned; `!` gap (`known_gaps`); `?` low
  confidence (aggregator-only or vendor multiplier); `+` changed this session.
  State is never conveyed by color.
- ECharts 6 charts use a real graticule, splitLine 1px `--color-rule`,
  axisLine 1px `--color-rule-strong`, and 4px minor ticks. Markers are 3px
  round squares for measured values and 1px-stroked diamonds for adjusted or
  derived values, never circles. Series fill is a 45°/6px hatch at no more
  than 8% ink, never a gradient. The frontier polyline is 2px ink; dominated
  regions use a 45° hatch. Confidence maps to stroke weight: measured 2px,
  high 1.5px, medium 1px, low 0.75px plus hatch. Missing data is an open gap
  with a `!` tick, never interpolated or zeroed. Amber marks only the active
  series or cursor. ECharts' built-in toolbox is banned: `registry.ts` registers
  no `ToolboxComponent` and must never start. Its controls move
  to the page control row. Every chart keeps an accessible name and a real
  table twin.
- Motion is state-only, 120–150 ms, with `prefers-reduced-motion` honoured.
  The cursor readout is the one signature interaction: one fixed block prints
  the hovered or focused value, its basis, confidence, source and retrieved
  date.

## Sequencing

The dependency order, task list, acceptance criteria and proof for this world
live in [`PLAN.md`](../../PLAN.md) **Stage 5 — The Console Listing redesign**,
tasks 5.1–5.15. That stage supersedes the six stages this file used to carry; the
mapping, for anyone reading an older note, is:

| This file's former stage | PLAN.md Stage 5 task |
|---|---|
| Stage 1 — token and shell foundation | 5.1 (tokens) and 5.3 (status band, lane rail, drawer, workspace) |
| Stage 2 — Plex type, licence and asset reconciliation | 5.2 |
| Stage 3 — entry split console and cursor readout | 5.4 (readout) and 5.6 (`/`) |
| Stage 4 — listing primitives and chart grammar | 5.5 (primitives) and 5.9 (chart grammar) |
| Stage 5 — route migration and lane-specific surfaces | 5.7, 5.8, 5.10, 5.11, 5.12, 5.13 |
| Stage 6 — accessibility, provenance and release reconciliation | 5.14 |

5.15 re-derives `DESIGN.md`, `surfaces.md` and the surface brief from the built
world once the rest has landed.

The frozen implementation contract above is unchanged: it is the value source
every Stage 5 task copies, and `DESIGN.md` remains authoritative for values.
PLAN.md restates token **names** and shell metrics only, so acceptance can be
measured without a second copy of the palette.

## Risk register

| Risk | Containment and observable check |
|---|---|
| Dense listing rows at 360px | Use 44px mobile rows, the 20px state column and the first-gutter drop; manually inspect every route at 360px with no horizontal scroll and readable basis/source lines. |
| Monochrome palette contrast floor (`--color-faint`) | Audit complete: dark `#808790` is `4.81:1` on dark `--color-panel-2`, and light `#646B72` is `4.65:1` on light `--color-panel-2`, the rail/band/table-head surface rather than canvas; reserve it for labels only. Every future token must be checked against `--color-panel-2` and against a light-scheme ground, because the light inversion doubles the surface a contrast value must hold on. |
| Confidence-by-stroke-weight legibility at small chart sizes | Pair 2/1.5/1/0.75px strokes with explicit words, marker shapes and hatch; verify at 390px and with a table twin, never by color alone. |
| ECharts re-theming (pattern fills and minor ticks) against the static-site bundle budget | Keep builders pure, register only used ECharts modules through `echarts/core`, and inspect the production build output after charts are re-themed. |
| `prefers-color-scheme` light inversion doubles the token surface | Keep one structure and only the frozen value inversion; the completed audit records dark ink `16.24:1`, dim `7.58:1` on canvas / `7.14:1` on panel, signal `10.70:1`, light ink `16.48:1`, dim `5.75:1`, and signal mark `5.91:1`; perform paired dark/light screenshots at 1440px and 390px and reject layout-specific light rules. |
| Monospace figures and the Plex fallback stack | Self-host subsetted IBM Plex woff2, keep prose in Plex Sans, test the fallback stack with fonts unavailable, and inspect computed styles plus tabular alignment. |
| Keyboard traversal of the readout mechanism | Make focus and pointer use the same update path, expose a stable live/readout landmark, and tab through every chart/table value at desktop and mobile. |
| Moving chart-drawn chrome into the control row drops a control users had | Move the Pareto `dataZoom` slider, the legend and any zoom or export action into the page control row, label them in words, make them URL-addressable, and manually exercise each action on `/compare` and `/explore`. |

## Work already done this session

The direction was locked as **The Console Listing**: mainframe console / ISPF
panel world, fixed-column listing paper, line-number gutter, carriage-control
state column, printer rules and uppercase functional legends. The shell is the
status band plus lane rail; `/` is the split console; the cursor readout is the
single value/basis/confidence/source/date mechanism. The decisions also lock
self-hosted IBM Plex Sans and IBM Plex Mono under OFL 1.1, rack-rate as an
independent product with Bosphorus Elevate credited only as maker, dark default
with strict light inversion, data graphics/authored technical figures only,
monochrome plus amber, state-only 120–150ms motion, and the full basis, state,
chart and anti-signal grammar recorded above.

The resume keys are:

- `direction 8e5f39de`
- `surface 4c59a482`

Evidence is preserved in
`.impeccable/review/incumbent/`: `home-desktop.png`, `home-mobile.png`,
`compare-desktop.png`, `compare-mobile.png`, `explore-desktop.png`,
`explore-mobile.png`, `models-desktop.png`, `models-mobile.png`,
`plans-desktop.png`, `plan-claude-pro-desktop.png`, `model-gpt-6-astra-desktop.png`,
`start-desktop.png`, `method-desktop.png`, and `sources-desktop.png`.
The incumbent source evidence is `apps/site/src/styles/global.css`,
`apps/site/src/layouts/Base.astro`, `apps/site/src/layouts/Page.astro`, and
`apps/site/scripts/og.ts`; product and stack guardrails remain in `PRODUCT.md`,
`AGENTS.md`, `PLAN.md`, `CAVEATS.md`, and `docs/data-sources.md`.

No formatter, linter, typecheck, test, build, or git command was run for this
file. A later implementation session resumes at [`PLAN.md`](../../PLAN.md) task
5.1 and does not re-decide the direction, surface, tokens, evidence or
invariants.
