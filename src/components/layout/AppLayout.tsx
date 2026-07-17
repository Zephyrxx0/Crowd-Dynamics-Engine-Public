import { useState } from "react"
import { VisualizationWorkspace } from "@/visualization/components/VisualizationWorkspace"
import { CinematicHero } from "./CinematicHero"
import { MagneticDock } from "./MagneticDock"
import { PresetsToolbar } from "@/components/config/PresetsToolbar"
import { ScenarioSidebar } from "@/components/config/ScenarioSidebar"

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
              <section id="simulate" className="w-full xl:w-[520px] shrink-0 rounded-xl bg-card p-6 ring-1 ring-foreground/10 transition-shadow duration-200" data-route-surface="simulate">
                <div className="mb-4 border-b border-border/60 pb-3.5">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">Scenario Config</h2>
                  <PresetsToolbar />
                </div>
                <div className="text-sm">
                  <ScenarioSidebar />
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
