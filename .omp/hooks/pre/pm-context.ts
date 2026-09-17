import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent"
import { nextTask, planPath, syncPlan } from "../../lib/plan.ts"
import { isAbsolute, relative, resolve } from "node:path"

const GENERATED_PLAN_REASON =
  "docs/pm/plan.yml is generated — edit the source docs and run pm_plan_sync"

function inputPath(input: unknown, cwd: string): string | undefined {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return undefined
  }

  let value: unknown

  if ("path" in input && input.path !== undefined && input.path !== null) {
    value = input.path
  } else if ("file_path" in input && input.file_path !== undefined && input.file_path !== null) {
    value = input.file_path
  } else if ("filePath" in input && input.filePath !== undefined && input.filePath !== null) {
    value = input.filePath
  } else {
    return undefined
  }

  if (value === undefined || value === null) return undefined

  const text = String(value)

  if (text.length === 0) return undefined

  return resolve(cwd, text)
}

function isWithin(path: string, directory: string): boolean {
  const relativePath = relative(directory, path)

  return relativePath.length > 0 && !relativePath.startsWith("..") && !isAbsolute(relativePath)
}

function isGeneratedPlan(path: string, cwd: string): boolean {
  const absolutePath = resolve(cwd, path)
  const generatedPath = resolve(cwd, planPath(cwd))
  const normalized = absolutePath.replaceAll("\\", "/")

  return absolutePath === generatedPath || normalized.endsWith("/docs/pm/plan.yml")
}

function warn(pi: ExtensionAPI, message: string, error: unknown): void {
  try {
    const detail = error instanceof Error ? error.message : String(error)

    pi.logger.warn(`[pm] ${message}: ${detail}`)
  } catch (loggingError) {
    void loggingError
  }
}

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
      warn(pi, "session context failed", error)
    }
  })

  pi.on("tool_call", (event, ctx) => {
    try {
      if (event.toolName !== "write" && event.toolName !== "edit") return

      const target = inputPath(event.input, ctx.cwd)

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
      warn(pi, "write policy failed", error)
    }
  })
}
