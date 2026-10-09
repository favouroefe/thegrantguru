import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Check, Globe, Loader2, School, ExternalLink, AlertTriangle, ArrowUpDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GrantCard } from "@/components/GrantCard";
import { WhatIf } from "@/components/WhatIf";
import { ShareResults } from "@/components/ShareResults";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMatches } from "@/hooks/use-matches";
import { userGrantsQuery, webResultsQuery } from "@/lib/data";
import { searchWebForMore } from "@/lib/grants.functions";
import { TAB_OF, isPathB, type Match } from "@/lib/matching";
import { daysUntil, euro } from "@/lib/options";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/results")({
  validateSearch: z.object({ scan: z.boolean().optional() }),
  head: () => ({ meta: [{ title: "Your funding matches — GrantGuru" }, { name: "description", content: "Grants, bursaries and scholarships you may qualify for." }, { property: "og:title", content: "Your funding matches — GrantGuru" }, { property: "og:description", content: "See what student funding you could claim." }] }),
  component: ResultsPage,
});

function Scanning({ count, onDone }: { count: number; onDone: () => void }) {
  const [n, setN] = useState(0);
  const steps = ["Checking your status", "Checking your course & college", "Checking household income", "Checking scholarships", "Checking extra supports"];
  useEffect(() => {
    const t = setInterval(() => setN((x) => x + 1), 450);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (n > steps.length) onDone(); }, [n, onDone, steps.length]);
  return (
    <div className="min-h-screen bg-hero px-6 py-16 text-primary-foreground">
      <div className="mx-auto max-w-md">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <h1 className="mt-6 text-3xl font-extrabold">Checking {count} funding schemes…</h1>
        <ul className="mt-8 space-y-3">
          {steps.slice(0, n + 1).map((s, i) => (
            <li key={s} className="flex animate-tick-in items-center gap-3 rounded-2xl bg-primary-foreground/10 px-4 py-3">
              {i < n ? <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-foreground"><Check className="h-4 w-4" /></span> : <Loader2 className="h-6 w-6 animate-spin text-accent" />}
              <span className="text-sm">{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Counter({ value }: { value: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const start = performance.now();
    const tick = (t: number) => { const p = Math.min((t - start) / 1400, 1); setV(value * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{euro(v)}</>;
}

const TABS = ["Grants", "Scholarships", "Other support", "All"] as const;

function ResultsPage() {
  const { scan } = Route.useSearch();
  const qc = useQueryClient();
  const web = useServerFn(searchWebForMore);
  const { loading, answers, funds, matches, total } = useMatches();
  const { data: ugs = [] } = useQuery(userGrantsQuery);
  const { data: webResults } = useQuery(webResultsQuery);
  const [scanning, setScanning] = useState(!!scan);
  const [webBusy, setWebBusy] = useState(false);
  const [filters, setFilters] = useState<string[]>([]);
  const [sort, setSort] = useState<"deadline" | "amount">("deadline");

  const chips = useMemo(() => {
    const subs = new Set<string>();
    matches.forEach((m) => m.fund.subcategory.forEach((s) => subs.add(s)));
    const labels = [...new Set(matches.map((m) => m.label))];
    return [...labels, ...[...subs].sort()];
  }, [matches]);

  if (scanning) return <Scanning count={funds.length || 20} onDone={() => setScanning(false)} />;
  if (loading) return <AppShell><p className="py-10 text-center text-muted-foreground">Loading…</p></AppShell>;
  if (!answers) {
    return (
      <AppShell>
        <div className="mt-8 rounded-3xl bg-card p-6 text-center shadow-card">
          <AlertTriangle className="mx-auto h-8 w-8 text-warning" />
          <h1 className="mt-3 text-2xl font-bold">No results yet</h1>
          <p className="mt-2 text-muted-foreground">Answer a few quick questions to see what you could get.</p>
          <Button asChild className="mt-5 rounded-xl"><Link to="/onboarding">Start</Link></Button>
        </div>
      </AppShell>
    );
  }

  const ugMap = new Map(ugs.map((u) => [u.grant_id, u]));
  const closing = matches.filter((m) => { const d = daysUntil(m.fund.deadline); return d !== null && d >= 0 && d <= 7; });
  const apply = (ms: Match[]) => {
    const labelF = filters.filter((f) => ["Likely", "Possible", "Check eligibility"].includes(f));
    const subF = filters.filter((f) => !labelF.includes(f));
    return ms
      .filter((m) => (!labelF.length || labelF.includes(m.label)) && (!subF.length || m.fund.subcategory.some((s) => subF.includes(s))))
      .sort((x, y) => sort === "amount" ? (y.amount ?? -1) - (x.amount ?? -1) : (x.fund.deadline ?? "9999").localeCompare(y.fund.deadline ?? "9999"));
  };
  const inTab = (t: (typeof TABS)[number]) => (t === "All" ? matches : matches.filter((m) => TAB_OF[m.fund.category] === t));
  const pathB = isPathB(answers);
  const few = matches.filter((m) => m.label !== "Check eligibility").length < 4;

  async function searchWeb() {
    setWebBusy(true);
    try { const r = await web(); await qc.invalidateQueries({ queryKey: ["web_results"] }); if (!r.items.length) toast("No extra schemes found this time."); }
    catch (e) { toast.error((e as Error).message); }
    finally { setWebBusy(false); }
  }

  return (
    <AppShell>
      <div className="mt-2 rounded-3xl bg-hero p-6 text-primary-foreground shadow-card">
        <p className="text-primary-foreground/80">You may qualify for up to</p>
        <p className="mt-1 font-display text-5xl font-extrabold text-accent"><Counter value={total} /><span className="ml-2 text-lg font-semibold text-primary-foreground/80">per year</span></p>
        <p className="mt-2 text-sm text-primary-foreground/70">Based on your answers. Estimates only.</p>
        <ShareResults total={total} />
      </div>

      {closing.length > 0 && (
        <div className="mt-4 rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm font-bold"><span className="rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">Closing soon</span> Don't miss these</p>
          <ul className="mt-2 space-y-1">
            {closing.map((m) => {
              const d = daysUntil(m.fund.deadline)!;
              return <li key={m.fund.id}><Link to="/grant/$id" params={{ id: m.fund.id }} className="flex justify-between text-sm"><span className="font-medium underline">{m.fund.name}</span><span className="font-semibold text-destructive">{d === 0 ? "Today" : `${d} day${d === 1 ? "" : "s"}`}</span></Link></li>;
            })}
          </ul>
        </div>
      )}

      {pathB && few && (
        <div className="mt-4 rounded-3xl bg-secondary p-5 text-sm">
          <p className="font-bold">Most state grants aren't open to international students – but here's what is.</p>
          <div className="mt-3 flex gap-3"><School className="h-5 w-5 shrink-0 text-primary" /><p>Talk to your college's <b>international office</b> — they know about scholarships, fee discounts and hardship help that aren't listed anywhere else.</p></div>
        </div>
      )}

      <WhatIf />

      <Tabs defaultValue="All" className="mt-6">
        <TabsList className="grid h-auto w-full grid-cols-4 rounded-2xl p-1">
          {TABS.map((t) => <TabsTrigger key={t} value={t} className="rounded-xl px-1 py-2 text-xs sm:text-sm">{t} <span className="ml-1 text-muted-foreground">{inTab(t).length}</span></TabsTrigger>)}
        </TabsList>
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          {chips.map((c) => {
            const on = filters.includes(c);
            return <button key={c} onClick={() => setFilters((p) => on ? p.filter((x) => x !== c) : [...p, c])} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{c}</button>;
          })}
          <button onClick={() => setSort(sort === "deadline" ? "amount" : "deadline")} className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"><ArrowUpDown className="h-3 w-3" /> {sort === "deadline" ? "Deadline" : "Amount"}</button>
        </div>
        {TABS.map((t) => {
          const list = apply(inTab(t));
          return (
            <TabsContent key={t} value={t} className="space-y-3 pt-2">
              {list.length ? list.map((m) => <GrantCard key={m.fund.id} match={m} ug={ugMap.get(m.fund.id)} />)
                : <p className="rounded-3xl bg-muted p-6 text-center text-sm text-muted-foreground">Nothing here with these filters.</p>}
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="mt-10">
        <Button onClick={searchWeb} disabled={webBusy} variant="outline" className="h-12 w-full rounded-2xl">
          {webBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />} {webBusy ? "Searching the web…" : "Search the web for more"}
        </Button>
        {webResults && webResults.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold">AI-found, unverified</h2>
            <p className="text-sm text-muted-foreground">Check the source before relying on these.</p>
            <div className="mt-3 space-y-3">
              {webResults.map((w) => (
                <a key={w.url + w.name} href={w.url} target="_blank" rel="noreferrer" className="block rounded-3xl border-2 border-dashed bg-card p-5">
                  <div className="flex items-start justify-between gap-3"><p className="font-bold">{w.name}</p><ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" /></div>
                  <p className="text-sm text-muted-foreground">{w.provider} · {w.amount_text}</p>
                  <p className="mt-2 text-sm">{w.why}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="mt-10 rounded-2xl bg-muted p-4 text-center text-xs text-muted-foreground">Estimates only. Always check official eligibility on the provider's website.</p>
    </AppShell>
  );
}
