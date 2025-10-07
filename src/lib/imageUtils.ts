export function isImageUrl(src?: string | null): boolean {
  if (!src) return false
  const s = src.trim()
  if (!s) return false
  // relative paths and data urls are considered valid
  if (s.startsWith('/') || s.startsWith('./') || s.startsWith('../')) return true
  if (s.startsWith('data:image/')) return true
  // basic file extension check
  try {
    const lower = s.split('?')[0].toLowerCase()
    return /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(lower)
  } catch {
    return false
  }
}
export function isLikelyImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (trimmed.startsWith('data:')) return true
  try {
    const u = new URL(trimmed)
    const pathname = u.pathname.toLowerCase()
    return (pathname.match(/\.(jpg|jpeg|png|webp|gif|avif|svg)$/) !== null)
  } catch {
    return /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(trimmed)
  }
}

export function getImageSrcWithFallback(posterUrl?: string | null): string {
  if (!posterUrl || !isLikelyImageUrl(posterUrl)) {
    return '/placeholder-movie.svg'
  }
  return posterUrl
}

export function shouldUnoptimizeImage(url?: string | null): boolean {
  if (!url) return false
  // List of domains that might have issues with Next.js optimization
  const problematicDomains = [
    'm.media-amazon.com',
    'asianwiki.com',
    'www.google.com',
    'encrypted-tbn0.gstatic.com'
  ]
  return problematicDomains.some(domain => url.includes(domain))
}
