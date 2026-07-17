import { AlertCircle } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type ValidationListProps = {
  errors: string[]
}

export function ValidationList({ errors }: ValidationListProps) {
  const [visibleErrors, setVisibleErrors] = useState<string[]>([])
  const [isExiting, setIsExiting] = useState(false)
  const hadErrors = useRef(false)

  useEffect(() => {
    if (errors.length > 0) {
      hadErrors.current = true
      setIsExiting(false)
      setVisibleErrors(errors)
    } else if (hadErrors.current) {
      hadErrors.current = false
      setIsExiting(true)
      const timer = setTimeout(() => {
        setVisibleErrors([])
        setIsExiting(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [errors])

  if (visibleErrors.length === 0 && !isExiting) return null

  return (
    <div
      className={cn(
        "rounded-md bg-destructive/5 px-3 py-2.5 will-change-transform shadow-[0px_0px_0px_1px_oklch(0.55_0.18_0.10/0.3)] dark:shadow-[0_0_0_1px_oklch(0.7_0.2_0.15/0.4)]",
        isExiting ? "validation-exit" : "stagger-enter",
      )}
      data-testid="validation-list"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div>
          <p className="text-xs font-semibold text-destructive">Fix input issues before running</p>
          <ul className="mt-1 space-y-0.5">
            {visibleErrors.map((error) => (
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
