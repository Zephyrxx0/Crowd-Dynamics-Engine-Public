import { createJSONStorage } from "zustand/middleware";

export function makeValidatedStorage<T>(validator: (raw: unknown) => T | null) {
  return createJSONStorage(() => ({
    getItem: (name: string) => {
      const raw = window.localStorage.getItem(name);
      if (!raw) return null;

      try {
        const parsed = JSON.parse(raw) as { state?: unknown; version?: number };
        const validated = validator(parsed.state);
        if (!validated) return null;

        return JSON.stringify({ state: validated, version: parsed.version ?? 0 });
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: string) => window.localStorage.setItem(name, value),
    removeItem: (name: string) => window.localStorage.removeItem(name),
  }));
}
