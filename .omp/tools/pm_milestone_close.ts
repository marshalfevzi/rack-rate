import type { CustomToolFactory } from "@oh-my-pi/pi-coding-agent"
import { closeMilestone } from "../lib/ops.ts"

const factory: CustomToolFactory = (pi) => ({
  name: "pm_milestone_close",
  label: "Close PM Milestone",
  description: "Archive a milestone after its closed retrospective and completed tasks.",
  parameters: pi.zod.object({
    milestone: pi.zod.string(),
    outcome: pi.zod.enum(["closed", "continued"]).optional(),
  }),
  async execute(_id, params, _onUpdate, _ctx, _signal) {
    try {
      // `pi.cwd`, not `ctx.cwd`: the device transport passes a context with no `cwd`.
      const result = await closeMilestone(pi.cwd, {
        milestone: params.milestone,
        outcome: params.outcome ?? "closed",
      })

      const details = { ok: true, archive: result.archive, removed: result.removed }

      const text =
        result.archive === null
          ? `PM milestone ${params.milestone} resumed at status: in_progress; nothing was archived`
          : `PM milestone ${params.milestone} archived at ${result.archive}`

      return {
        content: [{ type: "text", text }],
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
