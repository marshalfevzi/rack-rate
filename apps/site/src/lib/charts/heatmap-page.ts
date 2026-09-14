// Browser-only module: it is loaded only from a dynamically imported client script.

import { decodeHeatmapPayload, heatmapAriaLabel } from "./heatmap-payload.ts"
import { heatmapOption } from "./heatmap.ts"
import { mountChart } from "./mount.ts"
import { readChartTokens } from "./theme.ts"

export function startHeatmapChart(host: HTMLElement): void {
  if (!host) {
    return
  }

  const dataNode = document.getElementById("heatmap-data")
  const titleNode = document.getElementById("heatmap-title")
  const noteNode = document.getElementById("heatmap-note")

  if (dataNode === null || titleNode === null || noteNode === null) {
    return
  }

  const encodedPayload = dataNode.textContent

  if (encodedPayload === null) {
    return
  }

  const payload = decodeHeatmapPayload(encodedPayload)

  const chart = heatmapOption({
    tokens: readChartTokens(host),
    payload,
  })

  mountChart(host, chart.option)
  titleNode.textContent = chart.title
  noteNode.textContent = payload.note
  host.setAttribute("aria-label", heatmapAriaLabel(payload))
}
