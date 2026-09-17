---
description: Hard gates for the rack-rate project-management workflow, its delegation contract, and generated planning state.
agents: [main, pm-planner, pm-implementer, pm-ui-implementer, pm-verifier, pm-doc-keeper]
alwaysApply: true
---

# PM workflow hard gates

## Process

- Run one task per session. Keep intake, implementation, verification, and finish scoped to that task; stop and report a blocker instead of silently taking another task.
- `docs/pm/plan.yml` is generated state. Never hand-edit it. Edit the source documents and run `pm_plan_sync` to regenerate and report issues.
- A blocked task needs a decision. Do not change a blocked task's scope or status without an accepted or deferred decision that resolves the blocker; use `/pm-resolve`.
- A milestone closes only after a completed retrospective with `outcome: closed`, every task is done, and the explicit milestone-close operation has run.
- Run `pm_plan_sync` after any edit under `docs/pm/`, and report its errors and warnings before declaring the session complete.

## Delegation

- The orchestrator owns decomposition, owner decisions, and PM state. A worker owns its assigned change and nothing else.
- Dispatch independent slices as one parallel batch call. Never dispatch the same slice twice, and never spawn a worker to answer a question a tool can answer.
- Follow-up work goes through `hub` to the agent that already holds the context. Never spawn a replacement for an agent that is still idle.
- A worker reports once, in its `yield` payload. It does not poll the orchestrator, narrate progress, or ask for a decision it can make from the task document and the repository's own design documents.
- One task runs at most one fix round after verification. A second failure is a blocker, not another round.

## Budgets and stop conditions

- A worker's budget is the hard tool-call cap in its own definition. Cross it and `yield` with what is finished and what is not.
- Run a check at most twice: once after the first complete edit pass, once after the fix its output required. Never re-run a check that already passed, and never run a check to confirm a result you already have.
- Never repeat a tool call with the same arguments expecting a different outcome. A command that fails twice is not a command to run a third time: change approach or yield the failure.
- `yield` is terminal. Call it once, when the acceptance criteria are met or the budget is exhausted, then stop.
- A blocked worker yields immediately with the blocker. It does not attempt speculative alternatives.

## Cost

- `@slow` is reserved for a genuinely unresolvable problem. It is not a default, a retry target, or a fallback for a failed edit.
- Never enable the advisor on a spawned worker; the task's own verifier is the review layer.
