import Link from "next/link";
import { MessageSquarePlus, Search } from "lucide-react";
import { Alert } from "@/components/Alert";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { FieldLabel, controlClasses } from "@/components/Field";
import { LinkButton } from "@/components/LinkButton";
import { Pagination } from "@/components/Pagination";
import { Table } from "@/components/Table";
import { QUESTION_STATUSES } from "@/db/schema";
import { questionCategories, questionCategoryTitle } from "@/content/question-categories";
import { formatAdminDate } from "@/lib/articles/admin-view";
import { requireAdminPage } from "@/lib/auth/admin";
import { getDb } from "@/lib/db";
import { cn } from "@/lib/cn";
import { toPersianDigits } from "@/lib/format";
import { STATUS_TONES, adminQuestionsHref, parseQuestionParams } from "@/lib/questions/admin-view";
import { STATUS_LABELS } from "@/lib/questions/core";
import { ADMIN_QUESTIONS_PAGE_SIZE, countByStatus, listQuestions } from "@/lib/questions/repository";
import { displayNameOf } from "@/lib/questions/view";

export const metadata = { title: "پرسش و پاسخ" };

const TAB_LABELS = {
  pending: "در انتظار",
  answered: "پاسخ‌داده",
  published: "منتشرشده",
  rejected: "ردشده",
  archived: "بایگانی",
} as const;

export default async function AdminQuestionsPage({ searchParams }: PageProps<"/admin/questions">) {
  await requireAdminPage();

  const raw = await searchParams;
  const params = parseQuestionParams(raw);
  const db = getDb();
  const [counts, { items, total }] = await Promise.all([
    countByStatus(db),
    listQuestions(db, { status: params.status, q: params.q, category: params.dasteh, page: params.page }),
  ]);
  const pages = Math.max(1, Math.ceil(total / ADMIN_QUESTIONS_PAGE_SIZE));
  const filtered = params.q !== "" || params.dasteh !== undefined;

  return (
    <Container className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-ink">پرسش و پاسخ</h1>
        <LinkButton href="/admin/questions/new" icon={<MessageSquarePlus />}>
          افزودن پرسش و پاسخ
        </LinkButton>
      </div>

      {raw.deleted === "1" && (
        <Alert tone="success" className="mt-6" live>
          پرسش حذف شد.
        </Alert>
      )}

      <nav aria-label="وضعیت پرسش‌ها" className="mt-6 overflow-x-auto">
        <ul className="flex min-w-max gap-1 border-b border-line">
          {QUESTION_STATUSES.map((status) => {
            const active = status === params.status;
            return (
              <li key={status}>
                <Link
                  href={adminQuestionsHref({ status, q: params.q, dasteh: params.dasteh })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px flex min-h-12 items-center gap-2 border-b-2 px-4 font-semibold transition-colors",
                    active ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink",
                  )}
                >
                  {TAB_LABELS[status]}
                  <Badge tone={status === "pending" && counts.pending > 0 ? "warning" : "neutral"}>
                    {toPersianDigits(counts[status])}
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* A plain GET form: the filters live in the address, so they survive a reload. */}
      <form
        action="/admin/questions"
        role="search"
        aria-label="جست‌وجو و پالایش پرسش‌ها"
        className="mt-6 grid gap-4 rounded-md border border-line bg-surface p-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
      >
        {params.status !== "pending" && <input type="hidden" name="status" value={params.status} />}
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="filter-q">جست‌وجو در عنوان، متن و پاسخ</FieldLabel>
          <input
            id="filter-q"
            name="q"
            type="search"
            defaultValue={params.q}
            maxLength={100}
            className={controlClasses(undefined, "min-h-12")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="filter-category">دسته‌بندی</FieldLabel>
          <select
            id="filter-category"
            name="dasteh"
            defaultValue={params.dasteh ?? ""}
            className={controlClasses(undefined, "min-h-12")}
          >
            <option value="">همه</option>
            {questionCategories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.title}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary" icon={<Search />}>
          اعمال
        </Button>
      </form>

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            title={filtered ? "پرسشی با این مشخصات نیست" : `پرسشی در «${TAB_LABELS[params.status]}» نیست`}
            description={
              params.status === "pending" && !filtered
                ? "پرسش‌های تازه بازدیدکنندگان اینجا می‌آیند."
                : undefined
            }
          />
        ) : (
          <Table
            caption={`پرسش‌های ${TAB_LABELS[params.status]}`}
            head={["عنوان", "دسته", "پرسشگر", "تاریخ ثبت", "بازدید", "وضعیت"]}
            rows={items.map((item) => [
              <Link
                key="title"
                href={`/admin/questions/${item.id}`}
                className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
              >
                {item.title}
                {item.isFeatured && <span className="ms-2 text-sm font-normal text-muted">(برگزیده)</span>}
              </Link>,
              questionCategoryTitle(item.category),
              displayNameOf(item.displayName),
              <span key="created" className="whitespace-nowrap">
                {formatAdminDate(item.createdAt)}
              </span>,
              <span key="views" className="tabular-nums">
                {toPersianDigits(item.viewCount)}
              </span>,
              <Badge key="status" tone={STATUS_TONES[item.status]}>
                {STATUS_LABELS[item.status]}
              </Badge>,
            ])}
          />
        )}
      </div>

      <div className="mt-6">
        <Pagination
          current={params.page}
          total={pages}
          hrefFor={(page) => adminQuestionsHref({ ...params, page })}
        />
      </div>
    </Container>
  );
}
