// Browser-only module: it is loaded only from the RadarSection client script.

import {
  OVERLAY_LIMIT,
  decodeRadarPayload,
  radarAriaLabel,
  radarEligibleModels,
  radarNote,
} from "./radar-payload.ts"
import { mountChart } from "./mount.ts"
import { radarChart } from "./radar.ts"
import { readChartTokens } from "./theme.ts"

export function startRadarChart(host: HTMLElement): void {
  if (!host) {
    return
  }

  const dataNode = document.getElementById("radar-data")
  const planSelect = document.querySelector<HTMLSelectElement>("#radar-plan")
  const titleNode = document.getElementById("radar-title")
  const noteNode = document.getElementById("radar-note")

  if (dataNode === null || planSelect === null || titleNode === null || noteNode === null) {
    return
  }

  const encodedPayload = dataNode.textContent

  if (encodedPayload === null) {
    return
  }

  const payload = decodeRadarPayload(encodedPayload)
  const initialView = payload.plans.find((plan) => plan.id === planSelect.value) ?? payload.plans[0]

  if (initialView === undefined) {
    return
  }

  const initialEligibleCount = radarEligibleModels(payload, initialView).length
  const initialSeriesCount = Math.min(initialEligibleCount, OVERLAY_LIMIT)

  let handle =
    initialSeriesCount === 0
      ? undefined
      : mountChart(
          host,
          radarChart({
            tokens: readChartTokens(host),
            payload,
            view: initialView,
          }).option,
        )

  titleNode.textContent = `per-index z for ${initialView.name}`
  noteNode.textContent = radarNote(payload, initialView, initialSeriesCount)
  host.setAttribute("aria-label", radarAriaLabel(payload, initialView, initialSeriesCount))

  const rebuild = (): void => {
    const view = payload.plans.find((plan) => plan.id === planSelect.value)

    if (view === undefined) {
      return
    }

    const eligibleCount = radarEligibleModels(payload, view).length
    const seriesCount = Math.min(eligibleCount, OVERLAY_LIMIT)

    titleNode.textContent = `per-index z for ${view.name}`
    noteNode.textContent = radarNote(payload, view, seriesCount)
    host.setAttribute("aria-label", radarAriaLabel(payload, view, seriesCount))

    if (seriesCount === 0) {
      handle?.dispose()
      handle = undefined
      host.replaceChildren()

      return
    }

    const chart = radarChart({
      tokens: readChartTokens(host),
      payload,
      view,
    })

    if (handle === undefined) {
      handle = mountChart(host, chart.option)
    } else {
      handle.update(chart.option)
    }
  }

  planSelect.addEventListener("change", rebuild)
}
