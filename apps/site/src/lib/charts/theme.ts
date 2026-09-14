import type { CostBasisKind } from "../provenance.ts"

export type TokenLookup = (name: string) => string

export interface ChartTokens {
  readonly canvas: string
  readonly panel: string
  readonly rule: string
  readonly ink: string
  readonly dim: string
  readonly adjusted: string
  readonly measured: string
  readonly api: string
  readonly apiInk: string
  readonly fontFamily: string
  readonly fontSizeMeta: number
  readonly fontSizeBody: number
}

const CSS_NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/

type ColorTokenRole = "api" | "adjusted" | "dim"

type TextTokenRole = "apiInk" | "adjusted" | "dim"

function resolvedToken(lookup: TokenLookup, name: string): string {
  const value = lookup(name).trim()

  if (value === "") {
    throw new Error(
      `${name} resolved to an empty value; chart styling reads the @theme tokens in src/styles/global.css`,
    )
  }

  return value
}

function cssLength(name: string, value: string, rootFontSizePx: number): number {
  let numberText: string
  let multiplier: number

  if (value.endsWith("rem")) {
    numberText = value.slice(0, -3)
    multiplier = rootFontSizePx
  } else if (value.endsWith("px")) {
    numberText = value.slice(0, -2)
    multiplier = 1
  } else {
    throw new Error(`${name} resolved to an unparseable length "${value}"; expected rem or px`)
  }

  if (!CSS_NUMBER.test(numberText)) {
    throw new Error(`${name} resolved to an unparseable length "${value}"; expected rem or px`)
  }

  const amount = Number(numberText)

  if (!Number.isFinite(amount)) {
    throw new Error(`${name} resolved to an unparseable length "${value}"; expected rem or px`)
  }

  return amount * multiplier
}

function rootFontSize(value: string): number {
  const trimmed = value.trim()

  if (!trimmed.endsWith("px")) {
    throw new Error(`the root font size resolved to an unparseable length "${value}"; expected px`)
  }

  const numberText = trimmed.slice(0, -2)

  if (!CSS_NUMBER.test(numberText)) {
    throw new Error(`the root font size resolved to an unparseable length "${value}"; expected px`)
  }

  const pixels = Number(numberText)

  if (!Number.isFinite(pixels) || pixels <= 0) {
    throw new Error(`the root font size resolved to a non-positive value "${value}"`)
  }

  return pixels
}

export function chartTokensFrom(lookup: TokenLookup, rootFontSizePx: number): ChartTokens {
  if (!Number.isFinite(rootFontSizePx) || rootFontSizePx <= 0) {
    throw new Error("rootFontSizePx must be a finite positive number")
  }

  const canvas = resolvedToken(lookup, "--color-canvas")
  const panel = resolvedToken(lookup, "--color-panel")
  const rule = resolvedToken(lookup, "--color-rule")
  const ink = resolvedToken(lookup, "--color-ink")
  const dim = resolvedToken(lookup, "--color-dim")
  const adjusted = resolvedToken(lookup, "--color-adjusted")
  const measured = resolvedToken(lookup, "--color-measured")
  const api = resolvedToken(lookup, "--color-api")
  const apiInk = resolvedToken(lookup, "--color-api-ink")
  const fontFamily = resolvedToken(lookup, "--font-sans")

  const fontSizeMeta = cssLength(
    "--text-meta",
    resolvedToken(lookup, "--text-meta"),
    rootFontSizePx,
  )

  const fontSizeBody = cssLength(
    "--text-body",
    resolvedToken(lookup, "--text-body"),
    rootFontSizePx,
  )

  return {
    canvas,
    panel,
    rule,
    ink,
    dim,
    adjusted,
    measured,
    api,
    apiInk,
    fontFamily,
    fontSizeMeta,
    fontSizeBody,
  }
}

// Read the live element so the light scheme's token re-declaration applies to charts with no extra code.
export function readChartTokens(element: Element): ChartTokens {
  const elementStyle = getComputedStyle(element)
  const rootStyle = getComputedStyle(document.documentElement)
  const lookup: TokenLookup = (name) => elementStyle.getPropertyValue(name)

  return chartTokensFrom(lookup, rootFontSize(rootStyle.fontSize))
}

// One accent per cost basis keeps invariant 4 visible; no axis gets two basis colors.
const COST_BASIS_COLORS = {
  "api-list": "api",
  "plan-route": "adjusted",
  "aa-index": "dim",
} satisfies Record<CostBasisKind, ColorTokenRole>

const COST_BASIS_TEXT_COLORS = {
  "api-list": "apiInk",
  "plan-route": "adjusted",
  "aa-index": "dim",
} satisfies Record<CostBasisKind, TextTokenRole>

export function costBasisColor(tokens: ChartTokens, basis: CostBasisKind): string {
  return tokens[COST_BASIS_COLORS[basis]]
}

export function basisTextColor(tokens: ChartTokens, basis: CostBasisKind): string {
  return tokens[COST_BASIS_TEXT_COLORS[basis]]
}
