import {
  BenchmarksFile,
  ModelsFile,
  PlansFile,
  SourcesFile,
  type BenchmarksFile as BenchmarksDocument,
  type ModelsFile as ModelsDocument,
  type PlansFile as PlansDocument,
  type Source,
  type SourcesFile as SourcesDocument,
} from "@rack-rate/core"
import type { z } from "zod"
import { dataPath, info, readJsonAs, today, warn } from "../paths.ts"

const AA_SOURCE_ID = "src-artificial-analysis"

type ContributionRefs = {
  readonly models: Set<string>
  readonly plans: Set<string>
  readonly benchmarks: Set<string>
}

function dateAgeDays(retrieved: string, reference: string): number {
  const retrievedTime = Date.parse(`${retrieved}T00:00:00Z`)
  const referenceTime = Date.parse(`${reference}T00:00:00Z`)

  return Math.floor((referenceTime - retrievedTime) / 86_400_000)
}

async function readOptional<T>(name: string, schema: z.ZodType<T>): Promise<T | null> {
  try {
    return await readJsonAs(dataPath(name), schema)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    warn(`could not read ${name} while determining source usage: ${reason}`)

    return null
  }
}

async function contributionRefs(): Promise<ContributionRefs> {
  const models = await readOptional<ModelsDocument>("models.json", ModelsFile)
  const plans = await readOptional<PlansDocument>("plans.json", PlansFile)
  const benchmarks = await readOptional<BenchmarksDocument>("benchmarks.json", BenchmarksFile)
  const modelRefs = new Set<string>()
  const planRefs = new Set<string>()
  const benchmarkRefs = new Set<string>()

  if (models !== null) {
    for (const model of models.models) {
      for (const source of model.evidence) {
        modelRefs.add(source)
      }
    }
  }

  if (plans !== null) {
    for (const plan of plans.plans) {
      for (const source of plan.evidence) {
        planRefs.add(source)
      }

      for (const source of plan.sources) {
        planRefs.add(source)
      }
    }
  }

  if (benchmarks !== null) {
    for (const benchmark of benchmarks.benchmarks) {
      if (benchmark.id === "deepswe") {
        benchmarkRefs.add("src-deepswe-data")
      }

      if (benchmark.id === "terminal-bench") {
        benchmarkRefs.add("src-terminal-bench")
      }

      if (benchmark.id === "artificial-analysis") {
        benchmarkRefs.add(AA_SOURCE_ID)
      }
    }
  }

  return { models: modelRefs, plans: planRefs, benchmarks: benchmarkRefs }
}

function contributionLabel(source: Source, refs: ContributionRefs, aaOn: boolean): string {
  if (source.id === AA_SOURCE_ID) {
    if (!aaOn) {
      return "no (AA gate closed; not published)"
    }

    return refs.benchmarks.has(source.id)
      ? "yes (AA gate open; published benchmark)"
      : "no (AA gate open; no published benchmark)"
  }

  if (refs.models.has(source.id) || refs.plans.has(source.id) || refs.benchmarks.has(source.id)) {
    return "yes"
  }

  return "no"
}

function printSource(
  source: Source,
  reference: string,
  refs: ContributionRefs,
  aaOn: boolean,
): void {
  const licenseShort = source.license_short === undefined ? "not provided" : source.license_short

  const attribution =
    source.attribution === undefined
      ? "no (credited_contributor: not applicable)"
      : `yes (credited_contributor: ${source.credited_contributor ?? "not provided"})`

  info(`${source.id}: ${source.title}`)
  info(`  license: ${source.license}`)
  info(`  license_short: ${licenseShort}`)
  info(`  attribution_required: ${attribution}`)
  info(`  retrieved: ${source.retrieved} (${dateAgeDays(source.retrieved, reference)} days old)`)
  info(`  published_data: ${contributionLabel(source, refs, aaOn)}`)
}

function printHelp(): void {
  info("Usage: rack-rate-data sources")
  info("Lists source metadata, attribution requirements, freshness, and published-data usage.")
}

export async function run(args: string[]): Promise<number> {
  for (const arg of args) {
    if (arg !== "--help") {
      warn(`unknown sources argument '${arg}'`)

      return 1
    }
  }

  if (args.includes("--help")) {
    printHelp()

    return 0
  }

  let document: SourcesDocument | null = null

  try {
    document = await readJsonAs(dataPath("sources.json"), SourcesFile)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    warn(`could not read sources.json: ${reason}`)

    return 1
  }

  const aaOn =
    process.env.AA_API_KEY !== undefined &&
    process.env.AA_API_KEY.length > 0 &&
    process.env.AA_PUBLISH === "1"

  const reference = today()
  const refs = await contributionRefs()
  let attributionCount = 0

  info(`Artificial Analysis build state: ${aaOn ? "on" : "off"}`)
  info("sources:")

  for (const source of document.sources) {
    if (source.attribution !== undefined) {
      attributionCount += 1
    }

    printSource(source, reference, refs, aaOn)
  }

  info(`total sources: ${document.sources.length}`)
  info(`attribution-required sources: ${attributionCount}`)

  return 0
}

if (import.meta.main) {
  process.exit(await run(Bun.argv.slice(2)))
}
