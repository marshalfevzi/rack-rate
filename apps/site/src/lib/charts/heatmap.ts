import type { VisualMapComponentOption } from "echarts/components"
import { formatZ } from "../format.ts"
import { cartesianFrame } from "./frame.ts"
import type { ChartOption } from "./registry.ts"
import type { ChartTokens } from "./theme.ts"
import type { HeatmapPayload } from "./heatmap-payload.ts"

export interface HeatmapInput {
  readonly tokens: ChartTokens
  readonly payload: HeatmapPayload
}

export interface HeatmapChart {
  readonly title: string
  readonly option: ChartOption
}

interface HeatmapTooltipDatum {
  readonly modelId: string
  readonly benchmarkTitle: string
  readonly z: number | null
}

function tooltipDatum(
  payload: HeatmapPayload,
  seriesName: string,
  dataIndex: number,
): HeatmapTooltipDatum | undefined {
  if (seriesName === "Not evaluated") {
    const cell = payload.missing[dataIndex]

    if (cell === undefined) {
      return undefined
    }

    const benchmarkTitle = payload.columns[cell[0]]
    const modelId = payload.rows[cell[1]]

    if (benchmarkTitle === undefined || modelId === undefined) {
      return undefined
    }

    return { modelId, benchmarkTitle, z: null }
  }

  if (seriesName !== "z-score") {
    return undefined
  }

  const cell = payload.cells[dataIndex]

  if (cell === undefined) {
    return undefined
  }

  const benchmarkTitle = payload.columns[cell[0]]
  const modelId = payload.rows[cell[1]]

  if (benchmarkTitle === undefined || modelId === undefined) {
    return undefined
  }

  return { modelId, benchmarkTitle, z: cell[2] }
}

function tooltipText(payload: HeatmapPayload, seriesName: string, dataIndex: number): string {
  const datum = tooltipDatum(payload, seriesName, dataIndex)

  if (datum === undefined) {
    return ""
  }

  if (datum.z === null) {
    return `not evaluated in ${datum.benchmarkTitle}`
  }

  return `${datum.modelId} · ${datum.benchmarkTitle} · z ${formatZ(datum.z)}`
}

export function heatmapOption(input: HeatmapInput): HeatmapChart {
  const { payload, tokens } = input

  if (
    payload.columns.length === 0 ||
    payload.rows.length === 0 ||
    payload.cells.length === 0 ||
    payload.missing.length + payload.cells.length === 0
  ) {
    throw new Error("heatmap chart requires non-empty columns, rows, and cells")
  }

  const frame = cartesianFrame({
    tokens,
    title: payload.title,
    x: {
      type: "category",
      categories: payload.columns,
      label: "Benchmark version",
    },
    y: {
      type: "category",
      categories: payload.rows,
      label: "Model",
    },
    format: formatZ,
    // The axis labels, the x-axis name, and the visualMap bar are three stacked
    // bands under the grid; 16 spacing units put the bar on top of the labels.
    gridBottom: 76,
  })

  // API ink is the cool endpoint and adjusted is the warm endpoint: both are
  // existing theme tokens readable in dark and light schemes. The panel colour
  // is the neutral midpoint, while symmetric -2…+2 bounds place zero at center.
  const visualMap = {
    type: "continuous",
    min: -2,
    max: 2,
    calculable: true,
    orient: "horizontal",
    left: "center",
    bottom: 0,
    inRange: { color: [tokens.apiInk, tokens.panel, tokens.adjusted] },
    textStyle: {
      color: tokens.dim,
      fontSize: tokens.fontSizeMeta,
      fontFamily: tokens.fontFamily,
    },
  } satisfies VisualMapComponentOption

  // The builder has no canvas layout to measure; this fixed square is the
  // accepted bound for a hatch that stays distinct from every real cell.
  const missingSeries = {
    type: "scatter",
    name: "Not evaluated",
    xAxisIndex: 0,
    yAxisIndex: 0,
    data: payload.missing,
    symbol: "rect",
    symbolSize: [18, 18],
    itemStyle: {
      color: "transparent",
      borderColor: tokens.rule,
      borderWidth: 1,
      decal: {
        symbol: "rect",
        dashArrayX: [1, 0],
        dashArrayY: [2, 5],
        rotation: -Math.PI / 4,
      },
    },
    tooltip: { trigger: "item" },
  }

  const option = {
    ...frame.option,
    // The legend and the visualMap both anchor to the canvas bottom, and the
    // legend's default centre slot put its swatches and both series names on
    // top of the colour bar. Opposing corners keep them apart.
    legend: { ...frame.option.legend, left: "right", right: 0, bottom: 0 },
    visualMap,
    tooltip: {
      ...frame.option.tooltip,
      trigger: "item",
      formatter: (params) => {
        if (!("seriesName" in params) || !("dataIndex" in params)) {
          return ""
        }

        const seriesName = params.seriesName

        if (seriesName === undefined) {
          return ""
        }

        return tooltipText(payload, seriesName, params.dataIndex)
      },
    },
    series: [
      {
        type: "heatmap",
        name: "z-score",
        data: payload.cells,
        itemStyle: { borderColor: tokens.rule, borderWidth: 1 },
      },
      missingSeries,
    ],
  } satisfies ChartOption

  return { title: frame.title, option }
}
