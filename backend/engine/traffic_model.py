import requests

# ------------------------------
# TomTom Traffic Config
# ------------------------------
TOMTOM_API_KEY = "VgFjeSuOpogMlieuQlMNOWBoDqFTwuS2"
TOMTOM_TRAFFIC_URL = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"


# ------------------------------
# Fetch traffic level for a segment
# ------------------------------
def get_traffic_level(lat, lon):
    """
    Returns a traffic_level between 0 (free) and 1 (heavy) for the given coordinates.
    Uses TomTom Flow Segment Data API.
    """
    params = {
        "key": TOMTOM_API_KEY,
        "point": f"{lat},{lon}",
    }
    try:
        resp = requests.get(TOMTOM_TRAFFIC_URL, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()

        # TomTom returns "currentSpeed" and "freeFlowSpeed"
        current_speed = data['flowSegmentData']['currentSpeed']
        free_flow_speed = data['flowSegmentData']['freeFlowSpeed']

        # traffic_level = 1 → heavy congestion, 0 → free flow
        traffic_level = 1 - (current_speed / free_flow_speed)
        traffic_level = max(0, min(traffic_level, 1))  # clamp 0-1
        return traffic_level
    except Exception as e:
        print(f"[traffic_model] Error fetching traffic for {lat},{lon}: {e}")
        return 0.2  # fallback moderate traffic


# ------------------------------
# Assign traffic to graph
# ------------------------------
def assign_traffic(G):
    """
    Assigns real-time traffic_level to each edge in the graph using TomTom API.
    """
    for u, v, k, data in G.edges(keys=True, data=True):
        # Use edge centroid or start node for traffic query
        lat = (data.get('geometry').centroid.y
               if 'geometry' in data else G.nodes[u]['y'])
        lon = (data.get('geometry').centroid.x
               if 'geometry' in data else G.nodes[u]['x'])
        data['traffic_level'] = get_traffic_level(lat, lon)
    return G