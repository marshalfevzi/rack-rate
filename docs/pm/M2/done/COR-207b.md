---
id: COR-207b
title: The token-allowance view
description: "Derive the token-allowance view from the plan quota and measured per-task tokens: `tokens_per_month_allowance`, `allowance_per_million_tokens` and `adjusted_api_cost_per_million` at a stated blend, recording the blend on the output row."
status: done
milestone: M2
pre: []
kind: feature
blocked_by: null
created: 2026-09-14
completed: 2026-09-14
---

## Scope

Token-allowance view (explicit requirement: "monthly allowances per
million token and adjusted API cost"). From the plan's quota in tokens and the
model's measured `input_tokens_per_task` + `output_tokens_per_task`, derive:
`tokens_per_month_allowance` = quota expressed in tokens for the selected
model; `allowance_per_million_tokens` = the plan's blended cost per 1M tokens
at a **stated** input:output blend (default 3:1, the blend rule shown on the
page next to the figure); `adjusted_api_cost_per_million` = the model's list
rate blended the same way, divided by the plan's value multiple, so "what am I
actually paying per million" is directly comparable across plans. Record the
blend assumption as a field on the output row, never as an implicit constant,
and note the cache-tier caveat: cached reads price far below list, so a blend
that ignores cache tiers misprices cache-heavy models (DeepSWE medians show
10–40:1 input:output ratios).

## Acceptance criteria

- [x] The requirement text in `## Scope` is satisfied; the landing evidence is the stage session record in `## Session` and the stage acceptance at `docs/pm/M2/README.md`.

## Notes

Split verbatim from the frozen pre-PM stage record `docs/history/stages-1-2.md` §`Stage 2 — Data points (fetch, normalize, validate, compute)` task 2.7b by the PM history parse on 2026-09-17. The canonical id is `COR-207b`; the stage's label `2.7b` is its own numbering in force at the time, not a task name. The stage's acceptance and handover contract live at `docs/pm/M2/README.md`. The task text has not been enriched or rewritten.

## Session

The stage logged this work inside its stage-level entry `### 2026-09-14 — Stage 2 (fetch, normalize, validate, compute) — tasks 2.1–2.12`; that entry is preserved verbatim in `docs/pm/M2/README.md` § Stage session log and in `docs/history/stages-1-2.md`. No per-task session entry exists.
