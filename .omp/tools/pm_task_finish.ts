import type { CustomToolFactory } from "@oh-my-pi/pi-coding-agent"
import { finishTask } from "../lib/ops.ts"

const factory: CustomToolFactory = (pi) => ({
  name: "pm_task_finish",
  label: "Finish PM Task",
  description: "Move a completed task into done, regenerate the plan, and optionally commit it.",
  parameters: pi.zod.object({
    task_id: pi.zod.string(),
    summary: pi.zod.string(),
    commit: pi.zod.boolean().optional(),
  }),
  async execute(_id, params, _onUpdate, ctx, _signal) {
    try {
      const result = await finishTask(ctx.cwd, {
        taskId: params.task_id,
        summary: params.summary,
        commit: params.commit === true,
      })

      const details = { ok: true, moved_to: result.movedTo, commit_sha: result.commitSha }
      const text = `PM task ${params.task_id} finished at ${result.movedTo}${result.commitSha ? ` (${result.commitSha})` : ""}`

      return { content: [{ type: "text", text }], details }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)

      return {
        content: [{ type: "text", text: `PM task finish failed: ${message}` }],
        details: { ok: false, error: message },
      }
    }
  },
})

export default factory
