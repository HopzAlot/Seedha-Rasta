import random

def assign_traffic(G):
    for u, v, k, data in G.edges(keys=True, data=True):
        # Simulated congestion (0 = free, 1 = heavy)
        data['traffic_level'] = random.uniform(0.2, 0.8)
    return G