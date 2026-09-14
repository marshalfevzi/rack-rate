// The site's one reader of committed data. Nothing else under apps/site imports
// committed JSON directly. Astro frontmatter is the only caller, so this module
// never enters a browser bundle.
//
// Parsed, not cast: the committed files are a trust boundary even though the
// data CLI validated them, so a shape change fails the build, not a page.
import { BenchmarksFile, DerivedFile, ModelsFile, PlansFile, SourcesFile } from "@rack-rate/core"
import type {
  Benchmark,
  CrossCheck,
  DerivedBestRoute,
  DerivedCompositeRow,
  DerivedKnownGap,
  DerivedPair,
  DerivedParetoFrontier,
  DerivedTokenAllowanceRow,
  Model,
  PairBadge,
  Plan,
  PlanKnownGap,
  QuotaModelDocs,
  Source,
} from "@rack-rate/core"

import benchmarksDocument from "../../../../data/benchmarks.json"
import derivedDocument from "../../../../data/derived.json"
import modelsDocument from "../../../../data/models.json"
import plansDocument from "../../../../data/plans.json"
import sourcesDocument from "../../../../data/sources.json"

const modelsData = ModelsFile.parse(modelsDocument)

const plansData = PlansFile.parse(plansDocument)

const benchmarksData = BenchmarksFile.parse(benchmarksDocument)

const sourcesData = SourcesFile.parse(sourcesDocument)

// One row per model. `Model.id` is the slug for /models/[slug]: it is already
// a stable kebab-case key, so no separate slug mapping exists to drift.
export const models: Model[] = modelsData.models

// One row per plan. `Plan.id` is the slug for /plans/[slug]. Every committed
// plan gets a page, including the ones whose quota is still unresolved.
export const plans: Plan[] = plansData.plans

export const planKnownGaps: PlanKnownGap[] = plansData.known_gaps

export const quotaModelDocs: QuotaModelDocs = plansData.quota_model_docs

// One entry per committed benchmark version, never per benchmark family: the
// version is part of row identity (invariant 1). Artificial Analysis has no
// entry unless publication is enabled, and is never synthesized to fill a slot.
export const benchmarks: Benchmark[] = benchmarksData.benchmarks

export const sources: Source[] = sourcesData.sources

export const derived: DerivedFile = DerivedFile.parse(derivedDocument)

const modelsByIdIndex = new Map<string, Model>()

for (const model of models) {
  modelsByIdIndex.set(model.id, model)
}

// An unknown id returns `undefined` rather than throwing: an id that upstream
// retired must degrade to a missing row, not crash the build.
export const modelsById: ReadonlyMap<string, Model> = modelsByIdIndex

const plansByIdIndex = new Map<string, Plan>()

for (const plan of plans) {
  plansByIdIndex.set(plan.id, plan)
}

export const plansById: ReadonlyMap<string, Plan> = plansByIdIndex

const benchmarksByIdIndex = new Map<string, Benchmark>()

for (const benchmark of benchmarks) {
  benchmarksByIdIndex.set(benchmark.id, benchmark)
}

export const benchmarksById: ReadonlyMap<string, Benchmark> = benchmarksByIdIndex

const sourcesByIdIndex = new Map<string, Source>()

for (const source of sources) {
  sourcesByIdIndex.set(source.id, source)
}

export const sourcesById: ReadonlyMap<string, Source> = sourcesByIdIndex

// `::` cannot occur in the kebab-case model and plan ids, so the two key
// components cannot bleed into each other.
export function pairKey(modelId: string, planId: string): string {
  return `${modelId}::${planId}`
}

const routesByModelIndex = new Map<string, DerivedPair[]>()

const routesByPlanIndex = new Map<string, DerivedPair[]>()

for (const pair of derived.pairs) {
  const modelRoutes = routesByModelIndex.get(pair.model_id)

  if (modelRoutes === undefined) {
    routesByModelIndex.set(pair.model_id, [pair])
  } else {
    modelRoutes.push(pair)
  }

  const planRoutes = routesByPlanIndex.get(pair.plan_id)

  if (planRoutes === undefined) {
    routesByPlanIndex.set(pair.plan_id, [pair])
  } else {
    planRoutes.push(pair)
  }
}

export const routesByModel: ReadonlyMap<string, readonly DerivedPair[]> = routesByModelIndex

export const routesByPlan: ReadonlyMap<string, readonly DerivedPair[]> = routesByPlanIndex

const bestRouteByModelIndex = new Map<string, DerivedBestRoute>()

for (const route of derived.best_routes) {
  bestRouteByModelIndex.set(route.model_id, route)
}

export const bestRouteByModel: ReadonlyMap<string, DerivedBestRoute> = bestRouteByModelIndex

// The computed sections are optional in the schema because a hand-written
// document may omit them, but the committed one must carry all four.
function requiredSection<T>(section: T | undefined, key: string): T {
  if (section === undefined) {
    throw new Error(`data/derived.json is missing the ${key} section`)
  }

  return section
}

const composites = requiredSection(derived.composites, "composites")

const frontiers = requiredSection(derived.frontiers, "frontiers")

const tokenAllowanceRows = requiredSection(derived.token_allowances, "token_allowances")

const badges = requiredSection(derived.badges, "badges")

// The reference moment every freshness verdict is measured against: the newest
// upstream `generated_at` among the inputs that feed `compute`, not the wall
// clock. Optional in the schema because a hand-written document may omit it, but
// a dated row cannot exist without it, so its absence fails the build instead of
// rendering an undated badge.
const generatedAt = derived.generated_at

if (generatedAt === undefined) {
  throw new Error("data/derived.json has no generated_at; freshness cannot be dated")
}

export const derivedGeneratedAt: string = generatedAt

const compositeByModelIndex = new Map<string, DerivedCompositeRow>()

for (const row of composites.rows) {
  compositeByModelIndex.set(row.model_id, row)
}

export const compositeByModel: ReadonlyMap<string, DerivedCompositeRow> = compositeByModelIndex

export const compositeWeights: Readonly<Record<string, number>> = composites.weights

export const apiFrontier: DerivedParetoFrontier = frontiers.api

export const frontierByPlan: ReadonlyMap<string, DerivedParetoFrontier> = new Map(
  Object.entries(frontiers.plan_adjusted),
)

export const tokenAllowances: readonly DerivedTokenAllowanceRow[] = tokenAllowanceRows

const tokenAllowanceByPairIndex = new Map<string, DerivedTokenAllowanceRow>()

for (const row of tokenAllowances) {
  tokenAllowanceByPairIndex.set(pairKey(row.model_id, row.plan_id), row)
}

export const tokenAllowanceByPair: ReadonlyMap<string, DerivedTokenAllowanceRow> =
  tokenAllowanceByPairIndex

const badgeByPairIndex = new Map<string, PairBadge>()

for (const badge of badges.per_pair) {
  badgeByPairIndex.set(pairKey(badge.model_id, badge.plan_id), badge)
}

export const badgeByPair: ReadonlyMap<string, PairBadge> = badgeByPairIndex

export const crossCheck: CrossCheck = derived.cross_check

export const derivedKnownGaps: readonly DerivedKnownGap[] = derived.known_gaps
