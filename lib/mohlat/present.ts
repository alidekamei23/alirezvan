/**
 * Display helpers for the legal-deadline calculator: today's date in Tehran, the form's
 * state and how it becomes a MohlatInput, extra holidays typed by the visitor, the
 * remaining-days pill, the month grid of the calendar and the plain-text summary that
 * «کپی نتیجه» copies. Every date conversion goes through mohlat-calc.ts.
 */
import { ESTIMATE_DISCLAIMER } from "@/content/legal";
import { toLatinDigits, toPersianDigits } from "@/lib/format";
import {
  CATEGORY_LAWS,
  CATEGORY_TITLES,
  DEADLINES,
  MONTHS,
  fromGregorian,
  holidayReason,
  label,
  monthLength,
  toJdn,
  weekday,
  type Category,
  type Deadline,
  type JDate,
  type MohlatInput,
  type MohlatResult,
} from "./mohlat-calc";

export type MohlatOk = Extract<MohlatResult, { ok: true }>;
export type Law = Category | "custom";
export type Mode = "deadline" | "earliest";

export const LAW_LABELS: Record<Law, string> = { ...CATEGORY_TITLES, custom: "مهلت دلخواه" };
export const LAWS = Object.keys(LAW_LABELS) as Law[];

export const MODE_LABELS: Record<Mode, string> = {
  deadline: "آخرین مهلت",
  earliest: "حداقل فاصله",
};

/** Years offered in the start-date dropdown. */
export const FIRST_YEAR = 1400;
export const LAST_YEAR = 1410;

/** Today in Tehran, from the browser's clock. Client only: the server has no "today". */
export function tehranToday(now = new Date()): JDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return fromGregorian(get("year"), get("month"), get("day"));
}

export const sameDate = (a: JDate, b: JDate) => a.y === b.y && a.m === b.m && a.d === b.d;

export type MohlatForm = {
  law: Law;
  /** The chosen deadline of each law, so switching back keeps it. */
  items: Record<Category, string>;
  /** null until the visitor picks a date; the calculator then uses today. */
  start: JDate | null;
  abroad: boolean;
  thursdayOff: boolean;
  /** «روز اقدام برای همه مهلت‌ها حذف شود»; sent as strict445 = !value. */
  skipActionAlways: boolean;
  extraHolidays: string;
  customDays: string;
  customMode: Mode;
  customFromNotice: boolean;
};

const firstOf = (category: Category) => DEADLINES.find((d) => d.category === category)!.id;

/** Opens on civil appeal (تجدیدنظرخواهی), counted from today. */
export function initialForm(): MohlatForm {
  return {
    law: "civil",
    items: {
      civil: DEADLINES.find((d) => d.category === "civil" && d.title === "تجدیدنظرخواهی")!.id,
      criminal: firstOf("criminal"),
      enforcement: firstOf("enforcement"),
    },
    start: null,
    abroad: false,
    thursdayOff: false,
    skipActionAlways: false,
    extraHolidays: "",
    customDays: "",
    customMode: "deadline",
    customFromNotice: true,
  };
}

export function selectedDeadline(form: MohlatForm): Deadline | null {
  if (form.law === "custom") return null;
  return DEADLINES.find((d) => d.id === form.items[form.law as Category]) ?? null;
}

/** «۲۰ روز», «۲۰ + ۲۰ روز» */
export function daysText(days: number[]): string {
  return `${toPersianDigits(days.join(" + "))} روز`;
}

/** Whether a Jalali date exists (e.g. not 31 Mehr). */
export function isRealDate(date: JDate): boolean {
  if (!Number.isInteger(date.y) || date.m < 1 || date.m > 12 || date.d < 1) return false;
  return date.d <= monthLength(date.y, date.m);
}

/**
 * Extra holidays typed as «۱۴۰۵/۷/۲۲، ۱۴۰۵/۰۸/۰۱» (Persian or Latin digits, separated by
 * commas or spaces). Returns them as "1405/07/22", plus the parts that are not dates.
 */
export function parseExtraHolidays(text: string): { dates: string[]; invalid: string[] } {
  const dates: string[] = [];
  const invalid: string[] = [];
  for (const token of toLatinDigits(text).split(/[\s,،]+/).filter(Boolean)) {
    const match = /^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/.exec(token);
    const date = match && { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
    if (!date || !isRealDate(date)) {
      invalid.push(toPersianDigits(token));
      continue;
    }
    dates.push(`${date.y}/${String(date.m).padStart(2, "0")}/${String(date.d).padStart(2, "0")}`);
  }
  return { dates, invalid };
}

/** The days typed for a custom deadline; null while empty or not a whole number. */
export function parseCustomDays(text: string): number | null {
  const latin = toLatinDigits(text).trim();
  if (!/^\d+$/.test(latin)) return null;
  return Number(latin);
}

export function toMohlatInput(form: MohlatForm, start: JDate, today: JDate | null): MohlatInput {
  const { dates } = parseExtraHolidays(form.extraHolidays);
  const input: MohlatInput = {
    itemId: form.law === "custom" ? "custom" : form.items[form.law],
    start,
    thursdayOff: form.thursdayOff,
    extraHolidays: dates,
    strict445: !form.skipActionAlways,
    ...(today ? { today } : {}),
  };
  if (form.law === "custom") {
    input.customDays = parseCustomDays(form.customDays) ?? 0;
    input.customMode = form.customMode;
    input.customFromNotice = form.customFromNotice;
  } else input.abroad = form.abroad;
  return input;
}

/** Text from the logic with Persian digits (dates, day counts, article numbers). */
export const faText = (text: string) => toPersianDigits(text);
export const faLabel = (date: JDate) => toPersianDigits(label(date));

export function resultHeading(mode: Mode): string {
  return mode === "earliest"
    ? "زودترین تاریخ مجاز (از ابتدای روز)"
    : "آخرین روز مهلت (تا پایان وقت اداری)";
}

export type Tone = "neutral" | "warning" | "danger" | "success";

/** The pill under the date: how far today is from the end. */
export function remainingPill(remaining: number | null, mode: Mode): { text: string; tone: Tone } | null {
  if (remaining === null) return null;
  const n = toPersianDigits(Math.abs(remaining));
  if (mode === "earliest") {
    if (remaining > 0) return { text: `${n} روز مانده`, tone: "neutral" };
    if (remaining === 0) return { text: "از امروز مجاز است", tone: "success" };
    return { text: `از ${n} روز پیش مجاز است`, tone: "success" };
  }
  if (remaining > 3) return { text: `${n} روز مانده`, tone: "neutral" };
  if (remaining > 0) return { text: `${n} روز مانده`, tone: "warning" };
  if (remaining === 0) return { text: "امروز آخرین روز است", tone: "warning" };
  return { text: `مهلت ${n} روز پیش تمام شده`, tone: "danger" };
}

/* ───────── Calendar ───────── */

export type CalendarDay = {
  date: JDate;
  /** Full Persian label for screen readers. */
  label: string;
  holiday: string | null;
  isStart: boolean;
  isEnd: boolean;
  isToday: boolean;
  /** Strictly between start and end. */
  inRange: boolean;
};

/**
 * One Jalali month as weeks of seven cells starting on Saturday; null cells pad the first
 * and last week.
 */
export function monthGrid(
  y: number,
  m: number,
  marks: { start: JDate; end: JDate; today: JDate | null; thursdayOff: boolean; extraHolidays: string[] },
): (CalendarDay | null)[][] {
  const length = monthLength(y, m);
  const first = toJdn({ y, m, d: 1 });
  const startJdn = toJdn(marks.start);
  const endJdn = toJdn(marks.end);
  const cells: (CalendarDay | null)[] = Array.from({ length: weekday(first) }, () => null);
  for (let d = 1; d <= length; d++) {
    const jdn = first + d - 1;
    const date = { y, m, d };
    cells.push({
      date,
      label: faLabel(date),
      holiday: holidayReason(jdn, {
        thursdayOff: marks.thursdayOff,
        extraHolidays: marks.extraHolidays,
      }),
      isStart: jdn === startJdn,
      isEnd: jdn === endJdn,
      isToday: marks.today !== null && sameDate(date, marks.today),
      inRange: jdn > Math.min(startJdn, endJdn) && jdn < Math.max(startJdn, endJdn),
    });
  }
  while (cells.length % 7) cells.push(null);
  const weeks: (CalendarDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** The month before or after (delta −1 or +1). */
export function shiftMonth(y: number, m: number, delta: number): { y: number; m: number } {
  const index = y * 12 + (m - 1) + delta;
  return { y: Math.floor(index / 12), m: (index % 12) + 1 };
}

export const monthTitle = (y: number, m: number) => `${MONTHS[m - 1]} ${toPersianDigits(y)}`;

/** The weekday of a date, from the engine's calendar. */
export const weekdayOf = (date: JDate) => weekday(toJdn(date));

/** Jalali "1405/07/22" key → date. */
export function parseKey(key: string): JDate {
  const [y, m, d] = key.split("/").map(Number);
  return { y, m, d };
}

/* ───────── Copied summary ───────── */

export function buildSummary(
  result: MohlatOk,
  form: MohlatForm,
  start: JDate,
  startTitle: string,
): string {
  const item = result.item;
  const lines = [
    "محاسبه مهلت قانونی",
    `مهلت: ${faText(result.title)}`,
    ...(item
      ? [`ماده: ${item.article}، ${CATEGORY_LAWS[item.category]}`]
      : [`نوع: ${MODE_LABELS[result.mode]}`]),
    `مدت: ${daysText(result.days)}${form.abroad && item ? " (مقیم خارج از کشور)" : ""}`,
    `${startTitle}: ${faLabel(start)}`,
    `${resultHeading(result.mode)}: ${faText(result.endLabel)}`,
  ];
  const pill = remainingPill(result.remaining, result.mode);
  if (pill) lines.push(`وضعیت امروز: ${pill.text}`);
  lines.push("", "روند محاسبه:", ...result.trace.map((step, i) => `${toPersianDigits(i + 1)}. ${faText(step)}`));
  if (result.warnings.length) lines.push("", "هشدار:", ...result.warnings.map((w) => `- ${faText(w)}`));
  if (result.notes.length) lines.push("", "نکته‌ها:", ...result.notes.map((n) => `- ${faText(n)}`));
  lines.push("", ESTIMATE_DISCLAIMER);
  return lines.join("\n");
}
