"use client";
import { useMemo } from "react";
import { useLiveStore } from "@/stores/liveStore";
import { useScenarioStore } from "@/hooks/useScenarioStore";

/**
 * Estimates CO2 saved vs. private car travel based on current crowd occupancy.
 * Assumes ~2.1kg CO2/km for a car trip, 0.4kg for public transit, avg 8km stadium distance.
 * Uses the latest simulation output if available, otherwise falls back to a conservative estimate.
 */
function estimateCO2Saved(totalFans: number): number {
  const transitShare = 0.7; // ~70% of fans use transit/van (FIFA sustainability target)
  const carCO2PerFan = 2.1 * 8; // kg — car, 8km avg
  const transitCO2PerFan = 0.4 * 8; // kg — metro/bus
  return Math.round(totalFans * transitShare * (carCO2PerFan - transitCO2PerFan));
}

const TRANSPORT_ROUTES = [
  { name: "Metro Line A", accessible: false, status: "On Time", urgency: "low" },
  { name: "Bus Shuttle North", accessible: false, status: "Delayed", urgency: "medium" },
  { name: "Accessible Van Transfer", accessible: true, status: "Standby", urgency: "low" },
  { name: "Park & Ride Express", accessible: false, status: "On Time", urgency: "low" },
  { name: "Stadium Shuttle", accessible: true, status: "On Time", urgency: "low" },
] as const;

function statusColorForUrgency(urgency: string) {
  if (urgency === "high") return "bg-red-500";
  if (urgency === "medium") return "bg-amber-500";
  return "bg-emerald-500";
}

export function TransportWidget() {
  const t = useLiveStore((s) => s.t);
  const latestSimulationOutput = useScenarioStore((s) => s.latestSimulationOutput);

  const co2Saved = useMemo(() => {
    if (latestSimulationOutput) {
      const totalFans = latestSimulationOutput.phaseZoneMatrix.reduce(
        (sum, row) => sum + row.occupancyFans,
        0
      );
      return estimateCO2Saved(totalFans);
    }
    // Fall back to a conservative baseline (normal preset ~1800 fans across entry phase)
    return estimateCO2Saved(1800);
  }, [latestSimulationOutput]);

  const routes = useMemo(() => {
    const hasHighOccupancy =
      latestSimulationOutput?.phaseZoneMatrix.some((row) => row.occupancyRatio >= 0.8) ?? false;

    return TRANSPORT_ROUTES.map((route) => {
      if (!hasHighOccupancy) {
        return route;
      }

      if (route.accessible) {
        return { ...route, status: "Surge Active", urgency: "high" };
      }

      return { ...route, status: "Delayed", urgency: "high" };
    });
  }, [latestSimulationOutput]);

  return (
    <div className="bg-card border border-border p-4 rounded-lg space-y-3" role="region" aria-label="Transport and sustainability information">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">
          {t("nav.transport")} &amp; Sustainability
        </h3>
        <span
          className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded"
          aria-label={`Estimated ${co2Saved}kg CO2 saved versus private car travel`}
          title="Estimated CO₂ saved vs. car travel, based on current crowd data"
        >
          -{co2Saved}kg CO₂
        </span>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground" role="list" aria-label="Transport routes">
        {routes.map((route) => (
          <div
            key={route.name}
            className="flex justify-between p-2 bg-muted/50 rounded"
            role="listitem"
            aria-label={`${route.name}: ${route.status}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${statusColorForUrgency(route.urgency)}`}
                aria-hidden="true"
              />
              <span className="sr-only">{route.status}</span>
              <span>
                {route.name}
                {route.accessible && (
                  <span className="sr-only"> (wheelchair accessible)</span>
                )}
              </span>
            </div>
            <span className="text-foreground font-medium">
              {route.status}
              <span className="sr-only"> status</span>
            </span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-right">
        CO₂ estimate based on simulation data · Transit routes simulated
      </p>
    </div>
  );
}
