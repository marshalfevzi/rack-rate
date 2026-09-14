/**
 * Pure quota arithmetic for model × subscription-plan routes.
 *
 * Token allowance rows express a plan's measured monthly allowance in tokens:
 * `tokens_per_month_allowance = tasks_per_month * tokens_per_task` and
 * `allowance_per_million_tokens = price_usd_month /
 * (tokens_per_month_allowance / 1e6)`. The measured API cost derives the
 * blended rate: `blended_api_rate_per_mtok = 1e6 * api_cost_per_task_usd /
 * tokens_per_task`; dividing that by the value multiple gives
 * `adjusted_api_cost_per_million`. No model list-rate field is invented: the
 * blended rate is derived from measured tokens. Cached reads price far below
 * list, so a blend ignoring cache tiers misprices cache-heavy models; DeepSWE
 * medians show 10-40:1 input:output ratios.
 */

import type { CrossCheck, CrossCheckPair, DerivedPair, Model, Plan } from "./schema.ts"

export const DEFAULT_INPUT_OUTPUT_BLEND = 3

export const CACHE_TIER_CAVEAT =
  "Cached reads price far below list, so a blend ignoring cache tiers misprices cache-heavy models; DeepSWE medians show 10-40:1 input:output ratios."

export const DAYS_PER_MONTH = 30

export const HOURS_PER_DAY = 24

export type QuotaModel = Plan["quota_model"]

export interface CostedPair {
  model_id: DerivedPair["model_id"]
  model_name: DerivedPair["model_name"]
  score_pct: DerivedPair["score_pct"]
  plan_id: DerivedPair["plan_id"]
  plan_name: DerivedPair["plan_name"]
  provider: DerivedPair["provider"]
  price_usd_month: DerivedPair["price_usd_month"]
  api_cost_per_task_usd: DerivedPair["api_cost_per_task_usd"]
  tasks_per_month: DerivedPair["tasks_per_month"]
  cost_per_task_usd: DerivedPair["cost_per_task_usd"]
  days_for_full_run: number | null
  quota_method: DerivedPair["quota_method"]
  confidence: DerivedPair["confidence"]
}

export interface TokenAllowanceRow {
  model_id: string
  plan_id: string
  blend: string
  tokens_per_month_allowance: number
  tokens_per_task: number
  allowance_per_million_tokens: number
  adjusted_api_cost_per_million: number
  value_multiple: number
  cache_caveat: string
}

function isPositiveFinite(value: number | undefined): value is number {
  if (value === undefined) {
    return false
  }

  return Number.isFinite(value) && value > 0
}

function isPositiveTasks(value: number): boolean {
  return Number.isFinite(value) && value > 0
}

/** Round the exact IEEE-754 number half to even, matching Python round(). */
export function roundHalfEven(value: number, digits: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(digits)) {
    return value
  }

  const sign = value < 0 || Object.is(value, -0) ? -1 : 1
  const magnitude = Math.abs(value)
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  view.setFloat64(0, magnitude)

  const bits = view.getBigUint64(0)
  const exponentBits = Number((bits >> 52n) & 0x7ffn)
  const fractionBits = bits & ((1n << 52n) - 1n)

  const significand = exponentBits === 0 ? fractionBits : fractionBits | (1n << 52n)

  const binaryExponent = exponentBits === 0 ? -1074 : exponentBits - 1075

  let numerator = significand
  let denominator = 1n

  if (binaryExponent >= 0) {
    numerator <<= BigInt(binaryExponent)
  } else {
    denominator <<= BigInt(-binaryExponent)
  }

  if (digits >= 0) {
    numerator *= 10n ** BigInt(digits)
  } else {
    denominator *= 10n ** BigInt(-digits)
  }

  const quotient = numerator / denominator
  const remainder = numerator % denominator
  const twiceRemainder = remainder * 2n
  let rounded = quotient

  if (twiceRemainder > denominator || (twiceRemainder === denominator && quotient % 2n !== 0n)) {
    rounded += 1n
  }

  let result = Number(rounded)

  if (digits >= 0) {
    result /= 10 ** digits
  } else {
    result *= 10 ** -digits
  }

  return sign * result
}

export function modelAllowed(model: Model, plan: Plan): boolean {
  if (plan.model_scope === "any") {
    return true
  }

  if (plan.model_scope.includes(model.id)) {
    return true
  }

  if (model.provider === null) {
    return false
  }

  return plan.model_scope.includes(model.provider)
}

export function totalTokensPerTask(model: Model): number | null {
  const inputTokens = model.input_tokens_per_task
  const outputTokens = model.output_tokens_per_task

  if (!isPositiveFinite(inputTokens) || !isPositiveFinite(outputTokens)) {
    return null
  }

  const total = inputTokens + outputTokens

  if (!isPositiveTasks(total)) {
    return null
  }

  return total
}

export function tasksPerMonth(
  model: Model,
  plan: Plan,
): { tasks: number; method: QuotaModel } | null {
  let tasks: number | null = null

  if (plan.quota_model === "budget") {
    const quota = plan.quota_usd_month
    const cost = model.api_cost_per_task_usd

    if (isPositiveFinite(quota) && isPositiveFinite(cost)) {
      tasks = quota / cost
    }
  } else if (plan.quota_model === "credits") {
    const credits = plan.credits_month
    const inputTokens = model.input_tokens_per_task
    const outputTokens = model.output_tokens_per_task
    const inputRate = model.input_rate_per_mtok_usd
    const outputRate = model.output_rate_per_mtok_usd

    if (
      isPositiveFinite(credits) &&
      isPositiveFinite(inputTokens) &&
      isPositiveFinite(outputTokens) &&
      isPositiveFinite(inputRate) &&
      isPositiveFinite(outputRate)
    ) {
      const outputWeight = outputRate / inputRate
      const creditsPerTask = (inputTokens + outputTokens * outputWeight) / 10_000

      if (isPositiveTasks(creditsPerTask)) {
        tasks = credits / creditsPerTask
      }
    }
  } else if (plan.quota_model === "requests") {
    const requests = plan.requests_month
    const steps = model.agent_steps_per_task || plan.agent_steps_per_task_assumed

    if (isPositiveFinite(requests) && isPositiveFinite(steps)) {
      tasks = requests / steps
    }
  } else if (plan.quota_model === "tokens_total") {
    const tokens = plan.tokens_month
    const tokensPerTask = totalTokensPerTask(model)

    if (isPositiveFinite(tokens) && tokensPerTask !== null) {
      tasks = tokens / tokensPerTask
    }
  }

  if (tasks === null || !isPositiveTasks(tasks)) {
    return null
  }

  return { tasks, method: plan.quota_model }
}

export function daysForFullRun(
  plan: Plan,
  model: Model,
  tasksPerMonthValue: number,
  taskCount: number,
): number | null {
  const monthlyTasksPerDay = tasksPerMonthValue / DAYS_PER_MONTH

  if (!isPositiveTasks(monthlyTasksPerDay)) {
    return null
  }

  let tasksPerDay = monthlyTasksPerDay
  const windowHours = plan.rolling_window_hours
  const windowUsd = plan.rolling_window_usd
  const cost = model.api_cost_per_task_usd

  if (isPositiveFinite(windowHours) && isPositiveFinite(windowUsd) && isPositiveFinite(cost)) {
    const tasksPerWindow = windowUsd / cost
    const windowsPerDay = HOURS_PER_DAY / windowHours
    tasksPerDay = Math.min(tasksPerDay, tasksPerWindow * windowsPerDay)
  }

  if (!isPositiveTasks(tasksPerDay)) {
    return null
  }

  const days = taskCount / tasksPerDay

  if (!Number.isFinite(days) || days === 0) {
    return null
  }

  return days
}

export function pricePair(model: Model, plan: Plan, taskCount: number): CostedPair | null {
  if (!plan.available || !modelAllowed(model, plan)) {
    return null
  }

  const quota = tasksPerMonth(model, plan)

  if (quota === null) {
    return null
  }

  const costPerTask = plan.price_usd_month / quota.tasks

  if (!Number.isFinite(costPerTask)) {
    return null
  }

  const days = daysForFullRun(plan, model, quota.tasks, taskCount)

  const pair: CostedPair = {
    model_id: model.id,
    model_name: model.name,
    score_pct: model.score_pct,
    plan_id: plan.id,
    plan_name: plan.name,
    provider: plan.provider,
    price_usd_month: plan.price_usd_month,
    api_cost_per_task_usd: model.api_cost_per_task_usd,
    tasks_per_month: roundHalfEven(quota.tasks, 2),
    cost_per_task_usd: roundHalfEven(costPerTask, 4),
    days_for_full_run: days === null ? null : roundHalfEven(days, 2),
    quota_method: quota.method,
    confidence: plan.confidence,
  }

  return pair
}

export function buildPairs(models: Model[], plans: Plan[], taskCount: number): CostedPair[] {
  const pairs: CostedPair[] = []

  for (const plan of plans) {
    for (const model of models) {
      const pair = pricePair(model, plan, taskCount)

      if (pair !== null) {
        pairs.push(pair)
      }
    }
  }

  pairs.sort((left, right) => left.cost_per_task_usd - right.cost_per_task_usd)

  return pairs
}

export function bestRoutes(pairs: CostedPair[]): CostedPair[] {
  const best = new Map<string, CostedPair>()

  for (const pair of pairs) {
    const existing = best.get(pair.model_id)

    if (existing === undefined || pair.cost_per_task_usd < existing.cost_per_task_usd) {
      best.set(pair.model_id, pair)
    }
  }

  const routes = Array.from(best.values())
  routes.sort((left, right) => left.cost_per_task_usd - right.cost_per_task_usd)

  return routes
}

export function crossCheck(models: Model[], plans: Plan[]): CrossCheck {
  const rows: CrossCheckPair[] = []

  for (const plan of plans) {
    if (!plan.available || plan.quota_model !== "budget") {
      continue
    }

    const tokensMonth = plan.cross_check_tokens_month

    if (!isPositiveFinite(tokensMonth)) {
      continue
    }

    for (const model of models) {
      if (!modelAllowed(model, plan)) {
        continue
      }

      const ordinaryQuota = tasksPerMonth(model, plan)

      if (ordinaryQuota === null) {
        continue
      }

      const tokensPerTask = totalTokensPerTask(model)

      if (tokensPerTask === null) {
        continue
      }

      const tasksByDollars = ordinaryQuota.tasks
      const tasksByTokens = tokensMonth / tokensPerTask

      if (!isPositiveTasks(tasksByTokens)) {
        continue
      }

      const ratio =
        Math.max(tasksByDollars, tasksByTokens) / Math.min(tasksByDollars, tasksByTokens)

      if (!isPositiveTasks(ratio)) {
        continue
      }

      rows.push({
        plan_id: plan.id,
        plan_name: plan.name,
        model_id: model.id,
        model_name: model.name,
        tasks_by_dollars: roundHalfEven(tasksByDollars, 2),
        tasks_by_tokens: roundHalfEven(tasksByTokens, 2),
        ratio: roundHalfEven(ratio, 3),
      })
    }
  }

  const summary = summarizeCrossCheck(rows)

  return { pairs: rows, summary }
}

function summarizeCrossCheck(rows: CrossCheckPair[]): CrossCheck["summary"] {
  if (rows.length === 0) {
    return {
      median_ratio: 0,
      min_ratio: 0,
      max_ratio: 0,
      pair_count: 0,
    }
  }

  const ratios = rows.map((row) => row.ratio)
  ratios.sort((left, right) => left - right)
  const middle = Math.floor(ratios.length / 2)

  const median =
    ratios.length % 2 === 0 ? (ratios[middle - 1]! + ratios[middle]!) / 2 : ratios[middle]!

  return {
    median_ratio: roundHalfEven(median, 3),
    min_ratio: roundHalfEven(ratios[0]!, 3),
    max_ratio: roundHalfEven(ratios[ratios.length - 1]!, 3),
    pair_count: ratios.length,
  }
}

export function tokenAllowance(
  model: Model,
  plan: Plan,
  blend = DEFAULT_INPUT_OUTPUT_BLEND,
): TokenAllowanceRow | null {
  if (!plan.available || !modelAllowed(model, plan)) {
    return null
  }

  if (!Number.isFinite(blend) || blend <= 0) {
    return null
  }

  const quota = tasksPerMonth(model, plan)
  const tokensPerTask = totalTokensPerTask(model)

  if (quota === null || tokensPerTask === null || !isPositiveFinite(plan.price_usd_month)) {
    return null
  }

  const tokensPerMonthAllowance = quota.tasks * tokensPerTask

  if (!isPositiveTasks(tokensPerMonthAllowance)) {
    return null
  }

  const allowancePerMillionTokens = plan.price_usd_month / (tokensPerMonthAllowance / 1e6)
  const blendedApiRatePerMtok = (1e6 * model.api_cost_per_task_usd) / tokensPerTask
  const valueMultiple = (quota.tasks * model.api_cost_per_task_usd) / plan.price_usd_month
  const adjustedApiCostPerMillion = blendedApiRatePerMtok / valueMultiple

  if (
    !Number.isFinite(allowancePerMillionTokens) ||
    !Number.isFinite(blendedApiRatePerMtok) ||
    !Number.isFinite(valueMultiple) ||
    !Number.isFinite(adjustedApiCostPerMillion)
  ) {
    return null
  }

  const row: TokenAllowanceRow = {
    model_id: model.id,
    plan_id: plan.id,
    blend: `${blend}:1`,
    tokens_per_month_allowance: tokensPerMonthAllowance,
    tokens_per_task: tokensPerTask,
    allowance_per_million_tokens: allowancePerMillionTokens,
    adjusted_api_cost_per_million: adjustedApiCostPerMillion,
    value_multiple: valueMultiple,
    cache_caveat: CACHE_TIER_CAVEAT,
  }

  return row
}
