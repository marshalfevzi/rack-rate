# Surface layout: Divine Machinery

This file specifies route composition and responsive behavior for the replacement visual world. It does not define the design system. Token names, values, typefaces, stroke grammar, and chart rules are defined in [`DESIGN.md`](../../DESIGN.md). This file uses those tokens by role and records only layout metrics and route behavior. Sequencing and implementation order belong in [`docs/design/build-plan.md`](build-plan.md).

The product is `rack-rate`. Bosphorus Elevate is credited as maker in the footer and on About copy; its photo treatment is not part of these surfaces. The shell and every route are a console listing: fixed columns, line-number gutters, a carriage-control state cell, and explicit provenance.

## Shared shell

### Frame and responsive geometry

| Region | Desktop (1440) | Tablet (768–1023) | Phone (390 and below) |
| --- | --- | --- | --- |
| Content width | `max-width: 1440px`; edge gutter `48px` at `≥1280px` | edge gutter `32px` at `≥768px` | edge gutter `24px` |
| Status band | pinned at the top, `32px` high | same | same; reduced contents |
| Lane rail | left rail, `176px` wide, lanes `01–06`, `40px` rows, 1px rules, then unnumbered `METHOD`/`SOURCES` reference rows | dropped at the `1024px` boundary; opened by the band drawer | drawer, opened by `MENU`; it does not displace page content |
| Readout line | one fixed `28px` line at the viewport bottom; page body reserves `28px` bottom padding | same | docks inline directly below the status band and updates in place |
| Table row | `36px` | `36px` | `44px` |
| Line-number gutter | `40px` | `28px` from the `768px` breakpoint | dropped at the `480px` breakpoint |
| State cell | `20px`, carriage-control column | `20px` | never dropped; glyph moves to the leading edge of the key cell, separated by `8px`; key-cell left padding is removed |
| Rules | 1px structural rules; 2px section and table-head rules | same | same |

The drop order is deliberate: lane rail first; at `768px`, repeated table heads are dropped and the line-number gutter shrinks to `28px`; at `480px`, the line-number gutter drops. The state mark remains available at every width. At `360px`, rows use the stacked listing behavior in [Listing table anatomy](#listing-table-anatomy), so there is no horizontal page scroll.

A section opens with a 2px top rule. Its content sits in the panel layer. Corners are square. The band, rail, table head, readout, and footer are structure, not decoration.

### Status band

The band is one semantic landmark (`header`) and one row. Its contents, left to right, are:

1. `RACK-RATE`, a link to `/`.
2. `BUILD {derivedGeneratedAt}`; the displayed date is the committed `data/derived.json` generation date.
3. `DATA {latest retrieved_at}`; the displayed date is the newest committed upstream retrieval date.
4. `AA {ON|OFF}`; the value is the Artificial Analysis gate state, and links to the state explanation on `/sources`.

`RACK-RATE`, `BUILD`, `DATA`, and `AA` are uppercase mono functional labels. `--color-faint` is the lowest-contrast text token and is reserved for uppercase mono legends at `≥11px` against the band, rail, or table-head `--color-panel-2` ground; it never labels a table cell, figure, source line, or control. The band never contains a slogan, an icon-only control, a theme switch, or a decorative mark. Colour scheme follows the operating-system preference (`prefers-color-scheme`): dark is the initial state and light is the same structure with the inversion in `DESIGN.md`, so there is no in-page theme control.

At phone width the band keeps `RACK-RATE`, `AA {ON|OFF}`, and `MENU` in that order. `BUILD` and `DATA` move into the opened drawer so the band does not wrap. `MENU` is a text button with an accessible name and a visible focus ring.

### Lane rail

The rail is a single `nav` landmark labelled `Lanes`. It has six numbered working surfaces followed by an unnumbered reference group. Numbers are stable keyboard and footer anchors.

| Lane | Label | Route |
| --- | --- | --- |
| `01` | `OVERVIEW` | `/` |
| `02` | `MODELS` | `/models`, `/models/[slug]` |
| `03` | `PLANS` | `/plans`, `/plans/[slug]` |
| `04` | `COMPARE` | `/compare` |
| `05` | `EXPLORE` | `/explore` |
| `06` | `GET STARTED` | `/start` |

After lane 06, a 2px rule separates the reference group. `METHOD` and `SOURCES` are unnumbered, 36px rows with `--color-dim` labels and the same hover and focus treatment. They are reference material, not tools. The rail's total height is `314px`: six `40px` lane rows, a 2px separator, and two `36px` reference rows. Detail routes highlight their parent working lane; `/404` has no active lane and leaves every row available.

The active working lane has a signal-colour plate with `--color-on-signal` text and the active route has `aria-current="page"`. The signal is not used for inactive lane text.

Desktop keyboard behavior is roving focus in the rail: `Tab` enters the active working lane, `ArrowUp` and `ArrowDown` move through all lane and reference rows, `Home` and `End` jump to the first and last row, and `Enter` or `Space` activates the focused row. A plain `Tab` then leaves the rail for the main content. This is a link list, not a tab panel; navigation is not hidden behind a pointer gesture.

The mobile drawer is closed by default. `MENU` opens it after the band in DOM order, moves focus to the active working lane (or `METHOD`/`SOURCES` when that is the current route), traps focus within the drawer while open, and closes on `Escape`, the close button, or a route activation. The page behind it remains at the same scroll position. Numbered lane rows retain `40px` height; reference rows retain `36px`.

### Set-aside rail

An excluded row is still visible. The `-` carriage-control mark moves that row to a set-aside rail titled `SET-ASIDE`, placed beside the live listing at desktop widths and after the live listing at tablet and phone widths. The set-aside uses the same line-number, state, rule, and row grammar; it never uses colour as the only distinction. Its rows retain the reason for exclusion. A zero-row set-aside renders `SET-ASIDE` followed by `No excluded rows in this view.` rather than disappearing.

### Cursor readout

There is one readout element for the entire page, not one tooltip per chart or table. It is a fixed 28px line at `≥768px`; the page body reserves 28px of bottom padding and the readout never covers the footer index at the end of the scroll. Below `768px`, the same element docks directly under the status band and updates in place.

Its field order never changes:

`VALUE {value} · BASIS {basis} · CONFIDENCE {measured|high|medium|low} · SOURCE {source} · RETRIEVED {retrieved}`

Before focus or pointer movement, it prints the page's own headline figure with its full provenance. It is never blank and never a hint string. Keyboard focus, touch focus, and pointer hover on a figure update this one line. A chart's accessible table twin exposes the same readout fields. If the figure is missing, `VALUE —` remains visible and the source line explains the gap.

### Footer index, skip link, and tab order

The footer is an indexed directory, not a second visual navigation treatment. It prints `[01] OVERVIEW`, `[02] MODELS`, `[03] PLANS`, `[04] COMPARE`, `[05] EXPLORE`, `[06] GET STARTED`, then the unnumbered `METHOD` and `SOURCES` reference links, followed by the source and maker credit. The footer names Bosphorus Elevate as maker only. It also keeps the existing score, plan, licence, and Artificial Analysis gate attributions readable on `/sources`.

The first focusable item is `Skip to content`, which targets `#main`. It is visually clipped until focused and then uses the visible focus treatment from `DESIGN.md`. The order after activation is: band brand; band status links and controls; mobile `MENU` (when present); lane rail; main heading; route control row; listing filter row; listing rows; chart control row; chart and table twin controls; set-aside rail; footer index. The readout is an `aria-live="polite"` status line and is not inserted as a repeated tab stop. Focus never depends on hover.

## Route inventory

`Operate` pages have a first action in the opening listing or control row. `Read` pages put the evidence heading and its first cited value in the opening viewport. Every URL-backed control writes its current value to the URL and restores it from the URL on reload. The values below use the names already present in the route code or committed data.

| Route | Mode | First five seconds | Primary layout blocks | Mobile collapse rule |
| --- | --- | --- | --- | --- |
| `/` | Operate | Choose a plan, model, and monthly task count; see the effective monthly cost and break-even tasks. | Split console; selection listing; readout listing; set-aside; headline index. | Selection stacks above readout; plan, model, and task fields stay first; readout remains directly below band. |
| `/models` | Operate | Search or filter a model and compare `Score (pass@1)`, `Pass@4`, cheapest usable plan, and `Days to full run`. | Filter row; model listing; set-aside; cursor readout. | Repeated head drops at `768px`; rows stack at `360px` with all fields retained as labelled lines. |
| `/models/[slug]` | Read | Confirm the model's `pass@1`, separate `pass@4`, cost basis, and available plan routes. | Score profile; effort ladder; priced route listing; provenance rail; outbound benchmark listing. | Two score blocks stack; each table becomes labelled records; provenance follows routes. |
| `/plans` | Operate | Sort the plan listing by value multiple or inspect price, quota, cost/task, and models unlocked. | Sortable plan listing; set-aside; cursor readout. | Long rows become records in field priority order; no horizontal scroll. |
| `/plans/[slug]` | Read | Read price/quota basis, then scan models unlocked by this plan. | Plan details; quota explanation; method; known gaps; models-unlocked listing. | Detail fields become one column; models listing becomes records; gap text remains adjacent to the affected value. |
| `/compare` | Operate | Select two to four models and immediately see benchmark scores, CI, API list cost, and plan-route rows. | Model selection row; comparison listing; tie rule; cursor readout. | Selection becomes a full-width fieldset; the comparison matrix becomes metric records with one model block per record. |
| `/explore` | Operate | Switch cost basis or plan and inspect the Pareto frontier; the benchmark rank and metric builders remain below. | Pareto; bump; heatmap; slope; waterfall; radar; metric builder; table twins. | Charts keep reserved height; controls wrap; each chart's twin table follows its plot and keeps the same basis words. |
| `/start` | Operate | Select provider, plan, model, and usage, then read a ranked recommendation with cost/task and break-even volume. | Three-step selection console; recommendation readout; provenance line. | Steps become one vertical listing; completed steps remain editable and the recommendation follows. |
| `/method` | Read | Find the formula and its named inputs, then verify benchmark version and composite coverage rules. | Formula sections; quota branch listing; cost-basis legend; benchmark-weight listing; confidence/freshness index. | Formula lines wrap as prose; tables become labelled records; code field names remain intact. |
| `/sources` | Read | Confirm the Artificial Analysis gate, then inspect a source's licence, coverage, changes, and retrieval date. | AA state readout; source listing; required attribution; deliberate gaps; commitments. | Source records stack; each date and licence stays in the opening source block. |
| `404` | Read | Return to `/`, `/models`, or `/plans` without guessing what failed. | Not-found readout; indexed links. | Links stack at full width; shell and drawer remain unchanged. |

## Per-route specifications

Each 1440px wireframe includes the shared shell labels so that the gutters and carriage-control cells remain part of the page contract. `LN` is the 40px line-number gutter, `ST` is the 20px state cell, and `R` is the structural rule.

### `/` — OVERVIEW / Operate

The entry surface is a split console. The left column is selection, in order: plan, then models, then usage. It is prefilled with the first committed plan, `Claude Pro` (`plan.id=claude-pro`), its measured-against model `claude-opus-4.8`, and `300` tasks/month from the existing route default. The right column is the only budget readout listing. Every control writes its value to the URL: `plan=claude-pro`, `models=...`, and `tasks=300` are the initial query fields.

```text
┌─ STATUS BAND 32px: RACK-RATE │ BUILD {date} │ DATA {date} │ AA {ON|OFF} ───────────────────────────────┐
├─ LANE RAIL 176px ───────┬─ EDGE GUTTER 48px ─┬─ LN 40px ┬ ST 20px ┬───────────────────────────────┐
│ 01 OVERVIEW       [ON]  │                    │           │         │  OVERVIEW                         │
│ 02 MODELS               │                    │           │         │  ┌─2px rule─ SPLIT CONSOLE────────┐│
│ 03 PLANS                │                    │           │         │  │ SELECT                         ││
│ 04 COMPARE              │                    │           │         │  │ PLAN [Claude Pro]              ││
│ 05 EXPLORE              │                    │           │         │  │ MODELS [claude-opus-4.8, ...]  ││
│ 06 GET STARTED          │                    │           │         │  │ TASKS/MONTH [300]              ││
│ ───────── 2px RULE ─────│                    │           │         │  ├────────────── R ──────────────┤│
│ METHOD                  │                    │           │         │  │ READOUT LISTING                ││
│ SOURCES                 │                    │           │         │  │ LN ST PLAN │ MODEL PRICED │     ││
│                         │                    │           │         │  │    │    │ EFFECTIVE MONTHLY COST ││
│                         │                    │           │         │  │    │    │ BREAK-EVEN TASKS/MONTH   ││
├─────────────────────────┴────────────────────┴───────────┴─────────┴────────────────────────────────┤
│ fixed cursor readout 28px: VALUE {headline} · BASIS {basis} · CONFIDENCE {level} · SOURCE {source} · RETRIEVED {date} │
└─ FOOTER INDEX: [01] OVERVIEW ... [06] GET STARTED · METHOD · SOURCES · maker Bosphorus Elevate ─────┘
```

Column heads are `Plan`, `Model priced`, `Effective monthly cost`, and `Break-even tasks/month`; the last two are numeric and right-aligned. The effective cost head states `API list` in words in the same head. The cursor's default value is the headline effective monthly cost for `Claude Pro` at 300 tasks/month, with its basis, confidence, source, and retrieved date.

At 390px, the band and inline readout precede the main content. The split becomes one column: `SELECT` (plan → models → tasks/month) then `READOUT LISTING`. The line-number gutter is absent, `ST` moves inline before the plan name, and rows remain 44px. The set-aside follows the listing. Headline figures and continue links follow the readout.

States: `empty` uses `No committed rows for this view.`; `filtered-to-nothing` uses `No rows match the current filters.` if a model selection filter yields no rows; a missing plan row is a gap row using `Known gap: {reason}`; a model composite shown in the headline uses `Composite suppressed: fewer than two benchmark versions (single-source).` when applicable. Controls owned: plan selector, model selector, tasks/month number field, reset selection, and URL synchronization.

### `/models` — MODELS / Operate

```text
┌─ STATUS BAND 32px: RACK-RATE │ BUILD {date} │ DATA {date} │ AA {ON|OFF} ───────────────────────────────┐
├─ LANE RAIL 176px ───────┬─ EDGE GUTTER 48px ─┬─ LN 40px ┬ ST 20px ┬───────────────────────────────┐
│ 01 OVERVIEW             │                    │           │         │  MODELS                           │
│ 02 MODELS       [ON]    │                    │           │         │  FILTER NAME OR PROVIDER | VENDOR │
│ 03 PLANS                │                    │           │         │  SCORE FLOOR                       │
│ 04 COMPARE              │                    │           │         │  ─────────────── R ───────────────│
│ 05 EXPLORE              │                    │           │         │  MODEL | SCORE (PASS@1) | PASS@4  │
│ 06 GET STARTED          │                    │           │         │  API LIST COST/TASK | CHEAPEST    │
│ ───────── 2px RULE ─────│                    │           │         │  USABLE PLAN | VALUE MULTIPLE     │
│ METHOD                  │                    │           │         │  DAYS TO FULL RUN | EFFORT        │
│ SOURCES                 │                    │           │         │  COMPOSITE COVERAGE               │
├─────────────────────────┴────────────────────┴───────────┴─────────┴────────────────────────────────┤
│ fixed cursor readout 28px: VALUE {score} · BASIS pass@1 · CONFIDENCE {level} · SOURCE {source} · RETRIEVED {date} │
└─ FOOTER INDEX ───────────────────────────────────────────────────────────────────────────────────────┘
```

The listing columns are the current route's `Model`, `Score (pass@1)`, `Pass@4`, `API list cost/task`, `Cheapest usable plan`, `Value multiple`, `Days to full run`, `Effort`, and `Composite coverage`. `Score (pass@1)` and `Pass@4` never share a field, axis, or formula. Numeric cells are right-aligned. The filter row owns `Name or provider`, `Vendor`, and `Score floor`; a sort control belongs to each sortable head and writes `sort` and `direction` to the URL.

At 390px, the filter row stacks in the order name/provider, vendor, score floor. Table heads are not repeated after `768px`; at `360px`, each row is a 44px-or-more labelled record in the order Model, Score (pass@1), Pass@4, API list cost/task, Cheapest usable plan, Value multiple, Days to full run, Effort, Composite coverage. No field is hidden. The state glyph is inline before the model name.

States: `empty` uses `No committed rows for this view.`; `filtered-to-nothing` uses `No rows match the current filters.`; a model with missing plan route keeps a visible `Known gap: {reason}` row in `SET-ASIDE`; a composite with `k < 2` keeps `Composite suppressed: fewer than two benchmark versions (single-source).`. Controls owned: text filter, vendor select, score floor, sortable heads, row selection for the cursor, and URL query restoration.

### `/models/[slug]` — MODELS / Read

The detail surface begins with a headline score and provenance, not a card grid. The two score blocks are separate sections. `CiBar` is the interval presentation for `pass@1`; `pass@4` is a display-only field.

```text
┌─ STATUS BAND 32px: RACK-RATE │ BUILD {date} │ DATA {date} │ AA {ON|OFF} ───────────────────────────────┐
├─ LANE RAIL 176px ───────┬─ EDGE GUTTER 48px ─┬─ LN 40px ┬ ST 20px ┬───────────────────────────────┐
│ 01 OVERVIEW             │                    │           │         │  MODEL NAME / PROVIDER             │
│ 02 MODELS       [ON]    │                    │           │         │  ─────────────── R ───────────────│
│ 03 PLANS                │                    │           │         │  SCORE PROFILE                     │
│ 04 COMPARE              │                    │           │         │  pass@1 score · CI · API $/task    │
│ 05 EXPLORE              │                    │           │         │  pass@4 · DISPLAY ONLY             │
│ 06 GET STARTED          │                    │           │         │  ─────────────── R ───────────────│
│ ───────── 2px RULE ─────│                    │           │         │  EFFORT LADDER                     │
│ METHOD                  │                    │           │         │  effort | score | API $/task |     │
│ SOURCES                 │                    │           │         │  input tokens | output tokens |    │
│                         │                    │           │         │  steps                             │
│                         │                    │           │         │  PRICED PLAN ROUTES                │
│                         │                    │           │         │  plan | provider | price/month |  │
│                         │                    │           │         │  tasks/month | cost/task | days    │
│                         │                    │           │         │  for full run | confidence          │
├─────────────────────────┴────────────────────┴───────────┴─────────┴────────────────────────────────┤
│ fixed cursor readout 28px: VALUE {score} · BASIS {basis} · CONFIDENCE {level} · SOURCE {source} · RETRIEVED {date} │
└─ FOOTER INDEX ───────────────────────────────────────────────────────────────────────────────────────┘
```

The effort ladder column heads are `effort`, `score`, `API $/task`, `input tokens`, `output tokens`, and `steps`. The route listing heads are `plan`, `provider`, `price/month`, `tasks/month`, `cost/task`, `days for full run`, and `confidence`. Each cost cell names `API list` or `plan route` beside the number. `Provenance rail` shows `SourceLink`, formula text, and freshness. `Outbound benchmarks` uses the committed benchmark title and score, with source links.

At 390px, score profile blocks stack, then effort records and route records stack. Provider and source lines wrap in Plex Sans. The state mark is inline at the leading edge of `plan` or `effort` and remains 8px from the value.

States: `empty` uses `No committed rows for this view.` for an empty benchmark or route listing; `filtered-to-nothing` is not applicable because this page has no filter and uses the empty string when its scoped listing has no rows; missing benchmark or route data uses `Known gap: {reason}`; the composite line uses `Composite suppressed: fewer than two benchmark versions (single-source).`. Controls owned: outbound source links, row focus for cursor readout, and the back links to model and plan indexes. No data is fetched client-side.

### `/plans` — PLANS / Operate

```text
┌─ STATUS BAND 32px: RACK-RATE │ BUILD {date} │ DATA {date} │ AA {ON|OFF} ───────────────────────────────┐
├─ LANE RAIL 176px ───────┬─ EDGE GUTTER 48px ─┬─ LN 40px ┬ ST 20px ┬───────────────────────────────┐
│ 01 OVERVIEW             │                    │           │         │  PLANS                            │
│ 02 MODELS               │                    │           │         │  ─────────────── R ───────────────│
│ 03 PLANS        [ON]    │                    │           │         │  RANK | PLAN | PROVIDER |         │
│ 04 COMPARE              │                    │           │         │  PRICE/MONTH | QUOTA MODEL |      │
│ 05 EXPLORE              │                    │           │         │  KEY QUOTA | ROLLING WINDOW |    │
│ 06 GET STARTED          │                    │           │         │  MEASURED-AGAINST MODEL | VALUE   │
│ ───────── 2px RULE ─────│                    │           │         │  MULTIPLE | COST/TASK · MEASURED │
│ METHOD                  │                    │           │         │  DAYS/FULL RUN | CONFIDENCE |     │
│ SOURCES                 │                    │           │         │  MODELS UNLOCKED                  │
├─────────────────────────┴────────────────────┴───────────┴─────────┴────────────────────────────────┤
│ fixed cursor readout 28px: VALUE {multiple or cost} · BASIS {basis} · CONFIDENCE {level} · SOURCE {source} · RETRIEVED {date} │
└─ FOOTER INDEX ───────────────────────────────────────────────────────────────────────────────────────┘
```

The listing columns are the current route's `rank`, `plan`, `provider`, `price/month`, `quota model`, `key quota`, `rolling window`, `measured-against model`, `value multiple`, `cost/task · measured model`, `days/full run`, `confidence`, and `models unlocked`. `price/month` is plan-route basis; `key quota` or `rolling window` can carry API list basis when the source field is a budget. The header states each basis in words.

At 390px, the sortable listing becomes one record per plan in the same column order. The plan name and state mark lead each record; price, quota, and route cost follow; confidence and model count close it. At `360px`, no horizontal scrolling is used.

States: `empty` uses `No committed rows for this view.`; `filtered-to-nothing` uses `No rows match the current filters.` if the optional URL filter is present; unresolved quota is a gap row with `Known gap: {reason}` and no zero-valued cost; a measured model with suppressed composite shows `Composite suppressed: fewer than two benchmark versions (single-source).`. Controls owned: sortable heads (`rank`, `value multiple`, `cost/task · measured model`, `days/full run`, and `models unlocked`), URL sort direction, row focus, and set-aside disclosure.

### `/plans/[slug]` — PLANS / Read

```text
┌─ STATUS BAND 32px: RACK-RATE │ BUILD {date} │ DATA {date} │ AA {ON|OFF} ───────────────────────────────┐
├─ LANE RAIL 176px ───────┬─ EDGE GUTTER 48px ─┬─ LN 40px ┬ ST 20px ┬───────────────────────────────┐
│ 01 OVERVIEW             │                    │           │         │  PLAN NAME / PROVIDER              │
│ 02 MODELS               │                    │           │         │  ─────────────── R ───────────────│
│ 03 PLANS        [ON]    │                    │           │         │  PLAN DETAILS                      │
│ 04 COMPARE              │                    │           │         │  price/month | quota model | key  │
│ 05 EXPLORE              │                    │           │         │  quota | rolling window | measured │
│ 06 GET STARTED          │                    │           │         │  -against model | value multiple  │
│ ───────── 2px RULE ─────│                    │           │         │  days for a full run · measured     │
│ METHOD                  │                    │           │         │  model | confidence                 │
│ SOURCES                 │                    │           │         │  QUOTA MODEL EXPLANATION            │
│                         │                    │           │         │  METHOD · KNOWN GAPS                │
│                         │                    │           │         │  MODELS THIS PLAN UNLOCKS           │
│                         │                    │           │         │  model | cost/task | tasks/month  │
│                         │                    │           │         │  days/full run | confidence |      │
│                         │                    │           │         │  freshness                         │
├─────────────────────────┴────────────────────┴───────────┴─────────┴────────────────────────────────┤
│ fixed cursor readout 28px: VALUE {cost or quota} · BASIS plan route · CONFIDENCE {level} · SOURCE {source} · RETRIEVED {date} │
└─ FOOTER INDEX ───────────────────────────────────────────────────────────────────────────────────────┘
```

Plan details use the current fields `Price/month`, `Quota model`, `Key quota figure`, `Rolling window`, `Measured-against model`, `Value multiple`, `Days for a full run · measured model`, and `Confidence`. The models-unlocked listing uses `model`, `cost/task`, `tasks/month`, `days/full run`, `confidence`, and `freshness`. Quota explanation and method paragraphs use the exact `quota_model` field names from `data/plans.json`.

At 390px, plan details are a single labelled listing, then quota explanation, method, known gaps, and models. The models table becomes stacked records. Missing route values stay `—` plus the gap reason; the state mark moves inline before the model name.

States: `empty` uses `No committed rows for this view.`; `filtered-to-nothing` is not applicable to the unfiltered detail listing and falls back to the empty string when no admitted model rows exist; a plan quota gap uses `Known gap: {reason}`; a model's suppressed composite uses `Composite suppressed: fewer than two benchmark versions (single-source).`. Controls owned: source links, row focus, and return links to `/plans` and `/models`; there is no client-side fetch.

### `/compare` — COMPARE / Operate

The comparison table is generated from two to four selected models. It is a matrix with one `Metric` column, one column for each selected model, and one `Comparison` column. The selected model header includes model name, provider, composite index or suppressed state, and model-level CI.

```text
┌─ STATUS BAND 32px: RACK-RATE │ BUILD {date} │ DATA {date} │ AA {ON|OFF} ───────────────────────────────┐
├─ LANE RAIL 176px ───────┬─ EDGE GUTTER 48px ─┬─ LN 40px ┬ ST 20px ┬───────────────────────────────┐
│ 01 OVERVIEW             │                    │           │         │  COMPARE                          │
│ 02 MODELS               │                    │           │         │  MODELS: [ ] A [ ] B [ ] C [ ] D  │
│ 03 PLANS                │                    │           │         │  2–4 SELECTED                     │
│ 04 COMPARE      [ON]    │                    │           │         │  ─────────────── R ───────────────│
│ 05 EXPLORE              │                    │           │         │  METRIC | MODEL A | MODEL B |     │
│ 06 GET STARTED          │                    │           │         │  MODEL C | MODEL D | COMPARISON   │
│ ───────── 2px RULE ─────│                    │           │         │  DeepSWE v1.1 (version 1.1)       │
│ METHOD                  │                    │           │         │  Terminal-Bench 4.0 (version 4.0.0)│
│ SOURCES                 │                    │           │         │  API LIST $/TASK                  │
│                         │                    │           │         │  {PLAN NAME} ROUTE $/TASK rows    │
│                         │                    │           │         │  tie rule: statistical tie at 95%  │
├─────────────────────────┴────────────────────┴───────────┴─────────┴────────────────────────────────┤
│ fixed cursor readout 28px: VALUE {cell} · BASIS {basis} · CONFIDENCE {level} · SOURCE {source} · RETRIEVED {date} │
└─ FOOTER INDEX ───────────────────────────────────────────────────────────────────────────────────────┘
```

The benchmark row labels are the committed benchmark `title` and `version`: `DeepSWE v1.1` (`version 1.1`) and `Terminal-Bench 4.0` (`version 4.0.0`) in the current data. Cost rows are `API list $/task` and one `{plan name} route $/task` per available plan route. The comparison column states `Plain score comparison` or `Plain cost comparison`; interval overlap is labelled `statistical tie at 95%` and ranks are ranges.

At 390px, the model checkbox fieldset stacks and remains first. The matrix becomes one metric record at a time: metric label, selected model values, then comparison. The model header is repeated at the start of each record so no horizontal scroll or hidden column is needed. `Metric` and `Comparison` remain text labels, and `ST` is inline at the leading metric label.

States: `empty` uses `No committed rows for this view.`; `filtered-to-nothing` uses `No rows match the current filters.` only if a model search is added to the selection fieldset; fewer than two selections uses `Choose at least 2 models`; an unavailable route or benchmark cell uses `Known gap: {reason}` (the table retains `not available` as the data cell's factual label); a suppressed composite in a model header uses `Composite suppressed: fewer than two benchmark versions (single-source).`. Controls owned: model checkboxes limited to two through four, URL selection `models=...`, row focus, and the tie-rule disclosure.

### `/explore` — EXPLORE / Operate

Explore is a vertical instrument panel. It keeps every chart's accessible table twin immediately after the plot. The metric builder controls stay in a single named control row followed by weights and presets. The built-in ECharts toolbox is absent; all actions are in these rows.

```text
┌─ STATUS BAND 32px: RACK-RATE │ BUILD {date} │ DATA {date} │ AA {ON|OFF} ───────────────────────────────┐
├─ LANE RAIL 176px ───────┬─ EDGE GUTTER 48px ─┬─ LN 40px ┬ ST 20px ┬───────────────────────────────┐
│ 01 OVERVIEW             │                    │           │         │  EXPLORE                          │
│ 02 MODELS               │                    │           │         │  PARETO: API LIST $/TASK          │
│ 03 PLANS                │                    │           │         │  COST BASIS [API LIST|PLAN ROUTE] │
│ 04 COMPARE              │                    │           │         │  PLAN [Claude Pro]                │
│ 05 EXPLORE      [ON]    │                    │           │         │  [PARETO PLOT] [TABLE TWIN]       │
│ 06 GET STARTED          │                    │           │         │  BUMP RANK ACROSS BENCHMARKS      │
│ ───────── 2px RULE ─────│                    │           │         │  [BUMP PLOT] [TABLE TWIN]         │
│ METHOD                  │                    │           │         │  HEATMAP · SLOPE · WATERFALL       │
│ SOURCES                 │                    │           │         │  RADAR · each with control row,   │
│                         │                    │           │         │  fixed plot, cursor readout, twin  │
│                         │                    │           │         │  METRIC BUILDER                    │
│                         │                    │           │         │  Y METRIC | X METRIC | CHART TYPE  │
│                         │                    │           │         │  VENDOR | REASONING EFFORT |       │
│                         │                    │           │         │  SCORE FLOOR | LOG X | FRONTIER    │
├─────────────────────────┴────────────────────┴───────────┴─────────┴────────────────────────────────┤
│ fixed cursor readout 28px: VALUE {figure} · BASIS {basis} · CONFIDENCE {level} · SOURCE {source} · RETRIEVED {date} │
└─ FOOTER INDEX ───────────────────────────────────────────────────────────────────────────────────────┘
```

At 390px, each chart is full width with its reserved height from [Chart placement](#chart-placement). Controls wrap above the plot. A chart's table twin is a normal listing below the plot; it is not hidden behind hover. The page remains usable with JavaScript disabled through the twin tables and method links.

States: `empty` uses `No committed rows for this view.`; a filtered builder or selected plan with no points uses `No rows match the current filters.`; missing chart values retain an open gap with `Known gap: {reason}` and a `!` tick; a composite metric with insufficient coverage uses `Composite suppressed: fewer than two benchmark versions (single-source).`. Controls owned: Pareto cost-basis radio and plan selector, slope model selector, waterfall plan and utilization controls, radar plan selector, builder Y metric, X metric, chart type, vendor, reasoning effort, score floor, log-X, frontier toggle, weights, and presets. Each writes a namespaced URL value (`paretoBasis`, `paretoPlan`, `slopeModel`, `waterfallPlan`, `utilization`, `radarPlan`, `builderY`, `builderX`, `builderType`, `vendor`, `effort`, `floor`, `logX`, `frontier`, and `weights`).

### `/start` — GET STARTED / Operate

`/start` is the selection wizard that the current route describes as provider → plan → model. It is a console form, not a card grid. It uses `provider`, `plan`, `model`, and usage fields already present in committed models/plans and ends in a ranked recommendation.

```text
┌─ STATUS BAND 32px: RACK-RATE │ BUILD {date} │ DATA {date} │ AA {ON|OFF} ───────────────────────────────┐
├─ LANE RAIL 176px ───────┬─ EDGE GUTTER 48px ─┬─ LN 40px ┬ ST 20px ┬───────────────────────────────┐
│ 01 OVERVIEW             │                    │           │         │  GET STARTED                     │
│ 02 MODELS               │                    │           │         │  01 PROVIDER [select]            │
│ 03 PLANS                │                    │           │         │  02 PLAN [select]                │
│ 04 COMPARE              │                    │           │         │  03 MODEL [select]               │
│ 05 EXPLORE              │                    │           │         │  USAGE TASKS/MONTH [number]      │
│ 06 GET STARTED [ON]     │                    │           │         │  ─────────────── R ───────────────│
│ ───────── 2px RULE ─────│                    │           │         │  RECOMMENDATION LISTING           │
│ METHOD                  │                    │           │         │  plan | model | cost/task |       │
│ SOURCES                 │                    │           │         │  break-even tasks/month |         │
│                         │                    │           │         │  confidence | source              │
├─────────────────────────┴────────────────────┴───────────┴─────────┴────────────────────────────────┤
│ fixed cursor readout 28px: VALUE {recommendation} · BASIS {basis} · CONFIDENCE {level} · SOURCE {source} · RETRIEVED {date} │
└─ FOOTER INDEX ───────────────────────────────────────────────────────────────────────────────────────┘
```

The recommendation columns are existing fields: `plan`, `model`, `cost/task`, `break-even tasks/month`, `confidence`, and `source`. At 390px the three steps become one vertical fieldset, with usage directly before the recommendation listing. A completed step stays visible and editable. Every control writes `provider`, `plan`, `model`, and `tasks` to the URL.

States: `empty` uses `No committed rows for this view.`; no matching provider/plan/model uses `No rows match the current filters.`; unavailable quota or route uses `Known gap: {reason}`; a recommendation depending on a suppressed composite uses `Composite suppressed: fewer than two benchmark versions (single-source).`. Controls owned: provider, plan, model, tasks/month, reset, and submit/recalculate. The recommendation never invents a zero cost for missing data.

### `/method` — METHOD / Read

Method is a readable evidence listing with formulas left in their committed field names. Its first sections are cost-per-task branches, then the three bases, then score normalization and composite coverage.

```text
┌─ STATUS BAND 32px: RACK-RATE │ BUILD {date} │ DATA {date} │ AA {ON|OFF} ───────────────────────────────┐
├─ LANE RAIL 176px ───────┬─ EDGE GUTTER 48px ─┬─ LN 40px ┬ ST 20px ┬───────────────────────────────┐
│ 01 OVERVIEW             │                    │           │         │  METHOD                           │
│ 02 MODELS               │                    │           │         │  COST PER TASK                   │
│ 03 PLANS                │                    │           │         │  budget | credits | requests |   │
│ 04 COMPARE              │                    │           │         │  tokens_total                    │
│ 05 EXPLORE              │                    │           │         │  THE THREE COST BASES            │
│ 06 GET STARTED          │                    │           │         │  API LIST | PLAN ROUTE | AA INDEX │
│ ───────── 2px RULE ─────│                    │           │         │  SCORE NORMALIZATION              │
│ METHOD             [ON] │                    │           │         │  id | version | title |          │
│ SOURCES                 │                    │           │         │  COMMITTED WEIGHT                │
│                         │                    │           │         │  PARETO FRONTIER                 │
│                         │                    │           │         │  MISSING DATA, CONFIDENCE,       │
│                         │                    │           │         │  FRESHNESS                       │
├─────────────────────────┴────────────────────┴───────────┴─────────┴────────────────────────────────┤
│ fixed cursor readout 28px: VALUE {formula figure} · BASIS {basis} · CONFIDENCE {level} · SOURCE {source} · RETRIEVED {date} │
└─ FOOTER INDEX ───────────────────────────────────────────────────────────────────────────────────────┘
```

The benchmark-weight listing uses the current table columns `id`, `version`, `title`, and `committed weight`. Formula prose names `quota_usd_month`, `credits_month`, `requests_month`, `tokens_month`, `api_cost_per_task_usd`, `price_usd_month`, `tasks_per_month`, `input_tokens_per_task`, `output_tokens_per_task`, `agent_steps_per_task`, `rolling_window_hours`, `rolling_window_usd`, and `benchmark_version`. No formula section turns into an unlabeled chart.

At 390px, formula blocks wrap in Plex Sans and code names remain unbroken where possible. The benchmark table is a record listing in the same field order; no axis is combined. There are no filters, so no filter row is rendered.

States: `empty` uses `No committed rows for this view.` for a missing committed benchmark listing; `filtered-to-nothing` is not applicable and uses the empty string; a deliberately unresolved input uses `Known gap: {reason}`; composite explanation uses `Composite suppressed: fewer than two benchmark versions (single-source).` when coverage is below two. Controls owned: source links, in-page section index, and row focus for cursor readout.

### `/sources` — SOURCES / Read

The Artificial Analysis state is the first evidence block. The two gate states use the exact copy in [Copy rules](#copy-rules). Every source record shows its title, licence, summary, covers, changes, credited contributor when present, notes when present, whether it contributes figures, and freshness.

```text
┌─ STATUS BAND 32px: RACK-RATE │ BUILD {date} │ DATA {date} │ AA {ON|OFF} ───────────────────────────────┐
├─ LANE RAIL 176px ───────┬─ EDGE GUTTER 48px ─┬─ LN 40px ┬ ST 20px ┬───────────────────────────────┐
│ 01 OVERVIEW             │                    │           │         │  SOURCES                          │
│ 02 MODELS               │                    │           │         │  ARTIFICIAL ANALYSIS STATE       │
│ 03 PLANS                │                    │           │         │  gate state · version · retrieved  │
│ 04 COMPARE              │                    │           │         │  EVERY SOURCE                     │
│ 05 EXPLORE              │                    │           │         │  source | licence | summary |     │
│ 06 GET STARTED          │                    │           │         │  covers | changes | contributor | │
│ ───────── 2px RULE ─────│                    │           │         │  notes | contributes | retrieved  │
│ METHOD                  │                    │           │         │  REQUIRED ATTRIBUTION, VERBATIM   │
│ SOURCES            [ON] │                    │           │         │  DELIBERATELY LEFT OUT            │
│                         │                    │           │         │  CLOSING COMMITMENTS              │
├─────────────────────────┴────────────────────┴───────────┴─────────┴────────────────────────────────┤
│ fixed cursor readout 28px: VALUE {source fact} · BASIS {basis} · CONFIDENCE {level} · SOURCE {source} · RETRIEVED {date} │
└─ FOOTER INDEX ───────────────────────────────────────────────────────────────────────────────────────┘
```

At 390px, the AA state remains first, then source records stack as labelled blocks. Licence and retrieved date stay in the first viewport of each source record. Required attribution uses a wrapping text block with Plex Sans, not a horizontal code strip.

States: `empty` uses `No committed rows for this view.` only when no source record is committed; `filtered-to-nothing` is not applicable because source index has no filter; an omitted upstream fact uses `Known gap: {reason}`; suppressed composites are referenced with `Composite suppressed: fewer than two benchmark versions (single-source).`; AA gate-off uses `Artificial Analysis is not published in this build.`. Controls owned: source links, in-page section links, and row focus. No source record is fetched in the browser.

### `404` — NOT FOUND / Read

```text
┌─ STATUS BAND 32px: RACK-RATE │ BUILD {date} │ DATA {date} │ AA {ON|OFF} ───────────────────────────────┐
├─ LANE RAIL 176px ───────┬─ EDGE GUTTER 48px ─┬─ LN 40px ┬ ST 20px ┬───────────────────────────────┐
│ 01 OVERVIEW             │                    │           │         │  PAGE NOT FOUND                  │
│ 02 MODELS               │                    │           │         │  ─────────────── R ───────────────│
│ 03 PLANS                │                    │           │         │  Nothing is served at this path. │
│ 04 COMPARE              │                    │           │         │  [OVERVIEW] [MODELS] [PLANS]     │
│ 05 EXPLORE              │                    │           │         │                                  │
│ 06 GET STARTED          │                    │           │         │                                  │
│ ───────── 2px RULE ─────│                    │           │         │                                  │
│ METHOD                  │                    │           │         │                                  │
│ SOURCES                 │                    │           │         │                                  │
├─────────────────────────┴────────────────────┴───────────┴─────────┴────────────────────────────────┤
│ fixed cursor readout 28px: VALUE Page not found · BASIS n/a · CONFIDENCE n/a · SOURCE rack-rate · RETRIEVED n/a │
└─ FOOTER INDEX ───────────────────────────────────────────────────────────────────────────────────────┘
```

At 390px, the three return links stack below the not-found sentence. The readout keeps the same element and field order with `n/a` for fields that have no figure. States: `empty` is `No committed rows for this view.` only for a missing index (not the normal 404); `filtered-to-nothing` is not applicable; `Known gap: {reason}` is reserved for a data gap, not a bad URL; suppressed composite is not applicable. Controls owned: links to `/`, `/models`, and `/plans`.

## Listing table anatomy

Every table, including chart twins, uses this canonical anatomy.

1. **Identity and gutter.** The first visible column is a line-number gutter (`40px` at `≥768px`, `28px` from `768px` to `479px`, absent below `480px`). It is a non-data `th`/`td` pair with tabular numerals. The next cell is the `20px` carriage-control state cell. At phone width the glyph moves inline before the row's key value, separated by `8px`; its cell remains semantically present even when visualized inline.
2. **Heads.** A table head has a 2px bottom rule, uppercase mono functional labels, and a basis phrase in words in the same head or its accessible description. Heads are sticky below the 32px status band while the listing scrolls. At `768px` repeated heads are dropped from continuation records; the first head remains available as the table caption and each record carries its field label.
3. **Column groups.** Text and identity columns are left-aligned. Numeric columns use right-aligned Plex Mono tabular figures and have a minimum `72px` column width. A 1px column-group rule separates identity, benchmark/score, cost, quota/volume, and confidence/provenance groups. The state cell never becomes a hue-coded semantic column.
4. **Rows.** Desktop and tablet rows are `36px`; phone rows are `44px` minimum. One row is one identity-bearing record. `benchmark_version` remains part of row identity, so benchmark versions never share one composite or one unlabeled table row. Nulls remain `—`, never zero.
5. **Sort.** Sortable heads are keyboard buttons. The default route order is the committed data order unless a route already defines a rank. Activation toggles ascending then descending; the URL stores the field and direction. The active head has `aria-sort="ascending|descending"` and a visible mono indicator `↑` or `↓`; the text alternative is `ascending` or `descending`. Ties retain a stable secondary identity sort by the row's `id`.
6. **Filter row.** Operate listings place a `FILTER` row directly above the table head, with a labelled search input, select, number field, or route-specific field. Inputs are full touch targets, write URL parameters on change, and have a reset control. Read-only listings have no empty filter shell.
7. **Focus and selection.** A focused row has a 2px amber outline with a 2px offset and keeps its original background. A selected row has `aria-selected="true"` and a single amber committed mark in its state cell; selection does not rewrite the data. Keyboard focus and touch focus update the single cursor readout. Hover is additive, never the only way to discover basis, confidence, source, or date.
8. **State marks.** The state cell uses the fixed alphabet: blank live, `·` held/shortlisted, `-` excluded and moved to `SET-ASIDE`, `*` committed/paid/owned, `!` gap (`known_gaps`), `?` low confidence, `+` changed this session. The glyph is never the only accessible label; the row exposes its full state in text.
9. **360px behavior.** There is no horizontal scroll. A table becomes a stacked record list: key identity first, then every column as `LABEL value` lines in original order, then source/confidence. Numeric values remain right-aligned inside each line. Cost basis, confidence, freshness, gap reason, and composite badge remain adjacent to their value. The set-aside follows the live records.

## Chart placement

All plots reserve their box before ECharts mounts. The static table twin and accessible name are rendered regardless of chart availability. Heights below are the reserved plot box, not the control or note rows.

| Route section | Chart | Control row | Reserved dimensions | Table twin columns |
| --- | --- | --- | --- | --- |
| `/explore` Pareto | Pareto scatter, score versus cost | `COST BASIS`: `API list` or `PLAN route`; `PLAN` selector; `TABLE VIEW` | `320px` below `640px`; `416px` at `≥640px`; full available width | `model`, `score`, `cost`, `frontier`, `reasoning_effort` |
| `/explore` rank | Bump rank across benchmark versions | `BENCHMARK VERSIONS` readout and `TABLE VIEW`; no floating toolbox | `384px` below `640px`; `512px` at `≥640px`; full available width | `model`, `DeepSWE v1.1`, `Terminal-Bench 4.0`, `rank`, `confidence` |
| `/explore` strength | Heatmap, model strength by benchmark | `BENCHMARK VERSION` legend and `TABLE VIEW` | `576px` at all widths; full available width | `model`, `DeepSWE v1.1 z`, `Terminal-Bench 4.0 z` |
| `/explore` savings | Slope, API list versus plan route | `MODEL` selector; `TABLE VIEW` | `320px` below `640px`; `416px` at `≥640px`; full available width | `model`, `api_cost_per_task_usd`, `routeCostPerTaskUsd`, `savingsMultiple`, `planName` |
| `/explore` quota | Waterfall, quota burn-down | `PLAN` selector; `UTILIZATION (TASKS PER MONTH)` number field; `TABLE VIEW` | `320px` below `640px`; `416px` at `≥640px`; full available width | `planName`, `modelName`, `tasksPerMonth`, `costPerTaskUsd`, `apiCostPerTaskUsd`, `priceUsdMonth`, `reason` |
| `/explore` admitted models | Radar, per-index z for selected plan | `PLAN` selector; `TABLE VIEW` | `384px` below `640px`; `448px` at `≥640px`; full available width | `model`, benchmark-version axis labels, `planName` |
| `/explore` builder | Metric builder | `Y METRIC`, `X METRIC`, `CHART TYPE`, `VENDOR`, `REASONING EFFORT`, `SCORE FLOOR`, `LOG X AXIS`, `FRONTIER`; weights and presets below | `320px` below `640px`; `416px` at `≥640px`; full available width | `model`, selected Y metric, selected X metric, `provider`, `effort`, `x`, `y` |

The dimensions use the existing `h-80`, `h-96`, `sm:h-[26rem]`, `sm:h-[28rem]`, `sm:h-[32rem]`, and `h-[36rem]` reservations expressed in pixels here. Controls sit in the page row above the box. ECharts toolbox controls are banned; zoom, frontier, table view, and basis changes have named page controls. A changed selection updates the cursor readout rather than creating a second tooltip.

Chart table twins follow the canonical listing anatomy. Their basis is in the axis and table head words. The Pareto, slope, and builder cost columns never merge API list, plan route, and AA index values. `pass@1` is the benchmark score on these plots; `pass@4` remains display-only and does not enter a chart formula.

## Component-to-route map

The component inventory stays factored, but its incumbent visual treatment changes to the console grammar. The map names the current files.

| Component file | Routes | Status in Divine Machinery |
| --- | --- | --- |
| `apps/site/src/components/Badge.astro` | `/`, `/models`, `/models/[slug]`, `/plans`, `/plans/[slug]`, `/compare`, `/explore`, `/start`, `/method`, `/sources` | **Changes and survives.** It becomes a square inline field marker with no radius and no hue tone. It carries short functional labels only. |
| `apps/site/src/components/CostBasisChip.astro` | `/`, `/models`, `/models/[slug]`, `/plans`, `/plans/[slug]`, `/compare`, `/explore`, `/start`, `/method` | **Changes and survives.** It prints `API LIST`, `PLAN ROUTE`, or `AA INDEX` in words and uses the solid, hairline/open, or doubled stroke grammar. Cost bases are not hue-coded. |
| `apps/site/src/components/ConfidenceBadge.astro` | `/`, `/models`, `/models/[slug]`, `/plans`, `/plans/[slug]`, `/compare`, `/explore`, `/start`, `/method` | **Changes and survives.** It prints `MEASURED`, `HIGH`, `MEDIUM`, or `LOW` as a square state label. Confidence is never encoded only by a colour. |
| `apps/site/src/components/FreshnessBadge.astro` | `/models`, `/models/[slug]`, `/plans/[slug]`, `/method`, `/sources` | **Changes and survives.** It prints freshness plus `retrieved {date}` in the source line; no pill shape. |
| `apps/site/src/components/SourceLink.astro` | `/models/[slug]`, `/plans/[slug]`, `/method`, `/sources`, footer | **Changes and survives.** It remains a text link with the source title, licence, and retrieval date available to the cursor readout and accessible name. |
| `apps/site/src/components/CiBar.astro` | `/models`, `/models/[slug]`, `/compare` table twin | **Changes and survives.** It is a 1px interval rule with a value mark; confidence controls stroke weight. A missing interval prints the missing state instead of an invented bar. |
| `apps/site/src/components/HeatmapSection.astro` | `/explore` | **Changes and survives.** It owns the heatmap plot, fixed reservation, table twin, accessible name, `!` gaps, and cursor readout. |
| `apps/site/src/components/SlopeSection.astro` | `/explore` | **Changes and survives.** It owns the model control row, named API list/plan route axes, plot reservation, twin, and readout. |
| `apps/site/src/components/WaterfallSection.astro` | `/explore` | **Changes and survives.** It owns the interactive plan/utilization plot, twin, and gap reason. `/` uses the same payload grammar in its budget readout without mounting this wrapper. |
| `apps/site/src/components/RadarSection.astro` | `/explore` | **Changes and survives.** It owns the plan selector, admitted-model scope, fixed plot, twin, and missing-value rule. |

Removed from the incumbent world: rounded/pill rendering, coloured API/measured/adjusted tones, card-grid presentation, floating chart toolbox, and the old generic header/navigation layout. No listed data or provenance component is removed; each remains a named consumer of the shared system.

## Copy rules

Functional labels are uppercase mono legends of 24 characters or fewer. Sentences use IBM Plex Sans. Data and measurement values use IBM Plex Mono with tabular numerals. A heading states what the visitor can inspect or change. There is no decorative eyebrow above a heading. Cost basis, confidence, source, and retrieved date appear in words at the figure or its adjacent readout. `pass@1` and `pass@4` are always written separately. `AA` is expanded to `Artificial Analysis` in sentences.

Use these display aliases where current code headings would exceed 24 characters; the accessible name and source field retain the current code name:

| Functional legend | Current field or route label |
| --- | --- |
| `MODEL` | `Model` / `model` |
| `SCORE (PASS@1)` | `Score (pass@1)` |
| `PASS@4` | `Pass@4` |
| `API LIST COST/TASK` | `API list cost/task` |
| `CHEAPEST USABLE PLAN` | `Cheapest usable plan` |
| `VALUE MULTIPLE` | `Value multiple` |
| `DAYS TO FULL RUN` | `Days to full run` |
| `EFFORT` | `Effort` / `effort` |
| `COMPOSITE COVERAGE` | `Composite coverage` |
| `TASKS/MONTH` | `tasks/month` |
| `QUOTA MODEL` | `quota model` |
| `KEY QUOTA` | `key quota` |
| `ROLLING WINDOW` | `rolling window` |
| `MEASURED-AGAINST MODEL` | `measured-against model` |
| `COST/TASK · MEASURED` | `cost/task · measured model` |
| `MODELS UNLOCKED` | `models unlocked` |
| `DAYS/FULL RUN` | `days/full run` |
| `CONFIDENCE` | `confidence` |
| `FRESHNESS` | `freshness` |
| `SOURCE` | source line and `SourceLink` |
| `RETRIEVED` | retrieved date |
| `SET-ASIDE` | excluded-row rail |
| `FILTER` | filter row |
| `READOUT` | cursor readout |
| `API LIST` | `api-list` cost basis |
| `PLAN ROUTE` | `plan-route` cost basis |
| `AA INDEX` | `aa-index` cost basis |

The exact state strings are:

- Empty: `No committed rows for this view.`
- Filtered to nothing: `No rows match the current filters.`
- Gap: `Known gap: {reason}`
- Suppressed composite: `Composite suppressed: fewer than two benchmark versions (single-source).`
- Artificial Analysis gate off: `Artificial Analysis is not published in this build.`

State marks remain glyphs in the carriage-control column, including `!` for a known gap. Prose never uses an exclamation mark. `not available` is reserved for a cell whose committed value is null; it is accompanied by the gap reason when one exists. `single-source` is the only composite badge for `k < 2`; no rank or value is filled in. `No rows match the current filters.` is shown in the live listing while excluded rows remain visible in `SET-ASIDE`.
