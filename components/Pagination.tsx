// Pagination — previous / page numbers / next for a paginated list. Every page is a
// real link (its own URL), so it works without JavaScript and for search engines.
// Phones get «صفحه ۲ از ۵» between the two arrows; from `sm` the numbers appear, with
// gaps when there are many pages. Renders nothing when there is only one page.
// Usage: <Pagination current={2} total={5} hrefFor={(page) => blogHref(area, page)} />
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { toPersianDigits } from "@/lib/format";
import { pageItems } from "@/lib/pagination";

const cell =
  "flex min-h-11 min-w-11 items-center justify-center rounded-sm px-3 text-sm font-semibold transition-colors";

function Arrow({
  href,
  direction,
}: {
  /** null when there is no such page. */
  href: string | null;
  direction: "previous" | "next";
}) {
  const label = direction === "previous" ? "صفحه قبلی" : "صفحه بعدی";
  // In RTL "previous" points right and "next" points left.
  const Icon = direction === "previous" ? ChevronRight : ChevronLeft;
  const content = (
    <>
      {direction === "previous" && <Icon aria-hidden="true" className="size-5" />}
      <span>{direction === "previous" ? "قبلی" : "بعدی"}</span>
      {direction === "next" && <Icon aria-hidden="true" className="size-5" />}
    </>
  );
  const classes = cn(cell, "gap-1 border");

  if (!href) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        className={cn(classes, "border-line bg-disabled-surface text-disabled-ink")}
      >
        {content}
      </span>
    );
  }
  return (
    <Link
      href={href}
      rel={direction === "previous" ? "prev" : "next"}
      aria-label={label}
      className={cn(
        classes,
        "border-line-strong bg-surface text-ink hover:border-primary hover:text-primary active:bg-primary-soft",
      )}
    >
      {content}
    </Link>
  );
}

export function Pagination({
  current,
  total,
  hrefFor,
}: {
  /** 1-based. */
  current: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  if (total <= 1) return null;

  return (
    <nav
      aria-label="صفحه‌بندی"
      className="flex items-center justify-between gap-2 border-t border-line pt-6 sm:justify-center"
    >
      <Arrow direction="previous" href={current > 1 ? hrefFor(current - 1) : null} />

      <p className="text-sm text-muted sm:hidden">
        صفحه {toPersianDigits(current)} از {toPersianDigits(total)}
      </p>

      <ol className="hidden items-center gap-1 sm:flex">
        {pageItems(current, total).map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true" className={cn(cell, "text-muted")}>
              …
            </li>
          ) : (
            <li key={item}>
              {item === current ? (
                <span
                  aria-current="page"
                  aria-label={`صفحه ${toPersianDigits(item)}، صفحه فعلی`}
                  className={cn(cell, "bg-primary text-on-primary")}
                >
                  {toPersianDigits(item)}
                </span>
              ) : (
                <Link
                  href={hrefFor(item)}
                  aria-label={`صفحه ${toPersianDigits(item)}`}
                  className={cn(
                    cell,
                    "text-ink hover:bg-primary-soft hover:text-primary active:bg-primary-soft-strong",
                  )}
                >
                  {toPersianDigits(item)}
                </Link>
              )}
            </li>
          ),
        )}
      </ol>

      <Arrow direction="next" href={current < total ? hrefFor(current + 1) : null} />
    </nav>
  );
}
