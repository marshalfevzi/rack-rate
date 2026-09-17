import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent"
import { extname, resolve } from "node:path"

const UI_EXTENSIONS = {
  ".astro": true,
  ".css": true,
  ".scss": true,
  ".sass": true,
  ".less": true,
  ".html": true,
  ".tsx": true,
  ".jsx": true,
  ".vue": true,
  ".svelte": true,
  ".ts": true,
  ".js": true,
} satisfies Record<string, true>

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

function isUiPath(path: string): boolean {
  return UI_EXTENSIONS[extname(path).toLowerCase()] === true
}

function additionalContext(value: unknown): string | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }

  if (!("hookSpecificOutput" in value)) return undefined

  const output = value.hookSpecificOutput

  if (output === null || typeof output !== "object" || Array.isArray(output)) {
    return undefined
  }

  if (!("additionalContext" in output)) return undefined

  const context = output.additionalContext

  if (typeof context !== "string" || context.length === 0) return undefined

  return context
}

function warn(pi: ExtensionAPI, message: string, error: unknown): void {
  try {
    const detail = error instanceof Error ? error.message : String(error)

    pi.logger.warn(`[impeccable] ${message}: ${detail}`)
  } catch (loggingError) {
    void loggingError
  }
}

function runDetector(pi: ExtensionAPI, root: string, payload: string): string | undefined {
  try {
    const proc = Bun.spawnSync({
      cmd: [".claude/skills/impeccable/scripts/impeccable", "hook"],
      cwd: root,
      stdin: new TextEncoder().encode(payload),
    })

    if (proc.exitCode !== 0) {
      warn(pi, `detector exited with status ${proc.exitCode}`, proc.stderr)

      return undefined
    }

    try {
      const parsed: unknown = JSON.parse(new TextDecoder().decode(proc.stdout))

      return additionalContext(parsed)
    } catch (error) {
      warn(pi, "detector returned invalid JSON", error)

      return undefined
    }
  } catch (error) {
    warn(pi, "detector could not run", error)

    return undefined
  }
}

async function hasDesignDocs(root: string): Promise<boolean> {
  const [product, design] = await Promise.all([
    Bun.file(resolve(root, "PRODUCT.md")).exists(),
    Bun.file(resolve(root, "DESIGN.md")).exists(),
  ])

  return product && design
}

export default (pi: ExtensionAPI): void => {
  let stopRan = false

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

      if (target === undefined || !isUiPath(target)) return

      if (!(await hasDesignDocs(ctx.cwd))) return

      const payload = JSON.stringify({
        hook_event_name: "PostToolUse",
        tool_name: "Edit",
        tool_input: { file_path: target },
        cwd: ctx.cwd,
      })

      const findings = runDetector(pi, ctx.cwd, payload)

      if (findings === undefined) return

      return {
        content: [...event.content, { type: "text", text: findings }],
      }
    } catch (error) {
      warn(pi, "tool result check failed", error)
    }
  })

  pi.on("session_stop", async (event, ctx) => {
    try {
      if (event.stop_hook_active || stopRan) return

      stopRan = true

      if (!(await hasDesignDocs(ctx.cwd))) return

      const payload = JSON.stringify({
        hook_event_name: "Stop",
        cwd: ctx.cwd,
      })

      const findings = runDetector(pi, ctx.cwd, payload)

      if (findings === undefined) return

      await pi.sendMessage(
        {
          customType: "impeccable",
          content: findings,
          display: true,
          attribution: "agent",
        },
        { deliverAs: "nextTurn", triggerTurn: false },
      )
    } catch (error) {
      warn(pi, "session stop check failed", error)
    }
  })
}
