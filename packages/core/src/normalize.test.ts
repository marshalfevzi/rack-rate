import { describe, expect, test } from "bun:test"
import type { CompositeRow } from "./normalize.ts"
import { composite, zScores } from "./normalize.ts"

function compositeFor(rows: readonly CompositeRow[], modelId: string): CompositeRow {
  const row = rows.find((candidate) => candidate.model_id === modelId)

  if (row === undefined) {
    throw new Error(`Missing composite row for ${modelId}`)
  }

  return row
}

describe("zScores", () => {
  test("uses the hand-computed population standard deviation", () => {
    const normalized = zScores("benchmark", "v1", [
      { model_id: "low", score: 2 },
      { model_id: "middle", score: 4 },
      { model_id: "high", score: 6 },
    ])

    const first = normalized.rows[0]
    const populationSd = Math.sqrt(8 / 3)

    expect(first).toBeDefined()
    expect(first?.mean).toBe(4)
    expect(first?.sd).toBeCloseTo(populationSd, 12)
    expect(first?.z).toBeCloseTo((2 - 4) / populationSd, 12)
    expect(first?.n).toBe(3)
  })
})

describe("composite", () => {
  test("renormalizes weights over the benchmarks a model has", () => {
    const first = zScores("first", "v1", [
      { model_id: "partial", score: 0 },
      { model_id: "peer-a", score: 10 },
    ])

    const second = zScores("second", "v1", [
      { model_id: "partial", score: 10 },
      { model_id: "peer-b", score: 0 },
    ])

    const third = zScores("third", "v1", [
      { model_id: "other-a", score: 0 },
      { model_id: "other-b", score: 10 },
    ])

    const weights = new Map([
      ["first", 1],
      ["second", 3],
      ["third", 100],
    ])

    const row = compositeFor(composite([first, second, third], { weights }), "partial")

    // The two available z-scores are -1 and +1: (-1 × 1 + 1 × 3) / (1 + 3) = 0.5.
    expect(row.k).toBe(2)
    expect(row.benchmarks_used).toEqual(["first", "second"])
    expect(row.weighted_z).toBeCloseTo(0.5, 12)
    expect(row.composite).toBeCloseTo(55, 12)
  })

  test("suppresses a one-benchmark composite as single-source", () => {
    const only = zScores("only", "v1", [{ model_id: "single", score: 42 }])
    const rows = composite([only], { weights: new Map([["only", 1]]) })
    const row = compositeFor(rows, "single")

    expect(row.k).toBe(1)
    expect(row.composite).toBeNull()
    expect(row.badge).toBe("single-source")
  })

  test("propagates complete confidence intervals through the composite", () => {
    const first = zScores("first", "v1", [
      { model_id: "target", score: 0, ci_lo: 0, ci_hi: 4 },
      { model_id: "peer-a", score: 10 },
    ])

    const second = zScores("second", "v1", [
      { model_id: "target", score: 10, ci_lo: 8, ci_hi: 12 },
      { model_id: "peer-b", score: 0 },
    ])

    const row = compositeFor(
      composite([first, second], {
        weights: new Map([
          ["first", 1],
          ["second", 1],
        ]),
      }),
      "target",
    )

    // The hand-computed normalized bounds are (-1, -.2) and (.6, 1.4).
    expect(row.composite).toBeCloseTo(50, 12)
    expect(row.ci_lo).toBeCloseTo(48, 12)
    expect(row.ci_hi).toBeCloseTo(56, 12)
  })

  test("returns no rows for empty input instead of producing NaN", () => {
    const normalized = zScores("empty", "v1", [])
    const rows = composite([normalized], { weights: new Map([["empty", 1]]) })

    expect(normalized.rows).toEqual([])
    expect(rows).toEqual([])
  })
})
