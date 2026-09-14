import { existsSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import { dirname, join } from "node:path"

import type { z } from "zod"

import { Benchmark, BenchmarksFile } from "@rack-rate/core"

/** Repository root. This module lives at `packages/data-cli/src/`, so the root is three levels up. */
const REPO_ROOT = dirname(dirname(dirname(import.meta.dir)))

// Root scripts go through `bun run --filter` with cwd `packages/data-cli`, so
// Bun's cwd-relative `.env` autoload never sees the repository root. Variables
// already set in the environment win over the file.
const envFile = join(REPO_ROOT, ".env")

if (existsSync(envFile)) {
  process.loadEnvFile(envFile)
}

export const DATA_DIR = join(REPO_ROOT, "data")

export const RAW_DIR = join(DATA_DIR, "raw")

const FIXTURES_DIR = join(DATA_DIR, "fixtures")

export function dataPath(name: string): string {
  return join(DATA_DIR, name)
}

export function rawPath(name: string): string {
  return join(RAW_DIR, name)
}

export function fixturePath(name: string): string {
  return join(FIXTURES_DIR, name)
}

export function info(message: string): void {
  console.log(`rack-rate-data: ${message}`)
}

export function warn(message: string): void {
  console.error(`rack-rate-data: warning: ${message}`)
}

/** Local calendar date, ISO-8601. The clock lives in the CLI, never in `@rack-rate/core`. */
export function today(): string {
  const now = new Date()
  const month = `${now.getMonth() + 1}`.padStart(2, "0")
  const day = `${now.getDate()}`.padStart(2, "0")

  return `${now.getFullYear()}-${month}-${day}`
}

/**
 * Parse text at a trust boundary. The JSON is decoded here and handed to the
 * caller's zod schema, so nothing downstream ever touches an unparsed value.
 */
export function parseJsonAs<T>(text: string, schema: z.ZodType<T>, label: string): T {
  const decoded: unknown = JSON.parse(text)
  const result = schema.safeParse(decoded)

  if (result.success) {
    return result.data
  }

  const issues = result.error.issues
    .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n")

  throw new Error(`${label} does not match its schema:\n${issues}`)
}

export async function readJsonAs<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const file = Bun.file(path)

  if (!(await file.exists())) {
    throw new Error(`missing file: ${path}`)
  }

  return parseJsonAs(await file.text(), schema, path)
}

export async function readTextIfExists(path: string): Promise<string | null> {
  const file = Bun.file(path)

  return (await file.exists()) ? await file.text() : null
}

/** Deterministic on-disk form: two-space indent, trailing newline, caller-controlled key order. */
export async function writeJson<T>(path: string, value: T): Promise<void> {
  const next = `${JSON.stringify(value, null, 2)}\n`
  const previous = await readTextIfExists(path)

  if (previous === next) {
    return
  }

  await Bun.write(path, next)
}

export async function writeText(path: string, text: string): Promise<void> {
  await Bun.write(path, text)
}

export async function ensureRawDir(): Promise<void> {
  await mkdir(RAW_DIR, { recursive: true })
}

export function sha256Hex(text: string): string {
  return new Bun.CryptoHasher("sha256").update(text).digest("hex")
}

/**
 * Replace one benchmark entry in `data/benchmarks.json`, or append it when the
 * id is new. The committed order of the other entries is preserved so a refresh
 * produces a minimal diff. Each write is re-read and verified, and the whole
 * read-modify-write is retried, so two fetchers refreshing different benchmarks
 * cannot lose each other's entry.
 */
export async function upsertBenchmarkEntry(entry: Benchmark): Promise<void> {
  const path = dataPath("benchmarks.json")
  const parsed = Benchmark.safeParse(entry)

  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n")

    throw new Error(`${path} does not match the Benchmark schema:\n${issues}`)
  }

  const serialized = JSON.stringify(parsed.data)

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const file = await readJsonAs(path, BenchmarksFile)
    const index = file.benchmarks.findIndex((candidate) => candidate.id === parsed.data.id)

    const benchmarks =
      index === -1
        ? [...file.benchmarks, parsed.data]
        : file.benchmarks.map((candidate, at) => (at === index ? parsed.data : candidate))

    await writeJson(path, { benchmarks })

    const verified = await readJsonAs(path, BenchmarksFile)
    const stored = verified.benchmarks.find((candidate) => candidate.id === parsed.data.id)

    if (stored !== undefined && JSON.stringify(stored) === serialized) {
      return
    }

    await Bun.sleep(200)
  }

  throw new Error(`could not write benchmark "${parsed.data.id}" into ${path}`)
}
