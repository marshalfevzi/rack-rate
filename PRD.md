# Product Requirements Document

## Product Overview

Rack Rate is a public, static decision tool for the individual practitioner: a software engineer choosing which model to run and which coding subscription to buy for their own workload and budget. Its secondary audience is contributors who measure a plan to exhaustion and submit that measurement for review. The product joins benchmark results with measured coding-plan allowances, publishes the arithmetic, and keeps provenance, pricing basis, confidence, and unresolved gaps visible.

The desired outcome is a decision a visitor can inspect and reproduce: choose a provider and plan, see the models that plan can run and their cost per task, compare those models across benchmark versions, see Pareto frontiers on API-list and plan-adjusted axes, inspect every source, and carry ignored, paid, and already-owned choices between visits. The experience must work on a phone, from committed data in a static build, without a server.

Rack Rate is not an internal dashboard, a vendor marketing surface, or a leaderboard for its own sake. It does not mirror benchmark task content, prompts, verifiers, or patches. It does not add server endpoints or client-side data fetching. These boundaries follow `PRODUCT.md` (Users, Product Purpose, Positioning, Operating Context, and Evidence on Hand) and the Product Overview above.

## Feature Requirements

| ID | Feature | User value | Priority | Acceptance criteria |
|---|---|---|---|---|
| FR-001 | Citation and retrieval date for every figure | A reader can identify the source and freshness of any published number. | Must | Every published figure resolves to a source record and displays its citation and retrieved date; a number without a source is rejected. Source: `PRODUCT.md` (Positioning, Product Principles); `docs/data-sources.md` (Summary). |
| FR-002 | Missing values remain missing | A missing upstream observation cannot become a misleading zero or rank. | Must | An absent benchmark row, null, or unresolved quota renders as missing with its reason, is not scored as zero, and is not silently included in a composite. Source: `ARCHITECTURE.md` (Invariant index, items 2 and 6); `CAVEATS.md` §2.2. |
| FR-003 | Benchmark version is part of row identity | Comparisons do not mix scores from incompatible benchmark versions. | Must | Every benchmark label carries `benchmark_version`; tables and composites never combine different versions. Source: `ARCHITECTURE.md` (Invariant index, item 1); `ARCHITECTURE.md` (Data contract). |
| FR-004 | Explicit cost basis | A reader can distinguish API-list, plan-route, and Artificial Analysis index quantities. | Must | Every cost figure names its basis beside the value; distinct bases never share an unlabeled axis or quantity. Source: `PRODUCT.md` (Positioning); `ARCHITECTURE.md` (Invariant index, item 4); `CAVEATS.md` §2.4. |
| FR-005 | Displayed confidence | Weak evidence is visible instead of being laundered into a precise-looking ranking. | Must | Published plan figures display one of `measured`, `high`, `medium`, or `low`; vendor-multiplier arithmetic is no stronger than `medium`, and aggregator-only figures do not become computed rows. Source: `PRODUCT.md` (Positioning); `CAVEATS.md` §2.3; `docs/data-sources.md` (Vendor pricing pages). |
| FR-006 | Recorded gaps | A reader can see why an upstream fact is unavailable. | Must | An unresolved fact is represented in `known_gaps` with a reason and remains adjacent to the affected value; no number is invented to close the gap. Source: this PRD's Open questions and owners table; `ARCHITECTURE.md` (Data contract); `CAVEATS.md` §2.8. |
| FR-007 | Multi-benchmark model comparison | A practitioner can compare capability profiles instead of relying on one score. | Must | Model views expose the committed benchmark entries and preserve each benchmark title, version, score unit, provenance, and missing rows. Source: `PRODUCT.md` (Product Purpose and Capabilities); the Product Overview above and `docs/pm/M5/todo/UI-507.md`. |
| FR-008 | Plan and model-route comparison | A practitioner can see which subscription can run a model and what that route costs. | Must | Plan views show provider, price, quota model, measured-against model, confidence, available models, cost per task, and full-run time; an unavailable route is not priced. Source: `docs/pm/M5/todo/UI-508.md` and `ARCHITECTURE.md` (Data contract); `README.md` (The method). |
| FR-009 | Published comparison arithmetic | The purchase decision uses inspectable quantities rather than a hidden ranking. | Must | The site exposes `cost_per_task`, break-even volume, value multiple, and days-for-full-run where the committed data supports them, and the method page names the inputs and formula. Source: `README.md` (The method); `PRODUCT.md` (Product Purpose); `docs/pm/M6/README.md` (Acceptance). |
| FR-010 | Provider and model-scope filtering | A plan cannot recommend a model its provider does not serve. | Must | Selecting a provider narrows the plan list, and every plan/model result is filtered by the plan’s `model_scope`; an unsupported model never appears as a recommendation. Source: `docs/pm/M6/README.md` (Acceptance); `README.md` (The method). |
| FR-011 | Sortable and filterable listings | A visitor can narrow and order a long comparison without losing context. | Must | `/models` and `/plans` expose the fields and filters specified by Stage 5, keyboard-operable sorting writes URL state, and reloading restores the same listing state. Source: `docs/pm/M5/todo/UI-507.md` and `docs/pm/M5/todo/UI-508.md`. |
| FR-012 | Separate `pass@1` and `pass@4` | Score semantics remain legible and cannot be accidentally combined. | Must | `pass@1` and `pass@4` render in separate fields and never share a field, axis, or formula; only `pass@1` feeds scores and composites. Source: `ARCHITECTURE.md` (Invariant index, item 3); `docs/pm/M5/todo/UI-507.md`. |
| FR-013 | Addressable chart metric, filter, and axis state | A visitor can share or revisit an exact chart view. | Must | Metric, filter, chart type, axis scale, frontier, vendor, effort, score-floor, and composite-weight controls write namespaced URL values and restore them on reload. Source: `PRODUCT.md` (Capabilities); `docs/pm/M5/todo/UI-511.md`. |
| FR-014 | Pareto frontiers on named bases | A visitor can distinguish API pricing from plan-adjusted economics. | Must | The comparison surfaces draw Pareto frontiers for the API-list and plan-adjusted bases, with the basis named in every relevant axis, title, legend, and control. Source: the Product Overview above and `docs/pm/M5/todo/UI-509.md`; `PRODUCT.md` (Product Purpose). |
| FR-015 | Six chart workspaces with equivalent data access | Charts provide exploration without making hover the only way to read a fact. | Must | Pareto, bump/rank, heatmap, slope, waterfall, and radar views each have an accessible name, keyboard-reachable points, a real table twin with the same values, and an open gap rather than interpolation for missing data. Source: `docs/pm/M5/todo/UI-509.md` and `docs/pm/M5/todo/UI-511.md`; `docs/pm/M5/README.md` (Acceptance). |
| FR-016 | Comparison matrix semantics | A visitor can compare selected models and understand ties and intervals. | Must | `/compare` exposes benchmark title plus version, separate API-list and plan-route cost rows, a comparison statement, interval-overlap text `statistical tie at 95%`, and rank ranges; fewer than two selections produces `Choose at least 2 models`. Source: `docs/pm/M5/todo/UI-510.md`. |
| FR-017 | Console Listing shell | Every route has one consistent, inspectable navigation and state grammar. | Must | The site renders the status band, lane rail, reference rows, workspace, footer index, line-number gutter, and carriage-control state column; at narrow width the rail becomes a keyboard-operable drawer with no horizontal scroll. Source: `docs/pm/M5/todo/UI-503.md` and `docs/pm/M5/README.md` (Acceptance); `PRODUCT.md` (Brand Commitments). |
| FR-018 | Overview split console | The first view answers the plan-cost question without a placeholder or hidden request. | Must | `/` opens with a committed plan, model, and task count; changing them writes `plan`, `models`, and `tasks` to the URL; reload reconstructs the state; the five insight statements are listing rows; the browser makes no JSON or API request. Source: `docs/pm/M5/todo/UI-506.md`. |
| FR-019 | Model listing and detail surfaces | A visitor can move from a comparison row to a fully sourced model record. | Must | `/models` and `/models/[slug]` expose the specified score, cost, route, effort, composite, provenance, and outbound benchmark fields; every cost names its basis, and a copied model URL reproduces the same record. Source: `docs/pm/M5/todo/UI-507.md`. |
| FR-020 | Plan listing and detail surfaces | A visitor can inspect quota mechanics and the models a plan unlocks. | Must | `/plans` and `/plans/[slug]` expose the specified plan fields, exact `quota_model` names, methods, adjacent gap reasons, and unlocked models; unresolved quota rows never print a zero-valued cost. Source: `docs/pm/M5/todo/UI-508.md`. |
| FR-021 | Console chart grammar | Chart styling communicates measurement, adjustment, confidence, gaps, and basis without relying on color alone. | Should | Built chart options use the Stage 5 marker, hatch, stroke-weight, gap, basis-label, and page-control rules; no chart option uses a gradient, circle marker, unlabelled cost axis, chart-drawn toolbox, or chart chrome outside the page control row. Source: `docs/pm/M5/todo/UI-509.md` and `docs/pm/M5/README.md` (Acceptance); `DESIGN.md`. |
| FR-022 | Method, sources, and honest 404 surfaces | A visitor can inspect the arithmetic, attribution, licensing state, and deliberate gaps. | Must | `/method` renders the named formulas and inputs; `/sources` renders source licence, coverage, changes, retrieval date, required Awesome Coding Plan attribution, and exactly one AA gate state; `404` has no canonical or decorative image. Source: `docs/pm/M5/todo/UI-513.md`; `docs/data-sources.md` (Summary and Awesome Coding Plan); `CAVEATS.md` §1.5. |
| FR-023 | Design-record reconciliation | The written design contract does not drift from the shipped presentation. | Should | After the Console Listing build, `DESIGN.md`, its surface briefs, and `ARCHITECTURE.md` match emitted tokens, measured shell geometry, chart grammar, and the shipped readout docking. Source: `docs/pm/M5/todo/UI-515.md`. |
| FR-024 | Versioned persistent preferences | A returning visitor does not have to repeat ignored, paid, or owned choices. | Must | `apps/site/src/lib/prefs.ts` stores the specified preference object under `rack-rate:prefs:v1`, is SSR-safe, validates every read with zod, falls back safely on corruption, synchronizes across tabs, and supports versioned migration. Source: `docs/pm/M6/todo/APP-601.md`; `PRODUCT.md` (Operating Context and Locked stack). |
| FR-025 | Visible preference-aware rendering | Filtering never hides the evidence needed to understand the decision. | Must | Ignored models and plans move to the set-aside rail with `-`, a restore action, and the reason intact; paid plans use `*` and are excluded from “what should I buy” totals. Source: `docs/pm/M6/todo/APP-602.md` and `docs/pm/M5/README.md` (Contract handed to Stage 6). |
| FR-026 | Provider-to-plan-to-model wizard | A practitioner receives a recommendation constrained to a real provider and plan. | Must | `/start` implements provider → plan → model steps; the result ranks plans with `cost_per_task`, break-even tasks, value multiple, days-for-full-run, and unlocked models, with no model outside the selected plan’s scope. Source: `docs/pm/M6/todo/APP-603.md` and `docs/pm/M6/README.md` (Acceptance). |
| FR-027 | Shareable, stateless wizard result | A visitor can send a recommendation to another browser profile. | Must | The wizard encodes answers in the URL, hydrates from that URL when present, persists only on confirmation, and reproduces the same recommendation after refresh or in another browser profile. Source: `docs/pm/M6/todo/APP-604.md` and `docs/pm/M6/README.md` (Acceptance). |
| FR-028 | Wizard context on comparison surfaces | A visitor can carry a purchase context into model and Pareto views. | Must | `/models` and the Pareto chart show the active plan/vendor filter in a console chip, apply it to their data, and provide a clear action. Source: `docs/pm/M6/todo/APP-605.md`. |
| FR-029 | Preference export, import, and reset | A visitor can move or clear local decisions deliberately. | Must | Export writes one versioned JSON file, import validates it at the local-storage trust boundary, and “reset all preferences” restores defaults without making the site unusable. Source: `docs/pm/M6/todo/APP-606.md`; `PRODUCT.md` (Locked stack). |
| FR-030 | GitHub Pages deployment workflow | A push to the primary branch publishes the static site without manual deployment steps. | Must | The workflow pins Bun, runs frozen-lockfile installation and the build, uploads the Astro output, deploys with the Pages action, declares the required permissions, and cancels overlapping runs. Source: `docs/pm/M7/todo/APP-701.md` and `docs/pm/M7/README.md` (Acceptance). |
| FR-031 | Canonical URL and base-path modes | Links and metadata work on the project page and later custom domain. | Must | The first target is `marshalfevzi.github.io/rack-rate`; the custom-domain target is `rackrate.dev` when DNS is ready; project-page builds use the `/rack-rate` base, custom-domain builds use the root base, and neither emits absolute-root internal links. Source: `docs/pm/M7/todo/DOC-702.md`; `ARCHITECTURE.md` (Site configuration). |
| FR-032 | Artificial Analysis publication gate | A key cannot silently turn on a legally unresolved data source. | Must | Artificial Analysis is absent unless both `AA_API_KEY` and `AA_PUBLISH=1` are set; the Sources page states the active publication state; any published AA axis remains separately labelled and attributed. Source: `docs/pm/M7/todo/DOC-702b.md`; `CAVEATS.md` §1.5–1.6; `ARCHITECTURE.md` (Invariant index, item 10). |
| FR-033 | Reviewable scheduled data refresh | Data changes are inspectable before they reach the deployed site. | Must | The scheduled workflow runs the fetchers and opens a pull request when committed JSON changes; it never pushes refreshed data directly to the live site. Source: `docs/pm/M7/todo/APP-703.md` and `docs/pm/M7/README.md` (Acceptance). |
| FR-034 | Crawl, cache, and 404 hygiene | Search and browser caches resolve the deployed static site correctly. | Must | `robots.txt`, the sitemap, the deployed base path, hashed asset caching, and the 404 response are verified against the deployed output. Source: `docs/pm/M7/todo/APP-704.md`; `ARCHITECTURE.md` (Crawl and discovery files). |
| FR-035 | Contributor publication workflow | Contributors know how to add data without bypassing provenance or licensing rules. | Must | Contributor guidance covers plans, sources, measured quotas, `known_gaps`, licensing, the existing measured-quota issue path, and the credit promise. Source: `docs/pm/M7/todo/DOC-705.md`; `README.md` (Contributing measured quotas); `docs/data-sources.md`. |
| FR-036 | Clean-clone release verification | The published site is reproducible without secrets. | Must | A clean clone can install dependencies, build, load the deployed URL, reach every route, exercise chart interactions at phone-sized width, and see every upstream and the attribution block on Sources. Source: `docs/pm/M7/todo/DOC-707.md` and `docs/pm/M7/README.md` (Acceptance). |
| FR-037 | Refresh of the eight anchor-failing plan rows | The plan comparison stops relying on stale Stage 1 rows while preserving honest gaps. | Could | `fetch:plans --diff` exits successfully with each of `claude-pro`, `claude-max-5x`, `claude-max-20x`, `chatgpt-pro-20x`, `kimi-code-andante`, `kimi-code-allegretto`, `glm-coding-lite`, and `glm-coding-pro` either verified or explicitly unresolved; changed rows bump `retrieved_at`, and validation, compute, and `data:check` pass. Source: `docs/pm/M8/todo/DATA-801.md` and this PRD's Open questions and owners table. |
| FR-038 | Resolution of the two 404 evidence URLs | Citations remain load-bearing and live. | Could | The ChatGPT Pro price citation and the `google-ai-pro` anchor are replaced with live sources for the same facts, or the claims become recorded gaps; `doctor`, validation, and `data:check` pass and any changed figure has a moved retrieval date. Source: `docs/pm/M8/todo/DATA-802.md` and this PRD's Open questions and owners table. |
| FR-039 | Keyboard and phone access | A visitor can operate the decision tool with keyboard input on a narrow screen. | Must | Keyboard traversal reaches every interactive chart point, table row, drawer item, control-row action, and readout; every route is usable at 360 px with no horizontal scroll; focus is visible. Source: `docs/pm/M5/README.md` (Acceptance) and `docs/pm/M5/todo/UI-514.md`; `docs/pm/M6/README.md` (Acceptance); `PRODUCT.md` (Accessibility & Inclusion). |
| FR-040 | Motion, table, and contrast alternatives | The same contractual information remains available without motion, color, or chart interaction. | Must | `prefers-reduced-motion` is honoured; every interactive chart and table has a real table twin carrying the same values, basis, confidence, benchmark version, source, and gaps; the contrast floors in `DESIGN.md` are met. Source: `docs/pm/M5/README.md` (Acceptance); `PRODUCT.md` (Accessibility & Inclusion); `DESIGN.md`. |
| FR-041 | Offline static output | A visitor can use the published build without a runtime data service. | Must | The build consumes committed normalized JSON, the browser makes zero data requests, and a clean build works without upstream secrets or network access. Source: `PRODUCT.md` (Operating Context and Positioning); `README.md` (The method); `ARCHITECTURE.md` (Boundary rules and Invariant index). |
| FR-042 | Data and attribution protection | The repository does not contaminate benchmark results or omit contractual credit. | Must | No benchmark task content, prompts, verifiers, or patches are committed; required attribution is schema-validated and rendered where required, including the verbatim Awesome Coding Plan block. Source: `PRODUCT.md` (Locked stack, Brand Commitments, Evidence on Hand); `ARCHITECTURE.md` (Invariant index, items 7 and 8); `docs/data-sources.md` (Awesome Coding Plan). |

## Non-Functional Requirements

### Performance

- The site is a static Astro build from committed JSON. It must not fetch data in the browser, and the build must work offline from the committed snapshot. Source: `PRODUCT.md` (Operating Context); `ARCHITECTURE.md` (Boundary rules).
- Derived output is deterministic. `data:check` recomputes the derived document in memory and fails when committed bytes are stale. Source: `README.md` (Data commands); `ARCHITECTURE.md` (Data CLI).
- Charts may recompute client-side from shipped values and URL state, but no runtime data request is introduced. Source: `docs/pm/M5/README.md` (boundaries) and `docs/pm/M5/todo/UI-511.md`.

### Security

- zod 4 validates every trust boundary: HTTP response, file on disk, and localStorage. Source: `PRODUCT.md` (Locked stack); `docs/pm/M6/todo/APP-601.md`.
- `AA_API_KEY` is never committed, shipped to the browser, or baked into a built asset. Source: `CAVEATS.md` §1.5; `ARCHITECTURE.md` (Environment).
- Benchmark task content, prompts, verifiers, and patches are never stored in this repository. Source: `PRODUCT.md` (Evidence on Hand); `CAVEATS.md` §3.
- Required attribution is treated as a validation boundary, not a decorative footer. Source: `ARCHITECTURE.md` (Invariant index, item 8); `docs/data-sources.md` (Summary).

### Compatibility

- The locked stack is Bun 1.4.2; TypeScript strict with no `any`; Astro 7 static output with no adapter; Tailwind v4 through `@tailwindcss/vite`, with tokens in CSS `@theme` and no `tailwind.config.js`; Apache ECharts 6; nanostores plus `@nanostores/persistent`; zod 4 at every trust boundary; committed normalized `data/*.json`; GitHub Pages; and `bun test`. Source: `PRODUCT.md` (Locked stack).
- The deployment target is the GitHub Pages project page `marshalfevzi.github.io/rack-rate` first, then the custom domain `rackrate.dev` when DNS is ready. The Astro `site` and `base` settings must support both modes, with the project-page base path before the custom-domain root path. Source: `PRODUCT.md` (Operating Context); `docs/pm/M7/todo/DOC-702.md`; `ARCHITECTURE.md` (Site configuration).
- Internal links and assets use the repository’s base-aware builders rather than hard-coded root paths. Source: `ARCHITECTURE.md` (Site configuration and Layouts and links).

### Accessibility

The committed accessibility requirements are:

- Keyboard traversal of every interactive chart, table, and control, with visible focus states.
- Real table twins carrying the same values as interactive charts and tables.
- `prefers-reduced-motion` honoured.
- A 360 px layout with no horizontal scroll.
- The contrast floors recorded in `DESIGN.md`.

These requirements are verified by hand at phone and desktop widths as specified by the product documents. This PRD does not claim a WCAG conformance level, because none has been committed. Source: `PRODUCT.md` (Accessibility & Inclusion); `docs/pm/M5/README.md` (Acceptance) and `docs/pm/M5/todo/UI-514.md`; `docs/pm/M6/README.md` (Acceptance); `DESIGN.md`.

## Technical Specifications

### Module boundaries

- `packages/core` is pure domain code. It has no `fetch`, `node:fs`, `Bun.file`, or clock; a date-dependent function receives the date as an argument.
- `packages/data-cli` owns all network and filesystem access and exposes the `rack-rate-data` command surface.
- `apps/site` builds statically from committed data and never fetches. The browser makes zero data requests and the build works offline.

These boundaries are the required implementation contract; detailed module ownership, data flow, commands, site configuration, and link behavior belong in `ARCHITECTURE.md`.

### Data contract

The normalized committed documents are:

- `data/models.json` — model rows, benchmark identity, confidence, cost basis, and freshness.
- `data/plans.json` — plan rows, quota model, model scope, evidence, confidence, known gaps, and freshness.
- `data/benchmarks.json` — benchmark versions, task metadata, rows, scores, intervals, costs, and provenance.
- `data/sources.json` — source identity, URL, licence, retrieval date, coverage, changes, and required attribution.
- `data/derived.json` — generated deterministic joins and derived comparison values; it is written by the data pipeline and checked for stale bytes.

The shapes and naming constraints are defined by `packages/core/src/schema.ts` and recorded in `ARCHITECTURE.md` (Data contract), which carries the migrated plan's contract section.

### Environment

The data CLI reads `AA_API_KEY`, `AA_PUBLISH`, and `HARBOR_BIN`. Artificial Analysis is off unless both `AA_API_KEY` is present and `AA_PUBLISH=1`; a key alone never enables publication. `HARBOR_BIN` selects the optional Harbor executable before the `PATH` fallback. Source: `docs/pm/M7/todo/DOC-702b.md`; this PRD's Open questions and owners table; `ARCHITECTURE.md` (Environment); `README.md` (Environment variables).

### Gates

The required gates are `bun run check`, `bun test`, and `bun run data:check`. The CI job also runs the compute-write guard so a compute step cannot leave `data/` dirty unexpectedly. `bun run build` is the release build and `bun run doctor` is the source-probe diagnostic. Source: `ARCHITECTURE.md` (Operations and commands); `data/fixtures/README.md` (frozen hashes); `ARCHITECTURE.md` (Operations and commands); `docs/pm/M7/README.md` (Acceptance).

## Analytics & Monitoring

No analytics snippet ships, and none may be added. The analytics snippet deleted in stage 1 is not reintroduced. The deployed site has no runtime telemetry. Source: `ARCHITECTURE.md` (Anti-signals and incumbent residue, “Dead analytics snippet”); the Product Overview above and `PRODUCT.md` (Operating Context).

Operational observability is limited to the CI checks: `bun run check`, `bun test`, `bun run data:check`, and the compute-write guard. The `doctor` command probes source and vendor URLs, reports Artificial Analysis environment state, checks data-file parsing, and reports URL liveness findings. Source: `ARCHITECTURE.md` (Data CLI and Operations and commands); `docs/pm/M8/todo/DATA-801.md` and `docs/pm/M8/todo/DATA-802.md`.

## Appendix

### Glossary

| Term | Meaning in this product |
|---|---|
| Cost basis | The quantity a cost represents: API list, a named plan route, or the Artificial Analysis index cost. Bases are labelled and are not silently combined. Source: `PRODUCT.md` (Positioning); `CAVEATS.md` §2.4. |
| Measured vs adjusted | `measured` identifies observed/source values; `adjusted` identifies plan-adjusted or otherwise derived values. The interface distinguishes them by labels and chart grammar rather than hiding the transformation. Source: `docs/pm/M5/README.md` (chart grammar); `ARCHITECTURE.md` (Invariant index). |
| `single-source` composite badge | The explicit suppressed-composite state when fewer than two benchmark versions are available; missing data is not treated as a zero. Source: `CAVEATS.md` §2.2; `docs/pm/M5/todo/UI-507.md`. |
| `known_gaps` | Structured unresolved facts with a plan/provider context, reason, and optional URL; they are rendered rather than guessed away. Source: `ARCHITECTURE.md` (Data contract) and this PRD's Open questions and owners table. |
| `cost_per_task` | `price_per_month / tasks_per_month`, where the task count comes from a published or measured quota unit. Source: `README.md` (The method). |
| Break-even | The task volume used by the comparison to show when a subscription route pays for itself relative to the relevant API-list cost. Source: `README.md` (What it answers); `docs/pm/M6/README.md` (Acceptance). |
| Value multiple | The plan/model comparison field surfaced in model listings, plan listings, and wizard results; its calculation is part of the published method rather than an unexplained ranking. Source: `docs/pm/M5/todo/UI-507.md`, `docs/pm/M5/todo/UI-508.md`, and `docs/pm/M6/todo/APP-603.md`. |
| Days-for-full-run | The estimated time to complete the benchmark workload under the plan’s monthly and rolling-window caps. Source: `PRODUCT.md` (Product Purpose); `CAVEATS.md` §2.6. |
| `benchmark_version` | The version identifier that is part of a benchmark row’s identity and prevents cross-version tables or composites. Source: `ARCHITECTURE.md` (Invariant index, item 1). |

### Open questions and owners

| Question or gap | Owner / status |
|---|---|
| Whether and how Artificial Analysis may be published, including the default, chart-only, and data-file states | Stage 7 task 7.2b; the decision and reasoning must be recorded before deployment. Source: `docs/pm/M7/todo/DOC-702b.md`; `CAVEATS.md` §1.6. |
| Eight plan rows fail the anchor check and remain at their Stage 1 revision | Stage 8 task 8.1. Source: `docs/pm/M8/todo/DATA-801.md`. |
| `https://openai.com/chatgpt/pricing/` returns 404 for the ChatGPT Pro price citation | Stage 8 task 8.2. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`). |
| `https://support.google.com/googleone/answer/16287445` returns 404 for the `google-ai-pro` anchor | Stage 8 task 8.2. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`). |
| Google AI credits-to-tokens/dollars conversion and disputed AI Ultra price | No task currently owns the decision; retain `quota_unresolved` and `known_gaps`. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`); `CAVEATS.md` §2.8. |
| SuperGrok’s per-task coding quota | No task currently owns the decision; keep the shared-pool limitation as a gap. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`); `CAVEATS.md` §2.8. |
| MiniMax Coding Plan Plus FX conversion and pinned model | No task currently owns the decision; add only with recorded FX and model identity, or keep it as a gap. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`); `CAVEATS.md` §2.8. |
| Z.ai GLM international credit formula output weight | No task currently owns the decision; do not invent the conversion. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`). |
| Stable factor in the cross-check between conversion methods | No task currently owns the investigation; keep the discrepancy visible. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`). |
| Harbor fallback code path has been verified as reachable but not exercised | No task currently owns the execution; it remains a documented operational gap. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`). |
| `HARBOR_API_KEY` is inert because this repository does not read it | No task currently owns a change; revisit only if a fetch path needs authenticated access. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`). |
| Five chart builders and the Explore metric builder lack unit tests | Stage 5 task 5.9. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`); `docs/pm/M5/todo/UI-509.md`. |
| First live firing of the `push: branches: [main]` deployment trigger | No task currently owns a change; content is verified and the first live use is the next push. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`). |
| Deployed 404 status/noindex behavior | Stage 7 task 7.4; the stray canonical is Stage 5 task 5.13. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`). |
| Three remaining accessibility residues from the earlier pass | Stage 5 task 5.14. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`). |
| Plan rows priced only by aggregators (Cursor Pro+/Ultra, Ollama Max/Team) | `confidence: low`, never a computed row. No task owns a change. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`); `CAVEATS.md` §2.3. |
| ChatGPT Codex quota is unnumbered on the pricing page and draws from token credit pools | `medium` confidence at most; no task owns a change. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`). |
| The Terminal-Bench payload is an undocumented flight-data blob that can move without notice | Mitigated by the Harbor CLI fallback and a loud parse failure rather than a silent empty table; the fallback is reachable but unexercised. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`). |
| DeepSWE publishes several effort levels per model; only the best-scoring configuration is a row | The ladder is retained as `effort_variants` and no other level is scored. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`). |
| `gpt-6-astra`'s price is provisional (an anticipated launch rate, not a GA rate card) | Carried as `cost_basis: expected-launch`. No task owns a change. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`). |
| Two models ship without an identified vendor | They carry `provider: null` rather than an invented company, which also means no plan route prices them. Source: the pre-PM plan's open-questions register (`git show d95e6ef:PLAN.md`). |

### Source pointers

- [`docs/data-sources.md`](docs/data-sources.md) — source records, licences, retrieval policy, and attribution.
- [`CAVEATS.md`](CAVEATS.md) — unresolved licensing and data-quality limits.
- [`PRODUCT.md`](PRODUCT.md) — product truth, users, positioning, capabilities, and commitments.
- [`DESIGN.md`](DESIGN.md) — the visual system and contrast floors.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — module boundaries, data flow, environment, and gates.
- [`docs/pm/`](docs/pm/) — the live plan: milestones M5–M8, the task documents, the decision records, and the generated
  index. Pre-PM stages 5, 6, 7 and 8 became milestones M5, M6, M7 and M8 in that order; stages 1–4 landed and are
  milestones M1–M4, whose frozen stage records and session history are in [`docs/history/`](docs/history/); the data
  contract is in [`ARCHITECTURE.md`](ARCHITECTURE.md) and the open-gap register is the table above. The pre-PM `PLAN.md` was deleted after the migration; recover it with `git show d95e6ef:PLAN.md`.
