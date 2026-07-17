"use client";

import { useMemo } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ComparisonPanel } from "@/comparison/components/ComparisonPanel"
import { useScenarioStore } from "@/hooks/useScenarioStore"
import { RiskReportPanel } from "@/reporting/components/RiskReportPanel"
import { buildVisualizationModel } from "@/visualization/selectors/buildVisualizationModel"
import { ChartRevealShell } from "./ChartRevealShell"
import { RiskLegend } from "./RiskLegend"
import { RiskLineChart } from "./RiskLineChart"
import { StadiumHeatmap } from "./StadiumHeatmap"

import ThreeStadium from "@/components/three-stadium"

const VISUAL_SIZE = "aspect-square max-w-[600px] w-full"

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
        <div className="flex flex-col h-full w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Tabs defaultValue="render" className="w-full h-full flex flex-col flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold uppercase tracking-tight text-primary">Live Telemetry</h2>
                <p className="text-sm text-muted-foreground">Compare zone risk progression and current heat concentration.</p>
              </div>
              
              <TabsList className="bg-muted w-full md:w-auto h-auto p-1 rounded-lg">
                <TabsTrigger value="render" className="text-xs uppercase tracking-widest font-semibold data-active:bg-background flex-1">3D Render</TabsTrigger>
                <TabsTrigger value="chart" className="text-xs uppercase tracking-widest font-semibold data-active:bg-background flex-1">Risk Chart</TabsTrigger>
                <TabsTrigger value="heatmap" className="text-xs uppercase tracking-widest font-semibold data-active:bg-background flex-1">Heatmap</TabsTrigger>
              </TabsList>
            </div>

            <Separator className="bg-border mb-6" />

            <TabsContent value="render" className={`mt-0 ${VISUAL_SIZE}`}>
              <div className="w-full h-full border border-border bg-card relative overflow-hidden shadow-sm rounded-lg">
                 <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/80 backdrop-blur-md rounded-md border border-primary/40 text-xs font-mono text-primary shadow-[0_0_15px_rgba(236,78,2,0.4)]">
                   LIVE 3D RENDER
                 </div>
                 <div className="w-full h-full relative">
                   <div className="absolute inset-0">
                     <ThreeStadium />
                   </div>
                 </div>
              </div>
            </TabsContent>

            <TabsContent value="chart" className={`mt-0 ${VISUAL_SIZE}`}>
              <ChartRevealShell label="Risk progression over time" className="w-full h-full border border-border bg-card p-4 shadow-sm rounded-lg">
                <RiskLineChart output={latestSimulationOutput} />
              </ChartRevealShell>
            </TabsContent>

            <TabsContent value="heatmap" className={`mt-0 ${VISUAL_SIZE}`}>
              <div className="grid gap-4 grid-cols-[2fr_1fr] w-full h-full">
                <div className="border border-border bg-card p-4 shadow-sm overflow-hidden relative rounded-lg min-h-0">
                  <StadiumHeatmap latestZoneRisk={model.latestZoneRisk} />
                </div>
                <div className="border border-border bg-card p-4 shadow-sm flex flex-col justify-center rounded-lg min-h-0">
                  <RiskLegend />
                </div>
              </div>
            </TabsContent>
          </Tabs>
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


    </section>
  )
}
