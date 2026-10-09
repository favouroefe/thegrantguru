import { describe, expect, it } from "vitest";
import { FALLBACK, SAMPLE_QUESTIONS, scriptAnswer } from "@/lib/chat-script";

describe("Ask GrantGuru scripted answers", () => {
  it("explains SUSI and points at susi.ie", () => {
    const r = scriptAnswer("What is SUSI?");
    expect(r.content).toContain("Ireland's main student grant");
    expect(r.content).toContain("susi.ie");
    expect(r.action).toBeUndefined();
  });

  it("routes international and non-EU questions to scholarships + the international office", () => {
    expect(scriptAnswer("Can international students get grants?").content).toContain("international office");
    expect(scriptAnswer("I'm non-EU, what can I apply for?").content).toContain("university merit scholarships");
  });

  it("answers SAF / hardship questions and says SUSI isn't needed", () => {
    const r = scriptAnswer("What's the Student Assistance Fund?");
    expect(r.content).toContain("access or financial aid office");
    expect(r.content).toContain("you don't need SUSI to apply");
  });

  it("sends deadline questions to the calendar", () => {
    const r = scriptAnswer("When are the deadlines?");
    expect(r.content).toContain("Calendar page");
    expect(r.action).toEqual({ label: "Open calendar", to: "/calendar" });
  });

  it("treats 'Is my information safe?' as privacy, not the Student Assistance Fund", () => {
    const r = scriptAnswer("Is my information safe?");
    expect(r.content).toContain("never stored");
    expect(r.action).toBeUndefined();
  });

  it("sends scan / eligibility questions to onboarding", () => {
    expect(scriptAnswer("Am I eligible?").action).toEqual({ label: "Start my scan", to: "/onboarding" });
    expect(scriptAnswer("How does the scan work?").action?.to).toBe("/onboarding");
  });

  it("falls back for anything else", () => {
    const r = scriptAnswer("Do you like pizza?");
    expect(r.content).toBe(FALLBACK.content);
    expect(r.action?.to).toBe("/onboarding");
  });

  it("matches case-insensitively", () => {
    expect(scriptAnswer("SUSI").content).toContain("susi.ie");
  });

  it("offers the five sample questions", () => {
    expect(SAMPLE_QUESTIONS).toHaveLength(5);
    expect(SAMPLE_QUESTIONS[0]).toBe("What is SUSI?");
  });
});
