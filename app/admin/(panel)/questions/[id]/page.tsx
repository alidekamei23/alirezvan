import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { formatAdminDate } from "@/lib/articles/admin-view";
import { listArticleOptions } from "@/lib/articles/repository";
import { requireAdminPage } from "@/lib/auth/admin";
import { getDb } from "@/lib/db";
import { toPersianDigits } from "@/lib/format";
import { toEditorQuestion } from "@/lib/questions/editor";
import { getQuestionById, listQuestionRedirects } from "@/lib/questions/repository";
import { displayNameOf } from "@/lib/questions/view";
import { SITE_URL } from "@/lib/seo";

export const metadata = { title: "بررسی پرسش" };

export default async function EditQuestionPage({ params, searchParams }: PageProps<"/admin/questions/[id]">) {
  await requireAdminPage();

  const { id } = await params;
  const db = getDb();
  const question = await getQuestionById(db, id);
  if (!question) notFound();
  const [articles, oldSlugs] = await Promise.all([listArticleOptions(db), listQuestionRedirects(db, question.id)]);

  return (
    <Container className="py-8">
      {/* The key makes a fresh editor when another question is opened. */}
      <QuestionEditor
        key={question.id}
        question={toEditorQuestion(question)}
        articles={articles}
        siteUrl={SITE_URL}
        justCreated={(await searchParams).created === "1"}
      />

      <dl className="mt-6 grid gap-x-8 gap-y-2 rounded-md border border-line bg-surface p-4 text-sm sm:grid-cols-2 md:p-6">
        <div>
          <dt className="inline text-muted">ثبت: </dt>
          <dd className="inline text-ink">
            {formatAdminDate(question.createdAt)}، {question.trackingCodeHash ? `از ${displayNameOf(question.displayName)}` : "افزوده‌شده در پنل"}
          </dd>
        </div>
        <div>
          <dt className="inline text-muted">آخرین ذخیره: </dt>
          <dd className="inline text-ink">{formatAdminDate(question.updatedAt)}</dd>
        </div>
        <div>
          <dt className="inline text-muted">پاسخ: </dt>
          <dd className="inline text-ink">
            {question.answeredAt ? `${formatAdminDate(question.answeredAt)}، ${question.answeredBy}` : "—"}
          </dd>
        </div>
        <div>
          <dt className="inline text-muted">نخستین انتشار: </dt>
          <dd className="inline text-ink">{formatAdminDate(question.publishedAt)}</dd>
        </div>
        <div>
          <dt className="inline text-muted">بازدید: </dt>
          <dd className="inline text-ink">{toPersianDigits(question.viewCount)}</dd>
        </div>
        {oldSlugs.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="inline text-muted">نشانی‌های قدیمی که به این پرسش هدایت می‌شوند: </dt>
            <dd className="inline text-ink">{oldSlugs.join("، ")}</dd>
          </div>
        )}
      </dl>
    </Container>
  );
}
