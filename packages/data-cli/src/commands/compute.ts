/**
 * Compute the committed derived document without consulting the wall clock.
 * `generated_at` is the newest exact `generated_at` string among models.json and
 * every benchmark entry in benchmarks.json, so rerunning with unchanged inputs
 * produces the same bytes.
 *
 * Legacy cost fields retain their established precision: `tasks_per_month` and
 * `days_for_full_run` use 2 decimal places, while `cost_per_task_usd` uses 4.
 * Numeric fields in the published computed sections use 4 decimal places with
 * half-to-even rounding; authored weights, integer counts, and badge metadata
 * retain their source precision.
 */

import type {
  BenchmarkSample,
  BenchmarksFile as BenchmarksDocument,
  CompositeRow,
  CostedPair,
  DerivedFile as DerivedDocument,
  Model,
  NormalizedBenchmark,
  ParetoFrontier,
  ParetoPoint,
  Plan,
  TokenAllowanceRow,
} from "@rack-rate/core"
import {
  BenchmarksFile,
  buildPairs,
  bestRoutes,
  composite,
  crossCheck,
  DerivedFile,
  isStale,
  ModelsFile,
  paretoFrontier,
  PlansFile,
  roundHalfEven,
  tokenAllowance,
  zScores,
} from "@rack-rate/core"
import { dataPath, info, readJsonAs, warn, writeJson } from "../paths.ts"

type FrontierDocument = {
  api: ParetoFrontier
  plan_adjusted: Record<string, ParetoFrontier>
}

function roundCompositeRow(row: CompositeRow): CompositeRow {
  return {
    ...row,
    weighted_z: roundHalfEven(row.weighted_z, 4),
    composite: row.composite === null ? null : roundHalfEven(row.composite, 4),
    ci_lo: row.ci_lo === null ? null : roundHalfEven(row.ci_lo, 4),
    ci_hi: row.ci_hi === null ? null : roundHalfEven(row.ci_hi, 4),
  }
}

function roundFrontier(frontier: ParetoFrontier): ParetoFrontier {
  return {
    ...frontier,
    points: frontier.points.map((point) => ({
      ...point,
      cost: roundHalfEven(point.cost, 4),
      score: roundHalfEven(point.score, 4),
      distance: {
        ...point.distance,
        delta_score: roundHalfEven(point.distance.delta_score, 4),
        cost_ratio: roundHalfEven(point.distance.cost_ratio, 4),
      },
    })),
  }
}

function roundTokenAllowance(row: TokenAllowanceRow): TokenAllowanceRow {
  return {
    ...row,
    tokens_per_month_allowance: roundHalfEven(row.tokens_per_month_allowance, 4),
    allowance_per_million_tokens: roundHalfEven(row.allowance_per_million_tokens, 4),
    adjusted_api_cost_per_million: roundHalfEven(row.adjusted_api_cost_per_million, 4),
    value_multiple: roundHalfEven(row.value_multiple, 4),
  }
}

function newestGeneratedAt(
  modelsGeneratedAt: string,
  benchmarks: readonly { generated_at: string }[],
): string {
  let newest = modelsGeneratedAt
  let newestTime = Date.parse(modelsGeneratedAt)

  for (const benchmark of benchmarks) {
    const benchmarkTime = Date.parse(benchmark.generated_at)

    if (benchmarkTime > newestTime) {
      newest = benchmark.generated_at
      newestTime = benchmarkTime
    }
  }

  return newest
}

function matchKind(model: Model, plan: Plan): "any" | "exact" | "provider" {
  if (plan.model_scope === "any") {
    return "any"
  }

  if (plan.model_scope.includes(model.id)) {
    return "exact"
  }

  return "provider"
}

function normalizeBenchmarks(benchmarks: BenchmarksDocument["benchmarks"]) {
  const normalized: NormalizedBenchmark[] = []
  const weights: Record<string, number> = {}
  const weightMap = new Map<string, number>()

  for (const benchmark of benchmarks) {
    if (benchmark.rows.length === 0) {
      warn(`benchmark ${benchmark.id} has no rows; omitted from composites`)

      continue
    }

    const samples: BenchmarkSample[] = []

    for (const row of benchmark.rows) {
      const sample: BenchmarkSample = {
        model_id: row.model_id,
        score: row.score,
      }

      if (row.ci_lo !== undefined) {
        sample.ci_lo = row.ci_lo
      }

      if (row.ci_hi !== undefined) {
        sample.ci_hi = row.ci_hi
      }

      samples.push(sample)
    }

    // The benchmark schema stores scores and intervals in 0-100 units at the
    // ingest boundary; no conversion or imputation belongs in this join.
    normalized.push(zScores(benchmark.id, benchmark.version, samples))
    weights[benchmark.id] = 1
    weightMap.set(benchmark.id, 1)
  }

  return { normalized, weights, weightMap }
}

function makeApiFrontier(models: readonly Model[]): ParetoFrontier {
  const points: ParetoPoint[] = []

  for (const model of models) {
    points.push({
      id: model.id,
      cost: model.api_cost_per_task_usd,
      score: model.score_pct,
    })
  }

  return roundFrontier(paretoFrontier(points))
}

function makePlanFrontiers(plans: readonly Plan[], pairs: readonly CostedPair[]) {
  const frontiers: Record<string, ParetoFrontier> = {}

  for (const plan of plans) {
    const points: ParetoPoint[] = []

    for (const pair of pairs) {
      if (pair.plan_id !== plan.id) {
        continue
      }

      points.push({
        id: pair.model_id,
        cost: pair.cost_per_task_usd,
        score: pair.score_pct,
      })
    }

    if (points.length === 0) {
      continue
    }

    frontiers[plan.id] = roundFrontier(paretoFrontier(points))
  }

  return frontiers
}

function makeTokenAllowances(
  pairs: readonly CostedPair[],
  modelsById: ReadonlyMap<string, Model>,
  plansById: ReadonlyMap<string, Plan>,
): TokenAllowanceRow[] {
  const rows: TokenAllowanceRow[] = []

  for (const pair of pairs) {
    const model = modelsById.get(pair.model_id)
    const plan = plansById.get(pair.plan_id)

    if (model === undefined || plan === undefined) {
      throw new Error(`Cannot resolve pair ${pair.model_id} × ${pair.plan_id}`)
    }

    const row = tokenAllowance(model, plan)

    if (row !== null) {
      rows.push(roundTokenAllowance(row))
    }
  }

  return rows
}

function makeBadges(
  pairs: readonly CostedPair[],
  modelsById: ReadonlyMap<string, Model>,
  plansById: ReadonlyMap<string, Plan>,
  generatedAt: string,
  composites: readonly CompositeRow[],
): NonNullable<DerivedDocument["badges"]> {
  const compositeByModel = new Map<string, CompositeRow>()

  for (const row of composites) {
    compositeByModel.set(row.model_id, row)
  }

  const perPair: NonNullable<DerivedDocument["badges"]>["per_pair"] = []

  for (const pair of pairs) {
    const model = modelsById.get(pair.model_id)
    const plan = plansById.get(pair.plan_id)

    if (model === undefined || plan === undefined) {
      throw new Error(`Cannot resolve pair ${pair.model_id} × ${pair.plan_id}`)
    }

    const compositeRow = compositeByModel.get(model.id)

    const freshness =
      isStale(model.retrieved_at, generatedAt) || isStale(plan.retrieved_at, generatedAt)
        ? "stale"
        : "fresh"

    perPair.push({
      model_id: model.id,
      plan_id: plan.id,
      confidence: plan.confidence,
      freshness,
      price_status: plan.price_status ?? "list",
      ci: model.ci_lo !== undefined && model.ci_hi !== undefined ? "reported" : "absent",
      match: matchKind(model, plan),
      coverage: compositeRow?.badge ?? "single-source",
    })
  }

  return { per_pair: perPair }
}

function printFrontierCount(name: string, frontier: ParetoFrontier): void {
  info(`frontier ${name}: ${frontier.points.length} points, ${frontier.frontier.length} frontier`)
}

function printCounts(
  pairs: readonly CostedPair[],
  routes: readonly CostedPair[],
  crossCheckPairs: number,
  composites: readonly CompositeRow[],
  frontiers: FrontierDocument,
  tokenAllowances: readonly TokenAllowanceRow[],
  badges: NonNullable<DerivedDocument["badges"]>,
): void {
  let covered = 0
  let singleSource = 0

  for (const row of composites) {
    if (row.badge === "ok") {
      covered += 1
    } else {
      singleSource += 1
    }
  }

  info(`pairs: ${pairs.length}`)
  info(`best routes: ${routes.length}`)
  info(`cross-check pairs: ${crossCheckPairs}`)
  info(`composite coverage: ${covered} models reached k >= 2, ${singleSource} single-source`)
  printFrontierCount("api", frontiers.api)

  for (const [planId, frontier] of Object.entries(frontiers.plan_adjusted)) {
    printFrontierCount(planId, frontier)
  }

  info(`token_allowance rows: ${tokenAllowances.length}`)
  info(`badge rows: ${badges.per_pair.length}`)

  const sampleFrontierIds = frontiers.api.frontier.slice(0, 3)

  info(`frontier api sample: ${sampleFrontierIds.join(", ") || "(none)"}`)

  const dominated = frontiers.api.points.find((point) => !point.on_frontier)

  if (dominated !== undefined) {
    info(
      `frontier api dominated sample: ${dominated.id} distance ` +
        `delta_score=${dominated.distance.delta_score} ` +
        `cost_ratio=${dominated.distance.cost_ratio} ` +
        `frontier_id=${dominated.distance.frontier_id ?? "none"}`,
    )
  }
}

function printHelp(): void {
  console.log("Usage: bun run packages/data-cli/src/commands/compute.ts [--help]")
  console.log("Computes data/derived.json deterministically from committed data files.")
}

export async function buildDerivedDocument(): Promise<DerivedDocument> {
  const modelsDocument = await readJsonAs(dataPath("models.json"), ModelsFile)
  const plansDocument = await readJsonAs(dataPath("plans.json"), PlansFile)
  const benchmarksDocument = await readJsonAs(dataPath("benchmarks.json"), BenchmarksFile)
  const taskCount = modelsDocument.task_count
  const pairs = buildPairs(modelsDocument.models, plansDocument.plans, taskCount)
  const routes = bestRoutes(pairs)
  const crossCheckDocument = crossCheck(modelsDocument.models, plansDocument.plans)

  const generatedAt = newestGeneratedAt(modelsDocument.generated_at, benchmarksDocument.benchmarks)

  const { normalized, weights, weightMap } = normalizeBenchmarks(benchmarksDocument.benchmarks)
  const compositeRows = composite(normalized, { weights: weightMap }).map(roundCompositeRow)
  const apiFrontier = makeApiFrontier(modelsDocument.models)
  const planAdjusted = makePlanFrontiers(plansDocument.plans, pairs)
  const frontiers: FrontierDocument = { api: apiFrontier, plan_adjusted: planAdjusted }
  const modelsById = new Map<string, Model>()
  const plansById = new Map<string, Plan>()

  for (const model of modelsDocument.models) {
    modelsById.set(model.id, model)
  }

  for (const plan of plansDocument.plans) {
    plansById.set(plan.id, plan)
  }

  const tokenAllowances = makeTokenAllowances(pairs, modelsById, plansById)
  const badges = makeBadges(pairs, modelsById, plansById, generatedAt, compositeRows)

  const derived: DerivedDocument = {
    generated_from: {
      models: modelsDocument.models.length,
      plans: plansDocument.plans.length,
      task_count: taskCount,
    },
    pairs,
    best_routes: routes,
    cross_check: crossCheckDocument,
    known_gaps: plansDocument.known_gaps,
    generated_at: generatedAt,
    composites: { weights, rows: compositeRows },
    frontiers,
    token_allowances: tokenAllowances,
    badges,
  }

  const parsed = DerivedFile.safeParse(derived)

  if (!parsed.success) {
    throw new Error(`computed derived document failed schema validation: ${parsed.error.message}`)
  }

  return parsed.data
}

export async function run(args: string[]): Promise<number> {
  if (args.includes("--help")) {
    printHelp()

    return 0
  }

  for (const arg of args) {
    if (arg !== "--help") {
      console.error(`rack-rate-data: unknown compute argument '${arg}'`)

      return 1
    }
  }

  try {
    const derived = await buildDerivedDocument()

    if (
      derived.composites === undefined ||
      derived.frontiers === undefined ||
      derived.token_allowances === undefined ||
      derived.badges === undefined
    ) {
      throw new Error("computed derived document omitted required computed sections")
    }

    await writeJson(dataPath("derived.json"), derived)
    printCounts(
      derived.pairs,
      derived.best_routes,
      derived.cross_check.pairs.length,
      derived.composites.rows,
      derived.frontiers,
      derived.token_allowances,
      derived.badges,
    )

    return 0
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.error(`rack-rate-data: compute failed: ${reason}`)

    return 1
  }
}

if (import.meta.main) {
  process.exit(await run(Bun.argv.slice(2)))
}
