import { formatFractionAsPercent, formatTasksPerMonth } from "../format.ts"
import { cartesianFrame } from "./frame.ts"
import type { ChartOption } from "./registry.ts"
import type { ChartTokens } from "./theme.ts"
import type { WaterfallPayload, WaterfallPlan } from "./waterfall-payload.ts"

export interface WaterfallChartInput {
  readonly tokens: ChartTokens
  readonly payload: WaterfallPayload
  readonly view: WaterfallPlan
  readonly usedTasks: number
}

export interface WaterfallChart {
  readonly title: string
  readonly option: ChartOption
}

function tooltipLines(view: WaterfallPlan, usedTasks: number): string[] {
  const quota = view.tasksPerMonth

  if (quota === null || quota <= 0) {
    return []
  }

  const remaining = Math.max(quota - usedTasks, 0)
  const deficit = Math.max(usedTasks - quota, 0)

  const lines = [
    `Quota: ${formatTasksPerMonth(quota)} tasks per month`,
    `Used: ${formatTasksPerMonth(usedTasks)} tasks per month`,
    `Remaining: ${formatTasksPerMonth(remaining)} tasks per month`,
    `U = ${formatFractionAsPercent(usedTasks / quota)}`,
  ]

  if (deficit > 0) {
    lines.push(`Deficit: ${formatTasksPerMonth(deficit)} tasks per month not covered by the quota`)
  }

  return lines
}

export function waterfallChart(input: WaterfallChartInput): WaterfallChart {
  const { tokens, view, usedTasks } = input

  if (view.modelId === null) {
    throw new Error("waterfall chart requires a plan with a priced model route")
  }

  if (view.modelName === null) {
    throw new Error("waterfall chart requires the priced route's model name")
  }

  if (
    view.tasksPerMonth === null ||
    !Number.isFinite(view.tasksPerMonth) ||
    view.tasksPerMonth <= 0
  ) {
    throw new Error("waterfall chart requires a positive tasks-per-month quota")
  }

  if (!Number.isFinite(usedTasks) || usedTasks < 0) {
    throw new Error("waterfall chart requires a non-negative finite task count")
  }

  const quota = view.tasksPerMonth
  const exceeded = usedTasks > quota

  const categories = exceeded
    ? ["Quota", "Used", "Remaining", "Deficit"]
    : ["Quota", "Used", "Remaining"]

  const usedBar = Math.min(usedTasks, quota)
  const remaining = Math.max(quota - usedTasks, 0)
  const deficit = exceeded ? -(usedTasks - quota) : 0
  const title = `${view.planName} quota burn-down · ${view.modelName}`

  const frame = cartesianFrame({
    tokens,
    title,
    x: {
      type: "category",
      categories,
    },
    y: {
      type: "value",
      label: "Tasks per month",
      format: formatTasksPerMonth,
      min: exceeded ? deficit : 0,
      max: quota,
    },
    format: formatTasksPerMonth,
  })

  const option = {
    ...frame.option,
    legend: { ...frame.option.legend, show: false },
    tooltip: {
      ...frame.option.tooltip,
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: () => tooltipLines(view, usedTasks).join(" · "),
    },
    series: [
      {
        type: "bar",
        name: "Base",
        stack: "wf",
        silent: true,
        itemStyle: { color: "transparent" },
        data: exceeded ? [0, 0, usedTasks, 0] : [0, 0, usedTasks],
      },
      {
        type: "bar",
        name: "Quota",
        stack: "wf",
        itemStyle: { color: tokens.dim },
        data: exceeded ? [quota, 0, 0, 0] : [quota, 0, 0],
      },
      {
        type: "bar",
        name: "Used",
        stack: "wf",
        itemStyle: { color: tokens.adjusted },
        data: exceeded ? [0, usedBar, 0, 0] : [0, usedBar, 0],
      },
      {
        type: "bar",
        name: "Remaining",
        stack: "wf",
        itemStyle: { color: tokens.measured },
        data: exceeded ? [0, 0, remaining, 0] : [0, 0, remaining],
      },
      ...(exceeded
        ? [
            {
              type: "bar" as const,
              name: "Deficit",
              stack: "wf",
              itemStyle: { color: tokens.adjusted },
              data: [0, 0, 0, deficit],
            },
          ]
        : []),
    ],
  } satisfies ChartOption

  return { title: frame.title, option }
}
