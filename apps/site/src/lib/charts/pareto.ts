import { formatPercent, formatUsdPerTask } from "../format.ts"
import { costBasisTerm } from "../provenance.ts"
import { cartesianFrame, seriesMarker } from "./frame.ts"
import type { ChartOption } from "./registry.ts"
import { costBasisColor } from "./theme.ts"
import type { ChartTokens } from "./theme.ts"
import type { ParetoBasisView } from "./pareto-payload.ts"

export interface ParetoScatterInput {
  readonly tokens: ChartTokens
  readonly scoreLabel: string
  readonly view: ParetoBasisView
}

export interface ParetoScatter {
  readonly title: string
  readonly option: ChartOption
}

interface TooltipDatum {
  readonly name: string
  readonly score: number
  readonly cost: number
  readonly effort?: string
}

export function paretoTooltipLines(
  view: ParetoBasisView,
  seriesName: string,
  index: number,
): string[] {
  let datum: TooltipDatum | undefined

  if (seriesName === "Best effort") {
    const point = view.points[index]

    if (point !== undefined) {
      datum = { name: point.name, score: point.score, cost: point.cost }
    }
  } else if (seriesName === "Frontier") {
    const frontierId = view.frontier[index]

    if (frontierId !== undefined) {
      const point = view.points.find((candidate) => candidate.id === frontierId)

      if (point !== undefined) {
        datum = { name: point.name, score: point.score, cost: point.cost }
      }
    }
  } else {
    const trail = view.trails.find((candidate) => seriesName === `${candidate.name} effort`)

    if (trail !== undefined) {
      const point = trail.points[index]

      if (point !== undefined) {
        datum = { name: trail.name, score: point.score, cost: point.cost, effort: point.effort }
      }
    }
  }

  if (datum === undefined) {
    return []
  }

  const lines = [
    datum.name,
    formatPercent(datum.score),
    formatUsdPerTask(datum.cost),
    costBasisTerm(view.basis, view.planName ?? undefined).label,
  ]

  if (datum.effort !== undefined) {
    lines.push(datum.effort)
  }

  return lines
}

export function paretoScatter(input: ParetoScatterInput): ParetoScatter {
  const { tokens, view } = input

  if (view.points.length === 0) {
    throw new Error("Pareto chart requires at least one point")
  }

  let minCost = Number.POSITIVE_INFINITY
  let maxCost = Number.NEGATIVE_INFINITY
  let minScore = Number.POSITIVE_INFINITY
  let maxScore = Number.NEGATIVE_INFINITY

  for (const point of view.points) {
    if (!Number.isFinite(point.cost) || point.cost <= 0) {
      throw new Error(`Pareto point ${point.id} has a non-positive or non-finite cost`)
    }

    minCost = Math.min(minCost, point.cost)
    maxCost = Math.max(maxCost, point.cost)
    minScore = Math.min(minScore, point.score)
    maxScore = Math.max(maxScore, point.score)
  }

  const frame = cartesianFrame({
    tokens,
    title: `${costBasisTerm(view.basis, view.planName ?? undefined).label} $/task`,
    x: {
      type: "log",
      label: "$/task",
      format: formatUsdPerTask,
      min: minCost * 0.7,
      max: maxCost * 1.4,
    },
    y: {
      type: "value",
      label: input.scoreLabel,
      format: formatPercent,
      min: Math.max(0, Math.floor((minScore - 4) / 5) * 5),
      max: Math.min(100, Math.ceil((maxScore + 4) / 5) * 5),
    },
    format: formatUsdPerTask,
    gridBottom: 44,
  })

  const basisColor = costBasisColor(tokens, view.basis)

  const scatterData = view.points.map((point) => ({
    value: [point.cost, point.score],
    name: point.name,
    label: point.labelled
      ? {
          show: true,
          position: "top",
          formatter: "{b}",
          color: tokens.dim,
          fontSize: tokens.fontSizeMeta,
          fontFamily: tokens.fontFamily,
        }
      : { show: false },
  }))

  const frontierData: [number, number][] = []

  for (const frontierId of view.frontier) {
    const point = view.points.find((candidate) => candidate.id === frontierId)

    if (point === undefined) {
      throw new Error(`Pareto frontier point ${frontierId} is missing from the view`)
    }

    frontierData.push([point.cost, point.score])
  }

  const lastFrontierPoint = frontierData.at(-1)

  if (lastFrontierPoint === undefined) {
    throw new Error("Pareto chart requires at least one frontier point")
  }

  frontierData.push([maxCost * 1.4, lastFrontierPoint[1]])

  const trailSeries = view.trails.map(
    (trail) =>
      ({
        type: "line",
        name: `${trail.name} effort`,
        z: 1,
        symbol: "circle",
        symbolSize: 4,
        lineStyle: { color: basisColor, width: 1, type: "dashed", opacity: 0.45 },
        itemStyle: { color: basisColor, opacity: 0.6 },
        data: trail.points.map((point) => ({
          value: [point.cost, point.score],
          name: point.effort,
        })),
      }) satisfies ChartOption,
  )

  const option = {
    ...frame.option,
    legend: { ...frame.option.legend, data: ["Best effort", "Frontier"] },
    dataZoom: [
      { type: "inside", xAxisIndex: 0 },
      // The slider is chart chrome; ECharts' default palette is not this site's.
      {
        type: "slider",
        xAxisIndex: 0,
        height: 18,
        bottom: 0,
        borderColor: tokens.rule,
        backgroundColor: tokens.canvas,
        fillerColor: tokens.rule,
        handleStyle: { color: tokens.dim, borderColor: tokens.rule },
        moveHandleStyle: { color: tokens.dim },
        dataBackground: {
          lineStyle: { color: tokens.rule },
          areaStyle: { color: tokens.rule },
        },
        selectedDataBackground: {
          lineStyle: { color: tokens.dim },
          areaStyle: { color: tokens.dim },
        },
        emphasis: {
          handleStyle: { color: tokens.ink },
          moveHandleStyle: { color: tokens.ink },
        },
        textStyle: {
          color: tokens.dim,
          fontFamily: tokens.fontFamily,
          fontSize: tokens.fontSizeMeta,
        },
        brushSelect: false,
      },
    ],
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

        return paretoTooltipLines(input.view, seriesName, params.dataIndex).join(" · ")
      },
    },
    series: [
      {
        type: "scatter",
        name: "Best effort",
        z: 3,
        ...seriesMarker(tokens),
        itemStyle: { color: basisColor, borderColor: tokens.rule, borderWidth: 1 },
        labelLayout: { hideOverlap: true },
        data: scatterData,
      },
      {
        type: "line",
        name: "Frontier",
        z: 2,
        symbol: "none",
        showSymbol: false,
        lineStyle: { color: tokens.ink, width: 2 },
        itemStyle: { color: tokens.ink },
        areaStyle: { origin: "start", color: tokens.rule, opacity: 0.55 },
        data: frontierData,
      },
      ...trailSeries,
    ],
  } satisfies ChartOption

  return { title: frame.title, option }
}
