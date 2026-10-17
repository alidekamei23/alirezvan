/**
 * محاسبه مهریه به نرخ روز
 * مبنا: تبصره الحاقی ماده ۱۰۸۲ قانون مدنی (۱۳۷۶) و آیین‌نامه اجرایی آن:
 *   مهریه به نرخ روز = مهریه عقدنامه × (شاخص متوسط سال قبل از پرداخت ÷ شاخص متوسط سال وقوع عقد)
 * سقف ماده ۲۲ قانون حمایت خانواده (۱۳۹۱): ۱۱۰ سکه تمام بهار آزادی؛ برای مازاد، ملائت زوج ملاک است.
 *
 * شاخص سالانه از ستون average فایل tadieh-index.ts خوانده می‌شود (یک منبع داده برای همه ابزارها).
 * سال‌های پیش از ۱۳۷۵ را در OLDER_ANNUAL_INDEX اضافه کنید (پایه ۱۳۹۵=۱۰۰، از جدول رسمی بانک مرکزی).
 * توابع خالص؛ مبالغ به ریال.
 */
import { CPI_INDEX } from "../tadieh/tadieh-index";
export { formatRial, numberToWords, parseAmount, toFaDigits } from "../tadieh/tadieh-calc";

/** شاخص سالانه سال‌های قبل از جدول اصلی — از جدول رسمی بانک مرکزی پر شود. عدد حدسی وارد نکنید. */
export const OLDER_ANNUAL_INDEX: Record<number, number> = {
  // 1374: …,
};

export const COIN_CAP = 110;

export function annualIndex(year: number): number | null {
  return OLDER_ANNUAL_INDEX[year] ?? CPI_INDEX[year]?.average ?? null;
}

/** سال‌هایی که شاخص سالانه دارند (صعودی) */
export const ANNUAL_YEARS: number[] = [
  ...new Set([...Object.keys(OLDER_ANNUAL_INDEX), ...Object.keys(CPI_INDEX)].map(Number)),
]
  .filter((y) => annualIndex(y) != null)
  .sort((a, b) => a - b);

export const FIRST_YEAR = ANNUAL_YEARS[0];
export const LAST_YEAR = ANNUAL_YEARS[ANNUAL_YEARS.length - 1];

/** سال شاخص ملاک پرداخت: سال قبل از پرداخت؛ اگر منتشر نشده، آخرین سال موجود */
export function paymentIndexYear(paymentYear: number): number {
  const y = paymentYear - 1;
  return annualIndex(y) != null ? y : Math.min(y, LAST_YEAR);
}

export type Factor = { factor: number; marriageIndex: number | null; paymentIndexYear: number; paymentIndex: number };

/** ضریب به‌روزرسانی. اگر سال عقد ≥ سال شاخص ملاک باشد، ضریب ۱ است. */
export function mahrFactor(marriageYear: number, paymentYear: number): Factor {
  const ry = paymentIndexYear(paymentYear);
  const P = annualIndex(ry)!;
  const M = annualIndex(marriageYear);
  if (marriageYear >= ry) return { factor: 1, marriageIndex: M, paymentIndexYear: ry, paymentIndex: P };
  if (M == null) throw new RangeError(`شاخص سال ${marriageYear} در جدول نیست`);
  return { factor: P / M, marriageIndex: M, paymentIndexYear: ry, paymentIndex: P };
}

export type CoinKind = "full" | "half" | "quarter" | "gold18";
export const COIN_LABELS: Record<CoinKind, { title: string; unit: string }> = {
  full: { title: "سکه تمام بهار آزادی", unit: "عدد" },
  half: { title: "نیم‌سکه", unit: "عدد" },
  quarter: { title: "ربع‌سکه", unit: "عدد" },
  gold18: { title: "طلای ۱۸ عیار", unit: "گرم" },
};

export type MahrInput = {
  /** مهریه نقدی به ریال (اگر عقدنامه به تومان است، ×۱۰ کنید) */
  cashAmount?: number;
  marriageYear: number;
  paymentYear: number;
  /** بخش پرداخت‌شده قبلی، به ریال اسمی در سال پرداخت آن */
  partialPayments?: { amount: number; year: number }[];
  /** سکه و طلا با قیمت روز (ریال) */
  items?: { kind: CoinKind; quantity: number; unitPrice: number }[];
};

export type MahrLine = { label: string; amount: number; detail?: string };

export type MahrResult =
  | {
      ok: true;
      lines: MahrLine[];
      cash: null | {
        nominal: number;
        paidAtMarriageValue: number; // مجموع پرداخت‌های قبلی به ارزش سال عقد
        remainingAtMarriageValue: number;
        factor: Factor;
        today: number;
      };
      total: number;
      /** معادل سکه تمام و وضعیت سقف ۱۱۰ — فقط اگر قیمت سکه تمام داده شده باشد */
      coinEquivalent: null | { coins: number; overCap: boolean };
      warnings: string[];
    }
  | { ok: false; error: string };

export function calculateMahr(input: MahrInput, fullCoinPrice?: number): MahrResult {
  const { cashAmount = 0, marriageYear, paymentYear, partialPayments = [], items = [] } = input;
  const warnings: string[] = [];
  const lines: MahrLine[] = [];

  if (marriageYear > paymentYear) return { ok: false, error: "سال عقد بعد از سال پرداخت است." };
  if (paymentYear - 1 > LAST_YEAR)
    warnings.push(`شاخص سال ${paymentYear - 1} هنوز منتشر نشده؛ شاخص ${LAST_YEAR} ملاک قرار گرفت.`);

  let cash: Extract<MahrResult, { ok: true }>["cash"] = null;
  let total = 0;

  if (cashAmount > 0) {
    let f: Factor;
    try { f = mahrFactor(marriageYear, paymentYear); }
    catch (e) { return { ok: false, error: (e as Error).message }; }

    let paidAtMarriage = 0;
    for (const p of partialPayments) {
      if (!(p.amount > 0)) continue;
      if (p.year < marriageYear || p.year > paymentYear)
        return { ok: false, error: "سال پرداخت بخشی از مهریه باید بین سال عقد و سال مطالبه باشد." };
      paidAtMarriage += p.amount / mahrFactor(marriageYear, p.year).factor;
    }
    const remaining = Math.max(0, cashAmount - paidAtMarriage);
    if (paidAtMarriage > 0 && remaining === 0) warnings.push("پرداخت‌های قبلی، به ارزش سال عقد، تمام مهریه نقدی را پوشش می‌دهد.");
    const today = Math.round(remaining * f.factor);
    cash = { nominal: cashAmount, paidAtMarriageValue: Math.round(paidAtMarriage), remainingAtMarriageValue: Math.round(remaining), factor: f, today };
    total += today;
    lines.push({ label: "مهریه نقدی به نرخ روز", amount: today, detail: `ضریب ${f.factor.toFixed(4)} (شاخص ${f.paymentIndexYear} ÷ شاخص ${marriageYear})` });
  }

  for (const it of items) {
    if (!(it.quantity > 0)) continue;
    if (!(it.unitPrice > 0)) return { ok: false, error: `قیمت روز ${COIN_LABELS[it.kind].title} را وارد کنید.` };
    const v = Math.round(it.quantity * it.unitPrice);
    total += v;
    lines.push({ label: `${it.quantity} ${COIN_LABELS[it.kind].unit} ${COIN_LABELS[it.kind].title}`, amount: v });
  }

  const coinEquivalent = fullCoinPrice && fullCoinPrice > 0 && total > 0
    ? { coins: total / fullCoinPrice, overCap: total / fullCoinPrice > COIN_CAP }
    : null;

  return { ok: true, lines, cash, total, coinEquivalent, warnings };
}

/*
 * تست‌های مرجع (باید پاس شوند):
 * mahrFactor(1395, 1405).factor → 19.616   (1961.6 ÷ 100)
 * calculateMahr({ cashAmount: 50_000_000, marriageYear: 1395, paymentYear: 1405 }).total → 980_800_000
 * calculateMahr({ cashAmount: 1_000_000, marriageYear: 1404, paymentYear: 1405 }).total → 1_000_000  (ضریب ۱)
 * calculateMahr({ cashAmount: 1_000_000, marriageYear: 1405, paymentYear: 1405 }).total → 1_000_000
 * calculateMahr({ cashAmount: 50_000_000, marriageYear: 1395, paymentYear: 1405,
 *   partialPayments: [{ amount: 43_704_200, year: 1401 }] }).total → 784_640_000
 *   (۴۳٬۷۰۴٬۲۰۰ در ۱۴۰۱ با شاخص ۱۴۰۰=۴۳۷٫۰۴۲ ≈ ۱۰ میلیون به ارزش ۱۳۹۵؛ باقی ۴۰ میلیون × ۱۹٫۶۱۶)
 * calculateMahr({ marriageYear: 1400, paymentYear: 1405, items: [{ kind: "full", quantity: 120, unitPrice: 1 }] }, 1)
 *   .coinEquivalent.overCap → true
 */
