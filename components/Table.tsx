// Table — data in rows and columns. A wide table scrolls inside its own box (focusable,
// so keyboard users can scroll it); the page itself never scrolls sideways.
// Usage: <Table caption="شاخص ماهانه" head={["ماه", "شاخص"]} rows={[["مهر ۱۴۰۵", "…"]]} />
// The first cell of each row is its row header. `selectedRow` highlights one row (say in
// the cell text which one it is; colour alone is not enough). `mutedRows` greys out rows
// that are set aside rather than counted (say why in the row text too).
// `stacked` turns each row into a card when the table is narrower than 35rem (a phone
// under 560px, or a narrow column): the first cell across the top, every other cell under
// its column head. `rowAction` says the last column holds a row button (e.g. delete): its
// head is read by screen readers only, and on a card it sits in the top corner.
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Table({
  caption,
  head,
  rows,
  emptyText = "داده‌ای برای نمایش وجود ندارد.",
  selectedRow,
  mutedRows = [],
  stacked = false,
  rowAction = false,
}: {
  caption: string;
  head: string[];
  rows: ReactNode[][];
  emptyText?: string;
  /** Index in `rows`. */
  selectedRow?: number;
  /** Indexes in `rows`. */
  mutedRows?: number[];
  stacked?: boolean;
  rowAction?: boolean;
}) {
  const actionIndex = rowAction ? head.length - 1 : -1;
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className={cn(
        "max-w-full overflow-x-auto rounded-md border border-line bg-surface",
        stacked && "@container",
      )}
    >
      <table
        className={cn("w-full border-collapse text-sm", stacked && "@max-[35rem]:block")}
      >
        <caption className="sr-only">{caption}</caption>
        <thead className={cn(stacked && "@max-[35rem]:sr-only")}>
          <tr className="bg-surface-muted">
            {head.map((cell, cellIndex) => (
              <th
                key={cell}
                scope="col"
                className={cn(
                  "whitespace-nowrap px-4 py-3 text-start font-bold text-ink",
                  cellIndex === actionIndex && "w-px",
                )}
              >
                {cellIndex === actionIndex ? <span className="sr-only">{cell}</span> : cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn(stacked && "@max-[35rem]:block")}>
          {rows.length === 0 ? (
            <tr className={cn(stacked && "@max-[35rem]:block")}>
              <td
                colSpan={head.length}
                className={cn(
                  "px-4 py-8 text-center text-muted",
                  stacked && "@max-[35rem]:block",
                )}
              >
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
                  stacked &&
                    "@max-[35rem]:relative @max-[35rem]:grid @max-[35rem]:grid-cols-2 @max-[35rem]:gap-x-4 @max-[35rem]:gap-y-3 @max-[35rem]:p-4 @max-[35rem]:first:border-t-0",
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
                        stacked && "@max-[35rem]:col-span-full @max-[35rem]:p-0",
                        stacked && rowAction && "@max-[35rem]:pe-12",
                      )}
                    >
                      {cell}
                    </th>
                  ) : (
                    <td
                      key={cellIndex}
                      data-label={cellIndex === actionIndex ? undefined : head[cellIndex]}
                      className={cn(
                        "px-4 py-3 text-start",
                        mutedRows.includes(rowIndex) ? "text-muted" : "text-ink",
                        stacked &&
                          (cellIndex === actionIndex
                            ? "@max-[35rem]:absolute @max-[35rem]:end-2 @max-[35rem]:top-2 @max-[35rem]:p-0"
                            : "@max-[35rem]:p-0 @max-[35rem]:before:block @max-[35rem]:before:text-muted @max-[35rem]:before:content-[attr(data-label)]"),
                      )}
                    >
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
