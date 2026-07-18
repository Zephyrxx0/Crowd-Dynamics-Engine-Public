"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Leaf, Train } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useScenarioStore } from "@/hooks/useScenarioStore";
import { useLiveStore } from "@/stores/liveStore";

type SustainabilityData = {
  co2KgTotal: number;
  greenScore: number;
  recommendations: string[];
  transportTips: string[];
};

export function SustainabilityPanel() {
  const t = useLiveStore((s) => s.t);
  const latestSimulationOutput = useScenarioStore((s) => s.latestSimulationOutput);
  const [sustainabilityData, setSustainabilityData] = useState<SustainabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!latestSimulationOutput) {
      setSustainabilityData(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch("/api/sustainability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zoneMatrix: latestSimulationOutput.phaseZoneMatrix,
        phaseData: latestSimulationOutput.peakSummaries,
      }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Sustainability API returned ${response.status}`);
        }
        return response.json() as Promise<SustainabilityData>;
      })
      .then((data) => setSustainabilityData(data))
      .catch((caughtError) => {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
          return;
        }
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load sustainability data");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [latestSimulationOutput]);

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3 text-sm font-semibold uppercase tracking-widest">
          <span className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-emerald-500" />
            {t("dashboard.sustainability_score")}
          </span>
          {sustainabilityData && <Badge className="bg-emerald-500 text-white">{sustainabilityData.greenScore}/100</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!latestSimulationOutput && (
          <p className="text-sm text-muted-foreground">Run a scenario to generate sustainability recommendations.</p>
        )}

        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {sustainabilityData && !loading && (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded bg-background/70 p-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">CO₂ impact</p>
                <p className="text-2xl font-bold">{sustainabilityData.co2KgTotal}kg</p>
              </div>
              <div className="rounded bg-background/70 p-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Green score</p>
                <p className="text-2xl font-bold text-emerald-500">{sustainabilityData.greenScore}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Leaf className="h-3.5 w-3.5" />
                Recommendations
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {sustainabilityData.recommendations.slice(0, 3).map((recommendation) => (
                  <li key={recommendation}>• {recommendation}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Train className="h-3.5 w-3.5" />
                Transit tips
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {sustainabilityData.transportTips.slice(0, 3).map((tip) => (
                  <li key={tip}>• {tip}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
