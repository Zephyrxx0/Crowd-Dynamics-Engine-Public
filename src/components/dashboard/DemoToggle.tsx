"use client";

import { useLiveStore } from "@/stores/liveStore";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";

export function DemoToggle() {
  const isDemo = useLiveStore((s) => s.isDemo);
  const setIsDemo = useLiveStore((s) => s.setIsDemo);
  const resetAll = useLiveStore((s) => s.resetAll);
  const match = useLiveStore((s) => s.match);

  // Hide toggle when live match data is active AND not already in demo mode
  // Show when match data is unavailable (auto-fallback) OR demo mode is active
  if (match !== null && !isDemo) return null;

  const handleModeSwitch = useCallback(
    (mode: "live" | "demo") => {
      if (mode === "demo" && !isDemo) {
        resetAll();
        setIsDemo(true);
      } else if (mode === "live" && isDemo) {
        resetAll();
        setIsDemo(false);
      }
    },
    [isDemo, resetAll, setIsDemo]
  );

  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant={!isDemo ? "default" : "ghost"}
        size="sm"
        onClick={() => handleModeSwitch("live")}
      >
        Live
      </Button>
      <Button
        variant={isDemo ? "default" : "ghost"}
        size="sm"
        onClick={() => handleModeSwitch("demo")}
      >
        Demo
      </Button>
    </div>
  );
}
