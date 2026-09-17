import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent"
import { nextTask, syncPlan } from "../../lib/plan.ts"
import {
  isGeneratedPlan,
  isWithin,
  isWriteTool,
  toolInputPath,
  warn,
} from "../../lib/tool-input.ts"
import { resolve } from "node:path"

const GENERATED_PLAN_REASON =
  "docs/pm/plan.yml is generated — edit the source docs and run pm_plan_sync"

export default (pi: ExtensionAPI): void => {
  pi.on("session_start", async (_event, ctx) => {
    try {
      const root = ctx.cwd
      const synced = await syncPlan(root)
      const model = synced.model
      const next = nextTask(model)

      const active = model.milestones.find((milestone) => milestone.status === "in_progress")

      const command = next?.status === "blocked" ? "/pm-resolve" : "/pm"
      const activeLabel = active ? `${active.id} — ${active.title}` : "none"
      const nextLabel = next ? `${next.id} — ${next.title}` : "none"
      const errors = model.issues.filter((issue) => issue.severity === "error")

      const issueText = errors.map((issue) => `${issue.code}: ${issue.message}`).join("; ")

      const content =
        issueText.length > 0
          ? `[pm] command: ${command}; active milestone: ${activeLabel}; next task: ${nextLabel}; errors: ${issueText}`
          : `[pm] command: ${command}; active milestone: ${activeLabel}; next task: ${nextLabel}`

      await pi.sendMessage(
        {
          customType: "pm-context",
          content,
          display: true,
          attribution: "agent",
        },
        { deliverAs: "nextTurn", triggerTurn: false },
      )
    } catch (error) {
      warn(pi, "pm", "session context failed", error)
    }
  })

  pi.on("tool_call", (event, ctx) => {
    try {
      if (!isWriteTool(event.toolName)) return

      const target = toolInputPath(event.input, ctx.cwd)

      if (target === undefined) return

      if (isGeneratedPlan(target, ctx.cwd)) {
        return { block: true, reason: GENERATED_PLAN_REASON }
      }

      if (isWithin(target, resolve(ctx.cwd, "docs/archive"))) {
        return {
          block: true,
          reason: "docs/archive is a flat archive — use pm_milestone_close",
        }
      }
    } catch (error) {
      warn(pi, "pm", "write policy failed", error)
    }
  })
}
