# Project-management schemas

The source documents under `docs/pm/` own the plan. Their YAML frontmatter is parsed into a model;
`docs/pm/plan.yml` is generated from that model. Dates use ISO `YYYY-MM-DD` strings. A nullable
field is written as YAML `null` when it has no value. Lists are YAML lists, including an empty list.

## `docs/pm/config.yml`

Config is YAML, not Markdown frontmatter. Its top-level fields are:

| Field | Type | Required | Allowed values / meaning |
|---|---|---:|---|
| `project` | object | yes | Project metadata object. |
| `project.name` | string | yes | Project name; this repository uses `rack-rate`. |
| `project.prd` | string | yes | Relative path to the PRD, normally `PRD.md`. |
| `project.product` | string | yes | Relative path to product direction, normally `PRODUCT.md`. |
| `project.design` | string | yes | Relative path to design direction, normally `DESIGN.md`. |
| `project.architecture` | string | yes | Relative path to architecture, normally `ARCHITECTURE.md`. |
| `project.constraints` | string or null | yes | Optional extra document path, such as `CAVEATS.md`. |
| `prefixes` | map of string to object | yes | Declared task-id prefixes. |
| `prefixes.<prefix>.domain` | string | yes | Domain label for the prefix. |
| `prefixes.<prefix>.impeccable` | boolean | yes | Whether UI craft checks apply to this prefix. |
| `paths` | object | yes | Managed directory paths. |
| `paths.milestones` | string | yes | Live milestone root, normally `docs/pm`. |
| `paths.archive` | string | yes | Flat archive root, normally `docs/archive`. |
| `paths.ideas` | string | yes | Ideas directory, normally `docs/pm/ideas`. |
| `paths.unplanned` | string | yes | Unplanned tasks directory, normally `docs/pm/unplanned`. |
| `paths.decisions` | string | yes | Decisions directory, normally `docs/pm/decisions`. |

The repository's initial config declares `COR`, `DATA`, `APP`, `UI`, `DOC`, and `PM` prefixes;
`UI` is the only one with `impeccable: true`.

## Milestone `README.md`

Destination: `docs/pm/<M>/README.md`.

| Field | Type | Required | Allowed values / meaning |
|---|---|---:|---|
| `id` | string | yes | Unique milestone id, for example `M1`. |
| `title` | string | yes | Human-readable milestone title. |
| `description` | string | yes | Short purpose and boundary of the milestone. |
| `status` | string | yes | `backlog`, `in_progress`, `retro`, or `completed`. |
| `started` | string or null | yes | ISO date when work started, or `null`. |
| `completed` | string or null | yes | ISO completion date, or `null` until complete. |
| `tasks` | string[] | yes | Ordered task ids; order is priority order. |
| `retro` | string[] | yes | Retro ids, appended when retros are completed. |

## Task

Destinations: `docs/pm/<M>/todo/<ID>.md`, `docs/pm/<M>/done/<ID>.md`, or
`docs/pm/unplanned/<ID>.md`.

| Field | Type | Required | Allowed values / meaning |
|---|---|---:|---|
| `id` | string | yes | Unique task id with a configured prefix, for example `COR-005`. |
| `title` | string | yes | Short executable task title. |
| `description` | string | yes | Scope and intended result. |
| `status` | string | yes | `todo`, `done`, or `blocked`. |
| `milestone` | string or null | yes | Milestone id, or `null` for unplanned work. |
| `pre` | string or string[] | yes | Prerequisite task id(s); normalized to a list. |
| `kind` | string | yes | `feature`, `fix`, `docs`, `design`, `chore`, or `refactor`. |
| `blocked_by` | string or null | yes | Decision id; required when `status: blocked`, otherwise `null`. |
| `created` | string | yes | ISO creation date. |
| `completed` | string or null | yes | ISO completion date when done, otherwise `null`. |

A task in `done/` has `status: done`, a completion date, and a `## Session` section appended by
`pm_task_finish`. A task in `todo/` or `unplanned/` has a non-done status.

## Decision

Destination: `docs/pm/decisions/YYYY-MM-DD-NNN.md`.

| Field | Type | Required | Allowed values / meaning |
|---|---|---:|---|
| `id` | string | yes | Allocated id `DEC-YYYY-MM-DD-NNN`. |
| `date` | string | yes | ISO decision date. |
| `status` | string | yes | `proposed`, `accepted`, `rejected`, `superseded`, or `deferred`. |
| `milestone` | string or null | yes | Related milestone id, or `null`. |
| `tasks` | string[] | yes | Task ids affected by the decision. |
| `supersedes` | string or null | yes | Superseded decision id, or `null`. |

The body contains an H1 title followed by `Context`, `Decision`, and `Consequences` sections.

## Retro

Destination: `docs/pm/<M>/RETRO-YYYY-MM-DD-NNN.md`.

| Field | Type | Required | Allowed values / meaning |
|---|---|---:|---|
| `id` | string | yes | Allocated retro id `RETRO-YYYY-MM-DD-NNN`. |
| `milestone` | string | yes | Milestone being reviewed. |
| `date` | string | yes | ISO retro date. |
| `status` | string | yes | `completed` or `aborted`. |
| `outcome` | string | yes | `closed` or `continued`. |

A milestone may close only with a retro whose status is `completed` and outcome is `closed`.

## Idea

Destination: `docs/pm/ideas/<slug>.md`.

| Field | Type | Required | Allowed values / meaning |
|---|---|---:|---|
| `id` | string | yes | Stable id in the form `IDEA-<slug>`. |
| `title` | string | yes | Idea title. |
| `status` | string | yes | `open`, `promoted`, or `rejected`. |
| `promoted_to` | string or null | yes | Task id when promoted, otherwise `null`. |
| `created` | string | yes | ISO creation date. |

## Archive slice

Destination: `docs/archive/<M>-<slug>.md`. The archive is a flat file and retains the milestone
record, task records in order, and retro bodies.

| Field | Type | Required | Allowed values / meaning |
|---|---|---:|---|
| `id` | string | yes | Original milestone id. |
| `title` | string | yes | Original milestone title. |
| `status` | string | yes | `completed`. |
| `started` | string or null | yes | Original start date. |
| `completed` | string or null | yes | Close date. |
| `tasks` | string[] | yes | Ordered task ids in the closed milestone. |
| `retro` | string[] | yes | Retro ids included in the slice. |

## Generated `docs/pm/plan.yml`

The first line is exactly `# GENERATED by pm_plan_sync — do not edit`. The YAML body has this fixed
key order and nesting:

```yaml
project:
  name: rack-rate
  last_commit: "<git HEAD sha or unknown>"
  prd: PRD.md
  product: PRODUCT.md
  design: DESIGN.md
  architecture: ARCHITECTURE.md
milestones:
  - id: M1
    title: "..."
    status: in_progress
    file: docs/pm/M1/README.md
    tasks:
      - id: COR-005
        title: "..."
        description: "..."
        status: todo
        pre: []
        file: docs/pm/M1/todo/COR-005.md
        impeccable: false
    retro: []
archived:
  - id: M0
    title: "..."
    status: completed
    file: docs/archive/M0-foundation.md
```

Top-level keys are `project`, `milestones`, and `archived`, in that order. `project` keys are
`name`, `last_commit`, `prd`, `product`, `design`, and `architecture`, in that order. Each
milestone uses `id`, `title`, `status`, `file`, `tasks`, and `retro`; each task uses `id`, `title`,
`description`, `status`, `pre`, `file`, and `impeccable`; each archive uses `id`, `title`, `status`,
`file`, in those orders. Lists use block style except empty lists, which render as `[]`.

Strings are double-quoted only when they contain `:`, `#`, leading or trailing whitespace, or start
with `[`, `{`, `-`, or `?`; otherwise they are emitted bare. `null` renders as `null`.
