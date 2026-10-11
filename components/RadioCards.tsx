// RadioCards — choose exactly one of a few options, each shown as a card with a title
// and a short description (e.g. consultation type). Native radios: arrow keys work.
// Usage: <RadioCards legend="نوع مشاوره" name="type" options={[{ value, title, description }]} />
import { useId } from "react";
import { FieldError, FieldHint, fieldIds } from "@/components/Field";
import { cn } from "@/lib/cn";

export type RadioCardOption = {
  value: string;
  title: string;
  description?: string;
  disabled?: boolean;
};

export function RadioCards({
  legend,
  name,
  options,
  hint,
  error,
  defaultValue,
  onValueChange,
  columns = 3,
}: {
  legend: string;
  name: string;
  options: RadioCardOption[];
  hint?: string;
  error?: string;
  defaultValue?: string;
  /** Needs a client component as the parent. */
  onValueChange?: (value: string) => void;
  columns?: 1 | 2 | 3;
}) {
  const id = useId();
  const { hintId, errorId, describedBy } = fieldIds(id, { hint, error });
  return (
    <fieldset aria-describedby={describedBy} className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-base font-semibold text-ink">{legend}</legend>
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-3",
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex min-h-12 cursor-pointer items-start gap-3 rounded-sm border bg-surface p-4 transition-colors",
              "hover:border-ink has-checked:border-primary has-checked:bg-primary-soft",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
              "has-disabled:cursor-not-allowed has-disabled:border-line has-disabled:bg-disabled-surface has-disabled:text-disabled-ink",
              error ? "border-2 border-danger" : "border-line-strong",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              disabled={option.disabled}
              required
              defaultChecked={defaultValue === option.value}
              onChange={onValueChange ? () => onValueChange(option.value) : undefined}
              className="mt-1.5 size-5 shrink-0 accent-primary outline-none"
            />
            <span className="flex flex-col">
              <span className="font-semibold">{option.title}</span>
              {option.description && (
                <span className="text-sm text-muted">{option.description}</span>
              )}
            </span>
          </label>
        ))}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  );
}
