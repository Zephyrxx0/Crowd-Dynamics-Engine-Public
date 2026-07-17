"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { GitBranch, Moon, Sun } from "lucide-react"

export function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  if (pathname === "/") {
    return null
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-[1600px] flex h-16 items-center px-4 md:px-8">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-sans text-xl font-bold tracking-tighter text-primary uppercase">Crowd</span>
            <span className="font-sans font-semibold text-foreground/80 uppercase">Dynamics</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-4">
            <Link
              href="https://github.com/Zephyrxx0/Crowd-Dynamics-Engine-Public"
              target="_blank"
              rel="noreferrer"
              className="text-foreground/60 hover:text-foreground transition-colors"
            >
              <GitBranch className="h-5 w-5" />
              <span className="sr-only">GitHub Repo</span>
            </Link>
            
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-foreground/60 hover:text-foreground transition-colors"
            >
              <Sun className="h-5 w-5 hidden dark:block" />
              <Moon className="h-5 w-5 block dark:hidden" />
              <span className="sr-only">Toggle theme</span>
            </button>

            <div className="px-3 py-1 bg-primary text-primary-foreground text-xs font-sans font-bold rounded-full shadow-sm ml-2">
              v2.4.0
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
