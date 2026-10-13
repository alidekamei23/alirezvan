import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Alert } from "@/components/Alert";
import { ArticleBody } from "@/components/ArticleBody";
import { Container } from "@/components/Container";
import { Faq } from "@/components/Faq";
import { LinkButton } from "@/components/LinkButton";
import { practiceAreas } from "@/content/practice-areas";
import { formatAdminDate } from "@/lib/articles/admin-view";
import { getArticleById } from "@/lib/articles/repository";
import { requireAdminPage } from "@/lib/auth/admin";
import { getDb } from "@/lib/db";

export const metadata = { title: "پیش‌نمایش مقاله" };

// The saved version of one article, drafts included, for the logged-in admin only. It
// reads the database directly on every request and is never cached.
export default async function PreviewArticlePage({
  params,
}: PageProps<"/admin/articles/[id]/preview">) {
  await requireAdminPage();

  const { id } = await params;
  const article = await getArticleById(getDb(), id);
  if (!article) notFound();
  const area = practiceAreas.find((item) => item.slug === article.area);

  return (
    <>
      <Container className="py-6">
        <Alert
          tone={article.status === "published" ? "info" : "warning"}
          title={
            article.status === "published"
              ? "پیش‌نمایش مقاله منتشرشده"
              : "پیش‌نمایش پیش‌نویس — این مقاله در وب‌سایت دیده نمی‌شود"
          }
        >
          این صفحه نسخه ذخیره‌شده را نشان می‌دهد و فقط برای مدیر واردشده باز می‌شود.
        </Alert>
        <div className="mt-4">
          <LinkButton
            href={`/admin/articles/${article.id}/edit`}
            variant="secondary"
            size="sm"
            icon={<Pencil />}
          >
            بازگشت به ویرایش
          </LinkButton>
        </div>
      </Container>

      <article>
        <div className="border-y border-line bg-surface py-8 md:py-10">
          <Container>
            <div className="max-w-reading">
              {area && <p className="text-sm font-semibold text-primary">{area.title}</p>}
              <h1 className="mt-1 text-3xl font-black text-ink">{article.title}</h1>
              {article.excerpt && <p className="mt-4 text-lg text-ink">{article.excerpt}</p>}
              <p className="mt-5 text-sm text-muted">
                آخرین به‌روزرسانی: {formatAdminDate(article.contentUpdatedAt)}
              </p>
            </div>
          </Container>
        </div>

        <Container className="py-8 md:py-12">
          <div className="max-w-reading">
            {article.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of an already resized file
              <img
                src={article.coverImage}
                alt={article.coverImageAlt}
                width={article.coverWidth ?? undefined}
                height={article.coverHeight ?? undefined}
                className="mb-8 aspect-[16/10] w-full rounded-lg border border-line bg-surface-muted object-cover"
              />
            )}

            {article.content.trim() ? (
              <ArticleBody content={article.content} />
            ) : (
              <p className="text-muted">این مقاله هنوز متنی ندارد.</p>
            )}

            {article.faqs.length > 0 && (
              <section aria-labelledby="preview-faq" className="mt-12">
                <h2 id="preview-faq" className="mb-4 text-2xl font-bold text-ink">
                  پرسش‌های پرتکرار
                </h2>
                <Faq items={article.faqs} />
              </section>
            )}

            {article.references.length > 0 && (
              <section aria-labelledby="preview-references" className="mt-12">
                <h2 id="preview-references" className="mb-3 text-xl font-bold text-ink">
                  منابع
                </h2>
                <ul className="list-disc ps-6 text-sm text-ink">
                  {article.references.map((reference) => (
                    <li key={reference.title} className="py-1">
                      {reference.url ? (
                        <a
                          href={reference.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-4 hover:text-primary-hover"
                        >
                          {reference.title}
                        </a>
                      ) : (
                        reference.title
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </Container>
      </article>
    </>
  );
}
