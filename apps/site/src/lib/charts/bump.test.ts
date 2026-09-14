import { describe, expect, test } from "bun:test"

import { bumpChart, bumpTooltipLines, GAP_SERIES_NAME, TIE_SERIES_NAME } from "./bump.ts"
import type { BumpPayload } from "./bump-payload.ts"
import { unregisteredSeriesTypes } from "./registry.ts"
import type { ChartOption } from "./registry.ts"
import type { ChartTokens } from "./theme.ts"

const tokens: ChartTokens = {
  canvas: "#0a0e15",
  panel: "#111825",
  rule: "#1d2735",
  ink: "#eaeef5",
  dim: "#a3b0c4",
  adjusted: "#ffb020",
  measured: "#45d97f",
  api: "#5c6a80",
  apiInk: "#8a97ab",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  fontSizeMeta: 13,
  fontSizeBody: 15,
}

const payload: BumpPayload = {
  title: "Rank across benchmarks",
  note: "synthetic",
  columns: [
    {
      key: "alpha@1",
      id: "alpha",
      version: "1",
      title: "Alpha @1",
      unit: "pass@1",
      scale: "0-100",
      rowCount: 7,
      groups: [
        { from: 1, to: 1 },
        { from: 2, to: 2 },
        { from: 3, to: 7 },
      ],
    },
    {
      key: "beta@2",
      id: "beta",
      version: "2",
      title: "Beta @2",
      unit: "accuracy",
      scale: "0-1",
      rowCount: 3,
      groups: [
        { from: 1, to: 2 },
        { from: 3, to: 3 },
      ],
    },
    {
      key: "gamma@3",
      id: "gamma",
      version: "3",
      title: "Gamma @3",
      unit: "index",
      scale: "z",
      rowCount: 1,
      groups: [{ from: 1, to: 1 }],
    },
  ],
  lines: [
    {
      id: "model-a",
      name: "Model A",
      cells: [
        { score: 74.12, ciLo: 71.25, ciHi: 76.98, rank: 1 },
        null,
        { score: -0.2, ciLo: -0.21, ciHi: -0.19, rank: 1 },
      ],
    },
    {
      id: "model-b",
      name: "Model B",
      cells: [
        { score: 65, ciLo: null, ciHi: null, rank: 4 },
        { score: 0.58, ciLo: 0.55, ciHi: 0.61, rank: 3 },
        null,
      ],
    },
  ],
  laneRank: 8,
  gapCount: 2,
  tieCount: 2,
}

const manyGapPayload: BumpPayload = {
  ...payload,
  lines: Array.from({ length: 16 }, (_, index) => ({
    id: `gap-${index}`,
    name: `Gap Model ${index}`,
    cells: [
      { score: 100 - index, ciLo: null, ciHi: null, rank: index + 1 },
      null,
      { score: index, ciLo: null, ciHi: null, rank: index + 1 },
    ],
  })),
  laneRank: 17,
  gapCount: 16,
}

const twoColumnGapPayload: BumpPayload = {
  title: "Two-column gaps",
  note: "synthetic",
  columns: [
    {
      key: "alpha@1",
      id: "alpha",
      version: "1",
      title: "Alpha @1",
      unit: "pass@1",
      scale: "0-100",
      rowCount: 3,
      groups: [{ from: 1, to: 3 }],
    },
    {
      key: "beta@2",
      id: "beta",
      version: "2",
      title: "Beta @2",
      unit: "accuracy",
      scale: "0-1",
      rowCount: 2,
      groups: [{ from: 1, to: 2 }],
    },
  ],
  lines: [
    {
      id: "left-gap-a",
      name: "Left Gap A",
      cells: [null, { score: 0.9, ciLo: null, ciHi: null, rank: 1 }],
    },
    {
      id: "left-gap-b",
      name: "Left Gap B",
      cells: [null, { score: 0.8, ciLo: null, ciHi: null, rank: 2 }],
    },
    {
      id: "right-gap-a",
      name: "Right Gap A",
      cells: [{ score: 90, ciLo: null, ciHi: null, rank: 1 }, null],
    },
    {
      id: "right-gap-b",
      name: "Right Gap B",
      cells: [{ score: 80, ciLo: null, ciHi: null, rank: 2 }, null],
    },
    {
      id: "right-gap-c",
      name: "Right Gap C",
      cells: [{ score: 70, ciLo: null, ciHi: null, rank: 3 }, null],
    },
  ],
  laneRank: 6,
  gapCount: 5,
  tieCount: 0,
}

const nineTiePayload: BumpPayload = {
  ...payload,
  columns: payload.columns.map((column, index) =>
    index === 2
      ? {
          ...column,
          rowCount: 18,
          groups: Array.from({ length: 9 }, (_, groupIndex) => ({
            from: groupIndex * 2 + 1,
            to: groupIndex * 2 + 2,
          })),
        }
      : { ...column, groups: [] },
  ),
  tieCount: 9,
}

interface AxisEntry {
  readonly type?: string
  readonly name?: string
  readonly data?: readonly string[]
  readonly min?: number
  readonly max?: number
  readonly inverse?: boolean
  readonly interval?: number
  readonly axisLabel?: {
    readonly formatter?: (value: number) => string
  }
}

interface MarkLineEntry {
  readonly yAxis?: number
  readonly coord?: readonly number[]
  readonly lineStyle?: {
    readonly color?: string
    readonly type?: string
    readonly width?: number
    readonly opacity?: number
  }
  readonly label?: {
    readonly show?: boolean
    readonly position?: string
    readonly formatter?: string
    readonly color?: string
    readonly fontSize?: number
    readonly fontFamily?: string
  }
}

interface MarkLineOption {
  readonly data?: readonly (MarkLineEntry | readonly MarkLineEntry[])[]
  readonly lineStyle?: {
    readonly color?: string
    readonly width?: number
    readonly opacity?: number
  }
  readonly symbol?: readonly string[]
}

interface GapDataEntry {
  readonly value?: readonly number[]
  readonly name?: string
  readonly symbolOffset?: readonly number[]
}

function isGapEntry(entry: null | readonly number[] | GapDataEntry): entry is GapDataEntry {
  return entry !== null && !Array.isArray(entry) && "name" in entry
}

function gapDataOf(series: SeriesEntry | undefined): readonly GapDataEntry[] {
  return (series?.data ?? []).filter(isGapEntry)
}

interface SeriesEntry {
  readonly type?: string
  readonly name?: string
  readonly data?: readonly (
    | null
    | readonly number[]
    | {
        readonly value?: readonly number[]
        readonly name?: string
        readonly symbolOffset?: readonly number[]
      }
  )[]
  readonly connectNulls?: boolean
  readonly markLine?: MarkLineOption
  readonly animation?: boolean
}

interface RenderedOption {
  readonly xAxis?: AxisEntry | readonly AxisEntry[]
  readonly yAxis?: AxisEntry | readonly AxisEntry[]
  readonly legend?: { readonly show?: boolean }
  readonly tooltip?: { readonly trigger?: string }
  readonly series?: SeriesEntry | readonly SeriesEntry[]
}

function onlyOption<T>(value: T | readonly T[] | undefined): T {
  if (value === undefined) {
    throw new Error("expected one option")
  }

  if (Array.isArray(value)) {
    const first: T | undefined = value[0]

    if (first === undefined) {
      throw new Error("expected a non-empty option")
    }

    return first
  }

  // SAFETY: the only non-array shape this helper receives is one axis option.
  return value as T
}

function seriesOf(option: ChartOption): readonly SeriesEntry[] {
  // SAFETY: tests inspect only the documented ECharts series field.
  const renderedOption = option as RenderedOption
  const series = renderedOption.series

  if (series === undefined) {
    return []
  }

  return series instanceof Array ? series : [series]
}

function optionOf(option: ChartOption): RenderedOption {
  // SAFETY: tests inspect only documented cartesian option fields.
  return option as RenderedOption
}

describe("Bump chart", () => {
  test("builds categorical rank axes and the expected series composition", () => {
    const chart = bumpChart({ tokens, payload })
    const option = optionOf(chart.option)
    const series = seriesOf(chart.option)
    const xAxis = onlyOption(option.xAxis)
    const yAxis = onlyOption(option.yAxis)

    expect(chart.title).toBe(payload.title)
    expect(xAxis.type).toBe("category")
    expect(xAxis.data).toEqual(payload.columns.map((column) => column.title))
    expect(yAxis.type).toBe("value")
    expect(yAxis.name).toBe("Rank (1 = best)")
    expect(yAxis.min).toBe(1)
    expect(yAxis.max).toBe(payload.laneRank)
    expect(yAxis.inverse).toBe(true)
    expect(yAxis.interval).toBe(1)
    expect(option.legend?.show).toBe(false)
    expect(option.tooltip?.trigger).toBe("item")
    expect(series.map((entry) => entry.name)).toEqual([
      "Model A",
      "Model B",
      GAP_SERIES_NAME,
      TIE_SERIES_NAME,
    ])
    expect(unregisteredSeriesTypes(chart.option)).toEqual([])
    expect(series.every((entry) => entry.animation === undefined)).toBe(true)
  })

  test("breaks model lines at gaps and puts markers in line-major order", () => {
    const series = seriesOf(bumpChart({ tokens, payload }).option)
    const modelA = series[0]
    const modelB = series[1]
    const gapSeries = series[2]

    expect(modelA?.data).toEqual([[0, 1], null, [2, 1]])
    expect(modelB?.data).toEqual([[0, 4], [1, 3], null])
    expect(modelA?.connectNulls).toBe(false)
    expect(modelB?.connectNulls).toBe(false)
    expect(gapSeries?.data).toEqual([
      {
        value: [1, payload.laneRank],
        name: "Model A",
        symbolOffset: [0, 0],
      },
      {
        value: [2, payload.laneRank],
        name: "Model B",
        symbolOffset: [0, 0],
      },
    ])
  })

  test("draws tied-rank bands and a label-free not-evaluated separator", () => {
    const series = seriesOf(bumpChart({ tokens, payload }).option)
    const gapSeries = series[2]
    const tieSeries = series[3]
    const tieData = tieSeries?.markLine?.data
    const separator = gapSeries?.markLine?.data?.[0]

    expect(tieData).toHaveLength(2)
    expect(tieData?.[0]).toEqual([{ coord: [0, 3] }, { coord: [0, 7] }])
    expect(tieData?.[1]).toEqual([{ coord: [1, 1] }, { coord: [1, 2] }])
    expect(separator).toEqual({
      yAxis: payload.laneRank - 0.5,
      lineStyle: { color: tokens.rule, type: "dashed" },
    })
  })

  test("spreads gap markers across the lane in line order with in-band offsets", () => {
    const chart = bumpChart({ tokens, payload: manyGapPayload })
    const gapSeries = seriesOf(chart.option)[16]
    const markers = gapDataOf(gapSeries)
    const offsets = markers.map((marker) => marker.symbolOffset?.[0] ?? 0)

    expect(markers).toHaveLength(16)
    expect(markers.map((marker) => marker.name)).toEqual(
      manyGapPayload.lines.map((line) => line.name),
    )
    expect(markers.every((marker) => marker.value?.[0] === 1)).toBe(true)
    expect(markers.every((marker) => marker.value?.[1] === manyGapPayload.laneRank)).toBe(true)
    expect(new Set(offsets).size).toBeGreaterThanOrEqual(8)
    expect(offsets).toEqual([...offsets].sort((left, right) => left - right))
    expect(offsets.every((offset) => offset >= -64 && offset <= 64)).toBe(true)
  })

  test("centres each gap column using its own marker count", () => {
    const chart = bumpChart({ tokens, payload: twoColumnGapPayload })
    const gapSeries = seriesOf(chart.option)[twoColumnGapPayload.lines.length]
    const markers = gapDataOf(gapSeries)
    const leftMarkers = markers.filter((marker) => marker.value?.[0] === 0)
    const rightMarkers = markers.filter((marker) => marker.value?.[0] === 1)

    expect(leftMarkers).toHaveLength(2)
    expect(rightMarkers).toHaveLength(3)

    const leftOffsets = leftMarkers.map((marker) => marker.symbolOffset?.[0] ?? 0)
    const rightOffsets = rightMarkers.map((marker) => marker.symbolOffset?.[0] ?? 0)

    expect(markers.map((marker) => marker.name)).toEqual([
      "Left Gap A",
      "Left Gap B",
      "Right Gap A",
      "Right Gap B",
      "Right Gap C",
    ])
    expect(leftOffsets).toEqual([-4.25, 4.25])
    expect(rightOffsets).toEqual([-8.5, 0, 8.5])
    expect(leftOffsets.every((offset) => offset >= -64 && offset <= 64)).toBe(true)
    expect(rightOffsets.every((offset) => offset >= -64 && offset <= 64)).toBe(true)

    const expectedTooltips = [
      ["Left Gap A", "Alpha @1 · pass@1", "not evaluated — no committed row"],
      ["Left Gap B", "Alpha @1 · pass@1", "not evaluated — no committed row"],
      ["Right Gap A", "Beta @2 · accuracy", "not evaluated — no committed row"],
      ["Right Gap B", "Beta @2 · accuracy", "not evaluated — no committed row"],
      ["Right Gap C", "Beta @2 · accuracy", "not evaluated — no committed row"],
    ]

    for (const [index, expected] of expectedTooltips.entries()) {
      expect(bumpTooltipLines(twoColumnGapPayload, GAP_SERIES_NAME, index)).toEqual(expected)
    }
  })

  test("maps several gap marker indices to their own model and benchmark tooltip", () => {
    for (const index of [0, 7, 15]) {
      const expectedName = manyGapPayload.lines[index]?.name ?? ""

      expect(bumpTooltipLines(manyGapPayload, GAP_SERIES_NAME, index)).toEqual([
        expectedName,
        "Beta @2 · accuracy",
        "not evaluated — no committed row",
      ])
    }
  })

  test("keeps one not-evaluated label, nine tie bands, and the lane separator", () => {
    const chart = bumpChart({ tokens, payload: nineTiePayload })
    const option = optionOf(chart.option)
    const series = seriesOf(chart.option)
    const yAxis = onlyOption(option.yAxis)
    const gapSeries = series[2]
    const tieSeries = series[3]

    const markLineLabels = series.flatMap((entry) =>
      (entry.markLine?.data ?? []).flatMap((line) =>
        !Array.isArray(line) && "label" in line ? [line.label?.formatter] : [],
      ),
    )

    const labels = [
      yAxis.axisLabel?.formatter?.(nineTiePayload.laneRank),
      ...markLineLabels,
    ].filter((label): label is string => label !== undefined)

    expect(labels.filter((label) => label === "not evaluated")).toHaveLength(1)
    expect(gapSeries?.markLine?.symbol).toEqual(["none", "none"])
    expect(gapSeries?.markLine?.data?.[0]).toEqual({
      yAxis: nineTiePayload.laneRank - 0.5,
      lineStyle: { color: tokens.rule, type: "dashed" },
    })
    expect(tieSeries?.markLine?.data).toHaveLength(9)
  })

  test("formats model, tie, gap, unknown, and out-of-range tooltips", () => {
    expect(bumpTooltipLines(payload, "Model A", 0)).toEqual([
      "Model A",
      "Alpha @1 · pass@1",
      "74.1%",
      "interval 71.2–77.0%",
      "rank 1",
    ])
    expect(bumpTooltipLines(payload, "Model B", 0)).toEqual([
      "Model B",
      "Alpha @1 · pass@1",
      "65.0%",
      "no interval reported",
      "rank 3–7 (tied)",
    ])
    expect(bumpTooltipLines(payload, "Model B", 1)).toEqual([
      "Model B",
      "Beta @2 · accuracy",
      "58.0%",
      "interval 55.0–61.0%",
      "rank 3",
    ])
    expect(bumpTooltipLines(payload, "Model A", 2)).toEqual([
      "Model A",
      "Gamma @3 · index",
      "-0.20",
      "interval -0.21 to -0.19",
      "rank 1",
    ])
    expect(bumpTooltipLines(payload, GAP_SERIES_NAME, 0)).toEqual([
      "Model A",
      "Beta @2 · accuracy",
      "not evaluated — no committed row",
    ])
    expect(bumpTooltipLines(payload, "unknown", 0)).toEqual([])
    expect(bumpTooltipLines(payload, "Model A", 99)).toEqual([])
    expect(bumpTooltipLines(payload, GAP_SERIES_NAME, 99)).toEqual([])
  })

  test("rejects a payload with no benchmark columns", () => {
    const emptyPayload: BumpPayload = { ...payload, columns: [], lines: [], laneRank: 1 }

    expect(() => bumpChart({ tokens, payload: emptyPayload })).toThrow(
      "bump chart requires at least one benchmark column",
    )
  })
})
