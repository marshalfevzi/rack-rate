import { describe, expect, test } from "bun:test"

import { apiFrontier, benchmarks, frontierByPlan, models, plansById } from "../data.ts"
import {
  buildParetoPayload,
  chartAriaLabel,
  decodeParetoPayload,
  encodeParetoPayload,
} from "./pareto-payload.ts"

function buildPayload() {
  return buildParetoPayload({
    models,
    benchmarks,
    apiFrontier,
    planFrontiers: frontierByPlan,
    plansById,
  })
}

function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new Error(`the test fixture has no ${what}`)
  }

  return value
}

describe("Pareto payload", () => {
  test("builds labelled API points, effort trails, and sorted plan views", () => {
    const payload = buildPayload()
    const api = required(payload.bases[0], "API basis")

    expect(payload.scoreLabel).toBe("DeepSWE v1.1 pass@1 (%)")
    expect(api.basis).toBe("api-list")
    expect(api.points).toHaveLength(28)
    expect(api.frontier).toHaveLength(6)
    expect(required(api.frontier[0], "API frontier point")).toBe("deepseek-v4-flash")

    const expectedFrontier = [
      "deepseek-v4-flash",
      "deepseek-v4-pro",
      "glm-5.3-flash",
      "gemini-3.7-flash",
      "gemini-3.8-flash",
      "gpt-6-astra",
    ]

    for (const id of expectedFrontier) {
      const point = api.points.find((candidate) => candidate.id === id)

      expect(point?.onFrontier).toBe(true)
      expect(point?.labelled).toBe(true)
    }

    let labelledCount = 0

    for (const point of api.points) {
      if (point.labelled) {
        labelledCount += 1
      }
    }

    expect(labelledCount).toBe(9)
    expect(api.trails).toHaveLength(13)

    for (const trail of api.trails) {
      for (let index = 1; index < trail.points.length; index += 1) {
        const point = required(trail.points[index], `trail point ${index}`)
        const previous = required(trail.points[index - 1], `trail point ${index - 1}`)

        expect(point.cost).toBeGreaterThanOrEqual(previous.cost)
      }
    }

    const gpt = models.find((model) => model.id === "gpt-6-astra")
    const gptTrail = api.trails.find((trail) => trail.modelId === "gpt-6-astra")

    if (gpt === undefined || gptTrail === undefined) {
      throw new Error("expected gpt-6-astra effort trail")
    }

    expect(
      gptTrail.points.some(
        (point) => point.cost === gpt.api_cost_per_task_usd && point.score === gpt.score_pct,
      ),
    ).toBe(true)

    const planViews = payload.bases.slice(1)
    const expectedPlanIds = Array.from(frontierByPlan.keys()).sort()

    expect(planViews).toHaveLength(15)
    expect(planViews.map((view) => view.planId)).toEqual(expectedPlanIds)

    const opencode = planViews.find((view) => view.planId === "opencode-go")
    const ollama = planViews.find((view) => view.planId === "ollama-pro")

    expect(opencode?.points).toHaveLength(1)
    expect(opencode?.trails).toHaveLength(0)
    expect(ollama?.points).toHaveLength(28)
    expect(ollama?.trails).toHaveLength(0)
    expect(ollama?.note).toContain(ollama?.planName ?? "ollama-pro")
    expect(ollama?.note).toContain("Effort trails are priced on the API list basis only")
  })

  test("keeps chart accessible names aligned across API and plan views", () => {
    const payload = buildPayload()
    const api = required(payload.bases[0], "API payload basis")

    const plan = required(
      payload.bases.find((view) => view.planId === "chatgpt-plus"),
      "chatgpt-plus plan basis",
    )

    expect(chartAriaLabel(api)).toBe(
      "28 committed models plotted against API list cost per task; 6 frontier models; JavaScript is required to draw this chart.",
    )
    expect(chartAriaLabel(plan)).toBe(
      "6 committed models plotted against ChatGPT Plus route cost per task; 3 frontier models; JavaScript is required to draw this chart.",
    )

    const single = required(
      payload.bases.find((view) => view.planId === "opencode-go"),
      "opencode-go plan basis",
    )

    expect(chartAriaLabel(single)).toBe(
      "1 committed model plotted against OpenCode Go route cost per task; 1 frontier model; JavaScript is required to draw this chart.",
    )
  })

  test("round-trips safely for an embedded script payload", () => {
    const payload = buildPayload()
    const encoded = encodeParetoPayload(payload)
    const decoded = decodeParetoPayload(encoded)

    const payloadApi = required(payload.bases[0], "API payload basis")
    const decodedApi = required(decoded.bases[0], "decoded API payload basis")

    expect(encoded).not.toContain("<")
    expect(decoded.bases).toHaveLength(payload.bases.length)
    expect(decodedApi.points).toHaveLength(payloadApi.points.length)
    expect(decodedApi.frontier).toEqual(payloadApi.frontier)
  })

  test("rejects payloads that would silently render an empty chart", () => {
    expect(() => decodeParetoPayload("{}")).toThrow()

    const payload = buildPayload()

    const emptyPointsPayload = {
      ...payload,
      bases: payload.bases.map((view, index) => (index === 0 ? { ...view, points: [] } : view)),
    }

    expect(() => decodeParetoPayload(JSON.stringify(emptyPointsPayload))).toThrow()
  })
})
