// Select — a native dropdown (best keyboard and phone support) with a visible label.
// Usage: <Select label="حوزه" name="area" options={[{ value: "check-safte", label: "چک و سفته" }]} />
import { useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { Field, controlClasses, fieldIds, type FieldBaseProps } from "@/components/Field";
import { cn } from "@/lib/cn";

export type SelectOption = { value: string; label: string };

export type SelectProps = FieldBaseProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "required" | "children"> & {
    options: SelectOption[];
    /** First, empty option. Pass null when the select always has a value. */
    placeholder?: string | null;
  };

export function Select({
  label,
  hint,
  error,
  optional,
  id,
  options,
  placeholder = "انتخاب کنید",
  className,
  ...rest
}: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const { describedBy } = fieldIds(fieldId, { hint, error });
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} optional={optional}>
      <div className="relative">
        <select
          id={fieldId}
          required={!optional}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={controlClasses(error, cn("min-h-12 appearance-none pe-10", className))}
          {...rest}
        >
          {placeholder !== null && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute end-3 top-1/2 size-5 -translate-y-1/2 text-muted"
        />
      </div>
    </Field>
  );
}
