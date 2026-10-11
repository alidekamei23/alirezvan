"use client";
// PhoneField — Iranian mobile number (09xxxxxxxxx). Accepts Persian or Latin digits and
// +98/0098 prefixes, shows Persian digits, and submits Latin digits under `name`.
// Usage: <PhoneField label="شماره موبایل" name="mobile" error={errors.mobile} />
// Validate on the server with isValidMobile() from lib/phone.ts.
import { useId, useState } from "react";
import { Field, controlClasses, fieldIds, type FieldBaseProps } from "@/components/Field";
import { toPersianDigits } from "@/lib/format";
import { normalizeMobile } from "@/lib/phone";

export type PhoneFieldProps = FieldBaseProps & {
  name: string;
  id?: string;
  /** Latin digits, e.g. "09123456789". */
  defaultValue?: string;
  disabled?: boolean;
  /** Called with the normalised number (Latin digits). */
  onValueChange?: (value: string) => void;
};

export function PhoneField({
  label,
  hint = "مثال: ۰۹۱۲۳۴۵۶۷۸۹",
  error,
  optional,
  name,
  id,
  defaultValue = "",
  disabled,
  onValueChange,
}: PhoneFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const { describedBy } = fieldIds(fieldId, { hint, error });
  const [value, setValue] = useState(() => normalizeMobile(defaultValue));

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} optional={optional}>
      <input
        id={fieldId}
        type="text"
        inputMode="tel"
        autoComplete="tel-national"
        dir="ltr"
        value={toPersianDigits(value)}
        onChange={(event) => {
          const next = normalizeMobile(event.target.value);
          setValue(next);
          onValueChange?.(next);
        }}
        required={!optional}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={controlClasses(error, "min-h-12 text-end tracking-wide")}
      />
      <input type="hidden" name={name} value={value} />
    </Field>
  );
}
