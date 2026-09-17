---
id: DATA-802
title: Resolve the two committed evidence URLs that return 404
description: "8.2 Resolve the two committed evidence URLs that return 404. Files: data/sources.json, packages/data-cli/src/commands/fetch-plans.ts, ARCHITECTURE.md. May land in the same session as 8.1; they touch the same two files. Why: bun run..."
status: todo
milestone: M4
pre: []
kind: fix
blocked_by: null
created: 2026-09-17
completed: null
---
## Scope

8.2 **Resolve the two committed evidence URLs that return 404.**
  **Files:** `data/sources.json`, `packages/data-cli/src/commands/fetch-plans.ts`,
  `ARCHITECTURE.md`. May land in the same session as 8.1; they touch the
  same two files.
  **Why:** `bun run doctor` reports `https://openai.com/chatgpt/pricing/`
  (`data/sources.json`, the ChatGPT Pro price) and
  `https://support.google.com/googleone/answer/16287445` (the `google-ai-pro`
  anchor in the plans fetcher) as 404. Both are cited facts, and invariant 8
  makes a citation load-bearing.
  **Work:** find live replacements for the *same* fact and update
  `data/sources.json` and the fetcher anchor together, bumping `retrieved` and
  re-running `compute`. Where no live replacement states the fact, drop the
  claim and record it in `known_gaps` — a citation is never pointed at a page
  that no longer carries it, and no number is hand-edited.
  **Done when** `bun run doctor` reports no 404 among committed evidence URLs,
  `bun run validate` exits 0, `bun run data:check` exits 0, and no published
  figure changed without its `retrieved` date moving.

## Acceptance criteria

- [ ] Every clause of the task's **Done when** in `## Scope` holds, verified from a built preview (`bun run build` then `bun run preview`); stage acceptance: `docs/pm/M4/README.md`.

## Notes

Migrated verbatim from the pre-PM `PLAN.md` (deleted after the migration; recover with `git show d95e6ef:PLAN.md`) stage 8 task 8.2 by the PM init on 2026-09-17; the stage's boundaries and acceptance live in `docs/pm/M4/README.md`. The task has not been enriched or rewritten.
