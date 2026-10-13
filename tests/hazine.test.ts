import { describe, expect, it } from "vitest";
import { ESTIMATE_DISCLAIMER } from "@/content/legal";
import {
  FIXED_FEES,
  calculateCourtFee,
  compareAllStages,
  enforcementFee,
  fixedFeeLabel,
  stageFee,
} from "@/lib/hazine/hazine-calc";
import { amountInWords, buildSummary } from "@/lib/hazine/present";

// The reference cases at the end of lib/hazine/hazine-calc.ts.
describe("reference cases", () => {
  it("first instance is tiered: 2.5% up to 200m rials, 3.5% on the excess", () => {
    expect(stageFee(100_000_000, "badvi").fee).toBe(2_500_000);
    expect(stageFee(200_000_000, "badvi").fee).toBe(5_000_000);
    expect(stageFee(1_000_000_000, "badvi").fee).toBe(33_000_000);
  });

  it("appeal and cassation are flat rates", () => {
    expect(stageFee(1_000_000_000, "tajdid").fee).toBe(45_000_000);
    expect(stageFee(1_000_000_000, "farjam").fee).toBe(55_000_000);
  });

  it("enforcement fee is 5%", () => {
    expect(enforcementFee(1_000_000_000)).toBe(50_000_000);
  });

  it("adds the enforcement fee to the total when asked", () => {
    const result = calculateCourtFee(1_000_000_000, "badvi", { includeEnforcement: true });
    expect(result.total).toBe(83_000_000);
    expect(result.lines).toHaveLength(2);
  });
});

describe("calculateCourtFee", () => {
  it("leaves the enforcement fee out by default", () => {
    const result = calculateCourtFee(1_000_000_000, "badvi");
    expect(result.total).toBe(33_000_000);
    expect(result.lines).toHaveLength(1);
  });

  it("explains the tiers only when the amount passes the threshold", () => {
    expect(stageFee(100_000_000, "badvi").lines[0].detail).toBeUndefined();
    expect(stageFee(1_000_000_000, "badvi").lines[0].detail).toContain("۵٬۰۰۰٬۰۰۰");
  });

  it("rejects a non-positive amount", () => {
    expect(() => calculateCourtFee(0, "badvi")).toThrow(RangeError);
  });
});

describe("compareAllStages", () => {
  it("lists the three stages and the enforcement fee", () => {
    const rows = compareAllStages(1_000_000_000);
    expect(rows.map((row) => row.fee)).toEqual([
      33_000_000, 45_000_000, 55_000_000, 50_000_000,
    ]);
  });
});

describe("presentation", () => {
  it("labels a fixed fee as an amount or a range", () => {
    const byId = (id: string) => FIXED_FEES.find((fee) => fee.id === id)!;
    expect(fixedFeeLabel(byId("crim-complaint"))).toBe("۱۰۰٬۰۰۰");
    expect(fixedFeeLabel(byId("non-financial"))).toBe("۴۰۰٬۰۰۰ تا ۱٬۸۰۰٬۰۰۰");
  });

  it("writes an amount in words with its toman equivalent", () => {
    expect(amountInWords(1_000_000_000)).toBe("یک میلیارد ریال، معادل ۱۰۰٬۰۰۰٬۰۰۰ تومان");
  });

  it("puts the tariff year, every line and the disclaimer in the copied summary", () => {
    const summary = buildSummary(
      calculateCourtFee(1_000_000_000, "badvi", { includeEnforcement: true }),
    );
    expect(summary).toContain("تعرفه سال ۱۴۰۵");
    expect(summary).toContain("ارزش خواسته: ۱٬۰۰۰٬۰۰۰٬۰۰۰ ریال");
    expect(summary).toContain("۳۳٬۰۰۰٬۰۰۰ ریال");
    expect(summary).toContain("۵۰٬۰۰۰٬۰۰۰ ریال");
    expect(summary).toContain("جمع کل: ۸۳٬۰۰۰٬۰۰۰ ریال (هشتاد و سه میلیون ریال)");
    expect(summary).toContain(ESTIMATE_DISCLAIMER);
    expect(summary).not.toMatch(/[0-9]/);
  });
});
