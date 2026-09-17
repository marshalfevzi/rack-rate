// Route identity for the shell: one table owns the lane labels, their lane
// numbers and the current-route rule, so the lane rail and the footer index
// cannot drift apart.
//
// Labels stay verbatim from the sticky header they replace; the rail's casing is
// a CSS treatment, not a copy change, which is what the M5 stage contract
// requires. The numbering is durable: lanes 01-06 are working surfaces, METHOD
// and SOURCES are the unnumbered reference group.
import { href } from "./url.ts"

/** A shell lane: a numbered working surface, or an unnumbered reference row. */
export interface Lane {
  /** Two-digit lane number, or `null` for a reference row. */
  number: string | null
  path: `/${string}`
  label: string
}

export const lanes: readonly Lane[] = [
  { number: "01", path: "/", label: "Overview" },
  { number: "02", path: "/models", label: "Models" },
  { number: "03", path: "/plans", label: "Plans" },
  { number: "04", path: "/compare", label: "Compare" },
  { number: "05", path: "/explore", label: "Explore" },
  { number: "06", path: "/start", label: "Get started" },
  { number: null, path: "/method", label: "Method" },
  { number: null, path: "/sources", label: "Sources" },
]

/**
 * The current route, exactly as the sticky header computed it: exact for the
 * overview, prefix-based for every other route, so `/models/<id>` marks Models.
 */
export function isCurrent(pathname: string, path: `/${string}`): boolean {
  const target = href(path)

  return path === "/" ? pathname === target : pathname.startsWith(target)
}

/** The lane's stable anchor id: `lane-01` for a numbered lane, `lane-method` for a reference row. */
export function laneAnchorId(lane: Lane): string {
  return lane.number === null ? `lane-${lane.path.slice(1)}` : `lane-${lane.number}`
}
