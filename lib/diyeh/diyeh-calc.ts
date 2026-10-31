/**
 * محاسبه دیه — قانون مجازات اسلامی ۱۳۹۲ (کتاب چهارم)
 * توابع خالص؛ مبالغ به ریال؛ کسرها با اعداد صحیح و گرد کردن فقط در پایان هر ردیف.
 *
 * ترتیب محاسبه هر ردیف:
 *  ۱) کسر قانونی نسبت به دیه کامل مرد (یا نسبت به دیه کامل زن در موارد base=female)
 *  ۲) جنسیت مجنی‌علیه:
 *     - نفس: زن نصف (ماده ۵۵۰)، خنثای ملحق به مرد/زن مثل همان، خنثای مشکل سه‌چهارم (ماده ۵۵۱)
 *     - اعضا، منافع و جراحات: تا کمتر از ثلث برابر؛ از ثلث به بالا زن نصف (ماده ۵۶۰)،
 *       ملاک ثلث، دیه هر آسیب به‌طور جداگانه است (ماده ۵۶۱)؛ خنثای مشکل: میانگین دیه مرد و زن
 *     - نافذه در زن: ارش (ماده ۷۱۳)؛ ارش: بدون تفاوت زن و مرد (ماده ۵۶۲)
 *  ۳) تفاوت دیه تا سقف دیه مرد، در هر جنایتی که مجنی‌علیه مرد نیست، از صندوق تأمین خسارت‌های بدنی (تبصره ماده ۵۵۱)
 *  ۴) تغلیظ: فقط قتل و جنین پس از دمیدن روح، اگر رفتار و فوت هر دو در ماه حرام یا حرم مکه باشد — یک‌سوم افزوده (مواد ۵۵۵ تا ۵۵۷)
 *  ۵) جنایت بر میت: یک‌دهم دیه یا ارش انسان زنده (مواد ۷۲۲ و ۷۲۳)
 *  ۶) پرداخت‌کننده و مهلت: مواد ۴۶۲، ۴۶۳، ۴۶۷، ۴۸۸ و ۴۸۹؛ نرخ ملاک: زمان پرداخت (ماده ۴۹۰)
 */
import { toFaDigits as faD } from "../tadieh/tadieh-calc";
import {
  DIYEH_RATES, LATEST_RATE_YEAR, ITEMS, ORGANS, ORGAN_INJURIES, CRIME_TYPES, LUNAR_YEAR_DAYS, GROUPS, EXCLUSIVE,
  type Item, type CrimeType,
} from "./diyeh-data";
export { formatRial, numberToWords, parseAmount, toFaDigits } from "../tadieh/tadieh-calc";
export { DIYEH_RATES, LATEST_RATE_YEAR, ITEMS, CATEGORIES, ORGANS, ORGAN_INJURIES, CRIME_TYPES, GROUPS, EXCLUSIVE, LAW } from "./diyeh-data";

export type Victim = "male" | "female" | "khonsaMale" | "khonsaFemale" | "khonsaMoshkel";
export const VICTIMS: Record<Victim, string> = {
  male: "مرد",
  female: "زن",
  khonsaMale: "خنثای ملحق به مرد",
  khonsaFemale: "خنثای ملحق به زن",
  khonsaMoshkel: "خنثای مشکل",
};

export type Line =
  | { type: "nafs" }
  | { type: "item"; id: string; qty?: number }
  | { type: "organ"; organId: string; injuryId: string; qty?: number; percent?: number; organNum?: number; organDen?: number }
  | { type: "fraction"; num: number; den: number; qty?: number; title?: string }
  | { type: "percent"; percent: number; qty?: number; title?: string }
  | { type: "arshPercent"; percent: number; title?: string; art?: string }
  | { type: "arshAmount"; amount: number; title?: string; art?: string };

export type DiyehInput = {
  /** سال نرخ (پیش‌فرض: آخرین سال) — ملاک، نرخ زمان پرداخت است (ماده ۴۹۰) */
  year?: number;
  /** نرخ دلخواه دیه کامل مرد در ماه غیرحرام (ریال)؛ بر year مقدم است */
  rate?: number;
  victim: Victim;
  /** رفتار و فوت هر دو در ماه حرام یا حرم مکه (ماده ۵۵۵) */
  haram?: boolean;
  crimeType?: CrimeType;
  /** جنایت بر میت (ماده ۷۲۲) */
  deceased?: boolean;
  /** اعمال ماده ۵۶۰ بر جراحات (پیش‌فرض true — رویه غالب) */
  apply560ToWounds?: boolean;
  lines: Line[];
};

type Frac = [number, number];
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const red = ([n, d]: Frac): Frac => { const g = gcd(n, d) || 1; return [n / g, d / g]; };
const mul = (a: Frac, b: Frac): Frac => red([a[0] * b[0], a[1] * b[1]]);
const ge = (a: Frac, b: Frac) => a[0] * b[1] >= b[0] * a[1];
const ONE_THIRD: Frac = [1, 3];
const MOZEHEH: Frac = [1, 20];
const amountOf = (rate: number, f: Frac) => Math.round((rate * f[0]) / f[1]);
export const fracText = ([n, d]: Frac) => (d === 1 ? (n === 1 ? "دیه کامل" : `${n} دیه کامل`) : `${n}/${d}`);

export type LineResult = {
  title: string;
  art: string;
  qty: number;
  kind: "diyeh" | "arsh" | "rule";
  /** کسر دیه مرد برای یک واحد (نسبت به دیه کامل) */
  maleFrac?: Frac;
  /** کسر اعمال‌شده برای مجنی‌علیه برای یک واحد */
  appliedFrac?: Frac;
  /** سهم پرداخت‌کننده (ریال) — جمع همه واحدها */
  amount: number;
  /** سهم صندوق تأمین خسارت‌های بدنی (تبصره ماده ۵۵۱) */
  fund: number;
  /** کمتر از موضحه است؛ عاقله در خطای محض ضامن نیست (ماده ۴۶۷) */
  belowMozeheh: boolean;
  notes: string[];
};

export type DiyehResult =
  | { ok: false; error: string }
  | {
      ok: true;
      rate: number;
      /** نرخ اعمال‌شده برای قتل (پس از تغلیظ) */
      fullDiyeh: number;
      lines: LineResult[];
      payerTotal: number;
      fundTotal: number;
      /** مجموع دریافتی مجنی‌علیه یا اولیای دم */
      victimTotal: number;
      arshCount: number;
      payment: {
        crimeType: CrimeType;
        title: string;
        payer: string;
        years: number;
        /** سهم عاقله (خطای محض، موضحه و بیشتر) و سهم خود مرتکب */
        aqelehShare: number;
        offenderShare: number;
        installments: { year: number; amount: number; dueDays: number }[];
        art: string;
      } | null;
      notes: string[];
    };

/** کسر جنسیت برای اعضا/منافع/جراحات (ماده ۵۶۰ و ۵۶۱) */
function sexAdjust(male: Frac, victim: Victim): { frac: Frac; note?: string } {
  if (victim === "male" || victim === "khonsaMale") return { frac: male };
  if (!ge(male, ONE_THIRD)) return { frac: male };
  if (victim === "khonsaMoshkel") return { frac: mul(male, [3, 4]), note: "ثلث یا بیشتر — نصف دیه مرد به‌علاوه نصف دیه زن (مواد ۵۵۱ و ۵۶۰)" };
  return { frac: mul(male, [1, 2]), note: "ثلث یا بیشتر — دیه زن نصف دیه مرد (ماده ۵۶۰)" };
}

function nafsFrac(victim: Victim): Frac {
  return victim === "male" || victim === "khonsaMale" ? [1, 1] : victim === "khonsaMoshkel" ? [3, 4] : [1, 2];
}

export function getRate(year?: number): number | null {
  const y = year ?? LATEST_RATE_YEAR;
  return DIYEH_RATES[y] ?? null;
}

export function calculateDiyeh(inp: DiyehInput): DiyehResult {
  const rate = inp.rate ?? getRate(inp.year);
  if (!rate || !(rate > 0)) return { ok: false, error: "نرخ دیه برای این سال موجود نیست؛ نرخ را دستی وارد کنید" };
  if (!inp.lines.length) return { ok: false, error: "حداقل یک مورد را اضافه کنید" };
  const victim = inp.victim;
  const female = victim === "female" || victim === "khonsaFemale";
  const deceased = !!inp.deceased;
  const w560 = inp.apply560ToWounds !== false;
  const tagliz: Frac = inp.haram ? [4, 3] : [1, 1];
  const dec: Frac = deceased ? [1, 10] : [1, 1];
  const out: LineResult[] = [];
  const globalNotes: string[] = [];
  let arshCount = 0;

  const push = (r: LineResult) => out.push(r);

  const conflict = checkConflicts(inp.lines);
  if (conflict) return { ok: false, error: conflict };
  if (deceased && inp.lines.some((l) => l.type === "item" && ITEMS.find((i) => i.id === l.id)?.cat === "fetus"))
    return { ok: false, error: "سقط جنین با «جنایت بر میت» جمع نمی‌شود" };

  for (const ln of inp.lines) {
    const qty = Math.max(1, Math.floor(("qty" in ln && ln.qty) || 1));
    if (ln.type === "nafs") {
      if (deceased) return { ok: false, error: "قتل و جنایت بر میت با هم جمع نمی‌شوند" };
      const male: Frac = [1, 1];
      let applied = nafsFrac(victim);
      const notes: string[] = [];
      if (victim !== "male") notes.push(victim === "khonsaMoshkel" ? "خنثای مشکل: نصف دیه مرد به‌علاوه نصف دیه زن (ماده ۵۵۱)" : victim === "khonsaMale" ? "خنثای ملحق به مرد: دیه مرد (ماده ۵۵۱)" : "دیه قتل زن نصف دیه مرد (مواد ۵۵۰ و ۵۵۱)");
      let maleT = male;
      if (inp.haram) { applied = mul(applied, tagliz); maleT = mul(male, tagliz); notes.push("تغلیظ: یک‌سوم افزوده (ماده ۵۵۵)"); }
      const amount = amountOf(rate, applied);
      const fund = amountOf(rate, maleT) - amount;
      push({ title: "دیه نفس (قتل)", art: "مواد ۵۴۹ تا ۵۵۵", qty: 1, kind: "diyeh", maleFrac: maleT, appliedFrac: applied, amount, fund, belowMozeheh: false, notes });
      continue;
    }
    if (ln.type === "arshAmount") {
      const amt = Math.round(ln.amount * (deceased ? 0.1 : 1));
      if (!(ln.amount > 0)) return { ok: false, error: "مبلغ ارش را وارد کنید" };
      const notes = deceased ? ["یک‌دهم ارش انسان زنده (ماده ۷۲۳)"] : [];
      push({ title: ln.title || "ارش (مبلغ تعیین‌شده)", art: ln.art || "مواد ۴۴۹ و ۵۶۲", qty: 1, kind: "arsh", amount: amt, fund: 0, belowMozeheh: !ge([amt, rate], MOZEHEH), notes });
      continue;
    }
    if (ln.type === "arshPercent") {
      if (!(ln.percent > 0 && ln.percent <= 100)) return { ok: false, error: "درصد ارش باید بین ۰ و ۱۰۰ باشد" };
      const f = mul(red([Math.round(ln.percent * 1000), 100_000]), dec);
      const notes: string[] = [];
      if (deceased) notes.push("یک‌دهم ارش انسان زنده (ماده ۷۲۳)");
      push({ title: ln.title || `ارش ${faD(ln.percent)}٪ دیه کامل`, art: ln.art || "مواد ۴۴۹ و ۵۶۲", qty: 1, kind: "arsh", maleFrac: f, appliedFrac: f, amount: amountOf(rate, f), fund: 0, belowMozeheh: !ge(f, MOZEHEH), notes });
      continue;
    }

    // موارد دارای کسر معین
    let title = "";
    let art = "";
    let unit: Frac;
    let item: Item | undefined;
    const notes: string[] = [];
    let isWound = false;
    if (ln.type === "item") {
      item = ITEMS.find((i) => i.id === ln.id);
      if (!item) return { ok: false, error: `مورد ناشناخته: ${ln.id}` };
      title = item.title; art = item.art;
      if (item.note) notes.push(item.note);
      if (item.sex === "m" && victim !== "male" && victim !== "khonsaMale") {
        if (item.cat === "sexual" && victim !== "female") {
          arshCount++;
          push({ title, art: "ماده ۶۶۷", qty, kind: "arsh", amount: 0, fund: 0, belowMozeheh: false, notes: ["قطع بیضه‌ها یا اندام تناسلی مردانه خنثای مشکل یا ملحق به زن موجب ارش است (ماده ۶۶۷)"] });
          continue;
        }
        return { ok: false, error: `«${item.title}» فقط برای مرد است` };
      }
      if (item.sex === "f" && !female && victim !== "khonsaMoshkel") return { ok: false, error: `«${item.title}» فقط برای زن است` };
      if (item.max && qty > item.max) return { ok: false, error: `تعداد «${item.title}» حداکثر ${faD(item.max)} است` };
      if (item.kind === "rule") return { ok: false, error: `«${item.title}» حکم خاص دارد و مستقیم محاسبه نمی‌شود: ${item.note}` };
      if (item.kind === "arsh") {
        arshCount++;
        push({ title, art, qty: 1, kind: "arsh", amount: 0, fund: 0, belowMozeheh: false, notes: ["ارش — مبلغ یا درصد وارد نشده"] });
        continue;
      }
      if (item.femaleArsh && (female || victim === "khonsaMoshkel")) {
        arshCount++;
        push({ title, art, qty, kind: "arsh", amount: 0, fund: 0, belowMozeheh: false, notes: ["در زن، نافذه موجب ارش است (ماده ۷۱۳) — مبلغ را از بخش ارش وارد کنید"] });
        continue;
      }
      unit = [item.num!, item.den!];
      isWound = item.cat === "wound" || item.cat === "skin";
    } else if (ln.type === "organ") {
      const organ = ORGANS.find((o) => o.id === ln.organId);
      const inj = ORGAN_INJURIES.find((o) => o.id === ln.injuryId);
      if (!organ && ln.organId !== "custom") return { ok: false, error: "عضو نامعتبر" };
      if (!inj) return { ok: false, error: "نوع آسیب نامعتبر" };
      let oFrac: Frac;
      if (ln.organId === "custom") {
        if (!(ln.organNum! > 0 && ln.organDen! > 0 && ln.organNum! <= ln.organDen!)) return { ok: false, error: "کسر دیه عضو نامعتبر است" };
        oFrac = red([ln.organNum!, ln.organDen!]);
      } else oFrac = [organ!.num, organ!.den];
      let injF: Frac = [inj.num, inj.den];
      if (inj.percent) {
        if (!(ln.percent! > 0 && ln.percent! <= 100)) return { ok: false, error: "درصد از بین رفته باید بین ۰ و ۱۰۰ باشد" };
        injF = red([Math.round(ln.percent! * 1000), 100_000]);
      }
      unit = mul(oFrac, injF);
      title = `${inj.percent ? `${faD(ln.percent!)}٪ ` : ""}${inj.title} — ${organ ? organ.title : `عضو با دیه ${faD(oFrac[0])}/${faD(oFrac[1])}`}`;
      art = `${inj.art}${organ ? ` + ${organ.art}` : ""}`;
      isWound = ["hares", "damie", "motalahemeh", "samhagh", "mozeheh"].includes(inj.id);
    } else if (ln.type === "fraction") {
      if (!(Number.isInteger(ln.num) && Number.isInteger(ln.den) && ln.num > 0 && ln.den > 0 && ln.num <= ln.den)) return { ok: false, error: "کسر باید صحیح و حداکثر برابر دیه کامل باشد" };
      unit = red([ln.num, ln.den]);
      title = ln.title || `کسر ${faD(unit[0])}/${faD(unit[1])} دیه کامل`;
      art = "کسر دلخواه";
    } else {
      if (!(ln.percent > 0 && ln.percent <= 100)) return { ok: false, error: "درصد باید بین ۰ و ۱۰۰ باشد" };
      unit = red([Math.round(ln.percent * 1000), 100_000]);
      title = ln.title || `${faD(ln.percent)}٪ دیه کامل`;
      art = "درصد دلخواه";
    }

    // جنسیت
    let applied: Frac;
    let maleUnit: Frac = unit;
    let fundApplies = true;
    if (item?.base === "female") {
      // کسر نسبت به دیه کامل زن است؛ معادل مردانه ندارد
      applied = mul(unit, [1, 2]);
      maleUnit = applied;
      fundApplies = false;
    } else if (item?.no560) {
      applied = unit;
    } else if (isWound && !w560) {
      applied = unit;
    } else {
      const s = sexAdjust(unit, victim);
      applied = s.frac;
      if (s.note && victim !== "male" && victim !== "khonsaMale") notes.push(s.note);
    }
    if (item?.tagliz && inp.haram) {
      applied = mul(applied, tagliz); maleUnit = mul(maleUnit, tagliz);
      notes.push("تغلیظ جنین پس از دمیدن روح (ماده ۵۵۶)");
    }
    if (deceased) {
      applied = mul(applied, dec); maleUnit = mul(maleUnit, dec);
      fundApplies = false;
      notes.push("جنایت بر میت: یک‌دهم (ماده ۷۲۲)");
    }
    const amount = amountOf(rate, applied) * qty;
    const fund = fundApplies ? amountOf(rate, maleUnit) * qty - amount : 0;
    push({ title, art, qty, kind: "diyeh", maleFrac: maleUnit, appliedFrac: applied, amount, fund, belowMozeheh: !ge(applied, MOZEHEH), notes });
  }

  const payerTotal = out.reduce((s, l) => s + l.amount, 0);
  const fundTotal = out.reduce((s, l) => s + l.fund, 0);

  // پرداخت
  let payment: Extract<DiyehResult, { ok: true }>["payment"] = null;
  if (inp.crimeType && !deceased) {
    const ct = CRIME_TYPES[inp.crimeType];
    const aqelehShare = inp.crimeType === "khata" ? out.filter((l) => !l.belowMozeheh).reduce((s, l) => s + l.amount, 0) : 0;
    const offenderShare = payerTotal - aqelehShare;
    const installments: { year: number; amount: number; dueDays: number }[] = [];
    if (inp.crimeType === "amd") installments.push({ year: 1, amount: payerTotal, dueDays: Math.round(LUNAR_YEAR_DAYS) });
    else {
      const n = ct.years;
      let paid = 0;
      for (let k = 1; k <= n; k++) {
        const amt = k === n ? payerTotal - paid : Math.round(payerTotal / n);
        paid += amt;
        installments.push({ year: k, amount: amt, dueDays: Math.round(LUNAR_YEAR_DAYS * k) });
      }
    }
    payment = { crimeType: inp.crimeType, title: ct.title, payer: ct.payer, years: ct.years, aqelehShare, offenderShare, installments, art: ct.art };
  }
  if (deceased) globalNotes.push("دیه جنایت بر میت حالّ است، به ارث نمی‌رسد و توسط خود مرتکب پرداخت می‌شود (مواد ۷۲۲ تبصره، ۷۲۵ و ۷۲۶)");
  if (inp.haram && !out.some((l) => l.title.startsWith("دیه نفس") || l.notes.some((n) => n.includes("ماده ۵۵۶"))))
    globalNotes.push("تغلیظ ماه حرام فقط در قتل و جنین پس از دمیدن روح است و در اعضا و منافع جاری نیست (ماده ۵۵۷)");
  if (fundTotal > 0) globalNotes.push("در جنایت بر غیر مرد، تفاوت دیه تا سقف دیه مرد از صندوق تأمین خسارت‌های بدنی پرداخت می‌شود (تبصره ماده ۵۵۱)؛ در حوادث رانندگی دارای بیمه، این تفاوت طبق قانون بیمه اجباری ۱۳۹۵ معمولاً بر عهده بیمه‌گر است");
  if (out.some((l) => l.kind === "arsh")) globalNotes.push("در ارش فرقی میان زن و مرد نیست، ولی ارش جنایت بر زن نباید از دیه همان عضو یا منفعت در زن بیشتر شود (ماده ۵۶۲) و ارش عضو دارای دیه مقدر از دیه آن عضو بیشتر نمی‌شود (ماده ۵۴۸)");
  if (inp.lines.some((l) => l.type === "nafs") && inp.lines.length > 1)
    globalNotes.push("اگر صدمات دیگر به فوت انجامیده (سرایت)، دیه آنها در دیه نفس تداخل می‌کند و فقط دیه نفس پرداخت می‌شود؛ فقط صدماتی را نگه دارید که با جنایت جداگانه و مستقل از قتل وارد شده‌اند");
  const ids = new Set(inp.lines.filter((l) => l.type === "item").map((l) => (l as { id: string }).id));
  if (["e-both", "e-one", "e-only"].some((i) => ids.has(i)) && ["sg-both", "sg-one", "sg-only", "sg-only-qisas"].some((i) => ids.has(i)))
    globalNotes.push("درآوردن چشم فقط یک دیه دارد و زوال بینایی همان چشم دیه دیگری ندارد (ماده ۶۹۲) — بینایی را فقط برای چشم دیگر وارد کنید");
  if (arshCount) globalNotes.push("برخی ردیف‌های ارش مبلغ ندارند و در جمع لحاظ نشده‌اند؛ مبلغ یا درصد ارش را طبق نظر پزشکی قانونی وارد کنید");
  globalNotes.push("ملاک، نرخ دیه در زمان پرداخت است مگر بر مبلغ قطعی توافق شده باشد (ماده ۴۹۰)");

  return {
    ok: true,
    rate,
    fullDiyeh: amountOf(rate, tagliz),
    lines: out,
    payerTotal,
    fundTotal,
    victimTotal: payerTotal + fundTotal,
    arshCount,
    payment,
    notes: globalNotes,
  };
}

/** بررسی محدودیت‌های بدن (تعداد اعضا) و حالت‌های ناسازگار؛ پیام خطا یا null */
export function checkConflicts(lines: Line[]): string | null {
  const qty = new Map<string, number>();
  let nafs = 0;
  for (const l of lines) {
    if (l.type === "nafs") nafs++;
    if (l.type === "item") qty.set(l.id, (qty.get(l.id) || 0) + Math.max(1, Math.floor(l.qty || 1)));
  }
  if (nafs > 1) return "دیه قتل برای هر نفر فقط یک بار است";
  for (const [id, n] of qty) {
    const it = ITEMS.find((i) => i.id === id);
    if (it?.max && n > it.max) return `«${it.title}» حداکثر ${faD(it.max)} مورد دارد`;
  }
  for (const g of GROUPS) {
    let sum = 0;
    for (const [id, w] of Object.entries(g.w)) sum += (qty.get(id) || 0) * w;
    if (sum > g.cap) return `مجموع موارد ${g.title} بیش از حد طبیعی است`;
  }
  for (const e of EXCLUSIVE) {
    const a = e.ids.filter((i) => qty.has(i));
    if (e.with) { if (a.length && e.with.some((i) => qty.has(i))) return e.title; }
    else if (a.length > 1) return e.title;
  }
  return null;
}
