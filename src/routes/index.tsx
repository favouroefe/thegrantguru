import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { WINS } from "@/lib/mock";
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
          <div className="mt-10 rounded-3xl bg-primary-foreground/10 p-5">
            <p className="font-display text-4xl font-extrabold text-accent"><FundingCounter /></p>
            <p className="text-sm text-primary-foreground/80">in funding found for students</p>
          </div>
          <div className="mt-4 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
            <div className="flex w-max animate-marquee gap-3">
              {[...WINS, ...WINS].map((w, i) => (
                <span key={i} className="whitespace-nowrap rounded-full bg-primary-foreground/10 px-4 py-2 text-sm">🎉 {w}</span>
              ))}
            </div>
          </div>
          <ul className="mt-8 grid gap-3 text-sm text-primary-foreground/80">
            <li className="flex items-center gap-3"><Clock className="h-4 w-4 text-accent" /> Takes about 5 minutes</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-accent" /> Your answers are only used to match grants</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function FundingCounter() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now(); let raf = 0;
    const tick = (t: number) => { const p = Math.min((t - start) / 1800, 1); setV(1.2 * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <>€{v.toFixed(1)}M</>;
}
