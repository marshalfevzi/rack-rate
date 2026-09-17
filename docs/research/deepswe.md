# DeepSWE research

Verdict: fetch `artifacts/v1.1/leaderboard-live.json` as the live source (70 configs / 28 models on 2026-09-14) with `artifacts/v1/leaderboard-live.json` as stale fallback; republishing score/cost/token aggregates with attribution is permitted (Apache-2.0 repo, no separate data license found), but never mirror task content (canary/contamination rule).

Retrieval date for all URLs below: **2026-09-14**. Anything not directly observed is marked `[UNVERIFIED]`.

## 1. Endpoints

Method for all: `GET`, no auth header, no query params, no pagination. Single JSON document per URL. Site fetch helper (`assets/use-artifact-DJwXiIcF.js`, fetched 2026-09-14) does a plain `fetch(url)`, throws on `!ok`, parses JSON, honors `Content-Length` only for a progress bar, and caches with `staleTime: Infinity` (React Query `queryKey: ["artifact", url]`).

Site routing (from `assets/live-leaderboard-BDQndJOj.js` + `assets/deepswe-v1-1-Ccfwnmvs.js`, fetched 2026-09-14):

- `qe(xe(s, "leaderboard-live"))` — `s` is the selected version id, `xe()` builds `/artifacts/<version>/leaderboard-live`.
- Version switcher prefetches every other version: `m.prefetchQuery(Ke(xe(p.id, "leaderboard-live")))`.
- Comparison chart loads `N(w, "v1-delta")` → `/artifacts/v1.1/v1-delta.json`.
- Effort rank order in chart code: `none:0, minimal:1, low:2, medium:3, high:4, xhigh:5, max:6`.

### Probe results (actually fetched 2026-09-14)

| URL                                                                   | Status                      | Size / notes                                                                          |
| --------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------- |
| `https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json`   | **200** `application/json`  | **2518 lines**, the live actively-scored v1.1 leaderboard                             |
| `https://deepswe.datacurve.ai/artifacts/v1/leaderboard-live.json`     | **200** `application/json`  | **975 lines**, stale v1 leaderboard, `generated_at: 2026-06-20T17:27:24.307648+00:00` |
| `https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard.json`        | **404** (HTML error page)   | Does not exist                                                                        |
| `https://deepswe.datacurve.ai/artifacts/latest/leaderboard-live.json` | **404**                     | No `latest` pointer                                                                   |
| `https://deepswe.datacurve.ai/artifacts/index.json`                   | **404**                     | No index                                                                              |
| `https://deepswe.datacurve.ai/api/leaderboard`                        | **404**                     | No API                                                                                |
| `https://deepswe.datacurve.ai/leaderboard.json`                       | **404**                     | No root JSON                                                                          |
| `https://deepswe.datacurve.ai/artifacts/v1.1/v1-delta.json`           | **200** `application/json`  | **1014 lines**, v1↔v1.1 comparison (discovered in `deepswe-v1-1-Ccfwnmvs.js`)         |
| `https://deepswe.datacurve.ai/artifacts/v1/leaderboard.json`          | **200** `application/json`  | **446 lines**, frozen May-13 snapshot, _different older schema_ (see Gotchas)         |
| `https://api.datacurve.ai/deepswe/leaderboard`                        | `[UNVERIFIED]` — not probed | Legacy guess from current `scripts/fetch_deepswe.py`; do not rely on                  |

### JS bundles checked (HTML `<link rel="modulepreload">` + imports, 2026-09-14)

- `/assets/index-C8-z8dCr.js` — app shell/router; version→artifact path builder lives here (minified, exact symbol `[UNVERIFIED]`, behavior confirmed via the two call sites above).
- `/assets/live-leaderboard-BDQndJOj.js` — leaderboard page; contains `xe(s,"leaderboard-live")` version switch + prefetch, effort ordering, hidden-by-default set `mt = new Set(["gpt-5-6-terra","gpt-5-4","grok-4-5","kimi-k2-7-code","claude-sonnet-4-6","gemini-3-1-pro-preview","muse-spark-1-1"])` (chart defaults, not data truth).
- `/assets/use-artifact-DJwXiIcF.js` — generic artifact fetcher quoted above.
- `/assets/stats-SbfQ_xA6.js` — family→vendor inference (`B(e)`: `gpt-→openai`, `claude-→anthropic`, `gemini-→google`, `grok-→xai`, `muse-→meta`, `glm-→zhipu`, `kimi-→moonshot`, `deepseek-→deepseek`, `mimo-→xiaomi`, `minimax-→minimax`, `qwen-→alibaba`, `composer-→cursor`) + `ue` default-effort map + Wilson CI helper. Proves the site itself derives vendors by name prefix because the JSON usually omits `provider`.
- `/assets/deepswe-v1-1-Ccfwnmvs.js` — v1.1 announcement page; references `v1-delta` artifact, 9 shared configs, isolated-verification explainer, citation block.

### Sample response excerpt (real, trimmed — v1.1 live, 2026-09-14)

```json
{
  "scope": "Every DeepSWE rollout across imported Pier jobs, grouped by configuration (harness + model + reasoning effort)",
  "unit": "pass@1 is attempt pass rate over scored rollout attempts. pass@4 is tasks with at least one passing rollout divided by tasks attempted. Context-window failures and agent timeouts are scored failures; provider/verifier/network errors are excluded. Efficiency aggregates are over every scored attempt.",
  "generated_at": "2026-09-03T22:24:37.984682+00:00",
  "n_tasks_in_set": 113,
  "latest_job": { "name": "20260901-deep-swe-1-1-gpt-6-astra", "finished_at": "2026-09-01T07:35:13Z" },
  "rows": [
    {
      "model": "gpt-6-astra",
      "harness": "mini-swe-agent",
      "provider": "openai",
      "reasoning_effort": "xhigh",
      "config": "mini_swe_agent_gpt_6_astra_xhigh",
      "source": "deep-swe",
      "cost_basis": "Expected launch pricing at all context lengths: $12/M uncached input, $15/M cache writes, $1.20/M cache reads, $50/M output, $2/M compute units.",
      "pass_rate": 0.7411504424778761,
      "pass_at_1": 0.7411504424778761,
      "pass_at_4": 0.8053097345132744,
      "n_passed": 335,
      "n_attempted": 452,
      "n_tasks_attempted": 113,
      "n_tasks_passed_any": 91,
      "completed_by_attempt": [113, 113, 113, 113],
      "pass_rate_by_attempt": [0.7079646017699115, 0.7345132743362832, 0.7787610619469026, 0.7433628318584071],
      "ci_passed": 335,
      "ci_attempted": 452,
      "ci_lo": 0.7124964807371247,
      "ci_hi": 0.7698044042186275,
      "ci_half": 0.02865396174075141,
      "n_runs": 4,
      "ci_method": "95% run-to-run: SE across repeated whole-benchmark passes (1.96 * std(runs)/sqrt(R))",
      "mean_cost_usd": 6.52377356460177,
      "median_cost_usd": 5.6717151,
      "mean_output_tokens": 29557.327433628318,
      "median_output_tokens": 28542.5,
      "mean_input_tokens": 1456927.0929203539,
      "median_input_tokens": 1163918.5,
      "mean_uncached_input_tokens": 295.3871681415929,
      "median_uncached_input_tokens": 87,
      "mean_cache_tokens": 1326921.6836283186,
      "mean_cache_read_tokens": 1326921.6836283186,
      "median_cache_read_tokens": 1035975,
      "mean_cache_write_tokens": 129710.02212389381,
      "median_cache_write_tokens": 103995,
      "mean_reasoning_tokens": 11255.66592920354,
      "median_reasoning_tokens": 10434,
      "mean_compute_units": 752203.0973451327,
      "median_compute_units": 662371.5,
      "mean_duration_seconds": 1132.4004424778761,
      "median_duration_seconds": 959,
      "mean_agent_steps": 28.754424778761063,
      "median_agent_steps": 26,
      "median_peak_context_tokens": null,
      "median_output_tokens_to_pass": 28361
    },
    {
      "model": "gemini-3-8-flash",
      "harness": "mini-swe-agent",
      "reasoning_effort": "high",
      "config": "mini_swe_agent_gemini_3_8_flash_high",
      "source": "deep-swe",
      "pass_rate": 0.738255033557047,
      "pass_at_1": 0.738255033557047,
      "pass_at_4": 0.8584070796460177,
      "n_passed": 330,
      "n_attempted": 447,
      "n_tasks_attempted": 113,
      "n_tasks_passed_any": 97,
      "mean_cost_usd": 2.362349413758389,
      "median_cost_usd": 2.1098912999999997,
      "mean_output_tokens": 143242.6644295302,
      "median_output_tokens": 138377,
      "mean_input_tokens": 21734449.25279642,
      "median_input_tokens": 18026661,
      "mean_cache_tokens": 21456039.230425056,
      "mean_duration_seconds": 686.7691519843399,
      "median_duration_seconds": 604.643838,
      "mean_agent_steps": 166.3131991051454,
      "median_agent_steps": 161,
      "median_peak_context_tokens": 215558,
      "median_output_tokens_to_pass": 136617.5
    }
  ]
}
```

`muse-spark-1-1` row excerpt (proves missing `provider`, 2026-09-14):

```json
{
  "model": "muse-spark-1-1",
  "harness": "mini-swe-agent",
  "reasoning_effort": "xhigh",
  "config": "mini_swe_agent_muse_spark_1_1_xhigh",
  "source": "deep-swe",
  "pass_rate": 0.5331858407079646,
  "median_cost_usd": 1.7171158,
  "median_peak_context_tokens": 154817.5
}
```

Rate limits: none documented, none observed (static CDN JSON). ETag/`Last-Modified`/`If-None-Match` support: `[UNVERIFIED]` — the `read` transport does not expose response headers; verify with `curl -sI` before relying on conditional requests (the fetch-strategy section below handles both cases).

## 2. Schema

Top-level object (`v1.1/leaderboard-live.json`):

| Field            | Type                                  | Meaning                                                                                     |
| ---------------- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `scope`          | string                                | Population: every rollout grouped by configuration                                          |
| `unit`           | string                                | Scoring rubric (pass@1/pass@4 definitions, failure/exclusion rules, efficiency denominator) |
| `generated_at`   | string (ISO-8601, tz-aware)           | Artifact build time; staleness key                                                          |
| `n_tasks_in_set` | integer                               | Task-set size (113)                                                                         |
| `latest_job`     | `{name: string, finished_at: string}` | Most recent Pier job rolled into the artifact                                               |
| `rows`           | array of row objects                  | One per (harness, model, reasoning_effort) config                                           |

`rows[]` field table (union over all 70 live rows; "missing" = key absent on some rows, verified):

| Field                                                         | Type           | Meaning / units                                                                                              | Nullability                                                                                           |
| ------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `model`                                                       | string         | Dashed model id (`gpt-6-astra`, `muse-spark-1-1`)                                                            | never null                                                                                            |
| `harness`                                                     | string         | Agent harness; always `mini-swe-agent` in live file                                                          | never null                                                                                            |
| `provider`                                                    | string         | Billing/vendor id, lowercase (`openai`)                                                                      | **missing except 5× `gpt-6-astra` rows**; treat as optional                                           |
| `reasoning_effort`                                            | string \| null | Effort tier: `low`/`medium`/`high`/`xhigh`/`max` (code also knows `none`/`minimal`); `null` = vendor default | null only on `kimi-k2-7-code` (`..._default` config)                                                  |
| `config`                                                      | string         | Unique config key: `mini_swe_agent_<model>_<effort>` or `..._default` when effort is null                    | never null                                                                                            |
| `source`                                                      | string         | Always `deep-swe`                                                                                            | never null                                                                                            |
| `cost_basis`                                                  | string         | Pricing note for modeled (pre-launch) cost                                                                   | **missing except 5× `gpt-6-astra` rows**                                                              |
| `pass_rate`                                                   | number 0–1     | Attempt pass rate (pass@1); primary score                                                                    | never null                                                                                            |
| `pass_at_1`                                                   | number 0–1     | Always equals `pass_rate` in this artifact                                                                   | never null                                                                                            |
| `pass_at_4`                                                   | number 0–1     | Fraction of attempted tasks with ≥1 passing rollout                                                          | never null                                                                                            |
| `n_passed`                                                    | integer        | Passed attempts                                                                                              | never null                                                                                            |
| `n_attempted`                                                 | integer        | Scored attempts (≈113 tasks × 4 runs; 429–452 observed)                                                      | never null                                                                                            |
| `n_tasks_attempted`                                           | integer        | Distinct tasks attempted (113; v1 had one 111 row)                                                           | never null                                                                                            |
| `n_tasks_passed_any`                                          | integer        | Tasks with ≥1 passing rollout                                                                                | never null                                                                                            |
| `completed_by_attempt`                                        | integer[4]     | Tasks completed per whole-benchmark pass                                                                     | **gpt-6-astra rows only**                                                                             |
| `pass_rate_by_attempt`                                        | number[4]      | Per-pass pass rate                                                                                           | **gpt-6-astra rows only**                                                                             |
| `ci_passed` / `ci_attempted`                                  | integers       | Numerator/denominator for the CI (usually = n_passed/n_attempted)                                            | never null                                                                                            |
| `ci_lo` / `ci_hi`                                             | number 0–1     | 95% run-to-run CI bounds                                                                                     | never null                                                                                            |
| `ci_half`                                                     | number         | CI half-width, in rate points                                                                                | never null                                                                                            |
| `n_runs`                                                      | integer        | Whole-benchmark passes (4 everywhere observed)                                                               | never null                                                                                            |
| `ci_method`                                                   | string         | Constant: `95% run-to-run: SE across repeated whole-benchmark passes (1.96 * std(runs)/sqrt(R))`             | never null                                                                                            |
| `mean_cost_usd` / `median_cost_usd`                           | number         | USD per scored attempt (billed or `cost_basis`-modeled)                                                      | never null                                                                                            |
| `mean_output_tokens` / `median_output_tokens`                 | number         | Output tokens per attempt                                                                                    | never null                                                                                            |
| `mean_input_tokens` / `median_input_tokens`                   | number         | Input tokens per attempt                                                                                     | never null                                                                                            |
| `mean_uncached_input_tokens` / `median_uncached_input_tokens` | number         | Non-cached input slice                                                                                       | **gpt-6-astra rows only**                                                                             |
| `mean_cache_tokens`                                           | number         | Cache-affected input tokens                                                                                  | present on all live rows observed                                                                     |
| `mean_cache_read_tokens` / `median_cache_read_tokens`         | number         | Cache reads                                                                                                  | **gpt-6-astra rows only**                                                                             |
| `mean_cache_write_tokens` / `median_cache_write_tokens`       | number         | Cache writes                                                                                                 | **gpt-6-astra rows only**                                                                             |
| `mean_reasoning_tokens` / `median_reasoning_tokens`           | number         | Reasoning-trace tokens                                                                                       | **gpt-6-astra rows only**                                                                             |
| `mean_compute_units` / `median_compute_units`                 | number         | Vendor compute units (×$2/M per `cost_basis`)                                                                | **gpt-6-astra rows only**                                                                             |
| `mean_duration_seconds` / `median_duration_seconds`           | number         | Wall-clock seconds per attempt (v1.1 blog: no longer emphasized)                                             | never null                                                                                            |
| `mean_agent_steps` / `median_agent_steps`                     | number         | Agent steps per attempt                                                                                      | never null                                                                                            |
| `median_peak_context_tokens`                                  | number \| null | Median peak context window, tokens                                                                           | **explicit `null` on all 5 `gpt-6-astra` rows**; number (sometimes `.5` from even-n median) elsewhere |
| `median_output_tokens_to_pass`                                | number         | Median output tokens among passing attempts (`.5` possible)                                                  | never null                                                                                            |

Keying, counts, reduction (counted from the 2026-09-14 fetch by row-start lines: 70 rows, 28 distinct `model` values):

- Key = (`harness`, `model`, `reasoning_effort`) in practice; `config` is its unique serialization. `model` alone is NOT unique (e.g. `gpt-6-astra` ×5: low/medium/high/xhigh/max; `claude-opus-5` ×4; `gpt-5-6-luna` ×4).
- 28 distinct models: claude-fable-5, claude-opus-4-8, claude-opus-5, claude-sonnet-4-6, claude-sonnet-5, deepseek-v4-flash, deepseek-v4-pro, gemini-3-1-pro-preview, gemini-3-5-flash, gemini-3-6-flash, gemini-3-7-flash, gemini-3-8-flash, glm-5-2, glm-5-3, glm-5-3-flash, gpt-5-4, gpt-5-5, gpt-5-6-luna, gpt-5-6-sol, gpt-5-6-terra, gpt-6-astra, grok-4-5, grok-4-6, kimi-k2-7-code, kimi-k3, muse-spark-1-1, muse-spark-1-2, qwen3-8-max.
- Reduce to one row per model by keeping the max-`pass_rate` config (current repo behavior, matches CONTRIBUTING item 7). Tie-break: higher `reasoning_effort` rank, then lower `median_cost_usd` (site's own `_t()` picks higher pass_rate then higher effort rank). Preserve the losers as `effort_variants` (current `normalize()` behavior) — the site's chart draws exactly these swept lines per `harness::model` group.
- Display-name mapping stays hand-maintained (`gpt-5-5`→`gpt-5.5`-style dash-to-dot is irregular: `qwen3-7-max`→`qwen-3.7-max` vs `gpt-5-4-mini`→`gpt-5.4-mini`); warn + pass through raw id on unknown models.

## 3. `provider` field values

- Only observed value in the entire live file: `"provider": "openai"` on the 5 `gpt-6-astra` rows. Every other row (65/70) **omits the key entirely** — it is not `null`, it is absent.
- Confirmed: `muse-spark-1-1` (`mini_swe_agent_muse_spark_1_1_xhigh`) and `muse-spark-1-2` (`mini_swe_agent_muse_spark_1_2_xhigh`) have **no `provider` key**. The current repo comment ("provider unknown, deliberately left unmapped") is correct; keep them `provider: null` downstream until a maintainer confirms the vendor.
- Do not infer vendor from `provider`. The site itself ignores it and infers family by model-name prefix (`stats-SbfQ_xA6.js` `B()`: `muse-`→`meta`, `gpt-`/`o1-`/`o3-`/`o4-`→`openai`, etc. — note this maps `muse-spark-*` to Meta, which is `[UNVERIFIED]` as a vendor claim; keep our hand-maintained `MODEL_PROVIDER_MAP` approach).
- Normalizer rule: `provider?: string` → `string | null`; `row.provider ?? null`, then hand-map override wins.

## 4. Refresh (stability, versioning, staleness)

- `v1.1` is the **moving** leaderboard; `v1` is **frozen/stale**:
  - v1.1 live: `generated_at: 2026-09-03T22:24:37.984682+00:00`, `latest_job: 20260901-deep-swe-1-1-gpt-6-astra @ 2026-09-01T07:35:13Z`, 70 rows / 28 models, changelog entries through Sep 3 2026 (GPT-6 Astra sweep).
  - v1 live: `generated_at: 2026-06-20T17:27:24.307648+00:00`, `latest_job: 20260618-deep-swe-glm-5-2`, 975 lines (~30 rows); superseded by the Jun 15 v1.1 release (isolated verification + CTRF node-id scoring).
  - v1 frozen snapshot `artifacts/v1/leaderboard.json` (446 lines, `scope: Full May 13 DeepSWE Pier job`, `selection_source: computed from data/raw/rollouts/deep-swe-all-4x-cross-bench-minimal`) matches the May 26 v1 blog post — different schema, do not parse with the live parser.
- Versioned dirs `v1/`, `v1.1/` exist. No `latest` pointer, no `index.json` (both 404). The site hardcodes the version switcher instead of discovering versions.
- Cadence: irregular, event-driven (new model or pricing restatement). Changelog (`/changelog`, fetched 2026-09-14) shows ~19 entries Jun 15 → Sep 3 2026: model adds (Fable 5, Kimi K3, Grok 4.5/4.6, DeepSeek v4 Pro/Flash, Gemini 3.6/3.7/3.8 Flash, GPT-5.6 family, GPT-6 Astra, Muse Spark 1.1 Jul 14 / 1.2 Aug 7, Qwen 3.8 Max) plus pure **cost restatements with no new rollouts** (Aug 21 DeepSeek peak/off-peak, Aug 20 GPT-5.6-Sol cut, Aug 14 Gemini 3.6 cut, Jul 30 GPT-5.6-Terra/Luna cuts, Aug 13 LiteLLM double-count fix re-run).
- Staleness detection (in order): (1) byte-compare / `generated_at` change; (2) `latest_job.{name,finished_at}` change; (3) row-count / per-`config` `pass_rate`+`median_cost_usd` diff; (4) poll `/changelog` as human-readable backup. Costs can move without `generated_at` semantics changing meaning — always diff `median_cost_usd` per config, not just the timestamp.
- `n_tasks_in_set` is 113 in both live files (v1 had one row with `n_tasks_attempted: 111` — handle <113 gracefully).

## 5. License / redistribution verdict

- Repo license: **Apache License 2.0** (`github.com/datacurve-ai/deep-swe`, `LICENSE` fetched 2026-09-14; GitHub repo page also labels it "Apache License 2.0"). Quoted grant (§2): _"each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare Derivative Works of, publicly display, publicly perform, sublicense, and distribute the Work and such Derivative Works in Source or Object form."_ Redistribution (§4) requires: _(a) give recipients a copy of this License; (b) modified files carry prominent change notices; (c) retain copyright/patent/trademark/attribution notices; (d) include any NOTICE-file attributions._
- Scope limit (`PROVENANCE.md`, fetched 2026-09-14): _"The Apache-2.0 license applied to this repository covers only Datacurve AI Inc.'s original contributions (task specifications, evaluation harness, verifiers, and curation). It does **not** relicense the upstream projects listed below … All listed licenses are permissive; none are copyleft or share-alike."_
- Leaderboard-data license: **none found** — no data-terms, ToS, or © notice on `/`, `/run`, `/blog/deepswe`, `/blog/deepswe-v1-1`, `/changelog`, or in `README.md`/`PROVENANCE.md` (all fetched 2026-09-14). `[UNVERIFIED]`: no footer-ToS or API-terms page was discovered; re-check if the site adds one.
- Canary / contamination policy: the benchmark carries a canary string. This repo's own `SOURCES.md` (read 2026-09-14): _"DeepSWE task content is never mirrored here. The benchmark carries a canary string specifically to catch that, and contamination would ruin the benchmark this project depends on."_ `scripts/fetch_deepswe.py`: _"This script never touches DeepSWE task content, only leaderboard metadata (model id, score, cost per task, output tokens, agent steps). The benchmark carries a canary string specifically to catch that kind of mirroring."_ The `/run` page adds: _"To submit your model or agent to the leaderboard, reach out to serena@datacurve.ai"_ and _"benchmark data should not appear in training data"_ (search-result summary, `[UNVERIFIED]` verbatim — confirm on page before quoting externally).
- **Verdict: YES, may republish aggregate leaderboard numbers + derived cost-per-task figures** in a public static site + repo (facts/measurements with computation on top; Apache-2.0 permits the harness/repo reuse provided §4(a)–(d) are honored), **with attribution**: link each figure to `https://deepswe.datacurve.ai/` + `https://github.com/datacurve-ai/deep-swe`, note `generated_at` + scoring version (v1.1), and carry the Apache-2.0 license copy/notice for any reused repo content. **NO to mirroring task content** (`instruction.md`, `solution.patch`, `tests/`, Dockerfiles) — canary + contamination rule. No regional/promotional pricing carve-outs needed beyond the `cost_basis` note for pre-launch models.

## 6. Recommended TS fetch strategy

Concrete plan for the Bun + Astro rewrite (paths assume Astro root; adjust to final tree):

- **Files**: `scripts/fetch-deepswe.ts` (Bun CLI, zod-validated) writing `data/deepswe-live.json` (raw snapshot, committed fallback) + normalized models into the existing `data/models.json` pipeline; `src/lib/deepswe.ts` exporting `fetchLeaderboard()`, `normalizeDeepSWE()`, `diffDeepSWE()`.
- **Source order**: `1` v1.1-live → `2` v1-live (stale fallback, warn loudly) → `3` committed `data/deepswe-live.json` snapshot (offline/build fallback). Never try the 404 quartet (`v1.1/leaderboard.json`, `latest/*`, `artifacts/index.json`, `/api/leaderboard`, `/leaderboard.json`) except as a periodic re-probe (quarterly) in case the site adds a pointer.
- **Request**: `GET` with `User-Agent: rack-rate-fetch/1 (+https://github.com/<org>/rack-rate)`, `Accept: application/json`. Send `If-None-Match` (stored ETag) and `If-Modified-Since` (stored `Last-Modified`) when available — honor `304 Not Modified` by reusing the snapshot. `[UNVERIFIED]` whether the CDN sends ETag/Last-Modified; the code must work when they are absent (fall back to `generated_at` comparison).
- **Retry/caching** (mirror current Python behavior + conditional fetch):

```ts
// src/lib/deepswe.ts (sketch)
export const DEEPSWE_SOURCES = [
  "https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json",
  "https://deepswe.datacurve.ai/artifacts/v1/leaderboard-live.json",
] as const;
export async function fetchDeepSWE(opts: { timeoutMs?: number; retries?: number } = {}) {
  // try sources in order; per-source: up to `retries` (default 3) with
  // exponential backoff (≈500ms × 2^attempt) + jitter; 10–15s timeout via AbortSignal;
  // attach If-None-Match / If-Modified-Since from data/deepswe-live.meta.json when present;
  // on 304 return { raw: snapshot, notModified: true }.
  // throw only if every source fails → caller falls back to committed snapshot.
}
export function normalizeDeepSWE(raw: DeepSWERaw) {
  // group rows by `model`; keep max pass_rate (tie: higher effort rank, then lower median_cost_usd);
  // map model ids via MODEL_NAME_MAP, vendors via MODEL_PROVIDER_MAP (null when unknown,
  // e.g. muse-spark-*); round exactly like fetch_deepswe.py; keep losers as effort_variants.
}
```

- **Validation**: zod schema with `.passthrough()` tolerance — required: `model/harness/config/pass_rate/median_cost_usd/median_output_tokens/median_input_tokens/median_agent_steps`; optional (`provider`, `cost_basis`, `completed_by_attempt`, `pass_rate_by_attempt`, uncached/cache-split, reasoning, compute fields) + `median_peak_context_tokens: number().nullable()`; `reasoning_effort: string().nullable()`; reject on missing required, warn (not fail) on unknown `model` ids so new models still ship with raw ids.
- **Refresh cadence**: weekly cron/`--diff` CI check (mirrors `fetch_deepswe.py --diff` exit-1-on-change); commit the snapshot on change with `generated_at` + `latest_job` in the commit message; alert on `median_cost_usd`-only moves (pricing restatements) vs `pass_rate` moves (new rollouts).

## 7. Gotchas / unknowns

1. `provider` is **absent, not null**, on 65/70 rows (all non-`gpt-6-astra` models incl. both `muse-spark-*`) — accessor must be `row.provider ?? null`, and vendor must come from the hand map, not the field.
2. `median_peak_context_tokens` is **explicit `null`** on all 5 `gpt-6-astra` rows (only null-median in the file) — downstream must accept null (chart gap), not 0.
3. `reasoning_effort: null` on `kimi-k2-7-code` (config `..._default`) — effort enum must include null; `config` (not effort) is the unique key.
4. `cost_basis` + uncached/cache-split + reasoning-tokens + compute-units + per-attempt arrays exist **only** on `gpt-6-astra` rows (pre-launch modeled pricing: $12/M uncached input, $15/M cache writes, $1.20/M cache reads, $50/M output, $2/M compute units) — parser must not require them.
5. `pass_at_1 === pass_rate` on every row — use `pass_rate` as the score; `pass_at_4` is the breadth metric. `n_attempted` is attempts (429–452), not tasks; per-task rate = `n_tasks_passed_any / n_tasks_attempted`.
6. Costs are **retroactively restated** (changelog Aug 13–21, Jul 30): LiteLLM double-count fix, DeepSeek peak/off-peak (we use peak), GPT-5.6/Gemini promotional cuts — same `config` can change `median_cost_usd` with no new rollouts. Always diff costs separately and record the changelog reason.
7. `v1/leaderboard.json` (frozen May-13 snapshot) has an **older incompatible schema** (`reasoning_efforts` plural, `median_steps`, `selection_notes`, `n_pass_at_4`, `task_pass_any_rate`, no harness/cost/token-split fields) — never feed it to the live parser; v1-live (`leaderboard-live.json`) parses with the live parser.
8. Site charts plot **means** (`mean_cost_usd`, `mean_output_tokens`, `mean_agent_steps`) while this repo tracks **medians** — expect systematic site-vs-repo number gaps; not an error.
9. Claude Fable 5 trials are **incomplete** (v1.1 post, 2026-09-14): N of M trials missing due to suspended access mid-sweep; rates are over completed trials — do not compare its `n_attempted` naively.
10. `[UNVERIFIED]` ETag/`Last-Modified`/conditional-request support, CDN cache TTL, and any rate limit — implement `If-None-Match` opportunistically with `generated_at` fallback; confirm with `curl -sI`.
11. `[UNVERIFIED]` exact full version-id list in the site switcher (observed: `v1`, `v1.1`) and whether `n_runs` is always 4 for future models — code must not hardcode either.
12. `[UNVERIFIED]` verbatim canary string and any future leaderboard-specific redistribution terms — never fetch/mirror `tasks/*` content; re-check the site footer + repo root yearly.
