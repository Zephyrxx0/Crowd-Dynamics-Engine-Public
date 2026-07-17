"use client";

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { useScenarioStore } from "@/hooks/useScenarioStore"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

const PRESET_BUTTONS = [
  { key: "normal", label: "Normal" },
  { key: "rush", label: "Rush" },
  { key: "crisis", label: "Crisis" },
] as const

export function PresetsToolbar() {
  const applyPreset = useScenarioStore((state) => state.applyPreset)
  const randomizeScenario = useScenarioStore((state) => state.randomizeScenario)
  const containerRef = useRef<HTMLDivElement>(null)

  const { contextSafe } = useGSAP({ scope: containerRef })

  const onEnter = contextSafe((e: React.MouseEvent) => {
    gsap.to(e.currentTarget, { scale: 1.05, duration: 0.3, ease: "back.out(2)" })
  })

  const onLeave = contextSafe((e: React.MouseEvent) => {
    gsap.to(e.currentTarget, { scale: 1, duration: 0.3, ease: "power2.out" })
  })

  const handleAction = contextSafe((e: React.MouseEvent, action: () => void) => {
    gsap.timeline()
      .to(e.currentTarget, { scale: 0.92, duration: 0.1, ease: "power1.inOut" })
      .to(e.currentTarget, { scale: 1.05, duration: 0.3, ease: "back.out(2)", onComplete: action })
  })

  return (
    <div ref={containerRef} className="flex flex-wrap gap-1.5" data-testid="presets-toolbar">
      {PRESET_BUTTONS.map((preset) => (
        <Button
          key={preset.key}
          variant="outline"
          size="sm"
          className="text-xs font-semibold will-change-transform"
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onClick={(e) => handleAction(e, () => applyPreset(preset.key))}
          data-testid={`preset-${preset.key}`}
        >
          {preset.label}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-xs font-semibold will-change-transform bg-primary/5 text-primary hover:bg-primary/10 border-primary/20"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onClick={(e) => handleAction(e, () => randomizeScenario())}
        data-testid="preset-random"
      >
        Random
      </Button>
    </div>
  )
}
