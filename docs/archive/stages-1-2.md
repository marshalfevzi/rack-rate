# PLAN archive — Stages 1–2 and session history

Append-only history for the `rack-rate` rewrite. `PLAN.md` is the live plan; a
stage's task list, acceptance criteria, handover contract and progress-log
entries move here once the stage has landed. Do not rewrite what is here.

Read [`PLAN.md`](../../PLAN.md) first, then `AGENTS.md`.

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
- [x] 1.10 Linting, formatting, and code-quality tooling (added 2026-09-14, after
  Stage 1 closed). Pin `oxlint` 1.82.0 + `@oxlint/plugins` 1.82.0 as an exact
  pair, `oxfmt` 0.67.0, and `fallow` 3.25.0 as root devDependencies; vendor the
  `install-anti-slop` plugin to `tools/oxlint/anti-slop/` with provenance and
  enable all 18 generic rules plus `oxc/no-accumulating-spread` and
  `typescript/no-explicit-any` at error severity; add `.oxlintrc.json` and
  `.oxfmtrc.json` (`semi: false` for the existing semicolon-free style;
  `data/**`, `**/*.md` and the vendored plugin excluded); add root scripts
  `lint`, `lint:fix`, `format`, `format:check`, `quality`, and make
  `bun run check` = `typecheck → lint → format:check → astro check`. Fallow is a
  report-only reviewer: no gate in `check`, no CI gate. Commands, exclusions and
  their reasons are recorded in `AGENTS.md`.

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

- [x] 2.1 `packages/data-cli/src/http.ts` — `fetchJson`/`fetchText` with
  `AbortSignal.timeout(15_000)`, 3 attempts, exponential backoff + jitter,
  429 `Retry-After` honoured, `User-Agent: rack-rate/<version> (+repo url)`,
  raw snapshot cached under `data/raw/<source>-<YYYY-MM-DD>.json` so diffs are
  reviewable. Retry only network errors and 5xx; fail fast on 4xx.
- [x] 2.2 `fetch deepswe` → `data/models.json`. Live artifact
  `artifacts/v1.1/leaderboard-live.json`, fallback `v1`. Reduce one row per
  `(model, harness, effort)` to one model row at the highest-scoring effort,
  keeping `effort_variants`. Map `provider` from an explicit hand map
  (the field is absent upstream on ~65/70 rows); unmapped → `null`, never a
  guessed vendor. Use medians, not means. Carry `ci_lo`/`ci_hi`/`ci_method`,
  `generated_at`, `n_tasks_in_set`.
- [x] 2.3 `fetch terminal-bench` → `data/benchmarks.json#terminal-bench`.
  Parse the embedded flight data for board `4-0-0` (queryKey
  `["leaderboard","terminal-bench/terminal-bench","4-0-0"]`); on parse failure
  fall back to `harbor hub leaderboard show … --json` and log which path was
  used. Never parse `display_accuracy` / `display_cost` strings. Record board
  slug + `dataset_version_ids` UUID + `updated_at` as provenance.
- [x] 2.4 `fetch artificial-analysis` → `data/benchmarks.json#artificial-analysis`.
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
- [x] 2.5 `fetch plans` → `data/plans.json`. Snapshot every vendor URL into
  `data/raw/`, extract facts with **keyword anchors that throw when the anchor
  is missing** (fail closed, keep last-good + `stale: true`), convert CNY at a
  recorded spot rate, and write `evidence.url` + `evidence.retrieved` per row.
  Monthly billing only. Aggregator-only figures go to `known_gaps`.
- [x] 2.6 `validate` — every rule in `AGENTS.md` "Invariants" that is checkable
  statically, plus: evidence ids resolve to `sources.json`; `confidence` is one
  of the four levels; `quota_model` required fields present unless
  `quota_unresolved`; `pass_at_4 >= pass_at_1`; uniqueness of ids; ranges;
  `unavailable_reason` when `available: false`; the CC BY 4.0 attribution
  string for Awesome Coding Plan is present verbatim; every benchmark row
  carries a `version`; staleness warnings when `retrieved` is > 14 days old.
  Exit non-zero with a readable error list.
- [x] 2.7 `packages/core/src/cost.ts` — port `compute.py`'s quota model exactly:
  `budget` → `quota_usd / cost_per_task`; `credits` →
  `(input + output·w) / 10_000` with the vendor's `w`; `requests` →
  `requests_month / agent_steps_per_task` (plan-level assumed fallback where the
  model is unmeasured); `tokens_total` → `tokens / tokens_per_task`. Then
  `cost_per_task = price / tasks_per_month`, plus `days_for_full_run`
  (min of monthly rate and rolling-window rate), `break_even_tasks = price /
  api_cost_per_task`, `value_multiple = quota·api_cost / price`, and
  `model_allowed` via `model_scope` (`"any"` | provider | exact model id).
  Every function pure; the clock is an argument.
- [x] 2.7b Token-allowance view (explicit requirement: "monthly allowances per
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
- [x] 2.8 `packages/core/src/normalize.ts` — per-benchmark z-score (population
  SD), weighted composite `C_m = Σ w_b·z_{m,b} / Σ w_b` with weights
  renormalized over the benchmarks a model actually has, `T_m = 50 + 10·C_m`,
  coverage gate `k >= 2`, and CI propagation from `ci_lo`/`ci_hi`. Never impute
  zero for a missing benchmark.
- [x] 2.9 `packages/core/src/pareto.ts` — `O(n log n)` sort-and-sweep skyline
  over `(cost, score)` with epsilons on both axes, co-frontier grouping for
  exact ties, `distance_to_frontier` (`Δscore` and cost ratio `ρ`). Two cost
  bases: API-list and plan-adjusted (recomputed per selected plan).
- [x] 2.10 `compute` → `data/derived.json`: pairs (model × plan where
  `model_allowed`), `best_routes` per model, cross-check ratio, composite and
  frontier inputs, and the badge states (`confidence`, `freshness`,
  `price-status`, `ci`, `match`, `coverage`). Written deterministically:
  stable key order, stable numeric rounding, so re-running produces a
  byte-identical file when inputs are unchanged.
- [x] 2.11 Unit tests (`bun test`) in `packages/core`: quota conversion per
  quota model; `model_allowed` scope rules; missing-benchmark renormalization
  and the `k >= 2` gate; Pareto membership on a known fixture including a tie
  and a dominated point; NaN/null rejection. Tests assert numbers a consumer
  observes, not wiring.
- [x] 2.12 Complete the CLI surface and document it in `--help` and
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

## Progress log

Append-only. One entry per session; name the stage, what landed, and what is
still open.

> **Relocation note (appended 2026-09-14, not a rewrite).** Every entry below is
> the progress log exactly as it stood in `PLAN.md` before this file was created;
> no entry was edited, reordered or summarised. The split itself — and everything
> logged after it — is recorded in `PLAN.md`, whose progress log now carries only
> entries written since.

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

### 2026-09-14 — Task 1.10 (lint, format, quality tooling)

**Landed**

- Four root devDependencies, exact pins (`-E`, no caret):
  `oxlint@1.82.0`, `@oxlint/plugins@1.82.0`, `oxfmt@0.67.0`, `fallow@3.25.0`.
  `bun add` reported 11 packages installed, `bun.lock` updated. `oxlint` and
  `@oxlint/plugins` are pinned as a pair because the plugin API drifts with the
  linter's minor line.
- Vendored plugin at `tools/oxlint/anti-slop/`: `index.ts`, 18 rules under
  `rules/`, 7 helpers under `shared/`, and `vendor/eslint-stylistic/` including
  its `LICENSE` and `UPSTREAM.md`. Copied with the bundle's installer;
  `UPSTREAM.md` beside the entry point records the bundle path, the unknown
  upstream identity, the installed paths, the two intentional deviations, and
  the update procedure. `effect/` was deleted: no `effect` dependency exists, so
  the Effect rule set must not be registered.
- `.oxlintrc.json`: 18 anti-slop generic rules plus native
  `oxc/no-accumulating-spread` and `typescript/no-explicit-any`, all `"error"`.
  No `plugins` key, so the default `eslint`/`typescript`/`unicorn`/`oxc` sets
  stay active — verified, not assumed, by a throwaway probe that tripped both
  native rules. `ignorePatterns` is `node_modules/**`, `dist/**`, `.astro/**`,
  `tools/oxlint/anti-slop/**`.
  - Count correction: the task text says "all 19 generic rules" and the plan's
    file list says 21 rules; the vendored entry point exports **18** generic
    rules and the committed config has **20** entries. The config JSON given in
    the task is what shipped.
- `.oxfmtrc.json`: `{ "semi": false, "ignorePatterns": ["data/**", "**/*.md",
  "tools/oxlint/anti-slop/**"] }`. `semi: false` matches the semicolon-free
  style already in `packages/core/src/{index,schema}.ts` and
  `packages/data-cli/src/main.ts`; every other setting stays at Oxfmt's default,
  so `sortPackageJson` is on and the four manifests were reordered.
- Root scripts: `check` is now
  `typecheck → lint → format:check → astro check` (the `astro check` filter step
  is unchanged); added `lint`, `lint:fix`, `format`, `format:check`, and
  `quality` (bare `fallow`, the combined dead-code + duplication + complexity
  report, human format, never called from `check` or CI).
- `bun run format` rewrote 14 files and touched exactly five tracked ones:
  the four manifests (key reordering only — a byte diff against `HEAD` shows no
  version or dependency string changed), `tsconfig.json` (`include` array joined
  onto one line), and `packages/core/src/schema.ts` (one zod chain wrapped at
  100 columns, plus blank lines between the four top-level enum consts).
- Lint findings in application source: three
  `anti-slop/require-readable-spacing` errors at `packages/core/src/schema.ts:4-6`
  (consecutive top-level `const` declarations with no blank line between them),
  fixed with `bun run lint:fix` — whitespace only, verified by diff. No rule was
  suppressed, weakened to `"warn"`, or set `"off"`, and no annotation was
  laundered to satisfy a rule. The remaining 278 hand-written lines were clean
  under all 20 rules on the first run.

**Verified**

- `bun install --frozen-lockfile` → exit 0 (lockfile matches the manifests after
  `bun add` and after Oxfmt's key sorting).
- `./node_modules/.bin/{oxlint,oxfmt,fallow} --version` → `1.82.0`, `0.67.0`,
  `3.25.0`. Fallow's platform binary resolved from `optionalDependencies`, so
  contingency A1 was not needed.
- **Plugin-load probe.** `packages/core/src/__lint-probe.ts` containing
  `export type Probe = unknown` → `bun run lint` exit 1, naming
  `anti-slop/no-unknown-type-aliases`. The probe was confirmed present on disk
  (28 bytes) while lint ran, then deleted → exit 0 and a clean
  `git status --porcelain`. This is the check that separates "plugin registered"
  from "plugin silently ignored"; the `.ts` plugin loads under the Node wrapper
  with no loader, so contingency A2 was not needed. A second, independent probe
  (`acc = [...acc, item]` in a loop plus an `any` parameter) tripped
  `oxc/no-accumulating-spread` and `typescript/no-explicit-any`, which proves the
  omitted `plugins` key kept the default `eslint`/`typescript`/`unicorn`/`oxc`
  sets active rather than disabling them.
- `bun run lint` on the clean tree → exit 0.
- `bun run format` → exit 0; `bun run format:check` → exit 0; a second
  `bun run format` left `git status --porcelain` unchanged (format stability).
- **Negative control for the format gate.** `const probeFormat={a:1}` injected
  into `packages/core/src/schema.ts` → `format:check` exit 1 with
  `Format issues found in above 1 files`; reverted → exit 0. `oxfmt --check` is a
  real gate, so contingency A3's `--list-different` fallback was not needed.
- `shasum -a 256 data/fixtures/legacy-derived.json` →
  `803cef427a6af2f32ade594518b1806a49bb21fea90cc80fc52684f10bab9ded`, matching
  the Stage 1 record, and `git status --porcelain data/` is empty — nothing under
  `data/**` was formatted.
- `bun run check` → exit 0 (all four steps ran: `tsc --build --force`, `oxlint`,
  `oxfmt --check`, `astro check` with 0 errors / 0 warnings on 2 files).
  `bun run test` → exit 0 (`--pass-with-no-tests` still absorbs the zero-test
  match).
- `bun run quality` → prints the combined report and exits 1 (findings); under
  `--format json --quiet` it exits 0. Counts from the full human report
  (461 lines): **9 dead-code issues** — 1 unused export, 7 unused dependencies,
  1 unused devDependency — **4 clone groups (81 duplicated lines, 1.9%)**,
  and **81 of 250 functions above the complexity threshold**, with 4,339 LOC
  analyzed, dead exports 0.9% (1 of 109), dead files 0.0% (0 of 33), average
  maintainability 90.2, 9 refactoring targets, and 0 churn hotspots. Every
  dead-code, duplication and complexity finding is inside the vendored plugin
  tree except the 8 dependency entries, which are `apps/site` deps whose
  consumers arrive in Stage 3+: `@astrojs/sitemap`, `@nanostores/persistent`,
  `@rack-rate/core` (imported in `packages/data-cli` but not yet in the site),
  `@resvg/resvg-js`, `echarts`, `nanostores`, `satori`, and the
  `@tailwindcss/vite` devDependency. A literal search of the report for
  `schema.ts` and `packages/core` returns nothing: fallow flags **zero** issues
  in this repo's own source, so nothing here is an intended Stage 2–5 export
  being misread as dead. That is exactly why fallow is report-only: a gate today
  would fail on intended state (Stage 3+ consumes the site deps), and the
  vendored tree is upstream rule code the repo does not own.
  - Contingency A4 did not trigger, settled from the report and not from a grep:
    `dead files 0.0% (0 of 33)` and an empty unused-files section, so
    `apps/site/src/env.d.ts` was **not** flagged and no `.fallowrc.json` was
    created. The vendored path is therefore still analyzed by fallow; adding it
    to `ignorePatterns` is left to a later stage if the noise proves distracting.
- `git status --porcelain -uall` after all of the above lists only the intended
  paths: `.oxlintrc.json`, `.oxfmtrc.json`, `package.json`, `bun.lock`,
  `AGENTS.md`, `README.md`, `PLAN.md`, `tsconfig.json`, the four manifests Oxfmt
  reordered, `packages/core/src/schema.ts`, and `tools/oxlint/anti-slop/**`. No
  `data/**`, no `.fallow/**`, and no other `.md` file.

**Still open**

Nothing in this task. Fallow stays advisory by owner decision (no gate in
`check`, no CI gate; the Stage 3.10 workflow inherits lint and format-check
through `bun run check` and needs no change). No CI workflow and no git or agent
hooks were added here.

---

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

---

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
