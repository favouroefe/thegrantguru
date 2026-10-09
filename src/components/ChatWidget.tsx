import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send, X, BookOpen } from "lucide-react";
import { askGuru } from "@/lib/chat.functions";
import { grantsQuery } from "@/lib/data";

const SUGGESTIONS: { q: string; a: string; sources: string[] }[] = [
  { q: "Can I get SUSI if I repeated a year?", a: "Usually SUSI won't fund a repeat year of the same course level, but there are exceptions (e.g. illness or other serious circumstances). I'm not certain – check with SUSI or your college access office.", sources: ["susi-maintenance"] },
  { q: "I'm an international student, what can I apply for?", a: "Most SUSI and Free Fees schemes need EU fee status, but you can look at university international merit scholarships, your college's hardship fund, and Universities of Sanctuary scholarships if you have protection or leave to remain.", sources: ["intl-merit", "college-hardship", "sanctuary"] },
  { q: "What's the Student Assistance Fund for?", a: "The Student Assistance Fund helps students in financial difficulty with costs like rent, food, travel, books and childcare. You apply through your college access office and they assess your need.", sources: ["saf"] },
];

interface Msg { role: "user" | "assistant"; content: string; sources?: string[] }

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const ask = useServerFn(askGuru);
  const { data: grants = [] } = useQuery(grantsQuery);
  const end = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => { if (open && !busy) inputRef.current?.focus(); }, [open, busy]);

  async function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: question }];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const r = await ask({ data: { messages: next.map(({ role, content }) => ({ role, content })) } });
      setMsgs([...next, { role: "assistant", content: r.answer, sources: r.sources }]);
    } catch (e) {
      const fb = SUGGESTIONS.find((s) => s.q === question);
      setMsgs([...next, fb ? { role: "assistant", content: fb.a, sources: fb.sources } : { role: "assistant", content: `Sorry, I couldn't answer that right now (${(e as Error).message}). Try again in a moment.` }]);
    } finally { setBusy(false); }
  }

  const name = (id: string) => grants.find((g) => g.id === id)?.name ?? id;

  return (
    <>
      <button onClick={() => setOpen((o) => !o)} aria-label="Ask GrantGuru" className="fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-2xl text-primary-foreground shadow-card transition hover:scale-105">
        {open ? <X className="h-6 w-6" /> : "💬"}
      </button>
      {open && (
        <div className="fixed inset-x-3 bottom-36 z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-3xl border bg-card shadow-card animate-tick-in sm:left-auto sm:right-4 sm:w-96">
          <div className="bg-hero px-5 py-4 text-primary-foreground">
            <p className="font-display text-lg font-bold">Ask GrantGuru</p>
            <p className="text-xs text-primary-foreground/80">Answers based on official grant rules</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s.q} disabled={busy} onClick={() => send(s.q)} className="rounded-full border bg-secondary px-3 py-1.5 text-left text-xs text-secondary-foreground hover:bg-accent">{s.q}</button>
              ))}
            </div>
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "ml-8 rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground" : "mr-4 text-sm leading-relaxed"}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.sources.map((id) => (
                      <Link key={id} to="/grant/$id" params={{ id }} onClick={() => setOpen(false)} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                        <BookOpen className="h-3 w-3" /> Source: {name(id)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="flex gap-1 py-2">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>}
            <div ref={end} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex gap-2 border-t p-3">
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about any grant…" className="h-11 flex-1 rounded-xl border bg-background px-3 text-sm" />
            <button type="submit" disabled={busy || !text.trim()} className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      )}
    </>
  );
}
