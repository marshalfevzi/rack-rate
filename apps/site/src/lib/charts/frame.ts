// Numeric (value/log) axes only; a categorical axis is added by the stage that needs one.
import type { ChartOption } from "./registry.ts"
import type { ChartTokens } from "./theme.ts"
import type { CostBasisKind } from "../provenance.ts"
import { costBasisTerm } from "../provenance.ts"

export interface AxisSpec {
  readonly label?: string
  readonly type?: "value" | "log"
  readonly format?: (value: number) => string
  readonly min?: number
  readonly max?: number
}

export interface CartesianFrameInput {
  readonly tokens: ChartTokens
  readonly metric: string
  readonly basis: CostBasisKind
  readonly planName?: string
  readonly x: AxisSpec
  readonly y: AxisSpec
  readonly format: (value: number) => string
}

export interface CartesianFrame {
  readonly title: string
  readonly option: ChartOption
}

export interface SeriesMarker {
  readonly symbol: "circle"
  readonly symbolSize: number
  readonly itemStyle: { readonly borderColor: string; readonly borderWidth: number }
}

export function cartesianFrame(input: CartesianFrameInput): CartesianFrame {
  const { tokens } = input

  const axisOption = (spec: AxisSpec) => ({
    type: spec.type ?? "value",
    name: spec.label,
    min: spec.min,
    max: spec.max,
    axisLabel: {
      color: tokens.dim,
      fontSize: tokens.fontSizeMeta,
      fontFamily: tokens.fontFamily,
      hideOverlap: true,
      formatter: spec.format ?? input.format,
    },
    axisLine: {
      lineStyle: { color: tokens.rule },
    },
    axisTick: { show: false },
    splitLine: {
      lineStyle: { color: tokens.rule },
    },
    nameTextStyle: {
      color: tokens.dim,
      fontSize: tokens.fontSizeMeta,
      fontFamily: tokens.fontFamily,
    },
  })

  // Four spacing units leave room for labels while keeping the plot compact.
  const gridMargin = 16

  // The frame styles tooltip chrome only; each builder chooses its trigger.
  const option: ChartOption = {
    grid: {
      left: gridMargin,
      right: gridMargin,
      top: gridMargin,
      bottom: gridMargin,
      // `containLabel` is deprecated in ECharts 6; this is its documented
      // equivalent. `outerBoundsContain: "all"` is load-bearing: with
      // `"axisLabel"` ECharts skips axis-name layout during estimation
      // (`Grid.js`, `createOrUpdateAxesView`), so at these margins the y name
      // clipped in half at the canvas top and the x name fell off the right
      // edge — measured at 360 px and at 1280 px.
      outerBoundsMode: "same",
      outerBoundsContain: "all",
    },
    tooltip: {
      backgroundColor: tokens.panel,
      borderColor: tokens.rule,
      borderWidth: 1,
      textStyle: {
        color: tokens.ink,
        fontSize: tokens.fontSizeMeta,
        fontFamily: tokens.fontFamily,
      },
      extraCssText: "box-shadow: none",
    },
    legend: {
      icon: "circle",
      textStyle: {
        color: tokens.dim,
        fontSize: tokens.fontSizeMeta,
        fontFamily: tokens.fontFamily,
      },
    },
    xAxis: axisOption(input.x),
    yAxis: axisOption(input.y),
  }

  return {
    title: `${costBasisTerm(input.basis, input.planName).label} ${input.metric}`,
    option,
  }
}

export function seriesMarker(tokens: ChartTokens): SeriesMarker {
  // Mapping each series to its basis colour is the builder's job; theme.ts owns that mapping.

  return {
    symbol: "circle",
    symbolSize: 8,
    itemStyle: {
      borderColor: tokens.rule,
      borderWidth: 1,
    },
  }
}
