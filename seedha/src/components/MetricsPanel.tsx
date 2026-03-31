import { explainRoute } from "../utils/explainRoute";
import { fuelBreakdown } from "../utils/fuelBreakdown";

export default function MetricsPanel({ data }: any) {
  const explanation = explainRoute(data);
  const fuel = fuelBreakdown(data.fuel_optimized);

  return (
    <div className="bg-gray-900 p-4 rounded-lg space-y-3">
      <div>Fuel: {data.fuel_optimized.fuel_cost.toFixed(2)} L</div>
      <div>Distance: {data.fuel_optimized.distance_km} km</div>

      <div className="text-sm text-gray-400">
        Moving: {fuel.moving.toFixed(2)}L | Idle: {fuel.idle.toFixed(2)}L
      </div>

      <div className="text-sm text-gray-300">
        <strong>Why?</strong> {explanation}
      </div>
    </div>
  );
}