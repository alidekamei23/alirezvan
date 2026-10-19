// Questions in the database, as the admin and the visitor's form see them: the only file
// besides public.ts that reads or writes the `questions` and `question_slug_redirects`
// tables. Public pages never use this file; they go through public.ts, which selects
// only public fields. Everything is async so callers stay the same if the database later
// becomes one that answers asynchronously (PostgreSQL).
// (Relative imports with extensions: scripts run this file with plain Node.)
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, isNull, ne, sql, type SQL } from "drizzle-orm";
import { isUniqueViolation, type Db } from "../../db/client.ts";
import {
  questionSlugRedirects,
  questions,
  type QuestionStatus,
} from "../../db/schema.ts";
import { isReservedSlug, nextFreeSlug, normalizeSlug } from "../articles/slug.ts";
import {
  buildSearchText,
  canApply,
  nextStatus,
  searchWords,
  trackingStatus,
  type PublicTrackingStatus,
  type QuestionAction,
} from "./core.ts";
import { hashTrackingCode, newTrackingCode } from "./secure.ts";
import type { AskInput, QuestionEditInput } from "./schema.ts";

export type Question = typeof questions.$inferSelect;

/** Route segments under /porsesh that a question slug must not shadow. */
export const QUESTION_RESERVED_SLUGS = ["bepors", "peygiri", "page"];

const notDeleted = isNull(questions.deletedAt);

/** Escapes LIKE wildcards so they match themselves. */
const likeTerm = (word: string) => `%${word.replace(/[\\%_]/g, "\\$&")}%`;

/** AND of every word of the query, over the normalised search text. */
export function searchFilter(query: string): SQL | undefined {
  const words = searchWords(query);
  if (words.length === 0) return undefined;
  return and(...words.map((word) => sql`${questions.searchText} like ${likeTerm(word)} escape '\\'`));
}

/** Whether a slug is used by another question, or kept as an old address of one. */
export async function questionSlugIsTaken(db: Db, slug: string, exceptId?: string): Promise<boolean> {
  if (QUESTION_RESERVED_SLUGS.includes(slug) || isReservedSlug(slug)) return true;
  const used = db
    .select({ id: questions.id })
    .from(questions)
    .where(exceptId ? and(eq(questions.slug, slug), ne(questions.id, exceptId)) : eq(questions.slug, slug))
    .get();
  if (used) return true;
  const redirect = db
    .select({ id: questionSlugRedirects.questionId })
    .from(questionSlugRedirects)
    .where(eq(questionSlugRedirects.fromSlug, slug))
    .get();
  return redirect !== undefined && redirect.id !== exceptId;
}

/**
 * A visitor's question gets a neutral address ("q-1a2b3c4d") until it is first published,
 * because its title may still hold personal details the admin will remove. The real
 * address is made from the edited title on first publication (or on a save before it).
 */
export function placeholderSlug(id: string): string {
  return `q-${id.replace(/-/g, "").slice(0, 8)}`;
}

export function isPlaceholderSlug(slug: string): boolean {
  return /^q-[0-9a-f]{8}$/.test(slug);
}

/** A free slug from a title: «چک-برگشتی-…», with -2, -3… when taken. */
async function freeSlugFor(db: Db, title: string, id: string): Promise<string> {
  const base = normalizeSlug(title) || normalizeSlug(`سؤال-${id.slice(0, 8)}`);
  return nextFreeSlug(base, (candidate) => questionSlugIsTaken(db, candidate, id));
}

// ----------------------------------------------------------------- from a visitor

/**
 * Stores a visitor's question as pending and returns its tracking code. The code is
 * returned once and only its hash is kept.
 */
export async function createVisitorQuestion(
  db: Db,
  input: AskInput,
  context: { ipHash: string | null; now?: Date },
): Promise<{ id: string; trackingCode: string }> {
  const now = context.now ?? new Date();
  const id = randomUUID();
  const slug = placeholderSlug(id);

  // A code collision is practically impossible; retry anyway rather than fail.
  for (let attempt = 0; attempt < 5; attempt++) {
    const trackingCode = newTrackingCode();
    try {
      db.insert(questions)
        .values({
          id,
          slug,
          trackingCodeHash: hashTrackingCode(trackingCode),
          displayName: input.displayName,
          title: input.title,
          body: input.body,
          originalTitle: input.title,
          originalBody: input.body,
          category: input.category,
          status: "pending",
          searchText: buildSearchText({ title: input.title, body: input.body, answer: "" }),
          ipHash: context.ipHash,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      return { id, trackingCode };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new Error("Could not store the question");
}

/** What a tracking code shows: status and title, or null for an unknown or deleted one. */
export async function findByTrackingCode(
  db: Db,
  code: string,
): Promise<{ status: PublicTrackingStatus; title: string; slug: string | null } | null> {
  const row = db
    .select({ status: questions.status, title: questions.title, slug: questions.slug })
    .from(questions)
    .where(and(eq(questions.trackingCodeHash, hashTrackingCode(code)), notDeleted))
    .get();
  if (!row) return null;
  const status = trackingStatus(row.status);
  return { status, title: row.title, slug: status === "published" ? row.slug : null };
}

// --------------------------------------------------------------------- admin list

export type QuestionSummary = Pick<
  Question,
  | "id"
  | "title"
  | "slug"
  | "category"
  | "status"
  | "displayName"
  | "isFeatured"
  | "viewCount"
  | "createdAt"
  | "publishedAt"
>;

export type QuestionListQuery = {
  status?: QuestionStatus;
  category?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export const ADMIN_QUESTIONS_PAGE_SIZE = 20;

export async function listQuestions(
  db: Db,
  { status, category, q = "", page = 1, pageSize = ADMIN_QUESTIONS_PAGE_SIZE }: QuestionListQuery,
): Promise<{ items: QuestionSummary[]; total: number }> {
  const filters = [notDeleted];
  if (status) filters.push(eq(questions.status, status));
  if (category) filters.push(eq(questions.category, category));
  const search = searchFilter(q);
  if (search) filters.push(search);
  const where = and(...filters);

  const items = db
    .select({
      id: questions.id,
      title: questions.title,
      slug: questions.slug,
      category: questions.category,
      status: questions.status,
      displayName: questions.displayName,
      isFeatured: questions.isFeatured,
      viewCount: questions.viewCount,
      createdAt: questions.createdAt,
      publishedAt: questions.publishedAt,
    })
    .from(questions)
    .where(where)
    // Pending ones oldest first (first come, first answered); the rest newest first.
    .orderBy(status === "pending" ? asc(questions.createdAt) : desc(questions.createdAt), asc(questions.id))
    .limit(pageSize)
    .offset((Math.max(1, page) - 1) * pageSize)
    .all();

  const total = db.select({ count: sql<number>`count(*)` }).from(questions).where(where).get()?.count ?? 0;
  return { items, total };
}

/** How many undeleted questions each status has. */
export async function countByStatus(db: Db): Promise<Record<QuestionStatus, number>> {
  const counts: Record<QuestionStatus, number> = {
    pending: 0,
    answered: 0,
    published: 0,
    rejected: 0,
    archived: 0,
  };
  const rows = db
    .select({ status: questions.status, count: sql<number>`count(*)` })
    .from(questions)
    .where(notDeleted)
    .groupBy(questions.status)
    .all();
  for (const row of rows) counts[row.status] = row.count;
  return counts;
}

export async function getQuestionById(db: Db, id: string): Promise<Question | null> {
  return db.select().from(questions).where(and(eq(questions.id, id), notDeleted)).get() ?? null;
}

// ---------------------------------------------------------------- admin actions

export type ApplyResult =
  | { ok: true; question: Question | null; created: boolean }
  | { ok: false; error: "not_found" | "invalid_transition" | "needs_answer" | "slug_taken" };

/**
 * Creates a question by hand (`id` null; "save" or "publish" only) or applies an action
 * to an existing one. Rules:
 * - Only the actions core.ts allows for the current status run; others are refused.
 * - Publishing needs a non-empty answer; a published question cannot lose its answer.
 * - `publishedAt` is set on first publication and kept afterwards.
 * - `answeredAt`/`answeredBy` move when the answer text changes.
 * - When a question that has ever been public changes its slug, the old slug redirects to
 *   it (pointing at the question, so there are no chains).
 * - "delete" only marks the row deleted; it then disappears everywhere.
 */
export async function applyQuestionAction(
  db: Db,
  request: {
    id: string | null;
    action: QuestionAction;
    /** Needed for "save" and "publish". */
    input?: QuestionEditInput;
    /** For "reject": why, kept private. */
    reason?: string;
  },
  context: { username: string; now?: Date },
): Promise<ApplyResult> {
  const { action, input } = request;
  const now = context.now ?? new Date();
  const existing = request.id ? await getQuestionById(db, request.id) : null;
  if (request.id && !existing) return { ok: false, error: "not_found" };

  // A new question can only be saved or published.
  const current: QuestionStatus = existing?.status ?? "pending";
  if (existing ? !canApply(current, action) : action !== "save" && action !== "publish") {
    return { ok: false, error: "invalid_transition" };
  }

  const id = existing?.id ?? randomUUID();
  if (action === "delete") {
    db.update(questions).set({ deletedAt: now, updatedAt: now }).where(eq(questions.id, id)).run();
    return { ok: true, question: null, created: false };
  }

  const editing = action === "save" || action === "publish";
  if (editing && !input) return { ok: false, error: "invalid_transition" };
  const answer = editing ? input!.answer : (existing?.answer ?? "");
  const status = nextStatus(current, action, answer !== "");
  if (status === "published" && answer === "") return { ok: false, error: "needs_answer" };

  const values: Partial<typeof questions.$inferInsert> = { status, updatedAt: now };
  if (action === "publish") values.publishedAt = existing?.publishedAt ?? now;
  if (action === "reject") values.rejectionReason = (request.reason ?? "").trim().slice(0, 1000);

  let slug = existing?.slug ?? "";
  if (editing && input) {
    // A typed slug wins; a published question keeps its address; otherwise (new, or
    // never published with a blank field) it comes from the current, edited title.
    slug =
      input.slug ||
      (existing?.publishedAt || (existing && !isPlaceholderSlug(existing.slug)) ? existing.slug : "") ||
      (await freeSlugFor(db, input.title, id));
    if (await questionSlugIsTaken(db, slug, id)) return { ok: false, error: "slug_taken" };
    Object.assign(values, {
      displayName: input.displayName,
      category: input.category,
      title: input.title,
      body: input.body,
      answer,
      slug,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      isFeatured: input.isFeatured,
      adminNote: input.adminNote,
      relatedArticles: input.relatedArticles,
      searchText: buildSearchText({ title: input.title, body: input.body, answer }),
    });
    if (answer !== "" && answer !== (existing?.answer ?? "")) {
      values.answeredAt = now;
      values.answeredBy = context.username;
    }
  }

  try {
    db.transaction((tx) => {
      if (existing) {
        tx.update(questions).set(values).where(eq(questions.id, id)).run();
        if (existing.slug !== slug && existing.publishedAt) {
          tx.insert(questionSlugRedirects)
            .values({ fromSlug: existing.slug, questionId: id, createdAt: now })
            .onConflictDoUpdate({ target: questionSlugRedirects.fromSlug, set: { questionId: id } })
            .run();
        }
      } else {
        tx.insert(questions)
          .values({
            ...(values as typeof questions.$inferInsert),
            id,
            slug,
            title: input!.title,
            body: input!.body,
            category: input!.category,
            // Added by the admin: the "original" is what the admin typed.
            originalTitle: input!.title,
            originalBody: input!.body,
            createdAt: now,
          })
          .run();
      }
      // The slug is in use now, so it must not also be a redirect.
      tx.delete(questionSlugRedirects).where(eq(questionSlugRedirects.fromSlug, slug)).run();
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "slug_taken" };
    throw error;
  }

  return { ok: true, question: await getQuestionById(db, id), created: !existing };
}

/** Old slugs that redirect to this question. */
export async function listQuestionRedirects(db: Db, questionId: string): Promise<string[]> {
  return db
    .select({ fromSlug: questionSlugRedirects.fromSlug })
    .from(questionSlugRedirects)
    .where(eq(questionSlugRedirects.questionId, questionId))
    .orderBy(asc(questionSlugRedirects.createdAt))
    .all()
    .map((row) => row.fromSlug);
}

