---
id: DATA-202
title: "`fetch deepswe` → `data/models.json`"
description: "Fetch the DeepSWE leaderboard from the live `artifacts/v1.1` artifact with a `v1` fallback, reduce one row per `(model, harness, effort)` to one model row at the highest-scoring effort, and write `data/models.json` with medians, provider mapping and CI fields."
status: done
milestone: M2
pre: []
kind: feature
blocked_by: null
created: 2026-09-14
completed: 2026-09-14
---

## Scope

`fetch deepswe` → `data/models.json`. Live artifact
`artifacts/v1.1/leaderboard-live.json`, fallback `v1`. Reduce one row per
`(model, harness, effort)` to one model row at the highest-scoring effort,
keeping `effort_variants`. Map `provider` from an explicit hand map
(the field is absent upstream on ~65/70 rows); unmapped → `null`, never a
guessed vendor. Use medians, not means. Carry `ci_lo`/`ci_hi`/`ci_method`,
`generated_at`, `n_tasks_in_set`.

## Acceptance criteria

- [x] The requirement text in `## Scope` is satisfied; the landing evidence is the stage session record in `## Session` and the stage acceptance at `docs/pm/M2/README.md`.

## Notes

Split verbatim from the frozen pre-PM stage record `docs/history/stages-1-2.md` §`Stage 2 — Data points (fetch, normalize, validate, compute)` task 2.2 by the PM history parse on 2026-09-17. The canonical id is `DATA-202`; the stage's label `2.2` is its own numbering in force at the time, not a task name. The stage's acceptance and handover contract live at `docs/pm/M2/README.md`. The task text has not been enriched or rewritten.

## Session

The stage logged this work inside its stage-level entry `### 2026-09-14 — Stage 2 (fetch, normalize, validate, compute) — tasks 2.1–2.12`; that entry is preserved verbatim in `docs/pm/M2/README.md` § Stage session log and in `docs/history/stages-1-2.md`. No per-task session entry exists.
