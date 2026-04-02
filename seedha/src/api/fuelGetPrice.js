// Fetches current MS Petrol price for Pakistan from OGRA
// Uses allorigins.win as a CORS proxy to scrape the public page
// Falls back to last known price if fetch fails

const FALLBACK_PRICE_PKR = 458  // As of april 2026, OGRA price is around ₨458/liter

const OGRA_URL =
  'https://api.allorigins.win/get?url=' +
  encodeURIComponent('https://ogra.org.pk/petrol-prize.php')

let cachedPrice    = null
let cacheTimestamp = 0
const CACHE_TTL    = 1000 * 60 * 60  // 1 hour — price only changes fortnightly

/** Try to extract price from OGRA HTML */
function parsePrice(html) {
  if (!html) return null

  // Primary: match table row containing "MS" near a PKR price (200–350 range)
  const primary = html.match(
    /MS\s*(?:\(Petrol\))?[^<]{0,80}<[^>]+>\s*(?:Rs\.?\s*)?(2[0-9]{2}\.[0-9]{1,2})/i
  )
  if (primary) return parseFloat(primary[1])

  // Secondary: any 3-digit price near the word "petrol"
  const secondary = html.match(
    /petrol[^<]{0,200}(2[0-9]{2}\.[0-9]{1,2})/i
  )
  if (secondary) return parseFloat(secondary[1])

  // Tertiary: just find any plausible fuel price in the page
  const tertiary = html.match(/(2[0-9]{2}\.[0-9]{2})/g)
  if (tertiary?.length) {
    // Pick the first one that looks like a fuel price (200–350)
    const candidate = tertiary
      .map(parseFloat)
      .find(n => n >= 200 && n <= 350)
    if (candidate) return candidate
  }

  return null
}

export async function getPakistanPetrolPrice() {
  // Return cached value if still fresh
  if (cachedPrice && Date.now() - cacheTimestamp < CACHE_TTL) {
    console.info(`[fuelPrice] Using cached price: ₨${cachedPrice}`)
    return cachedPrice
  }

  try {
    const res = await fetch(OGRA_URL)

    if (!res.ok) throw new Error(`allorigins returned ${res.status}`)

    const json = await res.json()

    if (!json?.contents) throw new Error('Empty response from proxy')

    const price = parsePrice(json.contents)

    if (!price) throw new Error('Could not parse price from OGRA HTML')

    console.info(`[fuelPrice] Live OGRA price: ₨${price}`)
    cachedPrice    = price
    cacheTimestamp = Date.now()
    return price

  } catch (err) {
    console.warn(`[fuelPrice] Fetch failed (${err.message}), using fallback ₨${FALLBACK_PRICE_PKR}`)
    // Return stale cache if available, otherwise fallback
    return cachedPrice ?? FALLBACK_PRICE_PKR
  }
}