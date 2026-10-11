// Table — data in rows and columns. A wide table scrolls inside its own box (focusable,
// so keyboard users can scroll it); the page itself never scrolls sideways.
// Usage: <Table caption="شاخص ماهانه" head={["ماه", "شاخص"]} rows={[["مهر ۱۴۰۵", "…"]]} />
// The first cell of each row is its row header.
import type { ReactNode } from "react";

export function Table({
  caption,
  head,
  rows,
  emptyText = "داده‌ای برای نمایش وجود ندارد.",
}: {
  caption: string;
  head: string[];
  rows: ReactNode[][];
  emptyText?: string;
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
              <tr key={rowIndex} className="border-t border-line">
                {row.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <th
                      key={cellIndex}
                      scope="row"
                      className="px-4 py-3 text-start font-semibold text-ink"
                    >
                      {cell}
                    </th>
                  ) : (
                    <td key={cellIndex} className="px-4 py-3 text-start text-ink">
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
