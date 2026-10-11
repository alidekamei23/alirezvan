import { toLatinDigits } from "@/lib/format";

/**
 * Cleans a typed Iranian mobile number: Persian/Arabic digits become Latin, spaces and
 * dashes are dropped, and +98 / 0098 / 98 prefixes become a leading 0.
 * The result is not guaranteed to be valid; check it with `isValidMobile`.
 */
export function normalizeMobile(input: string): string {
  let digits = toLatinDigits(input).replace(/\D/g, "");
  if (digits.startsWith("0098")) digits = digits.slice(4);
  else if (digits.startsWith("98") && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith("9")) digits = `0${digits}`;
  return digits.slice(0, 11);
}

/** True for 09xxxxxxxxx (Latin digits). */
export function isValidMobile(value: string): boolean {
  return /^09\d{9}$/.test(value);
}
