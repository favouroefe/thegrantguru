import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MatchLabel, VerifyTag, amountLabel } from "@/components/GrantCard";
import { ApplyGuide } from "@/components/HelpMeApply";
import { useMatches } from "@/hooks/use-matches";
import { AddToCalendar } from "@/components/AddToCalendar";

export const Route = createFileRoute("/_authenticated/grant/$id")({
  head: () => ({ meta: [{ title: "Funding details — GrantGuru" }, { name: "description", content: "How to apply, documents and deadline for this scheme." }, { property: "og:title", content: "Funding details — GrantGuru" }, { property: "og:description", content: "How to apply, documents and deadline." }] }),
  component: GrantDetail,
});

function GrantDetail() {
  const { id } = Route.useParams();
  const { funds, matches, loading } = useMatches();
  const f = funds.find((x) => x.id === id);
  const m = matches.find((x) => x.fund.id === id);
  if (loading) return <AppShell><p className="py-10 text-center text-muted-foreground">Loading…</p></AppShell>;
  if (!f) return <AppShell><p className="py-10 text-center">We couldn't find that one.</p></AppShell>;
  return (
    <AppShell>
      <Link to="/results" className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Results</Link>
      <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">{f.category}</span><VerifyTag fund={f} /></div>
      <h1 className="mt-2 text-3xl font-extrabold">{f.name}</h1>
      <p className="text-muted-foreground">{f.provider}</p>
      <p className="mt-4 font-display text-2xl font-bold text-primary">{m ? amountLabel(m) : f.amount_text}</p>
      {f.deadline && <div className="mt-3"><AddToCalendar funds={[f]} /></div>}
      {m ? (
        <div className="mt-4 rounded-2xl bg-secondary p-4 text-sm"><MatchLabel label={m.label} /><p className="mt-2"><b>Why you match:</b> {m.why}</p>{m.note && <p className="mt-1 text-muted-foreground">{m.note}</p>}</div>
      ) : <div className="mt-4 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">Based on your answers, this one probably isn't for you — but do check the rules.</div>}
      <p className="mt-5 leading-relaxed">{f.description}</p>
      <div className="mt-6 rounded-3xl bg-card p-5 shadow-card"><h2 className="mb-4 text-xl font-bold">Help me apply</h2><ApplyGuide fund={f} /></div>
      <p className="mt-10 rounded-2xl bg-muted p-4 text-center text-xs text-muted-foreground">Estimates only. Always check official eligibility on the provider's website.</p>
    </AppShell>
  );
}
