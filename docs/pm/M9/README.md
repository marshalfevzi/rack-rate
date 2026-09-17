---
id: M9
title: Frontend rebuild — a world that reads, a structure that holds
description: Replace the Console Listing world with a chosen direction, rebuild the design system from that world, give every route an answer in plain words, and flatten the frontend into composed sections instead of page-local sprawl.
status: in_progress
started: 2026-09-18
completed: null
tasks:
  - UI-901
  - UI-902
  - APP-904
  - UI-903
  - UI-507
  - UI-508
  - UI-510
  - UI-511
  - UI-512
  - UI-514
  - UI-517
  - UI-515
retro: []
---

# Frontend rebuild — a world that reads, a structure that holds

## Definition of done

Every route renders in one chosen visual world with a real hierarchy — a first viewport that states what the page is for, a reading order a stranger can follow, and section boundaries that read as structure rather than as more rows. Every route opens with the answer it exists to give, in words a reader who has never seen this repository can follow, and no internal design vocabulary or field-level formula reaches the rendered document. `apps/site/src` is a component tree a new contributor can read without opening a route file: no route page carries its own table engine, its own filter row, its own sort logic or its own copy of a chart plate.

## Owner's brief

Recorded from the session of 2026-09-18 that opened this milestone.

> The current UI is fucking ugly. All context are gibberish, it doesnt give a proper insight. All frontend files are cluttered, there is no proper hierarchy and component structure. We cant continue like that. Also, there are no graphs.

> I am talking about the content. What is "Split Console"? What is "Headline Index"? In methodology, what is "budget: Committed field:quota_usd_month, tasks = quota_usd_month / api_cost_per_task_usd"? Those are meaningless. When the user read, it should understand quickly.

Two of the four complaints are defects the evidence already supports rather than matters of taste. No chart draws at all: `apps/site/src/lib/charts/theme.ts` still reads the four colour tokens `UI-501` deleted, so every chart mount throws before it reaches the renderer and every chart plate prints `The chart could not be drawn; the static description remains available.`. And `apps/site/src/pages/compare.astro` is 711 lines carrying its own table engine, its own sort logic and its own payload assembly, while the same table, filter row and chart-plate markup is repeated across five more routes and four section components. The other two complaints — the visual world itself, and the vocabulary that reached the page — are direction, and this milestone is where they are decided rather than patched.

## Boundaries

- **No data work.** `data/**`, `packages/core` and `packages/data-cli` are untouched. Every formula, benchmark denominator and published figure keeps its current definition, and `data/derived.json` keeps its committed hash unless a task in another milestone changes it deliberately.
- **No route identity change.** The eleven routes keep their paths, their slugs and their meanings, and every internal link keeps going through `href()`.
- **`DESIGN.md` is the only owner of token values.** It is replaced by `UI-901`, never amended by a route, and no page-local override is a substitute for a change to it.
- **Evidence comes from a built preview** (`bun run build` then `bun run preview`), never `astro dev`.
- **Plain language is a contract, not a style preference.** The vocabulary list in `UI-903` is closed: a word on it must not appear in rendered output on any route.

## Task order

`UI-901` chooses the world, and nothing downstream is written before it lands, because every later task re-derives from its decisions. `UI-902` turns that world into tokens, type, rhythm, primitives and chart grammar. `APP-904` and `UI-903` then rebuild the structure and the words against that system. The route tasks moved here from M5 — `UI-507`, `UI-508`, `UI-510`, `UI-511`, `UI-512` — rebuild the five listing and chart routes once, on the new system, rather than converting them into the world that was rejected. `UI-514` walks the rebuilt surface, `UI-517` adds the shareable card, and `UI-515` re-derives the design record from what actually shipped.

## Why the M5 route conversions live here

`M5` was building the Console Listing world: the monochrome, square, one-signal grammar that `DESIGN.md` locks. The owner's direction of 2026-09-18 reopens that world, so the seven remaining route-conversion tasks would have composed five routes into a visual system that is being replaced and then been re-composed a second time here. They moved with their dependants instead. `M5` keeps only the two items whose defect outlives the world it was found in — `UI-509` (charts do not draw) and `UI-513` (`/method` prints field-level formulas at the reader) — plus `APP-516`, which changes the card renderer and no visual world.

## Acceptance

`bun run check`, `bun test`, `bun run build` and `bun run data:check` all exit 0. Beyond that: every route renders in the chosen world at 1440px, 768px and 360px, in both schemes, with no horizontal scroll at 360px; every route's first viewport states the page's purpose and its answer; no term from the closed vocabulary list appears in any rendered route; each of the six charts draws a real plot from committed data with its basis, confidence, source and retrieval date; and no route file under `apps/site/src/pages/**` carries a table engine, a sort implementation, a filter row or a chart-plate markup block of its own.
