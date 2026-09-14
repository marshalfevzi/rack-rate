import { formatZ } from "../format.ts"
import type { ChartOption } from "./registry.ts"
import {
  OVERLAY_LIMIT,
  radarEligibleModels,
  type RadarPayload,
  type RadarView,
  weightedZ,
} from "./radar-payload.ts"
import type { ChartTokens } from "./theme.ts"

export interface RadarChartInput {
  readonly tokens: ChartTokens
  readonly payload: RadarPayload
  readonly view: RadarView
}

export interface RadarChart {
  readonly title: string
  readonly option: ChartOption
}

function tooltipText(payload: RadarPayload, seriesName: string): string {
  const model = payload.models.find((candidate) => candidate.name === seriesName)

  if (model === undefined) {
    return ""
  }

  const lines: string[] = [seriesName]

  for (const axis of payload.axes) {
    const value = model.z[axis.benchmarkId]

    if (value === undefined) {
      continue
    }

    lines.push(`${axis.label} (z): ${formatZ(value)}`)
  }

  return lines.join("<br />")
}

export function radarChart(input: RadarChartInput): RadarChart {
  const { payload, tokens, view } = input

  if (payload.axes.length === 0) {
    throw new Error("radar chart requires at least one benchmark axis")
  }

  const eligibleModels = [...radarEligibleModels(payload, view)]
  eligibleModels.sort((left, right) => {
    const weightedOrder = weightedZ(right, payload.axes) - weightedZ(left, payload.axes)

    if (weightedOrder !== 0) {
      return weightedOrder
    }

    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0
  })

  const overlaidModels = eligibleModels.slice(0, OVERLAY_LIMIT)

  if (overlaidModels.length === 0) {
    throw new Error(`radar chart has no fully evaluated model for ${view.name}`)
  }

  const series = overlaidModels.map((model) => {
    const values = payload.axes.map((axis) => {
      const value = model.z[axis.benchmarkId]

      if (value === undefined) {
        throw new Error(`radar chart has no z value for ${model.id} on ${axis.benchmarkId}`)
      }

      return value
    })

    return {
      type: "radar",
      name: model.name,
      data: [{ value: values }],
      symbol: "circle",
      symbolSize: 5,
      lineStyle: { color: tokens.measured, width: 1, opacity: 0.8 },
      areaStyle: { color: tokens.measured, opacity: 0.12 },
    } satisfies ChartOption
  })

  const option = {
    radar: {
      indicator: payload.axes.map((axis) => ({
        name: `${axis.label} (z)`,
        min: axis.min,
        max: axis.max,
      })),
      radius: "65%",
      axisName: {
        color: tokens.dim,
        fontSize: tokens.fontSizeMeta,
        fontFamily: tokens.fontFamily,
      },
      splitLine: { lineStyle: { color: tokens.rule } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: tokens.rule } },
    },

    legend: {
      show: true,
      icon: "circle",
      textStyle: {
        color: tokens.dim,
        fontSize: tokens.fontSizeMeta,
        fontFamily: tokens.fontFamily,
      },
    },
    tooltip: {
      trigger: "item",
      backgroundColor: tokens.panel,
      borderColor: tokens.rule,
      borderWidth: 1,
      textStyle: {
        color: tokens.ink,
        fontSize: tokens.fontSizeMeta,
        fontFamily: tokens.fontFamily,
      },
      extraCssText: "box-shadow: none",
      formatter: (params) => {
        if (!("seriesName" in params)) {
          return ""
        }

        const seriesName = params.seriesName

        if (seriesName === undefined) {
          return ""
        }

        return tooltipText(payload, seriesName)
      },
    },
    series,
  } satisfies ChartOption

  return {
    title: `per-index z for ${view.name}`,
    option,
  }
}
