"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveStore } from "@/stores/liveStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, AlertCircle, TriangleAlert, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertEvent } from "@/types/alert";

const severityConfig = {
  nominal: {
    icon: CheckCircle2,
    borderColor: "border-border",
    bgColor: "bg-emerald-500/8 dark:bg-emerald-500/6",
    badgeVariant: "outline" as const,
    badgeClass: "text-emerald-600 border-emerald-400/50 dark:text-emerald-400",
    iconColor: "text-emerald-500",
  },
  warning: {
    icon: AlertTriangle,
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/8 dark:bg-amber-500/6",
    badgeVariant: "secondary" as const,
    badgeClass: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
    iconColor: "text-amber-500",
  },
  critical: {
    icon: AlertCircle,
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/8 dark:bg-red-500/6",
    badgeVariant: "destructive" as const,
    badgeClass: "",
    iconColor: "text-red-500",
  },
};

interface AlertFeedProps {
  isDisconnected?: boolean;
}

export function AlertFeed({ isDisconnected }: AlertFeedProps) {
  const alerts = useLiveStore((s) => s.alerts);
  const clearAlerts = useLiveStore((s) => s.clearAlerts);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [showNewAlertsChip, setShowNewAlertsChip] = useState(false);
  const prevAlertCount = useRef(alerts.length);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const isVisible = entry.isIntersecting;
        setIsScrolledUp(!isVisible);
        
        if (isVisible) {
          setShowNewAlertsChip(false);
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (alerts.length > prevAlertCount.current) {
      if (isScrolledUp) {
        setShowNewAlertsChip(true);
      } else {
        sentinelRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
    prevAlertCount.current = alerts.length;
  }, [alerts, isScrolledUp]);

  const scrollToBottom = () => {
    sentinelRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewAlertsChip(false);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto relative overflow-hidden border border-border bg-background">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">Live AI Alerts</h2>
        <button
          type="button"
          onClick={clearAlerts}
          disabled={alerts.length === 0}
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          Clear All
        </button>
      </div>

      {isDisconnected && (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0 border-b">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Alert feed disconnected — showing last received data
          </AlertDescription>
        </Alert>
      )}

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No alerts yet — waiting for next analysis cycle
          </div>
        ) : (
          alerts.map((alert: AlertEvent) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={cn(
                  "border p-4 flex gap-4 items-start",
                  config.borderColor,
                  config.bgColor
                )}
              >
                <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.iconColor)} />
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={config.badgeVariant} className={cn("text-[10px] tracking-widest uppercase", config.badgeClass)}>
                      {alert.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {alert.zoneId && (
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Zone {alert.zoneId}
                    </div>
                  )}
                  <p className="text-sm text-foreground break-words leading-relaxed">{alert.message}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={sentinelRef} className="h-1 w-full shrink-0" />
      </div>

      {showNewAlertsChip && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
          <Button 
            size="sm" 
            variant="secondary" 
            className="shadow-lg rounded-full pointer-events-auto flex items-center gap-2"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
            New alerts below
          </Button>
        </div>
      )}
    </div>
  );
}
