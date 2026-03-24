import osmnx as ox
import numpy as np

def get_nearest_node(G, lat, lng):
    node = ox.distance.nearest_nodes(G, X=lng, Y=lat)

    # Ensure node is a scalar hashable type
    if isinstance(node, (list, tuple, np.ndarray)):
        node = node[0]  # take the first element
    node = int(node)  # convert to int in case it's a NumPy type

    return node