---
id: M2
title: Provider selection wizard (PLAN stage 6)
description: "'which plan should *I* buy' becomes a guided flow, and the answers persist offline."
status: backlog
started: null
completed: null
tasks:
  - APP-601
  - APP-602
  - APP-603
  - APP-604
  - APP-605
  - APP-606
retro: []
---
# Provider selection wizard (PLAN stage 6)

## Definition of done

"which plan should *I* buy" becomes a guided flow, and the answers
persist offline.

## Stage record

## Stage 6 — Provider selection wizard

**Goal:** 

> **Reading these tasks.** Stage 6 tasks are written as requirements, not in the
> Files / Work / Done-when form Stage 5 uses. A session that opens one restates
> it in that form — naming the exact files and the observable done state — before
> writing code, and verifies every symbol it names.

### Contract from Stage 5

The wizard is behaviour added inside a finished shell. Every surface it touches
already has its lane, its listing primitives, its set-aside rail, its cursor
readout and its state glyphs; task 6.1 supplies the store the glyphs consume.
Stage 6 adds no token, hue, radius or duration, and restyles nothing the redesign
shipped.

### Acceptance

The wizard flow is **provider → plan → model**: picking a vendor narrows the plan
list, and every plan and model shown is filtered by `model_scope`, so a plan can
never recommend a model its vendor does not actually serve. The final step
outputs a ranked recommendation with `cost_per_task`, break-even tasks, value
multiple, days-for-full-run, and the models that plan unlocks. Refresh keeps every
preference. A shared wizard URL reproduces the same recommendation on a different
browser profile. A corrupted `localStorage` payload (throwaway test in the browser
console) leaves the site usable. Ignoring a model updates every page that
referenced it. The whole flow is keyboard-traversable and usable at 360 px width —
verified by hand, not assumed.
