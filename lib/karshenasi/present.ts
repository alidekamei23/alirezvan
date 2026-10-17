/**
 * Display helpers for the expert-fee calculator: Persian digits for strings the logic
 * returns, labels for the fee kinds, the Article 11 table built from the tariff, and the
 * plain-text summary that «کپی نتیجه» copies. The calculation itself lives in
 * karshenasi-calc.ts and is not repeated here.
 */
import { ESTIMATE_DISCLAIMER } from "@/content/legal";
import { toPersianDigits } from "@/lib/format";
import { rial, tomanEquivalent } from "@/lib/tadieh/present";
import { formatRial, numberToWords, type ExpertFeeResult } from "./karshenasi-calc";
import {
  ARZYABI,
  CATEGORIES,
  GPS_PER_POINT,
  MISSION_PER_DAY,
  TARIFF_TITLE,
  type ExpertItem,
} from "./karshenasi-tariff";

type FeeOk = Extract<ExpertFeeResult, { ok: true }>;
export type GpsDevice = keyof typeof GPS_PER_POINT;
export type MissionLocation = keyof typeof MISSION_PER_DAY;

/** Persian digits and the Persian decimal separator for text built by the logic. */
export function faText(text: string): string {
  return toPersianDigits(text).replace(/([۰-۹])\.([۰-۹])/g, "$1٫$2");
}

export const KIND_LABELS: Record<ExpertItem["kind"], string> = {
  fixed: "مقطوع",
  tiered: "پلکانی",
  range: "با تعیین مرجع",
};

export const GPS_DEVICE_LABELS: Record<GpsDevice, string> = {
  multiFrequency: "گیرنده چندفرکانسه",
  handheld: "گیرنده دستی",
};

export const MISSION_LABELS: Record<MissionLocation, string> = {
  inProvince: "داخل استان",
  outOfProvince: "خارج از استان",
};

/** «× ۱٫۵» */
export function coefficientLabel(value: number): string {
  return `ضریب × ${faText(String(value))}`;
}

export function categoryLabel(item: ExpertItem): string {
  return CATEGORIES[item.category];
}

/** A rate written as a percentage with Persian digits, e.g. 0.0045 → «۰٫۴۵٪». */
function percent(rate: number): string {
  return `${faText(String(Number((rate * 100).toPrecision(6))))}٪`;
}

/** Rows of the Article 11 valuation table, built from ARZYABI rather than typed in. */
export function tierRows(): { from: string; to: string; rate: string }[] {
  return ARZYABI.tiers.map((tier, index) => {
    const next = ARZYABI.tiers[index + 1];
    return {
      from: formatRial(tier.threshold),
      to: next ? formatRial(next.threshold) : "—",
      rate:
        tier.fixed !== undefined
          ? `مقطوع ${rial(tier.fixed)}`
          : tier.rate !== undefined
            ? `${percent(tier.rate)} مازاد`
            : "—",
    };
  });
}

/** «یک میلیارد ریال، معادل ۱۰۰٬۰۰۰٬۰۰۰ تومان» */
export function amountInWords(rials: number): string {
  return `${numberToWords(rials)} ریال، معادل ${tomanEquivalent(rials)}`;
}

/** A value with its unit; rials get thousands separators. */
export function valueLabel(value: number, unit?: string): string {
  if (unit === "ریال") return rial(value);
  return `${faText(String(value))}${unit ? ` ${unit}` : ""}`;
}

/** The full result as plain text: subject, article, inputs, steps, GPS, mission, total. */
export function buildSummary(
  result: FeeOk,
  inputs: {
    values: number[];
    missionDays: number;
    missionLocation: MissionLocation;
    gpsPoints?: number;
    gpsDevice?: GpsDevice;
  },
): string {
  const { item } = result;
  const lines = [
    `برآورد دستمزد کارشناسی (${TARIFF_TITLE})`,
    `موضوع: ${faText(item.title)}`,
    `گروه: ${categoryLabel(item)}`,
    `ماده: ${item.article}`,
    `نوع دستمزد: ${KIND_LABELS[item.kind]}${item.coefficient ? `، ${coefficientLabel(item.coefficient)}` : ""}`,
  ];
  if (item.kind === "tiered") {
    if (inputs.values.length > 1) {
      inputs.values.forEach((value, index) =>
        lines.push(`مورد ${toPersianDigits(index + 1)}: ${valueLabel(value, item.unit)}`),
      );
    } else if (inputs.values.length === 1) {
      lines.push(`${item.inputTitle ?? "مقدار"}: ${valueLabel(inputs.values[0], item.unit)}`);
    }
  }
  lines.push("");
  for (const step of result.steps) lines.push(`${faText(step.label)}: ${rial(step.amount)}`);
  if (result.fee !== null) lines.push(`دستمزد هر کارشناس: ${rial(result.fee)}`);
  else if (result.rangeText) lines.push(`دستمزد هر کارشناس: ${faText(result.rangeText)}`);
  if (result.provisional) lines.push("این مبلغ موقت است.");
  if (result.capped) lines.push(`سقف دستمزد اعمال شد (${rial(result.cap)}).`);
  if (result.gps > 0 && inputs.gpsPoints && inputs.gpsDevice) {
    lines.push(
      `هزینه GPS: ${toPersianDigits(inputs.gpsPoints)} نقطه، ${GPS_DEVICE_LABELS[inputs.gpsDevice]}: ${rial(result.gps)}`,
    );
  }
  if (result.mission > 0) {
    lines.push(
      `فوق‌العاده مأموریت: ${toPersianDigits(inputs.missionDays)} روز ${MISSION_LABELS[inputs.missionLocation]}: ${rial(result.mission)}`,
    );
  }
  if (result.total !== null) {
    lines.push(
      "",
      `جمع کل: ${rial(result.total)} (${numberToWords(result.total)} ریال)`,
      `معادل: ${tomanEquivalent(result.total)}`,
    );
  }
  if (result.notes.length > 0) {
    lines.push("", "نکته‌ها:");
    for (const note of result.notes) lines.push(`- ${faText(note)}`);
  }
  lines.push("", ESTIMATE_DISCLAIMER);
  return lines.join("\n");
}
