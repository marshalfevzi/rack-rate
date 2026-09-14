/**
 * Freshness is a display verdict, not a computed figure: `compute` writes it
 * into the `derived.json` badges and the site renders it on every row. The
 * threshold therefore lives here rather than in either caller — two copies
 * would eventually disagree.
 *
 * Pure like the rest of the package: the reference moment is an argument, never
 * the clock. `data/derived.json` uses the newest upstream `generated_at` as
 * that reference, which is what makes the verdict reproducible byte for byte.
 */
import type { PairBadge } from "./schema.ts"

/** The one vocabulary is `PairBadge.freshness` in `schema.ts`. */
export type Freshness = PairBadge["freshness"]

/** A retrieval older than this many days, relative to the reference moment, is stale. */
export const STALE_AFTER_DAYS = 14

const MS_PER_DAY = 86_400_000

/**
 * `retrievedAt` is a `YYYY-MM-DD` date and `referenceAt` an ISO datetime. The
 * comparison is against midnight UTC of the retrieval date, the semantic this
 * rule was ported from the legacy pipeline with.
 */
export function isStale(retrievedAt: string, referenceAt: string): boolean {
  const retrievedTime = Date.parse(`${retrievedAt}T00:00:00Z`)
  const referenceTime = Date.parse(referenceAt)

  return referenceTime - retrievedTime > STALE_AFTER_DAYS * MS_PER_DAY
}

/** The same rule as the committed `PairBadge.freshness` value, spelled as a word. */
export function freshnessOf(retrievedAt: string, referenceAt: string): Freshness {
  return isStale(retrievedAt, referenceAt) ? "stale" : "fresh"
}
