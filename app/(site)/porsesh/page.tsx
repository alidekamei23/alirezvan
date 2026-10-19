import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircleQuestion, Search } from "lucide-react";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { FieldLabel, controlClasses } from "@/components/Field";
import { JsonLd } from "@/components/JsonLd";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { Section } from "@/components/Section";
import { QuestionIndex } from "@/components/questions/QuestionIndex";
import { isQuestionCategory, questionCategories, questionCategoryTitle } from "@/content/question-categories";
import { ASK_HREF, QUESTIONS_HREF, TRACK_HREF, questionsCopy } from "@/content/questions";
import { cn } from "@/lib/cn";
import { toPersianDigits } from "@/lib/format";
import { cachedQuestionList } from "@/lib/questions/cached";
import { PUBLIC_PAGE_SIZE } from "@/lib/questions/public";
import { ALLOW_INDEXING, pageMetadata } from "@/lib/seo";

type Props = PageProps<"/porsesh">;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/** The query string, checked: anything odd falls back to the default. */
function readParams(raw: Record<string, string | string[] | undefined>) {
  const q = first(raw.q).trim().slice(0, 100);
  const category = first(raw.dasteh);
  const page = Number(first(raw.page));
  return {
    q,
    category: isQuestionCategory(category) ? category : undefined,
    page: Number.isInteger(page) && page > 1 && page <= 1000 ? page : 1,
  };
}

/** /porsesh, /porsesh?dasteh=…, …&page=2. The search text is not part of addresses we index. */
function listHref({ q, category, page }: { q?: string; category?: string; page?: number }): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("dasteh", category);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${QUESTIONS_HREF}?${query}` : QUESTIONS_HREF;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, category, page } = readParams(await searchParams);
  const title = [
    category ? `${questionsCopy.heading}: ${questionCategoryTitle(category)}` : questionsCopy.metaTitle,
    page > 1 ? `صفحه ${toPersianDigits(page)}` : "",
  ]
    .filter(Boolean)
    .join(" - ");
  const metadata = pageMetadata({
    title,
    description: questionsCopy.metaDescription,
    path: listHref({ category, page }),
  });
  // Search results are not pages of their own for search engines.
  return q ? { ...metadata, robots: { index: false, follow: ALLOW_INDEXING } } : metadata;
}

// The page reads the query string before rendering. `instant = false` tells Next.js that
// waiting for it here is intended; the list itself comes from the cache.
export const instant = false;

export default async function QuestionsPage({ searchParams }: Props) {
  const { q, category, page } = readParams(await searchParams);
  const { items, total } = await cachedQuestionList({ q, category, page });
  const pages = Math.max(1, Math.ceil(total / PUBLIC_PAGE_SIZE));
  const filtered = q !== "" || category !== undefined;

  return (
    <>
      <PageHeader
        title={questionsCopy.heading}
        lead={questionsCopy.lead}
        crumbs={[{ label: questionsCopy.heading }]}
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <LinkButton href={ASK_HREF} size="lg" icon={<MessageCircleQuestion />}>
            {questionsCopy.askButton}
          </LinkButton>
          <Link
            href={TRACK_HREF}
            className="inline-flex min-h-11 items-center px-2 font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            {questionsCopy.trackLink}
          </Link>
        </div>
      </PageHeader>

      <Section>
        {/* A plain GET form: the search lives in the address, and works without JavaScript. */}
        <form
          action={QUESTIONS_HREF}
          role="search"
          aria-label={questionsCopy.searchLabel}
          className="grid gap-4 rounded-md border border-line bg-surface p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] sm:items-end"
        >
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="porsesh-q">{questionsCopy.searchLabel}</FieldLabel>
            <input
              id="porsesh-q"
              name="q"
              type="search"
              defaultValue={q}
              maxLength={100}
              placeholder={questionsCopy.searchPlaceholder}
              className={controlClasses(undefined, "min-h-12")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="porsesh-category">{questionsCopy.categoryLabel}</FieldLabel>
            <select
              id="porsesh-category"
              name="dasteh"
              defaultValue={category ?? ""}
              className={controlClasses(undefined, "min-h-12")}
            >
              <option value="">{questionsCopy.allCategories}</option>
              {questionCategories.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.title}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" icon={<Search />}>
            جست‌وجو
          </Button>
        </form>

        {/* Category links: one click, and internal links for search engines. */}
        <nav aria-label="دسته‌بندی پرسش‌ها" className="mt-4">
          <ul className="flex flex-wrap gap-2">
            {[{ slug: undefined, title: questionsCopy.allCategories }, ...questionCategories].map((option) => {
              const active = option.slug === category;
              return (
                <li key={option.slug ?? "all"}>
                  <Link
                    href={listHref({ category: option.slug })}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
                      active
                        ? "border-primary bg-primary text-on-primary"
                        : "border-line bg-surface text-ink hover:border-primary hover:text-primary",
                    )}
                  >
                    {option.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-8">
          {filtered && total > 0 && (
            <p className="mb-3 text-sm text-muted" aria-live="polite">
              {toPersianDigits(total)} پرسش
              {q && <> برای «{q}»</>}
              {category && <> در دسته {questionCategoryTitle(category)}</>}
            </p>
          )}
          {items.length > 0 ? (
            <QuestionIndex items={items} />
          ) : (
            <EmptyState
              Icon={MessageCircleQuestion}
              title={filtered ? questionsCopy.noResultsTitle : questionsCopy.emptyTitle}
              description={filtered ? questionsCopy.noResultsText : questionsCopy.emptyText}
              action={
                <LinkButton href={ASK_HREF} variant="secondary">
                  {questionsCopy.askButton}
                </LinkButton>
              }
            />
          )}
          <div className="mt-8">
            <Pagination current={page} total={pages} hrefFor={(n) => listHref({ q, category, page: n })} />
          </div>
        </div>
      </Section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "خانه", item: "/" },
            { "@type": "ListItem", position: 2, name: questionsCopy.heading, item: QUESTIONS_HREF },
          ],
        }}
      />
    </>
  );
}
