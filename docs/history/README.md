# Pre-PM history

Frozen record of the plan that preceded `docs/pm/`. Do not rewrite what is here.

| File | What it records |
|---|---|
| [`stages-1-2.md`](stages-1-2.md) | Stage 1 and Stage 2 task lists, acceptance, handover contracts and session log |
| [`stages-3.md`](stages-3.md) | Stage 3, same shape |
| [`stages-4.md`](stages-4.md) | Stage 4, same shape |
| [`retrospective-2026-09-17.md`](retrospective-2026-09-17.md) | The 2026-09-17 plan-review session that archived Stages 3–4, rebuilt the plan and reviewed every task |
| [`design-build-plan.md`](design-build-plan.md) | The Divine Machinery build plan: incumbent diagnosis, frozen implementation contract, risk register |

> **Relocation note (2026-09-17, not a rewrite).** The live plan these files refer to as `PLAN.md`, and
> `docs/architecture.md`, were superseded by `docs/pm/` and `ARCHITECTURE.md` and deleted; recover them with
> `git show d95e6ef:<path>`. `docs/design/build-plan.md` was moved here unchanged.

## Completed stages

Four stages have landed. Their task lists, acceptance criteria, handover
contracts and full session history are in the archive; this is the one-line
record.

- **Stage 1 — Initialization** (`[x]`, 1.1–1.10): Bun workspace with three
  packages, one root `tsconfig.json` (no project references), the zod data
  contract in `packages/core/src/schema.ts`, the migrated `data/*.json` plus the
  `benchmarks.json` skeleton, and the tooling pass (oxlint 1.82.0 with the
  vendored anti-slop plugin, oxfmt 0.67.0, fallow 3.25.0 report-only).
- **Stage 2 — Data points** (`[x]`, 2.1–2.12): `packages/data-cli` owns all
  network and filesystem access; `packages/core` holds pure `cost`, `normalize`,
  `pareto` and `insights`; four fetchers; the `validate` / `compute` / `check` /
  `sources` / `doctor` surface; and the data gate `bun run data:check`.
- **Stage 3 — Static build framework** (`[x]`, 3.1–3.11): the Astro static build
  for the GitHub Pages base path, the two-scheme `@theme` token set with its
  contrast evidence, the layouts and the `href()` / `asset()` link builders, the
  eleven-route page set, the typed accessor over all five committed documents,
  `format.ts` with one rounding rule per unit, the five provenance components
  with one freshness rule, the satori social card, the sitemap plus generated
  `robots.txt` and favicon, CI with a stale-output guard, and `/method` and
  `/sources` rendered from committed formulas and attribution.
- **Stage 4 — Frontend build** (`[x]`, 4.1–4.15): the chart platform — pure
  `(data) => ChartOption` builders, one tree-shaken `echarts/core` registration
  with the `SERIES_INSTALLS` guard, and one mount helper owning `ResizeObserver`,
  `prefers-reduced-motion` and disposal — plus six chart types; `/models`,
  `/models/[slug]`, `/plans`, `/plans/[slug]`, `/compare`, `/` and `/explore`
  with the metric builder and client-side composite recomputation; and the
  360 px accessibility pass. **Placeholder-grade by instruction:** the surface is
  complete and measurable, not pixel-finished, and Stage 5 is the refactor that
  was expected to rewrite it.

### Frozen fixtures and gates

`data/**` is never reformatted: fixture hashes are recorded here.

- `data/fixtures/legacy-derived.json` sha256
  `803cef427a6af2f32ade594518b1806a49bb21fea90cc80fc52684f10bab9ded`;
  `data/fixtures/legacy-derived.csv` sha256
  `6759e509df222e07771b25086a22061d5f701da2da84793fa1ea5af3da98df34`. These are
  the legacy pipeline's frozen output and the port-parity oracle asserted in
  `bun test` against `data/fixtures/legacy-inputs.{models,plans}.json`.
- `data/derived.json` is committed and deterministic; `bun run data:check`
  re-derives it in memory and fails when the committed file is stale.
- Code gates: `bun run check` (typecheck → lint → format:check → astro check)
  and `bun test`.
