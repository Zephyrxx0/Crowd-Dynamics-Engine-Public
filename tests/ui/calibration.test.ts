import React from "react"
import { fireEvent, render, screen, cleanup } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ScenarioForm } from "../../src/components/config/ScenarioForm"
import { presets } from "../../src/simulation/presets"
import { useScenarioStore } from "../../src/hooks/useScenarioStore"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}))

describe("ScenarioForm calibration accordion", () => {
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

  it("renders collapsible advanced calibration controls", () => {
    render(React.createElement(ScenarioForm))

    const trigger = screen.getByTestId("advanced-calibration-trigger")
    expect(trigger).toBeInTheDocument()

    fireEvent.click(trigger)

    expect(screen.getByTestId("advanced-calibration-content")).toBeInTheDocument()
  })
})
