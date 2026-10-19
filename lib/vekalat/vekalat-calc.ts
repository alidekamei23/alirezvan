/**
 * محاسبه حق‌الوکاله و تمبر مالیاتی وکیل — آیین‌نامه ۱۳۹۸/۱۲/۲۸ و ماده ۱۰۳ قانون مالیات‌های مستقیم
 * توابع خالص؛ مبالغ به ریال.
 *
 * ترتیب محاسبه حق‌الوکاله:
 *  ۱) مبنا: ماده ۹ (مالی)، ۱۳ (خانوادگی/غیرمالی)، ۱۴ (کیفری)، ۲۵ (اجرایی) یا سایر مواد
 *  ۲) تسخیری/معاضدتی (ماده ۸): دو برابر حداقل — برای موارد دارای حداقل
 *  ۳) پس از نقض (ماده ۱۸): نصف؛ وکالت تخصصی (تبصره ماده ۲۲): ۱۰٪ اضافه؛ جرایم اضافه (تبصره ۳ ماده ۱۴): هر جرم ۲۰٪
 *  ۴) نتیجه دعوا (ماده ۱۲) یا ورود ثالث/تقابل (ماده ۱۰): فقط سهم مرحله مربوط
 *     — در صلح و سازش یا ارجاع به داوری (ماده ۲۳)، تمام حق‌الوکاله دعوا
 *  ۵) تقسیم بین مراحل (ماده ۲۱؛ تبصره ۱ ماده ۱۴) و بین وکلای متعدد (ماده ۵)
 * تمبر: ۵٪ حق‌الوکاله هر مرحله، نه کمتر از ۵٪ تعرفه (مالی) یا ۵٪ حداقل تعرفه (غیرمالی و کیفری) — ماده ۱۰۳
 */
import {
  FINANCIAL, CIVIL_STAGES, CRIMINAL_STAGES, NON_FINANCIAL, CRIMINAL, EXECUTION, OTHER,
  OUTCOMES, MODIFIERS, TRAVEL_PER_DAY, STAMP, type RangeItem,
} from "./vekalat-tariff";
export { formatRial, numberToWords, parseAmount, toFaDigits } from "../tadieh/tadieh-calc";
export { NON_FINANCIAL, CRIMINAL, OTHER, OUTCOMES, REGULATION } from "./vekalat-tariff";

export type Subject = "financial" | "nonFinancial" | "criminal" | "execution" | "other";
export type Outcome = keyof typeof OUTCOMES;
export type Range = { min: number; max: number };

export type VekalatInput = {
  subject: Subject;
  /** بهای خواسته (مالی) یا محکوم‌به (اجرایی) */
  value?: number;
  /** شناسه مورد از NON_FINANCIAL، CRIMINAL یا OTHER؛ برای اجرایی: "judgment" یا "other" */
  itemId?: string;
  /** قطعیت حکم بدوی از حیث بهای خواسته؛ auto: تا ۵۰۰ میلیون ریال قطعی */
  finality?: "auto" | "final" | "appealable";
  outcome?: Outcome;
  /** ماده ۱۰ — ورود/جلب/اعتراض ثالث یا تقابل، و مرحله آن */
  thirdPartyStage?: "first" | "appeal";
  /** ماده ۲۳ — صلح و سازش یا ارجاع به داوری */
  settlement?: boolean;
  afterReversal?: boolean;
  specialist?: boolean;
  appointed?: boolean;
  /** کیفری: تعداد جرایم اضافه بر جرم اشد */
  extraCrimes?: number;
  /** کیفری: رسیدگی فاقد مرحله دادسرا */
  noDadsara?: boolean;
  /** کیفری: حکم بدوی قطعی */
  criminalFinal?: boolean;
  /** مشاوره: تعداد ساعت */
  hours?: number;
  lawyers?: number;
  travelDays?: number;
  travelScope?: "inProvince" | "outOfProvince";

  // تمبر
  issuer?: "bar" | "center";
  /** مبلغ حق‌الوکاله در وکالت‌نامه (اختیاری) */
  agreedFee?: number;
  /** ماده ۷ — وکالت تبرعی اقربا تا درجه ۳ از طبقه ۳ */
  relativeFree?: boolean;
  /** ماده ۳۳ — موکل دولتی یا شهرداری */
  governmentClient?: boolean;
};

export type StageRow = { key: string; title: string; fee: Range; stamp: number; share: number; total: number };

export type VekalatResult =
  | {
      ok: true;
      title: string;
      article: string;
      /** حق‌الوکاله کل طبق تعرفه، پس از ضرایب */
      fee: Range;
      isRange: boolean;
      steps: { label: string; value: Range }[];
      stages: StageRow[];
      perLawyer: Range;
      travel: number;
      stamp: { base: string; total: number; share: number; shareLabel: string; sum: number; perLawyer: number; exempt?: string };
      notes: string[];
      warnings: string[];
    }
  | { ok: false; error: string };

/* ماده ۹ */
export function financialFee(value: number, final: boolean): number {
  if (final) return value * FINANCIAL.finalRate;
  let fee = 0;
  const t = FINANCIAL.tiers;
  for (let i = 0; i < t.length; i++) {
    const lo = t[i].from, hi = i + 1 < t.length ? t[i + 1].from : Infinity;
    if (value > lo) fee += (Math.min(value, hi) - lo) * t[i].rate;
  }
  return fee;
}

const R = (min: number, max = min): Range => ({ min, max });
const mul = (r: Range, k: number): Range => ({ min: r.min * k, max: r.max * k });
const round = (r: Range): Range => ({ min: Math.round(r.min), max: Math.round(r.max) });
const find = (list: RangeItem[], id?: string) => list.find((x) => x.id === id);

export function calculateVekalat(inp: VekalatInput): VekalatResult {
  const notes: string[] = [];
  const warnings: string[] = [];
  const steps: { label: string; value: Range }[] = [];
  const lawyers = Math.max(1, Math.floor(inp.lawyers ?? 1));
  let fee: Range;
  let title: string, article: string, stageKind: "civil" | "criminal" | "none" | "single";
  let hasMin = false;
  let financial = false;

  switch (inp.subject) {
    case "financial": {
      const v = inp.value ?? NaN;
      if (!(v > 0)) return { ok: false, error: "بهای خواسته را به‌صورت عدد مثبت وارد کنید." };
      const fin = inp.finality ?? "auto";
      const final = fin === "final" || (fin === "auto" && v <= FINANCIAL.finalThreshold);
      fee = R(financialFee(v, final));
      financial = true;
      title = "دعوای مالی";
      article = "ماده ۹";
      stageKind = final ? "single" : "civil";
      if (final) notes.push("رأی قطعی است و مرحله تجدیدنظر ندارد؛ برای همین کل حق‌الوکاله در مرحله نخستین آمده. برخی تقسیم ۶۰/۴۰ ماده ۲۱ را در این حالت هم اعمال می‌کنند؛ در آن برداشت، تمبر ابتدای کار ۶۰٪ این مبلغ است.");
      steps.push({ label: final ? "حکم بدوی از حیث بهای خواسته قطعی: ۱۰٪ بهای خواسته" : "پلکانی ماده ۹: ۸٪ تا ۵۰۰ میلیون، ۷٪ تا ۲ میلیارد، ۵٪ تا ۱۰ میلیارد، ۴٪ تا ۳۰ میلیارد، ۳٪ مازاد", value: fee });
      if (fin === "auto")
        notes.push(final
          ? "دعاوی مالی تا ۵۰۰ میلیون ریال در صلاحیت دادگاه صلح و رأی آن قطعی است (تبصره ۵ ماده ۱۲ قانون شوراهای حل اختلاف ۱۴۰۲)؛ برای همین ۱۰٪ اعمال شد. اگر حکم در پرونده شما قابل تجدیدنظر است، گزینه را تغییر دهید."
          : "حکم از حیث بهای خواسته قابل تجدیدنظر فرض شده است.");
      if (inp.appointed) notes.push("دعاوی مالی حداقل و حداکثر ندارند؛ برای همین ضریب ماده ۸ (وکالت تسخیری) در آن‌ها اعمال نمی‌شود.");
      break;
    }
    case "nonFinancial":
    case "criminal":
    case "other": {
      const list = inp.subject === "nonFinancial" ? NON_FINANCIAL : inp.subject === "criminal" ? CRIMINAL : OTHER;
      const it = find(list, inp.itemId);
      if (!it) return { ok: false, error: "نوع موضوع را انتخاب کنید." };
      title = it.title; article = it.article; stageKind = it.stages;
      fee = R(it.min, it.max);
      hasMin = it.min > 0;
      if (it.unit === "ساعت") {
        const h = inp.hours ?? 1;
        if (!(h > 0)) return { ok: false, error: "تعداد ساعت را وارد کنید." };
        fee = mul(fee, h);
        steps.push({ label: `${it.min.toLocaleString()} تا ${it.max.toLocaleString()} ریال × ${h} ساعت`, value: fee });
      } else steps.push({ label: `حداقل و حداکثر ${it.article}`, value: fee });
      if (inp.subject === "other" && it.id === "drafting") notes.push("برای تنظیم دادخواست و لایحه بدون وکالت‌نامه، آیین‌نامه فقط حداکثر تعیین کرده است.");
      if (inp.subject === "other" && it.id === "disciplinary") notes.push("ماده ۱۹ فقط حداکثر حق‌الوکاله را تعیین کرده است.");
      if (inp.subject === "other" && ["drafting", "consult", "study"].includes(it.id))
        notes.push("برای خدمات ماده ۲۶ وکالت‌نامه‌ای نیست؛ وکیل درآمد سال قبل را اردیبهشت هر سال به کانون یا مرکز اعلام و تمبر علی‌الحساب آن را می‌پردازد (تبصره ماده ۲۶).");
      break;
    }
    case "execution": {
      if (inp.itemId === "other") {
        title = "امور اجرایی (دیگر موارد)"; article = "ماده ۲۵";
        fee = R(EXECUTION.other.min, EXECUTION.other.max);
      } else {
        const v = inp.value ?? NaN;
        if (!(v > 0)) return { ok: false, error: "مبلغ محکوم‌به یا مورد اجرا را وارد کنید." };
        title = "اجرای احکام حقوقی یا اجرای اسناد رسمی ثبت"; article = "ماده ۲۵";
        fee = R(EXECUTION.judgment.min, Math.max(EXECUTION.judgment.min, v * EXECUTION.judgment.maxRate));
        notes.push("حداکثر حق‌الوکاله اجرایی ۲٪ محکوم‌به یا مورد اجراست و کمتر از ۴ میلیون ریال نیست.");
      }
      steps.push({ label: "حداقل و حداکثر ماده ۲۵", value: fee });
      hasMin = true; stageKind = "none";
      break;
    }
  }

  // ماده ۸ — تسخیری یا معاضدتی
  if (inp.appointed) {
    if (hasMin) {
      fee = R(fee.min * MODIFIERS.appointedFactor);
      steps.push({ label: "وکالت تسخیری یا معاضدتی: دو برابر حداقل (ماده ۸)", value: fee });
    }
    notes.push("تا وقتی وکیل تسخیری یا معاضدتی حق‌الوکاله را دریافت نکرده، ابطال تمبر و پرداخت سهم کانون، مرکز و صندوق لازم نیست (ماده ۸).");
  }
  // تبصره ۳ ماده ۱۴
  const extra = Math.max(0, Math.floor(inp.extraCrimes ?? 0));
  if (inp.subject === "criminal" && extra) {
    fee = mul(fee, 1 + MODIFIERS.extraCrime * extra);
    steps.push({ label: `${extra} جرم اضافه، هر کدام ۲۰٪ (تبصره ۳ ماده ۱۴)`, value: fee });
  }
  if (inp.afterReversal) { fee = mul(fee, MODIFIERS.afterReversal); steps.push({ label: "وکالت پس از نقض رأی: نصف (ماده ۱۸)", value: fee }); }
  if (inp.specialist) { fee = mul(fee, MODIFIERS.specialist); steps.push({ label: "گواهی وکالت تخصصی: ۱۰٪ اضافه (تبصره ماده ۲۲)", value: fee }); }

  // مراحل
  type S = { key: string; title: string; share: number };
  let stages: S[];
  if (stageKind === "civil") stages = [{ key: "first", title: "مرحله نخستین", share: CIVIL_STAGES.first }, { key: "appeal", title: "مرحله تجدیدنظر", share: CIVIL_STAGES.appeal }];
  else if (stageKind === "criminal") {
    let d: number = CRIMINAL_STAGES.dadsara, f: number = CRIMINAL_STAGES.first, a: number = CRIMINAL_STAGES.appeal;
    if (inp.noDadsara) { f += d; d = 0; }
    if (inp.criminalFinal) { f += a; a = 0; }
    stages = [{ key: "dadsara", title: "دادسرا", share: d }, { key: "first", title: "دادگاه بدوی", share: f }, { key: "appeal", title: "دادگاه تجدیدنظر", share: a }].filter((s) => s.share > 0);
    if (inp.noDadsara) notes.push("رسیدگی مرحله دادسرا ندارد؛ سهم دادسرا به دادگاه بدوی اضافه شد (تبصره ۱ ماده ۱۴).");
    if (inp.criminalFinal) notes.push("حکم بدوی قطعی است؛ سهم تجدیدنظر هم در مرحله بدوی پرداخت می‌شود (تبصره ۱ ماده ۱۴).");
  } else if (stageKind === "single") stages = [{ key: "first", title: "مرحله نخستین (رأی قطعی)", share: 1 }];
  else stages = [{ key: "all", title: "کل حق‌الوکاله", share: 1 }];

  // ماده ۲۳ / ماده ۱۲ / ماده ۱۰
  const civilLike = inp.subject === "financial" || inp.subject === "nonFinancial";
  if (inp.settlement) {
    notes.push("در صلح و سازش یا ارجاع به داوری، حق‌الوکاله کل دعوا تعلق می‌گیرد (ماده ۲۳).");
  } else if (civilLike && inp.outcome && inp.outcome !== "none") {
    const o = OUTCOMES[inp.outcome] as { title: string; stage: string; factor: number; article: string };
    if (o.stage !== "all") {
      const st = stages.find((s) => s.key === o.stage) ?? stages[0];
      fee = mul(fee, st.share * o.factor);
      stages = [{ ...st, share: 1 }];
      steps.push({ label: `${o.title}: ${o.factor === 0.25 ? "یک‌چهارم" : "یک‌دوم"} حق‌الوکاله ${st.title} (${o.article})`, value: fee });
    } else steps.push({ label: `${o.title}: تمام حق‌الوکاله (${o.article})`, value: fee });
  } else if (civilLike && inp.thirdPartyStage && stageKind === "civil") {
    const st = stages.find((s) => s.key === inp.thirdPartyStage)!;
    fee = mul(fee, st.share);
    stages = [{ ...st, share: 1 }];
    steps.push({ label: `ورود، جلب یا اعتراض ثالث یا تقابل در ${st.title}: معادل حق‌الوکاله همان مرحله (ماده ۱۰)`, value: fee });
  }
  fee = round(fee);
  const isRange = fee.min !== fee.max;

  // تمبر
  const agreed = inp.agreedFee && inp.agreedFee > 0 ? inp.agreedFee : 0;
  if (agreed && !isRange && agreed > fee.max)
    notes.push("حق‌الوکاله قراردادی بیشتر از تعرفه است. دادگاه نسبت به محکوم‌علیه حداکثر تا تعرفه حکم می‌دهد، ولی تمبر و سهم کانون یا مرکز بر مبنای مبلغ قراردادی است (ماده ۳).");
  if (agreed && isRange && agreed > fee.max) warnings.push("مبلغ قراردادی از حداکثر تعرفه بیشتر است؛ نسبت به محکوم‌علیه حداکثر تعرفه ملاک است (ماده ۳).");
  // کف تمبر هر مرحله: مالی ← تعرفه؛ سایر ← حداقل
  const floorTotal = isRange ? fee.min : fee.max;
  const stampBaseTotal = Math.max(agreed, floorTotal);
  const shareRate = inp.issuer === "center" ? STAMP.centerShareOfFee : STAMP.rate * STAMP.barShareOfStamp;
  const shareLabel = inp.issuer === "center" ? "سهم مرکز (۵٪ حق‌الوکاله)" : "سهم صندوق و کانون (۷۵٪ تمبر)";
  let exempt: string | undefined;
  if (inp.relativeFree) exempt = "وکالت تبرعی برای اقربای نسبی یا سببی تا درجه سوم از طبقه سوم از تمبر و سهم کانون، مرکز و صندوق معاف است (ماده ۷).";
  const stageRows: StageRow[] = stages.map((s) => {
    const f = round(mul(fee, s.share));
    const base = stampBaseTotal * s.share;
    let stamp = exempt ? 0 : Math.round(base * STAMP.rate);
    const share = exempt ? 0 : Math.round(base * shareRate);
    if (inp.governmentClient) stamp = 0;
    return { key: s.key, title: s.title, fee: f, stamp, share, total: stamp + share };
  });
  if (inp.governmentClient) notes.push("موکل دولتی یا شهرداری است: وکیل تمبر ابطال نمی‌کند و موکل ۵٪ حق‌الوکاله را کسر و به اداره مالیات می‌پردازد؛ ولی سهم کانون، مرکز یا صندوق را وکیل می‌پردازد (ماده ۳۳ و تبصره ۲ ماده ۱۰۳).");
  const stampTotal = stageRows.reduce((a, s) => a + s.stamp, 0);
  const shareTotal = stageRows.reduce((a, s) => a + s.share, 0);
  const baseLabel = exempt ? "معاف" : agreed && agreed >= floorTotal
    ? "مبلغ حق‌الوکاله در وکالت‌نامه"
    : financial ? "حق‌الوکاله طبق تعرفه (ماده ۱۰۳ بند الف)" : isRange ? "حداقل حق‌الوکاله تعرفه (ماده ۱۰۳ بند ب)" : "حق‌الوکاله طبق تعرفه";
  if (agreed && agreed < floorTotal && !exempt)
    notes.push("مبلغ قراردادی کمتر از کف قانونی است؛ تمبر بر مبنای کف ماده ۱۰۳ محاسبه شد. در این حالت، نسبت به محکوم‌علیه همان مبلغ کمتر قراردادی ملاک است (ماده ۲).");
  if (lawyers > 1) notes.push(`حق‌الوکاله، تمبر و سهم‌ها بین ${lawyers} وکیل به تساوی تقسیم شده است، مگر اینکه توافق دیگری باشد (ماده ۵).`);

  const days = Math.max(0, Math.floor(inp.travelDays ?? 0));
  const travel = days * TRAVEL_PER_DAY[inp.travelScope ?? "inProvince"];
  if (days) notes.push("هزینه ایاب و ذهاب و اقامت جداگانه با موکل است (ماده ۳۰).");

  return {
    ok: true, title, article, fee, isRange, steps, stages: stageRows,
    perLawyer: round(mul(fee, 1 / lawyers)), travel,
    stamp: { base: baseLabel, total: stampTotal, share: shareTotal, shareLabel, sum: stampTotal + shareTotal, perLawyer: Math.round((stampTotal + shareTotal) / lawyers), exempt },
    notes, warnings,
  };
}

/*
 * تست‌های مرجع (باید پاس شوند):
 * financialFee(400e6, true)  → 40_000_000            (قطعی: ۱۰٪)
 * financialFee(1e9, false)   → 75_000_000            (۴۰م + ۳۵م)
 * financialFee(5e9, false)   → 295_000_000           (۴۰ + ۱۰۵ + ۱۵۰ میلیون)
 * financialFee(5e10, false)  → 1_945_000_000         (۴۰ + ۱۰۵ + ۴۰۰ + ۸۰۰ + ۶۰۰ میلیون)
 * calculateVekalat({ subject: "financial", value: 1e9 }).stages → نخستین ۴۵م، تجدیدنظر ۳۰م؛ تمبر ۲٬۲۵۰٬۰۰۰ و ۱٬۵۰۰٬۰۰۰
 * calculateVekalat({ subject: "financial", value: 1e9, outcome: "rejectAfter" }).fee.max → 22_500_000
 * calculateVekalat({ subject: "nonFinancial", itemId: "family" }).fee → ۵ تا ۲۰۰ میلیون؛ تمبر = ۵٪ × ۵م = ۲۵۰٬۰۰۰
 * calculateVekalat({ subject: "criminal", itemId: "k1a", extraCrimes: 2 }).fee → ۷۰ میلیون تا ۲٫۸ میلیارد
 * calculateVekalat({ subject: "execution", value: 1e9 }).fee → ۴ تا ۲۰ میلیون
 */
