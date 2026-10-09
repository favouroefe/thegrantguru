import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, ExternalLink, CheckCircle2, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { daysUntil } from "@/lib/options";
import { upsertUserGrant, type Grant, type UserGrant } from "@/lib/data";
import { toast } from "sonner";

export function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const d = daysUntil(deadline);
  if (d === null) return <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">Rolling / no fixed deadline</span>;
  if (d < 0) return <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Closed</span>;
  const label = new Date(deadline!).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });
  return (
    <span className={d < 14 ? "rounded-full bg-destructive px-2.5 py-0.5 text-xs font-semibold text-destructive-foreground" : "rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"}>
      {d < 14 ? `${d} days left · ` : "Due "}{label}
    </span>
  );
}

export function markApplyClicked(grantId: string) {
  sessionStorage.setItem("gg_pending_apply", grantId);
}

export function GrantCard({ grant, reason, ug }: { grant: Grant; reason?: string | undefined; ug?: UserGrant | undefined }) {
  const qc = useQueryClient();
  async function toggleSave() {
    try {
      await upsertUserGrant(grant.id, { saved: !ug?.saved });
      qc.invalidateQueries({ queryKey: ["user_grants"] });
      toast.success(ug?.saved ? "Removed from saved" : "Saved");
    } catch (e) { toast.error((e as Error).message); }
  }
  return (
    <div className="rounded-3xl bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <Link to="/grant/$id" params={{ id: grant.id }} className="min-w-0">
          <h3 className="text-lg font-bold leading-tight">{grant.name}</h3>
          <p className="text-sm text-muted-foreground">{grant.provider}</p>
        </Link>
        <span className="shrink-0 rounded-xl bg-accent px-2.5 py-1 text-xs font-bold capitalize text-accent-foreground">{grant.type}</span>
      </div>
      <p className="mt-3 font-display text-xl font-bold text-primary">{grant.amount_text}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <DeadlineBadge deadline={grant.deadline} />
        {ug?.status && <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary"><CheckCircle2 className="h-3 w-3" />{ug.status}</span>}
      </div>
      {reason && <p className="mt-3 text-sm text-foreground/80">{reason}</p>}
      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="icon" aria-label="Add to my calendar" className="shrink-0 rounded-xl" onClick={() => toast.success("Added to your calendar 📅")}><CalendarPlus className="h-4 w-4" /></Button>
        <Button variant="outline" className="flex-1 rounded-xl" onClick={toggleSave}>
          {ug?.saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}{ug?.saved ? "Saved" : "Save"}
        </Button>
        <Button asChild className="flex-1 rounded-xl">
          <a href={grant.apply_url} target="_blank" rel="noreferrer" onClick={() => markApplyClicked(grant.id)}>Apply <ExternalLink className="h-4 w-4" /></a>
        </Button>
      </div>
    </div>
  );
}
