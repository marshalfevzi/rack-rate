import type { APIRoute } from "astro"

import { absoluteUrl, asset } from "../lib/url.ts"

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = absoluteUrl(asset("/sitemap-index.xml"), site)

  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  )
}
