import { VisualizationWorkspace } from "@/visualization/components/VisualizationWorkspace"
import { ScenarioSidebar } from "@/components/config/ScenarioSidebar"
import { PresetsToolbar } from "@/components/config/PresetsToolbar"

export default function SimulatePage() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-8 md:px-8 pb-24 flex-1 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <section id="simulate" className="flex-1 w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl" data-route-surface="simulate">
          <div className="mb-6 border-b border-border pb-6">
            <h2 className="text-xl font-bold tracking-widest text-primary uppercase">Scenario Config</h2>
            <p className="text-sm text-muted-foreground mt-2 mb-5">
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

        <section className="flex-[3] w-full min-w-0" data-testid="app-main-content">
          <VisualizationWorkspace activeTab="simulate" />
        </section>
      </div>
    </main>
  )
}
