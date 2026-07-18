"use client";

import { useMemo } from "react"
import { FileText, GitCompareArrows, Home, LayoutDashboard, MessageSquare, SlidersHorizontal, Users } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

type DockItem = {
  label: string
  target: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}

export function MagneticDock() {
  const router = useRouter()
  const pathname = usePathname()

  const items = useMemo<DockItem[]>(
    () => [
      { label: "Overview", target: "/", icon: Home },
      { label: "Simulate", target: "/simulate", icon: SlidersHorizontal },
      { label: "Compare", target: "/compare", icon: GitCompareArrows },
      { label: "Report", target: "/report", icon: FileText },
      { label: "Dashboard", target: "/dashboard", icon: LayoutDashboard },
      { label: "Volunteer", target: "/volunteer", icon: Users },
    ],
    []
  )

  return (
    <nav
      aria-label="Section navigation"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border/50 bg-background/95 px-4 py-3 shadow-[0_8px_32px_oklch(0_0_0_/_0.4),_0_0_0_1px_oklch(1_0_0_/_0.05)] backdrop-blur-xl"
    >
      <ul className="flex items-center gap-2">
        {items.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.target || (pathname.startsWith(item.target) && item.target !== "/")

          return (
            <li key={item.target}>
              <button
                type="button"
                className={cn(
                  "dock-item group relative flex h-14 min-w-14 flex-col items-center justify-center rounded-full px-3 transition-colors",
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
                <Icon className={cn("size-[24px] shrink-0", isActive ? "text-primary" : "")} aria-hidden={true} />
                <span className="sr-only">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}