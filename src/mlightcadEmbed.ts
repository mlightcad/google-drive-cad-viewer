const DEFAULT_EMBED_URL = 'https://mlightcad.com/embed.html'

export const EMBED_READY_TYPE = 'mlightcad-embed:ready'
export const EMBED_OPEN_TYPE = 'mlightcad-embed:open'

export function getMlightcadEmbedBaseUrl(): string {
  return import.meta.env.VITE_MLIGHTCAD_EMBED_URL || DEFAULT_EMBED_URL
}

export function getMlightcadEmbedOrigin(): string {
  return new URL(getMlightcadEmbedBaseUrl()).origin
}

/**
 * Embed viewer URL. Drawings are opened with postMessage after the
 * iframe posts `mlightcad-embed:ready`.
 */
export function buildMlightcadEmbedUrl(): string {
  const embedUrl = new URL(getMlightcadEmbedBaseUrl())
  embedUrl.searchParams.set('mode', 'review')
  embedUrl.searchParams.set('toolbar', '1')
  embedUrl.searchParams.set('locale', 'en')
  return embedUrl.toString()
}
