import type { Answers } from "./options";
import { INCOME_BANDS } from "./options";

export interface RuleGrant {
  id: string;
  amount_max_eur: number;
  criteria: Record<string, unknown>;
}

const BAND_UPPER = [28600, 45000, 62000, 120000, Number.POSITIVE_INFINITY];

export function bandUpper(band?: string) {
  const i = band ? INCOME_BANDS.indexOf(band) : -1;
  return i < 0 ? null : BAND_UPPER[i]!;
}

const asList = (v: unknown) => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? [v] : null);

/** Client-side check of one grant's criteria against answers. Missing answers are treated as passing. */
export function isLikely(g: RuleGrant, a: Answers): boolean {
  const c = g.criteria;
  const situation = a.situation ?? [];
  const fee = asList(c["fee_status"]);
  if (fee && a.fee_status && !fee.includes(a.fee_status)) return false;
  if (fee && !a.fee_status) return false;
  const level = asList(c["level"]);
  if (level && a.level && !level.includes(a.level)) return false;
  const study = asList(c["study"]);
  if (study && a.study && !study.includes(a.study)) return false;
  if (typeof c["residency_years_min"] === "number" && a.residency_years && Number(a.residency_years) < (c["residency_years_min"] as number)) return false;
  const upper = bandUpper(a.income_band);
  if (typeof c["income_max_eur"] === "number" && upper !== null && upper > (c["income_max_eur"] as number)) return false;
  if (c["first_time"] === true && a.first_time !== "yes") return false;
  if (c["disability"] === true && !situation.includes("disability")) return false;
  if (c["social_welfare"] === true && a.social_welfare !== "yes") return false;
  if (typeof c["age_min"] === "number" && a.age && Number(a.age) < (c["age_min"] as number)) return false;
  const groups = asList(c["target_groups"]);
  if (groups && !groups.some((t) => situation.some((s) => s.toLowerCase().includes(t.toLowerCase())))) return false;
  if (c["need"] === "financial hardship" && (upper === null || upper > 45000)) return false;
  return true;
}

/** Amount for a grant given answers — SUSI maintenance drops to the adjacent rate under 30km. */
export function amountFor(g: RuleGrant, a: Answers) {
  if (g.id === "susi-maintenance" && a.distance_km && Number(a.distance_km) < 30) return 2950;
  return g.amount_max_eur;
}

export function evaluate(grants: RuleGrant[], a: Answers) {
  const likely = grants.filter((g) => isLikely(g, a));
  return { likelyIds: likely.map((g) => g.id), total: likely.reduce((s, g) => s + amountFor(g, a), 0) };
}
