import math

# ------------------------------
# Convert node IDs to lat/lng coordinates
# ------------------------------
def nodes_to_coordinates(G, path):
    """
    Convert a list of node IDs in the graph G to coordinates.
    """
    coords = []
    for node in path:
        data = G.nodes[node]
        coords.append({
            "lat": data['y'],
            "lng": data['x']
        })
    return coords

# ------------------------------
# Compute fuel cost for a given path
# ------------------------------
def compute_path_fuel(G, path, vehicle):
    from .cost_function import compute_edge_cost

    total_fuel = 0
    for i in range(len(path) - 1):
        u = path[i]
        v = path[i + 1]
        edges = G.get_edge_data(u, v)
        if not edges:
            continue
        # pick first edge
        for key in edges:
            edge = edges[key]
            total_fuel += compute_edge_cost(edge, vehicle)
            break
    return total_fuel

# ------------------------------
# Determine speed from edge
# ------------------------------
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

# ------------------------------
# Haversine distance (accepts nodes or lat/lng)
# ------------------------------
def haversine_distance(G, node1, node2=None):
    """
    Compute distance in km.
    If node2 is None, node1 and node2 are dicts/tuples with lat/lng.
    If node2 is provided, node1 and node2 are node IDs in graph G.
    """
    if node2 is None:
        # node1 is a dict or tuple
        if isinstance(node1, dict):
            lat1, lon1 = node1['lat'], node1['lng']
        else:
            lat1, lon1 = node1[0], node1[1]
        lat2, lon2 = 0, 0  # fallback for single point (not really used)
    else:
        # nodes in graph
        data1 = G.nodes[node1]
        data2 = G.nodes[node2]
        lat1, lon1 = data1['y'], data1['x']
        lat2, lon2 = data2['y'], data2['x']

    R = 6371  # km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def haversine_km(point1, point2):
    """
    Compute distance in km between two lat/lng dicts.
    """
    import math
    lat1, lon1 = point1['lat'], point1['lng']
    lat2, lon2 = point2['lat'], point2['lng']

    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))