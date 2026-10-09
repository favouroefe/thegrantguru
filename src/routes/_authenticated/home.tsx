import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, RefreshCw, Search, LayoutDashboard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChatCard } from "@/components/ChatCard";
import { profileQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home — GrantGuru" }, { name: "description", content: "Your GrantGuru home." }, { property: "og:title", content: "Home — GrantGuru" }, { property: "og:description", content: "Your GrantGuru home." }] }),
  component: HomePage,
});

function HomePage() {
  const { data: profile } = useQuery(profileQuery);
  const hasProfile = !!profile?.answers;
  const first = profile?.name?.split(" ")[0] || "there";
  return (
    <AppShell>
      <h1 className="mt-4 text-4xl font-extrabold">Hey {first} 👋</h1>
      <p className="mt-1 text-muted-foreground">Let's find the money you're entitled to.</p>
      <Link to="/onboarding" className="group mt-6 block rounded-3xl bg-hero p-6 text-primary-foreground shadow-card">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
          {hasProfile ? <RefreshCw className="h-6 w-6" /> : <Search className="h-6 w-6" />}
        </span>
        <h2 className="mt-6 text-3xl font-bold">{hasProfile ? "Re-scan with updated info" : "Find my funding"}</h2>
        <p className="mt-2 text-primary-foreground/80">{hasProfile ? "Changed course, address or circumstances? Update and check again." : "A few quick questions, one at a time. We save as you go."}</p>
        <span className="mt-6 inline-flex items-center gap-2 font-semibold text-accent">Start <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
      </Link>
      <ChatCard />
      {hasProfile && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link to="/results" className="rounded-3xl bg-card p-5 shadow-card"><p className="text-sm text-muted-foreground">Last scan</p><p className="mt-1 font-bold">See my results</p></Link>
          <Link to="/dashboard" className="rounded-3xl bg-card p-5 shadow-card"><LayoutDashboard className="h-5 w-5 text-primary" /><p className="mt-1 font-bold">My dashboard</p></Link>
        </div>
      )}
    </AppShell>
  );
}
