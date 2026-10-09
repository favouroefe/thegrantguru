import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Sparkles } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { INCOME_BANDS, euro, type Answers } from "@/lib/options";
import { evaluate, amountFor } from "@/lib/whatif";
import { saveAnswers, type Grant } from "@/lib/data";
import { toast } from "sonner";

function AnimatedEuro({ value }: { value: number }) {
  const [v, setV] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now(), a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / 600, 1);
      const cur = a + (value - a) * (1 - Math.pow(1 - p, 3));
      setV(cur); from.current = cur;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{euro(v)}</>;
}

const TOGGLES: [string, string][] = [["first", "First year"], ["lone or teen parent", "Lone parent household"], ["carer", "Carer"], ["disability", "Disability"]];

export function WhatIf({ grants, answers }: { grants: Grant[]; answers: Answers }) {
  const qc = useQueryClient();
  const [a, setA] = useState<Answers>(answers);
  const { likelyIds, total } = evaluate(grants, a);
  const prev = useRef<string[]>(likelyIds);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [gone, setGone] = useState<Grant[]>([]);

  const key = likelyIds.join(",");
  useEffect(() => {
    const added = likelyIds.filter((id) => !prev.current.includes(id));
    const removed = prev.current.filter((id) => !likelyIds.includes(id));
    prev.current = likelyIds;
    if (!added.length && !removed.length) return;
    setFresh(new Set(added));
    setGone(grants.filter((g) => removed.includes(g.id)));
    const t = setTimeout(() => { setFresh(new Set()); setGone([]); }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const band = Math.max(0, INCOME_BANDS.indexOf(a.income_band ?? ""));
  const dist = Math.min(300, Number(a.distance_km ?? 0) || 0);
  const has = (s: string) => (s === "first" ? a.year === "1" && a.first_time === "yes" : (a.situation ?? []).includes(s));
  function toggle(s: string, on: boolean) {
    if (s === "first") return setA((p) => ({ ...p, year: on ? "1" : p.year === "1" ? "2" : p.year, first_time: on ? "yes" : p.first_time }));
    setA((p) => {
      const cur = new Set((p.situation ?? []).filter((x) => x !== "prefer not to say"));
      on ? cur.add(s) : cur.delete(s);
      return { ...p, situation: [...cur] };
    });
  }
  async function save() {
    try { await saveAnswers(a); qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Saved as your profile. Re-scan for full AI results."); }
    catch (e) { toast.error((e as Error).message); }
  }

  const likely = grants.filter((g) => likelyIds.includes(g.id));
  return (
    <Collapsible className="mt-6 rounded-3xl bg-card shadow-card">
      <CollapsibleTrigger className="group flex w-full items-center justify-between px-5 py-4 text-left">
        <span className="flex items-center gap-2 font-display text-lg font-bold"><Sparkles className="h-5 w-5 text-primary" /> What if my situation changed?</span>
        <ChevronDown className="h-4 w-4 transition group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-6 px-5 pb-5">
        <div className="rounded-2xl bg-hero p-4 text-primary-foreground">
          <p className="text-sm text-primary-foreground/80">Estimated up to</p>
          <p className="font-display text-4xl font-extrabold text-accent"><AnimatedEuro value={total} /></p>
        </div>
        <div>
          <div className="flex justify-between text-sm"><span className="font-semibold">Household income</span><span className="text-muted-foreground">{INCOME_BANDS[band]}</span></div>
          <Slider className="mt-3" min={0} max={4} step={1} value={[band]} onValueChange={([v]) => setA((p) => ({ ...p, income_band: INCOME_BANDS[v ?? 0] }))} />
        </div>
        <div>
          <div className="flex justify-between text-sm"><span className="font-semibold">Distance from college</span><span className="text-muted-foreground">{dist} km</span></div>
          <Slider className="mt-3" min={0} max={300} step={5} value={[dist]} onValueChange={([v]) => setA((p) => ({ ...p, distance_km: String(v ?? 0) }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TOGGLES.map(([k, label]) => (
            <label key={k} className="flex items-center justify-between gap-2 rounded-2xl bg-muted px-3 py-2.5 text-sm">
              {label}<Switch checked={has(k)} onCheckedChange={(on) => toggle(k, on)} />
            </label>
          ))}
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Likely eligible ({likely.length})</p>
          <ul className="space-y-2">
            {likely.map((g) => (
              <li key={g.id} className={`flex animate-tick-in justify-between gap-3 rounded-2xl px-4 py-2.5 text-sm transition-colors duration-700 ${fresh.has(g.id) ? "bg-accent text-accent-foreground" : "bg-secondary"}`}>
                <span className="font-medium">{g.name}</span><span className="font-semibold">{euro(amountFor(g, a))}</span>
              </li>
            ))}
            {gone.map((g) => (
              <li key={"x" + g.id} className="flex justify-between rounded-2xl bg-destructive/10 px-4 py-2.5 text-sm text-muted-foreground line-through animate-out fade-out slide-out-to-right duration-1000 fill-mode-forwards">
                <span>{g.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Situations change – re-scan anytime.</p>
          <Button size="sm" className="rounded-xl" onClick={save}>Save as my profile</Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
