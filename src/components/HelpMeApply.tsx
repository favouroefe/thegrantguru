import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, ExternalLink, Bookmark } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { upsertUserGrant, type Fund } from "@/lib/data";
import { DeadlineBadge, markApplyClicked } from "./GrantCard";
import { toast } from "sonner";

/** Ticked documents for a fund, remembered in this browser. */
export function useChecklist(fundId: string) {
  const key = `gg_docs_${fundId}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  useEffect(() => { try { setChecked(JSON.parse(localStorage.getItem(key) ?? "{}")); } catch { /* ignore */ } }, [key]);
  const toggle = (d: string, v: boolean) => setChecked((p) => { const n = { ...p, [d]: v }; localStorage.setItem(key, JSON.stringify(n)); return n; });
  return { checked, toggle };
}

export function ApplyGuide({ fund }: { fund: Fund }) {
  const { checked, toggle } = useChecklist(fund.id);
  const qc = useQueryClient();
  const done = fund.documents_needed.filter((d) => checked[d]).length;
  async function save() {
    try { await upsertUserGrant(fund.id, { saved: true }); qc.invalidateQueries({ queryKey: ["user_grants"] }); toast.success("Saved to your dashboard"); }
    catch (e) { toast.error((e as Error).message); }
  }
  return (
    <div className="space-y-5">
      <section>
        <h3 className="font-bold">Step by step</h3>
        <ol className="mt-3 space-y-3">
          {fund.how_to_apply_steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span><span className="pt-0.5">{s}</span></li>
          ))}
        </ol>
      </section>
      {fund.documents_needed.length > 0 && (
        <section className="rounded-2xl bg-muted p-4">
          <div className="flex items-center justify-between"><h3 className="font-bold">Documents</h3><span className="text-sm font-semibold text-primary">Ready to apply: {done}/{fund.documents_needed.length}</span></div>
          <Progress value={(done / fund.documents_needed.length) * 100} className="mt-2 h-2" />
          <ul className="mt-3 space-y-2.5">
            {fund.documents_needed.map((d) => (
              <li key={d}><label className="flex items-center gap-3 text-sm"><Checkbox checked={!!checked[d]} onCheckedChange={(c) => toggle(d, !!c)} /><span className={checked[d] ? "text-muted-foreground line-through" : ""}>{d}</span></label></li>
            ))}
          </ul>
        </section>
      )}
      <section className="flex flex-wrap items-center justify-between gap-2">
        <DeadlineBadge deadline={fund.deadline} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={save}><Bookmark className="h-4 w-4" /> Save</Button>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => toast.success("Added to your calendar 📅")}><CalendarPlus className="h-4 w-4" /> Add to calendar</Button>
        </div>
      </section>
      <Button asChild className="h-12 w-full rounded-2xl">
        <a href={fund.apply_url} target="_blank" rel="noreferrer" onClick={() => markApplyClicked(fund.id)}>Apply on the official site <ExternalLink className="h-4 w-4" /></a>
      </Button>
    </div>
  );
}

export function HelpMeApply({ fund, trigger }: { fund: Fund; trigger: ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left"><SheetTitle>Help me apply: {fund.name}</SheetTitle><SheetDescription>{fund.provider}</SheetDescription></SheetHeader>
        <div className="mt-4 pb-4"><ApplyGuide fund={fund} /></div>
      </SheetContent>
    </Sheet>
  );
}

