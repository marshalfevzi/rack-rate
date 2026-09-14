import type { Benchmark } from "@rack-rate/core"

import {
  formatCount,
  formatFractionAsPercent,
  formatFractionAsPercentRange,
  formatPercent,
  formatPercentRange,
  formatZ,
} from "../format.ts"
import { cartesianFrame } from "./frame.ts"
import type { BumpCell, BumpColumn, BumpPayload } from "./bump-payload.ts"
import { groupForRank } from "./bump-payload.ts"
import type { ChartOption } from "./registry.ts"
import type { ChartTokens } from "./theme.ts"

export const GAP_SERIES_NAME = "Not evaluated"

export const TIE_SERIES_NAME = "Tied rank range"

export interface GapMarker {
  readonly modelId: string
  readonly modelName: string
  readonly columnIndex: number
  readonly column: BumpColumn
}

export function gapMarkers(payload: BumpPayload): readonly GapMarker[] {
  const markers: GapMarker[] = []

  for (const line of payload.lines) {
    for (const [columnIndex, cell] of line.cells.entries()) {
      const column = payload.columns[columnIndex]

      if (cell === null && column !== undefined) {
        markers.push({
          modelId: line.id,
          modelName: line.name,
          columnIndex,
          column,
        })
      }
    }
  }

  return markers
}

// Keep a little air between 7px rectangles so each gap marker has its own
// hit target while the run remains centered on the category.
const GAP_MARKER_SPACING_PX = 8.5

function gapMarkerOffset(index: number, count: number): number {
  if (count < 2) {
    return 0
  }

  return (index - (count - 1) / 2) * GAP_MARKER_SPACING_PX
}

function gapMarkerOffsets(markers: readonly GapMarker[]): readonly number[] {
  const countsByColumn = new Map<number, number>()

  for (const marker of markers) {
    countsByColumn.set(marker.columnIndex, (countsByColumn.get(marker.columnIndex) ?? 0) + 1)
  }

  const positionsByColumn = new Map<number, number>()

  return markers.map((marker) => {
    const position = positionsByColumn.get(marker.columnIndex) ?? 0
    positionsByColumn.set(marker.columnIndex, position + 1)

    return gapMarkerOffset(position, countsByColumn.get(marker.columnIndex) ?? 0)
  })
}

export interface BumpChartInput {
  readonly tokens: ChartTokens
  readonly payload: BumpPayload
}

export interface BumpChart {
  readonly title: string
  readonly option: ChartOption
}

type ScoreFormatter = (value: number) => string

type RangeFormatter = (low: number, high: number) => string

const scoreFormatters = {
  "0-100": formatPercent,
  "0-1": formatFractionAsPercent,
  z: formatZ,
} satisfies Record<Benchmark["scale"], ScoreFormatter>

const rangeFormatters = {
  "0-100": formatPercentRange,
  "0-1": formatFractionAsPercentRange,
  z: (low: number, high: number) => `${formatZ(low)} to ${formatZ(high)}`,
} satisfies Record<Benchmark["scale"], RangeFormatter>

function modelCell(
  line: BumpCell | null | undefined,
  column: BumpColumn | undefined,
  lineName: string,
): string[] {
  if (line === undefined || line === null || column === undefined) {
    return []
  }

  const group = groupForRank(column, line.rank)

  const rankLabel =
    group.from === group.to ? `rank ${line.rank}` : `rank ${group.from}–${group.to} (tied)`

  const interval =
    line.ciLo !== null && line.ciHi !== null
      ? `interval ${rangeFormatters[column.scale](line.ciLo, line.ciHi)}`
      : "no interval reported"

  return [
    lineName,
    `${column.title} · ${column.unit}`,
    scoreFormatters[column.scale](line.score),
    interval,
    rankLabel,
  ]
}

export function bumpTooltipLines(
  payload: BumpPayload,
  seriesName: string,
  dataIndex: number,
): string[] {
  const line = payload.lines.find((candidate) => candidate.name === seriesName)

  if (line !== undefined) {
    const cell = line.cells[dataIndex]

    return modelCell(cell, payload.columns[dataIndex], line.name)
  }

  if (seriesName === GAP_SERIES_NAME) {
    const marker = gapMarkers(payload)[dataIndex]

    if (marker === undefined) {
      return []
    }

    return [
      marker.modelName,
      `${marker.column.title} · ${marker.column.unit}`,
      "not evaluated — no committed row",
    ]
  }

  return []
}

export function bumpChart(input: BumpChartInput): BumpChart {
  const { payload, tokens } = input

  if (payload.columns.length === 0) {
    throw new Error("bump chart requires at least one benchmark column")
  }

  const rankFormat = (value: number): string =>
    value === payload.laneRank ? "not evaluated" : formatCount(value)

  const frame = cartesianFrame({
    tokens,
    title: payload.title,
    x: {
      type: "category",
      categories: payload.columns.map((column) => column.title),
    },
    y: {
      type: "value",
      label: "Rank (1 = best)",
      format: rankFormat,
      min: 1,
      max: payload.laneRank,
      inverse: true,
      interval: 1,
    },
    format: rankFormat,
  })

  const modelSeries = payload.lines.map(
    (line) =>
      ({
        type: "line",
        name: line.name,
        data: line.cells.map((cell, index) => (cell === null ? null : [index, cell.rank])),
        connectNulls: false,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: tokens.dim, width: 1, opacity: 0.45 },
        itemStyle: { color: tokens.ink },
        z: 2,
      }) satisfies ChartOption,
  )

  const markers = gapMarkers(payload)
  const offsets = gapMarkerOffsets(markers)

  const option = {
    ...frame.option,
    legend: { ...frame.option.legend, show: false },
    tooltip: {
      ...frame.option.tooltip,
      trigger: "item",
      formatter: (params) => {
        if (!("seriesName" in params) || !("dataIndex" in params)) {
          return ""
        }

        const seriesName = params.seriesName

        if (seriesName === undefined) {
          return ""
        }

        return bumpTooltipLines(payload, seriesName, params.dataIndex).join(" · ")
      },
    },
    series: [
      ...modelSeries,
      {
        type: "scatter",
        name: GAP_SERIES_NAME,
        z: 3,
        symbol: "rect",
        symbolSize: 7,
        itemStyle: {
          color: "transparent",
          borderColor: tokens.dim,
          borderWidth: 1,
          borderType: "dashed",
        },
        data: markers.map((marker, index) => ({
          value: [marker.columnIndex, payload.laneRank],
          name: marker.modelName,
          symbolOffset: [offsets[index] ?? 0, 0],
        })),
        markLine: {
          silent: true,
          symbol: ["none", "none"],
          animation: false,
          data: [
            {
              yAxis: payload.laneRank - 0.5,
              lineStyle: { color: tokens.rule, type: "dashed" },
            },
          ],
        },
      },
      {
        type: "line",
        name: TIE_SERIES_NAME,
        data: [],
        silent: true,
        z: 1,
        markLine: {
          silent: true,
          symbol: ["none", "none"],
          animation: false,
          lineStyle: { color: tokens.dim, width: 8, opacity: 0.22 },
          data: payload.columns.flatMap((column, columnIndex) =>
            column.groups.flatMap((group) =>
              group.to > group.from
                ? [[{ coord: [columnIndex, group.from] }, { coord: [columnIndex, group.to] }]]
                : [],
            ),
          ),
        },
      },
    ],
  } satisfies ChartOption

  return { title: frame.title, option }
}
