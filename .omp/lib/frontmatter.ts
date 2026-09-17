import { emitYaml, isRecord, parseYaml } from "./yaml.ts"

export interface SplitDocument {
  frontmatter: Record<string, unknown>
  body: string
}

export function splitDocument(text: string): SplitDocument {
  const opening = text.startsWith("---\n") || text.startsWith("---\r\n")

  if (!opening) {
    throw new Error("Document is missing YAML frontmatter")
  }

  const newline = text.startsWith("---\r\n") ? "\r\n" : "\n"
  const closing = text.indexOf(`${newline}---`, 4)

  if (closing < 0) {
    throw new Error("Document has an unterminated YAML frontmatter block")
  }

  const yamlText = text.slice(4, closing)
  let parsed: unknown

  try {
    parsed = parseYaml(yamlText)
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "invalid YAML"
    throw new Error(`Document frontmatter is malformed: ${detail}`)
  }

  if (!isRecord(parsed)) {
    throw new Error("Document frontmatter must be a YAML mapping")
  }

  const afterClosing = closing + newline.length + 3

  if (
    afterClosing < text.length &&
    !text.startsWith("\r\n", afterClosing) &&
    !text.startsWith("\n", afterClosing)
  ) {
    throw new Error("Document frontmatter closing delimiter must occupy its own line")
  }

  let bodyStart = afterClosing

  if (text.startsWith("\r\n", bodyStart)) {
    bodyStart += 2
  } else if (text.startsWith("\n", bodyStart)) {
    bodyStart += 1
  }

  return { frontmatter: parsed, body: text.slice(bodyStart) }
}

export function renderDocument(frontmatter: Record<string, unknown>, body: string): string {
  const yaml = emitYaml(frontmatter)
  const normalizedBody = body.startsWith("\n") ? body.slice(1) : body

  return `---\n${yaml}\n---\n${normalizedBody}`
}
