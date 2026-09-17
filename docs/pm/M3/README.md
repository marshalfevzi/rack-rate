---
id: M3
title: GitHub Pages deployment (PLAN stage 7)
description: the site publishes itself from `main`, and the data refresh path is documented for contributors.
status: backlog
started: null
completed: null
tasks:
  - APP-701
  - DOC-702
  - DOC-702b
  - APP-703
  - APP-704
  - DOC-705
  - DOC-706
  - DOC-707
retro: []
---
# GitHub Pages deployment (PLAN stage 7)

## Definition of done

the site publishes itself from `main`, and the data refresh path is
documented for contributors.

## Stage record

## Stage 7 — GitHub Pages deployment

**Goal:** 

> **Reading these tasks.** Stage 7 tasks are written as requirements, not in the
> Files / Work / Done-when form Stage 5 uses. A session that opens one restates
> it in that form before writing anything, and verifies every path it names.

### Acceptance

Pushing to `main` deploys without manual steps; the published site matches a
local `bun run build`; the scheduled refresh opens a reviewable PR rather than
mutating the live site; a clean clone reproduces the build with no secrets.
