import type { SimulationOutput } from "@/simulation/contracts/output.schema"
import { type RiskBand } from "@/visualization/contracts/riskEncoding"

export type ZoneSeriesPoint = {
  phaseId: string
  occupancyRatio: number
  riskBand: RiskBand
}

export type ZoneSeries = {
  zoneId: string
  points: ZoneSeriesPoint[]
}

export type LatestZoneRisk = {
  zoneId: string
  phaseId: string
  occupancyRatio: number
  riskBand: RiskBand
}

export type VisualizationModel = {
  phaseOrder: string[]
  zoneSeries: Record<string, ZoneSeries>
  latestZoneRisk: Record<string, LatestZoneRisk>
  topZoneIds: string[]
}

export function buildVisualizationModel(output: SimulationOutput): VisualizationModel {
  const phaseOrder = [...new Set(output.phaseZoneMatrix.map((row) => row.phaseId))].sort((a, b) =>
    a.localeCompare(b),
  )

  const phaseRank = new Map(phaseOrder.map((phaseId, index) => [phaseId, index]))

  const sortedRows = [...output.phaseZoneMatrix].sort((left, right) => {
    const leftRank = phaseRank.get(left.phaseId) ?? Number.MAX_SAFE_INTEGER
    const rightRank = phaseRank.get(right.phaseId) ?? Number.MAX_SAFE_INTEGER

    return (
      leftRank - rightRank ||
      left.zoneId.localeCompare(right.zoneId) ||
      left.phaseId.localeCompare(right.phaseId)
    )
  })

  const zoneSeries: Record<string, ZoneSeries> = {}
  const latestZoneRisk: Record<string, LatestZoneRisk> = {}

  for (const row of sortedRows) {
    if (!zoneSeries[row.zoneId]) {
      zoneSeries[row.zoneId] = {
        zoneId: row.zoneId,
        points: [],
      }
    }

    const riskBand = row.occupancySeverity as RiskBand
    zoneSeries[row.zoneId].points.push({
      phaseId: row.phaseId,
      occupancyRatio: row.occupancyRatio,
      riskBand,
    })

    const existing = latestZoneRisk[row.zoneId]
    const existingRank = existing ? (phaseRank.get(existing.phaseId) ?? Number.MIN_SAFE_INTEGER) : Number.MIN_SAFE_INTEGER
    const currentRank = phaseRank.get(row.phaseId) ?? Number.MIN_SAFE_INTEGER

    if (!existing || currentRank >= existingRank) {
      latestZoneRisk[row.zoneId] = {
        zoneId: row.zoneId,
        phaseId: row.phaseId,
        occupancyRatio: row.occupancyRatio,
        riskBand,
      }
    }
  }

  const orderedZoneEntries = Object.entries(zoneSeries).sort(([left], [right]) => left.localeCompare(right))
  const topZoneIds = Object.values(latestZoneRisk)
    .sort((left, right) => {
      return right.occupancyRatio - left.occupancyRatio || left.zoneId.localeCompare(right.zoneId)
    })
    .map((entry) => entry.zoneId)

  return {
    phaseOrder,
    zoneSeries: Object.fromEntries(orderedZoneEntries),
    latestZoneRisk,
    topZoneIds,
  }
}
