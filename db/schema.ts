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
