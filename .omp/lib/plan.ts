import { access, readdir, readFile, writeFile } from "node:fs/promises"
import type { Dirent } from "node:fs"
import { join, relative, sep } from "node:path"
import { splitDocument } from "./frontmatter.ts"
import {
  type ArchivedMilestone,
  type Issue,
  type MilestoneRecord,
  type PlanModel,
  type TaskRecord,
  loadModel,
  isImpeccable,
  taskPrefix,
  readConfig,
} from "./model.ts"
import { emitYaml, asString } from "./yaml.ts"
import { lintMarkdown } from "../../tools/markdown-lint/index.ts"

function makeIssue(
  severity: Issue["severity"],
  code: string,
  message: string,
  path: string,
): Issue {
  return { severity, code, message, path }
}

function hasIssue(issues: Issue[], code: string, path: string, message: string): boolean {
  return issues.some((item) => item.code === code && item.path === path && item.message === message)
}

function addIssue(
  issues: Issue[],
  severity: Issue["severity"],
  code: string,
  message: string,
  path: string,
): void {
  if (!hasIssue(issues, code, path, message)) {
    issues.push(makeIssue(severity, code, message, path))
  }
}

function taskIsDone(model: PlanModel, id: string): boolean {
  return model.tasks.get(id)?.status === "done"
}

function milestoneTasks(model: PlanModel, milestone: MilestoneRecord): TaskRecord[] {
  return milestone.tasks.flatMap((id) => {
    const task = model.tasks.get(id)

    return task ? [task] : []
  })
}

function detectCycle(model: PlanModel): string[] | null {
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const stack: string[] = []

  const visit = (id: string): string[] | null => {
    if (visiting.has(id)) {
      const start = stack.indexOf(id)

      return stack.slice(start < 0 ? 0 : start).concat(id)
    }

    if (visited.has(id)) {
      return null
    }

    const task = model.tasks.get(id)

    if (!task) {
      return null
    }

    visiting.add(id)
    stack.push(id)

    for (const prerequisite of task.pre) {
      const cycle = visit(prerequisite)

      if (cycle) {
        return cycle
      }
    }

    stack.pop()
    visiting.delete(id)
    visited.add(id)

    return null
  }

  for (const id of model.tasks.keys()) {
    const cycle = visit(id)

    if (cycle) {
      return cycle
    }
  }

  return null
}

export function validate(model: PlanModel): Issue[] {
  const issues = [...model.issues]
  const occurrences = new Map(model.idOccurrences ?? [])

  if (occurrences.size === 0) {
    for (const milestone of model.milestones) {
      occurrences.set(milestone.id, (occurrences.get(milestone.id) ?? 0) + 1)
    }

    for (const task of model.tasks.values()) {
      occurrences.set(task.id, (occurrences.get(task.id) ?? 0) + 1)
    }

    for (const decision of model.decisions.values()) {
      occurrences.set(decision.id, (occurrences.get(decision.id) ?? 0) + 1)
    }

    for (const retro of model.retros.values()) {
      occurrences.set(retro.id, (occurrences.get(retro.id) ?? 0) + 1)
    }
  }

  for (const [id, count] of occurrences) {
    if (count > 1) {
      addIssue(
        issues,
        "error",
        "id-duplicate",
        `Identifier ${id} appears ${count} times`,
        "docs/pm",
      )
    }
  }

  for (const task of model.tasks.values()) {
    if (!model.config.prefixes.has(taskPrefix(task.id))) {
      addIssue(
        issues,
        "error",
        "prefix-unknown",
        `Task ${task.id} uses an undeclared prefix`,
        task.file,
      )
    }
  }

  for (const milestone of model.milestones) {
    const listed = new Set(milestone.tasks)

    for (const id of milestone.tasks) {
      const task = model.tasks.get(id)

      if (!task) {
        addIssue(
          issues,
          "error",
          "task-missing",
          `Milestone ${milestone.id} references missing task ${id}`,
          milestone.file,
        )
      }
    }

    for (const task of model.tasks.values()) {
      if (task.milestone === milestone.id && !listed.has(task.id)) {
        addIssue(
          issues,
          "warn",
          "task-orphan",
          `Task ${task.id} is not listed by milestone ${milestone.id}`,
          task.file,
        )
      }
    }

    const order = new Map(milestone.tasks.map((id, index) => [id, index]))

    for (const id of milestone.tasks) {
      const task = model.tasks.get(id)

      if (!task) {
        continue
      }

      for (const prerequisite of task.pre) {
        const prerequisiteIndex = order.get(prerequisite)

        if (prerequisiteIndex === undefined) {
          if (!model.tasks.has(prerequisite)) {
            addIssue(
              issues,
              "error",
              "pre-missing",
              `Task ${id} references missing prerequisite ${prerequisite}`,
              task.file,
            )
          }

          addIssue(
            issues,
            "error",
            "pre-order",
            `Prerequisite ${prerequisite} must appear before ${id}`,
            milestone.file,
          )
        } else if (prerequisiteIndex >= order.get(id)!) {
          addIssue(
            issues,
            "error",
            "pre-order",
            `Prerequisite ${prerequisite} must appear before ${id}`,
            milestone.file,
          )
        }
      }
    }
  }

  for (const task of model.tasks.values()) {
    for (const prerequisite of task.pre) {
      if (!model.tasks.has(prerequisite)) {
        addIssue(
          issues,
          "error",
          "pre-missing",
          `Task ${task.id} references missing prerequisite ${prerequisite}`,
          task.file,
        )
      }
    }

    if (task.blockedBy && !model.decisions.has(task.blockedBy)) {
      addIssue(
        issues,
        "error",
        "decision-missing",
        `Task ${task.id} references a missing blocking decision`,
        task.file,
      )
    }

    if (task.status === "blocked") {
      const decision = task.blockedBy ? model.decisions.get(task.blockedBy) : undefined

      if (!decision || (decision.status !== "accepted" && decision.status !== "deferred")) {
        addIssue(
          issues,
          "error",
          "blocked-no-decision",
          `Blocked task ${task.id} requires an accepted or deferred decision`,
          task.file,
        )
      }

      if (!task.blockedBy || !model.decisions.has(task.blockedBy)) {
        addIssue(
          issues,
          "error",
          "decision-missing",
          `Task ${task.id} references a missing blocking decision`,
          task.file,
        )
      }
    }

    const inDone = task.folder === "done"

    if ((task.status === "done") !== inDone) {
      addIssue(
        issues,
        "error",
        "done-location",
        `Task ${task.id} status and folder disagree`,
        task.file,
      )
    }

    if (task.status === "done" && !task.completed) {
      addIssue(
        issues,
        "error",
        "done-date",
        `Done task ${task.id} requires completed date`,
        task.file,
      )
    }
  }

  for (const decision of model.decisions.values()) {
    for (const taskId of decision.tasks) {
      if (!model.tasks.has(taskId)) {
        addIssue(
          issues,
          "error",
          "decision-missing",
          `Decision ${decision.id} references missing task ${taskId}`,
          decision.file,
        )
      }
    }

    if (decision.supersedes && !model.decisions.has(decision.supersedes)) {
      addIssue(
        issues,
        "error",
        "decision-missing",
        `Decision ${decision.id} supersedes missing decision ${decision.supersedes}`,
        decision.file,
      )
    }
  }

  const cycle = detectCycle(model)

  if (cycle) {
    const task = model.tasks.get(cycle[0])
    addIssue(
      issues,
      "error",
      "pre-cycle",
      `Prerequisite cycle: ${cycle.join(" -> ")}`,
      task?.file ?? "docs/pm",
    )
  }

  for (const milestone of model.milestones) {
    const tasks = [
      ...milestoneTasks(model, milestone),
      ...[...model.tasks.values()].filter((task) => task.milestone === milestone.id),
    ]

    const openTasks = tasks.filter((task, index) => {
      const firstIndex = tasks.findIndex((candidate) => candidate.id === task.id)

      return firstIndex === index && task.status !== "done"
    })

    if (milestone.status === "completed") {
      const hasClosedRetro = [...model.retros.values()].some(
        (retro) =>
          retro.milestone === milestone.id &&
          retro.status === "completed" &&
          retro.outcome === "closed",
      )

      if (!hasClosedRetro || openTasks.length > 0) {
        addIssue(
          issues,
          "error",
          "milestone-close-blocked",
          `Completed milestone ${milestone.id} requires a closed retro and no open tasks`,
          milestone.file,
        )
      }
    }

    if (milestone.status === "in_progress" && openTasks.length === 0) {
      addIssue(
        issues,
        "warn",
        "milestone-retro",
        `Milestone ${milestone.id} is ready for a retrospective`,
        milestone.file,
      )
    }
  }

  const orderedMilestones = [...model.milestones].sort(
    (a, b) => milestoneStatusOrder[a.status] - milestoneStatusOrder[b.status],
  )

  let nextResolved = false

  for (const milestone of orderedMilestones) {
    if (milestone.status !== "in_progress" && milestone.status !== "backlog") {
      continue
    }

    for (const id of milestone.tasks) {
      const task = model.tasks.get(id)

      if (!task) {
        continue
      }

      if (task.status === "blocked") {
        addIssue(issues, "warn", "next-blocked", `Next task ${task.id} is blocked`, task.file)
        nextResolved = true
        break
      }

      if (
        task.status === "todo" &&
        task.pre.every((prerequisite) => taskIsDone(model, prerequisite))
      ) {
        nextResolved = true
        break
      }
    }

    if (nextResolved) {
      break
    }
  }

  return issues
}

const milestoneStatusOrder = {
  in_progress: 0,
  backlog: 1,
  retro: 2,
  completed: 3,
} satisfies Record<MilestoneRecord["status"], number>

export function nextTask(model: PlanModel): TaskRecord | null {
  const milestones = [...model.milestones].sort(
    (a, b) => milestoneStatusOrder[a.status] - milestoneStatusOrder[b.status],
  )

  for (const milestone of milestones) {
    if (milestone.status !== "in_progress" && milestone.status !== "backlog") {
      continue
    }

    for (const id of milestone.tasks) {
      const task = model.tasks.get(id)

      if (!task) {
        continue
      }

      if (task.status === "blocked") {
        return task
      }

      if (task.status !== "todo") {
        continue
      }

      if (task.pre.every((prerequisite) => taskIsDone(model, prerequisite))) {
        return task
      }
    }
  }

  return null
}

function planMilestone(model: PlanModel, milestone: MilestoneRecord) {
  const tasks = milestone.tasks.flatMap((id) => {
    const task = model.tasks.get(id)

    if (!task) {
      return []
    }

    return [
      {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        pre: task.pre,
        file: task.file,
        impeccable: isImpeccable(model, task),
      },
    ]
  })

  return {
    id: milestone.id,
    title: milestone.title,
    status: milestone.status,
    file: milestone.file,
    tasks,
    retro: milestone.retro,
  }
}

function planArchive(archive: ArchivedMilestone) {
  return {
    id: archive.id,
    title: archive.title,
    status: archive.status,
    file: archive.file,
  }
}

export function renderPlan(model: PlanModel): string {
  const value = {
    project: {
      name: model.config.name,
      prd: model.config.docs.prd,
      product: model.config.docs.product,
      design: model.config.docs.design,
      architecture: model.config.docs.architecture,
    },
    milestones: model.milestones.map((milestone) => planMilestone(model, milestone)),
    archived: model.archived.map(planArchive),
  }

  return `# GENERATED by pm_plan_sync — do not edit\n${emitYaml(value)}\n`
}

export function planPath(root: string): string {
  return join(root, "docs/pm/plan.yml")
}

export async function syncPlan(
  root: string,
  write = true,
): Promise<{ model: PlanModel; written: boolean; plan: string }> {
  const model = await loadModel(root)
  const plan = renderPlan(model)
  const issues = validate(model)

  if (
    model.existingPlan !== null &&
    model.existingPlan !== undefined &&
    model.existingPlan !== plan
  ) {
    addIssue(
      issues,
      "warn",
      "plan-stale",
      "Committed plan.yml differs from the freshly rendered model",
      planPath(root),
    )
  }

  model.issues = issues

  const hasErrors = issues.some((item) => item.severity === "error")

  if (!write || hasErrors) {
    return { model, written: false, plan }
  }

  // `written` reports a real change, so an unchanged plan never rewrites the file.
  if (model.existingPlan === plan) {
    return { model, written: false, plan }
  }

  await writeFile(planPath(root), plan, "utf8")

  return { model, written: true, plan }
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)

    return true
  } catch {
    return false
  }
}

function relativePath(root: string, path: string): string {
  return relative(root, path).split(sep).join("/")
}

async function surfaceBriefExists(root: string): Promise<boolean> {
  const visit = async (directory: string): Promise<boolean> => {
    let entries: Dirent[]

    try {
      entries = await readdir(directory, { withFileTypes: true })
    } catch {
      return false
    }

    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") {
        continue
      }

      const path = join(directory, entry.name)

      if (
        entry.isDirectory() &&
        entry.name === "surfaces" &&
        directory.endsWith(`${sep}.impeccable`)
      ) {
        const files = await readdir(path, { withFileTypes: true })

        if (files.some((file) => file.isFile() && file.name.endsWith(".md"))) {
          return true
        }
      }

      if (entry.isDirectory() && (await visit(path))) {
        return true
      }
    }

    return false
  }

  return visit(root)
}

async function docsPmIssues(root: string): Promise<Issue[]> {
  const issues: Issue[] = []
  const files = await markdownFiles(root, "docs/pm")

  for (const file of files) {
    try {
      const text = await readFile(file, "utf8")
      const document = splitDocument(text)

      if (!asString(document.frontmatter.id)) {
        issues.push(
          makeIssue(
            "error",
            "frontmatter-id",
            "PM document frontmatter requires id",
            relativePath(root, file),
          ),
        )
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "PM document is missing valid frontmatter"

      issues.push(makeIssue("error", "frontmatter-missing", message, relativePath(root, file)))
    }
  }

  return issues
}

async function markdownFiles(root: string, child: string): Promise<string[]> {
  const directory = join(root, child)

  const visit = async (current: string): Promise<string[]> => {
    let entries: Dirent[]

    try {
      entries = await readdir(current, { withFileTypes: true })
    } catch {
      return []
    }

    const files: string[] = []

    for (const entry of entries) {
      const path = join(current, entry.name)

      if (entry.isDirectory()) {
        files.push(...(await visit(path)))
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(path)
      }
    }

    return files
  }

  return visit(directory)
}

export async function docCheck(root: string): Promise<Issue[]> {
  let config

  try {
    config = await readConfig(root)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "config.yml is missing or malformed"

    return [makeIssue("error", "config-invalid", message, "docs/pm/config.yml")]
  }

  const issues: Issue[] = []

  const configuredDocs: Array<[string, string, boolean]> = [
    ["prd", config.docs.prd, true],
    ["product", config.docs.product, false],
    ["design", config.docs.design, false],
    ["architecture", config.docs.architecture, true],
  ]

  if (config.docs.constraints) {
    configuredDocs.push(["constraints", config.docs.constraints, false])
  }

  const existing = new Map<string, string>()

  for (const [name, configuredPath, required] of configuredDocs) {
    const path = join(root, configuredPath)

    if (!(await exists(path))) {
      issues.push(
        makeIssue(
          required ? "error" : "warn",
          "doc-missing",
          `${name} document is missing`,
          configuredPath,
        ),
      )
      continue
    }

    const text = await readFile(path, "utf8")
    existing.set(name, text)

    if (text.trim().length === 0) {
      issues.push(makeIssue("error", "doc-empty", `${name} document is empty`, configuredPath))
    }
  }

  const prd = existing.get("prd")

  if (
    prd !== undefined &&
    (!/^#\s+.+/m.test(prd) ||
      !/^#{1,6}\s+Product Overview\s*$/m.test(prd) ||
      !/^#{1,6}\s+Feature Requirements\s*$/m.test(prd) ||
      !/^#{1,6}\s+Technical Specifications\s*$/m.test(prd))
  ) {
    issues.push(
      makeIssue("error", "prd-structure", "PRD.md is missing required headings", config.docs.prd),
    )
  }

  const architecture = existing.get("architecture")

  if (
    architecture !== undefined &&
    (!/^#\s+.+/m.test(architecture) || !/^#{1,6}\s+.*(?:boundary|module).*$/im.test(architecture))
  ) {
    issues.push(
      makeIssue(
        "error",
        "architecture-structure",
        "ARCHITECTURE.md is missing a heading or boundary/module section",
        config.docs.architecture,
      ),
    )
  }

  const product = existing.get("product")

  if (product !== undefined && !product.includes("impeccable:product-schema")) {
    issues.push(
      makeIssue(
        "error",
        "product-schema",
        "PRODUCT.md is missing the impeccable product schema marker",
        config.docs.product,
      ),
    )
  }

  const design = existing.get("design")

  if (design !== undefined) {
    try {
      splitDocument(design)
    } catch {
      issues.push(
        makeIssue(
          "error",
          "design-frontmatter",
          "DESIGN.md is missing YAML frontmatter",
          config.docs.design,
        ),
      )
    }

    if (!(await exists(join(root, ".impeccable/design.json")))) {
      issues.push(
        makeIssue(
          "error",
          "design-json",
          "DESIGN.md requires .impeccable/design.json",
          ".impeccable/design.json",
        ),
      )
    }
  }

  for (const [name, text] of existing) {
    const configuredPath = configuredDocs.find(([configuredName]) => configuredName === name)?.[1]

    if (!configuredPath) {
      continue
    }

    const headings = [
      ...text.matchAll(
        /^#{2,6}\s+(?=.*(?:record|session))(?=.*\b[A-Z][A-Z0-9]{1,5}-\d+[a-z]?\b).*$/gim,
      ),
      ...text.matchAll(/^#{1,6}\s+Session\s*$/gim),
    ]
      .map((match) => ({
        line: (text.slice(0, match.index ?? 0).match(/\n/g)?.length ?? 0) + 1,
        heading: match[0].replace(/^#+/, "").trim(),
      }))
      .sort((left, right) => left.line - right.line)

    if (headings.length > 0) {
      const first = headings[0]

      issues.push(
        makeIssue(
          "warn",
          "doc-append-record",
          `${name} document carries ${headings.length} per-task or per-stage record ` +
            `section(s); first at line ${first.line}: ${first.heading}`,
          configuredPath,
        ),
      )
    }
  }

  if (!(await surfaceBriefExists(root))) {
    issues.push(
      makeIssue(
        "error",
        "surface-brief",
        "No impeccable surface brief was found",
        "**/.impeccable/surfaces/*.md",
      ),
    )
  }

  const milestoneRoot = join(root, config.paths.milestones)
  const milestoneEntries = await readdir(milestoneRoot, { withFileTypes: true }).catch(() => [])

  const hasMilestoneTree = milestoneEntries.some(
    (entry) => entry.isDirectory() && !["ideas", "unplanned", "decisions"].includes(entry.name),
  )

  if (hasMilestoneTree) {
    if (!(await exists(join(root, config.paths.ideas)))) {
      issues.push(makeIssue("warn", "ideas-dir", "Ideas directory is missing", config.paths.ideas))
    }

    if (!(await exists(join(root, config.paths.decisions)))) {
      issues.push(
        makeIssue(
          "warn",
          "decisions-dir",
          "Decisions directory is missing",
          config.paths.decisions,
        ),
      )
    }
  }

  issues.push(...(await docsPmIssues(root)))
  const model = await loadModel(root)
  const currentPlan = model.existingPlan

  if (currentPlan !== null && currentPlan !== undefined) {
    const fresh = renderPlan(model)

    if (currentPlan !== fresh) {
      issues.push(
        makeIssue(
          "warn",
          "plan-stale",
          "Committed plan.yml differs from the freshly rendered model",
          planPath(root),
        ),
      )
    }
  }

  const markdown = await lintMarkdown({ root })

  issues.push(
    ...markdown.issues.map((issue) =>
      makeIssue(
        issue.severity,
        issue.code,
        `${issue.message} (line ${issue.line}, column ${issue.column})`,
        issue.file,
      ),
    ),
  )

  return issues
}
