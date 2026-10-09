import { describe, expect, it } from "vitest";
import { evaluate, isLikely, amountFor } from "@/lib/whatif";

const susi = { id: "susi-maintenance", amount_max_eur: 7336, criteria: { study: "full-time", fee_status: ["EU"], income_max_eur: 62000 } };
const bursary = { id: "bursary-1916", amount_max_eur: 5000, criteria: { first_time: true, income_max_eur: 28600, target_groups: ["carer", "lone or teen parent"] } };
const fsd = { id: "fsd", amount_max_eur: 2000, criteria: { disability: true } };
const base = { fee_status: "EU", study: "full-time", income_band: "under €28.6k", first_time: "yes", distance_km: "75", situation: [] as string[] };

describe("what-if rules", () => {
  it("income over €62k removes SUSI maintenance", () => {
    expect(isLikely(susi, { ...base, income_band: "€62k–€120k" })).toBe(false);
    expect(isLikely(susi, { ...base, income_band: "€45k–€62k" })).toBe(true);
  });
  it("under 30km uses the lower SUSI rate", () => {
    expect(amountFor(susi, { ...base, distance_km: "10" })).toBe(2950);
    expect(amountFor(susi, base)).toBe(7336);
  });
  it("1916 bursary needs a priority group like carer", () => {
    expect(isLikely(bursary, base)).toBe(false);
    expect(isLikely(bursary, { ...base, situation: ["carer"] })).toBe(true);
  });
  it("disability toggle unlocks FSD and adds to total", () => {
    expect(evaluate([fsd], base).total).toBe(0);
    expect(evaluate([fsd], { ...base, situation: ["disability"] }).total).toBe(2000);
  });
});
