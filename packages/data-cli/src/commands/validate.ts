import type { z } from "zod"

import type {
  BenchmarksFile as BenchmarksDocument,
  ModelsFile as ModelsDocument,
  Plan,
  PlansFile as PlansDocument,
  Source,
  SourcesFile as SourcesDocument,
} from "@rack-rate/core"
import { BenchmarksFile, ModelsFile, PlansFile, SourcesFile } from "@rack-rate/core"
import { dataPath, parseJsonAs, readTextIfExists, today } from "../paths.ts"

const DATA_FILES = ["models.json", "plans.json", "sources.json", "benchmarks.json"] as const

type DataFile = (typeof DATA_FILES)[number]

type Severity = "error" | "warning"

type Problem = {
  file: DataFile
  message: string
  severity: Severity
}

const REQUIRED_ATTRIBUTION =
  "Identification of the creator: mahonzhan@gmail.com\n" +
  "License Notice: Licensed under the Creative Commons Attribution 4.0 International License.\n" +
  "Link to the License: https://creativecommons.org/licenses/by/4.0/"

const QUOTA_FIELDS = ["quota_usd_month", "credits_month", "requests_month", "tokens_month"] as const

const HELP_RULES = [
  "schema validity and JSON existence for models, plans, sources and benchmarks",
  "evidence and source referential integrity",
  "unique model, plan and source ids",
  "quota completeness and unresolved-quota notes",
  "unavailable-plan reasons",
  "score and effort-variant sanity",
  "verbatim Awesome Coding Plan attribution",
  "model benchmark-version references",
  "benchmark row model references and score scales",
  "Artificial Analysis publication gate",
  "null-preservation checks",
  "retrieval staleness warnings",
] as const

function addProblem(
  problems: Problem[],
  file: DataFile,
  message: string,
  severity: Severity = "error",
): void {
  problems.push({ file, message, severity })
}

async function loadFile<T>(
  name: DataFile,
  schema: z.ZodType<T>,
  problems: Problem[],
): Promise<T | null> {
  try {
    const contents = await readTextIfExists(dataPath(name))

    if (contents === null) {
      addProblem(problems, name, "does not exist")

      return null
    }

    return parseJsonAs(contents, schema, name)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    addProblem(problems, name, reason)

    return null
  }
}

function rowLabel(collection: string, index: number, id: string): string {
  return `${collection}[${index}] (${id})`
}

function checkDuplicateIds(
  ids: readonly string[],
  file: DataFile,
  collection: string,
  problems: Problem[],
): void {
  const seen = new Set<string>()

  for (const [index, id] of ids.entries()) {
    if (seen.has(id)) {
      addProblem(
        problems,
        file,
        `${collection}[${index}] (${id}) duplicates ${collection.slice(0, -1)} id '${id}'`,
      )
    }

    seen.add(id)
  }
}

function dateAgeDays(retrieved: string, reference: string): number {
  const retrievedMs = Date.parse(`${retrieved}T00:00:00Z`)
  const referenceMs = Date.parse(`${reference}T00:00:00Z`)

  return Math.floor((referenceMs - retrievedMs) / 86_400_000)
}

function checkStaleness(
  file: DataFile,
  row: string,
  retrieved: string,
  reference: string,
  problems: Problem[],
): void {
  const age = dateAgeDays(retrieved, reference)

  if (age > 14) {
    addProblem(
      problems,
      file,
      `${row} retrieved ${retrieved}, which is ${age} days old (older than 14 days)`,
      "warning",
    )
  }
}

function quotaFieldValue(plan: Plan, field: string): number | undefined {
  switch (field) {
    case "quota_usd_month":
      return plan.quota_usd_month
    case "credits_month":
      return plan.credits_month
    case "requests_month":
      return plan.requests_month
    case "tokens_month":
      return plan.tokens_month
    default:
      return undefined
  }
}

function checkSources(
  document: SourcesDocument,
  sourceIds: Set<string>,
  sourceById: Map<string, Source>,
  problems: Problem[],
  referenceDate: string,
): void {
  const ids: string[] = []

  for (const [index, source] of document.sources.entries()) {
    const row = rowLabel("sources", index, source.id)
    ids.push(source.id)
    sourceIds.add(source.id)
    sourceById.set(source.id, source)
    checkStaleness("sources.json", row, source.retrieved, referenceDate, problems)
  }

  const awesomeCodingPlan = sourceById.get("src-awesome-coding-plan")

  const awesomeCodingPlanIndex = document.sources.findIndex(
    (source) => source.id === "src-awesome-coding-plan",
  )

  if (awesomeCodingPlan === undefined) {
    addProblem(
      problems,
      "sources.json",
      "sources (src-awesome-coding-plan) is missing the required Awesome Coding Plan attribution record",
    )
  } else if (awesomeCodingPlan.attribution !== REQUIRED_ATTRIBUTION) {
    addProblem(
      problems,
      "sources.json",
      `${rowLabel("sources", awesomeCodingPlanIndex, awesomeCodingPlan.id)} attribution does not exactly match the verbatim string in docs/data-sources.md`,
    )
  }
}

function checkModels(
  document: ModelsDocument,
  sourceIds: Set<string>,
  benchmarkVersions: Map<string, Set<string>>,
  problems: Problem[],
  referenceDate: string,
): void {
  const ids: string[] = []

  for (const [index, model] of document.models.entries()) {
    const row = rowLabel("models", index, model.id)
    ids.push(model.id)

    for (const evidenceId of model.evidence) {
      if (!sourceIds.has(evidenceId)) {
        addProblem(
          problems,
          "models.json",
          `${row} evidence references unknown source id '${evidenceId}'`,
        )
      }
    }

    if (model.score_pass_at_4_pct < model.score_pct) {
      addProblem(
        problems,
        "models.json",
        `${row} score_pass_at_4_pct ${model.score_pass_at_4_pct} is below score_pct ${model.score_pct}`,
      )
    }

    for (const variant of model.effort_variants ?? []) {
      if (variant.score_pct > model.score_pct) {
        addProblem(
          problems,
          "models.json",
          `${row} effort variant '${variant.reasoning_effort}' score_pct ${variant.score_pct} exceeds the parent's pinned score pair ${model.score_pct}/${model.score_pass_at_4_pct}`,
          "warning",
        )
      }
    }

    const atIndex = model.benchmark_version.indexOf("@")
    const benchmarkId = model.benchmark_version.slice(0, atIndex)
    const benchmarkVersion = model.benchmark_version.slice(atIndex + 1)
    const versions = benchmarkVersions.get(benchmarkId)

    if (versions === undefined || !versions.has(benchmarkVersion)) {
      addProblem(
        problems,
        "models.json",
        `${row} benchmark_version '${model.benchmark_version}' does not name an existing benchmark id/version`,
      )
    }

    checkStaleness("models.json", row, model.retrieved_at, referenceDate, problems)
  }

  checkDuplicateIds(ids, "models.json", "models", problems)
}

function checkPlans(
  document: PlansDocument,
  sourceIds: Set<string>,
  models: ModelsDocument | null,
  problems: Problem[],
  referenceDate: string,
): void {
  const ids: string[] = []

  for (const [index, plan] of document.plans.entries()) {
    const row = rowLabel("plans", index, plan.id)
    ids.push(plan.id)

    for (const evidenceId of plan.evidence) {
      if (!sourceIds.has(evidenceId)) {
        addProblem(
          problems,
          "plans.json",
          `${row} evidence references unknown source id '${evidenceId}'`,
        )
      }
    }

    for (const sourceId of plan.sources) {
      if (!sourceIds.has(sourceId)) {
        addProblem(
          problems,
          "plans.json",
          `${row} sources references unknown source id '${sourceId}'`,
        )
      }
    }

    const requiredFields = document.quota_model_docs[plan.quota_model]

    if (plan.quota_unresolved === true) {
      if (plan.quota_note === undefined) {
        addProblem(problems, "plans.json", `${row} has quota_unresolved: true but no quota_note`)
      }

      for (const field of QUOTA_FIELDS) {
        if (quotaFieldValue(plan, field) !== undefined) {
          addProblem(
            problems,
            "plans.json",
            `${row} has quota_unresolved: true but carries quota field '${field}' instead of leaving the quota absent`,
          )
        }
      }
    } else {
      for (const field of requiredFields) {
        if (quotaFieldValue(plan, field) === undefined) {
          addProblem(
            problems,
            "plans.json",
            `${row} quota_model '${plan.quota_model}' requires field '${field}' (or quota_unresolved: true)`,
          )
        }
      }
    }

    if (plan.available === false) {
      if (plan.unavailable_reason === undefined || plan.unavailable_reason.trim().length === 0) {
        addProblem(
          problems,
          "plans.json",
          `${row} is marked available: false but is missing unavailable_reason`,
        )
      }
    }

    if (models !== null && Array.isArray(plan.model_scope)) {
      for (const model of models.models) {
        if (model.provider === null && plan.model_scope.includes("null")) {
          addProblem(
            problems,
            "plans.json",
            `${row} model_scope names provider 'null' for model '${model.id}', whose provider is null`,
          )
        }
      }
    }

    checkStaleness("plans.json", row, plan.retrieved_at, referenceDate, problems)
  }

  checkDuplicateIds(ids, "plans.json", "plans", problems)
}

function checkBenchmarks(
  document: BenchmarksDocument,
  modelIds: Set<string>,
  problems: Problem[],
): void {
  for (const [index, benchmark] of document.benchmarks.entries()) {
    const row = rowLabel("benchmarks", index, benchmark.id)

    if (benchmark.rows.length === 0) {
      addProblem(problems, "benchmarks.json", `${row} has zero rows`, "warning")
    }

    if (benchmark.id === "artificial-analysis") {
      if (process.env.AA_PUBLISH === "1") {
        addProblem(
          problems,
          "benchmarks.json",
          "!!! Artificial Analysis publication is ENABLED (AA_PUBLISH=1); committed AA data is being published !!!",
          "warning",
        )
      } else {
        addProblem(
          problems,
          "benchmarks.json",
          `${row} is present while AA_PUBLISH is not '1'; Artificial Analysis data must not be committed`,
        )
      }
    }

    for (const [rowIndex, benchmarkRow] of benchmark.rows.entries()) {
      const benchmarkRowLabel = `benchmarks[${index}].rows[${rowIndex}] (${benchmarkRow.model_id})`

      if (!modelIds.has(benchmarkRow.model_id)) {
        addProblem(
          problems,
          "benchmarks.json",
          `${benchmarkRowLabel} model_id references unknown model '${benchmarkRow.model_id}'`,
        )
      }

      if (benchmark.scale === "0-1" && (benchmarkRow.score < 0 || benchmarkRow.score > 1)) {
        addProblem(
          problems,
          "benchmarks.json",
          `${benchmarkRowLabel} score ${benchmarkRow.score} is outside declared 0-1 scale`,
        )
      }
    }
  }
}

function printProblems(problems: readonly Problem[]): void {
  const countsByFile: Partial<Record<DataFile, number>> = {}
  const errorFiles = new Set<DataFile>()
  const warningFiles = new Set<DataFile>()
  let errorCount = 0
  let warningCount = 0

  for (const problem of problems) {
    countsByFile[problem.file] = (countsByFile[problem.file] ?? 0) + 1

    if (problem.severity === "error") {
      errorCount += 1
      errorFiles.add(problem.file)
    } else {
      warningCount += 1
      warningFiles.add(problem.file)
    }
  }

  for (const file of DATA_FILES) {
    const count = countsByFile[file]

    if (count === undefined) {
      continue
    }

    console.log(`${file}:`)

    for (const problem of problems) {
      if (problem.file === file) {
        console.log(`  ${problem.severity.toUpperCase()}: ${problem.file}: ${problem.message}`)
      }
    }
  }

  if (errorCount === 0 && warningCount === 0) {
    console.log("no problems")
  } else {
    const summaries: string[] = []

    if (errorCount > 0) {
      summaries.push(
        `${errorCount} ${errorCount === 1 ? "error" : "errors"} in ${errorFiles.size} ${errorFiles.size === 1 ? "file" : "files"}`,
      )
    }

    if (warningCount > 0) {
      summaries.push(
        `${warningCount} ${warningCount === 1 ? "warning" : "warnings"} in ${warningFiles.size} ${warningFiles.size === 1 ? "file" : "files"}`,
      )
    }

    console.log(summaries.join("; "))
  }
}

function printHelp(): void {
  console.log("Usage: bun run packages/data-cli/src/commands/validate.ts [--help]")
  console.log("Validates committed data without writing to data/**. Rules:")

  for (const [index, rule] of HELP_RULES.entries()) {
    console.log(`  ${index + 1}. ${rule}`)
  }
}

export async function run(args: string[]): Promise<number> {
  if (args.includes("--help")) {
    printHelp()

    return 0
  }

  const problems: Problem[] = []
  const referenceDate = today()
  const sources = await loadFile("sources.json", SourcesFile, problems)
  const models = await loadFile("models.json", ModelsFile, problems)
  const plans = await loadFile("plans.json", PlansFile, problems)
  const benchmarks = await loadFile("benchmarks.json", BenchmarksFile, problems)
  const sourceIds = new Set<string>()
  const sourceById = new Map<string, Source>()
  const modelIds = new Set<string>()
  const benchmarkVersions = new Map<string, Set<string>>()

  if (sources !== null) {
    checkSources(sources, sourceIds, sourceById, problems, referenceDate)
  }

  if (benchmarks !== null) {
    for (const benchmark of benchmarks.benchmarks) {
      const versions = benchmarkVersions.get(benchmark.id) ?? new Set<string>()

      versions.add(benchmark.version)
      benchmarkVersions.set(benchmark.id, versions)
    }
  }

  if (models !== null) {
    for (const model of models.models) {
      modelIds.add(model.id)
    }

    checkModels(models, sourceIds, benchmarkVersions, problems, referenceDate)
  }

  if (plans !== null) {
    checkPlans(plans, sourceIds, models, problems, referenceDate)
  }

  if (benchmarks !== null) {
    checkBenchmarks(benchmarks, modelIds, problems)
  }

  printProblems(problems)

  for (const problem of problems) {
    if (problem.severity === "error") {
      return 1
    }
  }

  return 0
}

if (import.meta.main) {
  process.exit(await run(Bun.argv.slice(2)))
}
