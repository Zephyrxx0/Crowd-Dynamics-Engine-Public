"use client";

import { useEffect, useMemo, useRef, useState } from "react"
import { animate } from "animejs"
import { CloudUpload, FileText, GitCompareArrows, Home, LayoutDashboard, MessageSquare, SlidersHorizontal } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

type DockItem = {
  label: string
  target: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}

const MAX_RADIUS = 180
const MAX_PULL = 14
const MAX_SCALE = 0.22

export function MagneticDock() {
  const refs = useRef<HTMLButtonElement[]>([])
  const [reducedMotion, setReducedMotion] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const items = useMemo<DockItem[]>(
    () => [
      { label: "Overview", target: "/", icon: Home },
      { label: "Simulate", target: "/simulate", icon: SlidersHorizontal },
      { label: "Compare", target: "/compare", icon: GitCompareArrows },
      { label: "Report", target: "/report", icon: FileText },
      { label: "Deploy", target: "/deploy", icon: CloudUpload },
      { label: "Dashboard", target: "/dashboard", icon: LayoutDashboard },
      { label: "Fan Chat", target: "/fan", icon: MessageSquare },
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
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border/50 bg-background/95 px-3 py-2.5 shadow-[0_8px_32px_oklch(0_0_0_/_0.4),_0_0_0_1px_oklch(1_0_0_/_0.05)] backdrop-blur-xl"
      onMouseMove={(event) => applyMagnet(event.clientX, event.clientY)}
      onMouseLeave={resetMagnet}
    >
      <ul className="flex items-center gap-1">
        {items.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.target || (pathname.startsWith(item.target) && item.target !== "/")

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
                  "dock-item group relative flex h-10 min-w-10 flex-col items-center justify-center rounded-full px-2.5 transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-foreground/50 hover:bg-card hover:text-foreground focus-visible:ring-1 focus-visible:ring-primary/60"
                )}
                onClick={() => router.push(item.target)}
                aria-label={item.label}
                title={item.label}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-full border border-primary/30" />
                )}
                <Icon className={cn("size-[17px] shrink-0", isActive ? "text-primary" : "")} aria-hidden={true} />
                <span className="sr-only">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}