"use client";
// DatePicker — a Jalali date as three dropdowns (day, month, year). No popup calendar:
// dropdowns are faster on phones and fully keyboard accessible. Day options follow the
// month length, including leap-year Esfand. Submits "1405-07-19" (Latin) under `name`.
// Usage: <DatePicker legend="تاریخ سررسید" name="start" minYear={1380} maxYear={1405} />
import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { FieldError, FieldHint, controlClasses, fieldIds } from "@/components/Field";
import { toPersianDigits } from "@/lib/format";
import {
  JALALI_MONTHS,
  daysInJalaliMonth,
  parseJalali,
  toJalaliString,
} from "@/lib/jalali";

type Parts = { year: number | null; month: number | null; day: number | null };

export type DatePickerProps = {
  legend: string;
  name: string;
  minYear: number;
  maxYear: number;
  hint?: string;
  error?: string;
  /** "1405-07-19" */
  defaultValue?: string;
  disabled?: boolean;
  /** Called with "YYYY-MM-DD" (Jalali, Latin digits), or null while incomplete. */
  onValueChange?: (value: string | null) => void;
};

function toValue({ year, month, day }: Parts): string | null {
  if (year === null || month === null || day === null) return null;
  return toJalaliString({ year, month, day });
}

/** 31 until the month is known; Esfand counts as 30 until the year is known. */
function maxDayOf({ year, month }: Parts): number {
  if (month === null) return 31;
  if (year === null) return month <= 6 ? 31 : 30;
  return daysInJalaliMonth(year, month);
}

export function DatePicker({
  legend,
  name,
  minYear,
  maxYear,
  hint,
  error,
  defaultValue,
  disabled,
  onValueChange,
}: DatePickerProps) {
  const id = useId();
  const { hintId, errorId, describedBy } = fieldIds(id, { hint, error });
  const [parts, setParts] = useState<Parts>(() => {
    const parsed = defaultValue ? parseJalali(defaultValue) : null;
    return parsed ?? { year: null, month: null, day: null };
  });

  const update = (patch: Partial<Parts>) => {
    const next = { ...parts, ...patch };
    if (next.day !== null) next.day = Math.min(next.day, maxDayOf(next));
    setParts(next);
    onValueChange?.(toValue(next));
  };

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const days = Array.from({ length: maxDayOf(parts) }, (_, i) => i + 1);

  const part = (
    key: keyof Parts,
    label: string,
    options: { value: number; label: string }[],
  ) => (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={`${id}-${key}`} className="text-sm text-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={`${id}-${key}`}
          value={parts[key] ?? ""}
          onChange={(event) =>
            update({
              [key]: event.target.value === "" ? null : Number(event.target.value),
            })
          }
          required
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={controlClasses(error, "min-h-12 appearance-none pe-9")}
        >
          <option value="">—</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute end-2.5 top-1/2 size-5 -translate-y-1/2 text-muted"
        />
      </div>
    </div>
  );

  return (
    <fieldset aria-describedby={describedBy} className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-base font-semibold text-ink">{legend}</legend>
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      <div className="grid grid-cols-[1fr_1.6fr_1.3fr] gap-2">
        {part(
          "day",
          "روز",
          days.map((d) => ({ value: d, label: toPersianDigits(d) })),
        )}
        {part(
          "month",
          "ماه",
          JALALI_MONTHS.map((m, i) => ({ value: i + 1, label: m })),
        )}
        {part(
          "year",
          "سال",
          years.map((y) => ({ value: y, label: toPersianDigits(y) })),
        )}
      </div>
      <input type="hidden" name={name} value={toValue(parts) ?? ""} />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  );
}
