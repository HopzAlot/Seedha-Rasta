from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response

from django.db import transaction

from .models import VehicleProfile, History
from .serializer import VehicleProfileSerializer, OptimizeRouteSerializer, HistorySerializer

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

        start = data["start"]
        end = data["end"]
        city_name = data.get("city", "Couldn't determine city")

        # ------------------------------
        # 🚗 Vehicle Handling
        # ------------------------------
        vehicle_id = data.get("vehicle_id")

        if vehicle_id:
            try:
                vehicle_obj = VehicleProfile.objects.get(id=vehicle_id)
                vehicle = {
                    "mileage": vehicle_obj.mileage,
                    "idle_consumption": vehicle_obj.idle_consumption,
                    "fuel_price": getattr(vehicle_obj, "fuel_price", 458),
                }
            except VehicleProfile.DoesNotExist:
                return Response({"error": "Vehicle not found"}, status=404)
        else:
            vehicle = {
                "mileage": data.get("mileage", 15),
                "idle_consumption": data.get("idle_consumption", 0.8),
                "fuel_price": data.get("fuel_price", 458),
            }

        lat_start, lng_start = float(start["lat"]), float(start["lng"])
        lat_end, lng_end = float(end["lat"]), float(end["lng"])

        # ------------------------------
        # 🗺️ Load Graph
        # ------------------------------
        G = copy.deepcopy(load_graph(start, end))

        # ------------------------------
        # 🚦 Assign Traffic
        # ------------------------------
        G = assign_traffic(G)

        # ------------------------------
        # 📍 Map to Nodes
        # ------------------------------
        source = get_nearest_node(G, lat_start, lng_start)
        target = get_nearest_node(G, lat_end, lng_end)

        if source is None or target is None:
            return Response({"error": "Could not map coordinates to graph nodes"}, status=400)

        # ------------------------------
        # 🧠 Compute Routes
        # ------------------------------
        fuel_cost, cost_pkr, fuel_dist, fuel_time, fuel_path = fuel_optimized_path(
            G, source, target, vehicle
        )

        short_dist, short_time, short_path = shortest_path(G, source, target)
        short_fuel_cost = compute_path_fuel(G, short_path, vehicle)

        if not fuel_path or fuel_cost == float("inf"):
            return Response({"error": "No route found between given points"}, status=400)

        # ------------------------------
        # 📍 Convert to Coordinates
        # ------------------------------
        fuel_coords = nodes_to_coordinates(G, fuel_path)
        short_coords = nodes_to_coordinates(G, short_path)

        # ------------------------------
        # 📊 Precompute Metrics
        # ------------------------------
        fuel_price = vehicle["fuel_price"]

        fuel_saved = round(short_fuel_cost - fuel_cost, 3)
        cost_saved = round(fuel_saved * fuel_price, 2)
        time_saved = round(short_time - fuel_time, 2)
        distance_saved = round(short_dist - fuel_dist, 2)

        # ------------------------------
        # 🧾 Cache Metadata
        # ------------------------------
        created_at = G.graph.get("created_at", time.time())
        place_meta = G.graph.get("place", city_name)
        cache_flag = G.graph.get("cache_status", "Not cached")

        cache_status = (
            f"{cache_flag} | Graph: {place_meta} | "
            f"{time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(created_at))}"
        )

        # ------------------------------
        # 💾 Save to DB (Atomic)
        # ------------------------------
        with transaction.atomic():
            History.objects.create(
                start_lat=lat_start,
                start_lng=lng_start,
                end_lat=lat_end,
                end_lng=lng_end,
                city=city_name,

                mileage=vehicle["mileage"],
                idle_consumption=vehicle["idle_consumption"],
                fuel_price=fuel_price,

                fuel_route=fuel_coords,
                shortest_route=short_coords,

                fuel_cost=round(fuel_cost, 3),
                fuel_distance=round(fuel_dist, 2),
                fuel_time=round(fuel_time, 2),
                fuel_cost_pkr=round(cost_pkr, 2),

                shortest_fuel_cost=round(short_fuel_cost, 3),
                shortest_distance=round(short_dist, 2),
                shortest_time=round(short_time, 2),
                shortest_cost_pkr=round(short_fuel_cost * fuel_price, 2),

                fuel_saved=fuel_saved,
                cost_saved=cost_saved,
                time_saved=time_saved,
                distance_saved=distance_saved,

                cache_status=cache_status
            )

        # ------------------------------
        # 📤 Response
        # ------------------------------
        response = {
            "fuel_optimized": {
                "fuel_cost": round(fuel_cost, 3),
                "cost_pkr_fuel": round(cost_pkr, 2),
                "distance_km": round(fuel_dist, 2),
                "time_min": round(fuel_time, 2),
                "route": fuel_coords,
            },
            "shortest": {
                "fuel_cost": round(short_fuel_cost, 3),
                "cost_pkr_short": round(short_fuel_cost * fuel_price, 2),
                "distance_km": round(short_dist, 2),
                "time_min": round(short_time, 2),
                "route": short_coords,
            },
            "comparison": {
                "fuel_saved": fuel_saved,
                "cost_saved_pkr": cost_saved,
                "time_diff": time_saved,
                "distance_diff": distance_saved,
            },
            "cache_status": cache_status,
        }

        return Response(response, status=status.HTTP_200_OK)
    
class HistoryAPIView(APIView):
    def get(self,request):
        history=History.objects.all().order_by('-created_at')[:10]
        serializer=HistorySerializer(history,many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)