import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const input = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).min(1).max(30),
});

export const askGuru = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { streamText, Output } = await import("ai");
    const { createGateway, MODEL, reasoningOptions, friendlyAiError } = await import("./ai.server");
    const [{ data: profile }, { data: grants }] = await Promise.all([
      supabase.from("profiles").select("answers").eq("id", userId).single(),
      supabase.from("funds").select("id, name, provider, category, amount_text, amount_varies, deadline, description, open_to_tags, requires_tags, requires_any_tags, colleges, apply_url, how_to_apply_steps, documents_needed"),
    ]);
    const gateway = createGateway();
    try {
      const res = streamText({
        model: gateway.responses(MODEL),
        instructions: `You are GrantGuru, a friendly assistant for students in Ireland. Answer ONLY using the GRANTS data and the student PROFILE below. Never invent schemes, amounts or rules. Keep answers short (2-5 sentences), plain English, addressed to "you". If the data doesn't clearly answer, say "I'm not certain – check with {provider} or your college access office" and include that grant's id in source_ids. Always list the grant ids you relied on in source_ids (empty only if none apply).\n\nPROFILE: ${JSON.stringify(profile?.answers ?? {})}\n\nGRANTS: ${JSON.stringify(grants ?? [])}`,
        messages: data.messages,
        output: Output.object({ schema: z.object({ answer: z.string(), source_ids: z.array(z.string()) }) }),
        providerOptions: reasoningOptions,
      });
      const out = await res.output;
      const ids = new Set((grants ?? []).map((g) => g.id));
      return { answer: out.answer, sources: out.source_ids.filter((id) => ids.has(id)).slice(0, 3) };
    } catch (e) {
      throw new Error(friendlyAiError(e));
    }
  });
