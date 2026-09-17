---
id: DATA-801
title: Refresh the eight plan rows that fail the anchor check
description: "Refresh the eight plan rows that fail the anchor check. Files: packages/data-cli/src/commands/fetch-plans.ts, data/plans.json, data/sources.json, ARCHITECTURE.md. Why: data/plans.json is still at its Stage 1 revision. Measured 2..."
status: todo
milestone: M8
pre: []
kind: fix
blocked_by: null
created: 2026-09-17
completed: null
---

## Scope

**Refresh the eight plan rows that fail the anchor check.**
**Files:** `packages/data-cli/src/commands/fetch-plans.ts`, `data/plans.json`,
`data/sources.json`, `ARCHITECTURE.md`.
**Why:** `data/plans.json` is still at its Stage 1 revision. Measured
2026-09-17 with `bun run fetch:plans --diff`, **eight of the sixteen plan rows
fail the anchor check**, so `fetch plans` fails closed and writes nothing:
`claude-pro`, `claude-max-5x`, `claude-max-20x`, `chatgpt-pro-20x`,
`kimi-code-andante`, `kimi-code-allegretto`, `glm-coding-lite` and
`glm-coding-pro`. The eight that verify are `chatgpt-plus`, `cursor-pro`,
`cursor-pro-plus`, `cursor-ultra`, `opencode-go`, `ollama-pro`,
`github-copilot-pro` and `google-ai-pro`. Model rows were refreshed in Stage 2;
plan prices and quotas were not, so every plan-route figure — Claude Pro's
included, which `/plans` ranks — is computed from a Stage 1 price.
**Work:** add a rendered-page acquisition path for those eight URLs. The
`harbor`-CLI fallback in `fetch-terminal-bench` is the precedent: resolve the
binary from an environment variable, then `PATH`, and fail closed naming both
when neither resolves. Keyword anchors keep throwing when the anchor text is
missing, and each row records which acquisition path produced it. Where a
vendor page still yields no quoted limit, the row keeps `quota_unresolved` and
gains a `known_gaps` entry — never an invented number.
**Done when** `bun run fetch:plans --diff` exits 0 with every plan row either
verified or explicitly unresolved, every changed row carries a bumped
`retrieved_at`, and `bun run validate && bun run compute && bun run data:check`
exits 0 with the new `data/derived.json` hash recorded in this file and, if
Stage 5 has already landed, in that stage's acceptance text.

## Acceptance criteria

- [ ] Every clause of the task's **Done when** in `## Scope` holds, verified from a built preview (`bun run build` then `bun run preview`); stage acceptance: `docs/pm/M8/README.md`.

## Notes

Migrated verbatim from the pre-PM `PLAN.md` (deleted after the migration; recover with `git show d95e6ef:PLAN.md`) stage 8 task 8.1 by the PM init on 2026-09-17; the stage's boundaries and acceptance live in `docs/pm/M8/README.md`. The task has not been enriched or rewritten.
