import type { Benchmark, Model } from "@rack-rate/core"

const TITLE = "Rank across benchmarks"

const NOTE =
  "Rank 1 is the best committed score in that benchmark version; each column ranks only the models that committed a row there, so a column with fewer rows ends higher. A vertical band spans the ranks whose confidence intervals share a common value: those ranks are indistinguishable, and every model is still drawn at its own position. A model with no row in a benchmark is neither ranked last nor interpolated: its line breaks and a hollow marker sits in the not-evaluated lane, which is not a rank."

export interface BumpRankGroup {
  readonly from: number
  readonly to: number
}

export interface BumpColumn {
  readonly key: string
  readonly id: string
  readonly version: string
  readonly title: string
  readonly unit: Benchmark["unit"]
  readonly scale: Benchmark["scale"]
  readonly rowCount: number
  readonly groups: readonly BumpRankGroup[]
}

export interface BumpCell {
  readonly score: number
  readonly ciLo: number | null
  readonly ciHi: number | null
  readonly rank: number
}

export interface BumpLine {
  readonly id: string
  readonly name: string
  readonly cells: readonly (BumpCell | null)[]
}

export interface BumpPayload {
  readonly title: string
  readonly note: string
  readonly columns: readonly BumpColumn[]
  readonly lines: readonly BumpLine[]
  readonly laneRank: number
  readonly gapCount: number
  readonly tieCount: number
}

export interface BumpPayloadInput {
  readonly models: readonly Model[]
  readonly benchmarks: readonly Benchmark[]
}

interface GroupState {
  from: number
  to: number
  lo: number | null
  hi: number | null
}

interface RankedColumn {
  readonly column: BumpColumn
  readonly cellsByModelId: ReadonlyMap<string, BumpCell>
}

function countOf(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function compareModelIds(left: string, right: string): number {
  if (left < right) {
    return -1
  }

  if (left > right) {
    return 1
  }

  return 0
}

function buildRankedColumn(benchmark: Benchmark): RankedColumn {
  const key = `${benchmark.id}@${benchmark.version}`
  const seenModelIds = new Set<string>()

  for (const row of benchmark.rows) {
    if (seenModelIds.has(row.model_id)) {
      throw new Error(`bump payload: ${key} lists ${row.model_id} twice`)
    }

    seenModelIds.add(row.model_id)
  }

  const rows = [...benchmark.rows]
  rows.sort((left, right) => {
    const scoreOrder = right.score - left.score

    return scoreOrder === 0 ? compareModelIds(left.model_id, right.model_id) : scoreOrder
  })

  const groups: GroupState[] = []
  const cellsByModelId = new Map<string, BumpCell>()

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]

    if (row === undefined) {
      continue
    }

    const rank = index + 1
    const ciLo = row.ci_lo ?? null
    const ciHi = row.ci_hi ?? null
    const previousRow = index > 0 ? rows[index - 1] : undefined
    const group = groups[groups.length - 1]

    const sharesInterval =
      group !== undefined &&
      ciLo !== null &&
      ciHi !== null &&
      group.lo !== null &&
      group.hi !== null &&
      Math.max(group.lo, ciLo) <= Math.min(group.hi, ciHi)

    const joinsPrevious =
      group !== undefined &&
      previousRow !== undefined &&
      (row.score === previousRow.score || sharesInterval)

    let assignedGroup: GroupState

    if (!joinsPrevious || group === undefined) {
      assignedGroup = {
        from: rank,
        to: rank,
        lo: ciLo !== null && ciHi !== null ? ciLo : null,
        hi: ciLo !== null && ciHi !== null ? ciHi : null,
      }
      groups.push(assignedGroup)
    } else {
      assignedGroup = group
      assignedGroup.to = rank

      if (ciLo !== null && ciHi !== null) {
        if (assignedGroup.lo === null || assignedGroup.hi === null) {
          assignedGroup.lo = ciLo
          assignedGroup.hi = ciHi
        } else {
          assignedGroup.lo = Math.max(assignedGroup.lo, ciLo)
          assignedGroup.hi = Math.min(assignedGroup.hi, ciHi)
        }
      }
    }

    cellsByModelId.set(row.model_id, {
      score: row.score,
      ciLo,
      ciHi,
      rank,
    })
  }

  const publicGroups: BumpRankGroup[] = groups.map((group) => ({
    from: group.from,
    to: group.to,
  }))

  const column: BumpColumn = {
    key,
    id: benchmark.id,
    version: benchmark.version,
    title: benchmark.title,
    unit: benchmark.unit,
    scale: benchmark.scale,
    rowCount: benchmark.rows.length,
    groups: publicGroups,
  }

  return { column, cellsByModelId }
}

// Builds one ranked column per committed benchmark version and aligns model lines to them.
export function buildBumpPayload(input: BumpPayloadInput): BumpPayload {
  if (input.benchmarks.length === 0) {
    throw new Error("bump payload: no committed benchmark version to rank")
  }

  const rankedColumns: RankedColumn[] = []
  let maxRowCount = 0

  for (const benchmark of input.benchmarks) {
    const rankedColumn = buildRankedColumn(benchmark)
    rankedColumns.push(rankedColumn)
    maxRowCount = Math.max(maxRowCount, rankedColumn.column.rowCount)
  }

  const lines: BumpLine[] = []
  let gapCount = 0

  for (const model of input.models) {
    const cells: Array<BumpCell | null> = []
    let hasCell = false
    let lineGapCount = 0

    for (const rankedColumn of rankedColumns) {
      const cell = rankedColumn.cellsByModelId.get(model.id) ?? null
      cells.push(cell)

      if (cell === null) {
        lineGapCount += 1
      } else {
        hasCell = true
      }
    }

    if (hasCell) {
      lines.push({ id: model.id, name: model.name, cells })
      gapCount += lineGapCount
    }
  }

  if (lines.length === 0) {
    throw new Error("bump payload: no model has a row in any committed benchmark")
  }

  const tieCount = rankedColumns.reduce(
    (count, rankedColumn) =>
      count + rankedColumn.column.groups.filter((group) => group.to > group.from).length,
    0,
  )

  return {
    title: TITLE,
    note: NOTE,
    columns: rankedColumns.map((rankedColumn) => rankedColumn.column),
    lines,
    laneRank: maxRowCount + 1,
    gapCount,
    tieCount,
  }
}

// Encodes a payload safely for an application/json script element.
export function encodeBumpPayload(payload: BumpPayload): string {
  // Escaping less-than signs keeps JSON inside an application/json script from
  // closing the element if a future data label contains a literal `<`.
  return JSON.stringify(payload).replaceAll("<", "\\u003c")
}

// Decodes the server-generated payload and rejects empty chart structures.
export function decodeBumpPayload(json: string): BumpPayload {
  const parsed = JSON.parse(json)

  // SAFETY: this string is written by this repository's own template in the same
  // build, so no external producer can reach this client decoder; fields are not
  // revalidated.
  const payload = parsed as BumpPayload

  if (!Array.isArray(payload?.columns) || payload.columns.length === 0) {
    throw new Error("bump payload: columns must be a non-empty array")
  }

  if (!Array.isArray(payload.lines) || payload.lines.length === 0) {
    throw new Error("bump payload: lines must be a non-empty array")
  }

  for (const line of payload.lines) {
    if (!Array.isArray(line.cells) || line.cells.length !== payload.columns.length) {
      throw new Error("bump payload: every line cells array must match columns length")
    }
  }

  return payload
}

// Returns the rank group covering a column rank.
export function groupForRank(column: BumpColumn, rank: number): BumpRankGroup {
  for (const group of column.groups) {
    if (rank >= group.from && rank <= group.to) {
      return group
    }
  }

  throw new Error(`bump payload: rank ${rank} is not in ${column.key}`)
}

// Names the committed models, benchmark versions, ties, and gaps for assistive technology.
export function bumpAriaLabel(payload: BumpPayload): string {
  const models = countOf(payload.lines.length, "committed model", "committed models")

  const benchmarks = countOf(payload.columns.length, "benchmark version", "benchmark versions")

  return `${models} ranked across ${benchmarks}; ${countOf(payload.tieCount, "tied rank range", "tied rank ranges")}; ${countOf(payload.gapCount, "model-benchmark gap", "model-benchmark gaps")} in the not-evaluated lane; JavaScript is required to draw this chart.`
}
