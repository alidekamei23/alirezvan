"use client";
// OtpInput — the 5-digit SMS code as separate boxes. The boxes always run left to right
// (codes are read that way even in Persian), accept Persian or Latin digits, support
// paste and SMS autofill, and submit Latin digits under `name`.
// Usage: <OtpInput label="کد تأیید" name="code" onComplete={verify} error={error} />
import { useId, useRef, useState } from "react";
import { FieldError, FieldHint, fieldIds } from "@/components/Field";
import { cn } from "@/lib/cn";
import { toLatinDigits, toPersianDigits } from "@/lib/format";

export type OtpInputProps = {
  label: string;
  name: string;
  length?: number;
  hint?: string;
  error?: string;
  disabled?: boolean;
  /** Called with the full code (Latin digits) when the last box is filled. */
  onComplete?: (code: string) => void;
};

export function OtpInput({
  label,
  name,
  length = 5,
  hint,
  error,
  disabled,
  onComplete,
}: OtpInputProps) {
  const id = useId();
  const { hintId, errorId, describedBy } = fieldIds(id, { hint, error });
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(""));
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const focusBox = (index: number) => {
    const box = boxes.current[Math.max(0, Math.min(length - 1, index))];
    box?.focus();
    box?.select();
  };

  /** Writes typed or pasted digits starting at `index`. */
  const fill = (index: number, text: string) => {
    const incoming = toLatinDigits(text).replace(/\D/g, "");
    if (incoming === "") return;
    const next = [...digits];
    for (let i = 0; i < incoming.length && index + i < length; i++) {
      next[index + i] = incoming[i];
    }
    setDigits(next);
    focusBox(index + incoming.length);
    if (next.every((digit) => digit !== "")) onComplete?.(next.join(""));
  };

  const clear = (index: number) => {
    const next = [...digits];
    next[index] = "";
    setDigits(next);
  };

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={describedBy}
      className="flex flex-col gap-1.5"
    >
      <span id={`${id}-label`} className="text-base font-semibold text-ink">
        {label}
      </span>
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      <div dir="ltr" className="flex justify-end gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              boxes.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`رقم ${toPersianDigits(index + 1)} از ${toPersianDigits(length)}`}
            aria-invalid={error ? true : undefined}
            disabled={disabled}
            value={toPersianDigits(digit)}
            onChange={(event) => {
              const typed = toLatinDigits(event.target.value).replace(/\D/g, "");
              if (typed === "") clear(index);
              // Typing over a filled box gives "old+new"; keep only what is new.
              else fill(index, typed.length > 1 && typed[0] === digit ? typed.slice(1) : typed);
            }}
            onPaste={(event) => {
              event.preventDefault();
              fill(index, event.clipboardData.getData("text"));
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && digit === "" && index > 0) {
                event.preventDefault();
                clear(index - 1);
                focusBox(index - 1);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                focusBox(index - 1);
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                focusBox(index + 1);
              }
            }}
            onFocus={(event) => event.target.select()}
            className={cn(
              "size-12 rounded-sm border bg-surface text-center text-xl font-bold text-ink transition-colors xs:size-14",
              "hover:border-ink disabled:cursor-not-allowed disabled:border-line disabled:bg-disabled-surface disabled:text-disabled-ink",
              error ? "border-2 border-danger" : "border-line-strong",
            )}
          />
        ))}
      </div>
      <input type="hidden" name={name} value={digits.join("")} />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
