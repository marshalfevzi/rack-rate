---
description: Resolve the first blocked task through an explicit project decision.
---

Goal: Turn the first blocked task into a runnable task only after recording the decision that resolves its blocker.

Load `skill://project-management` for the task and decision schemas and validation invariants.

1. Call `pm_plan_sync` with `{ write: false }` and select the first blocked task in priority order. Read its source at `docs/pm/<M>/todo/<ID>.md` (or `docs/pm/unplanned/<ID>.md`) and the relevant milestone README. If no blocked task exists, report that fact and stop without changing documents.

2. Treat this gate as absolute: a blocked task may not change scope, prerequisites, status, or implementation notes without a decision. Analyze the blocker and ask only questions that determine the decision. Capture the alternatives, chosen resolution, affected task id, milestone, and consequences.

3. Call `pm_decision_new` with the decision title, `status: accepted` when the resolution is agreed or `status: deferred` when work is intentionally postponed, the milestone, the task id in `tasks`, and complete `context`, `decision`, and `consequences` text. Use the returned decision id; the tool writes `docs/pm/decisions/YYYY-MM-DD-NNN.md` and re-syncs the model.

4. Only after `pm_decision_new` succeeds, edit the blocked task document at `docs/pm/<M>/todo/<ID>.md` (or its unplanned path) to set `status: todo` and set `blocked_by` to the returned decision id. Retain that `blocked_by` value as the resolving decision, retain the task's history and acceptance scope, and leave prerequisite semantics intact. Do not move the task to `done/`.

5. Call `pm_plan_sync` with `{ write: true }` as the final operation, repair any resulting errors, and report the decision path/id, the task path, its retained `blocked_by`, its new `todo` status, and every plan-sync issue. If synchronization exposes a new blocker, leave it visible and direct the user to this command again.
