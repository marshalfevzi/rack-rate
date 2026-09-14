import type { TokenAllowanceRow as CostTokenAllowanceRow } from "./cost.ts"
import type { CompositeRow as NormalizeCompositeRow } from "./normalize.ts"
import type {
  FrontierDistance as ParetoFrontierDistance,
  FrontierPoint as ParetoFrontierPoint,
  ParetoFrontier as ParetoFrontierDocument,
} from "./pareto.ts"
import { z } from "zod"

const ReasoningEffort = z.enum(["low", "medium", "high", "xhigh", "max"])

const Confidence = z.enum(["measured", "high", "medium", "low"])

const CostBasis = z.enum(["list", "expected-launch", "disputed", "unknown"])

const QuotaModel = z.enum(["budget", "credits", "requests", "tokens_total"])

export const Source = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.url(),
  license: z.string().min(1),
  retrieved: z.iso.date(),
  covers: z.string().min(1),
  changes: z.string().min(1),
  summary: z.string().min(1),
  license_short: z.string().min(1).optional(),
  attribution: z.string().min(1).optional(),
  credited_contributor: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
})

export type Source = z.infer<typeof Source>

export const SourcesFile = z.strictObject({
  sources: z.array(Source),
})

export type SourcesFile = z.infer<typeof SourcesFile>

export const EffortVariant = z.strictObject({
  reasoning_effort: ReasoningEffort,
  score_pct: z.number().min(0).max(100),
  api_cost_per_task_usd: z.number().nonnegative(),
  output_tokens_per_task: z.number().nonnegative(),
  input_tokens_per_task: z.number().nonnegative(),
  agent_steps_per_task: z.number().positive(),
})

export type EffortVariant = z.infer<typeof EffortVariant>

export const Model = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1).nullable(),
  provider_slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .nullable(),
  score_pct: z.number().min(0).max(100),
  score_pass_at_4_pct: z.number().min(0).max(100),
  reasoning_effort: ReasoningEffort.nullable(),
  api_cost_per_task_usd: z.number().nonnegative(),
  input_tokens_per_task: z.number().nonnegative(),
  output_tokens_per_task: z.number().nonnegative(),
  agent_steps_per_task: z.number().positive(),
  n_tasks_attempted: z.number().int().positive(),
  evidence: z.array(z.string().min(1)).min(1),
  effort_variants: z.array(EffortVariant).optional(),
  benchmark_version: z.string().regex(/^[a-z0-9-]+@[0-9][\w.-]*$/),
  ci_lo: z.number().min(0).max(1).optional(),
  ci_hi: z.number().min(0).max(1).optional(),
  ci_method: z.string().min(1).optional(),
  cost_basis: CostBasis,
  retrieved_at: z.iso.date(),
  // Vendor list rate card, USD per 1M tokens. The credits conversion branch
  // (PLAN 2.7, ported from the legacy compute.py) needs the output:input weight
  // these two fields define, so the branch exists for the data contract even
  // though no committed row carries a rate today — none of the fetched sources
  // publishes one, and PLAN 2.7b derives its blended rate from measured tokens
  // instead rather than inventing a rate.
  input_rate_per_mtok_usd: z.number().nonnegative().optional(),
  output_rate_per_mtok_usd: z.number().nonnegative().optional(),
})

export type Model = z.infer<typeof Model>

export const ModelsFile = z.strictObject({
  source: z.string().min(1),
  source_url: z.url(),
  repo_url: z.url(),
  license: z.string().min(1),
  task_count: z.number().int().positive(),
  generated_at: z.iso.datetime({ offset: true }),
  harness: z.string().min(1),
  note: z.string().min(1),
  models: z.array(Model),
})

export type ModelsFile = z.infer<typeof ModelsFile>

export const Fx = z.strictObject({
  rate: z.number().positive(),
  date: z.iso.date(),
})

export type Fx = z.infer<typeof Fx>

export const QuotaModelDocs = z.strictObject({
  budget: z.array(z.string().min(1)),
  credits: z.array(z.string().min(1)),
  requests: z.array(z.string().min(1)),
  tokens_total: z.array(z.string().min(1)),
  _note: z.string().min(1),
  model_scope: z.string().min(1),
})

export type QuotaModelDocs = z.infer<typeof QuotaModelDocs>

export const Plan = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  price_usd_month: z.number().nonnegative(),
  quota_model: QuotaModel,
  quota_usd_month: z.number().nonnegative().optional(),
  credits_month: z.number().positive().optional(),
  tokens_month: z.number().positive().optional(),
  requests_month: z.number().positive().optional(),
  confidence: Confidence,
  method: z.string().min(1),
  evidence: z.array(z.string().min(1)).min(1),
  sources: z.array(z.string().min(1)).min(1),
  available: z.boolean(),
  model_scope: z.union([z.literal("any"), z.array(z.string().min(1)).min(1)]),
  model_scope_note: z.string().min(1).optional(),
  quota_unresolved: z.boolean().optional(),
  quota_note: z.string().min(1).optional(),
  rolling_window_hours: z.number().positive().optional(),
  rolling_window_usd: z.number().nonnegative().optional(),
  measured_against_model: z.string().min(1).optional(),
  cross_check_tokens_month: z.number().nonnegative().optional(),
  // Fallback named by PLAN 2.7 and data/plans.json#quota_model_docs._note for a
  // model DeepSWE has not measured, so the requests branch can still price a pair.
  agent_steps_per_task_assumed: z.number().positive().optional(),
  // PLAN 2.6: an unavailable plan must say why. Required by validation when
  // available is false; omitted on every currently committed plan.
  unavailable_reason: z.string().min(1).optional(),
  fx: Fx.optional(),
  price_status: z.enum(["list", "disputed"]).optional(),
  retrieved_at: z.iso.date(),
})

export type Plan = z.infer<typeof Plan>

export const PlanKnownGap = z.strictObject({
  plan: z.string().min(1),
  provider: z.string().min(1),
  reason: z.string().min(1),
})

export type PlanKnownGap = z.infer<typeof PlanKnownGap>

export const PlansFile = z.strictObject({
  quota_model_docs: QuotaModelDocs,
  plans: z.array(Plan),
  known_gaps: z.array(PlanKnownGap),
})

export type PlansFile = z.infer<typeof PlansFile>

export const BenchmarkRow = z.strictObject({
  model_id: z.string().min(1),
  score: z.number().min(0).max(100),
  ci_lo: z.number().min(0).max(100).optional(),
  ci_hi: z.number().min(0).max(100).optional(),
  cost_per_task_usd: z.number().nonnegative().optional(),
  cost_basis: CostBasis.optional(),
  tokens_input: z.number().nonnegative().optional(),
  tokens_output: z.number().nonnegative().optional(),
  steps: z.number().positive().optional(),
  provenance: z.record(z.string(), z.string()),
})

export type BenchmarkRow = z.infer<typeof BenchmarkRow>

export const Benchmark = z.strictObject({
  id: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  url: z.url(),
  generated_at: z.iso.datetime({ offset: true }),
  task_count: z.number().int().positive(),
  unit: z.enum(["pass@1", "accuracy", "index"]),
  scale: z.enum(["0-1", "0-100", "z"]),
  retrieved_at: z.iso.date(),
  rows: z.array(BenchmarkRow),
})

export type Benchmark = z.infer<typeof Benchmark>

export const BenchmarksFile = z.strictObject({
  benchmarks: z.array(Benchmark),
})

export type BenchmarksFile = z.infer<typeof BenchmarksFile>

export const DerivedGeneratedFrom = z.strictObject({
  models: z.number().int().positive(),
  plans: z.number().int().positive(),
  task_count: z.number().int().positive(),
})

export type DerivedGeneratedFrom = z.infer<typeof DerivedGeneratedFrom>

export const DerivedPair = z.strictObject({
  model_id: z.string().min(1),
  model_name: z.string().min(1),
  score_pct: z.number().min(0).max(100),
  plan_id: z.string().min(1),
  plan_name: z.string().min(1),
  provider: z.string().min(1),
  price_usd_month: z.number().nonnegative(),
  api_cost_per_task_usd: z.number().nonnegative(),
  tasks_per_month: z.number().nonnegative(),
  cost_per_task_usd: z.number().nonnegative(),
  days_for_full_run: z.number().nonnegative().nullable(),
  quota_method: QuotaModel,
  confidence: Confidence,
})

export type DerivedPair = z.infer<typeof DerivedPair>

export const DerivedBestRoute = DerivedPair

export type DerivedBestRoute = z.infer<typeof DerivedBestRoute>

export const CrossCheckPair = z.strictObject({
  plan_id: z.string().min(1),
  plan_name: z.string().min(1),
  model_id: z.string().min(1),
  model_name: z.string().min(1),
  tasks_by_dollars: z.number().nonnegative(),
  tasks_by_tokens: z.number().nonnegative(),
  ratio: z.number().positive(),
})

export type CrossCheckPair = z.infer<typeof CrossCheckPair>

export const CrossCheckSummary = z.strictObject({
  median_ratio: z.number().nonnegative(),
  min_ratio: z.number().nonnegative(),
  max_ratio: z.number().nonnegative(),
  pair_count: z.number().int().nonnegative(),
})

export type CrossCheckSummary = z.infer<typeof CrossCheckSummary>

export const CrossCheck = z.strictObject({
  pairs: z.array(CrossCheckPair),
  summary: CrossCheckSummary,
})

export type CrossCheck = z.infer<typeof CrossCheck>

export const DerivedKnownGap = z.strictObject({
  plan: z.string().min(1),
  provider: z.string().min(1),
  reason: z.string().min(1),
  url: z.url().optional(),
})

export type DerivedKnownGap = z.infer<typeof DerivedKnownGap>

export const DerivedCompositeRow: z.ZodType<NormalizeCompositeRow> = z.strictObject({
  model_id: z.string().min(1),
  weighted_z: z.number(),
  composite: z.number().nullable(),
  k: z.number().int().nonnegative(),
  benchmarks_used: z.array(z.string().min(1)),
  badge: z.enum(["ok", "single-source"]),
  ci_lo: z.number().nullable(),
  ci_hi: z.number().nullable(),
})

export type DerivedCompositeRow = z.infer<typeof DerivedCompositeRow>

export const DerivedComposites = z.strictObject({
  weights: z.record(z.string().min(1), z.number()),
  rows: z.array(DerivedCompositeRow),
})

export type DerivedComposites = z.infer<typeof DerivedComposites>

export const DerivedFrontierDistance: z.ZodType<ParetoFrontierDistance> = z.strictObject({
  delta_score: z.number().nonnegative(),
  cost_ratio: z.number().nonnegative(),
  frontier_id: z.string().min(1).nullable(),
})

export type DerivedFrontierDistance = z.infer<typeof DerivedFrontierDistance>

export const DerivedFrontierPoint: z.ZodType<ParetoFrontierPoint> = z.strictObject({
  id: z.string().min(1),
  cost: z.number().nonnegative(),
  score: z.number(),
  on_frontier: z.boolean(),
  distance: DerivedFrontierDistance,
})

export type DerivedFrontierPoint = z.infer<typeof DerivedFrontierPoint>

export const DerivedParetoFrontier: z.ZodType<ParetoFrontierDocument> = z.strictObject({
  points: z.array(DerivedFrontierPoint),
  frontier: z.array(z.string().min(1)),
  groups: z.array(z.array(z.string().min(1))),
  dominated: z.array(z.string().min(1)),
})

export type DerivedParetoFrontier = z.infer<typeof DerivedParetoFrontier>

export const DerivedFrontiers = z.strictObject({
  api: DerivedParetoFrontier,
  plan_adjusted: z.record(z.string().min(1), DerivedParetoFrontier),
})

export type DerivedFrontiers = z.infer<typeof DerivedFrontiers>

export const DerivedTokenAllowanceRow: z.ZodType<CostTokenAllowanceRow> = z.strictObject({
  model_id: z.string().min(1),
  plan_id: z.string().min(1),
  blend: z.string().min(1),
  tokens_per_month_allowance: z.number().nonnegative(),
  tokens_per_task: z.number().nonnegative(),
  allowance_per_million_tokens: z.number().nonnegative(),
  adjusted_api_cost_per_million: z.number().nonnegative(),
  value_multiple: z.number().nonnegative(),
  cache_caveat: z.string().min(1),
})

export type DerivedTokenAllowanceRow = z.infer<typeof DerivedTokenAllowanceRow>

export const PairBadge = z.strictObject({
  model_id: z.string().min(1),
  plan_id: z.string().min(1),
  confidence: Confidence,
  freshness: z.enum(["fresh", "stale"]),
  price_status: z.enum(["list", "disputed"]),
  ci: z.enum(["reported", "absent"]),
  match: z.enum(["any", "exact", "provider"]),
  coverage: z.enum(["ok", "single-source"]),
})

export type PairBadge = z.infer<typeof PairBadge>

export const DerivedBadges = z.strictObject({
  per_pair: z.array(PairBadge),
})

export type DerivedBadges = z.infer<typeof DerivedBadges>

export const DerivedFile = z.strictObject({
  generated_from: DerivedGeneratedFrom,
  pairs: z.array(DerivedPair),
  best_routes: z.array(DerivedBestRoute),
  cross_check: CrossCheck,
  known_gaps: z.array(DerivedKnownGap),
  generated_at: z.iso.datetime({ offset: true }).optional(),
  composites: DerivedComposites.optional(),
  frontiers: DerivedFrontiers.optional(),
  token_allowances: z.array(DerivedTokenAllowanceRow).optional(),
  badges: DerivedBadges.optional(),
})

export type DerivedFile = z.infer<typeof DerivedFile>
