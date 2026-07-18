import { beforeEach, describe, expect, it } from "vitest"

import { presets } from "../../src/simulation/presets"
import { simulationOutputFixture } from "./fixtures/simulationOutput"
import {
  useScenarioStore,
  validatePersistedScenarioState,
} from "../../src/hooks/useScenarioStore"

describe("useScenarioStore", () => {
  beforeEach(() => {
    useScenarioStore.setState({ latestSimulationOutput: null })
  })

  it("applies presets to current input", () => {
    useScenarioStore.getState().applyPreset("rush")

    expect(useScenarioStore.getState().currentInput).toEqual(presets.rush)
  })

  it("saves and loads named scenarios", () => {
    useScenarioStore.getState().updateInput(presets.crisis)
    useScenarioStore.getState().saveScenario("gate-crisis")
    useScenarioStore.getState().applyPreset("normal")

    useScenarioStore.getState().loadScenario("gate-crisis")

    expect(useScenarioStore.getState().currentInput).toEqual(presets.crisis)
  })

  it("validates persisted state payloads", () => {
    const valid = validatePersistedScenarioState({
      currentInput: presets.normal,
      savedScenarios: { baseline: presets.normal },
    })
    const invalid = validatePersistedScenarioState({
      currentInput: { mode: "zone" },
      savedScenarios: {},
    })

    expect(valid).not.toBeNull()
    expect(invalid).toBeNull()
  })

  it("stores latest simulation output in volatile UI state", () => {
    const previousInput = useScenarioStore.getState().currentInput
    expect(useScenarioStore.getState().latestSimulationOutput).toBeNull()

    useScenarioStore.getState().setLatestSimulationOutput(simulationOutputFixture)

    expect(useScenarioStore.getState().latestSimulationOutput).toEqual(simulationOutputFixture)
    expect(useScenarioStore.getState().currentInput).toEqual(previousInput)
  })
})
