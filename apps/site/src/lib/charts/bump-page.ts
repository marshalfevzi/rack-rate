// Browser-only module: it is loaded only from dynamically imported client scripts.

import { decodeBumpPayload } from "./bump-payload.ts"
import { bumpChart } from "./bump.ts"
import { mountChart } from "./mount.ts"
import { readChartTokens } from "./theme.ts"

export function startBumpChart(host: HTMLElement): void {
  if (!host) {
    return
  }

  const dataNode = document.getElementById("bump-data")

  if (dataNode === null) {
    return
  }

  const encodedPayload = dataNode.textContent

  if (encodedPayload === null) {
    return
  }

  const payload = decodeBumpPayload(encodedPayload)

  const chart = bumpChart({
    tokens: readChartTokens(host),
    payload,
  })

  mountChart(host, chart.option)
}
