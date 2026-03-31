import type  {RouteResponse} from "../types/route";

export function explainRoute(data: RouteResponse) {
  const cmp = data.comparison;

  let reasons: string[] = [];

  if (cmp.fuel_saved > 0.2) {
    reasons.push("avoids fuel-heavy segments");
  }

  if (cmp.time_diff < 0) {
    reasons.push("reduces idling in traffic");
  } else if (cmp.time_diff > 2) {
    reasons.push("takes a slightly longer but smoother path");
  }

  if (reasons.length === 0) {
    reasons.push("balances traffic and distance efficiently");
  }

  return `This route ${reasons.join(", ")}.`;
}