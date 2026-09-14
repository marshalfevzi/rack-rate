// Browser-only module: it is loaded only from dynamically imported client scripts.
import { getInstanceByDom, init, unregisteredSeriesTypes } from "./registry.ts"
import type { ChartOption } from "./registry.ts"

export interface ChartHandle {
  update(option: ChartOption): void
  dispose(): void
}

export function mountChart(target: HTMLElement, option: ChartOption): ChartHandle {
  if (getInstanceByDom(target) !== undefined) {
    throw new Error("the element already holds a chart instance; dispose the existing handle first")
  }

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
  const chart = init(target, undefined, { renderer: "canvas" })
  let lastOption = option
  let disposed = false

  // Checked before `setOption`, so an option that cannot render is not left on
  // screen: ECharts drops an unregistered series in silence (see registry.ts).
  function applyOption(): void {
    const missing = unregisteredSeriesTypes(lastOption)

    if (missing.length > 0) {
      throw new Error(
        `the option declares the unregistered series type ${missing.join(", ")}: add it to SERIES_INSTALLS in src/lib/charts/registry.ts`,
      )
    }

    chart.setOption({ ...lastOption, animation: !motion.matches }, { notMerge: true })
  }

  // A media listener is needed because reduced motion is a live user setting,
  // so the chart must re-apply the current option when that setting changes.
  const onMotionChange = (): void => {
    applyOption()
  }

  motion.addEventListener("change", onMotionChange)

  const resizeObserver = new ResizeObserver(() => {
    chart.resize()
  })

  resizeObserver.observe(target)

  function disposeChart(): void {
    resizeObserver.disconnect()
    motion.removeEventListener("change", onMotionChange)
    chart.dispose()
  }

  // A rejected first option must not leave a live instance behind: the caller
  // gets no handle, and a retry would hit the double-mount error above instead
  // of the real one.
  try {
    applyOption()
  } catch (error) {
    disposeChart()
    throw error
  }

  return {
    update(nextOption: ChartOption): void {
      if (disposed) {
        throw new Error("the chart was disposed; mount a new one")
      }

      lastOption = nextOption
      applyOption()
    },
    // Disposal is manual because the site is multi-page and a page can be
    // re-rendered by a filter change.
    dispose(): void {
      if (disposed) {
        return
      }

      disposed = true
      disposeChart()
    },
  }
}
