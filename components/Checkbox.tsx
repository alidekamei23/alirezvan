// Checkbox — one yes/no option with a visible label and an optional description. A native
// checkbox: Space toggles it. For choosing one of several options use RadioCards.
// Usage: <Checkbox label="حق اجرا را هم حساب کن" name="enforcement" onCheckedChange={set} />
import type { InputHTMLAttributes } from "react";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange" | "children"
> & {
  label: string;
  description?: string;
  /** Needs a client component as the parent. */
  onCheckedChange?: (checked: boolean) => void;
};

export function Checkbox({ label, description, onCheckedChange, ...rest }: CheckboxProps) {
  return (
    <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-sm border border-line-strong bg-surface p-4 transition-colors hover:border-ink has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus has-disabled:cursor-not-allowed has-disabled:border-line has-disabled:bg-disabled-surface has-disabled:text-disabled-ink">
      <input
        type="checkbox"
        onChange={onCheckedChange ? (event) => onCheckedChange(event.target.checked) : undefined}
        className="mt-1.5 size-5 shrink-0 accent-primary outline-none"
        {...rest}
      />
      <span className="flex flex-col">
        <span className="font-semibold">{label}</span>
        {description && <span className="text-sm text-muted">{description}</span>}
      </span>
    </label>
  );
}
