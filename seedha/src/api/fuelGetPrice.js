// Frontend helper for petrol price.
// Source scraping happens on backend; frontend only calls internal API.

const FALLBACK_PRICE_PKR = 366
const API_URL = '/api/route/fuel-price/'

let cachedPrice = null
let cacheTimestamp = 0
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

export async function getPakistanPetrolPrice({ refresh = false } = {}) {
  if (!refresh && cachedPrice && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedPrice
  }

  try {
    const qs = refresh ? '?refresh=true' : ''
    const res = await fetch(`${API_URL}${qs}`)
    if (!res.ok) throw new Error(`fuel-price API returned ${res.status}`)

    const data = await res.json()
    const price = Number.parseFloat(data?.price)
    if (!Number.isFinite(price)) throw new Error('Invalid fuel price payload')

    cachedPrice = price
    cacheTimestamp = Date.now()
    return price
  } catch (err) {
    console.warn(`[fuelPrice] backend fetch failed (${err.message}), using fallback`) 
    return cachedPrice ?? FALLBACK_PRICE_PKR
  }
}