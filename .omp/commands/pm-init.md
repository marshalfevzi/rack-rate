---
description: Bootstrap or carefully migrate the project-management document tree.
---

Goal: Initialize `docs/pm/` without losing existing project, planning, or archival history.

Load `skill://project-management` and use its schemas and templates for every managed document.

1. **Inspect and choose a mode.** Read `docs/pm/config.yml`, `docs/pm/plan.yml`, `docs/pm/<M>/README.md`, `docs/pm/<M>/todo/<ID>.md`, `docs/pm/<M>/done/<ID>.md`, `docs/pm/ideas/<slug>.md`, `docs/pm/unplanned/<ID>.md`, `docs/pm/decisions/YYYY-MM-DD-NNN.md`, and `docs/archive/<M>-<slug>.md` when present. Also inspect root `PRD.md`, `ARCHITECTURE.md`, `PRODUCT.md`, `DESIGN.md`, `AGENTS.md`, and `PLAN.md`. Use greenfield mode only when the PM config and managed records are absent; otherwise use brownfield migration.

2. **Greenfield bootstrap.** Create `docs/pm/config.yml` for this project's paths, task prefixes, and milestone/archive locations, following `skill://project-management/templates/config.md`. Create `PRD.md` and `ARCHITECTURE.md` from the project-management templates when they are absent, and create the first milestone directories plus `docs/pm/M1/README.md` with a valid in-progress milestone record. Keep future tasks in `docs/pm/<M>/todo/<ID>.md` and generated state in `docs/pm/plan.yml`. If any destination already exists, preserve it and merge only missing fields or sections; never overwrite an existing document.

3. **Brownfield migration.** Preserve every existing document and history. Merge missing config keys into `docs/pm/config.yml` without replacing existing values. Reconcile an existing `PLAN.md`, `AGENTS.md`, archived records, and planning notes into milestone records at `docs/pm/<M>/README.md`, task records at `docs/pm/<M>/todo/<ID>.md` or `docs/pm/unplanned/<ID>.md`, and decisions under `docs/pm/decisions/YYYY-MM-DD-NNN.md`. Keep existing IDs, dates, status, acceptance text, and archive content; keep `docs/archive/` flat. Call `pm_task_new` for each genuinely new or migrated task that has no existing task document, supplying its stable id, milestone (or `unplanned: true`), prerequisites, kind, and body. When a destination document exists, merge new material into it and report the merge rather than replacing it. Ask a blocking question when identity, status, or history cannot be determined safely.

4. **Validate and report.** Run `pm_doc_check`, repair its errors in source documents, and run it again. Then call `pm_plan_sync` with `{ write: true }` as the final operation so `docs/pm/plan.yml` is regenerated rather than hand-edited. Report greenfield or brownfield mode, every created or merged path, preserved history, the first/active milestone, and all checker and plan-sync issues.
