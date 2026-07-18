"use client";

import { useLiveStore } from "@/stores/liveStore";
import type { SupportedLocale } from "@/stores/slices/i18nSlice";

const LANGUAGE_OPTIONS: { code: SupportedLocale; label: string; ariaLabel: string }[] = [
  { code: "en", label: "English", ariaLabel: "Switch to English" },
  { code: "es", label: "Español", ariaLabel: "Switch to Spanish" },
  { code: "fr", label: "Français", ariaLabel: "Switch to French" },
  { code: "ar", label: "العربية", ariaLabel: "Switch to Arabic" },
  { code: "pt", label: "Português", ariaLabel: "Switch to Portuguese" },
  { code: "de", label: "Deutsch", ariaLabel: "Switch to German" },
  { code: "ja", label: "日本語", ariaLabel: "Switch to Japanese" },
  { code: "ko", label: "한국어", ariaLabel: "Switch to Korean" },
  { code: "nl", label: "Nederlands", ariaLabel: "Switch to Dutch" },
  { code: "it", label: "Italiano", ariaLabel: "Switch to Italian" },
];

export function LanguageSwitcher() {
  const language = useLiveStore((state) => state.language);
  const setLanguage = useLiveStore((state) => state.setLanguage);

  return (
    <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <span className="sr-only">Language</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as SupportedLocale)}
        className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        aria-label="Select language"
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.code} value={option.code} aria-label={option.ariaLabel}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
