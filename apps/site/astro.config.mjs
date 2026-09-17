import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, fontProviders } from "astro/config"

export default defineConfig({
  // Deployment target — the origin is written down here and nowhere else.
  // `site` builds canonical and OG URLs; `base` prefixes emitted page and asset
  // URLs. Custom domain switch (two lines): both values below, plus committing
  // public/CNAME. See ARCHITECTURE.md, "Site configuration".
  site: "https://marshalfevzi.github.io",
  base: "/rack-rate",
  output: "static",
  // Fonts: the local provider self-hosts the committed faces, so the build
  // never fetches a font. Astro emits the @font-face rules, the preload links
  // and the metric-matched fallbacks for these two cssVariable names; the
  // @theme role stacks in src/styles/global.css point at them. `variants` is
  // nested because the family schema is strict. See DEC-2026-09-17-007.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "IBM Plex Sans",
      cssVariable: "--font-plex-sans",
      weights: [400, 500, 600],
      styles: ["normal"],
      formats: ["woff2"],
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          {
            weight: 400,
            style: "normal",
            src: ["./src/assets/fonts/ibm-plex-sans-latin-400-normal.woff2"],
          },
          {
            weight: 500,
            style: "normal",
            src: ["./src/assets/fonts/ibm-plex-sans-latin-500-normal.woff2"],
          },
          {
            weight: 600,
            style: "normal",
            src: ["./src/assets/fonts/ibm-plex-sans-latin-600-normal.woff2"],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "IBM Plex Mono",
      cssVariable: "--font-plex-mono",
      weights: [400, 500],
      styles: ["normal"],
      formats: ["woff2"],
      fallbacks: ["ui-monospace", "monospace"],
      options: {
        variants: [
          {
            weight: 400,
            style: "normal",
            src: ["./src/assets/fonts/ibm-plex-mono-latin-400-normal.woff2"],
          },
          {
            weight: 500,
            style: "normal",
            src: ["./src/assets/fonts/ibm-plex-mono-latin-500-normal.woff2"],
          },
        ],
      },
    },
  ],
  // The sitemap integration excludes 404/500 by default (`STATUS_CODE_PAGES` in
  // @astrojs/sitemap/dist/index.js), so no `filter` is configured.
  integrations: [sitemap()],
  // Tailwind v4: no tailwind.config.js, tokens live in CSS @theme (task 3.2).
  vite: { plugins: [tailwindcss()] },
})
