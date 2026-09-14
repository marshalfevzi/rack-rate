import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components"
import { getInstanceByDom, init, use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import type { ComposeOption } from "echarts/core"
import type {
  GridComponentOption,
  LegendComponentOption,
  TooltipComponentOption,
} from "echarts/components"

// Canvas is the only renderer the site uses. Grid, tooltip, and legend are the
// components used by the shared cartesian frame and the plan's preserved chart
// features (legend + tooltips, cost-basis toggle). Growth rule: a chart series
// type is registered on the next line by the stage that lands its first builder
// (4.2 scatter, 4.3 line, 4.4 heatmap+visualMap, 4.5 line, 4.6 bar, 4.7
// radar), never in a page or a builder module.
use([CanvasRenderer, GridComponent, LegendComponent, TooltipComponent])

export { getInstanceByDom, init }

export type FrameComponentOption =
  | GridComponentOption
  | LegendComponentOption
  | TooltipComponentOption

// ChartOption carries no series: a family builder composes its own series
// options from FrameComponentOption, and frame.ts returns exactly ChartOption.
// ComposeOption narrows ECharts' otherwise index-signed option type.
export type ChartOption = ComposeOption<FrameComponentOption>
