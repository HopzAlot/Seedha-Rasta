export type LatLng = { lat: number; lng: number };

export type Vehicle = {
  id: string;
  name: string;
  mileage: number;
  idle: number;
};

export type RouteResponse = {
  fuel_optimized: {
    route: LatLng[];
    fuel_cost: number;
    distance_km: number;
    time_min: number;
    cost_pkr_fuel: number;
  };
  shortest: {
    route: LatLng[];
    fuel_cost: number;
    distance_km: number;
    time_min: number;
    cost_pkr_short: number;
  };
  comparison: {
    fuel_saved: number;
    cost_saved_pkr: number;
    time_diff: number;
    distance_diff: number;
  };
};