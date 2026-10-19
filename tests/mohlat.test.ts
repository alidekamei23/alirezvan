// Display helpers of the legal-deadline calculator. The calendar and the deadline rules
// are tested in lib/mohlat/mohlat-calc.test.ts (the supplied reference cases).
import { describe, expect, it } from "vitest";
import { calculateMohlat, type JDate } from "@/lib/mohlat/mohlat-calc";
import {
  buildSummary,
  initialForm,
  monthGrid,
  parseCustomDays,
  parseExtraHolidays,
  remainingPill,
  shiftMonth,
  tehranToday,
  toMohlatInput,
  type MohlatForm,
} from "@/lib/mohlat/present";

const MEHR_1: JDate = { y: 1405, m: 7, d: 1 };

const run = (form: MohlatForm, start: JDate, today: JDate | null = null) => {
  const result = calculateMohlat(toMohlatInput(form, start, today));
  if (!result.ok) throw new Error(result.error);
  return result;
};

describe("mohlat form → input", () => {
  it("opens on civil appeal: from 1 Mehr 1405 to 22 Mehr", () => {
    const result = run(initialForm(), MEHR_1);
    expect(result.title).toBe("تجدیدنظرخواهی");
    expect(result.end).toEqual({ y: 1405, m: 7, d: 22 });
  });

  it("sends strict445 = false only when «حذف روز اقدام برای همه» is ticked", () => {
    expect(toMohlatInput(initialForm(), MEHR_1, null).strict445).toBe(true);
    expect(toMohlatInput({ ...initialForm(), skipActionAlways: true }, MEHR_1, null).strict445).toBe(false);
  });

  it("sends custom days, mode and notice only for a custom deadline", () => {
    const form: MohlatForm = { ...initialForm(), law: "custom", customDays: "۲۰", customMode: "earliest" };
    const input = toMohlatInput(form, MEHR_1, null);
    expect(input).toMatchObject({ itemId: "custom", customDays: 20, customMode: "earliest", customFromNotice: true });
    expect(input.abroad).toBeUndefined();
    expect(run(form, MEHR_1).end).toEqual({ y: 1405, m: 7, d: 22 });
  });

  it("reads extra holidays in Persian digits and reports the rest", () => {
    expect(parseExtraHolidays("۱۴۰۵/۷/۲۲، 1405/08/01  ۱۴۰۵/۰۷/۳۱ abc")).toEqual({
      dates: ["1405/07/22", "1405/08/01"],
      invalid: ["۱۴۰۵/۰۷/۳۱", "abc"],
    });
    const form = { ...initialForm(), extraHolidays: "۱۴۰۵/۰۷/۲۲" };
    expect(run(form, MEHR_1).end).toEqual({ y: 1405, m: 7, d: 23 });
  });

  it("accepts only whole positive day counts", () => {
    expect(parseCustomDays("۳۰")).toBe(30);
    expect(parseCustomDays("2.5")).toBeNull();
    expect(parseCustomDays("")).toBeNull();
  });
});

describe("mohlat display", () => {
  it("words the remaining days for a deadline and for a minimum gap", () => {
    expect(remainingPill(10, "deadline")).toEqual({ text: "۱۰ روز مانده", tone: "neutral" });
    expect(remainingPill(2, "deadline")?.tone).toBe("warning");
    expect(remainingPill(0, "deadline")?.text).toBe("امروز آخرین روز است");
    expect(remainingPill(-3, "deadline")).toEqual({ text: "مهلت ۳ روز پیش تمام شده", tone: "danger" });
    expect(remainingPill(0, "earliest")?.text).toBe("از امروز مجاز است");
    expect(remainingPill(null, "deadline")).toBeNull();
  });

  it("lays Mehr 1405 out from Saturday, marking start, end, range and Fridays", () => {
    const weeks = monthGrid(1405, 7, {
      start: MEHR_1,
      end: { y: 1405, m: 7, d: 22 },
      today: { y: 1405, m: 7, d: 5 },
      thursdayOff: false,
      extraHolidays: [],
    });
    const days = weeks.flat();
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    // 1 Mehr 1405 is a Wednesday: four empty cells before it.
    expect(days.slice(0, 5).map((day) => day?.date.d ?? null)).toEqual([null, null, null, null, 1]);
    const day = (d: number) => days.find((cell) => cell?.date.d === d)!;
    expect(day(1).isStart).toBe(true);
    expect(day(22).isEnd).toBe(true);
    expect(day(10).inRange).toBe(true);
    expect(day(5).isToday).toBe(true);
    expect(day(3).holiday).toBe("جمعه");
  });

  it("moves between months across the year end", () => {
    expect(shiftMonth(1405, 12, 1)).toEqual({ y: 1406, m: 1 });
    expect(shiftMonth(1405, 1, -1)).toEqual({ y: 1404, m: 12 });
  });

  it("takes today from the Tehran calendar", () => {
    // 13 Nov 2026, 22:00 UTC is already 14 Nov (23 Aban) in Tehran.
    expect(tehranToday(new Date(Date.UTC(2026, 10, 13, 22, 0)))).toEqual({ y: 1405, m: 8, d: 23 });
  });

  it("the copied summary has the deadline, article, dates, steps and the disclaimer", () => {
    const form = initialForm();
    const text = buildSummary(run(form, MEHR_1), form, MEHR_1, "مبدأ: تاریخ ابلاغ");
    expect(text).toContain("مهلت: تجدیدنظرخواهی");
    expect(text).toContain("ماده: ماده ۳۳۶");
    expect(text).toContain("مبدأ: تاریخ ابلاغ: چهارشنبه ۱ مهر ۱۴۰۵");
    expect(text).toContain("چهارشنبه ۲۲ مهر ۱۴۰۵");
    expect(text).toContain("۱. مبدأ:");
    expect(text).toContain("این نتیجه تخمینی است و مشاوره حقوقی محسوب نمی‌شود.");
    expect(text).not.toMatch(/[0-9]/);
  });
});

describe("custom deadline title", () => {
  it("is shown with Persian digits", () => {
    const form: MohlatForm = { ...initialForm(), law: "custom", customDays: "20" };
    const text = buildSummary(run(form, MEHR_1), form, MEHR_1, "مبدأ مهلت");
    expect(text).toContain("مهلت: مهلت ۲۰ روزه");
    expect(text).not.toMatch(/[0-9]/);
  });
});
