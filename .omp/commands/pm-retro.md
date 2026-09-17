---
description: Facilitate a milestone retrospective and close it only when its record is complete.
---

Goal: Record what a milestone delivered, what stalled, and the actions that determine whether it closes or continues.

Load `skill://project-management` for milestone and retro schemas and the close invariants.

1. Call `pm_plan_sync` with `{ write: false }`, select the requested milestone, and read `docs/pm/<M>/README.md`, every task in `docs/pm/<M>/todo/<ID>.md` and `docs/pm/<M>/done/<ID>.md`, prior retrospectives, and the generated state in `docs/pm/plan.yml`. Facilitate a focused review of landed outcomes, acceptance evidence, stalls, causes, and actionable owners.

2. Write a new `docs/pm/<M>/RETRO-YYYY-MM-DD-NNN.md` with unique retro id, the milestone id, current date, `status: completed`, and `outcome: closed` only when the milestone is ready to close; otherwise use `outcome: continued`. Include prose for shipped work, unfinished or blocked work, lessons, and concrete follow-up actions. Preserve prior retrospectives and append the new id to the milestone README's `retro` list without changing task history.

3. Record the outcome through `pm_milestone_close`. When the outcome is `closed`, first confirm every task listed by `docs/pm/<M>/README.md` is `done` and the retro has `status: completed` and `outcome: closed`, then call `pm_milestone_close` with `{ milestone: "<M>", outcome: "closed" }`; that tool creates the flat `docs/archive/<M>-<slug>.md`, removes the live milestone directory, and resynchronizes. When the outcome is `continued`, call `pm_milestone_close` with `{ milestone: "<M>", outcome: "continued" }`; that records the retro against the milestone and returns the milestone to `status: in_progress`, so new tasks can be added. It archives nothing and keeps the directory. Never leave a milestone at `status: retro` — only `in_progress` and `backlog` milestones are eligible for task selection.

4. Call `pm_plan_sync` with `{ write: true }` as the final operation and report the retro path, outcome, actions, whether `pm_milestone_close` ran, the archive path when closed, and every resulting issue.
