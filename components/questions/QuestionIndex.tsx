// QuestionIndex — published questions as a ruled list, in the manner of ToolIndex: one
// row per question with its title, the start of the answer, its category and date.
// Featured questions carry a small «برگزیده» label. `compact` drops the answer excerpt
// (for the side column of a question page).
// Usage: <QuestionIndex items={summaries} />
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/Badge";
import { questionCategoryTitle } from "@/content/question-categories";
import type { PublicQuestionSummary } from "@/lib/questions/public";
import { isoDate, jalaliDate, questionHref } from "@/lib/questions/view";

export function QuestionIndex({
  items,
  compact = false,
  headingLevel = "h2",
}: {
  items: PublicQuestionSummary[];
  compact?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <ul className="border-t-2 border-primary">
      {items.map((item) => (
        <li key={item.slug} className="border-b border-line">
          <Link
            href={questionHref(item.slug)}
            className="group grid grid-cols-[1fr_auto] items-center gap-x-4 py-4 transition-colors -outline-offset-2 hover:bg-primary-soft active:bg-primary-soft-strong md:px-4"
          >
            <span className="flex min-w-0 flex-col gap-1.5">
              <Heading className={compact ? "font-bold text-ink group-hover:text-primary" : "text-lg font-bold text-ink group-hover:text-primary"}>
                {item.title}
              </Heading>
              {!compact && item.answerExcerpt && (
                <span className="line-clamp-2 text-sm text-muted">{item.answerExcerpt}</span>
              )}
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                {item.isFeatured && !compact && <Badge tone="primary">برگزیده</Badge>}
                {!compact && <span>{questionCategoryTitle(item.category)}</span>}
                {item.publishedAt && (
                  <time dateTime={isoDate(item.publishedAt)}>{jalaliDate(item.publishedAt)}</time>
                )}
              </span>
            </span>
            {/* Points left: "forward" in RTL. */}
            <ChevronLeft aria-hidden="true" className="size-5 shrink-0 text-primary" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
