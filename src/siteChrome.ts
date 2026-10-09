const DEFAULT_SITE_CHROME_ORIGIN = 'https://mlightcad.com'

export function getSiteChromeOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_CHROME_ORIGIN?.trim()
  const raw = fromEnv || DEFAULT_SITE_CHROME_ORIGIN
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return DEFAULT_SITE_CHROME_ORIGIN
    }
    return url.origin
  } catch {
    return DEFAULT_SITE_CHROME_ORIGIN
  }
}

/**
 * Load the marketing site header/footer from mlightcad.com (or a local
 * mlightcad.github.io `pnpm dev` origin). Markup is injected into
 * `[data-site-nav]` / `[data-site-footer]`.
 */
export async function loadSiteChrome(): Promise<void> {
  const url = `${getSiteChromeOrigin()}/site-chrome.js`
  try {
    await import(/* @vite-ignore */ url)
  } catch (error) {
    console.warn('Failed to load MLightCAD site chrome:', error)
  }
}
