import { BarChart, HeatmapChart, LineChart, RadarChart, ScatterChart } from "echarts/charts"
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  RadarComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components"
import { getInstanceByDom, init, use } from "echarts/core"
import { LabelLayout } from "echarts/features"
import { CanvasRenderer } from "echarts/renderers"
import type { ComposeOption } from "echarts/core"
import type {
  DataZoomComponentOption,
  GridComponentOption,
  LegendComponentOption,
  RadarComponentOption,
  TooltipComponentOption,
  VisualMapComponentOption,
} from "echarts/components"

// `use()`'s own parameter type says what may be registered; ECharts exports the
// pieces of that union but no name for the union itself.
type UseArgument = Parameters<typeof use>[0]

type Elements<Union> = Union extends readonly (infer Element)[] ? Element : Union

interface SeriesInstall {
  /** What `use()` receives. */
  install: Elements<UseArgument>
  /** What an option's `series[].type` must say to be rendered. */
  type: string
}

// One row per series family: `install` registers it, `type` is the only name an
// option can use to refer to it. Keeping both in one row is what makes
// `unregisteredSeriesTypes` trustworthy — a stage cannot register a family
// without teaching the check that family's name. Growth rule: the stage that
// lands a family's first builder adds its row, never a page or a builder
// module. All five Stage-4 families are landed: scatter + line in 4.2, heatmap
// in 4.4, bar in 4.6, radar in 4.7 (4.3 and 4.5 reuse line).
const SERIES_INSTALLS: readonly SeriesInstall[] = [
  { install: ScatterChart, type: "scatter" },
  { install: LineChart, type: "line" },
  { install: HeatmapChart, type: "heatmap" },
  { install: BarChart, type: "bar" },
  { install: RadarChart, type: "radar" },
]

// Canvas is the only renderer the site uses. Grid, tooltip, legend, and
// data-zoom are the components the shared cartesian frame and the Pareto
// scatter's window control use.
// LabelLayout is load-bearing for Stage 4.2's Pareto scatter option: without it,
// ECharts silently ignores `labelLayout`, measured as overlapping data labels at
// 360 px. markLine is load-bearing for Stage 4.3's tied-rank bands and the
// not-evaluated lane separator, and ECharts silently drops `series.markLine`
// when the component is unregistered (same silent failure mode as the
// `LabelLayout` feature in 4.2). Growth rule: the stage whose option first
// relies on a feature adds its registration here.
use([
  CanvasRenderer,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  DataZoomComponent,
  LabelLayout,
  MarkLineComponent,
  // 4.4 owns the diverging scale of the model x benchmark heatmap; 4.7 owns the
  // radar coordinate system. Both were registered with the first option that
  // reads them, per the growth rule above.
  VisualMapComponent,
  RadarComponent,
  ...SERIES_INSTALLS.map((series) => series.install),
])

const REGISTERED_SERIES = new Set(SERIES_INSTALLS.map((series) => series.type))

export { getInstanceByDom, init }

export type FrameComponentOption =
  | DataZoomComponentOption
  | GridComponentOption
  | LegendComponentOption
  | RadarComponentOption
  | TooltipComponentOption
  | VisualMapComponentOption

// `{ grid: { outerBoundsContain: "nope" } }` is a compile error. It does NOT
// reject an unregistered key: ComposeOption keeps ECBasicOption's string index
// signature, so `series` and invented keys compile whether or not anything
// registered them. That is why registration is checked by name at mount time —
// see docs/architecture.md, "What the option type does and does not enforce".
export type ChartOption = ComposeOption<FrameComponentOption>

/** The one field the registration guard reads out of a series entry. */
interface SeriesNameCarrier {
  readonly type?: string
}

interface SeriesCarrier {
  readonly series?: SeriesNameCarrier | readonly SeriesNameCarrier[]
}

function isSeriesList(
  series: SeriesNameCarrier | readonly SeriesNameCarrier[],
): series is readonly SeriesNameCarrier[] {
  return Array.isArray(series)
}

/**
 * The series types `option` declares that no row of `SERIES_INSTALLS` registers.
 *
 * ECharts renders a series only if something installed its family, and it says
 * nothing when nothing did: the option keeps the series, the plot draws axes
 * around no data, and neither a production nor a development build logs a word.
 * A series with no `type` is skipped, because that is ECharts' own default
 * rather than a name that could be missing from the registry.
 */
export function unregisteredSeriesTypes(option: ChartOption): string[] {
  // SAFETY: `series` is not a declared key of the composed option type — ECharts
  // accepts it through an index signature — and this guard reads only `type`
  // from each entry. A `type` that is not a string at runtime reads as absent,
  // so the check ignores it rather than trusting the assertion.
  const { series } = option as SeriesCarrier

  if (series === undefined) {
    return []
  }

  const missing = new Set<string>()

  for (const entry of isSeriesList(series) ? series : [series]) {
    const { type } = entry

    if (type !== undefined && !REGISTERED_SERIES.has(type)) {
      missing.add(type)
    }
  }

  return [...missing]
}
