// Database schema (SQLite, Drizzle ORM). Change it here, then run `npm run db:generate`
// to write a migration into db/migrations and `npm run db:migrate` to apply it.
// Times are stored as integer milliseconds and read as Date objects.
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ARTICLE_STATUSES = ["draft", "published"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export type ArticleFaq = { q: string; a: string };
export type ArticleReference = { title: string; url?: string };

export const articles = sqliteTable(
  "articles",
  {
    /** Random UUID. Never changes, whatever is edited. */
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    /** Public URL part: /blog/<slug>. Unique; the database has the last word. */
    slug: text("slug").notNull().unique(),
    /** One of the practice-area slugs in content/practice-areas.ts (checked with Zod). */
    area: text("area").notNull(),
    /** One or two sentences for cards and the default meta description. */
    excerpt: text("excerpt").notNull(),
    /** Markdown. */
    content: text("content").notNull(),

    /** Public path of the cover image, e.g. "/uploads/<name>.webp". */
    coverImage: text("cover_image"),
    coverImageAlt: text("cover_image_alt").notNull().default(""),
    coverWidth: integer("cover_width"),
    coverHeight: integer("cover_height"),

    faqs: text("faqs", { mode: "json" }).$type<ArticleFaq[]>().notNull().default([]),
    references: text("references", { mode: "json" })
      .$type<ArticleReference[]>()
      .notNull()
      .default([]),

    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),

    status: text("status", { enum: ARTICLE_STATUSES }).notNull().default("draft"),
    /** Set on first publication and kept afterwards. */
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    /**
     * The date shown as «آخرین به‌روزرسانی». Moves on first publication and when the
     * admin ticks "content changed"; a typo fix leaves it alone.
     */
    contentUpdatedAt: integer("content_updated_at", { mode: "timestamp_ms" }),

    /** Private: who confirmed the lawyer's approval at publication, and when. */
    approvedBy: text("approved_by"),
    approvedAt: integer("approved_at", { mode: "timestamp_ms" }),

    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    /** Any save. Admin only; the public date is contentUpdatedAt. */
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("articles_status_content_updated_idx").on(table.status, table.contentUpdatedAt),
    index("articles_status_area_idx").on(table.status, table.area),
    index("articles_created_idx").on(table.createdAt),
    index("articles_updated_idx").on(table.updatedAt),
  ],
);

/** Old slugs of published articles. Each points straight at its article (no chains). */
export const slugRedirects = sqliteTable(
  "slug_redirects",
  {
    fromSlug: text("from_slug").primaryKey(),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("slug_redirects_article_idx").on(table.articleId)],
);

/** Admin sessions. Deleting a row logs that browser out. */
export const sessions = sqliteTable(
  "sessions",
  {
    /** SHA-256 of the random session token; the token itself lives only in the cookie. */
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    /**
     * Short fingerprint of the password hash in force at login. A session whose
     * fingerprint differs from the current one is refused, so a password change ends
     * every open session.
     */
    credentialFingerprint: text("credential_fingerprint").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("sessions_expires_idx").on(table.expiresAt)],
);

/**
 * Events counted by the rate limiter. `scope` names the limit ("login" today; OTP
 * requests later) and `key` is who is limited (an IP address, a phone number).
 */
export const rateLimitEvents = sqliteTable(
  "rate_limit_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    scope: text("scope").notNull(),
    key: text("key").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("rate_limit_scope_key_idx").on(table.scope, table.key, table.createdAt)],
);

// ------------------------------------------------------------------- questions (Q&A)

export const QUESTION_STATUSES = [
  "pending",
  "answered",
  "published",
  "rejected",
  "archived",
] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

/**
 * Legal questions from visitors (or added by the admin) and the lawyer's answers. Only
 * published, undeleted rows are ever shown publicly, and then only through the explicit
 * field list in lib/questions/public.ts.
 */
export const questions = sqliteTable(
  "questions",
  {
    /** Random UUID. Never changes. */
    id: text("id").primaryKey(),
    /** Public URL part: /porsesh/<slug>. Unique; editable by the admin. */
    slug: text("slug").notNull().unique(),
    /**
     * SHA-256 of the visitor's tracking code; the code itself is shown once and never
     * stored. Null for questions the admin added.
     */
    trackingCodeHash: text("tracking_code_hash").unique(),
    /** Optional public name, at most 30 characters; "" shows «کاربر ناشناس». */
    displayName: text("display_name").notNull().default(""),
    /** Edited by the admin before publication (e.g. to remove personal details). */
    title: text("title").notNull(),
    body: text("body").notNull(),
    /** Exactly what the visitor sent. Never changed, never public. */
    originalTitle: text("original_title").notNull(),
    originalBody: text("original_body").notNull(),
    /** A slug from content/question-categories.ts (checked with Zod). */
    category: text("category").notNull(),

    status: text("status", { enum: QUESTION_STATUSES }).notNull().default("pending"),
    /** Markdown, rendered like an article. */
    answer: text("answer").notNull().default(""),
    answeredBy: text("answered_by"),
    answeredAt: integer("answered_at", { mode: "timestamp_ms" }),
    /** Set on first publication and kept afterwards. */
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),

    /** Private: why it was rejected, and notes for the admin. */
    rejectionReason: text("rejection_reason").notNull().default(""),
    adminNote: text("admin_note").notNull().default(""),
    /** Article ids; only published ones are shown. */
    relatedArticles: text("related_articles", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
    viewCount: integer("view_count").notNull().default(0),
    metaTitle: text("meta_title").notNull().default(""),
    metaDescription: text("meta_description").notNull().default(""),
    /** Title, body and answer with ی/ک, digits and half-spaces made uniform, for search. */
    searchText: text("search_text").notNull().default(""),

    /** HMAC of the sender's IP address with IP_HASH_SALT; only for spam limits. */
    ipHash: text("ip_hash"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    /** Soft delete: the row stays, but nothing shows it. */
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("questions_status_idx").on(table.status, table.deletedAt),
    index("questions_published_idx").on(table.publishedAt),
    index("questions_category_idx").on(table.category),
    index("questions_created_idx").on(table.createdAt),
  ],
);

/** Old slugs of published questions. Each points straight at its question (no chains). */
export const questionSlugRedirects = sqliteTable(
  "question_slug_redirects",
  {
    fromSlug: text("from_slug").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("question_slug_redirects_question_idx").on(table.questionId)],
);
