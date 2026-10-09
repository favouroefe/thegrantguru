import { createOpenAI } from "@ai-sdk/openai";

const RUN_ID = "X-Lovable-AIG-Run-ID";

export function createGateway() {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI is not configured (missing LOVABLE_API_KEY).");
  let runId: string | undefined;
  const fetchWithRunId = async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID)) headers.set(RUN_ID, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_ID)?.trim() || undefined;
    return res;
  };
  return createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: fetchWithRunId,
  });
}

export const MODEL = "openai/gpt-6-astra";

export const reasoningOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

export function friendlyAiError(e: unknown): string {
  const err = e as { statusCode?: number; message?: string };
  if (err?.statusCode === 429) return "Too many requests right now — please try again in a minute.";
  if (err?.statusCode === 402) return "AI credits have run out for this app. Please top up and try again.";
  return err?.message || "Something went wrong while checking grants.";
}
