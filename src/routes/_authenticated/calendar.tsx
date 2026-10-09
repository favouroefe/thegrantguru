import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, List, CalendarDays } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DeadlineBadge, markApplyClicked } from "@/components/GrantCard";
import { userGrantsQuery, type Fund as Grant } from "@/lib/data";
import { useMatches } from "@/hooks/use-matches";
import { daysUntil } from "@/lib/options";
import { AddToCalendar } from "@/components/AddToCalendar";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Deadline calendar — GrantGuru" }, { name: "description", content: "All your grant deadlines on one calendar." }, { property: "og:title", content: "Deadline calendar — GrantGuru" }, { property: "og:description", content: "Never miss a grant deadline." }] }),
  component: CalendarPage,
});

function chipClass(g: Grant, applied: boolean) {
  const d = daysUntil(g.deadline) ?? 999;
  if (d < 0) return "bg-muted text-muted-foreground";
  if (applied) return "bg-primary text-primary-foreground";
  if (d < 7) return "bg-destructive text-destructive-foreground";
  if (d < 30) return "bg-warning text-warning-foreground";
  return "bg-success text-primary-foreground";
}
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function CalendarPage() {
  const { funds: grants, matches } = useMatches();
  const { data: ugs = [] } = useQuery(userGrantsQuery);
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [view, setView] = useState<"month" | "list">("month");
  const [day, setDay] = useState<string | null>(null);

  const relevant = new Set([...matches.map((m) => m.fund.id), ...ugs.map((u) => u.grant_id)]);
  const dated = grants.filter((g) => g.deadline && (relevant.size === 0 || relevant.has(g.id))).sort((a, b) => a.deadline!.localeCompare(b.deadline!));
  const applied = new Set(ugs.filter((u) => u.status).map((u) => u.grant_id));
  const byDay = new Map<string, Grant[]>();
  dated.forEach((g) => byDay.set(g.deadline!, [...(byDay.get(g.deadline!) ?? []), g]));

  const first = (month.getDay() + 6) % 7;
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysIn }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const today = iso(new Date());
  const dayGrants = day ? byDay.get(day) ?? [] : [];
  const upcoming = dated.filter((g) => (daysUntil(g.deadline) ?? -1) >= 0);

  const exportRow = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Add every deadline to your own calendar.</p>
      <AddToCalendar funds={upcoming} label="Add all deadlines" />
    </div>
  );

  const Chip = ({ g }: { g: Grant }) => (
    <span className={`block truncate rounded-md px-1 py-0.5 text-[9px] font-semibold leading-tight ${chipClass(g, applied.has(g.id))}`}>{applied.has(g.id) && "✓ "}{g.name}</span>
  );

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-extrabold">Calendar</h1>
        <div className="flex rounded-xl bg-muted p-1">
          <button onClick={() => setView("month")} aria-label="Month view" className={`rounded-lg p-2 ${view === "month" ? "bg-card shadow-card" : ""}`}><CalendarDays className="h-4 w-4" /></button>
          <button onClick={() => setView("list")} aria-label="List view" className={`rounded-lg p-2 ${view === "list" ? "bg-card shadow-card" : ""}`}><List className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {[["bg-destructive", "Under 7 days"], ["bg-warning", "Under 30 days"], ["bg-success", "Later"], ["bg-muted", "Closed"], ["bg-primary", "✓ Applied"]].map(([c, l]) => <span key={l} className="flex items-center gap-1"><span className={`h-2.5 w-2.5 rounded-full ${c}`} />{l}</span>)}
      </div>

      {view === "month" ? (
        <div className="mt-5 rounded-3xl bg-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-full p-2 hover:bg-secondary"><ChevronLeft className="h-5 w-5" /></button>
            <p className="font-display text-lg font-bold">{month.toLocaleDateString("en-IE", { month: "long", year: "numeric" })}</p>
            <button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-full p-2 hover:bg-secondary"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const k = iso(d); const gs = byDay.get(k) ?? [];
              return (
                <button key={i} onClick={() => setDay(k)} className={`flex min-h-16 flex-col gap-0.5 rounded-xl p-1 text-left ${k === today ? "ring-2 ring-primary" : ""} ${gs.length ? "bg-secondary" : "hover:bg-muted"}`}>
                  <span className="text-xs font-semibold">{d.getDate()}</span>
                  {gs.slice(0, 2).map((g) => <Chip key={g.id} g={g} />)}
                </button>
              );
            })}
          </div>
          <div className="mt-4 border-t pt-4">{exportRow}</div>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {dated.map((g) => (
            <button key={g.id} onClick={() => setDay(g.deadline)} className="flex w-full items-center gap-4 rounded-3xl bg-card p-4 text-left shadow-card">
              <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-center ${chipClass(g, applied.has(g.id))}`}>
                <span className="text-[10px] font-semibold uppercase leading-none">{new Date(g.deadline!).toLocaleDateString("en-IE", { month: "short" })}</span>
                <span className="font-display text-xl font-bold leading-none">{new Date(g.deadline!).getDate()}</span>
              </div>
              <div className="min-w-0"><p className="font-bold">{applied.has(g.id) && "✓ "}{g.name}</p><p className="text-sm text-muted-foreground">{g.amount_text}</p></div>
            </button>
          ))}
          <div className="rounded-3xl bg-card p-4 shadow-card">{exportRow}</div>
        </div>
      )}

      <Sheet open={!!day} onOpenChange={(o) => !o && setDay(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader><SheetTitle>{day && new Date(day).toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" })}</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3 pb-4">
            {dayGrants.length === 0 && <p className="text-sm text-muted-foreground">No deadlines on this day.</p>}
            {dayGrants.map((g) => (
              <div key={g.id} className="rounded-2xl bg-secondary p-4">
                <p className="font-bold">{g.name}</p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2"><DeadlineBadge deadline={g.deadline} /><AddToCalendar funds={[g]} /></div>
                <div className="mt-3 flex gap-2">
                  <Button asChild variant="outline" className="flex-1 rounded-xl"><Link to="/grant/$id" params={{ id: g.id }}>View</Link></Button>
                  <Button asChild className="flex-1 rounded-xl"><a href={g.apply_url} target="_blank" rel="noreferrer" onClick={() => markApplyClicked(g.id)}>Apply <ExternalLink className="h-4 w-4" /></a></Button>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
