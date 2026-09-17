---
id: DATA-212
title: "The `rack-rate-data` CLI surface"
description: "Complete the `rack-rate-data <command>` dispatcher with `fetch`, `validate`, `compute`, `check`, `sources` and `doctor`, including `fetch <source> --diff`, and document it in `--help` and `docs/architecture.md`."
status: done
milestone: M2
pre: []
kind: feature
blocked_by: null
created: 2026-09-14
completed: 2026-09-14
---

## Scope

Complete the CLI surface and document it in `--help` and
`docs/architecture.md`. The dispatcher `rack-rate-data <command>` must expose
at minimum: `fetch <source|all>` (gather), `fetch <source> --diff` (print
what moved upstream without writing — ported from the old
`fetch_deepswe.py --diff`), `validate` (schema, citations, versions,
staleness), `compute` (derive), `check` (validate + compute + verify the
committed `derived.json` is not stale — the CI gate), `sources` (list every
source with its license, attribution requirement and retrieval age), and
`doctor` (which sources are reachable, which env vars are set, whether
`AA_PUBLISH` is on, whether `data/raw` snapshots exist). Every command exits
non-zero on failure and prints a readable reason; no command silently writes a
guessed number.

## Acceptance criteria

- [x] The requirement text in `## Scope` is satisfied; the landing evidence is the stage session record in `## Session` and the stage acceptance at `docs/pm/M2/README.md`.

## Notes

Split verbatim from the frozen pre-PM stage record `docs/history/stages-1-2.md` §`Stage 2 — Data points (fetch, normalize, validate, compute)` task 2.12 by the PM history parse on 2026-09-17. The canonical id is `DATA-212`; the stage's label `2.12` is its own numbering in force at the time, not a task name. The stage's acceptance and handover contract live at `docs/pm/M2/README.md`. The task text has not been enriched or rewritten.

## Session

The stage logged this work inside its stage-level entry `### 2026-09-14 — Stage 2 (fetch, normalize, validate, compute) — tasks 2.1–2.12`; that entry is preserved verbatim in `docs/pm/M2/README.md` § Stage session log and in `docs/history/stages-1-2.md`. No per-task session entry exists.
