"use client";

import { MagneticDock } from "@/components/layout/MagneticDock";
import { useState } from "react";

export default function FanLayout({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {children}
      </main>
      <MagneticDock activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
