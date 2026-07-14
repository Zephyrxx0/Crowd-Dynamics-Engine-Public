import { AlertEvent, AlertEventSchema } from "@/types/alert";

export class GeminiFetchError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "GeminiFetchError";
    this.status = status;
  }
}

export class GeminiRateLimitError extends GeminiFetchError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429);
    this.name = "GeminiRateLimitError";
  }
}

export class GeminiServerError extends GeminiFetchError {
  constructor(message: string, status?: number) {
    super(message, status);
    this.name = "GeminiServerError";
  }
}

export function isTransientGeminiError(error: unknown): boolean {
  if (error instanceof GeminiRateLimitError) return true;
  if (error instanceof GeminiServerError) return true;
  if (error instanceof GeminiFetchError && error.status && error.status >= 500) return true;
  return false;
}

export async function* streamGeminiResponse(
  prompt: string,
  options?: { signal?: AbortSignal }
): AsyncGenerator<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiFetchError("Missing GEMINI_API_KEY");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        maxOutputTokens: 1024,
      },
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    if (response.status === 429) {
      throw new GeminiRateLimitError();
    }
    if (response.status >= 500) {
      throw new GeminiServerError(`Server error: ${response.status} ${errorText}`, response.status);
    }
    throw new GeminiFetchError(`Fetch error: ${response.status} ${errorText}`, response.status);
  }

  if (!response.body) {
    throw new GeminiFetchError("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice("data: ".length).trim();
          if (!dataStr) continue;
          try {
            const data = JSON.parse(dataStr);
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
              yield data.candidates[0].content.parts[0].text;
            }
          } catch (e) {
            console.warn("[gemini] Failed to parse SSE chunk", dataStr);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function validateAlertOutput(rawJson: string): AlertEvent[] {
  try {
    const parsed = JSON.parse(rawJson);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const validEvents: AlertEvent[] = [];

    for (const item of items) {
      const enrichedItem = {
        ...item,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };

      const result = AlertEventSchema.safeParse(enrichedItem);
      if (result.success) {
        validEvents.push(result.data);
      } else {
        console.warn("[gemini] Item validation failed:", result.error.message, item);
      }
    }
    return validEvents;
  } catch (error) {
    console.error("[gemini] JSON parse failed:", error);
    return [];
  }
}
