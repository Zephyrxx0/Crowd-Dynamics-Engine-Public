import { describe, it, expect } from "vitest";
import { buildAlertPrompt } from "@/app/api/alert/prompts";

describe("buildAlertPrompt", () => {
  const mockZones = [
    { id: "north", name: "North Zone", occupancy: 432, capacity: 600, occupancyRatio: 0.72 },
    { id: "south", name: "South Zone", occupancy: 100, capacity: 500, occupancyRatio: 0.2 },
  ];

  const mockMatch = {
    minute: 45,
    phase: "first-half",
    score: "1-0",
    homeTeam: "Home",
    awayTeam: "Away",
  };

  it("includes all zone names and occupancy data", () => {
    const prompt = buildAlertPrompt(mockZones, mockMatch);
    expect(prompt).toContain("North Zone");
    expect(prompt).toContain("432/600");
    expect(prompt).toContain("72% capacity");
    expect(prompt).toContain("South Zone");
    expect(prompt).toContain("100/500");
    expect(prompt).toContain("20% capacity");
  });

  it("includes match context", () => {
    const prompt = buildAlertPrompt(mockZones, mockMatch);
    expect(prompt).toContain("Minute: 45");
    expect(prompt).toContain("Phase: first-half");
    expect(prompt).toContain("Home 1-0 Away");
  });

  it("contains severity thresholds", () => {
    const prompt = buildAlertPrompt(mockZones, mockMatch);
    expect(prompt).toContain("nominal: <60%");
    expect(prompt).toContain("warning: 60-80%");
    expect(prompt).toContain("critical: >80%");
  });

  it("instructs Gemini to return JSON array", () => {
    const prompt = buildAlertPrompt(mockZones, mockMatch);
    expect(prompt).toContain("Respond ONLY with a valid JSON array");
  });

  it("instructs empty array if all zones nominal", () => {
    const prompt = buildAlertPrompt(mockZones, mockMatch);
    expect(prompt).toContain("If ALL zones are nominal, return an empty array []");
  });

  it("handles empty zones gracefully", () => {
    const prompt = buildAlertPrompt([], mockMatch);
    expect(prompt).toContain("--- ZONE DATA ---");
    expect(prompt).toContain("Respond ONLY with a valid JSON array");
  });

  it("handles null minute gracefully", () => {
    const prompt = buildAlertPrompt(mockZones, { ...mockMatch, minute: null });
    expect(prompt).toContain("Minute: Pre-match");
  });
});
