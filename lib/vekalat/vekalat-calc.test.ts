/**
 * تست‌های مرجع حق‌الوکاله و تمبر — مبالغ حق‌الوکاله با یک ابزار مستقل تطبیق داده شده‌اند.
 */
import { describe, it, expect } from "vitest";
import { financialFee, calculateVekalat as c } from "./vekalat-calc";

const ok = (r: ReturnType<typeof c>) => { if (!r.ok) throw new Error(r.error); return r; };

describe("ماده ۹ — مالی", () => {
  it("قطعی ۱۰٪", () => expect(financialFee(4e8, true)).toBe(40_000_000));
  it("۱ میلیارد پلکانی", () => expect(financialFee(1e9, false)).toBe(75_000_000));
  it("۵ میلیارد پلکانی", () => expect(Math.round(financialFee(5e9, false))).toBe(295_000_000));
  it("۵۰ میلیارد پلکانی", () => expect(Math.round(financialFee(5e10, false))).toBe(1_945_000_000));
  it("۳۰۰ میلیون خودکار قطعی", () => expect(ok(c({ subject: "financial", value: 3e8 })).fee.max).toBe(30_000_000));
  it("مراحل ۶۰/۴۰ و تمبر", () => {
    const r = ok(c({ subject: "financial", value: 1e9 }));
    expect(r.stages.map((s) => s.fee.max)).toEqual([45_000_000, 30_000_000]);
    expect(r.stages.map((s) => s.stamp)).toEqual([2_250_000, 1_500_000]);
    expect(r.stages.map((s) => s.share)).toEqual([1_687_500, 1_125_000]);
  });
  it("رد دادخواست پس از پاسخ", () => expect(ok(c({ subject: "financial", value: 1e9, outcome: "rejectAfter" })).fee.max).toBe(22_500_000));
  it("نقض + تخصصی", () => expect(ok(c({ subject: "financial", value: 1e9, afterReversal: true, specialist: true })).fee.max).toBe(41_250_000));
  it("سفر خارج استان ۲ روز", () => expect(ok(c({ subject: "financial", value: 1e9, travelDays: 2, travelScope: "outOfProvince" })).travel).toBe(6_000_000));
  it("مرکز + مبلغ قراردادی + دو وکیل", () => {
    const r = ok(c({ subject: "financial", value: 1e9, issuer: "center", agreedFee: 2e8, lawyers: 2 }));
    expect(r.stamp.total).toBe(10_000_000);
    expect(r.stamp.share).toBe(10_000_000);
    expect(r.perLawyer.max).toBe(37_500_000);
  });
});

describe("سایر موضوع‌ها", () => {
  it("خانوادگی: بازه و کف تمبر", () => {
    const r = ok(c({ subject: "nonFinancial", itemId: "family" }));
    expect(r.fee).toEqual({ min: 5_000_000, max: 200_000_000 });
    expect(r.stamp.total).toBe(250_000);
  });
  it("تسخیری غیرمالی: دو برابر حداقل", () => expect(ok(c({ subject: "nonFinancial", itemId: "nonfin", appointed: true })).fee).toEqual({ min: 8_000_000, max: 8_000_000 }));
  it("کیفری با دو جرم اضافه", () => expect(ok(c({ subject: "criminal", itemId: "k1a", extraCrimes: 2 })).fee).toEqual({ min: 70_000_000, max: 2_800_000_000 }));
  it("کیفری مراحل ۵۰/۳۰/۲۰", () => expect(ok(c({ subject: "criminal", itemId: "k1a", extraCrimes: 2 })).stages.map((s) => s.fee.max)).toEqual([1_400_000_000, 840_000_000, 560_000_000]));
  it("اجرایی ۲٪", () => expect(ok(c({ subject: "execution", value: 1e9 })).fee).toEqual({ min: 4_000_000, max: 20_000_000 }));
  it("معافیت اقربا", () => expect(ok(c({ subject: "financial", value: 1e9, relativeFree: true })).stamp.sum).toBe(0));
});
