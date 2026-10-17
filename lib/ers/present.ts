/**
 * Display helpers for the inheritance-share calculator: the form's state and how it
 * becomes an ErsInput, the status pill of each class of heirs, fractions and percentages
 * for display, and the plain-text summary that «کپی نتیجه» copies. The inheritance rules
 * live in ers-calc.ts and are not repeated here.
 */
import { ESTIMATE_DISCLAIMER } from "@/content/legal";
import { formatToman, toPersianDigits } from "@/lib/format";
import type { Branch, ErsInput, ErsResult, Frac, Gender, Share, SiblingBranch } from "./ers-calc";

export type ErsOk = Extract<ErsResult, { ok: true }>;
export type Side = SiblingBranch["side"];

export type GrandchildRow = Branch & { id: number };
export type NephewRow = SiblingBranch & { id: number };

/** Counts on the form, keyed as in ErsInput. */
export const SIBLING_KEYS = [
  "fullBrothers",
  "fullSisters",
  "patBrothers",
  "patSisters",
  "matBrothers",
  "matSisters",
] as const;
export const GRANDPARENT_KEYS = [
  "patGrandfather",
  "patGrandmother",
  "matGrandfather",
  "matGrandmother",
] as const;
export const UNCLE_KEYS = [
  "ammuFull",
  "ammuPat",
  "ammuMat",
  "ammeFull",
  "ammePat",
  "ammeMat",
  "dayiFull",
  "dayiPat",
  "dayiMat",
  "khaleFull",
  "khalePat",
  "khaleMat",
] as const;

type SiblingKey = (typeof SIBLING_KEYS)[number];
type GrandparentKey = (typeof GRANDPARENT_KEYS)[number];
type UncleKey = (typeof UNCLE_KEYS)[number];

export type ErsForm = {
  deceased: Gender;
  wives: number;
  husband: boolean;
  father: boolean;
  mother: boolean;
  sons: number;
  daughters: number;
  pregnancy: boolean;
  grandchildren: GrandchildRow[];
  nephews: NephewRow[];
  /** In tomans; null when empty. */
  estate: number | null;
  debts: number | null;
  will: number | null;
  willApproved: boolean;
} & Record<SiblingKey | UncleKey, number> &
  Record<GrandparentKey, boolean>;

export function emptyForm(): ErsForm {
  return {
    deceased: "m",
    wives: 0,
    husband: false,
    father: false,
    mother: false,
    sons: 0,
    daughters: 0,
    pregnancy: false,
    grandchildren: [],
    nephews: [],
    estate: null,
    debts: null,
    will: null,
    willApproved: false,
    ...(Object.fromEntries(SIBLING_KEYS.map((key) => [key, 0])) as Record<SiblingKey, number>),
    ...(Object.fromEntries(UNCLE_KEYS.map((key) => [key, 0])) as Record<UncleKey, number>),
    ...(Object.fromEntries(GRANDPARENT_KEYS.map((key) => [key, false])) as Record<
      GrandparentKey,
      boolean
    >),
  };
}

/** The example the form opens with: a man survived by his wife, his mother, two sons and a daughter. */
export function sampleForm(): ErsForm {
  return { ...emptyForm(), wives: 1, mother: true, sons: 2, daughters: 1 };
}

export function toErsInput(form: ErsForm): ErsInput {
  const strip = <T extends { id: number }>(row: T): Omit<T, "id"> => {
    const { id, ...rest } = row;
    void id;
    return rest;
  };
  const input: ErsInput = {
    deceased: form.deceased,
    ...(form.deceased === "m" ? { wives: form.wives } : { husband: form.husband }),
    father: form.father,
    mother: form.mother,
    sons: form.sons,
    daughters: form.daughters,
    pregnancy: form.pregnancy,
    grandchildren: form.grandchildren.map(strip),
    nephews: form.nephews.map(strip),
    willApproved: form.willApproved,
  };
  for (const key of [...SIBLING_KEYS, ...UNCLE_KEYS]) input[key] = form[key];
  for (const key of GRANDPARENT_KEYS) input[key] = form[key];
  if (form.estate) {
    input.estate = form.estate;
    input.debts = form.debts ?? 0;
    input.will = form.will ?? 0;
  }
  return input;
}

const branchFilled = (row: Branch) => row.sons + row.daughters > 0;

export function hasSpouse(form: ErsForm): boolean {
  return form.deceased === "m" ? form.wives > 0 : form.husband;
}

/** Whether anything was entered in each class of heirs. */
export function classesEntered(form: ErsForm): Record<1 | 2 | 3, boolean> {
  return {
    1:
      form.father ||
      form.mother ||
      form.sons + form.daughters > 0 ||
      form.pregnancy ||
      form.grandchildren.some(branchFilled),
    2:
      SIBLING_KEYS.some((key) => form[key] > 0) ||
      GRANDPARENT_KEYS.some((key) => form[key]) ||
      form.nephews.some(branchFilled),
    3: UNCLE_KEYS.some((key) => form[key] > 0),
  };
}

export function hasAnyHeir(form: ErsForm): boolean {
  const entered = classesEntered(form);
  return hasSpouse(form) || entered[1] || entered[2] || entered[3];
}

export const CLASS_NAMES = { 1: "اول", 2: "دوم", 3: "سوم" } as const;

export type ClassStatus =
  | { kind: "none"; text: string }
  | { kind: "entered"; text: string }
  | { kind: "inherits"; text: string }
  | { kind: "excluded"; text: string };

/** The pill on each class heading. */
export function classStatus(
  tabaqe: 1 | 2 | 3,
  form: ErsForm,
  result: ErsResult | null,
): ClassStatus {
  if (!classesEntered(form)[tabaqe]) return { kind: "none", text: "وارد نشده" };
  if (!result?.ok) return { kind: "entered", text: "وارد شده" };
  if (result.tabaqe === tabaqe) return { kind: "inherits", text: "ارث می‌برد" };
  return {
    kind: "excluded",
    text: `ارث نمی‌برد (وجود طبقه ${CLASS_NAMES[result.tabaqe as 1 | 2 | 3]})`,
  };
}

/** «نتیجه — طبقه اول و زوجین» */
export function resultTitle(result: ErsOk, form: ErsForm): string {
  if (result.tabaqe === 0) {
    if (form.deceased === "f" && form.husband) return "نتیجه — فقط زوج";
    if (form.deceased === "m" && form.wives > 0) return "نتیجه — فقط زوجه";
    return "نتیجه — بدون وارث";
  }
  return `نتیجه — طبقه ${CLASS_NAMES[result.tabaqe]}${hasSpouse(form) ? " و زوجین" : ""}`;
}

/* ───────── Fractions and percentages ───────── */

/** A fraction with Persian digits, e.g. «۱۷/۶۰»; whole numbers have no denominator. */
export function fracText(n: bigint, d: bigint): string {
  return toPersianDigits(d === 1n ? n.toString() : `${n.toString()}/${d.toString()}`);
}

/** The fraction, or — with `lcd` — the same fraction over the common denominator. */
export function fracParts(value: Frac, lcd?: bigint): { n: bigint; d: bigint } {
  if (!lcd || lcd === 1n) return { n: value.n, d: value.d };
  return { n: value.n * (lcd / value.d), d: lcd };
}

export function fracDisplay(value: Frac, lcd?: bigint): string {
  const { n, d } = fracParts(value, lcd);
  // Over a common denominator, 1 is still shown as «۱۲/۱۲».
  return lcd && lcd !== 1n ? toPersianDigits(`${n}/${d}`) : fracText(n, d);
}

/** 0.28333 → «۲۸٫۳۳٪»; at most two decimals, trailing zeros dropped. */
export function percentText(value: Frac): string {
  const pct = Math.round(value.toNumber() * 10000) / 100;
  return `${toPersianDigits(String(pct)).replace(".", "٫")}٪`;
}

/** Wraps text in left-to-right isolates so a fraction keeps its order in copied RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

export const HAKEM_LABEL = "حاکم (در حکم مال بلاوارث)";
export const HAKEM_BASIS = "مواد ۸۶۶ و ۹۴۹";

/* ───────── Copied summary ───────── */

function heirsLine(form: ErsForm): string {
  const parts: string[] = [];
  const count = (label: string, n: number) => n > 0 && parts.push(`${label}: ${toPersianDigits(n)}`);
  if (form.deceased === "m") count("زوجه دائم", form.wives);
  else if (form.husband) parts.push("زوج");
  if (form.father) parts.push("پدر");
  if (form.mother) parts.push("مادر");
  count("پسر", form.sons);
  count("دختر", form.daughters);
  if (form.pregnancy) parts.push("حمل");
  form.grandchildren.filter(branchFilled).forEach((row) =>
    parts.push(
      `نوه از ${row.via === "m" ? "پسر" : "دختر"} فوت‌شده (پسر ${toPersianDigits(row.sons)}، دختر ${toPersianDigits(row.daughters)})`,
    ),
  );
  for (const key of SIBLING_KEYS) count(SIBLING_LABELS[key], form[key]);
  for (const key of GRANDPARENT_KEYS) if (form[key]) parts.push(GRANDPARENT_LABELS[key]);
  form.nephews.filter(branchFilled).forEach((row) =>
    parts.push(
      `اولاد ${row.via === "m" ? "برادر" : "خواهر"} ${SIDE_LABELS[row.side]} فوت‌شده (پسر ${toPersianDigits(row.sons)}، دختر ${toPersianDigits(row.daughters)})`,
    ),
  );
  for (const key of UNCLE_KEYS) count(UNCLE_LABELS[key], form[key]);
  return parts.join("، ");
}

export function buildSummary(result: ErsOk, form: ErsForm, useLcd = false): string {
  const lcd = useLcd ? result.lcd : undefined;
  const lines: string[] = [
    "محاسبه سهم‌الارث (قانون مدنی)",
    resultTitle(result, form),
    `متوفی: ${form.deceased === "m" ? "مرد" : "زن"}`,
    `وراث واردشده: ${heirsLine(form) || "—"}`,
  ];
  if (result.money) {
    const m = result.money;
    lines.push(
      "",
      `ترکه: ${formatToman(m.estate)}`,
      `دیون و هزینه‌ها: ${formatToman(m.debts)}`,
      `وصیت نافذ: ${formatToman(m.will)}`,
      `قابل تقسیم: ${formatToman(m.net)}`,
    );
  }
  lines.push("", useLcd ? `سهم‌ها (مخرج مشترک ${toPersianDigits(String(result.lcd))}):` : "سهم‌ها:");
  for (const share of colorShares(result.shares)) {
    let line = `- ${share.label}${share.count > 1 ? ` (${toPersianDigits(share.count)} نفر)` : ""}: هر نفر ${ltr(fracDisplay(share.each, lcd))} (${percentText(share.each)})`;
    if (share.count > 1) line += `، جمع ${ltr(fracDisplay(share.total, lcd))}`;
    if (result.money) line += `، مبلغ هر نفر ${formatToman(result.money.perShare(share).each)}`;
    line += ` — ${share.basis}`;
    if (share.reserved) line += " (کنار گذاشته)";
    lines.push(line);
  }
  if (!result.hakem.isZero()) {
    let line = `- ${HAKEM_LABEL}: ${ltr(fracDisplay(result.hakem, lcd))} (${percentText(result.hakem)})`;
    if (result.money) line += `، ${formatToman(Math.round(result.hakem.toNumber() * result.money.net))}`;
    lines.push(`${line} — ${HAKEM_BASIS}`);
  }
  if (result.warnings.length) lines.push("", "هشدار:", ...result.warnings.map((w) => `- ${toPersianDigits(w)}`));
  if (result.notes.length) lines.push("", "نکته‌ها:", ...result.notes.map((n) => `- ${toPersianDigits(n)}`));
  lines.push("", ESTIMATE_DISCLAIMER);
  return lines.join("\n");
}

/* ───────── Labels ───────── */

export const SIDE_LABELS: Record<Side, string> = {
  full: "ابوینی",
  paternal: "ابی",
  maternal: "امی",
};

export const SIDE_HINTS: Record<Side, string> = {
  full: "از یک پدر و یک مادر",
  paternal: "فقط از یک پدر",
  maternal: "فقط از یک مادر",
};

export const SIBLING_LABELS: Record<SiblingKey, string> = {
  fullBrothers: "برادر ابوینی",
  fullSisters: "خواهر ابوینی",
  patBrothers: "برادر ابی",
  patSisters: "خواهر ابی",
  matBrothers: "برادر امی",
  matSisters: "خواهر امی",
};

export const GRANDPARENT_LABELS: Record<GrandparentKey, string> = {
  patGrandfather: "جد پدری (پدربزرگ پدری)",
  patGrandmother: "جده پدری (مادربزرگ پدری)",
  matGrandfather: "جد مادری (پدربزرگ مادری)",
  matGrandmother: "جده مادری (مادربزرگ مادری)",
};

export const UNCLE_RELATIVES = [
  { name: "عمو", keys: ["ammuFull", "ammuPat", "ammuMat"] },
  { name: "عمه", keys: ["ammeFull", "ammePat", "ammeMat"] },
  { name: "دایی", keys: ["dayiFull", "dayiPat", "dayiMat"] },
  { name: "خاله", keys: ["khaleFull", "khalePat", "khaleMat"] },
] as const satisfies readonly { name: string; keys: readonly UncleKey[] }[];

const SIDE_OF: Side[] = ["full", "paternal", "maternal"];
export const UNCLE_LABELS = Object.fromEntries(
  UNCLE_RELATIVES.flatMap(({ name, keys }) =>
    keys.map((key, index) => [key, `${name} ${SIDE_LABELS[SIDE_OF[index]]}`]),
  ),
) as Record<UncleKey, string>;

export const UNCLE_SIDES: Side[] = SIDE_OF;

/** Colour of each share in the stacked bar: token utilities, cycled. */
export const SHARE_COLORS = [
  "bg-emerald-700",
  "bg-info-ink",
  "bg-emerald-400",
  "bg-warning-ink",
  "bg-emerald-200",
  "bg-warning-line",
  "bg-emerald-900",
  "bg-info-line",
  "bg-line-strong",
  "bg-danger-line",
] as const;

export type ShareView = Share & { color: string };

/** Shares with a stable colour each; a reserved share and the hakem get their own look. */
export function colorShares(shares: Share[]): ShareView[] {
  let next = 0;
  return shares.map((share) => ({
    ...share,
    // Labels such as «اولاد برادر ابوینی فوت‌شده 1» come from the engine with Latin digits.
    label: toPersianDigits(share.label),
    color: share.reserved ? "" : SHARE_COLORS[next++ % SHARE_COLORS.length],
  }));
}
