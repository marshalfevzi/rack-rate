// `ids.ts` first: it is zod-free, so `schema.ts`'s validator stays out of any
// client module that imports only an id (see the note in `ids.ts`).
export * from "./ids.ts"

export * from "./schema.ts"

export * from "./cost.ts"

export * from "./normalize.ts"

export * from "./pareto.ts"

export * from "./freshness.ts"

/** The committed data files the site builds from. Also the CLI stub's contract line. */
export const DATA_FILES = [
  "models.json",
  "plans.json",
  "benchmarks.json",
  "sources.json",
  "derived.json",
] as const
