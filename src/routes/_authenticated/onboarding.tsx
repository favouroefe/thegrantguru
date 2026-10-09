import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Lock, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Autocomplete, CheckCard, OptionCards, WhyWeAsk, yesNo } from "@/components/scan/inputs";
import { profileQuery, saveAnswers } from "@/lib/data";
import {
  COLLEGES, COUNTIES, COUNTRIES, COURSES, IDENTITIES, INCOME, SITUATIONS, TALENTS,
  isStemCourse, loadSituation, pathFor, storeSituation, type Answers, type Situation,
} from "@/lib/options";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({ meta: [{ title: "Find my funding — GrantGuru" }, { name: "description", content: "A few quick questions to match you with student funding." }, { property: "og:title", content: "Find my funding — GrantGuru" }, { property: "og:description", content: "A few quick questions to match your funding." }] }),
  component: Onboarding,
});

const PARTS = ["About you", "Your studies", "Home & money", "Talents & interests", "Your situation", "Anything else?"];

interface Q {
  id: string; part: number; title: string; sub?: string; why: string; optional?: boolean;
  show?: (a: Answers) => boolean; valid: (a: Answers, s: Situation) => boolean;
  render: (ctx: Ctx) => ReactNode; summary: (a: Answers, s: Situation) => string;
}
interface Ctx { a: Answers; set: (patch: Partial<Answers>) => void; s: Situation; setS: (s: Situation) => void }

const lbl = (opts: readonly { value: string; label: string }[], v?: string) => opts.find((o) => o.value === v)?.label ?? "—";
const has = (v?: string) => !!v && v.length > 0;
const pathA = (a: Answers) => pathFor(a.identity) === "A";
const pathB = (a: Answers) => pathFor(a.identity) === "B";
const YEARS = [{ value: "1", label: "1st year" }, { value: "2", label: "2nd year" }, { value: "3", label: "3rd year" }, { value: "4", label: "4th year" }, { value: "5+", label: "5th year or more" }, { value: "postgrad", label: "Postgrad" }];
const STUDY = [{ value: "full-time", label: "Full-time" }, { value: "part-time", label: "Part-time" }];
const LEVELS = [{ value: "club", label: "Club" }, { value: "county", label: "County" }, { value: "national", label: "National" }, { value: "international", label: "International" }];
const GENDERS = [{ value: "woman", label: "Woman" }, { value: "man", label: "Man" }, { value: "non-binary", label: "Non-binary" }, { value: "self", label: "Self-describe" }, { value: "pnts", label: "Prefer not to say" }];

/** A Part 5 multi-select screen. Answers live in session state only. */
function sitQ(id: string, title: string, keys: string[]): Q {
  const opts = SITUATIONS.filter((o) => keys.includes(o.value));
  return {
    id, part: 4, optional: true, title, sub: "Select all that apply.", why: "",
    valid: () => true,
    summary: (_a, s) => opts.filter((o) => s.items.includes(o.value)).map((o) => o.label).join(", ") || "—",
    render: ({ s, setS }) => {
      const none = !!s.none?.includes(id);
      const toggle = (v: string) => setS({ ...s, none: (s.none ?? []).filter((x) => x !== id), items: s.items.includes(v) ? s.items.filter((x) => x !== v) : [...s.items, v] });
      return (
        <div className="space-y-3">
          {opts.map((o) => <CheckCard key={o.value} on={s.items.includes(o.value)} onClick={() => toggle(o.value)} label={o.label} help={"help" in o ? o.help : undefined} />)}
          <CheckCard on={none} onClick={() => setS({ ...s, items: s.items.filter((x) => !keys.includes(x)), none: none ? (s.none ?? []).filter((x) => x !== id) : [...(s.none ?? []), id] })} label="None of these" />
        </div>
      );
    },
  };
}

const QUESTIONS: Q[] = [
  { id: "gender", part: 0, title: "How do you describe your gender?", why: "Some scholarships are set up for particular groups, like women in STEM. We only use this to add funds — never to hide any.",
    valid: (_a, s) => has(s.gender) && (s.gender !== "self" || has(s.gender_self?.trim())),
    summary: (_a, s) => s.gender === "self" ? s.gender_self || "Self-describe" : lbl(GENDERS, s.gender),
    render: ({ s, setS }) => (<>
      <OptionCards options={GENDERS} value={s.gender} onChange={(v) => setS({ ...s, gender: v })} />
      {s.gender === "self" && <Input autoFocus value={s.gender_self ?? ""} onChange={(e) => setS({ ...s, gender_self: e.target.value })} placeholder="How do you describe yourself?" className="mt-3 h-12 rounded-xl" />}
    </>) },
  { id: "identity", part: 0, title: "Which of these describes you best?", why: "Most state grants depend on your citizenship or residency status. This tells us which funds you can apply for.",
    valid: (a) => has(a.identity), summary: (a) => lbl(IDENTITIES, a.identity),
    render: ({ a, set }) => <OptionCards options={IDENTITIES} value={a.identity} onChange={(v) => set({ identity: v })} /> },
  { id: "residency", part: 0, title: "Have you lived in Ireland, the UK or the EU/EEA for at least 3 of the last 5 years?", why: "SUSI and free fees usually need 3 years of living here (or in the UK/EU) before your course starts.",
    show: pathA, valid: (a) => has(a.residency), summary: (a) => lbl(yesNo(true), a.residency),
    render: ({ a, set }) => <OptionCards options={yesNo(true)} value={a.residency} onChange={(v) => set({ residency: v })} /> },

  { id: "college", part: 1, title: "Which college are you going to?", why: "Lots of scholarships and hardship funds are run by each college.",
    valid: (a) => has(a.college), summary: (a) => a.college ?? "—",
    render: ({ a, set }) => <Autocomplete options={COLLEGES} value={a.college} onChange={(v) => set({ college: v })} placeholder="e.g. DCU" /> },
  { id: "course", part: 1, title: "What are you studying?", sub: "Pick from the list or just type it.", why: "Some funds are for certain subjects, like science and tech (STEM).",
    valid: (a) => has(a.course?.trim()), summary: (a) => `${a.course ?? "—"}${isStemCourse(a.course) ? " (STEM)" : ""}`,
    render: ({ a, set }) => (<>
      <Autocomplete options={COURSES} value={a.course} onChange={(v) => set({ course: v })} placeholder="e.g. Nursing" free />
      {isStemCourse(a.course) && <p className="mt-3 inline-flex rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">🔬 STEM course</p>}
    </>) },
  { id: "year", part: 1, title: "What year are you in?", why: "Some funds, like the 1916 Bursary, are only for first years.",
    valid: (a) => has(a.year), summary: (a) => lbl(YEARS, a.year),
    render: ({ a, set }) => <OptionCards options={YEARS} value={a.year} onChange={(v) => set({ year: v })} /> },
  { id: "study", part: 1, title: "Are you studying full-time or part-time?", why: "SUSI grants are only for full-time students. Other help is open to part-time students too.",
    valid: (a) => has(a.study), summary: (a) => lbl(STUDY, a.study),
    render: ({ a, set }) => <OptionCards options={STUDY} value={a.study} onChange={(v) => set({ study: v })} /> },
  { id: "first_time", part: 1, title: "Is this your first time in college?", why: "Many grants only pay for your first course at each level.",
    valid: (a) => has(a.first_time), summary: (a) => lbl(yesNo(), a.first_time),
    render: ({ a, set }) => <OptionCards options={yesNo()} value={a.first_time} onChange={(v) => set({ first_time: v })} /> },

  { id: "county", part: 2, title: "Which county is your home in?", why: "Some local funds and credit union bursaries depend on where you live.",
    show: pathA, valid: (a) => has(a.county), summary: (a) => a.county ?? "—",
    render: ({ a, set }) => <Autocomplete options={COUNTIES} value={a.county} onChange={(v) => set({ county: v })} placeholder="e.g. Mayo" /> },
  { id: "distance_30", part: 2, title: "Is your home 30km or more from your college?", why: "If you live 30km or more away, SUSI pays you a higher rate.",
    show: pathA, valid: (a) => has(a.distance_30), summary: (a) => lbl(yesNo(true), a.distance_30),
    render: ({ a, set }) => <OptionCards options={yesNo(true)} value={a.distance_30} onChange={(v) => set({ distance_30: v })} /> },
  { id: "income", part: 2, title: "Roughly how much does your household earn in a year?", sub: "Before tax, everyone you live with combined. A rough guess is fine.", why: "Most grants are means-tested. This is the biggest thing that decides what you get.",
    show: pathA, valid: (a) => has(a.income), summary: (a) => lbl(INCOME, a.income),
    render: ({ a, set }) => <OptionCards options={INCOME} value={a.income} onChange={(v) => set({ income: v })} /> },
  { id: "over23", part: 2, title: "Are you 23 or older?", why: "Mature students (23+) can get extra funds and scholarships.",
    show: pathA, valid: (a) => has(a.over23), summary: (a) => lbl(yesNo(), a.over23),
    render: ({ a, set }) => <OptionCards options={yesNo()} value={a.over23} onChange={(v) => set({ over23: v })} /> },
  { id: "origin_country", part: 2, title: "Which country are you from?", sub: "Optional — skip if you'd rather not say.", why: "Some scholarships are for students from particular countries.", optional: true,
    show: pathB, valid: () => true, summary: (a) => a.origin_country || "—",
    render: ({ a, set }) => <Autocomplete options={COUNTRIES} value={a.origin_country} onChange={(v) => set({ origin_country: v })} placeholder="e.g. India" /> },
  { id: "home_scholarship", part: 2, title: "Do you have a scholarship from your home country?", why: "Some Irish scholarships can't be combined with another one.",
    show: pathB, valid: (a) => has(a.home_scholarship), summary: (a) => lbl(yesNo(), a.home_scholarship),
    render: ({ a, set }) => <OptionCards options={yesNo()} value={a.home_scholarship} onChange={(v) => set({ home_scholarship: v })} /> },
  { id: "works", part: 2, title: "Do you work part-time?", why: "Part-time work usually doesn't stop you getting help, but some funds ask about it.",
    valid: (a) => has(a.works), summary: (a) => lbl(yesNo(), a.works),
    render: ({ a, set }) => <OptionCards options={yesNo()} value={a.works} onChange={(v) => set({ works: v })} /> },

  { id: "talents", part: 3, title: "Do you have any sporting or academic achievements?", sub: "Select all that apply. These help us find scholarships for you.", why: "Lots of scholarships reward sport, results, creativity or community work — not just money worries.",
    valid: (a) => (a.talents?.length ?? 0) > 0 && (!a.talents?.includes("sport") || (has(a.sport_name) && has(a.sport_level))),
    summary: (a) => (a.talents ?? []).map((t) => lbl(TALENTS, t)).join(", ") + (a.talents?.includes("sport") ? ` (${a.sport_name}, ${a.sport_level})` : ""),
    render: ({ a, set }) => {
      const t = a.talents ?? [];
      const toggle = (v: string) => set({ talents: v === "none" ? (t.includes("none") ? [] : ["none"]) : t.includes(v) ? t.filter((x) => x !== v) : [...t.filter((x) => x !== "none"), v] });
      return (<>
        <div className="flex flex-wrap gap-2">
          {TALENTS.map((o) => (
            <button key={o.value} type="button" onClick={() => toggle(o.value)} className={`rounded-full border-2 px-4 py-3 text-sm font-medium transition ${t.includes(o.value) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"}`}>{o.label}</button>
          ))}
        </div>
        {t.includes("sport") && (
          <div className="mt-5 space-y-3 rounded-2xl bg-secondary p-4">
            <p className="text-sm font-semibold">Which sport?</p>
            <Input value={a.sport_name ?? ""} onChange={(e) => set({ sport_name: e.target.value })} placeholder="e.g. Camogie" className="h-12 rounded-xl bg-card" />
            <p className="text-sm font-semibold">What level do you play at?</p>
            <div className="grid grid-cols-2 gap-2">{LEVELS.map((l) => <button key={l.value} type="button" onClick={() => set({ sport_level: l.value })} className={`rounded-xl border-2 px-3 py-3 text-sm ${a.sport_level === l.value ? "border-primary bg-card font-semibold" : "border-transparent bg-card"}`}>{l.label}</button>)}</div>
          </div>
        )}
      </>);
    } },

  { id: "situation_intro", part: 4, optional: true, title: "A few optional questions", why: "",
    valid: () => true, summary: () => "",
    render: () => <p className="flex items-center gap-2 rounded-2xl bg-secondary p-4 text-secondary-foreground"><Lock className="h-5 w-5 shrink-0" /> These help us find extra funding. They're optional and never stored.</p> },
  sitQ("sit_family", "Family & caring", ["carer", "lone_parent"]),
  sitQ("sit_health", "Health & learning", ["disability", "neurodivergent"]),
  sitQ("sit_background", "Your background", ["care_experienced", "traveller_roma", "first_in_family"]),
  sitQ("sit_money", "Money & route to college", ["welfare", "fe_entrant"]),

  { id: "notes", part: 5, optional: true, title: "Tell us anything else in your own words (optional).", why: "Sometimes there's something the questions missed. It helps when you ask GrantGuru for advice later.",
    valid: () => true, summary: (a) => a.notes || "—",
    render: ({ a, set }) => <Textarea rows={7} value={a.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} className="rounded-2xl text-base" placeholder="e.g. I'm moving out of home this year and work weekends…" /> },
];

function Onboarding() {
  const { data: profile, isLoading } = useQuery(profileQuery);
  const { q: startAt } = Route.useSearch();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [a, setA] = useState<Answers>({});
  const [s, setSState] = useState<Situation>({ items: [] });
  const [idx, setIdx] = useState(0);
  const [review, setReview] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);
  const [loaded, setLoaded] = useState(false);

  const visible = QUESTIONS.filter((q) => !q.show || q.show(a));
  const q = visible[Math.min(idx, visible.length - 1)]!;

  useEffect(() => {
    if (loaded || !profile) return;
    const start = (profile.answers ?? profile.partial ?? {}) as Answers;
    setA(start);
    setSState(loadSituation());
    const vis = QUESTIONS.filter((x) => !x.show || x.show(start));
    if (startAt) { const i = vis.findIndex((x) => x.id === startAt); if (i >= 0) setIdx(i); }
    else if (profile.answers) setReview(true);
    setLoaded(true);
  }, [profile, loaded, startAt]);

  const set = (patch: Partial<Answers>) => setA((p) => ({ ...p, ...patch }));
  const setS = (n: Situation) => { setSState(n); storeSituation(n); };

  async function persist(next = a) {
    try { await saveAnswers(next); qc.invalidateQueries({ queryKey: ["profile"] }); } catch (e) { toast.error((e as Error).message); }
  }
  const ok = q.valid(a, s);
  const go = useCallback(async () => {
    if (review) return;
    if (!ok) return;
    setDir(1);
    void persist();
    if (idx >= visible.length - 1) setReview(true); else setIdx(idx + 1);
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, idx, visible.length, review, a]);
  function back() {
    setDir(-1);
    if (review) { setReview(false); setIdx(visible.length - 1); return; }
    if (idx === 0) navigate({ to: "/home" }); else setIdx(idx - 1);
  }
  function edit(part: number) { setDir(-1); setReview(false); setIdx(visible.findIndex((x) => x.part === part)); }
  async function finish() { await persist(); navigate({ to: "/results", search: { scan: true } }); }
  async function later() { await persist(); toast.success("Saved — come back anytime."); navigate({ to: "/home" }); }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      e.preventDefault();
      if (review) void finish(); else void go();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go, review]);

  if (isLoading || !loaded) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  const part = review ? 6 : q.part;
  const progress = review ? 100 : ((idx + 1) / (visible.length + 1)) * 100;
  const sensitive = !review && (q.part === 2 || q.part === 4);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-6">
        <div className="flex items-center justify-between text-sm">
          <button onClick={back} className="flex items-center gap-1 text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back</button>
          <button onClick={later} className="font-medium text-primary">Save & finish later</button>
        </div>
        <p className="mt-5 text-sm font-semibold text-primary">{review ? "Review your answers" : `Part ${part + 1} of 6 · ${PARTS[part]}`}</p>
        <Progress value={progress} className="mt-2 h-2" />

        {review ? (
          <div key="review" className="mt-8 flex-1 animate-in fade-in slide-in-from-right-8 duration-300">
            <h1 className="text-3xl font-extrabold">All good?</h1>
            <p className="mt-1 text-muted-foreground">Check your answers, then we'll find your funding.</p>
            <div className="mt-6 space-y-4">
              {PARTS.map((name, p) => {
                const qs = visible.filter((x) => x.part === p);
                return (
                  <section key={name} className="rounded-3xl bg-card p-5 shadow-card">
                    <div className="flex items-center justify-between"><h2 className="font-bold">{name}</h2><button onClick={() => edit(p)} className="flex items-center gap-1 text-sm font-semibold text-primary"><Pencil className="h-3.5 w-3.5" /> Edit</button></div>
                    <dl className="mt-3 space-y-2">
                      {qs.map((x) => <div key={x.id} className="text-sm"><dt className="text-muted-foreground">{x.title}</dt><dd className="font-medium">{x.summary(a, s)}</dd></div>)}
                    </dl>
                  </section>
                );
              })}
            </div>
            <Button onClick={finish} className="mt-8 h-14 w-full rounded-2xl bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"><Sparkles className="h-5 w-5" /> Find my funding</Button>
          </div>
        ) : (
          <div key={q.id} className={`mt-8 flex-1 animate-in fade-in duration-300 ${dir === 1 ? "slide-in-from-right-8" : "slide-in-from-left-8"}`}>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{q.title}</h1>
            </div>
            {q.sub && <p className="mt-2 text-muted-foreground">{q.sub}</p>}
            <div className="mt-2"><WhyWeAsk text={q.why} /></div>
            {sensitive && <p className="mt-4 flex items-center gap-2 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground"><Lock className="h-4 w-4" /> Only used to match grants. Never shared.</p>}
            <div className="mt-6">{q.render({ a, set, s, setS })}</div>
          </div>
        )}

        {!review && (
          <div className="sticky bottom-0 mt-8 bg-background pb-2 pt-3">
            <Button onClick={go} disabled={!ok} className="h-14 w-full rounded-2xl text-base">Continue <ArrowRight className="h-4 w-4" /></Button>
            {!ok && <p className="mt-2 text-center text-sm text-muted-foreground">{q.id === "talents" ? "Pick at least one (or “None of these”) to continue" : "Pick an option to continue"}</p>}
            {(q.part >= 4 || q.optional) && <button onClick={() => { setDir(1); if (idx >= visible.length - 1) setReview(true); else setIdx(idx + 1); }} className="mt-3 w-full text-center text-sm font-semibold text-primary underline">Skip</button>}
          </div>
        )}
      </div>
    </div>
  );
}
