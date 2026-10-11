import { describe, expect, it } from "vitest";
import {
  formatNumber,
  formatToman,
  normalizeInput,
  normalizePersian,
  parseNumber,
  toLatinDigits,
  toPersianDigits,
} from "@/lib/format";

describe("toPersianDigits", () => {
  it("converts Latin digits", () => {
    expect(toPersianDigits("0123456789")).toBe("۰۱۲۳۴۵۶۷۸۹");
  });

  it("accepts numbers", () => {
    expect(toPersianDigits(1405)).toBe("۱۴۰۵");
  });

  it("converts Arabic-Indic digits", () => {
    expect(toPersianDigits("٠١٢٣٤٥٦٧٨٩")).toBe("۰۱۲۳۴۵۶۷۸۹");
  });

  it("leaves other characters alone", () => {
    expect(toPersianDigits("ماده 522 - بند 3")).toBe("ماده ۵۲۲ - بند ۳");
  });
});

describe("toLatinDigits", () => {
  it("converts Persian digits", () => {
    expect(toLatinDigits("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
  });

  it("converts Arabic-Indic digits", () => {
    expect(toLatinDigits("٠٩١٢")).toBe("0912");
  });

  it("handles mixed input", () => {
    expect(toLatinDigits("۱2٣")).toBe("123");
  });
});

describe("normalizePersian", () => {
  it("replaces Arabic ي and ك", () => {
    expect(normalizePersian("علي كريمي")).toBe("علی کریمی");
  });

  it("replaces alef maksura", () => {
    expect(normalizePersian("مصطفى")).toBe("مصطفی");
  });

  it("keeps ZWNJ", () => {
    expect(normalizePersian("مي‌شود")).toBe("می‌شود");
  });
});

describe("normalizeInput", () => {
  it("normalises letters and digits and trims", () => {
    expect(normalizeInput("  علي ۱۲۳ ")).toBe("علی 123");
  });
});

describe("parseNumber", () => {
  it("parses Persian digits with Persian separators", () => {
    expect(parseNumber("۱۲٬۵۰۰٬۰۰۰")).toBe(12_500_000);
  });

  it("parses Latin digits with commas and spaces", () => {
    expect(parseNumber(" 12,500,000 ")).toBe(12_500_000);
  });

  it("parses the Persian comma as a separator", () => {
    expect(parseNumber("۱۲،۵۰۰")).toBe(12_500);
  });

  it("returns null for empty or non-numeric input", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("۱۲ تومان")).toBeNull();
    expect(parseNumber("-5")).toBeNull();
    expect(parseNumber("1.5")).toBeNull();
  });
});

describe("formatNumber", () => {
  it("groups thousands with Persian digits", () => {
    expect(formatNumber(12_500_000)).toBe("۱۲٬۵۰۰٬۰۰۰");
  });

  it("does not group short numbers", () => {
    expect(formatNumber(0)).toBe("۰");
    expect(formatNumber(999)).toBe("۹۹۹");
    expect(formatNumber(1000)).toBe("۱٬۰۰۰");
  });

  it("rounds to a whole number", () => {
    expect(formatNumber(1234.6)).toBe("۱٬۲۳۵");
  });

  it("handles negatives", () => {
    expect(formatNumber(-1500)).toBe("-۱٬۵۰۰");
  });
});

describe("formatToman", () => {
  it("appends the unit", () => {
    expect(formatToman(12_500_000)).toBe("۱۲٬۵۰۰٬۰۰۰ تومان");
  });
});
