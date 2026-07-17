import { VISUALIZATION_TRANSITION_MS } from "./motionPolicy"

export type RiskBand = "green" | "amber" | "red" | "critical"

export const RISK_THRESHOLDS = {
  amber: 0.8,
  red: 0.95,
  critical: 1.2,
} as const

export const RISK_BAND_ORDER: ReadonlyArray<RiskBand> = ["green", "amber", "red", "critical"]

export const RISK_LEGEND: ReadonlyArray<{ band: RiskBand; label: string; color: string }> = [
  { band: "green", label: "Low", color: "#16a34a" },
  { band: "amber", label: "Elevated", color: "#f59e0b" },
  { band: "red", label: "High", color: "#dc2626" },
  { band: "critical", label: "Critical", color: "#991b1b" },
]

export function riskBandFromRatio(ratio: number): RiskBand {
  if (ratio >= RISK_THRESHOLDS.critical) {
    return "critical"
  }

  if (ratio >= RISK_THRESHOLDS.red) {
    return "red"
  }

  if (ratio >= RISK_THRESHOLDS.amber) {
    return "amber"
  }

  return "green"
}

export { VISUALIZATION_TRANSITION_MS }
