/**
 * Markdown quality checks used by the repository gate. The `.claude/**` exclusion
 * is the vendored impeccable install. The `docs/history/**` exclusion is frozen
 * pre-PM history whose relative links deliberately reference files deleted on
 * 2026-09-17 (see the relocation note at the top of `docs/history/stages-1-2.md`).
 */

import { execFile } from "node:child_process"
import { readdir, readFile, stat } from "node:fs/promises"
import { dirname, join, relative, resolve } from "node:path"

import { z } from "zod"

import config from "./config.json"

export type MarkdownCode =
  | "frontmatter-unterminated"
  | "frontmatter-invalid"
  | "frontmatter-key-missing"
  | "hard-break-backslash"
  | "hard-break-spaces"
  | "dangling-link"
  | "unreadable-file"

export interface MarkdownIssue {
  severity: "error" | "warn"
  code: MarkdownCode
  message: string
  file: string
  line: number
  column: number
}

export interface MarkdownLintRequest {
  root: string
  files?: string[]
}

export interface MarkdownLintResult {
  issues: MarkdownIssue[]
  files: string[]
}

interface FrontmatterResult {
  issues: MarkdownIssue[]
  scanStart: number
}

interface LinkTarget {
  target: string
  offset: number
}

const frontmatterSchema = z.record(z.string(), z.unknown())

const linkPattern =
  /!?\[[^\]\n]*\]\(\s*(?:<([^>\n]*)>|([^\s)\n]*))\s*\)|\[[^\]\n]+\]:\s*(?:<([^>\n]*)>|([^\s\n]*))/gu

const uriSchemePattern = /^[A-Za-z][A-Za-z0-9+.-]*:/u

const fencePattern = /^(?:`{3,}|~{3,})/u

function globPattern(glob: string): RegExp {
  let pattern = "^"

  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index] ?? ""
    const next = glob[index + 1] ?? ""

    if (character === "*" && next === "*") {
      if (glob[index + 2] === "/") {
        pattern += "(?:.*/)?"
        index += 2
      } else {
        pattern += ".*"
        index += 1
      }

      continue
    }

    if (character === "*") {
      pattern += "[^/]*"
      continue
    }

    if (character === "?") {
      pattern += "[^/]"
      continue
    }

    pattern += character.replace(/[\\^$.*+?()[\]{}|]/gu, "\\$&")
  }

  return new RegExp(`${pattern}$`, "u")
}

const exclusionPatterns = config.exclude.map((glob) => globPattern(glob))

function issue(
  code: MarkdownCode,
  file: string,
  line: number,
  column: number,
  message: string,
): MarkdownIssue {
  return { severity: "error", code, message, file, line, column }
}

function parseFrontmatter(text: string, file: string): FrontmatterResult {
  const lines = text.split(/\r?\n/u)

  if (lines[0] !== "---") {
    return { issues: [], scanStart: 0 }
  }

  let closingLine = -1

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index] === "---") {
      closingLine = index
      break
    }
  }

  if (closingLine === -1) {
    return {
      issues: [
        issue("frontmatter-unterminated", file, 1, 1, "frontmatter block is not terminated"),
      ],
      scanStart: lines.length,
    }
  }

  const block = lines.slice(1, closingLine).join("\n")
  let parsed: unknown

  try {
    parsed = Bun.YAML.parse(block)
  } catch (error) {
    return {
      issues: [
        issue(
          "frontmatter-invalid",
          file,
          1,
          1,
          `frontmatter YAML could not be parsed: ${String(error)}`,
        ),
      ],
      scanStart: closingLine + 1,
    }
  }

  const result = frontmatterSchema.safeParse(parsed)

  if (!result.success) {
    return {
      issues: [issue("frontmatter-invalid", file, 1, 1, "frontmatter must be a YAML mapping")],
      scanStart: closingLine + 1,
    }
  }

  const issues: MarkdownIssue[] = []

  for (const requirement of config.requiredFrontmatterKeys) {
    if (!requirement.globs.some((glob) => globPattern(glob).test(file))) {
      continue
    }

    for (const key of requirement.keys) {
      if (Object.hasOwn(result.data, key)) {
        continue
      }

      const glob = requirement.globs.find((candidate) => globPattern(candidate).test(file))

      if (glob === undefined) {
        continue
      }

      issues.push(
        issue(
          "frontmatter-key-missing",
          file,
          1,
          1,
          `frontmatter key "${key}" is required by ${glob}`,
        ),
      )
    }
  }

  return { issues, scanStart: closingLine + 1 }
}

function targetFromMatch(match: RegExpMatchArray): LinkTarget {
  const target = match[1] ?? match[2] ?? match[3] ?? match[4] ?? ""
  const inlineMarker = match[0].indexOf("](")
  const marker = inlineMarker >= 0 ? inlineMarker : match[0].indexOf("]:")
  let offset = marker + 2

  while (offset < match[0].length && /\s/u.test(match[0][offset] ?? "")) {
    offset += 1
  }

  if (match[0][offset] === "<") {
    offset += 1
  }

  return { target, offset }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)

    return true
  } catch {
    return false
  }
}

async function scanMarkdown(
  text: string,
  file: string,
  root: string,
  scanStart: number,
): Promise<MarkdownIssue[]> {
  const lines = text.split(/\r?\n/u)
  const issues: MarkdownIssue[] = []
  let inFence = false

  for (let index = scanStart; index < lines.length; index += 1) {
    const line = lines[index] ?? ""
    const trimmed = line.trim()

    if (line.startsWith("    ")) {
      continue
    }

    if (fencePattern.test(trimmed)) {
      inFence = !inFence

      continue
    }

    if (inFence || trimmed.length === 0) {
      continue
    }

    const content = line.replace(/\s+$/u, "")
    const backslashes = content.match(/\\+$/u)

    if (backslashes !== null && backslashes[0].length % 2 === 1) {
      issues.push(
        issue(
          "hard-break-backslash",
          file,
          index + 1,
          content.length - backslashes[0].length + 1,
          "hard line break (backslash at end of line)",
        ),
      )
    }

    const trailingSpaces = line.match(/ +$/u)

    if (trailingSpaces !== null && trailingSpaces[0].length >= 2) {
      issues.push(
        issue(
          "hard-break-spaces",
          file,
          index + 1,
          line.length - trailingSpaces[0].length + 1,
          "hard line break (trailing spaces)",
        ),
      )
    }

    linkPattern.lastIndex = 0

    for (const match of line.matchAll(linkPattern)) {
      const location = targetFromMatch(match)

      if (
        location.target.length === 0 ||
        location.target.startsWith("#") ||
        location.target.startsWith("//") ||
        uriSchemePattern.test(location.target)
      ) {
        continue
      }

      const targetPath = location.target.replace(/[?#].*$/u, "")
      const absoluteTarget = resolve(dirname(join(root, file)), targetPath)

      if (await pathExists(absoluteTarget)) {
        continue
      }

      issues.push(
        issue(
          "dangling-link",
          file,
          index + 1,
          match.index + location.offset + 1,
          `link target does not exist: ${location.target}`,
        ),
      )
    }
  }

  return issues
}

function sortIssues(issues: MarkdownIssue[]): void {
  issues.sort((left, right) => {
    const fileOrder = left.file.localeCompare(right.file)

    if (fileOrder !== 0) {
      return fileOrder
    }

    if (left.line !== right.line) {
      return left.line - right.line
    }

    if (left.column !== right.column) {
      return left.column - right.column
    }

    return left.code.localeCompare(right.code)
  })
}

function runGit(root: string, args: string[]): Promise<string> {
  const { promise, resolve: resolvePromise, reject } = Promise.withResolvers<string>()

  execFile("git", args, { cwd: root }, (error, stdout, stderr) => {
    if (error) {
      reject(new Error(stderr.trim() || error.message))

      return
    }

    resolvePromise(stdout.trim())
  })

  return promise
}

async function discoveredFiles(root: string): Promise<string[]> {
  const output = await runGit(root, [
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "--",
    "*.md",
  ])

  const files = output.length === 0 ? [] : output.split(/\r?\n/u)

  return files.filter((file) => !exclusionPatterns.some((pattern) => pattern.test(file))).sort()
}

async function lintFile(root: string, file: string): Promise<MarkdownIssue[]> {
  let text: string

  try {
    text = await readFile(join(root, file), "utf8")
  } catch (error) {
    return [
      issue("unreadable-file", file, 0, 0, `Markdown file could not be read: ${String(error)}`),
    ]
  }

  const frontmatter = parseFrontmatter(text, file)
  const issues = [...frontmatter.issues]
  const scanIssues = await scanMarkdown(text, file, root, frontmatter.scanStart)
  issues.push(...scanIssues)

  return issues
}

export async function lintMarkdownText(
  text: string,
  file: string,
  root: string,
): Promise<MarkdownIssue[]> {
  const normalizedFile = file.replaceAll("\\", "/")
  const frontmatter = parseFrontmatter(text, normalizedFile)
  const issues = [...frontmatter.issues]
  const scanIssues = await scanMarkdown(text, normalizedFile, root, frontmatter.scanStart)
  issues.push(...scanIssues)
  sortIssues(issues)

  return issues
}

async function directoryMarkdown(root: string, directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const absolute = join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await directoryMarkdown(root, absolute)))

      continue
    }

    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue
    }

    const file = relative(root, absolute).replaceAll("\\", "/")

    if (!exclusionPatterns.some((pattern) => pattern.test(file))) {
      files.push(file)
    }
  }

  return files
}

/** An explicit argument may name a directory, which stands for the markdown inside it. */
async function requestedFiles(root: string, entries: string[]): Promise<string[]> {
  const files: string[] = []

  for (const entry of entries) {
    const file = entry.replaceAll("\\", "/").replace(/^\.\//u, "")
    const info = await stat(join(root, file)).catch(() => undefined)

    if (info?.isDirectory()) {
      files.push(...(await directoryMarkdown(root, join(root, file))))

      continue
    }

    files.push(file)
  }

  return Array.from(new Set(files)).sort()
}

export async function lintMarkdown(request: MarkdownLintRequest): Promise<MarkdownLintResult> {
  const files =
    request.files === undefined
      ? await discoveredFiles(request.root)
      : await requestedFiles(request.root, request.files)

  const issueGroups = await Promise.all(files.map((file) => lintFile(request.root, file)))
  const issues = issueGroups.flat()
  sortIssues(issues)

  return { issues, files }
}
