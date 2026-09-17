// Astro normalises `base: undefined` to "/", so a single normalisation here
// covers the project page and the custom domain. The build emits a directory
// per route, so route links end in "/" and file links do not.
// Astro injects BASE_URL at build time; Bun's import.meta.env has none, so the
// helper normalises an absent base to the site root instead of throwing.
function normalizeBase(value: string | undefined): string {
  return value === undefined || value === "/" ? "" : value.replace(/\/+$/, "")
}

const base = normalizeBase(import.meta.env.BASE_URL)

export function href(path: `/${string}`): string {
  const route = path === "/" ? "" : path.replace(/\/+$/, "")
  const joined = `${base}${route}`

  return joined === "" ? "/" : `${joined}/`
}

export function asset(path: `/${string}`): string {
  return `${base}${path}`
}

// Takes a base-relative path — from href(), asset() or Astro.url.pathname —
// and makes it absolute. Base handling lives in those two builders.
export function absoluteUrl(relativePath: string, site: URL | undefined): string {
  if (site === undefined) {
    return relativePath
  }

  return new URL(relativePath, site.origin).toString()
}
