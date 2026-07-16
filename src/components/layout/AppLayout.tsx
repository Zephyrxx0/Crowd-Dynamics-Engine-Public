import { useState } from "react"
import { VisualizationWorkspace } from "@/visualization/components/VisualizationWorkspace"
import { CinematicHero } from "./CinematicHero"
import { MagneticDock } from "./MagneticDock"
import { ScenarioSidebar } from "@/components/config/ScenarioSidebar"
import { PresetsToolbar } from "@/components/config/PresetsToolbar"

export function AppLayout() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="min-h-screen w-full pb-24 dark bg-background text-foreground" data-testid="app-layout">
      <MagneticDock />

      {activeTab === "overview" && (
        <div className="w-full">
          <CinematicHero />
        </div>
      )}

      {activeTab !== "overview" && (
        <main className="mx-auto w-full max-w-[1600px] px-4 py-8 md:px-8">
          <div className="flex flex-col xl:flex-row gap-6 items-start">
            {activeTab === "simulate" && (
              <section id="simulate" className="flex-1 w-full max-w-sm rounded-none border border-border bg-card p-6 shadow-xl" data-route-surface="simulate">
                <div className="mb-6 border-b border-border/60 pb-4">
                  <h2 className="text-xl font-bold tracking-tight text-primary uppercase">Scenario Config</h2>
                  <p className="text-sm text-foreground/70 mt-1 mb-4">
                    Configure and run scenarios to drive visualization.
                  </p>
                  <PresetsToolbar />
                </div>
                <div className="space-y-4">
                  <div className="text-sm">
                    <ScenarioSidebar />
                  </div>
                </div>
              </section>
            )}

            <section className="flex-[3] w-full min-w-0" data-testid="app-main-content">
              <VisualizationWorkspace activeTab={activeTab} />
            </section>
          </div>
        </main>
      )}
    </div>
  )
}
