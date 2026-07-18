import { presets } from "@/simulation/presets";
import { simulateDeterministic } from "@/simulation/core/simulateDeterministic";
import type { SimulationOutput } from "@/simulation/contracts/output.schema";
import type { MatchState } from "@/types/match";

type ZoneEntry = { id: string; name: string; occupancy: number; capacity: number; occupancyRatio: number };

export const ZONE_FRIENDLY_NAMES: Record<string, string> = {
  north: "North Stand",
  south: "South Stand",
  east: "East Concourse",
  west: "West Concourse",
  "zone-c": "Zone C — Gate Cluster",
};

// Module-level cache — the deterministic simulation output is pure/stable for a given preset,
// so we only need to compute it once per server process rather than on every API request.
let _zoneDataCache: ZoneEntry[] | null = null;

function deriveZoneEntries(output: SimulationOutput, capacities: Map<string, number>): ZoneEntry[] {
  return Array.from(
    output.phaseZoneMatrix
      .reduce((acc, row) => {
        if (!acc.has(row.zoneId) || row.occupancyFans > acc.get(row.zoneId)!.occupancy) {
          acc.set(row.zoneId, {
            id: row.zoneId,
            name: ZONE_FRIENDLY_NAMES[row.zoneId] ?? row.zoneId,
            occupancy: row.occupancyFans,
            capacity: capacities.get(row.zoneId) ?? Math.max(row.occupancyFans, 1),
            occupancyRatio: row.occupancyRatio,
          });
        }
        return acc;
      }, new Map<string, ZoneEntry>())
      .values()
  );
}

export function getZoneData(simOutput?: SimulationOutput): ZoneEntry[] {
  const input = presets.normal;
  const zoneCapacities = new Map(input.zones.map((z) => [z.id, z.capacity]));

  if (simOutput) return deriveZoneEntries(simOutput, zoneCapacities);
  if (_zoneDataCache) return _zoneDataCache;

  _zoneDataCache = deriveZoneEntries(simulateDeterministic(input), zoneCapacities);
  return _zoneDataCache;
}

/** Exposed for tests that need to invalidate the cache between runs */
export function _resetZoneDataCache() {
  _zoneDataCache = null;
}


export function extractMatchState(searchParams: URLSearchParams): MatchState {
  const minuteParam = searchParams.get("minute");
  return {
    minute: minuteParam ? parseInt(minuteParam, 10) : null,
    phase: (searchParams.get("phase") as MatchState["phase"]) ?? "first-half",
    score: searchParams.get("score") ?? "0-0",
    homeTeam: searchParams.get("homeTeam") ?? "Home",
    awayTeam: searchParams.get("awayTeam") ?? "Away",
  };
}
