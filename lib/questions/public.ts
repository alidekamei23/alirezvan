// What the public pages may read about questions: published, undeleted ones only, and
// only the fields listed in PUBLIC_FIELDS. The tracking code, IP hash, the visitor's
// original text, rejection reason and admin note can never reach a page from here.
// Plain functions; lib/questions/cached.ts wraps them for the pages.
// (Relative imports with extensions: scripts run this file with plain Node.)
import { and, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { articles, questionSlugRedirects, questions } from "../../db/schema.ts";
import { excerpt, markdownToPlain } from "./core.ts";
import { searchFilter } from "./repository.ts";

const PUBLIC_FIELDS = {
  slug: questions.slug,
  title: questions.title,
  body: questions.body,
  displayName: questions.displayName,
  category: questions.category,
  answer: questions.answer,
  answeredAt: questions.answeredAt,
  publishedAt: questions.publishedAt,
  updatedAt: questions.updatedAt,
  isFeatured: questions.isFeatured,
  metaTitle: questions.metaTitle,
  metaDescription: questions.metaDescription,
};

export type PublicQuestion = {
  slug: string;
  title: string;
  body: string;
  displayName: string;
  category: string;
  answer: string;
  answeredAt: Date | null;
  publishedAt: Date | null;
  updatedAt: Date;
  isFeatured: boolean;
  metaTitle: string;
  metaDescription: string;
};

export type PublicQuestionSummary = {
  slug: string;
  title: string;
  category: string;
  publishedAt: Date | null;
  isFeatured: boolean;
  /** The start of the answer as plain text. */
  answerExcerpt: string;
};

export type RelatedLink = { title: string; href: string };

const isPublic = and(eq(questions.status, "published"), isNull(questions.deletedAt));

export const PUBLIC_PAGE_SIZE = 12;

/**
 * The public blog still reads MDX files; articles written in the admin panel are not on
 * the site until phase 3 of the admin task. Until then a related-article link would lead
 * to a 404, so the list stays empty. Turn this on when /blog reads the database.
 */
export const DB_ARTICLES_ARE_PUBLIC = false;

function toSummary(row: { slug: string; title: string; category: string; publishedAt: Date | null; isFeatured: boolean; answer: string }): PublicQuestionSummary {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    publishedAt: row.publishedAt,
    isFeatured: row.isFeatured,
    answerExcerpt: excerpt(markdownToPlain(row.answer), 200),
  };
}

/** Published questions: featured first, then newest. With search and a category. */
export async function listPublishedQuestions(
  db: Db,
  { q = "", category, page = 1, pageSize = PUBLIC_PAGE_SIZE }: { q?: string; category?: string; page?: number; pageSize?: number },
): Promise<{ items: PublicQuestionSummary[]; total: number }> {
  const filters = [isPublic];
  if (category) filters.push(eq(questions.category, category));
  const search = searchFilter(q);
  if (search) filters.push(search);
  const where = and(...filters);

  const rows = db
    .select({
      slug: questions.slug,
      title: questions.title,
      category: questions.category,
      publishedAt: questions.publishedAt,
      isFeatured: questions.isFeatured,
      answer: questions.answer,
    })
    .from(questions)
    .where(where)
    .orderBy(desc(questions.isFeatured), desc(questions.publishedAt), desc(questions.slug))
    .limit(pageSize)
    .offset((Math.max(1, page) - 1) * pageSize)
    .all();
  const total = db.select({ count: sql<number>`count(*)` }).from(questions).where(where).get()?.count ?? 0;
  return { items: rows.map(toSummary), total };
}

export type QuestionPage =
  | {
      kind: "question";
      question: PublicQuestion;
      /** Published articles the admin linked; empty until articles come from the database. */
      relatedArticles: RelatedLink[];
      /** Other published questions of the same category, newest first. */
      sameCategory: PublicQuestionSummary[];
    }
  | { kind: "redirect"; slug: string }
  | { kind: "missing" };

/** One published question by slug, an old slug's redirect, or missing. */
export async function getQuestionPage(db: Db, slug: string): Promise<QuestionPage> {
  const row = db
    .select({ ...PUBLIC_FIELDS, id: questions.id, relatedArticles: questions.relatedArticles })
    .from(questions)
    .where(and(eq(questions.slug, slug), isPublic))
    .get();

  if (!row) {
    const redirect = db
      .select({ slug: questions.slug })
      .from(questionSlugRedirects)
      .innerJoin(questions, eq(questions.id, questionSlugRedirects.questionId))
      .where(and(eq(questionSlugRedirects.fromSlug, slug), isPublic))
      .get();
    return redirect ? { kind: "redirect", slug: redirect.slug } : { kind: "missing" };
  }

  const { id, relatedArticles: relatedIds, ...question } = row;

  const relatedArticles =
    !DB_ARTICLES_ARE_PUBLIC || relatedIds.length === 0
      ? []
      : db
          .select({ id: articles.id, title: articles.title, slug: articles.slug })
          .from(articles)
          .where(and(inArray(articles.id, relatedIds), eq(articles.status, "published")))
          .all()
          // Keep the order the admin chose.
          .sort((a, b) => relatedIds.indexOf(a.id) - relatedIds.indexOf(b.id))
          .map((article) => ({ title: article.title, href: `/blog/${article.slug}` }));

  const sameCategory = db
    .select({
      slug: questions.slug,
      title: questions.title,
      category: questions.category,
      publishedAt: questions.publishedAt,
      isFeatured: questions.isFeatured,
      answer: questions.answer,
    })
    .from(questions)
    .where(and(isPublic, eq(questions.category, question.category), ne(questions.id, id)))
    .orderBy(desc(questions.publishedAt))
    .limit(5)
    .all()
    .map(toSummary);

  return { kind: "question", question, relatedArticles, sameCategory };
}

/** Every published question's address and last change, for the sitemap. */
export async function listPublishedForSitemap(db: Db): Promise<{ slug: string; updatedAt: Date }[]> {
  return db
    .select({ slug: questions.slug, updatedAt: questions.updatedAt })
    .from(questions)
    .where(isPublic)
    .orderBy(desc(questions.publishedAt))
    .all();
}

/** Counts one view of a published question. Returns false for anything else. */
export async function countView(db: Db, slug: string): Promise<boolean> {
  return (
    db
      .update(questions)
      .set({ viewCount: sql`${questions.viewCount} + 1` })
      .where(and(eq(questions.slug, slug), isPublic))
      .run().changes > 0
  );
}
