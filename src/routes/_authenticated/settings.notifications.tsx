import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/notifications")({
  head: () => ({ meta: [{ title: "Notification settings — GrantGuru" }, { name: "description", content: "Choose deadline reminders and alerts." }, { property: "og:title", content: "Notification settings — GrantGuru" }, { property: "og:description", content: "Choose deadline reminders and alerts." }] }),
  component: NotificationSettings,
});

function NotificationSettings() {
  const [email, setEmail] = useState("");
  const [s, setS] = useState({ d7: true, d1: true, matches: true, weekly: false });
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? "")); }, []);
  const rows: [keyof typeof s, string, string][] = [
    ["d7", "Deadline reminder", "7 days before"], ["d1", "Deadline reminder", "1 day before"],
    ["matches", "New match alerts", "When a new grant fits you"], ["weekly", "Weekly newsletter", "The GrantGuru Weekly"],
  ];
  return (
    <AppShell>
      <h1 className="text-3xl font-extrabold">Notifications</h1>
      <div className="mt-5 divide-y rounded-3xl bg-card shadow-card">
        {rows.map(([k, t, d]) => (
          <label key={k} className="flex items-center justify-between gap-4 px-5 py-4">
            <span><span className="block font-semibold">{t}</span><span className="text-sm text-muted-foreground">{d}</span></span>
            <Switch checked={s[k]} onCheckedChange={(v) => { setS((p) => ({ ...p, [k]: v })); toast.success("Preference saved"); }} />
          </label>
        ))}
      </div>
      <div className="mt-5 space-y-2">
        <label className="text-sm font-semibold" htmlFor="email">Send alerts to</label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
        <Button onClick={() => toast.success(`Test alert sent to ${email} ✉️`)} className="h-12 w-full rounded-2xl"><Send className="h-4 w-4" /> Send me a test alert</Button>
      </div>

      <h2 className="mt-8 text-xl font-bold">Email preview</h2>
      <div className="mx-auto mt-3 max-w-sm rounded-[2rem] border-8 border-foreground/90 bg-muted p-3">
        <div className="mb-2 flex justify-between px-2 text-[10px] text-muted-foreground"><span>9:41</span><span>Inbox</span></div>
        <div className="overflow-hidden rounded-2xl bg-card">
          <div className="border-b px-4 py-3 text-xs"><p className="font-semibold">GrantGuru &lt;alerts@grantguru.ie&gt;</p><p className="text-muted-foreground">⏰ 7 days left: 1916 Bursary</p></div>
          <div className="bg-hero px-4 py-5 text-primary-foreground">
            <div className="flex items-center gap-2 font-display text-sm font-bold"><GraduationCap className="h-4 w-4 text-accent" /> GrantGuru</div>
            <p className="mt-3 font-display text-xl font-bold">Don't miss out on €5,000</p>
          </div>
          <div className="space-y-3 p-4 text-sm">
            <p>Hi there 👋</p>
            <p>The <b>1916 Bursary</b> closes in <b className="text-destructive">7 days</b>. You look likely eligible.</p>
            <ul className="space-y-1 text-xs text-muted-foreground"><li>☐ SUSI letter or income evidence</li><li>☐ Personal statement</li><li>☐ Priority group documents</li></ul>
            <span className="block rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground">Apply now</span>
            <p className="text-center text-[10px] text-muted-foreground">You're getting this because deadline reminders are on.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
