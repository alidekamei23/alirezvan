/**
 * محاسبه دستمزد کارشناس رسمی دادگستری — تعرفه ۱۴۰۵
 * توابع خالص؛ مبالغ به ریال.
 *
 * ترتیب محاسبه برای هر موضوع:
 *  ۱) مبنا از پله‌های موضوع (یا مبلغ مقطوع)، با رعایت حداقل موضوع
 *  ۲) ضریب موضوع (مثلاً حسابرسی ×۱٫۵). برای ضریب ۰٫۴ ابتدا سقف ماده ۱۱ روی مبنا اعمال می‌شود
 *  ۳) چند کارشناس هم‌رشته: ×۰٫۷ (ماده ۵۶)؛ مبنای سقف پس از این کسر است
 *  ۴) سقف: سقف اختصاصی موضوع، وگرنه ۱٫۳۵ میلیارد برای ارزیابی‌های ماده ۱۱ و ۳ میلیارد برای بقیه
 * سپس:
 *  ۵) چند مورد ارزیابی (تبصره ۲ ماده ۱۱): یک عرصه و یک شخص → جمع ارزش‌ها مبناست؛
 *     عرصه‌ها یا اشخاص متفاوت → هر مورد جدا، حداکثر پنج مورد اضافه بر مورد اول، سقف کل ۳ میلیارد
 *  ۶) عدم توان مالی (تبصره ۲ ماده ۲): کاهش تا ۵۰٪، نه کمتر از حداقل ۲۰ میلیون
 *  ۷) هزینه GPS (ماده ۳۹) و فوق‌العاده مأموریت (ماده ۶) جدا از دستمزد
 */
import {
  ARZYABI, ARZYABI_CAP, GENERAL_CAP, COUNCIL_THRESHOLD, SAME_FIELD_PANEL_FACTOR,
  MISSION_PER_DAY, ITEMS, GPS_PER_POINT, GPS_MAX_POINTS, GPS_ARTICLES, MIN_FEE,
  INCAPACITY_FACTOR, MULTI_SUBJECT_MAX_EXTRA, ARTICLE_NOTES,
  type ExpertItem, type TierSettings,
} from "./karshenasi-tariff";
export { formatRial, numberToWords, parseAmount, toFaDigits } from "../tadieh/tadieh-calc";

/** محاسبه پلکانی. پله‌ها از بالا به پایین پیمایش می‌شوند و هر پله فقط مازاد خودش را حساب می‌کند. */
export function tiered(value: number, s: TierSettings, opts: { ignoreMax?: boolean } = {}): number {
  let rest = value;
  let fee = 0;
  for (let i = s.tiers.length - 1; i >= 0; i--) {
    const { threshold, rate, fixed, chunks } = s.tiers[i];
    if (value <= threshold) continue;
    const excess = rest - threshold;
    if (chunks) {
      const n = Math.floor(excess / chunks);
      if (fixed) fee += n * fixed;
      else if (rate && s.base) fee += n * rate * s.base;
    } else if (fixed) fee += fixed;
    else if (rate) fee += excess * rate;
    rest -= excess;
  }
  if (s.min && fee < s.min) fee = s.min;
  if (!opts.ignoreMax && s.max && fee > s.max) fee = s.max;
  return fee;
}

export const isArzyabi = (it: ExpertItem) => !!it.settings && it.settings.tiers === ARZYABI.tiers;
export const supportsGps = (it: ExpertItem) => GPS_ARTICLES.some((a) => it.article.includes(a));
export const supportsMultiple = (it: ExpertItem) => isArzyabi(it);

/** سقف قابل اعمال برای هر کارشناس در یک مورد */
export function capFor(it: ExpertItem): number {
  return it.cap ?? it.settings?.max ?? (isArzyabi(it) ? ARZYABI_CAP : GENERAL_CAP);
}

export function articleNotes(it: ExpertItem): string[] {
  return Object.entries(ARTICLE_NOTES).filter(([a]) => it.article.split("، ").includes(a)).map(([, n]) => n);
}

export type Step = { label: string; amount: number };

/** دستمزد یک کارشناس برای یک مقدار (مراحل ۱ تا ۴) */
export function singleFee(it: ExpertItem, value: number | undefined, panel: boolean) {
  const steps: Step[] = [];
  const notes: string[] = [];
  let provisional = false;
  let fee: number;
  if (it.kind === "fixed") {
    fee = it.price!;
    steps.push({ label: "دستمزد مقطوع", amount: fee });
  } else {
    const v = value!;
    if (isArzyabi(it) && v >= COUNCIL_THRESHOLD)
      notes.push("برای ارزش ۵۰ هزار میلیارد ریال یا بیشتر، تعیین کارشناس و دستمزد با شورای عالی کارشناسان یا مرکز است (تبصره ۱ ماده ۱۱).");
    fee = tiered(v, it.settings!, { ignoreMax: true });
    steps.push({ label: "مبنای تعرفه", amount: fee });
  }
  if (it.coefficient) {
    if (it.coefficient < 1 && isArzyabi(it) && fee > ARZYABI_CAP) {
      fee = ARZYABI_CAP;
      steps.push({ label: "مبنا پس از سقف ماده ۱۱", amount: fee });
    }
    const before = fee;
    fee *= it.coefficient;
    steps.push({ label: `ضریب موضوع ×${it.coefficient}`, amount: fee });
    if (it.coefficient > 1 && isArzyabi(it) && Math.max(before, fee) >= ARZYABI_CAP) {
      provisional = true;
      notes.push("نحوه اعمال ضریب افزایشی در کنار سقف ماده ۱۱ ابهام دارد؛ طبق ماده ۵۷ رفع ابهام با مرجع صالح است. این مبلغ قطعی نیست.");
    }
  }
  if (panel) {
    fee *= SAME_FIELD_PANEL_FACTOR;
    steps.push({ label: "کسر ۳۰٪ — چند کارشناس هم‌رشته (ماده ۵۶)", amount: fee });
  }
  const cap = capFor(it);
  let capped = false;
  if (fee > cap) { fee = cap; capped = true; steps.push({ label: "اعمال سقف", amount: fee }); }
  return { fee: Math.round(fee), steps, notes, provisional, capped, cap };
}

export type ExpertFeeInput = {
  itemId: number;
  /** ارزش موضوع، مساحت، تعداد و… طبق inputTitle موضوع */
  value?: number;
  /** تبصره ۲ ماده ۱۱ — چند مورد ارزیابی؛ اگر داده شود به‌جای value استفاده می‌شود */
  values?: number[];
  /** موردها مربوط به یک عرصه و یک شخص‌اند (جمع ارزش‌ها مبناست) */
  sameParcelAndPerson?: boolean;
  samefieldPanel?: boolean;
  /** تبصره ۲ ماده ۲ — کاهش به تشخیص قاضی به دلیل عدم توان مالی */
  incapacity?: boolean;
  gps?: { points: number; device: keyof typeof GPS_PER_POINT };
  missionDays?: number;
  missionLocation?: "inProvince" | "outOfProvince";
};

export type ExpertFeeResult =
  | {
      ok: true;
      item: ExpertItem;
      /** دستمزد هر کارشناس؛ برای موارد بازه‌ای null */
      fee: number | null;
      rangeText?: string;
      steps: Step[];
      cap: number;
      capped: boolean;
      gps: number;
      mission: number;
      total: number | null;
      notes: string[];
      provisional: boolean;
    }
  | { ok: false; error: string };

export function calculateExpertFee(input: ExpertFeeInput): ExpertFeeResult {
  const it = ITEMS.find((x) => x.id === input.itemId);
  if (!it) return { ok: false, error: "موضوع کارشناسی پیدا نشد." };
  const days = input.missionDays ?? 0;
  if (!Number.isInteger(days) || days < 0) return { ok: false, error: "تعداد روز سفر باید عدد صحیح و نامنفی باشد." };
  const mission = days * MISSION_PER_DAY[input.missionLocation ?? "inProvince"];
  const panel = !!input.samefieldPanel;
  const notes: string[] = [...articleNotes(it)];

  let gps = 0;
  if (input.gps && input.gps.points > 0) {
    if (!supportsGps(it)) return { ok: false, error: "هزینه GPS فقط برای موضوع‌های ثبتی و نقشه‌برداری (مواد ۳۹ تا ۴۳) قابل افزودن است." };
    if (!Number.isInteger(input.gps.points)) return { ok: false, error: "تعداد نقاط GPS باید عدد صحیح باشد." };
    const pts = Math.min(input.gps.points, GPS_MAX_POINTS);
    if (input.gps.points > GPS_MAX_POINTS) notes.push(`حداکثر ${GPS_MAX_POINTS} نقطه GPS قابل پرداخت است.`);
    gps = pts * GPS_PER_POINT[input.gps.device];
  }

  if (it.kind === "range") {
    notes.unshift("دستمزد این موضوع مبلغ قطعی ندارد و با پیشنهاد کارشناس و موافقت مرجع تعیین می‌شود.");
    if (panel) notes.push("کسر ۳۰٪ ماده ۵۶ پس از تعیین مبلغ اعمال می‌شود.");
    return { ok: true, item: it, fee: null, rangeText: it.rangeText, steps: [], cap: capFor(it), capped: false, gps, mission, total: null, notes, provisional: false };
  }

  // ورودی‌ها
  let values: number[] = [];
  if (it.kind === "tiered") {
    values = input.values?.length ? input.values : [input.value ?? NaN];
    if (values.some((v) => !Number.isFinite(v) || v <= 0))
      return { ok: false, error: `${it.inputTitle ?? "مقدار"} باید عدد مثبت باشد.` };
    if (values.length > 1 && !supportsMultiple(it))
      return { ok: false, error: "محاسبه چند مورد فقط برای ارزیابی‌های ماده ۱۱ پشتیبانی می‌شود." };
  }

  let fee: number, steps: Step[], cap: number, capped: boolean, provisional: boolean;

  if (values.length > 1 && input.sameParcelAndPerson) {
    // تبصره ۲ ماده ۱۱: یک عرصه و یک شخص → جمع ارزش‌ها مبناست
    const sum = values.reduce((a, b) => a + b, 0);
    const r = singleFee(it, sum, panel);
    ({ fee, cap, capped, provisional } = r);
    steps = [{ label: `جمع ارزش ${values.length} مورد (تبصره ۲ ماده ۱۱)`, amount: sum }, ...r.steps];
    notes.push(...r.notes);
  } else if (values.length > 1) {
    // عرصه‌ها یا اشخاص متفاوت → ارزیابی جداگانه
    const counted = values.slice(0, 1 + MULTI_SUBJECT_MAX_EXTRA);
    const parts = counted.map((v) => singleFee(it, v, panel));
    steps = parts.map((p, i) => ({ label: `مورد ${i + 1}`, amount: p.fee }));
    fee = parts.reduce((a, p) => a + p.fee, 0);
    provisional = parts.some((p) => p.provisional);
    capped = parts.some((p) => p.capped);
    parts.forEach((p) => notes.push(...p.notes));
    if (values.length > counted.length)
      notes.push(`طبق ماده ۱۱ حداکثر دستمزد ${MULTI_SUBJECT_MAX_EXTRA} کارشناسی به مورد اول اضافه می‌شود؛ ${values.length - counted.length} مورد آخر حساب نشد.`);
    cap = GENERAL_CAP;
    if (fee > cap) { fee = cap; capped = true; steps.push({ label: "سقف یک کارشناس در یک موضوع (ماده ۱۱)", amount: fee }); }
    notes.push("محاسبه چند مورد جداگانه بر اساس برداشت از ماده ۱۱ و تبصره ۲ آن است؛ ترتیب و انتخاب موارد را مرجع ارجاع تعیین می‌کند.");
  } else {
    const r = singleFee(it, values[0], panel);
    ({ fee, steps, cap, capped, provisional } = r);
    notes.push(...r.notes);
  }

  if (input.incapacity) {
    const floor = Math.min(fee, MIN_FEE);
    const reduced = Math.max(Math.round(fee * INCAPACITY_FACTOR), floor);
    steps.push({ label: "حداقل پس از کاهش به دلیل عدم توان مالی (تبصره ۲ ماده ۲)", amount: reduced });
    fee = reduced;
    notes.push("کاهش تا ۵۰٪ به تشخیص قاضی است و این عدد کمترین مبلغ ممکن است؛ هزینه‌هایی مثل ایاب و ذهاب کاهش نمی‌یابد.");
  }

  if (panel) notes.push("مبلغ برای هر کارشناس است؛ جمع دستمزد هیئت به تعداد و سهم کارشناسان بستگی دارد.");
  return { ok: true, item: it, fee, steps, cap, capped, gps, mission, total: fee + gps + mission, notes, provisional };
}

/*
 * تست‌های مرجع (باید پاس شوند):
 * tiered(400_000_000, ARZYABI)       → 20_000_000
 * tiered(1_000_000_000, ARZYABI)     → 22_250_000   (۲۰م + ۵۰۰م × ۰٫۴۵٪)
 * tiered(10_000_000_000, ARZYABI)    → 48_250_000   (۲۲٫۲۵ + ۱۶ + ۱۰ میلیون)
 * calculateExpertFee({ itemId: 1, value: 1e9, samefieldPanel: true }).fee → 15_575_000
 * calculateExpertFee({ itemId: 1, value: 1e9, missionDays: 2, missionLocation: "outOfProvince" }).total → 52_250_000
 * calculateExpertFee({ itemId: 36 }).fee → 30_000_000   (ترکیبی خودرو؛ سقف ۳۰م)
 * tiered(3_000, ITEMS.find(x => x.id === 54)!.settings!) → 26_000_000   (ماده ۳۸: ۲۰م + ۲ × ۳م)
 * calculateExpertFee({ itemId: 23, value: 1e9 }).fee → 33_375_000   (حسابرسی ×۱٫۵)
 * calculateExpertFee({ itemId: 98, value: 3e8 }).fee → 70_000_000   (اجاره‌بها: ۲۰م + ۲۰۰م × ۲۵٪)
 * calculateExpertFee({ itemId: 1, value: 1e15 }).fee → 1_350_000_000 (سقف)
 * calculateExpertFee({ itemId: 1, values: [5e8, 5e8], sameParcelAndPerson: true }).fee → 22_250_000  (جمع = ۱ میلیارد)
 * calculateExpertFee({ itemId: 1, values: [5e8, 5e8] }).fee → 40_000_000  (دو مورد جدا × ۲۰م)
 * calculateExpertFee({ itemId: 1, values: Array(8).fill(1e8) }).fee → 120_000_000  (۱ + ۵ مورد)
 * calculateExpertFee({ itemId: 1, value: 1e10, incapacity: true }).fee → 24_125_000
 * calculateExpertFee({ itemId: 1, value: 1e8, incapacity: true }).fee → 20_000_000  (کمتر از حداقل نمی‌شود)
 * calculateExpertFee({ itemId: 58, value: 2000, gps: { points: 60, device: "multiFrequency" } }).gps → 175_000_000
 */
