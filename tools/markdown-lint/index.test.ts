import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { tmpdir } from "node:os"

import { lintMarkdown, lintMarkdownText, type MarkdownCode } from "./index.ts"

const temporaryRoots: string[] = []

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "rack-rate-markdown-lint-"))
  temporaryRoots.push(root)

  return root
}

async function writeFixture(root: string, file: string, text: string): Promise<void> {
  const path = join(root, file)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, text)
}

async function fixtureCodes(root: string, file: string, text: string): Promise<MarkdownCode[]> {
  await writeFixture(root, file, text)
  const result = await lintMarkdown({ root, files: [file] })

  return result.issues.map((finding) => finding.code)
}

afterEach(async () => {
  const roots = temporaryRoots.splice(0)

  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })))
})

describe("Markdown lint frontmatter", () => {
  test("accepts a valid PM frontmatter mapping", async () => {
    const root = await temporaryRoot()

    expect(
      await fixtureCodes(root, "docs/pm/M1/README.md", "---\nid: M1\ntitle: One\n---\n# M1\n"),
    ).toEqual([])
  })

  test("reports an unterminated frontmatter block", async () => {
    const root = await temporaryRoot()

    expect(await fixtureCodes(root, "docs/pm/M1/README.md", "---\nid: M1\n# M1\n")).toEqual([
      "frontmatter-unterminated",
    ])
  })

  test("reports unparseable YAML", async () => {
    const root = await temporaryRoot()

    expect(await fixtureCodes(root, "notes.md", "---\nkey: [value\n---\n")).toEqual([
      "frontmatter-invalid",
    ])
  })

  test("reports a non-mapping YAML block", async () => {
    const root = await temporaryRoot()

    expect(await fixtureCodes(root, "notes.md", "---\n- one\n- two\n---\n")).toEqual([
      "frontmatter-invalid",
    ])
  })

  test("reports missing required PM frontmatter keys", async () => {
    const root = await temporaryRoot()

    expect(await fixtureCodes(root, "docs/pm/M1/README.md", "---\ntitle: One\n---\n")).toEqual([
      "frontmatter-key-missing",
    ])
  })
})

describe("Markdown lint line rules", () => {
  test("reports a backslash hard break", async () => {
    const root = await temporaryRoot()

    expect(await fixtureCodes(root, "notes.md", "line \\\nnext\n")).toEqual([
      "hard-break-backslash",
    ])
  })

  test("does not report an escaped literal backslash", async () => {
    const root = await temporaryRoot()

    expect(await fixtureCodes(root, "notes.md", "line \\\\\nnext\n")).toEqual([])
  })

  test("reports two trailing spaces", async () => {
    const root = await temporaryRoot()

    expect(await fixtureCodes(root, "notes.md", "line  \nnext\n")).toEqual(["hard-break-spaces"])
  })
})

describe("Markdown lint links", () => {
  test("reports a link to a missing file", async () => {
    const root = await temporaryRoot()

    expect(await fixtureCodes(root, "notes.md", "[missing](missing.md)\n")).toEqual([
      "dangling-link",
    ])
  })

  test("accepts a fragment link to an existing file", async () => {
    const root = await temporaryRoot()
    await writeFixture(root, "target.md", "# Section\n")

    expect(await fixtureCodes(root, "notes.md", "[target](target.md#section)\n")).toEqual([])
  })

  test("ignores an https target", async () => {
    const root = await temporaryRoot()

    expect(await fixtureCodes(root, "notes.md", "[web](https://example.com/page)\n")).toEqual([])
  })

  test("ignores hard breaks and links inside fenced blocks", async () => {
    const root = await temporaryRoot()
    const text = "```\nline \\\n[missing](missing.md)\n```\n"

    expect(await fixtureCodes(root, "notes.md", text)).toEqual([])
  })

  test("reports an unreadable work-list file", async () => {
    const root = await temporaryRoot()
    const result = await lintMarkdown({ root, files: ["missing.md"] })

    expect(result.issues.map((finding) => finding.code)).toEqual(["unreadable-file"])
  })

  test("lintMarkdownText resolves links from the file directory", async () => {
    const root = await temporaryRoot()
    await writeFixture(root, "docs/guide/target.md", "# Target\n")

    const issues = await lintMarkdownText("[target](target.md)\n", "docs/guide/README.md", root)

    expect(issues.map((finding) => finding.code)).toEqual([])
  })

  test("expands a directory argument to the markdown beneath it", async () => {
    const root = await temporaryRoot()
    await writeFixture(root, "docs/guide/notes.md", "# Notes\n")
    await writeFixture(root, "docs/guide/deep/nested.md", "trailing  \n")
    await writeFixture(root, "docs/guide/ignored.txt", "trailing  \n")

    const result = await lintMarkdown({ root, files: ["docs/guide"] })

    expect(result.files).toEqual(["docs/guide/deep/nested.md", "docs/guide/notes.md"])
    expect(result.issues.map((finding) => finding.code)).toEqual(["hard-break-spaces"])
  })
})
