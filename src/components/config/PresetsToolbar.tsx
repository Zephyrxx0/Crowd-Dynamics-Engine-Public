"use client";

import { Button } from "@/components/ui/button"
import { useScenarioStore } from "@/hooks/useScenarioStore"

const PRESET_BUTTONS = [
  { key: "normal", label: "Normal" },
  { key: "rush", label: "Rush" },
  { key: "crisis", label: "Crisis" },
] as const

export function PresetsToolbar() {
  const applyPreset = useScenarioStore((state) => state.applyPreset)
  const randomizeScenario = useScenarioStore((state) => state.randomizeScenario)

  return (
    <div className="flex flex-wrap gap-1.5" data-testid="presets-toolbar">
      {PRESET_BUTTONS.map((preset) => (
        <Button
          key={preset.key}
          variant="outline"
          size="sm"
          className="text-xs font-semibold transition-[color,border-color,transform,box-shadow] duration-150 ease-out active:scale-[0.96] will-change-transform"
          onClick={() => applyPreset(preset.key)}
          data-testid={`preset-${preset.key}`}
        >
          {preset.label}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-xs font-semibold transition-[color,border-color,transform,box-shadow] duration-150 ease-out active:scale-[0.96] will-change-transform bg-primary/5 text-primary hover:bg-primary/10 border-primary/20"
        onClick={() => randomizeScenario()}
        data-testid="preset-random"
      >
        Random
      </Button>
    </div>
  )
}
