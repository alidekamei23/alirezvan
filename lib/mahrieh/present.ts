/**
 * Display helpers for the mahr calculator: Persian digits for the strings the logic
 * returns, index and factor formatting, and the plain-text summary that «کپی نتیجه»
 * copies. The calculation itself lives in mahrieh-calc.ts and is not repeated here.
 */
import { ESTIMATE_DISCLAIMER } from "@/content/legal";
import { toPersianDigits } from "@/lib/format";
import { formatIndex, rial, tomanEquivalent } from "@/lib/tadieh/present";
import { COIN_CAP, annualIndex, numberToWords, type MahrResult } from "./mahrieh-calc";

type MahrOk = Extract<MahrResult, { ok: true }>;

/** Persian digits and the Persian decimal separator for text built by the logic. */
export function faText(text: string): string {
  return toPersianDigits(text).replace(/([۰-۹])\.([۰-۹])/g, "$1٫$2");
}

/** «۱۹٫۶۱۶۰» */
export function formatMahrFactor(value: number): string {
  return faText(value.toFixed(4));
}

/** «شاخص ۱۴۰۴: ۱٬۹۶۱٫۶» or a note that the year's average is not complete. */
export function yearIndexLabel(year: number): string {
  const index = annualIndex(year);
  const yearLabel = toPersianDigits(year);
  return index == null
    ? `میانگین شاخص سال ${yearLabel} هنوز کامل نشده است.`
    : `شاخص سال ${yearLabel}: ${formatIndex(index)}`;
}

/** «یک میلیارد ریال، معادل ۱۰۰٬۰۰۰٬۰۰۰ تومان» */
export function amountInWords(rials: number): string {
  return `${numberToWords(rials)} ریال، معادل ${tomanEquivalent(rials)}`;
}

/** «حدود ۱۲۰٫۵ سکه تمام» */
export function coinsLabel(coins: number): string {
  return `حدود ${faText(coins.toFixed(1))} سکه تمام`;
}

export function capStatus(overCap: boolean): string {
  return overCap
    ? `بیش از سقف ${toPersianDigits(COIN_CAP)} سکه؛ برای مازاد، ملائت زوج ملاک است`
    : `در سقف ${toPersianDigits(COIN_CAP)} سکه`;
}

/** The full result as plain text: years, indices, factor, items and total. */
export function buildSummary(
  result: MahrOk,
  years: { marriageYear: number; paymentYear: number },
): string {
  const lines = [
    "برآورد مهریه به نرخ روز",
    `سال عقد: ${toPersianDigits(years.marriageYear)}`,
    `سال پرداخت: ${toPersianDigits(years.paymentYear)}`,
  ];
  if (result.cash) {
    const { factor } = result.cash;
    lines.push(
      `شاخص سال عقد: ${factor.marriageIndex == null ? "—" : formatIndex(factor.marriageIndex)}`,
      `شاخص ملاک پرداخت (سال ${toPersianDigits(factor.paymentIndexYear)}): ${formatIndex(factor.paymentIndex)}`,
      `ضریب: ${formatMahrFactor(factor.factor)}`,
      `مهریه نقدی عقدنامه: ${rial(result.cash.nominal)}`,
    );
    if (result.cash.paidAtMarriageValue > 0) {
      lines.push(
        `پرداخت‌های قبلی به ارزش سال عقد: ${rial(result.cash.paidAtMarriageValue)}`,
        `باقی‌مانده به ارزش سال عقد: ${rial(result.cash.remainingAtMarriageValue)}`,
      );
    }
  }
  lines.push("");
  for (const line of result.lines) {
    lines.push(`${faText(line.label)}: ${rial(line.amount)}`);
    if (line.detail) lines.push(`  ${faText(line.detail)}`);
  }
  lines.push(
    "",
    `جمع کل: ${rial(result.total)} (${numberToWords(result.total)} ریال)`,
    `معادل: ${tomanEquivalent(result.total)}`,
  );
  if (result.coinEquivalent) {
    lines.push(
      `معادل سکه: ${coinsLabel(result.coinEquivalent.coins)} (${capStatus(result.coinEquivalent.overCap)})`,
    );
  }
  for (const warning of result.warnings) lines.push(`توجه: ${faText(warning)}`);
  lines.push("", ESTIMATE_DISCLAIMER);
  return lines.join("\n");
}
