// GuideCard — links to a guide: practice area, title, summary and last legal review date.
// Usage: <GuideCard href="/guides/…" title="…" summary="…" area="چک و سفته" reviewedAt="1405-07-12" />
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { ReviewedAt } from "@/components/ReviewedAt";

export function GuideCard({
  href,
  title,
  summary,
  area,
  reviewedAt,
}: {
  href: string;
  title: string;
  summary: string;
  area: string;
  /** Jalali "YYYY-MM-DD". */
  reviewedAt: string;
}) {
  return (
    <Card href={href} className="h-full">
      <span className="flex h-full flex-col items-start gap-3">
        <Badge tone="primary">{area}</Badge>
        <span className="text-lg font-bold text-ink group-hover:text-primary">{title}</span>
        <span className="text-sm text-muted">{summary}</span>
        <ReviewedAt date={reviewedAt} className="mt-auto" />
      </span>
    </Card>
  );
}
