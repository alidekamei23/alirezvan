import Link from "next/link";
import { FilePlus2, Search } from "lucide-react";
import { Alert } from "@/components/Alert";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { FieldLabel, controlClasses } from "@/components/Field";
import { LinkButton } from "@/components/LinkButton";
import { Pagination } from "@/components/Pagination";
import { Table } from "@/components/Table";
import { practiceAreas } from "@/content/practice-areas";
import { adminListHref, formatAdminDate, parseListParams } from "@/lib/articles/admin-view";
import { ADMIN_PAGE_SIZE, listArticles } from "@/lib/articles/repository";
import { requireAdminPage } from "@/lib/auth/admin";
import { getDb } from "@/lib/db";
import { toPersianDigits } from "@/lib/format";

export const metadata = { title: "مقاله‌ها" };

const areaTitle = (slug: string) =>
  practiceAreas.find((area) => area.slug === slug)?.title ?? slug;

const linkClass =
  "inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4 hover:text-primary-hover";

export default async function AdminArticlesPage({ searchParams }: PageProps<"/admin">) {
  await requireAdminPage();

  const raw = await searchParams;
  const params = parseListParams(raw);
  const { items, total } = await listArticles(getDb(), { ...params, pageSize: ADMIN_PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const filtered = params.q !== "" || params.status !== undefined;

  return (
    <Container className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-ink">مقاله‌ها</h1>
        <LinkButton href="/admin/articles/new" icon={<FilePlus2 />}>
          مقاله تازه
        </LinkButton>
      </div>

      {raw.deleted === "1" && (
        <Alert tone="success" className="mt-6" live>
          مقاله حذف شد.
        </Alert>
      )}

      {/* A plain GET form: the filters live in the address, so they survive a reload. */}
      <form
        action="/admin"
        role="search"
        aria-label="جست‌وجو و پالایش مقاله‌ها"
        className="mt-6 grid gap-4 rounded-md border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end"
      >
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="filter-q">جست‌وجو در عنوان</FieldLabel>
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
          <FieldLabel htmlFor="filter-status">وضعیت</FieldLabel>
          <select
            id="filter-status"
            name="status"
            defaultValue={params.status ?? ""}
            className={controlClasses(undefined, "min-h-12")}
          >
            <option value="">همه</option>
            <option value="draft">پیش‌نویس</option>
            <option value="published">منتشرشده</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="filter-sort">مرتب‌سازی بر اساس</FieldLabel>
          <select
            id="filter-sort"
            name="sort"
            defaultValue={params.sort}
            className={controlClasses(undefined, "min-h-12")}
          >
            <option value="updated">آخرین ویرایش</option>
            <option value="created">تاریخ ساخت</option>
            <option value="published">تاریخ انتشار</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="filter-dir">ترتیب</FieldLabel>
          <select
            id="filter-dir"
            name="dir"
            defaultValue={params.dir}
            className={controlClasses(undefined, "min-h-12")}
          >
            <option value="desc">تازه‌ترین اول</option>
            <option value="asc">قدیمی‌ترین اول</option>
          </select>
        </div>
        <Button type="submit" variant="secondary" icon={<Search />}>
          اعمال
        </Button>
      </form>

      <div className="mt-6">
        {total === 0 ? (
          filtered ? (
            <EmptyState
              title="مقاله‌ای با این مشخصات پیدا نشد"
              description="عبارت جست‌وجو یا وضعیت را تغییر دهید."
              action={
                <LinkButton href="/admin" variant="secondary">
                  نمایش همه مقاله‌ها
                </LinkButton>
              }
            />
          ) : (
            <EmptyState
              title="هنوز مقاله‌ای ساخته نشده است"
              description="نخستین مقاله را بسازید. تا وقتی منتشر نشود، فقط در همین پنل دیده می‌شود."
              action={<LinkButton href="/admin/articles/new">مقاله تازه</LinkButton>}
            />
          )
        ) : (
          <>
            <p className="mb-3 text-sm text-muted">
              {toPersianDigits(total)} مقاله
              {pages > 1 && `، صفحه ${toPersianDigits(params.page)} از ${toPersianDigits(pages)}`}
            </p>
            <Table
              caption="فهرست مقاله‌ها"
              head={["عنوان", "حوزه", "وضعیت", "آخرین ویرایش", "انتشار", "کارها"]}
              emptyText="این صفحه مقاله‌ای ندارد."
              rows={items.map((article) => [
                <Link key="title" href={`/admin/articles/${article.id}/edit`} className={linkClass}>
                  {article.title}
                </Link>,
                areaTitle(article.area),
                article.status === "published" ? (
                  <Badge key="status" tone="success">
                    منتشرشده
                  </Badge>
                ) : (
                  <Badge key="status" tone="neutral">
                    پیش‌نویس
                  </Badge>
                ),
                formatAdminDate(article.updatedAt),
                formatAdminDate(article.publishedAt),
                <span key="actions" className="flex gap-4 whitespace-nowrap">
                  <Link href={`/admin/articles/${article.id}/edit`} className={linkClass}>
                    ویرایش
                    <span className="sr-only"> {article.title}</span>
                  </Link>
                  <Link href={`/admin/articles/${article.id}/preview`} className={linkClass}>
                    پیش‌نمایش
                    <span className="sr-only"> {article.title}</span>
                  </Link>
                </span>,
              ])}
            />
            <div className="mt-8">
              <Pagination
                current={params.page}
                total={pages}
                hrefFor={(page) => adminListHref(params, page)}
              />
            </div>
          </>
        )}
      </div>
    </Container>
  );
}
