import { describe, expect, it } from "vitest";
import {
  daysInJalaliMonth,
  formatJalali,
  jalaliToGregorianISO,
  parseJalali,
  toJalaliString,
  todayJalali,
} from "@/lib/jalali";

describe("daysInJalaliMonth", () => {
  it("gives 31 days to the first six months and 30 to the next five", () => {
    expect(daysInJalaliMonth(1405, 1)).toBe(31);
    expect(daysInJalaliMonth(1405, 6)).toBe(31);
    expect(daysInJalaliMonth(1405, 7)).toBe(30);
    expect(daysInJalaliMonth(1405, 11)).toBe(30);
  });

  it("handles Esfand in leap and common years", () => {
    expect(daysInJalaliMonth(1403, 12)).toBe(30);
    expect(daysInJalaliMonth(1404, 12)).toBe(29);
  });
});

describe("parseJalali", () => {
  it("parses a valid date", () => {
    expect(parseJalali("1405-07-19")).toEqual({ year: 1405, month: 7, day: 19 });
  });

  it("rejects impossible dates and other formats", () => {
    expect(parseJalali("1404-12-30")).toBeNull();
    expect(parseJalali("1405-07-31")).toBeNull();
    expect(parseJalali("1405-13-01")).toBeNull();
    expect(parseJalali("1405/07/19")).toBeNull();
    expect(parseJalali("۱۴۰۵-۰۷-۱۹")).toBeNull();
  });
});

describe("toJalaliString", () => {
  it("pads month and day", () => {
    expect(toJalaliString({ year: 1405, month: 1, day: 5 })).toBe("1405-01-05");
  });
});

describe("formatJalali", () => {
  it("writes the month name and Persian digits", () => {
    expect(formatJalali("1405-07-19")).toBe("۱۹ مهر ۱۴۰۵");
  });

  it("returns invalid input unchanged", () => {
    expect(formatJalali("not-a-date")).toBe("not-a-date");
  });
});

describe("jalaliToGregorianISO", () => {
  it("converts known dates", () => {
    expect(jalaliToGregorianISO("1405-01-01")).toBe("2026-03-21");
    expect(jalaliToGregorianISO("1405-08-09")).toBe("2026-10-31");
  });
});

describe("todayJalali", () => {
  it("uses the Tehran calendar day", () => {
    // 2026-10-31 20:30 UTC is already 1 November (10 Aban) in Tehran (UTC+3:30).
    expect(todayJalali(new Date("2026-10-31T20:30:00Z"))).toEqual({
      year: 1405,
      month: 8,
      day: 10,
    });
    expect(todayJalali(new Date("2026-10-31T08:00:00Z"))).toEqual({
      year: 1405,
      month: 8,
      day: 9,
    });
  });
});
