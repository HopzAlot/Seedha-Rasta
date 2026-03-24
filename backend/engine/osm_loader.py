import requests
import pickle
import redis
import time
from typing import List, Tuple
from .utils import snap_to_road

# ------------------------------
# Redis client
# ------------------------------
r = redis.Redis(host='localhost', port=6379, db=0)

# ------------------------------
# TomTom API config
# ------------------------------
TOMTOM_KEY = "VgFjeSuOpogMlieuQlMNOWBoDqFTwuS2"
ROUTING_URL = "https://api.tomtom.com/routing/1/calculateRoute"
TRAFFIC_URL = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"

# ------------------------------
# 🔐 Preprocess Signature
# ------------------------------
def get_preprocess_signature():
    return "tomtom_preprocess_v4_with_traffic"

# ------------------------------
# 🚦 Get Traffic Level (cached & safe)
# ------------------------------
def get_traffic_level(lat: float, lon: float) -> float:
    """
    Returns traffic level (0 → 1) using Redis cache.
    Returns a fallback 0.2 if traffic API fails or gives invalid data.
    """
    cache_key = f"traffic:{round(lat, 4)}:{round(lon, 4)}"
    cached = r.get(cache_key)
    if cached:
        return float(cached)

    try:
        params = {"key": TOMTOM_KEY, "point": f"{lat},{lon}"}
        resp = requests.get(TRAFFIC_URL, params=params, timeout=3)
        resp.raise_for_status()
        flow = resp.json().get("flowSegmentData", {})
        current_speed = flow.get("currentSpeed", 0)
        free_flow_speed = flow.get("freeFlowSpeed", 1)
        if free_flow_speed <= 0:
            traffic_level = 0.2
        else:
            traffic_level = 1 - (current_speed / free_flow_speed)
            traffic_level = max(0, min(traffic_level, 1))
    except Exception as e:
        print(f"[traffic] Error for {lat},{lon}: {e}")
        traffic_level = 0.2

    # Cache for 2 minutes
    r.setex(cache_key, 120, traffic_level)
    return traffic_level

# ------------------------------
# 🔧 Preprocess Route Points
# ------------------------------
def preprocess_route(route_points: List[dict], fetch_traffic: bool = True) -> List[dict]:
    """
    Converts raw TomTom route points to traffic-aware points.
    Each point contains: lat, lng, travel_time (min), traffic_level.
    Snaps **every point** to nearest road and fetches traffic safely.
    """
    processed = []
    for pt in route_points:
        lat, lng = pt.get("latitude") or pt.get("lat"), pt.get("longitude") or pt.get("lng")

        # Snap to nearest road
        if fetch_traffic:
            lat, lng = snap_to_road(lat, lng)

        # Traffic (fallback 0.2)
        traffic_level = get_traffic_level(lat, lng) if fetch_traffic else 0

        travel_time = pt.get("travelTimeInSeconds") or pt.get("time") or 0
        processed.append({
            "lat": lat,
            "lng": lng,
            "travel_time": travel_time / 60,  # convert to minutes
            "traffic_level": traffic_level
        })

    return processed

# ------------------------------
# 🌍 Load Route from TomTom
# ------------------------------
def load_route_from_tomtom(start: Tuple[float, float], end: Tuple[float, float], max_alternatives: int = 2) -> dict:
    """
    Fetches alternative routes from TomTom, snaps all points, attaches traffic.
    Caches the processed routes to Redis.
    """
    cache_key = f"tomtom_route:{start[0]}_{start[1]}:{end[0]}_{end[1]}:{max_alternatives}"
    cached = r.get(cache_key)
    if cached:
        route_data = pickle.loads(cached)
        print(f"[tomtom_loader] Loaded from cache ({len(route_data['routes'])} routes)")
        return route_data

    url = f"{ROUTING_URL}/{start[0]},{start[1]}:{end[0]},{end[1]}/json"
    params = {
        "key": TOMTOM_KEY,
        "computeTravelTimeFor": "all",
        "routeRepresentation": "polyline",
        "maxAlternatives": max_alternatives,
        "traffic": "true"
    }

    try:
        resp = requests.get(url, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        routes = data.get("routes", [])
    except Exception as e:
        print(f"[tomtom_loader] Routing API failed: {e}")
        routes = []

    all_routes = []
    for route in routes:
        route_points = []
        legs = route.get("legs", [])
        for leg in legs:
            route_points.extend(leg.get("points", []))

        if not route_points:
            continue

        processed_points = preprocess_route(route_points, fetch_traffic=True)
        all_routes.append({
            "points": processed_points,
            "summary": route.get("summary", {})
        })

    if not all_routes:
        print("[tomtom_loader] No routes found after preprocessing")
        return {
            "routes": [],
            "preprocess_signature": get_preprocess_signature(),
            "created_at": time.time()
        }

    route_data = {
        "routes": all_routes,
        "preprocess_signature": get_preprocess_signature(),
        "created_at": time.time()
    }

    
    r.setex(cache_key,pickle.dumps(route_data))
    print(f"[tomtom_loader] Cached {len(all_routes)} routes with traffic info")
    return route_data