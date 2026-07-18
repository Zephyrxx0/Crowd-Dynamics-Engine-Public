import React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import App from "../../src/App"
import { usePathname, useRouter } from "next/navigation"
import { useScenarioStore } from "../../src/hooks/useScenarioStore"
import { simulationOutputFixture } from "./fixtures/simulationOutput"

const originalMatchMedia = window.matchMedia
const originalScrollIntoView = Element.prototype.scrollIntoView

describe("AppLayout", () => {
  afterEach(() => {
    cleanup()
    window.matchMedia = originalMatchMedia
    Element.prototype.scrollIntoView = originalScrollIntoView
  })

  beforeEach(() => {
    useScenarioStore.setState({
      latestSimulationOutput: null,
    })
    
    vi.mocked(usePathname).mockReturnValue("/")

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it("renders a persistent sidebar container", () => {
    vi.mocked(usePathname).mockReturnValue("/simulate")
    render(React.createElement(App))

    expect(screen.getByTestId("app-layout")).toBeInTheDocument()
    expect(screen.getByTestId("app-main-content")).toBeInTheDocument()
  })

  it("mounts visualization workspace components in main content", () => {
    useScenarioStore.setState({
      latestSimulationOutput: simulationOutputFixture,
    })
    vi.mocked(usePathname).mockReturnValue("/simulate")

    render(React.createElement(App))

    expect(screen.getByTestId("visualization-workspace")).toBeInTheDocument()
    expect(screen.getByText("Live Telemetry")).toBeInTheDocument()
  })

  it("shows workspace empty state when no simulation output is available", async () => {
    const user = userEvent.setup()
    vi.mocked(usePathname).mockReturnValue("/simulate")
    render(React.createElement(App))

    await user.click(screen.getByRole("tab", { name: /Risk Chart/i }))
    expect(screen.getByText("Run a scenario to view risk chart.")).toBeInTheDocument()
  })

  it("uses reduced-motion dock behavior when system preference is enabled", async () => {
    const user = userEvent.setup()
    
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    render(React.createElement(App))

    await user.click(screen.getByRole("button", { name: "Simulate" }))

    expect(vi.mocked(useRouter)().push).toHaveBeenCalledWith("/simulate")
  })
})