// Turns a stored question into what the admin editor shows, and the empty form for a
// question the admin adds by hand.
import type { EditorQuestion } from "@/components/admin/QuestionEditor";
import { isPlaceholderSlug, type Question } from "@/lib/questions/repository";

export function toEditorQuestion(question: Question): EditorQuestion {
  // Visitor questions carry a tracking-code hash; the admin's own do not.
  const fromVisitor = question.trackingCodeHash !== null;
  return {
    id: question.id,
    status: question.status,
    everPublished: question.publishedAt !== null,
    original: fromVisitor ? { title: question.originalTitle, body: question.originalBody } : null,
    rejectionReason: question.rejectionReason,
    publishedAt: question.publishedAt?.toISOString() ?? null,
    displayName: question.displayName,
    category: question.category,
    title: question.title,
    body: question.body,
    answer: question.answer,
    // A neutral placeholder is not shown: a blank field makes the address from the title.
    slug: isPlaceholderSlug(question.slug) ? "" : question.slug,
    metaTitle: question.metaTitle,
    metaDescription: question.metaDescription,
    isFeatured: question.isFeatured,
    adminNote: question.adminNote,
    relatedArticles: question.relatedArticles,
  };
}

export const emptyEditorQuestion: EditorQuestion = {
  id: null,
  status: "pending",
  everPublished: false,
  original: null,
  rejectionReason: "",
  publishedAt: null,
  displayName: "",
  category: "",
  title: "",
  body: "",
  answer: "",
  slug: "",
  metaTitle: "",
  metaDescription: "",
  isFeatured: false,
  adminNote: "",
  relatedArticles: [],
};
