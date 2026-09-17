---
id: DATA-104b
title: Freeze the legacy pipeline output as a golden fixture
description: "Freeze the legacy pipeline output as data/fixtures/legacy-derived.json and .csv, committed with a provenance header recording the producing commands and the input file hashes, before the pipeline is deleted."
status: done
milestone: M1
pre: []
kind: chore
blocked_by: null
created: 2026-09-14
completed: 2026-09-14
---
## Scope

**Freeze the legacy pipeline's output as a golden fixture before
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

## Acceptance criteria

- [x] The requirement text in `## Scope` is satisfied; the landing evidence is the stage session record in `## Session` and the stage acceptance at `docs/pm/M1/README.md`.

## Notes

Split verbatim from the frozen pre-PM stage record `docs/history/stages-1-2.md` §`Stage 1 — Initialization` task 1.4b by the PM history parse on 2026-09-17. The canonical id is `DATA-104b`; the stage's label `1.4b` is its own numbering in force at the time, not a task name. The stage's acceptance and handover contract live at `docs/pm/M1/README.md`. The task text has not been enriched or rewritten.

## Session

The stage logged this work inside its stage-level entry `### 2026-09-14 — Stage 1 executed (initialization complete)`; that entry is preserved verbatim in `docs/pm/M1/README.md` § Stage session log and in `docs/history/stages-1-2.md`. No per-task session entry exists.
