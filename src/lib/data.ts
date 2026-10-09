import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WebResult } from "./grants.functions";
import type { Answers } from "./options";
import type { Fund } from "./matching";

export type { Fund };
export interface UserGrant { grant_id: string; saved: boolean; status: string | null }

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const id = await uid();
    const { data, error } = await supabase.from("profiles").select("name, answers").eq("id", id).maybeSingle();
    if (error) throw error;
    const answers = (data?.answers as Answers | null) ?? null;
    // Profiles saved before the new scan have no `identity`; treat them as not started.
    return { name: data?.name ?? "", answers: answers && "identity" in answers ? answers : null, partial: answers };
  },
});
export const fundsQuery = queryOptions({
  queryKey: ["funds"],
  queryFn: async () => {
    const { data, error } = await supabase.from("funds").select("*").order("name");
    if (error) throw error;
    return data as unknown as Fund[];
  },
});
export const webResultsQuery = queryOptions({
  queryKey: ["web_results"],
  queryFn: async () => {
    const id = await uid();
    const { data, error } = await supabase.from("matches").select("web_results").eq("user_id", id).maybeSingle();
    if (error) throw error;
    return (data?.web_results as unknown as WebResult[] | null) ?? null;
  },
});
export const userGrantsQuery = queryOptions({
  queryKey: ["user_grants"],
  queryFn: async () => {
    const id = await uid();
    const { data, error } = await supabase.from("user_grants").select("grant_id, saved, status").eq("user_id", id);
    if (error) throw error;
    return data as UserGrant[];
  },
});

export async function saveAnswers(answers: Answers) {
  const id = await uid();
  const { error } = await supabase.from("profiles").update({ answers: answers as never, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
export async function upsertUserGrant(grant_id: string, patch: Partial<Pick<UserGrant, "saved" | "status">>) {
  const id = await uid();
  const { data: existing } = await supabase.from("user_grants").select("saved, status").eq("user_id", id).eq("grant_id", grant_id).maybeSingle();
  const { error } = await supabase.from("user_grants").upsert({
    user_id: id, grant_id, saved: existing?.saved ?? false, status: existing?.status ?? null, ...patch, updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
