# Retrospective — 2026-09-17 plan review session

Append-only record of one session. `PLAN.md` is the live plan; this file is the
review that reshaped it, and the task-by-task verdict it rests on. Read
[`PLAN.md`](../../PLAN.md) first.

**No stage was opened. No source file, data file, test, chart or config outside
this session's repairs changed.** No published number moved:
`data/derived.json` is still
`7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`.

---

## 1. What the session was asked to do

1. Evaluate the current state, the requirements and the constraints.
2. Archive Stage 3 and Stage 4 into `docs/archive/` as **separate** documents.
3. Check open questions and unresolved issues against the stages that finished.
4. Review every planned task and decide to criticize, split, merge, expand, or
   mark unplanned where a task is not clear.
5. Produce this document.

The complaint that prompted it: the plan had become cluttered, agents lost their
context after Stage 4 and drifted into scope creep, and the plan no longer gave a
usable path.

## 2. The plan as found

`PLAN.md` was **2,679 lines**, of which **1,754 were progress log**.

| Region | Lines | Share |
|---|---:|---:|
| Header, product statement, completed-stage record, fixtures | 86 | 3% |
| Stage 3 specification | 78 | 3% |
| Stage 4 specification | 66 | 2% |
| Stage 5 (Console Listing redesign) specification | 369 | 14% |
| Stage 6 (wizard) and Stage 7 (deployment) specifications | 128 | 5% |
| Data contract | 114 | 4% |
| Open questions and known gaps | 78 | 3% |
| Progress log | 1,754 | **65%** |

Of that log, **1,500 lines were the sessions of two stages that had already
landed** (3.1–3.11: 1,067 lines; 4.1–4.15: 433 lines).

## 3. Diagnosis

Five defects, each with evidence, not impression.

**3.1 A landed stage's history never left the live plan.** `PLAN.md` moved
Stages 1–2 out on 2026-09-14 and then stopped doing it. Stage 3 closed with
eleven sessions and Stage 4 with four, and all fifteen stayed inline. Two thirds
of the file was history an agent had to read past to find the next task — and
each entry is dense with decisions, retractions and measurements that read as
current instructions.

**3.2 The clutter was not the cause; it was the symptom of a missing centre.**
The file had a "What done means" paragraph, but nothing required a new section to
be checked against it. So on 2026-09-16 two documentation sessions could add a
15-task stage that replaces the entire visual world, plus three new design
documents, without any section of the plan asking whether the product's
completion definition had moved. Stage 4 had itself recorded "placeholder-grade
by instruction… a UI refactor is expected to rewrite it", so the redesign was not
invented from nothing — its *size* and its *position ahead of the remaining
functional work* were never argued against the completion definition, because
there was no such check.

**3.3 Scope creep arrived with the vocabulary of necessity.** The redesign is
written as "the world is frozen", "must not", "is not re-opened" — the register
of a decided constraint. That is appropriate for a committed direction the owner
has chosen, and the owner has now confirmed it is. But it makes the stage
unreviewable from inside a session: nothing in it invites the question "should
this run now?".

**3.4 References rotted silently across the 2026-09-16 renumbering.** The
renumbering moved the wizard to Stage 6 and deployment to Stage 7 and propagated
itself to seven documents — but not to the references *to task numbers*. Live
prose in `docs/architecture.md` sent 404 `noindex` to "task 6.4", which is the
wizard's shareable-result task; index hygiene is 7.4. `PLAN.md` cited "5.1" for
preference persistence (now 6.1) twice, and 5.13 pointed at "the plan's 3.4 note"
for the 404 canonical — a note that this session archived. Nothing checked that a
document's task references still resolved, and nothing noticed when they did not.

**3.5 The plan's own record was factually wrong, and prose was allowed to
override a command.** Open questions and log entries said "six plans" and "7
JS-shell vendor pages" cannot be anchor-verified. Measured this session with
`bun run fetch:plans --diff`, **eight of the sixteen plan rows fail the anchor
check** — and `claude-pro`, a plan the site ranks on `/plans`, is one of them.
That is a plan telling sessions a stale count about the data its own figures are
computed from.

**3.6 The primary gate was red, and no stage reported it.** `bun run check`
exits 1 on `main` before this session. `bun run lint` fails with 30
`anti-slop/require-readable-spacing` errors in
`.claude/skills/impeccable/scripts/live-browser-session.js`, and `oxfmt --check`
fails on seven more files under the same vendored tree. The skill entered the
repo on 2026-09-16; the previous session ran the formatter half, recorded it as a
"tooling choice", and never ran the linter half — the half that blocks. Stage 5's
acceptance opens with "`bun run check`, `bun test` and `bun run build` all exit
0", so the stage could not have been accepted as written.

## 4. Owner decisions

The four questions this session could not settle from repo convention were put to
the owner. The answers are recorded verbatim; §6 notes what each one leaves as an
accepted risk.

| Question | Answer |
|---|---|
| What is the critical path to "done" now? | **"Redesign first, as the plan says now"** — Stage 5 → 6 → 7, unchanged. |
| Who owns the design record? | **"Keep all as they are"** — `DESIGN.md`, `docs/design/surfaces.md`, `docs/design/build-plan.md`, `PRODUCT.md` and the surface brief keep their current split. |
| Is 15 tasks in one stage the right grain? | **"Keep one 15-task stage."** |
| Which recorded gaps become work now? | The anchor-failing plan rows; the two 404 evidence URLs; unit tests for the untested chart builders. (The AA publication-state decision stays deferred; the three new workstreams became tasks 8.1, 8.2 and 5.9's new obligation.) |

## 5. What changed

### 5.1 Two archives, written from the plan itself

| File | Lines | Holds |
|---|---:|---|
| [`stages-3.md`](stages-3.md) | 1,175 | Stage 3's task list, acceptance, handover contract, and the 3.1–3.11 sessions |
| [`stages-4.md`](stages-4.md) | 524 | Stage 4's task list, acceptance, and the 4.1–4.15 sessions |

Both were produced by slicing `PLAN.md`, not by retyping it, so no entry was
edited, reordered or summarised; the slices were then checked against the source
line by line. Each archive opens with a note that task numbers inside an archived
entry are the numbers in force when it was written — which is what makes the
renumbering harmless inside history — and with the pointer back to
[`stages-1-2.md`](stages-1-2.md).

The three sessions that are *not* a landed stage's own — the 2026-09-14 review
session and the two 2026-09-16 documentation sessions — stay in `PLAN.md`'s
progress log, with the preamble now stating that a landed stage's entries leave
when the stage closes.

### 5.2 `PLAN.md` rebuilt: 2,679 → 1,293 lines

- **Added a `## Direction` section** that states the completion definition once
  and closes it: "a task that does not move one of those clauses is not in this
  plan; a session that wants one opens a decision here rather than a new stage."
  This is the structural answer to §3.2.
- **Completed stages collapsed to four one-line records** pointing at their
  archives, so a session can see what exists without reading 1,500 lines of how
  it got there.
- **Added `## Stage 8 — Data integrity follow-ups`** with 8.1 and 8.2, explicitly
  off the critical path so a session can pick one up without entering the
  redesign, and with three ordering rules — the first two added in the commit
  that followed, because the first draft said Stage 8 "may run before, between or
  after Stages 5–7, in any order", which is false: both tasks re-run `compute`
  and so change `data/derived.json`, whose hash Stage 5's boundary and acceptance
  text pin as the proof that the redesign moved no number. They may run before
  Stage 5 starts or after it is accepted, and whichever lands must re-record the
  hash in Stage 5's acceptance text in the same commit.
- **Removed** the Stage 3 and Stage 4 specifications and their fifteen log
  entries.

### 5.3 Task-by-task verdict

Every task in Stages 5–7 was read against its own "Done when" and against the
completion definition. **Nothing was marked unplanned.** Only 5.15 was
unexecutable as written, and it was fixed rather than dropped: an instruction to
run a tool is not a deliverable, so it now names the deliverable and makes the
tool optional.

| Task | Verdict | Note |
|---|---|---|
| 5.1 Tokens and scheme inversion | keep | Measurable: a contrast recomputation in both schemes against canvas, panel **and** panel-2. |
| 5.2 Plex, licence, og, favicon | **expand** | Acquisition had no verifiable provenance and the favicon question was deferred twice as a "build-session decision". Now: recorded source URL, byte length and sha256 per file, and the favicon judged at the 16px a tab renders. |
| 5.3 Shell | keep | The stage's riskiest task — drawer focus trap, roving tabindex, workspace metrics — but splitting it would leave the shell half-built for every later task. |
| 5.4 Cursor readout | keep | Correctly identified as the one contradiction between `DESIGN.md` and `surfaces.md`, and it resolves it in favour of `surfaces.md`. |
| 5.5 Primitives | keep, with a commit note | Largest task in the stage: six components rewritten, eight added, `provenance.ts` moved. Land it in two commits — components first, then the set-aside rail and the empty/error strings — so a failure is attributable. |
| 5.6 `/` | keep | Binds the URL to the controls and keeps the ported calculator's arithmetic. |
| 5.7 `/models` and detail | keep | Keeps `pass@1`/`pass@4` apart and names the basis on every cost cell. |
| 5.8 `/plans` and detail | keep | Every unresolved quota keeps its reason beside the value it qualifies. |
| 5.9 Chart grammar | **expand** | Gains the obligation to unit-test the five builders that were only ever verified by rendering, in the same commit as their re-theme; §4's owner decision. Registration is guarded at mount time, not by the option type, so a test pinning the declared series family is the only thing that fails when a `use()` row is dropped. |
| 5.10 `/compare` | keep | |
| 5.11 `/explore` | keep | The "usable with JavaScript disabled" clause is the strongest single requirement in the stage. |
| 5.12 `/start` layout only | keep | Honest scope: layout, empty state, no flow, no persisted state. |
| 5.13 `/method`, `/sources`, `404` | **fix** | Pointed at an archived note for the 404 canonical; now states the defect and splits ownership with 7.4. |
| 5.14 Accessibility and reconciliation | **expand** | Gains the four residues the 4.15 pass left open, each to be fixed or explicitly exempted. |
| 5.15 Re-derive the design record | **fix** | Was an instruction to run a skill. Now the deliverable is the corrected documents, executable without the skill. |
| 6.1 `prefs.ts` | keep, **merged 6.7 into it** | 6.7 restated 6.1's own boundary requirement; the merged text carries the zod clause and the per-key default fallback. Stage 6 is now 6.1–6.6. |
| 6.2 Preference-aware rendering | keep | |
| 6.3 Wizard flow | keep | Four sub-steps in one task; it is one flow and splitting it would ship a wizard that cannot answer. |
| 6.4 Shareable result URL | keep | |
| 6.5 Wizard context on `/models` | keep | |
| 6.6 Export, import, reset | keep | |
| 7.1 Deploy workflow | keep | Names its steps, permissions and concurrency. |
| 7.2 Canonical URL decision | keep | Two-line switch; confirm both modes. |
| 7.2b AA publication state | keep, deferred | Held for the owner as designed — it is a licensing decision, not an engineering one. |
| 7.3 Scheduled refresh as a PR | keep | Correctly keeps the deployed site built from a committed snapshot. |
| 7.4 Cache and index hygiene | keep, **now owns the 404** | The deployed status code and the missing `noindex` were mis-assigned to "6.4"; this is the task that owns them. |
| 7.5 `CONTRIBUTING.md` | keep | |
| 7.6 Update `PLAN.md` and `AGENTS.md` | keep | Extended in practice by this session: when Stages 5–7 land, their entries leave the live plan the same way. |
| 7.7 Final verification | keep | The only task that checks a clean clone against the deployed URL. |
| 8.1 Refresh the anchor-failing plan rows | **new** | Eight rows, not six; `claude-pro` included. |
| 8.2 The two 404 evidence URLs | **new** | Same files as 8.1; may land in the same session. |

Stage 6 and Stage 7 tasks keep their prose form. They state requirements
precisely enough to start from, but they lack the Files / Work / Done-when shape
Stage 5 uses — so **a session that opens a 6.x or 7.x task restates it in that
shape before writing code**, and a reference to a file or a symbol is verified
rather than assumed.

### 5.4 Repairs

| File | Defect | Repair |
|---|---|---|
| `docs/architecture.md` | Sent 404 `noindex` and the deployed base-path check to "task 6.4", the wizard's shareable-result task. | Names 7.4. |
| `README.md` | "Stage 3 will add the Astro development server", "dev server; skeleton routes pending Stage 4 content", "the planned site will import…" — three stages stale. | Rewritten; also now states the measured eight-row anchor failure and that `bun run dev` is not the way to judge chart chrome. |
| `AGENTS.md` | Layout block listed `apps/site/src/lib/prefs.ts` as present; it is task 6.1 and not in the tree. | Marked planned, matching what `PRODUCT.md` already said. Two sessions had recorded this and deferred it. |
| `.oxlintrc.json`, `.oxfmtrc.json` | Vendored `.claude/skills/**` was never excluded, so `bun run check` was red. | Excluded from lint and format, exactly as `tools/oxlint/anti-slop/**` already was. No rule weakened, no severity changed, no first-party file edited. `AGENTS.md` records the reason. |
| `PLAN.md` | Five open items existed only in archived "Still open" lists; six references pointed at pre-renumbering task numbers in live prose. | Items promoted into the live section with owners named; live references corrected. |

### 5.5 Open questions, assessed against what has landed

Every item now says either which task owns it or that no task does. **An item
with no owner is a decision waiting for the owner, not a task waiting for an
agent** — that sentence is now in the section itself.

| Item | Status after this session |
|---|---|
| Artificial Analysis licensing / publication state | **Owner decision at 7.2b**, deferred as designed. No task owns the decision sooner. |
| Google AI credits conversion, SuperGrok per-task quota, ChatGPT Codex quota | No task. Unresolvable upstream; stays in `known_gaps`. |
| MiniMax Plus measured upstream but not a row here | No task, but **adjacent to 8.1** — same fetcher, same CNY problem, same need for a pinned model. |
| Z.ai GLM international USD plan, Cursor Pro+/Ultra, Ollama Max/Team | No task. Aggregator-only or unconfirmed-formula rows stay `low`/unresolved. |
| The 1.6× cross-check gap | No task. Still the single largest unexplained quantity in the data. |
| Only the best-effort configuration per model; two models without a vendor; gpt-6-astra's provisional pricing | Design decisions, not gaps. Unchanged. |
| Terminal-Bench's undocumented flight-data blob | No task. **Corrected**: the `harbor` fallback's command shape is verified, but its code path has never executed — recorded as reachable and unexercised, not as working. |
| Two committed evidence URLs return 404 | **Owned by 8.2.** |
| Eight of sixteen plan rows fail the anchor check | **Owned by 8.1.** Count corrected from the plan's stale "six/seven" by running the command. |
| Five chart builders ship without unit tests | **Owned by 5.9.** |
| The `push: branches: [main]` CI trigger has never fired | No task. Nothing is blocked; the owner's next push to `main` is the first live use. |
| `/rack-rate/404/` answers 200 under preview; the page has no `noindex` | Status code and `noindex` **owned by 7.4**; the stray canonical **owned by 5.13**. |
| Three accessibility residues from the 4.15 pass | **Owned by 5.14.** |
| The incumbent captures carry the `astro dev` toolbar | Constraint, not a gap: no Stage 5 evidence may come from `astro dev`. |
| `DESIGN.md` and `surfaces.md` disagree on readout docking | **5.4 ships the fixed line; 5.15 corrects `DESIGN.md`.** |
| `AGENTS.md` listed `prefs.ts` as present | **Removed** — the line was fixed instead. |
| `bun run check` red on vendored skill code | **Removed** — fixed this session; `AGENTS.md` records why. |

## 6. Accepted risks

These are owner decisions this session recorded rather than argued, so that a
later session does not relitigate them. Each has a mitigation that is already in
the plan.

1. **Presentation runs before publication.** The site stays undeployed and the
   completion definition's persistence clause stays unmet until Stage 5 finishes.
   *Mitigation:* Stage 8 is off the critical path but fully specified, and nothing
   in Stages 5–7 depends on being deployed first.
2. **Four documents describe one world.** `DESIGN.md` (durable system),
   `docs/design/surfaces.md` (per-route layout), `docs/design/build-plan.md`
   (diagnosis, frozen contract, risk register), `PRODUCT.md` (brand) and the
   surface brief. An agent that loads one and not the others can re-decide
   something already settled — which is how the retracted toolbox diagnosis
   happened. *Mitigation:* `PLAN.md`'s header names which document owns what and
   states that no Stage 5 task re-opens the world; 5.15 re-derives all of them
   from the shipped code at the end.
3. **Fifteen tasks, one acceptance gate.** There is no shippable intermediate
   state inside Stage 5. *Mitigation:* every task carries its own "Done when", so
   a session can land and stop between tasks; only 5.14 and 5.15 are whole-stage
   gates.
4. **The redesign rewrites surfaces Stage 6 then adds behaviour to.** Accepted
   because the alternative — building the wizard into the Stage 4 world and
   rewriting it afterwards — costs the same and ships the older world longer.

## 7. Verification performed

- `bun run check` **exit 0** (typecheck; oxlint; `oxfmt --check` clean over 79
  files; `astro check` over 63 files with 0 errors, 0 warnings, 0 hints). It
  exited 1 before the config repair.
- `bun test` **138 pass / 0 fail / 493 `expect()` calls across 14 files**.
- `bun run fetch:plans --diff` **exit 1** as designed, printing the anchor table
  that corrected the plan's stale count; it wrote nothing.
- `data/derived.json` unchanged at
  `7425a331008fe0a1281a6d4f0bf4f350987f656cd135141a1ac69ef3f2317348`; nothing
  under `data/**`, `packages/**` or `apps/**` modified.
- Archive slices compared line by line against the `PLAN.md` they came from;
  45 relative links across the fourteen documents this session touched resolve,
  except `README.md`'s `../../issues/new?template=measured-quota.yml`, which is a
  GitHub web path written relative on purpose and resolves on github.com.

## 8. Rules this session asks later sessions to keep

1. **A landed stage's specification and log leave `PLAN.md` in the same session
   the stage closes.** Stages 3 and 4 are the cautionary example; Stages 5, 6 and
   7 should be archived the same day they land.
2. **A new stage is argued against `## Direction` before it is written.** If it
   does not move the completion definition, it is a decision for the owner, not a
   stage.
3. **A count that a command can produce is never carried in prose.** The
   anchor-failure count was wrong in three places; `bun run fetch:plans --diff`
   settled it in three seconds.
4. **A task reference is checked when a renumbering happens.** The 2026-09-16
   renumbering propagated to seven documents' prose and to none of their task
   references.
5. **A red gate is a stage blocker, not a note.** `bun run check` had been red for
   a day and the fact lived only in a log entry's "Still open".
