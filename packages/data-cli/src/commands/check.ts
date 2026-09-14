import { DerivedFile, type DerivedFile as DerivedDocument } from "@rack-rate/core"
import { dataPath, info, parseJsonAs, readTextIfExists, sha256Hex, warn } from "../paths.ts"
import { run as runValidate } from "./validate.ts"
import { buildDerivedDocument } from "./compute.ts"

const DERIVED_KEYS = [
  "generated_from",
  "pairs",
  "best_routes",
  "cross_check",
  "known_gaps",
  "generated_at",
  "composites",
  "frontiers",
  "token_allowances",
  "badges",
] as const satisfies readonly (keyof DerivedDocument)[]

function printHelp(): void {
  info("Usage: rack-rate-data check")
  info("Validates inputs, recomputes data/derived.json in memory, and checks byte parity.")
}

function firstDifferingKey(
  expected: DerivedDocument,
  committed: DerivedDocument,
): keyof DerivedDocument | null {
  for (const key of DERIVED_KEYS) {
    if (JSON.stringify(expected[key]) !== JSON.stringify(committed[key])) {
      return key
    }
  }

  return null
}

function countText(value: DerivedDocument | null, section: "pairs" | "composites"): string {
  if (value === null) {
    return "unavailable"
  }

  if (section === "pairs") {
    return `${value.pairs.length}`
  }

  return `${value.composites?.rows.length ?? 0}`
}

export async function run(args: string[]): Promise<number> {
  for (const arg of args) {
    if (arg !== "--help") {
      warn(`unknown check argument '${arg}'`)

      return 1
    }
  }

  if (args.includes("--help")) {
    printHelp()

    return 0
  }

  const validationCode = await runValidate([])

  if (validationCode !== 0) {
    warn("check failed: committed input data did not pass validation")

    return validationCode
  }

  let expected: DerivedDocument

  try {
    expected = await buildDerivedDocument()
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    warn(`check failed while recomputing derived data: ${reason}`)

    return 1
  }

  const expectedText = `${JSON.stringify(expected, null, 2)}\n`
  const expectedHash = sha256Hex(expectedText)
  const committedPath = dataPath("derived.json")
  const committedText = await readTextIfExists(committedPath)
  const committedHash = committedText === null ? "(missing)" : sha256Hex(committedText)
  let committed: DerivedDocument | null = null
  let committedParseError: string | null = null

  if (committedText !== null) {
    try {
      committed = parseJsonAs(committedText, DerivedFile, committedPath)
    } catch (error) {
      committedParseError = error instanceof Error ? error.message : String(error)
    }
  }

  info(`derived expected sha256: ${expectedHash}`)
  info(`derived committed sha256: ${committedHash}`)

  if (committedText !== null && committedParseError === null && committed !== null) {
    const differingKey = firstDifferingKey(expected, committed)

    if (differingKey === null && expectedText === committedText) {
      info("derived.json is current")

      return 0
    }

    info(`derived.json is stale: first differing top-level key: ${differingKey ?? "serialization"}`)
  } else if (committedText === null) {
    info("derived.json is stale: committed file is missing")
  } else {
    info(`derived.json is stale: committed file is invalid: ${committedParseError}`)
  }

  info(
    `counts: expected pairs=${countText(expected, "pairs")}, ` +
      `composites=${countText(expected, "composites")}; ` +
      `committed pairs=${countText(committed, "pairs")}, ` +
      `composites=${countText(committed, "composites")}`,
  )

  return 1
}

if (import.meta.main) {
  process.exit(await run(Bun.argv.slice(2)))
}
