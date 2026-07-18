"use client";

import { useEffect } from "react";

import { useLiveStore } from "@/stores/liveStore";

export function DynamicHtmlLang() {
  const language = useLiveStore((state) => state.language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
