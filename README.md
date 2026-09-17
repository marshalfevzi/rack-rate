# Rack Rate

**A hotel's rack rate is the price on the back of the door. Nobody pays it.**

API list pricing is the same instrument: published, high, and often unlike what
people actually pay through a subscription quota.

**[GitHub Pages site (planned)](https://marshalfevzi.github.io/rack-rate/)** ·
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

The site is the reader-facing view of this comparison. It keeps
benchmark provenance, pricing basis, confidence, and unresolved gaps visible
instead of turning them into a single unexplained ranking.

## Where this stands

DeepSWE v1.1 and Terminal-Bench board 4-0-0 are live pulls. Eight of the
sixteen plan rows fail the anchor check — Claude Pro, Claude Max 5x and 20x,
ChatGPT Pro 20x, Kimi Andante and Allegretto, and GLM Coding Lite and Pro —
because their vendor pages no longer carry the quoted limit text the fetcher
requires. `fetch:plans` therefore fails closed and writes nothing, so
`data/plans.json` is still at its Stage 1 revision while the model rows were
refreshed in Stage 2; every plan-route figure is computed from a Stage 1 price.
[`docs/pm/M8/todo/DATA-801.md`](docs/pm/M8/todo/DATA-801.md) owns that refresh.
Artificial Analysis is off unless both `AA_API_KEY` and `AA_PUBLISH=1` are set;
the site builds as static output from committed data. Charts and the insight
pages landed in Stage 4; the Console Listing redesign is Stage 5, the
provider-selection wizard Stage 6, deployment Stage 7, and Stage 8 carries the
data-integrity follow-ups off the critical path
(see [`docs/pm/`](docs/pm/)).
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
browser, so its built output makes no data requests and can be built offline.

## Quickstart

Install dependencies and run the checks:

```bash
bun install
bun run dev                 # Astro dev server
bun run check
bun test
```

Inspect the built site rather than `bun run dev` when judging chart chrome: the
dev server injects its own toolbar, which no built route renders
(`bun run build && bun run preview`).

`bun run check` and `bun test` are the current gates; `bun run check` itself
runs `tsc`, oxlint, a formatting check, and `astro check`.

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
bun run og                 # render the build-time social card
bun run build
bun run check
bun run lint
bun run format
bun run quality
bun run test
bun run dev                 # Astro dev server
```

- `fetch` refreshes all source inputs; the source-specific commands refresh one
  input.
- `validate` checks schemas, citations, versions, and data-quality rules.
- `compute` joins the validated inputs and writes derived data;
  `data:build` runs validation and computation together.
- `build` runs `data:build` → Astro build → `og`, writing `dist/`
  including the social card.
- `lint` runs oxlint with every rule at error severity; `lint:fix` applies its
  safe autofixes.
- `format` rewrites files with oxfmt; `format:check` is the non-writing gate
  form.
- `quality` runs the fallow report over dead code, duplication, and complexity.
  It is advisory: it reports findings and is never part of `bun run check`.
- Artificial Analysis is disabled unless both `AA_API_KEY` and
  `AA_PUBLISH=1` are explicitly set. See [CAVEATS.md](CAVEATS.md) before
  enabling it.

## Environment variables

Local configuration lives in a gitignored `.env` at the repository root. The
data CLI loads it on every invocation regardless of working directory; a real
environment variable wins over the file. `.env.example` is the committed
template.

- `AA_API_KEY` — optional key needed only for `fetch:artificial-analysis`.
- `AA_PUBLISH` — enables publication only at the exact value `1`; committed AA
  rows with any other value make `validate` fail.
- `HARBOR_BIN` — optional path to the `harbor` executable for the Terminal-Bench
  fallback after the flight-data path fails; when unset or empty, `PATH` is
  searched.

`HARBOR_API_KEY` belongs to the `harbor` CLI and is not read here.

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

- The site and the social card are set in IBM Plex Sans and IBM Plex Mono,
  self-hosted under `apps/site/src/assets/fonts/` under the SIL Open Font
  License 1.1; `LICENSE.txt` is kept beside the faces. No font is fetched from
  a CDN, at build time or at runtime.

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
[`measured-quota issue form`](https://github.com/marshalfevzi/rack-rate/issues/new?template=measured-quota.yml),
defined at `.github/ISSUE_TEMPLATE/measured-quota.yml`. Send what you know and
say what you could not measure. Every accepted real measurement is credited to
the contributor's handle in `data/sources.json`.

Other corrections are welcome too; see [CONTRIBUTING.md](CONTRIBUTING.md) for
the changes that help most.

## License

The code and original analysis are MIT licensed; see [`LICENSE`](LICENSE).
