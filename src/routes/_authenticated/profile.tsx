import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pencil, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { profileQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Your profile — GrantGuru" }, { name: "description", content: "Edit your answers and re-run grant matching." }, { property: "og:title", content: "Your profile — GrantGuru" }, { property: "og:description", content: "Edit your answers." }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data } = useQuery(profileQuery);
  const a = data?.answers;
  const rows: [string, unknown][] = a ? [
    ["College", a.college], ["Course", a.course], ["Year", a.year], ["Study", a.study], ["Level", a.level], ["Fee status", a.fee_status],
    ["County", a.county], ["Distance to college", a.distance_km && `${a.distance_km} km`], ["Household income", a.income_band],
    ["Social welfare", a.social_welfare], ["Situation", (a.situation ?? []).join(", ")],
  ] : [];
  return (
    <AppShell>
      <h1 className="text-3xl font-extrabold">{data?.name || "Your profile"}</h1>
      {a ? (
        <dl className="mt-5 divide-y rounded-3xl bg-card shadow-card">
          {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-5 py-3 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium capitalize">{String(v || "—")}</dd></div>)}
        </dl>
      ) : <p className="mt-4 text-muted-foreground">You haven't filled in your details yet.</p>}
      <div className="mt-6 grid gap-3">
        <Button asChild variant="outline" className="h-12 rounded-2xl"><Link to="/onboarding"><Pencil className="h-4 w-4" /> Edit answers</Link></Button>
        {a && <Button asChild className="h-12 rounded-2xl"><Link to="/results" search={{ scan: true }}><RefreshCw className="h-4 w-4" /> Re-run matching</Link></Button>}
      </div>
    </AppShell>
  );
}
