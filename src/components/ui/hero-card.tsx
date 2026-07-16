"use client"

import { ArrowRight, Waves } from "lucide-react"
import { useState } from "react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export function CTASection() {
  const [_hovered, setIsHovered] = useState(false)

  return (
    <section className="py-8 w-full flex justify-center items-center px-4 md:px-6">
      <div
        className="w-full max-w-7xl relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Dot grid container */}
        <div className="relative overflow-hidden border border-border bg-card min-h-[560px] md:min-h-[600px] flex flex-col">
          {/* Dot grid background */}
          <div
            className="absolute inset-0 z-0 opacity-[0.06] dark:opacity-[0.1]"
            style={{
              backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Vertical side tag */}
          <div className="absolute top-1/2 right-0 z-10 flex h-28 -translate-y-1/2 items-center pointer-events-none">
            <div className="bg-foreground text-background px-2 py-4 text-[10px] font-bold tracking-widest uppercase">
              <span className="rotate-180 [writing-mode:vertical-rl]">Fan Flow 2026</span>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between h-full flex-1 p-8 md:p-14 lg:p-16">
            {/* Main heading */}
            <div className="flex flex-col gap-0">
              <h2
                className="text-[clamp(3rem,10vw,7rem)] leading-[0.9] font-light tracking-wider uppercase text-foreground"
                style={{ textWrap: "balance" }}
              >
                Predictive
              </h2>
              <h2 className="text-[clamp(3rem,10vw,7rem)] leading-[0.9] font-light tracking-wider uppercase text-primary">
                Fan Flow
              </h2>
              <h2 className="text-[clamp(3rem,10vw,7rem)] leading-[0.9] font-light tracking-wider uppercase text-foreground/40">
                Simulator
              </h2>
            </div>

            {/* Bottom row */}
            <div className="mt-10 md:mt-16">
              <Separator className="mb-8" />
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                  Scenario-driven crowd risk simulation and planning — built for World Cup 2026 venue teams.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <a
                    href="/"
                    id="cta-enter-dashboard"
                    className={cn(
                      "group flex h-11 items-center gap-3 border border-foreground bg-foreground",
                      "px-8 text-sm font-semibold uppercase tracking-wider text-background",
                      "transition-all duration-200 hover:bg-primary hover:border-primary"
                    )}
                  >
                    <span>View Dashboard</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </a>

                  <a
                    href="/dashboard"
                    id="cta-live-data"
                    className={cn(
                      "group flex h-11 items-center gap-3 border border-border bg-transparent",
                      "px-8 text-sm font-semibold uppercase tracking-wider text-foreground",
                      "transition-colors duration-200 hover:border-primary hover:text-primary"
                    )}
                  >
                    <Waves className="h-4 w-4 text-primary shrink-0" />
                    <span>Live Match Data</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
