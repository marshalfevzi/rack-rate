import { paretoFrontier } from "@rack-rate/core/pareto"

import {
  formatCount,
  formatPercent,
  formatPoints,
  formatTokens,
  formatUsdPerTask,
} from "../format.ts"
import type { CostBasisKind } from "../provenance.ts"
import { cartesianFrame, seriesMarker } from "./frame.ts"
import type { ChartOption } from "./registry.ts"
import { basisTextColor, costBasisColor } from "./theme.ts"
import type { ChartTokens } from "./theme.ts"

export type BuilderChartType = "scatter" | "line" | "bar"

export type BuilderMetricKind =
  | "api-cost"
  | "plan-cost"
  | "tokens"
  | "steps"
  | "benchmark"
  | "composite"

export interface BuilderMetric {
  readonly kind: BuilderMetricKind
  readonly id: string
  readonly label: string
  readonly benchmarkId?: string
  readonly basis?: CostBasisKind
}

export interface BuilderPoint {
  readonly id: string
  readonly name: string
  readonly provider: string | null
  readonly effort: string | null
  readonly x: number
  readonly y: number
}

export interface BuilderConfig {
  readonly x: BuilderMetric
  readonly y: BuilderMetric
  readonly chartType: BuilderChartType
  readonly logX: boolean
  readonly frontier: boolean
}

export interface BuilderChart {
  readonly title: string
  readonly option: ChartOption
}

function isCostMetric(metric: BuilderMetric): metric is BuilderMetric & {
  readonly kind: "api-cost" | "plan-cost"
  readonly basis: CostBasisKind
} {
  return metric.kind === "api-cost" || metric.kind === "plan-cost"
}

function isScoreMetric(metric: BuilderMetric): boolean {
  return metric.kind === "benchmark" || metric.kind === "composite"
}

function metricFormat(metric: BuilderMetric): (value: number) => string {
  if (isCostMetric(metric)) {
    return formatUsdPerTask
  }

  if (metric.kind === "benchmark" || metric.kind === "composite") {
    return metric.kind === "composite" ? formatPoints : formatPercent
  }

  if (metric.kind === "tokens") {
    return formatTokens
  }

  return formatCount
}

function frontierData(points: readonly BuilderPoint[]): [number, number][] {
  const result = paretoFrontier(
    points.map((point) => ({ id: point.id, cost: point.x, score: point.y })),
  )

  const byId = new Map(points.map((point) => [point.id, point]))
  const data: [number, number][] = []

  for (const id of result.frontier) {
    const point = byId.get(id)

    if (point === undefined) {
      throw new Error(`builder frontier point ${id} is missing from the plotted points`)
    }

    data.push([point.x, point.y])
  }

  const last = data.at(-1)
  const maxX = Math.max(...points.map((point) => point.x))

  if (last === undefined || !Number.isFinite(maxX)) {
    throw new Error("builder frontier requires at least one finite point")
  }

  data.push([maxX * 1.4, last[1]])

  return data
}

export function builderOption(input: {
  readonly tokens: ChartTokens
  readonly points: readonly BuilderPoint[]
  readonly config: BuilderConfig
}): BuilderChart {
  const { config, points, tokens } = input

  if (points.length === 0) {
    throw new Error("builder chart requires at least one point")
  }

  if (config.chartType !== "scatter" && config.chartType !== "line" && config.chartType !== "bar") {
    throw new Error(`builder chart type ${config.chartType} is not registered`)
  }

  if (config.frontier && (!isCostMetric(config.x) || !isScoreMetric(config.y))) {
    throw new Error("builder frontier requires a cost x metric and score y metric")
  }

  if (
    (config.x.kind === "api-cost" || config.x.kind === "plan-cost") &&
    config.x.basis === undefined
  ) {
    throw new Error(`builder cost metric ${config.x.kind} has no cost basis`)
  }

  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new Error(`builder point ${point.id} has a non-finite coordinate`)
    }

    if (config.logX && point.x <= 0) {
      throw new Error(`builder log x axis requires a positive coordinate for ${point.id}`)
    }
  }

  const xFormat = metricFormat(config.x)
  const yFormat = metricFormat(config.y)
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))
  const xBasis = isCostMetric(config.x) ? config.x.basis : undefined
  const pointColor = xBasis === undefined ? tokens.ink : costBasisColor(tokens, xBasis)
  const xTextColor = xBasis === undefined ? tokens.dim : basisTextColor(tokens, xBasis)
  const xAxisMin = config.logX ? minX * 0.7 : Math.min(0, minX)
  const xAxisMax = config.logX ? maxX * 1.4 : maxX
  const yAxisMin = isScoreMetric(config.y) ? Math.max(0, Math.floor((minY - 4) / 5) * 5) : minY
  const yAxisMax = isScoreMetric(config.y) ? Math.min(100, Math.ceil((maxY + 4) / 5) * 5) : maxY

  const frame = cartesianFrame({
    tokens,
    title: `${config.y.label} vs ${config.x.label}`,
    x: {
      type: config.logX ? "log" : "value",
      label: config.x.label,
      format: xFormat,
      min: xAxisMin,
      max: xAxisMax,
    },
    y: {
      type: "value",
      label: config.y.label,
      format: yFormat,
      min: yAxisMin,
      max: yAxisMax,
    },
    format: xFormat,
  })

  const pointsInXOrder = [...points].sort(
    (left, right) => left.x - right.x || left.id.localeCompare(right.id),
  )

  const pointData = pointsInXOrder.map((point) => ({
    name: point.name,
    value: [point.x, point.y],
    itemStyle: { color: pointColor },
  }))

  const primarySeries = {
    type: config.chartType,
    name: config.y.label,
    ...seriesMarker(tokens),
    itemStyle: { color: pointColor, borderColor: tokens.rule, borderWidth: 1 },
    lineStyle: { color: pointColor, width: 1.5 },
    data: pointData,
  } satisfies ChartOption

  const frontierSeries = config.frontier
    ? [
        {
          type: "line",
          name: "Frontier",
          symbol: "none",
          showSymbol: false,
          lineStyle: { color: tokens.ink, width: 2 },
          itemStyle: { color: tokens.ink },
          areaStyle: { origin: "start", color: tokens.rule, opacity: 0.55 },
          data: frontierData(points),
        } satisfies ChartOption,
      ]
    : []

  const option = {
    ...frame.option,
    xAxis: {
      ...frame.option.xAxis,
      nameTextStyle: {
        color: xTextColor,
        fontFamily: tokens.fontFamily,
        fontSize: tokens.fontSizeMeta,
      },
    },
    legend: {
      ...frame.option.legend,
      data: config.frontier ? [config.y.label, "Frontier"] : [config.y.label],
    },
    tooltip: {
      ...frame.option.tooltip,
      trigger: "item",
    },
    series: [primarySeries, ...frontierSeries],
  } satisfies ChartOption

  return { title: frame.title, option }
}
