import {
  ensureRawDir,
  parseJsonAs,
  rawPath,
  readTextIfExists,
  today,
  warn,
  writeText,
} from "./paths.ts"
import type { z } from "zod"

/** This version mirrors the root package.json version. */
export const USER_AGENT = "rack-rate/2.0.0 (+https://github.com/marshalfevzi/rack-rate)"

const MAX_ATTEMPTS = 3

const RETRY_BACKOFF_MS = 500

const RETRY_AFTER_CAP_MS = 30_000

const RETRY_JITTER_MS = 250

export interface FetchRequest {
  source: string
  url: string
  accept?: string
  headers?: Record<string, string>
  persistSnapshot?: boolean
}

export interface Snapshot {
  text: string
  snapshotPath: string
  status: number
  fromSnapshot: boolean
}

export interface JsonSnapshot<T> {
  value: T
  text: string
  snapshotPath: string
  status: number
  fromSnapshot: boolean
}

export class FetchError extends Error {
  readonly status: number | null

  readonly url: string

  constructor(message: string, status: number | null, url: string) {
    super(message)
    this.name = "FetchError"
    this.status = status
    this.url = url
  }
}

function rawSnapshotPath(source: string, date: string): string {
  return rawPath(`${source}-${date}.json`)
}

function readSnapshot(path: string): Promise<string | null> {
  return readTextIfExists(path)
}

function backoffDelay(attempt: number): number {
  return RETRY_BACKOFF_MS * 2 ** attempt + Math.random() * RETRY_JITTER_MS
}

function retryAfterDelay(value: string | null): number | null {
  if (value === null) {
    return null
  }

  const header = value.trim()

  if (/^\d+$/.test(header)) {
    return Math.min(Number(header) * 1000, RETRY_AFTER_CAP_MS)
  }

  const retryAt = Date.parse(header)

  if (Number.isNaN(retryAt)) {
    return null
  }

  return Math.min(Math.max(retryAt - Date.now(), 0), RETRY_AFTER_CAP_MS)
}

function sleep(milliseconds: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>()

  setTimeout(resolve, milliseconds)

  return promise
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599)
}

export async function fetchText(request: FetchRequest): Promise<Snapshot> {
  const snapshotPath =
    request.persistSnapshot === false ? "" : rawSnapshotPath(request.source, today())

  let attempts = 0

  let lastStatus: number | null = null

  let lastError = "no response"

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    attempts += 1

    let response: Response

    try {
      response = await fetch(request.url, {
        headers: {
          Accept: request.accept ?? "application/json",
          "User-Agent": USER_AGENT,
          ...request.headers,
        },
        signal: AbortSignal.timeout(15_000),
      })
    } catch (error) {
      lastStatus = null
      lastError = error instanceof Error ? error.message : String(error)

      if (attempt === MAX_ATTEMPTS - 1) {
        break
      }

      await sleep(backoffDelay(attempt))
      continue
    }

    lastStatus = response.status

    if (response.status >= 200 && response.status < 300) {
      let text: string

      try {
        text = await response.text()
      } catch (error) {
        lastStatus = null
        lastError = error instanceof Error ? error.message : String(error)

        if (attempt === MAX_ATTEMPTS - 1) {
          break
        }

        await sleep(backoffDelay(attempt))
        continue
      }

      const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining")

      if (rateLimitRemaining !== null) {
        console.log(
          `rack-rate-data: ${request.source}: X-RateLimit-Remaining=${rateLimitRemaining}`,
        )
      }

      if (request.persistSnapshot !== false) {
        await ensureRawDir()
        await writeText(snapshotPath, text)
      }

      return {
        text,
        snapshotPath,
        status: response.status,
        fromSnapshot: false,
      }
    }

    lastError = `HTTP ${response.status}`

    if (!isRetryableStatus(response.status) || attempt === MAX_ATTEMPTS - 1) {
      break
    }

    const delay =
      response.status === 429 ? retryAfterDelay(response.headers.get("Retry-After")) : null

    await sleep(delay ?? backoffDelay(attempt))
  }

  const snapshot = request.persistSnapshot === false ? null : await readSnapshot(snapshotPath)

  const attemptLabel = `${attempts} attempt${attempts === 1 ? "" : "s"}`

  if (snapshot !== null) {
    warn(
      `using raw snapshot for ${request.source} after ${attemptLabel} ` +
        `(${request.url}): ${lastError}`,
    )

    return {
      text: snapshot,
      snapshotPath,
      status: 0,
      fromSnapshot: true,
    }
  }

  throw new FetchError(
    `failed to fetch ${request.source} from ${request.url} after ${attemptLabel}: ${lastError}`,
    lastStatus,
    request.url,
  )
}

export async function fetchJsonAs<T>(
  request: FetchRequest,
  schema: z.ZodType<T>,
): Promise<JsonSnapshot<T>> {
  const snapshot = await fetchText(request)

  const value = parseJsonAs(snapshot.text, schema, request.url)

  return {
    value,
    text: snapshot.text,
    snapshotPath: snapshot.snapshotPath,
    status: snapshot.status,
    fromSnapshot: snapshot.fromSnapshot,
  }
}
