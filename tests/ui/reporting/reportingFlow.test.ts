import { waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { useRiskReportStore } from "@/hooks/useRiskReportStore"
import { useScenarioStore } from "@/hooks/useScenarioStore"
import { simulationOutputFixture } from "../fixtures/simulationOutput"

const aiResponse = JSON.stringify({
  source: "ai",
  generatedAt: "2026-04-19T00:00:00Z",
  overall: {
    riskLevel: "red",
    confidence: 0.9,
    rationale: "Zone-b exceeds the red threshold in phase-2.",
  },
  criticalZones: [
    {
      zoneId: "zone-b",
      phaseId: "phase-2",
      peakOccupancyRatio: 0.97,
      peakSeverity: "red",
      recommendedAction: "Reassign stewards to zone-b.",
    },
  ],
  staffingRecommendations: [
    {
      zoneId: "zone-b",
      phaseId: "phase-2",
      priority: "high",
      action: "Open overflow queue lane near gate-2.",
      expectedImpact: "Lower queue pressure before kickoff.",
    },
  ],
  assumptionsLimitations: ["No live sensor telemetry included."],
  evidence: {
    runDeterministicHash: "fixture-hash-01",
    generatedFrom: "simulation-output",
    rowsAnalyzed: 4,
    peakZones: ["zone-b"],
    warnings: [],
  },
  executiveSummary: "Prioritize mitigation in zone-b for phase-2.",
})

describe("reporting flow", () => {
  afterEach(() => {
    useRiskReportStore.getState().setGenerator(null)
    useRiskReportStore.getState().reset()
    useScenarioStore.setState({ latestSimulationOutput: null })
  })

  it("generates AI report automatically from simulation output updates", async () => {
    useRiskReportStore.getState().setGenerator(async () => aiResponse)

    useScenarioStore.getState().setLatestSimulationOutput(simulationOutputFixture)
    useRiskReportStore.getState().generateFromSimulation(simulationOutputFixture)

    await waitFor(() => {
      expect(useRiskReportStore.getState().status).toBe("success")
    })

    expect(useRiskReportStore.getState().report?.source).toBe("ai")
  })

  it("keeps simulation output available when AI fails and fallback is shown", async () => {
    useRiskReportStore.getState().setGenerator(async () => {
      throw new Error("timeout")
    })

    useScenarioStore.getState().setLatestSimulationOutput(simulationOutputFixture)
    useRiskReportStore.getState().generateFromSimulation(simulationOutputFixture)

    await waitFor(() => {
      expect(useRiskReportStore.getState().status).toBe("fallback")
    })

    expect(useScenarioStore.getState().latestSimulationOutput?.runDeterministicHash).toBe("fixture-hash-01")
    expect(useRiskReportStore.getState().report?.source).toBe("fallback")
  })

  it("retries report generation explicitly", async () => {
    let attempt = 0
    useRiskReportStore.getState().setGenerator(async () => {
      attempt += 1
      if (attempt === 1) {
        throw new Error("transient")
      }
      return aiResponse
    })

    useScenarioStore.getState().setLatestSimulationOutput(simulationOutputFixture)
    useRiskReportStore.getState().generateFromSimulation(simulationOutputFixture)

    await waitFor(() => {
      expect(useRiskReportStore.getState().status).toBe("fallback")
    })

    await useRiskReportStore.getState().retryReportGeneration()

    await waitFor(() => {
      expect(useRiskReportStore.getState().status).toBe("success")
    })
    expect(attempt).toBe(2)
  })
})
