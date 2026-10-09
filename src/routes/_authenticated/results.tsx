import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Check, ChevronDown, Globe, Loader2, School, ExternalLink, AlertTriangle } from "lucide-react";
import { AppShell, Disclaimer } from "@/components/AppShell";
import { GrantCard } from "@/components/GrantCard";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { grantsQuery, matchesQuery, userGrantsQuery, type Grant } from "@/lib/data";
import { runMatching, searchWebForMore, type MatchResult } from "@/lib/grants.functions";
import { euro } from "@/lib/options";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/results")({
  validateSearch: z.object({ scan: z.boolean().optional() }),
  head: () => ({ meta: [{ title: "Your grant matches — GrantGuru" }, { name: "description", content: "Grants, bursaries and scholarships you may be eligible for." }, { property: "og:title", content: "Your grant matches — GrantGuru" }, { property: "og:description", content: "See what student funding you could claim." }] }),
  component: ResultsPage,
});

function Scanning({ grants, done }: { grants: Grant[]; done: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => Math.min(x + 1, grants.length - (done ? 0 : 1))), 700);
    return () => clearInterval(t);
  }, [grants.length, done]);
  return (
    <div className="min-h-screen bg-hero px-6 py-16 text-primary-foreground">
      <div className="mx-auto max-w-md">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <h1 className="mt-6 text-3xl font-extrabold">Checking {grants.length || 10} funding schemes…</h1>
        <p className="mt-2 text-primary-foreground/70">Comparing your answers with each scheme's rules.</p>
        <ul className="mt-8 space-y-3">
          {grants.slice(0, n + 1).map((g, i) => (
            <li key={g.id} className="flex animate-tick-in items-center gap-3 rounded-2xl bg-primary-foreground/10 px-4 py-3">
              {i < n ? <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-foreground"><Check className="h-4 w-4" /></span> : <Loader2 className="h-6 w-6 animate-spin text-accent" />}
              <span className="text-sm">{g.name}</span>
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

function ResultsPage() {
  const { scan } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const match = useServerFn(runMatching);
  const web = useServerFn(searchWebForMore);
  const { data: grants = [] } = useQuery(grantsQuery);
  const { data: matches, isLoading } = useQuery(matchesQuery);
  const { data: ugs = [] } = useQuery(userGrantsQuery);
  const [scanning, setScanning] = useState(!!scan);
  const [scanDone, setScanDone] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [webBusy, setWebBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!scan || started.current) return;
    started.current = true;
    match()
      .then(async () => { await qc.invalidateQueries({ queryKey: ["matches"] }); setScanDone(true); setTimeout(() => { setScanning(false); navigate({ to: "/results", search: {}, replace: true }); }, 900); })
      .catch((e: Error) => { setScanError(e.message); setScanning(false); });
  }, [scan, match, qc, navigate]);

  if (scanning) return <Scanning grants={grants} done={scanDone} />;
  if (isLoading) return <AppShell><p className="py-10 text-center text-muted-foreground">Loading…</p></AppShell>;

  if (scanError || !matches) {
    return (
      <AppShell>
        <div className="mt-8 rounded-3xl bg-card p-6 text-center shadow-card">
          <AlertTriangle className="mx-auto h-8 w-8 text-warning" />
          <h1 className="mt-3 text-2xl font-bold">{scanError ? "We couldn't finish checking" : "No results yet"}</h1>
          <p className="mt-2 text-muted-foreground">{scanError ?? "Answer a few questions to see what you could get."}</p>
          <Button asChild className="mt-5 rounded-xl"><Link to="/onboarding">{scanError ? "Try again" : "Start"}</Link></Button>
        </div>
      </AppShell>
    );
  }

  const byId = new Map(grants.map((g) => [g.id, g]));
  const ugMap = new Map(ugs.map((u) => [u.grant_id, u]));
  const pick = (s: MatchResult["status"]) => matches.results.filter((r) => r.status === s && byId.has(r.grant_id));
  const likely = pick("likely"), worth = pick("worth checking"), no = pick("not eligible");
  const total = likely.reduce((s, r) => s + (byId.get(r.grant_id)?.amount_max_eur ?? 0), 0);
  const few = likely.length + worth.length < 3;
  const fallbacks = grants.filter((g) => ["college-hardship", "saf", "intl-merit", "sanctuary"].includes(g.id) && !likely.concat(worth).some((r) => r.grant_id === g.id));

  async function searchWeb() {
    setWebBusy(true);
    try { const r = await web(); await qc.invalidateQueries({ queryKey: ["matches"] }); if (!r.items.length) toast("No extra schemes found this time."); }
    catch (e) { toast.error((e as Error).message); }
    finally { setWebBusy(false); }
  }

  const list = (rs: MatchResult[]) => rs.map((r) => <GrantCard key={r.grant_id} grant={byId.get(r.grant_id)!} reason={r.reason} ug={ugMap.get(r.grant_id)} />);

  return (
    <AppShell>
      <div className="mt-2 rounded-3xl bg-hero p-6 text-primary-foreground shadow-card">
        <p className="text-primary-foreground/80">You could be eligible for up to</p>
        <p className="mt-1 font-display text-5xl font-extrabold text-accent"><Counter value={total} /></p>
        <p className="mt-2 text-sm text-primary-foreground/70">across {likely.length} likely scheme{likely.length === 1 ? "" : "s"} · per year where applicable</p>
      </div>

      <Section title="Likely eligible" count={likely.length}>{list(likely)}</Section>
      <Section title="Worth checking" count={worth.length}>{list(worth)}</Section>

      {few && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold">Other places to look</h2>
          {fallbacks.map((g) => <GrantCard key={g.id} grant={g} ug={ugMap.get(g.id)} />)}
          <div className="flex gap-4 rounded-3xl bg-secondary p-5">
            <School className="h-6 w-6 shrink-0 text-primary" />
            <div><p className="font-bold">Talk to your college access / financial aid office</p><p className="mt-1 text-sm text-secondary-foreground/80">They know about local bursaries, hardship funds and scholarships that aren't listed anywhere else.</p></div>
          </div>
        </div>
      )}

      {no.length > 0 && (
        <Collapsible className="mt-8">
          <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-2xl bg-muted px-5 py-4 font-semibold">
            Not for you ({no.length}) <ChevronDown className="h-4 w-4 transition group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {no.map((r) => (
              <Link key={r.grant_id} to="/grant/$id" params={{ id: r.grant_id }} className="block rounded-2xl bg-card px-5 py-3 shadow-card">
                <p className="font-semibold">{byId.get(r.grant_id)?.name}</p><p className="text-sm text-muted-foreground">{r.reason}</p>
              </Link>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      <div className="mt-10">
        <Button onClick={searchWeb} disabled={webBusy} variant="outline" className="h-12 w-full rounded-2xl">
          {webBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />} {webBusy ? "Searching the web…" : "Search the web for more"}
        </Button>
        {matches.web && matches.web.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold">AI-found, unverified</h2>
            <p className="text-sm text-muted-foreground">Check the source before relying on these.</p>
            <div className="mt-3 space-y-3">
              {matches.web.map((w) => (
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
      <Disclaimer />
    </AppShell>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (!count) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-bold">{title} <span className="text-muted-foreground">({count})</span></h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
