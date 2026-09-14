import { describe, expect, test } from "bun:test"

import { formatUsdPerTask } from "../format.ts"
import { cartesianFrame, seriesMarker } from "./frame.ts"
import type { CartesianFrameInput } from "./frame.ts"
import type { ChartTokens } from "./theme.ts"

const tokens: ChartTokens = {
  canvas: "#0a0e15",
  panel: "#111825",
  rule: "#1d2735",
  ink: "#eaeef5",
  dim: "#a3b0c4",
  adjusted: "#ffb020",
  measured: "#45d97f",
  api: "#5c6a80",
  apiInk: "#8a97ab",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  fontSizeMeta: 13,
  fontSizeBody: 15,
}

const baseInput: CartesianFrameInput = {
  tokens,
  metric: "$/task",
  basis: "api-list",
  x: { label: "tasks / month" },
  y: { label: "cost" },
  format: formatUsdPerTask,
}

function onlyOption<T>(value: T | T[] | undefined): T {
  if (value === undefined) {
    throw new Error("expected one chart option")
  }

  if (value instanceof Array) {
    const firstValue = value[0]

    if (firstValue === undefined) {
      throw new Error("expected a non-empty chart option")
    }

    return firstValue
  }

  return value
}

describe("cartesian frame", () => {
  test("titles each cost basis and rejects an unnamed route", () => {
    expect(cartesianFrame(baseInput).title).toBe("API list $/task")
    expect(
      cartesianFrame({ ...baseInput, basis: "plan-route", planName: "Claude Pro" }).title,
    ).toBe("Claude Pro route $/task")
    expect(() => cartesianFrame({ ...baseInput, basis: "plan-route" })).toThrow()
  })

  test("uses the caller's value-axis formatter", () => {
    const value = 0.0304
    const frame = cartesianFrame(baseInput)
    const yAxis = onlyOption(frame.option.yAxis)

    if (yAxis.type !== "value") {
      throw new Error("expected the default y-axis to be numeric")
    }

    const formatter = yAxis.axisLabel?.formatter

    if (formatter !== formatUsdPerTask) {
      throw new Error("expected the y-axis to retain the caller's formatter")
    }

    expect(formatter(value, 0, undefined)).toBe(formatUsdPerTask(value))
  })

  test("per-axis formatting overrides the frame formatter and bounds a log axis", () => {
    const formatFrame = (value: number): string => `frame ${value}`
    const formatAxis = (value: number): string => `axis ${value}`

    const frame = cartesianFrame({
      ...baseInput,
      format: formatFrame,
      y: { type: "log", format: formatAxis, min: 0.001, max: 10 },
    })

    const yAxis = onlyOption(frame.option.yAxis)

    if (yAxis.type !== "log") {
      throw new Error("expected a log y-axis")
    }

    const formatter = yAxis.axisLabel?.formatter
    expect(yAxis.min).toBe(0.001)
    expect(yAxis.max).toBe(10)

    if (formatter !== formatAxis) {
      throw new Error("expected the axis formatter to override the frame formatter")
    }

    expect(formatter(2, 0, undefined)).toBe(formatAxis(2))
  })

  test("contains axis names as well as labels in the grid's outer bounds", () => {
    const option = cartesianFrame(baseInput).option
    const grid = onlyOption(option.grid)

    // A labelled axis is what makes the containment rule matter; with
    // `outerBoundsContain: "axisLabel"` ECharts lays out no axis name and the
    // name is drawn outside the canvas.
    expect(onlyOption(option.xAxis).name).toBe(baseInput.x.label)
    expect(onlyOption(option.yAxis).name).toBe(baseInput.y.label)
    expect(grid.outerBoundsMode).toBe("same")
    expect(grid.outerBoundsContain).toBe("all")
    expect(grid.left).toBe(grid.right)
    expect(grid.top).toBe(grid.bottom)
  })

  test("uses token chrome and anti-signal-free tooltip and legend defaults", () => {
    const option = cartesianFrame(baseInput).option
    const tooltip = onlyOption(option.tooltip)
    const legend = onlyOption(option.legend)
    const yAxis = onlyOption(option.yAxis)

    expect(yAxis.axisLabel?.color).toBe(tokens.dim)
    expect(yAxis.axisLine?.lineStyle?.color).toBe(tokens.rule)
    expect(yAxis.splitLine?.lineStyle?.color).toBe(tokens.rule)
    expect(tooltip.backgroundColor).toBe(tokens.panel)
    expect(tooltip.extraCssText).toBe("box-shadow: none")
    expect(legend.icon).toBe("circle")
  })
})

describe("series marker", () => {
  test("is a flat filled circle with only the rule border", () => {
    expect(seriesMarker(tokens)).toEqual({
      symbol: "circle",
      symbolSize: 8,
      itemStyle: {
        borderColor: tokens.rule,
        borderWidth: 1,
      },
    })
  })
})
