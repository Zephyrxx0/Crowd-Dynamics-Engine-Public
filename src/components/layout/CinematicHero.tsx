"use client"

import { useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Activity, ArrowRight, Waves } from "lucide-react"
import { useScenarioStore } from "@/hooks/useScenarioStore"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { createDrawable, createTimeline } from "animejs"

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP)
}

const MAIN_D = `M -50,950 C 400,750 600,250 1490,-50`
const ACCENT_D = `M -50,980 C 450,800 650,200 1490,-50`
const GLOW_D = `M -50,1010 C 500,850 700,150 1490,-50`

export function CinematicHero() {
  const applyPreset = useScenarioStore((state) => state.applyPreset)
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const mainCurveRef = useRef<SVGPathElement>(null)
  const accentCurveRef = useRef<SVGPathElement>(null)
  const glowCurveRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const main = mainCurveRef.current
    const accent = accentCurveRef.current
    const glow = glowCurveRef.current
    if (!main || !accent || !glow) return

    const tl = createTimeline({ loop: true })

    function keyframes() {
      return [
        { to: '0 0', duration: 0 },
        { to: '0 1', duration: 4000, ease: 'outCubic' },
        { to: '1 1', duration: 4000, ease: 'inCubic' },
      ]
    }

    tl.add(createDrawable(main), { draw: keyframes() }, 0)
    tl.add(createDrawable(accent), { draw: keyframes() }, 600)
    tl.add(createDrawable(glow), { draw: keyframes() }, 1200)

    return () => { tl.cancel() }
  }, [])

  useGSAP(() => {
    gsap.from(".hero-headline", {
      y: 60,
      opacity: 0,
      duration: 1,
      stagger: 0.12,
      ease: "power3.out",
      delay: 0.3,
    })
    gsap.from(".hero-fade-in", {
      opacity: 0,
      y: 20,
      duration: 0.8,
      stagger: 0.08,
      ease: "power2.out",
      delay: 0.6,
    })
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="relative min-h-screen bg-background overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 z-0 opacity-[0.08] dark:opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Curve divider - foreground */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="curve-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--hero-gradient-b)" stopOpacity="0" />
              <stop offset="20%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.9" />
              <stop offset="80%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--hero-gradient-c)" stopOpacity="0" />
            </linearGradient>
            <filter id="curve-glow">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Glow under-layer */}
          <path
            ref={glowCurveRef}
            d={GLOW_D}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="14"
            strokeLinecap="round"
            opacity={0.12}
            filter="url(#curve-glow)"
          />

          {/* Main dividing curve */}
          <path
            ref={mainCurveRef}
            d={MAIN_D}
            fill="none"
            stroke="url(#curve-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            opacity={0.85}
          />

          {/* Accent curve */}
          <path
            ref={accentCurveRef}
            d={ACCENT_D}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={0.5}
          />
        </svg>
      </div>

      {/* Vertical side tag */}
      <div className="fixed top-1/2 right-0 z-40 flex h-36 -translate-y-1/2 items-center pointer-events-none">
        <div className="bg-foreground text-background px-3 py-6 text-xs font-bold tracking-widest uppercase">
          <span className="rotate-180 [writing-mode:vertical-rl]">World Cup 26</span>
        </div>
      </div>

      <main className="relative z-10 flex min-h-screen flex-col justify-between pt-16 pb-16 px-6 md:px-10 lg:px-20">
        {/* Main headline block */}
        <div className="flex w-full flex-col gap-0">

          {/* Row 1: CROWD + descriptor */}
          <div className="flex flex-col md:flex-row md:items-end md:gap-8">
            <p className="hero-fade-in text-muted-foreground text-xs leading-5 md:text-sm md:text-right md:max-w-[180px] md:pb-4 md:shrink-0">
              Deterministic crowd simulation for stadium command centers and fan interfaces.
            </p>
            <h1
              className="hero-headline text-[clamp(4rem,14vw,10rem)] leading-[0.9] font-light tracking-wider uppercase text-foreground"
              style={{ textWrap: "balance" }}
            >
              CROWD
            </h1>
          </div>

          {/* Row 2: DYNA + icon + MICS */}
          <div className="flex items-center">
            <h1 className="hero-headline flex items-center text-[clamp(4rem,14vw,10rem)] leading-[0.9] font-light tracking-wider uppercase text-foreground">
              <span>DY</span>
              <Activity
                strokeWidth={1}
                className="text-primary shrink-0"
                style={{ width: "clamp(3rem,10vw,8rem)", height: "clamp(3rem,10vw,8rem)" }}
              />
              <span>NAMICS</span>
            </h1>
          </div>

          {/* Row 3: ENGINE + descriptor */}
          <div className="flex flex-col md:flex-row md:items-end md:gap-8">
            <h1
              className="hero-headline text-[clamp(4rem,14vw,10rem)] leading-[0.9] font-light tracking-wider uppercase text-primary"
            >
              ENGINE
            </h1>
            <p className="hero-fade-in text-muted-foreground text-xs leading-5 md:text-sm md:max-w-[200px] md:pb-4">
              Open to all crowd scenarios — fire egress, VIP routing, peak congestion, and crisis response.
            </p>
          </div>
        </div>

        {/* Separator + metadata row */}
        <div className="w-full my-8 md:my-12">
          <div className="border-t border-border w-full hero-fade-in" />
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between hero-fade-in">
            {/* Left: location + title */}
            <div className="flex items-end gap-4">
              <div className="text-xs tracking-widest uppercase text-muted-foreground whitespace-nowrap">
                Stadium · New York · 2026
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-thin uppercase tracking-widest text-foreground md:text-4xl">SIMULATOR</span>
                <span className="text-2xl font-bold text-primary italic md:text-4xl">v2</span>
              </div>
            </div>

            {/* Right: CTAs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                type="button"
                id="hero-enter-workspace"
                className={cn(
                  "group flex h-12 items-center gap-3 border border-foreground bg-foreground",
                  "px-8 text-sm font-semibold uppercase tracking-wider text-background",
                  "transition-all duration-200 hover:bg-primary hover:border-primary",
                  "@media (prefers-reduced-motion: no-preference) [&]:transition-all"
                )}
                onClick={() => router.push("/simulate")}
              >
                <span>Enter Workspace</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                id="hero-run-crisis"
                className={cn(
                  "group flex h-12 items-center gap-3 border border-border",
                  "bg-transparent px-8 text-sm font-semibold uppercase tracking-wider text-foreground",
                  "transition-colors duration-200 hover:border-primary hover:text-primary"
                )}
                onClick={() => {
                  applyPreset("crisis")
                  router.push("/simulate")
                }}
              >
                <Waves className="h-4 w-4 text-primary shrink-0" />
                <span>Run Crisis Scenario</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
