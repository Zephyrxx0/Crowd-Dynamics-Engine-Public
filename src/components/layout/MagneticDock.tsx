import { useEffect, useMemo, useRef, useState } from "react"
import { animate } from "animejs"
import { CloudUpload, FileText, GitCompareArrows, Home, SlidersHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

type DockItem = {
  label: string
  target: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}

const MAX_RADIUS = 180
const MAX_PULL = 14
const MAX_SCALE = 0.22

export function MagneticDock({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) {
  const refs = useRef<HTMLButtonElement[]>([])
  const [reducedMotion, setReducedMotion] = useState(false)

  const items = useMemo<DockItem[]>(
    () => [
      { label: "Overview", target: "overview", icon: Home },
      { label: "Simulate", target: "simulate", icon: SlidersHorizontal },
      { label: "Compare", target: "compare", icon: GitCompareArrows },
      { label: "Report", target: "report", icon: FileText },
      { label: "Deploy", target: "deploy", icon: CloudUpload },
    ],
    []
  )

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(media.matches)

    update()
    media.addEventListener("change", update)

    return () => {
      media.removeEventListener("change", update)
    }
  }, [])

  const applyMagnet = (clientX: number, clientY: number) => {
    if (reducedMotion) {
      return
    }

    refs.current.forEach((node) => {
      if (!node) {
        return
      }

      const rect = node.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const dx = clientX - centerX
      const dy = clientY - centerY
      const distance = Math.hypot(dx, dy)
      const force = Math.max(0, 1 - distance / MAX_RADIUS)

      animate(node, {
        translateX: dx * force * (MAX_PULL / MAX_RADIUS),
        translateY: dy * force * (MAX_PULL / MAX_RADIUS),
        scale: 1 + force * MAX_SCALE,
        duration: 180,
        ease: "out(3)",
      })
    })
  }

  const resetMagnet = () => {
    refs.current.forEach((node) => {
      if (!node) {
        return
      }

      animate(node, {
        translateX: 0,
        translateY: 0,
        scale: 1,
        duration: reducedMotion ? 80 : 220,
        ease: "out(4)",
      })
    })
  }

  return (
    <nav
      aria-label="Section navigation"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      className="dock-shell fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-none border border-border/60 bg-background/90 px-3 py-3 shadow-2xl backdrop-blur-md"
      onMouseMove={(event) => applyMagnet(event.clientX, event.clientY)}
      onMouseLeave={resetMagnet}
    >
      <ul className="flex items-center gap-2">
        {items.map((item, index) => {
          const Icon = item.icon
          const isActive = activeTab === item.target

          return (
            <li key={item.target}>
              <button
                ref={(node) => {
                  if (node) {
                    refs.current[index] = node
                  }
                }}
                type="button"
                className={cn(
                  "dock-item group flex size-12 flex-col items-center justify-center rounded-none border transition-colors",
                  isActive
                    ? "border-primary/50 bg-primary/20 text-primary shadow-[0_0_15px_rgba(236,78,2,0.2)]"
                    : "border-transparent bg-transparent text-foreground/70 hover:border-border hover:bg-card hover:text-foreground focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/60"
                )}
                onClick={() => onTabChange(item.target)}
                aria-label={item.label}
                title={item.label}
              >
                <Icon className={cn("size-5", isActive ? "text-primary" : "")} aria-hidden={true} />
                <span className="sr-only">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}