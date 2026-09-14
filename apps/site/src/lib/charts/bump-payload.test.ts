import { describe, expect, test } from "bun:test"

import type { Benchmark, Model } from "@rack-rate/core"

import {
  buildBumpPayload,
  bumpAriaLabel,
  decodeBumpPayload,
  encodeBumpPayload,
  groupForRank,
} from "./bump-payload.ts"

function row(
  modelId: string,
  score: number,
  ciLo?: number,
  ciHi?: number,
): Benchmark["rows"][number] {
  const value: Benchmark["rows"][number] = {
    model_id: modelId,
    score,
    provenance: {},
  }

  if (ciLo !== undefined) {
    value.ci_lo = ciLo
  }

  if (ciHi !== undefined) {
    value.ci_hi = ciHi
  }

  return value
}

function benchmark(
  id: string,
  version: string,
  rows: readonly Benchmark["rows"][number][],
  title = id,
): Benchmark {
  return {
    id,
    version,
    title,
    url: "https://example.com/benchmark",
    generated_at: "2026-01-01T00:00:00Z",
    task_count: 1,
    unit: "accuracy",
    scale: "0-100",
    retrieved_at: "2026-01-01",
    rows: [...rows],
  }
}

function model(id: string, name = id): Model {
  return {
    id,
    name,
    provider: null,
    provider_slug: null,
    score_pct: 0,
    score_pass_at_4_pct: 0,
    reasoning_effort: null,
    api_cost_per_task_usd: 0,
    input_tokens_per_task: 0,
    output_tokens_per_task: 0,
    agent_steps_per_task: 1,
    n_tasks_attempted: 1,
    evidence: ["synthetic test input"],
    benchmark_version: "synthetic@1",
    cost_basis: "unknown",
    retrieved_at: "2026-01-01",
  }
}

function only<T>(values: readonly T[], what: string): T {
  const value = values[0]

  if (value === undefined) {
    throw new Error(`expected ${what}`)
  }

  return value
}

describe("Bump payload", () => {
  test("keeps disjoint intervals and isolated intervals in singleton groups", () => {
    const payload = buildBumpPayload({
      models: [model("alpha"), model("beta"), model("gamma")],
      benchmarks: [
        benchmark("bench", "1", [
          row("alpha", 90, 0, 1),
          row("beta", 80, 2, 3),
          row("gamma", 70, 10, 20),
        ]),
      ],
    })

    expect(only(payload.columns, "the benchmark column").groups).toEqual([
      { from: 1, to: 1 },
      { from: 2, to: 2 },
      { from: 3, to: 3 },
    ])
  })

  test("spans a run whose intervals share a common value", () => {
    const payload = buildBumpPayload({
      models: [model("alpha"), model("beta"), model("gamma")],
      benchmarks: [
        benchmark("bench", "1", [
          row("alpha", 90, 0, 10),
          row("beta", 80, 5, 20),
          row("gamma", 70, 8, 9),
        ]),
      ],
    })

    expect(only(payload.columns, "the benchmark column").groups).toEqual([{ from: 1, to: 3 }])
  })

  test("does not use a missing CI for interval joins but permits an equal-score join", () => {
    const missingInterval = buildBumpPayload({
      models: [model("alpha"), model("beta"), model("gamma")],
      benchmarks: [
        benchmark("bench", "1", [row("alpha", 90, 0, 1), row("beta", 80), row("gamma", 70, 0, 1)]),
      ],
    })

    const missingColumn = only(missingInterval.columns, "the benchmark column")

    expect(missingColumn.groups).toEqual([
      { from: 1, to: 1 },
      { from: 2, to: 2 },
      { from: 3, to: 3 },
    ])

    const equalScore = buildBumpPayload({
      models: [model("alpha"), model("beta")],
      benchmarks: [benchmark("bench", "1", [row("alpha", 90), row("beta", 90, 10, 11)])],
    })

    expect(only(equalScore.columns, "the equal-score column").groups).toEqual([{ from: 1, to: 2 }])
  })

  test("groups equal scores even without confidence intervals", () => {
    const payload = buildBumpPayload({
      models: [model("alpha"), model("beta"), model("gamma")],
      benchmarks: [benchmark("bench", "1", [row("alpha", 90), row("beta", 90), row("gamma", 80)])],
    })

    expect(only(payload.columns, "the benchmark column").groups).toEqual([
      { from: 1, to: 2 },
      { from: 3, to: 3 },
    ])
  })

  test("keeps missing model cells null and computes gaps and the not-evaluated lane", () => {
    const payload = buildBumpPayload({
      models: [model("alpha"), model("beta"), model("orphan")],
      benchmarks: [
        benchmark("first", "1", [row("alpha", 90), row("beta", 80)]),
        benchmark("second", "1", [row("alpha", 70)]),
      ],
    })

    expect(payload.columns.map((column) => column.key)).toEqual(["first@1", "second@1"])
    expect(payload.columns.map((column) => column.rowCount)).toEqual([2, 1])
    expect(payload.lines.map((line) => line.id)).toEqual(["alpha", "beta"])
    expect(only(payload.lines, "the first line").cells[0]).toEqual({
      score: 90,
      ciLo: null,
      ciHi: null,
      rank: 1,
    })
    expect(only(payload.lines, "the first line").cells[1]).toEqual({
      score: 70,
      ciLo: null,
      ciHi: null,
      rank: 1,
    })
    expect(payload.lines[1]?.cells).toEqual([{ score: 80, ciLo: null, ciHi: null, rank: 2 }, null])
    expect(payload.gapCount).toBe(1)
    expect(payload.laneRank).toBe(3)
  })

  test("excludes a model with no rows anywhere", () => {
    const payload = buildBumpPayload({
      models: [model("alpha"), model("orphan")],
      benchmarks: [benchmark("bench", "1", [row("alpha", 90)])],
    })

    expect(payload.lines).toHaveLength(1)
    expect(only(payload.lines, "the committed model line").id).toBe("alpha")
  })

  test("rejects payloads when every model is excluded", () => {
    expect(() =>
      buildBumpPayload({
        models: [model("orphan")],
        benchmarks: [benchmark("bench", "1", [row("other", 90)])],
      }),
    ).toThrow("bump payload: no model has a row in any committed benchmark")
  })

  test("rejects duplicate model rows in one benchmark version", () => {
    expect(() =>
      buildBumpPayload({
        models: [model("alpha")],
        benchmarks: [benchmark("bench", "1", [row("alpha", 90), row("alpha", 80)])],
      }),
    ).toThrow("bump payload: bench@1 lists alpha twice")
  })

  test("returns a covering group and rejects ranks outside the column", () => {
    const payload = buildBumpPayload({
      models: [model("alpha"), model("beta"), model("gamma")],
      benchmarks: [benchmark("bench", "1", [row("alpha", 90), row("beta", 90), row("gamma", 80)])],
    })

    const column = only(payload.columns, "the benchmark column")

    expect(groupForRank(column, 1)).toEqual({ from: 1, to: 2 })
    expect(groupForRank(column, 2)).toEqual({ from: 1, to: 2 })
    expect(groupForRank(column, 3)).toEqual({ from: 3, to: 3 })
    expect(() => groupForRank(column, 0)).toThrow("bump payload: rank 0 is not in bench@1")
    expect(() => groupForRank(column, 4)).toThrow("bump payload: rank 4 is not in bench@1")
  })

  test("encodes less-than signs, round-trips, and rejects empty chart structures", () => {
    const payload = buildBumpPayload({
      models: [model("alpha", "<Alpha>")],
      benchmarks: [benchmark("bench", "1", [row("alpha", 90)], "<Benchmark>")],
    })

    const encoded = encodeBumpPayload(payload)

    expect(encoded).not.toContain("<")
    expect(encoded).toContain("\\u003c")
    expect(decodeBumpPayload(encoded)).toEqual(payload)
    expect(() => decodeBumpPayload("null")).toThrow(
      "bump payload: columns must be a non-empty array",
    )
    expect(() => decodeBumpPayload(JSON.stringify({ ...payload, columns: [] }))).toThrow(
      "bump payload: columns must be a non-empty array",
    )
    expect(() => decodeBumpPayload(JSON.stringify({ ...payload, lines: [] }))).toThrow(
      "bump payload: lines must be a non-empty array",
    )

    const line = only(payload.lines, "the payload line")
    expect(() =>
      decodeBumpPayload(JSON.stringify({ ...payload, lines: [{ ...line, cells: [] }] })),
    ).toThrow("bump payload: every line cells array must match columns length")
  })

  test("names the committed counts in the accessible chart label", () => {
    const payload = buildBumpPayload({
      models: [model("alpha"), model("beta")],
      benchmarks: [
        benchmark("first", "1", [row("alpha", 90), row("beta", 90)]),
        benchmark("second", "1", [row("alpha", 80)]),
      ],
    })

    expect(bumpAriaLabel(payload)).toBe(
      "2 committed models ranked across 2 benchmark versions; 1 tied rank range; 1 model-benchmark gap in the not-evaluated lane; JavaScript is required to draw this chart.",
    )
  })

  test("rejects an empty benchmark list", () => {
    expect(() => buildBumpPayload({ models: [model("alpha")], benchmarks: [] })).toThrow(
      "bump payload: no committed benchmark version to rank",
    )
  })
})
