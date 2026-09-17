# PLAN archive — Stage 4 (charts and insight pages) and its session history

Append-only history for the `rack-rate` rewrite. `PLAN.md` is the live plan; a
stage's task list, acceptance criteria, handover contract and progress-log
entries move here once the stage has landed. Do not rewrite what is here.

Read [`PLAN.md`](../../PLAN.md) first, then `AGENTS.md`.

**Task numbers inside the archived entries are the numbers in force when they
were written.** The 2026-09-16 session renumbered the wizard to Stage 6 and
deployment to Stage 7; see the same note in
[`stages-3.md`](stages-3.md). The entries are not rewritten.

---

## Stage 4 — Frontend build (charts and insight pages)

**Goal:** the insight surface. Every chart type from the research pass exists,
driven by `@rack-rate/core` output, mobile-first.

### Tasks

- [x] 4.1 `src/lib/charts/` — pure option builders (`(data) => EChartsOption`)
  with a shared tree-shaken `echarts/core` registration module. One mount
  helper handling `ResizeObserver`, `prefers-reduced-motion`, and disposal.
  Charts load via dynamic `import()` so a page without charts ships no chart
  code.
- [x] 4.2 **Pareto scatter** — log cost axis, frontier polyline, shaded
  dominated region, labelled outliers, hover/zoom. Two cost bases as a toggle
  (API list ↔ selected plan route) with the basis in the title. Effort variants
  render as a connected trail off the pinned point.
- [x] 4.3 **Bump/rank chart** — rank across benchmarks, missing benchmark as a
  broken line with a gap marker, never interpolated. Overlapping CIs render as
  tied rank ranges.
- [x] 4.4 **Model × benchmark heatmap** — diverging `visualMap` centred on 0,
  hatched neutral cells for "not evaluated", never a low score.
- [x] 4.5 **Slope chart** — API list price against plan route for one model,
  one line per candidate plan, savings implied by the slope.
- [x] 4.6 **Quota burn-down waterfall** — quota → used → remaining per period,
  driven by a utilization input, deficit below zero.
- [x] 4.7 **Radar of per-index z** — axes in z units, overlay the models a
  selected plan can actually run.
- [x] 4.8 `/models` sortable, filterable table: score, best API cost, cheapest
  usable plan, value multiple, days-to-full-run, effort, badges. The old page's
  sortable six-column table is the floor here, not the ceiling.
- [x] 4.9 `/models/[slug]` — one page per model: score profile, effort ladder,
  priced plan routes with cost-per-task, provenance rail (formula, days for a
  full run, evidence cards), and outbound links to the upstream benchmarks.
- [x] 4.10 `/plans` and `/plans/[slug]` — plans ranked by value multiple, with
  quota model, rolling window, measured-against model, confidence, and the
  models it unlocks.
- [x] 4.11 `/compare` — 2–4 models side by side across all benchmarks and cost
  bases, with the tie rule visible.
- [x] 4.12 `/` — hero answering the two questions, the budget calculator from
  the old site (ported, not reinvented), top insights, and entry points into the
  detail pages.
- [x] 4.13 `/explore` — the chart builder, and the answer to "the graphs are
  bad and there are no custom graphs": the visitor chooses the y metric (any
  benchmark score, composite `T`, or token-ratio metric), the x metric (API-list
  $/task, plan-adjusted $/task, tokens/task, steps/task, or a benchmark score
  for a head-to-head scatter), the chart type, the filters (vendor, effort
  level, score floor, ignored models/plans), a log/linear axis toggle, and
  whether the Pareto frontier and dominated-region shading are drawn. Plus the
  composite weight sliders with presets, recomputing the composite client-side
  from shipped per-benchmark z-scores — no refetch. Every setting is encoded in
  the URL so a configuration is shareable, and it persists as a preference.
- [x] 4.14 Headline insight copy for each page: one sentence per chart that
  states what it shows, generated from the data where possible rather than
  hardcoded, so it cannot drift from the numbers.
- [x] 4.15 Accessibility and mobile pass: keyboard navigation for every chart,
  table semantics, focus states, `prefers-reduced-motion`, touch targets,
  360 px layout, contrast ≥ 4.5:1 for text.

### Acceptance

Every route renders real data from `data/derived.json` with no client-side
data fetching. Pareto frontier matches `@rack-rate/core` output on a fixture
checked by eye. Keyboard-only traversal of `/models` and the Pareto chart
works. Verified on a real browser at 360 px and at desktop width.

---

## Progress log

Append-only. The entries below are the Stage 4 sessions exactly as they stood
in `PLAN.md` before this file was created; no entry was edited, reordered or
summarised. Earlier entries are in [`stages-3.md`](stages-3.md).

---

### 2026-09-14 — Stage 4.1: the chart platform, and the validator that was riding along

`apps/site/src/lib/charts/` holds the platform: `registry.ts` (the repository's
only `echarts.use()` call), `theme.ts` (the `@theme` token reader and one accent
per cost basis), `frame.ts` (the shared cartesian frame and the series marker),
`mount.ts` (the mount helper), and `frame.test.ts` / `theme.test.ts` for the
pure halves. 4.1 registered `CanvasRenderer`, `GridComponent`,
`LegendComponent`, and `TooltipComponent` — the renderer plus the components the
frame and the preserved chart features use — and each series type is registered
by the stage that lands its first builder (4.2 scatter, 4.3 line, 4.4 heatmap
and `visualMap`, 4.5 line, 4.6 bar, 4.7 radar). `ChartOption` is
`ComposeOption<FrameComponentOption>`. The sentence this entry originally
carried here — that an option object therefore cannot carry a series type no
stage registered, and a missing `use()` is a type error rather than a blank
chart — is false and is superseded by "Second review finding" and "Third review
finding" below; the option type accepts any extra key, and the registry checks
series names at mount time instead. Builders stay pure — `(data) => ChartOption`,
no `use()`, no DOM, no clock — and `mount.ts` is the only module in the
directory that touches `window`.

**The mount contract.** `mountChart(target, option)` refuses an element that
already holds an instance (`the element already holds a chart instance; dispose
the existing handle first`), applies the option with `notMerge: true`, and
returns `{ update, dispose }`. A `ResizeObserver` on the target calls
`chart.resize()`. A `MediaQueryList` listener for
`prefers-reduced-motion: reduce` re-applies the current option with
`animation: !motion.matches`; it is a live listener rather than a one-time read
because reduced motion is a setting a reader can change while the page is open.
`update()` after `dispose()` throws `the chart was disposed; mount a new one`
instead of silently doing nothing, and `dispose()` is idempotent, disconnects
both listeners, and leaves the element reusable by a later mount. Token reading
is live (`getComputedStyle(element)`), so the light scheme's token
re-declaration reaches charts with no chart-side code.

**The client bundle, measured.** The first client modules exposed a cost stage 3
never paid: `apps/site/src/lib/provenance.ts`, which every chart option builder
reaches, imported `ARTIFICIAL_ANALYSIS_BENCHMARK_ID` from `@rack-rate/core`,
whose barrel re-exports `schema.ts` — the one core module that builds zod
schemas. One id pulled the whole validator into the browser bundle. Measured
with the bundler: importing that id produced 99,247 bytes and importing
`roundHalfEven` 99,721, against 514 bytes for the same rounding through
`@rack-rate/core/cost`. Three changes: the ids moved to
`packages/core/src/ids.ts`, a zod-free module the barrel re-exports (public
surface unchanged, one home kept); `format.ts` and `provenance.ts` import the
narrow subpaths `@rack-rate/core/cost`, `@rack-rate/core/ids`, and
`@rack-rate/core/freshness`; and `packages/core/package.json` declares
`"sideEffects": false`, which is truthful for a package that is pure by
invariant and makes a bare barrel import of a pure core value drop the schemas
too. No built client chunk carries a zod marker. `docs/architecture.md` records
the rule and its measurements under "Charts".

**Verified**

- `bun run check` exits 0: `tsc --build --force`, oxlint with every rule at
  error severity, `oxfmt --check` clean over 53 files, `astro check` over 34
  files with 0 errors, 0 warnings, 0 hints.
- `bun test` reports 98 pass, 0 fail, 284 assertions in 9 files (76 pass, 231
  assertions, 7 files at 3.11; the 22 new cases are the frame and theme suites).
- Browser, headless Chromium against `astro preview` on the built `dist/` at the
  real `/rack-rate` prefix, driving a throwaway probe page (deleted afterwards)
  whose script asserted in-page and reported 0 failures:
  - The frame's real option object drives a real chart: title
    `API list $/task`, `yAxis.type` `log` from the caller's axis spec, tooltip
    background `#111825` — the `--color-panel` token arriving through
    `readChartTokens` — and `animation: true` with no reduced-motion preference.
  - Resize: narrowing the host from 990 px to 420 px moved the canvas to 418 px
    with a 522 px backing store at `devicePixelRatio` 1.25, through the helper's
    own observer and never a manual `chart.resize()`.
  - Reduced motion: emulating `reduce` flipped the live option to
    `animation: false`; emulating `no-preference` flipped it back to `true`.
  - Disposal: `dispose()` left 0 canvases, cleared `_echarts_instance_`, and
    emptied the element; a second `dispose()` was a no-op; `update()` after it
    threw `the chart was disposed; mount a new one`; remounting the same element
    painted a chart again; a second mount threw the occupied-element error.
  - 360 px: `documentElement.scrollWidth` 360 with `clientWidth` 360, zero
    elements past the viewport, and both chart canvases at their host widths
    (326 px and 254 px).
  - Chart-free route: `/models` emits 0 `<script>` tags, 0 `modulepreload`
    links, and its browser makes 0 `.js` requests.
- A hidden headless page cannot measure the observer work: while the document is
  hidden, `requestAnimationFrame` stops, so `ResizeObserver` callbacks never
  arrive — a control observer took 0 entries while the host narrowed from 990 px
  to 398 px and the canvas stayed at 990 px. Calling
  `Emulation.setFocusEmulationEnabled({ enabled: true })` after
  `page.bringToFront()` restores the loop (92 frames in 1.5 s) and the callback
  (host 418 px, canvas 418 px). `docs/architecture.md` records the step so the
  next stage does not re-diagnose it.
- `bun run data:check` exits 0 and `data/derived.json` is still sha256
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`: the ids
  split moved no published byte.
- `bun run build` exits 0 with 53 pages, and `dist/og.png` is still sha256
  `23677cc0c0657b479ac3c967711b5c1f2162e6847529214152cd3943b1af04ed` at
  1200×630. With the probe deleted, `apps/site/dist/_astro/` holds no `.js` file
  at all: every route in the 4.1 tree ships zero client JavaScript.
- On the probe build, before deletion, the chart-bearing page made 6 `.js`
  requests: the ECharts core chunk at 458 KB, plus option-builder, theme, frame,
  and mount chunks at 1.5 KB, 1.7 KB, 1.5 KB, and 0.6 KB.
- `bun run quality` (report-only, out of the gate) exits 1: dead-code 17 issues,
  dupes 10 clone groups, health 144 above threshold over 668 analysed files,
  maintainability 90.2. The two entries this stage owns are
  `apps/site/src/lib/charts/mount.ts`, unreachable from any entry point, and
  `theme.ts`'s `readChartTokens`; both are consumed by 4.2.

**Review correction after the stage's own checks passed**

An independent review pass on the committed chart modules found one real defect,
in the frame. `grid.outerBoundsContain` was `"axisLabel"`, copied from the
documented `containLabel` replacement, and ECharts skips axis-name layout
entirely for that value (`Grid.js`, `createOrUpdateAxesView`: the name is built
only when `outerBoundsContain === "all"`). The name was therefore drawn outside
the plot box on every chart the frame builds: at 360 px and at 1280 px, `$/task`
clipped in half at the canvas top and `tasks / month` fell off the right edge —
width-independent, because the frame's own margins are. The frame comment
claiming `"axisLabel"` contained names was wrong and is replaced. The fix is
`outerBoundsContain: "all"`, verified by rendering the frame's own option at
360 px (host 326 px) and at 1280 px and reading both canvases: both names fully
inside the canvas at both widths, with the plot shrinking to fit.
`frame.test.ts` gains a test that asserts the labelled axes and the containment
together — it fails on `"axisLabel"` (checked by flipping the value back, 5 pass
/ 1 fail), so the regression cannot ship silently. `bun test` is 99 pass, 286
assertions in 9 files. No other finding from the review changed code.

**Second review finding: the option type's safety claim was false**

The same review pass checked the claim that `ChartOption` cannot carry a series
type nobody registered. It cannot hold: `ComposeOption` keeps
`ECBasicOption`'s string index signature (`shared.d.ts`; `ECUnitOption` ends in
`| unknown`), so the alias types the *values* of declared component keys —
`{ grid: { outerBoundsContain: "nope" } }` and `{ xAxis: { type: "nonsense" } }`
are compile errors, confirmed by a throwaway `tsc --build` probe — but it
accepts any extra key. `series`, `dataZoom` and an invented component key all
compiled. The comment in `registry.ts` and the `ChartOption` row in
`docs/architecture.md` claimed otherwise and are corrected.

Registration is therefore enforced by discipline and measurement, not by types,
and the measurement matters because ECharts 6 fails silently: with
`CanvasRenderer`, grid, legend and tooltip registered and nothing else, mounting
`{ series: [{ type: "scatter", data: [[1, 2]] }] }` threw nothing, logged
nothing in either build, and left `getModel().getSeries()` empty while
`getOption()` echoed one series in a production build and zero in a dev build.
A plot of axes with no points reads as "no data", so each builder stage must
prove its own series registered in its browser probe:
`chart.getModel().getSeries().length` must equal the number of series its
builder declares. `docs/architecture.md` records that obligation, the
measurement, and why `mount.ts` does not call the private `getModel()` itself to
enforce it. The review's second note — a per-series `animation: true` outranks
the mount helper's global `animation: !prefers-reduced-motion` because ECharts
resolves own-before-parent — is recorded as a constraint on builders; no series
exists in 4.1, so it changes no code.

**Third review finding: the guard belongs in the registry, not in `getModel()`**

The correction above left registration enforced only by review, and proposed —
superseded by this paragraph — that each builder stage prove it in its own
browser probe with `chart.getModel().getSeries().length`. That is the wrong
shape twice over: `getModel()` is private in ECharts' declarations, so the check
would need an assertion plus a defensive fallback that silently disables itself
on upgrade, and a per-stage probe is a convention rather than a guard.

It is now guarded with public data only. `registry.ts` holds `SERIES_INSTALLS`,
one row per family pairing the install object `use()` receives with the
`series[].type` string an option must use, and `use()` is fed from those rows —
so registering a family and teaching the guard its name are the same edit — and
`unregisteredSeriesTypes(option)` compares an option's declared types against
them. `mount.ts` calls it before `setOption` and throws `the option declares the
unregistered series type scatter: add it to SERIES_INSTALLS in
src/lib/charts/registry.ts`; the refused mount disposes its instance, so a retry
reports the real problem instead of "already holds a chart instance".
`registry.test.ts` covers the pure half in five cases (a missing type named once
for two series, no series at all, a series with no `type` field, a single series
object rather than an array), and the table starts empty, so the guard rejects
every named family until 4.2 adds the scatter row.

Verified on the built site in both directions. Unregistered: the frame option
mounts and paints 12,229 pixels; the same option plus
`{ type: "scatter", data: [24 points] }` throws the guard's message, leaves the
host with zero `<canvas>` elements and zero instances behind, after which
mounting the frame option on that same element succeeds. Registered: with a
temporary `{ install: ScatterChart, type: "scatter" }` row the same option
mounts silently and paints 19,000 pixels against the frame's 12,227; the row was
then removed and the build re-verified without it. The earlier `getOption()`
divergence (one series echoed in a production build, zero in a dev build) is
kept in `docs/architecture.md` as the reason the option echo is not a usable
detector either.

**Still open**

- 4.2 is the first consumer of the platform: until it lands, `mount.ts` and
  `readChartTokens` are deliberately unreferenced, and the browser pass above is
  the only thing that has executed them.
- 4.2–4.15 remain: the six chart types, the tables and pages, and the
  accessibility pass. Each new series type registers in `registry.ts` in its own
  stage, and each chart page's script dynamically imports its builder.
- Every Stage 4 template inherits the whitespace obligation in
  `docs/architecture.md`: a visible space at a line boundary between text and a
  tag stays on that line or is written `{" "}`.
- The 404 route still carries a canonical for a path with no page and no
  `noindex`; that is 6.4's, unchanged by this stage.
- `bun run quality` stays report-only; it is not a gate.
- The `push: branches: [main]` CI trigger has still not fired: local `main` is
  unpushed, so the first live use of that trigger is the owner's next push.

### 2026-09-14 — Stage 4.2: Pareto scatter on /explore

**Landed**

- `pareto-payload.ts` builds one `ParetoPayload` containing 16
  `ParetoBasisView`s: one API-list view and 15 plan-route views. It combines
  committed `frontiers.api` and `frontiers.plan_adjusted` from
  `data/derived.json` with `models.json`, `benchmarks.json`, and `plans.json`.
  The encoder escapes `<` as `\u003c`. The decoder refuses empty `bases`, or a
  view with an empty `points` or `frontier` array; it does not revalidate fields
  because the same build writes and reads the payload, so no external producer
  reaches it, as recorded by its SAFETY comment.
- `pareto.ts` builds the fixed scatter: log `$/task` x-axis, DeepSWE v1.1
  `pass@1` y-axis, frontier polyline, dominated region, labels, tooltip,
  inside-plus-slider zoom, and effort trails. Frontier points plus the three
  worst-value dominated points (`distance.cost_ratio` descending) are labelled.
  The frontier line extends to the axis maximum at the last frontier score.
  Trails are dashed 4 px line series for models with at least two effort
  variants, and are API-list only.
- `pareto-page.ts` reads the inline payload, resolves the basis radio group and
  plan select, mounts the chart, and rebuilds on every control change. Each
  rebuild rewrites the title, note, and host `aria-label`. `explore.astro`
  carries the controls, payload script, chart host, `/method` noscript link,
  and dynamic page import. `registry.ts` registers the scatter and line
  families, the `DataZoomComponent`, and the `LabelLayout` feature;
  `FrameComponentOption` includes `DataZoomComponentOption`. `MarkAreaComponent`
  is not registered: no option uses `markArea`, and its key was never admitted
  by the option type, so the mid-stage registration was removed.

**Measured**

- All 16 views' frontier arrays and point counts equal the corresponding
  committed derived entries exactly. The API-list view has 28 points and these
  six frontier ids: `deepseek-v4-flash`, `deepseek-v4-pro`, `glm-5.3-flash`,
  `gemini-3.7-flash`, `gemini-3.8-flash`, and `gpt-6-astra`.
  `chatgpt-plus` has 6 points / 3 frontier models; `opencode-go` has
  1 point / 1 frontier model.
- On the built page, toggling to ChatGPT Plus changes the title to
  `ChatGPT Plus route $/task`, names that plan in the note, changes the marker
  accent from API to plan-route, and re-renders each selected plan, including
  the single-point `opencode-go` view. Tab plus Arrow Right/Left switches the
  basis. Hover reads `deepseek-v4-flash · 53.3% · $0.0304 · Ollama Pro route`
  on the panel token. A wheel over the plot narrows the x window; the frontier's
  painted pixels fell 1787 → 283 → 1 as the cheap end filled the window, and
  the slider is the second draggable path.
- With `prefers-reduced-motion: reduce`, the canvas hash was byte-identical at
  120 ms, 370 ms, and 770 ms after switching basis. With motion allowed, the
  frames at 120 ms and 370 ms differed.
- At 360 px, `scrollWidth === clientWidth === 360`, no element crosses the
  right edge, the chart host and canvas are each 328 px wide, and controls
  wrap to one per line. The page makes four requests: the document, one CSS
  file, the page script, and one 562 KB JavaScript chunk carrying ECharts and
  the builder; it makes zero requests for `data/*.json`. `/models` still emits
  zero `<script>` tags and zero `modulepreload` links.
- The chart host's accessible name follows the active view. For ChatGPT Plus
  it reads `6 committed models plotted against ChatGPT Plus route cost per
  task; 3 frontier models; JavaScript is required to draw this chart.` The
  API-list state matches the static `explore.astro` text.

**Review corrections after the stage's own checks passed**

- The first built chart carried ECharts' default palette on the dataZoom slider
  — blue handles, blue filler — while every other chart colour was a token. The
  slider's border, background, filler, both handles, data background, selected
  data background, emphasis, and text now come from tokens, and the frontier
  line gained an `itemStyle` in `tokens.ink` so its legend swatch matches the
  drawn line. Measured on the rebuilt chart: zero pixels of ECharts' default
  palette in either basis.
- `labelLayout: { hideOverlap: true }` did nothing, because this stage
  registered a series family but not the `LabelLayout` *feature*: without it
  `installLabelLayout` never registers the `series:layoutlabels` lifecycle, so
  `LabelManager.layout()` — the only caller of `hideOverlap` — never runs. All
  nine labels were drawn on top of one another at 360 px; with the feature
  registered, six of nine are drawn and no data label sits on another.
- The stage registered `MarkAreaComponent` although nothing used `markArea` —
  the dominated region is the frontier series' `areaStyle` — and the option
  type never admitted the key. Removed, and the comment in `registry.ts`
  corrected.
- The chart host's `aria-label` was written once from the API-list view and
  never rewritten, so after switching to a plan route a screen reader was told
  28 models and an API-list basis while the chart showed the plan's own points.
  It is now rewritten on every rebuild.

**Still open**

- 4.3–4.15 remain. 4.13 will replace this fixed chart with the metric/axis/filter
  builder.
- At 360 px the `deepseek-v4-flash` label partly covers the `60.0%` axis tick;
  4.15's mobile pass owns that repair.
- Plan-route views draw no effort trails by design: an effort variant's plan
  cost is not a published figure.
- The 404 route's canonical/`noindex` item is still 6.4's.

### 2026-09-14 - Stage 4.3: bump/rank chart

**Landed**

- `bump-payload.ts` builds the inline ranked payload; `bump.ts` builds the
  model lines, gap markers, tied-rank bands, and lane separator; and
  `bump-page.ts` decodes and mounts the chart. `/explore` now carries the
  second chart section. `frame.ts` gained category, inverse, and interval axis
  support, and `MarkLineComponent` is registered for the tie bands and lane
  separator.
- Review caught all 16 gap markers collapsed onto one identical point, leaving
  only the topmost hoverable. Per-item `symbolOffset` now spreads them into 16
  distinct hollow markers; six real hovers named six different missing models.
  Review also caught the doubled `not evaluated` lane label. Removing the
  markLine label leaves the y-axis lane tick as the single label, and a unit
  test fails if a second one appears.
- On the same geometry, the real option painted 78,273 pixels versus 78,263
  with `connectNulls: true` (−10); filling every gap with its lane rank painted
  93,811 (+15,538), so both designs were refused. With `MarkLineComponent`
  unregistered, tie-band pixels fell to 0 and the total fell 38,187 → 35,868;
  restoring it produced 1,608 tie-band pixels, identical to the original.
- At 360 px, `scrollWidth === clientWidth === 360`; the bump canvas is 328 px
  wide at x = 16, the marker row stays inside the canvas, and no label pair
  collides. The marker spread also held at 900 px.

**Still open**

- 4.13 replaces this fixed chart with the metric/axis/filter builder.
- 4.15 owns the Pareto chart's 360 px label/tick collision.
- Plan-route views draw no effort trails: an effort variant's plan cost is not
  a published figure.

### 2026-09-14 — Stage 4.4–4.15: the remaining charts, the insight pages, the mobile pass

**Landed**

- Four chart slices. `heatmap.ts` (diverging `visualMap` centred on 0,
  hatched decal cells for `not evaluated`), `slope.ts` (API list against plan
  route for one model, one line per candidate plan), `waterfall.ts` (quota →
  used → remaining under a utilization input, deficit below zero), `radar.ts`
  (per-index z over the models a selected plan admits) — each with its payload
  module and its `components/*Section.astro`.
- Five page slices. `/models` (28-row table, sortable headers with
  `aria-sort`, name/vendor/score-floor filters that hide rather than remove),
  `/models/[slug]` (score profile, effort ladder, priced routes, provenance
  rail), `/plans` + `/plans/[slug]` (ranked by value multiple, the models a
  plan unlocks), `/compare` (2–4 models, tie ranges, URL round-trip), `/`
  (hero, the ported budget calculator, insights, entry points).
- `/explore` gained the metric builder: y metric (any benchmark score,
  composite `T`, tokens, steps), x metric (API list $/task, plan-adjusted
  $/task, tokens, steps, benchmark score), chart type, vendor/effort/score-floor
  filters, log-axis and frontier toggles, and composite weight sliders with
  presets recomputing `T` client-side from shipped z-scores.
- 4.14: every route carries at least one sentence computed from the committed
  documents (e.g. `/plans`: "16 committed plans ranked by value multiple; 15
  have a committed multiple, led by Claude Max 20x at 127.36×").
- 4.15: measured, not asserted. Ten routes at 360 px report
  `scrollTo(9999, 0) → 0`; every interactive element on the seven content
  routes has an accessible name, with 28 CI bars and 7 chart hosts carrying
  `role="img"`; `Enter` on a `/models` header button sets `aria-sort`;
  `Space` on the Pareto "Plan route" radio re-renders and rewrites the chart's
  accessible name. Header nav links were 16 px tall and are now 27 px.

**Review caught, in this session**

- The calculator resolved a plan's model only from `measured_against_model`
  and printed "No priced route" for 13 of the 16 plans that have one — it
  computed 2 plans where the burn-down chart computed 15. Both surfaces now call
  `waterfall-payload.ts`, the difference is one sentence of committed data for
  `google-ai-pro`, and the column is renamed **Model priced** because the
  cheapest-route fallback makes "measured model" a false claim.
- `Badge.astro` was not a containing block for its `sr-only` children, so 28
  badges in `/models` laid their accessible text out at x = 735 inside the
  overwide table: `documentElement.scrollWidth` was 736 at a 360 px viewport
  and the page really scrolled 376 px into blank space — on `/models`,
  `/models/[slug]`, `/plans`, `/plans/[slug]` and `/compare`. One
  `relative` in the badge's class list ends it. The same class of bug put a
  493 px `<select>` on the explore surface: a select cannot shrink below its
  widest option without `min-w-0`.
- The heatmap's legend and `visualMap` shared the canvas bottom, so both series
  names sat on the colour bar, and the grid's 16 spacing units put the x-axis
  labels in the bar's band. `gridBottom: 76` plus a right-corner legend
  separates the bottom into the label band (488–498), the axis name (518–527)
  and the bar with its legend (535–560) on a 576 px canvas.
- The slice batch landed with 29 anti-slop findings across 9 files, three
  `astro check` errors and one unused import, all cleared; `oxfmt` then
  reflowed three blank lines the lint fix had added, so the two pass over the
  union until both are clean.
- Composite parity was checked rather than assumed: the payload's z-scores at
  the committed weights reproduce every committed `composite` for the 12
  models with `k ≥ 2` to within 0.001, and the 16 below the gate render
  `single-source` with no `T`.

**Verified**

- `bun run check` green end to end: `tsc --build --force`, `oxlint` clean,
  `oxfmt --check` clean, `astro check` 0 errors / 0 warnings / 0 hints over 63
  files. `bun test` 138 pass / 0 fail. `bun run data:check` reports the
  committed `derived.json` current. `bun run build` emits 53 pages plus
  `og.png`.
- In a real browser: seven chart hosts mount and paint (992×416 to 992×576); the
  browser requests no `.json` path on any route; the calculator recomputes
  $2,452.4 → $6,158.45 for Claude Pro at 600 tasks/month
  (`20 + (600 − 103.1) × 12.3535`); `/compare` enforces the 2–4 bound with
  its `aria-live` text matching both ends and clears the query below the
  minimum.
- Reduced motion: all seven charts paint under
  `prefers-reduced-motion: reduce` (225,946 px in the Pareto canvas up to
  251,504 px in the builder), and flipping the media feature back to
  `no-preference` mid-session re-applies every option through `mount.ts`'s
  `change` listener without losing a chart.
- Degenerate inputs degrade to the default four rather than breaking:
  `?models=not-a-model,nope`, five ids, a duplicated id, and a single id each
  render the default selection in 6 columns / 13 rows with the status text
  matching, and the page rewrites the query from the resolved selection.
- `/models` sorts numerically, not lexicographically over formatted text: the
  comparator parses `data-score` with `Number.parseFloat` and falls back to
  `localeCompare` only for non-numeric columns, and the 28 rendered scores run
  monotone 11.73 → 74.12 ascending, reverse, then ascending again.
- The routes checked only for overflow were spot-checked for content:
  `/models/gpt-6-astra` renders its own headline's 7 priced routes,
  `/plans` renders 16 rows for 16 committed plans, `/plans/claude-pro` renders
  the 5 admitted models, and every cost cell carries its basis chip. Zero
  console errors across the routes visited.

**Still open**

- Touch targets: header nav is 27 px, but in-content prose links stay 16 px tall
  (WCAG 2.5.8 exempts links inside a sentence) and `/compare`'s 13 px
  checkboxes are hit through their 24 px labels.
- 5.1 owns preference persistence (`prefs.ts`) and the wizard; `/explore`'s
  settings are URL-encoded but not yet stored.
- The four new builders and the metric builder ship without unit tests, unlike
  `frame`/`pareto`/`bump`. Their options were checked only by rendering them in
  a browser. Anything that starts relying on these builders' geometry or payload
  shape (Stage 5's wizard, a refactor) should pin it first.
- Stage 4 is placeholder-grade by instruction: the surface is complete and
  measurable, not pixel-finished. A UI refactor is expected to rewrite it.
