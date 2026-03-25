import heapq
from .cost_function import compute_edge_cost
from .utils import haversine_distance
import networkx as nx

# ------------------------------
# Fuel-Optimized Path (A* search)
# ------------------------------
def fuel_optimized_path(G, source, target, vehicle):
    pq = [(0, 0, 0, 0, source)]
    visited = set()
    parent = {source: None}
    g_cost = {source: 0}
    distance_map = {source: 0}
    time_map = {source: 0}

    while pq:
        f_score, fuel_cost, dist, time_min, node = heapq.heappop(pq)
        if node in visited:
            continue
        visited.add(node)
        if node == target:
            path = []
            curr = target
            while curr is not None:
                path.append(curr)
                curr = parent[curr]
            path.reverse()
            fuel_price = vehicle.get("fuel_price", 280)
            cost_pkr = fuel_cost * fuel_price
            return fuel_cost, cost_pkr, dist, time_min, path

        for neighbor in G.neighbors(node):
            edges = G.get_edge_data(node, neighbor)
            if not edges:
                continue

            best_edge = min(edges.values(), key=lambda e: compute_edge_cost(e, vehicle))
            edge_cost = compute_edge_cost(best_edge, vehicle)
            length_km = best_edge.get('length', 1) / 1000
            traffic = best_edge.get("traffic_level", 0)
            edge_time = best_edge["travel_time"] * (1 + traffic)

            new_cost = fuel_cost + edge_cost
            new_dist = dist + length_km
            new_time = time_min + edge_time

            h_dist = haversine_distance(G, neighbor, target)
            mileage = vehicle.get("mileage", 15)
            idle_rate = vehicle.get("idle_consumption", 0.2)
            avg_speed = 45
            traffic_factor = 0.4
            travel_time = h_dist / avg_speed
            idle_time = travel_time * traffic_factor
            h = (h_dist / mileage) + (idle_time * idle_rate)

            if neighbor not in g_cost or new_cost < g_cost[neighbor]:
                g_cost[neighbor] = new_cost
                distance_map[neighbor] = new_dist
                time_map[neighbor] = new_time
                parent[neighbor] = node
                heapq.heappush(pq, (new_cost + h, new_cost, new_dist, new_time, neighbor))

    return float('inf'), float('inf'), float('inf'), []

# ------------------------------
# Shortest Distance Path (A* search)
# ------------------------------
def shortest_path(G, source, target):
    pq = [(0, 0, 0, source)]
    visited = set()
    parent = {source: None}
    dist_map = {source: 0}
    time_map = {source: 0}

    while pq:
        f_score, dist, time_min, node = heapq.heappop(pq)
        if node in visited:
            continue
        visited.add(node)
        if node == target:
            path = []
            curr = target
            while curr is not None:
                path.append(curr)
                curr = parent[curr]
            path.reverse()
            return dist, time_min, path

        for neighbor in G.neighbors(node):
            edges = G.get_edge_data(node, neighbor)
            if not edges:
                continue
            best_edge = min(edges.values(), key=lambda e: e.get('length', 1))
            length_km = best_edge.get('length', 1) / 1000
            traffic = best_edge.get("traffic_level", 0)
            edge_time = best_edge["travel_time"] * (1 + traffic)

            new_dist = dist + length_km
            new_time = time_min + edge_time

            if neighbor not in dist_map or new_dist < dist_map[neighbor]:
                dist_map[neighbor] = new_dist
                time_map[neighbor] = new_time
                parent[neighbor] = node
                h = haversine_distance(G, neighbor, target)
                heapq.heappush(pq, (new_dist + h, new_dist, new_time, neighbor))

    return float('inf'), float('inf'), []