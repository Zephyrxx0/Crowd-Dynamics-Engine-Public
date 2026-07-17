import type { ComparisonViewModel } from "@/comparison/selectors/buildComparisonViewModel"
import { buildSensitivityNarrative } from "@/comparison/narrative/buildSensitivityNarrative"

type SensitivityNarrativeProps = {
  model: ComparisonViewModel
}

export function SensitivityNarrative({ model }: SensitivityNarrativeProps) {
  const narrative = buildSensitivityNarrative(model)

  return (
    <section className="space-y-2" data-testid="sensitivity-narrative">
      <h3 className="text-sm font-semibold text-foreground">Intervention Sensitivity</h3>
      <p className="text-sm text-foreground mt-1 mb-2">{narrative.overall}</p>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {narrative.zones.map((zone) => (
          <li key={zone.zoneId}>{zone.sentence}</li>
        ))}
      </ul>
    </section>
  )
}
