/** Supabase numeric 등을 숫자로 */
export function toPriceNumber(v: unknown): number {
  if (v == null || v === '') return 0
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

type PriceFields = { price: unknown; original_price?: unknown }

/** 실제 판매가 */
export function productSalePrice(p: PriceFields): number {
  return toPriceNumber(p.price)
}

/**
 * 취소선용 정가. original_price가 있고 판매가보다 크면만 반환
 */
export function productListPrice(p: PriceFields): number | null {
  if (p.original_price == null || p.original_price === '') return null
  const orig = toPriceNumber(p.original_price)
  const sale = productSalePrice(p)
  if (orig > sale) return orig
  return null
}

/** 1~99 정수 할인율 %, 없으면 null */
export function productDiscountPercent(p: PriceFields): number | null {
  const list = productListPrice(p)
  if (list == null || list <= 0) return null
  const sale = productSalePrice(p)
  const pct = Math.round((1 - sale / list) * 100)
  if (pct <= 0) return null
  return Math.min(99, Math.max(1, pct))
}
