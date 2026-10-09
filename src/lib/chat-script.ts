// Prototype chat answers: keyword-matched, general info only. No AI, no backend.

export interface ChatAction { label: string; to: "/onboarding" | "/calendar" }
export interface Reply { content: string; action?: ChatAction }

const SCAN: ChatAction = { label: "Start my scan", to: "/onboarding" };
const CALENDAR: ChatAction = { label: "Open calendar", to: "/calendar" };

export const SAMPLE_QUESTIONS = [
  "What is SUSI?",
  "Can international students get grants?",
  "What's the Student Assistance Fund?",
  "When are the deadlines?",
  "Is my information safe?",
];

const RULES: { keys: string[]; reply: Reply }[] = [
  {
    keys: ["susi"],
    reply: { content: "SUSI is Ireland's main student grant. It can cover your fees and give you money for living costs, based on your household income and how far you live from college. Check susi.ie for full details." },
  },
  {
    keys: ["international", "non-eu", "non eu"],
    reply: { content: "Most state grants aren't open to international students, but there are university merit scholarships and college hardship funds. Your college's international office can help too." },
  },
  {
    keys: ["assistance", "saf", "hardship"],
    reply: { content: "The Student Assistance Fund helps students who are struggling with costs like rent, food, travel or books. You apply through your college's access or financial aid office – you don't need SUSI to apply." },
  },
  {
    keys: ["deadline", "deadlines", "when", "close", "closing", "closed"],
    reply: { content: "Your upcoming deadlines are on your Calendar page, and anything closing within 7 days is flagged in red on your results.", action: CALENDAR },
  },
  {
    keys: ["safe", "data", "privacy", "stored", "personal"],
    reply: { content: "Your optional personal answers are never stored. They're only used during your scan to find extra funding." },
  },
  {
    keys: ["scan", "eligible", "qualify"],
    reply: { content: "Do the scan and I'll match you with grants and scholarships in about 3 minutes.", action: SCAN },
  },
];

export const FALLBACK: Reply = {
  content: "Good question! I'm still learning. For now, try the scan or check the official provider's site.",
  action: SCAN,
};

/** Whole-word, case-insensitive keyword match (so "safe" never matches "saf"). */
function mentions(text: string, key: string) {
  const safe = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${safe}([^a-z0-9]|$)`, "i").test(text);
}

export function scriptAnswer(question: string): Reply {
  const text = question.toLowerCase();
  for (const rule of RULES) if (rule.keys.some((k) => mentions(text, k))) return rule.reply;
  return FALLBACK;
}
