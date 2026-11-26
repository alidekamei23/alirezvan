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
    <ul className={compact ? "border-t-2 border-primary" : "grid gap-3"}>
      {items.map((item) => {
        const date = item.publishedAt && (
          <time dateTime={isoDate(item.publishedAt)} className="text-sm text-muted">{jalaliDate(item.publishedAt)}</time>
        );
        return (
          <li key={item.slug} className={compact ? "border-b border-line" : undefined}>
            {compact ? (
              <Link href={questionHref(item.slug)} className="group grid grid-cols-[1fr_auto] items-center gap-x-4 py-4 -outline-offset-2 hover:bg-primary-soft active:bg-primary-soft-strong md:px-4">
                <div className="grid min-w-0 gap-1.5">
                  <Heading className="font-bold text-ink group-hover:text-primary">{item.title}</Heading>
                  {date}
                </div>
                <ChevronLeft aria-hidden="true" className="size-5 text-primary" />
              </Link>
            ) : (
              <Link
                href={questionHref(item.slug)}
                aria-label={`مشاهده پاسخ به «${item.title}»`}
                className="group block rounded-md border border-line bg-surface px-4 py-4 transition-colors hover:border-primary hover:bg-primary-soft focus-visible:border-primary sm:px-6"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="rounded-full bg-primary-soft-strong px-3 text-sm font-medium text-primary-active">
                    {questionCategoryTitle(item.category)}
                  </span>
                  {date}
                  {item.isFeatured && <Badge tone="primary">برگزیده</Badge>}
                </div>
                <Heading className="mt-2 text-lg font-bold text-ink wrap-anywhere group-hover:text-primary-hover">{item.title}</Heading>
                <div className="mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 sm:flex-nowrap">
                  {item.answerExcerpt && <p className="line-clamp-2 min-w-0 text-sm text-muted wrap-anywhere">{item.answerExcerpt}</p>}
                  <span className="ms-auto inline-flex shrink-0 items-center gap-1 text-sm font-bold text-primary-hover group-hover:underline">
                    مشاهده پاسخ <ChevronLeft aria-hidden="true" className="size-4" />
                  </span>
                </div>
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
