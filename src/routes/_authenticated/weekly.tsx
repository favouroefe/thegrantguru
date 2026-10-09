import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Mail } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ISSUES } from "@/lib/mock";
import { euro } from "@/lib/options";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/weekly")({
  head: () => ({ meta: [{ title: "The GrantGuru Weekly" }, { name: "description", content: "Weekly deadlines, money tips and grant spotlights for students in Ireland." }, { property: "og:title", content: "The GrantGuru Weekly" }, { property: "og:description", content: "Your weekly student funding newsletter." }] }),
  component: Weekly,
});

function Weekly() {
  const [sel, setSel] = useState(0);
  const [sub, setSub] = useState(true);
  const issue = ISSUES[sel]!;
  return (
    <AppShell>
      <h1 className="text-3xl font-extrabold">The GrantGuru Weekly</h1>
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-card p-4 shadow-card">
        <span className="text-sm font-medium">Subscribed to the weekly email</span>
        <Switch checked={sub} onCheckedChange={(v) => { setSub(v); toast.success(v ? "Subscribed 🎉" : "Unsubscribed"); }} />
      </div>

      <article className="mt-5 overflow-hidden rounded-3xl bg-card shadow-card">
        <div className="bg-hero px-6 py-6 text-primary-foreground">
          <div className="flex items-center gap-2 font-display font-bold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-foreground"><GraduationCap className="h-4 w-4" /></span> The GrantGuru Weekly</div>
          <p className="mt-4 text-xs uppercase tracking-wider text-primary-foreground/70">Issue #{issue.no} · {issue.date}</p>
          <h2 className="mt-1 text-2xl font-bold">{issue.title}</h2>
        </div>
        <div className="space-y-6 p-6">
          <section>
            <h3 className="font-bold">📅 This week's deadlines</h3>
            <ul className="mt-2 divide-y rounded-2xl border">{issue.deadlines.map((d) => <li key={d.name} className="flex justify-between px-4 py-2.5 text-sm"><span>{d.name}</span><span className="font-semibold text-primary">{d.date}</span></li>)}</ul>
          </section>
          <section className="rounded-2xl bg-secondary p-5 text-center">
            <p className="text-sm text-secondary-foreground/80">You could still claim</p>
            <p className="font-display text-4xl font-extrabold text-primary">{euro(issue.claim)}</p>
          </section>
          <section>
            <h3 className="font-bold">🔦 Grant spotlight: {issue.spotlight.name}</h3>
            <ol className="mt-3 space-y-2">{issue.spotlight.steps.map((s, i) => <li key={i} className="flex gap-3 text-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>{s}</li>)}</ol>
          </section>
          <section className="rounded-2xl border-l-4 border-accent bg-muted p-4"><h3 className="font-bold">💡 Money tip of the week</h3><p className="mt-1 text-sm">{issue.tip}</p></section>
          <section><h3 className="font-bold">🤓 Did you know?</h3><p className="mt-1 text-sm">{issue.fact}</p></section>
          <Button onClick={() => toast.success("Sent! Check your inbox")} className="h-12 w-full rounded-2xl"><Mail className="h-4 w-4" /> Email me this issue</Button>
        </div>
      </article>

      <h2 className="mt-8 text-xl font-bold">Archive</h2>
      <div className="mt-3 space-y-2">
        {ISSUES.map((is, i) => i !== sel && (
          <button key={is.no} onClick={() => { setSel(i); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex w-full justify-between rounded-2xl bg-card px-5 py-3 text-left shadow-card">
            <span><span className="block font-semibold">{is.title}</span><span className="text-xs text-muted-foreground">Issue #{is.no}</span></span>
            <span className="text-sm text-muted-foreground">{is.date}</span>
          </button>
        ))}
      </div>
    </AppShell>
  );
}
