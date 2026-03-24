import math
import requests
import pickle

TOMTOM_KEY = "VgFjeSuOpogMlieuQlMNOWBoDqFTwuS2"
# def nodes_to_coordinates(G, path):
#     coords = []

#     for node in path:
#         data = G.nodes[node]
#         coords.append({
#             "lat": data['y'],
#             "lng": data['x']
#         })

#     return coords
def compute_path_fuel(G, path, vehicle):
    from .cost_function import compute_edge_cost

    total_fuel = 0

    for i in range(len(path) - 1):
        u = path[i]
        v = path[i + 1]

        edges = G.get_edge_data(u, v)

        # pick first edge (same assumption as pathfinder)
        for key in edges:
            edge = edges[key]
            total_fuel += compute_edge_cost(edge, vehicle)
            break

    return total_fuel

def get_speed(edge):
    maxspeed = edge.get("maxspeed")

    if isinstance(maxspeed, list):
        maxspeed = maxspeed[0]

    if isinstance(maxspeed, str):
        if "mph" in maxspeed:
            return float(maxspeed.replace("mph", "").strip()) * 1.609
        try:
            return float(maxspeed)
        except:
            pass

    # fallback based on road type
    highway = edge.get("highway", "")

    DEFAULT_SPEEDS = {
        "motorway": 90,
        "trunk": 80,
        "primary": 60,
        "secondary": 50,
        "tertiary": 40,
        "residential": 30,
        "service": 20
    }

    return DEFAULT_SPEEDS.get(highway, 40)

def haversine_distance(p1, p2):
    """
    Compute distance between two points in km.
    p1, p2 can be:
      - dicts with 'lat' and 'lng'
      - tuples/lists (lat, lng)
    """
    if isinstance(p1, dict):
        lat1, lon1 = p1['lat'], p1['lng']
    else:
        lat1, lon1 = p1[0], p1[1]

    if isinstance(p2, dict):
        lat2, lon2 = p2['lat'], p2['lng']
    else:
        lat2, lon2 = p2[0], p2[1]

    R = 6371  # km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))
# ------------------------------
# Snap coordinates to nearest road
# ------------------------------
def snap_to_road(lat, lng):
    url = "https://api.tomtom.com/snapToRoad/1/point.json"
    params = {
        "key": TOMTOM_KEY,
        "point": f"{lat},{lng}",
    }
    try:
        resp = requests.get(url, params=params, timeout=3)
        resp.raise_for_status()
        data = resp.json()
        snapped_points = data.get("snappedPoints", [])
        if snapped_points:
            snapped = snapped_points[0]["position"]
            return snapped["latitude"], snapped["longitude"]
    except Exception as e:
        print(f"[snap_to_road] Failed for {lat},{lng}: {e}")
    return lat, lng  # fallback to original

