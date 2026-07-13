import React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { SimulationOutput } from "@/simulation/contracts/output.schema"
import { VISUALIZATION_TRANSITION_MS } from "@/visualization/contracts/motionPolicy"
import { ChartRevealShell } from "@/visualization/components/ChartRevealShell"
import { RiskLineChart } from "@/visualization/components/RiskLineChart"

function buildOutputFixture(): SimulationOutput {
  const phaseIds = ["phase-1", "phase-2"]
  const zones = [
    { zoneId: "zone-a", ratios: [0.72, 0.75] },
    { zoneId: "zone-b", ratios: [0.8, 0.84] },
    { zoneId: "zone-c", ratios: [0.93, 0.96] },
    { zoneId: "zone-d", ratios: [0.77, 0.79] },
    { zoneId: "zone-e", ratios: [0.89, 0.9] },
    { zoneId: "zone-f", ratios: [0.65, 0.67] },
  ] as const

  return {
    schemaVersion: "1.0.0",
    runDeterministicHash: "viz-chart-fixture",
    mode: "zone",
    phaseZoneMatrix: phaseIds.flatMap((phaseId, phaseIndex) =>
      zones.map((zone) => ({
        phaseId,
        zoneId: zone.zoneId,
        occupancyFans: Math.round(zone.ratios[phaseIndex] * 100),
        occupancyRatio: zone.ratios[phaseIndex],
        occupancySeverity: zone.ratios[phaseIndex] >= 0.95 ? "red" : zone.ratios[phaseIndex] >= 0.8 ? "amber" : "green",
        carryInFans: 0,
        arrivalsFans: Math.round(zone.ratios[phaseIndex] * 100),
        availableThroughput: 120,
        processedFans: Math.round(zone.ratios[phaseIndex] * 100),
        overflowCarryFans: 0,
        blockedByDelay: false,
      })),
    ),
    peakSummaries: zones.map((zone) => ({
      zoneId: zone.zoneId,
      phaseId: "phase-2",
      peakOccupancyFans: Math.round(Math.max(...zone.ratios) * 100),
      peakOccupancyRatio: Math.max(...zone.ratios),
      peakSeverity: Math.max(...zone.ratios) >= 0.95 ? "red" : Math.max(...zone.ratios) >= 0.8 ? "amber" : "green",
    })),
    invariants: {
      deterministicReplay: true,
      nonNegativeOccupancy: true,
      throughputBoundRespected: true,
      carryOverConservation: true,
      matrixComplete: true,
    },
    warnings: [],
  }
}

describe("RiskLineChart", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders one visible line per zone and defaults to top 5", async () => {
    const user = userEvent.setup()

    render(React.createElement(RiskLineChart, { output: buildOutputFixture() }))

    expect(document.querySelectorAll("path[data-chart-path='true']")).toHaveLength(5)
    expect(screen.getByText("phase-1")).toBeInTheDocument()
    expect(screen.getByText("phase-2")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /show all zones/i }))

    expect(document.querySelectorAll("path[data-chart-path='true']")).toHaveLength(6)
    expect(screen.getByTestId("risk-line-svg")).toHaveAttribute(
      "data-transition-ms",
      String(VISUALIZATION_TRANSITION_MS),
    )
    expect(screen.getByTestId("risk-line-svg")).toHaveAttribute("data-y-domain", "0,1")
  })

  it("keeps series node identity stable across updates keyed by zoneId", async () => {
    const user = userEvent.setup()
    const firstOutput = buildOutputFixture()
    const secondOutput: SimulationOutput = {
      ...firstOutput,
      runDeterministicHash: "viz-chart-fixture-2",
      phaseZoneMatrix: firstOutput.phaseZoneMatrix.map((row) =>
        row.zoneId === "zone-c" && row.phaseId === "phase-2"
          ? { ...row, occupancyRatio: 0.92, occupancyFans: 92, arrivalsFans: 92, processedFans: 92, occupancySeverity: "amber" }
          : row,
      ),
    }

    const { rerender } = render(React.createElement(RiskLineChart, { output: firstOutput }))
    await user.click(screen.getByRole("button", { name: /show all zones/i }))

    const before = screen.getByTestId("risk-line-zone-c")

    rerender(React.createElement(RiskLineChart, { output: secondOutput }))

    const after = screen.getByTestId("risk-line-zone-c")
    expect(after).toBe(before)
  })

  it("uses shared transition duration for updates", async () => {
    const user = userEvent.setup()

    render(React.createElement(RiskLineChart, { output: buildOutputFixture() }))

    await user.click(screen.getByRole("button", { name: /show all zones/i }))

    const linePath = screen.getByTestId("risk-line-zone-a")
    expect(linePath).toHaveStyle(`transition-duration: ${VISUALIZATION_TRANSITION_MS}ms`)
    expect(screen.getByTestId("risk-line-svg")).toHaveAttribute("data-y-domain", "0,1")
  })

  it("skips animation when reduced-motion is requested", () => {
    const defaultMatchMedia = window.matchMedia

    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    })

    render(React.createElement(RiskLineChart, { output: buildOutputFixture() }))

    expect(screen.getByTestId("risk-line-svg")).toHaveAttribute("data-reduced-motion", "true")
    expect(screen.getByTestId("risk-line-zone-a")).toHaveStyle("transition-duration: 0ms")
    window.matchMedia = defaultMatchMedia
  })

  it("mounts chart reveal shell and renders children", () => {
    render(
      React.createElement(
        ChartRevealShell,
        {
          label: "Risk chart",
          children: React.createElement("div", { "data-testid": "chart-child" }, "chart"),
        }
      ),
    )

    expect(screen.getByTestId("chart-reveal-shell")).toBeInTheDocument()
    expect(screen.getByTestId("chart-child")).toBeInTheDocument()
  })
})
