import { describe, expect, test } from "bun:test"

import { MISSING } from "./format.ts"
import {
  READOUT_FIELDS,
  readoutFieldsFrom,
  readoutLine,
  type ReadoutAttributeCarrier,
  type ReadoutFields,
} from "./readout.ts"

describe("readoutLine", () => {
  test("prints every field in the contract order", () => {
    const fields: ReadoutFields = {
      value: "4.20×",
      basis: "Plan route",
      confidence: "measured",
      source: "Anthropic",
      retrieved: "2026-09-09",
    }

    expect(readoutLine(fields)).toBe(
      "VALUE 4.20× · BASIS Plan route · CONFIDENCE measured · SOURCE Anthropic · RETRIEVED 2026-09-09",
    )
    expect(READOUT_FIELDS).toEqual(["value", "basis", "confidence", "source", "retrieved"])
  })
})

describe("readoutFieldsFrom", () => {
  test("keeps a declared gap visible and rejects an undeclared source", () => {
    const declared = new Map<string, string>([["data-readout-gap", "Known gap: quota unresolved"]])

    const carrier: ReadoutAttributeCarrier = {
      getAttribute: (name: string): string | null => declared.get(name) ?? null,
    }

    expect(readoutFieldsFrom(carrier)).toEqual({
      value: MISSING,
      basis: MISSING,
      confidence: MISSING,
      source: "Known gap: quota unresolved",
      retrieved: MISSING,
    })
    expect(readoutFieldsFrom({ getAttribute: () => null })).toBeNull()
  })
})
