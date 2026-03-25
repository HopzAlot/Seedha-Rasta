def compute_edge_cost(edge, vehicle):
    """
    Pakistan-optimized fuel model:
    - Correct unit handling
    - Stop-go traffic modeling
    - Signal/junction penalties
    - Aggressive congestion scaling
    """

    # ------------------------------
    # Vehicle params
    # ------------------------------
    mileage = vehicle.get("mileage", 15)             # km per liter
    idle_rate = vehicle.get("idle_consumption", 0.8) # liters per hour

    # ------------------------------
    # Edge data
    # ------------------------------
    length_km = edge.get("length", 0) / 1000
    travel_time_hr = edge.get("travel_time", 0) / 60
    traffic = edge.get("traffic_level", 0)

    highway = edge.get("highway", "residential")
    if isinstance(highway, list):
        highway = highway[0]

    # ------------------------------
    # 1. Movement fuel
    # ------------------------------
    movement_fuel = length_km / mileage

    # ------------------------------
    # 2. Stop-go idle modeling (CRITICAL)
    # ------------------------------
    # Instead of linear idle, simulate bursts
    stop_go_factor = traffic ** 2.2   # sharp increase after ~0.5
    idle_time = travel_time_hr * stop_go_factor

    idle_fuel = idle_time * idle_rate

    # ------------------------------
    # 3. Road-type penalties (Pakistan behavior)
    # ------------------------------
    if highway in ["primary", "secondary"]:
        # signals, buses, bottlenecks
        road_penalty = 1.3
    elif highway in ["tertiary"]:
        road_penalty = 1.15
    elif highway in ["residential"]:
        # slow but smoother → less stop-go
        road_penalty = 0.95
    else:
        road_penalty = 1.1

    idle_fuel *= road_penalty

    # ------------------------------
    # 4. Intersection / signal penalty
    # ------------------------------
    # crude but effective proxy
    if edge.get("junction") or edge.get("highway") in ["primary", "secondary"]:
        signal_delay = 0.002 * (1 + traffic * 3)  # liters
    else:
        signal_delay = 0

    # ------------------------------
    # 5. Nonlinear congestion explosion
    # ------------------------------
    if traffic > 0.6:
        idle_fuel *= (1 + (traffic - 0.6) * 3)

    # ------------------------------
    # 6. Total fuel
    # ------------------------------
    total_fuel = movement_fuel + idle_fuel + signal_delay

    return total_fuel