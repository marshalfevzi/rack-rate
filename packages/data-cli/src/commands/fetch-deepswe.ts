import { z } from "zod"
import { Benchmark, BenchmarksFile, ModelsFile, roundHalfEven } from "@rack-rate/core"
import type {
  Benchmark as BenchmarkDocument,
  Model,
  ModelsFile as ModelsDocument,
} from "@rack-rate/core"
import { fetchJsonAs, type JsonSnapshot } from "../http.ts"
import {
  dataPath,
  info,
  readJsonAs,
  today,
  upsertBenchmarkEntry,
  warn,
  writeJson,
} from "../paths.ts"

const V1_1_URL = "https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json"

const V1_URL = "https://deepswe.datacurve.ai/artifacts/v1/leaderboard-live.json"

const EFFORT_RANK = new Map<string, number>([
  ["none", 0],
  ["minimal", 1],
  ["low", 2],
  ["medium", 3],
  ["high", 4],
  ["xhigh", 5],
  ["max", 6],
])

const MODEL_NAME_MAP = new Map<string, string>([
  ["gpt-5-5", "gpt-5.5"],
  ["claude-opus-4-8", "claude-opus-4.8"],
  ["gpt-5-4", "gpt-5.4"],
  ["claude-opus-4-7", "claude-opus-4.7"],
  ["glm-5-2", "glm-5.2"],
  ["claude-sonnet-4-6", "claude-sonnet-4.6"],
  ["gemini-3-5-flash", "gemini-3.5-flash"],
  ["claude-opus-4-6", "claude-opus-4.6"],
  ["gpt-5-4-mini", "gpt-5.4-mini"],
  ["kimi-k2-6", "kimi-k2.6"],
  ["minimax-m3", "minimax-m3"],
  ["mimo-v2-5-pro", "mimo-v2.5-pro"],
  ["qwen3-7-max", "qwen-3.7-max"],
  ["glm-5-1", "glm-5.1"],
  ["grok-build-0-1", "grok-build-0.1"],
  ["gemini-3-1-pro-preview", "gemini-3.1-pro-preview"],
  ["deepseek-v4-pro", "deepseek-v4-pro"],
  ["gemini-3-flash-preview", "gemini-3-flash-preview"],
  ["qwen3-6-plus", "qwen-3.6-plus"],
  ["claude-haiku-4-5", "claude-haiku-4.5"],
  ["minimax-m2-7", "minimax-m2.7"],
  ["claude-fable-5", "claude-fable-5"],
  ["claude-opus-5", "claude-opus-5"],
  ["claude-sonnet-5", "claude-sonnet-5"],
  ["deepseek-v4-flash", "deepseek-v4-flash"],
  ["gemini-3-6-flash", "gemini-3.6-flash"],
  ["gemini-3-7-flash", "gemini-3.7-flash"],
  ["gemini-3-8-flash", "gemini-3.8-flash"],
  ["glm-5-3", "glm-5.3"],
  ["glm-5-3-flash", "glm-5.3-flash"],
  ["gpt-5-6-luna", "gpt-5.6-luna"],
  ["gpt-5-6-sol", "gpt-5.6-sol"],
  ["gpt-5-6-terra", "gpt-5.6-terra"],
  ["gpt-6-astra", "gpt-6-astra"],
  ["grok-4-5", "grok-4.5"],
  ["grok-4-6", "grok-4.6"],
  ["kimi-k2-7-code", "kimi-k2.7-code"],
  ["kimi-k3", "kimi-k3"],
  ["muse-spark-1-1", "muse-spark-1.1"],
  ["muse-spark-1-2", "muse-spark-1.2"],
  ["qwen3-8-max", "qwen-3.8-max"],
])

type ProviderInfo = { provider: string; provider_slug: string }

const MODEL_PROVIDER_MAP = new Map<string, ProviderInfo>([
  ["gpt-5.5", { provider: "OpenAI", provider_slug: "openai" }],
  ["gpt-5.4", { provider: "OpenAI", provider_slug: "openai" }],
  ["gpt-5.4-mini", { provider: "OpenAI", provider_slug: "openai" }],
  ["claude-opus-4.8", { provider: "Anthropic", provider_slug: "anthropic" }],
  ["claude-opus-4.7", { provider: "Anthropic", provider_slug: "anthropic" }],
  ["claude-opus-4.6", { provider: "Anthropic", provider_slug: "anthropic" }],
  ["claude-sonnet-4.6", { provider: "Anthropic", provider_slug: "anthropic" }],
  ["claude-haiku-4.5", { provider: "Anthropic", provider_slug: "anthropic" }],
  ["glm-5.2", { provider: "Zhipu (Z.ai)", provider_slug: "zhipu" }],
  ["glm-5.1", { provider: "Zhipu (Z.ai)", provider_slug: "zhipu" }],
  ["gemini-3.5-flash", { provider: "Google", provider_slug: "google" }],
  ["gemini-3.1-pro-preview", { provider: "Google", provider_slug: "google" }],
  ["gemini-3-flash-preview", { provider: "Google", provider_slug: "google" }],
  ["kimi-k2.6", { provider: "Moonshot AI", provider_slug: "moonshot" }],
  ["minimax-m3", { provider: "MiniMax", provider_slug: "minimax" }],
  ["minimax-m2.7", { provider: "MiniMax", provider_slug: "minimax" }],
  ["mimo-v2.5-pro", { provider: "Xiaomi", provider_slug: "xiaomi" }],
  ["qwen-3.7-max", { provider: "Alibaba", provider_slug: "alibaba" }],
  ["qwen-3.6-plus", { provider: "Alibaba", provider_slug: "alibaba" }],
  ["grok-build-0.1", { provider: "xAI", provider_slug: "xai" }],
  ["deepseek-v4-pro", { provider: "DeepSeek", provider_slug: "deepseek" }],
  ["claude-fable-5", { provider: "Anthropic", provider_slug: "anthropic" }],
  ["claude-opus-5", { provider: "Anthropic", provider_slug: "anthropic" }],
  ["claude-sonnet-5", { provider: "Anthropic", provider_slug: "anthropic" }],
  ["deepseek-v4-flash", { provider: "DeepSeek", provider_slug: "deepseek" }],
  ["gemini-3.6-flash", { provider: "Google", provider_slug: "google" }],
  ["gemini-3.7-flash", { provider: "Google", provider_slug: "google" }],
  ["gemini-3.8-flash", { provider: "Google", provider_slug: "google" }],
  ["glm-5.3", { provider: "Zhipu (Z.ai)", provider_slug: "zhipu" }],
  ["glm-5.3-flash", { provider: "Zhipu (Z.ai)", provider_slug: "zhipu" }],
  ["gpt-5.6-luna", { provider: "OpenAI", provider_slug: "openai" }],
  ["gpt-5.6-sol", { provider: "OpenAI", provider_slug: "openai" }],
  ["gpt-5.6-terra", { provider: "OpenAI", provider_slug: "openai" }],
  ["gpt-6-astra", { provider: "OpenAI", provider_slug: "openai" }],
  ["grok-4.5", { provider: "xAI", provider_slug: "xai" }],
  ["grok-4.6", { provider: "xAI", provider_slug: "xai" }],
  ["kimi-k2.7-code", { provider: "Moonshot AI", provider_slug: "moonshot" }],
  ["kimi-k3", { provider: "Moonshot AI", provider_slug: "moonshot" }],
  ["qwen-3.8-max", { provider: "Alibaba", provider_slug: "alibaba" }],
])

const RawRowSchema = z
  .object({
    model: z.string().min(1),
    harness: z.string().min(1),
    reasoning_effort: z.enum(["low", "medium", "high", "xhigh", "max"]).nullable(),
    config: z.string().min(1),
    pass_rate: z.number().min(0).max(1),
    pass_at_4: z.number().min(0).max(1),
    n_tasks_attempted: z.number().int().positive(),
    ci_lo: z.number().min(0).max(1),
    ci_hi: z.number().min(0).max(1),
    ci_method: z.string().min(1),
    median_cost_usd: z.number().nonnegative(),
    median_output_tokens: z.number().nonnegative(),
    median_input_tokens: z.number().nonnegative(),
    median_agent_steps: z.number().positive(),
    cost_basis: z.string().min(1).optional(),
  })
  .passthrough()

const RawArtifactSchema = z
  .object({
    generated_at: z.iso.datetime({ offset: true }),
    n_tasks_in_set: z.number().int().positive(),
    rows: z.array(RawRowSchema).min(1),
  })
  .passthrough()

type RawRow = z.infer<typeof RawRowSchema>

type RawArtifact = z.infer<typeof RawArtifactSchema>

type EffortVariant = NonNullable<Model["effort_variants"]>[number]

type ReducedModel = { model: Model; config: RawRow }

type Reduction = { models: ReducedModel[]; task_count: number; generated_at: string }

type Endpoint = { url: string; version: string }

const ENDPOINTS: readonly Endpoint[] = [
  { url: V1_1_URL, version: "1.1" },
  { url: V1_URL, version: "1" },
]

function effortRank(effort: string | null): number {
  if (effort === null) {
    return 0
  }

  return EFFORT_RANK.get(effort) ?? 0
}

function isBetter(candidate: RawRow, current: RawRow): boolean {
  if (candidate.pass_rate !== current.pass_rate) {
    return candidate.pass_rate > current.pass_rate
  }

  const candidateRank = effortRank(candidate.reasoning_effort)
  const currentRank = effortRank(current.reasoning_effort)

  if (candidateRank !== currentRank) {
    return candidateRank > currentRank
  }

  return candidate.median_cost_usd < current.median_cost_usd
}

function roundVariant(row: RawRow): EffortVariant | null {
  if (row.reasoning_effort === null) {
    return null
  }

  return {
    reasoning_effort: row.reasoning_effort,
    score_pct: roundHalfEven(row.pass_rate * 100, 2),
    api_cost_per_task_usd: roundHalfEven(row.median_cost_usd, 4),
    output_tokens_per_task: roundHalfEven(row.median_output_tokens, 0),
    input_tokens_per_task: roundHalfEven(row.median_input_tokens, 0),
    agent_steps_per_task: roundHalfEven(row.median_agent_steps, 1),
  }
}

function costBasis(row: RawRow): Model["cost_basis"] {
  if (row.cost_basis === undefined) {
    return "list"
  }

  if (/expected\s+launch/i.test(row.cost_basis)) {
    return "expected-launch"
  }

  if (/disputed/i.test(row.cost_basis)) {
    return "disputed"
  }

  if (/list/i.test(row.cost_basis)) {
    return "list"
  }

  return "unknown"
}

function reduceModel(
  rawId: string,
  rows: readonly RawRow[],
  retrievedAt: string,
  version: string,
): ReducedModel {
  let best = rows[0]

  if (best === undefined) {
    throw new Error(`DeepSWE model '${rawId}' has no configurations`)
  }

  for (const candidate of rows.slice(1)) {
    if (isBetter(candidate, best)) {
      best = candidate
    }
  }

  const mappedId = MODEL_NAME_MAP.get(rawId)
  const id = mappedId ?? rawId
  const providerInfo = MODEL_PROVIDER_MAP.get(id)

  if (mappedId === undefined) {
    warn(`no MODEL_NAME_MAP entry for '${rawId}', using it as-is`)
  }

  if (providerInfo === undefined) {
    warn(`no MODEL_PROVIDER_MAP entry for '${id}', using provider: null`)
  }

  const variants: EffortVariant[] = []

  for (const row of rows) {
    const variant = roundVariant(row)

    if (variant !== null) {
      variants.push(variant)
    }
  }

  variants.sort((left, right) => right.score_pct - left.score_pct)

  const model: Model = {
    id,
    name: id,
    provider: providerInfo?.provider ?? null,
    provider_slug: providerInfo?.provider_slug ?? null,
    score_pct: roundHalfEven(best.pass_rate * 100, 2),
    score_pass_at_4_pct: roundHalfEven(best.pass_at_4 * 100, 2),
    reasoning_effort: best.reasoning_effort,
    api_cost_per_task_usd: roundHalfEven(best.median_cost_usd, 4),
    output_tokens_per_task: roundHalfEven(best.median_output_tokens, 0),
    input_tokens_per_task: roundHalfEven(best.median_input_tokens, 0),
    agent_steps_per_task: roundHalfEven(best.median_agent_steps, 1),
    n_tasks_attempted: best.n_tasks_attempted,
    evidence: ["src-deepswe-data"],
    benchmark_version: `deepswe@${version}`,
    ci_lo: best.ci_lo,
    ci_hi: best.ci_hi,
    ci_method: best.ci_method,
    cost_basis: costBasis(best),
    retrieved_at: retrievedAt,
  }

  if (variants.length > 1) {
    model.effort_variants = variants
  }

  return { model, config: best }
}

function reduceArtifact(raw: RawArtifact, retrievedAt: string, version: string): Reduction {
  const byModel = new Map<string, RawRow[]>()

  for (const row of raw.rows) {
    const rows = byModel.get(row.model)

    if (rows === undefined) {
      byModel.set(row.model, [row])
    } else {
      rows.push(row)
    }
  }

  const reduced: ReducedModel[] = []

  for (const [rawId, rows] of byModel) {
    reduced.push(reduceModel(rawId, rows, retrievedAt, version))
  }

  reduced.sort((left, right) => right.model.score_pct - left.model.score_pct)

  return {
    models: reduced,
    task_count: raw.n_tasks_in_set,
    generated_at: raw.generated_at,
  }
}

async function fetchArtifact(diff: boolean): Promise<{
  endpoint: Endpoint
  snapshot: JsonSnapshot<RawArtifact>
}> {
  let firstError: Error | null = null

  for (const [index, endpoint] of ENDPOINTS.entries()) {
    try {
      const snapshot = await fetchJsonAs(
        { source: "deepswe", url: endpoint.url, persistSnapshot: !diff },
        RawArtifactSchema,
      )

      if (index === 1) {
        warn(`using DeepSWE v1 fallback; v1 is frozen and stale (source: ${endpoint.url})`)
      }

      return { endpoint, snapshot }
    } catch (error) {
      firstError = error instanceof Error ? error : new Error(String(error))

      if (index === 0) {
        warn(`DeepSWE v1.1 fetch failed; trying frozen/stale v1: ${firstError.message}`)
      }
    }
  }

  throw firstError ?? new Error("DeepSWE fetch failed")
}

function fieldChanges(previous: Model, next: Model): string[] {
  const changes: string[] = []

  const fields: Array<keyof Model> = [
    "score_pct",
    "score_pass_at_4_pct",
    "reasoning_effort",
    "api_cost_per_task_usd",
    "output_tokens_per_task",
    "input_tokens_per_task",
    "agent_steps_per_task",
    "n_tasks_attempted",
    "effort_variants",
    "ci_lo",
    "ci_hi",
    "ci_method",
    "cost_basis",
  ]

  for (const field of fields) {
    if (JSON.stringify(previous[field]) !== JSON.stringify(next[field])) {
      changes.push(`${field}: ${JSON.stringify(previous[field])} -> ${JSON.stringify(next[field])}`)
    }
  }

  return changes
}

function printDiff(previous: ModelsDocument, reduction: Reduction, sourceUrl: string): number {
  const oldById = new Map<string, Model>()

  for (const model of previous.models) {
    oldById.set(model.id, model)
  }

  const newIds = new Set<string>()
  const changes: string[] = []
  const costOnly: string[] = []

  for (const reduced of reduction.models) {
    const next = reduced.model
    newIds.add(next.id)
    const old = oldById.get(next.id)

    if (old === undefined) {
      changes.push(`added model: ${next.id}`)
      continue
    }

    const changedFields = fieldChanges(old, next)
    const costChanged = old.api_cost_per_task_usd !== next.api_cost_per_task_usd
    const scoreChanged = old.score_pct !== next.score_pct

    if (costChanged && !scoreChanged) {
      costOnly.push(
        `${next.id}.median_cost_usd: ${old.api_cost_per_task_usd} -> ${next.api_cost_per_task_usd}`,
      )
    }

    const nonCostChanges = changedFields.filter(
      (change) => !change.startsWith("api_cost_per_task_usd:"),
    )

    if (scoreChanged || nonCostChanges.length > 0) {
      changes.push(`changed model: ${next.id} (${changedFields.join(", ")})`)
    }
  }

  for (const old of previous.models) {
    if (!newIds.has(old.id)) {
      changes.push(`removed model: ${old.id}`)
    }
  }

  if (changes.length === 0 && costOnly.length === 0) {
    console.log(`deepswe: no changes from ${sourceUrl}`)

    return 0
  }

  console.log(`deepswe: changes from ${sourceUrl}`)

  if (changes.length > 0) {
    console.log("Models:")

    for (const change of changes) {
      console.log(`  - ${change}`)
    }
  }

  if (costOnly.length > 0) {
    console.log("Cost-only moves:")

    for (const change of costOnly) {
      console.log(`  - ${change}`)
    }
  }

  return 1
}

function formatZodError(error: z.ZodError): string {
  const issues = error.issues.map(
    (issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`,
  )

  return issues.join("\n")
}

function errorMessage(error: Error): string {
  if (error instanceof z.ZodError) {
    return formatZodError(error)
  }

  return error.message
}

function benchmarkEntry(
  previous: BenchmarkDocument | undefined,
  reduction: Reduction,
  endpoint: Endpoint,
  retrievedAt: string,
): BenchmarkDocument {
  const rows: BenchmarkDocument["rows"] = []

  for (const reduced of reduction.models) {
    const model = reduced.model

    const row: BenchmarkDocument["rows"][number] = {
      model_id: model.id,
      score: model.score_pct,
      ci_lo: model.ci_lo === undefined ? undefined : model.ci_lo * 100,
      ci_hi: model.ci_hi === undefined ? undefined : model.ci_hi * 100,
      cost_per_task_usd: model.api_cost_per_task_usd,
      cost_basis: model.cost_basis,
      tokens_input: model.input_tokens_per_task,
      tokens_output: model.output_tokens_per_task,
      steps: model.agent_steps_per_task,
      provenance: {
        config: reduced.config.config,
        harness: reduced.config.harness,
        reasoning_effort: reduced.config.reasoning_effort ?? "default",
        generated_at: reduction.generated_at,
      },
    }

    rows.push(row)
  }

  return {
    id: "deepswe",
    version: endpoint.version,
    title: previous?.title ?? "DeepSWE v1.1",
    url: previous?.url ?? "https://deepswe.datacurve.ai/",
    generated_at: reduction.generated_at,
    task_count: reduction.task_count,
    unit: "pass@1",
    scale: "0-100",
    retrieved_at: retrievedAt,
    rows,
  }
}

function usage(): void {
  console.log("Usage: bun run packages/data-cli/src/commands/fetch-deepswe.ts [--diff]")
  console.log("Fetches and normalizes the DeepSWE v1.1 leaderboard; --diff writes no data files")
}

export async function run(args: string[]): Promise<number> {
  if (args.includes("--help")) {
    usage()

    return 0
  }

  for (const arg of args) {
    if (arg !== "--diff") {
      console.error(`rack-rate-data: unknown argument '${arg}'`)

      return 1
    }
  }

  const diff = args.includes("--diff")

  try {
    const retrievedAt = today()
    const { endpoint, snapshot } = await fetchArtifact(diff)

    if (snapshot.fromSnapshot) {
      warn("live fetch failed; same-day snapshot fallback is not verified")

      return 1
    }

    const reduction = reduceArtifact(snapshot.value, retrievedAt, endpoint.version)
    const previousModels = await readJsonAs(dataPath("models.json"), ModelsFile)

    if (diff) {
      return printDiff(previousModels, reduction, endpoint.url)
    }

    const modelsDocument: ModelsDocument = {
      source: previousModels.source,
      source_url: endpoint.url,
      repo_url: previousModels.repo_url,
      license: previousModels.license,
      task_count: reduction.task_count,
      generated_at: reduction.generated_at,
      harness: previousModels.harness,
      note: previousModels.note,
      models: reduction.models.map((reduced) => reduced.model),
    }

    const parsedModels = ModelsFile.safeParse(modelsDocument)

    if (!parsedModels.success) {
      throw new Error(
        `models.json does not match its schema:\n${formatZodError(parsedModels.error)}`,
      )
    }

    const benchmarks = await readJsonAs(dataPath("benchmarks.json"), BenchmarksFile)
    const previousBenchmark = benchmarks.benchmarks.find((benchmark) => benchmark.id === "deepswe")

    const parsedBenchmark = Benchmark.safeParse(
      benchmarkEntry(previousBenchmark, reduction, endpoint, retrievedAt),
    )

    if (!parsedBenchmark.success) {
      throw new Error(
        `deepswe benchmark does not match its schema:\n${formatZodError(parsedBenchmark.error)}`,
      )
    }

    await writeJson(dataPath("models.json"), parsedModels.data)
    await upsertBenchmarkEntry(parsedBenchmark.data)
    info(`wrote ${parsedModels.data.models.length} DeepSWE models from ${endpoint.url}`)

    return 0
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error))
    console.error(`rack-rate-data: ${errorMessage(failure)}`)

    return 1
  }
}

if (import.meta.main) {
  process.exit(await run(Bun.argv.slice(2)))
}
