---
description: Record an explicit ad-hoc project decision from the user's argument.
---

Goal: Turn the user's decision request into a durable, traceable decision record.

Load `skill://project-management` for the decision schema and validation rules. Use `$1` as the decision title when supplied; treat `$ARGUMENTS` as the complete user rationale and source of context, alternatives, chosen decision, consequences, affected milestone, and task ids. When `$1` is absent, derive a concise title from `$ARGUMENTS` and preserve the full argument in the decision body.

1. Call `pm_plan_sync` with `{ write: false }` and read `docs/pm/config.yml`, the relevant `docs/pm/<M>/README.md`, task documents at `docs/pm/<M>/todo/<ID>.md` or `docs/pm/unplanned/<ID>.md`, and existing decisions under `docs/pm/decisions/YYYY-MM-DD-NNN.md`. Identify affected records and check whether this decision supersedes an earlier one.

2. Call `pm_decision_new` with the title, an explicit status (`accepted` when the argument records an agreed choice, otherwise the appropriate schema status), nullable milestone, affected task ids, complete `context`, `decision`, and `consequences`, and `supersedes` when applicable. Use the returned id and path `docs/pm/decisions/YYYY-MM-DD-NNN.md`; never hand-edit generated `docs/pm/plan.yml`.

3. Call `pm_plan_sync` with `{ write: true }` as the final operation, repair source-document errors it reports, and call it again after repairs. Report the decision id/path, status, affected milestone/tasks, superseded id, and every plan-sync issue.
