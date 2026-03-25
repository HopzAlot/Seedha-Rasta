import osmnx as ox
import pickle
import redis
import inspect
import hashlib
import time
import networkx as nx
import numpy as np
from shapely.geometry import LineString

from .utils import get_speed, haversine_km

r = redis.Redis(host='localhost', port=6379, db=0)

# ------------------------------
# 🔐 Preprocess Signature
# ------------------------------
def get_preprocess_signature():
    combined = (
        inspect.getsource(preprocess_graph) +
        inspect.getsource(get_speed)
    )
    return hashlib.md5(combined.encode()).hexdigest()

# ------------------------------
# 🔧 Preprocess Graph
# ------------------------------
def preprocess_graph(G):
    for u, v, key, data in G.edges(keys=True, data=True):
        length_m = data.get("length", 1)
        length_km = length_m / 1000
        speed_kph = get_speed(data)
        travel_time = (length_km / speed_kph) * 60

        data["speed_kph"] = speed_kph
        data["travel_time"] = travel_time

    G.graph["preprocess_signature"] = get_preprocess_signature()
    G.graph["created_at"] = time.time()
    return G

# ------------------------------
# 🔧 Normalize Graph Nodes
# ------------------------------
def normalize_graph_nodes(G):
    mapping = {}
    for node in G.nodes:
        if isinstance(node, (list, np.ndarray)):
            mapping[node] = int(node[0])
        elif isinstance(node, tuple):
            if len(node) == 1:
                mapping[node] = node[0]
            else:
                mapping[node] = tuple(
                    int(n) if isinstance(n, (np.integer, float)) else n for n in node
                )
        elif isinstance(node, np.integer):
            mapping[node] = int(node)
        else:
            mapping[node] = node

    if mapping:
        G = nx.relabel_nodes(G, mapping, copy=True)
    return G

# ------------------------------
# 📦 Cache Key (Corridor)
# ------------------------------
def get_corridor_cache_key(start, end, width):
    return f"graph:corridor:{round(start['lat'],3)}:{round(start['lng'],3)}:{round(end['lat'],3)}:{round(end['lng'],3)}:{round(width,3)}"

# ------------------------------
# 🧠 Build Corridor Polygon
# ------------------------------
def build_corridor(start, end, width):
    line = LineString([
        (start["lng"], start["lat"]),
        (end["lng"], end["lat"])
    ])
    return line.buffer(width)

# ------------------------------
# 🌍 Core Loader (Corridor + Expansion)
# ------------------------------
def load_graph(start: dict, end: dict):
    
    distance_km = haversine_km(start, end)

    # Initial corridor width
    base_width = max(0.01, min(0.03, distance_km * 0.1))

    # Progressive expansion multipliers
    expansion_steps = [1, 2, 3]  # grows corridor each retry

    for step in expansion_steps:
        width = base_width * step
        cache_key = get_corridor_cache_key(start, end, width)

        # ------------------------------
        # 🔁 Cache
        # ------------------------------
        cached = r.get(cache_key)
        if cached:
            print(f"[osm_loader] Cache hit (width={width})")
            G = pickle.loads(cached)
            G.graph["cache_status"] = "Loaded from cache"
            return normalize_graph_nodes(G)

        print(f"[osm_loader] Fetching corridor graph (width={width})")

        corridor = build_corridor(start, end, width)

        try:
            G = ox.graph_from_polygon(
                corridor,
                network_type="drive",
                simplify=True
            )
        except Exception as e:
            print(f"[osm_loader] Failed (drive): {e}")
            try:
                G = ox.graph_from_polygon(
                    corridor,
                    network_type="all",
                    simplify=True
                )
            except Exception:
                continue  # try next expansion

        # ------------------------------
        # Validate graph
        # ------------------------------
        if len(G.nodes) == 0:
            print("[osm_loader] Empty graph → expanding corridor")
            continue

        # ------------------------------
        # Process + Cache
        # ------------------------------
        G = normalize_graph_nodes(G)
        G = preprocess_graph(G)
        print("after preprocess")

        r.set(cache_key, pickle.dumps(G))
        print(f"[osm_loader] Cached graph (width={width})")

        return G

    # ------------------------------
    # 🚨 FINAL FALLBACK (BBox)
    # ------------------------------
    print("[osm_loader] Corridor failed → fallback bbox")

    padding = 0.05
    lat_min = min(start["lat"], end["lat"]) - padding
    lat_max = max(start["lat"], end["lat"]) + padding
    lng_min = min(start["lng"], end["lng"]) - padding
    lng_max = max(start["lng"], end["lng"]) + padding

    G = ox.graph_from_bbox(
        (lat_min, lat_max, lng_min, lng_max),
        network_type="drive",
        simplify=True
    )

    G = normalize_graph_nodes(G)
    G = preprocess_graph(G)

    return G