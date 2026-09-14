import { describe, expect, test } from "bun:test"
import {
  buildPairs,
  bestRoutes,
  crossCheck,
  DerivedFile,
  ModelsFile,
  PlansFile,
} from "@rack-rate/core"
import { fixturePath, readJsonAs } from "../paths.ts"

describe("compute port parity", () => {
  test("matches the frozen legacy cost output", async () => {
    const modelsFile = await readJsonAs(fixturePath("legacy-inputs.models.json"), ModelsFile)

    const plansFile = await readJsonAs(fixturePath("legacy-inputs.plans.json"), PlansFile)

    const legacy = await readJsonAs(fixturePath("legacy-derived.json"), DerivedFile)
    const pairs = buildPairs(modelsFile.models, plansFile.plans, modelsFile.task_count)
    const routes = bestRoutes(pairs)
    const crossCheckDocument = crossCheck(modelsFile.models, plansFile.plans)

    const generatedFrom = {
      models: modelsFile.models.length,
      plans: plansFile.plans.length,
      task_count: modelsFile.task_count,
    }

    const derived = {
      generated_from: generatedFrom,
      pairs,
      best_routes: routes,
      cross_check: crossCheckDocument,
      known_gaps: plansFile.known_gaps,
    }

    expect(derived.pairs).toHaveLength(178)
    expect(derived.best_routes).toHaveLength(28)
    expect(derived.cross_check.pairs).toHaveLength(11)
    expect(derived.generated_from).toEqual(legacy.generated_from)
    expect(derived.pairs).toEqual(legacy.pairs)
    expect(derived.best_routes).toEqual(legacy.best_routes)
    expect(derived.cross_check).toEqual(legacy.cross_check)
    expect(derived.cross_check.summary.median_ratio).toBe(legacy.cross_check.summary.median_ratio)

    const perturbedPairs = pairs.map((pair, index) => {
      if (index !== 0) {
        return pair
      }

      return { ...pair, cost_per_task_usd: pair.cost_per_task_usd + 0.0001 }
    })

    // This guard ensures the parity assertions detect a real numeric mismatch.
    expect(perturbedPairs).not.toEqual(legacy.pairs)

    // The port passes through the current plans document. The frozen legacy run
    // predates two measured-plan gap entries, so its five ids must only be a subset.
    expect(derived.known_gaps).toEqual(plansFile.known_gaps)
    expect(plansFile.known_gaps).toHaveLength(7)
    expect(legacy.known_gaps).toHaveLength(5)

    for (const legacyGap of legacy.known_gaps) {
      expect(plansFile.known_gaps.some((gap) => gap.plan === legacyGap.plan)).toBe(true)
    }
  })
})
