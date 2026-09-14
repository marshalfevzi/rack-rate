/**
 * Pure per-benchmark normalization and weighted composite math.
 *
 * BenchmarkSample scores and intervals use the benchmark's reported 0-100 units,
 * matching BenchmarkRow.ci_lo/ci_hi in schema.ts. Model.ci_lo/ci_hi in schema.ts
 * are 0-1 fractions, so callers convert a source fraction to 0-100 once at the
 * ingest boundary before creating a sample (and only convert back when populating
 * a model-level record). zScores carries benchmark-unit intervals unchanged;
 * composite converts them to z-space through each benchmark's mean and SD.
 */
export interface BenchmarkSample {
  model_id: string
  score: number
  ci_lo?: number
  ci_hi?: number
}

export interface ZScoreRow {
  model_id: string
  score: number
  z: number
  mean: number
  sd: number
  n: number
  ci_lo?: number
  ci_hi?: number
}

export interface NormalizedBenchmark {
  benchmark_id: string
  version: string
  rows: ZScoreRow[]
}

export interface CompositeOptions {
  weights: ReadonlyMap<string, number>
}

export interface CompositeRow {
  model_id: string
  weighted_z: number
  composite: number | null
  k: number
  benchmarks_used: string[]
  badge: "ok" | "single-source"
  ci_lo: number | null
  ci_hi: number | null
}

interface WeightedRow {
  benchmark_id: string
  row: ZScoreRow
  weight: number
}

interface ModelCoverage {
  k: number
  weighted_rows: WeightedRow[]
}

interface BenchmarkMoments {
  mean: number
  sd: number
}

function moments(samples: readonly BenchmarkSample[]): BenchmarkMoments {
  if (samples.length === 0) {
    return { mean: 0, sd: 0 }
  }

  let total = 0

  for (const sample of samples) {
    total += sample.score
  }

  const mean = total / samples.length

  let squaredDeviation = 0

  for (const sample of samples) {
    const difference = sample.score - mean
    squaredDeviation += difference * difference
  }

  const sd = Math.sqrt(squaredDeviation / samples.length)

  return { mean, sd }
}

function toZ(score: number, mean: number, sd: number): number {
  if (sd === 0) {
    return 0
  }

  return (score - mean) / sd
}

export function zScores(
  benchmark_id: string,
  version: string,
  samples: readonly BenchmarkSample[],
): NormalizedBenchmark {
  const { mean, sd } = moments(samples)
  const rows: ZScoreRow[] = []

  for (const sample of samples) {
    const row: ZScoreRow = {
      model_id: sample.model_id,
      score: sample.score,
      z: toZ(sample.score, mean, sd),
      mean,
      sd,
      n: samples.length,
    }

    if (sample.ci_lo !== undefined) {
      row.ci_lo = sample.ci_lo
    }

    if (sample.ci_hi !== undefined) {
      row.ci_hi = sample.ci_hi
    }

    rows.push(row)
  }

  return { benchmark_id, version, rows }
}

function collectCoverage(
  perBenchmark: readonly NormalizedBenchmark[],
  weights: ReadonlyMap<string, number>,
): Map<string, ModelCoverage> {
  const coverage = new Map<string, ModelCoverage>()

  for (const benchmark of perBenchmark) {
    const seenModels = new Set<string>()
    const configuredWeight = weights.get(benchmark.benchmark_id)

    const weight =
      configuredWeight !== undefined && Number.isFinite(configuredWeight) && configuredWeight > 0
        ? configuredWeight
        : null

    for (const row of benchmark.rows) {
      if (seenModels.has(row.model_id)) {
        continue
      }

      seenModels.add(row.model_id)
      let model = coverage.get(row.model_id)

      if (model === undefined) {
        model = { k: 0, weighted_rows: [] }
        coverage.set(row.model_id, model)
      }

      model.k += 1

      if (weight !== null) {
        model.weighted_rows.push({ benchmark_id: benchmark.benchmark_id, row, weight })
      }
    }
  }

  return coverage
}

function modelComposite(model_id: string, coverage: ModelCoverage): CompositeRow {
  let weightSum = 0
  let weightedZSum = 0
  const benchmarkIds = new Set<string>()

  for (const weightedRow of coverage.weighted_rows) {
    weightSum += weightedRow.weight
    weightedZSum += weightedRow.weight * weightedRow.row.z
    benchmarkIds.add(weightedRow.benchmark_id)
  }

  const weighted_z = weightSum > 0 ? weightedZSum / weightSum : 0
  const compositeValue = coverage.k >= 2 && weightSum > 0 ? 50 + 10 * weighted_z : null
  const benchmarks_used = Array.from(benchmarkIds).sort(compareStrings)
  let ci_lo: number | null = null
  let ci_hi: number | null = null

  if (compositeValue !== null && coverage.weighted_rows.length > 0) {
    let ciWeightSum = 0
    let ciLoSum = 0
    let ciHiSum = 0
    let ciCount = 0

    for (const weightedRow of coverage.weighted_rows) {
      const { ci_lo: low, ci_hi: high } = weightedRow.row

      if (low === undefined || high === undefined) {
        continue
      }

      const lowerScore = Math.min(low, high)
      const upperScore = Math.max(low, high)
      const lowerZ = toZ(lowerScore, weightedRow.row.mean, weightedRow.row.sd)
      const upperZ = toZ(upperScore, weightedRow.row.mean, weightedRow.row.sd)
      ciWeightSum += weightedRow.weight
      ciLoSum += weightedRow.weight * lowerZ
      ciHiSum += weightedRow.weight * upperZ
      ciCount += 1
    }

    if (ciCount === coverage.weighted_rows.length && ciWeightSum > 0) {
      const lowerComposite = 50 + 10 * (ciLoSum / ciWeightSum)
      const upperComposite = 50 + 10 * (ciHiSum / ciWeightSum)
      ci_lo = Math.min(lowerComposite, compositeValue, upperComposite)
      ci_hi = Math.max(lowerComposite, compositeValue, upperComposite)
    }
  }

  const badge = coverage.k >= 2 ? "ok" : "single-source"

  return {
    model_id,
    weighted_z,
    composite: compositeValue,
    k: coverage.k,
    benchmarks_used,
    badge,
    ci_lo,
    ci_hi,
  }
}

function compareStrings(left: string, right: string): number {
  if (left < right) {
    return -1
  }

  if (left > right) {
    return 1
  }

  return 0
}

export function composite(
  perBenchmark: readonly NormalizedBenchmark[],
  options: CompositeOptions,
): CompositeRow[] {
  const coverage = collectCoverage(perBenchmark, options.weights)
  const rows: CompositeRow[] = []

  for (const [model_id, modelCoverage] of coverage) {
    rows.push(modelComposite(model_id, modelCoverage))
  }

  rows.sort((left, right) => compareStrings(left.model_id, right.model_id))

  return rows
}
