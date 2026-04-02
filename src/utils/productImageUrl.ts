const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://toueihqbuqbmkatatonp.supabase.co'
const STORAGE_BUCKET = 'product-images'

/** DB/스토리지에 파일명만 있거나 잘못된 호스트로 저장된 URL 보정 */
export const PRODUCT_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1560472354-b33ff0c47444?auto=format&fit=crop&w=800&q=80'

/** products.image_urls: 배열·JSON 문자열·단일 URL 문자열 모두에서 첫 URL만 추출 */
export function rawFirstProductImageUrl(imageUrls: unknown): string | undefined {
  if (imageUrls == null) return undefined

  if (Array.isArray(imageUrls)) {
    const first = imageUrls.find((x): x is string => typeof x === 'string' && x.trim().length > 0)
    return first?.trim()
  }

  if (typeof imageUrls === 'string') {
    const t = imageUrls.trim()
    if (!t) return undefined
    if (t.startsWith('[') || t.startsWith('{')) {
      try {
        const parsed = JSON.parse(t) as unknown
        if (Array.isArray(parsed)) {
          const u = parsed.find((x): x is string => typeof x === 'string' && x.trim().length > 0)
          return u?.trim()
        }
      } catch {
        /* JSON 아니면 아래에서 통째로 URL로 취급 */
      }
    }
    return t
  }

  return undefined
}

export function resolveProductImageFromUrls(imageUrls: unknown): string {
  return resolveProductImage(rawFirstProductImageUrl(imageUrls))
}

function storagePublicUrl(objectPath: string): string {
  const path = objectPath.replace(/^\/+/, '')
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
}

/**
 * 호스트가 실제 도메인이 아니라 파일명으로 파싱된 잘못된 URL
 * (예: http://1759384149648-img1.jpg, http://daenamoo.jpg — 라벨이 2개뿐이고 끝이 이미지 확장자)
 */
function hostLooksLikeImageFilename(hostname: string): boolean {
  const parts = hostname.split('.').filter(Boolean)
  if (parts.length !== 2) return false
  return /^(jpe?g|png|webp|gif)$/i.test(parts[1])
}

export function resolveProductImage(raw: string | undefined | null): string {
  if (raw == null || String(raw).trim() === '') return PRODUCT_IMAGE_FALLBACK
  let s = String(raw).trim()

  if (s.startsWith('//')) {
    s = `https:${s}`
  }

  if (!/^https?:\/\//i.test(s)) {
    return storagePublicUrl(s)
  }

  try {
    const u = new URL(s)

    if (hostLooksLikeImageFilename(u.hostname)) {
      const path = `${u.hostname}${u.pathname === '/' ? '' : u.pathname}`.replace(/^\/+/, '')
      return storagePublicUrl(path)
    }

    return s
  } catch {
    return storagePublicUrl(s.replace(/^https?:\/\//i, ''))
  }
}
