import { roundHalfEven } from "@rack-rate/core"

export const MISSING = "—"

type NumericValue = number | null | undefined

const LOCALE = "en-US"

const percentFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const fixedFourFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

const fixedTwoFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const fixedOneFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const fixedZeroFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const trimmedTwoFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const trimmedOneFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

function isFiniteNumber(value: NumericValue): value is number {
  return value !== null && value !== undefined && Number.isFinite(value)
}

function formatWith(value: NumericValue, digits: number, formatter: Intl.NumberFormat): string {
  if (!isFiniteNumber(value)) {
    return MISSING
  }

  return formatter.format(roundHalfEven(value, digits))
}

function formatSignedFixed(
  value: NumericValue,
  digits: number,
  formatter: Intl.NumberFormat,
): string {
  if (!isFiniteNumber(value)) {
    return MISSING
  }

  const rounded = roundHalfEven(value, digits)
  const sign = rounded < 0 || Object.is(rounded, -0) ? "-" : "+"

  return `${sign}${formatter.format(Math.abs(rounded))}`
}

function formatRange(low: NumericValue, high: NumericValue): string {
  if (!isFiniteNumber(low) || !isFiniteNumber(high)) {
    return MISSING
  }

  const lowFormatted = formatWith(low, 1, percentFormatter)
  const highFormatted = formatWith(high, 1, percentFormatter)

  return `${lowFormatted}–${highFormatted}%`
}

export function formatPercent(value: NumericValue): string {
  const formatted = formatWith(value, 1, percentFormatter)

  return formatted === MISSING ? MISSING : `${formatted}%`
}

export function formatFractionAsPercent(value: NumericValue): string {
  return !isFiniteNumber(value) ? MISSING : formatPercent(value * 100)
}

export function formatPoints(value: NumericValue): string {
  const formatted = formatSignedFixed(value, 1, fixedOneFormatter)

  return formatted === MISSING ? MISSING : `${formatted} pp`
}

export function formatPercentRange(low: NumericValue, high: NumericValue): string {
  return formatRange(low, high)
}

export function formatFractionAsPercentRange(low: NumericValue, high: NumericValue): string {
  const scaledLow = isFiniteNumber(low) ? low * 100 : low
  const scaledHigh = isFiniteNumber(high) ? high * 100 : high

  return formatRange(scaledLow, scaledHigh)
}

export function formatUsd(value: NumericValue): string {
  const formatted = formatWith(value, 2, trimmedTwoFormatter)

  return formatted === MISSING ? MISSING : `$${formatted}`
}

export function formatUsdPerTask(value: NumericValue): string {
  const formatted = formatWith(value, 4, fixedFourFormatter)

  return formatted === MISSING ? MISSING : `$${formatted}`
}

export function formatUsdPerMillionTokens(value: NumericValue): string {
  const formatted = formatWith(value, 4, fixedFourFormatter)

  return formatted === MISSING ? MISSING : `$${formatted}`
}

export function formatTasksPerMonth(value: NumericValue): string {
  return formatWith(value, 1, fixedOneFormatter)
}

export function formatDays(value: NumericValue): string {
  return formatWith(value, 1, fixedOneFormatter)
}

export function formatCount(value: NumericValue): string {
  return formatWith(value, 1, trimmedOneFormatter)
}

function tokenScale(value: number): number {
  const magnitude = Math.abs(value)

  if (magnitude >= 1_000_000_000) {
    return 1_000_000_000
  }

  if (magnitude >= 1_000_000) {
    return 1_000_000
  }

  if (magnitude >= 1_000) {
    return 1_000
  }

  return 1
}

function tokenDecimals(value: number): number {
  const magnitude = Math.abs(value)

  if (magnitude < 10) {
    return 2
  }

  if (magnitude < 100) {
    return 1
  }

  return 0
}

export function formatTokens(value: NumericValue): string {
  if (!isFiniteNumber(value)) {
    return MISSING
  }

  let scale = tokenScale(value)
  let scaled = value / scale
  let digits = tokenDecimals(scaled)
  let rounded = roundHalfEven(scaled, digits)

  if (Math.abs(rounded) >= 1_000 && scale < 1_000_000_000) {
    scale *= 1_000
    scaled = value / scale
    digits = tokenDecimals(scaled)
    rounded = roundHalfEven(scaled, digits)
  }

  const formatted = trimmedTwoFormatter.format(rounded)
  const suffix = scale === 1 ? "" : scale === 1_000 ? "K" : scale === 1_000_000 ? "M" : "B"

  return `${formatted}${suffix}`
}

export function formatTokensExact(value: NumericValue): string {
  return formatWith(value, 0, fixedZeroFormatter)
}

export function formatMultiple(value: NumericValue): string {
  const formatted = formatWith(value, 2, trimmedTwoFormatter)

  return formatted === MISSING ? MISSING : `${formatted}×`
}

export function formatZ(value: NumericValue): string {
  return formatSignedFixed(value, 2, fixedTwoFormatter)
}

export function formatFxRate(value: NumericValue): string {
  return formatWith(value, 4, fixedFourFormatter)
}
