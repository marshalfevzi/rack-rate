import type { DerivedPair, Model } from "@rack-rate/core"

import { formatCount, formatMultiple } from "../format.ts"
import type { Confidence } from "../provenance.ts"

const TITLE = "API list vs plan route"

export interface SlopePayloadInput {
  readonly models: readonly Model[]
  readonly routesByModel: ReadonlyMap<string, readonly DerivedPair[]>
}

export interface SlopeRoute {
  readonly planId: string
  readonly planName: string
  readonly provider: string
  readonly priceUsdMonth: number
  readonly apiCostPerTaskUsd: number
  readonly routeCostPerTaskUsd: number
  readonly savingsMultiple: number
  readonly tasksPerMonth: number
  readonly confidence: Confidence
}

export interface SlopeModel {
  readonly id: string
  readonly name: string
  readonly provider: string | null
  readonly routes: readonly SlopeRoute[]
  readonly reason?: string
}

export interface SlopePayload {
  readonly title: string
  readonly models: readonly SlopeModel[]
  readonly note: string
  readonly ariaLabel: string
}

function countOf(count: number, singular: string, plural: string): string {
  return `${formatCount(count)} ${count === 1 ? singular : plural}`
}

function noRouteReason(provider: string | null, providerlessCount: number): string {
  if (provider === null) {
    return `${countOf(providerlessCount, "committed model", "committed models")} ship${providerlessCount === 1 ? "s" : ""} with no provider, so no committed plan prices them — that is no route, never $0.`
  }

  return "No committed plan prices this model — that is no route, never $0."
}

export function slopeNote(view: SlopeModel): string {
  if (view.routes.length === 0) {
    return view.reason ?? "No committed plan prices this model — that is no route, never $0."
  }

  let smallest = view.routes[0]?.savingsMultiple
  let largest = smallest

  if (smallest === undefined || largest === undefined) {
    throw new Error(`slope payload: ${view.id} has no route multiple`)
  }

  for (const route of view.routes) {
    smallest = Math.min(smallest, route.savingsMultiple)
    largest = Math.max(largest, route.savingsMultiple)
  }

  const routeCount = countOf(view.routes.length, "plan route", "plan routes")
  const verb = view.routes.length === 1 ? "implies" : "imply"

  if (smallest === largest) {
    return `${view.name}'s ${routeCount} ${verb} ${formatMultiple(smallest)} savings versus API list; the largest and smallest multiples are both ${formatMultiple(smallest)}.`
  }

  return `${view.name}'s ${routeCount} ${verb} ${formatMultiple(smallest)} to ${formatMultiple(largest)} savings versus API list; ${formatMultiple(largest)} is the largest multiple and ${formatMultiple(smallest)} the smallest.`
}

export function slopeAriaLabel(payload: SlopePayload, view: SlopeModel): string {
  const routeCount = countOf(view.routes.length, "priced plan route", "priced plan routes")
  const modelCount = countOf(payload.models.length, "committed model", "committed models")

  if (view.routes.length === 0) {
    return `${view.name} has no priced plan route; ${view.reason ?? "no committed plan prices this model"}; ${modelCount} in the selector; JavaScript is required to draw this chart.`
  }

  return `${view.name} plotted across ${routeCount}, each joining API list and plan route cost per task; ${modelCount} in the selector; JavaScript is required to draw this chart.`
}

export function buildSlopePayload(input: SlopePayloadInput): SlopePayload {
  if (input.models.length === 0) {
    throw new Error("slope payload: models must be a non-empty array")
  }

  const providerlessCount = input.models.filter(
    (model) => model.provider === null && (input.routesByModel.get(model.id) ?? []).length === 0,
  ).length

  const models: SlopeModel[] = []

  for (const model of input.models) {
    const sourceRoutes = input.routesByModel.get(model.id) ?? []
    const routes: SlopeRoute[] = []

    for (const pair of sourceRoutes) {
      if (!Number.isFinite(pair.cost_per_task_usd) || pair.cost_per_task_usd <= 0) {
        throw new Error(
          `slope payload: ${model.id}/${pair.plan_id} has a non-positive or non-finite route cost`,
        )
      }

      routes.push({
        planId: pair.plan_id,
        planName: pair.plan_name,
        provider: pair.provider,
        priceUsdMonth: pair.price_usd_month,
        apiCostPerTaskUsd: pair.api_cost_per_task_usd,
        routeCostPerTaskUsd: pair.cost_per_task_usd,
        savingsMultiple: pair.api_cost_per_task_usd / pair.cost_per_task_usd,
        tasksPerMonth: pair.tasks_per_month,
        confidence: pair.confidence,
      })
    }

    routes.sort((left, right) => {
      const costOrder = left.routeCostPerTaskUsd - right.routeCostPerTaskUsd

      return costOrder === 0 ? left.planId.localeCompare(right.planId) : costOrder
    })

    const entry: SlopeModel = {
      id: model.id,
      name: model.name,
      provider: model.provider,
      routes,
    }

    if (routes.length === 0) {
      models.push({ ...entry, reason: noRouteReason(model.provider, providerlessCount) })
    } else {
      models.push(entry)
    }
  }

  const noRouteModels = models.filter((model) => model.routes.length === 0)
  const providerlessNoRouteCount = noRouteModels.filter((model) => model.provider === null).length
  const noRouteVerb = noRouteModels.length === 1 ? "has" : "have"

  const note =
    noRouteModels.length === 0
      ? `All ${countOf(models.length, "committed model", "committed models")} have at least one priced plan route.`
      : `${countOf(noRouteModels.length, "committed model", "committed models")} ${noRouteVerb} no priced route; ${providerlessNoRouteCount > 0 ? noRouteReason(null, providerlessNoRouteCount) : "No committed plan prices these models — that is no route, never $0."}`

  const payloadWithoutAria: SlopePayload = {
    title: TITLE,
    models,
    note,
    ariaLabel: "",
  }

  const defaultModel = models.find((model) => model.routes.length > 0) ?? models[0]

  if (defaultModel === undefined) {
    throw new Error("slope payload: no model was built")
  }

  return {
    ...payloadWithoutAria,
    ariaLabel: slopeAriaLabel(payloadWithoutAria, defaultModel),
  }
}

export function encodeSlopePayload(payload: SlopePayload): string {
  if (!Array.isArray(payload.models) || payload.models.length === 0) {
    throw new Error("slope payload: models must be a non-empty array")
  }

  // Escaping less-than signs keeps JSON inside an application/json script from
  // closing the element if a future data label contains a literal `<`.
  return JSON.stringify(payload).replaceAll("<", "\\u003c")
}

export function decodeSlopePayload(json: string): SlopePayload {
  const parsed = JSON.parse(json)

  // SAFETY: this string is written by this repository's own template in the same
  // build, so no external producer can reach this client decoder; fields are not
  // revalidated.
  const payload = parsed as SlopePayload

  if (!Array.isArray(payload?.models) || payload.models.length === 0) {
    throw new Error("slope payload: models must be a non-empty array")
  }

  for (const model of payload.models) {
    if (!model || !Array.isArray(model.routes)) {
      throw new Error("slope payload: every model must have a routes array")
    }
  }

  return payload
}
