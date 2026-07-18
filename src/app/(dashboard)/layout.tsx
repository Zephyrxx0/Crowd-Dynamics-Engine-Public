"use client";

import { MatchBanner } from "@/components/dashboard/MatchBanner";
import { WeatherCard } from "@/components/dashboard/WeatherCard";
import { DemoModeBanner } from "@/components/dashboard/DemoModeBanner";
import { DemoToggle } from "@/components/dashboard/DemoToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Premium dark header with dot grid */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6 relative">
          <Menu className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-sm font-semibold uppercase tracking-widest text-foreground">Command Center</h1>
          
          <div className="ml-auto flex items-center gap-4">
            <LanguageSwitcher />
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Systems Nominal</span>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 pb-6 md:px-6 mt-4">
        <div className="space-y-3 mb-6">
          <MatchBanner />
          <WeatherCard />
          <DemoModeBanner />
          <div className="flex items-center justify-between max-w-5xl mx-auto w-full px-1">
            <DemoToggle />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
