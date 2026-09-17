---
description: Turn an idea or request into a validated project-management task.
---

Goal: Convert the user's request into one or more complete task documents in the right milestone or unplanned queue.

Load `skill://project-management` for task, idea, and milestone schemas before drafting anything. Treat `$ARGUMENTS` as the complete request. Use `$1` as an explicit milestone id only when it matches an existing milestone; otherwise keep the full `$ARGUMENTS` as the idea text and choose the destination from the plan.

1. Call `pm_plan_sync` with `{ write: false }` to inspect `docs/pm/config.yml`, the milestone order, existing task ids, and `docs/pm/plan.yml`. If the PM tree is not initialized, stop and direct the user to `/pm-init`. Read any matching source idea at `docs/pm/ideas/<slug>.md` and its current status.

2. Turn each distinct outcome in the request into a task with a unique declared prefix, precise title, description, kind, acceptance criteria, implementation notes, and only existing prerequisite ids. Put milestone work in `docs/pm/<M>/todo/<ID>.md`; put work with no milestone in `docs/pm/unplanned/<ID>.md`. Preserve the idea's intent and history. For a promotion, call `pm_task_new` first with the selected id and destination, then update that idea's frontmatter at `docs/pm/ideas/<slug>.md` to `status: promoted` and `promoted_to: <ID>`. For new work, call `pm_task_new` once per task with its id, title, description, milestone or `unplanned: true`, kind, `pre`, and body.

3. Confirm every created task is listed in its milestone's ordered `tasks` array when applicable, has `status: todo`, and has a concrete body. Keep generated `docs/pm/plan.yml` out of direct edits.

4. Call `pm_plan_sync` with `{ write: true }` as the final operation and report each created or promoted id, its exact path (`docs/pm/<M>/todo/<ID>.md` or `docs/pm/unplanned/<ID>.md`), any updated idea path, and all synchronization issues.
