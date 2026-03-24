def compute_edge_cost(edge, vehicle):
    """
    Compute fuel cost for an edge using:
    - distance-based consumption
    - idle consumption from traffic
    - nonlinear penalty for congestion
    """

    # Vehicle params
    mileage = vehicle.get("mileage", 15)           # km per liter
    idle_rate = vehicle.get("idle_consumption", 0.8)  # liters per hour

    # ------------------------------
    # Distance (already in km)
    # ------------------------------
    length_km = edge.get("length", 0)

    # ------------------------------
    # Travel time (minutes → hours)
    # ------------------------------
    travel_time_hr = edge.get("travel_time", 0) / 60

    # ------------------------------
    # Traffic level (0 → 1)
    # ------------------------------
    traffic = edge.get("traffic_level", 0)

    # ------------------------------
    # Fuel components
    # ------------------------------

    # Movement fuel
    movement_fuel = length_km / mileage

    # Idle fuel (base)
    idle_fuel = travel_time_hr * traffic * idle_rate

    # 🔥 Non-linear congestion penalty (NEW)
    idle_fuel *= (1 + traffic * 0.5)

    # ------------------------------
    # Total fuel
    # ------------------------------
    total_fuel = movement_fuel + idle_fuel

    return total_fuel