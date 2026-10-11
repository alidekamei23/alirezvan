// ReviewedAt — «آخرین بازبینی حقوقی» with a Jalali date. Required on every guide
// (CLAUDE.md §2.1). Usage: <ReviewedAt date="1405-07-12" />
import { CalendarCheck } from "lucide-react";
import { REVIEWED_AT_LABEL } from "@/content/legal";
import { cn } from "@/lib/cn";
import { formatJalali, jalaliToGregorianISO } from "@/lib/jalali";

export function ReviewedAt({
  date,
  className,
}: {
  /** Jalali "YYYY-MM-DD", Latin digits. */
  date: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm text-muted", className)}>
      <CalendarCheck aria-hidden="true" className="size-4 shrink-0" />
      <span>
        {REVIEWED_AT_LABEL}:{" "}
        <time dateTime={jalaliToGregorianISO(date) ?? undefined}>{formatJalali(date)}</time>
      </span>
    </span>
  );
}
