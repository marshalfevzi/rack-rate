# Data sources, terms, and redistribution

Every figure the site publishes comes from one of the sources below. This file
is the human-readable companion to `data/sources.json`; validation fails when an
`evidence` id in `data/plans.json` or `data/models.json` does not resolve to a
record here.

For the reader-facing summary of what is unresolved — the Artificial Analysis
position, the open decision it needs, and the data-quality caveats that are
permanent properties of the sources — see **`CAVEATS.md`**. This file is the
source-level detail behind it.

**Retrieval dates below are 2026-09-14** (the research pass that produced
`docs/research/`). Refresh them whenever a fetcher reruns.

## Summary

| Source | What we take | License | Republish? | Attribution required |
|---|---|---|---|---|
| DeepSWE (Datacurve) | Per-config scores, cost/tokens/steps per task | Apache-2.0 | **Yes** | Credit Datacurve + link the repo |
| Terminal-Bench / Harbor | Leaderboard rows (accuracy, CI, cost, tokens) | Apache-2.0 (tasks/harness); leaderboard numbers are factual | **Yes** | Credit Terminal-Bench + link `tbench.ai` |
| Awesome Coding Plan | Measured monthly quotas for coding plans | **CC BY 4.0** | **Yes, with attribution** | Exact string, below — build fails without it |
| Artificial Analysis | Intelligence/Coding/Agentic indices, index cost | Proprietary (Data Platform Terms v1.1) | **No permission granted — disabled by default**; a chart-only presentation is the best-supported variant | AA logo on charts; `Source: Artificial Analysis (artificialanalysis.ai)` + link otherwise |
| Vendor pricing pages | Prices, quota wording | Facts; page text © vendors | Yes (paraphrase + short quote) | Link the page + retrieval date |
| real-api-pricing | Prior art + risk calibration | MIT (its own code; AA values it publishes are **not** thereby licensed) | Do not copy figures | Credit FeiZhuLulu |

---

## DeepSWE (Datacurve)

- Live artifact: `https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json`
  (no auth, single JSON document, no pagination).
- Frozen fallback: `https://deepswe.datacurve.ai/artifacts/v1/leaderboard-live.json`
  (`generated_at` 2026-06-20 — stale; use only if v1.1 404s).
- Repo: `https://github.com/datacurve-ai/deep-swe` — **Apache-2.0**.
- `PROVENANCE.md` scopes the license to Datacurve's own contributions (task
  specs, harness, verifiers, curation); upstream dependencies keep their own
  permissive licenses.
- **Redistribution: permitted** for the numeric results and our derived figures,
  with credit and a link.
- **Status:** The live DeepSWE leaderboard is still blocked by this build
  environment's network egress. `data/models.json`'s scores come from a
  directly-supplied snapshot recorded as `src-deepswe-data`. The Stage 2.2
  fetcher's endpoint remains unverified against the live site.

**Hard constraint — no task content.** DeepSWE ships a canary string to detect
mirroring, and contamination would destroy the benchmark this project depends
on. Fetch scores and efficiency aggregates. Never vendor tasks, prompts,
verifiers, or patches into this repo, and do not ask a model to reconstruct
them.

Other facts the fetcher must respect:

- `pass_rate == pass_at_1`; both are attempt pass rates over scored attempts.
  Context-window failures and agent timeouts count as failures; provider /
  verifier / network errors are excluded.
- `ci_lo` / `ci_hi` are **run-to-run SE over whole-benchmark repeats**, not
  binomial intervals. Never recompute Wilson intervals from
  `n_passed / n_attempted`.
- `provider` is **absent** on ~65 of 70 rows (not `null`), so vendor identity
  comes from an explicit hand map, and unmapped models ship as
  `provider: null` rather than a guessed company.
- Efficiency fields exist as both `mean_*` and `median_*`. This project uses
  **medians**, to resist a few expensive stuck runs.
- The file contains one row per `(model, harness, reasoning_effort)`. We keep
  the highest-scoring configuration per model and retain the rest as
  `effort_variants`, so the effort ladder stays visible on the chart.

## Terminal-Bench / Harbor

- Leaderboard: `https://www.tbench.ai/` — the payload is embedded in the
  Next.js flight data under
  `queryKey: ["leaderboard","terminal-bench/terminal-bench","4-0-0"]`.
  There is no documented public REST endpoint; the embedded blob is
  undocumented and can move without notice.
- Stable alternate surface: `harbor hub leaderboard show <board> --json`
  (public boards need no login). Install with `uv tool install harbor`.
- Repos: `harbor-framework/harbor`, `terminal-bench` — **Apache-2.0**.
- **Redistribution: permitted** for scores, CI, cost and token figures, with
  attribution to Terminal-Bench and a link to `tbench.ai`.

Constraints:

- Scores are `(model, agent, effort, date)` tuples. GPT-6 Astra alone holds
  ranks 1/2/2/5/7 across efforts. Any per-model column must state its
  selection rule (we use: latest date, best effort) and say so on the page.
- `metrics.accuracy` is trial-level percentage; `display_accuracy` and
  `display_cost` are presentation strings (`"**58.2%** ± 2.8%"`, `"$$3.3k"`) and
  must never be parsed. Use `metrics.accuracy` and `metrics.total_cost_usd`.
- Ties share a rank; do not recompute dense ranks.
- Never re-run the benchmark. A single leaderboard entry costs $347–$9,604 in
  model inference alone plus GPU sandboxes and provider keys. We republish the
  board's numbers.
- Terminal-Bench version must be pinned (board slug + `dataset_version_ids`
  UUID) in provenance. Never assume `latest == 4.0.0`.

## Awesome Coding Plan

- Repo: `https://github.com/mahonzhan/awesome-coding-plan` — **CC BY 4.0**.
- Used for measured monthly quotas (and their API-rate value) for Claude Pro,
  ChatGPT Plus, Ollama Pro, OpenCode Go, Kimi Code, GLM Coding Plan, Cursor Pro
  and GitHub Copilot Pro, among others.
- **Required attribution, verbatim, per the upstream license — this must appear
  in `data/sources.json`, in `docs/data-sources.md`, and on the site's Sources page:**

  > Identification of the creator: mahonzhan@gmail.com
  > License Notice: Licensed under the Creative Commons Attribution 4.0
  > International License.
  > Link to the License: https://creativecommons.org/licenses/by/4.0/

- **Changes made:** selected rows are converted from the source's tables into
  this project's plan schema. That conversion is a modification and must be
  stated (CC BY 4.0 requires indicating changes). Higher subscription tiers the
  source did not measure (Claude Max 5x/20x, ChatGPT Pro) are *this project's*
  arithmetic on the vendor's advertised multiplier — marked `confidence: medium`
  and **not** attributed to this source as a measurement.
- Validation must fail the build if the attribution string is missing.

## Vendor pricing pages

Prices published by a vendor are facts and are not copyrightable in most
jurisdictions; the page's expression is. So: extract the number, record the URL
and retrieval date, quote at most a short phrase of the limit wording, and write
our own description of the quota mechanics.

Tracked vendors: Anthropic (Claude Pro / Max), OpenAI (ChatGPT Plus / Pro),
Google (AI Pro / Ultra), Cursor, GitHub Copilot, Z.ai (GLM Coding Plan),
Moonshot (Kimi Code), OpenCode, Ollama, xAI (SuperGrok).

Rules:

- **Monthly billing only.** No annual or promotional pricing in
  `price_usd_month`; note it separately if it matters.
- **No locale mixing.** `gemini.google/subscriptions/` served Turkish prices in
  the research pass. Always fetch with `?hl=en`, record the locale, and never
  blend locales in one row.
- **Quote the limit, not the marketing.** "At least five times the usage per
  session" is a multiplier claim; the measured saturated month is the number.
  Vendor multiplier claims are `confidence: medium` at best.
- **Aggregator-only figures stay `low` and never become computed rows.** If a
  dollar figure appears only in a third-party blog (Cursor Pro+ pools, Google
  Ultra price, SuperGrok Heavy), it belongs in `known_gaps`, not in a formula.

## Artificial Analysis

- Endpoint: `GET https://artificialanalysis.ai/api/v2/language/models/free`
  with header `x-api-key: $AA_API_KEY`. The older `/api/v2/data/llms/models`
  path is superseded. Free tier: 100 requests / fixed 24 h window, server-fixed
  `page_size: 200`, and **only** `page` is accepted.
- Free-tier fields: three headline indices
  (`artificial_analysis_intelligence_index`, `_coding_index`, `_agentic_index`),
  `artificial_analysis_intelligence_index_cost` totals, input/output/cache
  pricing, and four performance medians. Per-benchmark scores
  (Terminal-Bench Hard, TAU-bench, SciCode, GPQA, HLE, …), blended pricing,
  percentiles, context window and modalities are Pro/Commercial only.
- Docs: `https://artificialanalysis.ai/data-api/docs`;
  spec: `https://artificialanalysis.ai/api/v2/openapi`.

**Redistribution: not granted — but the terms are finer-grained than
"everything is forbidden", and one carve-out matters.**

The Artificial Analysis Data Platform Terms **v1.1 (revised 2026-08-19)** are
the governing document (`https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf`,
linked as "Data Platform Terms" from `/data-api`). Their **Scope clause covers
the free tier explicitly** — "These Terms also govern access to and use of the
Artificial Analysis API on the free tier" — so free-tier use does not escape
them. Artificial Analysis's own comparison table states Free = "Internal use
only with attribution."

Clauses that bear on this project:

- **§1.9** "Competitive Product" = any product "whose primary purpose is
  benchmarking, ranking, comparison, competitive intelligence, or
  **model/provider selection guidance**" for AI models/providers.
- **§1.10** "Derived Data" explicitly **excludes** "raw Data points republished
  in any format", "structured or tabular reproductions", and "any output where
  the underlying Data remains individually identifiable".
- **§2.3 All Tiers** grants: (a) Internal Use; **(b) share charts and
  visualizations publicly, subject to §5 attribution**; (c) brief citation of
  individual Data points in public content, "provided such citations … do not
  reproduce Data in a structured, tabular, or machine-readable format".
- **§2.4** forbids distributing raw Data files, providing **bulk
  machine-readable exports**, **embedding** raw Data in "any customer-facing
  product, API, dashboard, or service", and **combining** Data with third-party
  data to make a product available to a third party.
- **§2.5(a)** forbids creating a Competitive Product without prior written
  consent — which describes this project's stated purpose.
- **§5.1** attribution by content type: charts require the **AA logo visible on
  the chart**; metrics require `Source: Artificial Analysis
  (artificialanalysis.ai)` with a hyperlink; Derived Data requires "Based on
  data from Artificial Analysis" plus a non-endorsement statement.
- **§10.3** breaches of §2.4/§2.5 are **excluded from the liability cap** and
  carry a customer indemnity; **§11.5(b)** allows immediate termination with no
  refund for Competitive Product use.

**The carve-out worth recording:** §2.3(b) plus the §5.1 chart row suggests a
**chart-only** AA presentation — the AA index plotted as its own labelled axis
with the AA logo and a link, no AA values in any JSON, table or export — is
closer to what §2.3 permits than bulk republication is. §2.4(c)'s "dashboard"
language cuts against that reading, so this is an **inference from the text,
not cleared permission** and not legal advice. It is nonetheless a materially
better-supported posture than wholesale AA data publication, and the
implementation should keep the two separable (see the decision below).

**Prior art, verified 2026-09-14 — and it is not a license.** The
`real-api-pricing` repository publishes AA scores in bulk machine-readable
form: its `derived/points.json` (202 rows) carries
`aa_intelligence_index__score` on **202/202 rows** and
`aa_coding_agent_index__score` on **202/202 rows**, and it is linked from the
README as a public download. Those values are combined with Terminal-Bench,
Code Arena and OpenDesign scores in a model-comparison product — the §2.4(d)
combination and the §2.5 activity.

However, **its `SOURCES.md` is a provenance file, not a grant.** It states:
"Source links are attribution and provenance, not a claim that third-party
datasets are MIT-licensed," and lists Artificial Analysis under "Leaderboards
and other evidence" as bare "separate score snapshots" with no tier, rights
analysis or terms cited. `PUBLICATION.md` adds that its redaction pass was not a
re-verification of external sources.

So the accurate reading is: **that project assumes a comparable risk without
documenting terms.** It is precedent for the practice and a useful
risk-calibration data point; it is **not** evidence that permission exists, and
this repo must not cite it as one.

**Decision (owner, 2026-09-14): AA-derived values may be published with
attribution. This is an explicit, unresolved legal exception — not a
compliance position.** The owner accepted the risk for the repository's own
deployment. Nothing in this repo should be read as a claim that the use is
permitted: the terms quoted above are unmet, and this project's purpose
(model/provider selection guidance) matches the activity §2.5 restricts.

Because the position is unresolved rather than cleared, the code must default to
**disabled**, and enabling publication is a deliberate local choice:

- `AA_API_KEY` absent or `AA_PUBLISH=0` (the default) → the AA fetcher is
  skipped, AA is excluded from `data/benchmarks.json`, from every composite, and
  from the built site, and the Sources page states plainly that AA data is not
  published here and links to Artificial Analysis instead.
- `AA_API_KEY` set **and** `AA_PUBLISH=1` → the fetcher runs and AA values are
  published, each labelled `Source: Artificial Analysis
  (artificialanalysis.ai)` with a link, next to the value — never buried in a
  footer, never merged into a number that no longer shows its origin. The
  Sources page then states the exception: no redistribution right has been
  granted, the figures are included at the repository owner's risk, and readers
  who need certainty should consult Artificial Analysis directly.
- The AA index is always a **separate, labelled axis** carrying its own
  `intelligence_index_version`. It is never averaged into a composite that hides
  its provenance, and never silently enabled by a build that happens to have a
  key present.
- One module and one env var govern it, so obtaining (or losing) permission is a
  configuration change, not a refactor. `bun run validate` warns loudly — and
  the build logs a banner — whenever AA publication is on.
- The key is never shipped to the browser, never committed, and never baked into
  a built asset.

**Recommended path:** request a Commercial agreement (and written confirmation
on §2.5) before turning publication on for any public deployment. Until then,
the honest configuration is the default one: AA disabled, linked out.

## real-api-pricing

`https://github.com/FeiZhuLulu/real-api-pricing` (MIT, 326★) reached a related
idea first: real cost per usable token across third-party leaderboards, with
Pareto frontiers. It is credited in `README.md` and on the Sources page.

It is used for credit only: no figures from it are copied into this repo. No
regional or promotional pricing or affiliate links are included.
It is also the closest available **risk calibration** on the Artificial
Analysis question: it publishes AA Intelligence and Coding Agent scores on
every one of its 202 exported rows, combined with four other leaderboards, in
a public model-comparison product — the same shape of use the terms restrict.
Its own `SOURCES.md` disclaims exactly the inference we must not draw: source
links are provenance, "not a claim that third-party datasets are MIT-licensed."
Treat it as evidence that this use is *practised publicly*, never as evidence
that it is *permitted*.

## Already in `data/sources.json`

The rewrite preserves these records and their obligations:

- `src-deepswe-repo`, `src-deepswe-data` — benchmark methodology and results
- `src-awesome-coding-plan` — measured quotas, CC BY 4.0 attribution held in
  `attribution` and `credited_contributor`
- `src-real-api-pricing` — credit
- `src-anthropic-max-pricing-search`, `src-openai-pro-pricing-search`,
  `src-cursor-pricing-search`, `src-google-ai-pricing-search`,
  `src-zai-glm-pricing-search` — vendor pricing, search-corroborated, marked
  `confidence: medium`/`low`

## What never belongs here

- Benchmark task content (DeepSWE canary; Terminal-Bench task text).
- Annual, promotional, regional or affiliate pricing.
- Aggregator claims promoted to computed rows.
- Any number without a resolved `sources.json` record and a `retrieved` date.
