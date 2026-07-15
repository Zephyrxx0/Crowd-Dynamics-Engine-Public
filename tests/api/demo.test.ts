import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/demo/route";
import { type NextRequest } from "next/server";
import { DemoEventSequenceSchema } from "@/types/demo";

const createRequest = () => ({ url: "http://localhost/api/demo" } as NextRequest);

describe("GET /api/demo", () => {
  it("returns 200 and a 7-event timeline matching requirements", async () => {
    const response = await GET(createRequest());
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.length).toBe(7);

    // Check specific required events
    expect(data[0].minute).toBe(0);
    expect(data[0].eventType).toBe("kickoff");
    
    expect(data[3].eventType).toBe("second-half-start");
    
    // Check goal event with zoneDeltas
    expect(data[1].eventType).toBe("goal");
    expect(data[1].zoneDeltas).toBeDefined();
    expect(data[1].zoneDeltas[0].zoneId).toBe("north");
    
    // Phase enums check (implicit through schema validation below, but check array contains them)
    const phases = new Set(data.map((d: any) => d.phase));
    expect(phases.has("pre-match") || phases.has("first-half")).toBe(true);
  });

  it("returns events that pass DemoEventSchema validation", async () => {
    const response = await GET(createRequest());
    const data = await response.json();
    
    const parsed = DemoEventSequenceSchema.safeParse(data);
    expect(parsed.success).toBe(true);
  });
});
