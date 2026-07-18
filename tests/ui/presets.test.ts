import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PresetsToolbar } from "../../src/components/config/PresetsToolbar"

const applyPreset = vi.fn()

vi.mock("../../src/hooks/useScenarioStore", () => ({
  useScenarioStore: (selector: (state: { applyPreset: (key: "normal" | "rush" | "crisis") => void }) => unknown) =>
    selector({ applyPreset }),
}))

describe("PresetsToolbar", () => {
  beforeEach(() => {
    applyPreset.mockReset()
  })

  it("triggers store applyPreset action from each button", async () => {
    render(React.createElement(PresetsToolbar))

    fireEvent.click(screen.getByTestId("preset-normal"))
    await waitFor(() => {
      expect(applyPreset).toHaveBeenCalledWith("normal")
    })
    
    fireEvent.click(screen.getByTestId("preset-rush"))
    await waitFor(() => {
      expect(applyPreset).toHaveBeenCalledWith("rush")
    })
    
    fireEvent.click(screen.getByTestId("preset-crisis"))
    await waitFor(() => {
      expect(applyPreset).toHaveBeenCalledWith("crisis")
    })
  })
})
