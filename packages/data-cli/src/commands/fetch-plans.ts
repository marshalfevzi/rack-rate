import {
  PlansFile,
  SourcesFile,
  type Plan,
  type PlansFile as PlansDocument,
  type Source,
  type SourcesFile as SourcesDocument,
} from "@rack-rate/core"

import { fetchText, type Snapshot } from "../http.ts"
import { dataPath, info, parseJsonAs, readTextIfExists, today, warn, writeJson } from "../paths.ts"

/**
 * Refresh coding-plan facts only after a live 2xx response verifies every
 * anchor. A same-day snapshot fallback (`fromSnapshot: true`) is unreachable
 * for refresh purposes: its bytes are not checked and no committed JSON is
 * written. This deliberately keeps last-good data instead of presenting a
 * stale cache as a verified refresh.
 */

interface PlanAnchor {
  readonly target: string
  readonly text: string
}

interface FetchTarget {
  readonly key: string
  readonly source: string
  readonly url: string
  readonly sourceId?: string
  readonly planIds: readonly string[]
}

interface TargetResult {
  readonly target: FetchTarget
  readonly snapshot: Snapshot | null
  readonly error: string | null
  readonly unreachable: boolean
}

interface PlanFailure {
  readonly missing: string[]
  readonly unreachable: string[]
}

const AWESOME_PLANS = [
  "claude-pro",
  "chatgpt-plus",
  "cursor-pro",
  "ollama-pro",
  "opencode-go",
  "github-copilot-pro",
  "kimi-code-andante",
  "kimi-code-allegretto",
  "glm-coding-lite",
  "glm-coding-pro",
] as const

const VENDOR_SOURCE_IDS = [
  "src-awesome-coding-plan",
  "src-anthropic-max-pricing-search",
  "src-openai-pro-pricing-search",
  "src-cursor-pricing-search",
  "src-glm-zai-pricing-search",
  "src-google-ai-pricing-search",
] as const

interface PlanAnchorTable {
  "claude-pro": readonly PlanAnchor[]
  "claude-max-5x": readonly PlanAnchor[]
  "claude-max-20x": readonly PlanAnchor[]
  "chatgpt-plus": readonly PlanAnchor[]
  "chatgpt-pro-20x": readonly PlanAnchor[]
  "cursor-pro": readonly PlanAnchor[]
  "cursor-pro-plus": readonly PlanAnchor[]
  "cursor-ultra": readonly PlanAnchor[]
  "opencode-go": readonly PlanAnchor[]
  "ollama-pro": readonly PlanAnchor[]
  "github-copilot-pro": readonly PlanAnchor[]
  "kimi-code-andante": readonly PlanAnchor[]
  "kimi-code-allegretto": readonly PlanAnchor[]
  "glm-coding-lite": readonly PlanAnchor[]
  "glm-coding-pro": readonly PlanAnchor[]
  "google-ai-pro": readonly PlanAnchor[]
}

interface SourcePlanFallbackTable {
  "src-anthropic-max-pricing-search": readonly string[]
  "src-openai-pro-pricing-search": readonly string[]
  "src-cursor-pricing-search": readonly string[]
  "src-glm-zai-pricing-search": readonly string[]
  "src-google-ai-pricing-search": readonly string[]
}

/** Short, quoted wording from the research table, keyed to the plan it protects. */
const PLAN_ANCHORS: PlanAnchorTable = {
  "claude-pro": [
    {
      target: "claude-pro-support",
      text: "five times the usage per session",
    },
    {
      target: "claude-pro-support",
      text: "reset every five hours",
    },
    {
      target: "awesome-readme",
      text: "14360/15.88亿",
    },
  ],
  "claude-max-5x": [
    {
      target: "claude-max-support",
      text: "Max 5x provides five times more usage per session than the Pro plan",
    },
    {
      target: "claude-max-support",
      text: "Max 5x: $100 per month",
    },
  ],
  "claude-max-20x": [
    {
      target: "claude-max-support",
      text: "Max 20x provides 20 times more usage per session than the Pro plan",
    },
    {
      target: "claude-max-support",
      text: "Max 20x: $200 per month",
    },
  ],
  "chatgpt-plus": [
    {
      target: "openai-pricing",
      text: "Expanded Codex usage",
    },
    {
      target: "openai-codex-help",
      text: "Terra for Free and Go; Sol, Terra, and Luna for Plus, Pro, Business, and Enterprise",
    },
    {
      target: "awesome-readme",
      text: "8760/6.16亿",
    },
  ],
  "chatgpt-pro-20x": [
    {
      target: "openai-codex-help",
      text: "Pro $200: 200 messages per week",
    },
    {
      target: "openai-codex-help",
      text: "Separate 170 messages per day for GPT-5.6 Sol Pro",
    },
  ],
  "cursor-pro": [
    {
      target: "cursor-docs",
      text: "There are two separate usage pools",
    },
    {
      target: "awesome-readme",
      text: "$20 of API usage each month",
    },
  ],
  "cursor-pro-plus": [
    {
      target: "cursor-pricing-markdown",
      text: "$60/mo",
    },
  ],
  "cursor-ultra": [
    {
      target: "cursor-pricing-markdown",
      text: "$200/mo",
    },
  ],
  "opencode-go": [
    {
      target: "opencode-go",
      text: "$10/month",
    },
    {
      target: "awesome-readme",
      text: "$60",
    },
  ],
  "ollama-pro": [
    {
      target: "ollama-pricing",
      text: "$60 of usage credits per month",
    },
    {
      target: "awesome-readme",
      text: "includes $60 of monthly usage",
    },
  ],
  "github-copilot-pro": [
    {
      target: "github-copilot",
      text: "$15 monthly total credits for Pro",
    },
    {
      target: "github-copilot",
      text: "Unlimited code completion and next edit suggestions",
    },
  ],
  "kimi-code-andante": [
    {
      target: "kimi-membership",
      text: "Kimi Code",
    },
    {
      target: "kimi-help-pricing",
      text: "Unused credits expire",
    },
    {
      target: "awesome-readme",
      text: "2556/8400万",
    },
  ],
  "kimi-code-allegretto": [
    {
      target: "kimi-membership",
      text: "Kimi Code",
    },
    {
      target: "kimi-help-overview",
      text: "Kimi Code also has a separate 5-hour-per-week usage limit",
    },
    {
      target: "awesome-readme",
      text: "20 倍额度",
    },
    {
      target: "awesome-readme",
      text: "36292/14.28亿",
    },
  ],
  "glm-coding-lite": [
    {
      target: "glm-domestic",
      text: "3x Claude Pro 用量额度",
    },
    {
      target: "awesome-readme",
      text: "2400/1.28亿",
    },
  ],
  "glm-coding-pro": [
    {
      target: "glm-domestic",
      text: "5x Lite 用量额度",
    },
    {
      target: "awesome-readme",
      text: "12000/6.4亿",
    },
  ],
  "google-ai-pro": [
    {
      target: "google-antigravity",
      text: "Flexible AI credit pool",
    },
    {
      target: "google-support",
      text: "The amount of AI credits used for each feature and model varies",
    },
  ],
}

const STATIC_TARGETS: readonly FetchTarget[] = [
  {
    key: "awesome-github",
    source: "plans-awesome-github",
    url: "https://github.com/mahonzhan/awesome-coding-plan",
    sourceId: "src-awesome-coding-plan",
    planIds: AWESOME_PLANS,
  },
  {
    key: "awesome-readme",
    source: "plans-awesome-readme",
    url: "https://raw.githubusercontent.com/mahonzhan/awesome-coding-plan/main/README.md",
    planIds: AWESOME_PLANS,
  },
  {
    key: "claude-pro-support",
    source: "plans-claude-pro-support",
    url: "https://support.claude.com/en/articles/8325606-what-is-the-pro-plan",
    planIds: ["claude-pro"],
  },
  {
    key: "claude-upgrade",
    source: "plans-claude-upgrade",
    url: "https://claude.ai/upgrade",
    planIds: ["claude-pro"],
  },
  {
    key: "claude-max-support",
    source: "plans-claude-max-support",
    url: "https://support.claude.com/en/articles/11049741-what-is-the-max-plan",
    sourceId: "src-anthropic-max-pricing-search",
    planIds: ["claude-max-5x", "claude-max-20x"],
  },
  {
    key: "claude-usage-support",
    source: "plans-claude-usage-support",
    url: "https://support.claude.com/en/articles/9797557-usage-limit-best-practices",
    planIds: ["claude-pro"],
  },
  {
    key: "openai-pricing",
    source: "plans-openai-pricing",
    url: "https://openai.com/chatgpt/pricing/",
    sourceId: "src-openai-pro-pricing-search",
    planIds: ["chatgpt-plus", "chatgpt-pro-20x"],
  },
  {
    key: "openai-codex-help",
    source: "plans-openai-codex-help",
    url: "https://help.openai.com/en/articles/11909943-codex-use-in-chatgpt",
    sourceId: "src-openai-pro-pricing-search",
    planIds: ["chatgpt-plus", "chatgpt-pro-20x"],
  },
  {
    key: "openai-rate-card",
    source: "plans-openai-rate-card",
    url: "https://help.openai.com/en/articles/20001106-codex-rate-card",
    planIds: ["chatgpt-plus", "chatgpt-pro-20x"],
  },
  {
    key: "cursor-docs",
    source: "plans-cursor-docs",
    url: "https://cursor.com/docs/models-and-pricing",
    sourceId: "src-cursor-pricing-search",
    planIds: ["cursor-pro"],
  },
  {
    key: "cursor-pricing",
    source: "plans-cursor-pricing",
    url: "https://cursor.com/pricing",
    sourceId: "src-cursor-pricing-search",
    planIds: ["cursor-pro"],
  },
  {
    key: "cursor-pricing-markdown",
    source: "plans-cursor-pricing-markdown",
    url: "https://cursor.com/help/account-and-billing/pricing.md",
    sourceId: "src-cursor-pricing-search",
    planIds: ["cursor-pro-plus", "cursor-ultra"],
  },
  {
    key: "opencode-go",
    source: "plans-opencode-go",
    url: "https://opencode.ai/go",
    planIds: ["opencode-go"],
  },
  {
    key: "ollama-pricing",
    source: "plans-ollama-pricing",
    url: "https://ollama.com/pricing",
    planIds: ["ollama-pro"],
  },
  {
    key: "github-copilot",
    source: "plans-github-copilot",
    url: "https://github.com/features/copilot/plans",
    planIds: ["github-copilot-pro"],
  },
  {
    key: "kimi-membership",
    source: "plans-kimi-membership",
    url: "https://www.kimi.com/membership/pricing",
    planIds: ["kimi-code-andante", "kimi-code-allegretto"],
  },
  {
    key: "kimi-help-pricing",
    source: "plans-kimi-help-pricing",
    url: "https://www.kimi.com/en/help/membership/membership-pricing",
    planIds: ["kimi-code-andante", "kimi-code-allegretto"],
  },
  {
    key: "kimi-help-overview",
    source: "plans-kimi-help-overview",
    url: "https://www.kimi.com/en/help/membership/membership-overview",
    planIds: ["kimi-code-andante", "kimi-code-allegretto"],
  },
  {
    key: "glm-domestic",
    source: "plans-glm-domestic",
    url: "https://bigmodel.cn/glm-coding",
    planIds: ["glm-coding-lite", "glm-coding-pro"],
  },
  {
    key: "google-antigravity",
    source: "plans-google-antigravity",
    url: "https://antigravity.google/pricing",
    sourceId: "src-google-ai-pricing-search",
    planIds: ["google-ai-pro"],
  },
  {
    key: "google-subscriptions",
    source: "plans-google-subscriptions",
    url: "https://gemini.google/subscriptions/?hl=en",
    sourceId: "src-google-ai-pricing-search",
    planIds: ["google-ai-pro"],
  },
  {
    key: "google-support",
    source: "plans-google-support",
    url: "https://support.google.com/googleone/answer/16287445",
    sourceId: "src-google-ai-pricing-search",
    planIds: ["google-ai-pro"],
  },
]

export const PLAN_TARGET_URLS: readonly string[] = STATIC_TARGETS.map((target) => target.url)

const SOURCE_PLAN_FALLBACKS: SourcePlanFallbackTable = {
  "src-anthropic-max-pricing-search": ["claude-max-5x", "claude-max-20x"],
  "src-openai-pro-pricing-search": ["chatgpt-plus", "chatgpt-pro-20x"],
  "src-cursor-pricing-search": ["cursor-pro", "cursor-pro-plus", "cursor-ultra"],
  "src-glm-zai-pricing-search": ["glm-coding-lite", "glm-coding-pro"],
  "src-google-ai-pricing-search": ["google-ai-pro"],
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

function anchorsForPlan(planId: string): readonly PlanAnchor[] | undefined {
  for (const [knownPlanId, anchors] of Object.entries(PLAN_ANCHORS)) {
    if (knownPlanId === planId) {
      return anchors
    }
  }

  return undefined
}

function fallbackPlansForSource(sourceId: string): readonly string[] | undefined {
  for (const [knownSourceId, planIds] of Object.entries(SOURCE_PLAN_FALLBACKS)) {
    if (knownSourceId === sourceId) {
      return planIds
    }
  }

  return undefined
}

function sourcePlanIds(plans: readonly Plan[], sourceId: string): string[] {
  const planIds: string[] = []

  for (const plan of plans) {
    if (plan.evidence.includes(sourceId) || plan.sources.includes(sourceId)) {
      planIds.push(plan.id)
    }
  }

  const fallback = fallbackPlansForSource(sourceId)

  if (fallback !== undefined) {
    for (const planId of fallback) {
      if (!planIds.includes(planId)) {
        planIds.push(planId)
      }
    }
  }

  return planIds
}

function sourceTarget(source: Source, plans: readonly Plan[]): FetchTarget {
  return {
    key: `source:${source.id}`,
    source: `plans-source-${source.id}`,
    url: source.url,
    sourceId: source.id,
    planIds: sourcePlanIds(plans, source.id),
  }
}

function buildTargets(sources: readonly Source[], plans: readonly Plan[]): FetchTarget[] {
  const targets: FetchTarget[] = []

  for (const target of STATIC_TARGETS) {
    targets.push(target)
  }

  for (const source of sources) {
    if (VENDOR_SOURCE_IDS.some((id) => id === source.id)) {
      targets.push(sourceTarget(source, plans))
    }
  }

  return targets
}

async function fetchTarget(target: FetchTarget): Promise<TargetResult> {
  try {
    const snapshot = await fetchText({
      source: target.source,
      url: target.url,
      accept: "text/html, text/plain;q=0.9, */*;q=0.8",
    })

    if (snapshot.fromSnapshot) {
      return {
        target,
        snapshot: null,
        error: "live fetch failed; same-day snapshot fallback is not verified",
        unreachable: true,
      }
    }

    return {
      target,
      snapshot,
      error: null,
      unreachable: false,
    }
  } catch (error) {
    return {
      target,
      snapshot: null,
      error: error instanceof Error ? error.message : String(error),
      unreachable: true,
    }
  }
}

function failureForPlan(failures: Map<string, PlanFailure>, planId: string): PlanFailure {
  const existing = failures.get(planId)

  if (existing !== undefined) {
    return existing
  }

  const created: PlanFailure = { missing: [], unreachable: [] }
  failures.set(planId, created)

  return created
}

function recordTargetFailure(
  failures: Map<string, PlanFailure>,
  target: FetchTarget,
  planId: string,
  anchor: string,
  kind: "missing" | "unreachable",
): void {
  const failure = failureForPlan(failures, planId)
  const detail = `${anchor} (${target.url})`

  if (kind === "missing") {
    failure.missing.push(detail)
  } else {
    failure.unreachable.push(detail)
  }
}

function checkAnchors(
  plans: readonly Plan[],
  targets: readonly FetchTarget[],
  results: readonly TargetResult[],
): Map<string, PlanFailure> {
  const resultsByKey = new Map<string, TargetResult>()

  for (const result of results) {
    resultsByKey.set(result.target.key, result)
  }

  const failures = new Map<string, PlanFailure>()

  for (const plan of plans) {
    const anchors = anchorsForPlan(plan.id)

    if (anchors === undefined || anchors.length === 0) {
      const failure = failureForPlan(failures, plan.id)
      failure.missing.push("(no anchors declared)")
      continue
    }

    for (const anchor of anchors) {
      const result = resultsByKey.get(anchor.target)

      if (result === undefined || result.unreachable || result.snapshot === null) {
        const target = result?.target ??
          targets.find((candidate) => candidate.key === anchor.target) ?? {
            key: anchor.target,
            source: "plans-missing-target",
            url: "(target not declared)",
            planIds: [plan.id],
          }

        recordTargetFailure(failures, target, plan.id, anchor.text, "unreachable")
        continue
      }

      const page = collapseWhitespace(result.snapshot.text)
      const expected = collapseWhitespace(anchor.text)

      if (!page.includes(expected)) {
        recordTargetFailure(failures, result.target, plan.id, anchor.text, "missing")
      }
    }
  }

  for (const result of results) {
    if (!result.unreachable) {
      continue
    }

    for (const planId of result.target.planIds) {
      const failure = failureForPlan(failures, planId)
      const detail = `URL ${result.target.url}: ${result.error ?? "unreachable"}`

      if (!failure.unreachable.includes(detail)) {
        failure.unreachable.push(detail)
      }
    }
  }

  for (const result of results) {
    if (result.unreachable && result.target.planIds.length === 0) {
      warn(`unreachable vendor source URL ${result.target.url}: ${result.error ?? "unknown error"}`)
    }
  }

  return failures
}

function printPlanTable(
  plans: readonly Plan[],
  failures: ReadonlyMap<string, PlanFailure>,
  results: readonly TargetResult[],
): void {
  info("plan refresh verification:")
  console.log("plan | status | failed anchor or URL")
  console.log("--- | --- | ---")

  for (const plan of plans) {
    const failure = failures.get(plan.id)
    let status = "verified"
    let detail = "—"

    if (failure !== undefined && failure.unreachable.length > 0) {
      status = "unreachable"
      detail = failure.unreachable.concat(failure.missing).join("; ")
    } else if (failure !== undefined && failure.missing.length > 0) {
      status = "anchor missing"
      detail = failure.missing.join("; ")
    }

    console.log(`${plan.id} | ${status} | ${detail}`)
  }

  for (const result of results) {
    if (result.unreachable && result.target.planIds.length === 0) {
      console.log(
        `source:${result.target.sourceId ?? result.target.key} | ` +
          `unreachable | ${result.target.url}`,
      )
    }
  }
}

function planDiffs(before: readonly Plan[], after: readonly Plan[]): string[] {
  const changes: string[] = []

  for (let index = 0; index < before.length; index += 1) {
    const oldPlan = before[index]
    const newPlan = after[index]

    if (oldPlan === undefined || newPlan === undefined) {
      continue
    }

    if (oldPlan.retrieved_at !== newPlan.retrieved_at) {
      changes.push(`${oldPlan.id}: retrieved_at ${oldPlan.retrieved_at} -> ${newPlan.retrieved_at}`)
    }
  }

  return changes
}

function sourceDiffs(before: readonly Source[], after: readonly Source[]): string[] {
  const changes: string[] = []

  for (let index = 0; index < before.length; index += 1) {
    const oldSource = before[index]
    const newSource = after[index]

    if (oldSource === undefined || newSource === undefined) {
      continue
    }

    if (oldSource.retrieved !== newSource.retrieved) {
      changes.push(`${oldSource.id}: retrieved ${oldSource.retrieved} -> ${newSource.retrieved}`)
    }
  }

  return changes
}

function validateArguments(args: readonly string[]): string | null {
  for (const arg of args) {
    if (arg === "--help" || arg === "--diff") {
      continue
    }

    return `unknown argument '${arg}'`
  }

  return null
}

function printHelp(): void {
  console.log("Usage: fetch-plans.ts [--help] [--diff]")
  console.log(
    "Fetch vendor plan pages, verify research anchors, and refresh plans.json fail-closed.",
  )
  console.log("--diff verifies and reports the refresh without writing plans.json or sources.json.")
}

export async function run(args: string[]): Promise<number> {
  const argumentError = validateArguments(args)

  if (args.includes("--help")) {
    printHelp()

    return argumentError === null ? 0 : 1
  }

  if (argumentError !== null) {
    warn(argumentError)

    return 1
  }

  const diff = args.includes("--diff")

  const plansPath = dataPath("plans.json")
  const sourcesPath = dataPath("sources.json")
  let plansDocument: PlansDocument
  let sourcesDocument: SourcesDocument

  try {
    const plansText = await readTextIfExists(plansPath)
    const sourcesText = await readTextIfExists(sourcesPath)

    if (plansText === null || sourcesText === null) {
      warn("plans.json and sources.json must exist before a plans refresh")

      return 1
    }

    plansDocument = parseJsonAs(plansText, PlansFile, plansPath)
    sourcesDocument = parseJsonAs(sourcesText, SourcesFile, sourcesPath)
  } catch (error) {
    warn(error instanceof Error ? error.message : String(error))

    return 1
  }

  const targets = buildTargets(sourcesDocument.sources, plansDocument.plans)
  const results = await Promise.all(targets.map((target) => fetchTarget(target)))
  const failures = checkAnchors(plansDocument.plans, targets, results)

  printPlanTable(plansDocument.plans, failures, results)

  if (failures.size > 0 || results.some((result) => result.unreachable)) {
    warn("plans refresh failed closed; data/plans.json and data/sources.json were not written")

    return 1
  }

  const retrieved = today()
  const updatedPlans: Plan[] = []

  for (const plan of plansDocument.plans) {
    updatedPlans.push({ ...plan, retrieved_at: retrieved })
  }

  const fetchedSourceIds = new Set<string>()

  for (const result of results) {
    if (result.target.sourceId !== undefined) {
      fetchedSourceIds.add(result.target.sourceId)
    }
  }

  const updatedSources: Source[] = []

  for (const source of sourcesDocument.sources) {
    if (fetchedSourceIds.has(source.id)) {
      updatedSources.push({ ...source, retrieved })
    } else {
      updatedSources.push(source)
    }
  }

  const candidatePlans = { ...plansDocument, plans: updatedPlans }
  const candidateSources = { ...sourcesDocument, sources: updatedSources }

  try {
    PlansFile.parse(candidatePlans)
    SourcesFile.parse(candidateSources)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)

    warn(`verified refresh produced invalid JSON shape: ${reason}`)

    return 1
  }

  const planChanges = planDiffs(plansDocument.plans, updatedPlans)
  const sourceChanges = sourceDiffs(sourcesDocument.sources, updatedSources)
  info(
    `verified refresh: ${planChanges.length} plan rows touched, ` +
      `${sourceChanges.length} source rows touched`,
  )

  for (const change of planChanges) {
    info(`field changed: ${change}`)
  }

  for (const change of sourceChanges) {
    info(`field changed: ${change}`)
  }

  if (diff) {
    info("diff mode: verified refresh not written")

    return 0
  }

  await writeJson(plansPath, candidatePlans)
  await writeJson(sourcesPath, candidateSources)
  info("plans refresh committed")

  return 0
}

if (import.meta.main) {
  process.exit(await run(Bun.argv.slice(2)))
}
