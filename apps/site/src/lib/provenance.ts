// Provenance vocabulary and geometry: the words and the arithmetic that the
// provenance components render, in one place so a label or a clamp cannot drift
// between two components.
//
// Pure TypeScript — no Astro import, no `import.meta.env`, no DOM — so `.astro`
// frontmatter and `bun test` call the same function.
import type { Model, PairBadge, Plan } from "@rack-rate/core"
import { STALE_AFTER_DAYS } from "@rack-rate/core"

/** The four levels are `data/plans.json`'s `confidence` (invariant 5). */
export type Confidence = Plan["confidence"]

/**
 * A pair carries the committed verdict from `derived.json` badges; a row's comes
 * from `freshnessOf(row.retrieved_at, derived.generated_at)` in
 * `@rack-rate/core`, so both paths use one threshold.
 */
export type Freshness = PairBadge["freshness"]

/** The three quantities invariant 4 keeps apart and never plots on one axis. */
export type CostBasisKind = "api-list" | "plan-route" | "aa-index"

/**
 * The data's own qualifier: `models[].cost_basis` and
 * `benchmarks[].rows[].cost_basis` (invariant 4) or `plans[].price_status`,
 * where an absent value means `list`.
 */
export type CostBasisStatus = Model["cost_basis"] | NonNullable<Plan["price_status"]>

/** What a figure is per. `format.ts` emits no unit word, so the chip adds it. */
export type CostUnit = "per-task" | "per-month" | "per-million-tokens"

/** Which units `ci_lo`/`ci_hi` are in — the two-convention trap in docs/architecture.md. */
export type CiScale = "fraction" | "percent"

export interface Term {
  label: string
  description: string
}

export const CONFIDENCE_TERMS = {
  measured: {
    label: "Measured",
    description:
      "The upstream project measured a saturated month through the plan's own client; `measured_against_model` names the model it ran.",
  },
  high: {
    label: "High",
    description: "The vendor states the monthly quota directly on its own pricing page.",
  },
  medium: {
    label: "Medium",
    description:
      "This project's arithmetic on a vendor-advertised multiplier — a claim carried through, not an independent measurement.",
  },
  low: {
    label: "Low",
    description: "Aggregator-only or placeholder figure. Displayed, never used as a computed row.",
  },
} satisfies Record<Confidence, Term>

export const FRESHNESS_TERMS = {
  fresh: {
    label: "Fresh",
    description: `Retrieved within ${STALE_AFTER_DAYS} days of the newest upstream snapshot in this build.`,
  },
  stale: {
    label: "Stale",
    description: `Retrieved more than ${STALE_AFTER_DAYS} days before the newest upstream snapshot in this build, so the vendor may have changed it since.`,
  },
} satisfies Record<Freshness, Term>

export const COST_BASIS_TERMS = {
  "api-list": {
    label: "API list",
    description:
      "Vendor list rates for the tokens a task consumed, priced by this project's arithmetic.",
  },
  "plan-route": {
    label: "Plan route",
    description: "A plan's monthly price divided by the tasks its quota covers for one model.",
  },
  "aa-index": {
    label: "AA index",
    description:
      "Artificial Analysis index cost. A different quantity from the other two bases and never plotted on the same axis.",
  },
} satisfies Record<CostBasisKind, Term>

export const COST_UNIT_LABELS = {
  "per-task": "/task",
  "per-month": "/mo",
  "per-million-tokens": "/1M tokens",
} satisfies Record<CostUnit, string>

const COST_STATUS_TERMS = {
  list: {
    label: "list price",
    description: "The figure is the vendor's published rate.",
  },
  "expected-launch": {
    label: "expected launch",
    description: "Priced against anticipated launch rates rather than a general-availability one.",
  },
  disputed: {
    label: "disputed",
    description: "Sources disagree on this figure; the disagreement is recorded in the known gaps.",
  },
  unknown: {
    label: "unknown basis",
    description: "The source does not state what rate the figure is based on.",
  },
} satisfies Record<CostBasisStatus, Term>

/**
 * The basis label, with the plan named for a route: `{plan} route` is the
 * quantity, and a route basis without its plan hides which one.
 */
export function costBasisTerm(kind: CostBasisKind, planName?: string): Term {
  const term = COST_BASIS_TERMS[kind]

  if (kind !== "plan-route") {
    return term
  }

  if (planName === undefined || planName.trim() === "") {
    throw new Error("provenance: a plan-route basis needs the plan name it is the route for")
  }

  return { label: `${planName} route`, description: term.description }
}

/**
 * `list` is the unremarkable default, so a chip qualifies only a figure that is
 * not a plain list rate — `expected-launch` and `disputed` are the ones a reader
 * has to be told about.
 */
export function costBasisQualifier(status: CostBasisStatus): Term | null {
  return status === "list" ? null : COST_STATUS_TERMS[status]
}

export interface CiGeometry {
  /** Position of the interval's low end, in percent of the track. */
  leftPct: number
  /** Width of the interval, in percent of the track. */
  widthPct: number
  /** Position of the point estimate, in percent of the track. */
  valuePct: number
}

const CI_DOMAIN = { fraction: 1, percent: 100 } satisfies Record<CiScale, number>

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function toTrackPercent(value: number, domain: number): number {
  return Math.round((clamp(value, 0, domain) / domain) * 100_000) / 1000
}

/**
 * Positions an interval on a full 0–100 track: the domain is the unit's real
 * one, never zoomed to the interval, so a narrow interval reads as narrow.
 *
 * Returns `null` when either endpoint is absent — a half-range is not an
 * interval, and a bar drawn from one end would invent the other (the rule
 * `format.ts` applies to the printed range). A transposed pair is ordered
 * rather than drawn inside out; the printed range stays the caller's to format.
 */
export function ciGeometry(
  value: number,
  lo: number | undefined,
  hi: number | undefined,
  scale: CiScale,
): CiGeometry | null {
  if (
    lo === undefined ||
    hi === undefined ||
    !Number.isFinite(value) ||
    !Number.isFinite(lo) ||
    !Number.isFinite(hi)
  ) {
    return null
  }

  const domain = CI_DOMAIN[scale]
  const leftPct = toTrackPercent(Math.min(lo, hi), domain)
  const highPct = toTrackPercent(Math.max(lo, hi), domain)

  return {
    leftPct,
    // A delta between the rounded ends, so `leftPct + widthPct` lands exactly on
    // the interval's high end rather than on float noise.
    widthPct: Math.round((highPct - leftPct) * 1000) / 1000,
    valuePct: toTrackPercent(value, domain),
  }
}
