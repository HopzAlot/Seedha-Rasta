from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import VehicleProfile
from .serializer import VehicleProfileSerializer, OptimizeRouteSerializer

from engine.osm_loader import load_graph
from engine.node_mapper import get_nearest_node
from engine.traffic_model import assign_traffic
from engine.pathfinder import fuel_optimized_path, shortest_path
from engine.utils import nodes_to_coordinates, compute_path_fuel

import copy
import time

# ------------------------------
# Vehicle CRUD
# ------------------------------
class VehicleProfileViewSet(viewsets.ModelViewSet):
    queryset = VehicleProfile.objects.all()
    serializer_class = VehicleProfileSerializer

# ------------------------------
# Route Optimization API
# ------------------------------
class OptimizeRouteAPIView(APIView):

    def post(self, request):
        serializer = OptimizeRouteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        start = data.get("start")
        end = data.get("end")
        city_name = data.get("city", "Lahore, Pakistan")

        # ------------------------------
        # Vehicle handling
        # ------------------------------
        vehicle_id = data.get("vehicle_id")
        if vehicle_id:
            try:
                vehicle_obj = VehicleProfile.objects.get(id=vehicle_id)
                vehicle = {
                    "mileage": vehicle_obj.mileage,
                    "idle_consumption": vehicle_obj.idle_consumption
                }
            except VehicleProfile.DoesNotExist:
                return Response({"error": "Vehicle not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            vehicle = {
                "mileage": data.get("mileage", 15),
                "idle_consumption": data.get("idle_consumption", 0.8)
            }

        lat_start, lng_start = float(start['lat']), float(start['lng'])
        lat_end, lng_end = float(end['lat']), float(end['lng'])

        # ------------------------------
        # 🔥 Step 1: Load OSM graph 
        # ------------------------------
        print("hello 1")
        G = load_graph(start, end)
        G = copy.deepcopy(G)  # avoid mutating cached graph
        print("hello 2")
        # ------------------------------
        # 🔥 Step 2: Assign traffic (simulated)
        # ------------------------------
        G = assign_traffic(G)

        # ------------------------------
        # 🔹 Step 3: Map coordinates to graph nodes
        # ------------------------------
        source = get_nearest_node(G, lat_start, lng_start)
        target = get_nearest_node(G, lat_end, lng_end)

        if source is None or target is None:
            return Response({"error": "Could not map coordinates to graph nodes"}, status=400)

        # ------------------------------
        # 🔥 Step 4: Compute routes
        # ------------------------------
        fuel_cost, fuel_dist, fuel_time, fuel_path = fuel_optimized_path(G, source, target, vehicle)
        short_dist, short_time, short_path = shortest_path(G, source, target)
        short_fuel_cost = compute_path_fuel(G, short_path, vehicle)

        if not fuel_path or fuel_cost == float('inf'):
            return Response({"error": "No route found between given points"}, status=400)

        # ------------------------------
        # 🔹 Step 5: Convert paths to coordinates
        # ------------------------------
        fuel_coords = nodes_to_coordinates(G, fuel_path)
        short_coords = nodes_to_coordinates(G, short_path)

        # ------------------------------
        # 🔹 Step 6: Cache/metadata info
        # ------------------------------
        created_at = G.graph.get("created_at")
        place_meta = G.graph.get("place", city_name)
        cache_status = f"Graph loaded for {place_meta} (created at {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(created_at))})"

        # ------------------------------
        # 🔹 Step 7: Response
        # ------------------------------
        return Response({
            "fuel_optimized": {
                "fuel_cost": round(fuel_cost, 3),
                "distance_km": round(fuel_dist, 2),
                "time_min": round(fuel_time, 2),
                "route": fuel_coords,
            },
            "shortest": {
                "fuel_cost": round(short_fuel_cost, 3),
                "distance_km": round(short_dist, 2),
                "time_min": round(short_time, 2),
                "route": short_coords,
            },
            "comparison": {
                "fuel_saved": round(short_fuel_cost - fuel_cost, 3),
                "time_diff": round(short_time - fuel_time, 2),
                "distance_diff": round(short_dist - fuel_dist, 2)
            },
            "cache_status": cache_status,
        }, status=status.HTTP_200_OK)