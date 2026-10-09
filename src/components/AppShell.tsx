import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { GraduationCap, Home, LayoutDashboard, User, LogOut, Bell, CalendarDays, Newspaper, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NOTIFICATIONS } from "@/lib/mock";
import { ApplyPrompt } from "./ApplyPrompt";
import { ChatWidget } from "./ChatWidget";

function NotificationBell() {
  const [unread, setUnread] = useState<number>(NOTIFICATIONS.length);
  return (
    <DropdownMenu onOpenChange={(o) => o && setUnread(0)}>
      <DropdownMenuTrigger aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-secondary">
        <Bell className="h-5 w-5 text-foreground" />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        {NOTIFICATIONS.map((n) => (
          <DropdownMenuItem key={n.id} asChild className="rounded-xl">
            <Link to={n.to as "/results"} {...(n.id === 1 ? { to: "/grant/$id" as const, params: { id: "bursary-1916" } } : {})} className="flex items-start gap-3 py-2">
              <span className="text-lg">{n.icon}</span>
              <span><span className="block text-sm font-medium">{n.title}</span><span className="text-xs text-muted-foreground">{n.time}</span></span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-xl"><Link to="/settings/notifications"><Settings className="h-4 w-4" /> Notification settings</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const nav = "flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[11px] text-muted-foreground";
  const active = { className: "text-primary font-semibold bg-secondary" };
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
        <Link to="/home" className="flex items-center gap-2 font-display font-bold text-primary">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><GraduationCap className="h-4 w-4" /></span>
          GrantGuru
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={signOut} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /> Log out</button>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl justify-around py-2">
          <Link to="/home" className={nav} activeProps={active}><Home className="h-5 w-5" />Home</Link>
          <Link to="/dashboard" className={nav} activeProps={active}><LayoutDashboard className="h-5 w-5" />Dashboard</Link>
          <Link to="/calendar" className={nav} activeProps={active}><CalendarDays className="h-5 w-5" />Calendar</Link>
          <Link to="/weekly" className={nav} activeProps={active}><Newspaper className="h-5 w-5" />Weekly</Link>
          <Link to="/profile" className={nav} activeProps={active}><User className="h-5 w-5" />Profile</Link>
        </div>
      </nav>
      <ApplyPrompt />
      <ChatWidget />
    </div>
  );
}

export function Disclaimer() {
  return <p className="mt-10 rounded-2xl bg-muted p-4 text-center text-xs text-muted-foreground">Results are estimates. Always confirm eligibility on the official site.</p>;
}
