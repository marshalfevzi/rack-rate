---
name: rack-rate
description: Console Listing visual system for sourced model-and-plan decisions.
colors:
  canvas: "#0B0C0E"
  panel: "#121417"
  panel-2: "#171A1E"
  rule: "#262A30"
  rule-strong: "#3A4048"
  ink: "#E8EAED"
  dim: "#9AA2AB"
  faint: "#808790"
  signal: "#FFB020"
  on-signal: "#0B0C0E"
typography:
  display:
    fontFamily: "IBM Plex Sans"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: "36px"
    letterSpacing: "-0.02em"
  title:
    fontFamily: "IBM Plex Sans"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "25px"
    letterSpacing: "normal"
  body:
    fontFamily: "IBM Plex Sans"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "normal"
  data:
    fontFamily: "IBM Plex Mono"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "normal"
  meta:
    fontFamily: "IBM Plex Sans"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "19px"
    letterSpacing: "normal"
  micro:
    fontFamily: "IBM Plex Mono"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.08em"
rounded:
  none: "0px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
  "16": "64px"
components:
  status-band:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.dim}"
    rounded: "{rounded.none}"
    height: "32px"
    padding: "4px 8px"
    typography: "{typography.micro}"
  lane-rail:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.dim}"
    rounded: "{rounded.none}"
    width: "176px"
    padding: "0px"
    typography: "{typography.micro}"
  lane-active:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.none}"
    height: "40px"
    padding: "4px 8px"
    typography: "{typography.micro}"
  masthead-block:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "24px 0px"
    typography: "{typography.display}"
  table-row:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "36px"
    padding: "0px 8px"
    typography: "{typography.data}"
  table-row-hover:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "36px"
    padding: "0px 8px"
    typography: "{typography.data}"
  readout-block:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
    typography: "{typography.data}"
  plate:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
    typography: "{typography.micro}"
  plate-active:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
    typography: "{typography.micro}"
  chip-basis:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
    typography: "{typography.micro}"
  badge:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.dim}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
    typography: "{typography.meta}"
  button-primary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    typography: "{typography.body}"
  button-primary-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    typography: "{typography.body}"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    typography: "{typography.body}"
  set-aside-rail:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.dim}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    typography: "{typography.meta}"
  footer-index:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.dim}"
    rounded: "{rounded.none}"
    padding: "8px 0px"
    typography: "{typography.micro}"
  skip-link:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    typography: "{typography.meta}"
---

# Design System: rack-rate

## Overview

**Status.** This is the pre-build contract for a replacement visual world. It is locked from the incumbent screenshots in `.impeccable/review/incumbent/` and the current tokens in `apps/site/src/styles/global.css`. When implementation lands, the documenter re-derives this contract from the built world. It supersedes the incumbent anti-signals and the three-basis accent palette.

**Creative North Star: “The Console Listing.”** Rack Rate is a mainframe console / ISPF panel made legible for a public purchase decision. A software practitioner reads it at a desk or on a phone under ordinary monitor or room light, carrying a plan choice, a model choice, and a need to check the arithmetic. Fixed-column listing paper, a line-number gutter, a carriage-control state column, printer rules, and uppercase legends make every row inspectable. The surfaces own one idea: a sourced number is useful only when its value, basis, confidence, and origin stay together.

This is an independent rack-rate product. Bosphorus Elevate is credited as maker only in the footer/about context; its atmospheric photo aesthetic is not inherited. The world refuses both the dark-SaaS-neon default and its warm-cream editorial opposite. It is dark by default, with a strict light inversion that changes values, never structure. Imagery is limited to data graphics and authored technical figures.

**Key Characteristics:**

- Fixed-column console listing with line numbers, carriage-control marks, printer rules, and functional uppercase legends.
- Status band pinned above a numbered lane rail on desktop; band plus drawer on mobile.
- Split-console entry: selection on the left, a pre-filled readout listing on the right, with every control represented in the URL.
- One cursor readout that always identifies value, basis, confidence, source, and `retrieved` date.
- Monochrome grounds plus one amber signal; cost bases are distinguished by words and stroke grammar, not hue.
- Flat, square, evidence-first surfaces with state-only motion.

## Colors

The palette is monochrome instrument stock: three neutral grounds, two rule weights, three text levels, and one signal. The dark scheme is the default. Light is a strict value inversion of the same geometry and hierarchy.

### Dark tokens

| Token | Value | Use |
|---|---|---|
| `--color-canvas` | `#0B0C0E` | Page ground. |
| `--color-panel` | `#121417` | Panel and table body. |
| `--color-panel-2` | `#171A1E` | Status band, lane rail, and table head. |
| `--color-rule` | `#262A30` | Structural 1px rule. |
| `--color-rule-strong` | `#3A4048` | 2px section and table-head rule. |
| `--color-ink` | `#E8EAED` | Primary text; contrast on canvas 16.24:1. |
| `--color-dim` | `#9AA2AB` | Secondary text; contrast ≈ 7.6:1 on canvas. |
| `--color-faint` | `#808790` | Tertiary labels only; lowest-contrast text token. |
| `--color-signal` | `#FFB020` | The only signal hue: active lane plate, focus, cursor, and committed mark; contrast ≈ 10.7:1 on canvas. |
| `--color-on-signal` | `#0B0C0E` | Text on a signal plate; contrast ≈ 10.7:1. |

`--color-faint` is the lowest-contrast text token and is reserved for uppercase mono legends at ≥11px; nothing below it may carry text. `--color-panel-2` is the binding ground for both schemes, so any future token must clear 4.5:1 against it, not only against the canvas. Audited dark ratios are `#E8EAED` on canvas 16.24, `#9AA2AB` on canvas 7.58 and panel 7.14, `#808790` on canvas 5.39, panel 5.08 and panel-2 4.81, `#FFB020` on canvas 10.70 and panel 10.09, and `#0B0C0E` on signal 10.70.

### Light inversion

| Token | Light value | Use |
|---|---|---|
| `--color-canvas` | `#F4F5F6` | Page ground. |
| `--color-panel` | `#FFFFFF` | Panel and table body. |
| `--color-panel-2` | `#EDEEF0` | Status band, lane rail, and table head. |
| `--color-rule` | `#D6D9DD` | Structural 1px rule. |
| `--color-rule-strong` | `#B7BCC3` | 2px section and table-head rule. |
| `--color-ink` | `#14171A` | Primary text. |
| `--color-dim` | `#5A6169` | Secondary text. |
| `--color-faint` | `#646B72` | Tertiary labels only; lowest-contrast text token. |
| `--color-signal` | `#8F4E00` | Signal-as-mark value; contrast ≈ 5.5:1. |
| `--color-on-signal` | `#14171A` | Text on the `#FFB020` signal plate. |

The light signal plate is `#FFB020`; the light signal-as-mark is `#8F4E00`. Audited light ratios are `#14171A` on canvas 16.48, `#5A6169` on canvas 5.75 and panel 6.27, `#646B72` on panel-2 4.65, panel 5.40 and canvas 4.95, `#8F4E00` on canvas 5.91 and panel 6.45, and `#14171A` on the signal plate 9.84. The panel-2 floor and ≥4.5:1 text floor apply in light as in dark.

### The single-signal rule

Amber is a state marker, not a decoration: it marks an active lane plate, keyboard focus, cursor readout, and committed mark. No state, severity, or basis is ever carried by colour alone. Every mark also has a glyph, label, rule, position, or text explanation. There is no green/red semantic colour and no second hue.

Cost bases are told apart by label and stroke pattern:

| Basis | Grammar |
|---|---|
| `plan route` | Solid 1px rule; amber is allowed only when this is the active basis. |
| `API list` | Hairline 1px at 50% plus an open-ended stroke. |
| `AA index` | Doubled rule. |

Every axis, chart title, table column, and chip states its cost basis in words. Bases never share an unlabelled axis, and no basis is represented by hue alone.

### Named Rules

**The One Signal Rule.** Amber is the only chromatic value on the site and it means active, selected or attention. It holds under a tenth of any screen; its rarity is the point.

**The Mark, Not The Colour Rule.** State, severity, cost basis and confidence are carried by a glyph, a stroke pattern or an inversion — never by hue. A screenshot in greyscale must lose nothing contractual.

## Typography

**Display and body:** IBM Plex Sans, self-hosted as woff2. **Data and labels:** IBM Plex Mono, self-hosted as woff2. Both faces are OFL 1.1; the licence is recorded in the repository. Plex Sans carries prose and explanatory reading. Plex Mono carries measurements, row identity, line numbers, functional legends, source lines, and other values where column alignment is evidence.

The pairing is plain and operational: human explanation reads as Sans; the machine listing reads as Mono. Monospace is never used for prose paragraphs.

### Frozen scale

| Token | Size | Line-height | Face and weight | Usage |
|---|---|---|---|---|
| `--text-micro` | `0.6875rem` (11px) | 16px | IBM Plex Mono, 500 | Uppercase functional legends, lane numbers, status band, column heads, state keys; tracking `0.08em`. |
| `--text-meta` | `0.8125rem` (13px) | 19px | IBM Plex Sans, 400 | Metadata, footnotes, source lines, compact controls. |
| `--text-body` | `0.9375rem` (15px) | 24px | IBM Plex Sans, 400 | Prose, labels, and readable control text; prose measure 62–72ch. |
| `--text-data` | `0.875rem` (14px) | 20px | IBM Plex Mono, 400 | Tabular figures and measurement cells in tables. |
| `--text-title` | `1.25rem` (20px) | 25px | IBM Plex Sans, 600 | Section heads and subpage heads. |
| `--text-display` | `2rem` (32px) | 36px | IBM Plex Sans, 600 | Page h1. Tracking `-0.02em`, never tighter than `-0.03em`. |

Weights are 400, 500, and 600 only. Uppercase is reserved for functional labels: field names, column heads, status keys, lane numbers, and other console legends. Numerals use tabular figures everywhere; numeric columns are right-aligned. The fixed scale uses rem sizes and pixel line-heights; it does not use fluid `clamp()` sizing.

## Layout

The rhythm is a 4px base: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px. Content is capped at 1440px with edge gutters of 24px on mobile, 32px at ≥768px, and 48px at ≥1280px. Corners are square everywhere.

### Shell metrics

| Element | Metric |
|---|---|
| Status band | 32px, pinned at the top. |
| Lane rail | 176px, desktop only at ≥1024px; lanes `01`–`06`, rows 40px, 1px rules; after lane 06, a 2px rule and an unnumbered reference group (`METHOD`, `SOURCES`) with 36px rows. Rail height is 6×40 + 2 + 2×36 = 314px. |
| Data row | 36px desktop / 44px mobile. |
| Line-number gutter | 40px at ≥768px; the first element dropped on phones. |
| Carriage-control state column | 20px; retained when the gutter drops. |
| Numeric columns | Right-aligned; each has a 72px minimum and 1px column-group rules. |

### Responsive drop order

- At ≥1024px, the status band spans the shell, the 176px lane rail is visible, lanes `01`–`06` are numbered working surfaces, and the unnumbered `METHOD` / `SOURCES` reference group follows the 2px divider. The active lane is a `--color-signal` plate with `--color-on-signal` text.
- Below 1024px, the lane rail leaves the canvas for a drawer; the status band remains pinned. The listing keeps its state column and, while space permits, its 40px gutter.
- At ≥768px, edge gutters are 32px and the line-number gutter is 40px. At <768px, the gutter drops before the state column; row height becomes 44px.
- At 390px and below, the band plus drawer remain, selection stacks before the readout, the state column remains 20px, and listing fields wrap or stack rather than create horizontal scroll. The page has no horizontal scroll at 360px.
When the visual gutter drops on a phone, its line identifier remains in the row's accessible name and readout so the deep-link and citation anchor survives the responsive change.

### Canonical listing-table anatomy

The listing is one inspectable artifact, not a card grid: `STATE` (20px carriage-control cell) → `LINE` (40px gutter when present) → row identity and label fields → right-aligned numeric fields (minimum 72px) → `BASIS` in words → `CONFIDENCE` → `SOURCE / RETRIEVED`. The table head uses `--text-micro` and a 2px bottom rule. Each numeric column names its basis; version stays attached to the benchmark identity. Excluded rows move to a visible set-aside rail, never disappear.

Route labels remain verbatim from `apps/site/src/layouts/Base.astro`: `Overview`, `Models`, `Plans`, `Compare`, `Explore`, `Get started`, `Method`, and `Sources`. They render as uppercase mono treatment in the rail; casing is visual treatment, not a copy change. Lane numbers are durable deep-link anchors.

### Named Rules

**The Gutter Rule.** Every listing row carries a line number. It is an anchor for deep links and citations, and it is the first element dropped on a phone.

**The Never Alone Rule.** A figure never appears without its basis. The readout line is the one place that fact always exists, and it must be readable without hover, by keyboard and by touch.

## Elevation & Depth

This system is flat. There is no shadow, gradient, blur, or glow anywhere. Depth is carried by rule hierarchy and tonal steps: `--color-canvas` is the page ground, `--color-panel` is panel/table body, and `--color-panel-2` is the second neutral layer for the band, rail, and table head. A 1px structural rule separates ordinary fields; a 2px rule opens a section and closes a table head; 1px column-group rules keep measurements legible. No tonal step is decorative.

## Shapes

The form language is printer-rule geometry: 0px radius everywhere, square corners, fixed columns, clipped alignment, and deliberate 1px or 2px rules. There are no pills or rounded controls. Hatch fills are 45° at 6px with ≤8% ink. Data markers are 3px squares (round) for measured values and 1px-stroked diamonds for adjusted/derived values; markers are never circles. Dashes are reserved for uncertainty and gap grammar, never used as decorative borders.

A signal plate is a rectangular amber mark with `--color-on-signal` text. It appears only for active or attention states, never as a branded card background. Pressed buttons use an inverted rectangular plate inside their 1px frame.

### Named Rules

**The 0-Radius Rule.** Nothing is rounded — plates, inputs, buttons, chips, dialogs, markers.

**The Flat Rule.** No shadow, gradient, blur or glow anywhere. Depth is the rule hierarchy (1px structural, 2px section opener, 2px table head, 1px column group) and the three neutral grounds.

## Components

All components ship the complete state set: default, hover, focus-visible, active, disabled, loading, empty, and error. State treatments below always pair rule, text, geometry, or glyph with any tonal change; colour alone never communicates a state. Focus is a visible 2px amber ring with 2px offset. Loading is static text or a retained frame, never a spinner or shimmer. Empty and error states name the condition and preserve the relevant source or gap context.

| Component | Shape | Rule weights | Type step | State treatment |
|---|---|---|---|---|
| **Status band** | Full-width square band. | 1px bottom. | `--text-micro`. | Default: current status and date; hover: unchanged; focus-visible: 2px amber ring; active: amber changed mark plus text; disabled: dim text plus disabled label; loading: static pending status; empty: explicit no-status text; error: status error text with source/gap reason. |
| **Lane rail** | 176px square rail; lanes `01`–`06` in 40px rows, then an unnumbered `METHOD` / `SOURCES` reference group in 36px rows after a 2px divider. | 1px row and boundary rules; 2px reference divider. | `--text-micro` lane number and `--text-meta` label. | Default: neutral lanes; hover: ink and strong rule; focus-visible: 2px amber ring; active: amber lane plate plus lane number; disabled: dim lane and inert control; loading: static lane placeholders; empty: static no-lanes message; error: rail error with recovery text. |
| **Masthead block** | Square panel block, no card lift. | 2px section opener; optional 1px separation. | `--text-display` h1 and `--text-body` lede. | Default: ink heading; hover: unchanged; focus-visible: ring on any control inside; active: amber committed mark when a choice is committed; disabled: dim associated controls; loading: retained heading with static loading note; empty: heading plus no-selection explanation; error: heading plus inline reason. |
| **Listing table** | Square panel with fixed columns. | 2px head-bottom; 1px structural/group rules. | `--text-micro` head, `--text-data` cells. | Default: complete rows; hover: row-level treatment; focus-visible: focused row/cell ring; active: committed glyph; disabled: dim row with restore path; loading: retained table frame and static status; empty: table head plus empty explanation; error: table frame plus inline source/error explanation. |
| **Row** | 36px desktop / 44px mobile square row. | 1px bottom. | `--text-data` values, `--text-body` labels. | Default: live row; hover: `--color-panel-2` and ink; focus-visible: 2px amber ring; active: `+` or `*` mark with committed text; disabled: dimmed but present; loading: static retained row state; empty: explicit row-set empty line; error: row-level reason and source. |
| **Gutter cell** | 40px line-number cell, square. | 1px group rule. | `--text-micro`. | Default: line number; hover: ink; focus-visible: amber ring; active: amber cursor alignment; disabled: dim number; loading: static placeholder; empty: blank only when no line exists; error: line-level error marker and text outside the cell. |
| **State cell** | 20px carriage-control cell, square. | 1px group rule. | `--text-micro`. | Default: one state glyph; hover: glyph plus readable label; focus-visible: 2px amber ring; active: committed/changed glyph; disabled: dim glyph plus text; loading: static loading label, with `?` reserved for low confidence; empty: blank live mark; error: `!` gap mark plus reason. |
| **Readout block** | Fixed square panel block; never an empty box. | 2px opener; 1px internal field rules. | `--text-data` fields and `--text-meta` source line. | Default: value, basis, confidence, source, and date; hover: pointed field receives cursor mark; focus-visible: 2px amber ring; active: amber cursor and updated value; disabled: retained last readout with disabled label; loading: static retrieval status with prior value retained when available; empty: never empty—show the pre-filled plan/model or a no-point explanation; error: value remains accompanied by source/gap error. |
| **Plate** | Square rectangular signal or neutral plate. | 1px frame; 2px only when opening a section. | `--text-micro`. | Default: labelled plate; hover: rule-strong; focus-visible: amber ring; active: amber plate with on-signal text; disabled: neutral dim plate; loading: static pending label; empty: no decorative plate—use explicit empty text; error: neutral plate plus error label. |
| **Chip** | Square 1px framed basis/filter chip. | 1px frame. | `--text-micro`. | Default: basis in words; hover: rule-strong; focus-visible: 2px amber ring; active: solid basis grammar and amber only for active `plan route`; disabled: dim label and inert frame; loading: retained label with static pending state; empty: explicit no-filter text; error: label plus source/gap reason. |
| **Badge** | Square 1px framed evidence badge. | 1px frame. | `--text-meta`. | Default: confidence/freshness label; hover: readable title remains available; focus-visible: 2px amber ring; active: committed mark where applicable; disabled: dim but readable; loading: static freshness/loading text; empty: explicit missing badge text; error: error label with provenance reason. |
| **Section head** | Square heading row. | 2px opener; 1px closing separation when needed. | `--text-title` plus `--text-micro` section number. | Default: title and number; hover: unchanged; focus-visible: ring on heading link/control; active: amber section cursor; disabled: dim linked section; loading: title retained with static status; empty: title plus empty explanation; error: title plus inline error reason. |
| **Control row** | Square horizontal control strip; wraps without overflow. | 1px top/bottom where it separates groups. | `--text-meta` labels, `--text-body` controls. | Default: labelled controls; hover: control-specific only; focus-visible: 2px amber ring; active: URL-committed value and mark; disabled: dim label/control; loading: controls retain values and show static pending; empty: explicit no-options message; error: inline validation/source reason. |
| **Button** | 1px square frame, no radius. | 1px frame; 2px amber focus ring. | `--text-body` (or `--text-micro` for a console command). | Default: panel with ink text; hover: rule-strong; focus-visible: 2px amber ring offset 2px; active: inverted plate on press (`--color-ink` with `--color-canvas` text in dark); disabled: dim text and frame; loading: static pending label with no spinner; empty: no action button when no action exists; error: retained frame with explicit error text. |
| **Input** | Square 1px field. | 1px frame; 2px focus ring. | `--text-body`, data input in `--text-data`. | Default: panel field and visible label; hover: rule-strong; focus-visible: 2px amber ring and amber caret; active: URL-written value; disabled: dim value and label; loading: retained value with static pending; empty: empty value with label, never placeholder-only; error: inline error and source/gap context. |
| **Select** | Square 1px field with native affordance. | 1px frame; 2px focus ring. | `--text-body`. | Default: selected option and label; hover: rule-strong; focus-visible: 2px amber ring; active: chosen value writes URL; disabled: dim value and affordance; loading: static loading option state; empty: explicit no-options option; error: inline selection error. |
| **Slider** | Square-ended 1px track and square thumb. | 1px track; 2px focus ring. | `--text-data` value and `--text-micro` label. | Default: labelled value; hover: rule-strong thumb; focus-visible: 2px amber ring; active: amber thumb while changing and URL value; disabled: dim track/thumb; loading: retained value with static pending; empty: no slider without a defined range; error: range/source error text. |
| **Segment control** | Adjacent square 1px frames, no capsule. | 1px outer and internal rules. | `--text-micro`. | Default: one labelled segment selected; hover: rule-strong; focus-visible: 2px amber ring per segment; active: selected plate and URL state; disabled: dim segment; loading: static retained selection; empty: no segments message; error: control-level reason. |
| **Set-aside rail / drawer** | Square panel-2 rail on desktop, drawer on mobile. | 1px boundary and row rules. | `--text-meta` labels, `--text-data` values. | Default: excluded rows remain visible; hover: ink row; focus-visible: 2px amber ring; active: restore/commit mark; disabled: dim restore action; loading: retained rows with static status; empty: explicit no excluded rows; error: set-aside source/state error. |
| **Footer index** | Square index strip, not a promotional footer. | 1px top rule. | `--text-micro`. | Default: route/source index; hover: ink link; focus-visible: 2px amber ring; active: current index mark; disabled: dim unavailable link; loading: static retained index; empty: no-index text; error: index error text. |
| **Skip link** | Square panel link, clipped until focus. | 1px frame; 2px focus ring. | `--text-meta`. | Default: clipped from layout; hover: ink; focus-visible: visible panel with 2px amber ring offset 2px; active: inverted plate on press; disabled: never disabled—keep navigation available; loading: not applicable, retain link; empty: not applicable; error: keep link and expose landmark error text if the target fails. |

### Readout behavior

The cursor readout always prints this exact field order: **value → basis → confidence → source → `retrieved` date**. It is a fixed block, not a tooltip. It repeats the contractual facts already present in the row, chart table twin, and accessible name; it is never the only place a fact lives.

- At ≥1024px it sits in the right column of the split console, opposite the plan/model selection column. From 768px through 1023px it remains the right-hand readout while the split has room; the lane rail is a drawer. At 390px and below, selection comes first and the readout follows it in the single column.
- Keyboard focus or arrow traversal on a listing row, chart datum, axis, band, or table twin points the readout at that item. The readout is readable without hover and stays in the tab order as a labelled region.
- Touch tap or focus selects the same item; its cursor mark and readout remain until another item is selected. Basis, confidence, source, and date are visible in the row and readout, not hidden behind a hover state.
- Entry is pre-filled with the selected plan and model. When no datum is pointed, the block prints that active context and an explicit `NO POINT SELECTED` state line; it is never an empty box. When data is absent, it prints the `!` gap, null value, and `known_gaps` reason.


### State marks

The carriage-control column contains one glyph and never relies on colour. The glyph is paired with a readable label in the row, readout, or accessible name.

| Mark | Meaning | Where it renders | Contract mapping |
|---|---|---|---|
| ` ` (blank) | Live, ordinary row. | State cell for an available row. | No preference flag; it is the default view in `rack-rate:prefs:v1`. |
| `·` | Held or shortlisted. | State cell and selection/readout summary. | The v1 preference shape has no separate shortlist key; hold is URL/session state, not a fabricated persistent field. |
| `-` | Excluded. | State cell; row moves to the visible set-aside rail/drawer. | `ignoredModels` or `ignoredPlans` in `rack-rate:prefs:v1`; nothing disappears. |
| `*` | Committed, paid, or already owned. | State cell, selected plan/model row, and summary. | `paidPlans` in `rack-rate:prefs:v1` covers paid/already-owned plan state; there is no separate owned key. |
| `!` | Gap: missing data. | State cell, open chart gap, and `known_gaps` explanation. | Data `known_gaps`, not a preference; null remains null. |
| `?` | Low confidence: aggregator-only or vendor-multiplier figure. | State cell and confidence badge/readout. | Confidence vocabulary `measured|high|medium|low`; `?` is the low state, not a preference. |
| `+` | Changed this session. | State cell and status band/readout when a local change is committed. | Session/URL delta; it is not persisted as a new key in `rack-rate:prefs:v1`. |

The persisted preference namespace is `rack-rate:prefs:v1`, planned by `PLAN.md` task 5.1: `apps/site/src/lib/prefs.ts` does not exist in this tree yet, so no mark is persistable today. When that store lands it carries `ignoredModels`, `ignoredPlans`, `paidPlans`, `vendor`, `currency`, `budgetCeiling`, `weights`, and `benchmarkFilters`; until then every mark above is session or URL state. Marks that describe evidence (`!`, `?`) stay with data and confidence; marks that describe a transient interaction (`·`, `+`) stay in URL/session state. This preserves the planned preference schema without inventing a key.

## Do's and Don'ts

### Do:

- **Do** use the Console Listing anatomy: pinned status band, numbered lane rail, line-number gutter, carriage-control cell, fixed columns, printer rules, and visible set-aside rows.
- **Do** keep each figure with its basis, confidence, citation, and `retrieved` date; expose the same facts to keyboard and touch users.
- **Do** keep `benchmark_version` in row identity; keep missing values null; suppress composites under `k < 2` and badge them `single-source`.
- **Do** keep `pass@1` and `pass@4` in separate fields, axes, and formulas; only `pass@1` feeds scores and composites.
- **Do** build offline from committed data with zero browser data requests; keep Artificial Analysis off unless both `AA_API_KEY` and `AA_PUBLISH=1` are set, and show the gate state on Sources.
- **Do** provide keyboard traversal for every chart and table, real table semantics, visible 2px amber focus with 2px offset, honoured `prefers-reduced-motion`, usable touch targets, no horizontal scroll at 360px, and text contrast ≥4.5:1.
- **Do** theme browser surfaces: selection uses the active signal and `--color-on-signal` text; the caret uses the signal; focus uses a 2px amber ring offset 2px; scrollbar track uses the panel-2 ground and thumb uses the strong rule; numerals use tabular figures; underlines use a 2px offset.
- **Do** keep `--color-faint` at the lowest text contrast, reserved for uppercase mono legends at ≥11px; keep every future token at ≥4.5:1 against panel-2.

### Named Rules

**The Nothing Disappears Rule.** An excluded row moves to the visible set-aside rail with its `-` mark; it is never hidden, deleted or faded to nothing.

**The Missing Rule.** A gap prints as a gap: open stroke, hatch, `!` mark and the reason recorded in `known_gaps` — never a zero, never an interpolated line.

**The Silence Rule.** No ornament, no emoji, no marketing adjective, nothing decorative that is not a measurement or a rule.

### Don't:

- **Don't** use rounded corners or pills.
- **Don't** use shadows, glow, gradient, blur, or glass.
- **Don't** introduce a second hue or green/red semantic colour.
- **Don't** use decorative imagery, photography, illustration, or emoji.
- **Don't** use card grids, floating mockups, logo walls, testimonials, or invented proof.
- **Don't** use spinners or shimmer skeletons.
- **Don't** use decorative dashed borders; dashes are reserved for the uncertainty/gap grammar.
- **Don't** use monospace for prose paragraphs.
- **Don't** use a decorative eyebrow or kicker above a heading; uppercase mono is reserved for functional labels, field names, column heads, lane numbers, and status keys.
- **Don't** reserve a brand accent panel for decoration; amber means active or attention.
- **Don't** use motion above 150ms or hide information on hover only; basis, confidence, and source stay readable by keyboard and touch.

## Motion

Use one state-transition duration: 150ms, within the 120–150ms contract, with one easing: `cubic-bezier(0.2, 0, 0, 1)`. Motion is state-only: rule, text, plate, selection, focus, lane, drawer, and cursor-readout changes may transition. Charts may update as a state response, but there are no animated entrances or decorative movement. No scroll choreography, parallax, bounce, pulse, shimmer, or second duration exists. `prefers-reduced-motion: reduce` makes state changes immediate, disables chart animation, and keeps the same focus, labels, readout, and table semantics.

## Data Graphics

Charts use Apache ECharts 6 through `echarts/core`. Every chart has a real accessible name and a real table twin containing the same values, basis, confidence, version, source, and gaps. The built-in ECharts toolbox is banned: zoom, filtering, axis, and export controls belong in the page's labelled control row and are URL-addressable.

### Shared chart grammar

- **Graticule:** use a real graticule. `splitLine` is a 1px `--color-rule`; `axisLine` is a 1px `--color-rule-strong`; minor ticks are 4px.
- **Series vocabulary:** measured values use 3px square markers (round); adjusted/derived values use 1px-stroked diamonds. Markers are never circles. Frontier polyline is 2px ink. A dominated region is a 45° hatch. Series fill is a 45°/6px hatch at ≤8% ink and never a gradient.
- **Confidence:** confidence maps to stroke weight: measured 2px, high 1.5px, medium 1px, low 0.75px plus hatch. Confidence remains text (`measured|high|medium|low`) in the table and readout.
- **Gaps:** missing data stays an open gap with a `!` tick. It is never interpolated, zeroed, ranked last, or silently removed.
- **Basis:** label every axis, chart title, table column, and chip with `plan route`, `API list`, or `AA index` in words. Never plot two cost bases on one axis. Cost basis is communicated by label and stroke pattern, never hue; amber marks only the active series or cursor.
- **Identity:** every benchmark label includes its `benchmark_version` in the axis or title. Separate versions are separate columns/series/tables, never one composite. `pass@1` and `pass@4` never share a field, axis, or formula; pass@1 alone feeds score/composite, while pass@4 is display-only.

### Shipped chart mappings

| Chart | Console Listing mapping |
|---|---|
| Pareto scatter | Scatter points plot score against one named cost basis per view: `API list` or a selected `plan route`. Use square measured markers, diamond adjusted/derived markers, a 2px ink frontier, and a 45° hatched dominated region. The axis/title carries the benchmark title and `benchmark_version`; plan/API views are separate. Effort trails keep their basis label. `pass@4` is not plotted with pass@1. |
| Rank / bump | Each benchmark version is its own ranked column labelled with title and `benchmark_version`; model lines break at gaps and a `!` marks the not-evaluated lane. Confidence intervals use confidence stroke weights and tied ranks use rule bands, not hue. Only pass@1 ranks; pass@4, if shown, is a separate display-only field/axis. |
| Heatmap | Rows are models and columns are benchmark versions; each cell is that version's within-benchmark z-score. Evaluated cells use monochrome intensity/mark grammar, while not-evaluated cells are hatched and marked `!`, never treated as low scores. Each column keeps title plus `benchmark_version`; pass@4 is not mixed into z-score or composite. |
| API-vs-plan slope | A model line joins `API list` cost per task to one named `plan route` cost per task. The two endpoints have written basis labels and use the basis stroke grammar; savings are written, not hue-coded. The score context names its benchmark and `benchmark_version`; pass@1 and pass@4 remain separate. |
| Quota burn-down waterfall | The selected plan's tasks-per-month quota is the named `plan route` basis; each step carries its label, confidence, source, and gap state. Bars use the graticule and monochrome hatch/rule grammar, with a `!` open gap where a conversion is missing rather than a zero. The title identifies the measured model/plan context and benchmark `benchmark_version` whenever benchmark-run demand is shown; pass@4 does not enter the quota formula. |
| Radar of per-index z | Each axis is one named benchmark version and its per-index z unit; axes carry title plus `benchmark_version`. Lines use confidence stroke weights, square measured points, and diamond adjusted/derived points, with gaps open and `!` ticks. The selected plan scope is structural; any `AA index` cost remains separately labelled and never shares an axis with `API list` or `plan route`. Pass@4 is display-only and never enters the z or composite. |

The cursor/readout mechanism supplies the same fields for chart points, axes, bands, and table rows. A chart remains understandable without hover, pointer colour, or the ECharts toolbox.

## Provenance as a visual system

Provenance is part of the row and chart grammar, not a footer afterthought. A citation is a visible source link in the `SOURCE` field or source line, with attribution text validated against the source record. A `retrieved` date sits beside that citation in the same listing row, table twin, readout, or badge. A confidence mark pairs the explicit word `measured`, `high`, `medium`, or `low` with the state-cell glyph and confidence stroke weight. A missing value remains null and receives `!` plus its `known_gaps` reason.

The AA publication gate is a structural status field: Sources shows either Artificial Analysis enabled or excluded, with the exact two-condition gate (`AA_API_KEY` and `AA_PUBLISH=1`) stated. An AA value keeps `AA index` as its basis, source, retrieval date, confidence, and version identity; it is never merged into an unlabeled figure. The status band can repeat the gate state, but the Sources listing is authoritative and no footer-only notice substitutes for it.

Every number therefore reads as one console record: value → basis → confidence → source → `retrieved` date. The readout repeats the record for the pointed value, while the table and accessible name preserve it when no value is pointed.
