import { ArrowRight, Sparkles, Waves } from "lucide-react"
import { Kino, Scene, Reveal } from "react-kino"
import { Suspense, lazy } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { useScenarioStore } from "@/hooks/useScenarioStore"

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
)

export function CinematicHero({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const applyPreset = useScenarioStore((state) => state.applyPreset)

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-none opacity-80" style={{ background: 'radial-gradient(circle at center, #111 0%, #000 100%)' }}>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center px-6">
        <Kino>
          <Scene duration="10vh" pin={false} className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-none border border-primary bg-primary/10 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-primary shadow-[0_0_15px_rgba(236,78,2,0.2)]">
              <Sparkles className="size-4" />
              <span>Prompt Wars 2025</span>
            </div>
          </Scene>

          <Reveal animation="fade-up" at={0} progress={1} duration={200}>
            <h1 className="mb-6 max-w-4xl text-5xl font-black uppercase tracking-tight text-white md:text-7xl lg:text-8xl" style={{ textShadow: "0 0 40px rgba(0,0,0,0.8)" }}>
              Crowd Dynamics <span className="text-primary drop-shadow-[0_0_15px_rgba(236,78,2,0.6)]">Engine</span>
            </h1>
            <p className="mx-auto mb-12 max-w-2xl text-lg font-medium text-slate-300 md:text-xl" style={{ textShadow: "0 0 20px rgba(0,0,0,0.8)" }}>
              A deterministic showcase of advanced state management, interactive 3D visualization,
              and cinematic rendering for scale scenarios.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                className="group flex h-14 items-center gap-3 rounded-none bg-primary px-10 text-base font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(236,78,2,0.4)]"
                onClick={() => onNavigate("simulate")}
              >
                <span>Enter Workspace</span>
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                className="group flex h-14 items-center gap-3 rounded-none border border-border bg-black/60 px-8 text-base font-bold text-foreground backdrop-blur-md transition-colors hover:bg-white/10 hover:border-primary/50"
                onClick={() => {
                  applyPreset("crisis")
                  onNavigate("simulate")
                }}
              >
                <Waves className="size-5 text-primary" />
                <span>Run Crisis Scenario</span>
              </button>
            </div>
          </Reveal>
        </Kino>
      </div>
    </div>
  )
}
