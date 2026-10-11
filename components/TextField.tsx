// TextField — single-line text input with a visible label.
// Usage: <TextField label="نام و نام خانوادگی" name="name" error={errors.name} />
// For mobile numbers use PhoneField; for toman amounts use MoneyField.
import { useId, type InputHTMLAttributes } from "react";
import { Field, controlClasses, fieldIds, type FieldBaseProps } from "@/components/Field";
import { cn } from "@/lib/cn";

export type TextFieldProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "required">;

export function TextField({
  label,
  hint,
  error,
  optional,
  id,
  className,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const { describedBy } = fieldIds(fieldId, { hint, error });
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} optional={optional}>
      <input
        id={fieldId}
        required={!optional}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={controlClasses(error, cn("min-h-12", className))}
        {...rest}
      />
    </Field>
  );
}
