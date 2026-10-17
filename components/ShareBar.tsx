// ShareBar — one horizontal bar split into the parts of a whole (e.g. each heir's share of
// an estate), with a legend that names every part and its percentage. Hovering a part of
// the bar shows its name and percentage in a tooltip. The bar is decorative for screen
// readers: the legend (and usually a table) carries the numbers.
// Colours are token utilities passed in by the caller; `pattern` marks a part that is set
// aside rather than shared out, so it is not told apart by colour alone.
// Usage: <ShareBar label="سهم وراث" parts={[{ key, label, value: 0.25, percent: "۲۵٪", color: "bg-emerald-700" }]} />
import { cn } from "@/lib/cn";

export type SharePart = {
  key: string;
  label: string;
  /** Fraction of the whole, 0..1. */
  value: number;
  /** The value as text, e.g. «۲۵٪». */
  percent: string;
  /** A background utility from the tokens, e.g. "bg-emerald-700". */
  color: string;
  pattern?: "reserved";
};

const RESERVED =
  "bg-[repeating-linear-gradient(135deg,var(--color-line-strong)_0_3px,var(--color-surface)_3px_7px)]";

export function ShareBar({ label, parts }: { label: string; parts: SharePart[] }) {
  const visible = parts.filter((part) => part.value > 0);
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="sr-only">{label}</figcaption>
      <div
        aria-hidden="true"
        className="flex h-7 w-full rounded-sm border border-line bg-surface-muted"
      >
        {visible.map((part, index) => (
          <span
            key={part.key}
            style={{ width: `${part.value * 100}%` }}
            className={cn(
              "group relative min-w-0.5 border-s-2 border-surface first:rounded-s-sm first:border-s-0 last:rounded-e-sm",
              "transition-[width] duration-(--duration-base) ease-out motion-reduce:transition-none",
              part.pattern === "reserved" ? RESERVED : part.color,
            )}
          >
            {/* Takes no space until hovered; the end parts open inwards so it stays in the card. */}
            <span
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-full z-sticky mb-2 hidden group-hover:flex",
                visible.length === 1
                  ? "justify-center"
                  : index === 0
                    ? "justify-start"
                    : index === visible.length - 1
                      ? "justify-end"
                      : "justify-center",
              )}
            >
              <span className="w-max max-w-60 rounded-sm bg-ink px-3 py-1 text-sm font-semibold text-on-primary shadow-md">
                {part.label}
                <span className="ms-2 tabular-nums">{part.percent}</span>
              </span>
            </span>
          </span>
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {visible.map((part) => (
          <li key={part.key} className="flex min-w-0 items-baseline gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "size-3 shrink-0 translate-y-0.5 rounded-full border border-line",
                part.pattern === "reserved" ? RESERVED : part.color,
              )}
            />
            <span className="min-w-0 text-ink">{part.label}</span>
            <span className="ms-auto shrink-0 font-semibold tabular-nums text-ink">
              {part.percent}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
