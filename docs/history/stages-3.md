# PLAN archive — Stage 3 (static build framework) and its session history

> **Relocation note (appended 2026-09-17, not a rewrite).** This file refers to the
> pre-PM tree: `PLAN.md` and `docs/architecture.md` were superseded by `docs/pm/` and
> `ARCHITECTURE.md` on 2026-09-17 and deleted, and `docs/design/build-plan.md` became
> `docs/history/design-build-plan.md`. Relative links to them no longer resolve; recover
> the old files with `git show d95e6ef:<path>`.

Append-only history for the `rack-rate` rewrite. `PLAN.md` is the live plan; a
stage's task list, acceptance criteria, handover contract and progress-log
entries move here once the stage has landed. Do not rewrite what is here.

Read [`PLAN.md`](../../PLAN.md) first, then `AGENTS.md`.

**Task numbers inside the archived entries are the numbers in force when they
were written.** The 2026-09-16 session renumbered the wizard to Stage 6 and
deployment to Stage 7, so an archived entry that sends an item to "6.4's index
hygiene" means today's **7.4**, and one that mentions the wizard's 5.x means
today's 6.x. The entries are not rewritten. The 2026-09-17 review added a
relocation note for the same reason; see
[`retrospective-2026-09-17.md`](retrospective-2026-09-17.md).

---

## Stage 3 — Static build framework

**Goal:** Astro builds a multi-page static site from the committed data, with
the design system in place and one real page rendering real numbers.

### Tasks

- [x] 3.1 `apps/site/astro.config.mjs`: `output: 'static'`, `site`/`base` for
  the GitHub Pages project page (`site: 'https://marshalfevzi.github.io'`,
  `base: '/rack-rate'`), the Tailwind Vite plugin, and a single place where
  switching to the custom domain (`site: 'https://rackrate.dev'`, no `base`)
  is a two-line change. Document that switch in `docs/architecture.md`.
- [x] 3.2 Tailwind v4 entry `src/styles/global.css` — `@import "tailwindcss"`
  plus `@theme` tokens. Design tokens replace the old palette
  (`bg #0A0E15`, panel `#111825`, rule `#1D2735`, ink `#EAEEF5`, dim `#A3B0C4`,
  adjusted `#FFB020`, measured `#45D97F`, api `#5C6A80`), with contrast checked
  and a light scheme considered. No `tailwind.config.js`.
- [x] 3.3 `src/layouts/Base.astro` + `Page.astro`: head/meta, canonical URL
  built from `Astro.site` + `base`, OG tags, skip-link, sticky nav, footer with
  the attribution block. Every internal link goes through one `href()` helper
  so `base` is applied consistently.
- [x] 3.3b **Visual design pass** — the old site's problems are enumerated, so
  fix them deliberately rather than by taste alone. Replace the accidental
  signals the predecessor accumulated: 3D glossy ball chart markers, amber used
  for everything, monospace used for everything, dashed-rule noise, four
  competing animation durations, an emoji-based empty state, and a dead
  analytics snippet. Deliverables: a type scale and spacing rhythm (three or
  four sizes, one spacing unit), one accent per semantic role (adjusted /
  measured / API), one motion duration and one easing with
  `prefers-reduced-motion` honoured, and a two-scheme palette. Record the tokens
  and the reasoning in `docs/architecture.md` so Stage 4 does not re-invent
  them.
- [x] 3.4 Routing skeleton for the page set (content lands in Stage 4, wizard
  content in Stage 6): `/`, `/models`, `/models/[slug]`, `/plans`,
  `/plans/[slug]`, `/compare`, `/explore`, `/start`, `/method`, `/sources`,
  `404`. Uses `getStaticPaths` from the committed data.
- [x] 3.5 `src/lib/data.ts` — the single typed entry point importing
  `data/derived.json` + friends at build time and re-exporting typed views.
  Nothing else in the site touches raw JSON.
- [x] 3.6 `src/lib/format.ts` — number/currency/percentage/token formatting,
  one rounding rule per unit, so a figure reads identically everywhere.
- [x] 3.7 Provenance components: `<SourceLink>`, `<ConfidenceBadge>`,
  `<FreshnessBadge>`, `<CostBasisChip>`, `<CiBar>`. Every published number is
  wrapped in at least one, so "where did this come from" is structural rather
  than a footer paragraph.
- [x] 3.8 `scripts/og.ts` — build-time 1200×630 social card via satori → resvg,
  replacing the Pillow script. One bundled OFL font with its license file kept
  in-repo. Runs after `astro build`, writes into `dist/`.
- [x] 3.9 `@astrojs/sitemap`, `public/robots.txt`, `public/favicon.svg`, and a
  `public/CNAME` placeholder path documented (not committed until the domain is
  live). **Amended while landing:** `robots.txt` is a generated route
  (`src/pages/robots.txt.ts`), not a static `public/` file, because its
  `Sitemap:` line is absolute and a static copy would write the origin a second
  time.
- [x] 3.10 CI: `.github/workflows/ci.yml` running `bun install --frozen-lockfile`,
  `bun run check`, `bun test`, `bun run data:build`, and a check that
  re-running compute leaves `data/derived.json` unchanged (stale-output guard).
  Delete any Vercel-specific config.
- [x] 3.11 `/method` and the sources page render the real formulas and the full
  attribution block from Stage 1's docs, so the honesty commitments ship with
  the first pages, not later. **Amended while landing:** the sources page also
  states which Artificial Analysis state the build is in and lists the figures
  deliberately left out, both read from committed data at build time, because
  `apps/site` never reads an environment value.

### Acceptance

`bun run build` produces `dist/` with every route in 3.4 present, all internal
links resolving under the `base` prefix, and a generated OG image.
`bun run check` passes. CI is green on a push to `main`. Mobile check: no
horizontal scroll at 360 px on every route.

### Contract handed to Stage 4

Layout, tokens, formatters, badge components, typed data accessor, and the CI
gate. Stage 4 adds charts and real page content only.

---

## Progress log

Append-only. The entries below are the Stage 3 sessions exactly as they stood
in `PLAN.md` before this file was created; no entry was edited, reordered or
summarised. Earlier entries are in [`stages-1-2.md`](stages-1-2.md); later ones
are in [`stages-4.md`](stages-4.md) and, for sessions that are not a stage's
own, in `PLAN.md`.

---

### 2026-09-14 — Stage 3.1: Astro config, Pages base, Tailwind Vite plugin

**Landed**

- `apps/site/astro.config.mjs` (new): `output: "static"` with no adapter,
  `site: "https://marshalfevzi.github.io"`, `base: "/rack-rate"` for the GitHub
  Pages project page, and `@tailwindcss/vite` registered as the Vite plugin. The
  deployment target lives in that config object and nowhere else; the
  custom-domain switch is two changed lines. `site` and `base` are options
  rather than lifted constants — no build-time consumer reads them outside
  Astro.
- `docs/architecture.md` gained a `## Site configuration` section recording the
  switch, the single-writer rule, the Tailwind entry point, and the measured
  `Astro.site` / `import.meta.env.BASE_URL` / `Astro.url` values.

**Verified**

- Throwaway page plus an `@import "tailwindcss"` stylesheet, built with
  `bun run --filter @rack-rate/site build` (exit 0, 1 page): under the shipped
  config `import.meta.env.BASE_URL` is `/rack-rate` — **no trailing slash, so a
  joiner supplies the separator** — `Astro.site` is
  `https://marshalfevzi.github.io/`, `Astro.url.pathname` is
  `/rack-rate/smoke31/`, and the stylesheet lands at
  `/rack-rate/_astro/smoke31.<hash>.css` carrying the `.hidden` utility, so the
  plugin really does scan and emit. Identical 4178-byte CSS across three
  consecutive builds.
- The same page with only those two options changed: `BASE_URL` `/`, `Astro.site`
  `https://rackrate.dev/`, stylesheet at `/_astro/…`; `diff` shows exactly two
  changed lines. The config was restored byte-identical and the throwaway page,
  stylesheet and `dist/` were deleted.
- `bun run check` exit 0 (typecheck, oxlint, oxfmt, astro check), `bun test` 17
  pass / 0 fail, `bun run data:check` exit 0 — `data/derived.json` is still
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`, so no
  published number moved. `bun run quality` still exits 1 on pre-existing
  findings in `tools/oxlint/anti-slop` and `packages/data-cli`; it reports no
  finding in `apps/site` and remains out of the `bun run check` gate.
- The anti-slop `require-readable-spacing` rule rejected two adjacent
  module-level constants; inlining them into the config object is what removed
  the padding requirement.

**Still open**

- 3.2–3.11 remain in Stage 3. `astro check` still warns `Missing pages
  directory: src/pages` until 3.4 lands, and `bun run og` still fails until 3.8.
- The measured `BASE_URL` value contradicts nothing in the plan, but it does fix
  the contract for 3.3: `href()` must join `/rack-rate` with a separator itself.

### 2026-09-14 — Stage 3.2: Tailwind entry, design tokens, contrast evidence

**Landed**

- `apps/site/src/styles/global.css` (new, 30 lines): `@import "tailwindcss"`,
  one `@theme` block holding the nine `--color-*` tokens, and one `@layer base`
  block with `color-scheme: dark` plus body `canvas`/`ink`. Still no
  `tailwind.config.js`, and no type scale, spacing rhythm, motion tokens, font
  stacks or component classes — 3.3b owns all of those.
- **Token names.** `bg` became `canvas`: a `--color-bg` token would generate the
  utility `bg-bg`. `panel`, `rule`, `ink`, `dim`, `adjusted` and `measured` keep
  the legacy hexes under semantic names. A ninth token, `--color-api-ink`
  `#8a97ab`, is an addition the plan did not have, and it is required: the
  legacy `api` `#5c6a80` measures 3.52:1 on canvas and 3.24:1 on panel, i.e. it
  clears the 3:1 non-text threshold but not 4.5:1 for text. Invariant 4 makes
  every cost figure carry its basis, so the API basis needs a label colour:
  `--color-api` marks and strokes, `--color-api-ink` is the text (6.53:1 on
  canvas; 6.01:1 on panel).
- `docs/architecture.md` gained `## Design tokens`: the token table, a
  dark-scheme contrast table, the light-scheme consideration, and the note that
  Stage 4 chart code reads a token value with `getComputedStyle` rather than
  copying hexes into TS.

**Verified**

- Emission and runtime, end to end. A throwaway `src/pages/smoke32.astro`
  importing the entry built with `bun run --filter @rack-rate/site build`
  (exit 0). The emitted stylesheet (5,149 bytes) carries all nine `--color-*`
  declarations and generates `.bg-canvas`, `.bg-panel`, `.text-ink`,
  `.text-dim`, `.text-adjusted`, `.text-measured`, `.text-api`,
  `.text-api-ink` and `.border-rule`; two clean builds produced byte-identical
  CSS, sha256 `8787ed50ad387df89f4f7ede93c7e49d5e48327731aab0cef12bebf0ba5e68a7`.
- Real browser: headless Chromium on `http://127.0.0.1:4173/rack-rate/smoke32/`
  computes `body` as `rgb(10, 14, 21)` on `rgb(234, 238, 245)` with
  `color-scheme: dark`, every utility resolving to its token value, and the
  stylesheet served under the `/rack-rate` base — 3.1's config and this entry
  agree on the prefix.
- Contrast, recomputed independently of the authoring agent: all thirteen
  published ratios in both tables, and the three corrected light accents,
  matched to two decimal places. `bun run check` exit 0 (typecheck, oxlint,
  oxfmt over 35 files, `astro check` 0 errors / 0 warnings / 0 hints; the
  `Missing pages directory: src/pages` warning stands until 3.4), `bun test`
  17 pass / 0 fail, `bun run data:check` exit 0 with `data/derived.json` still
  `7425a331…`, `bun run quality` exits 1 on the same pre-existing findings as at
  3.1 (dead-code 10, dupes 10, health 140) and reports nothing under `apps/site`.
- Throwaway page, the local static server and `apps/site/dist/` were removed;
  the working tree holds only `global.css`, `docs/architecture.md` and this log.

**Decisions taken this session**

- Tokens ship as one dark scheme. The light scheme is **considered and
  specified, not implemented**: the frozen candidate fails `adjusted` and
  `measured` as accents (1.83:1 on white, 1.69:1 on panel) and `api-ink` as
  text (2.96:1), so 3.3b needs hue-preserving light accents — recorded as
  `adjusted #8a5a00`, `measured #1a7a45`, API text `#55627a` (5.93/5.48,
  5.37/4.96, 6.15/5.68 against white and panel). Swapping schemes is a token
  re-declaration, not a refactor, so 3.2 does not move for it to land.
- A minimal-decrement search does reach 4.5:1 with `#c55420` / `#45807f` /
  `#8a68ab`, and it was rejected: it turns amber into orange-red, green into
  teal and slate into purple, and the accent's only job is to say which cost
  basis a figure is. Role hue outranks the smallest numeric edit.

**Still open**

- 3.3–3.11 remain in Stage 3. `bun run og` still fails until 3.8, so
  `bun run build` cannot complete yet by design.
- The light-scheme hexes above are evidence for 3.3b, not shipped tokens; the
  `prefers-color-scheme` / toggle mechanism is deliberately absent from 3.2.

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

### 2026-09-14 — Stage 3.4: routing skeleton, seeded data accessor

**Landed**

- `apps/site/src/pages/` (11 new files) — the whole route set: `index.astro`,
  `models/index.astro`, `models/[slug].astro`, `plans/index.astro`,
  `plans/[slug].astro`, `compare.astro`, `explore.astro`, `start.astro`,
  `method.astro`, `sources.astro`, `404.astro`. Every page renders through
  `Page.astro`, so each route has exactly one `<main id="main">` and one `h1`.
- Both dynamic routes build `getStaticPaths` from committed rows: 28
  `/models/<id>` pages from `data/models.json`, 16 `/plans/<id>` pages from
  `data/plans.json` — 53 pages in total. The slug is the row `id`, so no second
  slug mapping exists to drift; `google-ai-pro` gets a page despite its
  unresolved quota, and the two provider-null models render "Provider not
  identified by the upstream source." rather than a blank or an invented vendor.
- `apps/site/src/lib/data.ts` (new) — the site's only importer of `data/*.json`,
  parsing `models.json` and `plans.json` through the core zod schemas and
  re-exporting the rows.
- Root `tsconfig.json` gained `resolveJsonModule: true`, which those imports
  need. No layout, stylesheet, or data file changed.
- Each route carries one honest skeleton line ("Route skeleton — … lands in
  Stage N of the build plan") instead of shipping an empty page; Stage 4 and 5
  delete them as content arrives. No score, cost, badge or attribution string
  was invented: those wait for the components that carry their basis.
- `docs/architecture.md` gained `## Routes and data access` (the route table,
  the slug rule, the skeleton-note convention and the accessor's boundaries).

**Verified**

- `bun run typecheck` exit 0, `bun run lint` exit 0, `bun run format:check` exit
  0 (37 files), `astro check` 17 files with 0 errors / 0 warnings / 0 hints —
  the `Missing pages directory: src/pages` warning is gone — `bun test` 17 pass /
  0 fail, `bun run data:check` exit 0 with `data/derived.json` still
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`: **no
  published number moved in this session.**
- `bun run --filter @rack-rate/site build` exit 0, 53 pages. Serving the `dist`
  tree from a static server with the build mounted at its real `/rack-rate`
  prefix returned 200 for all 53 routes, and every base-prefixed `href`/`src` in
  the built HTML (eight nav links plus one stylesheet) resolved — no dangling
  link, so the nav that 404'd through 3.3 now lands.
- Headless Chromium at a 360 px viewport across all eleven route shapes plus a
  second model and the 404: `scrollWidth` 360 on every page (no horizontal
  scroll), one `<main>` and one `h1` each, `aria-current="page"` on Models at
  `/models/gpt-6-astra/` and on Plans at `/plans/claude-pro/`, none on the 404,
  and canonical URLs under `/rack-rate`.
- Title mapping checked across all 44 detail pages rather than sampled: every
  `/models/<id>` and `/plans/<id>` page's `h1` and `title` equal its own row's
  `name`, every lede equals its own row's `provider`, no page carries the other
  type's name, and both null-provider models render "Provider not identified by
  the upstream source." instead of a blank or an invented vendor.
- `bun run quality` (report-only, out of the gate) still exits 1 on pre-existing
  findings and flags nothing in `src/pages` or `src/lib`: dead-code 8 (was 9 at
  3.3) is one unused export in `tools/oxlint/anti-slop`, one duplicate `run`
  export across `packages/data-cli`, and six dependencies `apps/site` declares
  for later stages; dupes 10 and health 140 are unchanged from the 3.3 baseline.

**Decisions taken this session**

- 3.4 reads committed data through a seeded `src/lib/data.ts` rather than
  importing JSON inside the two dynamic routes. The plan puts the accessor at
  3.5, but `getStaticPaths` needs the rows now, and 3.3 had already refused to
  front-run the accessor by importing raw JSON. 3.5 stays open and extends the
  module with the derived, benchmark and source views; its task text is
  unchanged.
- The page set is a skeleton, not a first draft of content: a heading, one
  honest skeleton note, and nothing numeric. A figure cannot ship before the
  cost-basis, confidence and provenance badges that label it.
- The 404 route links to the overview, models and plans instead of stating a
  bare error.

**Still open**

- 3.5–3.11 remain. `src/lib/data.ts` holds `models` and `plans` only; the
  derived, benchmark and source views are 3.5's.
- `bun run build` still cannot complete: `bun run og` fails until 3.8, so
  `og:image` points at `/rack-rate/og.png`, which no build writes yet.
- The 404 route's canonical is `…/rack-rate/404/`, a path with no page.
  `Base.astro` owns the head (3.3); the fix — no canonical on the 404 plus
  `<meta name="robots" content="noindex">` — belongs with 6.4's index hygiene.
- `/method` still owes the real formulas and `/sources` the verbatim attribution
  block plus the Artificial Analysis build-state line (3.11). Neither page
  duplicates attribution text in the meantime.

### 2026-09-14 — Stage 3.5: typed data accessor over all five committed documents

**Landed**

- `apps/site/src/lib/data.ts` grew from two documents to five: it now parses
  `models.json`, `plans.json`, `benchmarks.json`, `sources.json` and
  `derived.json` through their `@rack-rate/core` zod schemas and exports 24
  typed views in 189 lines. `models` and `plans` keep their names so the two
  `getStaticPaths` routes are untouched.
- Identity rows and documents: `models`, `plans`, `planKnownGaps`,
  `quotaModelDocs`, `benchmarks`, `sources`, `derived`. Id indexes:
  `modelsById`, `plansById`, `benchmarksById`, `sourcesById`. Relation indexes:
  `routesByModel`, `routesByPlan`, `bestRouteByModel`, `compositeByModel`,
  `compositeWeights`, `apiFrontier`, `frontierByPlan`, `tokenAllowances`,
  `tokenAllowanceByPair`, `badgeByPair`, `crossCheck`, `derivedKnownGaps` — all
  built once at module load in a single pass per source array, so a page never
  rescans 178 pairs. `pairKey(modelId, planId)` is the one place the
  `(model, plan)` key is assembled; the `::` separator appears in no committed
  id, which is asserted rather than assumed.
- `composites`, `frontiers`, `token_allowances` and `badges` are optional in
  `DerivedFile` but always present in the committed document. The module reads
  each once through a local `requiredSection` and exports the non-optional view,
  so a document missing a computed section fails the build instead of rendering
  an empty page. Lookups by an unknown id still return `undefined` — an id
  upstream retired degrades to a missing row.
- `docs/architecture.md` `## Routes and data access` now documents the landed
  surface, the fail-fast rule, the unknown-id rule and the type boundary; the
  measured Stage 3.4 build paragraph is unchanged.

**Verified**

- Throwaway `src/pages/smoke35.astro` (built, then deleted with `dist/`): 54
  assertions, every one compared against the committed data read independently
  with `jq`, and the build fails on any mismatch. Covered, all matching:
  `models` 28, `plans` 16, `sources` 11, `benchmarks` 2 (deepswe v1.1 +
  terminal-bench 4.0.0), `planKnownGaps` 7, `derived.pairs` 178,
  `best_routes` 28; `routesByPlan` ollama-pro 28 / claude-pro 5 /
  kimi-code-andante 2 / `google-ai-pro` absent; `bestRouteByModel("gpt-6-astra")`
  = chatgpt-pro-20x at $0.1299; `compositeByModel("gpt-6-astra").composite`
  = 65.6562 at k=2 while `claude-sonnet-4.6` stays `null` /
  `single-source`; `compositeWeights` 1/1; `apiFrontier` 28 points and the six
  frontier ids; `frontierByPlan` 15 plans, kimi-code-andante → `kimi-k3` alone;
  `tokenAllowances` 178 with `value_multiple` 3 for
  `gpt-6-astra × ollama-pro` and `undefined` when the pair is reversed;
  `crossCheck.summary.median_ratio` 1.601 over 11 pairs; `derivedKnownGaps` 7;
  the `badgeByPair` row for that pair = high / fresh / list / reported / any /
  ok. The build reported 54 pages, so the probe compiled through the real Astro
  pipeline rather than a type check alone.
- Negative control for the missing-section guard: with `composites` removed from
  a throwaway copy of `data/derived.json`, the same build exited 1 with
  `data/derived.json is missing the composites section` instead of emitting an
  empty page. The file was restored by `git checkout` and re-hashed to
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`, so the
  control left no trace.
- `grep` for `from "…/data/*.json"` under `apps/site/src` matches exactly one
  module, `src/lib/data.ts` — 3.5's boundary, now checked rather than asserted.
- `bun run check` exit 0 (typecheck, oxlint, oxfmt over 37 files, `astro check`
  0 errors / 0 warnings / 0 hints), `bun test` 17 pass / 0 fail, `bun run
  data:check` exit 0 with `data/derived.json` still `7425a331…`: **no published
  number moved in this session.** `bun run quality` still exits 1 on
  pre-existing findings; dead-code rose 8 → 30 because 22 of the new exports are
  the Stage 4 views (`data.ts` reports as 92 % dead), dupes 10 and health 140 are
  unchanged. Quality stays report-only, and the surface is what 3.5 was asked to
  build, not an accident.
- The anti-slop `require-readable-spacing` rule rejected the first layout of the
  module with 37 findings; it now carries a blank line between top-level
  statements, and `bun run format` left the file as written.

**Decisions taken this session**

- The accessor exports the full view set 3.5 names rather than only what the
  skeleton routes consume today: the Stage 4 contract hands the typed accessor
  forward, so the unused-export count rises once, now, instead of growing per
  page later.
- `compositeWeights` is a `Readonly<Record<string, number>>` straight from
  `derived.composites.weights`; nothing in the site re-derives it.
- Unknown-id lookups stay `undefined`; the build only fails on a missing
  computed section, which `data:check` already guarantees cannot be committed.

**Still open**

- 3.6–3.11 remain. `bun run build` still cannot complete because `bun run og`
  fails until 3.8 writes `dist/`'s social card.
- The accessor's views are exercised by the probe, not by a page: no route
  renders a score, cost or badge until 3.7's components exist.

### 2026-09-14 — Stage 3.6: display formatting, one rounding rule per unit

**Landed**

- `apps/site/src/lib/format.ts` (new, 210 lines): `MISSING` plus sixteen
  formatters — `formatPercent`, `formatFractionAsPercent`, `formatPoints`,
  `formatPercentRange`, `formatFractionAsPercentRange`, `formatUsd`,
  `formatUsdPerTask`, `formatUsdPerMillionTokens`, `formatTasksPerMonth`,
  `formatDays`, `formatCount`, `formatTokens`, `formatTokensExact`,
  `formatMultiple`, `formatZ`, `formatFxRate`. Each rule lives in the module:
  no precision argument exists, so a page cannot re-round a figure. Every value
  passes through `roundHalfEven` from `@rack-rate/core` — the repo's single
  Python-parity rounding semantic — and through one
  `Intl.NumberFormat("en-US", …)` per rule, pinned at module scope, so the
  runtime locale never reaches a published figure. Absent, `NaN` and infinite
  values return `MISSING` (`—`) from every entry point, while a genuine `0`
  formats as `$0` / `0.0%`. Formatters emit symbols only (`$`, `%`, `×`);
  compound unit words stay with the component that renders the basis.
- `apps/site/src/lib/format.test.ts` (new): 34 tests / 142 assertions —
  invalid-value coverage per formatter, half-even boundaries at each shipped
  precision (`74.05 → "74.0%"`, `7.015 → "$7.01"`, `0.03045 → "$0.0305"`),
  token scale promotion (`999999 → "1M"`), trailing-zero trimming
  (`20 → "$20"`), grouping (`2400 → "2,400"`), the always-signed contract
  (`0 → "+0.00"`), and one-sided ranges. Live-data proof is five anchors
  through the typed accessor (`modelsById`, `bestRouteByModel`,
  `compositeByModel`, `crossCheck`, `tokenAllowanceByPair`); the suite imports
  no `data/*.json`, so 3.5's boundary holds inside `apps/site` and a routine
  refresh cannot redden the rule tests.
- `docs/architecture.md` gained `## Formatting` (lines 303–353): the
  export/unit/rule/example table, the Stage 2 precision rule it implements, the
  `en-US` pin, why percentages are 1 dp, the missing-vs-zero rule, the
  one-sided-range rule, the weights-are-controls note, the two-convention trap
  (`models.json` CI fractions vs percent-scale scores and composites) and the
  Stage 4 consumer contract.

**Verified**

- `bun test` 51 pass / 0 fail (17 core + 34 format). `bun run check` exit 0
  after one `bun run format` pass that joined three wrapped lines in the test
  file: typecheck, oxlint, oxfmt over 39 files, `astro check` 0 errors /
  0 warnings / 0 hints.
- Throwaway `src/pages/smoke36.astro` (built, then deleted with `dist/`): 19
  assertions formatting real committed rows read through `src/lib/data.ts` —
  gpt-6-astra's `74.12 → "74.1%"`, its CI fraction pair → `"71.2–77.0%"`, a
  suppressed composite → `—`, the chatgpt-pro-20x best route → `"$0.1299"` /
  `"$200"` / `"2.2"` days, claude-opus-5's half-step median → `"90.5"`,
  1,163,918 tokens → `"1.16M"` and `"1,163,918"`, `43.648 → "43.65×"`, the
  `6.7787` FX rate, kimi-code-andante's `2,556` requests, and google-ai-pro's
  unresolved quota → `—`. `bun run --filter @rack-rate/site build` reported 54
  pages, exit 0.
- **Negative control:** with one expectation changed to `74.2%` the build
  failed — `stage 3.6 probe failed: percent from a committed score -> 74.1%
  (expected 74.2%)`, exit 1 — so the probe is a real gate rather than a page
  that cannot fail. Page and `dist/` were removed afterwards.
- `grep` for `data/*.json` under `apps/site/src` still matches exactly one
  module, `src/lib/data.ts`; the format layer and its test both stay behind the
  accessor.
- `bun run data:check` exit 0 and `data/derived.json` still
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`: **no
  published number moved in this session.** `bun run quality` still exits 1 on
  pre-existing findings; dupes 10 and the health report sit at the 3.5
  baseline, and dead code additionally lists `data.ts`'s awaiting-Stage-4 views
  (16) while every `format.ts` export is referenced by the tests.

**Decisions taken this session**

- One rule per unit, owned by the module: formatters take no precision
  argument. An options object with a digits field would re-open exactly the
  drift the task exists to close — the predecessor called `toFixed` with 2, 3
  and 4 decimals in one table.
- Percentages display at 1 dp. Composites differ by as little as 0.03 pp and
  two DeepSWE scores are identical, but the published CIs are 4–8 points wide
  and every upstream board shows 1 dp, so 2 dp would print false precision;
  ties are the CI-overlap rule's job, not extra digits'.
- `formatCount` is **up to** 1 dp with trailing zeros trimmed, not a fixed
  0 dp: `agent_steps_per_task` and benchmark `steps` carry half-step medians
  (90.5, 61.5, …), so 0 dp would change a published figure. An independent
  coverage pass over every numeric key in the five committed documents found
  exactly two gaps in the frozen contract — that one, and
  `plans[].requests_month` / `plans[].rolling_window_hours` (integer
  quantities under the same rule) — and nothing else.
- A one-sided CI renders as `MISSING` rather than a half-range: a range with a
  single endpoint is not a reported interval, and a component needing the other
  end would have to invent it.
- `composites.weights` gets no formatter: it is a control input for 4.13's
  sliders, not a published figure. If a page ever prints one, the rule lands in
  `format.ts` and in the `docs/architecture.md` table first.
- Formatters emit no unit words. `/task` and `/mo` belong to `CostBasisChip`
  and to column headers; putting the unit inside the formatter would duplicate
  the invariant-4 label.
- Display rounding reuses `roundHalfEven` instead of `toFixed`, so a rendered
  figure rounds the same way as the committed `derived.json` bytes.

**Still open**

- 3.7–3.11 remain. `bun run build` still cannot complete because `bun run og`
  fails until 3.8 writes `dist/`'s social card.
- `format.ts` is exercised by its tests and by the deleted probe, not by a
  page: no route renders a figure until 3.7's badge components and Stage 4's
  content land.
- `formatPoints`, `formatZ` and `formatFxRate` have no page consumer yet. The
  coverage pass confirmed a real committed field sits behind each — the
  frontier distance, `composites.rows[].weighted_z`, and `plans[].fx.rate` —
  so they ship now rather than as a later retrofit.

### 2026-09-14 — Stage 3.7: the five provenance components and one freshness rule

**Landed**

- `apps/site/src/components/` (new, six files, 188 lines): `Badge.astro` is the
  chip shell the three badges share — `inline-flex … border-rule text-meta`
  rendered once, with a `tone` of `neutral` / `api` / `adjusted` and an
  optional `title` — and the five provenance components render it:
  `ConfidenceBadge.astro` (17), `FreshnessBadge.astro` (18),
  `CostBasisChip.astro` (40), `SourceLink.astro` (27), `CiBar.astro` (60).
  Every one takes parsed values, never raw JSON, and renders words, geometry or
  a citation — no component formats a published figure, so the number stays
  owned by `format.ts` and the basis by the chip.
- `apps/site/src/lib/provenance.ts` (new, 197 lines): the vocabulary
  (`CONFIDENCE_TERMS`, `FRESHNESS_TERMS`, `COST_BASIS_TERMS`,
  `COST_UNIT_LABELS`) and the arithmetic (`costBasisTerm`,
  `costBasisQualifier`, `ciGeometry`). Its types come from the data contract —
  `Confidence` is `Plan["confidence"]`, `Freshness` is `PairBadge["freshness"]`,
  `CostBasisStatus` is `Model["cost_basis"] | NonNullable<Plan["price_status"]>` —
  so a new level or status fails the build inside the module rather than
  rendering an unlabelled badge. Pure TypeScript: `.astro` frontmatter and
  `bun test` call the same function.
- `apps/site/src/lib/provenance.test.ts` (new, 93 lines): 13 tests / 25
  assertions over `ciGeometry` (exact 3 dp left/width, the
  `leftPct + widthPct` identity on the high end, 0–1 and 0–100 domains,
  clamping, transposed pairs, absent and one-sided endpoints, `NaN`) and the
  vocabulary (the routed label naming its plan, the throw on a missing or blank
  plan name, the plain terms for non-route bases, the four status qualifiers).
  Coverage of every `CostBasisKind` is the module's
  `satisfies Record<CostBasisKind, Term>`, not a test.
- `packages/core/src/freshness.ts` (new, 36 lines) and
  `packages/core/src/freshness.test.ts` (new, 42 lines): `STALE_AFTER_DAYS`
  (14), `isStale(retrievedAt, generatedAt)` and `freshnessOf` — the freshness
  rule in one place, reference moment as an argument, exported through
  `packages/core/src/index.ts`. `compute.ts` (+1/−8) now imports it instead of
  keeping its own copy of the threshold and the comparison.
- `apps/site/src/lib/data.ts` (+13): `derivedGeneratedAt` — the newest upstream
  `generated_at` `compute` wrote into the file, read through the same fail-fast
  guard as the computed sections. Every freshness badge is dated against it, so
  a badge ages against committed data rather than the wall clock.
- `docs/architecture.md` gained `## Provenance components` (lines 360–445): the
  props/renders table, the vocabulary module, the five rules the components
  encode, the `derivedGeneratedAt` reference moment, the `SourceLink` throw, the
  Stage 4 coverage rule and the measured probe evidence.

**Verified**

- `bun run check` exit 0: typecheck, oxlint, oxfmt over 43 files, `astro check`
  27 files 0 errors / 0 warnings / 0 hints. `bun test` 72 pass / 0 fail (24 core
  + 47 site + 1 data-cli) in 7 files / 231 assertions.
- `bun run data:check` exit 0 and `data/derived.json` still
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`: **the
  freshness extraction moved no byte.** `bun run quality` (report-only) exits 1
  on pre-existing findings: dupes 10 and health 140 sit at the 3.6 baseline,
  dead code lists the six components as unreachable files and `data.ts`'s 16
  awaiting-Stage-4 views (`COST_STATUS_TERMS` was un-exported this session
  because only `costBasisQualifier` reaches it).
- Throwaway `src/pages/smoke37.astro` (built, then deleted with `dist/`): a
  page asserting committed rows — their interval geometry, badge levels,
  freshness verdicts, basis labels and citations — read through
  `src/lib/data.ts`, plus the emitted markup. `bun run --filter
  @rack-rate/site build` reported 54 pages, exit 0,
  and the HTML carried `style="left:71.25%;width:5.73%;min-width:2px"` with
  `left:74.12%` for gpt-6-astra's interval, the accessible name
  `74.1% (interval 71.2–77.0%; 95% run-to-run: SE across repeated
  whole-benchmark passes (1.96 * std(runs)/sqrt(R)))`, a `API list /task ·
  expected launch` chip in `text-api-ink`, a `ChatGPT Pro 20x route /task` chip
  in `text-adjusted`, `Fresh retrieved 2026-09-14` out of the row's own
  `retrieved_at` judged against `derivedGeneratedAt`
  (`2026-09-10T21:58:00Z`), and `— no interval reported` instead of a bar for
  the Terminal-Bench row with no CI.
- Browser (headless Chromium through the built `dist/` at
  `localhost:4321/rack-rate/smoke37/`, `astro preview`): at 360 px the page
  reported `scrollWidth` 360 with no unclipped overflow, and the bar measured
  96 px inside a `w-24` container and falling to its 64 px `min-w-16` floor in
  a squeezed table cell, 4 px tall, with
  the interval `rgb(163, 176, 196)` on a `rgb(29, 39, 53)` track and a 2 px
  `rgb(234, 238, 245)` marker: `--color-dim`, `--color-rule`, `--color-ink` —
  no accent spent on chrome or interval. One layout defect was found and fixed
  in the probe itself: a seven-column table is wider than 360 px, so the probe
  renders cards instead of a table, which is 4.15's work rather than a
  component property.
- **Negative control:** with one expected interval start changed to `71.24` the
  build failed — `stage 3.7 probe failed: astra interval start -> 71.25
  (expected 71.24)`, exit 1 — so the probe is a real gate. Page and `dist/` were
  removed afterwards.

**Decisions taken this session**

- The freshness rule moved into `@rack-rate/core` instead of being written twice
  (component and `compute`), because a page's `Fresh`/`Stale` word and the
  committed `PairBadge.freshness` are the same judgement; `compute` keeps the
  reference-moment argument that the badge gets from `derivedGeneratedAt`. The
  research pass's 30/90-day `aging` ladder was **not** adopted: the committed
  vocabulary is `fresh | stale`, and widening it would invalidate the badges 3.5
  already ships.
- One `Badge.astro` shell rather than five copies of the chip markup, and no
  generic `<Status>` component for the three enum badges: the words differ per
  vocabulary, and a merged component would have to carry all three tables.
- `SourceLink` **throws** for an id absent from `data/sources.json` instead of
  degrading to plain text. `bun run validate` already enforces evidence/source
  referential integrity and invariant 8 makes attribution load-bearing, so an
  unresolvable citation must fail the build; the accessor's `undefined`-degrades
  rule covers an id upstream retired, not a missing citation.
- `ciGeometry` positions the interval on the **full** domain and never zooms, so
  a 5.7-point interval reads as one. Rounding is 3 dp with the width taken as a
  delta between the rounded ends, so `leftPct + widthPct` lands exactly on the
  interval's high end; out-of-domain input clamps instead of rescaling the
  track; a transposed `lo`/`hi` pair is ordered rather than drawn inside out; the
  interval's 2 px floor is CSS (`min-width:2px`), not geometry.
- Tones follow invariant 4 and the token roles: `neutral` for confidence,
  freshness and the AA index basis, `text-api-ink` for the API-list basis,
  `text-adjusted` for `{plan} route`. `--color-measured` stays reserved for the
  measured quota basis, which no 3.7 component renders.
- `CostBasisChip` throws when `plan-route` arrives without a plan name: the
  label `{plan} route` without the plan names nothing, and the component is the
  last point where that can be caught.

**Still open**

- 3.8–3.11 remain. `bun run build` still cannot complete because `bun run og`
  fails until 3.8 writes `dist/`'s social card.
- The components are unreachable from any entry point until Stage 4's tables and
  charts consume them, so `fallow` lists all six as unused files (expected, not
  stale) and the Stage 4 rule "every published figure sits inside at least one
  provenance component" is not yet enforced by anything but review.
- `CiBar` draws one full-domain interval bar; a zoomed or multi-series CI
  rendering belongs to 4.x's ECharts work rather than to a second bar variant.
- The AA index cost chip renders untinted by design; if 3.11's `/method` page
  needs a printable basis legend, it reads `COST_BASIS_TERMS` through
  `costBasisTerm` rather than re-typing the labels.

**Addendum, same stage, measured after the commit**

- The 360 px overflow in the probe build was attributed rather than assumed. A
  second throwaway page (`src/pages/smoke37b.astro`, one overflow candidate per
  section, every other section hidden, `documentElement.scrollWidth` per
  section) returned 360 for a `CiBar` in a 32 px box, a `CiBar` in a 96 px box,
  three chips in a 100 px no-wrap flex box, and a chip in a 60 px box; 564 for a
  seven-column table alone, and 360 for the same table inside `overflow-x-auto`.
  No component forces page width at 360 px — the table did — and the wrapper
  contains it. Two Stage 4 obligations replace the assumption, recorded in
  `docs/architecture.md`: tables need a scroll wrapper, and a `CiBar` needs its
  `min-w-16` floor (64 px) of room, since inside a 32 px box it renders 64 px
  and overhangs its parent by 32 px instead of shrinking. Page and `dist/`
  removed afterwards.



### 2026-09-14 — Stage 3.8: build-time social card (satori → resvg, vendored OFL font)

**Landed**

- `apps/site/scripts/og.ts` (212 lines) now renders the build-time 1200×630
  social card with `satori` and `@resvg/resvg-js`, replacing the old Pillow
  path. It writes `apps/site/dist/og.png` after the Astro build.
- The root `bun run og` command dispatches to `@rack-rate/site`'s `og` script,
  which runs `scripts/og.ts` from `apps/site`; root `bun run build` now runs
  `data:build` → Astro build → `og`, so the card is written last after Astro
  clears `dist/`.
- The bundled font files are verbatim in `apps/site/assets/fonts/`:
  `Lato-Regular.ttf` (656,568 bytes, sha256
  `d636e4683231f931eda222d588e944d082bfd3bdba02f928bee461c0f185b251`),
  `Lato-Bold.ttf` (656,544 bytes, sha256
  `8a0aace75d33794eece4b28187bfc1df0bbd2888b5d8a56e01788c8d65d16be1`), and
  `OFL.txt` (4,407 bytes, sha256
  `74ba064d03f1f1c4a952da936c3eb71866c34404916734de3cae73b34357e59e`).
  The license is SIL Open Font License 1.1 and stays beside the font files;
  satori receives Lato at weights 400 and 700 without synthesising bold.
- The script reads `canvas`, `ink`, `dim`, and `rule` from the `@theme` block
  in `apps/site/src/styles/global.css`; a missing token fails the build. It
  reads the `28 models · 16 plans · 2 benchmark versions` counts through
  `apps/site/src/lib/data.ts`, and prints the origin from the built
  `dist/index.html` canonical link (`marshalfevzi.github.io/rack-rate`).
- The composition is one content stack at the top — wordmark, the two questions
  at 58 px, the counts — above a footer band. The first render spread three
  zones with `space-between`, which stranded the wordmark on its own; the stack
  was regrouped and the type enlarged, and the numbers below are from that
  final card.

**Verified**

- The script asserts that the rendered bytes are a PNG (minimum length and PNG
  signature) and that the IHDR width and height are exactly 1200×630 before
  writing the file.
- Missing `dist/index.html` is fail-closed: the script exits 1 with
  `Missing built site at …/dist/index.html; run the site build first`. The
  restored built index then allows the normal path to run.
- `apps/site/dist/og.png` is 1200×630 and 45,413 bytes, with sha256
  `23677cc0c0657b479ac3c967711b5c1f2162e6847529214152cd3943b1af04ed`.
  Consecutive full `bun run build` runs produced byte-identical cards.
- `bun run check` exits 0 (typecheck, oxlint with every rule at error severity,
  oxfmt clean over 44 files, and `astro check` over 27 files with 0 errors,
  0 warnings, and 0 hints). `bun test` is 72 pass / 0 fail / 231 assertions
  in 7 files. `bun run data:check` exits 0 with `data/derived.json` unchanged
  at sha256 `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`.
  `bun run build` exits 0, produces all 53 routes, and writes `dist/og.png`.
- `bun run quality` remains report-only and exits 1 on pre-existing findings:
  dead-code 27, dupes 10, health 143 above threshold over 605 analysed files,
  and maintainability 89.7. `apps/site/scripts/og.ts` is reported as an
  unreached entry point with its internal helpers, like the Stage-4-pending
  exports in `data.ts`.

**Decisions taken this session**

- The card carries no score or cost figure: an image cannot carry a basis or
  confidence badge, so invariants 4 and 5 would be violated.
- Only `canvas`, `ink`, `dim`, and `rule` are spent in the card. Accent tokens
  name a cost basis and are not used as decorative card chrome.
- The deployment target remains written once in `apps/site/astro.config.mjs`;
  switching to the custom domain does not require a second social-card edit.
- `apps/site/scripts` is now included in the root `tsconfig.json` typecheck
  `include`.

**Still open**

- `bun run build` now completes end to end, including the generated social card.
- Stage 3.9 is next: sitemap, `robots.txt`, favicon, and the `CNAME` path.
- Stages 3.10 and 3.11 remain.

### 2026-09-14 — Stage 3.9: sitemap, generated robots.txt, favicon

**Landed**

- `apps/site/astro.config.mjs` (+4): `integrations: [sitemap()]` from
  `@astrojs/sitemap` 3.7.4, which was already a declared dependency, with a
  two-line comment recording that 404/500 exclusion is the integration's default
  (`STATUS_CODE_PAGES`), so the absent `filter` is a decision rather than an
  oversight. `site`, `base`, `output` and `vite` are byte-identical.
- `apps/site/src/pages/robots.txt.ts` (new, 20 lines): a prerendered endpoint
  returning `text/plain; charset=utf-8` with `User-agent: *`, `Allow: /` and
  `Sitemap: <absolute sitemap index URL>`, the URL built as
  `absoluteUrl(asset("/sitemap-index.xml"), site)` through the 3.3 helpers.
  **Amended against the task text:** the plan asked for `public/robots.txt`. The
  `Sitemap:` line is necessarily absolute, so a static copy would write the
  origin a second time and turn the custom-domain switch into three lines; the
  route keeps it at two. Recorded in PLAN.md's 3.9 line and in
  `docs/architecture.md`.
- `apps/site/public/favicon.svg` (new, 428 bytes, 7 lines): a standalone 32×32
  SVG in the token palette — `canvas` rounded square, 1.5 px `rule` border so it
  keeps an edge on dark browser chrome, three ascending bars in `adjusted`. No
  raster `apple-touch-icon`, no manifest.
- `apps/site/src/layouts/Base.astro` (+1): the favicon link, through
  `asset("/favicon.svg")` with `type="image/svg+xml"`; nothing else in the head
  moved.
- `docs/architecture.md` gained `## Crawl and discovery files` (line 156) and
  its `## Site configuration` CNAME paragraph now names the path, the content
  and why that file is committed last. `AGENTS.md`'s layout block lists
  `apps/site/public/`.

**Verified**

- `bun run build` exit 0: 53 built routes, `dist/sitemap-index.xml`,
  `dist/sitemap-0.xml`, `dist/robots.txt`, `dist/favicon.svg`, and the unchanged
  45,413-byte `dist/og.png` at sha256 `23677cc0…`.
- Sitemap contents were compared as a **set**, not sampled: 52 URLs against the
  52 built `index.html` directories, empty difference in both directions, every
  URL under `https://marshalfevzi.github.io/rack-rate/` ending in `/`, and no
  entry containing `404` or `robots` — the 404 is excluded by the integration's
  default and the `robots.txt` route never enters the list. `robots.txt` reads
  `Sitemap: https://marshalfevzi.github.io/rack-rate/sitemap-index.xml`, which
  is the index file the build actually wrote (the chunk is `sitemap-0.xml`).
- Custom-domain mode measured by copying the config, changing only the two
  documented lines, building, and restoring it (sha256 checked equal afterwards):
  exit 0, `Sitemap: https://rackrate.dev/sitemap-index.xml`, all 52 URLs under
  `https://rackrate.dev/`, and the icon link unprefixed as `/favicon.svg`.
- Favicon: parses as XML, `viewBox="0 0 32 32"`, four `rect`s, rasterised and
  inspected at 32×32; all 53 built HTML pages carry
  `<link rel="icon" href="/rack-rate/favicon.svg" type="image/svg+xml">` with no
  page carrying a differently-prefixed href.
- `bun run check` exit 0 (typecheck, oxlint, oxfmt clean over 45 files, `astro
  check` 28 files with 0 errors / 0 warnings / 0 hints) after one `bun run
  format` pass, which rewrapped the endpoint's `new Response(…)` call. `bun test`
  72 pass / 0 fail. `bun run data:check` exit 0 with `data/derived.json` still
  `7425a331…` — **no published number moved in this session.** Re-building after
  the format pass produced byte-identical `robots.txt` (`518368b9…`) and
  `sitemap-0.xml` (`79943148…`), so formatting changed no output.
- `bun run quality` (report-only, still out of the gate) exits 1 on pre-existing
  findings and is one better than the 3.8 baseline: dead-code 27 → 26 (the new
  route is a reachable entry point; the six Stage-4 components and `data.ts`'s
  awaiting-3.x views are still listed), dupes 10 and health 143 unchanged,
  maintainability 89.7 → 89.8 over 606 analysed files.

**Decisions taken this session**

- `robots.txt` is generated from `site`/`base` rather than committed as a static
  file; a produced file that must agree with the build's own sitemap URL should
  not be a second place the origin is written down.
- The sitemap integration is configured with no options: no `filter` (404/500 are
  already excluded by default and nothing else qualifies), no `lastmod` (it would
  claim a per-page freshness the data cannot support — freshness is a badge dated
  against `derivedGeneratedAt`), and no `changefreq`/`priority`, which crawlers
  ignore.
- `robots.txt` allows everything. Every route is public, no path is
  authenticated, and the 404 is left crawlable: it is absent from the sitemap
  already, and its `noindex` belongs with 6.4's index hygiene.
- The favicon is SVG-only: no raster `apple-touch-icon`, no manifest. Both would
  be new build assets with no requirement behind them in this stage.

**Still open**

- 3.10 and 3.11 remain. 3.10 owns CI and the stale-output guard; the deployed
  base-path check for `robots.txt` and the sitemap is 6.4's, which the new
  architecture section states as an obligation.
- The favicon and sitemap are build outputs; only `public/favicon.svg` is
  committed. `apps/site/public/CNAME` still does not exist, by design.

**Addendum, same stage, measured after the commit**

- The three new files were checked **as served**, not only on disk:
  `astro preview` on the built `dist/` returned 200 with the right types for
  `/rack-rate/robots.txt` (`text/plain`, 92 B), `/rack-rate/sitemap-index.xml`
  and `/rack-rate/sitemap-0.xml` (`text/xml`, 203 B / 4,572 B), and
  `/rack-rate/favicon.svg` (`image/svg+xml`, 428 B). The preview server binds to
  `localhost` (IPv6 `::1`), so a `127.0.0.1` readiness probe never connects even
  though the server is up — a probe artifact, not a site one.
- One claim in `docs/architecture.md` was **overstated and is corrected** rather
  than left standing: the favicon's `rule` border does not give the mark an edge
  on dark browser chrome. Recomputed by WCAG 2.x relative luminance: amber on
  canvas 10.57:1, amber on a dark chrome strip `#202124` 8.8:1, canvas on white
  19.33:1, canvas on `#202124` 1.2:1, border on `#202124` 1.07:1. On dark chrome
  the bars alone carry the mark; on light chrome the square does, and the
  paragraph now says that.
- `/rack-rate/404/` answers 200 under `astro preview` because it serves
  `404.html` for that path directly; the deployed status code is 6.4's concern,
  and the page is absent from the sitemap either way.

### 2026-09-14 — Stage 3.10: CI workflow with a stale-output guard

**Landed**

- `.github/workflows/ci.yml` (new, 46 lines): `push` on `main`,
  `pull_request`, and `workflow_dispatch`; `permissions: contents: read`;
  `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`.
  One job, `verify` (`name: Typecheck, tests, data gate`), runs on
  `ubuntu-latest` with `timeout-minutes: 15`. Its eight steps, in order:
  `actions/checkout@v7`; `oven-sh/setup-bun@v2` with no `with:` block;
  `bun install --frozen-lockfile`; `bun run check`; `bun test`;
  `bun run data:check`; `bun run data:build`; and
  `Compute left committed data unchanged`, whose script is
  `changes="$(git status --porcelain -- data/)"` → print the changes,
  `echo "::error::bun run compute changed data/; commit the regenerated
  files"`, `exit 1`. The setup action reads `packageManager: "bun@1.4.2"`
  from the root `package.json`, so the Bun version is written once.
- Action pins checked live: `actions/checkout` latest release `v7.0.1`,
  `oven-sh/setup-bun` latest `v2.2.0`; the workflow pins the major tag and
  the repository does not require SHA pinning.
- `docs/architecture.md` gained `## Continuous integration` (lines 704–748):
  the job, the step table, the guard semantics, and the decisions.
  `CONTRIBUTING.md` line 16 now names all five commands CI runs (`check`,
  `test`, `data:build`, `data:check`, and the compute-unchanged guard).
- Vercel: nothing to delete. `git ls-files | grep -iE
  'vercel|netlify|now\.json'` printed nothing and no untracked `.vercel`,
  `vercel.json`, or `now.json` exists anywhere; the predecessor's
  `vercel.json` was already removed in Stage 1.5.

**Verified**

- Clean-clone simulation (macOS, warm Bun cache; `git clone . /tmp/rr-ci310`,
  workflow copied in, no `.env`, `AA_API_KEY` unset): every step exit 0.
  Timings: `bun install --frozen-lockfile` 0.52 s, `bun run check` 9.44 s,
  `bun test` 0.12 s, `bun run data:build` 0.13 s,
  `bun run data:check` 0.07 s, guard 0.04 s. `data:build` reported
  `no problems`, pairs 178, best routes 28, cross-check pairs 11,
  composite coverage 12 models at k ≥ 2 and 16 single-source, frontier
  api 28 points / 6 frontier, 178 token-allowance rows and 178 badge rows.
  `data:check` compared expected and committed sha256
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`
  and reported the file current.
- Negative controls in that clone: editing `data/derived.json`'s
  `generated_from.models` 28 → 29 made `bun run data:check` exit 1 naming
  the staleness (`first differing top-level key generated_from`, committed
  hash `8b0dc36504e063e844f477eacedcd4b7f26e2cf7d9327471c5330ef19dfe1a56`);
  the same uncommitted edit made the guard exit 1, printing
  ` M data/derived.json` and the `::error::` line; after
  `git checkout -- data/derived.json`, the guard exited 0. Temp dirs were
  removed; `data/derived.json` remained `7425a331…`.
- Node-free: `env PATH=/tmp/bunonly:/usr/bin:/bin bash -c
  'command -v node || echo NO_NODE; bun run check'` printed `NO_NODE` and
  `Result (28 files): 0 errors / 0 warnings / 0 hints`, exit 0 — the
  measured reason the workflow carries no `actions/setup-node`.
- Real GitHub Actions run:
  [run 34802515011](https://github.com/marshalfevzi/rack-rate/actions/runs/34802515011),
  workflow `CI`, event `pull_request`, head branch `ci/3.10-verify` at
  commit `9765e3e`, created `2026-09-14T03:24:40Z`, job
  `Typecheck, tests, data gate` `03:24:43Z` → `03:25:06Z` (23 s),
  **conclusion success**: all eight steps succeeded, as did both action
  post-steps. It was triggered by a temporary draft PR (#1) opened to fire
  the `pull_request` event, because the `push` trigger only fires on `main`
  and local `main` has not been pushed (`origin/main` is still `104c618`).
  Both verification branches and their draft PRs are scaffolding, removed
  after this entry lands.
- The reorder was re-verified on
  [run 34802795461](https://github.com/marshalfevzi/rack-rate/actions/runs/34802795461)
  (`ci/3.10-verify2` at `a9ed386`, job `03:29:48Z` → `03:30:08Z`, 20 s,
  **success**): the run's own step list reads `Derived data is not stale`
  (7) then `Data build (validate + compute)` (8) then
  `Compute left committed data unchanged` (9), so the ordering in the
  committed file is what executed, not just what was written.
- Repo gates after landing: `bun run check` exit 0 (typecheck, oxlint, oxfmt
  clean over 46 files, `astro check` 28 files 0 errors / 0 warnings /
  0 hints), `bun test` 72 pass / 0 fail / 231 assertions in 7 files,
  `bun run data:check` exit 0 with `data/derived.json` still
  `7425a331…` — no published number moved. `bun run quality`
  (report-only, out of the gate) exits 1 on the unchanged baseline:
  dead-code 26, dupes 10, health 143 above threshold over 606 analysed
  files, maintainability 89.8. Adding the workflow introduced no fallow
  finding.

**Decisions taken this session**

- No `bun run build` step: task 3.10's list is the CI gate, and Stage 6.1's
  deploy workflow owns `bun run build` + `withastro/action`.
- No `actions/setup-node` step: the check path is Bun-only, measured above;
  the image ships Node anyway, so the absent pin is a documented
  non-requirement.
- The guard uses `git status --porcelain` rather than `git diff`, so a newly
  created untracked file under `data/` also fails the job.
- `bun run data:check` stays beside the guard: it is the staleness gate the
  docs already advertise and it exercises the CLI's own in-memory
  re-derivation, while the guard covers the `compute` write path.
- `data:check` runs **before** `data:build`, not after. `compute` rewrites
  `data/derived.json`, so checking afterwards would compare a file the job had
  just repaired and report a stale commit as current — the staleness would
  survive only as a guard failure with a less direct message. The order was
  caught in review of the first draft, which had the two steps the other way
  round; the guard still covers the write path, and the in-memory comparison
  now sees the committed bytes.
- The Bun version has one home, `package.json`'s `packageManager`, read by
  `setup-bun`; the workflow carries no second copy.
- No dependency-cache step: `bun install --frozen-lockfile` is a small share
  of the job and a cache key is one more thing that can be wrong.
- CI stays read-only and offline beyond the lockfile install — no secrets,
  no fetcher, no `.env` in a clean clone — so invariants 9 and 10 hold by
  construction.

**Still open**

- 3.11 remains: `/method` and the sources page still owe the real formulas
  and the full attribution block.
- The `push: branches: [main]` trigger has not fired yet: local `main` is
  unpushed, so the first live use of that trigger is the owner's next push
  to `main`; the job content itself is verified on `9765e3e`.
- `bun run build` (Astro build → `og`) is deliberately outside CI; 6.1's
  deploy workflow buys it.
- CI's `validate`/`compute` run with Artificial Analysis unset, so the
  AA-enabled publication path remains exercised by hand only.

### 2026-09-14 — Stage 3.11: the method and sources pages, and the template-whitespace repair

**Landed**

- `apps/site/src/pages/method.astro` went from a 12-line skeleton to 386 lines
  and five sections — "Cost per task", "The three cost bases", "Score
  normalization and the composite", "Pareto frontier", "Missing data,
  confidence and freshness" — carrying the quota conversion branches with the
  committed field names read from `quotaModelDocs`, the route-cost and
  rolling-window day formulas, the token-allowance view with
  `DEFAULT_INPUT_OUTPUT_BLEND` and `CACHE_TIER_CAVEAT`, the committed weights
  joined to their benchmark id/version/title, the composite coverage counts,
  the Pareto domination and distance definitions with the committed API-list
  frontier size, the four confidence levels, and the freshness rule with its
  reference moment. Every figure is a core export or a value read from a
  committed document at build time; nothing on the page is typed.
- `apps/site/src/pages/sources.astro` (145 lines) renders the Artificial
  Analysis state first, then all 11 committed sources with licence, URL,
  retrieval date judged by the one freshness rule, `covers`, `changes`,
  credited contributor, notes and a contribution verdict, then the verbatim
  attribution block, the 7 committed plan known-gaps as "deliberately left
  out", and the standing commitments.
- `packages/core` gained the identifiers the pages would otherwise retype:
  `COMPOSITE_CENTER = 50` and `COMPOSITE_SPREAD = 10` in `normalize.ts` (now
  used by the composite and both CI endpoints), `DAYS_PER_MONTH = 30` and
  `HOURS_PER_DAY = 24` in `cost.ts`, and `ARTIFICIAL_ANALYSIS_BENCHMARK_ID`,
  `ARTIFICIAL_ANALYSIS_SOURCE_ID` and `BENCHMARK_SOURCE_IDS` in `schema.ts`.
- `packages/data-cli`'s AA publication gate (`validate.ts`) and `sources.ts`
  compare against those constants; `sources.ts` lost its private `AA_SOURCE_ID`
  and its three hard-coded benchmark branches.
- `apps/site/src/lib/provenance.ts` gained `requiredAttribution` (returns the
  licence's attribution string or throws naming the id) and
  `artificialAnalysisState` (derives the build's AA state from whether a
  committed benchmark carries the AA id, because `apps/site` cannot read
  `AA_PUBLISH`); `data.ts` gained `contributingSourceIds`, built once from
  `models[].evidence`, `plans[].evidence`, `plans[].sources` and the
  benchmark→source map. `provenance.test.ts` grew by four synthetic-input
  cases.
- `docs/architecture.md` gained `## Method and sources pages` (lines 517–605)
  and `## Template whitespace` (lines 628–681).

**The whitespace repair (incidental, pre-existing defect)**

Astro drops a whitespace run that contains a newline between a text node and an
adjacent tag — it is not collapsed to one space, it disappears. The rule was
measured on a throwaway probe page with eight boundary cases and is recorded in
`docs/architecture.md`. Three consequences were found and fixed:

- `Base.astro`'s attribution footer rendered
  `Datacurve) —<a …>https://deepswe.datacurve.ai/</a>— and Terminal-Bench` with
  both em-dash boundaries glued, on all 52 built pages. That is the footer
  invariant 8 leans on; six element starts were merged onto their text line and
  two closing-anchor boundaries got an explicit space.
- `FreshnessBadge` rendered `Freshretrieved 2026-09-09` and `CostBasisChip`
  `API list/task`; both carry an explicit space now, and the chips read
  `API list /task` — the reading the Stage 3.7 probe recorded as intended.
- The new `/method` had 15 of its own glued boundaries; all were fixed before
  the page was verified.

A rescan of every built `index.html` after the repair leaves only intentional
adjacencies (`Committed field:<code class="ml-1">`, `<a class="ml-1 …">`, and
`SourceLink`'s `sr-only` suffix), and the built-HTML gate now asserts the
absence of `<code>`/`<span>`/`<a>` glue.

**Accuracy clauses the page review added**

Reading the shipped code against the drafted copy turned up three places where
the page would have documented the arithmetic imprecisely, all corrected before
verification: the pair gates (`available` plus `model_scope` plus a positive
task count, not "every model-and-plan combination"), the standard deviation
being a population SD, and the composite CI being reported only when every
contributing benchmark supplies an interval.

**Verified**

- `bun run check` exits 0: typecheck, oxlint with every rule at error severity,
  `oxfmt --check` clean over 46 files, `astro check` over 28 files with 0
  errors, 0 warnings, 0 hints.
- `bun test` reports 76 pass, 0 fail, 239 assertions in 7 files (72 pass and
  231 assertions at 3.10; the four new cases are the two helpers' coverage).
- `bun run data:check` exits 0 and `data/derived.json` is still sha256
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`: **the
  constant extraction moved no published byte.**
- `bun run build` exits 0 with 53 routes, and `dist/og.png` is still sha256
  `23677cc0c0657b479ac3c967711b5c1f2162e6847529214152cd3943b1af04ed` at
  1200×630 — the social card is deterministic across the stage.
- A throwaway built-HTML gate (67 assertions, deleted afterwards) read
  `data/*.json` independently of the site modules and compared it with the
  emitted HTML: the verbatim attribution appears exactly once with its three
  lines intact, all 11 sources render with their own URL and licence and the
  independently computed contribution verdict, the shipped AA branch states the
  disabled state, the two-key gate and links `CAVEATS.md`, and `/method`
  carries `50 + 10 × weighted_z`, `tasks_per_month / 30`, `3:1`,
  `stale after 14 days`, the two committed weights, 12 composites, 16
  suppressed rows, 28 API-list points, 6 frontier ids and `113 committed
  tasks`. The gate is falsifiable: it failed on the missing `CAVEATS.md` link
  before that link was added, and mutating the emitted badge or chip whitespace
  makes its whitespace assertions fail (0 → 2 glued sites).
- Browser, headless Chromium against `astro preview` on the built `dist/` at
  the real `/rack-rate` prefix: at 360 px both pages report
  `documentElement.scrollWidth` 360 with `clientWidth` 360, zero elements past
  the viewport, one `<main>`, one `<h1>`, zero `<script>`; `/sources`'s
  attribution block measures 3 text lines. At 1280 px `/sources` renders 11
  cards and a 992 px attribution block with no overflow. Rendered text was read
  back from the DOM, which is how the badge and chip glue was caught.
- `bun run quality` (report-only, out of the gate) exits 1 on the pre-existing
  findings but improves on the 3.10 baseline: dead-code 26 → 17, dupes 10
  unchanged, health 143 above threshold over 623 analysed files,
  maintainability 89.8 → 90.5.

**Still open**

- Stage 4 (4.1–4.15) is next: the charts, tables, and the model, plan, compare
  and explore pages. `/method` and `/sources` were the two pages that could
  land before them, and they now do.
- Every Stage 4 template inherits the whitespace obligation in
  `docs/architecture.md`: a visible space at a line boundary between text and a
  tag stays on that line or is written `{" "}`.
- The 404 route still carries a canonical for a path with no page and no
  `noindex`; that is 6.4's, unchanged by this stage.
- `bun run quality` stays report-only; it is not a gate.
- The `push: branches: [main]` CI trigger has still not fired: local `main` is
  unpushed, so the first live use of that trigger is the owner's next push.
