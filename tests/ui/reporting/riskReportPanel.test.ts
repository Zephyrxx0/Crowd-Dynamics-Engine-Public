import React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { useRiskReportStore } from "@/hooks/useRiskReportStore"
import { buildDeterministicRiskReport } from "@/reporting/fallback/buildDeterministicRiskReport"
import { RiskReportPanel } from "@/reporting/components/RiskReportPanel"
import { simulationOutputFixture } from "../fixtures/simulationOutput"

describe("RiskReportPanel", () => {
  afterEach(() => {
    cleanup()
    useRiskReportStore.getState().setGenerator(null)
    useRiskReportStore.getState().reset()
  })

  it("shows fallback alert with retry action when in fallback status", () => {
    const fallbackReport = buildDeterministicRiskReport(simulationOutputFixture)
    useRiskReportStore.setState({
      status: "fallback",
      report: fallbackReport,
      errorMessage: "Gemini request timed out",
    })

    render(React.createElement(RiskReportPanel))

    expect(screen.getByTestId("report-fallback-state")).toBeInTheDocument()
    expect(screen.getByTestId("report-retry-button")).toBeInTheDocument()
  })

  it("does not repeat the generic fallback failure message", () => {
    const fallbackReport = buildDeterministicRiskReport(simulationOutputFixture)
    useRiskReportStore.setState({
      status: "fallback",
      report: fallbackReport,
      errorMessage: "AI generation failed; deterministic fallback shown.",
    })

    render(React.createElement(RiskReportPanel))

    expect(screen.getByText("Deterministic fallback report shown")).toBeInTheDocument()
    expect(screen.queryByText("AI generation failed; deterministic fallback shown.")).not.toBeInTheDocument()
    expect(screen.getByText("The report below was generated from deterministic simulation rules.")).toBeInTheDocument()
  })

  it("renders mandatory report sections", () => {
    const fallbackReport = buildDeterministicRiskReport(simulationOutputFixture)
    useRiskReportStore.setState({
      status: "success",
      report: fallbackReport,
      errorMessage: null,
    })

    render(React.createElement(RiskReportPanel))

    expect(screen.getByRole("heading", { name: "Overall Risk" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Critical Zones" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Staffing Recommendations" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Assumptions and Limitations" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Evidence" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Executive Summary" })).toBeInTheDocument()
  })
})
