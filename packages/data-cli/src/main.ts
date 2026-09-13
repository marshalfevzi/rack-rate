#!/usr/bin/env bun
import { DATA_FILES } from "@rack-rate/core"

const [command, ...rest] = process.argv.slice(2)

console.error(
  `rack-rate-data: '${command ?? "(no command)"}' is not implemented until Stage 2 ` +
    `(args: ${JSON.stringify(rest)}; contract: ${DATA_FILES.join(", ")})`,
)

process.exit(1)
