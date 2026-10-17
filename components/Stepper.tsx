"use client";
// Stepper — a small whole number (how many sons, brothers…) with − and + buttons around
// it. The middle field also takes typed Persian or Latin digits, and ArrowUp/ArrowDown
// change it by one (role="spinbutton"). Buttons are 44px tap targets.
// Usage: <Stepper label="پسر" value={sons} onValueChange={setSons} max={20} />
// `fullLabel` names the count for the buttons' screen-reader text when the visible label
// is short because a fieldset legend gives the context (e.g. legend «عمو», label «ابی»).
import { useId, type KeyboardEvent } from "react";
import { Minus, Plus } from "lucide-react";
import { FieldHint } from "@/components/Field";
import { cn } from "@/lib/cn";
import { toLatinDigits, toPersianDigits } from "@/lib/format";

const buttonClasses =
  "flex size-11 shrink-0 items-center justify-center text-primary transition-colors " +
  "hover:bg-primary-soft active:bg-primary-soft-strong " +
  "disabled:cursor-not-allowed disabled:bg-transparent disabled:text-disabled-ink " +
  "focus-visible:relative focus-visible:z-sticky";

export function Stepper({
  label,
  fullLabel,
  hint,
  value,
  onValueChange,
  min = 0,
  max = 20,
  className,
}: {
  label: string;
  fullLabel?: string;
  hint?: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const name = fullLabel ?? label;
  const set = (next: number) => onValueChange(Math.min(max, Math.max(min, next)));

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const steps: Record<string, number> = { ArrowUp: 1, ArrowDown: -1 };
    if (event.key in steps) {
      event.preventDefault();
      set(value + steps[event.key]);
    } else if (event.key === "Home") {
      event.preventDefault();
      set(min);
    } else if (event.key === "End") {
      event.preventDefault();
      set(max);
    }
  };

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-base font-semibold text-ink">
        {label}
      </label>
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      <div
        className={cn(
          "flex w-full max-w-36 items-stretch rounded-sm border bg-surface transition-colors",
          value > min ? "border-primary" : "border-line-strong",
        )}
      >
        <button
          type="button"
          aria-label={`یکی کمتر: ${name}`}
          disabled={value <= min}
          onClick={() => set(value - 1)}
          className={cn(buttonClasses, "rounded-s-sm")}
        >
          <Minus aria-hidden="true" className="size-5" />
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          role="spinbutton"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-describedby={hintId}
          value={toPersianDigits(value)}
          onFocus={(event) => event.target.select()}
          onKeyDown={onKeyDown}
          onChange={(event) => {
            const digits = toLatinDigits(event.target.value).replace(/\D/g, "");
            // Typing over the selected number replaces it; extra digits keep the last ones.
            set(digits === "" ? min : Number(digits.slice(-2)));
          }}
          className={cn(
            "w-full min-w-0 flex-1 border-x border-line bg-transparent text-center text-lg font-bold tabular-nums outline-none",
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
            value > min ? "text-primary" : "text-muted",
          )}
        />
        <button
          type="button"
          aria-label={`یکی بیشتر: ${name}`}
          disabled={value >= max}
          onClick={() => set(value + 1)}
          className={cn(buttonClasses, "rounded-e-sm")}
        >
          <Plus aria-hidden="true" className="size-5" />
        </button>
      </div>
    </div>
  );
}
