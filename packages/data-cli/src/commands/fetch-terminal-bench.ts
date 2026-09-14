import {
  BenchmarksFile,
  ModelsFile,
  type Benchmark,
  type BenchmarkRow,
  type Model,
} from "@rack-rate/core"
import { z } from "zod"

import { fetchText, FetchError } from "../http.ts"
import {
  dataPath,
  info,
  parseJsonAs,
  readJsonAs,
  today,
  upsertBenchmarkEntry,
  warn,
} from "../paths.ts"

const BOARD_URL = "https://www.tbench.ai/"

const TASKS_URL =
  "https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=tasks"

const HARBOR_PATH = "/Users/marshal/.local/bin/harbor"

const BOARD_SLUG = "4-0-0"

const DATASET_PACKAGE = "terminal-bench/terminal-bench"

const BENCHMARK_ID = "terminal-bench"

const BENCHMARK_VERSION = "4.0.0"

const SELECTION_RULE =
  "latest metadata.date, then highest metrics.accuracy (effort/agent tuple preserved)"

const JsonValueSchema = z.json()

type JsonValue = z.infer<typeof JsonValueSchema>

const JsonObjectSchema = z.record(z.string(), JsonValueSchema)

const JsonArraySchema = z.array(JsonValueSchema)

const DisplaySchema = z.object({
  label: z.string().min(1),
  url: z.url(),
})

const MetricsSchema = z.object({
  accuracy: z.number().finite().min(0).max(100),
  accuracy_ci95_half_width: z.number().finite().nonnegative(),
  successes: z.number().int().nonnegative(),
  n_trials: z.number().int().positive(),
  total_cost_usd: z.number().finite().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
  uncached_input_tokens: z.number().finite().nonnegative().nullable().optional(),
  cached_input_tokens: z.number().finite().nonnegative().nullable().optional(),
  output_tokens: z.number().finite().nonnegative().nullable().optional(),
})

const MetadataSchema = z.object({
  date: z.iso.date(),
  agent_display: DisplaySchema,
  model_display: DisplaySchema,
  reasoning_effort: z.string().min(1),
})

const LeaderboardRowSchema = z.object({
  id: z.string().min(1),
  rank: z.number().int().positive(),
  metadata: MetadataSchema,
  metrics: MetricsSchema,
  status: z.string().min(1),
})

const LeaderboardSchema = z.object({
  id: z.string().min(1),
  package: z.string().min(1),
  dataset_version_ids: z.array(z.uuid()),
  name: z.string().min(1),
  title: z.string().min(1),
  updated_at: z.iso.datetime({ offset: true }),
  task_count: z.number().int().positive().optional(),
})

const TerminalBenchPayloadSchema = z.object({
  leaderboard: LeaderboardSchema,
  rows: z.array(LeaderboardRowSchema),
  task_count: z.number().int().positive().optional(),
})

type TerminalBenchPayload = z.infer<typeof TerminalBenchPayloadSchema>

type LeaderboardRow = z.infer<typeof LeaderboardRowSchema>

type TaskCount = {
  count: number
  url: string
}

type Selection = {
  rows: BenchmarkRow[]
  skippedLabels: string[]
  displayCount: number
}

const FlightChunkSchema = z.tuple([z.number(), z.string().optional()])

const QueryKeySchema = z.tuple([
  z.literal("leaderboard"),
  z.literal(DATASET_PACKAGE),
  z.literal(BOARD_SLUG),
])

const QueryStateSchema = z.object({
  data: JsonValueSchema,
})

function jsonValueEnd(text: string, start: number): number {
  if (text[start] !== "[") {
    throw new Error("Next.js flight call does not start with an array")
  }

  let depth = 0
  let quoted = false
  let escaped = false

  for (let index = start; index < text.length; index += 1) {
    const character = text[index]

    if (quoted) {
      if (escaped) {
        escaped = false
      } else if (character === "\\") {
        escaped = true
      } else if (character === '"') {
        quoted = false
      }

      continue
    }

    if (character === '"') {
      quoted = true
    } else if (character === "[" || character === "{") {
      depth += 1
    } else if (character === "]" || character === "}") {
      depth -= 1

      if (depth === 0) {
        return index + 1
      }
    }
  }

  throw new Error("unterminated Next.js flight call")
}

function parseJsonValue(text: string, label: string): JsonValue {
  try {
    return JsonValueSchema.parse(JSON.parse(text))
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)

    throw new Error(`could not parse ${label}: ${reason}`)
  }
}

function parseFlightChunks(html: string): string {
  const marker = "self.__next_f.push("
  const chunks: string[] = []
  let cursor = 0

  while (true) {
    const markerStart = html.indexOf(marker, cursor)

    if (markerStart === -1) {
      break
    }

    const arrayStart = markerStart + marker.length
    const arrayEnd = jsonValueEnd(html, arrayStart)
    const chunkText = html.slice(arrayStart, arrayEnd)
    const chunk = FlightChunkSchema.safeParse(parseJsonValue(chunkText, "flight chunk"))

    if (chunk.success && chunk.data[1] !== undefined) {
      chunks.push(chunk.data[1])
    }

    cursor = arrayEnd
  }

  if (chunks.length === 0) {
    throw new Error("no Next.js flight chunks found")
  }

  return chunks.join("")
}

function findPayload(value: JsonValue): TerminalBenchPayload | null {
  const object = JsonObjectSchema.safeParse(value)

  if (object.success) {
    const queryKey = QueryKeySchema.safeParse(object.data.queryKey)
    const state = QueryStateSchema.safeParse(object.data.state)

    if (queryKey.success && state.success) {
      const payload = TerminalBenchPayloadSchema.safeParse(state.data.data)

      if (payload.success) {
        return payload.data
      }
    }

    for (const child of Object.values(object.data)) {
      const payload = findPayload(child)

      if (payload !== null) {
        return payload
      }
    }

    return null
  }

  const array = JsonArraySchema.safeParse(value)

  if (!array.success) {
    return null
  }

  for (const child of array.data) {
    const payload = findPayload(child)

    if (payload !== null) {
      return payload
    }
  }

  return null
}

function extractFlightPayload(html: string): TerminalBenchPayload {
  const reassembled = parseFlightChunks(html)
  const records = reassembled.split("\n")

  for (const record of records) {
    const separator = record.indexOf(":")

    if (separator < 1) {
      continue
    }

    const payloadText = record.slice(separator + 1)
    let payload: JsonValue

    try {
      payload = parseJsonValue(payloadText, "flight record")
    } catch {
      continue
    }

    const board = findPayload(payload)

    if (board !== null) {
      return board
    }
  }

  throw new Error(
    `flight data queryKey ["leaderboard","${DATASET_PACKAGE}","${BOARD_SLUG}"] not found`,
  )
}

async function runHarbor(): Promise<TerminalBenchPayload> {
  const process = Bun.spawn(
    [HARBOR_PATH, "hub", "leaderboard", "show", `${DATASET_PACKAGE}/${BOARD_SLUG}`, "--json"],
    { stdout: "pipe", stderr: "pipe" },
  )

  const [stdout, stderr] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ])

  const exitCode = await process.exited

  if (exitCode !== 0) {
    const reason = stderr.trim() || `exit code ${exitCode}`

    throw new Error(`harbor leaderboard read failed: ${reason}`)
  }

  return parseJsonAs(stdout, TerminalBenchPayloadSchema, "Harbor leaderboard JSON")
}

function parseTaskCount(text: string): number {
  const match = /Displaying\s+(\d+)\s+of\s+(\d+)\s+tasks/i.exec(text)

  if (match === null) {
    throw new Error(`task count marker not found on ${TASKS_URL}`)
  }

  const displayed = Number(match[1])
  const total = Number(match[2])

  if (
    !Number.isInteger(displayed) ||
    !Number.isInteger(total) ||
    displayed !== total ||
    total <= 0
  ) {
    throw new Error(`invalid task count marker on ${TASKS_URL}`)
  }

  return total
}

async function fetchTaskCount(payload: TerminalBenchPayload): Promise<TaskCount> {
  try {
    const snapshot = await fetchText({
      source: "terminal-bench-tasks",
      url: TASKS_URL,
      accept: "text/html",
    })

    return { count: parseTaskCount(snapshot.text), url: TASKS_URL }
  } catch (error) {
    const payloadCount = payload.task_count ?? payload.leaderboard.task_count

    if (payloadCount !== undefined) {
      warn(`task page unavailable; using task_count carried by the board payload`)

      return { count: payloadCount, url: BOARD_URL }
    }

    const reason = error instanceof Error ? error.message : String(error)

    throw new Error(`could not confirm Terminal-Bench task_count: ${reason}`)
  }
}

function slug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function urlSlug(url: string): string {
  const path = new URL(url).pathname.split("/")
  let lastSegment = ""

  for (const segment of path) {
    if (segment.length > 0) {
      lastSegment = segment
    }
  }

  return slug(lastSegment)
}

function modelLookup(models: readonly Model[]): Map<string, string> {
  const lookup = new Map<string, string>()

  for (const model of models) {
    lookup.set(slug(model.id), model.id)
  }

  return lookup
}

function resolveModel(row: LeaderboardRow, lookup: ReadonlyMap<string, string>): string | null {
  const labelMatch = lookup.get(slug(row.metadata.model_display.label))

  if (labelMatch !== undefined) {
    return labelMatch
  }

  return lookup.get(urlSlug(row.metadata.model_display.url)) ?? null
}

function numericInput(value: number | null | undefined): number | undefined {
  return value === null || value === undefined ? undefined : value
}

function validateRow(row: LeaderboardRow): void {
  const { accuracy, n_trials: nTrials, successes } = row.metrics

  if (successes > nTrials) {
    throw new Error(`row ${row.id} has successes greater than n_trials`)
  }

  const expectedAccuracy = (100 * successes) / nTrials

  if (Math.abs(accuracy - expectedAccuracy) >= 0.01) {
    throw new Error(`row ${row.id} accuracy does not match successes / n_trials`)
  }

  const ciLo = accuracy - row.metrics.accuracy_ci95_half_width
  const ciHi = accuracy + row.metrics.accuracy_ci95_half_width

  if (ciLo < 0 || ciHi > 100) {
    throw new Error(`row ${row.id} confidence interval is outside 0-100`)
  }
}

function toBenchmarkRow(
  row: LeaderboardRow,
  modelId: string,
  payload: TerminalBenchPayload,
  taskCount: TaskCount,
): BenchmarkRow {
  validateRow(row)

  const { accuracy, accuracy_ci95_half_width: halfWidth } = row.metrics

  const tokensInput = [
    numericInput(row.metrics.uncached_input_tokens),
    numericInput(row.metrics.cached_input_tokens),
  ]

  const inputParts = tokensInput.filter((value): value is number => value !== undefined)

  const provenance = {
    total_cost_usd: String(row.metrics.total_cost_usd),
    total_tokens: String(row.metrics.total_tokens),
    n_trials: String(row.metrics.n_trials),
    successes: String(row.metrics.successes),
    rank: String(row.rank),
    agent: row.metadata.agent_display.label,
    effort: row.metadata.reasoning_effort,
    date: row.metadata.date,
    row_id: row.id,
    model_url: row.metadata.model_display.url,
    selection_rule: SELECTION_RULE,
    board: payload.leaderboard.name,
    board_id: payload.leaderboard.id,
    dataset_version_id: payload.leaderboard.dataset_version_ids.join(","),
    board_updated_at: payload.leaderboard.updated_at,
    task_count_url: taskCount.url,
  }

  const result: BenchmarkRow = {
    model_id: modelId,
    score: accuracy,
    ci_lo: accuracy - halfWidth,
    ci_hi: accuracy + halfWidth,
    tokens_input: undefined,
    tokens_output: undefined,
    provenance,
  }

  if (inputParts.length === 2) {
    const uncachedInput = inputParts[0]
    const cachedInput = inputParts[1]

    if (uncachedInput !== undefined && cachedInput !== undefined) {
      result.tokens_input = uncachedInput + cachedInput
    }
  }

  const outputTokens = numericInput(row.metrics.output_tokens)

  if (outputTokens !== undefined) {
    result.tokens_output = outputTokens
  }

  return result
}

function selectRows(
  rows: readonly LeaderboardRow[],
  models: readonly Model[],
  payload: TerminalBenchPayload,
  taskCount: TaskCount,
): Selection {
  const lookup = modelLookup(models)
  const selected = new Map<string, LeaderboardRow>()
  const skippedLabels = new Set<string>()
  let displayCount = 0

  for (const row of rows) {
    if (row.status !== "display") {
      continue
    }

    displayCount += 1
    const modelId = resolveModel(row, lookup)

    if (modelId === null) {
      skippedLabels.add(row.metadata.model_display.label)
      continue
    }

    const current = selected.get(modelId)

    if (
      current === undefined ||
      row.metadata.date > current.metadata.date ||
      (row.metadata.date === current.metadata.date &&
        row.metrics.accuracy > current.metrics.accuracy)
    ) {
      selected.set(modelId, row)
    }
  }

  const result: BenchmarkRow[] = []

  for (const [modelId, row] of selected) {
    result.push(toBenchmarkRow(row, modelId, payload, taskCount))
  }

  return { rows: result, skippedLabels: [...skippedLabels], displayCount }
}

type ComparableRow = {
  model_id: string
  score: string
  ci_lo: string | undefined
  ci_hi: string | undefined
  cost_per_task_usd: string | undefined
  cost_basis: string | undefined
  tokens_input: string | undefined
  tokens_output: string | undefined
  steps: string | undefined
  "provenance.total_cost_usd": string | undefined
  "provenance.total_tokens": string | undefined
  "provenance.n_trials": string | undefined
  "provenance.successes": string | undefined
  "provenance.rank": string | undefined
  "provenance.agent": string | undefined
  "provenance.effort": string | undefined
  "provenance.date": string | undefined
  "provenance.row_id": string | undefined
  "provenance.model_url": string | undefined
  "provenance.selection_rule": string | undefined
  "provenance.board": string | undefined
  "provenance.board_id": string | undefined
  "provenance.dataset_version_id": string | undefined
  "provenance.board_updated_at": string | undefined
  "provenance.task_count_url": string | undefined
}

const ROW_DIFF_FIELDS = [
  "model_id",
  "score",
  "ci_lo",
  "ci_hi",
  "cost_per_task_usd",
  "cost_basis",
  "tokens_input",
  "tokens_output",
  "steps",
  "provenance.total_cost_usd",
  "provenance.total_tokens",
  "provenance.n_trials",
  "provenance.successes",
  "provenance.rank",
  "provenance.agent",
  "provenance.effort",
  "provenance.date",
  "provenance.row_id",
  "provenance.model_url",
  "provenance.selection_rule",
  "provenance.board",
  "provenance.board_id",
  "provenance.dataset_version_id",
  "provenance.board_updated_at",
  "provenance.task_count_url",
] as const satisfies readonly (keyof ComparableRow)[]

type RowDiffField = (typeof ROW_DIFF_FIELDS)[number]

type ComparableHeader = {
  version: string
  title: string
  url: string
  generated_at: string
  task_count: string
  unit: string
  scale: string
  retrieved_at: string
}

const HEADER_DIFF_FIELDS = [
  "version",
  "title",
  "url",
  "generated_at",
  "task_count",
  "unit",
  "scale",
  "retrieved_at",
] as const satisfies readonly (keyof ComparableHeader)[]

type HeaderDiffField = (typeof HEADER_DIFF_FIELDS)[number]

function comparableRow(row: BenchmarkRow): ComparableRow {
  return {
    model_id: row.model_id,
    score: String(row.score),
    ci_lo: row.ci_lo === undefined ? undefined : String(row.ci_lo),
    ci_hi: row.ci_hi === undefined ? undefined : String(row.ci_hi),
    cost_per_task_usd:
      row.cost_per_task_usd === undefined ? undefined : String(row.cost_per_task_usd),
    cost_basis: row.cost_basis,
    tokens_input: row.tokens_input === undefined ? undefined : String(row.tokens_input),
    tokens_output: row.tokens_output === undefined ? undefined : String(row.tokens_output),
    steps: row.steps === undefined ? undefined : String(row.steps),
    "provenance.total_cost_usd": row.provenance.total_cost_usd,
    "provenance.total_tokens": row.provenance.total_tokens,
    "provenance.n_trials": row.provenance.n_trials,
    "provenance.successes": row.provenance.successes,
    "provenance.rank": row.provenance.rank,
    "provenance.agent": row.provenance.agent,
    "provenance.effort": row.provenance.effort,
    "provenance.date": row.provenance.date,
    "provenance.row_id": row.provenance.row_id,
    "provenance.model_url": row.provenance.model_url,
    "provenance.selection_rule": row.provenance.selection_rule,
    "provenance.board": row.provenance.board,
    "provenance.board_id": row.provenance.board_id,
    "provenance.dataset_version_id": row.provenance.dataset_version_id,
    "provenance.board_updated_at": row.provenance.board_updated_at,
    "provenance.task_count_url": row.provenance.task_count_url,
  }
}

function rowDifferences(before: BenchmarkRow, after: BenchmarkRow): RowDiffField[] {
  const beforeValues = comparableRow(before)
  const afterValues = comparableRow(after)
  const changed: RowDiffField[] = []

  for (const field of ROW_DIFF_FIELDS) {
    if (beforeValues[field] !== afterValues[field]) {
      changed.push(field)
    }
  }

  return changed
}

function comparableHeader(entry: Benchmark): ComparableHeader {
  return {
    version: entry.version,
    title: entry.title,
    url: entry.url,
    generated_at: entry.generated_at,
    task_count: String(entry.task_count),
    unit: entry.unit,
    scale: entry.scale,
    retrieved_at: entry.retrieved_at,
  }
}

function headerDifferences(before: Benchmark, after: Benchmark): HeaderDiffField[] {
  const beforeValues = comparableHeader(before)
  const afterValues = comparableHeader(after)
  const changed: HeaderDiffField[] = []

  for (const field of HEADER_DIFF_FIELDS) {
    if (beforeValues[field] !== afterValues[field]) {
      changed.push(field)
    }
  }

  return changed
}

function rowsByModel(rows: readonly BenchmarkRow[]): Map<string, BenchmarkRow> {
  const result = new Map<string, BenchmarkRow>()

  for (const row of rows) {
    result.set(row.model_id, row)
  }

  return result
}

function sortedModelIds(
  before: ReadonlyMap<string, BenchmarkRow>,
  after: ReadonlyMap<string, BenchmarkRow>,
): string[] {
  const ids = new Set<string>()

  for (const modelId of before.keys()) {
    ids.add(modelId)
  }

  for (const modelId of after.keys()) {
    ids.add(modelId)
  }

  return [...ids].sort((left, right) => left.localeCompare(right))
}

function selectionRules(entry: Benchmark): Set<string> {
  const rules = new Set<string>()

  for (const row of entry.rows) {
    const rule = row.provenance.selection_rule

    if (rule !== undefined) {
      rules.add(rule)
    }
  }

  return rules
}

function setsDiffer(before: ReadonlySet<string>, after: ReadonlySet<string>): boolean {
  if (before.size !== after.size) {
    return true
  }

  for (const value of before) {
    if (!after.has(value)) {
      return true
    }
  }

  return false
}

function printDiff(committed: Benchmark | undefined, produced: Benchmark): number {
  if (committed === undefined) {
    info("diff: committed terminal-bench entry is missing")
    info(`diff: rows added ${produced.rows.map((row) => row.model_id).join(", ") || "none"}`)
    info("diff: rows removed none")
    info("diff: rows changed none")
    info("diff: selection rule changed yes (no committed rule)")

    return 1
  }

  const beforeRows = rowsByModel(committed.rows)
  const afterRows = rowsByModel(produced.rows)
  const added: string[] = []
  const removed: string[] = []
  const changed: string[] = []

  for (const modelId of sortedModelIds(beforeRows, afterRows)) {
    const before = beforeRows.get(modelId)
    const after = afterRows.get(modelId)

    if (before === undefined && after !== undefined) {
      added.push(modelId)
      continue
    }

    if (before !== undefined && after === undefined) {
      removed.push(modelId)
      continue
    }

    if (before !== undefined && after !== undefined) {
      const fields = rowDifferences(before, after)

      if (fields.length > 0) {
        changed.push(`${modelId} (${fields.join(", ")})`)
      }
    }
  }

  const headerChanges = headerDifferences(committed, produced)
  const rulesChanged = setsDiffer(selectionRules(committed), selectionRules(produced))

  const differs =
    added.length > 0 || removed.length > 0 || changed.length > 0 || headerChanges.length > 0

  info(`diff: rows added ${added.join(", ") || "none"}`)
  info(`diff: rows removed ${removed.join(", ") || "none"}`)
  info(`diff: rows changed ${changed.join(", ") || "none"}`)
  info(`diff: header fields changed ${headerChanges.join(", ") || "none"}`)
  info(`diff: selection rule changed ${rulesChanged ? "yes" : "no"}`)

  return differs || rulesChanged ? 1 : 0
}

function printHelp(): void {
  console.log("Usage: bun run packages/data-cli/src/commands/fetch-terminal-bench.ts")
  console.log("Fetches the pinned Terminal-Bench 4.0 public leaderboard into benchmarks.json")
}

export async function run(args: string[]): Promise<number> {
  const diff = args.includes("--diff")

  if (args.includes("--help")) {
    printHelp()

    return 0
  }

  if (args.length > 1 || (args.length === 1 && !diff)) {
    console.error(`rack-rate-data: unknown argument '${args[0]}'`)

    return 1
  }

  try {
    let payload: TerminalBenchPayload
    let extractionPath: string

    try {
      const snapshot = await fetchText({
        source: BENCHMARK_ID,
        url: BOARD_URL,
        accept: "text/html",
      })

      payload = extractFlightPayload(snapshot.text)
      extractionPath = "flight data"
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)

      warn(`flight data extraction failed: ${reason}; trying Harbor CLI`)
      payload = await runHarbor()
      extractionPath = "harbor CLI"
    }

    if (payload.leaderboard.name !== BOARD_SLUG) {
      throw new Error(
        `received board '${payload.leaderboard.name}', expected pinned board '${BOARD_SLUG}'`,
      )
    }

    if (payload.leaderboard.package !== DATASET_PACKAGE) {
      throw new Error(
        `received dataset '${payload.leaderboard.package}', expected '${DATASET_PACKAGE}'`,
      )
    }

    if (payload.leaderboard.dataset_version_ids.length === 0) {
      throw new Error("board has no dataset_version_ids; refusing to publish unpinned rows")
    }

    const taskCount = await fetchTaskCount(payload)
    const models = await readJsonAs(dataPath("models.json"), ModelsFile)
    const selection = selectRows(payload.rows, models.models, payload, taskCount)

    info(`Terminal-Bench rows extracted via ${extractionPath}`)
    info(
      `parsed ${selection.displayCount} display rows; selected ${selection.rows.length} model rows`,
    )

    if (selection.skippedLabels.length > 0) {
      info(
        `skipped ${selection.skippedLabels.length} unresolved model labels: ${selection.skippedLabels.join(", ")}`,
      )
    } else {
      info("skipped 0 unresolved model labels")
    }

    if (selection.rows.length === 0) {
      throw new Error("no display rows resolved to committed models; refusing to write")
    }

    const entry: Benchmark = {
      id: BENCHMARK_ID,
      version: BENCHMARK_VERSION,
      title: payload.leaderboard.title,
      url: BOARD_URL,
      generated_at: payload.leaderboard.updated_at,
      task_count: taskCount.count,
      unit: "accuracy",
      scale: "0-100",
      retrieved_at: today(),
      rows: selection.rows,
    }

    if (diff) {
      const document = await readJsonAs(dataPath("benchmarks.json"), BenchmarksFile)
      const committed = document.benchmarks.find((benchmark) => benchmark.id === BENCHMARK_ID)

      return printDiff(committed, entry)
    }

    await upsertBenchmarkEntry(entry)

    info(
      `recorded board ${payload.leaderboard.id}, dataset_version_ids ${payload.leaderboard.dataset_version_ids.join(",")}, updated_at ${payload.leaderboard.updated_at}`,
    )
    info(`recorded task_count ${taskCount.count} from ${taskCount.url}`)

    return 0
  } catch (error) {
    const reason =
      error instanceof FetchError || error instanceof Error ? error.message : String(error)

    console.error(`rack-rate-data: terminal-bench fetch failed: ${reason}`)

    return 1
  }
}

if (import.meta.main) {
  process.exit(await run(Bun.argv.slice(2)))
}
