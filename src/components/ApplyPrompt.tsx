import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { fundsQuery, upsertUserGrant } from "@/lib/data";
import { toast } from "sonner";

export function ApplyPrompt() {
  const [grantId, setGrantId] = useState<string | null>(null);
  const { data: grants } = useQuery(fundsQuery);
  const qc = useQueryClient();
  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== "visible") return;
      const id = sessionStorage.getItem("gg_pending_apply");
      if (id) { sessionStorage.removeItem("gg_pending_apply"); setGrantId(id); }
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => { document.removeEventListener("visibilitychange", check); window.removeEventListener("focus", check); };
  }, []);
  const name = grants?.find((g) => g.id === grantId)?.name ?? "this grant";
  async function yes() {
    if (!grantId) return;
    await upsertUserGrant(grantId, { status: "applied" });
    qc.invalidateQueries({ queryKey: ["user_grants"] });
    toast.success("Marked as applied — nice one!");
    setGrantId(null);
  }
  return (
    <AlertDialog open={!!grantId} onOpenChange={(o) => !o && setGrantId(null)}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Did you apply?</AlertDialogTitle>
          <AlertDialogDescription>Let us know if you applied for {name} so we can track it on your dashboard.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not yet</AlertDialogCancel>
          <AlertDialogAction onClick={yes}>Yes, I applied</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
