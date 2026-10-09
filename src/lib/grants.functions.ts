import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type MatchStatus = "likely" | "worth checking" | "not eligible";
export interface MatchResult {
  grant_id: string;
  status: MatchStatus;
  reason: string;
  confidence: "high" | "medium" | "low";
}
export interface WebResult {
  name: string;
  provider: string;
  amount_text: string;
  url: string;
  why: string;
}

const matchSchema = z.object({
  results: z.array(
    z.object({
      grant_id: z.string(),
      status: z.enum(["likely", "worth checking", "not eligible"]),
      reason: z.string(),
      confidence: z.enum(["high", "medium", "low"]),
    }),
  ),
});

export const runMatching = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { streamText, Output, NoOutputGeneratedError } = await import("ai");
    const { createGateway, MODEL, reasoningOptions, friendlyAiError } = await import("./ai.server");

    const [{ data: profile }, { data: grants, error: gErr }] = await Promise.all([
      supabase.from("profiles").select("name, answers").eq("id", userId).single(),
      supabase.from("grants").select("id, name, provider, type, amount_text, criteria, audience_tags"),
    ]);
    if (gErr || !grants) throw new Error("Could not load the grants list.");
    if (!profile?.answers) throw new Error("Please complete your profile first.");

    let results: MatchResult[] = [];
    try {
      const gateway = createGateway();
      const res = streamText({
        model: gateway.responses(MODEL),
        instructions:
          "You assess Irish student funding eligibility. Use ONLY the grants provided and their criteria. Never invent grants. Return exactly one result per grant id given. Reasons must be one short plain-English sentence addressed to the student ('you'). If information is missing, prefer 'worth checking'.",
        prompt: `STUDENT PROFILE:\n${JSON.stringify(profile.answers)}\n\nGRANTS:\n${JSON.stringify(grants)}`,
        output: Output.object({ schema: matchSchema }),
        providerOptions: reasoningOptions,
      });
      const out = await res.output;
      results = out.results;
    } catch (e) {
      if (NoOutputGeneratedError.isInstance(e)) throw new Error("The AI returned an unreadable answer. Please try again.");
      throw new Error(friendlyAiError(e));
    }

    const ids = new Set(grants.map((g) => g.id));
    const seen = new Set<string>();
    const clean = results.filter((r) => ids.has(r.grant_id) && !seen.has(r.grant_id) && seen.add(r.grant_id));
    for (const g of grants) {
      if (!seen.has(g.id))
        clean.push({ grant_id: g.id, status: "worth checking", reason: "We couldn't assess this one — check the official criteria.", confidence: "low" });
    }

    const { error } = await supabase
      .from("matches")
      .upsert({ user_id: userId, results: clean as never, web_results: null, created_at: new Date().toISOString() });
    if (error) throw new Error("Could not save your results.");
    return { results: clean };
  });

export const searchWebForMore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { streamText } = await import("ai");
    const { createGateway, MODEL, reasoningOptions, friendlyAiError } = await import("./ai.server");
    const [{ data: profile }, { data: grants }] = await Promise.all([
      supabase.from("profiles").select("answers").eq("id", userId).single(),
      supabase.from("grants").select("name"),
    ]);
    const gateway = createGateway();
    const prompt = `Find up to 6 additional grants, bursaries or scholarships for students in Ireland that match this profile and are NOT in this list: ${JSON.stringify((grants ?? []).map((g) => g.name))}.\nPROFILE: ${JSON.stringify(profile?.answers ?? {})}\nReply with ONLY a JSON array of objects with keys: name, provider, amount_text, url (official source), why (one sentence). No prose.`;

    let text = "";
    try {
      const res = streamText({
        model: gateway.responses(MODEL),
        prompt,
        tools: { web_search: gateway.tools.webSearch({}) },
        providerOptions: reasoningOptions,
      });
      text = await res.text;
    } catch (e) {
      throw new Error(friendlyAiError(e));
    }
    let items: WebResult[] = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      items = match ? JSON.parse(match[0]) : [];
    } catch {
      items = [];
    }
    items = items
      .filter((i) => i && typeof i.name === "string" && typeof i.url === "string" && /^https?:\/\//.test(i.url))
      .slice(0, 6);
    await supabase.from("matches").update({ web_results: items as never }).eq("user_id", userId);
    return { items };
  });
