import { describe, expect, test } from "bun:test"
import type { Model, Plan } from "./schema.ts"
import { daysForFullRun, modelAllowed, pricePair, tasksPerMonth } from "./cost.ts"

function makeModel(overrides: Partial<Model> = {}): Model {
  return {
    id: "model",
    name: "Synthetic Model",
    provider: "Provider",
    provider_slug: "provider",
    score_pct: 50,
    score_pass_at_4_pct: 50,
    reasoning_effort: "medium",
    api_cost_per_task_usd: 2,
    input_tokens_per_task: 1_000,
    output_tokens_per_task: 500,
    agent_steps_per_task: 3,
    n_tasks_attempted: 10,
    evidence: ["synthetic test input"],
    benchmark_version: "synthetic@1",
    cost_basis: "list",
    retrieved_at: "2026-09-01",
    ...overrides,
  }
}

function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: "plan",
    name: "Synthetic Plan",
    provider: "Provider",
    price_usd_month: 10,
    quota_model: "budget",
    confidence: "high",
    method: "synthetic test input",
    evidence: ["synthetic test input"],
    sources: ["synthetic test input"],
    available: true,
    model_scope: "any",
    retrieved_at: "2026-09-01",
    ...overrides,
  }
}

describe("tasksPerMonth", () => {
  test("converts a budget quota into tasks", () => {
    const model = makeModel({ api_cost_per_task_usd: 2 })
    const plan = makePlan({ quota_model: "budget", quota_usd_month: 100 })

    expect(tasksPerMonth(model, plan)).toEqual({ tasks: 50, method: "budget" })
  })

  test("converts credits using the output-to-input rate weight", () => {
    const model = makeModel({
      input_tokens_per_task: 10_000,
      output_tokens_per_task: 5_000,
      input_rate_per_mtok_usd: 2,
      output_rate_per_mtok_usd: 4,
    })

    const plan = makePlan({ quota_model: "credits", credits_month: 80 })

    // credits/task = (10,000 + 5,000 × (4 / 2)) / 10,000 = 2, hence 80 / 2.
    expect(tasksPerMonth(model, plan)).toEqual({ tasks: 40, method: "credits" })
  })

  test("converts a request quota using measured agent steps", () => {
    const model = makeModel({ agent_steps_per_task: 3 })
    const plan = makePlan({ quota_model: "requests", requests_month: 1_200 })

    expect(tasksPerMonth(model, plan)).toEqual({ tasks: 400, method: "requests" })
  })

  test("converts a total-token quota using both token directions", () => {
    const model = makeModel({ input_tokens_per_task: 10_000, output_tokens_per_task: 5_000 })
    const plan = makePlan({ quota_model: "tokens_total", tokens_month: 1_500_000 })

    expect(tasksPerMonth(model, plan)).toEqual({ tasks: 100, method: "tokens_total" })
  })
})

describe("plan scope and unavailable inputs", () => {
  test("allows any scope, an explicit model id, and excludes another id", () => {
    const model = makeModel({ id: "included-model" })

    expect(modelAllowed(model, makePlan({ model_scope: "any" }))).toBe(true)
    expect(modelAllowed(model, makePlan({ model_scope: ["included-model"] }))).toBe(true)
    expect(modelAllowed(model, makePlan({ model_scope: ["different-model"] }))).toBe(false)
  })

  test("returns null when quota data is missing or the plan is unavailable", () => {
    const model = makeModel()
    const missingQuota = makePlan({ quota_model: "budget" })

    const unavailable = makePlan({
      available: false,
      unavailable_reason: "synthetic unavailable plan",
      quota_usd_month: 100,
    })

    expect(tasksPerMonth(model, missingQuota)).toBeNull()
    expect(pricePair(model, unavailable, 113)).toBeNull()
  })

  test("a generous rolling-window cap cannot increase the monthly daily rate", () => {
    const model = makeModel({ api_cost_per_task_usd: 2 })
    const plan = makePlan({ rolling_window_hours: 5, rolling_window_usd: 10 })

    // 300 monthly tasks give 10/day; the window permits 24/day, so the cap is inert.
    expect(daysForFullRun(plan, model, 300, 100)).toBe(10)
  })

  test("applies a biting rolling-window cap to the daily rate", () => {
    const model = makeModel({ api_cost_per_task_usd: 2 })

    const plan = makePlan({
      price_usd_month: 10,
      quota_usd_month: 600,
      rolling_window_hours: 5,
      rolling_window_usd: 2,
    })

    const rawDays = daysForFullRun(plan, model, 300, 113)
    const pair = pricePair(model, plan, 113)

    // Legacy lines 80-85 take min(300 / 30, (2 / 2) × (24 / 5)) = 4.8
    // tasks/day, so the raw result is 113 / 4.8 = 23.541666666666668.
    expect(rawDays).toBe(23.541666666666668)
    expect(pair?.days_for_full_run).toBe(23.54)

    const generousPlan = makePlan({
      price_usd_month: 10,
      quota_usd_month: 600,
      rolling_window_hours: 5,
      rolling_window_usd: 10,
    })

    // A generous window permits 24/day, so min(10, 24) leaves 113 / 10 = 11.3.
    expect(daysForFullRun(generousPlan, model, 300, 113)).toBe(11.3)
  })
})
