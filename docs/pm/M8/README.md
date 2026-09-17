---
id: M8
title: Data integrity follow-ups (PLAN stage 8)
description: close the recorded gaps that no stage owned, without touching `packages/core`, the schemas, or any published formula. This stage adds no route, no token and no page.
status: backlog
started: null
completed: null
tasks:
  - DATA-801
  - DATA-802
retro: []
---

# Data integrity follow-ups (PLAN stage 8)

## Definition of done

close the recorded gaps that no stage owned, without touching
`packages/core`, the schemas, or any published formula. This stage adds no
route, no token and no page.

## Stage record

## Stage 8 — Data integrity follow-ups

**Goal:**

> **Scheduling note.** Stage 8 is off the critical path: it is the right place for
> a session that cannot start a Stage 5 task, and it adds no route, token or page.
> Three ordering rules, and the first two are load-bearing.
>
> 1. **8.1 and 8.2 must not run while Stage 5 is open.** Both re-run `compute`
>    and therefore change `data/derived.json`, and Stage 5's boundary and
>    acceptance text pin its hash (`7425a331…`) as the proof that the redesign
>    moved no published number. Landing either task mid-stage falsifies that
>    evidence. Run them before Stage 5 is started, or after it is accepted.
> 2. **When either lands, re-record the hash.** The new `data/derived.json` hash
>    goes into this file _and_ into Stage 5's acceptance text in the same commit,
>    so the next session's "no published number moved" claim starts from a
>    current pin rather than a stale one.
> 3. **Never leave `data/*.json` half-refreshed.** A task here runs `validate`,
>    `compute` and `data:check` before it stops.
