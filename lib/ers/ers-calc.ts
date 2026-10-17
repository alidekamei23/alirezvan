/**
 * محاسبه سهم‌الارث طبق قانون مدنی ایران (مواد ۸۶۱ تا ۹۴۹)
 * توابع خالص. کسرها دقیق (BigInt) محاسبه می‌شوند تا خطای گردکردن در سهم‌ها نباشد.
 *
 * پوشش:
 *  - زوج / زوجه یا زوجه‌ها (مواد ۹۱۳، ۹۲۷، ۹۳۸، ۹۴۲، ۹۴۶، ۹۴۹)
 *  - طبقه اول: پدر، مادر، فرزندان؛ نوه‌ها به قائم‌مقامی در صورت نبودن فرزند (۹۰۶ تا ۹۱۴)
 *    حجب مادر (۸۹۲ ب)، رد (۹۰۸، ۹۰۹، ۹۱۴)، ورود نقص بر دختران (۹۱۴)، حمل (۸۷۸)
 *  - طبقه دوم: اجداد چهارگانه، اخوه ابوینی، ابی و امی؛ اولاد اخوه به قائم‌مقامی (۹۱۶ تا ۹۲۷)
 *  - طبقه سوم: اعمام، عمات، اخوال و خالات ابوینی، ابی و امی (۹۲۸ تا ۹۳۸)
 *  - دیون، هزینه‌ها و وصیت تا ثلث پیش از تقسیم (۸۶۸ تا ۸۷۰)
 * خارج از پوشش (با پیام صریح): نسل‌های پایین‌تر از نوه و اولاد برادر و خواهر،
 * اجداد درجه دوم، اولاد اعمام و اخوال (۹۳۶ و ۹۳۷)، خنثی (۹۳۹).
 */

/* ───────── کسر دقیق ───────── */
export class Frac {
  readonly n: bigint;
  readonly d: bigint;
  constructor(n: bigint | number, d: bigint | number = 1n) {
    let N = BigInt(n), D = BigInt(d);
    if (D === 0n) throw new RangeError("مخرج صفر");
    if (D < 0n) { N = -N; D = -D; }
    const g = gcd(N < 0n ? -N : N, D);
    this.n = N / g; this.d = D / g;
  }
  static of(n: number, d = 1) { return new Frac(BigInt(n), BigInt(d)); }
  add(o: Frac) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o: Frac) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o: Frac) { return new Frac(this.n * o.n, this.d * o.d); }
  div(o: Frac) { return new Frac(this.n * o.d, this.d * o.n); }
  cmp(o: Frac) { const a = this.n * o.d, b = o.n * this.d; return a < b ? -1 : a > b ? 1 : 0; }
  isZero() { return this.n === 0n; }
  toNumber() { return Number(this.n) / Number(this.d); }
  toString() { return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`; }
}
function gcd(a: bigint, b: bigint): bigint { while (b) { [a, b] = [b, a % b]; } return a || 1n; }
const F = Frac.of;
const ZERO = F(0), ONE = F(1);
const sum = (xs: Frac[]) => xs.reduce((a, b) => a.add(b), ZERO);

/* ───────── ورودی ───────── */
export type Gender = "m" | "f";
/** نسل یک فرزند یا برادر/خواهر فوت‌شده که از طریق او به متوفی می‌رسند */
export type Branch = { via: Gender; sons: number; daughters: number };
export type SiblingBranch = Branch & { side: "full" | "paternal" | "maternal" };

export type ErsInput = {
  deceased: Gender;
  /** زوج زنده (وقتی متوفی زن است) */
  husband?: boolean;
  /** تعداد زوجه‌های دائم زنده (وقتی متوفی مرد است) */
  wives?: number;

  // طبقه اول
  father?: boolean;
  mother?: boolean;
  sons?: number;
  daughters?: number;
  /** نوه‌ها، فقط وقتی متوفی هیچ فرزند زنده‌ای ندارد (ماده ۹۱۱) */
  grandchildren?: Branch[];
  /** حمل در زمان فوت (ماده ۸۷۸) */
  pregnancy?: boolean;
  /** برادر و خواهر ابوینی یا ابی زنده — فقط برای حجب مادر (ماده ۸۹۲ ب). اگر خالی باشد از fullBrothers+patBrothers و fullSisters+patSisters گرفته می‌شود */
  hajibBrothers?: number;
  hajibSisters?: number;

  // طبقه دوم
  fullBrothers?: number; fullSisters?: number;
  patBrothers?: number; patSisters?: number;
  matBrothers?: number; matSisters?: number;
  patGrandfather?: boolean; patGrandmother?: boolean;
  matGrandfather?: boolean; matGrandmother?: boolean;
  /** اولاد اخوه، فقط وقتی هیچ برادر و خواهری نیست (ماده ۹۲۵) */
  nephews?: SiblingBranch[];

  // طبقه سوم: ammu=عمو، amme=عمه، dayi=دایی، khale=خاله
  ammuFull?: number; ammeFull?: number; ammuPat?: number; ammePat?: number; ammuMat?: number; ammeMat?: number;
  dayiFull?: number; khaleFull?: number; dayiPat?: number; khalePat?: number; dayiMat?: number; khaleMat?: number;

  // ترکه (اختیاری؛ برای مبلغ)
  estate?: number;
  /** کفن، دیون و واجبات مالی (ماده ۸۶۹ بند ۱ و ۲) */
  debts?: number;
  /** مبلغ وصیت (ماده ۸۶۹ بند ۳) */
  will?: number;
  /** ورثه زائد بر ثلث را اجازه داده‌اند */
  willApproved?: boolean;
};

/* ───────── خروجی ───────── */
export type Share = {
  key: string;
  label: string;
  count: number;
  /** سهم کل گروه از ترکه */
  total: Frac;
  /** سهم هر نفر */
  each: Frac;
  basis: string;
  /** سهم کنار گذاشته (حمل) */
  reserved?: boolean;
};

export type ErsResult =
  | {
      ok: true;
      tabaqe: 0 | 1 | 2 | 3;
      shares: Share[];
      /** سهمی که به حاکم می‌رسد (مواد ۸۶۶ و ۹۴۹) */
      hakem: Frac;
      notes: string[];
      warnings: string[];
      money: null | { estate: number; debts: number; will: number; net: number; perShare: (s: Share) => { total: number; each: number } };
      /** مخرج مشترک همه سهم‌ها، برای نمایش «سهم از n» */
      lcd: bigint;
    }
  | { ok: false; error: string };

const n0 = (x?: number) => Math.max(0, Math.floor(x ?? 0));

/* تقسیم یک سهم بین واحدها با وزن (پسر ۲ / دختر ۱ یا بالسویه) */
type Unit = { key: string; label: string; weight: number; count: number; basis: string; branch?: Branch; branchEqual?: boolean; reserved?: boolean };

function distribute(total: Frac, units: Unit[], out: Share[]) {
  const W = units.reduce((a, u) => a + u.weight * u.count, 0);
  if (!W) return;
  for (const u of units) {
    if (!u.count) continue;
    const unitTotal = total.mul(F(u.weight * u.count, W));
    if (u.branch) splitBranch(unitTotal, u, out);
    else out.push({ key: u.key, label: u.label, count: u.count, total: unitTotal, each: unitTotal.div(F(u.count)), basis: u.basis, reserved: u.reserved });
  }
}

/* سهم یک نسل بین فرزندان او: پسر دو برابر دختر، یا بالسویه برای کلاله امی */
function splitBranch(total: Frac, u: Unit, out: Share[]) {
  const b = u.branch!;
  const s = n0(b.sons), d = n0(b.daughters);
  const ws = u.branchEqual ? 1 : 2;
  const W = s * ws + d;
  if (s) { const t = total.mul(F(s * ws, W)); out.push({ key: `${u.key}-s`, label: `${u.label} — پسر`, count: s, total: t, each: t.div(F(s)), basis: u.basis }); }
  if (d) { const t = total.mul(F(d, W)); out.push({ key: `${u.key}-d`, label: `${u.label} — دختر`, count: d, total: t, each: t.div(F(d)), basis: u.basis }); }
}

const branchCount = (b: Branch) => n0(b.sons) + n0(b.daughters);

/* ───────── محاسبه ───────── */
export function calculateErs(inp: ErsInput): ErsResult {
  const notes: string[] = [];
  const warnings: string[] = [];
  const shares: Share[] = [];
  let hakem = ZERO;

  const isMale = inp.deceased === "m";
  const husband = !isMale && !!inp.husband;
  const wives = isMale ? n0(inp.wives) : 0;
  if (wives > 4) return { ok: false, error: "تعداد زوجه‌های دائم نمی‌تواند بیش از چهار باشد." };
  const hasSpouse = husband || wives > 0;

  /* ── طبقه اول ── */
  const father = !!inp.father, mother = !!inp.mother;
  let sons = n0(inp.sons), daughters = n0(inp.daughters);
  const preg = !!inp.pregnancy;
  const gBranches = (inp.grandchildren ?? []).filter((b) => branchCount(b) > 0);
  if (sons + daughters > 0 && gBranches.length)
    notes.push("با وجود فرزند، نوه‌ها ارث نمی‌برند (ماده ۹۱۰).");
  const useBranches = sons + daughters === 0 && gBranches.length > 0;
  const hasChild = sons + daughters > 0 || useBranches || preg;
  const tab1 = father || mother || hasChild;

  if (preg && useBranches)
    return { ok: false, error: "حمل اگر زنده متولد شود مانع ارث نوه‌هاست؛ طبق ماده ۸۷۸ تقسیم تا روشن شدن وضعیت حمل انجام نمی‌شود." };
  if (preg && sons + daughters === 0 && !useBranches && !father && !mother)
    return { ok: false, error: "حمل در این حالت مانع ارث وراث طبقات بعد است؛ طبق ماده ۸۷۸ تقسیم تا روشن شدن وضعیت حمل انجام نمی‌شود." };

  // سهم زوجین
  const spouseShare = husband ? (hasChild ? F(1, 4) : F(1, 2)) : wives ? (hasChild ? F(1, 8) : F(1, 4)) : ZERO;
  const pushSpouse = (share: Frac, basis: string) => {
    if (husband) shares.push({ key: "husband", label: "زوج (شوهر)", count: 1, total: share, each: share, basis });
    if (wives) shares.push({ key: "wife", label: wives > 1 ? "زوجه‌ها" : "زوجه", count: wives, total: share, each: share.div(F(wives)), basis: wives > 1 ? basis + " و ۹۴۲" : basis });
  };

  if (tab1) {
    // اگر جدا داده نشود، برادر و خواهرهای ابوینی و ابی وارد شده در طبقه دوم ملاک حجب‌اند
    const B = n0(inp.hajibBrothers ?? n0(inp.fullBrothers) + n0(inp.patBrothers));
    const S = n0(inp.hajibSisters ?? n0(inp.fullSisters) + n0(inp.patSisters));
    const hajib = father && mother && (B >= 2 || (B >= 1 && S >= 2) || S >= 4);
    if (father && mother && (B || S) && !hajib) notes.push("تعداد برادر و خواهر برای حجب مادر کافی نیست (ماده ۸۹۲ بند ب).");
    if (hajib) notes.push("مادر حاجب دارد (ماده ۸۹۲ بند ب): برادران و خواهران ابوینی یا ابی خودشان ارث نمی‌برند ولی سهم مادر را کم می‌کنند.");

    if (hasSpouse) pushSpouse(spouseShare, "ماده ۹۱۳");
    let rest = ONE.sub(spouseShare);

    if (hasChild) {
      // واحدهای فرزند
      const units: Unit[] = [];
      if (useBranches) {
        gBranches.forEach((b, i) => units.push({
          key: `g${i}`, label: `نوه‌ها از ${b.via === "m" ? "پسر" : "دختر"} فوت‌شده ${i + 1}`,
          weight: b.via === "m" ? 2 : 1, count: 1, basis: "مواد ۹۱۱ و ۹۱۲", branch: b,
        }));
        notes.push("نوه‌ها قائم‌مقام پدر یا مادر خود هستند: هر نسل سهم کسی را می‌برد که از طریق او به متوفی می‌رسد (ماده ۹۱۱).");
      } else {
        if (sons) units.push({ key: "sons", label: "پسر", weight: 2, count: sons, basis: "ماده ۹۰۷" });
        if (daughters) units.push({ key: "daughters", label: "دختر", weight: 1, count: daughters, basis: sons ? "ماده ۹۰۷" : daughters === 1 ? "مواد ۸۹۹ و ۹۰۸" : "مواد ۹۰۲ و ۹۰۹" });
      }
      if (preg) {
        units.push({ key: "preg", label: "سهم کنار گذاشته برای حمل (معادل دو پسر)", weight: 2, count: 2, basis: "ماده ۸۷۸", reserved: true });
        warnings.push("سهم حمل معادل دو پسر کنار گذاشته شده و سهم سایر وراث مراعی است تا وضعیت حمل معلوم شود (ماده ۸۷۸).");
      }
      const maleUnits = units.some((u) => u.weight === 2 && u.count > 0);
      const femaleCount = units.filter((u) => u.weight === 1).reduce((a, u) => a + u.count, 0);
      const pFard = F(1, 6);
      const parentsList: { key: string; label: string }[] = [];
      if (father) parentsList.push({ key: "father", label: "پدر" });
      if (mother) parentsList.push({ key: "mother", label: "مادر" });
      const parentsTotal = pFard.mul(F(parentsList.length));

      if (maleUnits || parentsList.length === 0) {
        // پدر و مادر هر کدام سدس؛ باقی بین فرزندان، پسر دو برابر دختر
        for (const p of parentsList) shares.push({ key: p.key, label: p.label, count: 1, total: pFard, each: pFard, basis: "مواد ۸۹۲ بند الف و ۹۰۴" });
        distribute(rest.sub(parentsTotal), units, shares);
        if (!maleUnits && parentsList.length === 0 && femaleCount)
          notes.push("دختر یا دخترها فرض خود را می‌برند و باقی ترکه به عنوان رد به آن‌ها می‌رسد (مواد ۹۰۵ و ۹۰۷).");
      } else {
        // فقط دختر یا دخترها با پدر و/یا مادر
        const dFard = femaleCount === 1 ? F(1, 2) : F(2, 3);
        const totalFard = spouseShare.add(parentsTotal).add(dFard);
        if (totalFard.cmp(ONE) >= 0) {
          for (const p of parentsList) shares.push({ key: p.key, label: p.label, count: 1, total: pFard, each: pFard, basis: "ماده ۹۰۴" });
          const dGet = rest.sub(parentsTotal);
          distribute(dGet, units, shares);
          if (totalFard.cmp(ONE) > 0) notes.push("مجموع فرض‌ها بیشتر از ترکه است؛ نقص بر دختر یا دخترها وارد شده است (ماده ۹۱۴).");
        } else {
          // رد به دختران و ابوین به نسبت فرض؛ زوجین و مادرِ دارای حاجب از رد سهم نمی‌برند
          const leftover = ONE.sub(totalFard);
          const raddParents = parentsList.filter((p) => !(p.key === "mother" && hajib));
          const raddBase = dFard.add(pFard.mul(F(raddParents.length)));
          for (const p of parentsList) {
            const gets = raddParents.includes(p) ? pFard.add(leftover.mul(pFard).div(raddBase)) : pFard;
            shares.push({ key: p.key, label: p.label, count: 1, total: gets, each: gets, basis: femaleCount === 1 ? "ماده ۹۰۸" : "ماده ۹۰۹" });
          }
          distribute(dFard.add(leftover.mul(dFard).div(raddBase)), units, shares);
          notes.push(`باقی‌مانده پس از فرض‌ها بین ${raddParents.length ? "دختر یا دخترها و " + raddParents.map((p) => p.label).join(" و ") : "دختر یا دخترها"} به نسبت فرض تقسیم شده (رد، ${femaleCount === 1 ? "ماده ۹۰۸" : "ماده ۹۰۹"}).${hajib && mother ? " مادر چون حاجب دارد از رد سهمی نمی‌برد." : ""}`);
        }
      }
    } else {
      // بدون فرزند: پدر و/یا مادر (ماده ۹۰۶)
      if (father && mother) {
        const m = hajib ? F(1, 6) : F(1, 3);
        shares.push({ key: "mother", label: "مادر", count: 1, total: m, each: m, basis: hajib ? "مواد ۸۹۲ بند ب و ۹۰۶" : "مواد ۹۰۳ و ۹۰۶" });
        const f = rest.sub(m);
        shares.push({ key: "father", label: "پدر", count: 1, total: f, each: f, basis: "ماده ۹۰۶" });
      } else {
        const p = father ? { key: "father", label: "پدر" } : { key: "mother", label: "مادر" };
        shares.push({ ...p, count: 1, total: rest, each: rest, basis: "ماده ۹۰۶" });
      }
    }
    const lower = [inp.fullBrothers, inp.fullSisters, inp.patBrothers, inp.patSisters, inp.matBrothers, inp.matSisters,
      inp.ammuFull, inp.ammeFull, inp.ammuPat, inp.ammePat, inp.ammuMat, inp.ammeMat,
      inp.dayiFull, inp.khaleFull, inp.dayiPat, inp.khalePat, inp.dayiMat, inp.khaleMat].some((x) => n0(x) > 0)
      || inp.patGrandfather || inp.patGrandmother || inp.matGrandfather || inp.matGrandmother || (inp.nephews ?? []).some((b) => branchCount(b) > 0);
    if (lower) notes.push("با وجود وارث طبقه اول، وراث طبقات دوم و سوم ارث نمی‌برند (ماده ۸۶۳).");
    return finish(1);
  }

  /* ── طبقه دوم ── */
  let fB = n0(inp.fullBrothers), fS = n0(inp.fullSisters);
  let pB = n0(inp.patBrothers), pS = n0(inp.patSisters);
  const mB = n0(inp.matBrothers), mS = n0(inp.matSisters);
  const pgf = !!inp.patGrandfather, pgm = !!inp.patGrandmother, mgf = !!inp.matGrandfather, mgm = !!inp.matGrandmother;
  if (fB + fS > 0 && pB + pS > 0) { notes.push("با وجود برادر یا خواهر ابوینی، برادر و خواهر ابی ارث نمی‌برند (مواد ۹۱۸ و ۹۲۶)."); pB = pS = 0; }
  const anySibling = fB + fS + pB + pS + mB + mS > 0;
  let nBranches = (inp.nephews ?? []).filter((b) => branchCount(b) > 0);
  if (anySibling && nBranches.length) { notes.push("با وجود برادر یا خواهر، اولاد اخوه ارث نمی‌برند (مواد ۸۸۷ و ۹۲۵)."); nBranches = []; }
  if (nBranches.some((b) => b.side === "full") && nBranches.some((b) => b.side === "paternal")) {
    notes.push("اولاد برادر و خواهر ابوینی، اولاد برادر و خواهر ابی را از ارث محروم می‌کنند (قائم‌مقامی، مواد ۹۱۸ و ۹۲۵).");
    nBranches = nBranches.filter((b) => b.side !== "paternal");
  }
  const grand = pgf || pgm || mgf || mgm;
  const tab2 = anySibling || nBranches.length > 0 || grand;

  if (tab2) {
    const patUnits: Unit[] = [];
    const matUnits: Unit[] = [];
    const sideLbl = fB + fS > 0 ? "ابوینی" : "ابی";
    const sibBasis = "مواد ۹۱۸ تا ۹۲۰";
    if (fB + pB) patUnits.push({ key: "pb", label: `برادر ${sideLbl}`, weight: 2, count: fB + pB, basis: sibBasis });
    if (fS + pS) patUnits.push({ key: "ps", label: `خواهر ${sideLbl}`, weight: 1, count: fS + pS, basis: sibBasis });
    if (pgf) patUnits.push({ key: "pgf", label: "جد پدری (پدربزرگ پدری)", weight: 2, count: 1, basis: "مواد ۹۲۳ و ۹۲۴" });
    if (pgm) patUnits.push({ key: "pgm", label: "جده پدری (مادربزرگ پدری)", weight: 1, count: 1, basis: "مواد ۹۲۳ و ۹۲۴" });
    if (mB) matUnits.push({ key: "mb", label: "برادر امی", weight: 1, count: mB, basis: "مواد ۹۲۱ و ۹۲۲" });
    if (mS) matUnits.push({ key: "ms", label: "خواهر امی", weight: 1, count: mS, basis: "مواد ۹۲۱ و ۹۲۲" });
    if (mgf) matUnits.push({ key: "mgf", label: "جد مادری (پدربزرگ مادری)", weight: 1, count: 1, basis: "مواد ۹۲۳ و ۹۲۴" });
    if (mgm) matUnits.push({ key: "mgm", label: "جده مادری (مادربزرگ مادری)", weight: 1, count: 1, basis: "مواد ۹۲۳ و ۹۲۴" });
    nBranches.forEach((b, i) => {
      const lbl = `اولاد ${b.via === "m" ? "برادر" : "خواهر"} ${b.side === "full" ? "ابوینی" : b.side === "paternal" ? "ابی" : "امی"} فوت‌شده ${i + 1}`;
      if (b.side === "maternal") matUnits.push({ key: `n${i}`, label: lbl, weight: 1, count: 1, basis: "ماده ۹۲۵", branch: b, branchEqual: true });
      else patUnits.push({ key: `n${i}`, label: lbl, weight: b.via === "m" ? 2 : 1, count: 1, basis: "ماده ۹۲۵", branch: b });
    });
    if (nBranches.length) notes.push("اولاد اخوه قائم‌مقام پدر یا مادر خود هستند و با اجداد ارث می‌برند (ماده ۹۲۵).");

    if (hasSpouse) pushSpouse(husband ? F(1, 2) : F(1, 4), "ماده ۹۲۷");
    const rest = ONE.sub(husband ? F(1, 2) : wives ? F(1, 4) : ZERO);

    const matPersons = matUnits.reduce((a, u) => a + u.count, 0);
    const singleMatSibling = matPersons === 1 && matUnits.length === 1 && (["mb", "ms"].includes(matUnits[0].key) || !!matUnits[0].branch);
    if (patUnits.length && matUnits.length) {
      const mShare = singleMatSibling ? F(1, 6) : F(1, 3);
      distribute(mShare, matUnits, shares);
      distribute(rest.sub(mShare), patUnits, shares);
      notes.push(singleMatSibling
        ? "خویش مادری فقط یک برادر یا خواهر امی است و سدس ترکه را می‌برد؛ باقی به خویشان پدری می‌رسد (مواد ۹۲۲ و ۹۲۴)."
        : "خویشان مادری ثلث ترکه را بالسویه می‌برند و باقی به خویشان پدری می‌رسد که پسر دو برابر دختر می‌برد (مواد ۹۲۲ تا ۹۲۴).");
      if (hasSpouse) notes.push("زوج یا زوجه و خویشان مادری فرض خود را از اصل ترکه می‌برند و نقص بر خویشان پدری وارد می‌شود (ماده ۹۲۷).");
    } else if (patUnits.length) {
      distribute(rest, patUnits, shares);
    } else {
      distribute(rest, matUnits, shares);
      if (matPersons > 1 || hasSpouse) notes.push("وقتی فقط خویشان مادری باشند، باقی ترکه بین آن‌ها بالسویه تقسیم می‌شود (مواد ۹۱۷، ۹۲۱ و ۹۲۳).");
    }
    return finish(2);
  }

  /* ── طبقه سوم ── */
  let aFm = n0(inp.ammuFull), aFf = n0(inp.ammeFull), aPm = n0(inp.ammuPat), aPf = n0(inp.ammePat);
  const aMm = n0(inp.ammuMat), aMf = n0(inp.ammeMat);
  let kFm = n0(inp.dayiFull), kFf = n0(inp.khaleFull), kPm = n0(inp.dayiPat), kPf = n0(inp.khalePat);
  const kMm = n0(inp.dayiMat), kMf = n0(inp.khaleMat);
  if (aFm + aFf > 0 && aPm + aPf > 0) { notes.push("با وجود عمو یا عمه ابوینی، عمو و عمه ابی ارث نمی‌برند (ماده ۹۳۰)."); aPm = aPf = 0; }
  if (kFm + kFf > 0 && kPm + kPf > 0) { notes.push("با وجود دایی یا خاله ابوینی، دایی و خاله ابی ارث نمی‌برند (ماده ۹۳۰)."); kPm = kPf = 0; }
  const aPar = aFm + aFf + aPm + aPf, aMat = aMm + aMf, A = aPar + aMat;
  const kPar = kFm + kFf + kPm + kPf, kMat = kMm + kMf, K = kPar + kMat;
  void aFm; void kFm;

  if (A + K > 0) {
    if (hasSpouse) pushSpouse(husband ? F(1, 2) : F(1, 4), "ماده ۹۳۸");
    const rest = ONE.sub(husband ? F(1, 2) : wives ? F(1, 4) : ZERO);
    let kShare = ZERO, aShare = ZERO;
    if (A && K) { kShare = F(1, 3); aShare = rest.sub(kShare); notes.push("اخوال (دایی و خاله) ثلث و اعمام (عمو و عمه) باقی را می‌برند (مواد ۹۳۵ و ۹۳۸)."); }
    else if (A) aShare = rest; else kShare = rest;

    const aLbl = aFm + aFf > 0 ? "ابوینی" : "ابی";
    const kLbl = kFm + kFf > 0 ? "ابوینی" : "ابی";
    // اعمام
    if (A) {
      const parU: Unit[] = [];
      if (aFm + aPm) parU.push({ key: "ammu", label: `عمو ${aLbl}`, weight: 2, count: aFm + aPm, basis: "مواد ۹۳۱ و ۹۳۲" });
      if (aFf + aPf) parU.push({ key: "amme", label: `عمه ${aLbl}`, weight: 1, count: aFf + aPf, basis: "مواد ۹۳۱ و ۹۳۲" });
      const matU: Unit[] = [];
      if (aMm) matU.push({ key: "ammuM", label: "عمو امی", weight: 1, count: aMm, basis: "مواد ۹۳۱ و ۹۳۲" });
      if (aMf) matU.push({ key: "ammeM", label: "عمه امی", weight: 1, count: aMf, basis: "مواد ۹۳۱ و ۹۳۲" });
      if (aPar && aMat) {
        const m = aShare.mul(aMat === 1 ? F(1, 6) : F(1, 3));
        distribute(m, matU, shares); distribute(aShare.sub(m), parU, shares);
      } else if (aPar) distribute(aShare, parU, shares);
      else distribute(aShare, matU, shares);
    }
    // اخوال
    if (K) {
      const parU: Unit[] = [];
      if (kFm + kPm) parU.push({ key: "dayi", label: `دایی ${kLbl}`, weight: 1, count: kFm + kPm, basis: "مواد ۹۳۳ و ۹۳۴" });
      if (kFf + kPf) parU.push({ key: "khale", label: `خاله ${kLbl}`, weight: 1, count: kFf + kPf, basis: "مواد ۹۳۳ و ۹۳۴" });
      const matU: Unit[] = [];
      if (kMm) matU.push({ key: "dayiM", label: "دایی امی", weight: 1, count: kMm, basis: "مواد ۹۳۳ و ۹۳۴" });
      if (kMf) matU.push({ key: "khaleM", label: "خاله امی", weight: 1, count: kMf, basis: "مواد ۹۳۳ و ۹۳۴" });
      if (kPar && kMat) {
        const m = kShare.mul(kMat === 1 ? F(1, 6) : F(1, 3));
        distribute(m, matU, shares); distribute(kShare.sub(m), parU, shares);
      } else if (kPar) distribute(kShare, parU, shares);
      else distribute(kShare, matU, shares);
      if (kPar) notes.push("دایی و خاله ابوینی یا ابی، بین خود بالسویه تقسیم می‌کنند (ماده ۹۳۳ و ۹۳۴).");
    }
    if (hasSpouse) notes.push("زوج یا زوجه و متقرب به مادر فرض خود را از اصل ترکه می‌برند و نقص بر متقربین به پدر وارد می‌شود (ماده ۹۳۸).");
    return finish(3);
  }

  /* ── فقط زوج یا زوجه، یا بدون وارث ── */
  if (husband) {
    shares.push({ key: "husband", label: "زوج (شوهر)", count: 1, total: ONE, each: ONE, basis: "مواد ۹۰۵ و ۹۴۹" });
    notes.push("وقتی جز شوهر وارثی نباشد، تمام ترکه به او می‌رسد (ماده ۹۴۹).");
  } else if (wives) {
    pushSpouse(F(1, 4), "ماده ۹۴۹");
    hakem = F(3, 4);
    notes.push("وقتی جز زوجه وارثی نباشد، زوجه فقط ربع را می‌برد و باقی در حکم مال بلاوارث است و به حاکم می‌رسد (مواد ۸۶۶ و ۹۴۹).");
  } else {
    hakem = ONE;
    notes.push("وارثی وارد نشده است. در نبود وارث، امر ترکه با حاکم است (ماده ۸۶۶).");
  }
  return finish(0);

  function finish(tabaqe: 0 | 1 | 2 | 3): ErsResult {
    const total = sum(shares.map((s) => s.total)).add(hakem);
    if (total.cmp(ONE) !== 0) return { ok: false, error: `خطای داخلی: جمع سهم‌ها ${total.toString()} است.` };
    if (wives) notes.push("طبق ماده ۹۴۶ اصلاحی ۱۳۸۷، زوجه از عین اموال منقول و از قیمت اموال غیرمنقول (عرصه و اعیان) ارث می‌برد. این حکم برای فوت پیش از اصلاحیه هم، اگر ترکه هنوز تقسیم نشده باشد، اجرا می‌شود (تبصره الحاقی ۱۳۸۹).");
    if (tabaqe === 1 && sons) notes.push("انگشتر، قرآن، لباس‌های شخصی و شمشیر متوفی بدون کسر از سهم، به پسر بزرگ می‌رسد (حبوه، ماده ۹۱۵).");
    const lcd = shares.reduce((l, s) => lcm(l, s.each.d), hakem.d);

    let money: Extract<ErsResult, { ok: true }>["money"] = null;
    if (inp.estate && inp.estate > 0) {
      const debts = Math.max(0, inp.debts ?? 0);
      if (debts > inp.estate) return { ok: false, error: "دیون و هزینه‌ها بیشتر از ترکه است؛ ترکه‌ای برای تقسیم نمی‌ماند (ماده ۸۶۹)." };
      const afterDebt = inp.estate - debts;
      let will = Math.max(0, inp.will ?? 0);
      if (will > afterDebt / 3 && !inp.willApproved) {
        warnings.push("وصیت بیشتر از ثلث است و بدون اجازه ورثه فقط تا ثلث نافذ است (ماده ۸۶۹ بند ۳).");
        will = afterDebt / 3;
      }
      will = Math.min(will, afterDebt);
      const net = afterDebt - will;
      money = {
        estate: inp.estate, debts, will: Math.round(will), net: Math.round(net),
        perShare: (s: Share) => ({ total: Math.round(s.total.toNumber() * net), each: Math.round(s.each.toNumber() * net) }),
      };
    }
    return { ok: true, tabaqe, shares, hakem, notes, warnings, money, lcd };
  }
}

function lcm(a: bigint, b: bigint) { return (a / gcd(a, b)) * b; }

/*
 * تست‌های مرجع (باید پاس شوند) — سهم هر نفر:
 * ۱) مرد؛ زوجه + ۱ پسر + ۱ دختر: زوجه 1/8، پسر 7/12، دختر 7/24
 * ۲) زن؛ زوج + پدر + مادر (بدون فرزند): زوج 1/2، مادر 1/3، پدر 1/6
 * ۳) مرد؛ زوجه + پدر + مادر: زوجه 1/4، مادر 1/3، پدر 5/12
 * ۴) پدر + مادر + ۱ دختر (رد): پدر 1/5، مادر 1/5، دختر 3/5
 * ۵) همان با حاجب (۲ برادر): پدر 5/24، مادر 1/6، دختر 5/8
 * ۶) زن؛ زوج + پدر + مادر + ۲ دختر (نقص): زوج 1/4، پدر 1/6، مادر 1/6، هر دختر 5/24
 * ۷) پدر + مادر با حاجب، بدون فرزند: مادر 1/6، پدر 5/6
 * ۸) ۱ خواهر ابوینی + ۱ برادر امی: برادر امی 1/6، خواهر 5/6
 * ۹) ۲ برادر امی + جد و جده پدری: هر برادر امی 1/6، جد 4/9، جده 2/9
 * ۱۰) مرد؛ زوجه + ۱ عمو ابوینی + ۱ دایی: زوجه 1/4، دایی 1/3، عمو 5/12
 * ۱۱) مرد؛ فقط زوجه: زوجه 1/4، حاکم 3/4
 * ۱۲) نوه‌ها: پسر فوت‌شده با ۱ دختر + دختر فوت‌شده با ۱ پسر: دختر پسر 2/3، پسر دختر 1/3
 */
