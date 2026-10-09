import { Link } from "@tanstack/react-router";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { daysUntil, euro } from "@/lib/options";
import type { Fund, UserGrant } from "@/lib/data";
import type { Match } from "@/lib/matching";
import { HelpMeApply } from "./HelpMeApply";

export function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const d = daysUntil(deadline);
  if (d === null) return <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">Rolling / no fixed deadline</span>;
  if (d < 0) return <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Closed</span>;
  const label = new Date(deadline!).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });
  if (d === 0) return <span className="rounded-full bg-destructive px-2.5 py-0.5 text-xs font-semibold text-destructive-foreground">Closes today</span>;
  return (
    <span className={d < 14 ? "rounded-full bg-destructive px-2.5 py-0.5 text-xs font-semibold text-destructive-foreground" : "rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"}>
      {d < 14 ? `${d} day${d === 1 ? "" : "s"} left · ` : "Due "}{label}
    </span>
  );
}

export function VerifyTag({ fund }: { fund: Fund }) {
  if (fund.verified) return null;
  return <span className="rounded-full border border-warning bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning-foreground">Being verified</span>;
}

const LABEL_CLASS: Record<string, string> = {
  Likely: "bg-primary text-primary-foreground",
  Possible: "bg-accent text-accent-foreground",
  "Check eligibility": "bg-muted text-muted-foreground",
};
export function MatchLabel({ label }: { label: string }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${LABEL_CLASS[label] ?? ""}`}>{label}</span>;
}

export function markApplyClicked(grantId: string) {
  sessionStorage.setItem("gg_pending_apply", grantId);
}

export function amountLabel(m: Pick<Match, "amount" | "fund">) {
  return m.amount != null ? `${euro(m.amount)}${m.fund.id === "btea" ? "/yr" : ""}` : m.fund.amount_text;
}

/** Compact card used on results, dashboard and saved lists. */
export function GrantCard({ match, ug, highlight }: { match: Match; ug?: UserGrant | undefined; highlight?: boolean | undefined }) {
  const f = match.fund;
  return (
    <div className={`rounded-3xl bg-card p-4 shadow-card transition ${highlight ? "ring-2 ring-accent" : ""}`}>
      <Link to="/grant/$id" params={{ id: f.id }} className="block">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-bold leading-snug">{f.name}</h3>
          {(() => { const t = amountLabel(match); const long = t.length > 24; return (
            <p title={long ? t : undefined} className="max-w-[45%] shrink-0 text-right font-display text-lg font-bold text-primary">{long ? "Amount varies" : t}</p>
          ); })()}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <MatchLabel label={match.label} />
          <DeadlineBadge deadline={f.deadline} />
          <VerifyTag fund={f} />
          {ug?.status && <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary"><CheckCircle2 className="h-3 w-3" />{ug.status}</span>}
        </div>
        <p className="mt-2 text-sm text-foreground/75"><span className="font-semibold text-foreground">Why you match:</span> {match.why}</p>
        {match.note && <p className="mt-1 text-xs text-muted-foreground">{match.note}</p>}
      </Link>
      <div className="mt-3 flex gap-2">
        <HelpMeApply fund={f} trigger={<Button className="flex-1 rounded-xl">Help me apply</Button>} />
        <Button asChild variant="outline" className="flex-1 rounded-xl">
          <a href={f.apply_url} target="_blank" rel="noreferrer" onClick={() => markApplyClicked(f.id)}>Official site <ExternalLink className="h-4 w-4" /></a>
        </Button>
      </div>
    </div>
  );
}
