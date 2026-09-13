# PLAN.md

Roadmap for the `rack-rate` rewrite. **One stage per session.** Read
`AGENTS.md` first; it holds the stack decisions and the invariants this plan
assumes.

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

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

## Stage 1 — Initialization

**Goal:** a Bun workspace that installs, typechecks, and has the contracts
frozen, with no application logic yet.

### Tasks

- [x] 1.1 Workspace skeleton: root `package.json` with `workspaces: ["packages/*", "apps/*"]`, `packages/core`, `packages/data-cli`, `apps/site` each with their own `package.json`. *(root + package manifests written)*
- [x] 1.2 Root `tsconfig.json` (project references into the three packages) and one `tsconfig.json` per package. Decide and record: single root `tsconfig` vs references. Requirement: `bun run typecheck` typechecks all three trees.
- [x] 1.3 `packages/core/src/schema.ts` — zod schemas and inferred types for `models.json`, `plans.json`, `benchmarks.json`, `sources.json`, `derived.json`. This is the contract every later stage imports. Port the field set from the existing `data/*.json` (do not invent fields) plus the additions listed in "Data contract" below.
- [x] 1.4 `data/*.json` migrated to the new schema: existing `models.json` (28 models), `plans.json` (16 plans), `sources.json` (9 records) stay as the seed; add `benchmarks.json` skeleton with one `deepswe` entry carrying `version`, `generated_at`, `task_count`.
- [x] 1.4b **Freeze the legacy pipeline's output as a golden fixture before
  deleting it.** The current `compute.py` works and its output
  (`data/derived.json`: 178 pairs, 28 best routes, cross-check median 1.601 over
  n=11; plus `data/derived.csv`) is a free, real regression oracle. Copy both to
  `data/fixtures/legacy-derived.json` / `.csv`, commit them, and record in the
  fixture's provenance header the exact commands that produced them
  (`python scripts/validate.py && python scripts/compute.py`) and the input
  files' hashes. Paraphrasing the invariants below is not enough — this fixture
  is what proves the TypeScript port did not silently drift:
  1. citation enforcement — a plan `evidence` id that does not resolve to
     `data/sources.json` fails validation;
  2. the `quota_model` union `budget | credits | requests | tokens_total`, with
     `model_scope` gating so a Claude plan can never price a Kimi model;
  3. `days_for_full_run` capped by the rolling window (5 h), not only the
     monthly quota;
  4. `known_gaps` carried through as a backlog, not dropped.
  Do this **before** 1.5 runs. Until this task executes, no fixture exists —
  `data/derived.*` is legacy build output, not a committed regression oracle.
- [x] 1.5 Delete the superseded stack: `scripts/*.py`, `site/template.html`,
  `site/index.html`, `site/fonts/`, `vercel.json`, and Vercel Web Analytics (dead
  once the site is off Vercel). Retire the generated `data/derived.*` once Stage 2
  regenerates them. *(Owner decision: clean cutover, not a parallel track — but
  only after 1.4b has frozen the legacy output as a fixture.)*
- [x] 1.6 Reorganize `docs/`: keep `docs/research/*.md` as the cited record, keep `docs/data-sources.md`, add `docs/architecture.md` (module graph + boundary rules), and move the old `SOURCES.md` content into it or retire it with a pointer.
- [x] 1.7 `.gitignore` for the new stack: `node_modules/`, `dist/`, `.astro/`,
  `data/raw/`, `.env*`, `*.tsbuildinfo`. *(Written during initialization; the
  legacy Python entries stay until 1.5 deletes the last `.py` file.)*
- [x] 1.8 Rewrite `README.md` for the new stack: what it answers, quickstart commands, project layout, sources/licensing pointer. Keep the credit to real-api-pricing and the measured-quota contribution path from the old README.
- [x] 1.9 `bun install` succeeds; `bun run check` runs and passes (typechecking
  only the migrated schema for now); `bun test` reports zero tests without
  error. *(Install verified during initialization: 301 packages, `bun.lock`
  written and meant to be committed. `check` still fails on the missing root
  `tsconfig.json` from 1.2 — expected, not a regression. `test` passes with the
  `--pass-with-no-tests` flag.)*

### Acceptance

`bun install && bun run check && bun test` exits 0 on a clean clone with no
Python installed. (`test` is declared `bun test --pass-with-no-tests` because
Stage 1 ships zero test files; `bun test` alone exits 1 when no files match, and
the flag becomes a no-op once Stage 2 adds tests.) `packages/core/src/schema.ts`
parses the three committed data files successfully (one throwaway script proves
it). No `.py` file remains in the tree.

Note: this describes the pre-execution state. Before Stage 1 ran, task 1.1 was
complete and 1.2–1.9 were not, so `bun run check` failed on the missing root
`tsconfig.json` — the expected starting state, not a regression. See the
Progress log entry for 2026-09-14 for the post-execution state.

### Contract handed to Stage 2

`@rack-rate/core` exports zod schemas + types; `data/*.json` conform to them;
`bun run check` / `bun test` are the gate commands.

---

## Stage 2 — Data points (fetch, normalize, validate, compute)

**Goal:** `bun run fetch` refreshes every source into committed JSON;
`bun run validate` catches a broken source; `bun run compute` produces
`data/derived.json`. No site work.

### Tasks

- [ ] 2.1 `packages/data-cli/src/http.ts` — `fetchJson`/`fetchText` with
  `AbortSignal.timeout(15_000)`, 3 attempts, exponential backoff + jitter,
  429 `Retry-After` honoured, `User-Agent: rack-rate/<version> (+repo url)`,
  raw snapshot cached under `data/raw/<source>-<YYYY-MM-DD>.json` so diffs are
  reviewable. Retry only network errors and 5xx; fail fast on 4xx.
- [ ] 2.2 `fetch deepswe` → `data/models.json`. Live artifact
  `artifacts/v1.1/leaderboard-live.json`, fallback `v1`. Reduce one row per
  `(model, harness, effort)` to one model row at the highest-scoring effort,
  keeping `effort_variants`. Map `provider` from an explicit hand map
  (the field is absent upstream on ~65/70 rows); unmapped → `null`, never a
  guessed vendor. Use medians, not means. Carry `ci_lo`/`ci_hi`/`ci_method`,
  `generated_at`, `n_tasks_in_set`.
- [ ] 2.3 `fetch terminal-bench` → `data/benchmarks.json#terminal-bench`.
  Parse the embedded flight data for board `4-0-0` (queryKey
  `["leaderboard","terminal-bench/terminal-bench","4-0-0"]`); on parse failure
  fall back to `harbor hub leaderboard show … --json` and log which path was
  used. Never parse `display_accuracy` / `display_cost` strings. Record board
  slug + `dataset_version_ids` UUID + `updated_at` as provenance.
- [ ] 2.4 `fetch artificial-analysis` → `data/benchmarks.json#artificial-analysis`.
  Gated and **off by default**: no redistribution right has been granted, so the
  fetcher runs only when `AA_API_KEY` is set **and** `AA_PUBLISH=1`; otherwise it
  skips with a clear message and AA is excluded from data, composites and the
  site (the Sources page links out instead). When enabled:
  `GET /api/v2/language/models/free?page=N` with `x-api-key`, paginate via
  `pagination.has_more`, abort if `intelligence_index_version` changes
  mid-pagination, and record `intelligence_index_version` + `fetchedAt`.
  `validate` warns loudly and the build logs a banner whenever publication is on.
  *(See `docs/data-sources.md` for the exact terms and the unresolved-exception
  position this fetcher operates under.)*
- [ ] 2.5 `fetch plans` → `data/plans.json`. Snapshot every vendor URL into
  `data/raw/`, extract facts with **keyword anchors that throw when the anchor
  is missing** (fail closed, keep last-good + `stale: true`), convert CNY at a
  recorded spot rate, and write `evidence.url` + `evidence.retrieved` per row.
  Monthly billing only. Aggregator-only figures go to `known_gaps`.
- [ ] 2.6 `validate` — every rule in `AGENTS.md` "Invariants" that is checkable
  statically, plus: evidence ids resolve to `sources.json`; `confidence` is one
  of the four levels; `quota_model` required fields present unless
  `quota_unresolved`; `pass_at_4 >= pass_at_1`; uniqueness of ids; ranges;
  `unavailable_reason` when `available: false`; the CC BY 4.0 attribution
  string for Awesome Coding Plan is present verbatim; every benchmark row
  carries a `version`; staleness warnings when `retrieved` is > 14 days old.
  Exit non-zero with a readable error list.
- [ ] 2.7 `packages/core/src/cost.ts` — port `compute.py`'s quota model exactly:
  `budget` → `quota_usd / cost_per_task`; `credits` →
  `(input + output·w) / 10_000` with the vendor's `w`; `requests` →
  `requests_month / agent_steps_per_task` (plan-level assumed fallback where the
  model is unmeasured); `tokens_total` → `tokens / tokens_per_task`. Then
  `cost_per_task = price / tasks_per_month`, plus `days_for_full_run`
  (min of monthly rate and rolling-window rate), `break_even_tasks = price /
  api_cost_per_task`, `value_multiple = quota·api_cost / price`, and
  `model_allowed` via `model_scope` (`"any"` | provider | exact model id).
  Every function pure; the clock is an argument.
- [ ] 2.7b Token-allowance view (explicit requirement: "monthly allowances per
  million token and adjusted API cost"). From the plan's quota in tokens and the
  model's measured `input_tokens_per_task` + `output_tokens_per_task`, derive:
  `tokens_per_month_allowance` = quota expressed in tokens for the selected
  model; `allowance_per_million_tokens` = the plan's blended cost per 1M tokens
  at a **stated** input:output blend (default 3:1, the blend rule shown on the
  page next to the figure); `adjusted_api_cost_per_million` = the model's list
  rate blended the same way, divided by the plan's value multiple, so "what am I
  actually paying per million" is directly comparable across plans. Record the
  blend assumption as a field on the output row, never as an implicit constant,
  and note the cache-tier caveat: cached reads price far below list, so a blend
  that ignores cache tiers misprices cache-heavy models (DeepSWE medians show
  10–40:1 input:output ratios).
- [ ] 2.8 `packages/core/src/normalize.ts` — per-benchmark z-score (population
  SD), weighted composite `C_m = Σ w_b·z_{m,b} / Σ w_b` with weights
  renormalized over the benchmarks a model actually has, `T_m = 50 + 10·C_m`,
  coverage gate `k >= 2`, and CI propagation from `ci_lo`/`ci_hi`. Never impute
  zero for a missing benchmark.
- [ ] 2.9 `packages/core/src/pareto.ts` — `O(n log n)` sort-and-sweep skyline
  over `(cost, score)` with epsilons on both axes, co-frontier grouping for
  exact ties, `distance_to_frontier` (`Δscore` and cost ratio `ρ`). Two cost
  bases: API-list and plan-adjusted (recomputed per selected plan).
- [ ] 2.10 `compute` → `data/derived.json`: pairs (model × plan where
  `model_allowed`), `best_routes` per model, cross-check ratio, composite and
  frontier inputs, and the badge states (`confidence`, `freshness`,
  `price-status`, `ci`, `match`, `coverage`). Written deterministically:
  stable key order, stable numeric rounding, so re-running produces a
  byte-identical file when inputs are unchanged.
- [ ] 2.11 Unit tests (`bun test`) in `packages/core`: quota conversion per
  quota model; `model_allowed` scope rules; missing-benchmark renormalization
  and the `k >= 2` gate; Pareto membership on a known fixture including a tie
  and a dominated point; NaN/null rejection. Tests assert numbers a consumer
  observes, not wiring.
- [ ] 2.12 Complete the CLI surface and document it in `--help` and
  `docs/architecture.md`. The dispatcher `rack-rate-data <command>` must expose
  at minimum: `fetch <source|all>` (gather), `fetch <source> --diff` (print
  what moved upstream without writing — ported from the old
  `fetch_deepswe.py --diff`), `validate` (schema, citations, versions,
  staleness), `compute` (derive), `check` (validate + compute + verify the
  committed `derived.json` is not stale — the CI gate), `sources` (list every
  source with its license, attribution requirement and retrieval age), and
  `doctor` (which sources are reachable, which env vars are set, whether
  `AA_PUBLISH` is on, whether `data/raw` snapshots exist). Every command exits
  non-zero on failure and prints a readable reason; no command silently writes a
  guessed number.

### Acceptance

`bun run validate && bun run compute` exits 0 and regenerates
`data/derived.json`. Running it twice leaves the file unchanged. A deliberately
corrupted `data/plans.json` (bad evidence id, missing quota field, removed
attribution string) makes `validate` exit non-zero with a message naming the
row. `bun test` passes.

**Port parity gate (the point of 1.4b):** `@rack-rate/core` reproducing the
legacy pipeline on its own inputs must match `data/fixtures/legacy-derived.json`
— 178 pairs, 28 best routes, and the same cross-check median — as an assertion
in `bun test`. Any divergence is either a bug in the port or a deliberate,
documented behavior change; it may not be silently absorbed. A test that asserts
only "it runs" does not satisfy this.

### Contract handed to Stage 3

Committed `data/derived.json` with the shape `apps/site` will import; badge
states and frontier arrays precomputed so the site renders without client math.

---

## Stage 3 — Static build framework

**Goal:** Astro builds a multi-page static site from the committed data, with
the design system in place and one real page rendering real numbers.

### Tasks

- [ ] 3.1 `apps/site/astro.config.mjs`: `output: 'static'`, `site`/`base` for
  the GitHub Pages project page (`site: 'https://marshalfevzi.github.io'`,
  `base: '/rack-rate'`), the Tailwind Vite plugin, and a single place where
  switching to the custom domain (`site: 'https://rackrate.dev'`, no `base`)
  is a two-line change. Document that switch in `docs/architecture.md`.
- [ ] 3.2 Tailwind v4 entry `src/styles/global.css` — `@import "tailwindcss"`
  plus `@theme` tokens. Design tokens replace the old palette
  (`bg #0A0E15`, panel `#111825`, rule `#1D2735`, ink `#EAEEF5`, dim `#A3B0C4`,
  adjusted `#FFB020`, measured `#45D97F`, api `#5C6A80`), with contrast checked
  and a light scheme considered. No `tailwind.config.js`.
- [ ] 3.3 `src/layouts/Base.astro` + `Page.astro`: head/meta, canonical URL
  built from `Astro.site` + `base`, OG tags, skip-link, sticky nav, footer with
  the attribution block. Every internal link goes through one `href()` helper
  so `base` is applied consistently.
- [ ] 3.3b **Visual design pass** — the old site's problems are enumerated, so
  fix them deliberately rather than by taste alone. Replace the accidental
  signals the predecessor accumulated: 3D glossy ball chart markers, amber used
  for everything, monospace used for everything, dashed-rule noise, four
  competing animation durations, an emoji-based empty state, and a dead
  analytics snippet. Deliverables: a type scale and spacing rhythm (three or
  four sizes, one spacing unit), one accent per semantic role (adjusted /
  measured / API), one motion duration and one easing with
  `prefers-reduced-motion` honoured, and a two-scheme palette. Record the tokens
  and the reasoning in `docs/architecture.md` so Stage 4 does not re-invent
  them.
- [ ] 3.4 Routing skeleton for the page set (content lands in Stage 4, wizard
  content in Stage 5): `/`, `/models`, `/models/[slug]`, `/plans`,
  `/plans/[slug]`, `/compare`, `/explore`, `/start`, `/method`, `/sources`,
  `404`. Uses `getStaticPaths` from the committed data.
- [ ] 3.5 `src/lib/data.ts` — the single typed entry point importing
  `data/derived.json` + friends at build time and re-exporting typed views.
  Nothing else in the site touches raw JSON.
- [ ] 3.6 `src/lib/format.ts` — number/currency/percentage/token formatting,
  one rounding rule per unit, so a figure reads identically everywhere.
- [ ] 3.7 Provenance components: `<SourceLink>`, `<ConfidenceBadge>`,
  `<FreshnessBadge>`, `<CostBasisChip>`, `<CiBar>`. Every published number is
  wrapped in at least one, so "where did this come from" is structural rather
  than a footer paragraph.
- [ ] 3.8 `scripts/og.ts` — build-time 1200×630 social card via satori → resvg,
  replacing the Pillow script. One bundled OFL font with its license file kept
  in-repo. Runs after `astro build`, writes into `dist/`.
- [ ] 3.9 `@astrojs/sitemap`, `public/robots.txt`, `public/favicon.svg`, and a
  `public/CNAME` placeholder path documented (not committed until the domain is
  live).
- [ ] 3.10 CI: `.github/workflows/ci.yml` running `bun install --frozen-lockfile`,
  `bun run check`, `bun test`, `bun run data:build`, and a check that
  re-running compute leaves `data/derived.json` unchanged (stale-output guard).
  Delete any Vercel-specific config.
- [ ] 3.11 `/method` and the sources page render the real formulas and the full
  attribution block from Stage 1's docs, so the honesty commitments ship with
  the first pages, not later.

### Acceptance

`bun run build` produces `dist/` with every route in 3.4 present, all internal
links resolving under the `base` prefix, and a generated OG image.
`bun run check` passes. CI is green on a push to `main`. Mobile check: no
horizontal scroll at 360 px on every route.

### Contract handed to Stage 4

Layout, tokens, formatters, badge components, typed data accessor, and the CI
gate. Stage 4 adds charts and real page content only.

---

## Stage 4 — Frontend build (charts and insight pages)

**Goal:** the insight surface. Every chart type from the research pass exists,
driven by `@rack-rate/core` output, mobile-first.

### Tasks

- [ ] 4.1 `src/lib/charts/` — pure option builders (`(data) => EChartsOption`)
  with a shared tree-shaken `echarts/core` registration module. One mount
  helper handling `ResizeObserver`, `prefers-reduced-motion`, and disposal.
  Charts load via dynamic `import()` so a page without charts ships no chart
  code.
- [ ] 4.2 **Pareto scatter** — log cost axis, frontier polyline, shaded
  dominated region, labelled outliers, hover/zoom. Two cost bases as a toggle
  (API list ↔ selected plan route) with the basis in the title. Effort variants
  render as a connected trail off the pinned point.
- [ ] 4.3 **Bump/rank chart** — rank across benchmarks, missing benchmark as a
  broken line with a gap marker, never interpolated. Overlapping CIs render as
  tied rank ranges.
- [ ] 4.4 **Model × benchmark heatmap** — diverging `visualMap` centred on 0,
  hatched neutral cells for "not evaluated", never a low score.
- [ ] 4.5 **Slope chart** — API list price against plan route for one model,
  one line per candidate plan, savings implied by the slope.
- [ ] 4.6 **Quota burn-down waterfall** — quota → used → remaining per period,
  driven by a utilization input, deficit below zero.
- [ ] 4.7 **Radar of per-index z** — axes in z units, overlay the models a
  selected plan can actually run.
- [ ] 4.8 `/models` sortable, filterable table: score, best API cost, cheapest
  usable plan, value multiple, days-to-full-run, effort, badges. The old page's
  sortable six-column table is the floor here, not the ceiling.
- [ ] 4.9 `/models/[slug]` — one page per model: score profile, effort ladder,
  priced plan routes with cost-per-task, provenance rail (formula, days for a
  full run, evidence cards), and outbound links to the upstream benchmarks.
- [ ] 4.10 `/plans` and `/plans/[slug]` — plans ranked by value multiple, with
  quota model, rolling window, measured-against model, confidence, and the
  models it unlocks.
- [ ] 4.11 `/compare` — 2–4 models side by side across all benchmarks and cost
  bases, with the tie rule visible.
- [ ] 4.12 `/` — hero answering the two questions, the budget calculator from
  the old site (ported, not reinvented), top insights, and entry points into the
  detail pages.
- [ ] 4.13 `/explore` — the chart builder, and the answer to "the graphs are
  bad and there are no custom graphs": the visitor chooses the y metric (any
  benchmark score, composite `T`, or token-ratio metric), the x metric (API-list
  $/task, plan-adjusted $/task, tokens/task, steps/task, or a benchmark score
  for a head-to-head scatter), the chart type, the filters (vendor, effort
  level, score floor, ignored models/plans), a log/linear axis toggle, and
  whether the Pareto frontier and dominated-region shading are drawn. Plus the
  composite weight sliders with presets, recomputing the composite client-side
  from shipped per-benchmark z-scores — no refetch. Every setting is encoded in
  the URL so a configuration is shareable, and it persists as a preference.
- [ ] 4.14 Headline insight copy for each page: one sentence per chart that
  states what it shows, generated from the data where possible rather than
  hardcoded, so it cannot drift from the numbers.
- [ ] 4.15 Accessibility and mobile pass: keyboard navigation for every chart,
  table semantics, focus states, `prefers-reduced-motion`, touch targets,
  360 px layout, contrast ≥ 4.5:1 for text.

### Acceptance

Every route renders real data from `data/derived.json` with no client-side
data fetching. Pareto frontier matches `@rack-rate/core` output on a fixture
checked by eye. Keyboard-only traversal of `/models` and the Pareto chart
works. Verified on a real browser at 360 px and at desktop width.

---

## Stage 5 — Provider selection wizard

**Goal:** "which plan should *I* buy" becomes a guided flow, and the answers
persist offline.

### Tasks

- [ ] 5.1 `src/lib/prefs.ts` — typed `nanostores` persistent stores under one
  versioned key namespace, `rack-rate:prefs:v1`, holding
  `{ ignoredModels, ignoredPlans, paidPlans, vendor, currency, budgetCeiling,
  weights, benchmarkFilters }`. SSR-safe (no `localStorage` read during
  frontmatter), corrupt values fall back to defaults, cross-tab sync on.
  Bumping the version prefix is how a schema change migrates: read the old key
  once, transform, write the new one, never crash on the old shape.
- [ ] 5.2 Preference-aware rendering: ignored models/plans are dimmed with a
  one-click restore rather than hidden, so a filtered view is never mistaken for
  the whole picture. Paid plans are marked and excluded from "what should I buy"
  totals.
- [ ] 5.3 Wizard `/start` (or `/wizard`) — steps: (a) which vendors/plans you can
  or will pay for, (b) what you optimize for (score / cost / agentic vs coding /
  throughput), (c) usage intensity (tasks per month, slider) mapped onto the
  composite weights and utilization math, (d) results: ranked plans with
  break-even, value multiple, days-to-full-run, and the models each unlocks.
- [ ] 5.4 Result summary is shareable and stateless: encode the answers in the
  URL so a result can be linked, and hydrate preferences from the URL when
  present. Persist locally on confirmation.
- [ ] 5.5 `/models` and the Pareto chart honour the wizard's context (a chip
  showing the active plan/vendor filter with a clear action).
- [ ] 5.6 Export/import preferences as JSON (a single file, versioned), plus a
  "reset all preferences" action.
- [ ] 5.7 Preferences are validated with the same zod schema as any other trust
  boundary; an old or hand-edited payload cannot crash a page.

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

## Stage 6 — GitHub Pages deployment

**Goal:** the site publishes itself from `main`, and the data refresh path is
documented for contributors.

### Tasks

- [ ] 6.1 `.github/workflows/deploy.yml` — Bun setup with a pinned version,
  `bun install --frozen-lockfile`, `bun run build`, `withastro/action` upload,
  `actions/deploy-pages` deploy, correct `permissions:` block, concurrency group
  so overlapping pushes cancel.
- [ ] 6.2 Decide and document the canonical URL: project page
  (`marshalfevzi.github.io/rack-rate`) first, custom domain (`rackrate.dev`)
  when DNS is ready. Commit `public/CNAME` only with the domain. Confirm
  `site`/`base` and the OG image URL are correct in both modes and that a
  subpath build has no absolute-root links.
- [ ] 6.2b Artificial Analysis publication decision, made explicitly here rather
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
- [ ] 6.3 Data freshness without breaking determinism: a scheduled workflow that
  runs the fetchers, and **opens a pull request** instead of pushing directly
  when `data/*.json` changes, so every data movement is reviewable and the
  deployed site is always built from a committed, validated snapshot.
- [ ] 6.4 Cache and index hygiene: `robots.txt`, sitemap verified against the
  deployed base path, 404 page served, hashed asset caching confirmed.
- [ ] 6.5 `CONTRIBUTING.md` rewritten for the new stack: how to add a plan, how
  to add a source, how to submit a measured quota, what belongs in
  `known_gaps`, and the licensing rules from `docs/data-sources.md`. Preserve
  the existing measured-quota issue template path and the credit promise.
- [ ] 6.6 Update `PLAN.md` (this file) so every stage is ticked or explicitly
  carried, update `AGENTS.md` if any command changed, and write the final
  `docs/architecture.md`.
- [ ] 6.7 Final verification: clean clone → `bun install` → `bun run build` →
  deployed URL loads, every route reachable, chart interactions work on a
  phone-sized viewport, and the sources page lists every upstream plus the
  attribution block.

### Acceptance

Pushing to `main` deploys without manual steps; the published site matches a
local `bun run build`; the scheduled refresh opens a reviewable PR rather than
mutating the live site; a clean clone reproduces the build with no secrets.

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
reason; do not guess a number to close one.

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
  failure rather than a silent empty table.

---

## Progress log

Append-only. One entry per session; name the stage, what landed, and what is
still open.

### 2026-09-14 — Initialization (bootstrap, before Stage 1 was executed by an agent)

**Landed**

- Seven parallel research reports in `docs/research/` (`artificial-analysis.md`,
  `deepswe.md`, `terminal-bench-harbor.md`, `subscription-plans.md`,
  `frontend-stack.md`, `insight-methodology.md`, `prior-art.md`). Every finding is
  cited with a 2026-09-14 retrieval date; anything unverified is marked
  `[UNVERIFIED]`.
- `AGENTS.md` — stack decisions, boundary rules, commands, and the invariants
  every later stage is held to.
- `PLAN.md` — this file: six stages, per-stage acceptance criteria, the target
  data contract, and the known-gaps list.
- `docs/data-sources.md` — per-source licensing and redistribution verdicts,
  including the Artificial Analysis position and the exact CC BY 4.0 attribution
  string that validation must enforce.
- `package.json` at the root plus one per workspace package
  (`packages/core`, `packages/data-cli`, `apps/site`), pinned against versions
  read from the npm registry on 2026-09-14: Bun 1.4.2, Astro 7.3.2,
  Tailwind 4.3.3, ECharts 6.1.0, zod 4.6.4, nanostores 1.5.3,
  `@nanostores/persistent` 1.3.5, satori 0.33.4, `@resvg/resvg-js` 2.6.2,
  TypeScript 6.0.3.
- `.gitignore` for the new stack (legacy Python entries retained).

**Verified**

- `bun install` → 301 packages, `bun.lock` written.
- `bun run --filter @rack-rate/site check` → resolves and exits 0 (with the
  expected "missing pages directory" warning; the site has no routes yet).
- `bun run test` → **exit 0** (declared script, run directly, not through a pipe).
- `bun run typecheck` and `bun run check` → **exit 1**, solely because the root
  `tsconfig.json` does not exist yet (task 1.2). No source tree exists to
  typecheck. Neither is green; a build has never been run.
- `bun run --filter <pkg> cli -- fetch deepswe` argument forwarding confirmed
  against a scratch workspace: the CLI receives `["fetch","deepswe"]`.
- Network reachability confirmed for all upstreams (artificialanalysis.ai,
  deepswe.datacurve.ai, tbench.ai, docs.harborframework.com, registry.npmjs.org).
- Legacy `data/derived.json` inspected: 178 pairs, 28 best routes, 5 known gaps,
  cross-check median 1.601 over 11 pairs — these numbers will be frozen by task
  1.4b.
- **1.4b parity contract confirmed feasible; the fixture itself does not exist
  yet.** `python3 scripts/validate.py` and `python3 scripts/compute.py` both exit
  0 today and reproduce those exact counts, so the golden fixture *can* be
  generated before anything is deleted. Until Stage 1.4b executes, there is no
  `data/fixtures/legacy-derived.json` — `data/derived.*` is a legacy build
  artifact, not a committed fixture. Input hashes recorded for provenance:
  `models.json` `afd43741f4da`, `plans.json` `2c6988df3180`, `sources.json`
  `41cffc593329` (sha256, 12 chars).

**Still open in Stage 1**

Stage 1 is complete: tasks 1.1–1.9 are checked off and `bun run check` is green.
Stages 2–6 remain untouched. Open for Stage 2:

- Stage 2.2 must populate per-model `ci_lo`/`ci_hi`/`ci_method` and may revise
  per-row `cost_basis`.
- `google-ai-pro` stays `quota_unresolved`; no credits/tokens conversion was
  invented.
- The unresolvable `kimi-k2.5` and `glm-5.1` model rows remain recorded in
  `known_gaps`, rather than being substituted with newer models.
- MiniMax Coding Plan Plus remains a recorded gap pending a recorded `fx` and a
  pinned model.

**Corrections to the licensing position (2026-09-14, later same day)**

The first pass overstated the AA restriction as flatly prohibitive. After
reading the primary document (Data Platform Terms v1.1) rather than a summary:

- The terms' **Scope clause covers the free tier explicitly**, so free-tier use
  is bound by them — confirmed, not changed.
- **§2.3 grants rights at all tiers**, including (b) publicly sharing charts
  subject to §5 attribution and (c) brief citation of individual data points in
  non-machine-readable form. §5.1's chart row requires the **AA logo visible on
  the chart**. This makes a **chart-only AA axis** the best-supported published
  variant — a materially better posture than bulk republication, and one the
  earlier write-up missed. It remains an inference from the text, not cleared
  permission.
- **The `real-api-pricing` precedent was verified, and it is not a grant.** Its
  `derived/points.json` (202 rows) carries `aa_intelligence_index__score` on
  **202/202** rows and `aa_coding_agent_index__score` on **202/202** rows,
  publicly downloadable and combined with four other leaderboards. But its
  `SOURCES.md` explicitly disclaims the inference: source links are provenance,
  "not a claim that third-party datasets are MIT-licensed." It documents a
  practice, not a right.
- PLAN 6.2b now enumerates **three** states (off / chart-only / values in data
  files) with the clauses each one implicates, instead of a single off-switch.

Unchanged: `AA_PUBLISH` defaults off, one env var governs it, and no doc in this
repo claims the use is permitted.

**Decisions taken at initialization** (recorded here because later stages depend
on them): Bun workspace with three packages; committed normalized data snapshot
that the site builds from; Astro + Tailwind v4 + tree-shaken ECharts; GitHub
Pages project page now with a two-line switch to `rackrate.dev`; a **planned
clean cutover away from the Python pipeline in Stage 1.5** — not yet executed,
so `scripts/*.py`, `site/` and `vercel.json` are still present in the tree;
Artificial Analysis **off by default** because no redistribution right exists.

### 2026-09-14 — Stage 1 executed (initialization complete)

**Landed**

- **Strategy C**: one root `tsconfig.json`, with no project references. A
  referenced project requires `composite: true`, which cannot coexist with the
  root's no-emit typecheck (`TS6310: Referenced project '…' may not disable
  emit`). An `include` with no matching file is also a hard error
  (`TS18003: No inputs were found in config file`), so 1.2 and 1.3 landed in
  the same wave. `apps/site/tsconfig.json` extends the root, and
  `lib: ["ES2023","DOM"]` is deliberate and blanket.
- The zod data contract, migrated seed data, and `benchmarks.json` skeleton
  landed; `data/fixtures/legacy-derived.{json,csv}` froze the legacy output.
- `data/fixtures/legacy-derived.json` sha256:
  `803cef427a6af2f32ade594518b1806a49bb21fea90cc80fc52684f10bab9ded`.
  `data/fixtures/legacy-derived.csv` sha256:
  `6759e509df222e07771b25086a22061d5f701da2da84793fa1ea5af3da98df34`.
  The generated `data/derived.*` files were retired.
- `SOURCES.md` was retired into `docs/data-sources.md`;
  `docs/architecture.md` was added; the `.gitignore` legacy Python block was
  removed; `README.md` was rewritten; and `CONTRIBUTING.md` plus the PR
  template were de-Pythoned.

**Corrections and data decisions**

- `data/benchmarks.json` uses `scale: "0-100"` because PLAN's example placed
  `74.12` under `"scale": "0-1"`, which is internally inconsistent with the
  committed percentage values and bounds.
- `generated_at` uses `z.iso.datetime({offset: true})`: the committed
  `2026-09-03T22:24:37.984682+00:00` has microsecond precision and a `+00:00`
  offset, which `z.iso.datetime()` rejects. The measured schema accepts that
  form and a trailing `Z`. The benchmark skeleton normalizes PLAN's
  `2026-09-03T22:24:37Z` to the exact committed value so both files agree byte
  for byte.
- The two `muse-spark-*` rows changed from `provider: "Unknown"` to
  `provider: null`. Running the legacy pipeline on both variants produced a
  byte-identical derived structure (`orig == mut`); the DeepSWE upstream
  `provider` field is absent on most rows, and `scripts/fetch_deepswe.py`
  already documented `provider: null` as intended. `"Unknown"` was a leaked
  sentinel, not a vendor.
- `cost_basis` gained the fourth member `"unknown"`: PLAN's
  `list | expected-launch | disputed` set did not represent an absent basis,
  because `"disputed"` is not "no basis recorded". `gpt-6-astra` is
  `expected-launch` because `models.json#note` calls its figures
  DeepSWE-reported expected launch pricing; the other 27 rows are `list`.
  This assignment is an inference that Stage 2.2 may revise per row.
- Per-model `ci_lo`/`ci_hi`/`ci_method` are optional and absent on every row:
  the committed data has no per-model intervals, and inventing bounds would be
  fabrication. The shape is present for Stage 2.2 to populate.
- `retrieved_at` is derived as the max `retrieved` over each row's resolved
  `sources`: models are `2026-09-10` and plans are `2026-09-09`. This is
  computable and never guessed.
- Two `known_gaps` rows record the unresolvable
  `measured_against_model` ids `kimi-k2.5` and `glm-5.1`; neither was
  substituted with a newer model.

**Verified**

- `bun install` → exit 0.
- `bun run check` → exit 0.
- `bun run test` → exit 0.
- The throwaway contract script (`bun run packages/data-cli/.parse-contract.ts`) →
  exit 0 only when placed and run inside a consumer package (`packages/data-cli/`).
  Bun anchors module resolution at the script's own directory, so
  `bun run /tmp/parse-contract.ts` or a repo-root copy cannot resolve the
  `@rack-rate/core` workspace package.
- It validated `data/{models,plans,sources,benchmarks}.json` against the zod
  schemas, checked that every plan `evidence`/`sources` id resolves, that
  `pass@4 >= pass@1` on all 28 models, that exactly two rows have
  `provider: null` (both `muse-spark-*`), and that exactly one row is
  `cost_basis: "expected-launch"` (`gpt-6-astra`). Stage 1.5 deleted
  `data/derived.json` and `data/derived.csv`, so the frozen
  `data/fixtures/legacy-derived.json` is the only remaining `DerivedFile`
  document in the tree; it parsed successfully with fixture parity intact
  (178 pairs, 28 best routes, 11 cross-check pairs, median_ratio 1.601).
- Python independence: with `PATH` stripped to `/tmp/noPyBin:/bin:/usr/sbin:/sbin`
  so `command -v python3` reports absent, `bun run check` → exit 0,
  `bun run test` → exit 0, and the contract script → exit 0. Nothing in the
  Stage 1 gate shells out to Python.
- `git ls-files '*.py'` → empty (exit 0).
- `git ls-files site/ scripts/ vercel.json` → empty (exit 0).

**Still open**

Stages 2–6 are untouched. Stage 2.2 must populate the per-model confidence
interval fields and may revise per-row `cost_basis`; `google-ai-pro` stays
`quota_unresolved`; the `kimi-k2.5`/`glm-5.1` model rows and MiniMax Coding Plan
Plus remain recorded gaps.
