import { z } from "zod"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { useRiskReportStore } from "@/hooks/useRiskReportStore"
import { makeValidatedStorage } from "@/lib/storage/makeValidatedStorage"
import { SimulationInputSchema, type SimulationInput } from "@/simulation/contracts/input.schema"
import type { SimulationOutput } from "@/simulation/contracts/output.schema"
import { simulateDeterministic } from "@/simulation/core/simulateDeterministic"
import { presets, type PresetName } from "@/simulation/presets"

const STORE_KEY = "scenario-store"

const PersistedStateSchema = z.object({
  currentInput: SimulationInputSchema,
  savedScenarios: z.record(z.string(), SimulationInputSchema),
})

type ScenarioStateSnapshot = z.infer<typeof PersistedStateSchema>

type ScenarioState = ScenarioStateSnapshot & {
  latestSimulationOutput: SimulationOutput | null
  updateInput: (input: SimulationInput) => void
  setLatestSimulationOutput: (output: SimulationOutput | null) => void
  saveScenario: (name: string, input?: SimulationInput) => void
  loadScenario: (name: string) => void
  applyPreset: (preset: PresetName) => void
  randomizeScenario: () => void
}

const defaultInput = presets.normal

export function validatePersistedScenarioState(payload: unknown): ScenarioStateSnapshot | null {
  const parsed = PersistedStateSchema.safeParse(payload)
  return parsed.success ? parsed.data : null
}

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set, get) => ({
      currentInput: defaultInput,
      savedScenarios: {},
      latestSimulationOutput: null,
      updateInput: (input) => set({ currentInput: SimulationInputSchema.parse(input) }),
      setLatestSimulationOutput: (output) => set({ latestSimulationOutput: output }),
      saveScenario: (name, input) => {
        const trimmedName = name.trim()
        if (!trimmedName) {
          return
        }

        const scenario = SimulationInputSchema.parse(input ?? get().currentInput)
        set((state) => ({
          savedScenarios: {
            ...state.savedScenarios,
            [trimmedName]: scenario,
          },
        }))
      },
      loadScenario: (name) => {
        const scenario = get().savedScenarios[name]
        if (scenario) {
          set({ currentInput: SimulationInputSchema.parse(scenario) })
        }
      },
      applyPreset: (presetName) => {
        const input = SimulationInputSchema.parse(presets[presetName])
        set({ currentInput: input })
        const output = simulateDeterministic(input)
        get().setLatestSimulationOutput(output)
      },
      randomizeScenario: () => {
        const current = get().currentInput
        const randomized: SimulationInput = {
          ...current,
          zones: current.zones.map((z) => ({
            ...z,
            capacity: Math.floor(Math.random() * 600) + 800, // 800 to 1400
          })),
          gates: current.gates.map((g) => ({
            ...g,
            throughputPerMin: Math.floor(Math.random() * 20) + 15, // 15 to 35
            delayMin: Math.floor(Math.random() * 8), // 0 to 7
          })),
          arrivals: current.arrivals.map((a) => ({
            ...a,
            demandFans: Math.floor(Math.random() * 600) + 50, // 50 to 650
          })),
        }
        const parsed = SimulationInputSchema.parse(randomized)
        set({ currentInput: parsed })
        const output = simulateDeterministic(parsed)
        get().setLatestSimulationOutput(output)
      },
    }),
    {
      name: STORE_KEY,
      storage: makeValidatedStorage(validatePersistedScenarioState),
      partialize: (state) => ({
        currentInput: state.currentInput,
        savedScenarios: state.savedScenarios,
      }),
    },
  ),
)
