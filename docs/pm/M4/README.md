---
id: M4
title: Frontend build (PLAN stage 4)
description: "the insight surface. Every chart type from the research pass exists, driven by `@rack-rate/core` output, mobile-first."
status: completed
started: 2026-09-14
completed: 2026-09-14
tasks:
  - APP-401
  - APP-402
  - APP-403
  - APP-404
  - APP-405
  - APP-406
  - APP-407
  - APP-408
  - APP-409
  - APP-410
  - APP-411
  - APP-412
  - APP-413
  - APP-414
  - APP-415
retro:
  - RETRO-2026-09-17-004
---

# Frontend build (PLAN stage 4)

## Definition of done

the insight surface. Every chart type from the research pass exists,
driven by `@rack-rate/core` output, mobile-first.

## Stage record

### Stage 4 — Frontend build (charts and insight pages)

**Acceptance**

Every route renders real data from `data/derived.json` with no client-side
data fetching. Pareto frontier matches `@rack-rate/core` output on a fixture
checked by eye. Keyboard-only traversal of `/models` and the Pareto chart
works. Verified on a real browser at 360 px and at desktop width.

## Stage session log

### 2026-09-14 — Stage 4.4–4.15: the remaining charts, the insight pages, the mobile pass

**Landed**

- Four chart slices. `heatmap.ts` (diverging `visualMap` centred on 0,
  hatched decal cells for `not evaluated`), `slope.ts` (API list against plan
  route for one model, one line per candidate plan), `waterfall.ts` (quota →
  used → remaining under a utilization input, deficit below zero), `radar.ts`
  (per-index z over the models a selected plan admits) — each with its payload
  module and its `components/*Section.astro`.
- Five page slices. `/models` (28-row table, sortable headers with
  `aria-sort`, name/vendor/score-floor filters that hide rather than remove),
  `/models/[slug]` (score profile, effort ladder, priced routes, provenance
  rail), `/plans` + `/plans/[slug]` (ranked by value multiple, the models a
  plan unlocks), `/compare` (2–4 models, tie ranges, URL round-trip), `/`
  (hero, the ported budget calculator, insights, entry points).
- `/explore` gained the metric builder: y metric (any benchmark score,
  composite `T`, tokens, steps), x metric (API list $/task, plan-adjusted
  $/task, tokens, steps, benchmark score), chart type, vendor/effort/score-floor
  filters, log-axis and frontier toggles, and composite weight sliders with
  presets recomputing `T` client-side from shipped z-scores.
- 4.14: every route carries at least one sentence computed from the committed
  documents (e.g. `/plans`: "16 committed plans ranked by value multiple; 15
  have a committed multiple, led by Claude Max 20x at 127.36×").
- 4.15: measured, not asserted. Ten routes at 360 px report
  `scrollTo(9999, 0) → 0`; every interactive element on the seven content
  routes has an accessible name, with 28 CI bars and 7 chart hosts carrying
  `role="img"`; `Enter` on a `/models` header button sets `aria-sort`;
  `Space` on the Pareto "Plan route" radio re-renders and rewrites the chart's
  accessible name. Header nav links were 16 px tall and are now 27 px.

**Review caught, in this session**

- The calculator resolved a plan's model only from `measured_against_model`
  and printed "No priced route" for 13 of the 16 plans that have one — it
  computed 2 plans where the burn-down chart computed 15. Both surfaces now call
  `waterfall-payload.ts`, the difference is one sentence of committed data for
  `google-ai-pro`, and the column is renamed **Model priced** because the
  cheapest-route fallback makes "measured model" a false claim.
- `Badge.astro` was not a containing block for its `sr-only` children, so 28
  badges in `/models` laid their accessible text out at x = 735 inside the
  overwide table: `documentElement.scrollWidth` was 736 at a 360 px viewport
  and the page really scrolled 376 px into blank space — on `/models`,
  `/models/[slug]`, `/plans`, `/plans/[slug]` and `/compare`. One
  `relative` in the badge's class list ends it. The same class of bug put a
  493 px `<select>` on the explore surface: a select cannot shrink below its
  widest option without `min-w-0`.
- The heatmap's legend and `visualMap` shared the canvas bottom, so both series
  names sat on the colour bar, and the grid's 16 spacing units put the x-axis
  labels in the bar's band. `gridBottom: 76` plus a right-corner legend
  separates the bottom into the label band (488–498), the axis name (518–527)
  and the bar with its legend (535–560) on a 576 px canvas.
- The slice batch landed with 29 anti-slop findings across 9 files, three
  `astro check` errors and one unused import, all cleared; `oxfmt` then
  reflowed three blank lines the lint fix had added, so the two pass over the
  union until both are clean.
- Composite parity was checked rather than assumed: the payload's z-scores at
  the committed weights reproduce every committed `composite` for the 12
  models with `k ≥ 2` to within 0.001, and the 16 below the gate render
  `single-source` with no `T`.

**Verified**

- `bun run check` green end to end: `tsc --build --force`, `oxlint` clean,
  `oxfmt --check` clean, `astro check` 0 errors / 0 warnings / 0 hints over 63
  files. `bun test` 138 pass / 0 fail. `bun run data:check` reports the
  committed `derived.json` current. `bun run build` emits 53 pages plus
  `og.png`.
- In a real browser: seven chart hosts mount and paint (992×416 to 992×576); the
  browser requests no `.json` path on any route; the calculator recomputes
  $2,452.4 → $6,158.45 for Claude Pro at 600 tasks/month
  (`20 + (600 − 103.1) × 12.3535`); `/compare` enforces the 2–4 bound with
  its `aria-live` text matching both ends and clears the query below the
  minimum.
- Reduced motion: all seven charts paint under
  `prefers-reduced-motion: reduce` (225,946 px in the Pareto canvas up to
  251,504 px in the builder), and flipping the media feature back to
  `no-preference` mid-session re-applies every option through `mount.ts`'s
  `change` listener without losing a chart.
- Degenerate inputs degrade to the default four rather than breaking:
  `?models=not-a-model,nope`, five ids, a duplicated id, and a single id each
  render the default selection in 6 columns / 13 rows with the status text
  matching, and the page rewrites the query from the resolved selection.
- `/models` sorts numerically, not lexicographically over formatted text: the
  comparator parses `data-score` with `Number.parseFloat` and falls back to
  `localeCompare` only for non-numeric columns, and the 28 rendered scores run
  monotone 11.73 → 74.12 ascending, reverse, then ascending again.
- The routes checked only for overflow were spot-checked for content:
  `/models/gpt-6-astra` renders its own headline's 7 priced routes,
  `/plans` renders 16 rows for 16 committed plans, `/plans/claude-pro` renders
  the 5 admitted models, and every cost cell carries its basis chip. Zero
  console errors across the routes visited.

**Still open**

- Touch targets: header nav is 27 px, but in-content prose links stay 16 px tall
  (WCAG 2.5.8 exempts links inside a sentence) and `/compare`'s 13 px
  checkboxes are hit through their 24 px labels.
- 5.1 owns preference persistence (`prefs.ts`) and the wizard; `/explore`'s
  settings are URL-encoded but not yet stored.
- The four new builders and the metric builder ship without unit tests, unlike
  `frame`/`pareto`/`bump`. Their options were checked only by rendering them in
  a browser. Anything that starts relying on these builders' geometry or payload
  shape (Stage 5's wizard, a refactor) should pin it first.
- Stage 4 is placeholder-grade by instruction: the surface is complete and
  measurable, not pixel-finished. A UI refactor is expected to rewrite it.

## Provenance

- Split from `docs/history/stages-4.md` on 2026-09-17 by the PM history parse; the frozen source file is unchanged.
- Task text, acceptance, handover contract and session records are verbatim slices. The stage's own labels (`1.1`, `3.3b`, …) are its numbering in force when it ran; each maps to the canonical id named in the task document's `## Notes`.
- `status: completed` is set by the parse once every task is recorded as done; the retro is `RETRO-2026-09-17-004`.
