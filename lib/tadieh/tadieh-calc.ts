/**
 * منطق محاسبه خسارت تأخیر تأدیه (ماده ۵۲۲ ق.آ.د.م)
 * مبلغ به‌روز = اصل دین × (شاخص زمان پرداخت ÷ شاخص زمان سررسید)
 * خسارت = مبلغ به‌روز − اصل دین   (اگر شاخص کاهش یافته باشد، خسارت صفر است)
 *
 * توابع خالص (pure) هستند؛ هیچ وابستگی به UI ندارند.
 */
import { CPI_INDEX } from "./tadieh-index";

export type Basis = "monthly" | "annual";
/** month: 0 = فروردین … 11 = اسفند */
export type JalaliMonth = { year: number; month: number };

export const MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
] as const;

export const YEARS = Object.keys(CPI_INDEX).map(Number).sort((a, b) => a - b);

/** آخرین ماهی که شاخص آن منتشر شده */
export function latestAvailable(): JalaliMonth {
  for (let i = YEARS.length - 1; i >= 0; i--) {
    const y = YEARS[i];
    const m = CPI_INDEX[y].monthly.findLastIndex((v) => v != null);
    if (m >= 0) return { year: y, month: m };
  }
  throw new Error("جدول شاخص خالی است");
}

/** آخرین سالی که میانگین سالانه‌اش کامل است */
export function latestAnnualYear(): number {
  return [...YEARS].reverse().find((y) => CPI_INDEX[y].average != null)!;
}

export function getIndex(d: JalaliMonth, basis: Basis): number | null {
  const row = CPI_INDEX[d.year];
  if (!row) return null;
  return basis === "annual" ? row.average : row.monthly[d.month] ?? null;
}

/** ماه‌های قابل انتخاب برای یک سال (فقط ماه‌هایی که شاخص دارند) */
export function availableMonths(year: number): number[] {
  return (CPI_INDEX[year]?.monthly ?? [])
    .map((v, i) => (v == null ? -1 : i))
    .filter((i) => i >= 0);
}

export function compare(a: JalaliMonth, b: JalaliMonth): number {
  return a.year !== b.year ? a.year - b.year : a.month - b.month;
}

export type DebtInput = { principal: number; due: JalaliMonth };

export type DebtResult = {
  principal: number;
  due: JalaliMonth;
  dueIndex: number;
  factor: number; // ضریب = شاخص پرداخت ÷ شاخص سررسید (حداقل ۱)
  damage: number; // ریال، گرد شده
  total: number;
  dueAfterPayment: boolean;
};

export type CalcResult =
  | {
      ok: true;
      basis: Basis;
      payment: JalaliMonth; // ماهی که واقعاً ملاک شد
      paymentIndex: number;
      rows: DebtResult[];
      totalPrincipal: number;
      totalDamage: number;
      grandTotal: number;
      warnings: string[];
    }
  | { ok: false; error: string };

/**
 * payment: تاریخ پرداخت یا تاریخ محاسبه. اگر شاخص آن منتشر نشده باشد،
 * آخرین شاخص موجود ملاک می‌شود و هشدار برمی‌گردد.
 */
export function calculate(
  debts: DebtInput[],
  payment: JalaliMonth,
  basis: Basis = "monthly",
): CalcResult {
  const warnings: string[] = [];
  let pay = payment;
  let P = getIndex(pay, basis);

  if (P == null) {
    if (basis === "annual") {
      pay = { year: latestAnnualYear(), month: 11 };
      warnings.push(`میانگین سالانه ${payment.year} کامل نشده؛ میانگین ${pay.year} ملاک قرار گرفت.`);
    } else {
      pay = latestAvailable();
      warnings.push(`شاخص ${MONTH_NAMES[payment.month]} ${payment.year} منتشر نشده؛ آخرین شاخص موجود (${MONTH_NAMES[pay.month]} ${pay.year}) ملاک قرار گرفت.`);
    }
    P = getIndex(pay, basis)!;
  }

  const rows: DebtResult[] = [];
  for (const [i, d] of debts.entries()) {
    if (!Number.isFinite(d.principal) || d.principal <= 0)
      return { ok: false, error: `ردیف ${i + 1}: مبلغ اصل دین باید عدد مثبت باشد.` };
    const I = getIndex(d.due, basis);
    if (I == null)
      return { ok: false, error: `ردیف ${i + 1}: شاخص سررسید در جدول موجود نیست.` };

    const dueAfterPayment =
      basis === "annual" ? d.due.year > pay.year : compare(d.due, pay) > 0;
    if (dueAfterPayment) warnings.push(`ردیف ${i + 1}: سررسید بعد از تاریخ پرداخت است؛ خسارتی تعلق نمی‌گیرد.`);

    const factor = dueAfterPayment ? 1 : Math.max(1, P / I);
    const damage = Math.round(d.principal * factor - d.principal);
    rows.push({ principal: d.principal, due: d.due, dueIndex: I, factor, damage, total: d.principal + damage, dueAfterPayment });
  }

  const totalPrincipal = rows.reduce((s, r) => s + r.principal, 0);
  const totalDamage = rows.reduce((s, r) => s + r.damage, 0);
  return { ok: true, basis, payment: pay, paymentIndex: P, rows, totalPrincipal, totalDamage, grandTotal: totalPrincipal + totalDamage, warnings };
}

/* ───────── کمکی‌های نمایش ───────── */

const FA = "۰۱۲۳۴۵۶۷۸۹";
export const toFaDigits = (s: string | number) => String(s).replace(/\d/g, (d) => FA[+d]);

/** ورودی کاربر (ارقام فارسی/عربی، جداکننده هزارگان) → عدد */
export function parseAmount(s: string): number {
  const en = s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,،٬\s]/g, "")
    .replace(/٫/g, ".");
  const n = Number(en);
  return Number.isFinite(n) ? n : NaN;
}

/** ۱۲۳٬۴۵۶٬۷۸۹ */
export const formatRial = (n: number) => toFaDigits(Math.round(n).toLocaleString("en-US")).replace(/,/g, "٬");

const ones = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const teens = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
const tens = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const hund = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
const scales = ["", "هزار", "میلیون", "میلیارد", "هزار میلیارد", "میلیون میلیارد"];
function three(n: number) {
  const p: string[] = [];
  const h = Math.floor(n / 100), r = n % 100;
  if (h) p.push(hund[h]);
  if (r >= 10 && r < 20) p.push(teens[r - 10]);
  else { if (Math.floor(r / 10)) p.push(tens[Math.floor(r / 10)]); if (r % 10) p.push(ones[r % 10]); }
  return p.join(" و ");
}
/** عدد به حروف فارسی */
export function numberToWords(n: number): string {
  n = Math.round(n);
  if (!n) return "صفر";
  const parts: string[] = [];
  for (let i = 0; n > 0 && i < scales.length; i++, n = Math.floor(n / 1000)) {
    const c = n % 1000;
    if (c) parts.unshift(three(c) + (scales[i] ? " " + scales[i] : ""));
  }
  return parts.join(" و ");
}

/*
 * تست مرجع (باید پاس شود):
 * calculate([{ principal: 500_000_000, due: { year: 1402, month: 2 } }], { year: 1405, month: 5 })
 *   → paymentIndex 3452.1, dueIndex 885.8, damage 1_448_577_557, grandTotal 1_948_577_557
 */
