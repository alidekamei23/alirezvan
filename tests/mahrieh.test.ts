import { describe, expect, it } from "vitest";
import { ESTIMATE_DISCLAIMER } from "@/content/legal";
import {
  ANNUAL_YEARS,
  FIRST_YEAR,
  LAST_YEAR,
  OLDER_ANNUAL_INDEX,
  calculateMahr,
  mahrFactor,
  paymentIndexYear,
} from "@/lib/mahrieh/mahrieh-calc";
import { buildSummary, faText, formatMahrFactor } from "@/lib/mahrieh/present";

// The reference cases at the end of lib/mahrieh/mahrieh-calc.ts.
describe("reference cases", () => {
  it("factor 1395 → 1405 is the 1404 average over the 1395 average", () => {
    expect(mahrFactor(1395, 1405).factor).toBeCloseTo(19.616, 10);
  });

  it("50m rials married in 1395, paid in 1405", () => {
    const result = calculateMahr({ cashAmount: 50_000_000, marriageYear: 1395, paymentYear: 1405 });
    expect(result.ok && result.total).toBe(980_800_000);
  });

  it("factor is 1 when the marriage year is the year before payment or later", () => {
    const a = calculateMahr({ cashAmount: 1_000_000, marriageYear: 1404, paymentYear: 1405 });
    const b = calculateMahr({ cashAmount: 1_000_000, marriageYear: 1405, paymentYear: 1405 });
    expect(a.ok && a.total).toBe(1_000_000);
    expect(b.ok && b.total).toBe(1_000_000);
  });

  it("an earlier partial payment is brought back to the marriage year's value first", () => {
    const result = calculateMahr({
      cashAmount: 50_000_000,
      marriageYear: 1395,
      paymentYear: 1405,
      partialPayments: [{ amount: 43_704_200, year: 1401 }],
    });
    expect(result.ok && result.total).toBe(784_640_000);
  });

  it("flags coins over the 110-coin cap", () => {
    const result = calculateMahr(
      { marriageYear: 1400, paymentYear: 1405, items: [{ kind: "full", quantity: 120, unitPrice: 1 }] },
      1,
    );
    expect(result.ok && result.coinEquivalent?.overCap).toBe(true);
  });
});

describe("edge cases", () => {
  it("rejects a marriage year after the payment year", () => {
    expect(calculateMahr({ cashAmount: 1, marriageYear: 1405, paymentYear: 1404 }).ok).toBe(false);
  });

  it("uses the latest published year when the year before payment has no average", () => {
    expect(paymentIndexYear(1407)).toBe(LAST_YEAR);
    const result = calculateMahr({ cashAmount: 1_000_000, marriageYear: 1395, paymentYear: 1407 });
    expect(result.ok && result.warnings.length).toBe(1);
  });

  it("asks for a price when a coin quantity has none", () => {
    const result = calculateMahr({
      marriageYear: 1400,
      paymentYear: 1405,
      items: [{ kind: "half", quantity: 3, unitPrice: 0 }],
    });
    expect(result.ok).toBe(false);
  });

  it("has no guessed indices before the first year", () => {
    expect(Object.keys(OLDER_ANNUAL_INDEX)).toHaveLength(0);
    expect(FIRST_YEAR).toBe(ANNUAL_YEARS[0]);
  });
});

describe("presentation", () => {
  it("writes numbers with Persian digits and the Persian decimal separator", () => {
    expect(formatMahrFactor(19.616)).toBe("۱۹٫۶۱۶۰");
    expect(faText("ضریب 1.5 (شاخص 1404)")).toBe("ضریب ۱٫۵ (شاخص ۱۴۰۴)");
  });

  it("the copied summary carries years, factor, total and the disclaimer", () => {
    const result = calculateMahr({ cashAmount: 50_000_000, marriageYear: 1395, paymentYear: 1405 });
    if (!result.ok) throw new Error("expected a result");
    const summary = buildSummary(result, { marriageYear: 1395, paymentYear: 1405 });
    expect(summary).toContain("سال عقد: ۱۳۹۵");
    expect(summary).toContain("ضریب: ۱۹٫۶۱۶۰");
    expect(summary).toContain("۹۸۰٬۸۰۰٬۰۰۰ ریال");
    expect(summary).toContain(ESTIMATE_DISCLAIMER);
  });
});
