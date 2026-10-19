// QuestionArticle — one question and the lawyer's answer, as the public page shows it:
// title, who asked and when, the question as plain text, the answer (Markdown through
// ArticleBody, without the automatic contact box), and the information-only notice with
// a call to action. The admin's preview renders this same component, so it matches the
// site exactly.
// Usage: <QuestionArticle question={question} />
import { CalendarDays, Scale, UserRound } from "lucide-react";
import { ArticleBody } from "@/components/ArticleBody";
import { Badge } from "@/components/Badge";
import { CallButton } from "@/components/CallButton";
import { LinkButton } from "@/components/LinkButton";
import { lawyer } from "@/content/lawyer";
import { requestNav } from "@/content/navigation";
import { questionCategoryTitle } from "@/content/question-categories";
import { questionsCopy } from "@/content/questions";
import { displayNameOf, isoDate, jalaliDate } from "@/lib/questions/view";

export type QuestionArticleData = {
  title: string;
  body: string;
  displayName: string;
  category: string;
  answer: string;
  publishedAt: Date | string | null;
  answeredAt: Date | string | null;
};

export function QuestionArticle({ question }: { question: QuestionArticleData }) {
  const asked = jalaliDate(question.publishedAt);
  const answered = jalaliDate(question.answeredAt ?? question.publishedAt);
  return (
    <article className="flex min-w-0 flex-col gap-8">
      <header>
        <Badge tone="primary">{questionCategoryTitle(question.category)}</Badge>
        <h1 className="mt-3 text-3xl font-black text-ink">{question.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <UserRound aria-hidden="true" className="size-4 shrink-0" />
            پرسش از {displayNameOf(question.displayName)}
          </span>
          {asked && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
              <time dateTime={isoDate(question.publishedAt)}>{asked}</time>
            </span>
          )}
        </div>
      </header>

      <section aria-label={questionsCopy.questionHeading} className="rounded-md border border-line bg-surface p-5 md:p-6">
        <h2 className="sr-only">{questionsCopy.questionHeading}</h2>
        <p className="whitespace-pre-line text-ink">{question.body}</p>
      </section>

      <section aria-labelledby="question-answer">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b-2 border-primary pb-3">
          <h2 id="question-answer" className="text-2xl font-bold text-ink">
            {questionsCopy.answerHeading}
          </h2>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted">
            <Scale aria-hidden="true" className="size-4 shrink-0 text-primary" />
            {lawyer.name}، {lawyer.grade}
            {answered && (
              <>
                {"، "}
                <time dateTime={isoDate(question.answeredAt ?? question.publishedAt)}>{answered}</time>
              </>
            )}
          </p>
        </div>
        <div className="mt-6">
          {question.answer.trim() ? (
            <ArticleBody content={question.answer} contactBox={false} />
          ) : (
            <p className="text-muted">هنوز پاسخی نوشته نشده است.</p>
          )}
        </div>
      </section>

      <aside
        aria-label="توضیح و درخواست مشاوره"
        className="rounded-md border border-estimate-line bg-estimate-surface p-5 text-estimate-ink"
      >
        {/* TODO: lawyer review */}
        <p className="text-sm">{questionsCopy.disclaimer}</p>
        <p className="mt-4 font-bold text-ink">{questionsCopy.ctaTitle}</p>
        <p className="mt-1 text-sm text-ink">{questionsCopy.ctaText}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <LinkButton href={requestNav.href} variant="secondary" size="sm">
            {requestNav.label}
          </LinkButton>
          <CallButton variant="ghost" size="sm" />
        </div>
      </aside>
    </article>
  );
}
