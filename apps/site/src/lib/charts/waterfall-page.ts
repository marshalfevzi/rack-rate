// Browser-only module: it is loaded only from dynamically imported client scripts.

import { decodeWaterfallPayload, waterfallAriaLabel } from "./waterfall-payload.ts"
import { mountChart, type ChartHandle } from "./mount.ts"
import { waterfallChart } from "./waterfall.ts"
import { readChartTokens } from "./theme.ts"

function taskInputValue(input: HTMLInputElement): number | null {
  const value = input.valueAsNumber

  if (!Number.isFinite(value) || value < 0) {
    return null
  }

  return value
}

export function startWaterfallChart(host: HTMLElement): void {
  if (!host) {
    return
  }

  const dataNode = document.getElementById("waterfall-data")
  const planSelect = document.querySelector<HTMLSelectElement>("#waterfall-plan")
  const utilizationInput = document.querySelector<HTMLInputElement>("#waterfall-utilization")
  const titleNode = document.getElementById("waterfall-title")
  const noteNode = document.getElementById("waterfall-note")

  if (
    dataNode === null ||
    planSelect === null ||
    utilizationInput === null ||
    titleNode === null ||
    noteNode === null
  ) {
    return
  }

  const encodedPayload = dataNode.textContent

  if (encodedPayload === null) {
    return
  }

  const payload = decodeWaterfallPayload(encodedPayload)
  let handle: ChartHandle | null = null

  const clearChart = (): void => {
    if (handle === null) {
      return
    }

    handle.dispose()
    handle = null
  }

  const rebuild = (resetUtilization: boolean): void => {
    const view = payload.plans.find((plan) => plan.planId === planSelect.value)

    if (view === undefined) {
      clearChart()

      return
    }

    if (resetUtilization) {
      utilizationInput.value = view.tasksPerMonth === null ? "" : String(view.tasksPerMonth)
    }

    const usedTasks = taskInputValue(utilizationInput)

    if (view.modelId === null || view.tasksPerMonth === null || view.tasksPerMonth <= 0) {
      clearChart()
      titleNode.textContent = `${view.planName} quota burn-down`
      noteNode.textContent = view.reason ?? payload.note
      host.setAttribute("aria-label", waterfallAriaLabel(payload, view, 0))

      return
    }

    if (usedTasks === null) {
      clearChart()
      titleNode.textContent = `${view.planName} quota burn-down · ${view.modelName ?? ""}`
      noteNode.textContent = "Enter a non-negative number of tasks per month to draw this chart."
      host.setAttribute("aria-label", waterfallAriaLabel(payload, view, 0))

      return
    }

    const chart = waterfallChart({
      tokens: readChartTokens(host),
      payload,
      view,
      usedTasks,
    })

    if (handle === null) {
      handle = mountChart(host, chart.option)
    } else {
      handle.update(chart.option)
    }

    titleNode.textContent = chart.title
    noteNode.textContent = payload.note
    host.setAttribute("aria-label", waterfallAriaLabel(payload, view, usedTasks))
  }

  rebuild(false)
  planSelect.addEventListener("change", () => rebuild(true))
  utilizationInput.addEventListener("input", () => rebuild(false))
}
