/**
 * آیین‌نامه تعرفه حق‌الوکاله، حق‌المشاوره و هزینه سفر وکلای دادگستری
 * مصوب ۱۳۹۸/۱۲/۲۸ رئیس قوه قضاییه (متن منتشرشده کانون وکلای دادگستری مرکز)
 * + ماده ۱۰۳ قانون مالیات‌های مستقیم (تمبر علی‌الحساب مالیاتی)
 * + تبصره ۵ ماده ۱۲ قانون شوراهای حل اختلاف ۱۴۰۲ (قطعیت آرای دادگاه صلح تا نصف نصاب)
 *
 * این فایل فقط داده است. همه مبالغ به ریال.
 */

export const REGULATION = "آیین‌نامه تعرفه حق‌الوکاله، حق‌المشاوره و هزینه سفر وکلای دادگستری مصوب ۱۳۹۸/۱۲/۲۸";

/** ماده ۹ — دعاوی مالی */
export const FINANCIAL = {
  /** حکم بدوی از حیث بهای خواسته قطعی: ده درصد */
  finalRate: 0.1,
  /** دعاوی مالی تا این مبلغ در دادگاه صلح قطعی‌اند (نصاب ۱ میلیارد × نصف) */
  finalThreshold: 500_000_000,
  /** حکم قابل تجدیدنظر: پلکانی نسبت به مازاد */
  tiers: [
    { from: 0, rate: 0.08 },
    { from: 500_000_000, rate: 0.07 },
    { from: 2_000_000_000, rate: 0.05 },
    { from: 10_000_000_000, rate: 0.04 },
    { from: 30_000_000_000, rate: 0.03 },
  ],
} as const;

/** ماده ۲۱ — سهم مراحل برای مواد ۹، ۱۳ و ۲۰ */
export const CIVIL_STAGES = { first: 0.6, appeal: 0.4 } as const;
/** تبصره ۱ ماده ۱۴ — سهم مراحل کیفری */
export const CRIMINAL_STAGES = { dadsara: 0.5, first: 0.3, appeal: 0.2 } as const;

export type RangeItem = { id: string; title: string; min: number; max: number; article: string; stages: "civil" | "criminal" | "none"; unit?: string };

/** ماده ۱۳ */
export const NON_FINANCIAL: RangeItem[] = [
  { id: "family", title: "دعاوی خانوادگی، دعاوی مالی ناشی از زوجیت و امور حسبی", min: 5_000_000, max: 200_000_000, article: "بند الف ماده ۱۳", stages: "civil" },
  { id: "nonfin", title: "دعاوی غیرمالی یا دعاوی‌ای که تعیین بهای خواسته در آن‌ها لازم نیست", min: 4_000_000, max: 300_000_000, article: "بند ب ماده ۱۳", stages: "civil" },
];

/** ماده ۱۴ */
export const CRIMINAL: RangeItem[] = [
  { id: "k1a", title: "کیفری یک، نظامی یک و انقلاب — سلب حیات، قطع عضو، حبس ابد یا تعزیر درجه ۱", min: 50_000_000, max: 2_000_000_000, article: "بند الف(۱) ماده ۱۴", stages: "criminal" },
  { id: "k1b", title: "کیفری یک، نظامی یک و انقلاب — تعزیر درجه ۲ و ۳", min: 30_000_000, max: 1_000_000_000, article: "بند الف(۲) ماده ۱۴", stages: "criminal" },
  { id: "k1c", title: "کیفری یک، نظامی یک و انقلاب — دیگر جرایم", min: 10_000_000, max: 500_000_000, article: "بند الف(۳) ماده ۱۴", stages: "criminal" },
  { id: "k2a", title: "کیفری دو، نظامی دو و اطفال — حدود، دیات و تعزیر درجه ۴ و ۵", min: 10_000_000, max: 500_000_000, article: "بند ب(۱) ماده ۱۴", stages: "criminal" },
  { id: "k2b", title: "کیفری دو، نظامی دو و اطفال — تعزیر درجه ۶", min: 5_000_000, max: 300_000_000, article: "بند ب(۲) ماده ۱۴", stages: "criminal" },
  { id: "k2c", title: "کیفری دو، نظامی دو و اطفال — دیگر جرایم", min: 2_000_000, max: 200_000_000, article: "بند ب(۳) ماده ۱۴", stages: "criminal" },
  { id: "kq", title: "اعتراض به قرارهای قابل اعتراض دادسرا", min: 1_000_000, max: 150_000_000, article: "بند پ ماده ۱۴", stages: "none" },
  { id: "kf", title: "فرجام‌خواهی کیفری، اعاده دادرسی و درخواست اعمال ماده ۴۷۷", min: 2_000_000, max: 200_000_000, article: "بند ت ماده ۱۴", stages: "none" },
  { id: "k48", title: "دعاوی مخصوص وکلای تبصره ماده ۴۸ آیین دادرسی کیفری", min: 50_000_000, max: 500_000_000, article: "بند ث ماده ۱۴", stages: "criminal" },
];

/** ماده ۲۵ — امور اجرایی */
export const EXECUTION = {
  /** اجرای احکام حقوقی و اجرای اسناد رسمی ثبت: حداقل ۴ میلیون، حداکثر ۲٪ محکوم‌به */
  judgment: { min: 4_000_000, maxRate: 0.02 },
  other: { min: 4_000_000, max: 150_000_000 },
} as const;

/** سایر موارد */
export const OTHER: RangeItem[] = [
  { id: "civilOrder", title: "اعتراض به قرارهای حقوقی قابل اعتراض", min: 1_000_000, max: 100_000_000, article: "بند ج ماده ۱۲", stages: "none" },
  { id: "disciplinary", title: "دادسرا و دادگاه عالی انتظامی قضات، دادسرای دیوان عالی و سایر مراجع انتظامی", min: 0, max: 20_000_000, article: "ماده ۱۹", stages: "none" },
  { id: "divan", title: "دیوان عدالت اداری و سازمان تعزیرات حکومتی", min: 4_000_000, max: 500_000_000, article: "ماده ۲۰", stages: "civil" },
  { id: "nonJudicial", title: "مراجع غیرقضایی، مانند هیئت‌های قانون کار", min: 4_000_000, max: 200_000_000, article: "ماده ۲۰", stages: "civil" },
  { id: "drafting", title: "تنظیم دادخواست، شکواییه، لایحه دفاعیه یا اظهارنامه (بدون وکالت‌نامه)", min: 0, max: 50_000_000, article: "بند الف ماده ۲۶", stages: "none" },
  { id: "consult", title: "مشاوره حقوقی (هر ساعت، بدون وکالت‌نامه)", min: 500_000, max: 5_000_000, article: "بند ب ماده ۲۶", stages: "none", unit: "ساعت" },
  { id: "study", title: "مطالعه پرونده (بدون وکالت‌نامه)", min: 2_000_000, max: 50_000_000, article: "بند پ ماده ۲۶", stages: "none" },
  { id: "misc", title: "دیگر مواردی که در آیین‌نامه تعیین نشده است", min: 10_000_000, max: 250_000_000, article: "ماده ۲۸", stages: "none" },
];

/** ماده ۱۲ — نتیجه دعوا (فقط مواد ۹ و ۱۳) */
export const OUTCOMES = {
  none: { title: "رسیدگی ماهوی و صدور حکم", factor: null },
  cancelBefore: { title: "قرار ابطال دادخواست پیش از پاسخ و دفاع", stage: "first", factor: 0.25, article: "بند الف ماده ۱۲" },
  rejectAfter: { title: "قرار رد دادخواست پس از پاسخ و دفاع", stage: "first", factor: 0.5, article: "بند ب ماده ۱۲" },
  dismissal: { title: "قرار عدم استماع یا رد دعوا (مرور زمان، امر مختوم) یا رد اعاده دادرسی", stage: "all", factor: 1, article: "بند پ ماده ۱۲" },
  appealFallBefore: { title: "قرار سقوط دعوای تجدیدنظر پیش از پاسخ و دفاع", stage: "appeal", factor: 0.25, article: "بند ت ماده ۱۲" },
  appealFallAfter: { title: "قرار سقوط دعوای تجدیدنظر پس از پاسخ و دفاع", stage: "appeal", factor: 0.5, article: "بند ث ماده ۱۲" },
} as const;

export const MODIFIERS = {
  /** ماده ۱۸ */
  afterReversal: 0.5,
  /** تبصره ماده ۲۲ */
  specialist: 1.1,
  /** ماده ۸: دو برابر حداقل */
  appointedFactor: 2,
  /** تبصره ۳ ماده ۱۴: هر جرم اضافه */
  extraCrime: 0.2,
} as const;

/** ماده ۳۰ — فوق‌العاده مأموریت روزانه */
export const TRAVEL_PER_DAY = { inProvince: 1_500_000, outOfProvince: 3_000_000 } as const;

/** ماده ۱۰۳ ق.م.م و ماده ۲۹ آیین‌نامه */
export const STAMP = {
  rate: 0.05,
  /** کانون: ۵۰٪ تمبر برای صندوق + ۲۵٪ تمبر برای کانون */
  barShareOfStamp: 0.75,
  /** مرکز: ۵٪ حق‌الوکاله */
  centerShareOfFee: 0.05,
} as const;
