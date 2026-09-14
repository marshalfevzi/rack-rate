import { describe, expect, test } from "bun:test"

import { ARTIFICIAL_ANALYSIS_BENCHMARK_ID } from "@rack-rate/core"
import type { Source } from "@rack-rate/core"

import {
  COST_BASIS_TERMS,
  artificialAnalysisState,
  ciGeometry,
  costBasisQualifier,
  costBasisTerm,
  requiredAttribution,
} from "./provenance.ts"

describe("costBasisTerm", () => {
  test("names the plan for a plan route", () => {
    const term = costBasisTerm("plan-route", "Claude Pro")

    expect(term.label).toBe("Claude Pro route")
    expect(term.description.length).toBeGreaterThan(0)
  })

  test("rejects a missing or blank plan name", () => {
    expect(() => costBasisTerm("plan-route")).toThrow()
    expect(() => costBasisTerm("plan-route", "   ")).toThrow()
  })

  test("uses the plain terms for non-route bases", () => {
    expect(costBasisTerm("api-list", "ignored")).toEqual(COST_BASIS_TERMS["api-list"])
    expect(costBasisTerm("aa-index")).toEqual(COST_BASIS_TERMS["aa-index"])
  })
})

describe("costBasisQualifier", () => {
  test("omits the default list qualifier", () => {
    expect(costBasisQualifier("list")).toBeNull()
  })

  test("describes an expected launch basis", () => {
    const term = costBasisQualifier("expected-launch")

    expect(term?.label.length ?? 0).toBeGreaterThan(0)
    expect(term?.description.length ?? 0).toBeGreaterThan(0)
  })

  test("describes a disputed basis", () => {
    const term = costBasisQualifier("disputed")

    expect(term?.label.length ?? 0).toBeGreaterThan(0)
    expect(term?.description.length ?? 0).toBeGreaterThan(0)
  })

  test("describes an unknown basis", () => {
    const term = costBasisQualifier("unknown")

    expect(term?.label.length ?? 0).toBeGreaterThan(0)
    expect(term?.description.length ?? 0).toBeGreaterThan(0)
  })
})

describe("ciGeometry", () => {
  test("positions a committed fraction interval on the full track", () => {
    const geometry = ciGeometry(0.7412, 0.7124964807371247, 0.7698044042186275, "fraction")

    expect(geometry).toEqual({ leftPct: 71.25, widthPct: 5.73, valuePct: 74.12 })
    expect((geometry?.leftPct ?? 0) + (geometry?.widthPct ?? 0)).toBe(76.98)
  })

  test("positions a committed percent interval on the full track", () => {
    const geometry = ciGeometry(74.12, 71.24964807371246, 76.98044042186275, "percent")

    expect(geometry).toEqual({ leftPct: 71.25, widthPct: 5.73, valuePct: 74.12 })
    expect((geometry?.leftPct ?? 0) + (geometry?.widthPct ?? 0)).toBe(76.98)
  })

  test("returns no geometry for missing endpoints", () => {
    expect(ciGeometry(0.5, undefined, 0.7, "fraction")).toBeNull()
    expect(ciGeometry(0.5, 0.3, undefined, "fraction")).toBeNull()
    expect(ciGeometry(0.5, undefined, undefined, "fraction")).toBeNull()
  })

  test("returns no geometry when any input is NaN", () => {
    expect(ciGeometry(Number.NaN, 0.3, 0.7, "fraction")).toBeNull()
    expect(ciGeometry(0.5, Number.NaN, 0.7, "fraction")).toBeNull()
    expect(ciGeometry(0.5, 0.3, Number.NaN, "fraction")).toBeNull()
  })

  test("orders a transposed interval instead of drawing it inside out", () => {
    expect(ciGeometry(0.5, 0.6, 0.4, "fraction")).toEqual({
      leftPct: 40,
      widthPct: 20,
      valuePct: 50,
    })
  })

  test("clamps out-of-domain values without zooming the track", () => {
    expect(ciGeometry(120, 110, 130, "percent")).toEqual({
      leftPct: 100,
      widthPct: 0,
      valuePct: 100,
    })
  })
})

describe("requiredAttribution", () => {
  const sourceWithoutAttribution = {
    id: "src-example",
    title: "Example source",
    url: "https://example.com/source",
    license: "Example license",
    retrieved: "2026-01-01",
    covers: "Example data",
    changes: "Example changes",
    summary: "Example summary",
  } satisfies Source

  test("returns attribution verbatim", () => {
    const attribution = "© Example contributor\nUsed under Example license."
    const source = { ...sourceWithoutAttribution, attribution }

    expect(requiredAttribution(source, source.id)).toBe(attribution)
  })

  test("rejects missing or blank attribution", () => {
    expect(() => requiredAttribution(undefined, "missing-source")).toThrow(/missing-source/)
    expect(() => requiredAttribution(sourceWithoutAttribution, "missing-attribution")).toThrow(
      /missing-attribution/,
    )
    expect(() =>
      requiredAttribution(
        { ...sourceWithoutAttribution, attribution: " \n\t " },
        "blank-attribution",
      ),
    ).toThrow(/blank-attribution/)
  })
})

describe("artificialAnalysisState", () => {
  test("reports unpublished for empty and unrelated benchmark lists", () => {
    expect(artificialAnalysisState([])).toEqual({ published: false, entry: null })

    const otherBenchmark = { id: "other-benchmark", score: 91 }

    expect(artificialAnalysisState([otherBenchmark])).toEqual({ published: false, entry: null })
  })

  test("returns the committed Artificial Analysis entry and preserves its fields", () => {
    const entry = {
      id: ARTIFICIAL_ANALYSIS_BENCHMARK_ID,
      score: 91,
      note: "committed",
    }

    const state = artificialAnalysisState([entry])

    expect(state).toEqual({ published: true, entry })
    expect(state.entry?.note).toBe("committed")
  })
})
