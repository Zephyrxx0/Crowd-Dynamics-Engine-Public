import React from "react"
import { act, render, screen, waitFor, cleanup } from "@testing-library/react"
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
})
