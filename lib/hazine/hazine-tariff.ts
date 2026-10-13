/**
 * تعرفه هزینه دادرسی و خدمات قضایی — سال ۱۴۰۵
 * مبنا: ماده ۳ قانون وصول برخی از درآمدهای دولت و مصرف آن در موارد معین
 * و اصلاحات آن در قوانین بودجه سنواتی؛ حق اجرا: ماده ۱۵۸ قانون اجرای احکام مدنی.
 *
 * برای سال جدید: فقط مقادیر این فایل را عوض کنید (TARIFF_YEAR، نرخ‌ها، آستانه، جدول ثابت).
 * همه مبالغ به ریال.
 */
export const TARIFF_YEAR = 1405;

export const FINANCIAL_RATES = {
  /** بدوی پلکانی: تا آستانه نرخ پایین، فقط مازاد با نرخ بالا */
  badviThreshold: 200_000_000,
  badviLow: 0.025,
  badviHigh: 0.035,
  /** تجدیدنظر و واخواهی */
  tajdid: 0.045,
  /** فرجام‌خواهی، اعاده دادرسی، اعتراض ثالث */
  farjam: 0.055,
  /** حق اجرا (نیم‌عشر) — ماده ۱۵۸ ق.ا.ا.م */
  ejra: 0.05,
} as const;

/**
 * تعرفه‌های ثابت. verified=false یعنی از منبع ثانویه آمده و با بخشنامه رسمی تطبیق داده نشده.
 * min/max برای مواردی که «طبق بخشنامه» در بازه تعیین می‌شود.
 */
export type FixedFee = {
  id: string;
  title: string;
  category: "civil" | "enforcement" | "criminal" | "admin" | "misc";
  amount?: number;
  min?: number;
  max?: number;
  verified: boolean;
};

export const FIXED_FEES: FixedFee[] = [
  { id: "unknown-value", title: "دعاوی مالی با خواسته نامعلوم هنگام تقدیم", category: "civil", amount: 1_500_000, verified: false },
  { id: "non-financial", title: "دعاوی غیرمالی", category: "civil", min: 400_000, max: 1_800_000, verified: false },
  { id: "evidence", title: "تأمین دلیل", category: "civil", min: 400_000, max: 1_800_000, verified: false },
  { id: "order-objection", title: "اعتراض به قرارهای قابل تجدیدنظر", category: "civil", amount: 300_000, verified: false },
  { id: "enf-non-financial", title: "اجرای احکام غیرمالی", category: "enforcement", min: 400_000, max: 1_800_000, verified: false },
  { id: "enf-temporary", title: "اجرای موقت احکام", category: "enforcement", amount: 300_000, verified: false },
  { id: "enf-third-party", title: "اعتراض ثالث اجرایی", category: "enforcement", amount: 200_000, verified: false },
  { id: "crim-complaint", title: "شکایت کیفری", category: "criminal", amount: 100_000, verified: false },
  { id: "crim-appeal", title: "تجدیدنظر از احکام کیفری", category: "criminal", amount: 300_000, verified: false },
  { id: "crim-prosecutor-order", title: "اعتراض به قرارهای دادسرا", category: "criminal", amount: 200_000, verified: false },
  { id: "crim-477", title: "درخواست اجرای ماده ۴۷۷ ق.آ.د.ک", category: "criminal", amount: 300_000, verified: false },
  { id: "crim-retrial", title: "اعاده دادرسی کیفری (دیوان عالی کشور)", category: "criminal", amount: 500_000, verified: false },
  { id: "judges-discipline", title: "شکایت به دادسرای انتظامی قضات", category: "criminal", amount: 300_000, verified: false },
  { id: "admin-court", title: "دادخواست به دیوان عدالت اداری", category: "admin", amount: 200_000, verified: false },
  { id: "notice", title: "ابلاغ اظهارنامه / واخواست (هر مورد)", category: "misc", amount: 100_000, verified: false },
  { id: "paper", title: "بهای اوراق (هر برگ)", category: "misc", amount: 20_000, verified: false },
];

export const CATEGORY_LABELS: Record<FixedFee["category"], string> = {
  civil: "حقوقی",
  enforcement: "اجرای احکام",
  criminal: "کیفری و انتظامی",
  admin: "دیوان عدالت اداری",
  misc: "سایر",
};

export const TARIFF_SOURCE_NOTE =
  "نرخ‌های دعاوی مالی از چند منبع حقوقی تطبیق داده شده‌اند؛ تعرفه‌های ثابت از منابع ثانویه‌اند و ممکن است با بخشنامه نهایی قوه قضاییه تفاوت داشته باشند.";
