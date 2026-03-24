# ------------------------------
# Fuel-Optimized Path (A* search for TomTom routes)
# ------------------------------
import heapq
from .cost_function import compute_edge_cost
from .utils import haversine_distance

# ------------------------------
# Fuel-Optimized Path
# ------------------------------
def fuel_optimized_path(route_points, vehicle):
    """
    Fuel-optimized path using TomTom route + traffic.
    """
    n = len(route_points)
    if n == 0:
        return float('inf'), 0, 0, []

    pq = [(0, 0, 0, 0, 0)]
    visited = set()
    parent = {0: None}
    g_cost = {0: 0}
    dist_map = {0: 0}
    time_map = {0: 0}

    # Precompute remaining distances (for A*)
    remaining_distances = [0] * n
    for i in range(n - 2, -1, -1):
        remaining_distances[i] = (
            remaining_distances[i + 1]
            + haversine_distance(
                (route_points[i]["lat"], route_points[i]["lng"]),
                (route_points[i + 1]["lat"], route_points[i + 1]["lng"])
            )
        )

    while pq:
        f_score, fuel_cost, dist_km, time_min, idx = heapq.heappop(pq)

        if idx in visited:
            continue
        visited.add(idx)

        if idx == n - 1:
            path = []
            curr = idx
            while curr is not None:
                path.append(route_points[curr])
                curr = parent[curr]
            path.reverse()
            return fuel_cost, dist_km, time_min, path

        if idx + 1 < n:
            node = route_points[idx]
            neighbor = route_points[idx + 1]

            # ------------------------------
            # Edge computations
            # ------------------------------
            edge_length_km = haversine_distance(
                (node["lat"], node["lng"]),
                (neighbor["lat"], neighbor["lng"])
            )

            # Smooth travel time (avoid spikes)
            t1 = node.get("travel_time", 1)
            t2 = neighbor.get("travel_time", 1)
            edge_time = max((t1 + t2) / 2, 0.1)

            # Smooth traffic (important!)
            tr1 = node.get("traffic_level", 0)
            tr2 = neighbor.get("traffic_level", 0)
            traffic_level = (tr1 + tr2) / 2

            edge_data = {
                "length": edge_length_km,
                "travel_time": edge_time,
                "traffic_level": traffic_level
            }

            edge_cost = compute_edge_cost(edge_data, vehicle)

            new_cost = fuel_cost + edge_cost
            new_dist = dist_km + edge_length_km
            new_time = time_min + edge_time

            # Heuristic (fuel estimate)
            h = remaining_distances[idx + 1] / vehicle.get("mileage", 15)

            if idx + 1 not in g_cost or new_cost < g_cost[idx + 1]:
                g_cost[idx + 1] = new_cost
                dist_map[idx + 1] = new_dist
                time_map[idx + 1] = new_time
                parent[idx + 1] = idx

                heapq.heappush(
                    pq,
                    (new_cost + h, new_cost, new_dist, new_time, idx + 1)
                )

    return float('inf'), float('inf'), float('inf'), []


# ------------------------------
# Shortest Distance Path
# ------------------------------
def shortest_path(route_points):
    """
    Shortest path (distance only, traffic ignored)
    """
    n = len(route_points)
    if n == 0:
        return 0, 0, []

    pq = [(0, 0, 0, 0)]
    visited = set()
    parent = {0: None}
    dist_map = {0: 0}
    time_map = {0: 0}

    # Precompute remaining distances
    remaining_distances = [0] * n
    for i in range(n - 2, -1, -1):
        remaining_distances[i] = (
            remaining_distances[i + 1]
            + haversine_distance(
                (route_points[i]["lat"], route_points[i]["lng"]),
                (route_points[i + 1]["lat"], route_points[i + 1]["lng"])
            )
        )

    while pq:
        f_score, dist_km, time_min, idx = heapq.heappop(pq)

        if idx in visited:
            continue
        visited.add(idx)

        if idx == n - 1:
            path = []
            curr = idx
            while curr is not None:
                path.append(route_points[curr])
                curr = parent[curr]
            path.reverse()
            return dist_km, time_min, path

        if idx + 1 < n:
            node = route_points[idx]
            neighbor = route_points[idx + 1]

            edge_length_km = haversine_distance(
                (node["lat"], node["lng"]),
                (neighbor["lat"], neighbor["lng"])
            )

            # Smooth time
            t1 = node.get("travel_time", 1)
            t2 = neighbor.get("travel_time", 1)
            edge_time = max((t1 + t2) / 2, 0.1)

            new_dist = dist_km + edge_length_km
            new_time = time_min + edge_time

            h = remaining_distances[idx + 1]

            if idx + 1 not in dist_map or new_dist < dist_map[idx + 1]:
                dist_map[idx + 1] = new_dist
                time_map[idx + 1] = new_time
                parent[idx + 1] = idx

                heapq.heappush(
                    pq,
                    (new_dist + h, new_dist, new_time, idx + 1)
                )

    return float('inf'), float('inf'), []


# ------------------------------
# Multi-route & Comparison
# ------------------------------
def fuel_optimized_multi_route(route_data, vehicle):
    best_result = None
    best_fuel = float('inf')
    all_results = []

    for idx, route in enumerate(route_data.get("routes", [])):
        points = route.get("points", [])
        if not points:
            continue

        fuel, dist, time, path = fuel_optimized_path(points, vehicle)

        result = {
            "route_index": idx,
            "fuel_cost": fuel,
            "distance_km": dist,
            "time_min": time,
            "path": path
        }

        all_results.append(result)

        if fuel < best_fuel:
            best_fuel = fuel
            best_result = result

    return {
        "best_route": best_result,
        "all_routes": sorted(all_results, key=lambda x: x["fuel_cost"])
    }


def compare_routes(route_data, vehicle):
    comparisons = []

    for idx, route in enumerate(route_data.get("routes", [])):
        points = route.get("points", [])
        if not points:
            continue

        fuel, dist, time, _ = fuel_optimized_path(points, vehicle)

        comparisons.append({
            "route_index": idx,
            "fuel": fuel,
            "distance": dist,
            "time": time
        })

    return sorted(comparisons, key=lambda x: x["fuel"])