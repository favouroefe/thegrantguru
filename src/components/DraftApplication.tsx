import { useState } from "react";
import { PenLine, Copy, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { STATEMENT } from "@/lib/mock";
import { toast } from "sonner";

export function DraftApplication({ grantName }: { grantName: string }) {
  const [loading, setLoading] = useState(false);
  function regen() { setLoading(true); setTimeout(() => setLoading(false), 1400); }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-6 h-12 w-full rounded-2xl"><PenLine className="h-4 w-4" /> Draft my application</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle>Personal statement draft</DialogTitle>
          <DialogDescription>For {grantName}. Edit it to sound like you.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />)}</div>
        ) : (
          <div className="whitespace-pre-wrap rounded-2xl bg-muted p-4 text-sm leading-relaxed">{STATEMENT}</div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="rounded-xl" disabled={loading} onClick={regen}><RefreshCw className="h-4 w-4" /> Regenerate</Button>
          <Button className="rounded-xl" disabled={loading} onClick={() => { navigator.clipboard?.writeText(STATEMENT); toast.success("Copied to clipboard"); }}><Copy className="h-4 w-4" /> Copy</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
