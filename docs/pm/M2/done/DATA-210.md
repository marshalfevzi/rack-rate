---
id: DATA-210
title: "`compute` → `data/derived.json`"
description: "Implement `compute` producing `data/derived.json` with pairs, `best_routes`, cross-check ratio, composite and frontier inputs and badge states, written deterministically so re-running is byte-identical."
status: done
milestone: M2
pre: []
kind: feature
blocked_by: null
created: 2026-09-14
completed: 2026-09-14
---

## Scope

`compute` → `data/derived.json`: pairs (model × plan where
`model_allowed`), `best_routes` per model, cross-check ratio, composite and
frontier inputs, and the badge states (`confidence`, `freshness`,
`price-status`, `ci`, `match`, `coverage`). Written deterministically:
stable key order, stable numeric rounding, so re-running produces a
byte-identical file when inputs are unchanged.

## Acceptance criteria

- [x] The requirement text in `## Scope` is satisfied; the landing evidence is the stage session record in `## Session` and the stage acceptance at `docs/pm/M2/README.md`.

## Notes

Split verbatim from the frozen pre-PM stage record `docs/history/stages-1-2.md` §`Stage 2 — Data points (fetch, normalize, validate, compute)` task 2.10 by the PM history parse on 2026-09-17. The canonical id is `DATA-210`; the stage's label `2.10` is its own numbering in force at the time, not a task name. The stage's acceptance and handover contract live at `docs/pm/M2/README.md`. The task text has not been enriched or rewritten.

## Session

The stage logged this work inside its stage-level entry `### 2026-09-14 — Stage 2 (fetch, normalize, validate, compute) — tasks 2.1–2.12`; that entry is preserved verbatim in `docs/pm/M2/README.md` § Stage session log and in `docs/history/stages-1-2.md`. No per-task session entry exists.
