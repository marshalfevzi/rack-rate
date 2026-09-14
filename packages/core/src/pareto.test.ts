import { describe, expect, test } from "bun:test"
import { paretoFrontier } from "./pareto.ts"

describe("paretoFrontier", () => {
  test("returns a strict frontier, groups an exact tie, and measures dominance", () => {
    const result = paretoFrontier([
      { id: "cheap", cost: 1, score: 10 },
      { id: "best", cost: 3, score: 30 },
      { id: "best-copy", cost: 3, score: 30 },
      { id: "dominated", cost: 2, score: 10 },
    ])

    expect(result.frontier).toEqual(["cheap", "best", "best-copy"])
    expect(result.groups).toEqual([["cheap"], ["best", "best-copy"]])
    expect(result.dominated).toEqual(["dominated"])

    const dominated = result.points.find((point) => point.id === "dominated")

    expect(dominated).toBeDefined()
    expect(dominated?.on_frontier).toBe(false)
    // At cost 2 the frontier interpolates score 20, so delta is 20 - 10;
    // the frontier cost for score 10 is the cheap point at cost 1, so 2 / 1.
    expect(dominated?.distance).toEqual({
      delta_score: 10,
      cost_ratio: 2,
      frontier_id: "cheap",
    })
  })

  test("rejects a NaN cost", () => {
    expect(() => paretoFrontier([{ id: "nan", cost: Number.NaN, score: 1 }])).toThrow(
      'Invalid cost for point "nan"',
    )
  })

  test("rejects a negative cost", () => {
    expect(() => paretoFrontier([{ id: "negative", cost: -1, score: 1 }])).toThrow(
      'Invalid cost for point "negative"',
    )
  })
})
