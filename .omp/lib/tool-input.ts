import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent"
import { isAbsolute, relative, resolve } from "node:path"
import { planPath } from "./plan.ts"

/** Tools whose input names exactly one path they may create, replace or rewrite. */
const WRITE_TOOLS: readonly string[] = ["write", "edit", "ast_edit"]

/** Documents owned by the impeccable workflow; edits to them invalidate the design check. */
const REFERENCE_DOCUMENTS: readonly string[] = [
  "PRD.md",
  "ARCHITECTURE.md",
  "PRODUCT.md",
  "DESIGN.md",
  "CAVEATS.md",
]

export function isWriteTool(toolName: string): boolean {
  return WRITE_TOOLS.includes(toolName)
}

/**
 * Read the single path a file-writing tool was given. Tools disagree on the key
 * (`path`, `file_path`, `filePath`), so probe in that order and resolve relative
 * input against the session root.
 */
export function toolInputPath(input: unknown, cwd: string): string | undefined {
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

  const text = String(value)

  return text.length === 0 ? undefined : resolve(cwd, text)
}

/** True when `path` is strictly inside `directory`. */
export function isWithin(path: string, directory: string): boolean {
  const relativePath = relative(directory, path)

  return relativePath.length > 0 && !relativePath.startsWith("..") && !isAbsolute(relativePath)
}

export function isGeneratedPlan(path: string, cwd: string): boolean {
  const absolutePath = resolve(cwd, path)

  return absolutePath === resolve(cwd, planPath(cwd))
}

/** Repository-relative POSIX path, for comparing a target against known document names. */
export function relativeFrom(root: string, path: string): string {
  return relative(root, resolve(root, path)).replaceAll("\\", "/")
}

export function isReferenceDocument(path: string, cwd: string): boolean {
  const relativePath = relativeFrom(cwd, path)

  return (
    REFERENCE_DOCUMENTS.includes(relativePath) ||
    relativePath === ".impeccable/design.json" ||
    relativePath.startsWith(".impeccable/surfaces/")
  )
}

/** Log a hook failure without letting logging itself break the handler. */
export function warn(pi: ExtensionAPI, label: string, message: string, error: unknown): void {
  try {
    const detail = error instanceof Error ? error.message : String(error)

    pi.logger.warn(`[${label}] ${message}: ${detail}`)
  } catch (loggingError) {
    void loggingError
  }
}
