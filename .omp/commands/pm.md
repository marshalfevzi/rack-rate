---
description: Run the next runnable project-management task end to end.
---

Goal: Run exactly the next runnable task through intake, implementation, verification, and explicit completion.

Load `skill://project-management` before making any decision; use its document schemas and lifecycle as the authority.

1. **Pre-flight.** Call `pm_plan_sync` with `{ write: true }`. Read its `issues`, `next_task`, and milestone summary. When an error issue prevents a trustworthy model, stop, report every issue and its path, and direct the user to `/pm-init` when `docs/pm/config.yml` or the managed tree is absent. When there is no task because the initialized plan has no task entry, stop and direct the user to `/pm-new-task`. When the first candidate in priority order is blocked, or its prerequisites cannot make it runnable, stop without editing it and direct the user to `/pm-resolve`. Do not begin another task while this gate is unresolved.

2. **Intake.** For the selected task, read its exact source document at `docs/pm/<M>/todo/<ID>.md` (or `docs/pm/unplanned/<ID>.md` when it has no milestone), plus the referenced project-management schema. Restate its id, title, description, prerequisites, scope, and acceptance criteria. Ask only questions whose answers block safe implementation; pause for those answers before changing files. Initialize a `todo` checklist for the session, with one item for each acceptance criterion and verification step.

3. **Plan.** Dispatch `pm-planner` with the task document and repository context. Require an ordered implementation plan, affected paths, risks, and observable acceptance checks. Keep the planner read-only. Do not implement until its plan is available.

4. **Implement.** Determine `isImpeccable` from the selected task's configured prefix in `docs/pm/config.yml`. If it is true, load `skill://impeccable` and dispatch `pm-ui-implementer`; require that agent to read `DESIGN.md` and the applicable surface brief before editing. Otherwise dispatch `pm-implementer`. Give the implementer the planner's ordered plan and require an end-to-end change, scoped lint and type checks, and evidence for every acceptance criterion. Keep the task in `todo/`; do not move it to `done/` manually.

5. **Verify and repair.** Dispatch `pm-verifier` independently after implementation. Require it to compare the diff with `docs/pm/<M>/todo/<ID>.md`, check every acceptance criterion, and report reproducible evidence and remaining defects without editing. Fix all reported lint and type errors and any acceptance defect, rerun the relevant checks, and have `pm-verifier` re-check until the task is genuinely complete.

6. **Finish.** Update only the task frontmatter in `docs/pm/<M>/todo/<ID>.md` (or its unplanned path) to `status: done` once verification passes. Call `pm_task_finish` with the task id, a concise session summary containing the evidence, and `commit: true`; this moves the task to `docs/pm/<M>/done/<ID>.md` and appends the session record. Then call `pm_plan_sync` with `{ write: true }` as the final synchronization, and report its `issues`, generated `docs/pm/plan.yml` state, completed task path, verification evidence, and commit result. Leave any reported error or warning visible rather than masking it.
