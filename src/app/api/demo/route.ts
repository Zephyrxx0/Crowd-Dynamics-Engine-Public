import { type NextRequest } from "next/server";
import { DemoEventSequenceSchema, type DemoEvent } from "@/types/demo";

export async function GET(_request: NextRequest) {
  const timeline: DemoEvent[] = [
    { minute: 0, phase: "first-half", score: "0 - 0", eventType: "kickoff" },
    { minute: 23, phase: "first-half", score: "1 - 0", eventType: "goal", zoneDeltas: [{ zoneId: "north", deltaPercent: 20 }] },
    { minute: 45, phase: "half-time", score: "1 - 0", eventType: "halftime", zoneDeltas: [{ zoneId: "north", deltaPercent: -10 }, { zoneId: "south", deltaPercent: -10 }, { zoneId: "east", deltaPercent: -10 }] },
    { minute: 46, phase: "second-half", score: "1 - 0", eventType: "second-half-start" },
    { minute: 67, phase: "second-half", score: "2 - 0", eventType: "goal", zoneDeltas: [{ zoneId: "south", deltaPercent: 20 }] },
    { minute: 82, phase: "second-half", score: "2 - 1", eventType: "goal", zoneDeltas: [{ zoneId: "east", deltaPercent: 15 }] },
    { minute: 90, phase: "full-time", score: "2 - 1", eventType: "full-time", zoneDeltas: [{ zoneId: "north", deltaPercent: -80 }, { zoneId: "south", deltaPercent: -80 }, { zoneId: "east", deltaPercent: -80 }] }
  ];

  const parsed = DemoEventSequenceSchema.safeParse(timeline);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid demo sequence data", status: "error" },
      { status: 500 }
    );
  }

  return Response.json(parsed.data, { status: 200 });
}
