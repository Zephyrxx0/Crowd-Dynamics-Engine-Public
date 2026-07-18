import fc from "fast-check"
import { describe, expect, it } from "vitest"

import { simulateDeterministic } from "@/simulation/core/simulateDeterministic"
import { presets } from "@/simulation/presets"

describe("simulation determinism", () => {
  it("same input produces identical output", () => {
    fc.assert(
      fc.property(fc.constantFrom(...Object.values(presets)), (input) => {
        const first = simulateDeterministic(input)
        const second = simulateDeterministic(input)
        expect(first).toEqual(second)
      }),
    )
  })

  it("output remains stable on 10 repeated calls", () => {
    for (const input of Object.values(presets)) {
      const baseline = simulateDeterministic(input)
      for (let run = 0; run < 10; run += 1) {
        expect(simulateDeterministic(input)).toEqual(baseline)
      }
    }
  })

  it("never produces negative occupancy or carry values", () => {
    fc.assert(
      fc.property(fc.constantFrom(...Object.values(presets)), (input) => {
        const output = simulateDeterministic(input)
        for (const row of output.phaseZoneMatrix) {
          expect(row.occupancyFans).toBeGreaterThanOrEqual(0)
          expect(row.carryInFans).toBeGreaterThanOrEqual(0)
          expect(row.overflowCarryFans).toBeGreaterThanOrEqual(0)
        }
      }),
    )
  })

  it("matrix size matches phase-zone cardinality", () => {
    fc.assert(
      fc.property(fc.constantFrom(...Object.values(presets)), (input) => {
        const output = simulateDeterministic(input)
        const multiplier = input.mode === "detailed" ? input.detailed?.subZonesPerZone ?? 1 : 1
        expect(output.phaseZoneMatrix).toHaveLength(input.phases.length * input.zones.length * multiplier)
      }),
    )
  })
})
