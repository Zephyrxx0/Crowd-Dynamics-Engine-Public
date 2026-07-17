"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

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
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
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
