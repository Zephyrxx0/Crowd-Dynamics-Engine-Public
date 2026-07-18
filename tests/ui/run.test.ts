import React from "react"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ScenarioForm } from "../../src/components/config/ScenarioForm"
import { useScenarioStore } from "../../src/hooks/useScenarioStore"
import * as deterministicSimulation from "../../src/simulation/core/simulateDeterministic"
import { presets } from "../../src/simulation/presets"
import { simulationOutputFixture } from "./fixtures/simulationOutput"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}))

describe("ScenarioForm run behavior", () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    localStorage.clear()
    useScenarioStore.setState({
      currentInput: presets.normal,
      savedScenarios: {},
      latestSimulationOutput: null,
    })
  })

  it("shows validation errors for invalid input", async () => {
    const previousOutput = {
      ...simulationOutputFixture,
      runDeterministicHash: "existing-output",
    }
    useScenarioStore.getState().setLatestSimulationOutput(previousOutput)

    const runSpy = vi.spyOn(deterministicSimulation, "simulateDeterministic").mockReturnValue(simulationOutputFixture)
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined)

    render(React.createElement(ScenarioForm))

    const zoneInputs = screen.getAllByLabelText("Zone ID")
    fireEvent.change(zoneInputs[0], { target: { value: "" } })
    fireEvent.click(screen.getAllByTestId("run-button")[0])

    await waitFor(() => {
      expect(screen.getByTestId("validation-list")).toBeInTheDocument()
    })

    expect(runSpy).not.toHaveBeenCalled()
    expect(useScenarioStore.getState().latestSimulationOutput).toEqual(previousOutput)
    logSpy.mockRestore()
    runSpy.mockRestore()
  })

  it("runs deterministic simulation when form input is valid", async () => {
    const runSpy = vi.spyOn(deterministicSimulation, "simulateDeterministic").mockReturnValue(simulationOutputFixture)
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined)

    render(React.createElement(ScenarioForm))
    fireEvent.click(screen.getAllByTestId("run-button")[0])

    await waitFor(() => {
      expect(runSpy).toHaveBeenCalledTimes(1)
    })

    expect(screen.queryByTestId("validation-list")).not.toBeInTheDocument()
    expect(useScenarioStore.getState().latestSimulationOutput).toEqual(simulationOutputFixture)
    logSpy.mockRestore()
    runSpy.mockRestore()
  })
})
