import { collegeMatches, isStemCourse, pathFor, type Answers, type Situation } from "./options";

export interface Fund {
  id: string; name: string; provider: string;
  category: "Government grant" | "Bursary" | "Scholarship" | "College fund" | "Other support" | string;
  subcategory: string[]; description: string; amount_text: string;
  amount_max_eur: number | null; amount_far_eur: number | null; amount_varies: boolean; deadline: string | null;
  open_to_tags: string[]; requires_tags: string[]; requires_any_tags: string[]; colleges: string[];
  apply_url: string; how_to_apply_steps: string[]; documents_needed: string[]; verified: boolean;
}

export type Label = "Likely" | "Possible" | "Check eligibility";
export interface Match { fund: Fund; label: Label; amount: number | null; counted: boolean; why: string; note?: string }

type Tri = "yes" | "no" | "unsure";

const IDENTITY_TAG: Record<string, string> = { irish: "Irish", uk: "UK", eu: "EU", refugee: "refugee", international: "international", asylum: "asylum" };
const INCOME_IDX: Record<string, number> = { under_28600: 0, "28600_47010": 1, "47010_60000": 2, "60000_120000": 3, over_120000: 4 };

const WHY: Record<string, string> = {
  first_year: "you're a first-year student", income_under_28600: "household income under €28,600", income_under_47010: "household income under €47,010",
  income_under_120000: "household income under €120,000", distance_30km: "home is 30km+ from college", mature: "you're 23 or older",
  carer: "you're a carer", lone_parent: "you're a lone parent", disability: "you have a disability", neurodivergent: "you're neurodivergent",
  care_experienced: "you're care-experienced", traveller_roma: "Traveller or Roma community", welfare: "you get a welfare payment",
  fe_entrant: "you came through PLC / FE", sport: "your sport", academic: "your academic results", stem: "you're into STEM",
  arts: "your creative talents", irish_language: "your Irish", volunteering: "your community work", woman: "women in STEM",
  full_time: "you study full-time", residency: "you meet the residency rule", first_time: "it's your first time in college", refugee: "you have protection status",
};

/** Is a single tag met? */
export function tagStatus(tag: string, a: Answers, s: Situation): Tri {
  const has = (v: string) => s.items.includes(v);
  const talents = a.talents ?? [];
  const inc = a.income ? INCOME_IDX[a.income] : undefined;
  const incomeUnder = (maxIdx: number): Tri => (a.income === "not_sure" || inc === undefined ? "unsure" : inc <= maxIdx ? "yes" : "no");
  const yn = (v?: string): Tri => (v === "yes" ? "yes" : v === "no" ? "no" : "unsure");
  switch (tag) {
    case "first_year": return a.year === "1" && a.first_time === "yes" ? "yes" : a.year && a.first_time ? "no" : "unsure";
    case "first_time": return yn(a.first_time);
    case "full_time": return a.study === "full-time" ? "yes" : a.study ? "no" : "unsure";
    case "residency": return a.residency === "yes" ? "yes" : a.residency === "no" ? "no" : "unsure";
    case "income_under_28600": return incomeUnder(0);
    case "income_under_47010": return incomeUnder(1);
    case "income_under_120000": return incomeUnder(3);
    case "distance_30km": return yn(a.distance_30);
    case "mature": return a.over23 === "yes" || has("mature") ? "yes" : "no";
    case "refugee": return a.identity === "refugee" ? "yes" : "no";
    case "stem": return talents.includes("stem") || isStemCourse(a.course) ? "yes" : "no";
    case "woman": return s.gender === "woman" ? "yes" : "no";
    case "sport": case "academic": case "arts": case "irish_language": case "volunteering": return talents.includes(tag) ? "yes" : "no";
    default: return has(tag) ? "yes" : "no"; // Part 5 situation tags
  }
}

function fundAmount(f: Fund, a: Answers): number | null {
  if (f.amount_varies || f.amount_max_eur == null) return null;
  if (f.amount_far_eur != null && a.distance_30 === "yes") return f.amount_far_eur;
  return f.amount_max_eur;
}

export function matchFunds(funds: Fund[], a: Answers, s: Situation): Match[] {
  const pnts = a.identity === "pnts" || !a.identity;
  const idTag = a.identity ? IDENTITY_TAG[a.identity] : undefined;
  let out: Match[] = [];

  for (const f of funds) {
    if (!f.colleges.includes("all") && !f.colleges.some((c) => collegeMatches(c, a.college))) continue;
    if (pnts) {
      out.push({ fund: f, label: "Check eligibility", amount: fundAmount(f, a), counted: false, why: "Check the rules — we don't know your status." });
      continue;
    }
    if (!idTag || !f.open_to_tags.includes(idTag)) continue;
    const statuses = f.requires_tags.map((t) => [t, tagStatus(t, a, s)] as const);
    if (statuses.some(([, v]) => v === "no")) continue;
    let anyMet: string | null = null;
    if (f.requires_any_tags.length) {
      anyMet = f.requires_any_tags.find((t) => tagStatus(t, a, s) === "yes") ?? null;
      if (!anyMet) continue;
    }
    const unsure = statuses.some(([, v]) => v === "unsure");
    const amount = fundAmount(f, a);
    const label: Label = unsure || amount === null ? "Possible" : "Likely";
    const reasons = [...statuses.filter(([, v]) => v === "yes").map(([t]) => WHY[t] ?? t), ...(anyMet ? [WHY[anyMet] ?? anyMet] : [])];
    if (f.amount_far_eur != null && a.distance_30 === "yes") reasons.push(WHY["distance_30km"]!);
    const why = reasons.length ? cap(reasons.slice(0, 3).join(" · ")) : f.open_to_tags.length > 4 ? "Open to most students." : "You fit who this is for.";
    out.push({ fund: f, label, amount, counted: label === "Likely", why });
  }

  // Only ONE SUSI maintenance option: the special rate wins when it matches.
  if (out.some((m) => m.fund.id === "susi-maint-special")) out = out.filter((m) => m.fund.id !== "susi-maint-standard");
  // 1916 tiers: one form, your college gives one tier — count only Tier 1.
  const t2 = out.find((m) => m.fund.id === "bursary-1916-t2");
  if (t2 && out.some((m) => m.fund.id === "bursary-1916-t1")) { t2.counted = false; t2.note = "Same form as Tier 1 — you'd get one tier, so we've counted Tier 1."; }
  // BTEA and SUSI maintenance can't both count.
  const btea = out.find((m) => m.fund.id === "btea" && m.counted);
  const susi = out.find((m) => m.fund.id.startsWith("susi-maint") && m.counted);
  if (btea && susi) {
    const [small] = (btea.amount ?? 0) >= (susi.amount ?? 0) ? [susi] : [btea];
    small.counted = false;
    const note = "You can't get both – we've counted the bigger one.";
    btea.note = note; susi.note = note;
  }
  return out;
}

export const totalOf = (ms: Match[]) => ms.reduce((t, m) => t + (m.counted ? m.amount ?? 0 : 0), 0);
export const isPathB = (a: Answers) => pathFor(a.identity) === "B";
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const TAB_OF: Record<string, "Grants" | "Scholarships" | "Other support"> = {
  "Government grant": "Grants", Bursary: "Grants", Scholarship: "Scholarships", "College fund": "Other support", "Other support": "Other support",
};
