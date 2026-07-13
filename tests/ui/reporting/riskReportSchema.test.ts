import { describe, expect, it } from "vitest"

import { RiskReportSchema, RiskReportSectionKeys } from "@/reporting/contracts/riskReport.schema"
import { buildDeterministicRiskReport } from "@/reporting/fallback/buildDeterministicRiskReport"
import { simulationOutputFixture } from "../fixtures/simulationOutput"

describe("risk report schema", () => {
  it("accepts fallback output with all mandatory sections", () => {
    const fallback = buildDeterministicRiskReport(simulationOutputFixture)

    const parsed = RiskReportSchema.parse(fallback)
    expect(parsed.source).toBe("fallback")
    expect(Object.keys(parsed)).toEqual(expect.arrayContaining([...RiskReportSectionKeys]))
  })

  it("rejects payloads with missing required sections", () => {
    const fallback = buildDeterministicRiskReport(simulationOutputFixture)
    const invalid = {
      ...fallback,
      executiveSummary: undefined,
    }

    const parsed = RiskReportSchema.safeParse(invalid)
    expect(parsed.success).toBe(false)
  })

  it("rejects payloads with extra top-level fields", () => {
    const fallback = buildDeterministicRiskReport(simulationOutputFixture)
    const invalid = {
      ...fallback,
      unexpected: "field",
    }

    const parsed = RiskReportSchema.safeParse(invalid)
    expect(parsed.success).toBe(false)
  })
})
