import { useMemo } from "react"

import { SensitivityNarrative } from "@/comparison/components/SensitivityNarrative"
import { useComparisonStore } from "@/hooks/useComparisonStore"
import { useRiskReportStore } from "@/hooks/useRiskReportStore"
import { buildComparisonViewModel } from "@/comparison/selectors/buildComparisonViewModel"
import { ExportActions } from "@/export/components/ExportActions"

export function ComparisonPanel() {
  const runHistory = useComparisonStore((state) => state.runHistory)
  const baselineRunId = useComparisonStore((state) => state.baselineRunId)
  const candidateRunId = useComparisonStore((state) => state.candidateRunId)
  const selectBaselineRun = useComparisonStore((state) => state.selectBaselineRun)
  const selectCandidateRun = useComparisonStore((state) => state.selectCandidateRun)
  const report = useRiskReportStore((state) => state.report)

  const baseline = useMemo(() => runHistory.find((run) => run.id === baselineRunId) ?? null, [runHistory, baselineRunId])
  const candidate = useMemo(() => runHistory.find((run) => run.id === candidateRunId) ?? null, [runHistory, candidateRunId])
  const model = useMemo(() => buildComparisonViewModel(baseline, candidate), [baseline, candidate])

  return (
    <section className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-xl relative overflow-hidden" data-testid="comparison-panel">
      <div className="border-b border-border pb-6">
        <h2 className="text-2xl font-bold tracking-widest uppercase text-foreground">Scenario Comparison</h2>
        <p className="text-sm text-muted-foreground mt-2">Select baseline and candidate runs to quantify intervention impact.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="space-y-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground flex flex-col">
          <span>Baseline run</span>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={baselineRunId ?? ""}
            onChange={(event) => selectBaselineRun(event.target.value || null)}
          >
            <option value="" className="bg-background text-foreground">Select baseline</option>
            {runHistory.map((run) => (
              <option key={run.id} value={run.id} className="bg-background text-foreground">
                {run.scenarioLabel} | {new Date(run.createdAt).toLocaleTimeString()} | {run.runDeterministicHash}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground flex flex-col">
          <span>Candidate run</span>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={candidateRunId ?? ""}
            onChange={(event) => selectCandidateRun(event.target.value || null)}
          >
            <option value="" className="bg-background text-foreground">Select candidate</option>
            {runHistory.map((run) => (
              <option key={run.id} value={run.id} className="bg-background text-foreground">
                {run.scenarioLabel} | {new Date(run.createdAt).toLocaleTimeString()} | {run.runDeterministicHash}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!model ? (
        <p className="text-sm text-muted-foreground italic bg-muted p-4 rounded-md border border-border" data-testid="comparison-empty-state">
          Run and select two different simulations to see top-zone deltas.
        </p>
      ) : (
        <div className="space-y-4" data-testid="comparison-results">
          <div className="bg-muted border border-border p-4 rounded-lg">
            <p className="text-sm text-foreground font-mono">
              Overall peak change: <span className="text-primary">{(model.overall.baselinePeakRatio * 100).toFixed(1)}%</span> {"->"} <span className="text-primary">{(model.overall.candidatePeakRatio * 100).toFixed(1)}%</span>
              {' '}(<span className={model.overall.absoluteDelta >= 0 ? "text-red-400" : "text-green-400"}>{model.overall.absoluteDelta >= 0 ? "+" : ""}{(model.overall.absoluteDelta * 100).toFixed(1)} pts</span>, <span className={model.overall.percentDelta >= 0 ? "text-red-400" : "text-green-400"}>{model.overall.percentDelta >= 0 ? "+" : ""}{model.overall.percentDelta.toFixed(1)}%</span>)
            </p>
          </div>
          <ul className="space-y-2 text-sm text-foreground font-mono">
            {model.topZoneDeltas.map((zone) => (
              <li key={zone.zoneId} className="bg-muted border border-border p-3 rounded-lg flex items-center gap-2">
                <strong className="text-primary uppercase mr-2">{zone.zoneId}</strong>: {(zone.baselinePeakRatio * 100).toFixed(1)}% {"->"} {(zone.candidatePeakRatio * 100).toFixed(1)}%
                {' '}(<span className={zone.absoluteDelta >= 0 ? "text-red-400" : "text-green-400"}>{zone.absoluteDelta >= 0 ? "+" : ""}{(zone.absoluteDelta * 100).toFixed(1)} pts</span>, <span className={zone.percentDelta >= 0 ? "text-red-400" : "text-green-400"}>{zone.percentDelta >= 0 ? "+" : ""}{zone.percentDelta.toFixed(1)}%</span>)
                {' '}| <span className="text-muted-foreground text-xs uppercase tracking-widest">{zone.severityTransition}</span>
              </li>
            ))}
          </ul>
          <div className="pt-4 border-t border-border">
            <SensitivityNarrative model={model} />
          </div>
          <ExportActions model={model} report={report} />
        </div>
      )}
    </section>
  )
}
