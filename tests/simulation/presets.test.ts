import { describe, expect, it } from "vitest"

import { SimulationInputSchema } from "../../src/simulation/contracts/input.schema"
import { SimulationOutputSchema } from "../../src/simulation/contracts/output.schema"
import { simulateDeterministic } from "../../src/simulation/core/simulateDeterministic"
import { presets } from "../../src/simulation/presets"

describe("presets", () => {
  it("exposes normal, rush, and crisis presets", () => {
    expect(Object.keys(presets).sort()).toEqual(["crisis", "normal", "rush"])
  })

  it("validates each preset against SimulationInputSchema", () => {
    for (const [name, preset] of Object.entries(presets)) {
      expect(() => SimulationInputSchema.parse(preset), `preset ${name}`).not.toThrow()
    }
  })

  it("normal preset produces valid SimulationOutput", () => {
    const output = simulateDeterministic(presets.normal)
    expect(() => SimulationOutputSchema.parse(output)).not.toThrow()
  })

  it("rush preset produces valid SimulationOutput", () => {
    const output = simulateDeterministic(presets.rush)
    expect(() => SimulationOutputSchema.parse(output)).not.toThrow()
  })

  it("crisis preset produces valid SimulationOutput", () => {
    const output = simulateDeterministic(presets.crisis)
    expect(() => SimulationOutputSchema.parse(output)).not.toThrow()
  })

  it("outputs have unique phaseZoneMatrix entries per phase and zone", () => {
    for (const preset of Object.values(presets)) {
      const output = simulateDeterministic(preset)
      const keys = output.phaseZoneMatrix.map((row) => `${row.phaseId}:${row.zoneId}`)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })
})
