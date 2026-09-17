import { execFile } from "node:child_process"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { renderDocument, splitDocument } from "./frontmatter.ts"
import { loadModel, type TaskRecord } from "./model.ts"
import { asStringList } from "./yaml.ts"
import { syncPlan } from "./plan.ts"

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function relativeFile(file: string): string {
  return file.replaceAll("\\", "/")
}

function runGit(root: string, args: string[]): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>()
  execFile("git", args, { cwd: root }, (error, stdout, stderr) => {
    if (error) {
      reject(new Error(stderr.trim() || error.message))

      return
    }

    resolve(stdout.trim())
  })

  return promise
}

function taskFrontmatter(task: {
  id: string
  title: string
  description: string
  milestone: string | null
  kind: string
  pre: string[]
}) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: "todo",
    milestone: task.milestone,
    pre: task.pre,
    kind: task.kind,
    blocked_by: null,
    created: today(),
    completed: null,
  }
}

function taskPath(root: string, task: TaskRecord): string {
  return join(root, task.file)
}

function milestonePath(root: string, file: string): string {
  return join(root, file)
}

export async function finishTask(
  root: string,
  input: { taskId: string; summary: string; commit: boolean },
): Promise<{ movedTo: string; commitSha: string | null }> {
  const model = await loadModel(root)
  const task = model.tasks.get(input.taskId)

  if (!task) {
    throw new Error(`Task ${input.taskId} does not exist`)
  }

  if (task.status !== "done") {
    throw new Error(`Task ${input.taskId} must have status done before finishing`)
  }

  if (task.folder !== "todo") {
    throw new Error(`Task ${input.taskId} must be in todo/ before finishing`)
  }

  const source = taskPath(root, task)
  const destination = join(root, task.file.replace(/\/todo\//, "/done/"))
  const text = await readFile(source, "utf8")
  const document = splitDocument(text)
  document.frontmatter.completed = today()
  const priorBody = document.body.trimEnd()
  const session = input.summary.length > 0 ? input.summary : ""
  const body = `${priorBody}${priorBody.length > 0 ? "\n\n" : ""}## Session\n${session}\n`
  await writeFile(source, renderDocument(document.frontmatter, body), "utf8")
  await mkdir(dirname(destination), { recursive: true })
  await rename(source, destination)

  const synced = await syncPlan(root)

  if (synced.model.issues.some((item) => item.severity === "error")) {
    throw new Error("Task moved, but plan synchronization found validation errors")
  }

  let commitSha: string | null = null

  if (input.commit) {
    await runGit(root, [
      "add",
      relativeFile(task.file.replace(/\/todo\//, "/done/")),
      "docs/pm/plan.yml",
    ])
    await runGit(root, ["commit", "-m", `${task.id}: ${task.title}`])
    commitSha = await runGit(root, ["rev-parse", "HEAD"])
  }

  return { movedTo: relativeFile(task.file.replace(/\/todo\//, "/done/")), commitSha }
}

export async function createTask(
  root: string,
  input: {
    id: string
    title: string
    description: string
    milestone: string | null
    kind: string
    pre: string[]
    body: string
    unplanned: boolean
  },
): Promise<{ file: string }> {
  const model = await loadModel(root)

  const prefix = input.id.slice(
    0,
    input.id.indexOf("-") < 0 ? input.id.length : input.id.indexOf("-"),
  )

  if (!model.config.prefixes.has(prefix)) {
    throw new Error(`Task ${input.id} uses an undeclared prefix`)
  }

  if (
    model.tasks.has(input.id) ||
    model.decisions.has(input.id) ||
    model.milestones.some((item) => item.id === input.id) ||
    model.retros.has(input.id)
  ) {
    throw new Error(`Identifier ${input.id} already exists`)
  }

  let directory: string
  let file: string

  if (input.unplanned || input.milestone === null) {
    directory = join(root, model.config.paths.unplanned)
    file = relativeFile(join(model.config.paths.unplanned, `${input.id}.md`))
  } else {
    const milestone = model.milestones.find((item) => item.id === input.milestone)

    if (!milestone) {
      throw new Error(`Milestone ${input.milestone} does not exist`)
    }

    directory = join(root, model.config.paths.milestones, input.milestone, "todo")
    file = relativeFile(
      join(model.config.paths.milestones, input.milestone, "todo", `${input.id}.md`),
    )
  }

  await mkdir(directory, { recursive: true })
  const absoluteFile = join(root, file)

  const frontmatter = taskFrontmatter({
    ...input,
    milestone: input.unplanned ? null : input.milestone,
  })

  await writeFile(absoluteFile, renderDocument(frontmatter, input.body), "utf8")

  if (!input.unplanned && input.milestone !== null) {
    const milestone = model.milestones.find((item) => item.id === input.milestone)

    if (!milestone) {
      throw new Error(`Milestone ${input.milestone} does not exist`)
    }

    const readme = milestonePath(root, milestone.file)
    const document = splitDocument(await readFile(readme, "utf8"))
    const tasks = [...asStringList(document.frontmatter.tasks)]

    if (!tasks.includes(input.id)) {
      tasks.push(input.id)
    }

    document.frontmatter.tasks = tasks
    await writeFile(readme, renderDocument(document.frontmatter, document.body), "utf8")
  }

  const synced = await syncPlan(root)

  if (synced.model.issues.some((item) => item.severity === "error")) {
    throw new Error("Task created, but plan synchronization found validation errors")
  }

  return { file }
}

export async function createDecision(
  root: string,
  input: {
    title: string
    status: string
    milestone: string | null
    tasks: string[]
    context: string
    decision: string
    consequences: string
    supersedes: string | null
  },
): Promise<{ file: string; id: string }> {
  const model = await loadModel(root)
  const allowed = ["proposed", "accepted", "rejected", "superseded", "deferred"]

  if (!allowed.includes(input.status)) {
    throw new Error(`Unknown decision status ${input.status}`)
  }

  const date = today()
  let maximum = 0
  const pattern = new RegExp(`^DEC-${date}-(\\d+)$`)

  for (const id of model.decisions.keys()) {
    const match = pattern.exec(id)

    if (match) {
      maximum = Math.max(maximum, Number(match[1]))
    }
  }

  const id = `DEC-${date}-${String(maximum + 1).padStart(3, "0")}`

  const file = relativeFile(
    join(model.config.paths.decisions, `${date}-${String(maximum + 1).padStart(3, "0")}.md`),
  )

  await mkdir(join(root, model.config.paths.decisions), { recursive: true })
  const body = `# ${input.title}\n\n## Context\n${input.context}\n\n## Decision\n${input.decision}\n\n## Consequences\n${input.consequences}\n`

  const frontmatter = {
    id,
    date,
    status: input.status,
    milestone: input.milestone,
    tasks: input.tasks,
    supersedes: input.supersedes,
  }

  await writeFile(join(root, file), renderDocument(frontmatter, body), "utf8")
  const synced = await syncPlan(root)

  if (synced.model.issues.some((item) => item.severity === "error")) {
    throw new Error("Decision created, but plan synchronization found validation errors")
  }

  return { file, id }
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return slug || "milestone"
}

function sectionBody(body: string): string {
  return body.trim().length > 0 ? `${body.trim()}\n` : ""
}

export async function closeMilestone(
  root: string,
  input: { milestone: string; outcome: "closed" | "continued" },
): Promise<{ archive: string | null; removed: string | null }> {
  const model = await loadModel(root)
  const milestone = model.milestones.find((item) => item.id === input.milestone)

  if (!milestone) {
    throw new Error(`Milestone ${input.milestone} does not exist`)
  }

  const retro = [...model.retros.values()].find(
    (item) =>
      item.milestone === milestone.id &&
      item.status === "completed" &&
      item.outcome === input.outcome,
  )

  if (!retro) {
    throw new Error(`Milestone ${milestone.id} requires a completed ${input.outcome} retro`)
  }

  const readme = milestonePath(root, milestone.file)
  const readmeDocument = splitDocument(await readFile(readme, "utf8"))

  const retroIds = [...asStringList(readmeDocument.frontmatter.retro)]

  if (!retroIds.includes(retro.id)) {
    retroIds.push(retro.id)
  }

  readmeDocument.frontmatter.retro = retroIds

  if (input.outcome === "continued") {
    readmeDocument.frontmatter.status = "in_progress"
    readmeDocument.frontmatter.completed = null
    await writeFile(readme, renderDocument(readmeDocument.frontmatter, readmeDocument.body), "utf8")
    const synced = await syncPlan(root)

    if (synced.model.issues.some((item) => item.severity === "error")) {
      throw new Error("Milestone resumed, but plan synchronization found validation errors")
    }

    return { archive: null, removed: null }
  }

  const listedTasks = milestone.tasks.flatMap((id) => {
    const task = model.tasks.get(id)

    return task ? [task] : []
  })

  if (listedTasks.length !== milestone.tasks.length) {
    throw new Error(`Milestone ${milestone.id} references a missing task`)
  }

  const attachedTasks = [...model.tasks.values()].filter((task) => task.milestone === milestone.id)
  const allTasks = [...listedTasks, ...attachedTasks]

  const openTask = allTasks.find(
    (task, index) =>
      allTasks.findIndex((candidate) => candidate.id === task.id) === index &&
      task.status !== "done",
  )

  if (openTask) {
    throw new Error(`Milestone ${milestone.id} cannot close while tasks remain open`)
  }

  readmeDocument.frontmatter.status = "completed"
  readmeDocument.frontmatter.completed = today()
  await writeFile(readme, renderDocument(readmeDocument.frontmatter, readmeDocument.body), "utf8")

  const archive = relativeFile(
    join(model.config.paths.archive, `${milestone.id}-${slugify(milestone.title)}.md`),
  )

  const archiveAbsolute = join(root, archive)
  await mkdir(join(root, model.config.paths.archive), { recursive: true })
  const archiveSections = [sectionBody(milestone.body)]

  for (const id of milestone.tasks) {
    const task = model.tasks.get(id)

    if (!task) {
      throw new Error(`Milestone ${milestone.id} references missing task ${id}`)
    }

    archiveSections.push(`## ${task.id} — ${task.title}\n\n${sectionBody(task.body)}`)
  }

  archiveSections.push(`## ${retro.id}\n\n${sectionBody(retro.body)}`)

  const archiveFrontmatter = {
    id: milestone.id,
    title: milestone.title,
    status: "completed",
    started: milestone.started,
    completed: today(),
    tasks: milestone.tasks,
    retro: retroIds,
  }

  await writeFile(
    archiveAbsolute,
    renderDocument(archiveFrontmatter, archiveSections.join("\n")),
    "utf8",
  )

  const directory = join(root, model.config.paths.milestones, milestone.id)
  await rm(directory, { recursive: true, force: true })
  const synced = await syncPlan(root)

  if (synced.model.issues.some((item) => item.severity === "error")) {
    throw new Error("Milestone archived, but plan synchronization found validation errors")
  }

  return { archive, removed: relativeFile(join(model.config.paths.milestones, milestone.id)) }
}
