// Returns the input URL if it's a safe http(s) URL, otherwise empty string.
// Defends against `javascript:` and `data:` URLs slipping through into href
// attributes. Use this whenever rendering user-controlled URLs.
export function safeUrl(url) {
  if (!url) return ''
  const trimmed = String(url).trim()
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed
    }
  } catch {}
  return ''
}
