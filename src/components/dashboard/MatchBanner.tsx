"use client";

import { useLiveStore } from "@/stores/liveStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Calendar, TriangleAlert } from "lucide-react";

interface MatchBannerProps {
  error?: string | null;
  isLoading?: boolean;
}

export function MatchBanner({ error, isLoading }: MatchBannerProps) {
  const match = useLiveStore((s) => s.match);
  const upcomingMatch = useLiveStore((s) => s.upcomingMatch);

  if (isLoading) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
          <Skeleton className="h-6 w-32" />
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-6 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (error && !match) {
    return (
      <Card className="w-full max-w-5xl mx-auto border-amber-500/50 bg-amber-500/10">
        <CardContent className="flex flex-row items-center justify-center gap-2 px-4 py-8">
          <TriangleAlert className="h-5 w-5 text-amber-500" />
          <p className="text-amber-600 dark:text-amber-400 font-medium">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!match) {
    if (upcomingMatch) {
      return (
        <Card className="w-full max-w-5xl mx-auto bg-muted/50">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
            <div className="text-2xl font-semibold text-muted-foreground">{upcomingMatch.homeTeam}</div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-medium text-muted-foreground">vs</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{upcomingMatch.localDate}</span>
              </div>
              <Badge variant="secondary">UPCOMING</Badge>
            </div>
            <div className="text-2xl font-semibold text-muted-foreground">{upcomingMatch.awayTeam}</div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center px-4 py-8">
          <p className="text-muted-foreground">No match data available</p>
        </CardContent>
      </Card>
    );
  }

  // Live match or Error with data
  return (
    <Card className={cn(
      "w-full max-w-5xl mx-auto relative overflow-hidden border border-border",
      error ? "border-amber-500/30" : ""
    )}>
      {error && (
        <div className="w-full bg-amber-500/10 px-4 py-2 flex items-center justify-center gap-2 border-b border-amber-500/20">
          <TriangleAlert className="h-4 w-4 text-amber-500" />
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{error}</p>
        </div>
      )}
      <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
        <div className="text-xl font-semibold tracking-tight">{match.homeTeam}</div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="text-5xl font-bold tabular-nums">{match.score}</div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              {match.minute !== null ? `${match.minute}'` : ""}
            </span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{match.phase}</span>
            <Badge variant="default" className="flex items-center gap-1.5 pl-1.5 bg-primary text-primary-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-foreground"></span>
              </span>
              LIVE
            </Badge>
          </div>
        </div>

        <div className="text-xl font-semibold tracking-tight">{match.awayTeam}</div>
      </CardContent>
    </Card>
  );
}
