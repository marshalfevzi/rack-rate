# PLAN.md

Live roadmap for the `rack-rate` rewrite. **One stage per session.** Read
`AGENTS.md` first; it holds the stack decisions and the invariants this plan
assumes.

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

**Next stage: 3.** Stages 1 and 2 are landed and green. Their task lists,
acceptance criteria, handover contracts and session history live in
[`docs/archive/stages-1-2.md`](docs/archive/stages-1-2.md); this file carries the
live stages, the data contract, the open questions and the newest log entry.


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

Both landed green; full task lists and acceptance criteria are in the archive.

- **Stage 1 — Initialization** (`[x]`, 1.1–1.10): Bun workspace with three
  packages, one root `tsconfig.json` (no project references), the zod data
  contract in `packages/core/src/schema.ts`, the migrated `data/*.json` plus the
  `benchmarks.json` skeleton, and the tooling pass (oxlint 1.82.0 with the
  vendored anti-slop plugin, oxfmt 0.67.0, fallow 3.25.0 report-only).
- **Stage 2 — Data points** (`[x]`, 2.1–2.12): `packages/data-cli` owns all
  network and filesystem access; `packages/core` holds pure `cost`, `normalize`,
  `pareto` and `insights`; four fetchers; the `validate` / `compute` / `check` /
  `sources` / `doctor` surface; and the data gate `bun run data:check`.

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
- **Two evidence URLs return HTTP 404** (found 2026-09-14 by `bun run doctor`,
  which still exits 0 because URL liveness is a finding, not a gate):
  `https://openai.com/chatgpt/pricing/` (`data/sources.json:86`, ChatGPT Pro
  pricing) and `https://support.google.com/googleone/answer/16287445`
  (`packages/data-cli/src/commands/fetch-plans.ts:410`, the `google-ai-pro`
  anchor). Fixing them means finding live replacements for the *same* fact,
  updating `sources.json` and the fetcher anchor together, bumping `retrieved`,
  and re-running `compute` — not a hand-edit of a number.
- **`bun run og` fails until Stage 3.8** — `apps/site/scripts/og.ts` does not
  exist yet, so `bun run build` cannot complete even once the Astro config and
  pages land. Stage 3.8 owns it; nothing else may assume a social card exists.
- **`HARBOR_API_KEY` is inert here** — the `harbor` CLI reads it
  (`harbor/auth/credentials.py`, `sk-harbor-…` prefix) for authenticated Hub
  operations, but this repository never reads it and the public leaderboard read
  the fetcher uses needs no key. The local value is an unrendered
  secret-manager reference, not a harbor key. Nothing breaks today; revisit only
  if a fetch path ever needs a login.
- **Artificial Analysis publication state is undecided** — the enabled path is
  now proven live (see `CAVEATS.md` §1.6), so task 6.2b is a configuration
  decision rather than an engineering one. AA values stay out of `data/*.json`
  until that decision is recorded.


---

## Progress log

Append-only. One entry per session: name the stage, what landed, what was
verified. Entries for stages 1–2 are in
[`docs/archive/stages-1-2.md`](docs/archive/stages-1-2.md); do not rewrite them.

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
  explicitly at task 6.2b.
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
