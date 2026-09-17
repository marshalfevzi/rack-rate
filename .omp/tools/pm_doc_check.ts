import type { CustomToolFactory } from "@oh-my-pi/pi-coding-agent"
import { docCheck } from "../lib/plan.ts"

const factory: CustomToolFactory = (pi) => ({
  name: "pm_doc_check",
  label: "PM Document Check",
  description: "Check PM-owned and impeccable reference documents for required structure.",
  parameters: pi.zod.object({}),
  async execute(_id, _params, _onUpdate, ctx, _signal) {
    const issues = await docCheck(ctx.cwd)
    const errors = issues.filter((item) => item.severity === "error").length
    const warnings = issues.filter((item) => item.severity === "warn").length
    const details = { ok: errors === 0, issues }
    const text = `PM document check: ${errors} error(s), ${warnings} warning(s)`

    return { content: [{ type: "text", text }], details }
  },
})

export default factory
