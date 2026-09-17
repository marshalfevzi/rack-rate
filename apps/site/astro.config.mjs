import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"

export default defineConfig({
  // Deployment target — the origin is written down here and nowhere else.
  // `site` builds canonical and OG URLs; `base` prefixes emitted page and asset
  // URLs. Custom domain switch (two lines): both values below, plus committing
  // public/CNAME. See ARCHITECTURE.md, "Site configuration".
  site: "https://marshalfevzi.github.io",
  base: "/rack-rate",
  output: "static",
  // The sitemap integration excludes 404/500 by default (`STATUS_CODE_PAGES` in
  // @astrojs/sitemap/dist/index.js), so no `filter` is configured.
  integrations: [sitemap()],
  // Tailwind v4: no tailwind.config.js, tokens live in CSS @theme (task 3.2).
  vite: { plugins: [tailwindcss()] },
})
