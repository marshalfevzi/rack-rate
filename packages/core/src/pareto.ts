/**
 * Computes a cost-versus-score Pareto skyline.
 *
 * Cost is minimized and score is maximized. A point is dominated when another point
 * has cost no greater than it and score no lower than it, with at least one strict
 * improvement. `costEpsilon` and `scoreEpsilon` define the comparison bands: values
 * whose absolute difference is at most the corresponding epsilon are equal. Thus,
 * exact and near ties remain co-frontier rather than making one point a false winner.
 * Both epsilons default to zero.
 *
 * `frontier` contains every co-frontier id, ordered by increasing cost, then
 * decreasing score, with input order retained for exact ties. `groups` contains one
 * input-ordered id list for each distinct frontier coordinate under the epsilon
 * bands. `dominated` contains the remaining ids ordered by increasing cost.
 * `points` retains input order and annotates every point. A frontier point has zero
 * score distance, unit cost ratio, and its own id as `frontier_id`.
 *
 * For a dominated point, score distance is the non-negative score gap from the
 * frontier polyline at that cost; the polyline is sorted by cost, interpolated
 * linearly between vertices, and clamped at its two ends. `frontier_id` is the
 * closest-cost polyline vertex (the lower-cost vertex wins an exact distance tie).
 * The cost ratio divides the point cost by the lowest frontier cost reaching its
 * score, or by the highest frontier cost if no frontier point reaches it. Epsilon
 * score equality is used for this lookup as well. The highest frontier cost is used
 * as the fallback denominator because it is the least misleading finite frontier
 * reference for an unreachable score. If that denominator is zero, the ratio is
 * `1` when both costs are zero and otherwise is capped at `Number.MAX_VALUE`, never
 * dividing by zero. Arithmetic overflow is capped at the largest finite number;
 * epsilon-tolerated comparisons can otherwise make a raw interpolated gap slightly
 * negative, so score distance is clamped at zero.
 *
 * Costs and scores must be finite, and costs must be non-negative. A missing, NaN,
 * infinite, or negative cost/score is a programming error and throws an Error naming
 * the point id. Duplicate ids also throw. Empty and single-point inputs return a
 * valid result.
 */

export interface ParetoPoint {
  id: string
  cost: number
  score: number
}

export interface ParetoOptions {
  costEpsilon?: number
  scoreEpsilon?: number
}

export interface FrontierDistance {
  delta_score: number
  cost_ratio: number
  frontier_id: string | null
}

export interface FrontierPoint extends ParetoPoint {
  on_frontier: boolean
  distance: FrontierDistance
}

export interface ParetoFrontier {
  points: FrontierPoint[]
  frontier: string[]
  groups: string[][]
  dominated: string[]
}

interface IndexedPoint extends ParetoPoint {
  index: number
}

interface FrontierGroup {
  representative: IndexedPoint
  members: IndexedPoint[]
}

interface PolylineDistance {
  score: number
  frontierId: string
}

function epsilonValue(value: number | undefined, name: string): number {
  if (value === undefined) {
    return 0
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite, non-negative number`)
  }

  return value
}

function compareSortedPoints(left: IndexedPoint, right: IndexedPoint): number {
  if (left.cost < right.cost) {
    return -1
  }

  if (left.cost > right.cost) {
    return 1
  }

  if (left.score > right.score) {
    return -1
  }

  if (left.score < right.score) {
    return 1
  }

  return left.index - right.index
}

function sameFrontierCoordinate(
  left: IndexedPoint,
  right: IndexedPoint,
  costEpsilon: number,
  scoreEpsilon: number,
): boolean {
  return (
    Math.abs(left.cost - right.cost) <= costEpsilon &&
    Math.abs(left.score - right.score) <= scoreEpsilon
  )
}

function finiteDifference(left: number, right: number): number {
  const difference = left - right

  if (Number.isFinite(difference)) {
    return difference
  }

  if (left >= right) {
    return Number.MAX_VALUE
  }

  return -Number.MAX_VALUE
}

function finiteRatio(numerator: number, denominator: number): number {
  if (denominator === 0) {
    if (numerator === 0) {
      return 1
    }

    return Number.MAX_VALUE
  }

  const ratio = numerator / denominator

  if (Number.isFinite(ratio)) {
    return ratio
  }

  return Number.MAX_VALUE
}

function interpolateScore(left: IndexedPoint, right: IndexedPoint, cost: number): number {
  const fraction = (cost - left.cost) / (right.cost - left.cost)
  const boundedFraction = Math.min(1, Math.max(0, fraction))

  const score = left.score * (1 - boundedFraction) + right.score * boundedFraction

  if (Number.isFinite(score)) {
    return score
  }

  if (boundedFraction < 0.5) {
    return left.score
  }

  return right.score
}

function polylineDistance(vertices: readonly IndexedPoint[], cost: number): PolylineDistance {
  const first = vertices[0]

  if (first === undefined) {
    throw new Error("Cannot measure distance without a frontier")
  }

  if (vertices.length === 1 || cost <= first.cost) {
    return { score: first.score, frontierId: first.id }
  }

  const lastIndex = vertices.length - 1
  const last = vertices[lastIndex]

  if (last === undefined || cost >= last.cost) {
    if (last === undefined) {
      throw new Error("Cannot measure distance without a frontier endpoint")
    }

    return { score: last.score, frontierId: last.id }
  }

  let low = 0
  let high = lastIndex

  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2)
    const middlePoint = vertices[middle]

    if (middlePoint === undefined) {
      throw new Error("Invalid frontier polyline")
    }

    if (middlePoint.cost <= cost) {
      low = middle
    } else {
      high = middle
    }
  }

  const lower = vertices[low]
  const upper = vertices[high]

  if (lower === undefined || upper === undefined) {
    throw new Error("Invalid frontier polyline")
  }

  const lowerDistance = cost - lower.cost
  const upperDistance = upper.cost - cost
  const reference = lowerDistance <= upperDistance ? lower : upper

  return {
    score: interpolateScore(lower, upper, cost),
    frontierId: reference.id,
  }
}

function frontierCostForScore(
  vertices: readonly IndexedPoint[],
  score: number,
  scoreEpsilon: number,
): number {
  const lastIndex = vertices.length - 1
  const last = vertices[lastIndex]

  if (last === undefined) {
    throw new Error("Cannot find a frontier cost without a frontier")
  }

  const target = score - scoreEpsilon
  let low = 0
  let high = lastIndex

  if (vertices[0] !== undefined && vertices[0].score >= target) {
    return vertices[0].cost
  }

  if (last.score < target) {
    return last.cost
  }

  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2)
    const middlePoint = vertices[middle]

    if (middlePoint === undefined) {
      throw new Error("Invalid frontier polyline")
    }

    if (middlePoint.score >= target) {
      high = middle
    } else {
      low = middle
    }
  }

  const answer = vertices[high]

  if (answer === undefined) {
    throw new Error("Invalid frontier polyline")
  }

  return answer.cost
}

function makeDistance(
  point: IndexedPoint,
  vertices: readonly IndexedPoint[],
  scoreEpsilon: number,
): FrontierDistance {
  const polyline = polylineDistance(vertices, point.cost)
  const deltaScore = Math.max(0, finiteDifference(polyline.score, point.score))
  const frontierCost = frontierCostForScore(vertices, point.score, scoreEpsilon)

  return {
    delta_score: deltaScore,
    cost_ratio: finiteRatio(point.cost, frontierCost),
    frontier_id: polyline.frontierId,
  }
}

interface FrontierGrouping {
  groups: FrontierGroup[]
  vertices: IndexedPoint[]
}

function makeGroups(
  frontier: readonly IndexedPoint[],
  costEpsilon: number,
  scoreEpsilon: number,
): FrontierGrouping {
  const groups: FrontierGroup[] = []

  for (const point of frontier) {
    const current = groups[groups.length - 1]

    if (
      current !== undefined &&
      sameFrontierCoordinate(current.representative, point, costEpsilon, scoreEpsilon)
    ) {
      current.members.push(point)
    } else {
      groups.push({ representative: point, members: [point] })
    }
  }

  for (const group of groups) {
    group.members.sort((left, right) => left.index - right.index)
  }

  const vertices: IndexedPoint[] = []

  for (const group of groups) {
    const representative = group.representative
    vertices.push(representative)
  }

  return { groups, vertices }
}

/**
 * Returns the cost-minimizing, score-maximizing skyline and distances to it.
 */
export function paretoFrontier(
  points: readonly ParetoPoint[],
  options?: ParetoOptions,
): ParetoFrontier {
  const costEpsilon = epsilonValue(options?.costEpsilon, "costEpsilon")

  const scoreEpsilon = epsilonValue(options?.scoreEpsilon, "scoreEpsilon")

  const seenIds = new Set<string>()

  const indexed: IndexedPoint[] = []

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]

    if (point === undefined) {
      throw new Error(`Missing point at index ${index}`)
    }

    if (seenIds.has(point.id)) {
      throw new Error(`Duplicate point id "${point.id}"`)
    }

    seenIds.add(point.id)

    if (!Number.isFinite(point.cost) || point.cost < 0) {
      throw new Error(`Invalid cost for point "${point.id}"`)
    }

    if (!Number.isFinite(point.score)) {
      throw new Error(`Invalid score for point "${point.id}"`)
    }

    indexed.push({ id: point.id, cost: point.cost, score: point.score, index })
  }

  const sorted = [...indexed]
  sorted.sort(compareSortedPoints)

  const dominatedFlags = new Set<number>()
  const nearDeque: number[] = []
  let dequeStart = 0
  let lowerBound = 0
  let upperBound = -1
  let lowerCostScore = -Infinity

  for (let index = 0; index < sorted.length; index += 1) {
    const point = sorted[index]

    if (point === undefined) {
      throw new Error("Invalid sorted point")
    }

    const lowerCost = point.cost - costEpsilon
    const upperCost = point.cost + costEpsilon

    while (lowerBound < sorted.length) {
      const candidate = sorted[lowerBound]

      if (candidate === undefined || candidate.cost >= lowerCost) {
        break
      }

      if (candidate.score > lowerCostScore) {
        lowerCostScore = candidate.score
      }

      lowerBound += 1
    }

    while (upperBound + 1 < sorted.length) {
      const candidate = sorted[upperBound + 1]

      if (candidate === undefined || candidate.cost > upperCost) {
        break
      }

      upperBound += 1

      while (nearDeque.length > dequeStart) {
        const tailIndex = nearDeque[nearDeque.length - 1]
        const tail = tailIndex === undefined ? undefined : sorted[tailIndex]

        if (tail === undefined || tail.score >= candidate.score) {
          break
        }

        nearDeque.pop()
      }

      nearDeque.push(upperBound)
    }

    while (dequeStart < nearDeque.length) {
      const candidateIndex = nearDeque[dequeStart]

      if (candidateIndex === undefined || candidateIndex >= lowerBound) {
        break
      }

      dequeStart += 1
    }

    const nearIndex = nearDeque[dequeStart]
    const near = nearIndex === undefined ? undefined : sorted[nearIndex]
    const nearScore = near === undefined ? -Infinity : near.score
    const hasStrictlyBetterScore = nearScore > point.score + scoreEpsilon
    const hasStrictlyBetterCost = lowerCostScore >= point.score - scoreEpsilon

    if (hasStrictlyBetterScore || hasStrictlyBetterCost) {
      dominatedFlags.add(point.index)
    }
  }

  const frontierSorted: IndexedPoint[] = []
  const dominatedSorted: IndexedPoint[] = []

  for (const point of sorted) {
    if (dominatedFlags.has(point.index)) {
      dominatedSorted.push(point)
    } else {
      frontierSorted.push(point)
    }
  }

  dominatedSorted.sort((left, right) => {
    if (left.cost < right.cost) {
      return -1
    }

    if (left.cost > right.cost) {
      return 1
    }

    return left.index - right.index
  })

  const grouped = makeGroups(frontierSorted, costEpsilon, scoreEpsilon)
  const frontierIds: string[] = []
  const groupIds: string[][] = []

  for (const point of frontierSorted) {
    frontierIds.push(point.id)
  }

  for (const group of grouped.groups) {
    const ids: string[] = []

    for (const point of group.members) {
      ids.push(point.id)
    }

    groupIds.push(ids)
  }

  const resultPoints: FrontierPoint[] = []

  for (const point of indexed) {
    const onFrontier = !dominatedFlags.has(point.index)

    const distance: FrontierDistance = onFrontier
      ? { delta_score: 0, cost_ratio: 1, frontier_id: point.id }
      : makeDistance(point, grouped.vertices, scoreEpsilon)

    resultPoints.push({
      id: point.id,
      cost: point.cost,
      score: point.score,
      on_frontier: onFrontier,
      distance,
    })
  }

  const dominatedIds: string[] = []

  for (const point of dominatedSorted) {
    dominatedIds.push(point.id)
  }

  return {
    points: resultPoints,
    frontier: frontierIds,
    groups: groupIds,
    dominated: dominatedIds,
  }
}
