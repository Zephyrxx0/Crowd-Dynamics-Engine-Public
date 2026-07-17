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

  return (
    <div className="flex flex-wrap gap-2" data-testid="presets-toolbar">
      {PRESET_BUTTONS.map((preset) => (
        <Button
          key={preset.key}
          variant="outline"
          size="sm"
          className="border-border text-foreground/70 hover:text-primary hover:border-primary/40 text-xs font-semibold tracking-wider transition-all"
          onClick={() => applyPreset(preset.key)}
          data-testid={`preset-${preset.key}`}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  )
}
