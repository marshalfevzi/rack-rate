import { describe, expect, test } from "bun:test"

import type { TokenLookup } from "./theme.ts"
import { basisTextColor, chartTokensFrom, costBasisColor } from "./theme.ts"

function lookupFor(blankName?: string, metaValue = "0.8125rem"): TokenLookup {
  const lookup: TokenLookup = (name) => {
    if (name === blankName) {
      return ""
    }

    switch (name) {
      case "--color-canvas":
        return "canvas-token"
      case "--color-panel":
        return "panel-token"
      case "--color-rule":
        return "rule-token"
      case "--color-ink":
        return "ink-token"
      case "--color-dim":
        return "dim-token"
      case "--color-adjusted":
        return "adjusted-token"
      case "--color-measured":
        return "measured-token"
      case "--color-api":
        return "api-marker-token"
      case "--color-api-ink":
        return "api-text-token"
      case "--font-sans":
        return "sans-token"
      case "--text-meta":
        return metaValue
      case "--text-body":
        return "15px"
      default:
        return ""
    }
  }

  return lookup
}

const tokenNames = [
  "--color-canvas",
  "--color-panel",
  "--color-rule",
  "--color-ink",
  "--color-dim",
  "--color-adjusted",
  "--color-measured",
  "--color-api",
  "--color-api-ink",
  "--font-sans",
  "--text-meta",
  "--text-body",
]

describe("chartTokensFrom", () => {
  test("maps each runtime token into its chart field", () => {
    const tokens = chartTokensFrom(lookupFor(), 16)

    expect(tokens).toEqual({
      canvas: "canvas-token",
      panel: "panel-token",
      rule: "rule-token",
      ink: "ink-token",
      dim: "dim-token",
      adjusted: "adjusted-token",
      measured: "measured-token",
      api: "api-marker-token",
      apiInk: "api-text-token",
      fontFamily: "sans-token",
      fontSizeMeta: 13,
      fontSizeBody: 15,
    })
  })

  test("converts rem sizes against a larger root while preserving px sizes", () => {
    const tokens = chartTokensFrom(lookupFor(), 20)

    expect(tokens.fontSizeMeta).toBe(16.25)
    expect(tokens.fontSizeBody).toBe(15)
  })

  for (const name of tokenNames) {
    test(`rejects a blank ${name} token by name`, () => {
      expect(() => chartTokensFrom(lookupFor(name), 16)).toThrow(name)
    })
  }

  test("rejects unsupported lengths and invalid root sizes", () => {
    const invalidLookup = lookupFor(undefined, "12pt")

    expect(() => chartTokensFrom(invalidLookup, 16)).toThrow("--text-meta")
    expect(() => chartTokensFrom(invalidLookup, 16)).toThrow("12pt")

    const validLookup = lookupFor()

    expect(() => chartTokensFrom(validLookup, 0)).toThrow("rootFontSizePx")
    expect(() => chartTokensFrom(validLookup, -1)).toThrow("rootFontSizePx")
    expect(() => chartTokensFrom(validLookup, Number.NaN)).toThrow("rootFontSizePx")
    expect(() => chartTokensFrom(validLookup, Infinity)).toThrow("rootFontSizePx")
  })
})

describe("cost basis chart colors", () => {
  const tokens = chartTokensFrom(lookupFor(), 16)

  test("uses one marker color for each cost basis", () => {
    expect(costBasisColor(tokens, "api-list")).toBe("api-marker-token")
    expect(costBasisColor(tokens, "plan-route")).toBe("adjusted-token")
    expect(costBasisColor(tokens, "aa-index")).toBe("dim-token")
  })

  test("uses a readable text color for each cost basis", () => {
    expect(basisTextColor(tokens, "api-list")).toBe("api-text-token")
    expect(basisTextColor(tokens, "plan-route")).toBe("adjusted-token")
    expect(basisTextColor(tokens, "aa-index")).toBe("dim-token")
  })
})
