import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AppShell, Disclaimer } from "@/components/AppShell";
import { DeadlineBadge, markApplyClicked } from "@/components/GrantCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { grantsQuery, matchesQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/grant/$id")({
  head: () => ({ meta: [{ title: "Grant details — GrantGuru" }, { name: "description", content: "Eligibility, documents and deadline for this scheme." }, { property: "og:title", content: "Grant details — GrantGuru" }, { property: "og:description", content: "Eligibility, documents and deadline." }] }),
  component: GrantDetail,
});

function GrantDetail() {
  const { id } = Route.useParams();
  const { data: grants } = useQuery(grantsQuery);
  const { data: matches } = useQuery(matchesQuery);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const g = grants?.find((x) => x.id === id);
  const m = matches?.results.find((r) => r.grant_id === id);
  if (!grants) return <AppShell><p className="py-10 text-center text-muted-foreground">Loading…</p></AppShell>;
  if (!g) return <AppShell><p className="py-10 text-center">Grant not found.</p></AppShell>;
  return (
    <AppShell>
      <Link to="/results" className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Results</Link>
      <h1 className="mt-4 text-3xl font-extrabold">{g.name}</h1>
      <p className="text-muted-foreground">{g.provider}</p>
      <p className="mt-4 font-display text-2xl font-bold text-primary">{g.amount_text}</p>
      <div className="mt-2"><DeadlineBadge deadline={g.deadline} /></div>
      {m && <div className="mt-5 rounded-2xl bg-secondary p-4 text-sm"><span className="font-bold capitalize">{m.status}:</span> {m.reason}</div>}
      <section className="mt-6 rounded-3xl bg-card p-5 shadow-card"><h2 className="font-bold">About</h2><p className="mt-2 text-sm leading-relaxed">{g.description}</p></section>
      <section className="mt-4 rounded-3xl bg-card p-5 shadow-card">
        <h2 className="font-bold">Criteria</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {Object.entries(g.criteria).map(([k, v]) => <li key={k}><span className="capitalize text-muted-foreground">{k.replace(/_/g, " ")}:</span> {Array.isArray(v) ? v.join(", ") : String(v)}</li>)}
        </ul>
      </section>
      <section className="mt-4 rounded-3xl bg-card p-5 shadow-card">
        <h2 className="font-bold">Documents you'll need</h2>
        <ul className="mt-3 space-y-3">
          {g.documents_needed.map((d) => (
            <li key={d}><label className="flex items-center gap-3 text-sm"><Checkbox checked={!!checked[d]} onCheckedChange={(c) => setChecked((p) => ({ ...p, [d]: !!c }))} /><span className={checked[d] ? "line-through text-muted-foreground" : ""}>{d}</span></label></li>
          ))}
        </ul>
      </section>
      <Button asChild className="mt-6 h-14 w-full rounded-2xl text-base">
        <a href={g.apply_url} target="_blank" rel="noreferrer" onClick={() => markApplyClicked(g.id)}>Apply on official site <ExternalLink className="h-4 w-4" /></a>
      </Button>
      <Disclaimer />
    </AppShell>
  );
}
