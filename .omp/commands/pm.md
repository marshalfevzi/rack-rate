---
description: Run the next runnable project-management task end to end.
---

Goal: Run exactly the next runnable task through intake, one implementation pass, one
verification pass, and explicit completion.

Load `skill://project-management` before making any decision; use its document schemas and
lifecycle as the authority. The shared hard gates in `rule://pm-workflow` are already in your
context.

1. **Pre-flight.** Call `pm_plan_sync` with `{ write: true }`. Read its `issues`, `next_task`,
   and milestone summary. When an error issue prevents a trustworthy model, stop, report every
   issue and its path, and direct the user to `/pm-init` when `docs/pm/config.yml` or the
   managed tree is absent. When there is no task because the initialized plan has no task entry,
   stop and direct the user to `/pm-new-task`. When the first candidate in priority order is
   blocked, or its prerequisites cannot make it runnable, stop without editing it and direct the
   user to `/pm-resolve`. Do not begin another task while this gate is unresolved.

2. **Intake.** Read the selected task's exact source document at `docs/pm/<M>/todo/<ID>.md`
   (or `docs/pm/unplanned/<ID>.md` when it has no milestone) and its milestone README. Restate
   its id, title, description, prerequisites, scope, and acceptance criteria. Initialize a `todo`
   checklist with one item per acceptance criterion and verification step. **Resolve every owner
   decision during intake.** Anything the task document leaves open that needs a product, design,
   or scope call is decided now and travels with the dispatch, never negotiated mid-run. Ask only
   questions whose answers block safe implementation, and pause for those before changing files.

3. **Dispatch one implementation pass.** Determine `isImpeccable` from the selected task's
   configured prefix in `docs/pm/config.yml`. If it is true, load `skill://impeccable` and
   dispatch `pm-ui-implementer`; otherwise dispatch `pm-implementer`. Make it ONE `task` call.
   The subagent's instructions must carry: the task document path, the acceptance criteria
   verbatim, the configured gate command, the reference documents the task names, and every
   decision you resolved in intake. Instruct it to decide anything else locally from those
   documents and to never ask mid-run. When the task names three or more independent file
   groups, make it a `tasks[]` batch with one item per group — never a sequence of separate
   dispatches.

4. **Do not poll.** The dispatch delivers its own result. Do not call `hub wait` in a loop, do
   not re-read files to infer progress, and make no tool call whose only purpose is to check on
   a worker. Spend the wait on nothing, or on independent orchestrator work, and let the result
   arrive.

5. **Verify once.** Dispatch `pm-verifier` with the task document, the base revision, and the
   changed paths. Require the per-criterion matrix and the exact gate result.

6. **At most one fix round.** If verification fails or is unverified, message the _same_
   implementer over `hub` with the verifier's report verbatim — its context is still live, so do
   not spawn a replacement. Then re-verify once. A second failure is a blocker to report, not
   another round.

7. **Finish.** Ensure the working tree is formatted. Run the configured gate once and require it
   to pass. Update only the task frontmatter in `docs/pm/<M>/todo/<ID>.md` (or its unplanned
   path) to `status: done`; never move the file by hand. Call `pm_task_finish` with the task id,
   a concise session summary containing the evidence, and `commit: true`. Then call
   `pm_plan_sync` with `{ write: true }` as the final synchronization, and report its `issues`,
   the generated `docs/pm/plan.yml` state, the completed task path, the verification evidence,
   and the commit result. Leave any reported error or warning visible rather than masking it.

Keep the task in `todo/` until `pm_task_finish` moves it.
