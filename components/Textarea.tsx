"use client";
// Textarea — multi-line text with a live character counter (300 by default, the limit
// for the consultation summary). Normalises ی/ک on blur.
// Usage: <Textarea label="خلاصه موضوع" name="summary" maxLength={300} />
import { useId, useState } from "react";
import { Field, controlClasses, fieldIds, type FieldBaseProps } from "@/components/Field";
import { cn } from "@/lib/cn";
import { normalizePersian, toPersianDigits } from "@/lib/format";

export type TextareaProps = FieldBaseProps & {
  name: string;
  id?: string;
  maxLength?: number;
  rows?: number;
  defaultValue?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
};

export function Textarea({
  label,
  hint,
  error,
  optional,
  name,
  id,
  maxLength = 300,
  rows = 5,
  defaultValue = "",
  disabled,
  onValueChange,
}: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const counterId = `${fieldId}-counter`;
  const { describedBy } = fieldIds(fieldId, { hint, error });
  const [value, setValue] = useState(defaultValue);
  const remaining = maxLength - value.length;

  const update = (next: string) => {
    setValue(next);
    onValueChange?.(next);
  };

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        id={fieldId}
        name={name}
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={(event) => update(event.target.value)}
        onBlur={() => update(normalizePersian(value))}
        required={!optional}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(describedBy, counterId)}
        className={controlClasses(error, "resize-y py-2.5")}
      />
      <p
        id={counterId}
        className={cn(
          "text-sm",
          remaining <= 20 ? "font-semibold text-warning-ink" : "text-muted",
        )}
      >
        {toPersianDigits(value.length)} از {toPersianDigits(maxLength)} نویسه
      </p>
    </Field>
  );
}
