---
id: M2
title: Data points (PLAN stage 2)
description: "`bun run fetch` refreshes every source into committed JSON; `bun run validate` catches a broken source; `bun run compute` produces `data/derived.json`. No site work."
status: completed
started: 2026-09-14
completed: 2026-09-14
tasks:
  - DATA-201
  - DATA-202
  - DATA-203
  - DATA-204
  - DATA-205
  - DATA-206
  - COR-207
  - COR-207b
  - COR-208
  - COR-209
  - DATA-210
  - COR-211
  - DATA-212
retro:
  - RETRO-2026-09-17-002
---

# Data points (PLAN stage 2)

## Definition of done

`bun run fetch` refreshes every source into committed JSON;
`bun run validate` catches a broken source; `bun run compute` produces
`data/derived.json`. No site work.

## Stage record

### Stage 2 — Data points (fetch, normalize, validate, compute)

**Acceptance**

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

**Contract handed to Stage 3**

Committed `data/derived.json` with the shape `apps/site` will import; badge
states and frontier arrays precomputed so the site renders without client math.

## Stage session log

### 2026-09-14 — Stage 2 (fetch, normalize, validate, compute) — tasks 2.1–2.12

All thirteen Stage 2 boxes are ticked; this is one stage, landed behind a frozen
contract. The network that Stage 1 recorded as blocked is reachable from this
environment, so every fetcher was exercised against its live source rather than
against a fixture.

**What landed**

- `packages/data-cli/src/http.ts` (2.1): 15 s `AbortSignal.timeout` per attempt,
  3 attempts, exponential backoff + jitter, `Retry-After` honoured on 429, fail
  fast on other 4xx, `User-Agent: rack-rate/2.0.0 (+https://github.com/marshalfevzi/rack-rate)`,
  raw body to `data/raw/<source>-<YYYY-MM-DD>.json`, plus an optional
  `headers` bag (the AA API key) and `persistSnapshot: false` so a proprietary
  body is never written to disk, not even gitignored.
- `packages/core/src/cost.ts` (2.7/2.7b), `normalize.ts` (2.8), `pareto.ts`
  (2.9): pure, no clock, no I/O, re-exported from the `@rack-rate/core` barrel.
  `tokenAllowance` records its blend as a field (`3:1` by default) and carries
  the cache-tier caveat string rather than hiding it in prose.
- Four fetchers (2.2–2.5). `fetch:deepswe` pulled
  `artifacts/v1.1/leaderboard-live.json` directly (94,738 bytes, byte-equal to
  the live body) and reproduced all 28 model rows with scores, costs, tokens and
  steps unchanged against `HEAD`; the only movement is `ci_lo`/`ci_hi`/`ci_method`
  now populated for all 28, which the legacy pipeline dropped. Provider mapping
  stayed a hand map: `muse-spark-1.1`/`1.2` are warned about and left
  `provider: null`. `fetch:terminal-bench` extracted the board `4-0-0` flight
  data, selected 12 rows from 18 display rows, skipped the two labels that do
  not resolve to a committed model (`Fable 5.1`, `Fable 5`), and recorded board
  id `9f966760-00f1-424e-90f5-c964fb6f6091`, dataset_version_ids
  `1922072f-a433-429a-8929-350d5e1bcf02`, `updated_at`
  `2026-09-10T21:58:00.001022+00:00` and `task_count` 66 with the Hub URL it
  came from. `display_accuracy`/`display_cost` are never parsed.
  `fetch:artificial-analysis` is gated off and
  `fetch:plans` fails closed (28 raw snapshots, 10 of 16 plans anchor-verified).
- `data/derived.json` is now committed (it was untracked at the end of Stage 1)
  with the legacy keys verbatim, plus `generated_at`, `composites`, `frontiers`
  (`api` and `plan_adjusted`), `token_allowances` and `badges.per_pair`.
- CLI (2.12): `rack-rate-data <fetch|validate|compute|check|sources|doctor>`
  with `--diff` on `fetch`, a `data:check` root script, and a `Data CLI` section
  in `docs/architecture.md`.
- Two source records were added to `data/sources.json` (9 → 11):
  `src-terminal-bench` and `src-artificial-analysis`, so every published
  benchmark number still traces to a citation and the sources page can state
  which AA state the build is in.

**Deliberate deviations from PLAN wording** (schema constraints, recorded rather
than silently absorbed)

- 2.3/2.5 "write `evidence.url` + `evidence.retrieved` per row": `Plan.evidence`
  is a `string[]` of source ids in the frozen contract, so rows keep the id list
  and the fetchers refresh the referenced `sources.json` records' `retrieved`
  date instead. Benchmark rows carry their extra provenance (board id, dataset
  version, selection rule, task-count URL and its basis) per row, because
  `Benchmark` is a strict object with no entry-level provenance field.
- 2.5 "keep last-good + `stale: true`": `Plan` has no `stale` field, and a
  fail-closed run writes nothing, so a partial refresh cannot mark itself stale.
  Staleness is expressed three ways instead: a non-zero exit, the per-plan
  verified/missing/unreachable table, and `badges.freshness` in
  `data/derived.json`.
- 2.6's `unavailable_reason` needed a field that did not exist; `Plan` gained it
  as optional, and `validate` requires it only when `available: false`.
- The `credits` quota branch needs per-1M-token rates that no committed row
  carries (no fetched source publishes a rate card), so it is proven by a
  synthetic test only. `google-ai-pro` is the single credits plan and its quota
  stays unresolved.

**Verified**

- `bun run fetch:deepswe --diff` → exit 1 on the first run (28 models changed:
  CI fields only, no added/removed rows and no cost-only moves), exit 0 on the
  second → the refresh is idempotent at the byte level; second run left
  `data/models.json` sha256 `c8e3110f…765fb7` and `data/benchmarks.json`
  `22bf3572…0614127` unchanged.
- `bun run fetch:terminal-bench` twice → same entry both times, `--diff` exit 0
  before and after, `validate` exit 0. `fetch:plans` → exit 1 with the full
  anchor table and both `plans.json` (`06149e43…55da9f`) and `sources.json`
  (`e92e0da0…74c509`) hashes identical before and after. AA probes: unset → skip
  exit 0; `AA_API_KEY=dummy AA_PUBLISH=0` → skip exit 0; key + `AA_PUBLISH=1` →
  exit 1 on HTTP 401 with no write and no `data/raw/*aa*` file.
- `bun run validate && bun run compute` → exit 0; `bun run compute` twice →
  `data/derived.json` sha256 `6d92d4afc42151018b70d7dc2a26e8ee584573a77a3660bb268abf9b7f482b4b`
  both times; `bun run data:check` → exit 0 with equal expected/committed
  hashes.
- `check` negative control: one pair deleted from `data/derived.json` → exit 1
  naming the first differing top-level key (`pairs`, expected 178 vs committed
  177) and both hashes; file restored byte-identical (`git diff --stat` empty).
- `validate` negative control run here as the stage gate: a bad evidence id, a
  removed `quota_usd_month` and a mangled CC BY 4.0 attribution string → exit 1
  with three row-naming errors (`plans[0] (claude-pro)`, `plans[1] (claude-max-5x)`,
  `sources[4] (src-awesome-coding-plan)`); restored → exit 0 ("no problems").
- `bun test` → 17 pass / 0 fail / 55 `expect()` calls across 4 files, including
  the port parity gate: 178 pairs, 28 best routes, 11 cross-check pairs,
  `median_ratio` 1.601, deep-equal against `data/fixtures/legacy-derived.json`
  from the pinned inputs in `data/fixtures/legacy-inputs.{models,plans}.json`
  (added here so a live refresh cannot move the oracle), with a
  perturbed-pair guard proving the comparison is not vacuous. The frozen
  fixture's 5 `known_gaps` are asserted as a subset of the pinned input's 7 (two
  measured plans gained gap entries after the legacy run) plus the passthrough
  contract; deep-equalling them would have pinned a data revision, not the port.
- `bun run check` → exit 0 (`tsc --build --force`, `oxlint`, `oxfmt --check`,
  `astro check` 0 errors / 0 warnings); `bun run lint` and
  `bun run format:check` both exit 0. Getting there cleaned 23 findings from the
  new code: 15 `anti-slop/require-readable-spacing` autofixed by
  `bun run lint:fix`, and 8 `anti-slop/no-known-value-widening` (explicit
  `Record<string, …>` lookups in four commands) replaced with `Map` literals or
  module-owned named tables — no rule suppressed, weakened or disabled.
- CLI smoke: `--help` exit 0 and an unknown command exit 1 with usage;
  `sources` exit 0 (11 sources, 1 attribution-required, AA state `off`);
  `doctor` exit 0 (30 URL probes, all five `data/*.json` valid, 31 same-day raw
  snapshots); `fetch all` runs deepswe → terminal-bench → plans, stops on the
  plans fail-closed exit 1, and reports `artificial-analysis` as not attempted.
- `bun run quality` (fallow, advisory) → dead-code issues 15 → 10 after deleting
  the five unused exports it found (`REPO_ROOT`, `FIXTURES_DIR`,
  `rawSnapshotPath`, `readSnapshot`, `PLAN_ANCHORS`); the remaining 10 are the
  eight Stage-3 `apps/site` dependencies, one vendored plugin export, and the
  intentional duplicate `run` export per command module. Its health section
  still points at the vendored anti-slop tree first, with `http.ts`'s `fetchText`
  the only application file in the refactoring list.

**Still open**

- The Artificial Analysis enabled path is unproven: no key exists in this
  environment, so row mapping, pagination and the index-version abort have never
  run against live data. The gate itself is proven in all three closed/denied
  states.
- Six plans (Claude Max 5x/20x, ChatGPT Pro 20x, Kimi Andante/Allegretto, GLM
  Lite/Pro) cannot be anchor-verified from this environment: their vendor pages
  are JS shells that return HTTP 200 with no quoted limit text. `fetch:plans`
  therefore exits 1 here by design and leaves `data/plans.json` at its Stage 1
  revision. A contributor with an unblocked network (or a rendered-page source)
  is needed to refresh those rows.
- `fetch plans`' `--diff` and the plans/vendor refresh path have not been
  exercised with all anchors present, so the write branch of that fetcher is
  unproven end to end; only its fail-closed branch has run.
- The deepswe v1 fallback and the harbor-CLI fallback in `fetch:terminal-bench`
  were not exercised (the live paths worked). Both exist for a future site
  change and are unproven.

### 2026-09-14 — Stage 2 corrections (token mapping, derived rounding, portability)

Review of the stage-2 commit found three defects and one noise problem. All are
fixed in `f450f37` and `a0b9118`; the stage stays ticked because no requirement
changed, but the published numbers did.

- **Terminal-Bench `tokens_input` double counted cache reads.** Upstream's
  `metrics.total_tokens` equals `metrics.uncached_input_tokens + output_tokens`
  **exactly** on all 18 display rows, so cached reads are already inside
  `uncached_input_tokens` and the sum this repo published (`cached + uncached`)
  was 1.87–1.95× the true input — e.g. gpt-6-astra shipped 2,949,141,032 instead
  of 1,505,789,330. `tokens_input` is now `uncached_input_tokens`, the identity
  is asserted per row and fails the run if it breaks, and `cached_input_tokens`,
  `uncached_input_tokens`, `total_tokens` plus a `token_mapping` note are kept in
  the row provenance so the mapping is auditable. This was the one wrong number
  in committed data, and a 1.9× error is worse than a missing one.
- **Float artifacts in published rows.** `ci_hi` on one terminal-bench row read
  `41.050000000000004` (raw float addition of our own). `score`, `ci_lo` and
  `ci_hi` are now rounded to 2dp with `roundHalfEven`, with the
  `ci_lo <= score <= ci_hi` invariant re-asserted after rounding.
- **Non-portable hardcoded binary path.** `fetch:terminal-bench` hardcoded
  `/Users/marshal/.local/bin/harbor`, which cannot exist in CI or another
  checkout. Resolved now from `HARBOR_BIN`, then `PATH`, with the resolved
  binary logged and a fail-closed message naming both when neither works — and
  only after the flight-data path has already failed. `git grep /Users/marshal`
  is empty.
- **Derived output noise.** `data/derived.json` shipped 941 values with six or
  more fractional digits in the sections added this stage (raw z-scores,
  weighted z, frontier distances, blended rates) — its published form now rounds
  those to 4dp via `roundHalfEven` (log 0.47 / 4.9425 instead of
  `0.46999999999999886` / `4.9425091236551495`).
- **Precision rule this settles, stated once so Stage 3 does not re-litigate
  it:** round what this repo computes (published derived metrics 4dp, benchmark
  score/CI 2dp), preserve what upstream reports (`models.json` CI fractions and
  the DeepSWE benchmark CIs keep upstream precision; the site's format layer
  owns display rounding). The legacy `pairs`/`best_routes`/`cross_check`
  precision is untouched because the parity fixture pins its bytes.

**Verified:** `fetch terminal-bench --diff` exit **1** before the fix landed
(the differing case, previously unproven) and exit **0** after, with a repeat
plain run leaving `data/benchmarks.json` byte-identical
(`b35914d2…81029d`); the token identity holds for all 12 published rows and no
long-float artifact remains in any published score/CI; `fetch:deepswe --diff`
still exit 0 and byte-stable; `validate` "no problems"; `bun run check`, `bun
test` (17 pass), `bun run data:build`, `bun run data:check` and two back-to-back
compute runs (sha256 `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`
both times) all exit 0.

## Provenance

- Split from `docs/history/stages-1-2.md` on 2026-09-17 by the PM history parse; the frozen source file is unchanged.
- Task text, acceptance, handover contract and session records are verbatim slices. The stage's own labels (`1.1`, `3.3b`, …) are its numbering in force when it ran; each maps to the canonical id named in the task document's `## Notes`.
- `status: completed` is set by the parse once every task is recorded as done; the retro is `RETRO-2026-09-17-002`.
