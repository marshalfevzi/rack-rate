import { describe, expect, test } from "bun:test"

import { formatPercent, formatUsdPerTask } from "../format.ts"
import { costBasisColor } from "./theme.ts"
import { paretoScatter, paretoTooltipLines } from "./pareto.ts"
import type { ParetoBasisView } from "./pareto-payload.ts"
import type { ChartOption } from "./registry.ts"
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

const view: ParetoBasisView = {
  basis: "api-list",
  planId: null,
  planName: null,
  points: [
    { id: "cheap", name: "Cheap Model", cost: 1, score: 60, onFrontier: true, labelled: false },
    { id: "leader", name: "Leader Model", cost: 2, score: 74, onFrontier: true, labelled: true },
    {
      id: "dominated",
      name: "Dominated Model",
      cost: 4,
      score: 20,
      onFrontier: false,
      labelled: false,
    },
  ],
  frontier: ["cheap", "leader"],
  trails: [
    {
      modelId: "leader",
      name: "Leader Model",
      points: [
        { cost: 1.25, score: 55, effort: "high" },
        { cost: 2, score: 74, effort: "xhigh" },
      ],
    },
  ],
  note: "API list rates",
}

interface DataEntry {
  readonly value?: readonly number[]
  readonly name?: string
}

type SeriesData = DataEntry | readonly number[]

interface SeriesEntry {
  readonly type?: string
  readonly name?: string
  readonly data?: readonly SeriesData[]
  readonly itemStyle?: { readonly color?: string }
  readonly areaStyle?: { readonly origin?: string }
}

interface DataZoomEntry {
  readonly type?: string
  readonly borderColor?: string
  readonly handleStyle?: { readonly color?: string }
  readonly dataBackground?: { readonly lineStyle?: { readonly color?: string } }
}

interface RenderedOption {
  readonly legend?: { readonly data?: readonly string[] }
  readonly series?: SeriesEntry | readonly SeriesEntry[]
  readonly dataZoom?: readonly DataZoomEntry[]
}

function onlyOption<T>(value: T | T[] | undefined): T {
  if (value === undefined) {
    throw new Error("expected one option")
  }

  if (value instanceof Array) {
    const first = value[0]

    if (first === undefined) {
      throw new Error("expected a non-empty option")
    }

    return first
  }

  return value
}

function seriesOf(option: ChartOption): readonly SeriesEntry[] {
  // SAFETY: tests inspect only the documented ECharts series field.
  const renderedOption = option as RenderedOption
  const series = renderedOption.series

  if (series === undefined) {
    return []
  }

  return series instanceof Array ? series : [series]
}

describe("Pareto scatter", () => {
  test("builds bounded log axes, frontier shading, legend, zoom, and trails", () => {
    const chart = paretoScatter({ tokens, scoreLabel: "DeepSWE v1.1 pass@1 (%)", view })
    // SAFETY: tests inspect only these documented ECharts option fields.
    const option = chart.option as RenderedOption
    const grid = onlyOption(chart.option.grid)
    const xAxis = onlyOption(chart.option.xAxis)
    const yAxis = onlyOption(chart.option.yAxis)
    const series = seriesOf(chart.option)
    const frontier = series[1]
    const slider = option.dataZoom?.find((entry) => entry.type === "slider")

    expect(grid.bottom).toBe(44)
    expect(xAxis.type).toBe("log")
    expect(xAxis.min).toBe(0.7)
    expect(xAxis.max).toBe(5.6)
    expect(yAxis.name).toBe("DeepSWE v1.1 pass@1 (%)")
    expect(series[0]?.type).toBe("scatter")
    expect(series[0]?.name).toBe("Best effort")
    expect(series.filter((entry) => entry.type === "scatter")).toHaveLength(1)
    expect(series.filter((entry) => entry.type === "line")).toHaveLength(2)
    expect(frontier?.data?.at(-1)).toEqual([5.6, 74])
    expect(frontier?.areaStyle?.origin).toBe("start")
    expect(frontier?.itemStyle?.color).toBe(tokens.ink)
    expect(slider?.borderColor).toBe(tokens.rule)
    expect(slider?.handleStyle?.color).toBe(tokens.dim)
    expect(slider?.dataBackground?.lineStyle?.color).toBe(tokens.rule)
    expect(onlyOption(option.legend).data).toEqual(["Best effort", "Frontier"])
    expect(option.dataZoom?.map((entry) => entry.type)).toEqual(["inside", "slider"])
  })

  test("uses the named route in the title and adjusted colour", () => {
    const routeView: ParetoBasisView = {
      ...view,
      basis: "plan-route",
      planId: "ollama-pro",
      planName: "Ollama Pro",
      trails: [],
    }

    const chart = paretoScatter({ tokens, scoreLabel: "score", view: routeView })
    const scatter = seriesOf(chart.option)[0]

    expect(chart.title).toBe("Ollama Pro route $/task")
    expect(scatter?.itemStyle?.color).toBe(costBasisColor(tokens, "plan-route"))
    expect(seriesOf(chart.option).filter((entry) => entry.type === "line")).toHaveLength(1)
  })

  test("rejects a non-positive point cost by id", () => {
    const invalidView: ParetoBasisView = {
      ...view,
      points: view.points.map((point) => (point.id === "leader" ? { ...point, cost: 0 } : point)),
    }

    expect(() => paretoScatter({ tokens, scoreLabel: "score", view: invalidView })).toThrow(
      "leader",
    )
  })

  test("formats model, score, cost, basis, and effort in a trail tooltip", () => {
    const lines = paretoTooltipLines(view, "Leader Model effort", 1)

    expect(lines).toContain("Leader Model")
    expect(lines).toContain(formatPercent(74))
    expect(lines).toContain(formatUsdPerTask(2))
    expect(lines).toContain("API list")
    expect(lines).toContain("xhigh")
  })
})
