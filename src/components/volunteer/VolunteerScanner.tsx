"use client";

import { useState } from "react";
import { ScanLine, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VolunteerScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);

  const simulateScan = () => {
    setIsScanning(true);
    setLastScan(null);
    setTimeout(() => {
      setIsScanning(false);
      setLastScan("Valid Ticket - Gate A");
      setTimeout(() => setLastScan(null), 3000);
    }, 1500);
  };

  return (
    <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4 flex flex-col items-center justify-center min-h-[240px]">
      <div className="text-center space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">Ticket Scanner</h3>
        <p className="text-xs text-muted-foreground">Scan physical or digital credentials</p>
      </div>

      <div className="relative w-full max-w-[200px] aspect-square bg-muted/30 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
        {isScanning ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-1 bg-primary animate-scan absolute top-0 shadow-[0_0_10px_oklch(var(--primary))]"></div>
            <ScanLine className="h-10 w-10 text-primary opacity-50 animate-pulse" />
          </div>
        ) : lastScan ? (
          <div className="flex flex-col items-center gap-2 text-emerald-500 animate-in zoom-in duration-300">
            <CheckCircle2 className="h-12 w-12" />
            <span className="text-sm font-medium">{lastScan}</span>
          </div>
        ) : (
          <ScanLine className="h-10 w-10 text-muted-foreground/50" />
        )}
      </div>

      <Button
        onClick={simulateScan}
        disabled={isScanning}
        className={cn("w-full max-w-[200px] uppercase tracking-wider text-xs", isScanning && "opacity-80")}
      >
        {isScanning ? "Scanning..." : "Simulate Scan"}
      </Button>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
