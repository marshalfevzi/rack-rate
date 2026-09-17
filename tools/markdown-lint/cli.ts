import { dirname } from "node:path"

import { lintMarkdown } from "./index.ts"

const root = dirname(dirname(import.meta.dir))

async function main(args: string[]): Promise<number> {
  const result = await lintMarkdown({ root, files: args.length === 0 ? undefined : args })

  const issues = [...result.issues].sort((left, right) => {
    const fileOrder = left.file.localeCompare(right.file)

    if (fileOrder !== 0) {
      return fileOrder
    }

    if (left.line !== right.line) {
      return left.line - right.line
    }

    return left.column - right.column
  })

  for (const finding of issues) {
    console.log(
      `${finding.file}:${finding.line}:${finding.column} ${finding.code} ${finding.message}`,
    )
  }

  const errors = issues.filter((finding) => finding.severity === "error").length
  console.log(`markdown-lint: ${errors} error(s) in ${result.files.length} file(s)`)

  return errors === 0 ? 0 : 1
}

const exitCode = await main(process.argv.slice(2))

process.exit(exitCode)
