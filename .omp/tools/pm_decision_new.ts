import type { CustomToolFactory } from "@oh-my-pi/pi-coding-agent"
import { createDecision } from "../lib/ops.ts"

const factory: CustomToolFactory = (pi) => ({
  name: "pm_decision_new",
  label: "New PM Decision",
  description: "Create a dated decision record and regenerate the PM plan.",
  parameters: pi.zod.object({
    title: pi.zod.string(),
    status: pi.zod.enum(["proposed", "accepted", "rejected", "superseded", "deferred"]).optional(),
    milestone: pi.zod.string().nullable(),
    tasks: pi.zod.array(pi.zod.string()).optional(),
    context: pi.zod.string(),
    decision: pi.zod.string(),
    consequences: pi.zod.string(),
    supersedes: pi.zod.string().nullable(),
  }),
  async execute(_id, params, _onUpdate, _ctx, _signal) {
    try {
      // `pi.cwd`, not `ctx.cwd`: the device transport passes a context with no `cwd`.
      const result = await createDecision(pi.cwd, {
        title: params.title,
        status: params.status ?? "accepted",
        milestone: params.milestone,
        tasks: params.tasks ?? [],
        context: params.context,
        decision: params.decision,
        consequences: params.consequences,
        supersedes: params.supersedes,
      })

      const details = { ok: true, file: result.file, id: result.id }

      return {
        content: [{ type: "text", text: `PM decision ${result.id} created at ${result.file}` }],
        details,
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)

      return {
        content: [{ type: "text", text: `PM decision creation failed: ${message}` }],
        details: { ok: false, error: message },
      }
    }
  },
})

export default factory
