// ResultCard — a calculator result: labelled amounts (one may be highlighted with
// `emphasis`), an emphasised total, notes (e.g.
// which index months were used) and actions. It always renders the estimate notice, so
// a result can never be shown without it (CLAUDE.md §2.1).
// Usage:
// <ResultCard title="نتیجه محاسبه" rows={[{ label: "اصل طلب", value: formatToman(p) }]}
//   total={{ label: "جمع", value: formatToman(t) }} notes={["شاخص مهر ۱۴۰۴ …"]}>
//   <ShareActions … />
// </ResultCard>
import type { ReactNode } from "react";
import { EstimateNotice } from "@/components/EstimateNotice";
import { cn } from "@/lib/cn";

export type ResultRow = { label: string; value: string; emphasis?: boolean };

export function ResultCard({
  title,
  rows,
  total,
  notes = [],
  children,
}: {
  title: string;
  rows: ResultRow[];
  total: ResultRow;
  notes?: string[];
  /** Actions, usually <ShareActions />. */
  children?: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      aria-live="polite"
      className="rounded-md border border-line bg-surface shadow-sm"
    >
      <div className="p-5 md:p-6">
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        <dl className="mt-4 divide-y divide-line">
          {rows.map((row) => (
            <div
              key={row.label}
              className={cn(
                "flex flex-wrap items-baseline justify-between gap-x-4 py-3",
                row.emphasis && "-mx-5 bg-primary-soft px-5 md:-mx-6 md:px-6",
              )}
            >
              <dt className={row.emphasis ? "font-bold text-ink" : "text-muted"}>
                {row.label}
              </dt>
              <dd
                className={cn(
                  "tabular-nums",
                  row.emphasis
                    ? "text-2xl font-bold text-primary"
                    : "font-semibold text-ink",
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 pt-4">
            <dt className="font-bold text-ink">{total.label}</dt>
            {/* One key figure per card: a highlighted row takes the accent from the total. */}
            <dd
              className={cn(
                "font-bold tabular-nums",
                rows.some((row) => row.emphasis)
                  ? "text-xl text-ink"
                  : "text-2xl text-primary",
              )}
            >
              {total.value}
            </dd>
          </div>
        </dl>
        {notes.length > 0 && (
          <ul className="mt-4 list-disc ps-5 text-sm text-muted">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
        <EstimateNotice className="mt-5" />
      </div>
      {children && (
        <div className="border-t border-line bg-surface-muted p-5 md:px-6">{children}</div>
      )}
    </section>
  );
}
