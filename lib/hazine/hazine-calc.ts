/**
 * منطق محاسبه هزینه دادرسی دعاوی مالی و حق اجرا
 * توابع خالص (pure)؛ وابستگی به UI ندارند. مبالغ به ریال، گرد شده به نزدیک‌ترین ریال.
 */
import { FINANCIAL_RATES as R, FIXED_FEES, type FixedFee } from "./hazine-tariff";
// کمکی‌های مشترک فرمت (ارقام فارسی، جداکننده، عدد به حروف) از ماشین حساب تأخیر تأدیه
export { formatRial, numberToWords, parseAmount, toFaDigits } from "../tadieh/tadieh-calc";
import { formatRial, toFaDigits } from "../tadieh/tadieh-calc";

export type Stage = "badvi" | "tajdid" | "farjam";

export const STAGES: Record<Stage, { title: string; rateLabel: string; basisLabel: string }> = {
  badvi: {
    title: "بدوی",
    rateLabel: `${pct(R.badviLow)} تا ${toFaDigits(R.badviThreshold / 1_000_000)} میلیون ریال، ${pct(R.badviHigh)} مازاد`,
    basisLabel: "ارزش خواسته",
  },
  tajdid: { title: "تجدیدنظر / واخواهی", rateLabel: pct(R.tajdid), basisLabel: "مبلغ مورد اعتراض" },
  farjam: { title: "فرجام / اعاده دادرسی / اعتراض ثالث", rateLabel: pct(R.farjam), basisLabel: "مبلغ مورد اعتراض" },
};

function pct(r: number) {
  return toFaDigits(String(+(r * 100).toFixed(2))).replace(".", "٫") + "٪";
}

export type FeeLine = { label: string; amount: number; detail?: string };

/** هزینه دادرسی یک مرحله */
export function stageFee(amount: number, stage: Stage): { fee: number; lines: FeeLine[] } {
  if (!Number.isFinite(amount) || amount <= 0) throw new RangeError("مبلغ باید عدد مثبت باشد");
  if (stage === "badvi") {
    const low = Math.min(amount, R.badviThreshold) * R.badviLow;
    const high = Math.max(0, amount - R.badviThreshold) * R.badviHigh;
    const fee = Math.round(low + high);
    const detail = high > 0
      ? `${formatRial(low)} برای ${toFaDigits(R.badviThreshold / 1_000_000)} میلیون اول + ${formatRial(high)} برای مازاد`
      : undefined;
    return { fee, lines: [{ label: `هزینه دادرسی ${STAGES.badvi.title}`, amount: fee, detail }] };
  }
  const rate = stage === "tajdid" ? R.tajdid : R.farjam;
  const fee = Math.round(amount * rate);
  return { fee, lines: [{ label: `هزینه دادرسی ${STAGES[stage].title} (${pct(rate)})`, amount: fee }] };
}

/** حق اجرا (نیم‌عشر) */
export function enforcementFee(amount: number): number {
  return Math.round(amount * R.ejra);
}

export type CourtFeeResult = {
  amount: number;
  stage: Stage;
  lines: FeeLine[];
  total: number;
};

export function calculateCourtFee(
  amount: number,
  stage: Stage,
  opts: { includeEnforcement?: boolean } = {},
): CourtFeeResult {
  const { fee, lines } = stageFee(amount, stage);
  let total = fee;
  const all = [...lines];
  if (opts.includeEnforcement) {
    const e = enforcementFee(amount);
    all.push({ label: `حق اجرا / نیم‌عشر (${pct(R.ejra)})`, amount: e, detail: "هنگام اجرای حکم از محکوم‌علیه وصول می‌شود" });
    total += e;
  }
  return { amount, stage, lines: all, total };
}

/** جدول مقایسه همه مراحل + حق اجرا برای یک مبلغ */
export function compareAllStages(amount: number) {
  const rows = (Object.keys(STAGES) as Stage[]).map((s) => ({
    key: s,
    title: STAGES[s].title,
    rateLabel: STAGES[s].rateLabel,
    fee: stageFee(amount, s).fee,
  }));
  rows.push({ key: "ejra" as Stage, title: "حق اجرا (نیم‌عشر)", rateLabel: pct(R.ejra), fee: enforcementFee(amount) });
  return rows;
}

/** متن مبلغ ثابت برای نمایش (عدد یا بازه) */
export function fixedFeeLabel(f: FixedFee): string {
  if (f.amount != null) return formatRial(f.amount);
  if (f.min != null && f.max != null) return `${formatRial(f.min)} تا ${formatRial(f.max)}`;
  return "—";
}

export { FIXED_FEES };

/*
 * تست‌های مرجع (باید پاس شوند):
 * stageFee(100_000_000, "badvi").fee   → 2_500_000
 * stageFee(200_000_000, "badvi").fee   → 5_000_000
 * stageFee(1_000_000_000, "badvi").fee → 33_000_000
 * stageFee(1_000_000_000, "tajdid").fee → 45_000_000
 * stageFee(1_000_000_000, "farjam").fee → 55_000_000
 * enforcementFee(1_000_000_000)        → 50_000_000
 * calculateCourtFee(1_000_000_000, "badvi", { includeEnforcement: true }).total → 83_000_000
 */
