# PLAN.md

Live roadmap for the `rack-rate` rewrite. **One stage per session.** Read
`AGENTS.md` first; it holds the stack decisions and the invariants this plan
assumes.

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

## Direction

The product is done when a visitor can pick their provider and plan, see which
models that plan can run and what each costs them per task, compare those models
across the benchmarks with the Pareto frontier drawn on both cost bases, read
where every number came from, and keep their ignored, paid and already-owned
choices between visits — on a phone, from a static site, with no server. That is
the whole of it. Stage 5 delivers the presentation, Stage 6 the behaviour that is
still missing, Stage 7 makes it public, and Stage 8 closes two recorded data
gaps off the critical path. **A task that does not move one of those clauses is
not in this plan**; a session that wants one opens a decision here rather than a
new stage.

**Next stage: 5.1** — the Console Listing redesign. Stages 1–4 landed in full.
Their task lists, acceptance criteria, handover contracts and session history
live in the archive:

| Archive | Holds |
|---|---|
| [`docs/archive/stages-1-2.md`](docs/archive/stages-1-2.md) | Stage 1 (initialization), Stage 2 (data points), and the bootstrap session |
| [`docs/archive/stages-3.md`](docs/archive/stages-3.md) | Stage 3 (static build framework) and its eleven sessions |
| [`docs/archive/stages-4.md`](docs/archive/stages-4.md) | Stage 4 (charts and insight pages) and its four sessions |
| [`docs/archive/retrospective-2026-09-17.md`](docs/archive/retrospective-2026-09-17.md) | The 2026-09-17 plan review: the task-by-task verdict, the repairs, and the owner decisions |

This file carries the live stages, the data contract, the open questions and the
progress-log entries that are not a landed stage's own.

Stage 5 replaces the visual world. The world itself is already decided and is
**not** re-opened by any task in it: `DESIGN.md` owns the design system,
[`docs/design/surfaces.md`](docs/design/surfaces.md) owns per-route layout, and
[`apps/site/.impeccable/surfaces/apps-site-src-pages-index-astro.md`](apps/site/.impeccable/surfaces/apps-site-src-pages-index-astro.md)
owns the direction contract. `.impeccable/review/incumbent/*.png` is the
anti-reference. None of it changes what "done" means or the "Why this rewrite"
section below.

## Why this rewrite

The predecessor (`scripts/*.py` + one hand-written `site/template.html`,
1,161 lines with hand-rolled SVG) answered one question on one page: DeepSWE
score against subscription price. It worked, and the author iterated on it
hard, but it hit a ceiling:

| Problem | Consequence |
|---|---|
| One benchmark (DeepSWE) | Cannot cross-check a model's capability profile |
| Python pipeline + hand-written HTML, no framework | No components, no routing, no type safety, no test story |
| Chart is bespoke SVG with a hand-written label packer | No zoom, no linked views, no brushing, no Pareto line |
| Single page | Navigation is a scroll; insights have nowhere to live |
| No preferences | Ignored models/plans must be re-excluded every visit |
| Vercel-only | Deployment tied to one host |

The rewrite keeps the data discipline (cited numbers, honest confidence) and
replaces everything else. **Preserve from the old site:** the hero comparison
figures, the interactive budget calculator, sortable model/plan tables, chart
legend and tooltips, the provenance rail (formula + days-to-full-run + evidence
cards), and every licensing commitment.

## What "done" means for the whole project

A visitor can: pick their provider/plan, see which models that plan can run and
what each costs them per task, compare those models across several benchmarks
with the Pareto frontier drawn on both API-list and plan-adjusted axes, read
where each number came from, and have their ignored/paid/already-owned choices
persist between visits — on a phone, on a static site, with no server.

---

## Completed stages

Four stages have landed. Their task lists, acceptance criteria, handover
contracts and full session history are in the archive; this is the one-line
record.

- **Stage 1 — Initialization** (`[x]`, 1.1–1.10): Bun workspace with three
  packages, one root `tsconfig.json` (no project references), the zod data
  contract in `packages/core/src/schema.ts`, the migrated `data/*.json` plus the
  `benchmarks.json` skeleton, and the tooling pass (oxlint 1.82.0 with the
  vendored anti-slop plugin, oxfmt 0.67.0, fallow 3.25.0 report-only).
- **Stage 2 — Data points** (`[x]`, 2.1–2.12): `packages/data-cli` owns all
  network and filesystem access; `packages/core` holds pure `cost`, `normalize`,
  `pareto` and `insights`; four fetchers; the `validate` / `compute` / `check` /
  `sources` / `doctor` surface; and the data gate `bun run data:check`.
- **Stage 3 — Static build framework** (`[x]`, 3.1–3.11): the Astro static build
  for the GitHub Pages base path, the two-scheme `@theme` token set with its
  contrast evidence, the layouts and the `href()` / `asset()` link builders, the
  eleven-route page set, the typed accessor over all five committed documents,
  `format.ts` with one rounding rule per unit, the five provenance components
  with one freshness rule, the satori social card, the sitemap plus generated
  `robots.txt` and favicon, CI with a stale-output guard, and `/method` and
  `/sources` rendered from committed formulas and attribution.
- **Stage 4 — Frontend build** (`[x]`, 4.1–4.15): the chart platform — pure
  `(data) => ChartOption` builders, one tree-shaken `echarts/core` registration
  with the `SERIES_INSTALLS` guard, and one mount helper owning `ResizeObserver`,
  `prefers-reduced-motion` and disposal — plus six chart types; `/models`,
  `/models/[slug]`, `/plans`, `/plans/[slug]`, `/compare`, `/` and `/explore`
  with the metric builder and client-side composite recomputation; and the
  360 px accessibility pass. **Placeholder-grade by instruction:** the surface is
  complete and measurable, not pixel-finished, and Stage 5 is the refactor that
  was expected to rewrite it.

### Frozen fixtures and gates

`data/**` is never reformatted: fixture hashes are recorded here.

- `data/fixtures/legacy-derived.json` sha256
  `803cef427a6af2f32ade594518b1806a49bb21fea90cc80fc52684f10bab9ded`;
  `data/fixtures/legacy-derived.csv` sha256
  `6759e509df222e07771b25086a22061d5f701da2da84793fa1ea5af3da98df34`. These are
  the legacy pipeline's frozen output and the port-parity oracle asserted in
  `bun test` against `data/fixtures/legacy-inputs.{models,plans}.json`.
- `data/derived.json` is committed and deterministic; `bun run data:check`
  re-derives it in memory and fails when the committed file is stale.
- Code gates: `bun run check` (typecheck → lint → format:check → astro check)
  and `bun test`.

---

## Stage 5 — The Console Listing redesign

**Goal:** every route renders in the locked **Console Listing** world — a
mainframe console / ISPF panel of fixed-column listing paper, a line-number
gutter, a carriage-control state column, printer rules and uppercase mono
legends — so the site becomes one inspectable listing instead of a dark card
grid with a soft hero. It is the world `DESIGN.md` names as the creative north
star and the *Divine Machinery* direction roll of 2026-09-16. Stage 5 changes
presentation, composition and chart grammar only: no data, no arithmetic, no
route identity, no schema.

**The world is frozen.** `DESIGN.md` is the only owner of token values. This
stage restates names and shell metrics because acceptance measures them, and for
nothing else.

| Concern | Frozen names and metrics |
|---|---|
| Grounds | `--color-canvas`, `--color-panel`, `--color-panel-2` |
| Rules | `--color-rule`, `--color-rule-strong` |
| Text | `--color-ink`, `--color-dim`, `--color-faint` (label-only, lowest contrast) |
| Signal | `--color-signal`, `--color-on-signal` |
| Type | `--text-micro`, `--text-meta`, `--text-body`, `--text-data`, `--text-title`, `--text-display` |
| Faces | IBM Plex Sans for prose; IBM Plex Mono for every figure, identifier, legend and lane number |
| Shell | status band 32px pinned; lane rail 176px, lanes `01`–`06` at 40px plus the unnumbered `METHOD`/`SOURCES` reference rows at 36px after a 2px divider, rail total 314px; data row 36px desktop / 44px mobile; line-number gutter 40px at ≥768px and the first element dropped on phones; state column 20px and never dropped; numeric columns right-aligned with a 72px minimum and 1px column-group rules |
| Rhythm | 4px base, `4/8/12/16/24/32/48/64`; workspace max 1440px; edge gutters 24/32/48px; radius 0 everywhere |
| Motion | one duration ≤150ms, one easing `cubic-bezier(0.2, 0, 0, 1)`, state-only, `prefers-reduced-motion` honoured |
| State | carriage-control glyphs ` ` (live) `·` (held) `-` (excluded) `*` (committed) `!` (gap) `?` (low confidence) `+` (changed); never colour alone |
| Basis | `plan route` solid 1px rule; `API list` hairline 1px at 50% plus an open-ended stroke; `AA index` doubled rule; every axis, chart title, column, chip and legend names its basis in words |
| Banned | a second hue, green/red semantics, rounded corners, pills, shadow, gradient, blur, glow, spinners, shimmer, decorative dashes, monospace prose, a decorative eyebrow above a heading, motion above 150ms, and any contractual fact that exists only on hover |

**Boundaries — what Stage 5 must not do.**

- No change to `data/**`, `packages/core`, `packages/data-cli` or any formula.
  `bun run data:check` stays exit 0 and `data/derived.json` stays
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`.
- No server endpoint, no client-side data request, no new dependency. Charts keep
  reading committed payloads through the existing `*-payload.ts` modules.
- No route, slug or URL meaning changes. `apps/site/astro.config.mjs` remains the
  only owner of `site`/`base`, and every internal link keeps going through
  `href()`.
- **`apps/site/src/lib/prefs.ts` is not created in this stage.** It is task 6.1.
  Every state mark in Stage 5 is URL or session state, the set-aside is driven by
  filters a route already owns (score floor, vendor, reasoning effort) and by
  `known_gaps` rows, and no surface may imply a saved preference. The `-` and `*`
  marks consuming `ignoredModels` / `ignoredPlans` / `paidPlans` are Stage 6's;
  Stage 5 ships the glyph grammar and the set-aside surface that will carry them.
- **`/start` is layout only.** Task 5.12 gives it the shell, the selection
  console, the readout and the empty/error grammar. The provider → plan → model
  flow, the shareable result URL, the zod validation and export/import are
  Stage 6.
- `apps/site/scripts/og.ts` and `apps/site/public/favicon.svg` change only as
  task 5.2 prescribes.
- Evidence for every task is captured from a **built preview** (`bun run build`
  then `bun run preview`), never from `astro dev`: the dev server injects its own
  toolbar, which is not app chrome and was mistaken for chart chrome in the
  earlier design session.

**Reporting rule.** Each task updates its section of `docs/architecture.md` as it
lands, the way Stages 3 and 4 did. Task 5.15 re-derives the design documents from
the shipped code afterwards.

### Tasks

- [ ] 5.1 **Token foundation and scheme inversion.**
  **Files:** `apps/site/src/styles/global.css`.
  **Work:** replace the nine incumbent tokens (`canvas`, `panel`, `rule`, `ink`,
  `dim`, `adjusted`, `measured`, `api`, `api-ink`) with the frozen ten, adding
  `panel-2`, `rule-strong`, `faint`, `signal` and `on-signal`; replace the
  four-step type scale with the frozen six steps at fixed pixel line-heights,
  with the Sans and Mono stacks named per role; keep `--spacing: 0.25rem` as the
  single spacing unit; replace the ink `:focus-visible` ring with a 2px
  `--color-signal` ring offset 2px; theme the browser surfaces DESIGN.md names
  (selection plate, caret, scrollbar track and thumb, underline offset); make the
  light scheme a value-only inversion of the same ten tokens, including the
  `#FFB020` signal plate against `--color-on-signal`; keep one duration, one
  easing and the reduced-motion override.
  **Done when** every token in `DESIGN.md` exists in `@theme`, all four retired
  accent tokens and the utilities they generated are gone, and a contrast
  recomputation for both schemes against canvas, panel **and** panel-2 clears the
  floors in `DESIGN.md`, with `--color-faint` recorded as label-only.
- [ ] 5.2 **Self-hosted IBM Plex, its licence, and the two generated assets.**
  **Files:** new `apps/site/public/fonts/ibm-plex-sans-latin-{400,500,600}-normal.woff2`,
  `apps/site/public/fonts/ibm-plex-mono-latin-{400,500}-normal.woff2` and
  `apps/site/public/fonts/LICENSE.txt`; `global.css` (`@font-face`, fallbacks,
  `--font-sans` / `--font-mono`); `apps/site/scripts/og.ts`;
  `apps/site/public/favicon.svg`; `apps/site/src/layouts/Base.astro`; delete
  `apps/site/assets/fonts/**` only once nothing references it.
  **Work:** acquire the five latin-subset woff2 files once from the `@fontsource`
  jsDelivr paths, commit them with the IBM Plex OFL 1.1 text, and record each
  file's source URL, byte length and sha256 in `docs/architecture.md` so the
  committed bytes stay verifiable after the fact; declare both families with
  local `/fonts/` URLs and real fallbacks; keep prose in Sans and figures in
  Mono; move `og.ts` off Lato onto Plex Sans with its palette reader still
  following `@theme`; update the two media-scoped `theme-color` values to the
  frozen canvas values. The favicon keeps its 32×32 SVG geometry and is judged at
  the 16px a browser tab actually renders, not at an authored size: if the 1.5px
  rule weights close up at that size, adjust the rule weights only — the
  geometry, the gutter and the single amber signal stay as they are.
  **Done when** the browser loads only the five committed woff2 files with zero
  remote font requests, each committed file's sha256 matches its recorded value,
  computed styles report Plex Sans for prose and Plex Mono for data, the favicon
  reads at 16px, `dist/og.png` is 1200×630 in the console palette, and no Lato
  family or path remains anywhere in the tree.
- [ ] 5.3 **Shell — status band, lane rail, drawer, workspace, footer index.**
  **Files:** `apps/site/src/layouts/Base.astro`, `apps/site/src/layouts/Page.astro`,
  new `apps/site/src/components/StatusBand.astro`,
  `apps/site/src/components/LaneRail.astro`,
  `apps/site/src/components/FooterIndex.astro`.
  **Work:** replace the sticky header with the 32px pinned band (`RACK-RATE`,
  `BUILD {derivedGeneratedAt}`, `DATA {newest retrieved_at}`, `AA {ON|OFF}`
  linking to the gate explanation on `/sources`); add the 176px lane rail with
  lanes `01 OVERVIEW` … `06 GET STARTED`, the 2px divider and the unnumbered
  `METHOD`/`SOURCES` rows, carrying the roving-focus keyboard model (`Tab` enters,
  arrows move, `Home`/`End` jump, `Enter`/`Space` activates) and
  `aria-current="page"`; below 1024px move the rail into a drawer opened by a
  `MENU` text button, with focus moved to the active lane, focus trapped,
  dismissal on `Escape`, the close button or a route activation, and the page
  behind it at an unchanged scroll position; replace `Page.astro`'s `max-w-5xl`
  column with the 1440px workspace and the 24/32/48px gutters; turn the footer
  into the numbered index plus the Bosphorus Elevate maker credit. Route labels
  stay verbatim; only the casing treatment changes.
  **Done when** at 1440px the band is pinned and six numbered lanes plus two
  reference rows are visible at left with no `max-w-5xl` column, at 390px the rail
  is a drawer and the page has no horizontal scroll, the drawer is fully
  keyboard-operable, and switching `prefers-color-scheme` moves values and no
  geometry.
- [ ] 5.4 **The cursor readout.**
  **Files:** new `apps/site/src/components/Readout.astro` and
  `apps/site/src/lib/readout.ts`; a mount point in `Base.astro`; fixed-line
  geometry in `global.css`.
  **Work:** one readout element per page, `aria-live="polite"`, printing
  `VALUE · BASIS · CONFIDENCE · SOURCE · RETRIEVED` in that fixed order and never
  in another; pre-filled from the page's own headline figure so it is never blank
  and never a hint string; pointer hover, keyboard focus and touch focus all
  route through one update path; a missing value prints `—` with the
  `known_gaps` reason beside it. **This task resolves the one contradiction
  between the two design documents:** `DESIGN.md`'s "Readout behavior" docks the
  readout in the right column of `/`'s split console, while
  `docs/design/surfaces.md` docks it as the fixed 28px line at the viewport
  bottom at ≥768px and directly under the band below that. Ship
  `surfaces.md`'s docking — one fixed 28px line, page body reserving 28px of
  bottom padding so it never covers the footer index, and the same element inline
  under the band below 768px — record the choice in `docs/architecture.md`, and
  hand the `DESIGN.md` sentence to 5.15.
  **Done when** the readout is one element, never blank, updated identically by
  pointer and by keyboard, not inserted as a repeated tab stop, and unchanged
  under `prefers-reduced-motion`.
- [ ] 5.5 **Listing primitives and the provenance components.**
  **Files:** rewrite `apps/site/src/components/{Badge,CostBasisChip,ConfidenceBadge,FreshnessBadge,SourceLink,CiBar}.astro`;
  new `apps/site/src/components/{SectionHead,Plate,Chip,ControlRow,StateCell,Gutter,SetAside,EmptyState}.astro`;
  `apps/site/src/lib/provenance.ts`.
  **Work:** put every primitive on the console grammar — square, 1px rules,
  `--text-micro` uppercase mono legends, 36px desktop / 44px mobile rows, no
  radius (the incumbent `CiBar` carries `rounded-xs`), no shadow or gradient; give
  each one the state set DESIGN.md's component table prescribes
  (`default | hover | focus-visible | active | disabled | loading | empty |
  error`), with a rule, glyph, label or inversion beside any tonal change; the
  state cell carries exactly one carriage-control glyph; excluded and gap rows stay
  visible in the set-aside rail with their reason, and an empty set-aside renders
  `No excluded rows in this view.` rather than disappearing; the empty-state and
  error strings named in `surfaces.md` ship with the primitives rather than being
  re-typed per page.
  **Done when** each primitive renders its prescribed states, no primitive
  survives with a radius, shadow, gradient or second hue, and the three badges and
  the basis chip still read their vocabulary from `lib/provenance.ts`.
- [ ] 5.6 **`/` — the split console.**
  **Files:** `apps/site/src/pages/index.astro`.
  **Work:** recompose the entry as the split console: the left selection column is
  plan → models → tasks per month, pre-filled with a real committed plan and its
  measured-against model, and the right column is the readout listing
  (`Plan · Model priced · Effective monthly cost · Break-even tasks/month`, with
  the last two numeric and right-aligned, the line-number gutter, the 2px head
  rule and a foot line carrying the route count and the API-list multiple), with
  the effective-cost head stating `API list` in words; keep the ported
  calculator's arithmetic and its missing-route reasons exactly; serialize every
  control to the URL (`plan`, `models`, `tasks`) and restore from it; replace the
  "Top insights" paragraphs with listing rows whose value and provenance are
  readable without hover. The surface brief's first viewport is band + rail +
  split console, so **no authored figure opens `/`** — the headline is the
  readout listing's own first line, and any authored technical figure goes below
  the fold as its own section.
  **Done when** `/` with no query shows a committed plan rather than a
  placeholder, changing plan, models or task count writes the URL and a reload
  reconstructs the state, the five former insight statements are rows rather than
  paragraphs, and the browser makes no `.json` or API request.
- [ ] 5.7 **`/models` and `/models/[slug]`.**
  **Files:** `apps/site/src/pages/models/index.astro`,
  `apps/site/src/pages/models/[slug].astro`.
  **Work:** the index becomes a fixed-column listing — `Model`, `Score (pass@1)`,
  `Pass@4`, `API list cost/task`, `Cheapest usable plan`, `Value multiple`,
  `Days to full run`, `Effort`, `Composite coverage` — with the filter row (name
  or provider, vendor, score floor), sortable heads writing `sort` and `direction`
  to the URL, the line-number gutter doubling as the deep-link anchor and the state
  cell inline before the model name. `pass@1` and `pass@4` never share a field or
  a basis; a `k < 2` composite keeps `Composite suppressed: fewer than two
  benchmark versions (single-source).` The detail page becomes score profile →
  effort ladder → priced plan routes → provenance rail → outbound benchmark
  links, every cost cell naming `API list` or `plan route` beside the number.
  **Done when** both routes render in the shell, at 360px each row is a labelled
  record in field order with no field hidden, no figure appears without its basis
  and source line, and one model slug followed from a copied URL reproduces
  exactly.
- [ ] 5.8 **`/plans` and `/plans/[slug]`.**
  **Files:** `apps/site/src/pages/plans/index.astro`,
  `apps/site/src/pages/plans/[slug].astro`.
  **Work:** the index becomes the sortable plan listing — `rank`, `plan`,
  `provider`, `price/month`, `quota model`, `key quota`, `rolling window`,
  `measured-against model`, `value multiple`, `cost/task · measured model`,
  `days/full run`, `confidence`, `models unlocked` — with each basis stated in
  words in the head and an unresolved quota rendering as a gap row with its reason
  and no zero-valued cost. The detail page carries plan details, the quota-model
  explanation using the exact `quota_model` field names from `data/plans.json`,
  method, `known_gaps` adjacent to the value each qualifies, and the
  models-this-plan-unlocks listing.
  **Done when** both routes render in the shell, sorting works from the keyboard
  and writes the URL, every unresolved quota and known gap keeps its reason beside
  the affected value, and no plan route prints a cost without its basis.
- [ ] 5.9 **Chart grammar — re-theme the shared frame and all six builders.**
  **Files:** `apps/site/src/lib/charts/{theme,frame,registry,mount}.ts`, the six
  option builders (`pareto`, `bump`, `heatmap`, `slope`, `waterfall`, `radar`),
  their `*-payload.ts` and `*-page.ts` companions, and the section components
  `apps/site/src/components/{HeatmapSection,RadarSection,SlopeSection,WaterfallSection}.astro`.
  **Work:** re-theme every option to the console grammar: `splitLine` 1px
  `--color-rule`, `axisLine` 1px `--color-rule-strong`, 4px minor ticks; 3px round
  square markers for measured values and 1px-stroked diamonds for adjusted or
  derived ones, never circles; 45°/6px hatch at ≤8% ink in place of series fill,
  never a gradient; a 2px ink frontier polyline and a 45° hatched dominated
  region; confidence mapped to stroke weight (measured 2px, high 1.5px, medium
  1px, low 0.75px plus hatch); missing data as an open gap with a `!` tick and
  never interpolation; amber only on the active series or cursor; basis words on
  every axis, title, legend and chip; `benchmark_version` attached to every
  benchmark label.
  **Move the chart chrome into the page control row.** The incumbent draws its own
  chrome outside that row — the Pareto `dataZoom` slider and the legend capsules
  built in `pareto.ts` — and those controls become labelled, URL-addressable
  controls in the page control row instead.
  **Never register `ToolboxComponent`.** `registry.ts` registers none today and
  must not start: the ECharts toolbox is banned, so no built route can render one.
  Keep registration tree-shaken through `echarts/core` and keep the growth rule
  that the stage landing a series family adds its row to `SERIES_INSTALLS`.
  **Pin the geometry before re-theming it.** `frame`, `pareto` and `bump` carry
  unit tests; `heatmap`, `slope`, `waterfall`, `radar` and `/explore`'s metric
  builder do not, and their options have only ever been verified by rendering.
  This task changes exactly the geometry and styling those tests would have
  pinned, so each of the five gains a test in the same commit as its re-theme,
  asserting an observable property a consumer relies on — the series family and
  series count the builder declares, its axis type and bounds, its gap encoding,
  and the basis words on its axes. Registration is guarded at mount time by
  `SERIES_INSTALLS`, not by the option type, so a test that pins the declared
  family is the only thing that fails when a `use()` row is dropped.
  **Done when** every chart carries an accessible name and a real table twin,
  keyboard-reachable data points, the prescribed marker shape and stroke weight, a
  real graticule and an open `!` gap; no chart option sets a gradient, a circle
  marker, a second hue, a `toolbox` block or an unlabelled cost axis; the
  rendered option for each of the six mappings in `DESIGN.md` matches that table;
  and each of the five previously untested builders fails its own test when its
  declared series family or axis spec changes.
- [ ] 5.10 **`/compare` — the metric matrix and its chart plate.**
  **Files:** `apps/site/src/pages/compare.astro`.
  **Work:** keep the 2–4 model selection fieldset and make the matrix a
  `Metric | model … | Comparison` table whose benchmark rows are the committed
  `title` plus `benchmark_version`, whose cost rows are one `API list $/task` row
  and one `{plan name} route $/task` row per available route, and whose comparison
  column states `Plain score comparison` or `Plain cost comparison` with interval
  overlap labelled `statistical tie at 95%` and ranks as ranges. Replace the
  floating chart chrome with a page control row; keep the chart plate, its table
  twin and its accessible name.
  **Done when** no control floats over the reading path, the selection writes
  `models=` to the URL and restores from it, fewer than two selections renders
  `Choose at least 2 models`, and at 390px the matrix becomes one metric record at
  a time with the model header repeated and no hidden column.
- [ ] 5.11 **`/explore` — the instrument panel.**
  **Files:** `apps/site/src/pages/explore.astro`.
  **Work:** keep all six chart plates (Pareto, bump/rank, heatmap, slope,
  waterfall, radar) in the new grammar, each with its own control row, its reserved
  height, its cursor readout and a real table twin immediately after the plot; keep
  the metric builder's y metric, x metric, chart type, vendor, reasoning-effort,
  score-floor, log/linear and frontier controls, and the composite weight sliders
  with presets recomputing client-side from shipped per-benchmark z-scores. Every
  control writes its namespaced URL value and restores from it. The page stays
  usable with JavaScript disabled through the twin tables and the method links.
  **Done when** every chart keeps its incumbent controls without the chart-drawn
  chrome, each control row performs the function the chart chrome used to, every
  setting round-trips through the URL, and no chart hides a value behind hover
  alone.
- [ ] 5.12 **`/start` — the selection console at full width, layout only.**
  **Files:** `apps/site/src/pages/start.astro`.
  **Work:** give `/start` its lane, the full-width selection console layout from
  `docs/design/surfaces.md`, the readout it will write into, and the empty and
  error grammar — no flow logic. It renders the three step headings, the selection
  surfaces and the recommendation block's frame with an honest
  `No committed rows for this view.`-class empty state, so the page is legible and
  keyboard-traversable before its behaviour exists.
  **Done when** `/start` renders under the new shell at 1440px, 768px and 360px
  with no horizontal scroll, contains no selection logic and no persisted state,
  and does not claim a saved preference.
- [ ] 5.13 **`/method`, `/sources`, `404`.**
  **Files:** `apps/site/src/pages/method.astro`,
  `apps/site/src/pages/sources.astro`, `apps/site/src/pages/404.astro`.
  **Work:** `/method` becomes the numbered arithmetic chain — formula sections
  with their named inputs, the quota-branch listing, the cost-basis legend, the
  benchmark-weight listing and the confidence/freshness index — with code field
  names left intact. `/sources` becomes the citation listing the readout quotes:
  the Artificial Analysis gate state readout, the source records with licence,
  coverage, changes and retrieval date, the verbatim Awesome Coding Plan CC BY 4.0
  attribution, the deliberate gaps and the commitments. The 404 becomes the empty
  listing with an honest empty state and indexed links, and loses the canonical
  it currently emits for a path with no page — the defect the Stage 3 session
  recorded and deliberately left open. This task owns the markup; the deployed
  status code and index hygiene belong to task 7.4.
  **Done when** the attribution block and exactly one AA gate state render from
  committed data, every formula and field name on `/method` matches the
  implementation, and the 404 carries no canonical and no decorative image.
- [ ] 5.14 **Accessibility, provenance and release reconciliation.**
  **Files:** every file changed by 5.1–5.13.
  **Work:** walk every interactive chart, table, drawer, readout and URL control
  with keyboard and touch and confirm focus, reduced motion, contrast, nulls, gaps,
  confidence and source dates. Four residues are named rather than discovered
  again: the Pareto chart's `deepseek-v4-flash` label covering a `60.0%` axis tick
  at 360px, the in-content prose links that stay 16px tall, `/compare`'s 13px
  checkboxes reached only through their 24px labels, and the header nav that the
  4.15 pass raised to 27px and no further. Each is either fixed here or recorded
  in "Open questions" with the reason it is exempt; confirm the footer credits Bosphorus Elevate only as
  maker while `/sources` keeps the data-source obligations; reconcile the favicon,
  metadata, light inversion and social card against the same token contract; and
  remove the incumbent residue the replacement now owns — the retired accent
  tokens, the `max-w-5xl` column, every `rounded-*` class, the Lato fonts, the
  Pareto slider and legend chrome, and the stale three-accent prose in
  `docs/architecture.md` and `global.css`.
  **Done when** the stage Acceptance section below passes end to end and no
  incumbent visual residue is reachable from any route.
- [ ] 5.15 **Re-derive the design record from the built world.**
  **Files:** `DESIGN.md`, `docs/design/surfaces.md`,
  `apps/site/.impeccable/surfaces/apps-site-src-pages-index-astro.md`,
  `docs/architecture.md`.
  **Work:** re-derive each document from the shipped code rather than editing it
  into agreement — read the emitted `@theme` block, the shell's measured geometry
  and the components actually on disk, then correct the documents to match. The
  impeccable `document` pass (`.claude/skills/impeccable/`) is this repository's
  tool for that and is the expected route; a session without it must still produce
  the same result by hand, because **the deliverable is the corrected documents,
  not the pass**. Resolve `DESIGN.md`'s readout-docking sentence against the
  docking 5.4 shipped and carry the same docking into the surface brief; give
  `docs/architecture.md` its Console Listing section — both schemes with their
  audited ratios, the shell metrics, the primitive inventory, the chart grammar
  and the readout contract — and delete its superseded Stage 4 token prose rather
  than leaving it beside the new section.
  **Done when** every value, token, metric and docking in `DESIGN.md`,
  `docs/design/surfaces.md`, the surface brief and `docs/architecture.md` is one
  the built site actually produces, checked by reading the emitted CSS and the
  measured geometry rather than by reading another document.

### Acceptance

`bun run check`, `bun test` and `bun run build` all exit 0; `bun run data:check`
exits 0 with `data/derived.json` still
`7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`. Beyond that:

- Every route in the eleven-route set — the overview, `/models`,
  `/models/[slug]`, `/plans`, `/plans/[slug]`, `/compare`, `/explore`, `/start`,
  `/method`, `/sources` and the 404 — renders under the same status band and lane
  rail at 1440px, 768px and 360px, in both schemes, with no horizontal scroll at
  360px.
- Dark and light captures of the same route have identical geometry; the
  inversion changes values only.
- Keyboard-only traversal reaches every chart point, table row, drawer item,
  control-row action and the readout, at desktop and mobile width.
- Every interactive chart and table has a real table twin carrying the same
  values, basis, confidence, benchmark version, source and gaps.
- Removing colour loses nothing contractual: a greyscale capture of any route
  still shows every state, basis and confidence distinction.
- `apps/site/src` contains no radius, shadow, gradient, blur, glow, spinner,
  shimmer, second duration or second hue, and no colour token outside the frozen
  ten.
- Charts carry no `ToolboxComponent` in `registry.ts`, no chart-drawn chrome
  outside the page control row, no gradient, no circle marker and no unlabelled
  cost axis; `pass@1` and `pass@4` never share a field, axis or formula, and
  `benchmark_version` stays attached to every benchmark label.
- Five committed woff2 files, zero remote font requests, prose in Plex Sans,
  figures in Plex Mono, and a 1200×630 social card in the console palette.
- `apps/site/src/lib/prefs.ts` does not exist at the end of the stage and no
  surface implies a saved preference.
- Every evidence capture for the stage comes from a built preview, never
  `astro dev`.

### Contract handed to Stage 6

The shell (status band, lane rail, drawer, workspace, footer index), the listing
primitives, the cursor readout, the chart grammar and the six chart workspaces,
all on the frozen ten tokens.

Stage 6 adds behaviour, not appearance: `lib/prefs.ts` under
`rack-rate:prefs:v1`, the `/start` flow, the shared result URL, zod validation at
the localStorage boundary, export/import and reset, and preference-aware
rendering — the `-` and `*` marks and the set-aside consuming `ignoredModels`,
`ignoredPlans` and `paidPlans`.

Stage 6 may not add a token, a hue, a radius or a second duration, and may not
restyle the shell. A new visual need is either a Stage 5 follow-up or a
`DESIGN.md` change, never a page-local override.

---

## Stage 6 — Provider selection wizard

**Goal:** "which plan should *I* buy" becomes a guided flow, and the answers
persist offline.

> **Reading these tasks.** Stage 6 tasks are written as requirements, not in the
> Files / Work / Done-when form Stage 5 uses. A session that opens one restates
> it in that form — naming the exact files and the observable done state — before
> writing code, and verifies every symbol it names.

### Tasks

- [ ] 6.1 `src/lib/prefs.ts` — typed `nanostores` persistent stores under one
  versioned key namespace, `rack-rate:prefs:v1`, holding
  `{ ignoredModels, ignoredPlans, paidPlans, vendor, currency, budgetCeiling,
  weights, benchmarkFilters }`. SSR-safe (no `localStorage` read during
  frontmatter), corrupt values fall back to defaults, cross-tab sync on.
  Bumping the version prefix is how a schema change migrates: read the old key
  once, transform, write the new one, never crash on the old shape. Every read
  passes the same zod schema any other trust boundary uses, so a hand-edited or
  version-stale payload cannot crash a page; a key that fails validation falls
  back to that key's default rather than being dropped silently. The file does not
  exist before this task and Stage 5 deliberately shipped without it.
- [ ] 6.2 Preference-aware rendering: an ignored model or plan takes the `-`
  carriage-control mark and moves to the set-aside rail Stage 5 built, with a
  one-click restore and its reason intact — never hidden, so a filtered view is
  never mistaken for the whole picture. A paid plan takes the `*` mark and is
  excluded from "what should I buy" totals.
- [ ] 6.3 Wizard `/start` — steps: (a) which vendors/plans you can or will pay
  for, (b) what you optimize for (score / cost / agentic vs coding / throughput),
  (c) usage intensity (tasks per month, slider) mapped onto the composite weights
  and utilization math, (d) results: ranked plans with break-even, value
  multiple, days-to-full-run, and the models each unlocks. This fills in the
  console layout, control row and empty states task 5.12 already placed; it adds
  no shell, token or primitive.
- [ ] 6.4 Result summary is shareable and stateless: encode the answers in the
  URL so a result can be linked, and hydrate preferences from the URL when
  present. Persist locally on confirmation.
- [ ] 6.5 `/models` and the Pareto chart honour the wizard's context (a console
  chip showing the active plan/vendor filter with a clear action).
- [ ] 6.6 Export/import preferences as JSON (a single file, versioned), plus a
  "reset all preferences" action.
### Contract from Stage 5

The wizard is behaviour added inside a finished shell. Every surface it touches
already has its lane, its listing primitives, its set-aside rail, its cursor
readout and its state glyphs; task 6.1 supplies the store the glyphs consume.
Stage 6 adds no token, hue, radius or duration, and restyles nothing the redesign
shipped.

### Acceptance

The wizard flow is **provider → plan → model**: picking a vendor narrows the plan
list, and every plan and model shown is filtered by `model_scope`, so a plan can
never recommend a model its vendor does not actually serve. The final step
outputs a ranked recommendation with `cost_per_task`, break-even tasks, value
multiple, days-for-full-run, and the models that plan unlocks. Refresh keeps every
preference. A shared wizard URL reproduces the same recommendation on a different
browser profile. A corrupted `localStorage` payload (throwaway test in the browser
console) leaves the site usable. Ignoring a model updates every page that
referenced it. The whole flow is keyboard-traversable and usable at 360 px width —
verified by hand, not assumed.

---

## Stage 7 — GitHub Pages deployment

**Goal:** the site publishes itself from `main`, and the data refresh path is
documented for contributors.

> **Reading these tasks.** Stage 7 tasks are written as requirements, not in the
> Files / Work / Done-when form Stage 5 uses. A session that opens one restates
> it in that form before writing anything, and verifies every path it names.

### Tasks

- [ ] 7.1 `.github/workflows/deploy.yml` — Bun setup with a pinned version,
  `bun install --frozen-lockfile`, `bun run build`, `withastro/action` upload,
  `actions/deploy-pages` deploy, correct `permissions:` block, concurrency group
  so overlapping pushes cancel.
- [ ] 7.2 Decide and document the canonical URL: project page
  (`marshalfevzi.github.io/rack-rate`) first, custom domain (`rackrate.dev`)
  when DNS is ready. Commit `public/CNAME` only with the domain. Confirm
  `site`/`base` and the OG image URL are correct in both modes and that a
  subpath build has no absolute-root links.
- [ ] 7.2b Artificial Analysis publication decision, made explicitly here rather
  than by default. Three defensible states, in ascending exposure; record which
  one ships and why:

  1. **`AA_PUBLISH=0` (default, current).** No AA values anywhere; the Sources
     page says AA data is not published here and links to Artificial Analysis.
     Zero risk, no AA axis.
  2. **Chart-only** — the best-supported published variant. The AA index appears
     as its own labelled axis carrying the **AA logo visible on the chart** and
     a hyperlink, per Terms §5.1's chart row and §2.3(b) ("share charts and
     visualizations publicly, subject to the attribution requirements"). **No AA
     value enters `data/*.json`, any export, any table, or any CSV**, so nothing
     is reproduced in the "structured, tabular, or machine-readable format"
     that §2.3(c) rules out. §2.4(c)'s "dashboard" language is the residual
     objection; this state is an inference from the text, not cleared
     permission.
  3. **`AA_PUBLISH=1` with AA values in the data files** — the state the owner
     accepted on 2026-09-14. Highest exposure: §2.4(b)/(c) bulk machine-readable
     export and embedding, §2.5(a) Competitive Product. `real-api-pricing` does
     this publicly, which calibrates the practical risk but grants nothing.

  Whatever ships, the deployed Sources page must state which state the build is
  in, so a reader can tell whether AA data is present because it was cleared or
  because a key happened to be configured. Keep 2 and 3 separable in the
  implementation: the chart-only variant must be reachable by configuration,
  not by a refactor. **The decision and its reasoning are recorded in
  `CAVEATS.md` §1.6**, which is the reader-facing statement of the position.
- [ ] 7.3 Data freshness without breaking determinism: a scheduled workflow that
  runs the fetchers, and **opens a pull request** instead of pushing directly
  when `data/*.json` changes, so every data movement is reviewable and the
  deployed site is always built from a committed, validated snapshot.
- [ ] 7.4 Cache and index hygiene: `robots.txt`, sitemap verified against the
  deployed base path, 404 page served, hashed asset caching confirmed.
- [ ] 7.5 `CONTRIBUTING.md` rewritten for the new stack: how to add a plan, how
  to add a source, how to submit a measured quota, what belongs in
  `known_gaps`, and the licensing rules from `docs/data-sources.md`. Preserve
  the existing measured-quota issue template path and the credit promise.
- [ ] 7.6 Update `PLAN.md` (this file) so every stage is ticked or explicitly
  carried, update `AGENTS.md` if any command changed, and write the final
  `docs/architecture.md`.
- [ ] 7.7 Final verification: clean clone → `bun install` → `bun run build` →
  deployed URL loads, every route reachable, chart interactions work on a
  phone-sized viewport, and the sources page lists every upstream plus the
  attribution block.

### Acceptance

Pushing to `main` deploys without manual steps; the published site matches a
local `bun run build`; the scheduled refresh opens a reviewable PR rather than
mutating the live site; a clean clone reproduces the build with no secrets.

---

---

## Stage 8 — Data integrity follow-ups

**Goal:** close the recorded gaps that no stage owned, without touching
`packages/core`, the schemas, or any published formula. This stage adds no
route, no token and no page.

> **Scheduling note.** Stage 8 is off the critical path: it is the right place for
> a session that cannot start a Stage 5 task, and it adds no route, token or page.
> Three ordering rules, and the first two are load-bearing.
> 1. **8.1 and 8.2 must not run while Stage 5 is open.** Both re-run `compute`
>    and therefore change `data/derived.json`, and Stage 5's boundary and
>    acceptance text pin its hash (`7425a331…`) as the proof that the redesign
>    moved no published number. Landing either task mid-stage falsifies that
>    evidence. Run them before Stage 5 is started, or after it is accepted.
> 2. **When either lands, re-record the hash.** The new `data/derived.json` hash
>    goes into this file *and* into Stage 5's acceptance text in the same commit,
>    so the next session's "no published number moved" claim starts from a
>    current pin rather than a stale one.
> 3. **Never leave `data/*.json` half-refreshed.** A task here runs `validate`,
>    `compute` and `data:check` before it stops.

### Tasks

- [ ] 8.1 **Refresh the eight plan rows that fail the anchor check.**
  **Files:** `packages/data-cli/src/commands/fetch-plans.ts`, `data/plans.json`,
  `data/sources.json`, `docs/architecture.md`.
  **Why:** `data/plans.json` is still at its Stage 1 revision. Measured
  2026-09-17 with `bun run fetch:plans --diff`, **eight of the sixteen plan rows
  fail the anchor check**, so `fetch plans` fails closed and writes nothing:
  `claude-pro`, `claude-max-5x`, `claude-max-20x`, `chatgpt-pro-20x`,
  `kimi-code-andante`, `kimi-code-allegretto`, `glm-coding-lite` and
  `glm-coding-pro`. The eight that verify are `chatgpt-plus`, `cursor-pro`,
  `cursor-pro-plus`, `cursor-ultra`, `opencode-go`, `ollama-pro`,
  `github-copilot-pro` and `google-ai-pro`. Model rows were refreshed in Stage 2;
  plan prices and quotas were not, so every plan-route figure — Claude Pro's
  included, which `/plans` ranks — is computed from a Stage 1 price.
  **Work:** add a rendered-page acquisition path for those eight URLs. The
  `harbor`-CLI fallback in `fetch-terminal-bench` is the precedent: resolve the
  binary from an environment variable, then `PATH`, and fail closed naming both
  when neither resolves. Keyword anchors keep throwing when the anchor text is
  missing, and each row records which acquisition path produced it. Where a
  vendor page still yields no quoted limit, the row keeps `quota_unresolved` and
  gains a `known_gaps` entry — never an invented number.
  **Done when** `bun run fetch:plans --diff` exits 0 with every plan row either
  verified or explicitly unresolved, every changed row carries a bumped
  `retrieved_at`, and `bun run validate && bun run compute && bun run data:check`
  exits 0 with the new `data/derived.json` hash recorded in this file and, if
  Stage 5 has already landed, in that stage's acceptance text.

- [ ] 8.2 **Resolve the two committed evidence URLs that return 404.**
  **Files:** `data/sources.json`, `packages/data-cli/src/commands/fetch-plans.ts`,
  `docs/architecture.md`. May land in the same session as 8.1; they touch the
  same two files.
  **Why:** `bun run doctor` reports `https://openai.com/chatgpt/pricing/`
  (`data/sources.json`, the ChatGPT Pro price) and
  `https://support.google.com/googleone/answer/16287445` (the `google-ai-pro`
  anchor in the plans fetcher) as 404. Both are cited facts, and invariant 8
  makes a citation load-bearing.
  **Work:** find live replacements for the *same* fact and update
  `data/sources.json` and the fetcher anchor together, bumping `retrieved` and
  re-running `compute`. Where no live replacement states the fact, drop the
  claim and record it in `known_gaps` — a citation is never pointed at a page
  that no longer carries it, and no number is hand-edited.
  **Done when** `bun run doctor` reports no 404 among committed evidence URLs,
  `bun run validate` exits 0, `bun run data:check` exits 0, and no published
  figure changed without its `retrieved` date moving.

---

## Data contract (target schema)

Shapes are frozen in Stage 1.3 and consumed by every later stage.

### `data/sources.json` — unchanged in spirit

`{ id, title, url, license, license_short?, retrieved, covers, changes,
attribution?, credited_contributor?, notes?, summary? }`. `attribution` is
required when the license demands it (Awesome Coding Plan) and validated.

### `data/models.json` — one row per model

Existing fields (`id`, `name`, `provider`, `score_pct`, `score_pass_at_4_pct`,
`reasoning_effort`, `api_cost_per_task_usd`, `input_tokens_per_task`,
`output_tokens_per_task`, `agent_steps_per_task`, `n_tasks_attempted`,
`evidence`, `effort_variants`) plus:

- `provider_slug` — stable key for grouping; `null` when unmapped.
- `benchmark_version` — e.g. `deepswe@1.1` (part of row identity).
- `ci_lo`, `ci_hi`, `ci_method` — carried through, never recomputed.
- `cost_basis` — `list` | `expected-launch` | `disputed`.
- `retrieved_at` — drives the freshness badge.

### `data/plans.json` — one row per plan

Existing fields (`id`, `name`, `provider`, `price_usd_month`, `quota_model`,
`quota_usd_month`/`credits_month`/`requests_month`/`tokens_month`,
`rolling_window_hours`, `rolling_window_usd`, `measured_against_model`,
`confidence`, `method`, `evidence`, `sources`, `available`, `model_scope`,
`cross_check_tokens_month`, `known_gaps`) plus:

- `price_status` — `list` | `disputed`.
- `quota_unresolved` + `quota_note` — for Google AI credits and SuperGrok.
- `fx` — `{ rate, date }` when the source price is CNY.
- `retrieved_at`.

### `data/benchmarks.json` — new

```jsonc
{
  "benchmarks": [{
    "id": "deepswe",
    "version": "1.1",              // part of row identity
    "title": "DeepSWE v1.1",
    "url": "https://deepswe.datacurve.ai/",
    "generated_at": "2026-09-03T22:24:37Z",
    "task_count": 113,
    "unit": "pass@1",              // pass@1 | accuracy | index
    "scale": "0-1",                // 0-1 | 0-100 | z
    "retrieved_at": "2026-09-14",
    "rows": [{
      "model_id": "gpt-6-astra",
      "score": 74.12,
      "ci_lo": 71.25, "ci_hi": 76.98,
      "cost_per_task_usd": 5.6717,
      "cost_basis": "expected-launch",
      "tokens_input": 1163918, "tokens_output": 28542, "steps": 26,
      "provenance": { "board": "…", "dataset_version_id": "…" }
    }]
  }]
}
```

Terminal-Bench and Artificial Analysis are additional entries in this array,
each with its own `version` and provenance block. Artificial Analysis is present
only when publication is explicitly enabled (see `docs/data-sources.md`);
otherwise the array has no AA entry and no AA axis appears anywhere. `MISSING`
in a benchmark means the model has no row — never a zero.

### `data/derived.json` — generated, deterministic

Shape confirmed against the live legacy output on 2026-09-14 (178 pairs, 28 best
routes, 5 known gaps). The port must reproduce these keys — do not invent a new
shape:

```jsonc
{
  "generated_from": { "models": 28, "plans": 16, "task_count": 113 },
  "pairs": [{
    "model_id", "model_name", "provider", "score_pct",
    "plan_id", "plan_name", "price_usd_month",
    "quota_method",              // which conversion branch was used
    "tasks_per_month",
    "cost_per_task_usd", "api_cost_per_task_usd",
    "days_for_full_run",
    "confidence"
  }],
  "best_routes": [ /* same row shape; cheapest pair per model — 28 rows */ ],
  "cross_check": {
    "pairs": [ /* 11 rows: plan_id, plan_name, model_id, model_name,
                  tasks_by_dollars, tasks_by_tokens, ratio */ ],
    "summary": { "median_ratio": 1.601, "min_ratio": 1.006,
                 "max_ratio": 6.713, "pair_count": 11 }
  },
  "known_gaps": [ /* 5 rows, shape { plan, provider, reason, url? } */ ]
}
```

Stage 2 **adds** to this file rather than reshaping it: `composites`,
`frontiers` (`api` and per-plan `plan_adjusted`), `dominated`,
`token_allowances` (see 2.7b), and the per-row badge objects. Existing keys keep
their names and meanings so the fixture stays comparable.

Two naming traps to avoid when writing the parity assertion:

- The legacy metadata key is **`generated_from`** (counts of inputs used), not
  `generated_at`. Add a real `generated_at` timestamp as a *new* key in Stage 2;
  do not repurpose `generated_from`.
- The cross-check rows live under **`cross_check.pairs`** with a nested
  **`cross_check.summary`**. Parity must compare `cross_check.pairs` (11 rows)
  and `cross_check.summary.{median_ratio,min_ratio,max_ratio,pair_count}` —
  there is no `rows` array and no top-level `n`.

---

## Open questions and known gaps

Carried as data, not as prose on a page. Surface each in `known_gaps` with its
reason; do not guess a number to close one. Each item names the task that owns it
or says plainly that no task does: an item with no owner is a decision waiting for
the owner, not a task waiting for an agent.

- **Artificial Analysis licensing** — no redistribution right granted, and the
  terms arguably make this project a restricted "Competitive Product". Shipped
  as an explicit unresolved legal exception, **disabled by default**: AA is
  excluded unless both `AA_API_KEY` and `AA_PUBLISH=1` are set, and the sources
  page always states which state the build is in. Not described anywhere as
  compliant. Recommended path is a Commercial agreement before any public
  deployment turns it on (`docs/data-sources.md`).
- **Google AI credits** — no published credits→tokens/dollars conversion.
  `quota_unresolved: true` stays. AI Ultra's price is disputed across sources.
- **SuperGrok** — no per-task coding quota published; shared weekly pool.
- **MiniMax Plus is measured upstream but not yet a row here** —
  awesome-coding-plan carries a measured entry (CNY 49; 54,400 requests;
  2.4B tokens; CNY 4,344 value; 88.65x). It is not in `data/plans.json` because
  the CNY figures have not been converted with a recorded spot rate and the
  model it was measured against is not yet pinned. Add it with `fx.rate` +
  `fx.date` and `measured_against_model`, or leave it as a gap — do not invent
  a USD price.
- **Z.ai GLM international USD plan** — credit formula's output weight
  unconfirmed; domestic CNY plan priced by measured request count instead.
- **Cursor Pro+/Ultra and Ollama Max/Team** — only found via aggregators;
  `confidence: low`, never a computed row.
- **ChatGPT Codex quota** — unnumbered on the pricing page; usage draws from
  token credit pools. `medium` at most.
- **The 1.6× cross-check gap** — two independent conversion methods disagree by
  a stable factor. Cache pricing is the leading suspect. Proving or killing it
  would tighten every budget-based row.
- **Only the best effort configuration per model** — DeepSWE publishes more
  (some models at up to five levels). We keep the highest-scoring one and retain
  the ladder as `effort_variants`.
- **gpt-6-astra pricing is provisional** — DeepSWE scored it against anticipated
  launch pricing, not a GA rate card. Badged `expected-launch`.
- **Two models ship without a vendor** — DeepSWE does not identify them, so they
  carry `provider: null` rather than an invented company, which also means no
  plan route prices them.
- **Terminal-Bench payload is an undocumented flight-data blob** — it can move
  without notice. Mitigated by the `harbor` CLI fallback and a loud parse
  failure rather than a silent empty table. The fallback's command shape is
  verified against the live Hub, but its code path (`runHarbor()` → payload parse
  → `selectRows`) has never executed, because the flight-data path keeps
  succeeding; treat it as reachable and **unexercised**, not as working.
- **Two evidence URLs return HTTP 404** — `https://openai.com/chatgpt/pricing/`
  (`data/sources.json:86`, the ChatGPT Pro price) and
  `https://support.google.com/googleone/answer/16287445`
  (`packages/data-cli/src/commands/fetch-plans.ts:410`, the `google-ai-pro`
  anchor). Found 2026-09-14 by `bun run doctor`, which still exits 0 because URL
  liveness is a finding, not a gate. **Owned by task 8.2**, which carries the
  rule: a replacement must state the same fact, and a citation is never pointed
  at a page that no longer carries it.
- **`HARBOR_API_KEY` is inert here** — the `harbor` CLI reads it
  (`harbor/auth/credentials.py`, `sk-harbor-…` prefix) for authenticated Hub
  operations, but this repository never reads it and the public leaderboard read
  the fetcher uses needs no key. The local value is an unrendered
  secret-manager reference, not a harbor key. Nothing breaks today; revisit only
  if a fetch path ever needs a login.
- **Artificial Analysis publication state is undecided** — the enabled path is
  now proven live (see `CAVEATS.md` §1.6), so task 7.2b is a configuration
  decision rather than an engineering one. AA values stay out of `data/*.json`
  until that decision is recorded.
- **The incumbent captures in `.impeccable/review/incumbent/` were taken from
  `astro dev`** and carry the dev toolbar, which no built route renders. A
  diagnosis drawn from one of them had to be retracted
  (`docs/design/build-plan.md`). They stay as the anti-reference — the layout,
  spacing, colour and typography defects they show are real — but no Stage 5
  evidence may be captured from `astro dev`, and every Stage 5 task is required
  to work from a built preview.
- **`DESIGN.md` and `docs/design/surfaces.md` disagree on where the cursor
  readout docks** — the right column of `/`'s split console versus a fixed 28 px
  line at the viewport bottom. Task 5.4 ships the fixed line and 5.15 corrects
  `DESIGN.md`.
- **Five chart builders ship without unit tests** — `heatmap`, `slope`,
  `waterfall`, `radar` and `/explore`'s metric builder were verified by rendering
  only; `frame`, `pareto` and `bump` are the three that carry tests. **Owned by
  task 5.9**, which pins each builder's declared series family, axis spec and gap
  encoding in the same commit as its re-theme.
- **Eight of the sixteen plan rows are still at their Stage 1 revision** —
  `claude-pro`, `claude-max-5x`, `claude-max-20x`, `chatgpt-pro-20x`,
  `kimi-code-andante`, `kimi-code-allegretto`, `glm-coding-lite` and
  `glm-coding-pro`, measured 2026-09-17 by `bun run fetch:plans --diff`. Their
  vendor pages no longer carry the quoted limit text the anchors require, so
  `fetch plans` fails closed and writes nothing while the model rows were
  refreshed in Stage 2; every plan-route figure is computed from a Stage 1 price.
  Earlier records in this plan said six or seven rows, from the anchor tables
  printed on 2026-09-14; the live command is the authority and the count has
  moved. **Owned by task 8.1.**
- **The `push: branches: [main]` CI trigger has never fired** — the job's content
  is verified (runs 34802515011 and 34802795461, both success, on temporary
  branches), but local `main` is unpushed, so the first live use of that trigger
  is the owner's next push. Nothing in the plan is blocked by it.
- **`/rack-rate/404/` answers 200 under `astro preview`**, because the preview
  server serves `404.html` for that path directly. The deployed status code and
  the missing `noindex` belong to **task 7.4**; the stray canonical belongs to
  **task 5.13**.
- **Three accessibility residues the 4.15 pass left open** — the Pareto chart's
  `deepseek-v4-flash` label partly covering a `60.0%` axis tick at 360px,
  in-content prose links that stay 16px tall (WCAG 2.5.8 exempts links inside a
  sentence), and `/compare`'s 13px checkboxes reached through their 24px labels.
  **Owned by task 5.14**, which fixes each or records why it is exempt.


---

## Progress log

Append-only. One entry per session: name the stage, what landed, what was
verified. A landed stage's entries move to that stage's archive when the stage
closes, so what stays here are sessions that are not a stage's own. Stages 1–2
are in [`docs/archive/stages-1-2.md`](docs/archive/stages-1-2.md), Stage 3 in
[`docs/archive/stages-3.md`](docs/archive/stages-3.md), and Stage 4 in
[`docs/archive/stages-4.md`](docs/archive/stages-4.md). Do not rewrite an entry
once it has been written.

### 2026-09-14 — Review session: env wiring, fail-closed corrections, plan split

No stage was opened. Stage 3 is still untouched.

**Landed**

- **`.env.example` committed.** `.gitignore` had `.env.*`, which ignored the
  template itself (`git check-ignore` confirmed); line 7 is now `!.env.example`.
  The file documents `AA_API_KEY`, `AA_PUBLISH` (exact `1`), `HARBOR_BIN`, and
  states that `HARBOR_API_KEY` is the `harbor` CLI's own credential and is not
  read here.
- **Repository-root `.env` now reaches the CLI.** `packages/data-cli/src/paths.ts`
  loads it at import time (`process.loadEnvFile`, guarded by `existsSync`).
  Root scripts go through `bun run --filter`, which runs with cwd
  `packages/data-cli`, so Bun's cwd-relative autoload never saw the root file:
  `doctor` reported `AA_API_KEY: not set` with a valid key on disk, and the AA
  fetcher skipped silently with exit 0. A variable already set in the
  environment still wins over the file.
- **Five fail-closed fixes**, all owner-approved:
  1. `upsertBenchmarkEntry` parses through the `Benchmark` schema before writing,
     so a fetcher's mapping bug can no longer clobber `data/benchmarks.json`
     before the write-then-verify re-read throws.
  2. `fetch plans --diff` returns 1 when the verified refresh would change plan
     or source rows; it returned 0 unconditionally, contradicting the documented
     CLI contract.
  3. `--diff` now writes no file at all — `persistSnapshot: !diff` in the
     DeepSWE, Terminal-Bench and plans fetchers. Every `--diff` run used to
     overwrite `data/raw/*-<date>.json` while the help text called it a dry run.
  4. DeepSWE and Terminal-Bench refuse to write when `http.ts` serves a
     same-day snapshot after a failed live fetch (`fromSnapshot`), mirroring the
     guard `fetch-plans` already had.
  5. `HARBOR_BIN=""` is treated as unset instead of skipping the PATH search and
     failing.
- **Documentation corrected** where it had gone stale: `README.md` no longer
  claims the DeepSWE leaderboard is blocked by this environment's network egress
  (it is a live pull) and now documents the environment; `AGENTS.md` gained
  "Environment and secrets"; `CONTRIBUTING.md` no longer calls `validate` /
  `compute` unimplemented stubs and documents the `data:check` gate and the
  fail-closed plans refresh; `docs/architecture.md` records the env-loading rule
  and the corrected `--diff`, write-boundary and AA-gate semantics; `CAVEATS.md`
  §1.6 records the AA verification below.
- **PLAN.md split.** This file carries the live stages, the data contract, the
  open questions and the newest log entry. Stage 1 and Stage 2 task lists,
  acceptance criteria, handover contracts and every earlier log entry moved
  verbatim to [`docs/archive/stages-1-2.md`](docs/archive/stages-1-2.md):
  1,166 → 501 lines, checked line by line for loss.

**Verified**

- `bun run check` exit 0, `bun test` 17 pass / 0 fail, `bun run data:check`
  exit 0. `data/derived.json` is still
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`: **no
  published number changed in this session.**
- Env wiring, three ways: `doctor` from the repository root and from
  `packages/data-cli` both report `AA_API_KEY: set`; with `AA_API_KEY=` set
  explicitly in the environment it reports `not set` (real environment wins).
- Dry run, after the fix: `fetch deepswe --diff` exit 0, `fetch terminal-bench
  --diff` exit 0, `fetch plans --diff` exit 1 (the same 7 anchor-missing plans),
  and the 31 `data/raw/*.json` mtimes were identical before and after — `--diff`
  wrote nothing.
- Write boundary: a throwaway probe passed a committed entry with
  `rows[0].score = 150` to `upsertBenchmarkEntry`; it threw
  `data/benchmarks.json does not match the Benchmark schema: rows.0.score: Too
  big…` and the file's sha256 was unchanged. Probe deleted.
- **Artificial Analysis enabled path proven live** — the largest open item left
  by Stage 2. With the `.env` key and `AA_PUBLISH=1`,
  `fetch artificial-analysis --diff` paginated 4 pages, resolved 26 model rows
  against committed model ids at Intelligence Index **v4.3**, and wrote nothing.
  AA stays off in committed data.
- **Harbor fallback CLI invocation verified, fallback code path still unproven.**
  `harbor hub leaderboard show terminal-bench/terminal-bench/4-0-0 --json`
  returns board `9f966760-00f1-424e-90f5-c964fb6f6091` with no authentication, so
  the command `runHarbor()` builds is valid and the argument shape is right.
  What has *not* run is the code path itself: `runHarbor()` →
  `TerminalBenchPayloadSchema.parse` → `selectRows` has never executed, because
  the flight-data path keeps succeeding. Treat the fallback as reachable and
  unexercised, not as working.

**Decisions taken this session** (owner)

- Fix the fail-closed defects; keep the DeepSWE v1.1 → v1 fallback as task 2.2
  specifies.
- The data CLI loads the repository-root `.env` itself, rather than the root
  scripts changing how they invoke it.
- `HARBOR_API_KEY` stays out of `.env.example` until a command here consumes it.
- Artificial Analysis remains off in committed data; the state is chosen
  explicitly at task 7.2b.
- The two 404 evidence URLs are recorded in "Open questions", not fixed now.
- Closed stages and history live in `docs/archive/stages-1-2.md`.

**Still open**

- Stage 3 is next; `apps/site` still holds only `package.json`, `tsconfig.json`
  and `src/env.d.ts`, and `bun run og` cannot work until 3.8.
- `fetch plans --diff`'s verified-refresh branch is still unexercised, because
  the 7 JS-shell vendor pages fail the anchor check first; the same 7 plans keep
  `data/plans.json` at its Stage 1 revision.
- The AA mid-pagination index-version abort has still not been observed — the
  live run stayed on v4.3 across all 4 pages.
- The plan-level checks in this review covered the pipeline, env wiring and site
  scaffold; `/` and the chart surfaces do not exist yet, so no Stage 4 rendering
  claim has been tested.

### 2026-09-16 — Design documentation: the Divine Machinery visual world (docs only)

No stage above ran in this session and no task is ticked by it. The session
chose a replacement visual world for `apps/site` and wrote the documents that
own it; `apps/site/src` and `packages/**` are untouched, so no build, chart or
data behaviour changed. The direction is the owner's: "Divine Machinery" — a
console listing that replaces the incumbent flat dark stack.

- `DESIGN.md` (new, 445 lines) is the durable system: frontmatter tokens plus
  the Console Listing world — pinned status band, lane rail, line-number
  gutter, carriage-control state column, printer rules, 0 px radius, no
  shadow/gradient/blur, one amber signal (`#FFB020`) for active and attention
  only, a six-step Plex Sans / Plex Mono scale with explicit line-heights,
  and the state alphabet (blank live, `·` held, `-` excluded, `*` committed,
  `!` gap, `?` low confidence, `+` changed).
- `docs/design/surfaces.md` (new, 500 lines) is per-route layout: shell
  geometry (32 px band, 176 px rail with working lanes 01–06 plus unnumbered
  `METHOD`/`SOURCES` reference rows, 314 px total), 11 route wireframes, the
  single cursor readout, the listing-table anatomy, chart placement, the
  component-to-route map, and the exact empty/gap/suppressed strings.
- `docs/design/build-plan.md` (new, 501 lines) is the sequence: incumbent
  diagnosis from the captures, the frozen implementation contract, Stages 1–6
  with named files and acceptance, and the risk register.
- `PRODUCT.md` brand commitments now state the new world, the maker
  relationship (Bosphorus Elevate credited as maker only, no palette, imagery
  or voice inherited), the anti-signals, and the dark-default strict light
  inversion. The `/` surface brief under `apps/site/.impeccable/surfaces/` is
  realigned to the same world.
- The 14 incumbent captures in `.impeccable/review/incumbent/` are committed
  as the evidence the build plan's diagnosis cites; `.impeccable/config.local.json`
  is machine-local hook consent and is now gitignored.
- Cost basis stays explicit as the palette collapses to mono plus amber: bases
  are told apart by label and stroke pattern (solid / hairline-with-open-end /
  doubled), never by hue, and every axis, chart title, column and chip states
  its basis in words.
- The cursor readout is specified for keyboard focus, touch and pointer, never
  hover-only, and never the only place a contractual fact lives.
- Verified: `DESIGN.md` frontmatter parses as YAML with one value per token;
  every relative link and anchor in the four documents resolves; `bun test`
  138 pass / 0 fail.

**Still open**

- Two build-session decisions are recorded rather than invented: which authored
  technical figure opens `/`, and whether the favicon is redrawn at 24 px.
- `AGENTS.md` and `PRODUCT.md` described `apps/site/src/lib/prefs.ts`
  (`rack-rate:prefs:v1`) as present. It is task 5.1 and is not in the tree;
  `PRODUCT.md` now marks it planned, `AGENTS.md`'s layout line still lists it.
- `bun run format:check` fails on 8 vendored `.agents/skills/impeccable/**`
  files. Pre-existing and unrelated to this session; the fix is a tooling
  choice (an oxfmt ignore for `.agents/**`, or formatting files upstream will
  overwrite).
- The design documents are a contract, not an implementation: Stages 1–6 in
  `docs/design/build-plan.md` are all still unbuilt.

### 2026-09-16 — Plan session: the Console Listing redesign becomes Stage 5 (docs only)

No stage was opened. No source file, data file or test changed; the working tree
holds documentation only.

**Landed**

- **New Stage 5 — The Console Listing redesign**, 15 tasks: 5.1 the frozen tokens
  and the scheme inversion; 5.2 self-hosted IBM Plex with its OFL notice, the
  social card, the favicon and `theme-color`; 5.3 the shell (status band, lane
  rail, drawer, 1440px workspace, footer index); 5.4 the cursor readout; 5.5 the
  listing primitives and the provenance components; 5.6 `/`; 5.7 `/models`; 5.8
  `/plans`; 5.9 the chart grammar across the shared frame and all six builders;
  5.10 `/compare`; 5.11 `/explore`; 5.12 `/start`, layout only; 5.13 `/method`,
  `/sources` and `404`; 5.14 accessibility and release reconciliation; 5.15
  re-derives the design record from the built world. Each task names its files,
  its work and a **Done when**; the stage carries a frozen name/metric table, six
  boundaries, ten acceptance checks, and the contract it hands forward.
- **The wizard moved to Stage 6 and deployment to Stage 7.** Wizard tasks 5.1–5.7
  are now 6.1–6.7 and deploy tasks 6.1–6.7 are now 7.1–7.7, with 7.2b keeping its
  suffix. Stage 6 gained a **Contract from Stage 5** section, and its 6.2 now
  consumes the set-aside rail the redesign ships instead of dimming rows.
- **The boundaries that keep the two stages from colliding.** Stage 5 creates no
  `lib/prefs.ts`, persists nothing, and gives `/start` layout only; Stage 6 adds
  behaviour, not appearance, and may not add a token, hue, radius or duration.
- **`docs/design/build-plan.md` trimmed 501 → 262 lines.** It now points at
  PLAN.md Stage 5 for dependency order and keeps what PLAN.md does not carry: the
  incumbent diagnosis, "what does not change", the frozen implementation contract
  and the risk register, plus a mapping from its former six stages.
- **Correction to that diagnosis.** It recorded "a floating ECharts toolbox
  capsule" and made its removal an acceptance criterion. `registry.ts` registers
  no `ToolboxComponent`, no option under `apps/site/src` sets a `toolbox` block,
  and the same capsule appears in `home-desktop.png`, on a route that mounts no
  chart — it is the `astro dev` toolbar, not app chrome. The row now names the two
  real defects, the Pareto `dataZoom` slider and legend drawn outside the page
  control row and the three-accent palette, and every Stage 5 capture is required
  to come from a built preview.
- **Renumbering propagated** to `PRODUCT.md`, `DESIGN.md`, `CAVEATS.md`,
  `README.md`, `docs/architecture.md`, `docs/design/build-plan.md` and
  `apps/site/.impeccable/surfaces/apps-site-src-pages-index-astro.md`.
  `docs/architecture.md`'s `## Design tokens` section gained a superseded note,
  because Stage 5 replaces the token set it documents while the section stays as
  the Stage 4 record. Log entries before this one are **not** rewritten: inside
  them, `5.x` means the wizard and `6.x` means deployment.

**Verified**

- `bun test` 138 pass / 0 fail, 493 `expect()` calls across 14 files.
- `bun run format:check` exits 1 on 7 vendored `.claude/skills/impeccable/**`
  files and names none of the eight documents this session edited, so the
  markdown scope exclusion holds.
- `data/derived.json` is still
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348` and was not
  regenerated.
- Every relative document link this session added or touched resolves, checked
  by resolving each target against its containing file's directory.
- The four answered planning questions were confirmed by the owner before any
  edit: Stage 5 owns `/start`'s layout only, PLAN.md owns sequencing, the toolbox
  diagnosis is corrected rather than carried, and Stage 5 closes with the
  design-record re-derivation.

**Decisions taken this session** (owner)

- The redesign is one stage of 15 tasks, landing across sessions the way Stage 4
  did, rather than several stages.
- Stage 5 gives `/start` its layout; the wizard flow stays Stage 6.
- PLAN.md owns sequencing; `docs/design/build-plan.md` keeps evidence and the
  frozen contract.
- The ECharts-toolbox diagnosis is corrected, not carried forward.
- Stage 5 closes with an impeccable `document` pass that re-derives `DESIGN.md`
  and `surfaces.md` from the built world.

**Still open**

- Stage 5 is entirely unbuilt; `apps/site` still ships the Stage 4 world.
- `DESIGN.md`'s readout docking contradicts `docs/design/surfaces.md`; 5.4
  resolves it in favour of the fixed 28 px line and 5.15 corrects `DESIGN.md`.
- Two build-session decisions stay recorded rather than resolved: the favicon
  redraw (5.2) and whether an authored technical figure appears below the fold on
  `/` (5.6).
- `AGENTS.md`'s layout block still lists `apps/site/src/lib/prefs.ts` as present;
  it is task 6.1 and is not in the tree. Recorded in "Open questions", not fixed.
- `bun run format:check` fails on 7 vendored
  `.claude/skills/impeccable/**` files, and none of the eight documents edited
  this session is among them (`**/*.md` is out of format scope). The path in the
  previous session's note, `.agents/skills/impeccable/**`, no longer exists; the
  skill now lives under `.claude/`. Recorded, not fixed — the fix is a tooling
  choice (an oxfmt ignore, or formatting files upstream will overwrite).

### 2026-09-17 — Plan review session: Stages 3–4 archived, plan rebuilt, tasks reviewed

No stage was opened. No source file, data file, test, chart or config changed;
the working tree holds documentation only. The session archived two landed
stages, rebuilt `PLAN.md` around the forward plan, repaired its cross-references,
and assessed every planned task. The task-by-task verdict, the repairs and the
owner decisions are recorded in
[`docs/archive/retrospective-2026-09-17.md`](docs/archive/retrospective-2026-09-17.md).

**Landed**

- **Stage 3 and Stage 4 archived.** `docs/archive/stages-3.md` carries Stage 3's
  task list, acceptance criteria, handover contract and eleven session entries;
  `docs/archive/stages-4.md` carries Stage 4's plus its four entries. Both were
  produced by slicing `PLAN.md` itself, so no entry was edited, reordered or
  summarised. Each archive opens with a note that task numbers inside an archived
  entry are the numbers in force when it was written, because the 2026-09-16
  renumbering moved the wizard to Stage 6 and deployment to Stage 7 — an archived
  entry that sends an item to "6.4's index hygiene" means today's 7.4.
- **`PLAN.md` rebuilt, 2,679 → 1,191 lines.** Out: the Stage 3 and Stage 4
  specifications and their 1,500 lines of progress-log entries. In: a
  `## Direction` section stating the completion definition once and ruling out
  tasks that do not move it; a one-line record of all four landed stages with an
  archive table; and **Stage 8 — Data integrity follow-ups**, explicitly off the
  critical path so a session can pick up 8.1 or 8.2 without entering the
  redesign.
- **Task review, Stages 5–7.** Four tasks changed and the rest kept as written:
  **5.2** now pins the woff2 acquisition to recorded sha256 values per file and
  resolves the favicon question at the 16px a tab renders, replacing a
  "build-session decision"; **5.9** gains the obligation to unit-test the five
  builders that were only ever verified by rendering, in the same commit as their
  re-theme; **5.13** states the 404 canonical defect directly instead of pointing
  at an archived note; **5.15** defines its deliverable as the corrected
  documents rather than as a skill invocation, so it is executable without the
  impeccable pass. **5.14** gains the four residues it must fix or exempt.
  **6.7 was merged into 6.1**, which already required the same boundary
  behaviour, leaving Stage 6 as 6.1–6.6.
- **Repairs.** `docs/architecture.md` sent index hygiene to "task 6.4", which is
  the wizard's shareable-result task; it now names 7.4. `README.md` claimed
  "Stage 3 will add the Astro development server" and "skeleton routes pending
  Stage 4 content", three stages stale; both were rewritten. `AGENTS.md`'s
  layout block listed `apps/site/src/lib/prefs.ts` as present; it now marks it as
  task 6.1, matching what `PRODUCT.md` already said.
- **The gate repaired.** `bun run check` had been red since 2026-09-16, when the
  vendored impeccable skill entered the tree without a lint or format exclusion;
  the previous session recorded half of it and never ran the failing step. Both
  tools now exclude `.claude/skills/**` alongside `tools/oxlint/anti-slop/**`,
  and the reason is recorded in `AGENTS.md`. This matters because Stage 5's
  acceptance opens with "`bun run check`, `bun test` and `bun run build` all exit
  0" — the stage could not have passed before this repair.
- **Open questions assessed against finished work.** Five live items that existed
  only in archived "Still open" lists were promoted into the live section and an
  owner named: the five untested builders (5.9), the eight plan rows at their
  Stage 1 revision (8.1), the `push: branches: [main]` trigger that has never
  fired, the deployed 404 status code (7.4), and the three accessibility
  residues (5.14). The `AGENTS.md` item was removed because the line it described
  was fixed. Every remaining item now states whether a task owns it.

**Verified**

- `bun test` 138 pass / 0 fail / 493 `expect()` calls across 14 files, unchanged
  from Stage 4.
- **`bun run check` is green again, and it was red before this session.** The
  gate has been failing since the impeccable skill was vendored on 2026-09-16:
  `bun run lint` exited 1 on
  `.claude/skills/impeccable/scripts/live-browser-session.js` (30
  `anti-slop/require-readable-spacing` errors), and `oxfmt --check` exited 1 on
  seven more files under the same tree. `.claude/skills/**` is vendored upstream
  code this repository does not own, so it is now excluded from both tools
  exactly as `tools/oxlint/anti-slop/**` already was. No rule was weakened, no
  severity changed, and no first-party file needed an edit. Before: `lint` exit 1.
  After: `bun run check` exit 0 — typecheck, oxlint, `oxfmt --check` clean over 79
  files, `astro check` over 63 files with 0 errors / 0 warnings / 0 hints. The
  previous session recorded the formatter half as a "tooling choice" and never
  saw the linter half, which is the half that was blocking.
- No file under `data/**`, `packages/**` or `apps/**` was touched, and `PLAN.md`
  plus the archive documents are outside the formatter's scope (`**/*.md`).
- `data/derived.json` is still
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348` and was not
  regenerated: **no published number moved in this session.**
- The archive slices were checked line by line against the `PLAN.md` they came
  from, and every relative link this session wrote resolves with its target
  present on disk.

**Decisions taken this session** (owner)

- The Console Listing redesign keeps its order and its grain: Stage 5 runs before
  the wizard and before deployment, and stays one stage of fifteen tasks.
- The design documents keep their current owners; no consolidation, no deletion.
- Three recorded gaps become work: the eight plan rows that fail the anchor check,
  the two 404 evidence URLs, and unit tests for the five untested chart builders.
- Stage 8 is scheduled off the critical path rather than as a fourth sequential
  stage, so it cannot delay the redesign.
