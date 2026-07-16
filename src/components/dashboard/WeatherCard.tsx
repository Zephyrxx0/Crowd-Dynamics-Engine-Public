"use client";

import { useLiveStore } from "@/stores/liveStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { getImpactNote } from "@/lib/api/weather";
import type { WeatherImpact } from "@/stores/slices/weatherSlice";

interface WeatherCardProps {
  error?: string | null;
  isLoading?: boolean;
}

// Icon map for OWM condition names
const weatherIcons: Record<string, LucideIcon> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudRain,
  Snow: CloudSnow,
  Thunderstorm: CloudLightning,
  Mist: CloudFog,
  Fog: CloudFog,
  Haze: CloudFog,
};

// Impact configuration for chips and colors
const impactConfig: Record<
  WeatherImpact,
  {
    label: string;
    badgeClass: string;
    iconClass: string;
    noteClass: string;
  }
> = {
  none: {
    label: "No Impact",
    badgeClass: "", // secondary variant
    iconClass: "h-10 w-10 text-amber-500",
    noteClass: "",
  },
  rain: {
    label: "Rain",
    badgeClass:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25 border-transparent",
    iconClass: "h-10 w-10 text-blue-500",
    noteClass: "text-blue-600 dark:text-blue-400",
  },
  heat: {
    label: "Heat",
    badgeClass:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border-transparent",
    iconClass: "h-10 w-10 text-amber-500",
    noteClass: "text-amber-600 dark:text-amber-400",
  },
  storm: {
    label: "Storm",
    badgeClass: "", // destructive variant
    iconClass: "h-10 w-10 text-destructive",
    noteClass: "text-destructive",
  },
};

export function WeatherCard({ error, isLoading }: WeatherCardProps) {
  const weather = useLiveStore((s) => s.weather);

  // ── State 1: Loading skeleton ──────────────────────────────────────────────
  if (isLoading && !weather) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardContent className="flex flex-row items-center gap-4 px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6 animate-pulse">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── State 2: Error (no prior data) ─────────────────────────────────────────
  if (error && !weather) {
    return (
      <Card className="w-full max-w-5xl mx-auto border-amber-500/50 bg-amber-500/10">
        <CardContent className="flex flex-row items-center justify-center gap-2 px-4 py-8">
          <TriangleAlert className="h-5 w-5 text-amber-500" />
          <p className="text-amber-600 dark:text-amber-400 font-medium">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // ── State 9 edge case: no weather, no loading, no error ───────────────────
  if (!weather) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center px-4 py-8">
          <p className="text-muted-foreground">No weather data available</p>
        </CardContent>
      </Card>
    );
  }

  // ── States 3–5: Loaded (with or without error stale data bar) ─────────────
  const impact = weather.impact ?? "none";
  const config = impactConfig[impact];
  const conditionKey = weather.conditions ?? "Clear";
  const WeatherIcon = weatherIcons[conditionKey] ?? Cloud;
  const impactNote = getImpactNote(impact);

  return (
    <Card
      className={cn(
        "w-full max-w-5xl mx-auto relative overflow-hidden border border-border",
        error ? "border-amber-500/30" : ""
      )}
    >
      {/* State 3: Error with prior data — amber warning bar */}
      {error && (
        <div className="w-full bg-amber-500/10 px-4 py-2 flex items-center gap-2 border-b border-amber-500/20">
          <TriangleAlert className="h-4 w-4 text-amber-500" />
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            {error}
          </p>
        </div>
      )}

      <CardContent className="px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Left: icon + city */}
          <div className="flex flex-col items-center sm:items-start gap-1">
            <WeatherIcon className={config.iconClass} />
            <span className="text-sm font-medium text-muted-foreground">
              New York
            </span>
          </div>

          {/* Center: temperature + conditions */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-bold">
              {weather.temperature !== null ? `${weather.temperature}°C` : "—"}
            </span>
            <span className="text-sm text-muted-foreground">
              {weather.conditions}
            </span>
          </div>

          {/* Right: humidity + wind + impact chip */}
          <div className="flex flex-col items-center sm:items-end gap-2">
            <div className="flex flex-row gap-3 text-sm text-muted-foreground">
              {weather.humidity !== undefined && weather.humidity !== null && (
                <span>Humidity: {weather.humidity}%</span>
              )}
              {weather.windSpeed !== undefined && weather.windSpeed !== null && (
                <span>Wind: {weather.windSpeed} km/h</span>
              )}
            </div>
            {impact === "none" ? (
              <Badge variant="secondary">{config.label}</Badge>
            ) : impact === "storm" ? (
              <Badge variant="destructive">{config.label}</Badge>
            ) : (
              <Badge className={config.badgeClass}>{config.label}</Badge>
            )}
          </div>
        </div>

        {/* Impact note row */}
        {impactNote && (
          <div className="mt-2 text-xs font-medium text-center sm:text-left">
            <span className={config.noteClass}>{impactNote}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
