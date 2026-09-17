import type { DerivedPair } from "@rack-rate/core"
import { BENCHMARK_SOURCE_IDS } from "@rack-rate/core/ids"

import {
  apiFrontier,
  bestRouteByModel,
  benchmarks,
  compositeByModel,
  derived,
  derivedGeneratedAt,
  derivedKnownGaps,
  models,
  planKnownGaps,
  plans,
  routesByPlan,
  tokenAllowances,
} from "./data.ts"
import { buildWaterfallPayload } from "./charts/waterfall-payload.ts"
import { formatCount, formatMultiple, formatTasksPerMonth, formatUsd, MISSING } from "./format.ts"
import type { ReadoutFields } from "./readout.ts"
import { COST_BASIS_TERMS } from "./provenance.ts"
import { href } from "./url.ts"

export const CONSOLE_DEFAULT_PLAN_ID = "claude-pro"

export const CONSOLE_DEFAULT_TASKS = 300

export const CONSOLE_TASKS_STEP = 10

export interface ConsoleRoutePayload {
  modelId: string
  modelName: string
  priceUsdMonth: number
  apiCostPerTaskUsd: number
  tasksPerMonth: number
}

export interface ConsolePlanPayload {
  planId: string
  planName: string
  provider: string
  confidence: string
  retrievedAt: string
  sourceIds: string[]
  measuredAgainstModel: string | null
  reason: string | null
  routes: ConsoleRoutePayload[]
}

export interface ConsolePayload {
  defaultPlanId: string
  defaultTasks: number
  tasksStep: number
  plans: ConsolePlanPayload[]
}

export interface ConsoleRouteDisplay {
  planId: string
  planName: string
  provider: string
  confidence: string
  retrievedAt: string
  route: ConsoleRoutePayload
  readout: ReadoutFields
  cost: string
  breakEven: string
  breakEvenIsFigure: boolean
}

export interface ProvenanceListingRow {
  id: string
  label: string
  value: string
  basis: string
  confidence: string
  sourceIds: string[]
  retrieved: string
  href: string
}

export interface SetAsideEntry {
  planId: string
  planName: string
  provider: string
  sourceIds: string[]
  reason: string
}

export interface ConsoleSelectionModel {
  modelId: string
  modelName: string
}

export interface ConsoleModel {
  defaultPlanId: string
  defaultTasks: number
  tasksStep: number
  plans: Array<{ id: string; name: string }>
  defaultModelId: string
  defaultModels: ConsoleSelectionModel[]
  initialRows: ConsoleRouteDisplay[]
  initialReadout: ReadoutFields
  initialRouteCount: number
  largestMultiple: { value: number; planName: string; modelName: string }
  setAside: SetAsideEntry[]
  headlineIndexRows: ProvenanceListingRow[]
  headlineFigureRows: ProvenanceListingRow[]
  payload: string
}

export function buildConsole(): ConsoleModel {
  const plansById = new Map(plans.map((plan) => [plan.id, plan]))

  const budgetWaterfall = buildWaterfallPayload({
    plans,
    routesByPlan,
    knownGaps: [...planKnownGaps, ...derivedKnownGaps],
  })

  const budgetByPlanId = new Map(budgetWaterfall.plans.map((entry) => [entry.planId, entry]))

  function routeIsValid(route: ConsoleRoutePayload): boolean {
    return (
      Number.isFinite(route.tasksPerMonth) &&
      route.tasksPerMonth > 0 &&
      Number.isFinite(route.apiCostPerTaskUsd)
    )
  }

  function defaultModelId(planId: string): string | null {
    const plan = plansById.get(planId)
    const routes = routesByPlan.get(planId) ?? []

    if (plan?.measured_against_model !== undefined) {
      const measuredRoute = routes.find((route) => route.model_id === plan.measured_against_model)

      if (measuredRoute !== undefined) {
        return measuredRoute.model_id
      }
    }

    let cheapest: (typeof routes)[number] | undefined

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

    return cheapest?.model_id ?? null
  }

  function routeDisplay(planId: string, route: DerivedPair, tasks: number): ConsoleRouteDisplay {
    const plan = plansById.get(planId)

    if (plan === undefined) {
      throw new Error(`Homepage console row has no plan ${planId}`)
    }

    const routePayload: ConsoleRoutePayload = {
      modelId: route.model_id,
      modelName: route.model_name,
      priceUsdMonth: route.price_usd_month,
      apiCostPerTaskUsd: route.api_cost_per_task_usd,
      tasksPerMonth: route.tasks_per_month,
    }

    if (!routeIsValid(routePayload)) {
      throw new Error(
        `Homepage console route ${planId}/${route.model_id} has incomplete priced-route inputs`,
      )
    }

    const costValue =
      tasks <= routePayload.tasksPerMonth
        ? routePayload.priceUsdMonth
        : routePayload.priceUsdMonth +
          (tasks - routePayload.tasksPerMonth) * routePayload.apiCostPerTaskUsd

    const breakEvenValue = routePayload.priceUsdMonth / routePayload.apiCostPerTaskUsd
    const breakEvenIsFigure = breakEvenValue <= routePayload.tasksPerMonth

    return {
      planId,
      planName: plan.name,
      provider: plan.provider,
      confidence: plan.confidence,
      retrievedAt: plan.retrieved_at,
      route: routePayload,
      readout: {
        value: formatUsd(costValue),
        basis: COST_BASIS_TERMS["api-list"].label,
        confidence: plan.confidence,
        source: plan.provider,
        retrieved: plan.retrieved_at,
      },
      cost: formatUsd(costValue),
      breakEven: breakEvenIsFigure
        ? formatTasksPerMonth(breakEvenValue)
        : "Never breaks even at list rates",
      breakEvenIsFigure,
    }
  }

  function rowsForSelection(
    planId: string,
    modelIds: readonly string[],
    tasks: number,
  ): ConsoleRouteDisplay[] {
    const selected = new Set(modelIds)
    const rows: ConsoleRouteDisplay[] = []

    for (const route of routesByPlan.get(planId) ?? []) {
      if (selected.has(route.model_id)) {
        rows.push(routeDisplay(planId, route, tasks))
      }
    }

    return rows
  }

  const defaultPlan = plansById.get(CONSOLE_DEFAULT_PLAN_ID)

  if (defaultPlan === undefined) {
    throw new Error(`Homepage console needs default plan ${CONSOLE_DEFAULT_PLAN_ID}`)
  }

  const defaultModel = defaultModelId(CONSOLE_DEFAULT_PLAN_ID)

  if (defaultModel === null) {
    throw new Error(`Homepage console needs a default model for ${CONSOLE_DEFAULT_PLAN_ID}`)
  }

  const initialRows = rowsForSelection(
    CONSOLE_DEFAULT_PLAN_ID,
    [defaultModel],
    CONSOLE_DEFAULT_TASKS,
  )

  const initialRow = initialRows[0]

  if (initialRow === undefined) {
    throw new Error(`Homepage console default model ${defaultModel} has no committed route`)
  }

  const initialReadout = initialRow.readout

  const consolePlans: ConsolePlanPayload[] = plans.map((plan) => {
    const entry = budgetByPlanId.get(plan.id)

    if (entry === undefined) {
      throw new Error(`Homepage console has no waterfall entry for ${plan.id}`)
    }

    return {
      planId: plan.id,
      planName: plan.name,
      provider: plan.provider,
      confidence: plan.confidence,
      retrievedAt: plan.retrieved_at,
      sourceIds: plan.sources,
      measuredAgainstModel: plan.measured_against_model ?? null,
      reason: entry.reason,
      routes: (routesByPlan.get(plan.id) ?? []).map((route) => ({
        modelId: route.model_id,
        modelName: route.model_name,
        priceUsdMonth: route.price_usd_month,
        apiCostPerTaskUsd: route.api_cost_per_task_usd,
        tasksPerMonth: route.tasks_per_month,
      })),
    }
  })

  const consolePayload: ConsolePayload = {
    defaultPlanId: CONSOLE_DEFAULT_PLAN_ID,
    defaultTasks: CONSOLE_DEFAULT_TASKS,
    tasksStep: CONSOLE_TASKS_STEP,
    plans: consolePlans,
  }

  const encodedConsole = JSON.stringify(consolePayload).replaceAll("<", "\\u003c")

  function unique(values: readonly string[]): string[] {
    return [...new Set(values)]
  }

  function newest(values: readonly string[]): string {
    return values.reduce((latest, value) => (value > latest ? value : latest), MISSING)
  }

  function benchmarkSourceIds(ids: readonly string[]): string[] {
    return ids.map((id) => {
      const sourceId = BENCHMARK_SOURCE_IDS.get(id)

      if (sourceId === undefined) {
        throw new Error(`Homepage headline has no source for benchmark ${id}`)
      }

      return sourceId
    })
  }

  const largestAllowance = tokenAllowances.reduce((largest, row) =>
    row.value_multiple > largest.value_multiple ? row : largest,
  )

  const largestAllowancePlan = plansById.get(largestAllowance.plan_id)

  const largestAllowanceModel = models.find((model) => model.id === largestAllowance.model_id)

  if (largestAllowancePlan === undefined || largestAllowanceModel === undefined) {
    throw new Error("Homepage headline needs names for the largest committed value multiple")
  }

  let topComposite:
    | {
        modelId: string
        composite: number
        k: number
        benchmarksUsed: string[]
      }
    | undefined

  for (const [modelId, row] of compositeByModel) {
    if (
      row.k >= 2 &&
      row.composite !== null &&
      (topComposite === undefined || row.composite > topComposite.composite)
    ) {
      topComposite = {
        modelId,
        composite: row.composite,
        k: row.k,
        benchmarksUsed: row.benchmarks_used,
      }
    }
  }

  if (topComposite === undefined) {
    throw new Error("Homepage headline needs a composite row with at least two benchmarks")
  }

  const topCompositeModel = models.find((model) => model.id === topComposite.modelId)

  if (topCompositeModel === undefined) {
    throw new Error("Homepage headline needs a name for the top composite model")
  }

  const unpricedModels = models.filter((model) => !bestRouteByModel.has(model.id))

  const unresolvedPlans = plans.filter((plan) => plan.quota_unresolved === true)

  const headlineIndexRows: ProvenanceListingRow[] = [
    {
      id: "headline-largest-multiple",
      label: `Largest value multiple · ${largestAllowancePlan.name} for ${largestAllowanceModel.name}`,
      value: formatMultiple(largestAllowance.value_multiple),
      basis: `plan route ÷ API list · ${largestAllowance.blend} · ${largestAllowance.cache_caveat}`,
      confidence: largestAllowancePlan.confidence,
      sourceIds: unique([...largestAllowancePlan.sources, ...largestAllowanceModel.evidence]),
      retrieved: largestAllowancePlan.retrieved_at,
      href: href(`/plans/${largestAllowancePlan.id}`),
    },
    {
      id: "headline-cross-check",
      label: `Cross-check median ratio · ${formatCount(derived.cross_check.summary.pair_count)} pairs · ${formatMultiple(derived.cross_check.summary.min_ratio)}–${formatMultiple(derived.cross_check.summary.max_ratio)}`,
      value: formatMultiple(derived.cross_check.summary.median_ratio),
      basis: "plan route ÷ API list",
      confidence: MISSING,
      sourceIds: unique(
        derived.cross_check.pairs.flatMap(
          (pair) => models.find((model) => model.id === pair.model_id)?.evidence ?? [],
        ),
      ),
      retrieved: derivedGeneratedAt.slice(0, 10),
      href: href("/method"),
    },
    {
      id: "headline-composite",
      label: `Highest composite · ${topCompositeModel.name} · ${topComposite.benchmarksUsed.map((id) => benchmarks.find((benchmark) => benchmark.id === id)?.title ?? id).join(", ")} · k=${formatCount(topComposite.k)}`,
      value: formatCount(topComposite.composite),
      basis: "pass@1",
      confidence: MISSING,
      sourceIds: benchmarkSourceIds(topComposite.benchmarksUsed),
      retrieved: newest(
        topComposite.benchmarksUsed.map(
          (id) => benchmarks.find((benchmark) => benchmark.id === id)?.retrieved_at ?? MISSING,
        ),
      ),
      href: href(`/models/${topCompositeModel.id}`),
    },
    {
      id: "headline-unpriced-models",
      label: "Committed models with no priced plan route",
      value: formatCount(unpricedModels.length),
      basis: "committed models",
      confidence: MISSING,
      sourceIds: unique(unpricedModels.flatMap((model) => model.evidence)),
      retrieved: newest(unpricedModels.map((model) => model.retrieved_at)),
      href: href("/models"),
    },
    {
      id: "headline-unresolved-plans",
      label: "Committed plans with unresolved quota",
      value: formatCount(unresolvedPlans.length),
      basis: "committed plans",
      confidence: MISSING,
      sourceIds: unique(unresolvedPlans.flatMap((plan) => plan.sources)),
      retrieved: newest(unresolvedPlans.map((plan) => plan.retrieved_at)),
      href: href("/plans"),
    },
  ]

  const modelCountSources = unique(models.flatMap((model) => model.evidence))

  const headlineFigureRows: ProvenanceListingRow[] = [
    {
      id: "figure-committed-models",
      label: "Committed models",
      value: formatCount(models.length),
      basis: "committed models",
      confidence: MISSING,
      sourceIds: modelCountSources,
      retrieved: newest(models.map((model) => model.retrieved_at)),
      href: href("/models"),
    },
    {
      id: "figure-benchmark-versions",
      label: `Benchmark versions · ${benchmarks.map((benchmark) => `${benchmark.title} (version ${benchmark.version})`).join(", ")}`,
      value: formatCount(benchmarks.length),
      basis: "benchmark versions",
      confidence: MISSING,
      sourceIds: benchmarkSourceIds(benchmarks.map((benchmark) => benchmark.id)),
      retrieved: newest(benchmarks.map((benchmark) => benchmark.retrieved_at)),
      href: href("/explore"),
    },
    {
      id: "figure-committed-plans",
      label: "Committed plans",
      value: formatCount(plans.length),
      basis: "committed plans",
      confidence: MISSING,
      sourceIds: unique(plans.flatMap((plan) => plan.sources)),
      retrieved: newest(plans.map((plan) => plan.retrieved_at)),
      href: href("/plans"),
    },
    {
      id: "figure-api-frontier",
      label: "API-list Pareto frontier points",
      value: formatCount(apiFrontier.frontier.length),
      basis: COST_BASIS_TERMS["api-list"].label,
      confidence: MISSING,
      sourceIds: unique(
        apiFrontier.points.flatMap(
          (point) => models.find((model) => model.id === point.id)?.evidence ?? [],
        ),
      ),
      retrieved: newest(models.map((model) => model.retrieved_at)),
      href: href("/explore"),
    },
  ]

  const setAsideEntries: SetAsideEntry[] = budgetWaterfall.plans
    .filter((entry) => entry.reason !== null)
    .map((entry) => {
      const plan = plansById.get(entry.planId)

      if (plan === undefined || entry.reason === null) {
        throw new Error(`Homepage set-aside row is incomplete for ${entry.planId}`)
      }

      return {
        planId: entry.planId,
        planName: plan.name,
        provider: plan.provider,
        sourceIds: plan.sources,
        reason: entry.reason,
      }
    })

  const defaultPlanRoutes = routesByPlan.get(CONSOLE_DEFAULT_PLAN_ID) ?? []

  return {
    defaultPlanId: CONSOLE_DEFAULT_PLAN_ID,
    defaultTasks: CONSOLE_DEFAULT_TASKS,
    tasksStep: CONSOLE_TASKS_STEP,
    plans: plans.map((plan) => ({ id: plan.id, name: plan.name })),
    defaultModelId: defaultModel,
    defaultModels: defaultPlanRoutes.map((route) => ({
      modelId: route.model_id,
      modelName: route.model_name,
    })),
    initialRows,
    initialReadout,
    initialRouteCount: initialRows.length,
    largestMultiple: {
      value: largestAllowance.value_multiple,
      planName: largestAllowancePlan.name,
      modelName: largestAllowanceModel.name,
    },
    setAside: setAsideEntries,
    headlineIndexRows,
    headlineFigureRows,
    payload: encodedConsole,
  }
}
