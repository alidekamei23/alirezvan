// Articles in the database: the only file that reads or writes the `articles` and
// `slug_redirects` tables. Everything is async so callers stay the same if the database
// later becomes one that answers asynchronously (PostgreSQL).
// (Relative imports with extensions: scripts run this file with plain Node.)
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, ne, sql, type SQL } from "drizzle-orm";
import { isUniqueViolation, type Db } from "../../db/client.ts";
import { articles, slugRedirects, type ArticleStatus } from "../../db/schema.ts";
import { normalizePersian } from "../format.ts";
import { publishProblems, type ArticleInput, type PublishProblem } from "./schema.ts";
import { nextFreeSlug, slugFromTitle } from "./slug.ts";

export type Article = typeof articles.$inferSelect;

/** What the admin list shows; the body and other long fields are left out. */
export type ArticleSummary = Pick<
  Article,
  "id" | "title" | "slug" | "area" | "status" | "createdAt" | "updatedAt" | "publishedAt"
>;

export const ARTICLE_SORTS = ["updated", "created", "published"] as const;
export type ArticleSort = (typeof ARTICLE_SORTS)[number];

export type ArticleListQuery = {
  /** Part of the title. */
  q?: string;
  status?: ArticleStatus;
  sort?: ArticleSort;
  dir?: "asc" | "desc";
  /** 1-based. */
  page?: number;
  pageSize?: number;
};

export const ADMIN_PAGE_SIZE = 20;

export async function listArticles(
  db: Db,
  { q, status, sort = "updated", dir = "desc", page = 1, pageSize = ADMIN_PAGE_SIZE }: ArticleListQuery,
): Promise<{ items: ArticleSummary[]; total: number }> {
  const filters: SQL[] = [];
  if (status) filters.push(eq(articles.status, status));
  const term = q ? normalizePersian(q.normalize("NFC")).trim() : "";
  if (term) {
    // % and _ are wildcards in LIKE; escape them so they match themselves.
    const pattern = `%${term.replace(/[\\%_]/g, "\\$&")}%`;
    filters.push(sql`${articles.title} like ${pattern} escape '\\'`);
  }
  const where = filters.length > 0 ? and(...filters) : undefined;

  const column = {
    updated: articles.updatedAt,
    created: articles.createdAt,
    published: articles.publishedAt,
  }[sort];
  const order = dir === "asc" ? asc(column) : desc(column);

  const items = db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      area: articles.area,
      status: articles.status,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(where)
    // Never-published articles go last when sorting by publication date.
    .orderBy(sql`${column} is null`, order, asc(articles.id))
    .limit(pageSize)
    .offset((Math.max(1, page) - 1) * pageSize)
    .all();

  const total =
    db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(where)
      .get()?.count ?? 0;

  return { items, total };
}

export async function getArticleById(db: Db, id: string): Promise<Article | null> {
  return db.select().from(articles).where(eq(articles.id, id)).get() ?? null;
}

export type SaveAction = "save" | "publish" | "unpublish";

export type SaveResult =
  | { ok: true; article: Article; created: boolean }
  | { ok: false; error: "not_found" }
  | { ok: false; error: "slug_taken" }
  | { ok: false; error: "publish_problems"; problems: PublishProblem[] };

/**
 * Creates an article (`id` null) or updates one.
 *
 * - `save` keeps the status (a new article is a draft); `publish` and `unpublish` set it.
 * - An article that is or becomes published must pass publishProblems().
 * - `publishedAt` is set on first publication and never changed afterwards, also not by
 *   unpublishing and publishing again.
 * - `contentUpdatedAt` (the public date) moves on first publication and when
 *   `input.contentChanged` is set on a published article.
 * - When an article that has ever been public changes its slug, the old slug is kept in
 *   slug_redirects. Redirects point at the article, not at another slug, so there are
 *   no chains; a redirect whose slug is taken into use again is removed.
 */
export async function saveArticle(
  db: Db,
  request: { id: string | null; input: ArticleInput; action: SaveAction },
  context: { username: string; now?: Date },
): Promise<SaveResult> {
  const { input, action } = request;
  const now = context.now ?? new Date();

  const existing = request.id ? await getArticleById(db, request.id) : null;
  if (request.id && !existing) return { ok: false, error: "not_found" };

  const status: ArticleStatus =
    action === "publish" ? "published" : action === "unpublish" ? "draft" : (existing?.status ?? "draft");

  if (status === "published") {
    const problems = publishProblems(input);
    if (problems.length > 0) return { ok: false, error: "publish_problems", problems };
  }

  const id = existing?.id ?? randomUUID();
  let slug = input.slug;
  if (slug === "") {
    // No slug typed: keep the current one, or make one from the title for a new article.
    slug =
      existing?.slug ??
      (await nextFreeSlug(slugFromTitle(input.title, id.slice(0, 8)), (candidate) =>
        slugIsTaken(db, candidate, id),
      ));
  }

  const firstPublication = status === "published" && !existing?.publishedAt;
  const moveContentDate =
    status === "published" &&
    (firstPublication || input.contentChanged || !existing?.contentUpdatedAt);

  const values = {
    title: input.title,
    slug,
    area: input.area,
    excerpt: input.excerpt,
    content: input.content,
    coverImage: input.coverImage,
    coverImageAlt: input.coverImageAlt,
    coverWidth: input.coverWidth,
    coverHeight: input.coverHeight,
    faqs: input.faqs,
    references: input.references,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    status,
    publishedAt: existing?.publishedAt ?? (status === "published" ? now : null),
    contentUpdatedAt: moveContentDate ? now : (existing?.contentUpdatedAt ?? null),
    // Recorded whenever the article is saved as published; kept when it is unpublished.
    approvedBy: status === "published" ? context.username : (existing?.approvedBy ?? null),
    approvedAt: status === "published" ? now : (existing?.approvedAt ?? null),
    updatedAt: now,
  };

  try {
    db.transaction((tx) => {
      if (existing) {
        tx.update(articles).set(values).where(eq(articles.id, id)).run();
        if (existing.slug !== slug && existing.publishedAt) {
          tx.insert(slugRedirects)
            .values({ fromSlug: existing.slug, articleId: id, createdAt: now })
            .onConflictDoUpdate({ target: slugRedirects.fromSlug, set: { articleId: id } })
            .run();
        }
      } else {
        tx.insert(articles).values({ ...values, id, createdAt: now }).run();
      }
      // The slug is in use by an article now, so it must not also be a redirect.
      tx.delete(slugRedirects).where(eq(slugRedirects.fromSlug, slug)).run();
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "slug_taken" };
    throw error;
  }

  const article = await getArticleById(db, id);
  if (!article) return { ok: false, error: "not_found" };
  return { ok: true, article, created: !existing };
}

/** Deletes an article and its redirects. Returns false when it did not exist. */
export async function deleteArticle(db: Db, id: string): Promise<boolean> {
  return db.delete(articles).where(eq(articles.id, id)).run().changes > 0;
}

/** Whether another article already uses this slug. */
export async function slugIsTaken(db: Db, slug: string, exceptId?: string): Promise<boolean> {
  const row = db
    .select({ id: articles.id })
    .from(articles)
    .where(exceptId ? and(eq(articles.slug, slug), ne(articles.id, exceptId)) : eq(articles.slug, slug))
    .get();
  return row !== undefined;
}

/** Old slugs that redirect to this article. */
export async function listRedirectsTo(db: Db, articleId: string): Promise<string[]> {
  return db
    .select({ fromSlug: slugRedirects.fromSlug })
    .from(slugRedirects)
    .where(eq(slugRedirects.articleId, articleId))
    .orderBy(asc(slugRedirects.createdAt))
    .all()
    .map((row) => row.fromSlug);
}

/**
 * File names under /uploads/ that some article still uses, as its cover or inside its
 * text. Anything else in the upload folder is abandoned.
 */
export async function referencedUploads(db: Db): Promise<Set<string>> {
  const names = new Set<string>();
  const rows = db
    .select({ coverImage: articles.coverImage, content: articles.content })
    .from(articles)
    .all();
  for (const row of rows) {
    for (const text of [row.coverImage ?? "", row.content]) {
      for (const match of text.matchAll(/\/uploads\/([a-f0-9]{32}\.webp)/g)) names.add(match[1]);
    }
  }
  return names;
}
