import type { SimulationInput } from "@/simulation/contracts/input.schema";

export function applyPhaseTransitionDeltas(
  base: SimulationInput,
  eventType: string,
  zoneDeltas?: { zoneId: string; deltaPercent: number }[]
): SimulationInput {
  const clone: SimulationInput = JSON.parse(JSON.stringify(base));

  if (eventType === "goal" && zoneDeltas && zoneDeltas.length > 0) {
    clone.arrivals = clone.arrivals.map((arrival) => {
      const delta = zoneDeltas.find((zd) => zd.zoneId === arrival.zoneId);
      if (delta) {
        return {
          ...arrival,
          demandFans: Math.round(arrival.demandFans * (1 + delta.deltaPercent / 100)),
        };
      }
      return arrival;
    });
  } else if (eventType === "halftime") {
    // Halftime reduces all zone capacities by 10%
    clone.zones = clone.zones.map((zone) => ({
      ...zone,
      capacity: Math.round(zone.capacity * 0.9),
    }));
  } else if (eventType === "full-time") {
    // Full-time reduces all demandFans by 80%
    clone.arrivals = clone.arrivals.map((arrival) => ({
      ...arrival,
      demandFans: Math.round(arrival.demandFans * 0.2),
    }));
  }
  // kickoff and second-half-start return unmodified clone

  return clone;
}
