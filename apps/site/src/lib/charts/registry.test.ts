import { describe, expect, test } from "bun:test"
import type { ChartOption } from "./registry.ts"
import { unregisteredSeriesTypes } from "./registry.ts"

// All five Stage-4 series families are registered: scatter and line (4.2),
// heatmap (4.4), bar (4.6), radar (4.7).

describe("unregisteredSeriesTypes", () => {
  test("names a series type that no row registers", () => {
    const option = { series: [{ type: "made-up-family", data: [] }] } satisfies ChartOption

    expect(unregisteredSeriesTypes(option)).toEqual(["made-up-family"])
  })

  test("accepts a registered scatter series", () => {
    const option = { series: [{ type: "scatter", data: [] }] } satisfies ChartOption

    expect(unregisteredSeriesTypes(option)).toEqual([])
  })

  test("accepts a registered line series", () => {
    const option = { series: [{ type: "line", data: [] }] } satisfies ChartOption

    expect(unregisteredSeriesTypes(option)).toEqual([])
  })

  test("reports one name for two series of the same missing type", () => {
    const option = {
      series: [
        { type: "made-up-family", data: [] },
        { type: "made-up-family", data: [] },
      ],
    } satisfies ChartOption

    expect(unregisteredSeriesTypes(option)).toEqual(["made-up-family"])
  })

  test("reports nothing for an option with no series", () => {
    const option = { grid: { outerBoundsContain: "all" } } satisfies ChartOption

    expect(unregisteredSeriesTypes(option)).toEqual([])
  })

  test("skips a series with no type, which is ECharts' own default", () => {
    const option = { series: { data: [] } } satisfies ChartOption

    expect(unregisteredSeriesTypes(option)).toEqual([])
  })

  test("reads a single series object as well as an array", () => {
    const option = { series: { type: "made-up-family", data: [] } } satisfies ChartOption

    expect(unregisteredSeriesTypes(option)).toEqual(["made-up-family"])
  })
})
