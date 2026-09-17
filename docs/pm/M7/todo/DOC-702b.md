---
id: DOC-702b
title: Artificial Analysis publication decision, made explicitly here rather
description: "Artificial Analysis publication decision, made explicitly here rather than by default. Three defensible states, in ascending exposure; record which one ships and why: 1. AA_PUBLISH=0 (default, current). No AA values anywhere; the So..."
status: todo
milestone: M7
pre: []
kind: docs
blocked_by: null
created: 2026-09-17
completed: null
---

## Scope

Artificial Analysis publication decision, made explicitly here rather than by default. Three defensible states, in ascending exposure; record which one ships and why:

1. **`AA_PUBLISH=0` (default, current).** No AA values anywhere; the Sources page says AA data is not published here and links to Artificial Analysis. Zero risk, no AA axis.
2. **Chart-only** — the best-supported published variant. The AA index appears as its own labelled axis carrying the **AA logo visible on the chart** and a hyperlink, per Terms §5.1's chart row and §2.3(b) ("share charts and visualizations publicly, subject to the attribution requirements"). **No AA value enters `data/*.json`, any export, any table, or any CSV**, so nothing is reproduced in the "structured, tabular, or machine-readable format" that §2.3(c) rules out. §2.4(c)'s "dashboard" language is the residual objection; this state is an inference from the text, not cleared permission.
3. **`AA_PUBLISH=1` with AA values in the data files** — the state the owner accepted on 2026-09-14. Highest exposure: §2.4(b)/(c) bulk machine-readable export and embedding, §2.5(a) Competitive Product. `real-api-pricing` does this publicly, which calibrates the practical risk but grants nothing.

Whatever ships, the deployed Sources page must state which state the build is in, so a reader can tell whether AA data is present because it was cleared or because a key happened to be configured. Keep 2 and 3 separable in the implementation: the chart-only variant must be reachable by configuration, not by a refactor. **The decision and its reasoning are recorded in `CAVEATS.md` §1.6**, which is the reader-facing statement of the position.

## Acceptance criteria

- [ ] The requirement text in `## Scope` is satisfied and verified; stage acceptance: `docs/pm/M7/README.md`.

## Notes

Migrated verbatim from the pre-PM `PLAN.md` (deleted after the migration; recover with `git show d95e6ef:PLAN.md`) stage 7 task 7.2b by the PM init on 2026-09-17; the stage's boundaries and acceptance live in `docs/pm/M7/README.md`. The task has not been enriched or rewritten.
