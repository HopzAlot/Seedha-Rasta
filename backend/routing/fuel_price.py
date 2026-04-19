import re
import time

import requests


PAKWHEELS_PRICE_URL = "https://www.pakwheels.com/petroleum-prices-in-pakistan"
FALLBACK_PRICE_PKR = 366.0
CACHE_TTL_SECONDS = 60 * 60

_cached_price = None
_cached_at = 0.0


def _parse_price_number(raw):
    if not raw:
        return None

    normalized = str(raw).replace(",", "").strip()
    try:
        value = float(normalized)
    except (TypeError, ValueError):
        return None

    if value < 100 or value > 1000:
        return None

    return value


def _extract_petrol_super_price(html):
    if not html:
        return None

    patterns = [
        r"petrol\s*\(?\s*super\s*\)?[\s\S]{0,260}?(?:rs\.?|pkr|&#8377;|\u20a8)\s*([0-9]{2,4}(?:\.[0-9]{1,2})?)",
        r"(?:rs\.?|pkr|&#8377;|\u20a8)\s*([0-9]{2,4}(?:\.[0-9]{1,2})?)[\s\S]{0,260}?petrol\s*\(?\s*super\s*\)?",
    ]

    for pattern in patterns:
        match = re.search(pattern, html, re.IGNORECASE)
        price = _parse_price_number(match.group(1) if match else None)
        if price:
            return price

    near_petrol = re.search(r"petrol[\s\S]{0,350}", html, re.IGNORECASE)
    if near_petrol:
        candidates = re.findall(r"([0-9]{2,4}(?:\.[0-9]{1,2})?)", near_petrol.group(0))
        for candidate in candidates:
            price = _parse_price_number(candidate)
            if price:
                return price

    return None


def get_petrol_super_price(force_refresh=False):
    global _cached_price, _cached_at

    now = time.time()
    if (
        not force_refresh
        and _cached_price is not None
        and (now - _cached_at) < CACHE_TTL_SECONDS
    ):
        return {
            "price": _cached_price,
            "source": "cache",
            "url": PAKWHEELS_PRICE_URL,
        }

    try:
        response = requests.get(
            PAKWHEELS_PRICE_URL,
            timeout=15,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/123.0.0.0 Safari/537.36"
                ),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        )
        response.raise_for_status()

        price = _extract_petrol_super_price(response.text)
        if not price:
            raise ValueError("Could not parse Petrol (Super) price")

        _cached_price = price
        _cached_at = now
        return {
            "price": price,
            "source": "pakwheels",
            "url": PAKWHEELS_PRICE_URL,
        }
    except Exception:
        if _cached_price is not None:
            return {
                "price": _cached_price,
                "source": "stale-cache",
                "url": PAKWHEELS_PRICE_URL,
            }

        return {
            "price": FALLBACK_PRICE_PKR,
            "source": "fallback",
            "url": PAKWHEELS_PRICE_URL,
        }
