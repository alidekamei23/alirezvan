import { Container } from "@/components/Container";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { listArticleOptions } from "@/lib/articles/repository";
import { requireAdminPage } from "@/lib/auth/admin";
import { getDb } from "@/lib/db";
import { emptyEditorQuestion } from "@/lib/questions/editor";
import { SITE_URL } from "@/lib/seo";

export const metadata = { title: "افزودن پرسش و پاسخ" };

export default async function NewQuestionPage() {
  await requireAdminPage();
  const articles = await listArticleOptions(getDb());
  return (
    <Container className="py-8">
      <QuestionEditor question={emptyEditorQuestion} articles={articles} siteUrl={SITE_URL} />
    </Container>
  );
}
