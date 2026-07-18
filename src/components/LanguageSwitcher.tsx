"use client";

import { useLiveStore } from "@/stores/liveStore";

export function LanguageSwitcher() {
  const language = useLiveStore((s) => s.language);
  const setLanguage = useLiveStore((s) => s.setLanguage);

  return (
    <div className="flex items-center gap-2 text-sm" role="group" aria-label="Select display language">
      <button 
        onClick={() => setLanguage("en")}
        aria-label="Switch to English"
        aria-pressed={language === "en"}
        className={`px-2 py-1 rounded transition-colors ${language === "en" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
      >
        EN
      </button>
      <button 
        onClick={() => setLanguage("es")}
        aria-label="Switch to Spanish (Español)"
        aria-pressed={language === "es"}
        className={`px-2 py-1 rounded transition-colors ${language === "es" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
      >
        ES
      </button>
      <button 
        onClick={() => setLanguage("fr")}
        aria-label="Switch to French (Français)"
        aria-pressed={language === "fr"}
        className={`px-2 py-1 rounded transition-colors ${language === "fr" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
      >
        FR
      </button>
    </div>
  );
}
