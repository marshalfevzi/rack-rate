---
id: DATA-203
title: "`fetch terminal-bench` → `benchmarks.json#terminal-bench`"
description: "Parse the board `4-0-0` flight data (falling back to `harbor hub leaderboard show … --json`), select the benchmark rows, and record board slug, `dataset_version_ids` and `updated_at` as provenance without ever parsing the display strings."
status: done
milestone: M2
pre: []
kind: feature
blocked_by: null
created: 2026-09-14
completed: 2026-09-14
---
## Scope

`fetch terminal-bench` → `data/benchmarks.json#terminal-bench`.
  Parse the embedded flight data for board `4-0-0` (queryKey
  `["leaderboard","terminal-bench/terminal-bench","4-0-0"]`); on parse failure
  fall back to `harbor hub leaderboard show … --json` and log which path was
  used. Never parse `display_accuracy` / `display_cost` strings. Record board
  slug + `dataset_version_ids` UUID + `updated_at` as provenance.

## Acceptance criteria

- [x] The requirement text in `## Scope` is satisfied; the landing evidence is the stage session record in `## Session` and the stage acceptance at `docs/pm/M2/README.md`.

## Notes

Split verbatim from the frozen pre-PM stage record `docs/history/stages-1-2.md` §`Stage 2 — Data points (fetch, normalize, validate, compute)` task 2.3 by the PM history parse on 2026-09-17. The canonical id is `DATA-203`; the stage's label `2.3` is its own numbering in force at the time, not a task name. The stage's acceptance and handover contract live at `docs/pm/M2/README.md`. The task text has not been enriched or rewritten.

## Session

The stage logged this work inside its stage-level entry `### 2026-09-14 — Stage 2 (fetch, normalize, validate, compute) — tasks 2.1–2.12`; that entry is preserved verbatim in `docs/pm/M2/README.md` § Stage session log and in `docs/history/stages-1-2.md`. No per-task session entry exists.
