import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { profileQuery, saveAnswers } from "@/lib/data";
import { COLLEGES, COUNTIES, FEE_STATUS, INCOME_BANDS, SITUATIONS, type Answers } from "@/lib/options";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Find eligible grants — GrantGuru" }, { name: "description", content: "Tell us about yourself to match student funding." }, { property: "og:title", content: "Find eligible grants — GrantGuru" }, { property: "og:description", content: "Five quick steps to match your funding." }] }),
  component: Onboarding,
});

const STEPS = ["About you", "Residency & status", "Money & household", "Your situation", "Anything else?", "Review"];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm font-semibold">{label}</Label>{children}</div>;
}
function Select({ value, onChange, options, placeholder = "Choose…" }: { value?: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-3 text-base">
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function Pills({ value, onChange, options }: { value?: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button type="button" key={o} onClick={() => onChange(o)} className={`rounded-full border px-4 py-2 text-sm capitalize transition ${value === o ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`}>{o}</button>
      ))}
    </div>
  );
}
function Privacy() {
  return <p className="flex items-center gap-2 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground"><Lock className="h-4 w-4" /> Only used to match grants. Never shared.</p>;
}

function Onboarding() {
  const { data: profile, isLoading } = useQuery(profileQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded && profile) { setA(profile.answers ?? {}); setLoaded(true); }
  }, [profile, loaded]);

  const set = (k: keyof Answers) => (v: string) => setA((p) => ({ ...p, [k]: v }));
  const num = (k: keyof Answers) => (e: React.ChangeEvent<HTMLInputElement>) => setA((p) => ({ ...p, [k]: e.target.value }));

  async function persist() {
    try { await saveAnswers(a); qc.invalidateQueries({ queryKey: ["profile"] }); } catch (e) { toast.error((e as Error).message); }
  }
  async function next() { await persist(); setStep((s) => Math.min(s + 1, STEPS.length - 1)); window.scrollTo(0, 0); }
  async function finish() { await persist(); navigate({ to: "/results", search: { scan: true } }); }

  function toggleSituation(s: string) {
    setA((p) => {
      const cur = new Set(p.situation ?? []);
      if (s === "prefer not to say") return { ...p, situation: cur.has(s) ? [] : [s] };
      cur.delete("prefer not to say");
      cur.has(s) ? cur.delete(s) : cur.add(s);
      return { ...p, situation: [...cur] };
    });
  }

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  const review: [string, string | undefined][] = [
    ["Age", a.age], ["College", a.college], ["Course", a.course], ["Year", a.year], ["Study", a.study], ["Level", a.level], ["First time in HE", a.first_time],
    ["Nationality", a.nationality], ["Fee status", a.fee_status], ["Years in IE/EU/EEA/UK/CH (last 5)", a.residency_years], ["County", a.county], ["Distance to college", a.distance_km && `${a.distance_km} km`],
    ["Lives with parents", a.lives_with_parents], ["Household income", a.income_band], ["Dependants", a.dependants], ["Others in college", a.others_in_college], ["Social welfare", a.social_welfare],
    ["Situation", (a.situation ?? []).join(", ") || "—"], ["Notes", a.notes],
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-5 py-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <button onClick={() => (step === 0 ? navigate({ to: "/home" }) : setStep(step - 1))} className="flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back</button>
          <span>{step < 5 ? `Part ${step + 1} of 5` : "Review"}</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mt-3 h-2" />
        <h1 className="mt-8 text-3xl font-extrabold">{STEPS[step]}</h1>

        <div className="mt-6 space-y-5">
          {step === 0 && (<>
            <Field label="Age"><Input type="number" inputMode="numeric" value={a.age ?? ""} onChange={num("age")} className="h-12 rounded-xl" /></Field>
            <Field label="College"><Select value={a.college} onChange={set("college")} options={COLLEGES} /></Field>
            <Field label="Course"><Input value={a.course ?? ""} onChange={num("course")} placeholder="e.g. Nursing" className="h-12 rounded-xl" /></Field>
            <Field label="Year of study"><Pills value={a.year} onChange={set("year")} options={["1", "2", "3", "4", "5+"]} /></Field>
            <Field label="Full-time or part-time?"><Pills value={a.study} onChange={set("study")} options={["full-time", "part-time"]} /></Field>
            <Field label="Undergrad or postgrad?"><Pills value={a.level} onChange={set("level")} options={["undergrad", "postgrad"]} /></Field>
            <Field label="First time in higher education?"><Pills value={a.first_time} onChange={set("first_time")} options={["yes", "no"]} /></Field>
          </>)}
          {step === 1 && (<>
            <Field label="Nationality"><Input value={a.nationality ?? ""} onChange={num("nationality")} placeholder="e.g. Irish" className="h-12 rounded-xl" /></Field>
            <Field label="Fee status"><Pills value={a.fee_status} onChange={set("fee_status")} options={FEE_STATUS} /></Field>
            <Field label="Years lived in Ireland/EU/EEA/UK/Switzerland in the last 5"><Pills value={a.residency_years} onChange={set("residency_years")} options={["0", "1", "2", "3", "4", "5"]} /></Field>
            <Field label="County of home address"><Select value={a.county} onChange={set("county")} options={COUNTIES} /></Field>
            <Field label="Distance from home to college (km)"><Input type="number" inputMode="numeric" value={a.distance_km ?? ""} onChange={num("distance_km")} className="h-12 rounded-xl" /></Field>
          </>)}
          {step === 2 && (<>
            <Privacy />
            <Field label="Do you live with your parents?"><Pills value={a.lives_with_parents} onChange={set("lives_with_parents")} options={["yes", "no"]} /></Field>
            <Field label="Household income"><Pills value={a.income_band} onChange={set("income_band")} options={INCOME_BANDS} /></Field>
            <Field label="Number of dependants in household"><Input type="number" inputMode="numeric" value={a.dependants ?? ""} onChange={num("dependants")} className="h-12 rounded-xl" /></Field>
            <Field label="Number of others in college"><Input type="number" inputMode="numeric" value={a.others_in_college ?? ""} onChange={num("others_in_college")} className="h-12 rounded-xl" /></Field>
            <Field label="Are you on any social welfare payment?"><Pills value={a.social_welfare} onChange={set("social_welfare")} options={["yes", "no"]} /></Field>
          </>)}
          {step === 3 && (<>
            <Privacy />
            <p className="text-muted-foreground">Tap any that apply — all optional.</p>
            <div className="flex flex-wrap gap-2">
              {[...SITUATIONS, "prefer not to say"].map((s) => {
                const on = a.situation?.includes(s);
                return <button key={s} type="button" onClick={() => toggleSituation(s)} className={`rounded-full border px-4 py-2 text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`}>{s}</button>;
              })}
            </div>
          </>)}
          {step === 4 && (
            <Field label="Tell us anything about your situation in your own words.">
              <Textarea rows={7} value={a.notes ?? ""} onChange={(e) => setA((p) => ({ ...p, notes: e.target.value }))} className="rounded-2xl text-base" placeholder="e.g. I'm moving out of home this year and work part-time…" />
            </Field>
          )}
          {step === 5 && (
            <dl className="divide-y rounded-3xl bg-card shadow-card">
              {review.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-5 py-3 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium capitalize">{v || "—"}</dd></div>
              ))}
            </dl>
          )}
        </div>

        <div className="mt-8">
          {step < 5 ? (
            <Button onClick={next} className="h-14 w-full rounded-2xl text-base">Next <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button onClick={finish} className="h-14 w-full rounded-2xl bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"><Sparkles className="h-5 w-5" /> Find my grants</Button>
          )}
        </div>
      </div>
    </div>
  );
}
