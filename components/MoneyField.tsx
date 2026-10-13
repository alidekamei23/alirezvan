"use client";
// MoneyField — an amount in tomans (or in rials with unit="ریال"). Accepts Persian or
// Latin digits, shows Persian digits with thousands separators as you type, and submits a
// plain Latin integer under `name`.
// Usage: <MoneyField label="مبلغ اصل طلب" name="principal" error={errors.principal} />
import { useId, useState } from "react";
import { Field, controlClasses, fieldIds, type FieldBaseProps } from "@/components/Field";
import { formatNumber, parseNumber, toLatinDigits } from "@/lib/format";

const MAX_DIGITS = 15;

export type MoneyFieldProps = FieldBaseProps & {
  name: string;
  id?: string;
  /** Shown inside the field. Defaults to tomans. */
  unit?: string;
  /** In `unit`. */
  defaultValue?: number;
  disabled?: boolean;
  /** Called with the amount in `unit`, or null when the field is empty. */
  onValueChange?: (value: number | null) => void;
};

export function MoneyField({
  label,
  hint,
  error,
  optional,
  name,
  id,
  unit = "تومان",
  defaultValue,
  disabled,
  onValueChange,
}: MoneyFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const { describedBy } = fieldIds(fieldId, { hint, error });
  const [value, setValue] = useState<number | null>(defaultValue ?? null);

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} optional={optional}>
      <div className="relative">
        <input
          id={fieldId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value === null ? "" : formatNumber(value)}
          onChange={(event) => {
            const digits = toLatinDigits(event.target.value)
              .replace(/\D/g, "")
              .slice(0, MAX_DIGITS);
            const next = digits === "" ? null : parseNumber(digits);
            setValue(next);
            onValueChange?.(next);
          }}
          required={!optional}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={controlClasses(error, "min-h-12 pe-16")}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm text-muted"
        >
          {unit}
        </span>
      </div>
      <input type="hidden" name={name} value={value ?? ""} />
    </Field>
  );
}
