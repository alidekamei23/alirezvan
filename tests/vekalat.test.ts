// Display helpers of the lawyer's-fee calculator. The calculation itself is tested in
// lib/vekalat/vekalat-calc.test.ts (the supplied reference cases).
import { describe, expect, it } from "vitest";
import { calculateVekalat } from "@/lib/vekalat/vekalat-calc";
import {
  buildSummary,
  faText,
  financialRows,
  parseHours,
  rangeText,
  sampleForm,
  toVekalatInput,
  type VekalatForm,
} from "@/lib/vekalat/present";

const run = (form: VekalatForm) => {
  const input = toVekalatInput(form);
  if (!input) throw new Error("no input");
  const result = calculateVekalat(input);
  if (!result.ok) throw new Error(result.error);
  return result;
};

describe("vekalat form → input", () => {
  it("the sample is a one-billion-rial financial claim: 45 + 30 million over two stages", () => {
    const result = run(sampleForm());
    expect(result.fee).toEqual({ min: 75_000_000, max: 75_000_000 });
    expect(result.stages.map((stage) => stage.stamp)).toEqual([2_250_000, 1_500_000]);
  });

  it("waits for an amount before calculating", () => {
    expect(toVekalatInput({ ...sampleForm(), value: null })).toBeNull();
    expect(
      toVekalatInput({ ...sampleForm(), subject: "execution", executionValue: null }),
    ).toBeNull();
    expect(
      toVekalatInput({ ...sampleForm(), subject: "execution", executionItem: "other" }),
    ).toMatchObject({ itemId: "other" });
  });

  it("sends the outcome only for financial and non-financial claims", () => {
    const form = { ...sampleForm(), outcome: "rejectAfter" as const };
    expect(run(form).fee.max).toBe(22_500_000);
    expect(toVekalatInput({ ...form, subject: "criminal" })?.outcome).toBeUndefined();
  });

  it("sends hours only for consultation, read from Persian digits", () => {
    const form: VekalatForm = {
      ...sampleForm(),
      subject: "other",
      items: { ...sampleForm().items, other: "consult" },
      hours: "۲٫۵",
    };
    expect(toVekalatInput(form)?.hours).toBe(2.5);
    expect(run(form).fee).toEqual({ min: 1_250_000, max: 12_500_000 });
    expect(parseHours("")).toBe(1);
    expect(parseHours("abc")).toBeNaN();
  });
});

describe("vekalat display", () => {
  it("converts digits and separators written by the logic", () => {
    expect(faText("5,000,000 تا 200,000,000 ریال × 2 ساعت")).toBe(
      "۵٬۰۰۰٬۰۰۰ تا ۲۰۰٬۰۰۰٬۰۰۰ ریال × ۲ ساعت",
    );
    expect(faText("1.5")).toBe("۱٫۵");
  });

  it("writes a range as «min تا max»", () => {
    expect(rangeText({ min: 5_000_000, max: 200_000_000 })).toBe(
      "۵٬۰۰۰٬۰۰۰ تا ۲۰۰٬۰۰۰٬۰۰۰ ریال",
    );
    expect(rangeText({ min: 7, max: 7 })).toBe("۷ ریال");
  });

  it("builds the Article 9 table from the tariff", () => {
    const rows = financialRows();
    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual({ from: "۰", to: "۵۰۰٬۰۰۰٬۰۰۰", rate: "۸٪ مازاد" });
    expect(rows[4].to).toBe("—");
  });

  it("the copied summary has the fee, the stages, the stamp and the disclaimer", () => {
    const form = sampleForm();
    const text = buildSummary(run(form), form);
    expect(text).toContain("حق‌الوکاله طبق تعرفه: ۷۵٬۰۰۰٬۰۰۰ ریال");
    expect(text).toContain("مرحله نخستین");
    expect(text).toContain("جمع تمبر: ۳٬۷۵۰٬۰۰۰ ریال");
    expect(text).toContain("این نتیجه تخمینی است و مشاوره حقوقی محسوب نمی‌شود.");
    expect(text).not.toMatch(/[0-9]/);
  });
});
