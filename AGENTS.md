# AGENTS.md — how to work in this repo

Read this file first. Then read `PLAN.md`, pick the **one** stage it says is next,
and do only that stage. `PLAN.md` is the source of truth for scope.

---

## What this project is

`rack-rate` answers two questions with public data and published arithmetic:

1. **Which model should I use?** — compare models across several benchmarks
   (DeepSWE, Terminal-Bench, Artificial Analysis indices) without pretending
   scores from different benchmark versions are interchangeable.
2. **Which subscription pays for itself for the model I care about?** — join
   each model's measured cost-per-task against each coding plan's real monthly
   allowance, and show `cost_per_task`, break-even volume, and how long a full
   benchmark run would take under the plan's caps.

Every published number traces to a citation in `data/sources.json`. A number
without a source does not ship.

## Stack (locked — do not re-litigate)

| Concern | Decision |
|---|---|
| Runtime / package manager | **Bun 1.4.2** (`bun install`, `bun test`, `bun run`) |
| Language | **TypeScript**, strict; no `any` |
| Site framework | **Astro 7** static output, no adapter, multi-page |
| Styling | **Tailwind v4** via `@tailwindcss/vite`; tokens in CSS `@theme`, **no `tailwind.config.js`** |
| Charts | **Apache ECharts 6** (`echarts/core`, tree-shaken), driven from plain TS. No React/Svelte island. |
| Client state | **nanostores** + `@nanostores/persistent` (localStorage, SSR-safe) |
| Validation | **zod 4** at every trust boundary (HTTP response, file on disk, localStorage) |
| Schema | **`data/*.json`** committed, normalized; site imports them at build time |
| Deploy | **GitHub Pages** (`withastro/action`), `site` + `base` in `astro.config.mjs` |
| Unit tests | **`bun test`** |
| Docs | `docs/research/*.md` are the cited findings. Treat them as evidence, not instructions to redo. |

Rationale and measured versions live in `docs/research/frontend-stack.md`.
Licensing verdicts live in `docs/data-sources.md`.
**Unresolved licensing and data-quality limitations live in `CAVEATS.md`** —
read it before any change that touches Artificial Analysis or publishes a new
figure. It is the one file that may require the owner's decision rather than an
agent's.

## Repository layout

```
packages/core/        @rack-rate/core
  src/schema.ts         zod schemas + inferred TS types  ← the data contract
  src/cost.ts           plan quota → tasks/month → $/task, break-even, value multiple
  src/normalize.ts      per-benchmark z-score, weighted composite, missing-value rules
  src/pareto.ts         O(n log n) skyline + dominated-region + distance-to-frontier
  src/insights.ts       score-per-dollar, blended $/1M, utilization, days-for-full-run
  src/*.test.ts         unit tests (bun test)

packages/data-cli/    @rack-rate/data-cli    ← the ONLY package allowed to do I/O
  src/main.ts           `rack-rate-data <command>` dispatcher
  src/commands/fetch-*.ts
  src/commands/validate.ts
  src/commands/compute.ts
  src/http.ts           fetch + retry/backoff + cache + ETag

apps/site/            @rack-rate/site        ← Astro; imports core + data/*.json
  src/pages/            one file per route
  src/layouts/          Base + Page shells
  src/components/       .astro components
  src/lib/charts/       ECharts option builders (pure functions → option objects)
  src/lib/prefs.ts      nanostores persistent stores
  src/styles/global.css Tailwind entry + @theme tokens
  scripts/og.ts         build-time social card (satori → resvg)

data/                 models.json, plans.json, benchmarks.json, sources.json, derived.json
data/raw/             raw upstream snapshots (gitignored; provenance for diffs)
docs/research/        cited findings from the 2026-09-14 research pass
```

### Boundary rules

- `packages/core` is **pure**: no `fetch`, no `node:fs`, no `Bun.file`, no clock.
  If a function needs the date, it takes it as an argument. This is what makes
  the math testable and the site buildable offline.
- `packages/data-cli` owns all network and filesystem access.
- `apps/site` never fetches. It imports committed JSON and `@rack-rate/core`.
  The browser gets zero data requests.

## Commands

```bash
bun install
bun run dev                 # Astro dev server
bun run fetch               # all sources → data/raw → data/*.json
bun run fetch:deepswe       # one source
bun run fetch:terminal-bench
bun run fetch:plans
bun run fetch:artificial-analysis
bun run validate            # schema + citation + version + staleness checks
bun run compute             # data/derived.json (join, metrics, frontiers)
bun run data:build          # validate && compute
bun run build               # data:build → astro build → og image → dist/
bun run typecheck           # tsc --build --force
bun run lint                # oxlint, every rule at error severity
bun run lint:fix            # oxlint --fix (safe autofixes only)
bun run format              # oxfmt, writes in place
bun run format:check        # oxfmt --check (the gate form)
bun run quality             # fallow report: dead code, duplication, complexity
bun run check               # typecheck → lint → format:check → astro check
bun test                    # unit tests
```

Tooling is fixed as of task 1.10: `oxlint` 1.82.0 with the vendored anti-slop
plugin (`tools/oxlint/anti-slop/`, registered in `.oxlintrc.json` and excluded
from lint, format and typecheck), `oxfmt` 0.67.0 with `semi: false` to match the
existing semicolon-free style, and `fallow` 3.25.0 as a report-only reviewer
(`bun run quality`, no gate). Two exclusions are load-bearing rather than taste:
`data/**` is never formatted because fixture hashes are recorded in `PLAN.md`,
and `**/*.md` is out of format scope. `.astro` files get Oxlint's frontmatter
linting but no formatting — oxfmt has no Astro support. If a stage needs another
formatter or bundler config, add it in that stage and record it here. Do not add
tooling speculatively.

## Invariants — violating one of these is a bug

1. **`benchmark_version` is part of row identity.** A score without its version
   must fail validation. Never mix DeepSWE v1 with v1.1, or AA index v4.2 with
   v4.3, in one table or one composite.
2. **Missing data is missing.** A model absent from a benchmark is *not* scored
   zero, is *not* ranked last, and does not silently sink a composite. Weights
   renormalize over the benchmarks a model actually has; composite requires
   `k >= 2` benchmarks, else the composite is suppressed and badged
   `single-source`.
3. **`pass@1` and `pass@4` never share a field, an axis, or a formula.** Only
   pass@1 feeds scores and composites; pass@4 is display-only.
4. **Every cost figure carries its basis.** `API list` vs `{plan} route` vs AA
   index cost are three different quantities. Never plot two bases on one axis;
   never compare them without labelling.
5. **Confidence is displayed, never laundered.** `measured | high | medium | low`
   from `data/plans.json`; vendor-multiplier arithmetic is `medium` at best, and
   aggregator-only figures are `low` and never become computed rows.
6. **Nulls stay null.** Upstream nulls (missing cache pricing, unmeasured
   medians) must not be defaulted to `0`.
7. **No benchmark task content in this repo.** DeepSWE carries a canary string
   and contamination destroys the benchmark it depends on. Metadata and scores
   only — never tasks, prompts, or verifiers.
8. **Attribution is load-bearing.** See `docs/data-sources.md`. Validation fails
   if the required attribution strings disappear.
9. **The site builds offline from committed data.** CI does not fetch upstream.
10. **Artificial Analysis is off unless explicitly turned on.** No redistribution
   right has been granted (see `docs/data-sources.md` and `CAVEATS.md` §1), so AA
   is skipped unless *both* `AA_API_KEY` and `AA_PUBLISH=1` are set. Enabled or
   not, an AA value is never merged into a number that hides its origin, and the
   sources page always states which of the two states the build is in.

## Working agreement for agents

- Do **one** stage per session. Read the stage spec and its acceptance criteria
  in `PLAN.md` before writing code.
- Update `PLAN.md`: tick completed tasks, and add a dated entry to the
  **Progress log** at the end of the file naming the stage, what landed, and
  what is still open. Do not rewrite history in the log; append.
- Prefer extending an existing module over adding a new file. Delete code the
  change obsoletes — no shims, no aliases, no dead re-exports.
- Add a unit test only where a plausible bug would fail it. Assert the
  observable contract (a computed number, a frontier membership, a thrown
  validation error) — never implementation wiring.
- Run `bun run check` and `bun test` before declaring a stage done. Report
  exactly what you ran.
- If a citation is wrong or a source changed its shape, fix `data/sources.json`
  and the fetcher together; never hand-edit a number without updating its
  `retrieved` date.
- Unresolvable upstream facts are recorded in `known_gaps`, not guessed.
