---
description: Reconcile the project-management plan with the repository's current reality.
---

Goal: Make the managed task and milestone records accurately describe the repository without silently changing intent.

Load `skill://project-management` for the document schemas, invariants, and generated-plan rules.

1. Call `pm_plan_sync` with `{ write: false }` to inspect the current model, then call `pm_doc_check` to identify malformed or missing source documents. Read `docs/pm/config.yml`, `docs/pm/plan.yml`, each milestone README at `docs/pm/<M>/README.md`, and each task at `docs/pm/<M>/todo/<ID>.md`, `docs/pm/<M>/done/<ID>.md`, or `docs/pm/unplanned/<ID>.md`. Compare them with the repository's implementation, tests, git history, and current product documentation.

2. Read each reference document reported by `pm_doc_check` with the `doc-append-record` code and relocate every per-task or per-stage record section. Measurements and build notes go into the owning `docs/pm/<M>/done/<ID>.md` `## Session` section when that task exists, and milestone- or stage-level material goes to the flat `docs/archive/<M>-<slug>.md`. Keep one reconciled section in the reference document describing current state. Preserve content; never delete a record that has no destination.

3. Build a concrete reconciliation list before editing: split a task when its acceptance criteria describe independent deliverables, merge tasks only when they are one inseparable outcome, create a task for uncovered work, and delete obsolete task records only when repository evidence proves they no longer represent work. Split or merge milestone records when their scope has diverged or converged; create a milestone only for a genuinely distinct delivery boundary, and delete a milestone only after preserving its history in `docs/archive/<M>-<slug>.md`. Repair milestone `tasks` ordering plus every task's `pre` list. Preserve IDs and history whenever possible. A blocked task retains its blocker; changing its blocked scope or status requires `/pm-resolve` and a decision first.

4. Apply the list to source documents. Call `pm_task_new` for every new task, placing it in `docs/pm/<M>/todo/<ID>.md` or `docs/pm/unplanned/<ID>.md` with the schema fields, acceptance body, and valid prerequisites. Create or edit milestone READMEs at `docs/pm/<M>/README.md` only when the reconciliation evidence supports it; when deleting or merging records, preserve their history in the flat archive and remove stale references. Keep generated `docs/pm/plan.yml` untouched; it is regenerated from the source records.

5. Call `pm_doc_check` after repairs, fix every error it reports, and then call `pm_plan_sync` with `{ write: true }` as the final synchronization. Report each split, merge, creation, deletion, ordering repair, prerequisite repair, and all resulting issues from `docs/pm/plan.yml`.
