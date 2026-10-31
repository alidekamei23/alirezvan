/**
 * تست‌های مرجع دیه — نرخ ۱۴۰۵: ۲۱٬۰۰۰٬۰۰۰٬۰۰۰ ریال؛ همه انتظارها دستی از متن مواد محاسبه شده‌اند.
 */
import { describe, it, expect } from "vitest";
import { calculateDiyeh as c, type DiyehInput } from "./diyeh-calc";

const ok = (i: Partial<DiyehInput> & { lines: DiyehInput["lines"] }) => {
  const r = c({ victim: "male", ...i });
  if (!r.ok) throw new Error(r.error);
  return r;
};
const F = 21_000_000_000;

describe("نفس — مواد ۵۵۰، ۵۵۱، ۵۵۵", () => {
  it("مرد", () => expect(ok({ lines: [{ type: "nafs" }] }).payerTotal).toBe(F));
  it("زن: نصف + تفاوت از صندوق", () => {
    const r = ok({ victim: "female", lines: [{ type: "nafs" }] });
    expect([r.payerTotal, r.fundTotal, r.victimTotal]).toEqual([F / 2, F / 2, F]);
  });
  it("زن در ماه حرام", () => {
    const r = ok({ victim: "female", haram: true, lines: [{ type: "nafs" }] });
    expect([r.payerTotal, r.fundTotal]).toEqual([14e9, 14e9]);
  });
  it("مرد در ماه حرام = ۲۸ میلیارد", () => expect(ok({ haram: true, lines: [{ type: "nafs" }] }).payerTotal).toBe(28e9));
  it("خنثای مشکل سه‌چهارم", () => expect(ok({ victim: "khonsaMoshkel", lines: [{ type: "nafs" }] }).payerTotal).toBe(15_750_000_000));
  it("خنثای ملحق به مرد", () => expect(ok({ victim: "khonsaMale", lines: [{ type: "nafs" }] }).fundTotal).toBe(0));
});

describe("اعضا و ماده ۵۶۰", () => {
  it("دست زن (۱/۲ ≥ ثلث) نصف می‌شود", () => {
    const r = ok({ victim: "female", lines: [{ type: "item", id: "h-hand" }] });
    expect([r.payerTotal, r.fundTotal]).toEqual([5_250_000_000, 5_250_000_000]);
  });
  it("انگشت زن (کمتر از ثلث) برابر", () => {
    const r = ok({ victim: "female", lines: [{ type: "item", id: "h-finger" }] });
    expect([r.payerTotal, r.fundTotal]).toEqual([2_100_000_000, 0]);
  });
  it("ماده ۵۶۱: هر آسیب جداگانه — ۴ انگشت زن", () => expect(ok({ victim: "female", lines: [{ type: "item", id: "h-finger", qty: 4 }] }).payerTotal).toBe(8_400_000_000));
  it("جائفه زن دقیقاً ثلث → نصف", () => expect(ok({ victim: "female", lines: [{ type: "item", id: "w-jaefeh" }] }).payerTotal).toBe(3_500_000_000));
  it("جائفه زن بدون اعمال ۵۶۰ بر جراحات", () => expect(ok({ victim: "female", apply560ToWounds: false, lines: [{ type: "item", id: "w-jaefeh" }] }).payerTotal).toBe(7e9));
  it("پستان: نصف دیه کامل زن، بدون صندوق", () => {
    const r = ok({ victim: "female", lines: [{ type: "item", id: "br-one" }] });
    expect([r.payerTotal, r.fundTotal]).toEqual([5_250_000_000, 0]);
  });
  it("تغلیظ در اعضا جاری نیست", () => expect(ok({ haram: true, lines: [{ type: "item", id: "h-hand" }] }).payerTotal).toBe(10_500_000_000));
  it("۳ دندان جلو", () => expect(ok({ lines: [{ type: "item", id: "t-front", qty: 3 }] }).payerTotal).toBe(3_150_000_000));
  it("دررفتگی دنده قلب ۷٫۵ هزارم", () => expect(ok({ lines: [{ type: "item", id: "rb-heart-disl" }] }).payerTotal).toBe(157_500_000));
  it("شکستن ترقوه درمان بی‌عیب ۴٪", () => expect(ok({ lines: [{ type: "item", id: "cl-break-healed" }] }).payerTotal).toBe(840_000_000));
  it("حداکثر تعداد", () => expect(c({ victim: "male", lines: [{ type: "item", id: "t-front", qty: 13 }] }).ok).toBe(false));
});

describe("جنایت بر عضو (مواد ۵۶۴ تا ۵۷۱ و ۷۱۰)", () => {
  it("شکستن دست درمان بی‌عیب = ۲/۲۵", () => expect(ok({ lines: [{ type: "organ", organId: "hand", injuryId: "breakHealed" }] }).payerTotal).toBe(1_680_000_000));
  it("دررفتگی با شلل در دست زن = ۱/۳ → نصف", () => expect(ok({ victim: "female", lines: [{ type: "organ", organId: "hand", injuryId: "dislocParalysis" }] }).payerTotal).toBe(3_500_000_000));
  it("۴۰٪ دست زن = ۱/۵ برابر", () => expect(ok({ victim: "female", lines: [{ type: "organ", organId: "hand", injuryId: "portion", percent: 40 }] }).payerTotal).toBe(4_200_000_000));
  it("موضحه بر انگشت = ۵٪ از ۱/۱۰", () => expect(ok({ lines: [{ type: "organ", organId: "finger", injuryId: "mozeheh" }] }).payerTotal).toBe(105_000_000));
});

describe("ارش، نافذه، خنثی", () => {
  it("ارش ۲٪ زن بدون تنصیف", () => expect(ok({ victim: "female", lines: [{ type: "arshPercent", percent: 2 }] }).payerTotal).toBe(420_000_000));
  it("نافذه در زن → ارش", () => {
    const r = ok({ victim: "female", lines: [{ type: "item", id: "w-nafezeh" }] });
    expect([r.lines[0].kind, r.payerTotal]).toEqual(["arsh", 0]);
  });
  it("مورد مخصوص مرد برای زن → خطا", () => expect(c({ victim: "female", lines: [{ type: "item", id: "sx-testes" }] }).ok).toBe(false));
  it("بیضه خنثای ملحق به زن → ارش (ماده ۶۶۷)", () => expect(ok({ victim: "khonsaFemale", lines: [{ type: "item", id: "sx-testes" }] }).lines[0].kind).toBe("arsh"));
  it("خنثای مشکل دست = سه‌چهارم", () => expect(ok({ victim: "khonsaMoshkel", lines: [{ type: "item", id: "h-hand" }] }).payerTotal).toBe(7_875_000_000));
});

describe("جنین و میت", () => {
  it("جنین پسر دمیده‌شده در روح در ماه حرام", () => expect(ok({ lines: [{ type: "item", id: "fe-soul-m" }], haram: true }).payerTotal).toBe(28e9));
  it("جنین بدون ماده ۵۶۰ (مادر زن)", () => expect(ok({ victim: "female", lines: [{ type: "item", id: "fe-soul-m" }] }).payerTotal).toBe(F));
  it("علقه", () => expect(ok({ lines: [{ type: "item", id: "fe-alaqeh" }] }).payerTotal).toBe(840_000_000));
  it("میت: قطع یک دست = یک بیستم", () => expect(ok({ deceased: true, lines: [{ type: "item", id: "h-hand" }] }).payerTotal).toBe(1_050_000_000));
  it("میت + قتل → خطا", () => expect(c({ victim: "male", deceased: true, lines: [{ type: "nafs" }] }).ok).toBe(false));
});

describe("پرداخت — مواد ۴۶۷، ۴۸۸، ۴۸۹", () => {
  it("خطای محض: سه قسط مساوی", () => {
    const p = ok({ crimeType: "khata", lines: [{ type: "nafs" }] }).payment!;
    expect(p.installments.map((x) => x.amount)).toEqual([7e9, 7e9, 7e9]);
    expect(p.aqelehShare).toBe(F);
  });
  it("عاقله ضامن کمتر از موضحه نیست", () => {
    const p = ok({ crimeType: "khata", lines: [{ type: "item", id: "h-hand" }, { type: "item", id: "w-hares" }] }).payment!;
    expect([p.aqelehShare, p.offenderShare]).toEqual([10_500_000_000, 210_000_000]);
  });
  it("شبه‌عمد: دو قسط", () => expect(ok({ crimeType: "shebh", lines: [{ type: "nafs" }] }).payment!.installments.map((x) => x.amount)).toEqual([10_500_000_000, 10_500_000_000]));
  it("نرخ سال ۱۴۰۴", () => expect(ok({ year: 1404, lines: [{ type: "nafs" }] }).payerTotal).toBe(16e9));
  it("نرخ ناموجود", () => expect(c({ victim: "male", year: 1370, lines: [{ type: "nafs" }] }).ok).toBe(false));
});

describe("محدودیت‌های بدن و حالت‌های ناسازگار", () => {
  const bad = (lines: DiyehInput["lines"]) => c({ victim: "male", lines }).ok;
  it("دو گردن", () => expect(bad([{ type: "item", id: "nk-bent", qty: 2 }])).toBe(false));
  it("دو بار خمیدگی گردن در دو ردیف", () => expect(bad([{ type: "item", id: "nk-bent" }, { type: "item", id: "nk-bent" }])).toBe(false));
  it("دو چشم + یک چشم", () => expect(bad([{ type: "item", id: "e-both" }, { type: "item", id: "e-one" }])).toBe(false));
  it("دو دست + یک دست", () => expect(bad([{ type: "item", id: "h-hand", qty: 2 }, { type: "item", id: "h-elbow" }])).toBe(false));
  it("قطع دست + ۶ انگشت", () => expect(bad([{ type: "item", id: "h-hand" }, { type: "item", id: "h-finger", qty: 6 }])).toBe(false));
  it("قطع دست + ۵ انگشت دست دیگر مجاز", () => expect(bad([{ type: "item", id: "h-hand" }, { type: "item", id: "h-finger", qty: 5 }])).toBe(true));
  it("۱۳ دندان جلو در دو ردیف", () => expect(bad([{ type: "item", id: "t-front", qty: 10 }, { type: "item", id: "t-front-black", qty: 3 }])).toBe(false));
  it("کل بینی + پره بینی", () => expect(bad([{ type: "item", id: "n-all" }, { type: "item", id: "n-wing" }])).toBe(false));
  it("پره و پارگی بینی مجاز", () => expect(bad([{ type: "item", id: "n-wing" }, { type: "item", id: "n-tear" }])).toBe(true));
  it("کل زبان + حروف", () => expect(bad([{ type: "item", id: "tg-all" }, { type: "item", id: "tg-letter", qty: 3 }])).toBe(false));
  it("دو قتل", () => expect(bad([{ type: "nafs" }, { type: "nafs" }])).toBe(false));
  it("مورد دارای حکم خاص", () => expect(bad([{ type: "item", id: "w-body" }])).toBe(false));
  it("کسر بیش از دیه کامل", () => expect(bad([{ type: "fraction", num: 3, den: 2 }])).toBe(false));
  it("ارش ریالی با ماده", () => {
    const r = ok({ lines: [{ type: "arshAmount", amount: 5e8, title: "ارش کندی حرکت فک", art: "ماده ۶۳۱" }] });
    expect([r.payerTotal, r.lines[0].art]).toEqual([5e8, "ماده ۶۳۱"]);
  });
});
