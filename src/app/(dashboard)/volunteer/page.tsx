"use client";

import { AssignedZoneWidget } from "@/components/volunteer/AssignedZoneWidget";
import { VolunteerScanner } from "@/components/volunteer/VolunteerScanner";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { useLiveStore } from "@/stores/liveStore";
import { ClipboardList } from "lucide-react";
import { useMemo } from "react";

function formatGateLabel(zoneId: string) {
  const suffix = zoneId.replace(/^zone-/, "").toUpperCase();
  return suffix ? `Gate ${suffix}` : `Gate ${zoneId.toUpperCase()}`;
}

export default function VolunteerPage() {
  const alerts = useLiveStore((s) => s.alerts);
  const criticalAlert = alerts.find((alert) => alert.severity === "critical");
  const alertZone = criticalAlert?.zoneId ?? "zone-c";
  const gateLabel = formatGateLabel(alertZone);
  const rosterNumber = useMemo(() => Math.floor(Math.random() * 100) + 1, []);
  const currentTask = criticalAlert
    ? `Zone ${alertZone.toUpperCase()} alert: ${criticalAlert.message}`
    : "All zones nominal — monitor crowd entry at assigned gate.";

  return (
    <div className="mx-auto w-full max-w-md pb-24 md:pb-0 px-4 pt-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Volunteer Portal</h1>
          <p className="text-sm text-muted-foreground">{gateLabel} • Duty Roster #{rosterNumber}</p>
        </div>
      </div>

      {/* Task Card */}
      <div className="bg-primary text-primary-foreground rounded-xl p-5 shadow-md">
        <h2 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Current Task</h2>
        <p className="text-lg font-medium leading-tight">{currentTask}</p>
      </div>

      {/* Zone Telemetry */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">Zone Telemetry</h2>
        <AssignedZoneWidget zoneId={alertZone} />
      </section>

      {/* Scanner Mock */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">Access Control</h2>
        <VolunteerScanner />
      </section>

      {/* Targeted Alerts */}
      <section className="h-[400px] flex flex-col rounded-xl overflow-hidden border border-border">
        <h2 className="sr-only">Zone Alerts</h2>
        <AlertFeed />
      </section>
    </div>
  );
}
