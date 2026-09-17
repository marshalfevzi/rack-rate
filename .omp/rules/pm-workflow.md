---
description: Hard gates for the rack-rate project-management workflow and generated planning state.
---

# PM workflow hard gates

- Run one task per session. Keep intake, planning, implementation, verification, and finish scoped to that task; stop and report a blocker instead of silently taking another task.
- `docs/pm/plan.yml` is generated state. Never hand-edit it. Edit the source documents and run `pm_plan_sync` to regenerate and report issues.
- A blocked task needs a decision. Do not change a blocked task's scope or status without an accepted or deferred decision that resolves the blocker; use `/pm-resolve`.
- A milestone closes only after a completed retrospective with `outcome: closed`, every task is done, and the explicit milestone-close operation has run.
- Run `pm_plan_sync` after any edit under `docs/pm/`, and report its errors and warnings before declaring the session complete.
