import { describe, expect, it } from "vitest"
import { CURRENT_SCHEMA_VERSION } from "../../src/simulation/contracts/schemaVersion"
import { SimulationInputSchema } from "../../src/simulation/contracts/input.schema"
import { SimulationOutputSchema } from "../../src/simulation/contracts/output.schema"
import { simulateDeterministic } from "../../src/simulation/core/simulateDeterministic"
import * as simulationExports from "../../src/simulation"
import { createBaseInput } from "./fixtures"

describe("simulation contracts", () => {
  it("rejects missing schemaVersion", () => {
    const payload = { ...createBaseInput() }
    // @ts-expect-error - intentional negative contract test
    delete payload.schemaVersion

    const result = SimulationInputSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it("rejects invalid schemaVersion", () => {
    const payload = { ...createBaseInput(), schemaVersion: "0.9.0" }
    const result = SimulationInputSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it("accepts valid payload and output contains versioned contract fields", () => {
    const payload = createBaseInput({ schemaVersion: CURRENT_SCHEMA_VERSION })
    const inputResult = SimulationInputSchema.safeParse(payload)
    expect(inputResult.success).toBe(true)

    const output = simulateDeterministic(payload)
    const outputResult = SimulationOutputSchema.safeParse(output)
    expect(outputResult.success).toBe(true)
    expect(output.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(output.phaseZoneMatrix.length).toBeGreaterThan(0)
    expect(output.peakSummaries.length).toBeGreaterThan(0)
    expect(output.invariants).toBeDefined()
  })

  it("rejects arrivals referencing unknown phases or zones", () => {
    const badPhaseArrival = createBaseInput({
      arrivals: [{ phaseId: "missing-phase", zoneId: "north", demandFans: 20 }],
    })

    const badZoneArrival = createBaseInput({
      arrivals: [{ phaseId: "entry", zoneId: "missing-zone", demandFans: 20 }],
    })

    expect(SimulationInputSchema.safeParse(badPhaseArrival).success).toBe(false)
    expect(SimulationInputSchema.safeParse(badZoneArrival).success).toBe(false)
  })

  it("rejects detailed mode payload when two-sub-zone metadata is not explicit", () => {
    const missingDetailed = createBaseInput({
      mode: "detailed",
      detailed: undefined,
    })

    expect(SimulationInputSchema.safeParse(missingDetailed).success).toBe(false)
  })

  it("exports simulateDeterministic directly from the simulation barrel", () => {
    const payload = createBaseInput()
    const exported = simulationExports.simulateDeterministic(payload)
    const pure = simulateDeterministic(payload)

    expect(exported).toEqual(pure)
  })
})
