"use client";

import { useLiveStore } from "@/stores/liveStore";
import { Card, CardContent } from "@/components/ui/card";
import { TriangleAlert } from "lucide-react";

export function DemoModeBanner() {
  const isDemo = useLiveStore((s) => s.isDemo);

  if (!isDemo) return null;

  return (
    <Card className="w-full max-w-5xl mx-auto border-amber-500/50 bg-amber-500/10">
      <CardContent className="flex flex-row items-center justify-center gap-2 px-4 py-2">
        <TriangleAlert className="h-4 w-4 text-amber-500 shrink-0" />
        <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">
          DEMO MODE — Using canned match sequence
        </p>
      </CardContent>
    </Card>
  );
}
