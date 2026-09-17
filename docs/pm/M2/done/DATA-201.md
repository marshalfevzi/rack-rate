---
id: DATA-201
title: "`fetchJson` and `fetchText` with retries and raw snapshots"
description: "`packages/data-cli/src/http.ts` gains `fetchJson`/`fetchText` with a 15 s timeout, three attempts, exponential backoff and jitter, 429 `Retry-After` handling, a `rack-rate/<version>` user agent, and reviewable raw snapshots under `data/raw/`."
status: done
milestone: M2
pre: []
kind: feature
blocked_by: null
created: 2026-09-14
completed: 2026-09-14
---

## Scope

`packages/data-cli/src/http.ts` — `fetchJson`/`fetchText` with `AbortSignal.timeout(15_000)`, 3 attempts, exponential backoff + jitter, 429 `Retry-After` honoured, `User-Agent: rack-rate/<version> (+repo url)`, raw snapshot cached under `data/raw/<source>-<YYYY-MM-DD>.json` so diffs are reviewable. Retry only network errors and 5xx; fail fast on 4xx.

## Acceptance criteria

- [x] The requirement text in `## Scope` is satisfied; the landing evidence is the stage session record in `## Session` and the stage acceptance at `docs/pm/M2/README.md`.

## Notes

Split verbatim from the frozen pre-PM stage record `docs/history/stages-1-2.md` §`Stage 2 — Data points (fetch, normalize, validate, compute)` task 2.1 by the PM history parse on 2026-09-17. The canonical id is `DATA-201`; the stage's label `2.1` is its own numbering in force at the time, not a task name. The stage's acceptance and handover contract live at `docs/pm/M2/README.md`. The task text has not been enriched or rewritten.

## Session

The stage logged this work inside its stage-level entry `### 2026-09-14 — Stage 2 (fetch, normalize, validate, compute) — tasks 2.1–2.12`; that entry is preserved verbatim in `docs/pm/M2/README.md` § Stage session log and in `docs/history/stages-1-2.md`. No per-task session entry exists.
