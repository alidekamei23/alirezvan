import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { MessageCircleQuestion } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { LinkButton } from "@/components/LinkButton";
import { QuestionArticle } from "@/components/questions/QuestionArticle";
import { QuestionIndex } from "@/components/questions/QuestionIndex";
import { ViewCounter } from "@/components/questions/ViewCounter";
import { questionCategoryTitle } from "@/content/question-categories";
import { ASK_HREF, QUESTIONS_HREF, questionsCopy } from "@/content/questions";
import { NO_PARAMS, decodeSlug } from "@/lib/blog";
import { cachedQuestionPage } from "@/lib/questions/cached";
import { excerpt, markdownToPlain } from "@/lib/questions/core";
import { displayNameOf, isoDate, questionHref } from "@/lib/questions/view";
import { breadcrumbSchema, qaPageSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

type Props = PageProps<"/porsesh/[slug]">;

// Questions are rendered on first request and then cached (lib/questions/cached.ts); none
// are built ahead of time. Cache Components needs at least one entry here; it answers 404.
export async function generateStaticParams() {
  return [{ slug: NO_PARAMS }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await cachedQuestionPage(decodeSlug((await params).slug));
  if (page.kind !== "question") return {};
  const { question } = page;
  const description =
    question.metaDescription || excerpt(markdownToPlain(question.answer), 155) || excerpt(question.body, 155);
  const base = pageMetadata({
    title: question.metaTitle || question.title,
    description,
    path: questionHref(question.slug),
  });
  return { ...base, openGraph: { ...base.openGraph, type: "article" } };
}

// The page waits for the URL before rendering, so an unknown address gets a real 404
// status. `instant = false` tells Next.js that blocking here is intended.
export const instant = false;

export default async function QuestionPage({ params }: Props) {
  const slug = decodeSlug((await params).slug);
  const page = await cachedQuestionPage(slug);
  if (page.kind === "redirect") permanentRedirect(encodeURI(questionHref(page.slug)));
  if (page.kind !== "question") notFound();

  const { question, sameCategory, relatedArticles } = page;
  const categoryTitle = questionCategoryTitle(question.category);
  const categoryHref = `${QUESTIONS_HREF}?dasteh=${question.category}`;
  const url = questionHref(question.slug);

  return (
    <>
      <div className="border-b border-line bg-surface pt-3 pb-2">
        <Container>
          <Breadcrumbs
            items={[
              { label: "خانه", href: "/" },
              { label: questionsCopy.heading, href: QUESTIONS_HREF },
              { label: categoryTitle, href: categoryHref },
              { label: question.title },
            ]}
          />
        </Container>
      </div>

      <Container className="grid gap-x-16 gap-y-12 py-8 md:py-12 lg:grid-cols-[minmax(0,42rem)_minmax(0,1fr)]">
        <QuestionArticle question={question} />

        <aside className="flex min-w-0 flex-col gap-10 lg:pt-2">
          <div className="rounded-md border border-primary-line bg-primary-soft p-5">
            <p className="font-bold text-ink">سؤال خودتان را بپرسید</p>
            <p className="mt-1 text-sm text-ink">بدون ثبت‌نام؛ پاسخ وکیل در همین بخش منتشر می‌شود.</p>
            <div className="mt-4">
              <LinkButton href={ASK_HREF} variant="secondary" size="sm" icon={<MessageCircleQuestion />}>
                {questionsCopy.askButton}
              </LinkButton>
            </div>
          </div>

          {sameCategory.length > 0 && (
            <section aria-labelledby="same-category">
              <h2 id="same-category" className="mb-3 text-xl font-bold text-ink">
                {questionsCopy.sameCategory}
              </h2>
              <QuestionIndex items={sameCategory} compact headingLevel="h3" />
              <Link
                href={categoryHref}
                className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
              >
                همه پرسش‌های {categoryTitle}
              </Link>
            </section>
          )}

          {relatedArticles.length > 0 && (
            <section aria-labelledby="related-articles">
              <h2 id="related-articles" className="mb-3 text-xl font-bold text-ink">
                {questionsCopy.relatedArticles}
              </h2>
              <ul className="flex flex-col">
                {relatedArticles.map((article) => (
                  <li key={article.href}>
                    <Link
                      href={article.href}
                      className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </Container>

      <ViewCounter slug={question.slug} />

      <JsonLd
        data={qaPageSchema({
          title: question.title,
          body: question.body,
          href: url,
          askedBy: displayNameOf(question.displayName),
          publishedAt: isoDate(question.publishedAt),
          answer: markdownToPlain(question.answer),
          answeredAt: isoDate(question.answeredAt ?? question.publishedAt),
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "خانه", href: "/" },
          { name: questionsCopy.heading, href: QUESTIONS_HREF },
          { name: categoryTitle, href: categoryHref },
          { name: question.title, href: url },
        ])}
      />
    </>
  );
}
