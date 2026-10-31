// Display helpers of the diyeh calculator (/tools/diyeh): which items fit the victim, the
// engine input built from the form, adding a row (merged and checked by the engine first)
// and the copied summary. Every amount, fraction and rule comes from diyeh-calc.ts and
// diyeh-data.ts (supplied, reference-tested and kept unchanged); nothing is restated here.
import { ESTIMATE_DISCLAIMER } from "@/content/legal";
import { normalizePersian, toPersianDigits } from "@/lib/format";
import { rial } from "@/lib/tadieh/present";
import {
  CATEGORIES,
  CRIME_TYPES,
  ITEMS,
  LATEST_RATE_YEAR,
  VICTIMS,
  calculateDiyeh,
  formatRial,
  fracText,
  numberToWords,
  parseAmount,
  type DiyehInput,
  type DiyehResult,
  type Line,
  type Victim,
} from "./diyeh-calc";
import type { CrimeType, Item } from "./diyeh-data";

export type DiyehOk = Extract<DiyehResult, { ok: true }>;
type Frac = [number, number];

/** The killing itself: not an item of ITEMS, but listed first as its own category. */
export const NAFS = "nafs";
export const NAFS_TITLE = "قتل (نفس)";

export const VICTIM_KEYS = Object.keys(VICTIMS) as Victim[];
export const CRIME_KEYS = Object.keys(CRIME_TYPES) as CrimeType[];

export type DiyehSettings = {
  victim: Victim;
  year: number;
  /** As typed; empty means the rate of `year`. */
  customRate: string;
  crimeType: CrimeType | "";
  haram: boolean;
  deceased: boolean;
  apply560: boolean;
};

export const initialSettings = (): DiyehSettings => ({
  victim: "male",
  year: LATEST_RATE_YEAR,
  customRate: "",
  crimeType: "",
  haram: false,
  deceased: false,
  apply560: true,
});

/** One added injury. `title` and `art` are the engine's, kept for when the result fails. */
export type DiyehRow = { key: number; line: Line; title: string; art: string };

/** The custom full-diyeh rate: none when empty, an error when it is not a positive amount. */
export function customRateValue(text: string): { rate?: number; error?: string } {
  if (text.trim() === "") return {};
  const rate = parseAmount(text);
  return rate > 0 ? { rate } : { error: "نرخ را به ریال و با عدد وارد کنید." };
}

export function toDiyehInput(settings: DiyehSettings, lines: Line[]): DiyehInput {
  const { rate } = customRateValue(settings.customRate);
  return {
    year: settings.year,
    ...(rate !== undefined && { rate }),
    victim: settings.victim,
    haram: settings.haram,
    crimeType: settings.crimeType || undefined,
    deceased: settings.deceased,
    apply560ToWounds: settings.apply560,
    lines,
  };
}

/** The engine's own reading of a count: a whole number, at least one. */
export const qtyOf = (line: Line) => Math.max(1, Math.floor(("qty" in line && line.qty) || 1));

/**
 * Adds `line` to the rows: the same item again raises the count of its row instead of
 * adding one. The new list goes through the engine first; when it fails (two necks,
 * three eyes…) nothing is added and the engine's message is returned.
 */
export function addLine(
  rows: DiyehRow[],
  line: Line,
  settings: DiyehSettings,
  key: number,
): { ok: true; rows: DiyehRow[] } | { ok: false; error: string } {
  const same =
    line.type === "item"
      ? rows.findIndex((row) => row.line.type === "item" && row.line.id === line.id)
      : -1;
  const next: DiyehRow[] =
    same >= 0
      ? rows.map((row, index) =>
          index === same && line.type === "item"
            ? { ...row, line: { ...line, qty: qtyOf(row.line) + qtyOf(line) } }
            : row,
        )
      : [...rows, { key, line, title: "", art: "" }];
  const result = calculateDiyeh(toDiyehInput(settings, next.map((row) => row.line)));
  if (!result.ok) return { ok: false, error: result.error };
  const at = same >= 0 ? same : next.length - 1;
  return {
    ok: true,
    rows: next.map((row, index) =>
      index === at ? { ...row, title: result.lines[at].title, art: result.lines[at].art } : row,
    ),
  };
}

/** The result of the current rows, or null while there are none (an empty list is not an error). */
export function calculateRows(settings: DiyehSettings, rows: DiyehRow[]): DiyehResult | null {
  return rows.length === 0
    ? null
    : calculateDiyeh(toDiyehInput(settings, rows.map((row) => row.line)));
}

const FEMALE_SIDE: Victim[] = ["female", "khonsaFemale", "khonsaMoshkel"];
const MALE_SIDE: Victim[] = ["male", "khonsaMale"];

/**
 * Whether an item means anything for this victim. Male-only sexual items stay for a
 * khonsa attached to women and a khonsa moshkel, for whom the engine returns arsh.
 */
export function itemFits(item: Item, victim: Victim): boolean {
  if (item.sex === "f") return FEMALE_SIDE.includes(victim);
  if (item.sex === "m") {
    return (
      MALE_SIDE.includes(victim) ||
      (item.cat === "sexual" && (victim === "khonsaFemale" || victim === "khonsaMoshkel"))
    );
  }
  return true;
}

export const itemsFor = (category: string, victim: Victim) =>
  ITEMS.filter((item) => item.cat === category && itemFits(item, victim));

/** «قتل (نفس)» first, then every category that has an item for this victim. */
export function categoriesFor(victim: Victim): { id: string; title: string }[] {
  return [
    { id: NAFS, title: NAFS_TITLE },
    ...CATEGORIES.filter((category) => itemsFor(category.id, victim).length > 0),
  ];
}

/** «۱/۲» — a fraction for a table cell. */
export const fracLabel = (frac: Frac) => toPersianDigits(fracText(frac));

/** «۱/۲ دیه کامل», «دیه کامل زن» — a fraction in a sentence. */
export function fracPhrase(frac: Frac, ofWoman = false): string {
  const text = frac[1] === 1 ? fracText(frac) : `${fracText(frac)} دیه کامل`;
  return toPersianDigits(ofWoman ? `${text} زن` : text);
}

/** The diyeh of a fixed item as the law states it, before the victim's sex is applied. */
export function itemFracPhrase(item: Item): string | null {
  return item.num && item.den ? fracPhrase([item.num, item.den], item.base === "female") : null;
}

/** Formats a typed rial amount once the field is left; leaves anything else as typed. */
export function formatAmountText(text: string): string {
  const value = parseAmount(text);
  return text.trim() !== "" && value > 0 ? formatRial(value) : text;
}

/** User text (a description of an arsh): Persian letters, trimmed; undefined when empty. */
export const cleanTitle = (text: string) => normalizePersian(text).trim() || undefined;

export const dueText = (days: number) => `حدود ${toPersianDigits(days)} روز پس از وقوع`;

/** An amount cell: arsh rows without an amount say so instead of «۰». */
export function lineAmountText(line: DiyehOk["lines"][number]): string {
  return line.kind === "arsh" && line.amount === 0 ? "تعیین نشده" : formatRial(line.amount);
}

export function buildSummary(result: DiyehOk, settings: DiyehSettings): string {
  const custom = customRateValue(settings.customRate).rate !== undefined;
  const lines = [
    "برآورد دیه",
    `مجنی‌علیه: ${VICTIMS[settings.victim]}`,
    `نرخ دیه کامل: ${rial(result.rate)} (${custom ? "نرخ دلخواه" : `سال ${toPersianDigits(settings.year)}`})`,
  ];
  if (settings.crimeType) lines.push(`نوع جنایت: ${CRIME_TYPES[settings.crimeType].title}`);
  if (settings.haram) lines.push("قتل در ماه حرام یا حرم مکه");
  if (settings.deceased) lines.push("جنایت بر میت");
  lines.push("", "صدمه‌ها:");
  result.lines.forEach((line, index) => {
    const count = line.qty > 1 ? ` (${toPersianDigits(line.qty)} مورد)` : "";
    const amount = line.kind === "arsh" && line.amount === 0 ? "ارش، تعیین نشده" : rial(line.amount);
    const fund = line.fund > 0 ? `؛ سهم صندوق ${rial(line.fund)}` : "";
    lines.push(`${toPersianDigits(index + 1)}. ${line.title}${count}: ${amount}${fund}`);
  });
  lines.push(
    "",
    `سهم پرداخت‌کننده دیه: ${rial(result.payerTotal)} (${numberToWords(result.payerTotal)} ریال)`,
    `سهم صندوق تأمین خسارت‌های بدنی: ${rial(result.fundTotal)}`,
    `جمع دریافتی: ${rial(result.victimTotal)}`,
  );
  const payment = result.payment;
  if (payment) {
    lines.push("", `پرداخت‌کننده: ${payment.payer}`);
    if (payment.crimeType === "khata" && payment.offenderShare > 0) {
      lines.push(
        `سهم عاقله: ${rial(payment.aqelehShare)}`,
        `سهم خود مرتکب: ${rial(payment.offenderShare)}`,
      );
    }
    for (const installment of payment.installments) {
      lines.push(
        `قسط ${toPersianDigits(installment.year)}: ${rial(installment.amount)}، ${dueText(installment.dueDays)}`,
      );
    }
    lines.push(`مبنا: ${payment.art}`);
  }
  lines.push("", ESTIMATE_DISCLAIMER);
  return lines.join("\n");
}
