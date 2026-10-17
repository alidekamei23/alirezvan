import { describe, expect, it } from "vitest";
import { ESTIMATE_DISCLAIMER } from "@/content/legal";
import {
  calculateExpertFee,
  supportsGps,
  supportsMultiple,
  tiered,
} from "@/lib/karshenasi/karshenasi-calc";
import { ARZYABI, CATEGORIES, ITEMS } from "@/lib/karshenasi/karshenasi-tariff";
import { buildSummary, faText, tierRows } from "@/lib/karshenasi/present";

const fee = (input: Parameters<typeof calculateExpertFee>[0]) => {
  const result = calculateExpertFee(input);
  if (!result.ok) throw new Error(result.error);
  return result;
};

// The reference cases at the end of lib/karshenasi/karshenasi-calc.ts.
describe("reference cases", () => {
  it("Article 11 valuation tiers", () => {
    expect(tiered(400_000_000, ARZYABI)).toBe(20_000_000);
    expect(tiered(1_000_000_000, ARZYABI)).toBe(22_250_000);
    expect(tiered(10_000_000_000, ARZYABI)).toBe(48_250_000);
  });

  it("same-field panel takes 30% off each expert's fee", () => {
    expect(fee({ itemId: 1, value: 1e9, samefieldPanel: true }).fee).toBe(15_575_000);
  });

  it("adds two days of out-of-province mission to the total", () => {
    expect(
      fee({ itemId: 1, value: 1e9, missionDays: 2, missionLocation: "outOfProvince" }).total,
    ).toBe(52_250_000);
  });

  it("caps the combined vehicle check at 30m rials", () => {
    expect(fee({ itemId: 36 }).fee).toBe(30_000_000);
  });

  it("Article 38: 20m plus 3m for each extra 1000 m²", () => {
    const item = ITEMS.find((x) => x.id === 54)!;
    expect(tiered(3_000, item.settings!)).toBe(26_000_000);
  });

  it("applies the item coefficient (audit ×1.5)", () => {
    expect(fee({ itemId: 23, value: 1e9 }).fee).toBe(33_375_000);
  });

  it("rent: 20m plus 25% of the excess over 100m", () => {
    expect(fee({ itemId: 98, value: 3e8 }).fee).toBe(70_000_000);
  });

  it("stops at the Article 11 cap", () => {
    expect(fee({ itemId: 1, value: 1e15 }).fee).toBe(1_350_000_000);
  });

  it("several valuations: one parcel and person adds the values", () => {
    expect(fee({ itemId: 1, values: [5e8, 5e8], sameParcelAndPerson: true }).fee).toBe(22_250_000);
  });

  it("several valuations: separate parcels or persons are counted separately", () => {
    expect(fee({ itemId: 1, values: [5e8, 5e8] }).fee).toBe(40_000_000);
  });

  it("counts at most five extra valuations after the first", () => {
    expect(fee({ itemId: 1, values: Array(8).fill(1e8) }).fee).toBe(120_000_000);
  });

  it("financial incapacity halves the fee", () => {
    expect(fee({ itemId: 1, value: 1e10, incapacity: true }).fee).toBe(24_125_000);
  });

  it("financial incapacity never goes below the minimum", () => {
    expect(fee({ itemId: 1, value: 1e8, incapacity: true }).fee).toBe(20_000_000);
  });

  it("GPS points are paid up to 50", () => {
    expect(
      fee({ itemId: 58, value: 2000, gps: { points: 60, device: "multiFrequency" } }).gps,
    ).toBe(175_000_000);
  });
});

describe("tariff data", () => {
  it("has all 101 subjects in 14 groups", () => {
    expect(ITEMS).toHaveLength(101);
    expect(CATEGORIES).toHaveLength(14);
    expect(new Set(ITEMS.map((item) => item.id)).size).toBe(101);
    expect(ITEMS.every((item) => item.category >= 0 && item.category < CATEGORIES.length)).toBe(
      true,
    );
  });

  it("only valuations take several items; only survey articles take GPS", () => {
    expect(supportsMultiple(ITEMS.find((x) => x.id === 1)!)).toBe(true);
    expect(supportsMultiple(ITEMS.find((x) => x.id === 47)!)).toBe(false);
    expect(supportsGps(ITEMS.find((x) => x.id === 58)!)).toBe(true);
    expect(supportsGps(ITEMS.find((x) => x.id === 1)!)).toBe(false);
  });
});

describe("edge cases", () => {
  it("range subjects return the text, never a number", () => {
    const result = fee({ itemId: 13 });
    expect(result.fee).toBeNull();
    expect(result.total).toBeNull();
    expect(result.rangeText).toBeTruthy();
  });

  it("rejects a negative or fractional number of mission days", () => {
    expect(calculateExpertFee({ itemId: 3, missionDays: -1 }).ok).toBe(false);
    expect(calculateExpertFee({ itemId: 3, missionDays: 1.5 }).ok).toBe(false);
  });

  it("rejects GPS on a subject that does not take it", () => {
    expect(calculateExpertFee({ itemId: 1, value: 1e9, gps: { points: 3, device: "handheld" } }).ok).toBe(
      false,
    );
  });
});

describe("presentation", () => {
  it("builds the valuation table from the tariff, with Persian percentages", () => {
    const rows = tierRows();
    expect(rows).toHaveLength(ARZYABI.tiers.length);
    expect(rows[0].rate).toBe("مقطوع ۲۰٬۰۰۰٬۰۰۰ ریال");
    expect(rows[1].rate).toBe("۰٫۴۵٪ مازاد");
    expect(rows.at(-1)!.to).toBe("—");
  });

  it("writes Persian digits and decimal separators", () => {
    expect(faText("ضریب موضوع ×1.5")).toBe("ضریب موضوع ×۱٫۵");
  });

  it("the copied summary carries subject, article, steps, total and the disclaimer", () => {
    const result = fee({ itemId: 1, value: 1e9, missionDays: 2, missionLocation: "outOfProvince" });
    const summary = buildSummary(result, { values: [1e9], missionDays: 2, missionLocation: "outOfProvince" });
    expect(summary).toContain("ارزیابی کلیه رشته ها");
    expect(summary).toContain("ماده ۱۱");
    expect(summary).toContain("۵۲٬۲۵۰٬۰۰۰ ریال");
    expect(summary).toContain(ESTIMATE_DISCLAIMER);
  });
});
