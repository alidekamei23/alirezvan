// Table — data in rows and columns. A wide table scrolls inside its own box (focusable,
// so keyboard users can scroll it); the page itself never scrolls sideways.
// Usage: <Table caption="شاخص ماهانه" head={["ماه", "شاخص"]} rows={[["مهر ۱۴۰۵", "…"]]} />
// The first cell of each row is its row header. `selectedRow` highlights one row (say in
// the cell text which one it is; colour alone is not enough). `mutedRows` greys out rows
// that are set aside rather than counted (say why in the row text too).
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Table({
  caption,
  head,
  rows,
  emptyText = "داده‌ای برای نمایش وجود ندارد.",
  selectedRow,
  mutedRows = [],
}: {
  caption: string;
  head: string[];
  rows: ReactNode[][];
  emptyText?: string;
  /** Index in `rows`. */
  selectedRow?: number;
  /** Indexes in `rows`. */
  mutedRows?: number[];
}) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="max-w-full overflow-x-auto rounded-md border border-line bg-surface"
    >
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-surface-muted">
            {head.map((cell) => (
              <th
                key={cell}
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-start font-bold text-ink"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="px-4 py-8 text-center text-muted">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "border-t border-line",
                  rowIndex === selectedRow && "bg-primary-soft",
                  mutedRows.includes(rowIndex) && "bg-surface-muted",
                )}
              >
                {row.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <th
                      key={cellIndex}
                      scope="row"
                      className={cn(
                        "px-4 py-3 text-start font-semibold",
                        mutedRows.includes(rowIndex) ? "text-muted" : "text-ink",
                      )}
                    >
                      {cell}
                    </th>
                  ) : (
                    <td key={cellIndex} className={cn(
                        "px-4 py-3 text-start",
                        mutedRows.includes(rowIndex) ? "text-muted" : "text-ink",
                      )}>
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
