import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { Container } from "@/components/Container";
import { lawyer } from "@/content/lawyer";
import { areaOptions, emptyEditorArticle } from "@/lib/articles/editor";
import { requireAdminPage } from "@/lib/auth/admin";
import { SITE_URL } from "@/lib/seo";

export const metadata = { title: "مقاله تازه" };

export default async function NewArticlePage() {
  await requireAdminPage();

  return (
    <Container className="py-8">
      <ArticleEditor
        article={emptyEditorArticle}
        areas={areaOptions}
        siteUrl={SITE_URL}
        siteName={lawyer.name}
      />
    </Container>
  );
}
