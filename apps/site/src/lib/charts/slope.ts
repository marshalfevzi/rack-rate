import { formatMultiple, formatUsdPerTask } from "../format.ts"
import { costBasisTerm } from "../provenance.ts"
import { cartesianFrame, seriesMarker } from "./frame.ts"
import type { ChartOption } from "./registry.ts"
import type { SlopeModel, SlopePayload, SlopeRoute } from "./slope-payload.ts"
import { costBasisColor } from "./theme.ts"
import type { ChartTokens } from "./theme.ts"

const X_CATEGORIES = ["API list $/task", "Plan route $/task"] as const

export interface SlopeChartInput {
  readonly tokens: ChartTokens
  readonly payload: SlopePayload
  readonly view: SlopeModel
}

export interface SlopeChart {
  readonly title: string
  readonly option: ChartOption
}

interface TooltipDatum {
  readonly route: SlopeRoute
  readonly cost: number
  readonly basisLabel: string
}

function chartTitle(view: SlopeModel): string {
  return `${view.name} · API list vs plan route`
}

export function slopeTooltipLines(
  view: SlopeModel,
  seriesName: string,
  dataIndex: number,
): string[] {
  const route = view.routes.find((candidate) => candidate.planName === seriesName)

  if (route === undefined || (dataIndex !== 0 && dataIndex !== 1)) {
    return []
  }

  const routeBasis = costBasisTerm("plan-route", route.planName)

  const datum: TooltipDatum = {
    route,
    cost: dataIndex === 0 ? route.apiCostPerTaskUsd : route.routeCostPerTaskUsd,
    basisLabel: dataIndex === 0 ? costBasisTerm("api-list").label : routeBasis.label,
  }

  return [
    view.name,
    routeBasis.label,
    `${datum.basisLabel} ${formatUsdPerTask(datum.cost)}/task`,
    `API list ${formatUsdPerTask(route.apiCostPerTaskUsd)}/task`,
    `${routeBasis.label} ${formatUsdPerTask(route.routeCostPerTaskUsd)}/task`,
    `${formatMultiple(route.savingsMultiple)} cheaper than API list`,
  ]
}

export function slopeChart(input: SlopeChartInput): SlopeChart {
  const { payload, tokens, view } = input

  if (view.routes.length === 0) {
    throw new Error(`slope chart requires at least one route for ${view.id}`)
  }

  if (X_CATEGORIES.length < 2) {
    throw new Error("slope chart requires at least two x-axis categories")
  }

  const frame = cartesianFrame({
    tokens,
    title: chartTitle(view),
    x: {
      type: "category",
      categories: X_CATEGORIES,
    },
    y: {
      type: "log",
      label: "$/task (API list → plan route)",
      format: formatUsdPerTask,
    },
    format: formatUsdPerTask,
    gridBottom: 44,
  })

  const apiColor = costBasisColor(tokens, "api-list")
  const routeColor = costBasisColor(tokens, "plan-route")
  const marker = seriesMarker(tokens)

  const series = view.routes.map(
    (route) =>
      ({
        type: "line",
        name: route.planName,
        z: 2,
        ...marker,
        lineStyle: { color: routeColor, width: 2 },
        itemStyle: { ...marker.itemStyle, color: routeColor },
        connectNulls: false,
        data: [
          { value: route.apiCostPerTaskUsd, itemStyle: { color: apiColor } },
          { value: route.routeCostPerTaskUsd, itemStyle: { color: routeColor } },
        ],
      }) satisfies ChartOption,
  )

  const option = {
    ...frame.option,
    legend: {
      ...frame.option.legend,
      data: view.routes.map((route) => route.planName),
    },
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

        return slopeTooltipLines(view, seriesName, params.dataIndex).join(" · ")
      },
    },
    series,
  } satisfies ChartOption

  // The payload is part of the builder input so this chart cannot accidentally
  // display a route belonging to a model outside the committed selector.
  if (!payload.models.some((model) => model.id === view.id)) {
    throw new Error(`slope chart view ${view.id} is missing from the payload`)
  }

  return { title: frame.title, option }
}
