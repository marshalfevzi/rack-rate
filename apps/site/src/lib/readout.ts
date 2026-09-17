// Pure TypeScript — no Astro import, no `import.meta.env`, no DOM — so `.astro`
// frontmatter, the browser bundle and `bun test` call the same functions.
// This module must not import `./data.ts`: committed JSON belongs to the build
// boundary. It may import the zod-free format and provenance vocabulary used by
// both the server-rendered record and the browser update path.
import type {
  Benchmark,
  DerivedCompositeRow,
  DerivedParetoFrontier,
  DerivedTokenAllowanceRow,
  Model,
  Plan,
  Source,
} from "@rack-rate/core"
import { ARTIFICIAL_ANALYSIS_SOURCE_ID, BENCHMARK_SOURCE_IDS } from "@rack-rate/core/ids"

import { formatCount, formatMultiple, formatPercent, formatUsd, MISSING } from "./format.ts"
import { isCurrent, lanes } from "./nav.ts"
import { artificialAnalysisState, COST_BASIS_TERMS, LISTING_COPY } from "./provenance.ts"

/** The five fields, in the order they print and in no other. */
export const READOUT_FIELDS = ["value", "basis", "confidence", "source", "retrieved"] as const

export type ReadoutField = (typeof READOUT_FIELDS)[number]

/** VALUE · BASIS · CONFIDENCE · SOURCE · RETRIEVED — the printed labels. */
export const READOUT_LABELS: Readonly<Record<ReadoutField, string>> = {
  value: "VALUE",
  basis: "BASIS",
  confidence: "CONFIDENCE",
  source: "SOURCE",
  retrieved: "RETRIEVED",
}

/** `data-readout-value`, `data-readout-basis`, … */
export function readoutAttribute(field: ReadoutField): string {
  return `data-readout-${field}`
}

/** The marker an element carries to declare itself a readout source. */
export const READOUT_SOURCE_SELECTOR = "[data-readout]"
/** The one display element. Never a source: `closest()` from inside it must not match it. */

export const READOUT_LINE_SELECTOR = "[data-readout-line]"
/** The gap reason, read only when the value is absent. */

export const READOUT_GAP_ATTRIBUTE = "data-readout-gap"

/** One record: five already-formatted strings. `MISSING` where a field has no value. */
export interface ReadoutFields {
  readonly value: string
  readonly basis: string
  readonly confidence: string
  readonly source: string
  readonly retrieved: string
}

/** The `data-readout*` attributes for one source element. Literal keys: no computed names. */
export interface ReadoutAttributes {
  readonly "data-readout": string
  readonly "data-readout-value": string
  readonly "data-readout-basis": string
  readonly "data-readout-confidence": string
  readonly "data-readout-source": string
  readonly "data-readout-retrieved": string
}

export function readoutAttributes(fields: ReadoutFields): ReadoutAttributes {
  return {
    "data-readout": "",
    "data-readout-value": fields.value,
    "data-readout-basis": fields.basis,
    "data-readout-confidence": fields.confidence,
    "data-readout-source": fields.source,
    "data-readout-retrieved": fields.retrieved,
  }
}

/** `Known gap: {reason}` — the gap string printed for a known gap. */
export function gapReason(reason: string): string {
  return `Known gap: ${reason}`
}

/** `VALUE —` in every figure field, the reason in SOURCE, and no date by default. */
export function missingReadout(reason: string, retrieved?: string): ReadoutFields {
  return {
    value: MISSING,
    basis: MISSING,
    confidence: MISSING,
    source: gapReason(reason),
    retrieved: retrieved ?? MISSING,
  }
}

/** `VALUE x · BASIS y · CONFIDENCE z · SOURCE s · RETRIEVED r`. */
export function readoutLine(fields: ReadoutFields): string {
  return READOUT_FIELDS.map((field) => `${READOUT_LABELS[field]} ${fields[field]}`).join(" · ")
}

/** Minimal structural type so the reader is testable without a DOM. */
export interface ReadoutAttributeCarrier {
  getAttribute(name: string): string | null
}

/** A declared source's record, or `null` when it declares neither a value nor a gap. */
export function readoutFieldsFrom(carrier: ReadoutAttributeCarrier): ReadoutFields | null {
  const value = carrier.getAttribute(readoutAttribute("value"))
  const gap = carrier.getAttribute(READOUT_GAP_ATTRIBUTE)
  const hasValue = value !== null && value.trim() !== ""
  const hasGap = gap !== null && gap.trim() !== ""

  if (!hasValue && !hasGap) {
    return null
  }

  if (!hasValue) {
    return {
      value: MISSING,
      basis: MISSING,
      confidence: MISSING,
      source: gap?.trim() ?? MISSING,
      retrieved: MISSING,
    }
  }

  const field = (name: ReadoutField): string => {
    const fieldValue = carrier.getAttribute(readoutAttribute(name))

    return fieldValue === null || fieldValue.trim() === "" ? MISSING : fieldValue
  }

  return {
    value,
    basis: field("basis"),
    confidence: field("confidence"),
    source: field("source"),
    retrieved: field("retrieved"),
  }
}

export interface ShellStampInput {
  buildDate: string
  dataDate: string
  benchmarks: readonly Benchmark[]
  sources: readonly Source[]
}

export interface ShellStampReadouts {
  readonly build: ReadoutFields
  readonly data: ReadoutFields
  readonly aa: ReadoutFields
}

/** The band's three committed stamps, as readout records. */
export function shellStampReadouts(input: ShellStampInput): ShellStampReadouts {
  const latestBenchmark = input.benchmarks
    .filter((benchmark) => BENCHMARK_SOURCE_IDS.has(benchmark.id))
    .reduce<Benchmark | undefined>(
      (latest, benchmark) =>
        latest === undefined || benchmark.retrieved_at > latest.retrieved_at ? benchmark : latest,
      undefined,
    )

  const latestSource = input.sources.reduce<Source | undefined>(
    (latest, source) =>
      latest === undefined || source.retrieved > latest.retrieved ? source : latest,
    undefined,
  )

  const aa = artificialAnalysisState(input.benchmarks)
  const aaSource = input.sources.find((source) => source.id === ARTIFICIAL_ANALYSIS_SOURCE_ID)

  return {
    build: {
      value: input.buildDate,
      basis: "generated",
      confidence: "measured",
      source: "derived.json",
      retrieved: input.dataDate,
    },
    data: {
      value: input.dataDate,
      basis: "retrieved",
      confidence: "measured",
      source: latestBenchmark?.title ?? latestSource?.id ?? MISSING,
      retrieved: input.dataDate,
    },
    aa: {
      value: aa.published ? "ON" : "OFF",
      basis: COST_BASIS_TERMS["aa-index"].label,
      confidence: MISSING,
      source: "AA",
      retrieved: aaSource?.retrieved ?? MISSING,
    },
  }
}

export interface DefaultReadoutInput {
  pathname: string
  models: readonly Model[]
  plans: readonly Plan[]
  benchmarks: readonly Benchmark[]
  sources: readonly Source[]
  tokenAllowances: readonly DerivedTokenAllowanceRow[]
  apiFrontier: DerivedParetoFrontier
  composites: readonly DerivedCompositeRow[]
}

function benchmarkForModel(model: Model, benchmarks: readonly Benchmark[]): Benchmark | undefined {
  return benchmarks.find(
    (benchmark) => `${benchmark.id}@${benchmark.version}` === model.benchmark_version,
  )
}

function modelReadout(model: Model, benchmarks: readonly Benchmark[]): ReadoutFields {
  const benchmark = benchmarkForModel(model, benchmarks)

  if (benchmark === undefined) {
    return missingReadout("no committed figure.", model.retrieved_at)
  }

  return {
    value: formatPercent(model.score_pct),
    basis: benchmark.unit,
    confidence: "measured",
    source: benchmark.title,
    retrieved: model.retrieved_at,
  }
}

function leadingModel(models: readonly Model[]): Model | undefined {
  return models.reduce<Model | undefined>(
    (leader, model) =>
      leader === undefined || model.score_pct > leader.score_pct ? model : leader,
    undefined,
  )
}

function leadingAllowance(
  tokenAllowances: readonly DerivedTokenAllowanceRow[],
): DerivedTokenAllowanceRow | undefined {
  return tokenAllowances.reduce<DerivedTokenAllowanceRow | undefined>(
    (leader, row) =>
      leader === undefined || row.value_multiple > leader.value_multiple ? row : leader,
    undefined,
  )
}

function detailId(pathname: string, path: `/${string}`): string | null {
  const marker = `${path}/`
  const markerIndex = pathname.indexOf(marker)

  if (markerIndex === -1) {
    return null
  }

  const remainder = pathname
    .slice(markerIndex + marker.length)
    .split("/")
    .filter((segment) => segment.length > 0)

  return remainder[0] === undefined ? null : decodeURIComponent(remainder[0])
}

function planReadout(plan: Plan, value: string): ReadoutFields {
  return {
    value,
    basis: COST_BASIS_TERMS["plan-route"].label,
    confidence: plan.confidence,
    source: plan.provider,
    retrieved: plan.retrieved_at,
  }
}

/** The page's own headline record. Never throws, never returns an empty field. */
export function defaultReadout(input: DefaultReadoutInput): ReadoutFields {
  const lane = lanes.find((candidate) => isCurrent(input.pathname, candidate.path))

  if (lane === undefined) {
    return {
      value: "Page not found",
      basis: "n/a",
      confidence: "n/a",
      source: "rack-rate",
      retrieved: "n/a",
    }
  }

  switch (lane.path) {
    case "/models": {
      const slug = detailId(input.pathname, lane.path)

      if (slug !== null) {
        const model = input.models.find((candidate) => candidate.id === slug)

        return model === undefined
          ? missingReadout("no committed figure.")
          : modelReadout(model, input.benchmarks)
      }

      const model = leadingModel(input.models)

      return model === undefined
        ? missingReadout("no committed figure.")
        : modelReadout(model, input.benchmarks)
    }

    case "/plans": {
      const slug = detailId(input.pathname, lane.path)

      if (slug !== null) {
        const plan = input.plans.find((candidate) => candidate.id === slug)

        return plan === undefined
          ? missingReadout("no committed figure.")
          : planReadout(plan, formatUsd(plan.price_usd_month))
      }

      const allowance = leadingAllowance(input.tokenAllowances)

      const plan =
        allowance === undefined
          ? undefined
          : input.plans.find((item) => item.id === allowance.plan_id)

      return allowance === undefined || plan === undefined
        ? missingReadout("no committed figure.")
        : planReadout(plan, formatMultiple(allowance.value_multiple))
    }

    case "/compare": {
      const model = leadingModel(input.models)

      return model === undefined
        ? missingReadout("no committed figure.")
        : modelReadout(model, input.benchmarks)
    }

    case "/explore": {
      const benchmarkId = input.models[0]?.benchmark_version.split("@")[0]?.toUpperCase() ?? MISSING

      return {
        value: `${input.apiFrontier.frontier.length}/${input.apiFrontier.points.length}`,
        basis: COST_BASIS_TERMS["api-list"].label,
        confidence: "measured",
        source: benchmarkId,
        retrieved: input.models[0]?.retrieved_at ?? MISSING,
      }
    }

    case "/method": {
      const compositeCount = input.composites.filter((row) => row.badge === "ok").length
      const suppressedCount = input.composites.filter((row) => row.badge === "single-source").length

      return {
        value: `${formatCount(compositeCount)}/${formatCount(compositeCount + suppressedCount)}`,
        basis: "pass@1",
        confidence: "measured",
        source: input.models[0]?.benchmark_version.split("@")[0]?.toUpperCase() ?? MISSING,
        retrieved: input.models[0]?.retrieved_at ?? MISSING,
      }
    }

    case "/sources": {
      const aa = artificialAnalysisState(input.benchmarks)
      const aaSource = input.sources.find((source) => source.id === ARTIFICIAL_ANALYSIS_SOURCE_ID)

      return {
        value: aa.published ? "ON" : "OFF",
        basis: COST_BASIS_TERMS["aa-index"].label,
        confidence: MISSING,
        source: "AA",
        retrieved: aaSource?.retrieved ?? MISSING,
      }
    }

    case "/start":
      return {
        value: MISSING,
        basis: MISSING,
        confidence: MISSING,
        source: LISTING_COPY.empty,
        retrieved: MISSING,
      }
    default:
      return {
        value: "Page not found",
        basis: "n/a",
        confidence: "n/a",
        source: "rack-rate",
        retrieved: "n/a",
      }
  }
}
