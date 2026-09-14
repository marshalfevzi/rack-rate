// Astro normalises `base: undefined` to "/", so a single normalisation here
// covers the project page and the custom domain. The build emits a directory
// per route, so route links end in "/" and file links do not.
const base = import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/+$/, "")

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
