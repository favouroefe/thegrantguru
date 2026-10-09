import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useMatches } from "@/hooks/use-matches";
import { FALLBACK, SAMPLE_QUESTIONS, scriptAnswer, type ChatAction } from "@/lib/chat-script";

const TYPING_MS = 800;

interface Msg { role: "user" | "assistant"; content: string; action?: ChatAction }

export function ChatCard() {
  const { loading, profile, answers, total } = useMatches();
  const first = profile?.name?.split(" ")[0] || "there";
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const greeted = useRef(false);

  const greeting: Msg = answers
    ? { role: "assistant", content: total > 0 ? `Welcome back ${first}! You may qualify for up to €${total.toLocaleString("en-IE")}. Ask me anything about your grants.` : `Welcome back ${first}! Ask me anything about your grants.` }
    : { role: "assistant", content: `Hey ${first}! 👋 I'm GrantGuru. The fastest way to find your funding is the 3-minute scan.`, action: FALLBACK.action };

  useEffect(() => {
    if (loading || greeted.current) return;
    greeted.current = true;
    setMsgs([greeting]);
  }, [loading, greeting]);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [msgs, busy]);

  function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    const next = [...msgs, { role: "user" as const, content: question }];
    setMsgs(next); setText(""); setBusy(true);
    const reply = scriptAnswer(question);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setMsgs([...next, { role: "assistant", ...reply }]);
      setBusy(false);
    }, TYPING_MS);
  }

  return (
    <div className="mt-4 rounded-3xl bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Ask GrantGuru 💬</h2>
          <p className="text-sm text-muted-foreground">Questions about grants? Ask away.</p>
        </div>
        {msgs.length > 1 && (
          <button onClick={() => { window.clearTimeout(timer.current); setBusy(false); setMsgs([greeting]); }} className="shrink-0 text-xs font-semibold text-primary hover:underline">
            Clear chat
          </button>
        )}
      </div>

      <div className="mt-3 max-h-64 space-y-3 overflow-y-auto rounded-2xl bg-secondary/60 p-3">
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUESTIONS.map((q) => (
            <button key={q} disabled={busy} onClick={() => send(q)} className="rounded-full border bg-card px-3 py-1.5 text-left text-xs hover:bg-accent disabled:opacity-50">{q}</button>
          ))}
        </div>

        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
            <div className={m.role === "user" ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground" : "max-w-[92%] rounded-2xl rounded-tl-sm bg-card px-3.5 py-2 text-sm shadow-card"}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.action && (
                <Link to={m.action.to} className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground hover:bg-accent/90">
                  {m.action.label} →
                </Link>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            GrantGuru is typing
            <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>
          </div>
        )}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about any grant…" aria-label="Ask GrantGuru" className="h-11 flex-1 rounded-xl border bg-background px-3 text-sm" />
        <button type="submit" disabled={busy || !text.trim()} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button>
      </form>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">Prototype – answers are general info. Always check official sources.</p>
    </div>
  );
}
