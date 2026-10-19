/** تست‌های مرجع مهلت‌ها — با یک ابزار مستقل تطبیق داده شده‌اند */
import { describe, it, expect } from "vitest";
import { calculateMohlat as c, toJdn, fromJdn, toGregorian, fromGregorian, isLeap, weekday, DEADLINES, type MohlatInput } from "./mohlat-calc";

const id = (t: string, cat: string) => DEADLINES.find((d) => d.title === t && d.category === cat)!.id;
const end = (o: Omit<MohlatInput, "itemId"> & { t: string; cat?: string }) => {
  const { t, cat = "civil", ...rest } = o;
  const r = c({ itemId: id(t, cat), ...rest });
  if (!r.ok) throw new Error(r.error);
  return `${r.end.y}/${r.end.m}/${r.end.d}`;
};

describe("تقویم", () => {
  it("۱ فروردین ۱۴۰۵ = ۲۱ مارس ۲۰۲۶، شنبه", () => {
    expect(toGregorian({ y: 1405, m: 1, d: 1 })).toEqual({ gy: 2026, gm: 3, gd: 21 });
    expect(weekday(toJdn({ y: 1405, m: 1, d: 1 }))).toBe(0);
  });
  it("تبدیل میلادی", () => expect(fromGregorian(2026, 11, 13)).toEqual({ y: 1405, m: 8, d: 22 }));
  it("کبیسه", () => { expect(isLeap(1403)).toBe(true); expect(isLeap(1404)).toBe(false); expect(isLeap(1408)).toBe(true); });
  it("رفت‌وبرگشت ۱۰ سال", () => {
    for (let j = toJdn({ y: 1400, m: 1, d: 1 }); j < toJdn({ y: 1410, m: 1, d: 1 }); j++) expect(toJdn(fromJdn(j))).toBe(j);
  });
});

describe("مهلت‌ها", () => {
  it("تجدیدنظر از ۱ مهر", () => expect(end({ t: "تجدیدنظرخواهی", start: { y: 1405, m: 7, d: 1 } })).toBe("1405/7/22"));
  it("تجدیدنظر مقیم خارج", () => expect(end({ t: "تجدیدنظرخواهی", start: { y: 1405, m: 7, d: 1 }, abroad: true })).toBe("1405/9/2"));
  it("تجدیدنظر از ۲۰ تیر (عبور از تعطیلات)", () => expect(end({ t: "تجدیدنظرخواهی", start: { y: 1405, m: 4, d: 20 } })).toBe("1405/5/10"));
  it("پنجشنبه عادی", () => expect(end({ t: "تجدیدنظرخواهی", start: { y: 1405, m: 5, d: 29 } })).toBe("1405/6/19"));
  it("پنجشنبه تعطیل", () => expect(end({ t: "تجدیدنظرخواهی", start: { y: 1405, m: 5, d: 29 }, thursdayOff: true })).toBe("1405/6/21"));
  it("دو مرحله", () => expect(end({ t: "واخواهی +‌ تجدیدنظر", start: { y: 1405, m: 7, d: 1 } })).toBe("1405/8/12"));
  it("حداقل فاصله جلسه", () => expect(end({ t: "فاصله ابلاغ تا جلسه رسیدگی", start: { y: 1405, m: 7, d: 1 } })).toBe("1405/7/7"));
  it("کیفری ماده ۲۷۰", () => expect(end({ t: "اعتراض به قرارهای قابل اعتراض بازپرس", cat: "criminal", start: { y: 1405, m: 7, d: 10 } })).toBe("1405/7/21"));
  it("اجرایی ماده ۳۴", () => expect(end({ t: "اجرای مفاد اجرائیه", cat: "enforcement", start: { y: 1405, m: 6, d: 1 } })).toBe("1405/6/12"));
  it("مبدأ غیر ابلاغ — ماده ۴۴۵ دقیق", () => expect(end({ t: "طرح دعوا پس از صدور قرار تأمین", start: { y: 1405, m: 7, d: 1 } })).toBe("1405/7/11"));
  it("مبدأ غیر ابلاغ — رویه عام", () => expect(end({ t: "طرح دعوا پس از صدور قرار تأمین", start: { y: 1405, m: 7, d: 1 }, strict445: false })).toBe("1405/7/12"));
  it("تعطیل اضافه کاربر", () => expect(end({ t: "تجدیدنظرخواهی", start: { y: 1405, m: 7, d: 1 }, extraHolidays: ["1405/07/22"] })).toBe("1405/7/23"));
  it("هشدار سال ناقص", () => {
    const r = c({ itemId: id("تجدیدنظرخواهی", "civil"), start: { y: 1405, m: 12, d: 20 } });
    expect(r.ok && r.warnings.length > 0).toBe(true);
  });
  it("مقیم خارج بدون مهلت جداگانه", () => expect(c({ itemId: id("داوری", "civil"), start: { y: 1405, m: 7, d: 1 }, abroad: true }).ok).toBe(false));
});
