import type { DerivedPair, Plan } from "@rack-rate/core"
import { formatFractionAsPercent, formatTasksPerMonth } from "../format.ts"

const TITLE = "Quota burn-down"

export interface WaterfallKnownGap {
  readonly plan: string
  readonly provider: string
  readonly reason: string
}

export interface WaterfallPayloadInput {
  readonly plans: readonly Plan[]
  readonly routesByPlan: ReadonlyMap<string, readonly DerivedPair[]>
  readonly knownGaps?: readonly WaterfallKnownGap[]
}

export interface WaterfallPlan {
  readonly planId: string
  readonly planName: string
  readonly provider: string
  readonly confidence: Plan["confidence"]
  readonly modelId: string | null
  readonly modelName: string | null
  readonly tasksPerMonth: number | null
  readonly costPerTaskUsd: number | null
  readonly apiCostPerTaskUsd: number | null
  readonly priceUsdMonth: number
  readonly reason: string | null
}

export interface WaterfallPayload {
  readonly title: string
  readonly plans: readonly WaterfallPlan[]
  readonly note: string
  readonly ariaLabel: string
}

/** The identity fields a decoded plan must carry for its accessible name. */
interface WaterfallPlanIdentity {
  readonly planId: string
  readonly planName: string
}

function cheapestRoute(routes: readonly DerivedPair[]): DerivedPair | undefined {
  let cheapest: DerivedPair | undefined

  for (const route of routes) {
    if (
      !Number.isFinite(route.tasks_per_month) ||
      route.tasks_per_month <= 0 ||
      !Number.isFinite(route.cost_per_task_usd)
    ) {
      continue
    }

    if (cheapest === undefined || route.cost_per_task_usd < cheapest.cost_per_task_usd) {
      cheapest = route
    }
  }

  return cheapest
}

function gapForPlan(
  plan: Plan,
  knownGaps: readonly WaterfallKnownGap[],
): WaterfallKnownGap | undefined {
  const matches = knownGaps.filter((gap) =>
    gap.plan
      .split(",")
      .map((name) => name.trim())
      .includes(plan.name),
  )

  if (matches.length === 0) {
    return undefined
  }

  return (
    matches.find((gap) => gap.provider === plan.provider) ??
    (matches.length === 1 ? matches[0] : undefined)
  )
}

function reasonForPlan(plan: Plan, gap: WaterfallKnownGap | undefined): string | null {
  if (plan.unavailable_reason !== undefined) {
    return plan.unavailable_reason
  }

  if (plan.quota_note !== undefined) {
    return plan.quota_note
  }

  return gap?.reason ?? null
}

function routeForPlan(plan: Plan, routes: readonly DerivedPair[]): DerivedPair | undefined {
  if (!plan.available || plan.quota_unresolved === true) {
    return undefined
  }

  const measured = plan.measured_against_model

  if (measured !== undefined) {
    const measuredRoute = routes.find(
      (route) =>
        route.model_id === measured &&
        Number.isFinite(route.tasks_per_month) &&
        route.tasks_per_month > 0,
    )

    if (measuredRoute !== undefined) {
      return measuredRoute
    }
  }

  return cheapestRoute(routes)
}

// The server template and client rebuild share this function so accessible names cannot drift.
export function waterfallAriaLabel(
  payload: WaterfallPayload,
  view: WaterfallPlan,
  usedTasks: number,
): string {
  const planCount = payload.plans.length

  if (
    view.modelId === null ||
    view.modelName === null ||
    view.tasksPerMonth === null ||
    !Number.isFinite(view.tasksPerMonth) ||
    view.tasksPerMonth <= 0
  ) {
    return `${view.planName} quota burn-down is unavailable; ${planCount} committed plans are listed; JavaScript is required to draw this chart.`
  }

  const quota = view.tasksPerMonth
  const used = Number.isFinite(usedTasks) && usedTasks >= 0 ? usedTasks : 0
  const remaining = Math.max(quota - used, 0)
  const deficit = Math.max(used - quota, 0)
  const utilization = used / quota
  const deficitText = deficit > 0 ? `; ${formatTasksPerMonth(deficit)} deficit below quota` : ""

  return `${view.planName} quota burn-down for ${view.modelName}; ${formatTasksPerMonth(quota)} quota, ${formatTasksPerMonth(used)} used, ${formatTasksPerMonth(remaining)} remaining${deficitText}; U = ${formatFractionAsPercent(utilization)}; ${planCount} committed plans are listed; JavaScript is required to draw this chart.`
}

export function buildWaterfallPayload(input: WaterfallPayloadInput): WaterfallPayload {
  if (input.plans.length === 0) {
    throw new Error("waterfall payload requires at least one committed plan")
  }

  const knownGaps = input.knownGaps ?? []
  const waterfallPlans: WaterfallPlan[] = []

  for (const plan of input.plans) {
    const routes = input.routesByPlan.get(plan.id) ?? []
    const route = routeForPlan(plan, routes)
    const gap = gapForPlan(plan, knownGaps)

    waterfallPlans.push({
      planId: plan.id,
      planName: plan.name,
      provider: plan.provider,
      confidence: plan.confidence,
      modelId: route?.model_id ?? null,
      modelName: route?.model_name ?? null,
      tasksPerMonth: route?.tasks_per_month ?? null,
      costPerTaskUsd: route?.cost_per_task_usd ?? null,
      apiCostPerTaskUsd: route?.api_cost_per_task_usd ?? null,
      priceUsdMonth: plan.price_usd_month,
      reason: route === undefined ? reasonForPlan(plan, gap) : null,
    })
  }

  const pricedCount = waterfallPlans.filter((plan) => plan.modelId !== null).length
  const missingCount = waterfallPlans.length - pricedCount
  const note = `${pricedCount} of ${waterfallPlans.length} committed plans have a priced route; ${missingCount} remain listed without a zero-filled bar.`

  const basePayload = {
    title: TITLE,
    plans: waterfallPlans,
    note,
    ariaLabel: "",
  } satisfies WaterfallPayload

  const defaultPlan =
    waterfallPlans.find(
      (plan) => plan.modelId !== null && plan.tasksPerMonth !== null && plan.tasksPerMonth > 0,
    ) ?? waterfallPlans[0]

  if (defaultPlan === undefined) {
    throw new Error("waterfall payload requires a default plan for its accessible name")
  }

  return {
    ...basePayload,
    ariaLabel: waterfallAriaLabel(basePayload, defaultPlan, defaultPlan.tasksPerMonth ?? 0),
  }
}

export function encodeWaterfallPayload(payload: WaterfallPayload): string {
  // Escaping less-than signs keeps JSON inside an application/json script from
  // closing the element if a future data label contains a literal `<`.
  return JSON.stringify(payload).replaceAll("<", "\\u003c")
}

function planIdentity(plan: WaterfallPlan): WaterfallPlanIdentity | undefined {
  // `String(value) === value` holds exactly for strings, so this keeps the
  // decoder's string check without a `typeof` representation test.
  if (plan.planId !== String(plan.planId) || plan.planName !== String(plan.planName)) {
    return undefined
  }

  return { planId: plan.planId, planName: plan.planName }
}

export function decodeWaterfallPayload(json: string): WaterfallPayload {
  const parsed = JSON.parse(json)

  // SAFETY: this string is written by this repository's own template in the same
  // build, so no external producer can reach this client decoder; fields are not
  // revalidated.
  const payload = parsed as WaterfallPayload

  if (!Array.isArray(payload?.plans) || payload.plans.length === 0) {
    throw new Error("waterfall payload: plans must be a non-empty array")
  }

  for (const plan of payload.plans) {
    if (!plan || planIdentity(plan) === undefined) {
      throw new Error("waterfall payload: every plan must have an id and name")
    }
  }

  return payload
}
