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

// ChartOption types the frame's component keys and their option values, so
// `{ grid: { outerBoundsContain: "nope" } }` is a compile error. It does NOT
// reject an unregistered key: ComposeOption keeps ECBasicOption's string index
// signature, so `series` and invented keys compile too, registered or not. The
// measurement and the verification each builder stage owes live in
// docs/architecture.md, "What the option type does and does not enforce".
export type ChartOption = ComposeOption<FrameComponentOption>
