import { describe, expect, test } from "bun:test"

import { freshnessOf, isStale, STALE_AFTER_DAYS } from "./freshness.ts"

describe("STALE_AFTER_DAYS", () => {
  test("uses a fourteen-day threshold", () => {
    expect(STALE_AFTER_DAYS).toBe(14)
  })
})

describe("isStale", () => {
  test("does not mark exactly fourteen days as stale", () => {
    expect(isStale("2026-09-01", "2026-09-15T00:00:00.000Z")).toBe(false)
  })

  test("marks fourteen days plus one millisecond as stale", () => {
    expect(isStale("2026-09-01", "2026-09-15T00:00:00.001Z")).toBe(true)
  })

  test("keeps a reference earlier than retrieval fresh", () => {
    expect(isStale("2026-09-14", "2026-09-10T21:58:00.001022+00:00")).toBe(false)
  })

  test("marks a fifteen-day gap as stale", () => {
    expect(isStale("2026-08-31", "2026-09-15T00:00:00.000Z")).toBe(true)
  })

  test("marks a twenty-seven-day gap as stale", () => {
    expect(isStale("2026-08-19", "2026-09-15T00:00:00.000Z")).toBe(true)
  })

  test("keeps the committed September ninth retrieval fresh", () => {
    expect(isStale("2026-09-09", "2026-09-10T21:58:00.001022+00:00")).toBe(false)
  })
})

describe("freshnessOf", () => {
  test("maps fresh and stale verdicts to their vocabulary", () => {
    expect(freshnessOf("2026-09-01", "2026-09-15T00:00:00.000Z")).toBe("fresh")
    expect(freshnessOf("2026-09-01", "2026-09-15T00:00:00.001Z")).toBe("stale")
  })
})
