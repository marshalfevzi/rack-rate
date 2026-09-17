import type { CustomToolFactory } from "@oh-my-pi/pi-coding-agent"
import { nextTask, syncPlan } from "../lib/plan.ts"

const factory: CustomToolFactory = (pi) => ({
  name: "pm_plan_sync",
  label: "PM Plan Sync",
  description: "Validate PM documents and regenerate the generated plan when valid.",
  parameters: pi.zod.object({
    write: pi.zod.boolean().default(true).optional(),
  }),
  async execute(_id, params, _onUpdate, ctx, _signal) {
    const result = await syncPlan(ctx.cwd, params.write !== false)
    const issues = result.model.issues
    const errors = issues.filter((item) => item.severity === "error").length
    const warnings = issues.filter((item) => item.severity === "warn").length
    const task = nextTask(result.model)

    const milestones = result.model.milestones.map((milestone) => {
      const tasks = milestone.tasks.flatMap((id) => {
        const item = result.model.tasks.get(id)

        return item ? [item] : []
      })

      return {
        id: milestone.id,
        status: milestone.status,
        open: tasks.filter((item) => item.status !== "done").length,
        blocked: tasks.filter((item) => item.status === "blocked").length,
      }
    })

    const details = {
      ok: errors === 0,
      issues,
      next_task: task?.id ?? null,
      plan_path: "docs/pm/plan.yml",
      written: result.written,
      milestones,
    }

    const text = `PM plan sync: ${result.written ? "plan.yml written" : "plan.yml unchanged"}; ${errors} error(s), ${warnings} warning(s)`

    return { content: [{ type: "text", text }], details }
  },
})

export default factory
