import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCopy } from "lucide-react";
import { AppShell, Disclaimer } from "@/components/AppShell";
import { GrantCard, DeadlineBadge } from "@/components/GrantCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { grantsQuery, matchesQuery, upsertUserGrant, userGrantsQuery, type Grant } from "@/lib/data";
import { daysUntil, euro } from "@/lib/options";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GrantGuru" }, { name: "description", content: "Track your grant applications and deadlines." }, { property: "og:title", content: "Dashboard — GrantGuru" }, { property: "og:description", content: "Track applications and deadlines." }] }),
  component: Dashboard,
});

const byDeadline = (a: Grant, b: Grant) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999");

function Dashboard() {
  const qc = useQueryClient();
  const { data: grants = [] } = useQuery(grantsQuery);
  const { data: matches } = useQuery(matchesQuery);
  const { data: ugs = [] } = useQuery(userGrantsQuery);
  const byId = new Map(grants.map((g) => [g.id, g]));
  const ugMap = new Map(ugs.map((u) => [u.grant_id, u]));
  const reasons = new Map((matches?.results ?? []).map((r) => [r.grant_id, r]));
  const eligibleIds = (matches?.results ?? []).filter((r) => r.status !== "not eligible").map((r) => r.grant_id);
  const notApplied = eligibleIds.filter((id) => !ugMap.get(id)?.status).map((id) => byId.get(id)!).filter(Boolean).sort(byDeadline);
  const applied = ugs.filter((u) => u.status).map((u) => byId.get(u.grant_id)!).filter(Boolean);
  const saved = ugs.filter((u) => u.saved).map((u) => byId.get(u.grant_id)!).filter(Boolean);
  const claim = (matches?.results ?? []).filter((r) => r.status === "likely").reduce((s, r) => s + (byId.get(r.grant_id)?.amount_max_eur ?? 0), 0);
  const upcoming = [...new Set([...eligibleIds, ...ugs.map((u) => u.grant_id)])].map((id) => byId.get(id)!).filter((g) => g && (daysUntil(g.deadline) ?? -1) >= 0).sort(byDeadline);
  const next = upcoming[0];

  async function setStatus(id: string, status: string) {
    try { await upsertUserGrant(id, { status }); qc.invalidateQueries({ queryKey: ["user_grants"] }); } catch (e) { toast.error((e as Error).message); }
  }
  async function exportNotion() {
    const items = [...notApplied, ...applied];
    const md = ["# My student funding checklist", "", ...items.map((g) => {
      const st = ugMap.get(g.id)?.status;
      return [`- [${st ? "x" : " "}] **${g.name}** — ${g.amount_text}${st ? ` (${st})` : ""}`, `  - Deadline: ${g.deadline ?? "Rolling"}`, `  - Apply: ${g.apply_url}`, ...g.documents_needed.map((d) => `  - [ ] ${d}`)].join("\n");
    })].join("\n");
    await navigator.clipboard.writeText(md);
    toast.success("Copied! Paste it into a Notion page.");
  }

  const stats = [
    ["You could claim", euro(claim)], ["Eligible, not applied", String(notApplied.length)], ["Applied", String(applied.length)],
    ["Next deadline", next ? new Date(next.deadline!).toLocaleDateString("en-IE", { day: "numeric", month: "short" }) : "—"],
  ];

  return (
    <AppShell>
      <div className="flex items-center justify-between"><h1 className="text-3xl font-extrabold">Dashboard</h1>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={exportNotion}><ClipboardCopy className="h-4 w-4" /> Export to Notion</Button></div>
      {!matches && <p className="mt-4 rounded-2xl bg-secondary p-4 text-sm">No scan yet. <Link to="/onboarding" className="font-semibold text-primary underline">Look for eligible grants</Link></p>}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {stats.map(([k, v], i) => (
          <div key={k} className={`rounded-3xl p-4 shadow-card ${i === 0 ? "bg-hero text-primary-foreground" : "bg-card"}`}>
            <p className={`text-xs ${i === 0 ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{k}</p>
            <p className={`mt-1 font-display text-2xl font-extrabold ${i === 0 ? "text-accent" : ""}`}>{v}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="todo" className="mt-6">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl">
          <TabsTrigger value="todo" className="rounded-xl text-xs sm:text-sm">Not applied yet</TabsTrigger>
          <TabsTrigger value="applied" className="rounded-xl text-xs sm:text-sm">Applied</TabsTrigger>
          <TabsTrigger value="saved" className="rounded-xl text-xs sm:text-sm">Saved</TabsTrigger>
        </TabsList>
        <TabsContent value="todo" className="space-y-4 pt-2">
          {notApplied.length ? notApplied.map((g) => <GrantCard key={g.id} grant={g} reason={reasons.get(g.id)?.reason} ug={ugMap.get(g.id)} />) : <Empty text="Nothing left to apply for — great work." />}
        </TabsContent>
        <TabsContent value="applied" className="space-y-3 pt-2">
          {applied.length ? applied.map((g) => (
            <div key={g.id} className="flex items-center justify-between gap-3 rounded-3xl bg-card p-4 shadow-card">
              <Link to="/grant/$id" params={{ id: g.id }} className="min-w-0"><p className="font-bold">{g.name}</p><p className="text-sm text-muted-foreground">{g.amount_text}</p></Link>
              <select value={ugMap.get(g.id)?.status ?? "applied"} onChange={(e) => setStatus(g.id, e.target.value)} className="h-10 rounded-xl border bg-background px-2 text-sm">
                <option value="applied">Applied</option><option value="waiting">Waiting</option><option value="awarded">Awarded</option><option value="rejected">Rejected</option>
              </select>
            </div>
          )) : <Empty text="Nothing applied for yet." />}
        </TabsContent>
        <TabsContent value="saved" className="space-y-4 pt-2">
          {saved.length ? saved.map((g) => <GrantCard key={g.id} grant={g} reason={reasons.get(g.id)?.reason} ug={ugMap.get(g.id)} />) : <Empty text="Tap Save on any grant to keep it here." />}
        </TabsContent>
      </Tabs>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Upcoming deadlines</h2>
        <ol className="relative mt-4 space-y-5 border-l-2 border-secondary pl-5">
          {upcoming.length ? upcoming.map((g) => (
            <li key={g.id} className="relative">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
              <p className="font-semibold">{g.name}</p>
              <div className="mt-1"><DeadlineBadge deadline={g.deadline} /></div>
            </li>
          )) : <li className="text-sm text-muted-foreground">No upcoming deadlines.</li>}
        </ol>
      </section>
      <Disclaimer />
    </AppShell>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-3xl bg-muted p-6 text-center text-sm text-muted-foreground">{text}</p>;
}
