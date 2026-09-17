---
id: M5
title: The Console Listing redesign (PLAN stage 5)
description: every route renders in the locked Console Listing world — a mainframe console / ISPF panel of fixed-column listing paper, a line-number gutter, a carriage-control state column, printer rules and uppercase mono legends — so the site becom...
status: in_progress
started: 2026-09-17
completed: null
tasks:
  - UI-501
  - UI-502
  - UI-503
  - UI-504
  - UI-505
  - UI-506
  - UI-507
  - UI-508
  - UI-509
  - UI-510
  - UI-511
  - UI-512
  - UI-513
  - UI-514
  - UI-515
retro: []
---
# The Console Listing redesign (PLAN stage 5)

## Definition of done

every route renders in the locked **Console Listing** world — a
mainframe console / ISPF panel of fixed-column listing paper, a line-number
gutter, a carriage-control state column, printer rules and uppercase mono
legends — so the site becomes one inspectable listing instead of a dark card
grid with a soft hero. It is the world `DESIGN.md` names as the creative north
star and the *Divine Machinery* direction roll of 2026-09-16. Stage 5 changes
presentation, composition and chart grammar only: no data, no arithmetic, no
route identity, no schema.

## Stage record

## Stage 5 — The Console Listing redesign

**Goal:** 

**The world is frozen.** `DESIGN.md` is the only owner of token values. This
stage restates names and shell metrics because acceptance measures them, and for
nothing else.

| Concern | Frozen names and metrics |
|---|---|
| Grounds | `--color-canvas`, `--color-panel`, `--color-panel-2` |
| Rules | `--color-rule`, `--color-rule-strong` |
| Text | `--color-ink`, `--color-dim`, `--color-faint` (label-only, lowest contrast) |
| Signal | `--color-signal`, `--color-on-signal` |
| Type | `--text-micro`, `--text-meta`, `--text-body`, `--text-data`, `--text-title`, `--text-display` |
| Faces | IBM Plex Sans for prose; IBM Plex Mono for every figure, identifier, legend and lane number |
| Shell | status band 32px pinned; lane rail 176px, lanes `01`–`06` at 40px plus the unnumbered `METHOD`/`SOURCES` reference rows at 36px after a 2px divider, rail total 314px; data row 36px desktop / 44px mobile; line-number gutter 40px at ≥768px and the first element dropped on phones; state column 20px and never dropped; numeric columns right-aligned with a 72px minimum and 1px column-group rules |
| Rhythm | 4px base, `4/8/12/16/24/32/48/64`; workspace max 1440px; edge gutters 24/32/48px; radius 0 everywhere |
| Motion | one duration ≤150ms, one easing `cubic-bezier(0.2, 0, 0, 1)`, state-only, `prefers-reduced-motion` honoured |
| State | carriage-control glyphs ` ` (live) `·` (held) `-` (excluded) `*` (committed) `!` (gap) `?` (low confidence) `+` (changed); never colour alone |
| Basis | `plan route` solid 1px rule; `API list` hairline 1px at 50% plus an open-ended stroke; `AA index` doubled rule; every axis, chart title, column, chip and legend names its basis in words |
| Banned | a second hue, green/red semantics, rounded corners, pills, shadow, gradient, blur, glow, spinners, shimmer, decorative dashes, monospace prose, a decorative eyebrow above a heading, motion above 150ms, and any contractual fact that exists only on hover |

**Boundaries — what Stage 5 must not do.**

- No change to `data/**`, `packages/core`, `packages/data-cli` or any formula.
  `bun run data:check` stays exit 0 and `data/derived.json` stays
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`.
- No server endpoint, no client-side data request, no new dependency. Charts keep
  reading committed payloads through the existing `*-payload.ts` modules.
- No route, slug or URL meaning changes. `apps/site/astro.config.mjs` remains the
  only owner of `site`/`base`, and every internal link keeps going through
  `href()`.
- **`apps/site/src/lib/prefs.ts` is not created in this stage.** It is task 6.1.
  Every state mark in Stage 5 is URL or session state, the set-aside is driven by
  filters a route already owns (score floor, vendor, reasoning effort) and by
  `known_gaps` rows, and no surface may imply a saved preference. The `-` and `*`
  marks consuming `ignoredModels` / `ignoredPlans` / `paidPlans` are Stage 6's;
  Stage 5 ships the glyph grammar and the set-aside surface that will carry them.
- **`/start` is layout only.** Task 5.12 gives it the shell, the selection
  console, the readout and the empty/error grammar. The provider → plan → model
  flow, the shareable result URL, the zod validation and export/import are
  Stage 6.
- `apps/site/scripts/og.ts` and `apps/site/public/favicon.svg` change only as
  task 5.2 prescribes.
- Evidence for every task is captured from a **built preview** (`bun run build`
  then `bun run preview`), never from `astro dev`: the dev server injects its own
  toolbar, which is not app chrome and was mistaken for chart chrome in the
  earlier design session.

**Reporting rule.** Each task updates its section of `ARCHITECTURE.md` as it
lands, the way Stages 3 and 4 did. Task 5.15 re-derives the design documents from
the shipped code afterwards.

### Acceptance

`bun run check`, `bun test` and `bun run build` all exit 0; `bun run data:check`
exits 0 with `data/derived.json` still
`7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`. Beyond that:

- Every route in the eleven-route set — the overview, `/models`,
  `/models/[slug]`, `/plans`, `/plans/[slug]`, `/compare`, `/explore`, `/start`,
  `/method`, `/sources` and the 404 — renders under the same status band and lane
  rail at 1440px, 768px and 360px, in both schemes, with no horizontal scroll at
  360px.
- Dark and light captures of the same route have identical geometry; the
  inversion changes values only.
- Keyboard-only traversal reaches every chart point, table row, drawer item,
  control-row action and the readout, at desktop and mobile width.
- Every interactive chart and table has a real table twin carrying the same
  values, basis, confidence, benchmark version, source and gaps.
- Removing colour loses nothing contractual: a greyscale capture of any route
  still shows every state, basis and confidence distinction.
- `apps/site/src` contains no radius, shadow, gradient, blur, glow, spinner,
  shimmer, second duration or second hue, and no colour token outside the frozen
  ten.
- Charts carry no `ToolboxComponent` in `registry.ts`, no chart-drawn chrome
  outside the page control row, no gradient, no circle marker and no unlabelled
  cost axis; `pass@1` and `pass@4` never share a field, axis or formula, and
  `benchmark_version` stays attached to every benchmark label.
- Five committed woff2 files, zero remote font requests, prose in Plex Sans,
  figures in Plex Mono, and a 1200×630 social card in the console palette.
- `apps/site/src/lib/prefs.ts` does not exist at the end of the stage and no
  surface implies a saved preference.
- Every evidence capture for the stage comes from a built preview, never
  `astro dev`.

### Contract handed to Stage 6

The shell (status band, lane rail, drawer, workspace, footer index), the listing
primitives, the cursor readout, the chart grammar and the six chart workspaces,
all on the frozen ten tokens.

Stage 6 adds behaviour, not appearance: `lib/prefs.ts` under
`rack-rate:prefs:v1`, the `/start` flow, the shared result URL, zod validation at
the localStorage boundary, export/import and reset, and preference-aware
rendering — the `-` and `*` marks and the set-aside consuming `ignoredModels`,
`ignoredPlans` and `paidPlans`.

Stage 6 may not add a token, a hue, a radius or a second duration, and may not
restyle the shell. A new visual need is either a Stage 5 follow-up or a
`DESIGN.md` change, never a page-local override.
