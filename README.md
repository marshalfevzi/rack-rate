# Rack Rate

**A hotel's rack rate is the price on the back of the door. Nobody pays it.**

API list pricing is the same instrument: published, high, and often unlike what
people actually pay through a subscription quota.

**[Open the GitHub Pages site](https://marshalfevzi.github.io/rack-rate/)** ·
[method](#the-method) · [data sources and licensing](docs/data-sources.md) ·
[caveats](CAVEATS.md) · [contributing](CONTRIBUTING.md)

Rack Rate joins benchmark results with real coding-plan allowances so the
comparison is useful to people choosing a model and a plan, not just reading a
vendor rate card. Every published figure traces to a citation in
`data/sources.json`; a number without a source does not ship.

## What it answers

1. **Which model should I use?** Compare models across DeepSWE,
   Terminal-Bench, and Artificial Analysis indices without treating scores from
   different benchmark versions as interchangeable.
2. **Which subscription pays for itself for the model I care about?** Compare a
   model's measured cost per task with each coding plan's real monthly
   allowance, then show cost per task, break-even volume, and full-run time
   under the plan's caps.

The site is the reader-facing view of this comparison. It keeps benchmark
provenance, pricing basis, confidence, and unresolved gaps visible instead of
turning them into a single unexplained ranking.

## Where this stands

The live DeepSWE leaderboard is blocked by this build environment's network
egress. Scores in `data/models.json` come from a directly supplied snapshot
recorded as `src-deepswe-data` in `data/sources.json`; they are not a live pull.
The repository does not mirror benchmark tasks, prompts, verifiers, or patches.

## The method

```text
cost_per_task = price_per_month / tasks_per_month
```

`tasks_per_month` comes from the quota unit a provider publishes or that a
contributor measured. Plans retain their quota model, source evidence, pricing
basis, confidence, and any unresolved limitation. The join then compares each
model's API cost with each compatible plan, preserving model scope so a plan
cannot be used to price a model it does not support.

The site imports committed JSON at build time. It never fetches from the
browser, so the built site has no data requests and can be built offline.

## Quickstart

Install dependencies, start the Astro development server, and run the checks:

```bash
bun install
bun run dev
bun run check
bun test
```

`bun run dev` prints the local address to open in a browser. The first two
commands are the normal path for viewing the site; the last two are the gates,
and `bun run check` itself runs `tsc`, oxlint, a formatting check, and
`astro check`.

## Data commands

Run these from the repository root:

```bash
bun run fetch
bun run fetch:deepswe
bun run fetch:terminal-bench
bun run fetch:plans
bun run fetch:artificial-analysis
bun run validate
bun run compute
bun run data:build
bun run og
bun run build
bun run check
bun run lint
bun run format
bun run quality
bun run test
bun run dev
```

- `fetch` refreshes all source inputs; the source-specific commands refresh one
  input.
- `validate` checks schemas, citations, versions, and data-quality rules.
- `compute` joins the validated inputs and writes derived data;
  `data:build` runs validation and computation together.
- `build` builds the data and Astro site. `og` generates the social card with
  satori → resvg via `apps/site/scripts/og.ts`.
- `lint` runs oxlint with every rule at error severity; `lint:fix` applies its
  safe autofixes.
- `format` rewrites files with oxfmt; `format:check` is the non-writing gate
  form.
- `quality` runs the fallow report over dead code, duplication, and complexity.
  It is advisory: it reports findings and is never part of `bun run check`.
- Artificial Analysis is disabled unless both `AA_API_KEY` and
  `AA_PUBLISH=1` are explicitly set. See [CAVEATS.md](CAVEATS.md) before
  enabling it.

## Layout

```text
packages/core/       @rack-rate/core — pure schemas and comparison math
packages/data-cli/   @rack-rate/data-cli — the only package allowed to do I/O
apps/site/           @rack-rate/site — Astro site, built from committed data
data/                committed models, plans, benchmarks, sources, and derived data
docs/                source records, research findings, and architecture notes
```

`packages/core` has no network, filesystem, or clock dependency. The date is an
argument when a calculation needs one. `packages/data-cli` owns network and
filesystem access. `apps/site` imports `@rack-rate/core` and `data/*.json` at
build time.

## Sources and licensing

Read [`docs/data-sources.md`](docs/data-sources.md) for the complete source
record, licenses, retrieval policy, and attribution requirements. Read
[`CAVEATS.md`](CAVEATS.md) for unresolved licensing and data-quality limits,
including the Artificial Analysis position.

- DeepSWE methodology and results are credited to Datacurve under Apache-2.0.
  Only metadata and scores are kept here; benchmark task content is not.
- Measured quotas come from
  [Awesome Coding Plan](https://github.com/mahonzhan/awesome-coding-plan) by
  mahonzhan, **CC BY 4.0**. The source tables were converted into this
  project's plan schema, and that change is identified as required by the
  license.

  > Identification of the creator: mahonzhan@gmail.com
  > License Notice: Licensed under the Creative Commons Attribution 4.0
  > International License.
  > Link to the License: https://creativecommons.org/licenses/by/4.0/

- [`real-api-pricing`](https://github.com/FeiZhuLulu/real-api-pricing) by
  FeiZhuLulu reached a related idea first: pricing usable model work against
  leaderboard results. It is credited as prior art and risk calibration only;
  no figures are copied from it.

Only monthly, non-promotional, non-regional pricing is used, and affiliate
links are not included. The full licensing verdicts and source-level details
remain in [`docs/data-sources.md`](docs/data-sources.md).

## Contributing measured quotas

Measured plan usage is more valuable than an estimate. If you have run a plan
to exhaustion and counted its allowance, a real measurement is welcome.

Open the
[measured-quota issue form](../../issues/new?template=measured-quota.yml),
defined at `.github/ISSUE_TEMPLATE/measured-quota.yml`. Send what you know and
say what you could not measure. Every accepted real measurement is credited to
the contributor's handle in `data/sources.json`.

Other corrections are welcome too; see [CONTRIBUTING.md](CONTRIBUTING.md) for
the changes that help most.

## License

The code and original analysis are MIT licensed; see [`LICENSE`](LICENSE).
