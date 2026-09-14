import type { ChartOption } from "./registry.ts"
import type { ChartTokens } from "./theme.ts"

export interface AxisSpec {
  readonly label?: string
  readonly type?: "value" | "log" | "category"
  readonly categories?: readonly string[]
  readonly inverse?: boolean
  readonly interval?: number
  readonly format?: (value: number) => string
  readonly min?: number
  readonly max?: number
}

export interface CartesianFrameInput {
  readonly tokens: ChartTokens
  readonly title: string
  readonly x: AxisSpec
  readonly y: AxisSpec
  readonly format: (value: number) => string
  readonly gridBottom?: number
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

  const axisOption = (spec: AxisSpec) => {
    if (spec.type === "category") {
      if (spec.categories === undefined || spec.categories.length === 0) {
        throw new Error("the category axis needs categories")
      }

      return {
        type: spec.type,
        name: spec.label,
        data: [...spec.categories],
        axisLabel: {
          color: tokens.dim,
          fontSize: tokens.fontSizeMeta,
          fontFamily: tokens.fontFamily,
          hideOverlap: true,
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
      }
    }

    return {
      type: spec.type ?? "value",
      name: spec.label,
      min: spec.min,
      max: spec.max,
      inverse: spec.inverse ?? false,
      interval: spec.interval,
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
    }
  }

  // Four spacing units leave room for labels while keeping the plot compact.
  const gridMargin = 16

  // The frame styles tooltip chrome only; each builder chooses its trigger.
  const option: ChartOption = {
    grid: {
      left: gridMargin,
      right: gridMargin,
      top: gridMargin,
      // The Pareto builder reserves room under the plot for the dataZoom slider.
      bottom: input.gridBottom ?? gridMargin,
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
    title: input.title,
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
