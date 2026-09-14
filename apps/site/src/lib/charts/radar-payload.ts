import type { Benchmark, Model, Plan } from "@rack-rate/core"
import { modelAllowed } from "@rack-rate/core/cost"
import { zScores } from "@rack-rate/core/normalize"

const AXIS_MIN = -2

const AXIS_MAX = 2

const OVERLAY_LIMIT = 8

export interface RadarAxis {
  readonly benchmarkId: string
  readonly label: string
  readonly min: -2
  readonly max: 2
}

export interface RadarModel {
  readonly id: string
  readonly name: string
  readonly z: Readonly<Record<string, number>>
}

export interface RadarPlan {
  readonly id: string
  readonly name: string
  readonly modelIds: readonly string[]
}

export type RadarView = RadarPlan

export interface RadarPayload {
  readonly title: string
  readonly axes: readonly RadarAxis[]
  readonly models: readonly RadarModel[]
  readonly plans: readonly RadarPlan[]
  readonly note: string
  readonly ariaLabel: string
}

export interface RadarPayloadInput {
  readonly models: readonly Model[]
  readonly plans: readonly Plan[]
  readonly benchmarks: readonly Benchmark[]
}

function countOf(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

// Overlay order uses the equal-weighted mean of the visible per-index z values.
// The payload has no editorial weight input, and derived cross-benchmark composites
// are intentionally not reused for this per-index view.
function weightedZ(model: RadarModel, axes: readonly RadarAxis[]): number {
  let total = 0

  for (const axis of axes) {
    const value = model.z[axis.benchmarkId]

    if (value === undefined) {
      throw new Error(`radar payload: ${model.id} has no z for ${axis.benchmarkId}`)
    }

    total += value
  }

  return total / axes.length
}

// ECharts needs one value per indicator. Incomplete models are excluded before
// the overlay cap so a missing benchmark cannot consume a visible series slot.
// ECharts 6.1.0 was measured with `null`: its numeric scale parses null as NaN,
// then radarLayout replaces the invalid point with the coordinate centre. That
// would read as z = 0, so incomplete models are deliberately not overlaid.
export function radarEligibleModels(payload: RadarPayload, view: RadarView): readonly RadarModel[] {
  const modelsById = new Map(payload.models.map((model) => [model.id, model]))
  const eligible: RadarModel[] = []

  for (const modelId of view.modelIds) {
    const model = modelsById.get(modelId)

    if (model === undefined) {
      continue
    }

    if (payload.axes.every((axis) => model.z[axis.benchmarkId] !== undefined)) {
      eligible.push(model)
    }
  }

  return eligible
}

export function buildRadarPayload(input: RadarPayloadInput): RadarPayload {
  const axes: RadarAxis[] = []
  const zByBenchmark = new Map<string, ReadonlyMap<string, number>>()
  const seenBenchmarkIds = new Set<string>()

  for (const benchmark of input.benchmarks) {
    const key = benchmark.id

    if (seenBenchmarkIds.has(key)) {
      throw new Error(`radar payload: duplicate benchmark id ${key} would mix versions`)
    }

    seenBenchmarkIds.add(key)
    axes.push({
      benchmarkId: key,
      label: benchmark.title,
      min: AXIS_MIN,
      max: AXIS_MAX,
    })

    const normalized = zScores(benchmark.id, benchmark.version, benchmark.rows)
    const zByModel = new Map<string, number>()

    for (const row of normalized.rows) {
      zByModel.set(row.model_id, row.z)
    }

    zByBenchmark.set(key, zByModel)
  }

  const radarModels: RadarModel[] = input.models.map((model) => {
    const z: Record<string, number> = {}

    for (const axis of axes) {
      const value = zByBenchmark.get(axis.benchmarkId)?.get(model.id)

      if (value !== undefined) {
        z[axis.benchmarkId] = value
      }
    }

    return { id: model.id, name: model.name, z }
  })

  const modelsById = new Map(input.models.map((model) => [model.id, model]))

  const plans: RadarPlan[] = input.plans
    .filter((plan) => plan.available)
    .map((plan) => ({
      id: plan.id,
      name: plan.name,
      modelIds: radarModels.flatMap((model) => {
        const sourceModel = modelsById.get(model.id)

        if (
          sourceModel === undefined ||
          Object.keys(model.z).length === 0 ||
          !modelAllowed(sourceModel, plan)
        ) {
          return []
        }

        return [model.id]
      }),
    }))

  const axisCount = countOf(
    axes.length,
    "committed benchmark version",
    "committed benchmark versions",
  )

  const modelCount = countOf(radarModels.length, "committed model", "committed models")

  const note = [
    `${axisCount} provide axes in z units from -2 to +2;`,
    `models missing an axis are excluded rather than drawn as z = 0, and each plan overlay is capped at ${OVERLAY_LIMIT} models.`,
  ].join(" ")

  const ariaLabel = [
    `${modelCount} across ${countOf(axes.length, "benchmark version axis", "benchmark version axes")} in z units from -2 to +2;`,
    "select a plan to see the models its scope admits.",
  ].join(" ")

  return {
    title: "per-index z",
    axes,
    models: radarModels,
    plans,
    note,
    ariaLabel,
  }
}

export function encodeRadarPayload(payload: RadarPayload): string {
  // Escaping less-than signs keeps JSON inside an application/json script from
  // closing the element if a future data label contains a literal `<`.
  return JSON.stringify(payload).replaceAll("<", "\\u003c")
}

export function decodeRadarPayload(json: string): RadarPayload {
  const parsed = JSON.parse(json)

  // SAFETY: this string is written by this repository's own RadarSection template
  // in the same build, so no external producer can reach this client decoder.
  const payload = parsed as RadarPayload

  if (!Array.isArray(payload?.axes) || payload.axes.length === 0) {
    throw new Error("radar payload: axes must be a non-empty array")
  }

  if (!Array.isArray(payload.models) || payload.models.length === 0) {
    throw new Error("radar payload: models must be a non-empty array")
  }

  if (!Array.isArray(payload.plans) || payload.plans.length === 0) {
    throw new Error("radar payload: plans must be a non-empty array")
  }

  for (const plan of payload.plans) {
    if (!plan || !Array.isArray(plan.modelIds)) {
      throw new Error("radar payload: every plan must have a modelIds array")
    }
  }

  return payload
}

export function radarNote(payload: RadarPayload, view: RadarView, seriesCount: number): string {
  const eligibleCount = radarEligibleModels(payload, view).length
  const scopeCount = view.modelIds.length
  const incompleteCount = scopeCount - eligibleCount
  const cappedCount = Math.max(eligibleCount - seriesCount, 0)

  const capNote =
    cappedCount === 0
      ? ""
      : ` ${countOf(cappedCount, "complete model is", "complete models are")} beyond the ${OVERLAY_LIMIT}-model overlay cap.`

  const gapNote =
    incompleteCount === 0
      ? ""
      : ` ${countOf(incompleteCount, "model is", "models are")} not evaluated on every axis and are not drawn.`

  return `${payload.note} showing ${seriesCount} of ${scopeCount} models the scope admits.${capNote}${gapNote}`
}

export function radarAriaLabel(
  payload: RadarPayload,
  view: RadarView,
  seriesCount: number,
): string {
  return `${seriesCount} ${seriesCount === 1 ? "model" : "models"} overlaid for ${view.name} across ${countOf(payload.axes.length, "benchmark version axis", "benchmark version axes")} in z units from -2 to +2; missing benchmark values are not drawn. JavaScript is required to draw this chart.`
}

export { OVERLAY_LIMIT, weightedZ }
