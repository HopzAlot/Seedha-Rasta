export function fuelBreakdown(route: any) {
  const moving = route.distance_km / 15;
  const idle = route.fuel_cost - moving;

  return { moving, idle };
}