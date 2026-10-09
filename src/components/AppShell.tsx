import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { GraduationCap, Home, LayoutDashboard, User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function AppShell({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const nav = "flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-xs text-muted-foreground";
  const active = { className: "text-primary font-semibold bg-secondary" };
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
        <Link to="/home" className="flex items-center gap-2 font-display font-bold text-primary">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><GraduationCap className="h-4 w-4" /></span>
          GrantGuru
        </Link>
        <button onClick={signOut} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /> Log out</button>
      </header>
      <main className="mx-auto max-w-2xl px-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 border-t bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl justify-around py-2">
          <Link to="/home" className={nav} activeProps={active}><Home className="h-5 w-5" />Home</Link>
          <Link to="/dashboard" className={nav} activeProps={active}><LayoutDashboard className="h-5 w-5" />Dashboard</Link>
          <Link to="/profile" className={nav} activeProps={active}><User className="h-5 w-5" />Profile</Link>
        </div>
      </nav>
    </div>
  );
}

export function Disclaimer() {
  return <p className="mt-10 rounded-2xl bg-muted p-4 text-center text-xs text-muted-foreground">Results are estimates. Always confirm eligibility on the official site.</p>;
}
