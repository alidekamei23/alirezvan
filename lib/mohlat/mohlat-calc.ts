/**
 * محاسبه مهلت‌ها و مواعد قانونی
 * قواعد (قانون آیین دادرسی مدنی):
 *  ماده ۴۴۳: ماه ۳۰ روز، هفته ۷ روز
 *  ماده ۴۴۴: اگر روز آخر موعد تعطیل باشد، روز آخر، اولین روز کاری بعد از تعطیل است
 *  ماده ۴۴۵: در موعدی که مبدأ آن ابلاغ یا اعلام است، روز ابلاغ و روز اقدام جزو مدت نیست
 *  ماده ۴۴۶: مواعد برای مقیم خارج از کشور دو ماه (۶۰ روز)
 * در مهلت‌های کیفری و اجرایی هم، به تبع ماده ۱۷۷ ق.آ.د.ک و ماده ۸ ق.ا.ا.م، همین قواعد به کار می‌رود.
 * توابع خالص.
 */
import { DEADLINES, HOLIDAYS, COMPLETE_YEARS, type Deadline } from "./mohlat-data";
export { DEADLINES, CATEGORY_TITLES, CATEGORY_LAWS, HOLIDAYS, COMPLETE_YEARS, type Category, type Deadline } from "./mohlat-data";

/* ───────── تقویم شمسی ───────── */
export type JDate = { y: number; m: number; d: number };
export const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
export const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

/* تبدیل تقویم — پیاده‌سازی الگوریتم jalaali-js (Borkowski)، معتبر برای سال‌های ۱- تا ۳۱۷۷ */
const tdiv = (a: number, b: number) => ~~(a / b);
const tmod = (a: number, b: number) => a - ~~(a / b) * b;
const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
function jalCal(jy: number) {
  const gy = jy + 621;
  let leapJ = -14, jp = BREAKS[0], jump = 0;
  for (let i = 1; i < BREAKS.length; i++) {
    const jm = BREAKS[i]; jump = jm - jp;
    if (jy < jm) break;
    leapJ += tdiv(jump, 33) * 8 + tdiv(tmod(jump, 33), 4); jp = jm;
  }
  let n = jy - jp;
  leapJ += tdiv(n, 33) * 8 + tdiv(tmod(n, 33) + 3, 4);
  if (tmod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = tdiv(gy, 4) - tdiv((tdiv(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + tdiv(jump + 4, 33) * 33;
  let leap = tmod(tmod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}
function g2d(gy: number, gm: number, gd: number) {
  let d = tdiv((gy + tdiv(gm - 8, 6) + 100100) * 1461, 4) + tdiv(153 * tmod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - tdiv(tdiv(gy + 100100 + tdiv(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}
function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + tdiv(tdiv(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = tdiv(tmod(j, 1461), 4) * 5 + 308;
  const gd = tdiv(tmod(i, 153), 5) + 1;
  const gm = tmod(tdiv(i, 153), 12) + 1;
  const gy = tdiv(j, 1461) - 100100 + tdiv(8 - gm, 6);
  return { gy, gm, gd };
}
/** شمسی → شماره روز ژولینی */
export function toJdn({ y, m, d }: JDate): number {
  const r = jalCal(y);
  return g2d(r.gy, 3, r.march) + (m - 1) * 31 - tdiv(m, 7) * (m - 7) + d - 1;
}
export function fromJdn(jdn: number): JDate {
  const gy = d2g(jdn).gy;
  let y = gy - 621;
  const r = jalCal(y);
  let k = jdn - g2d(gy, 3, r.march);
  if (k >= 0) {
    if (k <= 185) return { y, m: 1 + tdiv(k, 31), d: tmod(k, 31) + 1 };
    k -= 186;
  } else {
    y -= 1; k += 179;
    if (r.leap === 1) k += 1;
  }
  return { y, m: 7 + tdiv(k, 30), d: tmod(k, 30) + 1 };
}
export const isLeap = (y: number) => jalCal(y).leap === 0;
export const monthLength = (y: number, m: number) => (m <= 6 ? 31 : m <= 11 ? 30 : isLeap(y) ? 30 : 29);
export const isValid = (j: JDate) => Number.isInteger(j.y) && j.m >= 1 && j.m <= 12 && j.d >= 1 && j.d <= monthLength(j.y, j.m);
/** ۰ = شنبه … ۶ = جمعه */
export const weekday = (jdn: number) => (jdn + 2) % 7;
const pad = (n: number) => String(n).padStart(2, "0");
export const key = (j: JDate) => `${j.y}/${pad(j.m)}/${pad(j.d)}`;
export const label = (j: JDate) => `${WEEKDAYS[weekday(toJdn(j))]} ${j.d} ${MONTHS[j.m - 1]} ${j.y}`;
/** تاریخ میلادی → شمسی (برای «امروز») */
export function fromGregorian(gy: number, gm: number, gd: number): JDate {
  return fromJdn(g2d(gy, gm, gd));
}
export function toGregorian(j: JDate) { return d2g(toJdn(j)); }

/* ───────── روز تعطیل ───────── */
export type HolidayOptions = { thursdayOff?: boolean; extraHolidays?: string[] };
export function holidayReason(jdn: number, o: HolidayOptions = {}): string | null {
  const j = fromJdn(jdn);
  const k = key(j);
  if (HOLIDAYS[k]) return `تعطیل رسمی (${HOLIDAYS[k]})`;
  if (o.extraHolidays?.includes(k)) return "تعطیل اعلامی (وارد شده توسط شما)";
  const w = weekday(jdn);
  if (w === 6) return "جمعه";
  if (w === 5 && o.thursdayOff) return "پنجشنبه (تعطیل ادارات)";
  return null;
}

/* ───────── محاسبه مهلت ───────── */
export type MohlatInput = HolidayOptions & {
  /** شناسه از DEADLINES، یا "custom" */
  itemId: string;
  start: JDate;
  abroad?: boolean;
  /** فقط برای custom */
  customDays?: number;
  customFromNotice?: boolean;
  customMode?: "deadline" | "earliest";
  /**
   * true (پیش‌فرض): حذف روز اقدام فقط برای مبدأ ابلاغ یا اعلام، طبق متن ماده ۴۴۵
   * false: حذف روز اقدام برای همه مهلت‌ها (رویه برخی ابزارها)
   */
  strict445?: boolean;
  today?: JDate;
};

export type MohlatResult =
  | {
      ok: true;
      item: Deadline | null;
      title: string;
      mode: "deadline" | "earliest";
      days: number[];
      end: JDate;
      endLabel: string;
      /** روزهای باقی‌مانده تا پایان (منفی = گذشته) */
      remaining: number | null;
      trace: string[];
      notes: string[];
      warnings: string[];
    }
  | { ok: false; error: string; item?: Deadline };

const NOTICE = /ابلاغ|اعلام|آگهی|انتشار/;

export function calculateMohlat(inp: MohlatInput): MohlatResult {
  if (!isValid(inp.start)) return { ok: false, error: "تاریخ مبدأ معتبر نیست." };
  const notes: string[] = [];
  const warnings: string[] = [];
  let item: Deadline | null = null;
  let days: number[], mode: "deadline" | "earliest", title: string, fromNotice: boolean;

  if (inp.itemId === "custom") {
    const n = Math.floor(inp.customDays ?? 0);
    if (!(n > 0)) return { ok: false, error: "مدت مهلت را به روز وارد کنید." };
    days = [n]; mode = inp.customMode ?? "deadline"; title = `مهلت ${n} روزه`;
    fromNotice = inp.customFromNotice ?? true;
  } else {
    item = DEADLINES.find((x) => x.id === inp.itemId) ?? null;
    if (!item) return { ok: false, error: "نوع مهلت را انتخاب کنید." };
    title = item.title; mode = item.mode; fromNotice = NOTICE.test(item.start);
    if (inp.abroad) {
      if (!item.abroad.length) return { ok: false, error: "برای این مورد، مهلت جداگانه‌ای برای مقیم خارج از کشور پیش‌بینی نشده است.", item };
      days = item.abroad;
      notes.push(item.category === "civil"
        ? "برای مقیم خارج از کشور، مواعد دو ماه (۶۰ روز) است (مواد ۴۴۳ و ۴۴۶ ق.آ.د.م)."
        : "مهلت مقیم خارج از کشور طبق ماده مربوط اعمال شد.");
    } else days = item.days;
  }

  const strict = inp.strict445 ?? true;
  const skipAction = strict ? fromNotice : true;
  const hOpt: HolidayOptions = { thursdayOff: inp.thursdayOff, extraHolidays: inp.extraHolidays };
  const endWord = mode === "earliest" ? "زودترین تاریخ" : "آخرین روز مهلت";
  const trace: string[] = [];
  let cur = toJdn(inp.start);
  trace.push(`مبدأ: ${label(inp.start)}. روز مبدأ جزو مدت حساب نمی‌شود.`);
  const years = new Set<number>();

  days.forEach((n, i) => {
    const prefix = days.length > 1 ? `مرحله ${i + 1}: ` : "";
    let end = cur + n;
    if (i === 0) {
      trace.push(`${prefix}${n} روز از ${label(fromJdn(cur + 1))} شمرده شد تا ${label(fromJdn(end))}.`);
      if (skipAction) {
        end += 1;
        trace.push(fromNotice
          ? `روز اقدام هم جزو مدت نیست (ماده ۴۴۵)؛ ${endWord}: ${label(fromJdn(end))}.`
          : `روز اقدام جزو مدت حساب نشد (تنظیم «حذف روز اقدام برای همه مهلت‌ها»)؛ ${endWord}: ${label(fromJdn(end))}.`);
      } else if (strict && !fromNotice) {
        trace.push(`مبدأ این مهلت ابلاغ یا اعلام نیست؛ ماده ۴۴۵ (حذف روز اقدام) اعمال نشد.`);
      }
    } else {
      trace.push(`${prefix}${n} روز بلافاصله از پایان مرحله قبل شمرده شد تا ${label(fromJdn(end))}.`);
    }
    let reason: string | null;
    while ((reason = holidayReason(end, hOpt))) {
      years.add(fromJdn(end).y);
      trace.push(`${label(fromJdn(end))} ${reason} است؛ به روز بعد منتقل شد (ماده ۴۴۴).`);
      end += 1;
    }
    years.add(fromJdn(end).y);
    if (days.length > 1) trace.push(`پایان مرحله ${i + 1}: ${label(fromJdn(end))}.`);
    cur = end;
  });

  const end = fromJdn(cur);
  const missing = [...years].filter((y) => !COMPLETE_YEARS.includes(y));
  if (missing.length)
    warnings.push(`تعطیلات قمری سال ${missing.join(" و ")} هنوز در تقویم رسمی منتشر نشده و در این محاسبه نیست؛ فقط جمعه‌ها و تعطیلات شمسی ثابت لحاظ شد. اگر روزهای نزدیک به پایان مهلت تعطیل رسمی شد، آن را در «روزهای تعطیل اضافه» وارد کنید.`);
  if (days.length > 1) notes.push("شمارش مرحله بعد بلافاصله از روز پایان مرحله قبل شروع می‌شود.");
  if (mode === "earliest") notes.push("این عدد حداقل فاصله قانونی است: اقدام (مثلاً تشکیل جلسه) زودتر از این تاریخ نباید انجام شود.");
  if (inp.thursdayOff) notes.push("پنجشنبه‌ها تعطیل فرض شد. ماده ۴۴۴ به «روز تعطیل ادارات» اشاره دارد؛ وضعیت پنجشنبه را با محل مرجع رسیدگی تطبیق دهید.");

  let remaining: number | null = null;
  if (inp.today && isValid(inp.today)) remaining = cur - toJdn(inp.today);

  return { ok: true, item, title, mode, days, end, endLabel: label(end), remaining, trace, notes, warnings };
}

/*
 * تست‌های مرجع (باید پاس شوند):
 * toJdn({y:1405,m:1,d:1}) → JDN شنبه ۱ فروردین ۱۴۰۵ = ۲۱ مارس ۲۰۲۶؛ weekday → ۰
 * تجدیدنظرخواهی (c23)، ابلاغ ۱ مهر ۱۴۰۵ → ۱ + ۲۰ + ۱ = ۲۲ مهر (چهارشنبه)
 * تجدیدنظرخواهی، ابلاغ ۱ مهر ۱۴۰۵، مقیم خارج → ۲ آذر ۱۴۰۵ (دوشنبه)
 * واخواهی + تجدیدنظر (c20)، ابلاغ ۱ مهر ۱۴۰۵ → ۱۲ آبان (سه‌شنبه)
 * فاصله ابلاغ تا جلسه (c5)، ابلاغ ۱ مهر → زودترین جلسه ۷ مهر (سه‌شنبه)
 * تجدیدنظرخواهی، ابلاغ ۲۹ مرداد ۱۴۰۵ → ۲۹ + ۲۱ = ۱۹ شهریور (پنجشنبه) — با پنجشنبه تعطیل → ۲۱ شهریور (شنبه)
 * طرح دعوا پس از قرار تأمین (c7)، صدور ۱ مهر → ۱۱ مهر؛ با strict445: false → ۱۲ مهر
 * (همه موارد بالا با یک ابزار مستقل تطبیق داده شده‌اند؛ در حالت strict445: false عین آن است)
 */
