import { beforeEach, describe, expect, it } from "vitest"

import { getZoneData, _resetZoneDataCache, ZONE_FRIENDLY_NAMES } from "@/lib/api/zoneData"
import { simulateDeterministic } from "@/simulation/core/simulateDeterministic"
import { presets } from "@/simulation/presets"

describe("zoneData", () => {
  beforeEach(() => {
    _resetZoneDataCache()
  })

  it("returns cached data on second call without args", () => {
    const first = getZoneData()
    const second = getZoneData()
    expect(second).toBe(first)
  })

  it("returns fresh data when simOutput is provided", () => {
    const cached = getZoneData()
    const fresh = getZoneData(simulateDeterministic(presets.rush))
    expect(fresh).not.toBe(cached)
    expect(fresh.length).toBeGreaterThan(0)
  })

  it("applies ZONE_FRIENDLY_NAMES to zone entries", () => {
    const zones = getZoneData()
    expect(zones.find((zone) => zone.id === "north")?.name).toBe(ZONE_FRIENDLY_NAMES.north)
  })

  it("handles unknown zone IDs without friendly name fallback", () => {
    const zones = getZoneData([{ zoneId: "unknown-zone", occupancyRatio: 0.5 }])
    expect(zones[0]).toMatchObject({
      id: "unknown-zone",
      name: "unknown-zone",
      occupancyRatio: 0.5,
    })
  })
})
