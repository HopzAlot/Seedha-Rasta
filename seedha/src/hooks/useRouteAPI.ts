import { useState } from "react";
import type { LatLng, Vehicle, RouteResponse } from "../types/route";

const API = "http://localhost:8000/api/route/optimize/";

export function useRouteAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRoutes(
    source: LatLng,
    destination: LatLng,
    vehicle: Vehicle
  ) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: source,
          end: destination,
          vehicle: {
            mileage: vehicle.mileage,
            idle_consumption: vehicle.idle,
          },
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data: RouteResponse = await res.json();
      setLoading(false);
      return data;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }

  return { fetchRoutes, loading, error };
}