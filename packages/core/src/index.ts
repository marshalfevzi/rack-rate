export * from "./schema.ts"

/** The committed data files the site builds from. Also the CLI stub's contract line. */
export const DATA_FILES = [
  "models.json",
  "plans.json",
  "benchmarks.json",
  "sources.json",
  "derived.json",
] as const
