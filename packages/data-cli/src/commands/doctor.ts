import { readdir } from "node:fs/promises"

import {
  BenchmarksFile,
  DerivedFile,
  ModelsFile,
  PlansFile,
  SourcesFile,
  type SourcesFile as SourcesDocument,
} from "@rack-rate/core"
import type { z } from "zod"
import { USER_AGENT } from "../http.ts"
import { DATA_DIR, RAW_DIR, dataPath, info, readJsonAs, today, warn } from "../paths.ts"
import { PLAN_TARGET_URLS } from "./fetch-plans.ts"

type ProbeResult = {
  readonly url: string
  readonly status: string | null
  readonly error: string | null
}

async function probe(url: string): Promise<ProbeResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)

  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    })

    return { url, status: `HTTP ${response.status} ${response.statusText}`.trim(), error: null }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)

    return { url, status: null, error: reason }
  } finally {
    clearTimeout(timeout)
  }
}

function urlsFor(document: SourcesDocument): string[] {
  const urls: string[] = []
  const seen = new Set<string>()

  for (const source of document.sources) {
    if (!seen.has(source.url)) {
      seen.add(source.url)
      urls.push(source.url)
    }
  }

  for (const url of PLAN_TARGET_URLS) {
    if (!seen.has(url)) {
      seen.add(url)
      urls.push(url)
    }
  }

  return urls
}

async function checkDataFile<T>(name: string, schema: z.ZodType<T>): Promise<boolean> {
  try {
    await readJsonAs(dataPath(name), schema)
    info(`data/${name}: valid`)

    return true
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    warn(`data/${name}: invalid: ${reason}`)

    return false
  }
}

async function sameDayRawSnapshots(date: string): Promise<number> {
  try {
    const entries = await readdir(RAW_DIR, { withFileTypes: true })
    const suffix = `-${date}.json`
    let count = 0

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(suffix)) {
        count += 1
      }
    }

    return count
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    warn(`could not inspect ${DATA_DIR}/raw: ${reason}`)

    return 0
  }
}

function printHelp(): void {
  info("Usage: rack-rate-data doctor")
  info(
    "Probes source URLs, reports environment state, validates data files, and " +
      "counts raw snapshots.",
  )
}

export async function run(args: string[]): Promise<number> {
  for (const arg of args) {
    if (arg !== "--help") {
      warn(`unknown doctor argument '${arg}'`)

      return 1
    }
  }

  if (args.includes("--help")) {
    printHelp()

    return 0
  }

  let sources: SourcesDocument

  try {
    sources = await readJsonAs(dataPath("sources.json"), SourcesFile)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    warn(`data/sources.json: invalid: ${reason}`)

    return 1
  }

  const apiKeySet = process.env.AA_API_KEY !== undefined && process.env.AA_API_KEY.length > 0
  const publish = process.env.AA_PUBLISH ?? "unset"
  const aaOn = apiKeySet && publish === "1"
  const urls = urlsFor(sources)

  info(`AA_API_KEY: ${apiKeySet ? "set" : "not set"}`)
  info(`AA_PUBLISH: ${publish}`)
  info(`Artificial Analysis: ${aaOn ? "on" : "off"}`)
  info(`probing ${urls.length} URLs with USER_AGENT ${USER_AGENT}`)

  const probes = await Promise.all(urls.map((url) => probe(url)))

  for (const result of probes) {
    if (result.status !== null) {
      info(`probe ${result.url}: ${result.status}`)
    } else {
      warn(`probe ${result.url}: network error: ${result.error}`)
    }
  }

  const modelsValid = await checkDataFile("models.json", ModelsFile)
  const plansValid = await checkDataFile("plans.json", PlansFile)
  const sourcesValid = await checkDataFile("sources.json", SourcesFile)
  const benchmarksValid = await checkDataFile("benchmarks.json", BenchmarksFile)
  const derivedValid = await checkDataFile("derived.json", DerivedFile)

  const valid = modelsValid && plansValid && sourcesValid && benchmarksValid && derivedValid

  const date = today()
  const snapshotCount = await sameDayRawSnapshots(date)

  info(`same-day raw snapshots (${date}): ${snapshotCount}`)

  return valid ? 0 : 1
}

if (import.meta.main) {
  process.exit(await run(Bun.argv.slice(2)))
}
