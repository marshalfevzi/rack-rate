# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary user: the individual practitioner.** A software engineer doing
AI-heavy work who is choosing, for themselves, which model to run and which
coding subscription to buy. They arrive mid-decision, on a laptop or on a
phone, with a monthly budget, a vendor they can or will pay, and no way to
check a vendor's marketing against their own workload. The question they hold
is "which plan should *I* buy", and the site answers it for one person at a
time.

**Secondary audience, documented but not the design target:** contributors who
have run a plan to exhaustion and submit the measurement through the
measured-quota issue form (`README.md`, `CONTRIBUTING.md`,
`.github/ISSUE_TEMPLATE/measured-quota.yml`).

The site is a public decision tool for strangers like the primary user. It is
not an internal dashboard, not a vendor marketing surface, and not a
leaderboard for leaderboard's sake.

## Product Purpose

Answers two questions from public data with published arithmetic:

1. **Which model should I use?** — compare models across DeepSWE,
   Terminal-Bench and (when publication is explicitly enabled) Artificial
   Analysis indices without treating scores from different benchmark versions
   as interchangeable.
2. **Which subscription pays for itself for the model I care about?** — join
   each model's measured cost per task against each coding plan's real monthly
   allowance, and show cost per task, break-even volume, and how long a full
   benchmark run would take under the plan's caps.

Success is defined in `PLAN.md`: a visitor picks their provider/plan, sees which
models that plan can run and what each costs them per task, compares those
models across several benchmarks with the Pareto frontier drawn on both the
API-list and plan-adjusted axes, reads where each number came from, and has
their ignored/paid/already-owned choices persist between visits — on a phone,
on a static site, with no server.

## Positioning

**The title is the thesis.** A hotel's rack rate is the price on the back of
the door; nobody pays it. API list pricing is the same instrument — published,
high, and unlike what the same work costs through a subscription quota. Rack
Rate prices usable work against measured allowances instead of comparing rate
cards.

The mechanism a neighbouring comparison product could not truthfully copy:

- **Every published figure traces to a citation** in `data/sources.json` with a
  `retrieved` date. A number without a source does not ship.
- **Missing data stays missing.** A model absent from a benchmark is not scored
  zero, not ranked last, and does not silently sink a composite.
- **`benchmark_version` is part of row identity.** DeepSWE v1 and v1.1, AA
  index v4.2 and v4.3, never share a table or a composite.
- **Every cost figure carries its basis** — API list, `{plan}` route, or AA
  index cost are three different quantities and are never plotted on one axis
  unlabelled.
- **Confidence is displayed, never laundered** —
  `measured | high | medium | low`; vendor-multiplier arithmetic is `medium` at
  best and aggregator-only figures never become computed rows.
- **Unresolvable upstream facts are recorded as gaps**, not guessed.
- **No server and no client-side data fetching.** The browser issues zero data
  requests; the build is reproducible offline from committed JSON.

## Operating Context

- Static multi-page site on GitHub Pages: the project page
  (`marshalfevzi.github.io/rack-rate`) first, the custom domain `rackrate.dev`
  when DNS is ready. `site` + `base` in `apps/site/astro.config.mjs` are the
  only place that target lives.
- `apps/site` is the rendered surface. It imports committed `data/*.json` and
  `@rack-rate/core` at build time; `packages/data-cli` is the only package
  allowed network or filesystem access, and `packages/core` is pure (no
  `fetch`, no `fs`, no clock).
- The visitor's real scene is a purchase decision: mid-research, often on a
  phone, comparing a handful of models and plans. Ignored models/plans, paid
  plans and other answers persist in `localStorage` under one versioned key
  namespace, `rack-rate:prefs:v1`, and are shareable through the URL.
- Inputs are four upstream sources: DeepSWE v1.1, Terminal-Bench board 4-0-0,
  Artificial Analysis (off unless both `AA_API_KEY` and `AA_PUBLISH=1` are set),
  and measured plan quotas from Awesome Coding Plan. USD is the display
  currency; CNY-denominated plans ship only with a recorded `fx.rate` +
  `fx.date` and a pinned `measured_against_model`.
- Data lineage is a documented ritual, not a chore: `bun run data:build`
  regenerates `data/derived.json`, `bun run data:check` fails when the committed
  file is stale, and every `retrieved` date is bumped when a source is
  refreshed.
- `CAVEATS.md` and `docs/data-sources.md` are read before publishing any new
  figure. `AGENTS.md` is read before any change.

## Capabilities and Constraints

**Capabilities.** Routes `/`, `/models`, `/models/[slug]`, `/plans`,
`/plans/[slug]`, `/compare`, `/explore`, `/start`, `/method`, `/sources`, `404`
(53 built routes). Chart set: Pareto scatter on a log cost axis with frontier
polyline and shaded dominated region, bump/rank across benchmarks with gaps for
missing data, model × benchmark heatmap, API-vs-plan slope chart, quota
burn-down waterfall, radar of per-index z. Sortable/filterable tables, the
ported budget calculator, a chart builder whose metric/filter/axis choices are
encoded in the URL, composite weight sliders that recompute client-side from
shipped per-benchmark z-scores, and a provider → plan → model selection wizard
whose result is a shareable, stateless link.

**Locked stack** (see `AGENTS.md`; do not re-litigate): Bun 1.4.2, TypeScript
strict with no `any`, Astro 7 static output with no adapter, Tailwind v4 through
`@tailwindcss/vite` with tokens in CSS `@theme` and no `tailwind.config.js`,
Apache ECharts 6 driven from plain TypeScript with no React/Svelte island,
nanostores + `@nanostores/persistent` (SSR-safe), zod 4 at every trust boundary
(HTTP response, file on disk, localStorage), committed normalized `data/*.json`,
GitHub Pages deploy, `bun test`.

**Ten invariants; violating one is a bug** (full text in `AGENTS.md`): version
in row identity; missing is missing; `pass@1` and `pass@4` never share a field,
axis or formula; every cost figure carries its basis; confidence is displayed,
never laundered; nulls stay null; no benchmark task content in this repository
(DeepSWE carries a canary string); required attribution strings are validated;
the site builds offline from committed data; Artificial Analysis is off unless
explicitly enabled.

**Terminology that is part of the contract:** cost basis, `measured` vs
`adjusted`, `single-source` composite badge, `known_gaps`, `cost_per_task`,
break-even, value multiple, days-for-full-run.

**Deliberately undecided, recorded rather than invented:** the Artificial
Analysis publication state (task 6.2b; an owner risk decision, `CAVEATS.md`
§1.6); Google AI credits → tokens/dollars conversion; SuperGrok's coding quota;
MiniMax Coding Plan Plus's FX conversion; the Z.ai GLM international credit
formula's output weight. These live in `known_gaps`, never as a guessed number.

**Accessibility requirements already committed** (`PLAN.md` 4.15, Stage 5
acceptance): keyboard traversal of every chart, table semantics, visible focus
states, `prefers-reduced-motion` honoured, touch targets, no horizontal scroll
at 360 px, text contrast ≥ 4.5:1.

## Brand Commitments

- **Name:** Rack Rate / `rack-rate`. The hotel-rack-rate metaphor is
  load-bearing voice, not decoration; the epigraph in `README.md` — "A hotel's
  rack rate is the price on the back of the door. Nobody pays it." — is the
  product's own sentence.
- **Attribution obligations that are contractual, not optional:** the CC BY 4.0
  identification block for Awesome Coding Plan (mahonzhan) rendered verbatim on
  `/sources`; credit to Datacurve for DeepSWE methodology and results;
  Terminal-Bench / Harbor Hub; `real-api-pricing` by FeiZhuLulu as prior art
  only, with no figures copied; Lato under the SIL OFL 1.1 for the build-time
  social card. When an AA value is ever published, §5.1 requires the Artificial
  Analysis logo visible on the chart plus a hyperlink, official terminology, and
  no implication of endorsement.
- **Existing mark:** `apps/site/public/favicon.svg` — a 32×32 canvas square with
  a rule border and three ascending amber bars. No raster icon and no web
  manifest ship with it.
- **Recorded anti-signals** from the deliberate visual pass (task 3.3b), which
  future work preserves unless a redesign is explicitly requested: no second
  accent hue, no dashed borders, no gradients or shadows, no second motion
  duration, no monospace body text, no emoji.
- Two-scheme palette (dark default, light under `prefers-color-scheme`), one
  accent per semantic role (plan-adjusted / measured / API-list basis).

## Evidence on Hand

- **Real committed data:** 28 models (`data/models.json`), 16 plans
  (`data/plans.json`), benchmark entries for DeepSWE v1.1 and Terminal-Bench
  board 4-0-0 (`data/benchmarks.json`), 178 model × plan pairs / 28 best routes /
  11 cross-check pairs / 5 known gaps (`data/derived.json`), and per-source
  citations with `license`, `retrieved` and `attribution`
  (`data/sources.json`).
- **Frozen parity fixtures:** `data/fixtures/legacy-derived.json` and
  `legacy-derived.csv` with their sha256 recorded in `PLAN.md` — the port-parity
  oracle asserted in `bun test`.
- **Cited research:** seven files in `docs/research/` (DeepSWE, Terminal-Bench
  and Harbor, subscription plans, Artificial Analysis, insight methodology,
  frontend stack, prior art), plus `docs/data-sources.md` for licensing
  verdicts.
- **Generated asset:** the 1200×630 social card built by `apps/site/scripts/og.ts`
  from real numbers at build time.
- **Absences future work must not fabricate:** no users, no testimonials, no
  press, no traffic or conversion numbers, no company or team behind the name,
  no endorsement by Datacurve, Harbor or Artificial Analysis, no AA values in
  any build where `AA_PUBLISH` is not exactly `1`, and never any benchmark task,
  prompt, verifier or patch. No `DESIGN.md` exists; the incumbent visual system
  is documented in `docs/architecture.md` and the committed CSS, components and
  chart option builders.

## Product Principles

1. **A number without a source does not ship.** Every figure on every surface
   carries its citation, its basis and its `retrieved` date, structurally, not
   in a footer.
2. **Missing is missing.** Absent data is never a zero, never a last place, and
   never quietly averaged into a composite.
3. **Show the basis; never launder confidence.** Weak evidence is labelled weak
   rather than dropped or promoted.
4. **Never guess an upstream fact.** Unresolvable facts become a recorded gap
   with a reason, and an honest gap beats a plausible number.
5. **The comparison is the product.** The interface exists to make a verified
   comparison legible on a phone, offline, from committed data — the chart, the
   table, and the provenance rail are one artifact.

## Accessibility & Inclusion

Requirements committed in `PLAN.md`: keyboard traversal for every interactive
chart and table, real table semantics, visible focus states,
`prefers-reduced-motion` honoured globally, adequate touch targets, a 360 px
layout with no horizontal scroll on every route, and text contrast of at least
4.5:1. Verification is by hand at 360 px and desktop width, not assumed.

The primary user reads this on a phone while deciding on a purchase, often with
partial attention; a figure they cannot parse at a glance has failed even when
it is correct. No user-specific accessibility need has been established, and no
external accessibility standard (WCAG level) has been contractually committed.
