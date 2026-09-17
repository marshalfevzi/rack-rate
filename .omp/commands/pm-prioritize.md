---
description: Reorder milestone priorities while preserving prerequisite correctness.
---

Goal: Produce an explicit priority order for one milestone and prove that its prerequisite graph remains valid.

Load `skill://project-management` for milestone and task schemas and the `pre-order` invariant.

1. Call `pm_plan_sync` with `{ write: false }`, identify the requested milestone, and read `docs/pm/<M>/README.md` plus every referenced task in `docs/pm/<M>/todo/<ID>.md` and `docs/pm/<M>/done/<ID>.md`. If the milestone is missing, report the exact missing path and stop. Establish the requested ordering from the user's priorities and repository dependencies.

2. Edit only the milestone README's frontmatter `tasks` list to record the new ordered priority. Repair each affected task's `pre` field so every prerequisite remains a real task and appears earlier in that milestone's list; preserve prerequisite meaning, status, blocker decisions, and task bodies. Keep generated `docs/pm/plan.yml` unchanged by hand. If the requested order conflicts irreducibly with a prerequisite, stop and report the conflict rather than weakening or deleting the dependency.

3. Call `pm_plan_sync` with `{ write: true }` to regenerate `docs/pm/plan.yml`. If it reports `pre-order`, `pre-missing`, `pre-cycle`, or another error, repair the source README/task documents and call `pm_plan_sync` again. Report the final `tasks` order, every `pre` repair, and all remaining errors or warnings.
