# Caveats, limitations, and unresolved licensing

Read this before publishing, deploying, or extending `rack-rate`. It records
where this project's data comes from, what it may and may not do with each
source, and where the numbers are weaker than they look.

Two files are authoritative and this one summarises them. If they disagree,
**they win, and this file is the bug**:

- `docs/data-sources.md` — per-source licensing and redistribution verdicts.
- `docs/pm/` — live milestones, tasks and decisions, plus the generated plan
  index. The pre-PM stage history (stages 1-4 and the 2026-09-17 plan review)
  lives in `docs/history/`.

Nothing here is legal advice. The Artificial Analysis position in particular is
the repository owner's risk decision, not a legal conclusion.

---

## 1. Artificial Analysis — the unresolved one

**Status: unpublished by default. This is the single caveat that could require
action before a public deployment.**

### 1.1 Where the rule lives

The governing document is the **Artificial Analysis Data Platform Terms and
Conditions, version 1.1, last revised 2026-08-19**:

- PDF: `https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf`
- Linked as "Data Platform Terms" from `https://artificialanalysis.ai/data-api`

It is **not** the Website Terms of Use (`/docs/legal/Terms-of-Use.pdf`, v1.0,
2024-04-28), which is a separate document covering the site rather than the
data platform.

**Being on the free tier does not exempt you.** The Scope clause states:

> "These Terms also govern access to and use of the Artificial Analysis API on
> the free tier, including any grading, scoring, or evaluation services made
> available through it (including the CritPt grader API)."

Artificial Analysis's own tier table states it plainly: Free = **"Internal use
only with attribution"**; "Self-serve … Internal use only; no redistribution."

### 1.2 The clauses that bear on this project

| Clause | What it says | Why it matters here |
|---|---|---|
| **§1.9** | "Competitive Product" = any product "whose primary purpose is benchmarking, ranking, comparison, competitive intelligence, or **model/provider selection guidance**" | Describes this project's stated purpose |
| **§1.10** | "Derived Data" **excludes** "raw Data points republished in any format", "structured or tabular reproductions", and "any output where the underlying Data remains individually identifiable" | AA index values in our JSON are *not* Derived Data — they are raw Data points |
| **§2.3 All Tiers** | (a) Internal Use; **(b) "share charts and visualizations publicly, subject to the attribution requirements in Section 5"**; (c) brief citation of individual Data points, "provided such citations … do not reproduce Data in a structured, tabular, or machine-readable format" | The carve-out — see 1.3 |
| **§2.4** | Forbids distributing raw Data files, providing **bulk machine-readable exports** (CSV/Excel/JSON), **embedding** raw Data in "any customer-facing product, API, dashboard, or service", and **combining** Data with third-party data into a product available to a third party | Our committed JSON + combined leaderboards |
| **§2.5(a)** | "Create, develop, or operate a Competitive Product" without prior written consent | The central restriction |
| **§5.1** | Attribution by content type. Charts: **"Artificial Analysis logo must be visible on the chart"**. Data & metrics: `Source: Artificial Analysis (artificialanalysis.ai)` with a hyperlink. Derived Data: "Based on data from Artificial Analysis" plus a non-endorsement statement | Our attribution obligations, and the logo rule |
| **§10.3** | Breaches of §2.4 / §2.5 are **excluded from the liability cap** and carry a customer indemnity | Exposure is uncapped for exactly these clauses |
| **§11.5(b)** | Immediate termination, no refund, for use "in connection with a Competitive Product" | Enforcement is not merely theoretical |

### 1.3 The one carve-out worth knowing

§2.3(b) grants **all tiers** the right to "share charts and visualizations
publicly" subject to §5's attribution, and §5.1 specifies that charts require
the AA logo visible on the chart.

That makes a **chart-only presentation** — the AA index as its own labelled
axis carrying the AA logo and a hyperlink, with **no AA value in any JSON, CSV,
table, or export** — better supported than bulk republication. It sidesteps
§2.3(c)'s "structured, tabular, or machine-readable" prohibition and §2.4(b)'s
bulk-export restriction.

**This is an inference from the text, not cleared permission, and not legal
advice.** The residual objection is §2.4(c)'s reference to a "dashboard". It is
recorded because it is materially better than the alternatives and should be
reachable by configuration — see 1.5.

### 1.4 Prior art does not equal permission

`real-api-pricing` (`https://github.com/FeiZhuLulu/real-api-pricing`, MIT) does
what this project would do. Verified on 2026-09-14 against its published
`derived/points.json`:

- 202 rows total
- `aa_intelligence_index__score` present on **202 / 202** rows
- `aa_coding_agent_index__score` present on **202 / 202** rows
- linked from its README as a public download, and combined with Terminal-Bench,
  Code Arena, and OpenDesign scores in a comparison product

That is the §2.4(d) combination and the §2.5 activity. **But its `SOURCES.md`
is a provenance file, not a grant.** It says so directly:

> "Source links are attribution and provenance, not a claim that third-party
> datasets are MIT-licensed."

Artificial Analysis appears there under "Leaderboards and other evidence" as
bare "separate score snapshots" — no tier, no rights analysis, no terms cited.
Its `PUBLICATION.md` adds that its redaction pass "is not a re-verification of
each external source" (`脱敏不等于重新核验每个外部来源`).

**Conclusion: that project assumes a comparable risk without documenting terms.
It is evidence the use is practised publicly, never evidence it is permitted.**
Do not cite it as permission in this repo.

### 1.5 What this repo does

`AA_PUBLISH` defaults to off, and one module plus one env var govern the whole
question so that gaining or losing permission is a configuration change rather
than a refactor.

Three states, ascending exposure (specified in `docs/pm/M3/todo/DOC-702b.md`):

1. **`AA_PUBLISH=0` — the default.** The AA fetcher is skipped. AA is absent
   from `data/benchmarks.json`, from every composite, and from the built site.
   The Sources page states that AA data is not published here and links to
   Artificial Analysis instead.
2. **Chart-only.** The AA index appears as its own axis with the AA logo visible
   on the chart and a hyperlink. No AA value enters `data/*.json`, any export,
   any table, or any CSV. Attributed per §5.1. Rationale in 1.3.
3. **`AA_PUBLISH=1` with AA values in the data files.** The owner accepted this
   risk on 2026-09-14. Highest exposure: §2.4(b)/(c) and §2.5(a).

In every state:

- A key *alone* never activates publication — `AA_API_KEY` **and**
  `AA_PUBLISH=1` are both required.
- The AA index is always a **separate, labelled axis** carrying its own
  `intelligence_index_version`; it is never averaged into a composite that
  hides its provenance.
- The Sources page always states which state the build is in, so a reader can
  tell whether AA data is present because it was cleared or because a key
  happened to be configured.
- The AA key is never committed, never shipped to the browser, and never baked
  into a built asset.

### 1.6 The open decision

**Not yet resolved, and it is a risk-tolerance call for the repository owner,
not a technical one.**

**Verified 2026-09-14.** The gated path now runs end to end against the live API
on the free tier with `AA_API_KEY` from the gitignored root `.env` plus
`AA_PUBLISH=1`, using `--diff` only: 4 pages were paginated, 26 model rows
resolved against committed model ids at Intelligence Index v4.3 (`task_count`
10 is the evaluation count recorded for that index), and no file was written.
This changes nothing about the licensing analysis above; it means only that
state 3 is now known to be mechanically reachable by one command.

The options:

- **Ship state 1.** Zero exposure. Loses the AA axis entirely.
- **Ship state 2 (chart-only).** Best-supported published variant on the
  wording available; resolves the bulk-export and tabular-reproduction
  objections but rests on the §2.3(b) reading in 1.3.
- **Ship state 3.** What the owner accepted on 2026-09-14, matching what
  `real-api-pricing` does publicly.
- **Ask first.** `hello@artificialanalysis.ai`, or the Commercial contact form
  on `/data-api`. A short email — "we want to show your Intelligence Index as a
  labelled axis with logo and link, here is the site" — is the only thing that
  converts any of the above from inference into permission, and it costs
  nothing. §4.1 notes Commercial terms are provisioned via an Order Form.

Whatever ships, `docs/pm/M3/todo/DOC-702b.md` requires the choice and its reasoning to be
recorded at deployment time.

---

## 2. Data-quality caveats that are not licensing

These are permanent properties of the sources, not bugs to fix.

### 2.1 Scores from different benchmark versions are not comparable

`benchmark_version` is part of row identity (AGENTS.md invariant 1). DeepSWE v1
and v1.1, or AA Intelligence Index v4.2 and v4.3, must never share a table or a
composite. The AA docs state the reason directly: a major version bump "indicate[s]
a substantial change to the index definition or interpretation. Scores are best
interpreted within the same major version." **A lower score after a version bump
is not evidence of model regression** and must never be presented as a decline.

### 2.2 Missing data is missing, never zero

A model absent from a benchmark is not scored zero and is not ranked last
(invariant 2). Composites renormalize over the benchmarks a model actually has,
and require `k >= 2`; otherwise the composite is suppressed and badged
`single-source`. Upstream nulls are not defaulted to `0` (invariant 6).

### 2.3 Confidence labels are load-bearing

`measured | high | medium | low`, carried from `data/plans.json`. Concretely:

- Figures the awesome-coding-plan project *measured* are stronger evidence than
  our arithmetic on a vendor's advertised multiplier.
- **Vendor multiplier arithmetic is `medium` at best.** "At least 5× the usage
  per session" is a marketing claim, not a measurement.
- **Aggregator-only figures are `low` and never become computed rows.** They
  belong in `known_gaps`.

### 2.4 Cost figures carry three different bases

`API list`, `{plan} route`, and AA `index cost` are three distinct quantities
(invariant 4). Never plot two bases on one axis, and never compare them without
labelling. This is the most common way a chart of this kind becomes misleading.

### 2.5 Intervals are not what they look like

- **DeepSWE** `ci_lo` / `ci_hi` are **run-to-run standard errors over
  whole-benchmark repeats**, not binomial intervals. Never recompute a Wilson
  interval from `n_passed / n_attempted`. Medians are used rather than means, to
  resist a few expensive stuck runs.
- **Terminal-Bench** scores are `(model, agent, reasoning_effort, date)`
  tuples. GPT-6 Astra alone occupies several ranks across effort levels. Any
  per-model column must state its selection rule; ties share a rank and are not
  recomputed.

### 2.6 Quotas are measured, not guaranteed

A coding plan's monthly allowance is a *measurement of observed behaviour under
a workload convention*, not a contractual entitlement. Providers change limits,
rate-limit windows, and model routing without notice. Rolling-window caps (for
example a 5 h window) can bind before the monthly cap does — which is why
`days_for_full_run` takes the minimum of the monthly rate and the
rolling-window rate.

### 2.7 Prices and FX move

Every row carries a `retrieved` date. Vendor prices change; CNY-denominated
plans require a recorded `fx.rate` + `fx.date` and a pinned
`measured_against_model`. Figures lacking those stay in `known_gaps` rather than
being converted on a guess.

### 2.8 Written into `known_gaps`, not papered over

Unresolvable upstream facts are recorded rather than guessed. The five current
gaps, verified against `data/derived.json`, are:

- **Google AI Ultra** — price disputed across every source checked ($99.99,
  $199.99 and the original $249.99 have all been reported since Google I/O
  2026), and no published credits→tokens or credits→dollars conversion exists.
  `quota_unresolved: true` stays.
- **GLM Coding Plan (international, USD, Lite/Pro/Max)** — Z.ai's own pricing
  page and developer docs were unreachable during the research pass; the
  credit formula's output weight is unconfirmed. The domestic CNY plan is priced
  instead, by measured request count.
- **Ollama Max, Ollama Team** — figures found only via third-party aggregators,
  not Ollama's own pricing page.
- **SuperGrok (agentic coding)** — the usage pool is shared across chat, image
  generation and agentic coding with no published coding quota.
- **MiniMax Coding Plan Plus** — a real measured quota exists upstream (CNY 49;
  54,400 requests; 2.4B tokens; CNY 4,344 value; 88.65×) but it is not a row
  here: the CNY figures have not been converted with a recorded spot rate, and
  the model it was measured against is not pinned. **Add it with `fx.rate` +
  `fx.date` and `measured_against_model`, or leave it as a gap — never invent a
  USD price.**

Separately, three rows ship at `low` confidence because their figures are
aggregator-only: `cursor-pro-plus`, `cursor-ultra`, `google-ai-pro`. These are
rows, not gaps — the distinction matters, because a `low` row is displayed while
an aggregator-only figure that has no row at all belongs in `known_gaps`.

### 2.9 Structural limitations of the whole approach

- **Benchmarks measure the model, not the subscription channel.** An AA Coding
  Agent score describes a tested harness × model × effort configuration; it is
  not a measurement of what a given plan's interface delivers. AA's own docs
  note their configurations are reference summaries.
- **Cost per task is a workload-dependent figure.** A "task" is defined by the
  benchmark's task set, not by any reader's actual work. Treat `cost_per_task`
  as a comparable index, not a prediction of a specific invoice.
- **Reproducing an expensive benchmark is out of scope.** A single
  Terminal-Bench leaderboard entry costs roughly $347–$9,604 in inference
  alone. This project republishes published numbers; it does not re-run them.

---

## 3. Never in this repo

- **Benchmark task content.** DeepSWE carries a canary string and contamination
  destroys the benchmark this project depends on. Scores and efficiency
  aggregates only — never tasks, prompts, verifiers, or patches. Do not ask a
  model to reconstruct them.
- **Annual, promotional, regional, or affiliate pricing** in `price_usd_month`.
- **Aggregator claims promoted to computed rows.**
- **Any number without a resolved `sources.json` record and a `retrieved` date.**
- **AA-derived values in a build where `AA_PUBLISH=0`.**

---

## 4. Reporting a problem

If a figure here is wrong, or a source changed its shape, fix
`data/sources.json` and the fetcher together and update the `retrieved` date —
never hand-edit a number in isolation (AGENTS.md working agreement). For the
Artificial Analysis position specifically, the useful action is not a code
change but the question in 1.6.
