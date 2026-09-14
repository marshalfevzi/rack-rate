import { info, warn } from "../paths.ts"
import { run as runArtificialAnalysis } from "./fetch-artificial-analysis.ts"
import { run as runDeepSwe } from "./fetch-deepswe.ts"
import { run as runPlans } from "./fetch-plans.ts"
import { run as runTerminalBench } from "./fetch-terminal-bench.ts"

const SOURCES = ["deepswe", "terminal-bench", "plans", "artificial-analysis"] as const

type SourceName = (typeof SOURCES)[number]

function printHelp(): void {
  info("Usage: rack-rate-data fetch [<source>|all] [--diff]")
  info("Fetches one source, or all sources sequentially in fail-closed order.")
  info("Sources: deepswe, terminal-bench, plans, artificial-analysis")
  info("--diff performs a dry run and writes no data files.")
}

function isSource(value: string): value is SourceName {
  for (const source of SOURCES) {
    if (source === value) {
      return true
    }
  }

  return false
}

async function runSource(source: SourceName, args: string[]): Promise<number> {
  switch (source) {
    case "deepswe":
      return await runDeepSwe(args)
    case "terminal-bench":
      return await runTerminalBench(args)
    case "plans":
      return await runPlans(args)
    case "artificial-analysis":
      return await runArtificialAnalysis(args)
  }
}

function invalidArgument(args: readonly string[]): string | null {
  for (const arg of args) {
    if (arg !== "--diff" && arg !== "--help") {
      return `unknown fetch argument '${arg}'`
    }
  }

  return null
}

export async function run(args: string[]): Promise<number> {
  const hasHelp = args.includes("--help")
  let source = "all"
  let flagStart = 0
  const firstArg = args[0]

  if (firstArg !== undefined && firstArg !== "--diff" && firstArg !== "--help") {
    source = firstArg
    flagStart = 1
  }

  const flags = args.slice(flagStart)
  const argumentError = invalidArgument(flags)

  if (argumentError !== null) {
    warn(argumentError)

    if (hasHelp) {
      printHelp()
    }

    return 1
  }

  if (hasHelp) {
    printHelp()

    return 0
  }

  if (source !== "all" && !isSource(source)) {
    warn(`unknown fetch source '${source}'; valid sources: ${SOURCES.join(", ")} (or all)`)

    return 1
  }

  const selected: readonly SourceName[] = source === "all" ? SOURCES : [source]

  for (const [index, selectedSource] of selected.entries()) {
    let exitCode: number

    try {
      exitCode = await runSource(selectedSource, flags)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      warn(`fetch ${selectedSource} failed: ${reason}`)

      exitCode = 1
    }

    if (exitCode !== 0) {
      const notAttempted = selected.slice(index + 1)

      warn(
        `fetch ${selectedSource} failed with exit code ${exitCode}; ` +
          `not attempted: ${notAttempted.join(", ") || "none"}`,
      )

      return exitCode
    }
  }

  if (source === "all") {
    info(`fetch all completed: ${selected.join(", ")}`)
  }

  return 0
}

if (import.meta.main) {
  process.exit(await run(Bun.argv.slice(2)))
}
