// oxlint-disable-next-line anti-slop/no-unknown-returns
export function parseYaml(text: string): unknown {
  const parsed: unknown = Bun.YAML.parse(text)

  return parsed
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

export function asStringList(value: unknown): string[] {
  if (typeof value === "string") {
    return [value]
  }

  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === "string")
}

/**
 * Preserve the invariant that parseYaml(emitYaml(value)) deeply equals value
 * for records, arrays, strings, booleans, finite numbers, and null.
 */
function shouldQuoteString(value: string): boolean {
  return (
    value.length === 0 ||
    value.includes(":") ||
    value.includes("#") ||
    value.includes("\n") ||
    value.includes("\r") ||
    /^\s|\s$/.test(value) ||
    /^[-?:,[\]{}#&*!|>'"%@`]/.test(value) ||
    /^(?:null|~)$/i.test(value) ||
    /^(?:false|no|off|true|yes|on)$/i.test(value) ||
    /^[+-]?(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|0[xX][0-9a-fA-F]+|0[oO][0-7]+)$/i.test(
      value,
    ) ||
    /^[+-]?\.(?:inf|nan)$/i.test(value)
  )
}

function quoteString(value: string): string {
  return `"${value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll('"', '\\"')}"`
}

function emitKey(value: string): string {
  return shouldQuoteString(value) ? quoteString(value) : value
}

function scalar(value: unknown): string {
  if (value === null || value === undefined) {
    return "null"
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false"
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Cannot emit a non-finite YAML number")
    }

    return String(value)
  }

  if (typeof value !== "string") {
    throw new Error("Cannot emit unsupported YAML scalar")
  }

  if (!shouldQuoteString(value)) {
    return value
  }

  return quoteString(value)
}

function emitBlock(value: unknown, indent: number): string[] {
  const padding = " ".repeat(indent)

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [`${padding}[]`]
    }

    const lines: string[] = []

    for (const item of value) {
      if (isRecord(item)) {
        const entries = Object.entries(item)

        if (entries.length === 0) {
          lines.push(`${padding}- {}`)
          continue
        }

        const [firstKey, firstValue] = entries[0]

        if (isRecord(firstValue) || Array.isArray(firstValue)) {
          lines.push(`${padding}- ${emitKey(firstKey)}:`)
          lines.push(...emitBlock(firstValue, indent + 4))
        } else {
          lines.push(`${padding}- ${emitKey(firstKey)}: ${scalar(firstValue)}`)
        }

        for (const [key, child] of entries.slice(1)) {
          if (isRecord(child) || Array.isArray(child)) {
            if (isRecord(child) && Object.keys(child).length === 0) {
              lines.push(`${" ".repeat(indent + 2)}${emitKey(key)}: {}`)
            } else if (Array.isArray(child) && child.length === 0) {
              lines.push(`${" ".repeat(indent + 2)}${emitKey(key)}: []`)
            } else {
              lines.push(`${" ".repeat(indent + 2)}${emitKey(key)}:`)
              lines.push(...emitBlock(child, indent + 4))
            }
          } else {
            lines.push(`${" ".repeat(indent + 2)}${emitKey(key)}: ${scalar(child)}`)
          }
        }
      } else if (Array.isArray(item)) {
        lines.push(`${padding}-`)
        lines.push(...emitBlock(item, indent + 2))
      } else {
        lines.push(`${padding}- ${scalar(item)}`)
      }
    }

    return lines
  }

  if (isRecord(value)) {
    const entries = Object.entries(value)

    if (entries.length === 0) {
      return [`${padding}{}`]
    }

    const lines: string[] = []

    for (const [key, child] of entries) {
      if (isRecord(child) || Array.isArray(child)) {
        if (isRecord(child) && Object.keys(child).length === 0) {
          lines.push(`${padding}${emitKey(key)}: {}`)
        } else if (Array.isArray(child) && child.length === 0) {
          lines.push(`${padding}${emitKey(key)}: []`)
        } else {
          lines.push(`${padding}${emitKey(key)}:`)
          lines.push(...emitBlock(child, indent + 2))
        }
      } else {
        lines.push(`${padding}${emitKey(key)}: ${scalar(child)}`)
      }
    }

    return lines
  }

  return [`${padding}${scalar(value)}`]
}

export function emitYaml(value: unknown): string {
  return emitBlock(value, 0).join("\n")
}
