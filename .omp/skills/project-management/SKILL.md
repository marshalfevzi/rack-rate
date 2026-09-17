---
name: project-management
description: Load for planning, task execution, milestone or retro work, and document reconciliation.
---

# Project management

This skill is the operating model for the repository's document-backed planning system. Load the
schemas before creating or changing a PM document, and use the templates as the starting point.

## Vocabulary

- **Config** is the hand-owned project map at `docs/pm/config.yml`.
- **Milestone** is a bounded body of work with an ordered task queue and a retro.
- **Task** is one executable unit. Its id prefix identifies its domain; `pre` lists prerequisites.
- **Decision** records a choice and can unblock a task through `blocked_by`.
- **Retro** closes or continues a milestone after its work is reviewed.
- **Idea** is an unplanned possibility until it is promoted to a task.
- **Archive slice** is the flat, immutable record produced when a milestone closes.
- **Plan model** is the normalized view of all these documents.
- **Generated plan** is `docs/pm/plan.yml`, the deterministic summary consumed by commands and hooks.

## Document tree

```text
docs/pm/
├── config.yml                 # hand-owned project configuration
├── plan.yml                   # generated summary; source documents remain authoritative
├── <M>/
│   ├── README.md              # milestone frontmatter and definition of done
│   ├── todo/<ID>.md           # executable tasks
│   ├── done/<ID>.md           # finished tasks with a Session section
│   └── RETRO-YYYY-MM-DD-NNN.md
├── ideas/<slug>.md
├── unplanned/<ID>.md
└── decisions/YYYY-MM-DD-NNN.md

docs/archive/<M>-<slug>.md     # one flat slice per closed milestone
```

`PRD.md` and `ARCHITECTURE.md` sit at the repository root and are PM-owned. `PRODUCT.md`,
`DESIGN.md`, `.impeccable/design.json`, and the UI surface briefs also sit at the root and belong to
the product/design (impeccable) workflow. All of them are validated during document reconciliation.

For field definitions and generated-plan ordering, read
`skill://project-management/reference/schemas.md`. Copy skeletons from
`skill://project-management/templates/`. The complete lifecycle is in
`skill://project-management/reference/workflow.md`.

## Lifecycle: intake → execution

### Intake

1. Run `/pm-init` to create or migrate the config, core documents, and first milestone without
overwriting existing history.
2. Run `/pm-align` when the documents no longer describe reality. Create, split, merge, or retire
milestones and tasks, repair prerequisite order, and reconcile the PRD and architecture.
3. Capture unresolved choices with `/pm-decide` or `/pm-resolve`. A blocked task becomes runnable
only after an accepted or deferred decision resolves its blocker.
4. Run `pm_plan_sync` after every PM document mutation. Treat errors as a stop condition and fix
the source document before continuing.

### Execution

1. Run `/pm-status` for a read-only snapshot, then `/pm` for exactly one next task.
2. `/pm` selects the first runnable `todo` task by milestone priority and task order. It restates
the task, asks only blocking questions, plans, implements, verifies, and finishes the task.
3. A completed task is moved to `done/` through `pm_task_finish`, receives its completion date and
Session record, and is reflected in the generated plan.
4. When all milestone tasks are done, run `/pm-retro`. A `closed` outcome requires a completed
closed retro; `pm_milestone_close` then writes one flat archive slice and removes the live milestone
directory. A `continued` outcome records the retro and returns the milestone to `in_progress` so new
tasks can be added — a milestone never rests at `status: retro`.
5. Run `/pm-docs` whenever PRD or architecture content must be brought back into agreement with the
implementation. End with `pm_doc_check`.

## Invariants

| Code | Severity | Rule |
|---|---|---|
| `id-duplicate` | error | Task, decision, retro, and milestone ids are unique. |
| `prefix-unknown` | error | Every task id prefix is declared in config `prefixes`. |
| `task-missing` | error | Every milestone task entry resolves to an existing task document. |
| `task-orphan` | warn | A milestone task document should be listed by its milestone. |
| `pre-missing` | error | Every prerequisite names an existing task id. |
| `pre-order` | error | Each prerequisite appears earlier in its milestone task order. |
| `pre-cycle` | error | The prerequisite graph is acyclic. |
| `blocked-no-decision` | error | A blocked task names an accepted or deferred decision. |
| `decision-missing` | error | Every blocker or decision reference resolves. |
| `done-location` | error | Done tasks live in `done/`; other task statuses do not. |
| `done-date` | error | A done task has a `completed` date. |
| `milestone-close-blocked` | error | A completed milestone has a closed retro and zero open tasks. |
| `milestone-retro` | warn | All-done in-progress milestones should move to `retro`. |
| `plan-stale` | warn | The committed generated plan differs from the freshly rendered model. |
| `next-blocked` | warn | The next task in priority order is blocked. |

The runnable task is the first `todo` task in an `in_progress` milestone, then a `backlog`
milestone, whose prerequisites are all done. `next_task` in the generated plan is the earliest
non-done candidate in that same priority order — including a `blocked` one. When its `status` is
`blocked`, stop and point to `/pm-resolve` instead of bypassing the queue.

## Command table

| Command | Purpose |
|---|---|
| `/pm` | Run the next task; pre-flight sync, plan, implement, verify, and finish it. |
| `/pm-init` | Bootstrap a greenfield tree or migrate an existing plan without losing history. |
| `/pm-align` | Reconcile documents with reality and repair task or milestone structure. |
| `/pm-resolve` | Resolve the first blocked task with a decision, then return it to `todo`. |
| `/pm-new-task` | Turn an idea into a task in a milestone or `unplanned/`. |
| `/pm-prioritize` | Reorder a milestone queue and repair prerequisite order. |
| `/pm-retro` | Facilitate a retro and close a milestone when its outcome is closed. |
| `/pm-docs` | Update PRD or architecture documents and run document checks. |
| `/pm-status` | Report plan state without writing the generated plan. |
| `/pm-decide` | Record an ad-hoc decision from the user's argument. |

Every mutating command finishes with `pm_plan_sync` and reports its issues. Every command may
consult this skill and its references; the tool names in this table and the document fields in
`skill://project-management/reference/schemas.md` are canonical.

## Generated-plan rule

`docs/pm/plan.yml` is generated from the source documents. Never hand-edit `plan.yml`; edit the
source frontmatter or body, then run `pm_plan_sync`. The generated file starts with
`# GENERATED by pm_plan_sync — do not edit`, uses the fixed key order in the schema reference, and
is the checker-visible summary rather than an additional source of truth.
