import { streamGeminiResponse } from "./gemini";

export async function collectGeminiJson(prompt: string, signal: AbortSignal): Promise<string> {
  let rawJson = "";
  for await (const token of streamGeminiResponse(prompt, { signal })) {
    rawJson += token;
  }
  return rawJson.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}
