const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Persian thousands separator (U+066C), as in «۱۲٬۵۰۰٬۰۰۰». */
export const THOUSANDS_SEPARATOR = "٬";

/** Converts Latin and Arabic-Indic digits to Persian digits. Display only. */
export function toPersianDigits(input: string | number): string {
  return String(input)
    .replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)])
    .replace(/[٠-٩]/g, (d) => PERSIAN_DIGITS[ARABIC_DIGITS.indexOf(d)]);
}

/** Converts Persian and Arabic-Indic digits to Latin digits. Use before storing or computing. */
export function toLatinDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

/**
 * Normalises Persian text: Arabic ي/ى and ك become Persian ی and ک.
 * ZWNJ is kept as is.
 */
export function normalizePersian(input: string): string {
  return input.replace(/[يى]/g, "ی").replace(/ك/g, "ک");
}

/** Normalises free-text user input: Persian letters, Latin digits, trimmed. */
export function normalizeInput(input: string): string {
  return toLatinDigits(normalizePersian(input)).trim();
}

/**
 * Parses a whole number typed with Persian, Arabic-Indic or Latin digits and any
 * common thousands separator. Returns null when the input is not a whole number.
 */
export function parseNumber(input: string): number | null {
  const cleaned = toLatinDigits(input).replace(/[\s,٬،]/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isSafeInteger(value) ? value : null;
}

/** Formats a whole number with Persian digits and thousands separators. */
export function formatNumber(value: number): string {
  const rounded = Math.round(value);
  const grouped = String(Math.abs(rounded)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    THOUSANDS_SEPARATOR,
  );
  return toPersianDigits(rounded < 0 ? `-${grouped}` : grouped);
}

/** Formats an amount in tomans, e.g. «۱۲٬۵۰۰٬۰۰۰ تومان». */
export function formatToman(value: number): string {
  return `${formatNumber(value)} تومان`;
}
