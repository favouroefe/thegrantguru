import { Share2, Link2, Download, GraduationCap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { euro } from "@/lib/options";
import { toast } from "sonner";

export function ShareResults({ total }: { total: number }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="mt-4 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"><Share2 className="h-4 w-4" /> Share my results</Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader><DialogTitle>Share your results</DialogTitle></DialogHeader>
        <div className="aspect-square rounded-3xl bg-hero p-7 text-primary-foreground">
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-center gap-2 font-display font-bold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground"><GraduationCap className="h-4 w-4" /></span> GrantGuru</div>
            <p className="font-display text-3xl font-extrabold leading-tight">I found <span className="text-accent">{euro(total)}</span> in student funding I didn't know about 👀</p>
            <p className="text-sm text-primary-foreground/70">Find yours at grantguru.ie</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => toast.success("Link copied!")}><Link2 className="h-4 w-4" /> Copy link</Button>
          <Button className="rounded-xl" onClick={() => toast.success("Image downloaded")}><Download className="h-4 w-4" /> Download image</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
