import { getDaysInMonth, newDate } from "date-fns-jalali";
import { toPersianDigits } from "@/lib/format";

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export type JalaliDate = { year: number; month: number; day: number };

/** Number of days in a Jalali month (month is 1–12). */
export function daysInJalaliMonth(year: number, month: number): number {
  return getDaysInMonth(newDate(year, month - 1, 1));
}

/** Parses "1405-07-19" (Latin digits). Returns null if it is not a real Jalali date. */
export function parseJalali(value: string): JalaliDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInJalaliMonth(year, month)) return null;
  return { year, month, day };
}

/** Serialises to "1405-07-19" (Latin digits), the format we store and compute with. */
export function toJalaliString({ year, month, day }: JalaliDate): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** "1405-07-19" → «۱۹ مهر ۱۴۰۵». Returns the input unchanged if it is not a valid date. */
export function formatJalali(value: string): string {
  const date = parseJalali(value);
  if (!date) return value;
  return toPersianDigits(
    `${date.day} ${JALALI_MONTHS[date.month - 1]} ${date.year}`,
  );
}

/** "1405-07-19" → "2026-10-11", for the `dateTime` attribute of <time>. */
export function jalaliToGregorianISO(value: string): string | null {
  const date = parseJalali(value);
  if (!date) return null;
  const g = newDate(date.year, date.month - 1, date.day);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${g.getFullYear()}-${pad(g.getMonth() + 1)}-${pad(g.getDate())}`;
}

/** "2026-10-11" → "1405-07-19". Returns null if it is not a real Gregorian date. */
export function gregorianISOToJalali(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
    timeZone: "UTC",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(Date.UTC(year, month - 1, day));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return toJalaliString({ year: get("year"), month: get("month"), day: get("day") });
}

/** Today's Jalali date in Tehran, whatever the server's own time zone is. */
export function todayJalali(now: Date = new Date()): JalaliDate {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}
