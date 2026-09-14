import { BenchmarksFile, ModelsFile, type Benchmark } from "@rack-rate/core"
import { z } from "zod"

import { FetchError, fetchJsonAs } from "../http.ts"
import { dataPath, info, readJsonAs, today, upsertBenchmarkEntry, warn } from "../paths.ts"

const SOURCE_ID = "src-artificial-analysis"

const ENDPOINT = "https://artificialanalysis.ai/api/v2/language/models/free"

const BENCHMARK_TITLE = "Artificial Analysis Language Models API (free tier)"

const TASK_COUNT_SOURCE_URL = "https://artificialanalysis.ai/methodology/intelligence-benchmarking"

const INDEX_EVALUATION_COUNT = 10

const AAEvaluations = z.object({
  artificial_analysis_intelligence_index: z.number().min(0).max(100).nullable().optional(),
  artificial_analysis_intelligence_index_ci_lo: z.number().min(0).max(100).nullable().optional(),
  artificial_analysis_intelligence_index_ci_hi: z.number().min(0).max(100).nullable().optional(),
})

const AACost = z
  .object({
    cost_per_task: z
      .object({
        total_cost: z.number().nonnegative().nullable().optional(),
      })
      .optional(),
  })
  .nullable()
  .optional()

const AAModel = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  evaluations: AAEvaluations,
  artificial_analysis_intelligence_index_cost: AACost,
  ci_lo: z.number().min(0).max(100).nullable().optional(),
  ci_hi: z.number().min(0).max(100).nullable().optional(),
})

const AAPage = z.object({
  intelligence_index_version: z.number(),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total_pages: z.number().int().positive(),
    has_more: z.boolean(),
  }),
  data: z.array(AAModel),
})

type AAModel = z.infer<typeof AAModel>

type OutputRow = Benchmark["rows"][number]

function normalizeModelSlug(value: string): string {
  const withoutQuery = value.trim().split(/[?#]/u, 1)[0] ?? ""
  const segment = withoutQuery.split("/").at(-1) ?? withoutQuery

  return segment
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
}

function addAlias(aliases: Map<string, string>, alias: string, modelId: string): void {
  const normalized = normalizeModelSlug(alias)

  if (normalized !== "" && !aliases.has(normalized)) {
    aliases.set(normalized, modelId)
  }
}

function buildModelAliases(models: ModelsFile["models"]): Map<string, string> {
  const aliases = new Map<string, string>()

  for (const model of models) {
    addAlias(aliases, model.id, model.id)
    addAlias(aliases, model.name, model.id)
  }

  return aliases
}

function resolveModelId(model: AAModel, aliases: ReadonlyMap<string, string>): string | undefined {
  const slugId = aliases.get(normalizeModelSlug(model.slug))

  if (slugId !== undefined) {
    return slugId
  }

  return aliases.get(normalizeModelSlug(model.name))
}

function addOptionalIntervals(row: OutputRow, model: AAModel): void {
  const ciLo = model.ci_lo ?? model.evaluations.artificial_analysis_intelligence_index_ci_lo
  const ciHi = model.ci_hi ?? model.evaluations.artificial_analysis_intelligence_index_ci_hi

  if (ciLo !== undefined && ciLo !== null) {
    row.ci_lo = ciLo
  }

  if (ciHi !== undefined && ciHi !== null) {
    row.ci_hi = ciHi
  }
}

function addCostBasisProvenance(
  provenance: OutputRow["provenance"],
  cost: number | null | undefined,
): OutputRow["provenance"] {
  if (cost === undefined || cost === null) {
    return provenance
  }

  return {
    ...provenance,
    cost_basis_note:
      "Artificial Analysis Intelligence Index cost per task; this is an AA-index cost basis, not a list rate card",
  }
}

function makeRow(
  model: AAModel,
  modelId: string,
  version: number,
  generatedAt: string,
): OutputRow | null {
  const score = model.evaluations.artificial_analysis_intelligence_index

  if (score === undefined || score === null) {
    return null
  }

  const cost = model.artificial_analysis_intelligence_index_cost?.cost_per_task?.total_cost

  const provenance = {
    source: SOURCE_ID,
    url: ENDPOINT,
    aa_model_id: model.id,
    aa_model_slug: model.slug,
    aa_model_name: model.name,
    intelligence_index_version: String(version),
    fetched_at: generatedAt,
    task_count_basis: `${INDEX_EVALUATION_COUNT} constituent evaluations of the Intelligence Index (not ${INDEX_EVALUATION_COUNT} benchmark tasks)`,
    task_count_source_url: TASK_COUNT_SOURCE_URL,
  } satisfies OutputRow["provenance"]

  const row: OutputRow = {
    model_id: modelId,
    score,
    provenance: addCostBasisProvenance(provenance, cost),
  }

  addOptionalIntervals(row, model)

  if (cost !== undefined && cost !== null) {
    row.cost_per_task_usd = cost
    row.cost_basis = "list"
  }

  return row
}

async function fetchPages(apiKey: string): Promise<{ models: AAModel[]; version: number }> {
  const models: AAModel[] = []
  let page = 1
  let version: number | null = null

  for (;;) {
    const snapshot = await fetchJsonAs(
      {
        source: "artificial-analysis",
        url: `${ENDPOINT}?page=${page}`,
        accept: "application/json",
        headers: { "x-api-key": apiKey },
        persistSnapshot: false,
      },
      AAPage,
    )

    const currentVersion = snapshot.value.intelligence_index_version

    if (version === null) {
      version = currentVersion
    } else if (currentVersion !== version) {
      throw new Error(
        `Artificial Analysis intelligence_index_version changed during pagination ` +
          `(${version} -> ${currentVersion}); no data was written`,
      )
    }

    for (const model of snapshot.value.data) {
      models.push(model)
    }

    if (!snapshot.value.pagination.has_more) {
      break
    }

    page += 1
  }

  if (version === null) {
    throw new Error("Artificial Analysis returned no pages")
  }

  return { models, version }
}

type BuildResult = {
  benchmark: Benchmark
  unresolved: number
  unmeasured: number
}

async function buildBenchmark(apiKey: string): Promise<BuildResult> {
  const fetchedAt = new Date().toISOString()
  const pageResult = await fetchPages(apiKey)
  const modelsFile = await readJsonAs(dataPath("models.json"), ModelsFile)
  const aliases = buildModelAliases(modelsFile.models)
  const rows: OutputRow[] = []
  let unresolved = 0
  let unmeasured = 0

  for (const model of pageResult.models) {
    const modelId = resolveModelId(model, aliases)

    if (modelId === undefined) {
      unresolved += 1
      continue
    }

    const row = makeRow(model, modelId, pageResult.version, fetchedAt)

    if (row === null) {
      unmeasured += 1
      continue
    }

    rows.push(row)
  }

  const benchmark: Benchmark = {
    id: "artificial-analysis",
    version: String(pageResult.version),
    title: BENCHMARK_TITLE,
    url: ENDPOINT,
    generated_at: fetchedAt,
    task_count: INDEX_EVALUATION_COUNT,
    unit: "index",
    scale: "0-100",
    retrieved_at: today(),
    rows,
  }

  return { benchmark, unresolved, unmeasured }
}

function benchmarkHeader(benchmark: Benchmark): string {
  return JSON.stringify({
    id: benchmark.id,
    version: benchmark.version,
    title: benchmark.title,
    url: benchmark.url,
    generated_at: benchmark.generated_at,
    task_count: benchmark.task_count,
    unit: benchmark.unit,
    scale: benchmark.scale,
    retrieved_at: benchmark.retrieved_at,
  })
}

function rowMap(rows: readonly OutputRow[]): Map<string, OutputRow> {
  const map = new Map<string, OutputRow>()

  for (const row of rows) {
    map.set(row.model_id, row)
  }

  return map
}

function printRowChanges(current: Benchmark | undefined, next: Benchmark): boolean {
  const currentRows = rowMap(current?.rows ?? [])
  const nextRows = rowMap(next.rows)
  const added: string[] = []
  const changed: string[] = []
  const removed: string[] = []

  for (const [modelId, row] of nextRows) {
    const oldRow = currentRows.get(modelId)

    if (oldRow === undefined) {
      added.push(modelId)
    } else if (JSON.stringify(oldRow) !== JSON.stringify(row)) {
      changed.push(modelId)
    }
  }

  for (const modelId of currentRows.keys()) {
    if (!nextRows.has(modelId)) {
      removed.push(modelId)
    }
  }

  added.sort()
  changed.sort()
  removed.sort()

  info(`AA diff rows added: ${added.length === 0 ? "none" : added.join(", ")}`)
  info(`AA diff rows changed: ${changed.length === 0 ? "none" : changed.join(", ")}`)
  info(`AA diff rows removed: ${removed.length === 0 ? "none" : removed.join(", ")}`)

  return added.length > 0 || changed.length > 0 || removed.length > 0
}

async function printDiff(next: Benchmark): Promise<number> {
  const benchmarks = await readJsonAs(dataPath("benchmarks.json"), BenchmarksFile)
  const current = benchmarks.benchmarks.find((entry) => entry.id === next.id)
  const headerChanged = current === undefined || benchmarkHeader(current) !== benchmarkHeader(next)

  info(`AA diff header: ${benchmarkHeader(next)}`)
  info(`AA diff header changed: ${headerChanged ? "yes" : "no"}`)
  const rowsChanged = printRowChanges(current, next)

  return headerChanged || rowsChanged ? 1 : 0
}

function printHelp(): void {
  console.log(
    "Usage: bun run packages/data-cli/src/commands/fetch-artificial-analysis.ts [--diff] [--help]",
  )
  console.log(
    "Fetches Artificial Analysis Intelligence Index data when AA_API_KEY is set and AA_PUBLISH=1.",
  )
  console.log(
    "--diff fetches and maps in memory, prints row/header changes, and never writes data/**.",
  )
}

function skipMessage(apiKey: string | undefined, publish: string | undefined): string {
  if (apiKey === undefined || apiKey.length === 0) {
    return publish === "1"
      ? "Artificial Analysis skipped: AA_API_KEY is not set; AA_PUBLISH=1 requires it; no AA value was fetched or written."
      : "Artificial Analysis skipped: AA_API_KEY is not set and AA_PUBLISH is not 1; no AA value was fetched or written."
  }

  return "Artificial Analysis skipped: AA_PUBLISH is not 1 (AA_API_KEY is set); no AA value was fetched or written."
}

export async function run(args: string[]): Promise<number> {
  if (args.includes("--help")) {
    printHelp()

    return 0
  }

  const diff = args.includes("--diff")
  const apiKey = process.env.AA_API_KEY
  const publish = process.env.AA_PUBLISH

  if (apiKey === undefined || apiKey.length === 0 || publish !== "1") {
    info(skipMessage(apiKey, publish))

    return 0
  }

  try {
    const result = await buildBenchmark(apiKey)

    if (diff) {
      return await printDiff(result.benchmark)
    }

    await upsertBenchmarkEntry(result.benchmark)
    info(
      `Artificial Analysis fetched ${result.benchmark.rows.length} rows; skipped ` +
        `${result.unresolved} unresolved and ${result.unmeasured} unmeasured models ` +
        `(index v${result.benchmark.version})`,
    )

    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (error instanceof FetchError && error.status !== null) {
      warn(`Artificial Analysis fetch failed with HTTP ${error.status}: ${message}`)
    } else {
      warn(`Artificial Analysis fetch failed: ${message}`)
    }

    return 1
  }
}

if (import.meta.main) {
  process.exit(await run(Bun.argv.slice(2)))
}
