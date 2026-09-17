---
id: DATA-205
title: "`fetch plans` → `data/plans.json`"
description: "Snapshot every vendor URL into `data/raw/`, extract facts with keyword anchors that throw when missing, convert CNY at a recorded spot rate, and write `data/plans.json` with evidence URLs and retrieved dates."
status: done
milestone: M2
pre: []
kind: feature
blocked_by: null
created: 2026-09-14
completed: 2026-09-14
---
## Scope

`fetch plans` → `data/plans.json`. Snapshot every vendor URL into
  `data/raw/`, extract facts with **keyword anchors that throw when the anchor
  is missing** (fail closed, keep last-good + `stale: true`), convert CNY at a
  recorded spot rate, and write `evidence.url` + `evidence.retrieved` per row.
  Monthly billing only. Aggregator-only figures go to `known_gaps`.

## Acceptance criteria

- [x] The requirement text in `## Scope` is satisfied; the landing evidence is the stage session record in `## Session` and the stage acceptance at `docs/pm/M2/README.md`.

## Notes

Split verbatim from the frozen pre-PM stage record `docs/history/stages-1-2.md` §`Stage 2 — Data points (fetch, normalize, validate, compute)` task 2.5 by the PM history parse on 2026-09-17. The canonical id is `DATA-205`; the stage's label `2.5` is its own numbering in force at the time, not a task name. The stage's acceptance and handover contract live at `docs/pm/M2/README.md`. The task text has not been enriched or rewritten.

## Session

The stage logged this work inside its stage-level entry `### 2026-09-14 — Stage 2 (fetch, normalize, validate, compute) — tasks 2.1–2.12`; that entry is preserved verbatim in `docs/pm/M2/README.md` § Stage session log and in `docs/history/stages-1-2.md`. No per-task session entry exists.
