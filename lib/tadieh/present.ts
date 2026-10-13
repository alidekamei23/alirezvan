/**
 * Display helpers for the late-payment damages calculator: labels and the plain-text
 * summary that «کپی نتیجه» copies. The calculation itself lives in tadieh-calc.ts and is
 * not repeated here.
 */
import { ESTIMATE_DISCLAIMER } from "@/content/legal";
import { toPersianDigits } from "@/lib/format";
import {
  MONTH_NAMES,
  formatRial,
  numberToWords,
  type Basis,
  type CalcResult,
  type JalaliMonth,
} from "./tadieh-calc";
import { INDEX_SOURCE } from "./tadieh-index";

export const BASIS_LABELS: Record<Basis, string> = {
  monthly: "شاخص ماهانه",
  annual: "میانگین سالانه شاخص",
};

/** 3452.1 → «۳۴۵۲٫۱» */
export function formatIndex(value: number): string {
  return toPersianDigits(String(value)).replace(".", "٫");
}

/** 3.89715 → «۳٫۸۹۷» */
export function formatFactor(value: number): string {
  return toPersianDigits(value.toFixed(3)).replace(".", "٫");
}

/** «خرداد ۱۴۰۲», or «سال ۱۴۰۲» when the annual average is the basis. */
export function periodLabel(date: JalaliMonth, basis: Basis): string {
  return toPersianDigits(
    basis === "annual" ? `سال ${date.year}` : `${MONTH_NAMES[date.month]} ${date.year}`,
  );
}

export const rial = (value: number) => `${formatRial(value)} ریال`;

/** Rials shown as tomans, rounded to a whole toman. */
export const tomanEquivalent = (rials: number) => `${formatRial(rials / 10)} تومان`;

/** The full result as plain text, with the indices and the basis that produced it. */
export function buildSummary(result: Extract<CalcResult, { ok: true }>): string {
  const { basis, rows } = result;
  const lines = [
    "برآورد خسارت تأخیر تأدیه",
    `ملاک: ${BASIS_LABELS[basis]}`,
    `زمان پرداخت: ${periodLabel(result.payment, basis)} (شاخص ${formatIndex(result.paymentIndex)})`,
    "",
  ];
  rows.forEach((row, i) => {
    const prefix = rows.length > 1 ? toPersianDigits(`ردیف ${i + 1}: `) : "";
    lines.push(
      `${prefix}اصل ${rial(row.principal)}، سررسید ${periodLabel(row.due, basis)} ` +
        `(شاخص ${formatIndex(row.dueIndex)})، ضریب ${formatFactor(row.factor)}، ` +
        `خسارت ${rial(row.damage)}`,
    );
  });
  lines.push("");
  if (rows.length > 1) lines.push(`جمع اصل دین: ${rial(result.totalPrincipal)}`);
  lines.push(
    `خسارت تأخیر تأدیه: ${rial(result.totalDamage)} (${numberToWords(result.totalDamage)} ریال)`,
    `معادل: ${tomanEquivalent(result.totalDamage)}`,
    `مبلغ قابل پرداخت: ${rial(result.grandTotal)}`,
  );
  if (result.warnings.length > 0) {
    lines.push("", ...result.warnings.map((warning) => `توجه: ${toPersianDigits(warning)}`));
  }
  lines.push("", `منبع شاخص: ${INDEX_SOURCE}`, ESTIMATE_DISCLAIMER);
  return lines.join("\n");
}
