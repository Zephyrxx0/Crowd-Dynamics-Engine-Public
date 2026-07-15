import { type NextRequest } from "next/server";
import { mapOwmResponse, OWMResponseSchema } from "@/lib/api/weather";
import { WeatherDataSchema } from "@/types/weather";

export async function GET(_request: NextRequest) {
  const apiKey = process.env.OWM_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OWM_API_KEY not configured", status: "error" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=New%20York,US&units=metric&appid=${apiKey}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!response.ok) {
      return Response.json(
        { error: `Upstream returned ${response.status}`, status: "upstream_error" },
        { status: 502 }
      );
    }

    const raw = (await response.json()) as unknown;
    const parsed = OWMResponseSchema.safeParse(raw);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid upstream data",
          status: "parse_error",
          issues: parsed.error.issues,
        },
        { status: 502 }
      );
    }

    const weatherData = mapOwmResponse(parsed.data);

    const outputValidated = WeatherDataSchema.safeParse(weatherData);
    if (!outputValidated.success) {
      return Response.json(
        {
          error: "Invalid upstream data",
          status: "parse_error",
          issues: outputValidated.error.issues,
        },
        { status: 502 }
      );
    }

    return Response.json(weatherData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network failure";
    return Response.json(
      { error: message, status: "fetch_error" },
      { status: 502 }
    );
  }
}
