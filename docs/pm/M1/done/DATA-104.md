---
id: DATA-104
title: Migrate `data/*.json` to the new schema
description: "Migrate the existing data/models.json (28 models), plans.json (16 plans) and sources.json (9 records) to the new schema and add the benchmarks.json skeleton with one deepswe entry carrying version, generated_at and task_count."
status: done
milestone: M1
pre: []
kind: chore
blocked_by: null
created: 2026-09-14
completed: 2026-09-14
---

## Scope

`data/*.json` migrated to the new schema: existing `models.json` (28 models), `plans.json` (16 plans), `sources.json` (9 records) stay as the seed; add `benchmarks.json` skeleton with one `deepswe` entry carrying `version`, `generated_at`, `task_count`.

## Acceptance criteria

- [x] The requirement text in `## Scope` is satisfied; the landing evidence is the stage session record in `## Session` and the stage acceptance at `docs/pm/M1/README.md`.

## Notes

Split verbatim from the frozen pre-PM stage record `docs/history/stages-1-2.md` §`Stage 1 — Initialization` task 1.4 by the PM history parse on 2026-09-17. The canonical id is `DATA-104`; the stage's label `1.4` is its own numbering in force at the time, not a task name. The stage's acceptance and handover contract live at `docs/pm/M1/README.md`. The task text has not been enriched or rewritten.

## Session

The stage logged this work inside its stage-level entry `### 2026-09-14 — Stage 1 executed (initialization complete)`; that entry is preserved verbatim in `docs/pm/M1/README.md` § Stage session log and in `docs/history/stages-1-2.md`. No per-task session entry exists.
