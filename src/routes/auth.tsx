import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["login", "signup"]).optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — GrantGuru" },
      { name: "description", content: "Log in or create your GrantGuru account to find student funding." },
      { property: "og:title", content: "Sign in — GrantGuru" },
      { property: "og:description", content: "Log in or create your GrantGuru account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode = "login" } = Route.useSearch();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = isSignup
      ? await supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/home" });
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-md">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-primary">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><GraduationCap className="h-5 w-5" /></span>
          GrantGuru
        </Link>
        <div className="mt-10 rounded-3xl bg-card p-6 shadow-card">
          <h1 className="text-3xl font-bold">{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-1 text-muted-foreground">{isSignup ? "It's free and takes a minute." : "Log in to see your matches."}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {isSignup && (
              <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" /></div>
            )}
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" /></div>
            <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" /></div>
            <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl text-base">{busy ? "Please wait…" : isSignup ? "Sign up" : "Log in"}</Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account? " : "New here? "}
            <Link to="/auth" search={{ mode: isSignup ? "login" : "signup" }} className="font-semibold text-primary">{isSignup ? "Log in" : "Sign up"}</Link>
          </p>
          {!isSignup && (
            <button type="button" onClick={() => { setEmail("demo@grantguru.ie"); setPassword("demo1234"); }} className="mt-3 w-full text-center text-xs text-muted-foreground underline">
              Use demo account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
