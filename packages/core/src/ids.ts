// Vocabulary that has no zod dependency, kept out of `schema.ts` on purpose: a
// browser module that needs an id — `apps/site/src/lib/provenance.ts`, reached
// by every chart module — would otherwise import the module that builds every
// schema and ship the whole validator to the client. Measured before the split:
// 99 KB minified for one id.
//
// These ids decide the licensing gate and benchmark→source attribution mapping
// and must have one home.

/** The benchmark whose publication the AA gate and its attribution follow (invariant 10). */
export const ARTIFICIAL_ANALYSIS_BENCHMARK_ID = "artificial-analysis"

export const ARTIFICIAL_ANALYSIS_SOURCE_ID = "src-artificial-analysis"

export const BENCHMARK_SOURCE_IDS: ReadonlyMap<string, string> = new Map([
  ["deepswe", "src-deepswe-data"],
  ["terminal-bench", "src-terminal-bench"],
  [ARTIFICIAL_ANALYSIS_BENCHMARK_ID, ARTIFICIAL_ANALYSIS_SOURCE_ID],
])
