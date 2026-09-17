# Insight methodology research

**Verdict:** use renormalized weighted z-scores for cross-benchmark comparison, an `O(n log n)` cost-vs-score skyline for the Pareto frontier, and ECharts for all insight charts; redistribute only DeepSWE-derived numbers plus our own computed metrics, link out to Artificial Analysis and Terminal-Bench.

Retrieval date for all live URLs below: **2026-09-14**. Anything not directly fetched is marked `[UNVERIFIED]`.

---

## 1. Endpoints

Exact URLs, methods, auth, pagination, rate limits, and a real trimmed response excerpt for each benchmark source the methodology consumes. (This report specifies the math; the per-source fetch mechanics live in the sibling scout reports, but the fields the math depends on are pinned here so the formulas have something concrete to bind to.)

### 1.1 DeepSWE (Datacurve) — primary score + cost source

- **URL:** `https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json` (older scoring run: `.../artifacts/v1/leaderboard-live.json`, stale since 2026-06-20)
- **Method/auth:** `GET`, no auth header. Pagination: none — single JSON document (`n_tasks_in_set: 113`, ~40+ config rows at time of fetch).
- **Rate limits:** none published `[UNVERIFIED]`; be polite — one fetch per refresh cycle, `User-Agent: rack-rate-fetch/1`, 15 s timeout, 3 retries with exponential backoff (already the behavior in `scripts/fetch_deepswe.py`).
- **Fetched live 2026-09-14 — real trimmed excerpt** (first row; full doc has `scope`, `unit`, `generated_at`, `n_tasks_in_set`, `latest_job`, `rows[]`):

```json
{
  "generated_at": "2026-09-03T22:24:37.984682+00:00",
  "n_tasks_in_set": 113,
  "rows": [{
    "model": "gpt-6-astra",
    "harness": "mini-swe-agent",
    "reasoning_effort": "xhigh",
    "pass_rate": 0.7411504424778761,
    "pass_at_1": 0.7411504424778761,
    "pass_at_4": 0.8053097345132744,
    "n_passed": 335, "n_attempted": 452,
    "n_tasks_attempted": 113, "n_tasks_passed_any": 91,
    "ci_lo": 0.7124964807371247, "ci_hi": 0.7698044042186275,
    "ci_half": 0.02865396174075141, "n_runs": 4,
    "ci_method": "95% run-to-run: SE across repeated whole-benchmark passes (1.96 * std(runs)/sqrt(R))",
    "mean_cost_usd": 6.52377356460177, "median_cost_usd": 5.6717151,
    "mean_input_tokens": 1456927.09, "median_input_tokens": 1163918.5,
    "mean_output_tokens": 29557.33, "median_output_tokens": 28542.5,
    "mean_agent_steps": 28.75, "median_agent_steps": 26,
    "cost_basis": "Expected launch pricing ... $12/M uncached input, ... $50/M output ..."
  }]
}
```

Key facts for the math: scores are **proportions 0–1** (multiply by 100 for pct); `pass_rate == pass_at_1` (attempt pass rate over scored attempts; context-window failures and agent timeouts count as failures, provider/verifier/network errors are excluded — from the live `unit` string); CI is **run-to-run SE across whole-benchmark repeats**, not binomial — so do not recompute Wilson intervals from `n_passed/n_attempted`; efficiency fields come in mean **and** median, repo convention uses **median** (resists stuck-run skew, `scripts/fetch_deepswe.py`). One row per (model, harness, reasoning effort); repo keeps the highest-`pass_rate` effort per model with the rest in `effort_variants`.

- Source: https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json and https://github.com/datacurve-ai/deep-swe

### 1.2 Artificial Analysis (AA) — Intelligence / Coding / Agentic indices

- **Methodology page (fetched live 2026-09-14):** https://artificialanalysis.ai/methodology/intelligence-benchmarking
- **Confirmed from that fetch:** Intelligence Index v4.3 is a **weighted average across four categories — Agents 30%, Coding 20%, Scientific Reasoning 20%, General 30%** (10 evaluations, e.g. Terminal-Bench v4.0 at 10% weight with 66 tasks x 3 repeats, pass@1). Scoring is generally **pass@1** aggregated over repeats; AA claims a 95% CI of **< ±1%** on the overall index from >10-repeat experiments. Cost side: token counts come from each model's API provider (canonical-tokenizer fallback), combined with live cache-hit-rate measurements.
- **No public JSON API or rate card found on the fetched pages** `[UNVERIFIED]` — AA index values are rendered site-side; there is no documented `api.*` endpoint. **Do not scrape AA numbers into `data/*.json`** (see License section). The TS strategy therefore treats AA as a _manual, attributed snapshot_ input, not a fetched feed.
- Blended-price context: AA reports a blended price to simplify cross-provider comparison (reported in search summaries as a cache-hit:input:output weighting — `[UNVERIFIED]`, not confirmed on the fetched page; verify against https://artificialanalysis.ai/methodology before citing a ratio).

### 1.3 Terminal-Bench / Harbor framework — agentic terminal tasks

- **Docs URL attempted 2026-09-14:** `https://docs.harborframework.com/terminal-bench/` → **HTTP 404 (docs moved)**. Repo: https://github.com/harbor-framework/terminal-bench `[UNVERIFIED — not fetched]`.
- **Corroborated facts (third-party summary, treat as provisional):** Terminal-Bench v2.1 uses ~89 tasks; each drops an agent in an isolated sandbox with a natural-language goal; success = passing **task-specific automated tests**, not text similarity; scoring uses **pass@k over multiple trials** (https://themodelgap.com/benchmarks/terminal-bench-2-1, via search summary — `[UNVERIFIED]`, confirm before use).
- **Scale implication for normalization:** TB reports a **0–1 pass rate per task, aggregated as % (0–100)** — same unit family as DeepSWE `score_pct`. AA indices are **0–100 weighted averages with Elo components** (GDPval-AA is Elo-anchored, not a pass rate). The normalization method must therefore handle _commensurable percentages with different variances_ (z-score) rather than assuming identical scales.

---

## 2. Schema

Field-by-field table for the normalized model record the math consumes (superset of `data/models.json` today; new fields marked ★). Types are TypeScript types.

| Field                                                  | Type           | Meaning                                                                                            | Nullable                         | Units                                                          |
| ------------------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------- |
| `id`                                                   | `string`       | Canonical model id (dash-to-dot mapped)                                                            | no                               | —                                                              |
| `provider`                                             | `string`       | Vendor name; `"Unknown"` when unconfirmed                                                          | no (may be `"Unknown"`)          | —                                                              |
| `benchmark`                                            | `string`       | Which benchmark this row came from (`"deepswe"`, `"terminal-bench"`, `"aa-intelligence"`, …)       | no                               | —                                                              |
| `benchmark_version`                                    | `string`       | Scoring-run version (`"v1.1"`, `"v4.0"`, …). **Part of the row identity**                          | no                               | —                                                              |
| `score_pct`                                            | `number`       | pass@1-style accuracy                                                                              | no                               | % (0–100)                                                      |
| `score_pass_at_4_pct` ★                                | `number`       | pass@4 where the harness reports it. **Never mixed with `score_pct`**                              | yes                              | % (0–100)                                                      |
| `ci_lo` / `ci_hi` ★                                    | `number`       | 95% CI bounds **in the benchmark's own reported frame** (DeepSWE: run-to-run SE; do not recompute) | yes (absent for AA/TB snapshots) | same as score (proportion 0–1 for DeepSWE — convert on ingest) |
| `n_tasks_attempted` ★                                  | `number`       | Denominator actually scored (DeepSWE: 113)                                                         | yes                              | tasks                                                          |
| `api_cost_per_task_usd`                                | `number`       | Median over scored attempts                                                                        | no                               | USD/task                                                       |
| `cost_basis` ★                                         | `string`       | e.g. `"ga-pricing"`, `"expected-launch-pricing"` (gpt-6-astra case)                                | yes                              | —                                                              |
| `input_tokens_per_task` / `output_tokens_per_task`     | `number`       | Medians over scored attempts                                                                       | yes                              | tokens/task                                                    |
| `agent_steps_per_task`                                 | `number`       | Median steps; drives `requests`-quota conversion                                                   | yes                              | steps/task                                                     |
| `input_rate_per_mtok_usd` / `output_rate_per_mtok_usd` | `number`       | Vendor list rates for blended-cost math                                                            | yes                              | USD / 1M tokens                                                |
| `reasoning_effort`                                     | `string`       | Which effort config this row is (`"xhigh"`, …); variants array as today                            | yes                              | —                                                              |
| `retrieved_at` ★                                       | `string` (ISO) | When this row was fetched — drives staleness badges                                                | no                               | date                                                           |

**Unit conversions on ingest (validated by CLI):** DeepSWE `pass_rate`/`ci_*` are proportions → x100 to `score_pct`; AA indices already 0–100; TB pass rate → x100. CI half-width preserved through affine transforms: `hi_pct − lo_pct` scales with the x100.

---

## 3. Benchmark normalization — the ONE method

### 3.1 Recommendation: per-benchmark z-score → weighted mean with renormalized weights → T-score presentation

**Use z-score standardization, not min-max, not ranks.** Rationale, with sources:

- The EC JRC / OECD composite-indicator guidance (https://knowledge4policy.ec.europa.eu/composite-indicators/toolkit_en/navigation-page/10-step-guide_en/step-5-normalisation_en — summarized via search 2026-09-14; full handbook: OECD/JRC _Handbook on Constructing Composite Indicators_, 2008) frames the choice exactly this way: **z-scores** (mean 0, SD 1) preserve relative position and outlier information across indicators with different variances; **min-max** forces a common 0–1 range but is hostage to the min/max sample (one new extreme rescales history — fatal for a site that appends leaderboard snapshots over time). The COINr manual (https://bluefoxr.github.io/COINrDoc/normalisation.html) notes the same trade-off and that min-max needs recalibration when new extremes appear.
- Rank methods (Borda/Copeland/Kemeny) discard _magnitude_: a model 0.2 pp behind and one 20 pp behind look identical. Rank aggregation is also expensive at the consensus end — Kemeny-Young is NP-hard (cf. https://en.wikipedia.org/wiki/Kemeny_method; scoring-rule alternatives survey, AAAI-23). Borda is cheap and robust under low disagreement (rank-aggregation MCDA comparison, DOI 10.1142/s0219622026500525), which makes it a fine **secondary "rank stability" display**, but not the primary score.
- Percentile ranks share the magnitude problem. Elo-style fitting is unjustified: we have no pairwise match data, only pass rates.

### 3.2 Formulas (all unitless unless stated; assumptions inline)

For benchmark `b` with model scores `x_{m,b}` in % (0–100), over the `n_b` models present in benchmark `b` **at the pinned version**:

1. **Per-benchmark z-score** (assumption: scores roughly unimodal; with n≈28–100+ models the mean/SD are stable; population SD, `ddof=0`):

   `z_{m,b} = (x_{m,b} − μ_b) / σ_b`, where `μ_b` = mean, `σ_b` = population SD, both in **percentage points**; `z` is unitless.

2. **Composite** (assumption: benchmarks measure related but distinct capabilities; default weights mirror AA v4.3 category thinking):

   `C_m = Σ_{b ∈ B_m} w_b · z_{m,b} / Σ_{b ∈ B_m} w_b`, unitless. Default weights: DeepSWE 0.5, Terminal-Bench 0.3, AA-Coding 0.2 (sum 1.0; user-adjustable). **Weights renormalize over `B_m`, the benchmarks where model m is actually present** — this is the missing-value rule.

3. **Presentation rescale** (assumption: readers think in 0–100; a z of 0 must read as "average", never as "zero intelligence"):

   `T_m = 50 + 10 · C_m`, unitless "index points". Clamp display to [0, 100] with a `clamped` flag. **Always show the per-benchmark z-bars alongside `T_m`** — label it "Composite index (avg = 50)", never "%".

4. **Uncertainty propagation** (from DeepSWE `ci_lo`/`ci_hi`, proportions → convert to z-space): `z_lo = (100·ci_lo − μ_b)/σ_b`, `z_hi = (100·ci_hi − μ_b)/σ_b`; composite CI via the same weighted mean over benchmarks that provide CIs. Render as error bars. Benchmarks without CIs contribute points only, and the composite CI is flagged `partial-ci`.

### 3.3 Missing values (a model absent from a benchmark must not silently rank last)

1. **Never impute zero / last place.** Absence = absence.
2. **Renormalize weights** over present benchmarks (formula above) — a model in 1 of 3 benchmarks is scored on that 1 benchmark alone.
3. **Coverage gate:** composite requires ≥ 2 benchmarks; single-benchmark models get **no composite**, only their per-benchmark z and a `single-source` badge.
4. **Display rule:** heatmap cells for missing entries are hatched/neutral gray with tooltip "not evaluated in {benchmark} v{version}", visually distinct from a low score.
5. **Sensitivity note:** publish the composite's benchmark count `k_m = |B_m|` next to every `T_m` (e.g. "62 · k=3"). A `T` from k=2 is inherently noisier — say so in the tooltip.

---

## 4. Pareto frontier

### 4.1 Exact definition

Work in the plane **x = cost (USD/task, lower is better), y = score (`score_pct` or `T_m`, higher is better)**.

- **Dominance:** point `p` dominates `q` (written `p ≺ q`) iff `x_p ≤ x_q` **and** `y_p ≥ y_q` with **at least one strict inequality**. (Skyline definition: "no worse in all dimensions, strictly better in at least one" — Börzsönyi et al., the skyline-operator paper, http://www.cs.ucr.edu/~ravi/CS236Papers/skyline-operator.pdf; 2D `O(n log n)` via sort + sweep, CUHK lecture notes https://www.cse.cuhk.edu.hk/~taoyf/course/infs4205/lec/dc-sky.pdf.)
- **Frontier (skyline):** the set of points dominated by nothing.
- **Ties:** identical (x, y) pairs are _co-frontier_ (neither strictly dominates); keep all, render stacked with an offset halo and count badge ("3 models here"). Tie in x only → higher y dominates; tie in y only → lower x dominates. Use an epsilon (`1e-9` in x, `1e-6` in y) so float noise never creates phantom dominance.

### 4.2 Cost-axis variants (two frontiers, toggled in UI)

1. **API-list frontier:** x = `api_cost_per_task_usd`. Answers "which model is the best engineering choice at list price".
2. **Plan-adjusted frontier:** x = `cost_per_task_usd` of the _user-selected plan route_ (or the best-route minimum, `best_routes` in `scripts/compute.py`). Answers "which model is best on _my_ plan". Recompute the frontier on plan change — it is `O(n log n)`, cheap enough per keystroke.
3. Never plot both cost bases on one axis.

### 4.3 TS algorithm sketch (sort + sweep, `O(n log n)`)

```ts
export interface FrontierPoint { id: string; cost: number; score: number; ciHalf?: number; }

export function paretoFrontier(
  points: FrontierPoint[],
  eps = { cost: 1e-9, score: 1e-6 },
): { frontier: FrontierPoint[]; dominated: FrontierPoint[] } {
  const sorted = [...points].sort((a, b) =>
    Math.abs(a.cost - b.cost) > eps.cost ? a.cost - b.cost : b.score - a.score,
  );
  const frontier: FrontierPoint[] = [];
  const dominated: FrontierPoint[] = [];
  let bestScore = -Infinity;
  for (const p of sorted) {
    if (p.score > bestScore + eps.score) { frontier.push(p); bestScore = p.score; }
    else dominated.push(p);
  }
  return { frontier, dominated };
}
```

Correctness note: after sorting by cost ascending, any earlier point has `x ≤ p.x`; it dominates `p` iff its `y ≥ p.y`, i.e. iff `bestScore ≥ p.score − eps`. The scan is `O(n)` after the `O(n log n)` sort. Exact duplicates fall through to `dominated` by the strict-`>` test — merge them into a co-frontier group in a post-pass (same x within eps, same y within eps) rather than calling them dominated.

### 4.4 Dominated-region shading + distance to frontier

- **Shading:** the dominated region is the union of rectangles `[f.x, x_max] × [y_min, f.y]` over frontier points `f` — everything up-and-to-the-right of the stepwise frontier polyline. In ECharts: draw the frontier as a `line` series (step `'end'`) plus a second series filled to `y_min` via `areaStyle`; or a `custom` series rendering the step polygon. Implementation note: build the step polygon from the sorted frontier array and render with `markArea` on a hidden helper series — one concrete path that avoids hand-rolled canvas code.
- **Distance to frontier per dominated model** (report both):
  - _Score gap_ (percentage points): `Δy = Y_frontier(x_q) − y_q`, where `Y_frontier(x)` is the stepwise frontier score at cost x (max frontier y among points with cost ≤ x). "Paying the same, you leave 4.2 pp on the table."
  - _Cost ratio_ (unitless ×): `ρ = x_q / X_frontier(y_q)`, where `X_frontier(y)` is the cheapest frontier cost achieving score ≥ y_q. "You pay 3.1× the frontier price for this score." If no frontier point reaches `y_q`, the model joins the frontier (report `ρ = 1`, `on-frontier-by-score`).

---

## 5. Cost-efficiency metrics — definitions, units, formulas, prior art

All formulas state units and assumptions. `P` = plan price (USD/month), `C_api` = `api_cost_per_task_usd` (USD/task), `Q` = plan quota as tasks/month (`tasks_per_month` from `scripts/compute.py`).

| #   | Name                                                    | Formula                                                                                                                                                                                                                                                                         | Units                   | Assumptions                                                                                                          |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | **Score-per-dollar** `SPD`                              | `SPD = score_pct / C` where `C` is the cost basis in use (API-list or plan-adjusted)                                                                                                                                                                                            | % / USD (per task)      | Linear value in score pp; only comparable _within_ one cost basis                                                    |
| 2   | **Blended $/1M tokens** `R_blend`                       | `R_blend = (α·r_in + r_out) / (α + 1)`, input:output blend `α:1`, **default α = 3** (coding-agent traffic is input-heavy; DeepSWE medians show input:output ratios of 10–40:1, but cached reads price far below list — α=3 is a judgment call, stated so it can be argued with) | USD / 1M tokens         | Single list-rate card; ignores cache tiers, batch discounts, overage curves                                          |
| 3   | **Effective monthly cost** `C_eff(T)` for T tasks/month | `C_eff(T) = P` if `T ≤ Q`; else `P + (T − Q)·C_api`                                                                                                                                                                                                                             | USD/month               | Overage available at list price; no second plan stacking                                                             |
| 4   | **Break-even volume** `T*`                              | `T* = P / C_api`                                                                                                                                                                                                                                                                | tasks/month             | Linear API pricing; plan quota must cover `T*` (check `T* ≤ Q`, else display "never at list rates")                  |
| 5   | **Utilization** `U`                                     | `U = T_actual / Q`                                                                                                                                                                                                                                                              | unitless (display as %) | User supplies `T_actual` via slider; counts tasks on the metered model                                               |
| 6   | **Value multiple** `V`                                  | `V = (Q · C_api) / P` — "the plan buys $X of list-price usage for $1"                                                                                                                                                                                                           | unitless ×              | Same linear-pricing assumption as `T*`; for `budget` plans `Q·C_api = quota_usd_month`, so `V = quota_usd_month / P` |

### Prior art — how the current repo and AA compute these

- **Current repo (`scripts/compute.py`, read 2026-09-14):** `cost_per_task_usd = price_usd_month / tasks_per_month`; per-quota-model `tasks_per_month` converters (budget / credits / requests / tokens_total) already exist — reuse them. `best_routes`: per model, the plan minimizing `cost_per_task_usd`. `cross_check` **ratio**: `max(TPM_dollars, TPM_tokens) / min(...)` with median summary — keep it as the uncertainty proxy for `V`.
- **Artificial Analysis `cost_per_task`** (from https://artificialanalysis.ai/methodology/intelligence-benchmarking, fetched 2026-09-14): weighted-average USD/task across the index's evaluations from provider token counts × live cache-hit rates. Our `api_cost_per_task_usd` is the single-benchmark analogue (DeepSWE-measured medians). Label the cost basis explicitly — AA-cost and DeepSWE-cost are **not interchangeable**.

---

## 6. Cross-benchmark composite — construction + honest presentation

- **Construction:** weighted z-score formula → `T_m`, default weights DeepSWE 0.5 / Terminal-Bench 0.3 / AA-Coding 0.2, renormalized over present benchmarks, coverage gate k ≥ 2.
- **User-adjustable weights:** three sliders (0–100%) renormalizing to sum 1; presets: "Coding-heavy" (0.7/0.2/0.1), "Balanced" (thirds), "Agentic" (0.3/0.5/0.2). Recompute client-side from the per-benchmark z matrix shipped in `data/*.json` — no refetch. Show the weight vector next to every composite ("weights 50/30/20").
- **No false precision:** (1) Display `T_m` as **integers** with CI `±` band where available. (2) **Overlap rule:** overlapping CI bands = "statistical tie at 95%", ranks shown as ranges ("3–5"), never ordinals. (3) Always pair `T_m` with the per-benchmark z strip so the aggregation is auditable. (4) DeepSWE CIs are **run-to-run SE** (`ci_method` ships in the JSON — footnote it), not binomial; never recompute Wilson intervals from `n_passed/n_attempted`.

---

## 7. Visual grammar — chart-type-to-insight mapping

**Library decision: ECharts** (Apache-2.0, SVG + Canvas, `dataset` transforms, `markLine`/`markArea`/`markPoint`; option schema confirmed at https://echarts.apache.org/en/llms.txt — `series-scatter`, `series-heatmap`, `series-radar`, `series-line`, `series-custom` all exist). Chart.js (MIT; scatter docs confirmed https://www.chartjs.org/docs/latest/charts/scatter.html) is a fallback but lacks native heatmap/parallel/slope support. Observable Plot `[UNVERIFIED]` (https://observablehq.com/plot/ returned HTTP 429 on 2026-09-14) — confirm API names before implementing.

| #   | Insight (user question)                                  | Chart type                                                                 | Library                                                         | Concrete implementation note                                                                                                                                 |
| --- | -------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Which models are never the wrong answer? (cost vs score) | **Pareto scatter** with frontier polyline + dominated-region shading       | ECharts `scatter` + `line` (step) + `markArea`                  | Log x-axis — API $/task spans ~$0.05–$20; frontier series from §4.3 output; `markArea` step polygon for dominated region; toggle API-list vs plan-adjusted x |
| 2   | Who leads on _my_ plan?                                  | **Plan-adjusted Pareto scatter**                                           | ECharts (same option, swapped dataset)                          | Recompute frontier client-side on plan select; `markPoint` best routes; dim out-of-`model_scope` routes instead of hiding                                    |
| 3   | How do ranks shift across benchmarks?                    | **Bump / rank chart**                                                      | ECharts `line` (one series per model, y = rank, `inverse` axis) | Competition ranking, labeled; missing benchmark = broken line + gap marker, never interpolated                                                               |
| 4   | Where is each model strong/weak?                         | **Model × benchmark heatmap** (z-scores)                                   | ECharts `heatmap`, diverging `visualMap` (−2…+2)                | Missing cells = hatched gray via second `scatter` overlay (heatmap has no hatch fill); scale centered exactly at 0                                           |
| 5   | API list vs plan price for one model                     | **Slope chart**                                                            | ECharts `line` (2-point series) or `custom`                     | One line per plan route; slope ∝ savings; log-scale both axes identically                                                                                    |
| 6   | Will my quota survive the month?                         | **Waterfall for quota burn-down**                                          | ECharts `bar` (stacked transparent-base trick) or `custom`      | Bars: quota → used → remaining per week; `U > 1` deficit bar in red below zero; driven by utilization slider                                                 |
| 7   | What is this model's capability profile?                 | **Radar of per-index z**                                                   | ECharts `radar`                                                 | Axes in z units (−2…+2), not raw %; overlay plan-mate models for the "which model from my plan" question                                                     |
| 8   | What makes up the composite?                             | **Small multiples**: per-benchmark z bars + composite `T` with CI whiskers | ECharts `bar` with whiskers                                     | CI whiskers only where `ci_lo/ci_hi` exist, else `partial-ci` footnote marker                                                                                |

---

## 8. Trust / uncertainty — badge taxonomy

Badges compose (a row can carry several). All badge states ship in `data/*.json` so the static site renders them with zero client computation.

| Badge                                     | Levels / values                                                               | Set from                                                                                        |
| ----------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `confidence` (existing repo field — keep) | `measured` / `high` / `medium` / `low`                                        | plan evidence chain (`data/plans.json` convention)                                              |
| `freshness` ★                             | `fresh` (< 30 d) / `aging` (30–90 d) / `stale` (> 90 d or version superseded) | `retrieved_at` vs build date; version pin vs live `generated_at`                                |
| `price-status` ★                          | `list` / `expected-launch` / `disputed`                                       | `cost_basis` / `known_gaps`                                                                     |
| `ci` ★                                    | `±X.X pp (95%, run-to-run)` / `partial-ci` / `no-ci`                          | presence of `ci_lo/ci_hi` per benchmark                                                         |
| `match` ★                                 | `exact` / `mapped` / `unmapped`                                               | mapper warnings at ingest (cf. `fetch_deepswe.py`; `muse-spark-1.x → provider Unknown` pattern) |
| `coverage` ★                              | `k=3` / `k=2` / `single-source` (composite suppressed)                        | coverage gate                                                                                   |

Rendering: colored dot + label + tooltip with the _reason string_ (e.g. "CI from 4 whole-benchmark repeats, run-to-run SE — see DeepSWE `ci_method`"). Stale/disputed rows render dimmed with the badge, never silently dropped.

---

## 9. Failure modes to avoid (statistical traps + UI prevention)

1. **Comparing scores across benchmark versions.** DeepSWE v1 → v1.1 changed the model set and scoring run; AA v4.3 ≠ earlier versions. _Prevention:_ `benchmark_version` is part of row identity; CLI validation fails the build on unversioned rows; the composite refuses to mix versions.
2. **Simpson's paradox in provider aggregation.** _Prevention:_ never publish provider-level composite means as headlines; provider views show the full model distribution (beeswarm/strip), means only with n shown.
3. **Cherry-picked cost basis.** _Prevention:_ every $/task figure carries a cost-basis chip (`API list` / `{plan} route` / `AA index`); the two frontiers are separate views with the basis in the title.
4. **Survivorship bias in plan sampling.** Quotas measured on one saturated month/model/harness (`measured_against_model`) don't generalize. _Prevention:_ `measured_against_model` displayed next to every derived $/task; comparisons default to `confidence ∈ {measured, high}`, lower-confidence plans opt-in dimmed.
5. **Mixing pass@1 and pass@4.** DeepSWE pass@4 is 6–15 pp higher. _Prevention:_ separate schema fields, CLI check `score_pass_at_4_pct > score_pct` sanity + hard rule that no formula reads pass@4 except the pass@4-only display.
6. **Effort-level confusion.** One model × five efforts = five (score, cost) points (gpt-6-astra: 67.0% @ $1.72 → 74.1% @ $5.67). _Prevention:_ composite/frontier use the pinned row (highest-score effort); effort ladder renders as a connected trail on the Pareto scatter.
7. **Rank-order overclaim.** _Prevention:_ overlap rule — overlapping 95% CIs render as tied rank ranges; bump charts use translucent bands where CIs exist.

---

## 10. License / redistribution verdict

- **DeepSWE harness + leaderboard data: Apache-2.0** (per `data/sources.json` `src-deepswe-repo`, retrieved 2026-09-09; live JSON re-fetched 2026-09-14 carries no contradicting license). **Verdict: YES** — derived numbers may be redistributed in the public repo + static site with attribution to Datacurve/DeepSWE and link to https://github.com/datacurve-ai/deep-swe. **Never mirror task content** — canary string (per `SOURCES.md`); metadata only.
- **Awesome Coding Plan: CC BY 4.0** — requires creator identification (`mahonzhan@gmail.com`), license notice, link to https://creativecommons.org/licenses/by/4.0/. **Verdict: YES with attribution preserved** — attribution block in `data/sources.json` + site Sources section must survive the rewrite; automated check (TS equivalent of `scripts/validate.py` evidence rule) fails the build if the attribution string disappears.
- **Artificial Analysis: NO bulk redistribution** — no license/API terms found on fetched pages `[UNVERIFIED]`; commercial product with no documented redistribution right. Link out to AA model pages; at most quote single figures with prominent attribution; prefer dropping AA from `data/*.json` until written permission exists.
- **Terminal-Bench / Harbor: PENDING** — license not verified (docs URL 404'd) `[UNVERIFIED]`. Check https://github.com/harbor-framework/terminal-bench license file before redistributing any TB numbers; until then, link-out treatment.
- **Our computations** (composites, frontiers, SPD, V, break-evens): original work — license freely (MIT to match repo `LICENSE`); every derived figure links back to its inputs.

---

## 11. Recommended TS fetch strategy (Bun + Astro static)

```ts
// src/lib/bench/deepswe.ts — the only network-touching benchmark module
export interface FetchOpts { cacheDir?: string; timeoutMs?: number; retries?: number }
export async function fetchDeepSWE(opts?: FetchOpts): Promise<RawDeepSWE>
export function normalizeDeepSWE(raw: RawDeepSWE): ModelRow[]
```

- **File layout:** `src/lib/bench/<source>.ts` → `data/<source>.raw.json` (git-ignored cache) → `data/models.json` (committed) → `scripts/validate-data.ts` (`bun run validate`: schema, version pins, pass@1≠pass@4, attribution-string presence, staleness warnings) → `src/lib/insights/*.ts` (pure: `zscore.ts`, `composite.ts`, `pareto.ts`, `metrics.ts` — no I/O) → Astro content collections render ECharts options as JSON.
- **Retry/caching:** `fetch` with `AbortSignal.timeout(15_000)`, 3 retries, exponential backoff + jitter, `If-Modified-Since`/`ETag` against `.cache/` — skip write when unmodified (same semantics as `fetch_deepswe.py`). Pin `generated_at`/`n_tasks_in_set` into `models.json`; `--diff` mode prints field-level changes for review PRs.
- **AA/TB posture in code:** no fetchers until redistribution is cleared — `data/manual/<source>.json` with `retrieved_at`, source URL, quoter name, validated by the same CLI.

---

## 12. Gotchas / unknowns — explicit list, no hedging

1. AA has no public API I could find — any "AA fetcher" in a plan is fiction until someone produces an endpoint or written permission. Link out. `[UNVERIFIED — searched, not found]`
2. Terminal-Bench docs moved (`docs.harborframework.com/terminal-bench` 404s); task counts differ across versions — pin exact version before ingesting a TB number. `[UNVERIFIED]`
3. DeepSWE `ci_method` is run-to-run SE over R=4 repeats — wide for some models (claude-opus-5 max: ±3.9 pp). Overlap-rule ties will be common at the top; that is the honest output.
4. `median_input_tokens` are enormous (12M+ for opus-5 max) — dominated by cached-read context; any $/1M-blend ignoring cache tiers misprices these models. α=3 is a placeholder with an argument, not a measurement.
5. gpt-6-astra costs are _expected launch pricing_ (`cost_basis` in live JSON) — badge it `expected-launch`, never silently rank it.
6. Observable Plot API names are from general knowledge — docs fetch failed (HTTP 429); confirm before implementing, or just use ECharts throughout.
7. Composite weights (0.5/0.3/0.2) are editorial, not empirical — the sliders exist so no single weighting claims authority.
8. `muse-spark-1.1/1.2` ship with provider Unknown and fall out of every provider-scoped plan route via `model_scope` — the UI must say "no priced route", not $0.

---

_Sources fetched 2026-09-14: DeepSWE live leaderboard JSON; AA intelligence-benchmarking methodology page; Chart.js scatter docs; ECharts llms.txt option index; repo files `scripts/compute.py`, `scripts/fetch_deepswe.py`, `data/models.json`, `data/plans.json`, `data/sources.json`, `SOURCES.md`. Canonical methods texts: OECD/JRC Handbook on Constructing Composite Indicators (2008); Börzsönyi–Kossmann–Stocker skyline operator; Kemeny-Young/Borda literature as linked inline._
