import { describe, expect, it } from "vitest";
import { matchFunds, totalOf, type Fund } from "@/lib/matching";
import type { Answers, Situation } from "@/lib/options";

const base: Omit<Fund, "id" | "name"> = {
  provider: "x", category: "Government grant", subcategory: [], description: "", amount_text: "", amount_max_eur: null, amount_far_eur: null,
  amount_varies: false, deadline: null, open_to_tags: ["Irish", "UK", "EU", "refugee"], requires_tags: [], requires_any_tags: [], colleges: ["all"],
  apply_url: "", how_to_apply_steps: [], documents_needed: [], verified: true,
};
const f = (id: string, o: Partial<Fund>): Fund => ({ ...base, id, name: id, ...o });
const FUNDS = [
  f("susi-maint-special", { amount_max_eur: 3176, amount_far_eur: 7936, requires_tags: ["full_time", "residency", "income_under_28600"] }),
  f("susi-maint-standard", { amount_max_eur: 1774, amount_far_eur: 4722, requires_tags: ["full_time", "residency", "income_under_47010"] }),
  f("bursary-1916-t1", { category: "Bursary", amount_max_eur: 5000, requires_tags: ["first_year", "income_under_28600"], requires_any_tags: ["carer", "lone_parent"] }),
  f("btea", { amount_max_eur: 12688, requires_tags: ["welfare"] }),
  f("saf", { amount_varies: true, open_to_tags: ["Irish", "UK", "EU", "refugee", "asylum"] }),
  f("intl-merit", { category: "Scholarship", amount_varies: true, open_to_tags: ["international"] }),
  f("women-stem", { category: "Scholarship", amount_varies: true, open_to_tags: ["Irish", "international"], requires_tags: ["woman", "stem"] }),
];
const A: Answers = { identity: "irish", residency: "yes", study: "full-time", year: "1", first_time: "yes", income: "under_28600", distance_30: "yes" };
const S: Situation = { items: [] };
const ids = (a: Answers, s = S) => matchFunds(FUNDS, a, s).map((m) => m.fund.id);

describe("matching rules", () => {
  it("30km+ uses the higher SUSI rate and shows only one SUSI maintenance", () => {
    const ms = matchFunds(FUNDS, A, S);
    expect(ms.filter((m) => m.fund.id.startsWith("susi-maint")).map((m) => m.fund.id)).toEqual(["susi-maint-special"]);
    expect(ms.find((m) => m.fund.id === "susi-maint-special")!.amount).toBe(7936);
  });
  it("income €28,600–€47,010 gets the standard SUSI only", () => {
    expect(ids({ ...A, income: "28600_47010" }).filter((i) => i.startsWith("susi"))).toEqual(["susi-maint-standard"]);
  });
  it("1916 Bursary is for first-year, first-time students with a priority group", () => {
    expect(ids(A)).not.toContain("bursary-1916-t1");
    expect(ids(A, { items: ["carer"] })).toContain("bursary-1916-t1");
    expect(ids({ ...A, year: "2" }, { items: ["carer"] })).not.toContain("bursary-1916-t1");
  });
  it("BTEA and SUSI maintenance can't both count — the bigger one is counted", () => {
    const ms = matchFunds(FUNDS, A, { items: ["welfare"] });
    expect(totalOf(ms)).toBe(12688);
    expect(ms.find((m) => m.fund.id === "btea")!.note).toMatch(/can't get both/);
  });
  it("amount varies is Possible and not added to the total", () => {
    const saf = matchFunds(FUNDS, A, S).find((m) => m.fund.id === "saf")!;
    expect(saf.label).toBe("Possible");
    expect(saf.counted).toBe(false);
  });
  it("'Not sure' answers make a fund Possible", () => {
    expect(matchFunds(FUNDS, { ...A, income: "not_sure" }, S).find((m) => m.fund.id === "susi-maint-special")!.label).toBe("Possible");
  });
  it("international students only see funds open to them", () => {
    expect(ids({ ...A, identity: "international" })).toEqual(["intl-merit"]);
  });
  it("gender only adds women-in-STEM funds", () => {
    const stem: Answers = { ...A, talents: ["stem"] };
    const without = ids(stem);
    const withWoman = ids(stem, { items: [], gender: "woman" });
    expect(without).not.toContain("women-stem");
    expect(withWoman).toEqual([...without, "women-stem"]);
  });
  it("prefer not to say shows every fund as Check eligibility", () => {
    const ms = matchFunds(FUNDS, { identity: "pnts" }, S);
    expect(ms).toHaveLength(FUNDS.length - 1); // still only one SUSI maintenance option
    expect(ms.every((m) => m.label === "Check eligibility")).toBe(true);
  });
});
