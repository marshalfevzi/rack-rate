import type { Benchmark, Model } from "@rack-rate/core"
import { zScores, type BenchmarkSample } from "@rack-rate/core/normalize"

const TITLE = "Model strength by benchmark"

const NOTE =
  "Colours show each model's within-benchmark z-score, centred on that version's average. A hatched cell means the model has no committed row in that benchmark: it is not evaluated, never a low score."

export interface HeatmapPayloadInput {
  readonly models: readonly Model[]
  readonly benchmarks: readonly Benchmark[]
}

export interface HeatmapPayloadData {
  readonly title: string
  readonly columns: readonly string[]
  readonly rows: readonly string[]
  readonly cells: readonly (readonly [number, number, number])[]
  readonly missing: readonly (readonly [number, number])[]
  readonly note: string
}

export interface HeatmapPayload extends HeatmapPayloadData {
  readonly ariaLabel: string
}

function countOf(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

// The server template and client rebuild share this function so they cannot drift.
export function heatmapAriaLabel(payload: HeatmapPayloadData): string {
  const models = countOf(payload.rows.length, "committed model", "committed models")
  const benchmarks = countOf(payload.columns.length, "benchmark version", "benchmark versions")
  const evaluated = countOf(payload.cells.length, "evaluated cell", "evaluated cells")

  const missing = countOf(
    payload.missing.length,
    "hatched not-evaluated cell",
    "hatched not-evaluated cells",
  )

  return `${models} across ${benchmarks}; ${evaluated} and ${missing}; JavaScript is required to draw this chart.`
}

function samplesFor(benchmark: Benchmark): BenchmarkSample[] {
  return benchmark.rows.map((row) => {
    const sample: BenchmarkSample = {
      model_id: row.model_id,
      score: row.score,
    }

    if (row.ci_lo !== undefined) {
      sample.ci_lo = row.ci_lo
    }

    if (row.ci_hi !== undefined) {
      sample.ci_hi = row.ci_hi
    }

    return sample
  })
}

export function buildHeatmapPayload(input: HeatmapPayloadInput): HeatmapPayload {
  const columns = input.benchmarks.map((benchmark) => benchmark.title)
  const rows = input.models.map((model) => model.id)
  const cells: Array<[number, number, number]> = []
  const missing: Array<[number, number]> = []

  for (let columnIndex = 0; columnIndex < input.benchmarks.length; columnIndex += 1) {
    const benchmark = input.benchmarks[columnIndex]

    if (benchmark === undefined) {
      continue
    }

    // Keep benchmark id and version together: z is computed per committed version.
    const normalized = zScores(benchmark.id, benchmark.version, samplesFor(benchmark))
    const zByModelId = new Map<string, number>()

    for (const row of normalized.rows) {
      zByModelId.set(row.model_id, row.z)
    }

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const modelId = rows[rowIndex]

      if (modelId === undefined) {
        continue
      }

      const z = zByModelId.get(modelId)

      if (z === undefined) {
        missing.push([columnIndex, rowIndex])
      } else {
        cells.push([columnIndex, rowIndex, z])
      }
    }
  }

  const data: HeatmapPayloadData = {
    title: TITLE,
    columns,
    rows,
    cells,
    missing,
    note: NOTE,
  }

  return { ...data, ariaLabel: heatmapAriaLabel(data) }
}

export function encodeHeatmapPayload(payload: HeatmapPayload): string {
  // Escaping less-than signs keeps JSON inside an application/json script from
  // closing the element if a future data label contains a literal `<`.
  return JSON.stringify(payload).replaceAll("<", "\\u003c")
}

export function decodeHeatmapPayload(json: string): HeatmapPayload {
  const parsed = JSON.parse(json)

  // SAFETY: this string is written by this repository's own template in the same
  // build, so no external producer can reach this client decoder; fields are not
  // revalidated.
  const payload = parsed as HeatmapPayload

  if (!Array.isArray(payload?.columns) || payload.columns.length === 0) {
    throw new Error("heatmap payload: columns must be a non-empty array")
  }

  if (!Array.isArray(payload.rows) || payload.rows.length === 0) {
    throw new Error("heatmap payload: rows must be a non-empty array")
  }

  if (!Array.isArray(payload.cells) || payload.cells.length === 0) {
    throw new Error("heatmap payload: cells must be a non-empty array")
  }

  return payload
}
