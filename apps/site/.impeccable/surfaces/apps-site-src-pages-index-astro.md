---
version: 1
slug: "apps-site-src-pages-index-astro"
primary_target: "apps/site/src/pages/index.astro"
related_targets: ["apps/site/src/layouts/Base.astro","apps/site/src/layouts/Page.astro","apps/site/src/pages/models/index.astro","apps/site/src/pages/plans/index.astro","apps/site/src/pages/compare.astro","apps/site/src/pages/explore.astro"]
---

# Surface brief — the rack-rate shell and entry console

**Scope.** The site shell (`apps/site/src/layouts/Base.astro`, `Page.astro`) and every
route under `apps/site/src/pages/`: `/`, `/models`, `/models/[slug]`, `/plans`,
`/plans/[slug]`, `/compare`, `/explore`, `/start`, `/method`, `/sources`, `404`.

**Visitor mode.** Operate, with two Read surfaces (`/method`, `/sources`). The visitor
arrives mid-purchase-decision, often on a phone, holding a budget and a vendor, and
leaves with a plan chosen and a cost per task understood.

**Job.** Compare models across benchmark versions without mixing them, and price each
model's work through a real plan allowance instead of a rate card. **Action.** Pick a
plan and models; the URL carries the choice today and the planned
`rack-rate:prefs:v1` store (`PLAN.md` task 6.1) will carry it across visits.
**Proof.** Committed `data/*.json` only: every figure carries a basis, a confidence mark,
a source and a `retrieved` date. No invented proof exists on this site and none may be
added: no users, no testimonials, no logos, no traffic, no endorsement.

**Constraints.** Offline build from committed data; zero client-side data requests;
keyboard traversal of every chart and table; contrast ≥ 4.5:1; no horizontal scroll at
360 px; `prefers-reduced-motion` honoured; the Artificial Analysis gate state always
stated; `benchmark_version` never mixed within a table, axis or composite.

**Chosen direction.** The Console Listing (mainframe console / ISPF panel): fixed-column
listing paper, a line-number gutter, a carriage-control state column, printer rules,
uppercase mono legends, one amber signal for whatever is active. **Memorable moment.**
The cursor readout: point at any figure and one fixed line prints its value, its basis,
its confidence and its source + `retrieved` date — always in the same place, never
hover-only.

**Unresolved at briefing time.** Which authored technical figure opens `/` (candidates:
the two-basis cost mechanism with a measured gate; the quota burn-down ruler). Whether
the favicon mark is redrawn at 24 px for the new rule weights. Both are build-session
decisions recorded in `docs/design/build-plan.md`.

## Direction contract

**THESIS.** This surface is the machine's own printed record of measured work, not a
comparison dashboard: it refuses the category default of a dark card grid with a soft
hero, a floating chart mock-up and three accent colours. A number here is a line in a
listing, and a listing line always knows what it is, where it came from and when it was
read.

**OWN-WORLD.** Near-black ruled paper (`--color-canvas #0B0C0E`, `--color-panel
#121417`, `--color-rule #262A30`), a 2 px section rule, a 40 px line-number gutter, a
20 px state column, 0 radius everywhere, hatch in place of secondary colour, one signal
amber (`--color-signal #FFB020`) reserved for the active lane, the cursor and the
committed mark. Two faces: Plex Sans for sentences, Plex Mono for every figure, id,
legend and lane number. Remove all content and you still see ruled paper with a gutter.

**STORY.** The visitor understands that the same work is priced two ways and that the
difference is measured, not asserted; believes the figure because its source line is one
row away; and then filters the listing down to their vendor, marks what they own, and
compares what is left.

**FIRST VIEWPORT.** At 1440: a 32 px status band across the top (wordmark, the derived
stamp, the AA gate state, the freshest `retrieved` date); a 176 px lane rail on the left
with working lanes 01–06 and the unnumbered `METHOD`/`SOURCES` reference rows (rail
total 314 px); then two ruled columns — a 360 px selection column (plan select first,
then the models that plan runs, each with its state mark) and the readout listing (line
gutter, state cell, `MODEL · $/TASK · BREAK-EVEN · FULL RUN · CONF`, 36 px rows, 2 px
head rule, a foot line with the route count and the API-list multiple). The primary
action is the plan select, and it is the first stop after the skip link. The entry is
pre-filled with a real committed plan so the mechanism is legible before any interaction.

**FORM.** The dealt composition (seed `4c59a482`, index 3, split console) inside the
world from the direction roll (seed `8e5f39de`, assigned index 4, the Console Listing),
with these raises carried in: the cursor readout as the one fixed home for basis,
confidence and source; state drawn as a glyph or a stroke pattern, never a hue; nothing
disappears — excluded rows move to a visible set-aside rail; the readout line never
carries a contractual fact alone. **Risk.** A listing reads as "just a terminal" if the
fixed-column discipline stops at the shell and does not govern the charts; and dense
rows lose a phone reader unless the gutter and the state cell are dropped in that order
at 360 px.

**REACH.** The same grammar carries every route: `/models` and `/plans` are listings
whose gutter doubles as a deep-link anchor; `/compare` drops a graticule plate into a
listing; `/explore` is listings plus one plate per chart; `/method` is a numbered step
chain; `/sources` is the citation listing the readout line quotes; `/start` is the
selection column at full width; `404` is an empty listing with an honest empty state.
