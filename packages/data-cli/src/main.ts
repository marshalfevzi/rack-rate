#!/usr/bin/env bun
import { info, warn } from "./paths.ts"
import { run as runCheck } from "./commands/check.ts"
import { run as runCompute } from "./commands/compute.ts"
import { run as runDoctor } from "./commands/doctor.ts"
import { run as runFetch } from "./commands/fetch.ts"
import { run as runSources } from "./commands/sources.ts"
import { run as runValidate } from "./commands/validate.ts"

const COMMANDS = ["fetch", "validate", "compute", "check", "sources", "doctor"] as const

type CommandName = (typeof COMMANDS)[number]

function printHelp(): void {
  info("Usage: rack-rate-data <command> [options]")
  info("Commands:")
  info("  fetch       fetch one source or all sources (optional --diff)")
  info("  validate    validate committed source, model, plan and benchmark data")
  info("  compute     recompute data/derived.json from committed data")
  info("  check       validate inputs and check derived data for staleness")
  info("  sources     list source metadata, attribution and published-data usage")
  info("  doctor      probe URLs and diagnose environment and data files")
  info("  help        print this usage list")
}

function isCommand(value: string): value is CommandName {
  for (const command of COMMANDS) {
    if (command === value) {
      return true
    }
  }

  return false
}

async function runCommand(command: CommandName, args: string[]): Promise<number> {
  switch (command) {
    case "fetch":
      return await runFetch(args)
    case "validate":
      return await runValidate(args)
    case "compute":
      return await runCompute(args)
    case "check":
      return await runCheck(args)
    case "sources":
      return await runSources(args)
    case "doctor":
      return await runDoctor(args)
  }
}

export async function run(args: string[]): Promise<number> {
  const [command, ...rest] = args

  if (command === undefined) {
    warn("missing command")
    printHelp()

    return 1
  }

  if (command === "--help") {
    printHelp()

    return 0
  }

  if (command === "help") {
    if (rest.length > 0) {
      warn(`unknown help argument '${rest[0]}'`)
      printHelp()

      return 1
    }

    printHelp()

    return 0
  }

  if (!isCommand(command)) {
    warn(`unknown command '${command}'`)
    printHelp()

    return 1
  }

  try {
    return await runCommand(command, rest)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    warn(`${command} failed: ${reason}`)

    return 1
  }
}

if (import.meta.main) {
  process.exit(await run(process.argv.slice(2)))
}
