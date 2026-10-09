import { CalendarPlus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface CalFund { id: string; name: string; deadline: string | null; amount_text: string; apply_url: string }

const compact = (d: string) => d.replace(/-/g, "");
const nextDay = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  const n = new Date(Date.UTC(y!, m! - 1, day! + 1));
  return n.toISOString().slice(0, 10).replace(/-/g, "");
};
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function googleUrl(f: CalFund) {
  const p = new URLSearchParams({ action: "TEMPLATE", text: `${f.name} deadline`, dates: `${compact(f.deadline!)}/${nextDay(f.deadline!)}`, details: `${f.amount_text}\nApply: ${f.apply_url}` });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function buildIcs(funds: CalFund[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const events = funds.filter((f) => f.deadline).map((f) => [
    "BEGIN:VEVENT", `UID:${f.id}-${compact(f.deadline!)}@grantguru`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(f.deadline!)}`, `DTEND;VALUE=DATE:${nextDay(f.deadline!)}`,
    `SUMMARY:${esc(`${f.name} deadline`)}`, `DESCRIPTION:${esc(`${f.amount_text}\nApply: ${f.apply_url}`)}`, `URL:${f.apply_url}`,
    "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", `DESCRIPTION:${esc(`${f.name} closes in 7 days`)}`, "END:VALARM",
    "END:VEVENT",
  ].join("\r\n"));
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//GrantGuru//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
}

function download(funds: CalFund[], name: string) {
  const blob = new Blob([buildIcs(funds)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AddToCalendar({ funds, label = "Add to calendar", size = "sm", className }: { funds: CalFund[]; label?: string; size?: "sm" | "default"; className?: string }) {
  const dated = funds.filter((f) => f.deadline);
  const file = dated.length === 1 ? `${dated[0]!.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics` : "grantguru-deadlines.ics";
  const google = () => {
    if (dated.length === 1) { window.open(googleUrl(dated[0]!), "_blank", "noopener"); return; }
    dated.slice(0, 10).forEach((f) => window.open(googleUrl(f), "_blank", "noopener"));
    if (dated.length > 10) toast("Opened the first 10 — use the .ics option to add them all at once.");
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} disabled={!dated.length} className={`rounded-xl ${className ?? ""}`}><CalendarPlus className="h-4 w-4" /> {label} <ChevronDown className="h-3.5 w-3.5" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem onClick={google}>Google Calendar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => { download(dated, file); toast.success("Added – it'll appear in Notion Calendar once synced 📅"); }}>Notion Calendar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => { download(dated, file); toast.success("Calendar file downloaded – with a reminder 7 days before."); }}>Apple / Outlook (.ics)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
