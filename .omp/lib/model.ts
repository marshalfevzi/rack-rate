import { readdir, readFile } from "node:fs/promises"
import type { Dirent } from "node:fs"
import { join, relative, sep } from "node:path"
import { splitDocument } from "./frontmatter.ts"
import { asString, asStringList, isRecord, parseYaml } from "./yaml.ts"

export type MilestoneStatus = "backlog" | "in_progress" | "retro" | "completed"

export type TaskStatus = "todo" | "done" | "blocked"

export type DecisionStatus = "proposed" | "accepted" | "rejected" | "superseded" | "deferred"

export interface PrefixConfig {
  domain: string
  impeccable: boolean
}

export interface ProjectDocs {
  prd: string
  product: string
  design: string
  architecture: string
  constraints: string | null
}

export interface ProjectConfig {
  name: string
  docs: ProjectDocs
  commands: {
    format: string | null
    gate: string | null
  }
  prefixes: Map<string, PrefixConfig>
  paths: {
    milestones: string
    archive: string
    ideas: string
    unplanned: string
    decisions: string
  }
}

export interface MilestoneRecord {
  id: string
  title: string
  description: string
  status: MilestoneStatus
  started: string | null
  completed: string | null
  tasks: string[]
  retro: string[]
  file: string
  body: string
}

export interface TaskRecord {
  id: string
  title: string
  description: string
  status: TaskStatus
  milestone: string | null
  pre: string[]
  kind: string
  blockedBy: string | null
  created: string
  completed: string | null
  unplanned: boolean
  file: string
  folder: "todo" | "done" | "unplanned"
  body: string
}

export interface DecisionRecord {
  id: string
  date: string
  status: DecisionStatus
  milestone: string | null
  tasks: string[]
  supersedes: string | null
  title: string
  file: string
  body: string
}

export interface RetroRecord {
  id: string
  milestone: string
  date: string
  status: "completed" | "aborted"
  outcome: "closed" | "continued"
  file: string
  body: string
}

export interface ArchivedMilestone {
  id: string
  title: string
  status: MilestoneStatus
  started: string | null
  completed: string | null
  tasks: string[]
  retro: string[]
  file: string
}

export interface Issue {
  severity: "error" | "warn"
  code: string
  message: string
  path: string
}

export interface PlanModel {
  root: string
  config: ProjectConfig
  milestones: MilestoneRecord[]
  tasks: Map<string, TaskRecord>
  decisions: Map<string, DecisionRecord>
  retros: Map<string, RetroRecord>
  archived: ArchivedMilestone[]
  issues: Issue[]
  existingPlan?: string | null
  idOccurrences?: Map<string, number>
}

const defaultConfig: ProjectConfig = {
  name: "rack-rate",
  docs: {
    prd: "PRD.md",
    product: "PRODUCT.md",
    design: "DESIGN.md",
    architecture: "ARCHITECTURE.md",
    constraints: null,
  },
  commands: {
    format: null,
    gate: null,
  },
  prefixes: new Map(),
  paths: {
    milestones: "docs/pm",
    archive: "docs/archive",
    ideas: "docs/pm/ideas",
    unplanned: "docs/pm/unplanned",
    decisions: "docs/pm/decisions",
  },
}

function requiredString(value: unknown, field: string): string {
  const result = asString(value)

  if (result === undefined || result.length === 0) {
    throw new Error(`config.yml field ${field} must be a non-empty string`)
  }

  return result
}

function optionalString(value: unknown): string | null {
  return value === null || value === undefined ? null : (asString(value) ?? null)
}

function pathRelative(root: string, file: string): string {
  return relative(root, file).split(sep).join("/")
}

function mapValue(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`config.yml field ${field} must be a mapping`)
  }

  return value
}

export async function readConfig(root: string): Promise<ProjectConfig> {
  const file = join(root, "docs/pm/config.yml")
  const text = await readFile(file, "utf8")
  const raw = parseYaml(text)
  const document = mapValue(raw, "root")
  const project = mapValue(document.project, "project")

  const commandValues =
    project.commands === undefined ? {} : mapValue(project.commands, "project.commands")

  const prefixValues = mapValue(document.prefixes, "prefixes")
  const paths = mapValue(document.paths, "paths")
  const prefixes = new Map<string, PrefixConfig>()

  for (const [prefix, value] of Object.entries(prefixValues)) {
    const config = mapValue(value, `prefixes.${prefix}`)
    const impeccableValue = config.impeccable

    if (typeof impeccableValue !== "boolean") {
      throw new Error(`config.yml field prefixes.${prefix}.impeccable must be boolean`)
    }

    prefixes.set(prefix, {
      domain: requiredString(config.domain, `prefixes.${prefix}.domain`),
      impeccable: impeccableValue,
    })
  }

  return {
    name: requiredString(project.name, "project.name"),
    docs: {
      prd: requiredString(project.prd, "project.prd"),
      product: requiredString(project.product, "project.product"),
      design: requiredString(project.design, "project.design"),
      architecture: requiredString(project.architecture, "project.architecture"),
      constraints: optionalString(project.constraints),
    },
    commands: {
      format: optionalString(commandValues.format),
      gate: optionalString(commandValues.gate),
    },
    prefixes,
    paths: {
      milestones: requiredString(paths.milestones, "paths.milestones"),
      archive: requiredString(paths.archive, "paths.archive"),
      ideas: requiredString(paths.ideas, "paths.ideas"),
      unplanned: requiredString(paths.unplanned, "paths.unplanned"),
      decisions: requiredString(paths.decisions, "paths.decisions"),
    },
  }
}

async function markdownFiles(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
      const file = join(directory, entry.name)

      if (entry.isDirectory()) {
        files.push(...(await markdownFiles(file)))
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(file)
      }
    }

    return files.sort()
  } catch (error: unknown) {
    if (isMissing(error)) {
      return []
    }

    throw error
  }
}

async function directoryEntries(directory: string): Promise<Dirent[]> {
  try {
    return await readdir(directory, { withFileTypes: true })
  } catch (error: unknown) {
    if (isMissing(error)) {
      return []
    }

    throw error
  }
}

function isMissing(error: unknown): boolean {
  return isRecord(error) && error.code === "ENOENT"
}

function issue(severity: Issue["severity"], code: string, message: string, file: string): Issue {
  return { severity, code, message, path: file }
}

function statusMilestone(value: unknown): MilestoneStatus {
  return value === "backlog" ||
    value === "in_progress" ||
    value === "retro" ||
    value === "completed"
    ? value
    : "backlog"
}

function statusTask(value: unknown): TaskStatus {
  return value === "todo" || value === "done" || value === "blocked" ? value : "todo"
}

function statusDecision(value: unknown): DecisionStatus {
  return value === "proposed" ||
    value === "accepted" ||
    value === "rejected" ||
    value === "superseded" ||
    value === "deferred"
    ? value
    : "proposed"
}

function statusRetro(value: unknown): "completed" | "aborted" {
  return value === "completed" || value === "aborted" ? value : "aborted"
}

function outcomeRetro(value: unknown): "closed" | "continued" {
  return value === "closed" || value === "continued" ? value : "continued"
}

function documentFrontmatter(
  text: string,
  file: string,
  issues: Issue[],
): { frontmatter: Record<string, unknown>; body: string } | undefined {
  try {
    return splitDocument(text)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "malformed frontmatter"
    issues.push(issue("error", "frontmatter-invalid", message, file))

    return undefined
  }
}

function parseMilestone(text: string, file: string, issues: Issue[]): MilestoneRecord | undefined {
  const parsed = documentFrontmatter(text, file, issues)

  if (!parsed) {
    return undefined
  }

  const id = asString(parsed.frontmatter.id)

  if (!id) {
    issues.push(issue("error", "frontmatter-id", "Milestone frontmatter requires id", file))

    return undefined
  }

  return {
    id,
    title: asString(parsed.frontmatter.title) ?? id,
    description: asString(parsed.frontmatter.description) ?? "",
    status: statusMilestone(parsed.frontmatter.status),
    started: optionalString(parsed.frontmatter.started),
    completed: optionalString(parsed.frontmatter.completed),
    tasks: asStringList(parsed.frontmatter.tasks),
    retro: asStringList(parsed.frontmatter.retro),
    file,
    body: parsed.body,
  }
}

function parseTask(
  text: string,
  file: string,
  folder: TaskRecord["folder"],
  unplanned: boolean,
  issues: Issue[],
): TaskRecord | undefined {
  const parsed = documentFrontmatter(text, file, issues)

  if (!parsed) {
    return undefined
  }

  const id = asString(parsed.frontmatter.id)

  if (!id) {
    issues.push(issue("error", "frontmatter-id", "Task frontmatter requires id", file))

    return undefined
  }

  const status = statusTask(parsed.frontmatter.status)
  const milestone = unplanned ? null : optionalString(parsed.frontmatter.milestone)

  return {
    id,
    title: asString(parsed.frontmatter.title) ?? id,
    description: asString(parsed.frontmatter.description) ?? "",
    status,
    milestone,
    pre: asStringList(parsed.frontmatter.pre),
    kind: asString(parsed.frontmatter.kind) ?? "feature",
    blockedBy: optionalString(parsed.frontmatter.blocked_by),
    created: asString(parsed.frontmatter.created) ?? "",
    completed: optionalString(parsed.frontmatter.completed),
    unplanned,
    file,
    folder,
    body: parsed.body,
  }
}

function headingTitle(body: string): string | undefined {
  const match = body.match(/^#\s+(.+)$/m)

  return match?.[1]?.trim()
}

function parseDecision(text: string, file: string, issues: Issue[]): DecisionRecord | undefined {
  const parsed = documentFrontmatter(text, file, issues)

  if (!parsed) {
    return undefined
  }

  const id = asString(parsed.frontmatter.id)

  if (!id) {
    issues.push(issue("error", "frontmatter-id", "Decision frontmatter requires id", file))

    return undefined
  }

  return {
    id,
    date: asString(parsed.frontmatter.date) ?? "",
    status: statusDecision(parsed.frontmatter.status),
    milestone: optionalString(parsed.frontmatter.milestone),
    tasks: asStringList(parsed.frontmatter.tasks),
    supersedes: optionalString(parsed.frontmatter.supersedes),
    title: headingTitle(parsed.body) ?? asString(parsed.frontmatter.title) ?? id,
    file,
    body: parsed.body,
  }
}

function parseRetro(text: string, file: string, issues: Issue[]): RetroRecord | undefined {
  const parsed = documentFrontmatter(text, file, issues)

  if (!parsed) {
    return undefined
  }

  const id = asString(parsed.frontmatter.id)
  const milestone = asString(parsed.frontmatter.milestone)

  if (!id || !milestone) {
    issues.push(
      issue("error", "frontmatter-id", "Retro frontmatter requires id and milestone", file),
    )

    return undefined
  }

  return {
    id,
    milestone,
    date: asString(parsed.frontmatter.date) ?? "",
    status: statusRetro(parsed.frontmatter.status),
    outcome: outcomeRetro(parsed.frontmatter.outcome),
    file,
    body: parsed.body,
  }
}

function parseArchive(text: string, file: string, issues: Issue[]): ArchivedMilestone | undefined {
  const parsed = documentFrontmatter(text, file, issues)

  if (!parsed) {
    return undefined
  }

  const id = asString(parsed.frontmatter.id)

  if (!id) {
    issues.push(issue("error", "frontmatter-id", "Archive frontmatter requires id", file))

    return undefined
  }

  return {
    id,
    title: asString(parsed.frontmatter.title) ?? id,
    status: statusMilestone(parsed.frontmatter.status),
    started: optionalString(parsed.frontmatter.started),
    completed: optionalString(parsed.frontmatter.completed),
    tasks: asStringList(parsed.frontmatter.tasks),
    retro: asStringList(parsed.frontmatter.retro),
    file,
  }
}

async function loadText(file: string, issues: Issue[]): Promise<string | undefined> {
  try {
    return await readFile(file, "utf8")
  } catch (error: unknown) {
    if (isMissing(error)) {
      return undefined
    }

    const message = error instanceof Error ? error.message : "unable to read file"
    issues.push(issue("error", "read-failed", message, file))

    return undefined
  }
}

function addOccurrence(occurrences: Map<string, number>, id: string): void {
  occurrences.set(id, (occurrences.get(id) ?? 0) + 1)
}

export async function loadModel(root: string): Promise<PlanModel> {
  const issues: Issue[] = []
  let config = defaultConfig

  try {
    config = await readConfig(root)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unable to read config.yml"
    issues.push(issue("error", "config-invalid", message, "docs/pm/config.yml"))
  }

  const milestones: MilestoneRecord[] = []
  const tasks = new Map<string, TaskRecord>()
  const decisions = new Map<string, DecisionRecord>()
  const retros = new Map<string, RetroRecord>()
  const archived: ArchivedMilestone[] = []
  const occurrences = new Map<string, number>()

  const milestoneRoot = join(root, config.paths.milestones)
  const milestoneDirectories = await directoryEntries(milestoneRoot)

  for (const entry of milestoneDirectories) {
    if (
      !entry.isDirectory() ||
      entry.name === "ideas" ||
      entry.name === "unplanned" ||
      entry.name === "decisions"
    ) {
      continue
    }

    const directory = join(milestoneRoot, entry.name)
    const readme = join(directory, "README.md")
    const readmeText = await loadText(readme, issues)

    if (readmeText === undefined) {
      issues.push(
        issue(
          "error",
          "milestone-missing",
          "Milestone directory is missing README.md",
          pathRelative(root, directory),
        ),
      )
      continue
    }

    const milestone = parseMilestone(readmeText, pathRelative(root, readme), issues)

    if (!milestone) {
      continue
    }

    milestones.push(milestone)
    addOccurrence(occurrences, milestone.id)

    for (const folder of ["todo", "done"] as const) {
      const taskFiles = await markdownFiles(join(directory, folder))

      for (const taskFile of taskFiles) {
        const taskText = await loadText(taskFile, issues)

        if (taskText === undefined) {
          continue
        }

        const task = parseTask(taskText, pathRelative(root, taskFile), folder, false, issues)

        if (task) {
          tasks.set(task.id, task)
          addOccurrence(occurrences, task.id)
        }
      }
    }

    const retroFiles = (await markdownFiles(directory)).filter((file) => {
      const relativeFile = relative(directory, file)

      // Only RETRO files directly under the milestone count.
      return !relativeFile.includes(sep) && relativeFile.startsWith("RETRO-")
    })

    for (const retroFile of retroFiles) {
      const retroText = await loadText(retroFile, issues)

      if (retroText === undefined) {
        continue
      }

      const retro = parseRetro(retroText, pathRelative(root, retroFile), issues)

      if (retro) {
        retros.set(retro.id, retro)
        addOccurrence(occurrences, retro.id)
      }
    }
  }

  const unplannedFiles = await markdownFiles(join(root, config.paths.unplanned))

  for (const file of unplannedFiles) {
    const text = await loadText(file, issues)

    if (text === undefined) {
      continue
    }

    const task = parseTask(text, pathRelative(root, file), "unplanned", true, issues)

    if (task) {
      tasks.set(task.id, task)
      addOccurrence(occurrences, task.id)
    }
  }

  const decisionFiles = await markdownFiles(join(root, config.paths.decisions))

  for (const file of decisionFiles) {
    const text = await loadText(file, issues)

    if (text === undefined) {
      continue
    }

    const decision = parseDecision(text, pathRelative(root, file), issues)

    if (decision) {
      decisions.set(decision.id, decision)
      addOccurrence(occurrences, decision.id)
    }
  }

  const ideaFiles = await markdownFiles(join(root, config.paths.ideas))

  for (const file of ideaFiles) {
    const text = await loadText(file, issues)

    if (text === undefined) {
      continue
    }

    const parsed = documentFrontmatter(text, pathRelative(root, file), issues)

    if (parsed && !asString(parsed.frontmatter.id)) {
      issues.push(
        issue("error", "frontmatter-id", "Idea frontmatter requires id", pathRelative(root, file)),
      )
    }
  }

  const archiveFiles = await markdownFiles(join(root, config.paths.archive))

  for (const file of archiveFiles) {
    const text = await loadText(file, issues)

    if (text === undefined) {
      continue
    }

    const archive = parseArchive(text, pathRelative(root, file), issues)

    if (archive) {
      archived.push(archive)
      addOccurrence(occurrences, archive.id)
    }
  }

  const planFile = join(root, "docs/pm/plan.yml")
  const existingPlan = await loadText(planFile, issues)

  // This natural ordering exists so M10 sorts after M9.
  function compareMilestoneIds(left: string, right: string): number {
    let leftIndex = 0
    let rightIndex = 0

    while (leftIndex < left.length && rightIndex < right.length) {
      const leftCode = left.charCodeAt(leftIndex)
      const rightCode = right.charCodeAt(rightIndex)
      const leftIsDigit = leftCode >= 48 && leftCode <= 57
      const rightIsDigit = rightCode >= 48 && rightCode <= 57
      let leftEnd = leftIndex + 1
      let rightEnd = rightIndex + 1

      while (leftEnd < left.length) {
        const code = left.charCodeAt(leftEnd)

        if ((code >= 48 && code <= 57) !== leftIsDigit) {
          break
        }

        leftEnd += 1
      }

      while (rightEnd < right.length) {
        const code = right.charCodeAt(rightEnd)

        if ((code >= 48 && code <= 57) !== rightIsDigit) {
          break
        }

        rightEnd += 1
      }

      const leftRun = left.slice(leftIndex, leftEnd)
      const rightRun = right.slice(rightIndex, rightEnd)

      if (leftIsDigit && rightIsDigit) {
        const leftNumber = leftRun.replace(/^0+/, "") || "0"
        const rightNumber = rightRun.replace(/^0+/, "") || "0"

        if (leftNumber.length !== rightNumber.length) {
          return leftNumber.length < rightNumber.length ? -1 : 1
        }

        if (leftNumber !== rightNumber) {
          return leftNumber < rightNumber ? -1 : 1
        }
      } else if (leftRun !== rightRun) {
        const leftCodePoints = [...leftRun]
        const rightCodePoints = [...rightRun]
        const limit = Math.min(leftCodePoints.length, rightCodePoints.length)

        for (let index = 0; index < limit; index += 1) {
          const leftCodePoint = leftCodePoints[index]?.codePointAt(0) ?? 0
          const rightCodePoint = rightCodePoints[index]?.codePointAt(0) ?? 0

          if (leftCodePoint !== rightCodePoint) {
            return leftCodePoint < rightCodePoint ? -1 : 1
          }
        }

        if (leftCodePoints.length !== rightCodePoints.length) {
          return leftCodePoints.length < rightCodePoints.length ? -1 : 1
        }
      }

      leftIndex = leftEnd
      rightIndex = rightEnd
    }

    if (leftIndex !== left.length || rightIndex !== right.length) {
      return leftIndex === left.length ? -1 : 1
    }

    return 0
  }

  milestones.sort((a, b) => compareMilestoneIds(a.id, b.id))
  archived.sort((a, b) => compareMilestoneIds(a.id, b.id))

  return {
    root,
    config,
    milestones,
    tasks,
    decisions,
    retros,
    archived,
    issues,
    existingPlan: existingPlan ?? null,
    idOccurrences: occurrences,
  }
}

export function taskPrefix(id: string): string {
  const separator = id.indexOf("-")

  return separator < 0 ? id : id.slice(0, separator)
}

export function isImpeccable(model: PlanModel, task: TaskRecord): boolean {
  return model.config.prefixes.get(taskPrefix(task.id))?.impeccable === true
}
