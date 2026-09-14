// Browser-only module: it is loaded only from the dynamic import on /explore.
import { COMPOSITE_CENTER, COMPOSITE_SPREAD } from "@rack-rate/core/normalize"

import { formatCount, formatPercent } from "../format.ts"
import { costBasisTerm } from "../provenance.ts"
import { builderOption } from "./builder.ts"
import type { BuilderChartType, BuilderMetric, BuilderPoint } from "./builder.ts"
import { mountChart } from "./mount.ts"
import type { ChartHandle } from "./mount.ts"
import { readChartTokens } from "./theme.ts"

interface BuilderBenchmarkRow {
  readonly model_id: string
  readonly score: number
  readonly z: number
}

interface BuilderBenchmark {
  readonly id: string
  readonly version: string
  readonly title: string
  readonly rows: readonly BuilderBenchmarkRow[]
}

interface BuilderModel {
  readonly id: string
  readonly name: string
  readonly provider: string | null
  readonly reasoning_effort: string | null
  readonly api_cost_per_task_usd: number
  readonly tokens_per_task: number
  readonly steps_per_task: number
  readonly plan_cost_per_task_usd: number | null
}

interface BuilderPayload {
  readonly models: readonly BuilderModel[]
  readonly benchmarks: readonly BuilderBenchmark[]
  readonly initial_weights: readonly number[]
}

interface BuilderState {
  y: string
  x: string
  chartType: BuilderChartType
  vendor: string
  effort: string
  floor: number
  logX: boolean
  frontier: boolean
  weights: number[]
}

interface CompositeValue {
  readonly value: number | null
  readonly singleSource: boolean
  readonly noWeight: boolean
}

function decodePayload(json: string): BuilderPayload {
  // SAFETY: this string is written by this repository's own template in the same
  // build, so no external producer can reach this client decoder; the array
  // checks below reject anything that is not a BuilderPayload before it returns.
  const parsed = JSON.parse(json) as BuilderPayload

  if (
    !Array.isArray(parsed?.models) ||
    !Array.isArray(parsed.benchmarks) ||
    parsed.benchmarks.length === 0 ||
    !Array.isArray(parsed.initial_weights) ||
    parsed.initial_weights.length !== parsed.benchmarks.length
  ) {
    throw new Error("builder payload is incomplete")
  }

  return parsed
}

function isChartType(value: string): value is BuilderChartType {
  return value === "scatter" || value === "line" || value === "bar"
}

function isCostSelection(value: string): boolean {
  return value === "api-cost" || value === "plan-cost"
}

// A duplicate id at another version moves selector keys to id@version alongside the reader.
function isScoreSelection(value: string, benchmarks: readonly BuilderBenchmark[]): boolean {
  if (value === "composite") {
    return true
  }

  if (!value.startsWith("score:")) {
    return false
  }

  const benchmarkId = value.slice("score:".length)

  return benchmarks.some((benchmark) => benchmark.id === benchmarkId)
}

function benchmarkForSelection(
  value: string,
  benchmarks: readonly BuilderBenchmark[],
): BuilderBenchmark | undefined {
  if (!value.startsWith("score:")) {
    return undefined
  }

  const benchmarkId = value.slice("score:".length)

  return benchmarks.find((benchmark) => benchmark.id === benchmarkId)
}

function metricForY(value: string, payload: BuilderPayload): BuilderMetric {
  const benchmark = benchmarkForSelection(value, payload.benchmarks)

  if (benchmark !== undefined) {
    return {
      kind: "benchmark",
      id: value,
      benchmarkId: benchmark.id,
      label: `${benchmark.title} score`,
    }
  }

  if (value === "composite") {
    return { kind: "composite", id: value, label: "Composite T" }
  }

  if (value === "tokens") {
    return { kind: "tokens", id: value, label: "Tokens per task" }
  }

  if (value === "steps") {
    return { kind: "steps", id: value, label: "Steps per task" }
  }

  throw new Error(`unknown builder y metric ${value}`)
}

function metricForX(value: string, payload: BuilderPayload): BuilderMetric {
  const benchmark = benchmarkForSelection(value, payload.benchmarks)

  if (value === "api-cost") {
    return {
      kind: "api-cost",
      id: value,
      label: `${costBasisTerm("api-list").label} $/task`,
      basis: "api-list",
    }
  }

  if (value === "plan-cost") {
    return {
      kind: "plan-cost",
      id: value,
      label: "Plan-adjusted $/task (plan route; model's cheapest committed route)",
      basis: "plan-route",
    }
  }

  if (value === "tokens") {
    return { kind: "tokens", id: value, label: "Tokens per task" }
  }

  if (value === "steps") {
    return { kind: "steps", id: value, label: "Steps per task" }
  }

  if (benchmark !== undefined) {
    return {
      kind: "benchmark",
      id: value,
      benchmarkId: benchmark.id,
      label: `${benchmark.title} score`,
    }
  }

  throw new Error(`unknown builder x metric ${value}`)
}

function rowForModel(
  benchmark: BuilderBenchmark,
  modelId: string,
): BuilderBenchmarkRow | undefined {
  return benchmark.rows.find((row) => row.model_id === modelId)
}

function compositeForModel(
  modelId: string,
  payload: BuilderPayload,
  weights: readonly number[],
): CompositeValue {
  let k = 0
  let weightSum = 0
  let weightedZ = 0

  for (let index = 0; index < payload.benchmarks.length; index += 1) {
    const benchmark = payload.benchmarks[index]
    const weight = weights[index]

    if (benchmark === undefined || weight === undefined) {
      continue
    }

    const row = rowForModel(benchmark, modelId)

    if (row === undefined) {
      continue
    }

    k += 1

    if (Number.isFinite(row.z) && Number.isFinite(weight) && weight > 0) {
      weightSum += weight
      weightedZ += weight * row.z
    }
  }

  if (k < 2) {
    return { value: null, singleSource: true, noWeight: false }
  }

  if (weightSum === 0) {
    return { value: null, singleSource: false, noWeight: true }
  }

  return {
    value: COMPOSITE_CENTER + COMPOSITE_SPREAD * (weightedZ / weightSum),
    singleSource: false,
    noWeight: false,
  }
}

function metricValue(
  model: BuilderModel,
  metric: BuilderMetric,
  payload: BuilderPayload,
  composites: ReadonlyMap<string, CompositeValue>,
): number | undefined {
  if (metric.kind === "api-cost") {
    return model.api_cost_per_task_usd
  }

  if (metric.kind === "plan-cost") {
    return model.plan_cost_per_task_usd ?? undefined
  }

  if (metric.kind === "tokens") {
    return model.tokens_per_task
  }

  if (metric.kind === "steps") {
    return model.steps_per_task
  }

  if (metric.kind === "composite") {
    return composites.get(model.id)?.value ?? undefined
  }

  const benchmarkId = metric.benchmarkId

  if (benchmarkId === undefined) {
    return undefined
  }

  const benchmark = payload.benchmarks.find((candidate) => candidate.id === benchmarkId)
  const row = benchmark === undefined ? undefined : rowForModel(benchmark, model.id)

  return row?.score
}

function validVendor(value: string, payload: BuilderPayload): boolean {
  return value === "" || payload.models.some((model) => model.provider === value)
}

function validEffort(value: string, payload: BuilderPayload): boolean {
  return value === "" || payload.models.some((model) => model.reasoning_effort === value)
}

function readWeights(params: URLSearchParams, payload: BuilderPayload): number[] {
  const encoded = params.get("w")

  if (encoded === null) {
    return [...payload.initial_weights]
  }

  const values = encoded.split(",")

  if (values.length !== payload.benchmarks.length) {
    return [...payload.initial_weights]
  }

  return values.map((value, index) => {
    const parsed = Number(value)
    const fallback = payload.initial_weights[index] ?? 0

    if (!Number.isFinite(parsed)) {
      return fallback
    }

    return Math.min(100, Math.max(0, Math.round(parsed / 5) * 5))
  })
}

function readState(
  payload: BuilderPayload,
  ySelect: HTMLSelectElement,
  xSelect: HTMLSelectElement,
  typeSelect: HTMLSelectElement,
  scaleInput: HTMLInputElement,
  frontierInput: HTMLInputElement,
): BuilderState {
  const params = new URLSearchParams(location.search)
  const defaultY = ySelect.value
  const defaultX = xSelect.value
  const rawType = params.get("type") ?? typeSelect.value
  const rawScale = params.get("scale")
  const rawFrontier = params.get("frontier")
  const rawFloor = Number(params.get("floor"))
  const floor = Number.isFinite(rawFloor) ? Math.min(100, Math.max(0, rawFloor)) : 0
  const rawY = params.get("y") ?? defaultY
  const rawX = params.get("x") ?? defaultX

  const y =
    isScoreSelection(rawY, payload.benchmarks) ||
    rawY === "composite" ||
    rawY === "tokens" ||
    rawY === "steps"
      ? rawY
      : defaultY

  const x =
    isCostSelection(rawX) ||
    rawX === "tokens" ||
    rawX === "steps" ||
    (rawX.startsWith("score:") && benchmarkForSelection(rawX, payload.benchmarks) !== undefined)
      ? rawX
      : defaultX

  return {
    y,
    x,
    chartType: isChartType(rawType)
      ? rawType
      : isChartType(typeSelect.value)
        ? typeSelect.value
        : "scatter",
    vendor: validVendor(params.get("vendor") ?? "", payload) ? (params.get("vendor") ?? "") : "",
    effort: validEffort(params.get("effort") ?? "", payload) ? (params.get("effort") ?? "") : "",
    floor,
    logX: rawScale === "1" ? true : rawScale === "0" ? false : scaleInput.checked,
    frontier: rawFrontier === "1" ? true : rawFrontier === "0" ? false : frontierInput.checked,
    weights: readWeights(params, payload),
  }
}

// Cross-visit preference persistence belongs to Stage 5.1's lib/prefs.ts; this
// page intentionally keeps the shareable configuration in the URL only.
function writeState(state: BuilderState): void {
  const url = new URL(location.href)
  url.searchParams.set("y", state.y)
  url.searchParams.set("x", state.x)
  url.searchParams.set("type", state.chartType)
  url.searchParams.set("vendor", state.vendor)
  url.searchParams.set("effort", state.effort)
  url.searchParams.set("floor", String(state.floor))
  url.searchParams.set("scale", state.logX ? "1" : "0")
  url.searchParams.set("frontier", state.frontier ? "1" : "0")
  url.searchParams.set("w", state.weights.join(","))
  history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}${url.hash}`)
}

function presetWeights(name: string, benchmarks: readonly BuilderBenchmark[]): number[] {
  if (name === "balanced") {
    const equal = Math.round(100 / benchmarks.length / 5) * 5

    return benchmarks.map(() => equal)
  }

  const ratios: Readonly<Record<string, number>> =
    name === "coding-heavy"
      ? { deepswe: 0.7, "terminal-bench": 0.2 }
      : name === "agentic"
        ? { deepswe: 0.3, "terminal-bench": 0.5 }
        : {}

  return benchmarks.map((benchmark) => {
    const ratio = ratios[benchmark.id] ?? 0

    return Math.round((ratio * 100) / 5) * 5
  })
}

function renderWeightOutputs(
  payload: BuilderPayload,
  weights: readonly number[],
  weightsOutput: HTMLOutputElement,
): void {
  const labels: string[] = []

  for (let index = 0; index < payload.benchmarks.length; index += 1) {
    const benchmark = payload.benchmarks[index]
    const weight = weights[index]

    if (benchmark === undefined || weight === undefined) {
      continue
    }

    labels.push(`${benchmark.title} ${weight}%`)

    const output = document.querySelector<HTMLOutputElement>(
      `#builder-weight-value-${benchmark.id}`,
    )

    if (output !== null) {
      output.textContent = `${weight}%`
    }
  }

  weightsOutput.textContent = `Weights: ${labels.join(", ")}`
}

function startRebuild(
  state: BuilderState,
  payload: BuilderPayload,
  host: HTMLElement,
  ySelect: HTMLSelectElement,
  xSelect: HTMLSelectElement,
  typeSelect: HTMLSelectElement,
  vendorSelect: HTMLSelectElement,
  effortSelect: HTMLSelectElement,
  floorInput: HTMLInputElement,
  scaleInput: HTMLInputElement,
  frontierInput: HTMLInputElement,
  frontierNote: HTMLElement,
  titleNode: HTMLElement,
  noteNode: HTMLElement,
  liveNode: HTMLElement,
  weightsOutput: HTMLOutputElement,
  weightInputs: NodeListOf<HTMLInputElement>,
): ChartHandle | undefined {
  const yMetric = metricForY(state.y, payload)
  const xMetric = metricForX(state.x, payload)
  const frontierAllowed = isCostSelection(state.x) && isScoreSelection(state.y, payload.benchmarks)
  const composites = new Map<string, CompositeValue>()

  for (const model of payload.models) {
    composites.set(model.id, compositeForModel(model.id, payload, state.weights))
  }

  const candidates: BuilderPoint[] = []
  let missingX = 0
  let missingY = 0
  let belowFloor = 0
  let singleSource = 0
  let noWeight = 0

  for (const model of payload.models) {
    if (state.vendor !== "" && model.provider !== state.vendor) {
      continue
    }

    if (state.effort !== "" && model.reasoning_effort !== state.effort) {
      continue
    }

    const x = metricValue(model, xMetric, payload, composites)
    const y = metricValue(model, yMetric, payload, composites)

    if (x === undefined) {
      missingX += 1
    }

    if (y === undefined) {
      if (yMetric.kind === "composite") {
        const composite = composites.get(model.id)

        if (composite?.singleSource === true) {
          singleSource += 1
        }

        if (composite?.noWeight === true) {
          noWeight += 1
        }
      }

      missingY += 1
    }

    if (x === undefined || y === undefined) {
      continue
    }

    if ((yMetric.kind === "benchmark" || yMetric.kind === "composite") && y < state.floor) {
      belowFloor += 1
      continue
    }

    candidates.push({
      id: model.id,
      name: model.name,
      provider: model.provider,
      effort: model.reasoning_effort,
      x,
      y,
    })
  }

  frontierInput.disabled = !frontierAllowed
  frontierNote.hidden = frontierAllowed
  frontierNote.textContent = frontierAllowed
    ? ""
    : "The Pareto frontier is available only when x is a cost basis and y is a score."
  state.frontier = state.frontier && frontierAllowed

  ySelect.value = state.y
  xSelect.value = state.x
  typeSelect.value = state.chartType
  vendorSelect.value = state.vendor
  effortSelect.value = state.effort
  floorInput.value = String(state.floor)
  scaleInput.checked = state.logX
  frontierInput.checked = state.frontier

  for (let index = 0; index < weightInputs.length; index += 1) {
    const input = weightInputs[index]

    if (input !== undefined) {
      input.value = String(state.weights[index] ?? 0)
    }
  }

  renderWeightOutputs(payload, state.weights, weightsOutput)
  writeState(state)
  const details: string[] = []

  if (candidates.length === 0) {
    details.push("No models are plotted for the active configuration")
  } else {
    details.push(
      `${formatCount(candidates.length)} ${yMetric.label} point${candidates.length === 1 ? "" : "s"} plotted against ${xMetric.label}`,
    )
  }

  details.push(`${state.chartType} chart with a ${state.logX ? "logarithmic" : "linear"} x axis`)

  if (state.vendor !== "") {
    details.push(`vendor ${state.vendor}`)
  }

  if (state.effort !== "") {
    details.push(`reasoning effort ${state.effort}`)
  }

  if (yMetric.kind === "composite") {
    const weights = payload.benchmarks
      .map((benchmark, index) => `${benchmark.title} ${state.weights[index] ?? 0}%`)
      .join(", ")

    details.push(`composite weights ${weights}`)
  }

  if (missingX > 0 && xMetric.kind === "plan-cost") {
    details.push(
      `${formatCount(missingX)} model${missingX === 1 ? "" : "s"} have no committed route and are omitted`,
    )
  }

  if (missingY > 0 && yMetric.kind === "benchmark") {
    details.push(
      `${formatCount(missingY)} model${missingY === 1 ? "" : "s"} lack that benchmark score`,
    )
  }

  if (belowFloor > 0) {
    details.push(
      `${formatCount(belowFloor)} fall below the ${formatPercent(state.floor)} score floor`,
    )
  }

  if (singleSource > 0) {
    details.push(`${formatCount(singleSource)} are single-source, so T is missing`)
  }

  if (noWeight > 0) {
    details.push(`${formatCount(noWeight)} have no positive composite weight, so T is missing`)
  }

  if (state.frontier) {
    details.push("the Pareto frontier and dominated region are shown")
  } else if (!frontierAllowed) {
    details.push("the Pareto frontier is unavailable for this metric pair")
  }

  liveNode.textContent = `${details.join("; ")}.`

  if (candidates.length === 0) {
    titleNode.textContent = "Metric builder"
    noteNode.textContent = "No models match this configuration; adjust the filters or score floor."

    return undefined
  }

  const chart = builderOption({
    tokens: readChartTokens(host),
    points: candidates,
    config: {
      x: xMetric,
      y: yMetric,
      chartType: state.chartType,
      logX: state.logX,
      frontier: state.frontier,
    },
  })

  const handle = mountChart(host, chart.option)
  titleNode.textContent = chart.title
  noteNode.textContent = `${formatCount(candidates.length)} plotted point${candidates.length === 1 ? "" : "s"}.`

  return handle
}

export function startBuilder(host: HTMLElement): void {
  const dataNode = document.getElementById("builder-data")
  const ySelect = document.querySelector<HTMLSelectElement>("#builder-y")
  const xSelect = document.querySelector<HTMLSelectElement>("#builder-x")
  const typeSelect = document.querySelector<HTMLSelectElement>("#builder-type")
  const vendorSelect = document.querySelector<HTMLSelectElement>("#builder-vendor")
  const effortSelect = document.querySelector<HTMLSelectElement>("#builder-effort")
  const floorInput = document.querySelector<HTMLInputElement>("#builder-floor")
  const scaleInput = document.querySelector<HTMLInputElement>("#builder-scale")
  const frontierInput = document.querySelector<HTMLInputElement>("#builder-frontier")
  const frontierNote = document.getElementById("builder-frontier-note")
  const titleNode = document.getElementById("builder-chart-title")
  const noteNode = document.getElementById("builder-note")
  const liveNode = document.getElementById("builder-live")
  const weightsOutput = document.querySelector<HTMLOutputElement>("#builder-weights-output")
  const weightInputs = document.querySelectorAll<HTMLInputElement>("input[data-builder-weight]")
  const presets = document.querySelectorAll<HTMLButtonElement>("button[data-builder-preset]")

  if (
    dataNode === null ||
    ySelect === null ||
    xSelect === null ||
    typeSelect === null ||
    vendorSelect === null ||
    effortSelect === null ||
    floorInput === null ||
    scaleInput === null ||
    frontierInput === null ||
    frontierNote === null ||
    titleNode === null ||
    noteNode === null ||
    liveNode === null ||
    weightsOutput === null ||
    weightInputs.length === 0
  ) {
    return
  }

  const encodedPayload = dataNode.textContent

  if (encodedPayload === null) {
    return
  }

  const payload = decodePayload(encodedPayload)

  const state = readState(payload, ySelect, xSelect, typeSelect, scaleInput, frontierInput)
  let chartHandle: ChartHandle | undefined

  const rebuild = (): void => {
    if (chartHandle !== undefined) {
      chartHandle.dispose()
      chartHandle = undefined
    }

    chartHandle = startRebuild(
      state,
      payload,
      host,
      ySelect,
      xSelect,
      typeSelect,
      vendorSelect,
      effortSelect,
      floorInput,
      scaleInput,
      frontierInput,
      frontierNote,
      titleNode,
      noteNode,
      liveNode,
      weightsOutput,
      weightInputs,
    )
  }

  ySelect.addEventListener("change", () => {
    state.y = ySelect.value
    rebuild()
  })
  xSelect.addEventListener("change", () => {
    state.x = xSelect.value
    rebuild()
  })
  typeSelect.addEventListener("change", () => {
    state.chartType = isChartType(typeSelect.value) ? typeSelect.value : "scatter"
    rebuild()
  })
  vendorSelect.addEventListener("change", () => {
    state.vendor = vendorSelect.value
    rebuild()
  })
  effortSelect.addEventListener("change", () => {
    state.effort = effortSelect.value
    rebuild()
  })
  floorInput.addEventListener("change", () => {
    const parsed = Number(floorInput.value)
    state.floor = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0
    rebuild()
  })
  scaleInput.addEventListener("change", () => {
    state.logX = scaleInput.checked
    rebuild()
  })
  frontierInput.addEventListener("change", () => {
    state.frontier = frontierInput.checked
    rebuild()
  })

  for (let index = 0; index < weightInputs.length; index += 1) {
    const input = weightInputs[index]

    if (input === undefined) {
      continue
    }

    input.addEventListener("input", () => {
      const parsed = Number(input.value)
      state.weights[index] = Number.isFinite(parsed)
        ? Math.min(100, Math.max(0, Math.round(parsed / 5) * 5))
        : 0
      rebuild()
    })
  }

  for (const preset of presets) {
    preset.addEventListener("click", () => {
      const name = preset.dataset.builderPreset

      if (name === undefined) {
        return
      }

      state.weights = presetWeights(name, payload.benchmarks)

      for (let index = 0; index < weightInputs.length; index += 1) {
        const input = weightInputs[index]
        const weight = state.weights[index]

        if (input !== undefined && weight !== undefined) {
          input.value = String(weight)
        }
      }

      rebuild()
    })
  }

  rebuild()
}
