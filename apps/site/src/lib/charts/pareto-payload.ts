import type { Benchmark, DerivedParetoFrontier, Model, Plan } from "@rack-rate/core"

import type { CostBasisKind } from "../provenance.ts"

// DeepSWE is the benchmark whose rows[].score feeds the composite and frontier.
const SCORE_BENCHMARK_ID = "deepswe"

type ParetoViewBasis = Extract<CostBasisKind, "api-list" | "plan-route">

type FrontierPoint = DerivedParetoFrontier["points"][number]

export interface ParetoPayloadInput {
  readonly models: readonly Model[]
  readonly benchmarks: readonly Benchmark[]
  readonly apiFrontier: DerivedParetoFrontier
  readonly planFrontiers: ReadonlyMap<string, DerivedParetoFrontier>
  readonly plansById: ReadonlyMap<string, Plan>
}

export interface ParetoChartPoint {
  readonly id: string
  readonly name: string
  readonly cost: number
  readonly score: number
  readonly onFrontier: boolean
  readonly labelled: boolean
}

export interface ParetoTrailPoint {
  readonly cost: number
  readonly score: number
  readonly effort: string
}

export interface ParetoTrail {
  readonly modelId: string
  readonly name: string
  readonly points: readonly ParetoTrailPoint[]
}

export interface ParetoBasisView {
  readonly basis: CostBasisKind
  readonly planId: string | null
  readonly planName: string | null
  readonly points: readonly ParetoChartPoint[]
  readonly frontier: readonly string[]
  readonly trails: readonly ParetoTrail[]
  readonly note: string
}

export interface ParetoPayload {
  readonly scoreLabel: string
  readonly bases: readonly ParetoBasisView[]
}

interface BasisViewInput {
  readonly basis: ParetoViewBasis
  readonly planId: string | null
  readonly planName: string | null
  readonly frontier: DerivedParetoFrontier
  readonly modelsById: ReadonlyMap<string, Model>
  readonly note: string
  readonly trails: readonly ParetoTrail[]
}

function requireFrontierData(frontier: DerivedParetoFrontier, viewId: string): void {
  if (frontier.points.length === 0 || frontier.frontier.length === 0) {
    throw new Error(`pareto payload: ${viewId} has an empty point or frontier list`)
  }
}

function buildBasisView(input: BasisViewInput): ParetoBasisView {
  requireFrontierData(input.frontier, input.planId ?? "api-list")

  const dominated: FrontierPoint[] = []

  for (const point of input.frontier.points) {
    if (!point.on_frontier) {
      dominated.push(point)
    }
  }

  // A chart is not a table: every point label is unreadable, so show the
  // frontier plus the three worst-value dominated offenders a reader needs.
  dominated.sort((left, right) => right.distance.cost_ratio - left.distance.cost_ratio)

  const dominatedRanks = new Map<string, number>()

  for (let rank = 0; rank < dominated.length; rank += 1) {
    const point = dominated[rank]

    if (point === undefined) {
      continue
    }

    dominatedRanks.set(point.id, rank)
  }

  const points: ParetoChartPoint[] = []

  for (const point of input.frontier.points) {
    const modelName = input.modelsById.get(point.id)?.name ?? point.id
    const rank = dominatedRanks.get(point.id)

    points.push({
      id: point.id,
      name: modelName,
      cost: point.cost,
      score: point.score,
      onFrontier: point.on_frontier,
      labelled: point.on_frontier || (rank !== undefined && rank < 3),
    })
  }

  return {
    basis: input.basis,
    planId: input.planId,
    planName: input.planName,
    points,
    frontier: input.frontier.frontier,
    trails: input.trails,
    note: input.note,
  }
}

function buildApiTrails(models: readonly Model[]): ParetoTrail[] {
  const modelsWithTrails: Model[] = []

  for (const model of models) {
    if (model.effort_variants !== undefined && model.effort_variants.length >= 2) {
      modelsWithTrails.push(model)
    }
  }

  modelsWithTrails.sort((left, right) => left.id.localeCompare(right.id))

  const trails: ParetoTrail[] = []

  for (const model of modelsWithTrails) {
    const trailPoints: ParetoTrailPoint[] = []

    for (const variant of model.effort_variants ?? []) {
      if (!Number.isFinite(variant.api_cost_per_task_usd) || variant.api_cost_per_task_usd <= 0) {
        continue
      }

      trailPoints.push({
        cost: variant.api_cost_per_task_usd,
        score: variant.score_pct,
        effort: variant.reasoning_effort,
      })
    }

    trailPoints.sort((left, right) => left.cost - right.cost)

    if (trailPoints.length < 2) {
      continue
    }

    trails.push({
      modelId: model.id,
      name: model.name,
      points: trailPoints,
    })
  }

  return trails
}

export function buildParetoPayload(input: ParetoPayloadInput): ParetoPayload {
  const benchmark = input.benchmarks.find((candidate) => candidate.id === SCORE_BENCHMARK_ID)

  if (benchmark === undefined) {
    throw new Error(`pareto payload: benchmark ${SCORE_BENCHMARK_ID} is missing`)
  }

  if (benchmark.scale !== "0-100") {
    throw new Error(`pareto payload: benchmark ${SCORE_BENCHMARK_ID} must use the 0-100 scale`)
  }

  const scoreLabel = `${benchmark.title} ${benchmark.unit} (%)`
  const modelsById = new Map<string, Model>()

  for (const model of input.models) {
    modelsById.set(model.id, model)
  }

  const apiTrails = buildApiTrails(input.models)

  const apiView = buildBasisView({
    basis: "api-list",
    planId: null,
    planName: null,
    frontier: input.apiFrontier,
    modelsById,
    trails: apiTrails,
    note: "API list basis: vendor list rates for the tokens each task consumed. Dashed trails are the same models at other reasoning efforts, priced on the same basis.",
  })

  const planIds = Array.from(input.planFrontiers.keys())
  planIds.sort()

  const planViews: ParetoBasisView[] = []

  for (const planId of planIds) {
    const frontier = input.planFrontiers.get(planId)

    if (frontier === undefined) {
      throw new Error(`pareto payload: plan ${planId} frontier is missing`)
    }

    const planName = input.plansById.get(planId)?.name ?? planId
    const pointsCount = frontier.points.length

    planViews.push(
      buildBasisView({
        basis: "plan-route",
        planId,
        planName,
        frontier,
        modelsById,
        trails: [],
        note: `${planName} route basis: the plan's monthly price divided by the tasks its quota covers for these ${pointsCount} models. Effort trails are priced on the API list basis only, so none are drawn here.`,
      }),
    )
  }

  return {
    scoreLabel,
    bases: [apiView, ...planViews],
  }
}

export function encodeParetoPayload(payload: ParetoPayload): string {
  // Escaping less-than signs keeps JSON inside an application/json script from
  // closing the element if a future data label contains a literal `<`.
  return JSON.stringify(payload).replaceAll("<", "\\u003c")
}

export function decodeParetoPayload(json: string): ParetoPayload {
  const parsed = JSON.parse(json)

  // SAFETY: this string is written by this repository's own /explore template
  // in the same build, so no external producer can reach this client decoder.
  const payload = parsed as ParetoPayload

  if (!Array.isArray(payload?.bases) || payload.bases.length === 0) {
    throw new Error("pareto payload: bases must be a non-empty array")
  }

  for (const view of payload.bases) {
    if (!view || !Array.isArray(view.points) || view.points.length === 0) {
      throw new Error("pareto payload: every view must have a non-empty points array")
    }

    if (!Array.isArray(view.frontier) || view.frontier.length === 0) {
      throw new Error("pareto payload: every view must have a non-empty frontier array")
    }
  }

  return payload
}
