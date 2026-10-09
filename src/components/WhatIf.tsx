import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Sparkles } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { INCOME, euro, storeSituation, type Answers, type Situation } from "@/lib/options";
import { matchFunds, totalOf } from "@/lib/matching";
import { saveAnswers } from "@/lib/data";
import { useMatches } from "@/hooks/use-matches";
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

const BANDS = INCOME.filter((i) => i.value !== "not_sure");
const TOGGLES: [string, string][] = [["first", "First year"], ["lone_parent", "Lone parent household"], ["carer", "Carer"], ["disability", "Disability"]];

export function WhatIf() {
  const { answers, situation, funds } = useMatches();
  if (!answers || !funds.length) return null;
  return <WhatIfInner key={JSON.stringify(answers) + situation.items.join()} answers={answers} situation={situation} funds={funds} />;
}

function WhatIfInner({ answers, situation, funds }: { answers: Answers; situation: Situation; funds: ReturnType<typeof useMatches>["funds"] }) {
  const qc = useQueryClient();
  const [a, setA] = useState<Answers>(answers);
  const [s, setS] = useState<Situation>(situation);
  const [dist, setDist] = useState(answers.distance_30 === "yes" ? 50 : 10);
  const ms = matchFunds(funds, { ...a, distance_30: dist >= 30 ? "yes" : "no" }, s).filter((m) => m.counted);
  const total = totalOf(ms);
  const ids = ms.map((m) => m.fund.id);
  const prev = useRef<string[]>(ids);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [gone, setGone] = useState<string[]>([]);

  const key = ids.join(",");
  useEffect(() => {
    const added = ids.filter((id) => !prev.current.includes(id));
    const removed = prev.current.filter((id) => !ids.includes(id));
    prev.current = ids;
    if (!added.length && !removed.length) return;
    setFresh(new Set(added)); setGone(removed);
    const t = setTimeout(() => { setFresh(new Set()); setGone([]); }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const band = Math.max(0, BANDS.findIndex((b) => b.value === a.income));
  const has = (k: string) => (k === "first" ? a.year === "1" && a.first_time === "yes" : s.items.includes(k));
  function toggle(k: string, on: boolean) {
    if (k === "first") return setA((p) => ({ ...p, year: on ? "1" : p.year === "1" ? "2" : p.year, first_time: on ? "yes" : p.first_time }));
    setS((p) => ({ ...p, pnts: false, items: on ? [...p.items, k] : p.items.filter((x) => x !== k) }));
  }
  async function save() {
    try {
      await saveAnswers({ ...a, distance_30: dist >= 30 ? "yes" : "no" });
      storeSituation(s);
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Saved as your profile");
    } catch (e) { toast.error((e as Error).message); }
  }
  const name = (id: string) => funds.find((f) => f.id === id)?.name ?? id;

  return (
    <Collapsible className="mt-4 rounded-3xl bg-card shadow-card">
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
          <div className="flex justify-between text-sm"><span className="font-semibold">Household income</span><span className="text-muted-foreground">{BANDS[band]!.label}</span></div>
          <Slider className="mt-3" min={0} max={4} step={1} value={[band]} onValueChange={([v]) => setA((p) => ({ ...p, income: BANDS[v ?? 0]!.value }))} />
        </div>
        <div>
          <div className="flex justify-between text-sm"><span className="font-semibold">Distance from college</span><span className="text-muted-foreground">{dist} km</span></div>
          <Slider className="mt-3" min={0} max={300} step={5} value={[dist]} onValueChange={([v]) => setDist(v ?? 0)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TOGGLES.map(([k, label]) => (
            <label key={k} className="flex items-center justify-between gap-2 rounded-2xl bg-muted px-3 py-2.5 text-sm">
              {label}<Switch checked={has(k)} onCheckedChange={(on) => toggle(k, on)} />
            </label>
          ))}
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Likely eligible ({ms.length})</p>
          <ul className="space-y-2">
            {ms.map((m) => (
              <li key={m.fund.id} className={`flex animate-tick-in justify-between gap-3 rounded-2xl px-4 py-2.5 text-sm transition-colors duration-700 ${fresh.has(m.fund.id) ? "bg-accent text-accent-foreground" : "bg-secondary"}`}>
                <span className="font-medium">{m.fund.name}</span><span className="font-semibold">{euro(m.amount ?? 0)}</span>
              </li>
            ))}
            {gone.map((id) => (
              <li key={"x" + id} className="flex justify-between rounded-2xl bg-destructive/10 px-4 py-2.5 text-sm text-muted-foreground line-through animate-out fade-out slide-out-to-right duration-1000 fill-mode-forwards"><span>{name(id)}</span></li>
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
