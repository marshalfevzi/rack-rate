// Browser-only module: it is loaded only from dynamically imported client scripts.
import { getInstanceByDom, init } from "./registry.ts"
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

  function applyOption(): void {
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

  applyOption()

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
      resizeObserver.disconnect()
      motion.removeEventListener("change", onMotionChange)
      chart.dispose()
    },
  }
}
