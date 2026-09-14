import {
  decodeSlopePayload,
  slopeAriaLabel,
  slopeNote,
  type SlopeModel,
  type SlopePayload,
} from "./slope-payload.ts"
import { mountChart, type ChartHandle } from "./mount.ts"
import { slopeChart } from "./slope.ts"
import { readChartTokens } from "./theme.ts"

function modelFor(payload: SlopePayload, modelId: string): SlopeModel | undefined {
  return payload.models.find((model) => model.id === modelId)
}

export function startSlopeChart(host: HTMLElement): void {
  if (!host) {
    return
  }

  const dataNode = document.getElementById("slope-data")
  const modelSelect = document.querySelector<HTMLSelectElement>("#slope-model")
  const titleNode = document.getElementById("slope-title")
  const noteNode = document.getElementById("slope-note")

  if (dataNode === null || modelSelect === null || titleNode === null || noteNode === null) {
    return
  }

  const encodedPayload = dataNode.textContent

  if (encodedPayload === null) {
    return
  }

  const payload = decodeSlopePayload(encodedPayload)
  let handle: ChartHandle | undefined

  const rebuild = (): void => {
    const view = modelFor(payload, modelSelect.value)

    if (view === undefined) {
      return
    }

    titleNode.textContent = `${view.name} · API list vs plan route`
    noteNode.textContent = slopeNote(view)
    host.setAttribute("aria-label", slopeAriaLabel(payload, view))

    if (view.routes.length === 0) {
      handle?.dispose()
      handle = undefined
      host.replaceChildren()

      return
    }

    const chart = slopeChart({
      tokens: readChartTokens(host),
      payload,
      view,
    })

    titleNode.textContent = chart.title

    if (handle === undefined) {
      handle = mountChart(host, chart.option)
    } else {
      handle.update(chart.option)
    }
  }

  rebuild()
  modelSelect.addEventListener("change", rebuild)
}
