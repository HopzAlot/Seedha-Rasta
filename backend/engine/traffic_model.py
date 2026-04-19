import random

def assign_traffic(G):
    for u, v, k, data in G.edges(keys=True, data=True):
        # Simulated congestion (0 = free, 1 = heavy).
        # Keep this moderate to avoid over-inflated ETAs when no live feed exists.
        data['traffic_level'] = random.uniform(0.05, 0.60)
    return G