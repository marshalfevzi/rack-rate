---
description: Report project-management status without changing any document.
---

Goal: Give a truthful read-only snapshot of milestones, the next runnable task, blockers, and validation issues.

Load `skill://project-management` for the document tree and `nextTask` rules. Call `pm_plan_sync` with `{ write: false }` first; this must load and validate the model without writing `docs/pm/plan.yml`.

Read `docs/pm/config.yml`, the milestone records at `docs/pm/<M>/README.md`, task records at `docs/pm/<M>/todo/<ID>.md`, `docs/pm/<M>/done/<ID>.md`, and `docs/pm/unplanned/<ID>.md`, and the current generated path `docs/pm/plan.yml` only for comparison. Report each milestone's status, open/done/blocked counts, priority order, the exact next task and file, its prerequisites, any `blocked_by` decision, and every error or warning returned by `pm_plan_sync`.

Make no document edits and do not call mutation tools. If the config or managed tree is missing, state that `/pm-init` is required. If the next candidate is blocked, state that `/pm-resolve` is required. End with the read-only result and explicitly state that `docs/pm/plan.yml` was not written.
