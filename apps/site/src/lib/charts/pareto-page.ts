import type { CostBasisKind } from "../provenance.ts"
import type { ParetoBasisView, ParetoPayload } from "./pareto-payload.ts"
import { chartAriaLabel, decodeParetoPayload } from "./pareto-payload.ts"
import { mountChart } from "./mount.ts"
import { paretoScatter } from "./pareto.ts"
import { readChartTokens } from "./theme.ts"

function activeBasis(radios: NodeListOf<HTMLInputElement>): CostBasisKind {
  for (const radio of radios) {
    if (!radio.checked) {
      continue
    }

    if (radio.value === "plan-route") {
      return "plan-route"
    }

    return "api-list"
  }

  return "api-list"
}

function viewFor(
  payload: ParetoPayload,
  basis: CostBasisKind,
  planId: string,
): ParetoBasisView | undefined {
  let apiView: ParetoBasisView | undefined

  for (const view of payload.bases) {
    if (view.basis === "api-list") {
      apiView = view
    }

    if (view.basis === basis && (basis === "api-list" || view.planId === planId)) {
      return view
    }
  }

  return apiView
}

export function startParetoChart(host: HTMLElement): void {
  if (!host) {
    return
  }

  const dataNode = document.getElementById("pareto-data")
  const radios = document.querySelectorAll<HTMLInputElement>('input[name="pareto-basis"]')
  const planSelect = document.querySelector<HTMLSelectElement>("#pareto-plan")
  const titleNode = document.getElementById("pareto-title")
  const noteNode = document.getElementById("pareto-note")

  if (
    dataNode === null ||
    radios.length === 0 ||
    planSelect === null ||
    titleNode === null ||
    noteNode === null
  ) {
    return
  }

  const encodedPayload = dataNode.textContent

  if (encodedPayload === null) {
    return
  }

  const payload = decodeParetoPayload(encodedPayload)
  const basis = activeBasis(radios)
  const initialView = viewFor(payload, basis, planSelect.value)

  if (initialView === undefined) {
    return
  }

  const initialChart = paretoScatter({
    tokens: readChartTokens(host),
    scoreLabel: payload.scoreLabel,
    view: initialView,
  })

  const handle = mountChart(host, initialChart.option)

  titleNode.textContent = initialChart.title
  noteNode.textContent = initialView.note
  host.setAttribute("aria-label", chartAriaLabel(initialView))

  const rebuild = (): void => {
    const view = viewFor(payload, activeBasis(radios), planSelect.value)

    if (view === undefined) {
      return
    }

    const chart = paretoScatter({
      tokens: readChartTokens(host),
      scoreLabel: payload.scoreLabel,
      view,
    })

    handle.update(chart.option)
    titleNode.textContent = chart.title
    noteNode.textContent = view.note
    host.setAttribute("aria-label", chartAriaLabel(view))
  }

  for (const radio of radios) {
    radio.addEventListener("change", rebuild)
  }

  planSelect.addEventListener("change", rebuild)
}
