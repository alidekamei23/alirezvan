import { describe, expect, it } from "vitest";
import { ESTIMATE_DISCLAIMER } from "@/content/legal";
import { buildSummary, formatFactor, formatIndex, periodLabel } from "@/lib/tadieh/present";
import {
  availableMonths,
  calculate,
  latestAvailable,
  parseAmount,
} from "@/lib/tadieh/tadieh-calc";

describe("calculate", () => {
  // The reference case at the end of lib/tadieh/tadieh-calc.ts.
  it("matches the reference case (500m rials, Khordad 1402 → Shahrivar 1405)", () => {
    const result = calculate(
      [{ principal: 500_000_000, due: { year: 1402, month: 2 } }],
      { year: 1405, month: 5 },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.paymentIndex).toBe(3452.1);
    expect(result.rows[0].dueIndex).toBe(885.8);
    expect(result.rows[0].damage).toBe(1_448_577_557);
    expect(result.totalDamage).toBe(1_448_577_557);
    expect(result.grandTotal).toBe(1_948_577_557);
    expect(result.warnings).toEqual([]);
  });

  it("falls back to the latest published month and warns", () => {
    const result = calculate(
      [{ principal: 500_000_000, due: { year: 1402, month: 2 } }],
      { year: 1405, month: 11 },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payment).toEqual(latestAvailable());
    expect(result.warnings).toHaveLength(1);
  });

  it("returns an error for an empty or zero principal", () => {
    const due = { year: 1402, month: 2 };
    expect(calculate([{ principal: NaN, due }], latestAvailable()).ok).toBe(false);
    expect(calculate([{ principal: 0, due }], latestAvailable()).ok).toBe(false);
  });
});

describe("inputs", () => {
  it("parses Persian digits with thousands separators", () => {
    expect(parseAmount("۵۰۰٬۰۰۰٬۰۰۰")).toBe(500_000_000);
  });

  it("offers only months that have an index", () => {
    const latest = latestAvailable();
    expect(availableMonths(latest.year).at(-1)).toBe(latest.month);
    expect(availableMonths(1402)).toHaveLength(12);
  });
});

describe("presentation", () => {
  it("formats indices, factors and periods with Persian digits", () => {
    expect(formatIndex(3452.1)).toBe("۳۴۵۲٫۱");
    expect(formatFactor(3452.1 / 885.8)).toBe("۳٫۸۹۷");
    expect(periodLabel({ year: 1402, month: 2 }, "monthly")).toBe("خرداد ۱۴۰۲");
    expect(periodLabel({ year: 1402, month: 2 }, "annual")).toBe("سال ۱۴۰۲");
  });

  it("puts the indices, the basis and the disclaimer in the copied summary", () => {
    const result = calculate(
      [{ principal: 500_000_000, due: { year: 1402, month: 2 } }],
      { year: 1405, month: 5 },
    );
    if (!result.ok) throw new Error(result.error);
    const summary = buildSummary(result);
    expect(summary).toContain("ملاک: شاخص ماهانه");
    expect(summary).toContain("شاخص ۳۴۵۲٫۱");
    expect(summary).toContain("شاخص ۸۸۵٫۸");
    expect(summary).toContain("۱٬۴۴۸٬۵۷۷٬۵۵۷ ریال");
    expect(summary).toContain(ESTIMATE_DISCLAIMER);
    expect(summary).not.toMatch(/[0-9]/);
  });
});
