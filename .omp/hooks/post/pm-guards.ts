import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent"
import { docCheck, syncPlan } from "../../lib/plan.ts"
import { lintMarkdownText } from "../../../tools/markdown-lint/index.ts"
import {
  isReferenceDocument,
  isWithin,
  isWriteTool,
  relativeFrom,
  toolInputPath,
  warn,
} from "../../lib/tool-input.ts"
import { resolve } from "node:path"

export default (pi: ExtensionAPI): void => {
  let touched = false

  pi.on("tool_result", async (event, ctx) => {
    try {
      if (event.isError) return

      if (!isWriteTool(event.toolName)) return

      const target = toolInputPath(event.input, ctx.cwd)

      if (target === undefined) return

      const inPmTree = isWithin(target, resolve(ctx.cwd, "docs/pm"))
      const isReference = isReferenceDocument(target, ctx.cwd)
      const isMarkdown = target.endsWith(".md")

      if (!inPmTree && !isReference && !isMarkdown) return

      if (inPmTree || isReference) {
        touched = true
      }

      const lines: string[] = []

      if (inPmTree) {
        const synced = await syncPlan(ctx.cwd)

        const errors = synced.model.issues.filter((issue) => issue.severity === "error").length

        const warnings = synced.model.issues.filter((issue) => issue.severity === "warn").length

        // An error leaves the plan unwritten, so report the failure instead of "unchanged".
        const line =
          errors > 0
            ? `[pm] plan.yml not written — ${errors} error(s), ${warnings} warning(s)`
            : synced.written
              ? `[pm] plan.yml regenerated — ${warnings} warning(s)`
              : `[pm] plan.yml unchanged — ${warnings} warning(s)`

        lines.push(line)
      }

      if (isMarkdown) {
        try {
          const text = await Bun.file(target).text()
          const findings = await lintMarkdownText(text, relativeFrom(ctx.cwd, target), ctx.cwd)

          for (const finding of findings) {
            lines.push(
              `[md] ${finding.file}:${finding.line}:${finding.column} ${finding.code} — ${finding.message}`,
            )
          }
        } catch (error) {
          warn(pi, "pm", "markdown check failed", error)
        }
      }

      if (lines.length === 0) return

      const text = lines.join("\n")

      return {
        content: [...event.content, { type: "text", text }],
      }
    } catch (error) {
      warn(pi, "pm", "plan guard failed", error)
    }
  })

  pi.on("session_stop", async (event, ctx) => {
    try {
      if (event.stop_hook_active) return

      const [checked, synced] = await Promise.all([docCheck(ctx.cwd), syncPlan(ctx.cwd)])

      const issues = [...checked, ...synced.model.issues]
      const errors = issues.filter((issue) => issue.severity === "error")

      if (!touched || errors.length === 0) return

      const summary = errors.map((issue) => `${issue.code}: ${issue.message}`).join("; ")

      return {
        decision: "block",
        reason: `PM docs need attention — ${summary}`,
      }
    } catch (error) {
      warn(pi, "pm", "session stop check failed", error)
    }
  })
}
