# Divine Machinery build plan

This is the implementation sequence for the replacement visual world, **Divine
Machinery**, in `apps/site`. It is a design record, not authorization to edit
source during this documentation session. The only file created in this session
is this file. `DESIGN.md` owns the durable system; `docs/design/surfaces.md`
owns per-route layout; this file owns dependency order and proof.

## Diagnosis: incumbent evidence

| Capture | Evidence | Defect |
|---|---|---|
| `.impeccable/review/incumbent/home-desktop.png` | At 1440px, the header, hero, calculator, insights and footer sit on almost the same dark field. The content is a centered, single vertical stack with large unused margins. | The surface is undifferentiated and flat. `apps/site/src/layouts/Page.astro` hard-codes `max-w-5xl`; there is no status band, lane rail, panel layer or listing gutter. `Top insights` is five prose paragraphs, not a readout with a value, basis, confidence and source. |
| `.impeccable/review/incumbent/compare-desktop.png` | The comparison chart has a floating ECharts toolbox capsule in the open area immediately above the table. The table and chart use amber, green and blue marks for different bases. | The toolbox overlaps the table/chart reading path. The three-accent palette hue-codes cost basis. The page again leaves broad 1440px margins because the `Page.astro` shell is one `max-w-5xl` column. |
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
namespace (`PLAN.md` task 5.1); the store does not exist in this tree yet, so
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
  series or cursor. The built-in ECharts toolbox is banned; its controls move
  to the page control row. Every chart keeps an accessible name and a real
  table twin.
- Motion is state-only, 120–150 ms, with `prefers-reduced-motion` honoured.
  The cursor readout is the one signature interaction: one fixed block prints
  the hovered or focused value, its basis, confidence, source and retrieved
  date.

## Sequencing

Each stage below is future implementation work. The proof listed for a stage is
run only by the implementation session responsible for that stage; no gate is
run for this documentation change.

### Stage 1 — token and shell foundation

**Scope (named files):**

- `apps/site/src/styles/global.css`
- `apps/site/src/layouts/Base.astro`
- `apps/site/src/layouts/Page.astro`

**Depends on:** the frozen contract above and the current `href()`/`asset()`
helpers. No route-specific component is redesigned before this stage lands.

**Work:** Replace the incumbent color, type, spacing and focus declarations with
the frozen contract. Make the dark scheme default and the light scheme a strict
value inversion with the same geometry. Turn the current header into a pinned
32px status band. Add the desktop 176px lane rail with working lanes 01–06, a
2px separator, and the unnumbered `METHOD` and `SOURCES` reference rows; at
mobile, replace it with the status band and an accessible drawer.
Make the workspace use the 1440px maximum and the 24/32/48px gutters. Keep all
existing nav destinations and the skip link. The shell must expose a stable
main landmark and a visible 2px amber focus ring offset 2px.

**Acceptance:** At 1440px, the status band is pinned, six numbered lanes and the
two unnumbered reference rows are visible at left, structural rules separate
rows, and the content uses the available workspace instead of a `max-w-5xl`
column. At 390px, the rail is absent, the band and drawer are usable, the first
line-number gutter is dropped, and there is no horizontal scroll. Toggling
`prefers-color-scheme` changes
values only; no layout or lane moves. A focused link, control and drawer item
show the same 2px amber focus treatment. CSS contains the frozen token names and
values and no second hue, radius, shadow, gradient, blur or glow.

**Proof:** `bun run dev -- --host 127.0.0.1`; manually inspect `/` at 1440px and
390px, keyboard through the band/drawer, and repeat with light color scheme and
reduced motion. This is a browser smoke pass, not a replacement for the final
project gates.

### Stage 2 — Plex type, license and asset reconciliation

**Scope (named files):**

- `apps/site/src/styles/global.css` (`@font-face` declarations and fallbacks)
- `apps/site/public/fonts/ibm-plex-sans-latin-400-normal.woff2` (22,588 B)
- `apps/site/public/fonts/ibm-plex-sans-latin-500-normal.woff2` (24,184 B)
- `apps/site/public/fonts/ibm-plex-sans-latin-600-normal.woff2` (24,252 B)
- `apps/site/public/fonts/ibm-plex-mono-latin-400-normal.woff2` (14,708 B)
- `apps/site/public/fonts/ibm-plex-mono-latin-500-normal.woff2` (14,888 B)
- `apps/site/public/fonts/LICENSE.txt` (IBM Plex OFL 1.1, 4,456 B)
- `apps/site/scripts/og.ts`
- `apps/site/public/favicon.svg`
- `apps/site/src/layouts/Base.astro`
- existing `apps/site/assets/fonts/Lato-Regular.ttf`,
  `apps/site/assets/fonts/Lato-Bold.ttf`, and
  `apps/site/assets/fonts/OFL.txt` references, removed or replaced only after
  the card no longer uses Lato

The five files total approximately 98 KB. ECharts is already pinned at 6.1.0
in this workspace; its `itemStyle.decal`, split-line and minor-tick support
covers the chart grammar without an additional dependency.

**Depends on:** Stage 1 token names and shell colors. The font files are the
latin-subset IBM Plex Sans and IBM Plex Mono woff2 assets, committed under
`public/fonts/` so the site remains offline-buildable.

**Work:** Acquire the five latin-subset files once from the
`@fontsource/ibm-plex-sans@5` and `@fontsource/ibm-plex-mono@5` jsDelivr paths
and commit them with the IBM Plex OFL 1.1 license text. The latin file variant
already performs subsetting; no font-subsetting build step, runtime download or
new dependency is added. Declare the two families in `global.css` with local
`/fonts/` URLs and fallbacks. Keep prose in Plex Sans and figures/legends in
Plex Mono. Change `og.ts` from Lato to IBM Plex Sans, load the corresponding
bundled font data, and keep its palette reader tied to `@theme`. Reconcile the
favicon with the Console Listing mark: rule/gutter and one amber signal, no
decorative imagery. Update `Base.astro` theme-color values and metadata to the
frozen dark/light canvas values without changing canonical URL logic. The
one-time source URLs are:
`https://cdn.jsdelivr.net/npm/@fontsource/ibm-plex-sans@5/files/ibm-plex-sans-latin-<weight>-normal.woff2`
and the same pattern for `ibm-plex-mono`; the license source is
`https://raw.githubusercontent.com/IBM/plex/master/LICENSE.txt`. The download
happens once by the implementation session, never in CI.

**Acceptance:** DevTools or a computed-style inspection reports IBM Plex Sans for
prose and IBM Plex Mono for data. The browser requests only the five committed
woff2 assets; no remote font request occurs. The repository contains the 4,456 B
OFL notice beside the assets. `og.ts` has no Lato family or Lato font path, emits
a 1200×630 card, and uses the same canvas/ink/dim/rule palette as the site. The
favicon is legible at 32×32, monochrome plus amber, and has no second hue.
License and maker credits remain visible on the Sources/about surface.

**Proof:** Run the future build command `bun run build`, inspect `dist/og.png`
and the emitted HTML metadata, then perform a browser font/network inspection
on `/`. Confirm the favicon in the browser tab and at 32×32. Do not treat a
font-file existence check as proof of rendered typography.

### Stage 3 — entry split console and cursor readout

**Scope (named files):**

- `apps/site/src/pages/index.astro`
- `apps/site/src/components/Readout.astro` (new shared fixed readout block)
- `apps/site/src/components/CostBasisChip.astro`
- `apps/site/src/components/ConfidenceBadge.astro`
- `apps/site/src/components/FreshnessBadge.astro`
- `apps/site/src/components/SourceLink.astro`
- `apps/site/src/lib/url.ts`
- `apps/site/src/lib/prefs.ts` (the versioned preference store, created by `PLAN.md` task 5.1 — it does not exist in this tree yet, so Stage 3 ships URL-only state and hydrates the store only once 5.1 lands)

**Depends on:** Stage 1 shell, Stage 2 type families, committed data accessors,
and the existing formatting and cost calculations. The route remains static;
this stage does not add a fetch path.

**Work:** Recompose `/` as a split console: left column selects a real pre-filled
plan and then models; right column is the one fixed cursor readout. The readout
prints the focused/hovered figure, basis, confidence, source and retrieved date
in one stable location. Keep the calculator's committed arithmetic and missing
route reasons. Serialize every selection and control to the URL, and hydrate
`rack-rate:prefs:v1` only for persistence once `PLAN.md` task 5.1 has shipped
the store; until then the URL is the only carrier and the design must not
imply a saved preference. Preserve the existing base-aware links. Replace
`Top insights` prose with listing rows whose state, value and provenance can be
read without hover.

**Acceptance:** Loading `/` with no query shows a real committed plan, not a
placeholder. At desktop width, selection and readout are separate columns; at
390px they become a deliberate vertical order with no overflow. Changing plan,
model or task count changes the URL and a reload reconstructs the same state.
Tab focus and touch activation update the same readout as pointer hover. The
readout always exposes basis, confidence, source and retrieved date; missing
values remain `!` gaps and never become zero. The five former insight statements
are listing/readout rows, not paragraphs. All numeric values use tabular Plex
Mono and the exact basis words.

**Proof:** In `bun run dev`, exercise `/` with a prefilled plan, keyboard-only
selection, a touch-sized viewport and a copied query URL. Inspect the readout
after focus, pointer hover and a missing route. Confirm that the browser made no
`.json` or API request.

### Stage 4 — listing primitives and chart grammar

**Scope (named files):**

- `apps/site/src/components/Badge.astro`
- `apps/site/src/components/CiBar.astro`
- `apps/site/src/components/HeatmapSection.astro`
- `apps/site/src/components/RadarSection.astro`
- `apps/site/src/components/SlopeSection.astro`
- `apps/site/src/components/WaterfallSection.astro`
- `apps/site/src/components/CostBasisChip.astro`
- `apps/site/src/components/ConfidenceBadge.astro`
- `apps/site/src/components/FreshnessBadge.astro`
- `apps/site/src/components/SourceLink.astro`
- `apps/site/src/lib/charts/theme.ts`
- `apps/site/src/lib/charts/frame.ts`
- `apps/site/src/lib/charts/mount.ts`
- `apps/site/src/lib/charts/registry.ts`
- `apps/site/src/lib/charts/builder.ts`
- `apps/site/src/lib/charts/pareto.ts`
- `apps/site/src/lib/charts/bump.ts`
- `apps/site/src/lib/charts/heatmap.ts`
- `apps/site/src/lib/charts/slope.ts`
- `apps/site/src/lib/charts/waterfall.ts`
- `apps/site/src/lib/charts/radar.ts`
- their existing `*-payload.ts` and `*-page.ts` companions

**Depends on:** Stage 1 tokens, Stage 2 fonts, and Stage 3's shared readout and
basis components. Payload builders remain pure and continue to consume
committed data.

ECharts 6.1.0 already supplies `itemStyle.decal`, split-line and minor-tick
configuration, so this stage adds no charting dependency.

**Work:** Re-theme all chart option builders to the monochrome grammar. Move
all chart controls to each page control row and remove ECharts' built-in
floating toolbox. Add pattern fills, minor ticks, confidence stroke weights,
open gaps with `!`, amber active-series/cursor marks, and basis words to every
axis, title, legend and chip. Add or preserve a real semantic table twin and a
keyboard traversal path for each chart. Keep `pass@1`/`pass@4`, benchmark
version, null and `known_gaps` distinctions in payloads.

**Acceptance:** `/compare` and `/explore` contain no floating ECharts toolbox.
Every chart has an accessible name, keyboard-reachable data points, a visible
real table twin, a real graticule, the prescribed marker shape and stroke
weight, and an open `!` gap instead of interpolation. No chart uses a gradient,
circle marker, second hue or unlabeled cost axis. The control row performs the
functions the banned toolbox previously supplied, and active values alone use
amber. The chart option path remains tree-shaken through `echarts/core`.

**Proof:** In `bun run dev`, visit every chart route at desktop and 390px, tab
through chart points and table rows, activate each control-row action, and
inspect a missing and low-confidence value. Use the browser performance/network
panel to confirm no data fetch and inspect the rendered option for hatch/gap
behavior. Compare the chart against its table twin, not against color alone.

### Stage 5 — route migration and lane-specific surfaces

**Scope (named files):**

- `apps/site/src/pages/models/index.astro`
- `apps/site/src/pages/models/[slug].astro`
- `apps/site/src/pages/plans/index.astro`
- `apps/site/src/pages/plans/[slug].astro`
- `apps/site/src/pages/compare.astro`
- `apps/site/src/pages/explore.astro`
- `apps/site/src/pages/start.astro`
- `apps/site/src/pages/method.astro`
- `apps/site/src/pages/sources.astro`
- `apps/site/src/pages/404.astro`
- `apps/site/src/layouts/Base.astro`
- `apps/site/src/layouts/Page.astro`

**Depends on:** Stages 1–4 and the per-route composition in
`docs/design/surfaces.md`. This stage changes presentation and composition, not
route identity, data schema or calculation formulas.

**Work:** Place each route in its numbered lane and implement the layouts in
`docs/design/surfaces.md`: model and plan listings as fixed-column console
listings, compare/explore as chart-plus-table workspaces, start as the
provider-to-plan-to-model flow, method as the arithmetic/provenance listing,
and sources as the attribution record. Preserve all existing filters, sort
controls, chart builder choices and plan/model links. Ensure set-aside rows are
visible when state `-` excludes them; nothing disappears silently.

**Acceptance:** Every listed route renders under the new status band and lane
rail, with a mobile drawer at 390px. Existing route URLs and slug links resolve
through `href()`. Each table has real row/column semantics, line numbers where
space permits, a 20px state column, explicit basis words and source/freshness
lines. Compare and explore retain all incumbent metrics and controls without
the toolbox. Sources renders the required verbatim attribution and the current
AA gate state. The 404 page uses the same shell and no decorative image.

**Proof:** Run `bun run dev` and manually open every route in both schemes at
1440px and 390px. Follow one model slug, one plan slug, one compare query and
one explore query from a copied URL. Use a screen-reader or accessibility tree
inspection for each table and verify no viewport has horizontal scrolling at
360px.

### Stage 6 — accessibility, provenance and release reconciliation

**Scope (named files):**

- `apps/site/src/layouts/Base.astro`
- `apps/site/src/layouts/Page.astro`
- `apps/site/src/pages/method.astro`
- `apps/site/src/pages/sources.astro`
- `apps/site/src/lib/prefs.ts`
- `apps/site/src/lib/url.ts`
- `apps/site/src/styles/global.css`
- `apps/site/scripts/og.ts`
- `apps/site/public/favicon.svg`
- all changed files from Stages 1–5

**Depends on:** all route and chart work being present. This is a proof and
reconciliation stage, not a place to introduce a new visual rule.

**Work:** Walk every interactive chart, table, drawer, readout and URL control
with keyboard and touch. Confirm focus, reduced motion, contrast, nulls, gaps,
confidence and source dates. Ensure footer/about credits Bosphorus Elevate only
as maker while `/sources` retains data-source obligations. Reconcile the final
favicon, metadata, light inversion and OG card against the same token contract.
Remove obsolete incumbent classes, Lato references, toolbox controls and stale
three-accent comments only where the replacement now owns that behavior.

**Acceptance:** A 360px pass has no horizontal scroll; all touch targets are
usable; keyboard traversal reaches every chart/table value and the readout;
focus is visible; reduced-motion removes transitions; text contrast is at least
4.5:1. Every displayed number can be traced to a basis, confidence, source and
retrieved date. The Sources page reports exactly one AA gate state. Dark and
light screenshots have identical geometry. The final social card is 1200×630,
the favicon is the Console Listing mark, and no Lato/toolbox/second-hue residue
remains.

**Proof:** The implementation session runs `bun run check`, `bun test`, and
`bun run build` after the manual 1440px/390px/360px browser pass. It records the
route matrix, keyboard/readout pass and offline network observation. None of
these commands is run for this documentation-only change.

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
| Banning the toolbox removes controls incumbents rely on | Move zoom/filter/export-equivalent actions into the page control row, label them in words, and manually exercise each action on `/compare` and `/explore`. |

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
file. A later implementation session resumes at Stage 1 and does not re-decide
the direction, surface, tokens, evidence or invariants.
