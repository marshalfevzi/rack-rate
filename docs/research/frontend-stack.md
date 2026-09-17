# Frontend stack research

**Verdict:** Ship Astro 7 + Tailwind v4 (`@tailwindcss/vite`, no `tailwind.config.js`) + tree-shaken Apache ECharts (`echarts/core`, plain TS, no framework) + Bun package manager + `withastro/action@v6` GitHub Pages deploy + `nanostores`/`@nanostores/persistent` preferences + `satori` + `@resvg/resvg-js` OG pipeline; delete `vercel.json`.

Retrieval date for all live URLs below: **2026-09-14**. Anything not directly observed is marked `[UNVERIFIED]`.

## 1. Endpoints

No REST data API is involved in this report — the "endpoints" are the npm registry documents and official docs pages actually fetched:

| #   | Exact URL (GET, no auth)                                                                          | What it proved                        | Key excerpt (trimmed, real)                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `https://registry.npmjs.org/astro/latest`                                                         | Astro current major + version         | `"name": "astro", … "version": "7.3.2"`, `engines: { node: ">=22.12.0" }`                                                                                                                                                                    |
| 2   | `https://registry.npmjs.org/tailwindcss/latest`                                                   | Tailwind current major + version      | `"name": "tailwindcss", "version": "4.3.3"`                                                                                                                                                                                                  |
| 3   | `https://registry.npmjs.org/bun/latest`                                                           | Bun (npm shim) version                | `"name": "bun", "version": "1.4.2"`                                                                                                                                                                                                          |
| 4   | `https://registry.npmjs.org/@tailwindcss%2Fvite/latest`                                           | Vite plugin version, Vite peer range  | `"version": "4.3.3"`, `peerDependencies: { "vite": "^5.2.0                                                                                                                                                                                   |     | ^6     |     | ^7                                                                      |     | ^8" }`, deps pin `tailwindcss: 4.3.3` |
| 5   | `https://registry.npmjs.org/@astrojs%2Ftailwind/latest`                                           | Legacy integration is stale           | `"version": "6.0.2"`, `peerDependencies: { "astro": "^3.0.0                                                                                                                                                                                  |     | ^4.0.0 |     | ^5.0.0", "tailwindcss": "^3.0.24" }` — Tailwind v3 only, Astro 7 absent |
| 6   | `https://registry.npmjs.org/echarts/latest`                                                       | ECharts version                       | `"version": "6.1.0"`, `license: Apache-2.0`, `module: index.js`, tree-shake entry `core.js` / `./core`                                                                                                                                       |
| 7   | `https://registry.npmjs.org/chart.js/latest`                                                      | Chart.js version                      | `"version": "4.5.1"`, `license: MIT`                                                                                                                                                                                                         |
| 8   | `https://registry.npmjs.org/@observablehq%2Fplot/latest`                                          | Plot version                          | `"version": "0.6.17"`, `license: ISC`, deps `d3@^7.9.0`                                                                                                                                                                                      |
| 9   | `https://registry.npmjs.org/uplot/latest`                                                         | uPlot version                         | `"version": "1.6.32"`, `license: MIT`, `module: ./dist/uPlot.esm.js`                                                                                                                                                                         |
| 10  | `https://registry.npmjs.org/recharts/latest`                                                      | Recharts version                      | `"version": "3.10.1"`, `license: MIT`, `peerDependencies: { react: ^16.8–^19 }`                                                                                                                                                              |
| 11  | `https://registry.npmjs.org/@nivo%2Fcore/latest`                                                  | Nivo core version                     | `"version": "0.99.0"`, `license: MIT`, `peerDependencies: { react: ^16.14                                                                                                                                                                    |     | ^17    |     | ^18                                                                     |     | ^19 }`                                |
| 12  | `https://registry.npmjs.org/@visx%2Fvisx/latest`                                                  | visx bundle version                   | `"version": "4.0.0"`, `license: MIT`, `peerDependencies: { react: ^18                                                                                                                                                                        |     | ^19 }` |
| 13  | `https://registry.npmjs.org/layerchart/latest`                                                    | LayerChart version                    | `"version": "2.5.0"`, `license: MIT`, `peerDependencies: { svelte: ^5.0.0 }`                                                                                                                                                                 |
| 14  | `https://registry.npmjs.org/nanostores/latest`                                                    | nanostores version                    | `"version": "1.5.3"`, `license: MIT`, `sideEffects: false`                                                                                                                                                                                   |
| 15  | `https://registry.npmjs.org/@nanostores%2Fpersistent/latest`                                      | persistent engine version             | `"version": "1.3.5"`, `peerDependencies: { nanostores: ^0.9–^1.0 }`                                                                                                                                                                          |
| 16  | `https://registry.npmjs.org/astro-og-canvas/latest`                                               | OG integration version                | `"version": "0.13.1"`, deps `canvaskit-wasm@^0.42.0`, `peerDependencies: { astro: ^5                                                                                                                                                         |     | ^6     |     | ^7 }`                                                                   |
| 17  | `https://registry.npmjs.org/satori/latest`                                                        | satori version                        | `"version": "0.33.4"`, `license: MPL-2.0`                                                                                                                                                                                                    |
| 18  | `https://registry.npmjs.org/@resvg%2Fresvg-js/latest`                                             | resvg version                         | `"version": "2.6.2"`, `license: MPL-2.0`                                                                                                                                                                                                     |
| 19  | `https://registry.npmjs.org/sharp/latest`                                                         | sharp version                         | `"version": "0.35.4"`, `license: Apache-2.0`                                                                                                                                                                                                 |
| 20  | `https://registry.npmjs.org/@astrojs%2Fsitemap/latest`                                            | sitemap integration                   | `"version": "3.7.4"`, deps `sitemap@^9.0.0`                                                                                                                                                                                                  |
| 21  | `https://registry.npmjs.org/typescript/latest`                                                    | TS current                            | `"version": "7.0.2"`, `license: Apache-2.0`                                                                                                                                                                                                  |
| 22  | `https://bundlephobia.com/api/size?package=echarts@6.1.0`                                         | Full-bundle ceiling                   | `size: 1114829, gzip: 367958` (≈1.06 MB min / ≈359 kB gzip, **full** bundle, not tree-shaken)                                                                                                                                                |
| 23  | `https://bundlephobia.com/api/size?package=chart.js@4.5.1`                                        | Chart.js size                         | `size: 200823, gzip: 68404` (≈201 kB / ≈67 kB gzip)                                                                                                                                                                                          |
| 24  | `https://bundlephobia.com/api/size?package=uplot@1.6.32`                                          | uPlot size                            | `size: 50830, gzip: 21856` (≈51 kB / ≈21 kB gzip)                                                                                                                                                                                            |
| 25  | `https://bundlephobia.com/api/size?package=recharts@3.10.1`                                       | Recharts size (excl. react)           | `size: 561681, gzip: 147530` (≈562 kB / ≈144 kB gzip)                                                                                                                                                                                        |
| 26  | `https://tailwindcss.com/docs/installation/framework-guides/astro`                                | Official Astro+TW install             | `npm install tailwindcss @tailwindcss/vite` → `vite: { plugins: [tailwindcss()] }` → `@import "tailwindcss";` in `global.css`                                                                                                                |
| 27  | `https://tailwindcss.com/docs/dark-mode`                                                          | v4 dark-mode override                 | `@import "tailwindcss"; @custom-variant dark (&:where(.dark, .dark *));`                                                                                                                                                                     |
| 28  | `https://docs.astro.build/en/guides/deploy/github/`                                               | Pages deploy guide (site/base, CNAME) | `site: 'https://astronaut.github.io'`, `base: '/my-repo'`, `public/CNAME` with one-line domain                                                                                                                                               |
| 29  | `https://github.com/withastro/action` (repo README)                                               | Current action version                | Example uses **`withastro/action@v6`** + `actions/deploy-pages@v5`; inputs `path`, `node-version` (default 24), `package-manager` (auto-detect, accepts `bun@latest`), `build-cmd`, `out-dir` (default `dist`)                               |
| 30  | `https://docs.astro.build/en/concepts/islands/`                                                   | Islands semantics                     | Default: every UI component renders to HTML+CSS with **zero client JS**; interactivity only via `client:*` (`client:load`, `client:idle`, `client:visible`, …)                                                                               |
| 31  | `https://docs.astro.build/en/guides/routing/`                                                     | File-based routing                    | `src/pages/index.astro → /`, `about.astro → /about`, `getStaticPaths()` for dynamic SSG routes                                                                                                                                               |
| 32  | `https://github.com/nanostores/persistent` (repo README)                                          | Persistent-store API                  | `persistentAtom` / `persistentJSON` / `persistentMap` / `persistentBoolean`, `encode/decode`, `listen` cross-tab flag, SSR-safe, `setPersistentEngine`                                                                                       |
| 33  | `https://github.com/vercel/satori` (repo README)                                                  | satori subset model                   | JSX→SVG, Yoga flexbox subset, fonts passed as `ArrayBuffer`, PNG via resvg/sharp afterwards                                                                                                                                                  |
| 34  | `https://raw.githubusercontent.com/withastro/astro/main/packages/astro/CHANGELOG.md` (lines 1–80) | Astro 7.3.x currency                  | Top entries `7.3.2`, `7.3.1`, `7.3.0` — confirms 7.x is the live major                                                                                                                                                                       |
| 35  | Local repo files `vercel.json`, `scripts/make_og.py`                                              | Current deploy + OG baseline          | `vercel.json`: `{"outputDirectory":"site","cleanUrls":true,"trailingSlash":false}`; `make_og.py`: Pillow 1200×630 card, palette `BG #0A0E15 / ADJ #FFB020 / MEASURED #45D97F`, reads `data/derived.json → best_routes`, writes `site/og.png` |
| 36  | GitHub release pages (title + byline)                                                             | Publish dates                         | astro@7.3.2 released **2026-09-08**; tailwindcss v4.3.3 released **2026-07-16**; bun v1.4.2 released **2026-09-05**; echarts 6.1.0 released **2026-05-19**                                                                                   |

Pagination / rate limits / auth: npm registry (`registry.npmjs.org`) and bundlephobia size API need no auth; bundlephobia returned **HTTP 429** for `@observablehq/plot@0.6.17`, `@nivo/scatterplot@0.99.0`, `layerchart@2.5.0` on 2026-09-14 — sizes for those are sourced from search excerpts / marked estimates (see chart table). Docs pages need no auth. No pagination applies.

## 2. Schema

### 2a. Pinned stack (versions observed 2026-09-14)

| Field                    | Type                     | Meaning                                                      | Publish date (source)                                                                           | Nullable / notes                                                                                   |
| ------------------------ | ------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `astro`                  | semver pin, e.g. `7.3.2` | Site builder, major **7** (dist-tags: `latest: 7.3.2`)       | 2026-09-08 (github.com/withastro/astro releases `astro@7.3.2`)                                  | Not null; requires Node `>=22.12.0` per registry `engines`                                         |
| `tailwindcss`            | semver pin, e.g. `4.3.3` | Utility CSS, major **4** (`latest: 4.3.3`, `v3-lts: 3.4.19`) | 2026-07-16 (github.com/tailwindlabs/tailwindcss `v4.3.3`)                                       | Not null                                                                                           |
| `@tailwindcss/vite`      | semver pin, e.g. `4.3.3` | Vite plugin that wires Tailwind v4 into Astro                | Same train as tailwindcss 4.3.3 (registry)                                                      | Not null; peer `vite ^5.2                                                                          |     | ^6  |     | ^7                                                           |     | ^8` |
| `bun` (runtime)          | semver, e.g. `1.4.2`     | Runtime + package manager                                    | 2026-09-05 (github.com/oven-sh/bun `bun-v1.4.2`)                                                | Dev/CI pin, e.g. `oven-sh/setup-bun@v2` with `bun-version: 1.4.2`                                  |
| `typescript`             | semver, e.g. `7.0.2`     | Type checker (`latest: 7.0.2`)                               | Registry `latest` 2026-09-14 (exact publish day `[UNVERIFIED]` — release-page date not fetched) | `astro/tsconfigs/*` base configs ship with Astro                                                   |
| `echarts`                | semver pin, e.g. `6.1.0` | Chart library (**recommendation**)                           | 2026-05-19 (github.com/apache/echarts `6.1.0`)                                                  | Import **only** via `echarts/core` + `echarts/charts` + `echarts/components` + `echarts/renderers` |
| `nanostores`             | semver, e.g. `1.5.3`     | Tiny atomic store (framework-agnostic)                       | Registry `latest` 2026-09-14 (day `[UNVERIFIED]`)                                               | `sideEffects: false`                                                                               |
| `@nanostores/persistent` | semver, e.g. `1.3.5`     | localStorage persistence + cross-tab sync                    | Registry `latest` 2026-09-14 (day `[UNVERIFIED]`)                                               | Peer `nanostores ^0.9–^1.0`                                                                        |
| `satori`                 | semver, e.g. `0.33.4`    | JSX→SVG OG renderer                                          | Registry `latest` 2026-09-14 (day `[UNVERIFIED]`)                                               | Needs font `ArrayBuffer`s + PNG encoder                                                            |
| `@resvg/resvg-js`        | semver, e.g. `2.6.2`     | SVG→PNG (Rust, napi)                                         | Registry `latest` 2026-09-14 (day `[UNVERIFIED]`)                                               | Alt: `sharp@0.35.4`                                                                                |
| `@astrojs/sitemap`       | semver, e.g. `3.7.4`     | Sitemap integration                                          | Registry `latest` 2026-09-14 (day `[UNVERIFIED]`)                                               | Requires `site` set in Astro config                                                                |
| `astro-og-canvas`        | semver, e.g. `0.13.1`    | Optional OG integration (canvaskit-wasm)                     | Registry `latest` 2026-09-14 (day `[UNVERIFIED]`)                                               | Peer `astro ^5                                                                                     |     | ^6  |     | ^7`; heavier than satori path — **not** recommended (see §7) |

Runner-up / rejected chart versions observed (for the decision table): `chart.js@4.5.1`, `@observablehq/plot@0.6.17` (npmx: 2025-02-14 `[UNVERIFIED: second-hand excerpt]`), `uplot@1.6.32`, `recharts@3.10.1`, `@nivo/core@0.99.0` (scatter package `@nivo/scatterplot@0.99.0` same train `[UNVERIFIED: inferred, not fetched]`), `@visx/visx@4.0.0`, `layerchart@2.5.0` (peer `svelte@^5`).

### 2b. Astro answers to the assignment's questions (all verified in docs above)

- **Static output:** default. No adapter = static SSG to `dist/`. Multi-page = files under `src/pages/` (see routing doc). No `output: 'static'` line needed (it is the default); be explicit anyway in config for readability.
- **Build-time data:** yes — import local JSON/TS directly in frontmatter (`import derived from '../../data/derived.json'`), or `import { x } from '../../data/computed.ts'`. Vite inlines/bundles at build; zero client cost.
- **Content collections vs raw imports:** collections (`src/content/`, zod schema, `getCollection()`) are for _authored content_ (markdown/data with validation + types). Fetched/numeric pipeline data (`data/*.json` validated by CLI) should be **raw imports**, not collections — collections add schema/sync overhead with no benefit for generated numbers. (Judgment call grounded in the routing/content model; collection API surface `[UNVERIFIED: not re-fetched this session]`.)
- **`site`/`base`:** `site` = canonical origin (required for sitemap + absolute OG URLs); `base` = subpath `/<repo>` when serving from `username.github.io/<repo>`. Always build links with `import.meta.env.BASE_URL` or Astro's `base` handling, never hardcode `/`.
- **Minimal client JS:** default zero JS; add `client:visible` (charts below fold), `client:idle` (filters), `client:load` only for above-fold interactive hero, `client:media` for mobile-only widgets. Prefer **plain `<script>` + `data-*` attributes** over a framework island where possible — a framework runtime (React/Svelte) is the biggest JS cost on this site.
- **Tailwind integration:** official path is the Vite plugin, **not** `@astrojs/tailwind@6.0.2` (peer-pinned to Tailwind v3 + Astro ≤5 — incompatible with this stack).

## 3. Refresh

| Item                        | Cadence observed                                                                               | Staleness detection                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Astro 7.x                   | Patch cadence is brisk (7.3.0 → 7.3.1 → 7.3.2 around 2026-09-08 per CHANGELOG head)            | `bun outdated` / Renovate; pin exact in `package.json`, bump deliberately                               |
| Tailwind 4.x                | Patch train (4.3.x, v4.3.3 on 2026-07-16); v3 maintained as `v3-lts: 3.4.19` tag               | Same; `@tailwindcss/vite` version must equal `tailwindcss` version                                      |
| Bun 1.4.x                   | Release 2026-09-05 for 1.4.2                                                                   | Pin `bun-version` in CI (`oven-sh/setup-bun`); `bun.lock` diff review                                   |
| ECharts 6.x                 | Minor 6.1.0 on 2026-05-19                                                                      | Pin; visual regression via checked-in `og.png` + sample chart snapshot `[UNVERIFIED: process proposal]` |
| Docs (Astro/Tailwind/Pages) | Continuously updated; action README already shows `v6` while the assignment brief guessed `v3` | Re-check `withastro/action` tag yearly; Dependabot for `actions/*` SHAs                                 |
| Bundlephobia numbers        | Live per version; rate-limited (429s seen 2026-09-14)                                          | Re-run size check when bumping chart lib; treat full-bundle number as ceiling only                      |

## 4. License / redistribution verdict

| Package                                                                                                                                          | License (registry source)                          | Attribution / redistribution                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `astro` 7.3.2                                                                                                                                    | MIT                                                | ✅ Can ship site + repo freely; keep `LICENSE` notices for bundled code per MIT.                                                                                                                                     |
| `tailwindcss` 4.3.3, `@tailwindcss/vite` 4.3.3                                                                                                   | MIT                                                | ✅ Same.                                                                                                                                                                                                             |
| `echarts` 6.1.0                                                                                                                                  | **Apache-2.0**                                     | ✅ Can bundle/redistribute in public site + repo; preserve Apache license/notice; no copyleft on our code. (Registry `license` field; full text not re-read — quote: `"license": "Apache-2.0"`.)                     |
| `chart.js`, `uplot`, `recharts`, `@visx/*`, `layerchart`, `nanostores`, `@nanostores/persistent`, `astro-og-canvas`, `@astrojs/sitemap`, `sharp` | MIT / ISC (Plot) / Apache-2.0 (sharp) per registry | ✅ All permissive; same handling. Plot is **ISC** (functionally MIT-equivalent).                                                                                                                                     |
| `satori`, `@resvg/resvg-js`                                                                                                                      | **MPL-2.0**                                        | ✅ _Build-time only_: used in `scripts/og.ts` to render PNG; output PNG is our content, not a derivative of the tool. MPL file-level copyleft does not leak into the static site. No redistribution of their source. |
| Fonts for OG (e.g. Inter/DejaVu)                                                                                                                 | Depends on font (OFL typical)                      | ⚠️ Keep the font's license file in repo and credit in README when bundling a font binary for `satori`. `[UNVERIFIED: exact font choice pending]`                                                                     |
| Benchmark numbers themselves                                                                                                                     | N/A (other scouts own sources)                     | Defer to sibling reports (`AA`, `DeepSWE`, `TerminalBench`, `Insights`, `Plans`, `PriorArt`) for per-source redistribution terms.                                                                                    |

**Verdict: YES, we can redistribute the numbers + ship this stack on a public static site and public repo.** All runtime deps are MIT/ISC/Apache-2.0; the two MPL-2.0 packages are build-time-only.

## 5. Recommended TS fetch strategy

There is no runtime data fetch — all data is build-time local JSON. Concrete strategy:

- **File path:** `src/lib/data.ts` — single typed boundary over `data/*.json`:

```ts
// src/lib/data.ts
import type { Derived } from './schema';
import raw from '../../data/derived.json';

export function loadDerived(): Derived {
  // validate once at build; throw with file+field context on mismatch
  return validateDerived(raw);
}
export function buildPareto(points: Point[]): Point[] { /* sort by $/task, sweep max score */ }
```

- **Function signatures:** `loadDerived(): Derived`, `buildPareto(points: Point[]): Point[]`, `formatUSD(n: number): string`. Keep Pareto math in pure, unit-testable functions (main agent owns validation/tests).
- **Retry/caching:** not applicable at runtime (static import, no network). Build caching: leave `withastro/action` `cache: true` (caches `node_modules/.astro`); Bun install cache via `oven-sh/setup-bun` default. Data freshness comes from the pipeline CLI regenerating `data/*.json` before `astro build` (`"build": "bun run data:build && astro build"`).
- **SSR-safety:** everything runs at build; client components receive only serialized props. `localStorage` access lives strictly inside `client:*` / `<script>` browser code guarded by `typeof window`.

## 6. Gotchas / unknowns

1. **`withastro/action@v3` is stale — use `@v6`.** The brief's `v3` guess is outdated; the live README (2026-09-14) documents `v6` + `actions/deploy-pages@v5`. Manual `upload-pages-artifact` + `deploy-pages` still works but the Astro action (auto-detects `bun.lock` → Bun) is the documented path.
2. **Do NOT use `@astrojs/tailwind`.** Latest is 6.0.2 with peers `tailwindcss ^3` / `astro ^3–^5` — wrong for Tailwind v4 + Astro 7. The Vite-plugin path is the official Tailwind-for-Astro install.
3. **Bun runtime vs Bun package manager.** `bun install` + `bun run build` are safe and recommended. Running the Astro _dev server_ under the Bun runtime has known rough edges (upstream `ws`/Cloudflare-adapter issue withastro/astro#15926; `@astrojs/upgrade` vs text `bun.lock` issue #13065). Irrelevant for static output, but if `bun run dev` misbehaves, fall back to Node for dev while keeping `bun.lock` canonical. `[UNVERIFIED: not reproduced here — from issue search excerpts]`.
4. **`bun.lock` is text since Bun 1.2.0.** Commit it. Ensure no stray `package-lock.json` (the #13065 failure mode). CI must use `oven-sh/setup-bun` + `bun install`, not `withastro/action`'s Node default — or pass `package-manager: bun@latest` to the Astro action.
5. **ECharts SSR trap.** Never import `echarts` at Astro frontmatter top-level for a client chart — initialize inside a browser `<script>` (or `client:visible` island) after mount, with `echarts.init(el)`. The `ssr/client` entry exists but dynamic-import-on-mount is simpler and avoids hydration mismatches.
6. **ECharts full-bundle number is NOT the shipped number.** Bundlephobia's 1.11 MB / 368 kB gzip is the _full_ `echarts` package. Tree-shaken `echarts/core` + Scatter + Radar/Bar + Grid/Tooltip/DataZoom/Graphic + CanvasRenderer is a fraction of that `[UNVERIFIED: exact post-treeshake kB not measured — measure with `vite-bundle-visualizer` at build]`.
7. **Plot/Nivo/LayerChart sizes incomplete.** Bundlephobia 429'd on 2026-09-14 for Plot/Nivo-scatterplot/LayerChart; Plot UMD-min-gzip 204.3 kB comes from a search excerpt, Nivo/LayerChart sizes are qualitative (React/Svelte runtime + d3 externals = heavy). Do not quote precise kB for those without re-checking.
8. **Tailwind v4 dark mode is opt-in override.** Default `dark:` follows `prefers-color-scheme`; a manual toggle needs `@custom-variant dark (&:where(.dark, .dark *));` + a pre-paint inline script to avoid FOUC.
9. **Container queries need the query container marked.** v4 supports `@container` natively, but the component wrapper must carry `@container` class — easy to forget on card grids.
10. **Custom-domain switch removes `base`.** `rackrate.dev` (apex or `www`) → drop `base`, set `site: 'https://rackrate.dev'`, add `public/CNAME`, fix internal links that assumed the subpath. Keep subpath support until the domain is actually live.
11. **`astro-og-canvas` not recommended** despite its Astro peer supporting v7: it pulls `canvaskit-wasm` (~MBs of wasm into the build) for a less flexible renderer than satori. Prefer satori + resvg in a Bun script.
12. **TypeScript 7 risk.** `typescript@7.0.2` is brand-new major on npm `latest`; Astro 7's devDeps still reference TS `^6.0.3`-era tooling in places. Pin TS and let `astro check` prove it; downgrade to 5.9/6.x if `astro check` breaks. `[UNVERIFIED: compatibility not exercised here]`.

## Appendix A — Chart library decision

Rubric: (a) scatter + Pareto/frontier line + shaded dominated region, (b) multi-benchmark radar or grouped bars, (c) brushing/zoom/linked selection, (d) annotations + labeled outliers, (e) mobile touch, (f) TS types, (g) tree-shaken bundle (bundlephobia min/gzip where available), (h) Astro fit (plain TS + DOM vs framework required).

| Library (ver. 2026-09-14)                      | (a) Pareto                                                                                     | (b) Radar/bars                                                   | (c) Brush/zoom/link                                                                | (d) Annotate                                       | (e) Touch                                 | (f) TS                                | (g) Size min / gzip                                                                                                                           | (h) Astro fit                                                         | Notes                                                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Apache ECharts 6.1.0 — ✅ RECOMMEND**        | ✅✅ Custom `line` series for frontier + `markArea`/polygon for shaded region; log axes native | ✅ Radar + bar + scatter in one option                           | ✅ `dataZoom` (inside+slider), `brush` component, `axisPointer` link across charts | ✅ `markPoint/markLine/graphic` text, rich tooltip | ✅ Canvas touch, pinch-zoom               | ✅ First-class generated option types | Full pkg 1115 kB / 368 kB gzip (ceiling); tree-shaken scatter+radar+bar+canvas **[UNVERIFIED: measure at build, expect low-hundreds kB min]** | ✅ Plain TS + DOM, `echarts.init(el)`, dynamic import, zero framework | Apache-2.0; only lib here with _all five_ chart requirements built-in                         |
| Observable Plot 0.6.17 — 🥈 runner-up          | ✅ Grammar makes frontier line + area easy (`Plot.line` + `Plot.area`), SVG-precise            | ✅ Best-in-class small multiples, radar via dot+line composition | ⚠️ No built-in brush/zoom/linked cross-chart state; hand-roll with D3              | ✅ Excellent direct labeling                       | ⚠️ SVG hover fine, pinch-zoom hand-rolled | ✅ Good `.d.ts`                       | UMD-min ≈482 kB / ≈204 kB gzip (search excerpt; ESM tree-shaken less `[UNVERIFIED exact]`)                                                    | ✅ Plain TS + DOM, no framework                                       | ISC; beautiful static charts, but (c) Pareto-linked brushing is DIY — disqualifies as primary |
| Chart.js 4.5.1                                 | ⚠️ Scatter yes; frontier line via 2nd dataset; shaded region via filler plugin (fiddly)        | ✅ Bar yes; radar yes but styling-limited                        | ⚠️ Zoom via external plugin (`chartjs-plugin-zoom`), no linked selection           | ⚠️ Annotation via external plugin                  | ✅ Good touch                             | ✅ Good types                         | 201 kB / 68 kB gzip ✅                                                                                                                        | ✅ Plain TS + DOM                                                     | MIT; needs 2–3 plugins to match ECharts core — plugin version drift risk                      |
| uPlot 1.6.32                                   | ⚠️ Lines/scatter fast but frontier+shading hand-drawn via hooks                                | ❌ No radar; bars basic                                          | ✅ Great cursor/scale sync across charts                                           | ❌ Minimal annotation story                        | ✅ Fast canvas                            | ⚠️ Thin types                         | 51 kB / 22 kB gzip ✅✅                                                                                                                       | ✅ Plain TS + DOM                                                     | MIT; fastest/leanest, wrong shape for (a)+(b)+(d)                                             |
| Recharts 3.10.1                                | ⚠️ Composed frontier possible; shading via `Area` stacking hacks                               | ✅ Bar/radar OK                                                  | ⚠️ BrushX exists, zoom limited, no cross-chart link                                | ⚠️ Label list, custom shapes DIY                   | ✅ OK                                     | ✅ Good                               | 562 kB / 148 kB gzip **+ React** ❌                                                                                                           | ❌ Requires React + island runtime                                    | MIT; pays React tax for less capability than ECharts                                          |
| Nivo (@nivo/scatterplot 0.99 + radar/bar pkgs) | ⚠️ Scatter ok; custom frontier layer DIY                                                       | ✅ Pretty bars/radar                                             | ❌ No brush/zoom story                                                             | ✅ Decent tooltips/labels                          | ✅ OK                                     | ✅ Good                               | Per-package + `@nivo/core` + springs; full set heavy `[UNVERIFIED: 429]`                                                                      | ❌ Requires React                                                     | MIT; beauty > control; Pareto shading is custom-layer work                                    |
| visx 4.0.0                                     | ✅ Can build anything (d3 primitives)                                                          | ✅ Can build anything                                            | ✅ Can build anything                                                              | ✅ Can build anything                              | ⚠️ Hand-rolled                            | ✅ Good                               | Pick-a-la-carte `@visx/*`, but d3 deps add up; full `visx` meta-package heavy                                                                 | ❌ Requires React                                                     | MIT; "build your own chart lib" — weeks of work vs ECharts config                             |
| LayerChart 2.5.0                               | ✅ Composable, could do all                                                                    | ✅ Yes                                                           | ✅ Yes (Svelte stores)                                                             | ✅ Yes                                             | ✅ Yes                                    | ✅ Good (Svelte 5)                    | Svelte 5 + d3; size `[UNVERIFIED: 429]`                                                                                                       | ❌ Requires Svelte 5 + `@astrojs/svelte` island                       | MIT; excellent lib, wrong framework for a zero-JS Astro site                                  |

**Recommendation: Apache ECharts via `echarts/core` tree-shaken imports, driven from plain TypeScript modules (`src/lib/charts/*.ts`) mounted by Astro `<script>` tags — no React/Svelte/Vue integration.** Runner-up: Observable Plot (adopt later for static small-multiple figures if desired; its SVG output can even be server-rendered at build). Reason: the Pareto frontier with shaded dominated region + brushing/zoom/linked selection is a _hard_ requirement, and ECharts is the only candidate with all five visual requirements as first-class config rather than plugins or DIY, while staying framework-free and canvas-fast on mobile.

```ts
// src/lib/charts/pareto.ts — canonical tree-shaken import (ECharts handbook pattern)
import * as echarts from 'echarts/core';
import { ScatterChart, LineChart, RadarChart, BarChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, LegendComponent, DataZoomComponent,
  RadarComponent, GraphicComponent, MarkLineComponent, MarkAreaComponent, MarkPointComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([ScatterChart, LineChart, RadarChart, BarChart, GridComponent, TooltipComponent,
  LegendComponent, DataZoomComponent, RadarComponent, GraphicComponent,
  MarkLineComponent, MarkAreaComponent, MarkPointComponent, CanvasRenderer]);

export function mountPareto(el: HTMLElement, points: Point[], frontier: Point[]): void {
  const chart = echarts.init(el, undefined, { renderer: 'canvas' });
  chart.setOption({
    tooltip: {}, dataZoom: [{ type: 'inside' }, { type: 'slider' }],
    xAxis: { name: '$ / task' }, yAxis: { name: 'score %' },
    series: [
      { type: 'scatter', data: points.map(p => [p.cost, p.score]) },
      { type: 'line', data: frontier.map(p => [p.cost, p.score]) }, // + markArea for shaded region
    ],
  });
  new ResizeObserver(() => chart.resize()).observe(el);
}
```

## Appendix B — Copy-pasteable config

### `astro.config.mjs` (subpath Pages; custom-domain variant in comment)

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Project subpath deploy: https://<user>.github.io/<repo>/
  site: 'https://<user>.github.io',
  base: '/<repo>',
  // Custom domain variant (rackrate.dev): use site: 'https://rackrate.dev'
  // with NO base, plus public/CNAME containing `rackrate.dev`.
  output: 'static',
  vite: { plugins: [tailwindcss()] },
  integrations: [sitemap()],
});
```

### `src/styles/global.css` (Tailwind v4 entry — no `tailwind.config.js`)

```css
@import "tailwindcss";

@theme {
  --color-ink: #eaeef5;
  --color-ink-dim: #a3b0c4;
  --color-panel: #111825;
  --color-bg: #0a0e15;
  --color-adj: #ffb020;
  --color-measured: #45d97f;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}

/* Manual dark toggle (optional; default is prefers-color-scheme) */
/* @custom-variant dark (&:where(.dark, .dark *)); */

/* Container queries for mobile card grids: mark wrappers with @container,
   then use @sm:/@md: variants inside. */
```

### `tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "types": ["astro/client"]
  },
  "include": ["src", "scripts", "data"],
  "exclude": ["dist", "node_modules"]
}
```

### `.github/workflows/deploy.yml` (current: `withastro/action@v6`)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.4.2
      - run: bun install --frozen-lockfile
      - run: bun run build # package.json: "build": "bun run data:build && astro build && bun run og"
      - name: Install, build, and upload your site
        uses: withastro/action@v6
        with:
          package-manager: bun@latest
          # path: .         # uncomment only for monorepo subpath
          # node-version: 24 # Bun supplies the runtime; leave default unless debugging §6.3

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

### `package.json` scripts (Bun)

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "bun run data:build && astro build && bun run og",
    "preview": "astro preview",
    "check": "astro check",
    "data:build": "bun run scripts/fetch.ts",
    "og": "bun run scripts/og.ts",
    "test": "bun test"
  }
}
```

`bun.lock` (text format since Bun 1.2.0) is committed; `bun install --frozen-lockfile` in CI. **Delete `vercel.json`** (`outputDirectory: site`, `cleanUrls`, `trailingSlash`) — it only applies to Vercel; Pages output is `dist/`, trailing-slash behavior is Astro's `trailingSlash` option, clean URLs are automatic for `page.astro → page/index.html`.

### Offline preferences — typed API sketch (`src/lib/prefs.ts`)

```ts
// SSR-safe: module evaluates on server (nanostores uses empty storage),
// localStorage binds lazily in the browser. persistentAtom handles both.
import { persistentAtom, persistentMap } from '@nanostores/persistent';

export const SCHEMA_VERSION = 2;
const K = (s: string) => `rackrate:v${SCHEMA_VERSION}:${s}`;

export const $ignoredModels = persistentAtom<string[]>(K('ignored-models'), [], {
  encode: JSON.stringify, decode: (v) => { try { return JSON.parse(v); } catch { return []; } },
});
export const $ignoredPlans = persistentAtom<string[]>(K('ignored-plans'), [], {
  encode: JSON.stringify, decode: (v) => { try { return JSON.parse(v); } catch { return []; } },
});
export const $paidPlans = persistentAtom<string[]>(K('paid-plans'), [], {
  encode: JSON.stringify, decode: (v) => { try { return JSON.parse(v); } catch { return []; } },
});
export const $currency = persistentAtom<'USD' | 'EUR' | 'GBP'>(K('currency'), 'USD');
export const $weights = persistentMap<Record<string, number>>(K('weights:'), {
  // benchmark-id → weight; migrate on SCHEMA_VERSION bump by renaming K() prefix
});

export function resetPrefs(): void {
  for (const s of [$ignoredModels, $ignoredPlans, $paidPlans] as const) s.set([]);
  $currency.set('USD');
}
// Cross-tab sync: enabled by default (storage events). Disable per-store with { listen: false }.
// Migration: bump SCHEMA_VERSION → old keys orphaned; optionally copy v1→v2 once in code.
```

Yes — `nanostores` + `@nanostores/persistent` is the current best small choice: framework-agnostic (works with plain TS subscriptions, no React needed), ~300 bytes core, SSR-safe by design, per-key or JSON stores, cross-tab sync free. Only rule: never `get()`/`set()` during Astro frontmatter SSR for user-specific values — hydrate defaults at build, apply prefs in browser scripts.

### SEO / OG — replacing `scripts/make_og.py`

- **Sitemap:** `@astrojs/sitemap@3.7.4` (requires `site`). No RSS (no dated content feed planned; revisit if a changelog/blog page appears).
- **404:** add `src/pages/404.astro` (Pages serves it as the 404). Caching: Pages sets its own cache headers; hashed asset filenames from the Astro build give long-cache safety `[UNVERIFIED: exact Pages header values]`; keep `public/CNAME` + `public/robots.txt` + `public/favicon.svg` as static assets.
- **OG image (`scripts/og.ts`, Bun):** read `data/derived.json`, render 1200×630 via `satori@0.33.4` JSX with the same palette as the current Pillow script (`BG #0A0E15`, ink `#EAEEF5`, `ADJ #FFB020`, `MEASURED #45D97F`), rasterize with `@resvg/resvg-js@2.6.2` (pure-Rust, no system Cairo like Pillow needed), write `dist/og.png`. Font: bundle one OFL font (e.g. Inter) and pass its `ArrayBuffer` to satori; keep its license file in repo.

```ts
// scripts/og.ts (sketch)
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import derived from '../data/derived.json';

const cheapest = minBy(derived.best_routes, r => r.cost_per_task_usd);
const svg = await satori(<Card cheapest={cheapest} />, {
  width: 1200, height: 630,
  fonts: [{ name: 'Inter', data: await Bun.file('assets/Inter-Bold.ttf').arrayBuffer(), weight: 700, style: 'normal' }],
});
await Bun.write('dist/og.png', new Resvg(svg).render().asPng());
```

---

_Sources: npm registry documents, bundlephobia size API, tailwindcss.com install/dark-mode docs, docs.astro.build routing/islands/Pages docs, withastro/action README, nanostores/persistent README, vercel/satori README, repo `vercel.json` + `scripts/make_og.py`, GitHub release pages — all retrieved 2026-09-14._
