import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface WebResult {
  name: string;
  provider: string;
  amount_text: string;
  url: string;
  why: string;
}

/** Bonus: AI web search for extra Irish funding. Shown as unverified, separate from the funds table. */
export const searchWebForMore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { streamText } = await import("ai");
    const { createGateway, MODEL, reasoningOptions, friendlyAiError } = await import("./ai.server");
    const [{ data: profile }, { data: funds }] = await Promise.all([
      supabase.from("profiles").select("answers").eq("id", userId).single(),
      supabase.from("funds").select("name"),
    ]);
    const gateway = createGateway();
    const prompt = `Find up to 6 additional grants, bursaries or scholarships for students in Ireland that match this profile and are NOT in this list: ${JSON.stringify((funds ?? []).map((g) => g.name))}.\nPROFILE: ${JSON.stringify(profile?.answers ?? {})}\nReply with ONLY a JSON array of objects with keys: name, provider, amount_text, url (official source), why (one sentence). No prose.`;

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
    await supabase.from("matches").upsert({ user_id: userId, web_results: items as never });
    return { items };
  });
