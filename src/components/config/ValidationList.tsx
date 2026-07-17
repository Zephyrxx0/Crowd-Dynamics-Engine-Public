import { AlertCircle } from "lucide-react"

type ValidationListProps = {
  errors: string[]
}

export function ValidationList({ errors }: ValidationListProps) {
  if (errors.length === 0) {
    return null
  }

  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5" data-testid="validation-list">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div>
          <p className="text-xs font-semibold text-destructive">Fix input issues before running</p>
          <ul className="mt-1 space-y-0.5">
            {errors.map((error) => (
              <li key={error} className="text-xs text-destructive/80 font-mono">
                {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
