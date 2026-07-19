"use client";

import { useLiveStore } from "@/stores/liveStore";
import { LOCALE_TO_LANGUAGE_NAME, type SupportedLocale } from "@/stores/slices/i18nSlice";

const LOCALE_DISPLAY: Record<SupportedLocale, string> = {
  en: "EN",
  es: "ES",
  fr: "FR",
  ar: "ع",
  pt: "PT",
  de: "DE",
  ja: "日",
  ko: "한",
  nl: "NL",
  it: "IT",
};

const LOCALES = Object.keys(LOCALE_TO_LANGUAGE_NAME) as SupportedLocale[];

export function LanguageSwitcher() {
  const language = useLiveStore((s) => s.language);
  const setLanguage = useLiveStore((s) => s.setLanguage);

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm" role="group" aria-label="Select display language">
      {LOCALES.map((code) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          aria-label={`Switch to ${LOCALE_TO_LANGUAGE_NAME[code]}`}
          aria-pressed={language === code}
          className={`min-w-8 rounded px-2 py-1 transition-colors ${language === code ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        >
          {LOCALE_DISPLAY[code]}
        </button>
      ))}
    </div>
  );
}
