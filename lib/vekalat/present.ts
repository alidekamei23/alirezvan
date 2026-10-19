/**
 * Display helpers for the lawyer's-fee and stamp calculator: the form's state and how it
 * becomes a VekalatInput, Persian digits for text the logic returns, the Article 9 table
 * built from the tariff, and the plain-text summary that «کپی نتیجه» copies. The
 * calculation itself lives in vekalat-calc.ts and is not repeated here.
 */
import { ESTIMATE_DISCLAIMER } from "@/content/legal";
import { toPersianDigits } from "@/lib/format";
import { rial, tomanEquivalent } from "@/lib/tadieh/present";
import {
  CRIMINAL,
  NON_FINANCIAL,
  OTHER,
  OUTCOMES,
  REGULATION,
  formatRial,
  numberToWords,
  type Subject,
  type VekalatInput,
  type VekalatResult,
} from "./vekalat-calc";
import { CIVIL_STAGES, FINANCIAL } from "./vekalat-tariff";

export type VekalatOk = Extract<VekalatResult, { ok: true }>;
export type Range = VekalatOk["fee"];
export type Outcome = keyof typeof OUTCOMES;
export type Finality = NonNullable<VekalatInput["finality"]>;
export type ThirdPartyStage = "" | NonNullable<VekalatInput["thirdPartyStage"]>;
export type TravelScope = NonNullable<VekalatInput["travelScope"]>;
export type Issuer = NonNullable<VekalatInput["issuer"]>;
export type ExecutionItem = "judgment" | "other";

export const SUBJECT_LABELS: Record<Subject, string> = {
  financial: "مالی",
  nonFinancial: "خانوادگی، حسبی و غیرمالی",
  criminal: "کیفری",
  execution: "امور اجرایی",
  other: "سایر",
};

export const SUBJECTS = Object.keys(SUBJECT_LABELS) as Subject[];

/** Subjects whose type is chosen from a list in the tariff. */
export const ITEM_LISTS = {
  nonFinancial: NON_FINANCIAL,
  criminal: CRIMINAL,
  other: OTHER,
} as const;
export type ListSubject = keyof typeof ITEM_LISTS;

export const FINALITY_LABELS: Record<Finality, string> = {
  auto: `خودکار: تا ${formatRial(FINANCIAL.finalThreshold)} ریال قطعی`,
  appealable: "قابل تجدیدنظر",
  final: "قطعی",
};

export const THIRD_PARTY_LABELS: Record<ThirdPartyStage, string> = {
  "": "ندارد",
  first: "در مرحله نخستین",
  appeal: "در مرحله تجدیدنظر",
};

export const EXECUTION_LABELS: Record<ExecutionItem, string> = {
  judgment: "اجرای احکام حقوقی و اجرای اسناد رسمی ثبت",
  other: "دیگر امور اجرایی",
};

export const TRAVEL_LABELS: Record<TravelScope, string> = {
  inProvince: "داخل استان",
  outOfProvince: "خارج از استان",
};

export const ISSUER_LABELS: Record<Issuer, { title: string; description: string }> = {
  bar: { title: "کانون وکلای دادگستری", description: "سهم صندوق و کانون: ۷۵٪ تمبر" },
  center: {
    title: "مرکز وکلا، کارشناسان رسمی و مشاوران خانواده",
    description: "سهم مرکز: ۵٪ حق‌الوکاله",
  },
};

/** The form. Each subject keeps its own fields, so switching back keeps what was typed. */
export type VekalatForm = {
  subject: Subject;
  /** Rials; null when empty. */
  value: number | null;
  finality: Finality;
  items: Record<ListSubject, string>;
  /** Typed text, so a half-typed decimal survives. */
  hours: string;
  extraCrimes: number;
  noDadsara: boolean;
  criminalFinal: boolean;
  executionItem: ExecutionItem;
  /** Rials; null when empty. */
  executionValue: number | null;
  outcome: Outcome;
  thirdPartyStage: ThirdPartyStage;
  settlement: boolean;
  afterReversal: boolean;
  specialist: boolean;
  appointed: boolean;
  lawyers: number;
  travelDays: number;
  travelScope: TravelScope;
  issuer: Issuer;
  /** Rials; null when empty. */
  agreedFee: number | null;
  relativeFree: boolean;
  governmentClient: boolean;
};

/** The example the form opens with: a financial claim of one billion rials. */
export function sampleForm(): VekalatForm {
  return {
    subject: "financial",
    value: 1_000_000_000,
    finality: "auto",
    items: {
      nonFinancial: NON_FINANCIAL[0].id,
      criminal: CRIMINAL[0].id,
      other: OTHER[0].id,
    },
    hours: "۱",
    extraCrimes: 0,
    noDadsara: false,
    criminalFinal: false,
    executionItem: "judgment",
    executionValue: null,
    outcome: "none",
    thirdPartyStage: "",
    settlement: false,
    afterReversal: false,
    specialist: false,
    appointed: false,
    lawyers: 1,
    travelDays: 0,
    travelScope: "inProvince",
    issuer: "bar",
    agreedFee: null,
    relativeFree: false,
    governmentClient: false,
  };
}

/** Whether the outcome, third-party and settlement fields apply (Articles 9 and 13 only). */
export const isCivilLike = (subject: Subject) =>
  subject === "financial" || subject === "nonFinancial";

/** The chosen tariff item of a list subject. */
export function selectedItem(form: VekalatForm) {
  if (!(form.subject in ITEM_LISTS)) return null;
  const subject = form.subject as ListSubject;
  return ITEM_LISTS[subject].find((item) => item.id === form.items[subject]) ?? null;
}

/** Hours typed with Persian or Latin digits; empty means one hour. */
export function parseHours(text: string): number {
  const latin = toLatinNumber(text);
  if (latin === "") return 1;
  const value = Number(latin);
  return Number.isFinite(value) ? value : NaN;
}

function toLatinNumber(text: string): string {
  return text
    .trim()
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/٫/g, ".");
}

/**
 * The input for calculateVekalat, or null while a required amount is still empty
 * (nothing to show yet, which is not an error).
 */
export function toVekalatInput(form: VekalatForm): VekalatInput | null {
  const { subject } = form;
  const input: VekalatInput = {
    subject,
    afterReversal: form.afterReversal,
    specialist: form.specialist,
    appointed: form.appointed,
    lawyers: form.lawyers,
    travelDays: form.travelDays,
    travelScope: form.travelScope,
    issuer: form.issuer,
    relativeFree: form.relativeFree,
    governmentClient: form.governmentClient,
    ...(form.agreedFee ? { agreedFee: form.agreedFee } : {}),
  };
  if (subject === "financial") {
    if (form.value === null) return null;
    Object.assign(input, { value: form.value, finality: form.finality });
  } else if (subject === "execution") {
    if (form.executionItem === "judgment") {
      if (form.executionValue === null) return null;
      Object.assign(input, { itemId: "judgment", value: form.executionValue });
    } else input.itemId = "other";
  } else {
    input.itemId = form.items[subject];
    if (selectedItem(form)?.unit === "ساعت") input.hours = parseHours(form.hours);
  }
  if (subject === "criminal") {
    Object.assign(input, {
      extraCrimes: form.extraCrimes,
      noDadsara: form.noDadsara,
      criminalFinal: form.criminalFinal,
    });
  }
  if (isCivilLike(subject)) {
    input.outcome = form.outcome;
    input.settlement = form.settlement;
    if (form.thirdPartyStage) input.thirdPartyStage = form.thirdPartyStage;
  }
  return input;
}

/* ───────── Text ───────── */

/**
 * Persian digits for text built by the logic, which sometimes writes Latin digits and
 * Latin thousands separators (e.g. «5,000,000 تا 200,000,000 ریال × 2 ساعت»).
 */
export function faText(text: string): string {
  return toPersianDigits(text)
    .replace(/([۰-۹]),(?=[۰-۹]{3})/g, "$1٬")
    .replace(/([۰-۹])\.([۰-۹])/g, "$1٫$2");
}

/** «۷۵٬۰۰۰٬۰۰۰ ریال», or «۵٬۰۰۰٬۰۰۰ تا ۲۰۰٬۰۰۰٬۰۰۰ ریال» for a range. */
export function rangeText(range: Range): string {
  return range.min === range.max
    ? rial(range.max)
    : `${formatRial(range.min)} تا ${formatRial(range.max)} ریال`;
}

/** «هفتاد و پنج میلیون ریال، معادل ۷٬۵۰۰٬۰۰۰ تومان» */
export function amountInWords(rials: number): string {
  return `${numberToWords(rials)} ریال، معادل ${tomanEquivalent(rials)}`;
}

/** Rows of the Article 9 table, built from FINANCIAL rather than typed in. */
export function financialRows(): { from: string; to: string; rate: string }[] {
  const tiers = FINANCIAL.tiers;
  return tiers.map((tier, index) => ({
    from: formatRial(tier.from),
    to: index + 1 < tiers.length ? formatRial(tiers[index + 1].from) : "—",
    rate: `${percent(tier.rate)} مازاد`,
  }));
}

/** 0.07 → «۷٪», 0.6 → «۶۰٪» */
export function percent(rate: number): string {
  return `${faText(String(Number((rate * 100).toPrecision(6))))}٪`;
}

/** «۶۰٪ مرحله نخستین و ۴۰٪ مرحله تجدیدنظر» */
export const CIVIL_SPLIT = `${percent(CIVIL_STAGES.first)} مرحله نخستین و ${percent(CIVIL_STAGES.appeal)} مرحله تجدیدنظر`;
export const FINAL_RATE_TEXT = `${percent(FINANCIAL.finalRate)} بهای خواسته`;
export const FINAL_THRESHOLD_TEXT = rial(FINANCIAL.finalThreshold);

/* ───────── Copied summary ───────── */

function inputLines(form: VekalatForm): string[] {
  const lines = [`موضوع: ${SUBJECT_LABELS[form.subject]}`];
  if (form.subject === "financial" && form.value !== null) {
    lines.push(`بهای خواسته: ${rial(form.value)}`, `قطعیت: ${FINALITY_LABELS[form.finality]}`);
  }
  if (form.subject === "execution") {
    lines.push(`نوع: ${EXECUTION_LABELS[form.executionItem]}`);
    if (form.executionItem === "judgment" && form.executionValue !== null)
      lines.push(`مبلغ محکوم‌به: ${rial(form.executionValue)}`);
  }
  const item = selectedItem(form);
  if (item?.unit === "ساعت") lines.push(`ساعت: ${faText(String(parseHours(form.hours)))}`);
  if (form.subject === "criminal" && form.extraCrimes)
    lines.push(`جرایم اضافه: ${toPersianDigits(form.extraCrimes)}`);
  if (isCivilLike(form.subject) && form.outcome !== "none")
    lines.push(`نتیجه دعوا: ${OUTCOMES[form.outcome].title}`);
  if (form.lawyers > 1) lines.push(`تعداد وکلا: ${toPersianDigits(form.lawyers)}`);
  lines.push(`مرجع پروانه: ${ISSUER_LABELS[form.issuer].title}`);
  if (form.agreedFee) lines.push(`حق‌الوکاله در وکالت‌نامه: ${rial(form.agreedFee)}`);
  return lines;
}

export function buildSummary(result: VekalatOk, form: VekalatForm): string {
  const lines = [
    "محاسبه حق‌الوکاله و تمبر وکیل",
    `مبنا: ${REGULATION}`,
    ...inputLines(form),
    "",
    `${faText(result.title)} (${result.article})`,
    `حق‌الوکاله طبق تعرفه: ${rangeText(result.fee)}`,
  ];
  if (!result.isRange) lines.push(`به حروف: ${amountInWords(result.fee.max)}`);
  if (form.lawyers > 1) lines.push(`سهم هر وکیل: ${rangeText(result.perLawyer)}`);
  lines.push(
    `جمع تمبر: ${rial(result.stamp.total)}`,
    `${result.stamp.shareLabel}: ${rial(result.stamp.share)}`,
    `مبنای تمبر: ${result.stamp.exempt ?? result.stamp.base}`,
  );
  if (result.steps.length) {
    lines.push("", "مراحل محاسبه:");
    for (const step of result.steps) lines.push(`- ${faText(step.label)}: ${rangeText(step.value)}`);
  }
  lines.push("", "تقسیم بین مراحل:");
  for (const stage of result.stages) {
    lines.push(
      `- ${stage.title}: حق‌الوکاله ${rangeText(stage.fee)}، تمبر ${rial(stage.stamp)}، سهم ${rial(stage.share)}، جمع ${rial(stage.total)}`,
    );
  }
  if (result.travel > 0) lines.push("", `فوق‌العاده مأموریت (ماده ۳۰): ${rial(result.travel)}`);
  if (result.warnings.length) lines.push("", "هشدار:", ...result.warnings.map((w) => `- ${faText(w)}`));
  if (result.notes.length) lines.push("", "نکته‌ها:", ...result.notes.map((n) => `- ${faText(n)}`));
  lines.push("", ESTIMATE_DISCLAIMER);
  return lines.join("\n");
}
