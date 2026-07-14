import { describe, it, expect, vi, afterEach } from "vitest";
import {
  GeminiFetchError,
  GeminiRateLimitError,
  isTransientGeminiError,
  streamGeminiResponse,
  validateAlertOutput,
} from "@/lib/ai/gemini";
import { AlertEvent } from "@/types/alert";

describe("gemini server utility", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("error types", () => {
    it("identifies transient errors", () => {
      expect(isTransientGeminiError(new GeminiRateLimitError())).toBe(true);
      expect(isTransientGeminiError(new GeminiFetchError("msg", 503))).toBe(true);
      expect(isTransientGeminiError(new GeminiFetchError("msg", 400))).toBe(false);
    });

    it("sets correct status for rate limit error", () => {
      const err = new GeminiRateLimitError();
      expect(err.status).toBe(429);
    });
  });

  describe("streamGeminiResponse", () => {
    it("throws if API key missing", async () => {
      vi.stubEnv("GEMINI_API_KEY", "");
      await expect(
        async () => {
          for await (const _ of streamGeminiResponse("test")) {
          }
        }
      ).rejects.toThrow("Missing GEMINI_API_KEY");
    });

    it("parses SSE chunks and yields text", async () => {
      vi.stubEnv("GEMINI_API_KEY", "test-key");

      const mockChunks = [
        `data: {"candidates":[{"content":{"parts":[{"text":"hello"}]}}]}\n\n`,
        `data: {"candidates":[{"content":{"parts":[{"text":" world"}]}}]}\n\n`,
      ];

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(mockChunks[0]));
          controller.enqueue(new TextEncoder().encode(mockChunks[1]));
          controller.close();
        },
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: stream,
      });
      vi.stubGlobal("fetch", mockFetch);

      const tokens: string[] = [];
      for await (const token of streamGeminiResponse("prompt")) {
        tokens.push(token);
      }

      expect(tokens).toEqual(["hello", " world"]);
    });
  });

  describe("validateAlertOutput", () => {
    it("parses valid array and injects id/timestamp", () => {
      const json = JSON.stringify([
        { zoneId: "north", severity: "warning", message: "crowded" },
      ]);
      const alerts = validateAlertOutput(json);
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toHaveProperty("id");
      expect(alerts[0]).toHaveProperty("timestamp");
      expect(alerts[0].zoneId).toBe("north");
      expect(alerts[0].severity).toBe("warning");
    });

    it("wraps single object into array", () => {
      const json = JSON.stringify(
        { zoneId: "north", severity: "warning", message: "crowded" }
      );
      const alerts = validateAlertOutput(json);
      expect(alerts).toHaveLength(1);
    });

    it("filters out invalid items and keeps valid ones", () => {
      const json = JSON.stringify([
        { zoneId: "north", severity: "warning", message: "crowded" },
        { zoneId: "south", severity: "INVALID", message: "crowded" }, // invalid severity
      ]);
      const alerts = validateAlertOutput(json);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].zoneId).toBe("north");
    });

    it("returns empty array on bad JSON", () => {
      const alerts = validateAlertOutput("not json");
      expect(alerts).toEqual([]);
    });

    it("returns empty array when all items invalid", () => {
      const json = JSON.stringify([
        { zoneId: "south", severity: "INVALID", message: "crowded" },
      ]);
      const alerts = validateAlertOutput(json);
      expect(alerts).toEqual([]);
    });
  });
});
