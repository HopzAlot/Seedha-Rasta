import requests
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import VehicleProfile
from .serializer import VehicleProfileSerializer, OptimizeRouteSerializer
from engine.osm_loader import load_route_from_tomtom, TOMTOM_KEY
from engine.pathfinder import fuel_optimized_multi_route, compare_routes
from engine.utils import snap_to_road

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
                return Response({"error": "Vehicle not found"}, status=404)
        else:
            vehicle = {
                "mileage": data.get("mileage", 15),
                "idle_consumption": data.get("idle_consumption", 0.8)
            }

        lat_start, lng_start = float(start['lat']), float(start['lng'])
        lat_end, lng_end = float(end['lat']), float(end['lng'])

        # ------------------------------
        # 🔥 Step 1: Load routes from TomTom
        # ------------------------------
        try:
            route_data = load_route_from_tomtom((lat_start, lng_start), (lat_end, lng_end))
            if not route_data.get("routes"):
                raise ValueError("No routes found")
        except Exception as e:
            print(f"[route] Initial route fetch failed: {e}")
            # ------------------------------
            # 🔁 Snap coordinates and retry
            # ------------------------------
            lat_start, lng_start = snap_to_road(lat_start, lng_start)
            lat_end, lng_end = snap_to_road(lat_end, lng_end)
            route_data = load_route_from_tomtom((lat_start, lng_start), (lat_end, lng_end))
            if not route_data.get("routes"):
                return Response({"error": "No routes found even after snapping to roads"}, status=400)

        # ------------------------------
        # 🔥 Step 2: Multi-route fuel optimization
        # ------------------------------
        result = fuel_optimized_multi_route(route_data, vehicle)
        best = result.get("best_route")
        if not best:
            return Response({"error": "Optimization failed"}, status=400)

        # ------------------------------
        # 🔥 Step 3: Comparison
        # ------------------------------
        comparisons = compare_routes(route_data, vehicle)

        # ------------------------------
        # 🔥 Step 4: Response formatting
        # ------------------------------
        def format_route(path):
            return [{"lat": pt["lat"], "lng": pt["lng"]} for pt in path]

        return Response({
            "fuel_optimized": {
                "fuel_cost": round(best["fuel_cost"], 3),
                "distance_km": round(best["distance_km"], 2),
                "time_min": round(best["time_min"], 2),
                "route": format_route(best["path"])
            },
            "alternatives": [
                {
                    "route_index": r["route_index"],
                    "fuel_cost": round(r["fuel_cost"], 3),
                    "distance_km": round(r["distance_km"], 2),
                    "time_min": round(r["time_min"], 2),
                    "route": format_route(r["path"])
                } for r in result["all_routes"]
            ],
            "comparison": [
                {
                    "route_index": c["route_index"],
                    "fuel": round(c["fuel"], 3),
                    "distance": round(c["distance"], 2),
                    "time": round(c["time"], 2)
                } for c in comparisons
            ]
        }, status=200)