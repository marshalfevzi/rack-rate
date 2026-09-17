import type { CustomToolFactory } from "@oh-my-pi/pi-coding-agent"
import { closeMilestone } from "../lib/ops.ts"

const factory: CustomToolFactory = (pi) => ({
  name: "pm_milestone_close",
  label: "Close PM Milestone",
  description: "Archive a milestone after its closed retrospective and completed tasks.",
  parameters: pi.zod.object({
    milestone: pi.zod.string(),
    outcome: pi.zod.enum(["closed", "continued"]).default("closed").optional(),
  }),
  async execute(_id, params, _onUpdate, ctx, _signal) {
    try {
      const result = await closeMilestone(ctx.cwd, {
        milestone: params.milestone,
        outcome: params.outcome ?? "closed",
      })

      const details = { ok: true, archive: result.archive, removed: result.removed }

      return {
        content: [
          { type: "text", text: `PM milestone ${params.milestone} archived at ${result.archive}` },
        ],
        details,
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)

      return {
        content: [{ type: "text", text: `PM milestone close failed: ${message}` }],
        details: { ok: false, error: message },
      }
    }
  },
})

export default factory
