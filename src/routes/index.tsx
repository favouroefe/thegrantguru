import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GraduationCap, ShieldCheck, Sparkles, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GrantGuru — You could be missing thousands in student funding" },
      { name: "description", content: "Answer a few questions and see which Irish student grants, bursaries and scholarships you're likely eligible for." },
      { property: "og:title", content: "GrantGuru — Find your student funding in Ireland" },
      { property: "og:description", content: "SUSI, 1916 Bursary, SAF and more — matched to your situation in minutes." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-hero text-primary-foreground">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-8">
        <div className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground"><GraduationCap className="h-5 w-5" /></span>
          GrantGuru
        </div>
        <div className="flex flex-1 flex-col justify-center py-12">
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-sm">
            <Sparkles className="h-4 w-4 text-accent" /> For students in Ireland
          </p>
          <h1 className="text-5xl font-extrabold leading-[1.02] sm:text-6xl">
            You could be missing <span className="text-accent">thousands</span> in student funding
          </h1>
          <p className="mt-5 text-lg text-primary-foreground/80">
            Answer a few questions and we'll show you the grants, bursaries and scholarships you're likely to qualify for — in plain English.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button asChild size="lg" className="h-14 rounded-2xl bg-accent text-base font-semibold text-accent-foreground hover:bg-accent/90">
              <Link to="/auth" search={{ mode: "signup" }}>Sign up</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl border-primary-foreground/30 bg-transparent text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/auth" search={{ mode: "login" }}>Log in</Link>
            </Button>
          </div>
          <ul className="mt-10 grid gap-3 text-sm text-primary-foreground/80">
            <li className="flex items-center gap-3"><Clock className="h-4 w-4 text-accent" /> Takes about 5 minutes</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-accent" /> Your answers are only used to match grants</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
