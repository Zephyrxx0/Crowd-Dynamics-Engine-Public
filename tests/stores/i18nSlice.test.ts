import { createStore } from "zustand/vanilla";
import { describe, expect, it } from "vitest";

import {
  createI18nSlice,
  LOCALE_TO_LANGUAGE_NAME,
  TRANSLATION_KEYS,
  type I18nSlice,
  type SupportedLocale,
} from "@/stores/slices/i18nSlice";

function createI18nStore() {
  return createStore<I18nSlice>()((...args) => createI18nSlice(...args));
}

describe("i18nSlice", () => {
  it("exposes all supported locales to consumers", () => {
    expect(Object.keys(LOCALE_TO_LANGUAGE_NAME).sort()).toEqual(
      ["ar", "de", "en", "es", "fr", "it", "ja", "ko", "nl", "pt"]
    );
  });

  it("translates every declared key for every supported locale", () => {
    const store = createI18nStore();
    const locales = Object.keys(LOCALE_TO_LANGUAGE_NAME) as SupportedLocale[];

    for (const locale of locales) {
      store.getState().setLanguage(locale);

      for (const key of TRANSLATION_KEYS) {
        expect(store.getState().t(key), `${locale}:${key}`).not.toBe(key);
      }
    }
  });

  it("returns unknown keys unchanged", () => {
    const store = createI18nStore();

    expect(store.getState().t("missing.translation.key")).toBe("missing.translation.key");
  });
});
