import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { Container } from "@/components/Container";
import { lawyer } from "@/content/lawyer";
import { formatAdminDate } from "@/lib/articles/admin-view";
import { areaOptions, toEditorArticle } from "@/lib/articles/editor";
import { getArticleById, listRedirectsTo } from "@/lib/articles/repository";
import { requireAdminPage } from "@/lib/auth/admin";
import { getDb } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

export const metadata = { title: "ویرایش مقاله" };

export default async function EditArticlePage({
  params,
  searchParams,
}: PageProps<"/admin/articles/[id]/edit">) {
  await requireAdminPage();

  const { id } = await params;
  const article = await getArticleById(getDb(), id);
  if (!article) notFound();
  const oldSlugs = await listRedirectsTo(getDb(), article.id);

  return (
    <Container className="py-8">
      {/* The key makes a fresh editor when another article is opened. */}
      <ArticleEditor
        key={article.id}
        article={toEditorArticle(article)}
        areas={areaOptions}
        siteUrl={SITE_URL}
        siteName={lawyer.name}
        justCreated={(await searchParams).created === "1"}
      />

      <dl className="mt-6 grid gap-x-8 gap-y-2 rounded-md border border-line bg-surface p-4 text-sm sm:grid-cols-2 md:p-6">
        <div>
          <dt className="inline text-muted">ساخته شده: </dt>
          <dd className="inline text-ink">{formatAdminDate(article.createdAt)}</dd>
        </div>
        <div>
          <dt className="inline text-muted">آخرین ذخیره: </dt>
          <dd className="inline text-ink">{formatAdminDate(article.updatedAt)}</dd>
        </div>
        <div>
          <dt className="inline text-muted">نخستین انتشار: </dt>
          <dd className="inline text-ink">{formatAdminDate(article.publishedAt)}</dd>
        </div>
        <div>
          <dt className="inline text-muted">«آخرین به‌روزرسانی» در وب‌سایت: </dt>
          <dd className="inline text-ink">{formatAdminDate(article.contentUpdatedAt)}</dd>
        </div>
        <div>
          <dt className="inline text-muted">آخرین تأیید وکیل (خصوصی): </dt>
          <dd className="inline text-ink">
            {article.approvedAt
              ? `${formatAdminDate(article.approvedAt)}، ثبت‌شده به نام ${article.approvedBy}`
              : "—"}
          </dd>
        </div>
        {oldSlugs.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="inline text-muted">نشانی‌های قدیمی که به این مقاله هدایت می‌شوند: </dt>
            <dd className="inline text-ink">{oldSlugs.join("، ")}</dd>
          </div>
        )}
      </dl>
    </Container>
  );
}
