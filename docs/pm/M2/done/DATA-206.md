---
id: DATA-206
title: "`validate` — the static invariants and citations"
description: "Implement the `validate` command checking every statically checkable invariant plus citation resolution, confidence levels, quota fields, `pass_at_4 >= pass_at_1`, id uniqueness, ranges, the attribution string and staleness, exiting non-zero with a readable error list."
status: done
milestone: M2
pre: []
kind: feature
blocked_by: null
created: 2026-09-14
completed: 2026-09-14
---
## Scope

`validate` — every rule in `AGENTS.md` "Invariants" that is checkable
  statically, plus: evidence ids resolve to `sources.json`; `confidence` is one
  of the four levels; `quota_model` required fields present unless
  `quota_unresolved`; `pass_at_4 >= pass_at_1`; uniqueness of ids; ranges;
  `unavailable_reason` when `available: false`; the CC BY 4.0 attribution
  string for Awesome Coding Plan is present verbatim; every benchmark row
  carries a `version`; staleness warnings when `retrieved` is > 14 days old.
  Exit non-zero with a readable error list.

## Acceptance criteria

- [x] The requirement text in `## Scope` is satisfied; the landing evidence is the stage session record in `## Session` and the stage acceptance at `docs/pm/M2/README.md`.

## Notes

Split verbatim from the frozen pre-PM stage record `docs/history/stages-1-2.md` §`Stage 2 — Data points (fetch, normalize, validate, compute)` task 2.6 by the PM history parse on 2026-09-17. The canonical id is `DATA-206`; the stage's label `2.6` is its own numbering in force at the time, not a task name. The stage's acceptance and handover contract live at `docs/pm/M2/README.md`. The task text has not been enriched or rewritten.

## Session

The stage logged this work inside its stage-level entry `### 2026-09-14 — Stage 2 (fetch, normalize, validate, compute) — tasks 2.1–2.12`; that entry is preserved verbatim in `docs/pm/M2/README.md` § Stage session log and in `docs/history/stages-1-2.md`. No per-task session entry exists.
