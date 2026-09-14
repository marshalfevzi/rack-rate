import { describe, expect, test } from "bun:test"

import {
  bestRouteByModel,
  compositeByModel,
  crossCheck,
  modelsById,
  pairKey,
  tokenAllowanceByPair,
} from "./data.ts"

import {
  MISSING,
  formatCount,
  formatDays,
  formatFractionAsPercent,
  formatFractionAsPercentRange,
  formatFxRate,
  formatMultiple,
  formatPercent,
  formatPercentRange,
  formatPoints,
  formatTasksPerMonth,
  formatTokens,
  formatTokensExact,
  formatUsd,
  formatUsdPerMillionTokens,
  formatUsdPerTask,
  formatZ,
} from "./format.ts"

type NumericValue = number | null | undefined

type ScalarFormatter = readonly [string, (value: NumericValue) => string]

type RangeFormatter = readonly [string, (low: NumericValue, high: NumericValue) => string]

const invalidValues: readonly NumericValue[] = [null, undefined, Number.NaN, Infinity, -Infinity]

const scalarFormatters: readonly ScalarFormatter[] = [
  ["formatPercent", formatPercent],
  ["formatFractionAsPercent", formatFractionAsPercent],
  ["formatPoints", formatPoints],
  ["formatUsd", formatUsd],
  ["formatUsdPerTask", formatUsdPerTask],
  ["formatUsdPerMillionTokens", formatUsdPerMillionTokens],
  ["formatTasksPerMonth", formatTasksPerMonth],
  ["formatDays", formatDays],
  ["formatCount", formatCount],
  ["formatTokens", formatTokens],
  ["formatTokensExact", formatTokensExact],
  ["formatMultiple", formatMultiple],
  ["formatZ", formatZ],
  ["formatFxRate", formatFxRate],
]

const rangeFormatters: readonly RangeFormatter[] = [
  ["formatPercentRange", formatPercentRange],
  ["formatFractionAsPercentRange", formatFractionAsPercentRange],
]

const gptModel = modelsById.get("gpt-6-astra")

const halfStepModel = modelsById.get("claude-opus-5")

const gptBestRoute = bestRouteByModel.get("gpt-6-astra")

const gptComposite = compositeByModel.get("gpt-6-astra")

const gptTokenAllowance = tokenAllowanceByPair.get(pairKey("gpt-6-astra", "chatgpt-pro-20x"))

const ratioSummary = crossCheck.summary

describe("missing values", () => {
  for (const [name, formatter] of scalarFormatters) {
    test(`${name} uses the shared missing placeholder`, () => {
      for (const value of invalidValues) {
        expect(formatter(value)).toBe(MISSING)
      }
    })
  }

  for (const [name, formatter] of rangeFormatters) {
    test(`${name} uses the shared missing placeholder`, () => {
      for (const value of invalidValues) {
        expect(formatter(value, value)).toBe(MISSING)
      }
    })
  }
})

describe("zero and half-even boundaries", () => {
  test("zero is formatted instead of treated as missing", () => {
    expect(formatUsd(0)).toBe("$0")
    expect(formatPercent(0)).toBe("0.0%")
    expect(formatUsdPerTask(0)).toBe("$0.0000")
    expect(formatMultiple(0)).toBe("0×")
  })

  test("percentages use half-even at one decimal", () => {
    expect(formatPercent(74.05)).toBe("74.0%")
    expect(formatPercent(74.15)).toBe("74.2%")
  })

  test("USD amounts use half-even at two decimals", () => {
    expect(formatUsd(7.005)).toBe("$7")
    expect(formatUsd(7.015)).toBe("$7.01")
  })

  test("USD per task uses half-even at four decimals", () => {
    expect(formatUsdPerTask(0.03045)).toBe("$0.0305")
    expect(formatUsdPerTask(0.03055)).toBe("$0.0306")
  })
})

describe("committed data examples", () => {
  test("formats percent and fraction values", () => {
    expect(formatPercent(74.12)).toBe("74.1%")
    expect(formatFractionAsPercent(0.7124964807371247)).toBe("71.2%")
    expect(formatPercentRange(71.24964807371246, 76.98044042186275)).toBe("71.2–77.0%")
    expect(formatFractionAsPercentRange(0.7124964807371247, 0.7698044042186275)).toBe("71.2–77.0%")
    expect(formatPercentRange(71.25, 76.98)).toBe("71.2–77.0%")
  })

  test("formats points and z-scores with ASCII signs", () => {
    expect(formatPoints(4.21)).toBe("+4.2 pp")
    expect(formatPoints(4.2)).toBe("+4.2 pp")
    expect(formatPoints(-1.06)).toBe("-1.1 pp")
    expect(formatZ(1.5656)).toBe("+1.57")
    expect(formatZ(-2.9945)).toBe("-2.99")
    expect(formatZ(0)).toBe("+0.00")
  })

  test("formats USD amounts with trimming and grouping", () => {
    expect(formatUsd(20)).toBe("$20")
    expect(formatUsd(7.23)).toBe("$7.23")
    expect(formatUsd(9603.86)).toBe("$9,603.86")
    expect(formatUsd(25472)).toBe("$25,472")
  })

  test("formats USD per task in both data bases", () => {
    expect(formatUsdPerTask(0.0304)).toBe("$0.0304")
    expect(formatUsdPerTask(23.2774)).toBe("$23.2774")
  })

  test("formats USD per million tokens", () => {
    expect(formatUsdPerMillionTokens(0.0017)).toBe("$0.0017")
    expect(formatUsdPerMillionTokens(4.7563)).toBe("$4.7563")
  })

  test("formats tasks and days with grouping", () => {
    expect(formatTasksPerMonth(5233.18)).toBe("5,233.2")
    expect(formatTasksPerMonth(0.64)).toBe("0.6")
    expect(formatDays(5.15)).toBe("5.2")
    expect(formatDays(5260.69)).toBe("5,260.7")
  })

  test("formats integer and half-step counts with grouping", () => {
    expect(formatCount(90.5)).toBe("90.5")
    expect(formatCount(113)).toBe("113")
    expect(formatCount(26)).toBe("26")
    expect(formatCount(5)).toBe("5")
    expect(formatCount(2400)).toBe("2,400")
  })

  test("formats token quantities at three significant digits", () => {
    expect(formatTokens(1163918)).toBe("1.16M")
    expect(formatTokens(62795056)).toBe("62.8M")
    expect(formatTokens(76390578947)).toBe("76.4B")
    expect(formatTokens(616)).toBe("616")
    expect(formatTokens(999999)).toBe("1M")
    expect(formatTokens(1000)).toBe("1K")
    expect(formatTokens(1_000_000)).toBe("1M")
    expect(formatTokensExact(1163918)).toBe("1,163,918")
  })

  test("formats multiples with trimming", () => {
    expect(formatMultiple(3)).toBe("3×")
    expect(formatMultiple(127.36)).toBe("127.36×")
    expect(formatMultiple(1.601)).toBe("1.6×")
    expect(formatMultiple(1.006)).toBe("1.01×")
  })

  test("formats the FX rate with four fixed decimals", () => {
    expect(formatFxRate(6.7787)).toBe("6.7787")
  })
})

describe("typed data views", () => {
  test("formats stable model anchors", () => {
    expect(formatPercent(gptModel?.score_pct)).toBe("74.1%")
    expect(formatFractionAsPercent(gptModel?.ci_lo)).toBe("71.2%")
    expect(formatTokens(gptModel?.input_tokens_per_task)).toBe("1.16M")
    expect(formatTokensExact(gptModel?.input_tokens_per_task)).toBe("1,163,918")
  })

  test("formats stable derived anchors", () => {
    expect(formatUsdPerTask(gptBestRoute?.cost_per_task_usd)).toBe("$0.1299")
    expect(formatPercent(gptComposite?.composite)).toBe("65.7%")
    expect(formatMultiple(ratioSummary.median_ratio)).toBe("1.6×")
    expect(formatUsdPerMillionTokens(gptTokenAllowance?.allowance_per_million_tokens)).toBe(
      "$0.1090",
    )
  })

  test("formats a stable half-step count anchor", () => {
    expect(formatCount(halfStepModel?.agent_steps_per_task)).toBe("90.5")
  })
})

describe("ranges with missing endpoints", () => {
  test("collapses a one-sided range to the missing placeholder", () => {
    expect(formatPercentRange(71.24964807371246, null)).toBe(MISSING)
    expect(formatPercentRange(null, null)).toBe(MISSING)
  })
})
