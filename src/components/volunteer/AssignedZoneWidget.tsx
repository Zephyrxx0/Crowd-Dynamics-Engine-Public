"use client";

import { useMemo } from "react";
import { useScenarioStore } from "@/hooks/useScenarioStore";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssignedZoneWidgetProps {
  zoneId: string;
}

export function AssignedZoneWidget({ zoneId }: AssignedZoneWidgetProps) {
  const latestSimulationOutput = useScenarioStore((s) => s.latestSimulationOutput);

  const zoneData = useMemo(() => {
    if (!latestSimulationOutput) return null;
    return latestSimulationOutput.phaseZoneMatrix.find((z) => z.zoneId === zoneId || z.zoneId.startsWith(`${zoneId}:`)) || null;
  }, [latestSimulationOutput, zoneId]);

  if (!zoneData) {
    return (
      <div className="bg-card border border-border p-4 rounded-xl space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded"></div>
        <div className="h-20 bg-muted/50 rounded"></div>
      </div>
    );
  }

  const isHighRisk = zoneData.occupancyRatio >= 0.85;
  const isModerate = zoneData.occupancyRatio >= 0.65;
  const Icon = isHighRisk ? AlertTriangle : isModerate ? AlertTriangle : CheckCircle2;
  const colorClass = isHighRisk ? "text-red-500" : isModerate ? "text-amber-500" : "text-emerald-500";
  const bgClass = isHighRisk ? "bg-red-500/10" : isModerate ? "bg-amber-500/10" : "bg-emerald-500/10";

  return (
    <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            Assigned Zone
            <span className="relative flex h-2 w-2" title="Live Telemetry">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </h3>
          <div className="text-2xl font-bold text-foreground capitalize">Zone {zoneId}</div>
        </div>
        <Badge variant={isHighRisk ? "destructive" : isModerate ? "secondary" : "outline"} className={cn("uppercase tracking-wider text-[10px]", isHighRisk ? "" : colorClass)}>
          {Math.round(zoneData.occupancyRatio * 100)}% Capacity
        </Badge>
      </div>

      <div className={cn("flex items-center gap-3 p-3 rounded-lg border", bgClass, "border-" + colorClass.split("-")[1] + "-500/20")}>
        <Icon className={cn("h-5 w-5", colorClass)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {zoneData.occupancyFans} Fans Present
          </p>
          <p className="text-xs text-muted-foreground">
            Throughput: {zoneData.processedFans}/{zoneData.availableThroughput}
          </p>
        </div>
      </div>
    </div>
  );
}
