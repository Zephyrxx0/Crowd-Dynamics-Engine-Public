import { RISK_LEGEND, RISK_THRESHOLDS } from "@/visualization/contracts/riskEncoding"

function descriptionForBand(band: "green" | "amber" | "red" | "critical") {
  if (band === "green") {
    return `< ${RISK_THRESHOLDS.amber.toFixed(2)}`
  }

  if (band === "amber") {
    return `${RISK_THRESHOLDS.amber.toFixed(2)}-${RISK_THRESHOLDS.red.toFixed(2)}`
  }

  if (band === "red") {
    return `${RISK_THRESHOLDS.red.toFixed(2)}-${RISK_THRESHOLDS.critical.toFixed(2)}`
  }

  return `>= ${RISK_THRESHOLDS.critical.toFixed(2)}`
}

export function RiskLegend() {
  return (
    <section aria-label="Risk legend" data-testid="risk-legend" className="rounded-md border border-slate-200 bg-white p-3">
      <h4 className="text-sm font-semibold text-slate-900">Risk Thresholds</h4>
      <ul className="mt-2 flex flex-wrap gap-3">
        {RISK_LEGEND.map((entry) => (
          <li
            key={entry.band}
            className="flex items-center gap-2 text-xs text-slate-700"
            data-testid={`risk-legend-${entry.band}`}
          >
            <span
              aria-hidden="true"
              className="inline-block size-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{entry.label}</span>
            <span>({descriptionForBand(entry.band)})</span>
          </li>
        ))}
      </ul>
    </section>
  )
}