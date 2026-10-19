// SegmentedControl — pick one of a few short options shown side by side in one bar, for a
// choice that switches the rest of the form (e.g. the subject of a calculation). Native
// radios: arrow keys move the choice. On a phone the bar wraps into a grid. For options
// that need a description use RadioCards.
// Usage: <SegmentedControl legend="موضوع" name="subject" value={v} onValueChange={set}
//   options={[{ value: "financial", label: "مالی" }]} />
import { cn } from "@/lib/cn";

export type SegmentOption = { value: string; label: string };

export function SegmentedControl({
  legend,
  name,
  options,
  value,
  onValueChange,
}: {
  legend: string;
  name: string;
  options: SegmentOption[];
  value: string;
  /** Needs a client component as the parent. */
  onValueChange: (value: string) => void;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-base font-semibold text-ink">{legend}</legend>
      <div className="grid grid-cols-2 gap-1 rounded-md border border-line-strong bg-surface-muted p-1 xs:grid-cols-3 md:flex">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex min-h-11 flex-1 cursor-pointer items-center md:flex-auto justify-center rounded-sm px-3 py-1.5 text-center text-sm leading-snug font-semibold transition-colors",
              "text-muted hover:bg-surface hover:text-ink",
              "has-checked:bg-primary has-checked:text-on-primary has-checked:shadow-sm",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onValueChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
