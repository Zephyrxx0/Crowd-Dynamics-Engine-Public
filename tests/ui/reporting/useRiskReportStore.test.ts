import { afterEach, describe, expect, it, vi } from "vitest"

import { useRiskReportStore } from "@/hooks/useRiskReportStore"
import { buildDeterministicRiskReport } from "@/reporting/fallback/buildDeterministicRiskReport"
import { simulationOutputFixture } from "../fixtures/simulationOutput"

const aiResponse = JSON.stringify({
  source: "ai",
  generatedAt: "2026-04-19T00:00:00Z",
  overall: {
    riskLevel: "amber",
    confidence: 0.88,
    rationale: "Elevated occupancy trend in phase-2.",
  },
  criticalZones: [
    {
      zoneId: "zone-b",
      phaseId: "phase-2",
      peakOccupancyRatio: 0.97,
      peakSeverity: "red",
      recommendedAction: "Deploy stewards to zone-b.",
    },
  ],
  staffingRecommendations: [
    {
      zoneId: "zone-b",
      phaseId: "phase-2",
      priority: "high",
      action: "Reinforce gate-2 queue lane.",
      expectedImpact: "Reduce spillover toward concourse.",
    },
  ],
  assumptionsLimitations: ["Recommendations are based on deterministic simulation output only."],
  evidence: {
    runDeterministicHash: "fixture-hash-01",
    generatedFrom: "simulation-output",
    rowsAnalyzed: 4,
    peakZones: ["zone-b"],
    warnings: [],
  },
  executiveSummary: "Prioritize zone-b mitigation for phase-2.",
})

describe("useRiskReportStore", () => {
  afterEach(() => {
    useRiskReportStore.getState().setGenerator(null)
    useRiskReportStore.getState().reset()
    vi.restoreAllMocks()
  })

  it("stores AI report on successful generation", async () => {
    useRiskReportStore.getState().setGenerator(async () => aiResponse)

    await useRiskReportStore.getState().generateFromSimulation(simulationOutputFixture)

    const state = useRiskReportStore.getState()
    expect(state.status).toBe("success")
    expect(state.report?.source).toBe("ai")
    expect(state.errorMessage).toBeNull()
  })

  it("falls back deterministically on AI generation error", async () => {
    useRiskReportStore.getState().setGenerator(async () => {
      throw new Error("rate limited")
    })

    await useRiskReportStore.getState().generateFromSimulation(simulationOutputFixture)

    const state = useRiskReportStore.getState()
    expect(state.status).toBe("fallback")
    expect(state.report?.source).toBe("fallback")
    expect(state.errorMessage).toContain("rate limited")
  })

  it("enforces one-call-per-run unless forced", async () => {
    const invoke = vi.fn(async () => aiResponse)
    useRiskReportStore.getState().setGenerator(invoke)

    await useRiskReportStore.getState().generateFromSimulation(simulationOutputFixture)
    await useRiskReportStore.getState().generateFromSimulation(simulationOutputFixture)

    expect(invoke).toHaveBeenCalledTimes(1)

    await useRiskReportStore.getState().retryReportGeneration()
    expect(invoke).toHaveBeenCalledTimes(2)
  })

  it("marks API-returned fallback reports as fallback status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => buildDeterministicRiskReport(simulationOutputFixture),
      }))
    )

    await useRiskReportStore.getState().generateFromSimulation(simulationOutputFixture)

    const state = useRiskReportStore.getState()
    expect(state.status).toBe("fallback")
    expect(state.report?.source).toBe("fallback")
    expect(state.errorMessage).toContain("deterministic fallback")
  })
})
