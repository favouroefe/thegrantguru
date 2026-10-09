import { useState, type ReactNode } from "react";
import { Check, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function WhyWeAsk({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary">
        <Info className="h-3.5 w-3.5" /> Why we ask
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-2xl text-sm">{text}</PopoverContent>
    </Popover>
  );
}

export function OptionCards({ options, value, onChange }: { options: readonly { value: string; label: string }[]; value?: string | undefined; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-3">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 px-5 py-4 text-left text-base font-medium transition ${on ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/40"}`}>
            {o.label}
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{on && <Check className="h-4 w-4" />}</span>
          </button>
        );
      })}
    </div>
  );
}

export const yesNo = (extra?: boolean) => [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, ...(extra ? [{ value: "not_sure", label: "Not sure" }] : [])];

export function CheckCard({ on, onClick, label, help }: { on: boolean; onClick: () => void; label: ReactNode; help?: string | undefined }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition ${on ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/40"}`}>
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{on && <Check className="h-4 w-4" />}</span>
      <span><span className="block font-medium">{label}</span>{help && <span className="text-sm text-muted-foreground">{help}</span>}</span>
    </button>
  );
}

/** Type-to-search input. `free` allows any typed text as the value. */
export function Autocomplete({ options, value, onChange, placeholder, free }: { options: string[]; value?: string | undefined; onChange: (v: string) => void; placeholder: string; free?: boolean }) {
  const [q, setQ] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const list = q ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())).sort((a, b) => Number(!a.toLowerCase().startsWith(q.toLowerCase())) - Number(!b.toLowerCase().startsWith(q.toLowerCase()))).slice(0, 8) : options.slice(0, 8);
  return (
    <div className="relative">
      <input value={q} placeholder={placeholder} autoComplete="off"
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); onChange(free ? e.target.value : options.includes(e.target.value) ? e.target.value : ""); }}
        className="h-14 w-full rounded-2xl border-2 border-border bg-card px-5 text-base outline-none focus:border-primary" />
      {open && list.length > 0 && (
        <ul className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border bg-popover p-1 shadow-card">
          {list.map((o) => (
            <li key={o}><button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(o); onChange(o); setOpen(false); }}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm hover:bg-secondary ${value === o ? "font-semibold text-primary" : ""}`}>{o}</button></li>
          ))}
        </ul>
      )}
    </div>
  );
}
