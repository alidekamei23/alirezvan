// Field — the shared shell of every form control: visible label, optional hint, and an
// inline error wired up with aria-describedby. Form components use it internally;
// use it directly only when building a new kind of control.
import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

export type FieldBaseProps = {
  label: string;
  /** Short help text under the label. */
  hint?: string;
  /** Error message. When set, the control is marked invalid. */
  error?: string;
  /** Adds «(اختیاری)» to the label. Fields are required unless marked optional. */
  optional?: boolean;
};

export function fieldIds(id: string, { hint, error }: { hint?: string; error?: string }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return {
    hintId,
    errorId,
    describedBy: [hintId, errorId].filter(Boolean).join(" ") || undefined,
  };
}

/** Classes for text-like controls (input, select, textarea). */
export function controlClasses(error?: string, className?: string): string {
  return cn(
    "block w-full rounded-sm border bg-surface px-3 text-base text-ink transition-colors",
    "placeholder:text-muted hover:border-ink",
    "disabled:cursor-not-allowed disabled:border-line disabled:bg-disabled-surface disabled:text-disabled-ink",
    error ? "border-2 border-danger" : "border-line-strong",
    className,
  );
}

export function FieldLabel({
  htmlFor,
  optional,
  children,
}: {
  htmlFor?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-base font-semibold text-ink">
      {children}
      {optional && <span className="font-normal text-muted"> (اختیاری)</span>}
    </label>
  );
}

export function FieldHint({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="text-sm text-muted">
      {children}
    </p>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm font-semibold text-danger-ink">
      <CircleAlert aria-hidden="true" className="mt-1 size-4 shrink-0" />
      <span>
        <span className="sr-only">خطا: </span>
        {children}
      </span>
    </p>
  );
}

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  className,
  children,
}: FieldBaseProps & { id: string; className?: string; children: ReactNode }) {
  const { hintId, errorId } = fieldIds(id, { hint, error });
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <FieldLabel htmlFor={id} optional={optional}>
        {label}
      </FieldLabel>
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      {children}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
