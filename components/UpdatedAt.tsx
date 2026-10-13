// UpdatedAt — «آخرین به‌روزرسانی» with a Jalali date. Shown on every blog post and post
// card (CLAUDE.md §2.1): legal content goes stale, so readers must see its date.
// Usage: <UpdatedAt date="1405-07-21" /> or <UpdatedAt date="…" short /> for cards.
import { CalendarCheck } from "lucide-react";
import { UPDATED_AT_LABEL } from "@/content/legal";
import { cn } from "@/lib/cn";
import { formatJalali, jalaliToGregorianISO } from "@/lib/jalali";

export function UpdatedAt({
  date,
  short = false,
  className,
}: {
  /** Jalali "YYYY-MM-DD", Latin digits. */
  date: string;
  /** Date only, with the label kept for screen readers. For cards. */
  short?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm text-muted", className)}>
      {!short && <CalendarCheck aria-hidden="true" className="size-4 shrink-0" />}
      <span>
        <span className={short ? "sr-only" : undefined}>{UPDATED_AT_LABEL}: </span>
        <time dateTime={jalaliToGregorianISO(date) ?? undefined}>{formatJalali(date)}</time>
      </span>
    </span>
  );
}
