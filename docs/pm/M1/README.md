---
id: M1
title: Initialization (PLAN stage 1)
description: "a Bun workspace that installs, typechecks, and has the contracts frozen, with no application logic yet."
status: completed
started: 2026-09-14
completed: 2026-09-14
tasks:
  - COR-101
  - COR-102
  - COR-103
  - DATA-104
  - DATA-104b
  - COR-105
  - DOC-106
  - COR-107
  - DOC-108
  - COR-109
  - PM-110
retro:
  - RETRO-2026-09-17-001
---

# Initialization (PLAN stage 1)

## Definition of done

a Bun workspace that installs, typechecks, and has the contracts
frozen, with no application logic yet.

## Stage record

### Stage 1 — Initialization

**Acceptance**

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

**Contract handed to Stage 2**

`@rack-rate/core` exports zod schemas + types; `data/*.json` conform to them;
`bun run check` / `bun test` are the gate commands.

## Stage session log

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
  0 today and reproduce those exact counts, so the golden fixture _can_ be
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

## Provenance

- Split from `docs/history/stages-1-2.md` on 2026-09-17 by the PM history parse; the frozen source file is unchanged.
- Task text, acceptance, handover contract and session records are verbatim slices. The stage's own labels (`1.1`, `3.3b`, …) are its numbering in force when it ran; each maps to the canonical id named in the task document's `## Notes`.
- `status: completed` is set by the parse once every task is recorded as done; the retro is `RETRO-2026-09-17-001`.
