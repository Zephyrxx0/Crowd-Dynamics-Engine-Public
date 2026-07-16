"use client";

import { useMemo } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ComparisonPanel } from "@/comparison/components/ComparisonPanel"
import { useScenarioStore } from "@/hooks/useScenarioStore"
import { RiskReportPanel } from "@/reporting/components/RiskReportPanel"
import { buildVisualizationModel } from "@/visualization/selectors/buildVisualizationModel"
import { ChartRevealShell } from "./ChartRevealShell"
import { RiskLegend } from "./RiskLegend"
import { RiskLineChart } from "./RiskLineChart"
import { StadiumHeatmap } from "./StadiumHeatmap"
import { WorkspaceKinoProgress } from "./WorkspaceKinoProgress"
import ThreeStadium from "@/components/three-stadium"

export function VisualizationWorkspace({ activeTab }: { activeTab?: string }) {
  const latestSimulationOutput = useScenarioStore((state) => state.latestSimulationOutput)

  const model = useMemo(() => {
    if (!latestSimulationOutput) {
      return null
    }

    return buildVisualizationModel(latestSimulationOutput)
  }, [latestSimulationOutput])

  if (!latestSimulationOutput || !model) {
    return (
      <section data-testid="visualization-workspace" className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-white uppercase">Workspace</h2>
        <Alert data-testid="visualization-empty-state" className="rounded-none border-border">
          <AlertTitle>Run a scenario to populate visual telemetry</AlertTitle>
          <AlertDescription>
            Execute a valid simulation from the config panel.
          </AlertDescription>
        </Alert>

        {activeTab === "report" && <RiskReportPanel />}
      </section>
    )
  }

  return (
    <section data-testid="visualization-workspace" className="space-y-6">
      {activeTab === "simulate" && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <WorkspaceKinoProgress>
            <h2 className="text-xl font-bold uppercase tracking-tight text-primary">Live Telemetry</h2>
            <p className="text-sm text-muted-foreground">Compare zone risk progression and current heat concentration.</p>
          </WorkspaceKinoProgress>

          <Separator className="bg-border" />

          {/* Complex 3D Stadium Visualization */}
          <div className="w-full h-[500px] border border-border bg-card relative">
             <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-black/80 border border-primary/40 text-xs font-mono text-primary shadow-[0_0_10px_rgba(236,78,2,0.3)]">
               LIVE 3D RENDER
             </div>
             <ThreeStadium />
          </div>

          <ChartRevealShell label="Risk progression over time" className="rounded-none border border-border bg-card p-4 shadow-xl">
            <RiskLineChart output={latestSimulationOutput} />
          </ChartRevealShell>

          <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <div className="rounded-none border border-border bg-card p-4 shadow-xl">
              <StadiumHeatmap latestZoneRisk={model.latestZoneRisk} />
            </div>
            <RiskLegend />
          </div>
        </div>
      )}

      {activeTab === "compare" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <ComparisonPanel />
        </div>
      )}

      {activeTab === "report" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <RiskReportPanel />
        </div>
      )}

      {activeTab === "deploy" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-none border border-border bg-card p-8 text-sm text-muted-foreground shadow-xl">
          <h2 className="text-xl font-bold tracking-tight text-white uppercase mb-4">Deployment Surface</h2>
          <p>
            This flow is deployment-ready for Cloud Run static hosting. Use the deployment runbook to publish the latest build while preserving
            deterministic simulation behavior.
          </p>
        </div>
      )}
    </section>
  )
}