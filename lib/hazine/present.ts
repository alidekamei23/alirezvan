/**
 * Display helpers for the court-fee calculator: the plain-text summary that «کپی نتیجه»
 * copies. The calculation itself lives in hazine-calc.ts and is not repeated here.
 */
import { ESTIMATE_DISCLAIMER } from "@/content/legal";
import { toPersianDigits } from "@/lib/format";
import { rial, tomanEquivalent } from "@/lib/tadieh/present";
import { STAGES, numberToWords, type CourtFeeResult } from "./hazine-calc";
import { TARIFF_YEAR } from "./hazine-tariff";

export const TARIFF_YEAR_LABEL = toPersianDigits(TARIFF_YEAR);

/** «یک میلیارد ریال، معادل ۱۰۰٬۰۰۰٬۰۰۰ تومان» */
export function amountInWords(rials: number): string {
  return `${numberToWords(rials)} ریال، معادل ${tomanEquivalent(rials)}`;
}

/** The full result as plain text, with the tariff year that produced it. */
export function buildSummary(result: CourtFeeResult): string {
  const stage = STAGES[result.stage];
  const lines = [
    `برآورد هزینه دادرسی (تعرفه سال ${TARIFF_YEAR_LABEL})`,
    `مرحله: ${stage.title}`,
    `${stage.basisLabel}: ${rial(result.amount)}`,
    "",
  ];
  for (const line of result.lines) {
    lines.push(`${line.label}: ${rial(line.amount)}`);
    if (line.detail) lines.push(`  ${line.detail}`);
  }
  lines.push(
    "",
    `جمع کل: ${rial(result.total)} (${numberToWords(result.total)} ریال)`,
    `معادل: ${tomanEquivalent(result.total)}`,
    "",
    ESTIMATE_DISCLAIMER,
  );
  return lines.join("\n");
}
