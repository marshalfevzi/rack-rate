import { Resvg } from "@resvg/resvg-js"
import satori, { type Font } from "satori"
import { jsx, jsxs } from "satori/jsx/jsx-runtime"

import { benchmarks, models, plans } from "../src/lib/data.ts"

type Palette = {
  canvas: string
  ink: string
  dim: string
  rule: string
}

const width = 1200

const height = 630

function findThemeBody(css: string): string {
  const themeStart = /@theme\s*\{/.exec(css)

  if (themeStart === null) {
    throw new Error("Missing @theme block in global.css")
  }

  const openBrace = css.indexOf("{", themeStart.index)
  let depth = 0

  for (let index = openBrace; index < css.length; index += 1) {
    const character = css[index]

    if (character === "{") {
      depth += 1
    } else if (character === "}") {
      depth -= 1

      if (depth === 0) {
        return css.slice(openBrace + 1, index)
      }
    }
  }

  throw new Error("Unclosed @theme block in global.css")
}

function readThemeColor(theme: string, name: keyof Palette): string {
  const declaration = new RegExp(`--color-${name}\\s*:\\s*([^;]+);`).exec(theme)
  const value = declaration?.[1]?.trim()

  if (value === undefined || value.length === 0) {
    throw new Error(`Missing @theme token --color-${name} in global.css`)
  }

  return value
}

function readPalette(css: string): Palette {
  const theme = findThemeBody(css)

  return {
    canvas: readThemeColor(theme, "canvas"),
    ink: readThemeColor(theme, "ink"),
    dim: readThemeColor(theme, "dim"),
    rule: readThemeColor(theme, "rule"),
  }
}

async function readFont(fontUrl: URL): Promise<ArrayBuffer> {
  const fontFile = Bun.file(fontUrl)

  if (!(await fontFile.exists())) {
    throw new Error(`Missing font file: ${fontUrl.pathname}`)
  }

  return fontFile.arrayBuffer()
}

function readCanonicalHref(html: string): string {
  const links = html.matchAll(/<link\b[^>]*>/gi)

  for (const match of links) {
    const tag = match[0]
    const rel = /\brel\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]

    if (rel?.toLowerCase() !== "canonical") {
      continue
    }

    const href = /\bhref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]

    if (href !== undefined) {
      return href
    }
  }

  throw new Error("No canonical href found in dist/index.html")
}

function displayOrigin(html: string): string {
  // The deployment target lives in astro.config.mjs; use the URL the site emitted.
  const canonicalUrl = new URL(readCanonicalHref(html))

  return `${canonicalUrl.host}${canonicalUrl.pathname.replace(/\/$/, "")}`
}

function makeCard(palette: Palette, origin: string) {
  const headingStyle = { fontSize: 58, fontWeight: 600, color: palette.ink }
  const metaStyle = { fontSize: 30, color: palette.dim }
  const footerTextStyle = { fontSize: 22, color: palette.dim }

  return jsxs("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      width,
      height,
      padding: 80,
      backgroundColor: palette.canvas,
      color: palette.ink,
      fontFamily: "IBM Plex Sans",
    },
    children: [
      jsxs("div", {
        style: { display: "flex", flexDirection: "column", gap: 24 },
        children: [
          jsx("div", {
            style: {
              display: "flex",
              alignItems: "center",
              fontSize: 36,
              fontWeight: 600,
              color: palette.ink,
            },
            children: "rack-rate",
          }),
          jsxs("div", {
            style: { display: "flex", flexDirection: "column", gap: 12 },
            children: [
              jsx("div", { style: headingStyle, children: "Which model should I use?" }),
              jsx("div", { style: headingStyle, children: "Which subscription pays for itself?" }),
              jsx("div", {
                style: metaStyle,
                children: `${models.length} models · ${plans.length} plans · ${benchmarks.length} benchmark versions`,
              }),
            ],
          }),
        ],
      }),
      jsxs("div", {
        style: { display: "flex", flexDirection: "column", gap: 20, width: "100%" },
        children: [
          jsx("div", { style: { width: "100%", height: 1, backgroundColor: palette.rule } }),
          jsxs("div", {
            style: {
              ...footerTextStyle,
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            },
            children: [
              jsx("div", { children: "Every published figure cited to its source" }),
              jsx("div", { children: origin }),
            ],
          }),
        ],
      }),
    ],
  })
}

async function main(): Promise<void> {
  const paletteUrl = new URL("../src/styles/global.css", import.meta.url)
  const palette = readPalette(await Bun.file(paletteUrl).text())

  // Satori reads TTF, OTF and WOFF, never WOFF2, so the card uses the two
  // committed .woff faces. The card's 700 requests are mapped onto the 600
  // step because satori synthesises no bold (see ARCHITECTURE.md, "Social card").
  const regularUrl = new URL(
    "../src/assets/fonts/ibm-plex-sans-latin-400-normal.woff",
    import.meta.url,
  )

  const semiboldUrl = new URL(
    "../src/assets/fonts/ibm-plex-sans-latin-600-normal.woff",
    import.meta.url,
  )

  const [regular, semibold] = await Promise.all([readFont(regularUrl), readFont(semiboldUrl)])

  const fonts: Font[] = [
    { name: "IBM Plex Sans", data: regular, weight: 400, style: "normal" },
    { name: "IBM Plex Sans", data: semibold, weight: 600, style: "normal" },
  ]

  const indexUrl = new URL("../dist/index.html", import.meta.url)
  const indexFile = Bun.file(indexUrl)

  if (!(await indexFile.exists())) {
    throw new Error(`Missing built site at ${indexUrl.pathname}; run the site build first`)
  }

  const origin = displayOrigin(await indexFile.text())
  const card = makeCard(palette, origin)
  const svg = await satori(card, { width, height, fonts })
  const png = new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng()

  if (
    png.length < 24 ||
    png[1] !== 0x50 ||
    png[2] !== 0x4e ||
    png[3] !== 0x47 ||
    png.readUInt32BE(16) !== width ||
    png.readUInt32BE(20) !== height
  ) {
    throw new Error("Rendered OG image is not a 1200x630 PNG")
  }

  const outputUrl = new URL("../dist/og.png", import.meta.url)
  await Bun.write(outputUrl, png)
  console.log(`Wrote ${outputUrl.pathname} (${width}x${height}, ${png.length} bytes)`)
}

await main()
