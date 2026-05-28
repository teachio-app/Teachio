export async function fetchWikipediaSummary(query: string): Promise<string | null> {
  try {
    const url = `https://cs.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Teachio/1.0 (hello@teachio.cz)' },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const data = await res.json() as { extract?: string; title?: string }
    if (!data.extract) return null
    return `${data.title ?? query}\n${data.extract.slice(0, 1200)}`
  } catch {
    return null
  }
}
