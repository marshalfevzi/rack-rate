---
id: DATA-204
title: "`fetch artificial-analysis`, gated off by default"
description: "Add the Artificial Analysis fetcher, gated off unless `AA_API_KEY` is set and `AA_PUBLISH=1`, paginating the free models endpoint and aborting when `intelligence_index_version` changes mid-pagination."
status: done
milestone: M2
pre: []
kind: feature
blocked_by: null
created: 2026-09-14
completed: 2026-09-14
---
## Scope

`fetch artificial-analysis` → `data/benchmarks.json#artificial-analysis`.
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

## Acceptance criteria

- [x] The requirement text in `## Scope` is satisfied; the landing evidence is the stage session record in `## Session` and the stage acceptance at `docs/pm/M2/README.md`.

## Notes

Split verbatim from the frozen pre-PM stage record `docs/history/stages-1-2.md` §`Stage 2 — Data points (fetch, normalize, validate, compute)` task 2.4 by the PM history parse on 2026-09-17. The canonical id is `DATA-204`; the stage's label `2.4` is its own numbering in force at the time, not a task name. The stage's acceptance and handover contract live at `docs/pm/M2/README.md`. The task text has not been enriched or rewritten.

## Session

The stage logged this work inside its stage-level entry `### 2026-09-14 — Stage 2 (fetch, normalize, validate, compute) — tasks 2.1–2.12`; that entry is preserved verbatim in `docs/pm/M2/README.md` § Stage session log and in `docs/history/stages-1-2.md`. No per-task session entry exists.
