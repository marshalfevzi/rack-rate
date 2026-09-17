import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent"
import { docCheck, syncPlan } from "../../lib/plan.ts"
import { isAbsolute, relative, resolve } from "node:path"

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

function isReferencePath(path: string, cwd: string): boolean {
  const relativePath = relative(cwd, resolve(cwd, path)).replaceAll("\\", "/")

  return (
    relativePath === "PRD.md" ||
    relativePath === "ARCHITECTURE.md" ||
    relativePath === "PRODUCT.md" ||
    relativePath === "DESIGN.md" ||
    relativePath === "CAVEATS.md" ||
    relativePath === ".impeccable/design.json" ||
    relativePath.startsWith(".impeccable/surfaces/")
  )
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
  let touched = false

  pi.on("tool_result", async (event, ctx) => {
    try {
      if (event.isError) return

      if (
        event.toolName !== "edit" &&
        event.toolName !== "write" &&
        event.toolName !== "ast_edit"
      ) {
        return
      }

      const target = inputPath(event.input, ctx.cwd)

      if (target === undefined) return

      const inPmTree = isWithin(target, resolve(ctx.cwd, "docs/pm"))

      if (!inPmTree && !isReferencePath(target, ctx.cwd)) return

      touched = true

      if (!inPmTree) return

      const synced = await syncPlan(ctx.cwd)

      const errors = synced.model.issues.filter((issue) => issue.severity === "error").length

      const warnings = synced.model.issues.filter((issue) => issue.severity === "warn").length

      const line = synced.written
        ? `[pm] plan.yml regenerated — ${errors} error(s), ${warnings} warning(s)`
        : "[pm] plan.yml unchanged"

      return {
        content: [...event.content, { type: "text", text: line }],
      }
    } catch (error) {
      warn(pi, "plan guard failed", error)
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
      warn(pi, "session stop check failed", error)
    }
  })
}
