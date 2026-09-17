import type { CustomToolFactory } from "@oh-my-pi/pi-coding-agent"
import { createTask } from "../lib/ops.ts"

const factory: CustomToolFactory = (pi) => ({
  name: "pm_task_new",
  label: "New PM Task",
  description:
    "Create a task document, attach it to a milestone when requested, and regenerate the plan.",
  parameters: pi.zod.object({
    id: pi.zod.string(),
    title: pi.zod.string(),
    description: pi.zod.string(),
    milestone: pi.zod.string().nullable().optional(),
    kind: pi.zod.string().optional(),
    pre: pi.zod.array(pi.zod.string()).optional(),
    body: pi.zod.string().optional(),
    unplanned: pi.zod.boolean().optional(),
  }),
  async execute(_id, params, _onUpdate, _ctx, _signal) {
    try {
      // `pi.cwd`, not `ctx.cwd`: the device transport passes a context with no `cwd`.
      const result = await createTask(pi.cwd, {
        id: params.id,
        title: params.title,
        description: params.description,
        milestone: params.milestone ?? null,
        kind: params.kind ?? "feature",
        pre: params.pre ?? [],
        body: params.body ?? "",
        unplanned: params.unplanned === true,
      })

      const details = { ok: true, file: result.file }

      return {
        content: [{ type: "text", text: `PM task ${params.id} created at ${result.file}` }],
        details,
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)

      return {
        content: [{ type: "text", text: `PM task creation failed: ${message}` }],
        details: { ok: false, error: message },
      }
    }
  },
})

export default factory
