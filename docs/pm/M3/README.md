---
id: M3
title: Static build framework (PLAN stage 3)
description: "Astro builds a multi-page static site from the committed data, with the design system in place and one real page rendering real numbers."
status: completed
started: 2026-09-14
completed: 2026-09-14
tasks:
  - APP-301
  - APP-302
  - APP-303
  - APP-303b
  - APP-304
  - APP-305
  - APP-306
  - APP-307
  - APP-308
  - APP-309
  - APP-310
  - APP-311
retro:
  - RETRO-2026-09-17-003
---
# Static build framework (PLAN stage 3)

## Definition of done

Astro builds a multi-page static site from the committed data, with
the design system in place and one real page rendering real numbers.

## Stage record

### Stage 3 — Static build framework

**Acceptance**

`bun run build` produces `dist/` with every route in 3.4 present, all internal
links resolving under the `base` prefix, and a generated OG image.
`bun run check` passes. CI is green on a push to `main`. Mobile check: no
horizontal scroll at 360 px on every route.

**Contract handed to Stage 4**

Layout, tokens, formatters, badge components, typed data accessor, and the CI
gate. Stage 4 adds charts and real page content only.

## Stage session log

### 2026-09-14 — Stage 3.3 + 3.3b: layouts, link helpers, two-scheme token set

**Landed**

- `apps/site/src/lib/url.ts` (new): three typed helpers. `href(path)` is the
  route builder — joins `import.meta.env.BASE_URL` and adds the trailing slash
  the `directory` build format implies; `asset(path)` is the file builder and
  adds none; `absoluteUrl(relativePath, site)` only turns an already
  base-relative path absolute against `site.origin`. All base handling lives in
  the two builders, so nothing detects or re-applies a prefix. The module
  normalises `BASE_URL` once, which also survives someone writing
  `base: "/rack-rate/"`. Measured: `href("/")` → `/rack-rate/`,
  `href("/models")` → `/rack-rate/models/`, `asset("/og.png")` →
  `/rack-rate/og.png`; under the custom domain `/`, `/models/`, `/og.png`.
- `apps/site/src/layouts/Base.astro` (new): head metadata (charset, viewport,
  title, description, canonical, generator, two media-scoped `theme-color`
  values, Open Graph, Twitter card), the skip link, the sticky header with the
  eight-route nav, and the footer. Canonical and `og:url` are
  `absoluteUrl(Astro.url.pathname, Astro.site)` — `Astro.url.pathname` already
  carries the base — and the OG/Twitter image is
  `absoluteUrl(asset("/og.png"), Astro.site)`.
- `apps/site/src/layouts/Page.astro` (new): the only `<main id="main"
  tabindex="-1">` landmark, an `h1` from `heading ?? title`, an optional lede,
  and the slot.
- `apps/site/src/styles/global.css`: four-size type scale (`--text-*: initial`
  plus meta 13 px / body 15 px / title 22 px / display 32 px), native sans and
  mono stacks, `--spacing: 0.25rem` as the single spacing unit, one duration
  (150 ms) and one easing (`cubic-bezier(0.2, 0, 0, 1)`) as the transition
  defaults with `--ease-standard` named for explicit use, a `:focus-visible`
  ink ring, `.skip-link` and `.tabular`, a `prefers-reduced-motion: reduce`
  override, and the light scheme as a token re-declaration under
  `prefers-color-scheme: light`.
- `docs/architecture.md` gained `## Layouts and links` (line 150) and its
  `## Design tokens` section (line 227) was rewritten: one colour table with
  both schemes, dark and light contrast tables, the type scale, spacing, motion,
  the scheme mechanism, the anti-signal table, and the three rules Stage 4
  inherits.

**Verified**

- Built the layouts against throwaway pages (`/`, `/models`, `/smoke33`), then
  deleted the pages and `dist/`: canonical and `og:url` measured
  `https://marshalfevzi.github.io/rack-rate/models/` with `og:image`
  `https://marshalfevzi.github.io/rack-rate/og.png`; the same build with
  `--base / --site https://rackrate.dev` gave `https://rackrate.dev/models/` and
  `https://rackrate.dev/og.png` with every internal href dropping the prefix.
  A zero-page build still exits 0, so removing the throwaways left no new
  failure mode.
- Emitted CSS: `.text-meta`/`.text-body`/`.text-title`/`.text-display` carry
  `font-size` plus the token's line-height, and `.text-sm`/`.text-base`/
  `.text-lg`/`.text-xl` are absent — the namespace reset took effect.
- Headless Chromium on the built page: dark body `rgb(10, 14, 21)` on
  `rgb(234, 238, 245)`, light body `rgb(247, 248, 250)` on `rgb(15, 20, 29)`
  with panel `rgb(255, 255, 255)` and rule `rgb(220, 226, 234)`, computed sizes
  13/15/22/32 px, header `position: sticky`, nav `transition` `0.15s` with
  `cubic-bezier(0.2, 0, 0, 1)`, `tabular-nums`, no horizontal scroll at 360 px
  (scrollWidth 360 at a 360 px viewport). Under `prefers-reduced-motion:
  reduce` the transition duration becomes `0.01ms`. The skip link is 1×1 px,
  `clip-path: inset(50%)`, and on Tab becomes 138×42 px at the top left with
  the 2 px ink outline. `aria-current="page"` lands on Overview at
  `/rack-rate/`, on Models at `/rack-rate/models/`, and on nothing at
  `/rack-rate/smoke33/`.
- Contrast, recomputed twice from the shipped hexes by WCAG 2.x relative
  luminance: dark ink 16.61/15.28, dim 8.80/8.10, adjusted 10.57/9.72, measured
  10.57/9.72, api 3.52/3.24, api-ink 6.53/6.01, rule 1.28/1.18; light ink
  17.36/18.45, dim 6.42/6.83, adjusted 5.58/5.93, measured 5.05/5.37, api
  5.16/5.49, api-ink 5.79/6.15, rule 1.23/1.30.
- Gates: `bun run check` exit 0 (typecheck, oxlint, oxfmt over 36 files, `astro
  check` 0 errors / 0 warnings / 0 hints), `bun test` 17 pass / 0 fail,
  `bun run data:check` exit 0 with `data/derived.json` still
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348` — no
  published number moved. `bun run quality` exits 1 on pre-existing findings
  only, and better than the recorded baseline: dead-code 9 (was 10), dupes 10,
  health 140 (was 140), with nothing new under `apps/site`.

**Decisions taken this session** (owner)

- Links are split into a route builder and a file builder, with a separate
  absolutiser, because the trailing slash and the base belong to path
  construction; `absoluteUrl` doing prefix detection was rejected as a
  whole-function heuristic.
- The footer's credits are static text in the layout. The verbatim Awesome
  Coding Plan attribution stays owned by `/sources` rendered from
  `data/sources.json` in 3.11, so the validated string is not duplicated — and
  so 3.3 does not front-run 3.5's data accessor by importing raw JSON.
- The light scheme is `prefers-color-scheme` only: no toggle, no pre-paint
  script, no FOUC workaround. A toggle needs persisted client state, which task
  5.1 owns.
- The focus ring is ink, not an accent, so no colour role is spent on
  interaction chrome.
- `--ease-standard` is kept even though Tailwind prunes theme variables no
  emitted utility references; the pruning is expected, and Stage 4 gets a named
  easing instead of an arbitrary value.

**Still open**

- 3.4–3.11 remain. The nav renders all eight route links, so it 404s until 3.4
  lands the page set; `og:image` points at `/og.png`, which 3.8 has not
  generated yet.
- `/sources` still owes the verbatim CC BY 4.0 attribution and the
  Artificial Analysis build-state line (3.11), and no favicon link ships until
  3.9 adds `public/favicon.svg`.
- The flat chart-marker rule, the `getComputedStyle` token read and the
  "amber only for the plan-adjusted basis" rule are recorded in
  `docs/architecture.md` for Stage 4 but are unenforced until chart code exists.

## Provenance

- Split from `docs/history/stages-3.md` on 2026-09-17 by the PM history parse; the frozen source file is unchanged.
- Task text, acceptance, handover contract and session records are verbatim slices. The stage's own labels (`1.1`, `3.3b`, …) are its numbering in force when it ran; each maps to the canonical id named in the task document's `## Notes`.
- `status: completed` is set by the parse once every task is recorded as done; the retro is `RETRO-2026-09-17-003`.
