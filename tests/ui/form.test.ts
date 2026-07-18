import React from "react"
import { act, render, screen, waitFor, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ScenarioForm } from "../../src/components/config/ScenarioForm"
import { presets } from "../../src/simulation/presets"
import { useScenarioStore } from "../../src/hooks/useScenarioStore"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}))

describe("ScenarioForm", () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    localStorage.clear()
    useScenarioStore.setState({
      currentInput: presets.normal,
      savedScenarios: {},
    })
  })

  it("renders nested arrays and syncs when preset state changes", async () => {
    render(React.createElement(ScenarioForm))

    expect(screen.getAllByTestId("zones-row").length).toBeGreaterThan(0)
    expect(screen.getByDisplayValue("1200")).toBeInTheDocument()

    act(() => {
      useScenarioStore.getState().applyPreset("crisis")
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue("1100")).toBeInTheDocument()
    })
  })

  it("renders all form field groups", async () => {
    const user = userEvent.setup()
    render(React.createElement(ScenarioForm))

    expect(screen.getAllByTestId("zones-row")).toHaveLength(presets.normal.zones.length)

    await user.click(screen.getByRole("button", { name: "Gates" }))
    expect(screen.getAllByTestId("gates-row")).toHaveLength(presets.normal.gates.length)

    await user.click(screen.getByRole("button", { name: "Phases" }))
    expect(screen.getAllByTestId("phases-row")).toHaveLength(presets.normal.phases.length)

    await user.click(screen.getByRole("button", { name: "Arrivals" }))
    expect(screen.getAllByTestId("arrivals-row")).toHaveLength(presets.normal.arrivals.length)
  })

  it("validates required fields on submit", async () => {
    const user = userEvent.setup()
    render(React.createElement(ScenarioForm))

    const zoneId = screen.getByDisplayValue("north")
    await user.clear(zoneId)
    await user.click(screen.getByTestId("run-button"))

    await waitFor(() => {
      expect(zoneId).toHaveAttribute("aria-invalid", "true")
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0)
    })
  })

  it("shows validation errors for invalid zone data", async () => {
    const user = userEvent.setup()
    render(React.createElement(ScenarioForm))

    const capacity = screen.getByDisplayValue("1200")
    await user.clear(capacity)
    await user.type(capacity, "0")
    await user.click(screen.getByTestId("run-button"))

    await waitFor(() => {
      expect(capacity).toHaveAttribute("aria-invalid", "true")
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0)
    })
  })

  it("calls store update when data is valid", async () => {
    const user = userEvent.setup()
    const updateInput = vi.fn()
    useScenarioStore.setState({ updateInput })
    render(React.createElement(ScenarioForm))

    await user.click(screen.getByTestId("run-button"))

    await waitFor(() => {
      expect(updateInput).toHaveBeenCalledWith(expect.objectContaining({ mode: "zone" }))
    })
  })

  it("resets errors on subsequent valid input", async () => {
    const user = userEvent.setup()
    render(React.createElement(ScenarioForm))

    const zoneId = screen.getByDisplayValue("north")
    await user.clear(zoneId)
    await user.click(screen.getByTestId("run-button"))

    await waitFor(() => {
      expect(zoneId).toHaveAttribute("aria-invalid", "true")
    })

    await user.type(zoneId, "north")
    await user.click(screen.getByTestId("run-button"))

    await waitFor(() => {
      expect(screen.queryByText(/zones\.0\.id/i)).not.toBeInTheDocument()
    })
  })
})
