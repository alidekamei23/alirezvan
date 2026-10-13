// What the editor pages hand to the ArticleEditor client component: plain data only,
// without the private approval fields.
import type { EditorArticle } from "@/components/admin/ArticleEditor";
import { practiceAreas } from "@/content/practice-areas";
import type { Article } from "@/lib/articles/repository";

export const areaOptions = practiceAreas.map((area) => ({ value: area.slug, label: area.title }));

export const emptyEditorArticle: EditorArticle = {
  id: null,
  status: "draft",
  everPublished: false,
  title: "",
  slug: "",
  area: "",
  excerpt: "",
  content: "",
  coverImage: null,
  coverImageAlt: "",
  coverWidth: null,
  coverHeight: null,
  faqs: [],
  references: [],
  seoTitle: "",
  seoDescription: "",
};

export function toEditorArticle(article: Article): EditorArticle {
  return {
    id: article.id,
    status: article.status,
    everPublished: article.publishedAt !== null,
    title: article.title,
    slug: article.slug,
    area: article.area,
    excerpt: article.excerpt,
    content: article.content,
    coverImage: article.coverImage,
    coverImageAlt: article.coverImageAlt,
    coverWidth: article.coverWidth,
    coverHeight: article.coverHeight,
    faqs: article.faqs,
    references: article.references,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
  };
}
