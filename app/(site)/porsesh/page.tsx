import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownWideNarrow, ChevronDown, ListFilter, MessageCircleQuestion, Search } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { JsonLd } from "@/components/JsonLd";
import { LinkButton } from "@/components/LinkButton";
import { Pagination } from "@/components/Pagination";
import { QuestionIndex } from "@/components/questions/QuestionIndex";
import { isQuestionCategory, questionCategories, questionCategoryTitle } from "@/content/question-categories";
import { ASK_HREF, QUESTIONS_HREF, TRACK_HREF, questionsCopy } from "@/content/questions";
import { cn } from "@/lib/cn";
import { toPersianDigits } from "@/lib/format";
import { cachedQuestionList } from "@/lib/questions/cached";
import { PUBLIC_PAGE_SIZE } from "@/lib/questions/public";
import { breadcrumbSchema } from "@/lib/schema";
import { NOINDEX_FOLLOW, pageMetadata, pagedDescription } from "@/lib/seo";

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
    description: pagedDescription(questionsCopy.metaDescription, page),
    path: listHref({ category, page }),
  });
  // Search results are not pages of their own for search engines, and neither is an
  // empty list (a category with no published questions yet, or a page past the last).
  const { items } = await cachedQuestionList({ q, category, page });
  return q || items.length === 0 ? { ...metadata, robots: NOINDEX_FOLLOW } : metadata;
}

// The page reads the query string before rendering. `instant = false` tells Next.js that
// waiting for it here is intended; the list itself comes from the cache.
export const instant = false;

export default async function QuestionsPage({ searchParams }: Props) {
  const { q, category, page } = readParams(await searchParams);
  const { items, total } = await cachedQuestionList({ q, category, page });
  const pages = Math.max(1, Math.ceil(total / PUBLIC_PAGE_SIZE));
  const filtered = q !== "" || category !== undefined;

  const trail = [{ label: "خانه", href: "/" }, { label: questionsCopy.heading }];
  const categoryLinks = (
    <ul className="grid gap-0.5">
      {[{ slug: undefined, title: "همه پرسش‌ها" }, ...questionCategories].map((option) => (
        <li key={option.slug ?? "all"}>
          <Link
            href={listHref({ q, category: option.slug })}
            aria-current={category === option.slug ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center rounded-sm px-3 text-sm transition-colors",
              category === option.slug
                ? "bg-primary-soft-strong font-bold text-primary-active"
                : "text-ink hover:bg-primary-soft hover:text-primary-hover",
            )}
          >
            {option.title}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <Container className="pb-12 md:pb-16">
      <div className="flex flex-wrap items-center justify-between gap-x-5 py-1">
        <Breadcrumbs items={trail} />
        <div className="flex flex-wrap items-center gap-x-5 text-sm font-semibold text-primary-hover">
          <Link href={ASK_HREF} className="inline-flex min-h-11 items-center gap-2 hover:underline">
            <MessageCircleQuestion aria-hidden="true" className="size-4" />
            {questionsCopy.askButton}
          </Link>
          <Link href={TRACK_HREF} className="inline-flex min-h-11 items-center hover:underline">
            {questionsCopy.trackLink}
          </Link>
        </div>
      </div>
      <JsonLd data={breadcrumbSchema(trail.map((crumb) => ({ name: crumb.label, href: crumb.href })))} />

      <header className="relative isolate overflow-hidden rounded-lg bg-linear-to-l from-primary-soft-strong to-primary-soft px-5 py-5 sm:px-8 sm:py-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/3 bg-[url('/images/courthouse-linework.svg')] bg-cover bg-left-bottom bg-no-repeat opacity-35 [mask-image:linear-gradient(to_right,black_55%,transparent)] sm:w-2/5 sm:opacity-70" />
        <div className="sm:w-3/5">
          <h1 className="text-2xl font-black text-ink">{questionsCopy.heading}</h1>
          <p className="mt-1 text-muted">{questionsCopy.lead}</p>
          <form
            action={QUESTIONS_HREF}
            role="search"
            aria-label={questionsCopy.searchLabel}
            className="mt-4 flex items-center rounded-sm border border-line-strong bg-surface focus-within:border-primary"
          >
            {category && <input type="hidden" name="dasteh" value={category} />}
            <button type="submit" aria-label="جست‌وجو" className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-sm text-primary hover:bg-primary-soft">
              <Search aria-hidden="true" className="size-5" />
            </button>
            <label htmlFor="porsesh-q" className="sr-only">{questionsCopy.searchLabel}</label>
            <input
              id="porsesh-q"
              key={q}
              name="q"
              type="search"
              defaultValue={q}
              maxLength={100}
              placeholder={questionsCopy.searchLabel}
              className="min-h-12 min-w-0 flex-1 rounded-sm pe-3 text-ink placeholder:text-muted"
            />
          </form>
        </div>
      </header>

      <div className="mt-6 grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_minmax(11rem,22%)] md:gap-x-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 md:col-start-1 md:row-start-1">
          <h2 className="text-xl font-extrabold text-ink">پرسش‌ها</h2>
          {items.length > 0 && (
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <ArrowDownWideNarrow aria-hidden="true" className="size-4" /> برگزیده‌ها، سپس تازه‌ترین‌ها
            </span>
          )}
        </div>
        <nav aria-label="دسته‌بندی پرسش‌ها" className="rounded-md border border-line bg-surface p-2 md:col-start-2 md:row-start-2">
          <details className="group md:hidden" key={category ?? "all"}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-sm px-2 text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
              <ListFilter aria-hidden="true" className="size-4 text-primary" />
              دسته‌بندی‌ها
              <span className="ms-auto text-sm font-normal text-muted">{category ? questionCategoryTitle(category) : "همه پرسش‌ها"}</span>
              <ChevronDown aria-hidden="true" className="size-4 group-open:rotate-180" />
            </summary>
            {categoryLinks}
          </details>
          <div className="hidden md:block">
            <h2 className="px-3 pt-1 pb-3 font-bold text-ink">دسته‌بندی‌ها</h2>
            {categoryLinks}
          </div>
        </nav>

        <section aria-label="فهرست پرسش‌ها" className="min-w-0 md:col-start-1 md:row-start-2">
          {filtered && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 rounded-sm bg-primary-soft px-3 text-sm">
              <p className="min-w-0 py-1 text-muted wrap-anywhere" aria-live="polite">
                {toPersianDigits(total)} پرسش
                {q && <> برای «{q}»</>}
                {category && <> در دسته {questionCategoryTitle(category)}</>}
              </p>
              <Link href={QUESTIONS_HREF} className="inline-flex min-h-11 items-center font-semibold text-primary-hover underline underline-offset-4">
                نمایش همه پرسش‌ها
              </Link>
            </div>
          )}
          {items.length > 0 ? (
            <QuestionIndex items={items} headingLevel="h3" />
          ) : (
            <EmptyState
              Icon={MessageCircleQuestion}
              title={filtered ? questionsCopy.noResultsTitle : questionsCopy.emptyTitle}
              description={filtered ? questionsCopy.noResultsText : questionsCopy.emptyText}
              action={<LinkButton href={ASK_HREF} variant="secondary">{questionsCopy.askButton}</LinkButton>}
            />
          )}
          {pages > 1 && (
            <div className="mt-6">
              <Pagination current={page} total={pages} hrefFor={(n) => listHref({ q, category, page: n })} />
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}
