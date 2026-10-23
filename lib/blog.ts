import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { cache } from "react";
import yaml from "js-yaml";
import { z } from "zod";
import { practiceAreas, type PracticeAreaSlug } from "@/content/practice-areas";
import { gregorianISOToJalali } from "@/lib/jalali";

/*
 * Blog posts are Markdown files in content/blog, one per post, named <slug>.md. Each
 * starts with YAML frontmatter (validated here, format in docs/blog.md) followed by the
 * Markdown body, which components/ArticleBody.tsx renders.
 *
 * Only posts with status "approved" are public: they appear in lists, related posts,
 * the sitemap and the RSS feed. Any other status answers 404, except in development,
 * where the post page opens with a «پیش‌نویس — منتشر نشده» banner.
 */

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const AREA_SLUGS = practiceAreas.map((area) => area.slug) as [
  PracticeAreaSlug,
  ...PracticeAreaSlug[],
];

/** The `category` written in a post → the practice area it is listed under. */
export const CATEGORY_AREAS = {
  "چک": "check-safte",
  "ملک": "melki-ejare",
  "اجاره": "melki-ejare",
  "مطالبه طلب": "motalebe",
  "قرارداد": "gharardad",
} as const satisfies Record<string, PracticeAreaSlug>;
const CATEGORIES = Object.keys(CATEGORY_AREAS) as [
  keyof typeof CATEGORY_AREAS,
  ...(keyof typeof CATEGORY_AREAS)[],
];

/**
 * Placeholder route param for builds with nothing to prerender. Cache Components needs
 * generateStaticParams to return at least one entry; pages answer 404 for this value.
 */
export const NO_PARAMS = "__none__";

/** Route segments under /blog that a post slug must not shadow. */
const RESERVED_SLUGS = ["page", "topic"];

/** Used when a post has no cover of its own: the site's branded link-preview image. */
export const DEFAULT_COVER = { src: "/images/og.png", width: 1200, height: 630 };

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug: lowercase English words joined by hyphens")
  .refine((value) => !RESERVED_SLUGS.includes(value), "slug is reserved");

const isoDate = z
  .string()
  .refine((value) => gregorianISOToJalali(value) !== null, "use a real date like 2026-10-23");

export const POST_STATUSES = ["draft", "in-review", "approved"] as const;

export const postMetaSchema = z.object({
  title: z.string().min(5),
  /** <title> of the page; the title is used when it is empty. */
  seoTitle: z.string().default(""),
  /** Meta description, also the lead under the title and the text on cards. */
  description: z.string().min(20).max(220),
  /** English, words joined by hyphens; becomes /blog/<slug>. Never change it. */
  slug: slugSchema,
  keyword: z.string().min(2),
  secondaryKeywords: z.array(z.string()).default([]),
  category: z.enum(CATEGORIES),
  /** Topic cluster; posts of one cluster are related to each other. */
  cluster: z.string().min(2),
  type: z.enum(["pillar", "cluster"]),
  /** For a cluster post: the slug of its pillar post, or "" when there is none. */
  pillar: z.union([slugSchema, z.literal("")]).default(""),
  /** Free note about the article's structure. Not shown. */
  structure: z.string().optional(),
  relatedSlugs: z.array(slugSchema).default([]),
  publishedAt: isoDate,
  updatedAt: isoDate,
  status: z.enum(POST_STATUSES),
  cover: z
    .object({
      /** Path under /public, e.g. "/images/blog/new-cheque-rules.webp". */
      src: z.string().startsWith("/images/blog/"),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      alt: z.string().min(3),
    })
    .optional(),
  faq: z
    .array(z.object({ question: z.string().min(5), answer: z.string().min(5) }))
    .default([]),
  /** Laws and other sources cited in the post. */
  references: z
    .array(z.object({ title: z.string().min(3), url: z.url().optional() }))
    .default([]),
});

export type PostMeta = z.infer<typeof postMetaSchema>;
export type Post = Omit<PostMeta, "cover"> & {
  area: PracticeAreaSlug;
  cover: { src: string; width: number; height: number; alt: string; isDefault: boolean };
  /** 1200×630 image for Open Graph and Twitter cards. */
  ogImage: { url: string; width: number; height: number };
  /** `updatedAt` as a Jalali "YYYY-MM-DD", for display. */
  updatedJalali: string;
  /** Markdown without the closing disclaimer. */
  body: string;
  /** The closing «سلب مسئولیت» paragraph, rendered after the FAQ. */
  disclaimer: string;
  readingMinutes: number;
};

const WORDS_PER_MINUTE = 200;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Splits off the disclaimer at the end of a post (the last paragraph that says the text
 * is not legal advice, with the rule line before it, if any), so the FAQ can go between
 * the body and the disclaimer.
 */
export function splitDisclaimer(markdown: string): { body: string; disclaimer: string } {
  const blocks = markdown.trimEnd().split(/\n{2,}/);
  const last = blocks.at(-1) ?? "";
  if (!/سلب مسئولیت|مشاوره‌ی? حقوقی محسوب نمی‌شود/.test(last)) {
    return { body: markdown.trimEnd(), disclaimer: "" };
  }
  let cut = blocks.length - 1;
  if (blocks[cut - 1]?.trim() === "---") cut--;
  return { body: blocks.slice(0, cut).join("\n\n"), disclaimer: last };
}

export function parsePost(source: string, file: string): Post {
  const match = FRONTMATTER.exec(source);
  if (!match) throw new Error(`content/blog/${file} has no frontmatter`);
  const parsed = postMetaSchema.safeParse(yaml.load(match[1]));
  if (!parsed.success) {
    throw new Error(`content/blog/${file} has invalid frontmatter:\n${z.prettifyError(parsed.error)}`);
  }
  const meta = parsed.data;
  if (file !== `${meta.slug}.md`) {
    throw new Error(`content/blog/${file}: the file name must be ${meta.slug}.md`);
  }

  const { body, disclaimer } = splitDisclaimer(source.slice(match[0].length).replace(/\r\n/g, "\n"));
  const cover = meta.cover
    ? { ...meta.cover, isDefault: false }
    : { ...DEFAULT_COVER, alt: meta.title, isDefault: true };
  const ogFile = `/images/blog/og/${meta.slug}.jpg`;
  const ogImage = existsSync(path.join(PUBLIC_DIR, ogFile))
    ? { url: ogFile, width: 1200, height: 630 }
    : { url: cover.src, width: cover.width, height: cover.height };

  return {
    ...meta,
    area: CATEGORY_AREAS[meta.category],
    cover,
    ogImage,
    updatedJalali: gregorianISOToJalali(meta.updatedAt) ?? "",
    body,
    disclaimer,
    readingMinutes: Math.max(
      1,
      Math.round(body.split(/\s+/).filter(Boolean).length / WORDS_PER_MINUTE),
    ),
  };
}

export function isPublished(post: Pick<Post, "status">): boolean {
  return post.status === "approved";
}

/** Whether unpublished posts may be opened (development only). */
export const SHOW_DRAFTS = process.env.NODE_ENV === "development";

/** Every post file, whatever its status. */
const loadAllPosts = cache(async (): Promise<Post[]> => {
  const files = readdirSync(BLOG_DIR).filter((name) => name.endsWith(".md"));
  const posts = files.map((file) => parsePost(readFileSync(path.join(BLOG_DIR, file), "utf8"), file));

  const seen = new Set<string>();
  for (const post of posts) {
    if (seen.has(post.slug)) throw new Error(`Duplicate blog slug: ${post.slug}`);
    seen.add(post.slug);
  }
  return posts;
});

/** Published posts, newest first. Lists, related posts, the sitemap and RSS use these. */
export const getAllPosts = cache(async (): Promise<Post[]> => {
  return (await loadAllPosts())
    .filter(isPublished)
    .sort(
      (a, b) =>
        b.updatedAt.localeCompare(a.updatedAt) ||
        b.publishedAt.localeCompare(a.publishedAt) ||
        Number(b.type === "pillar") - Number(a.type === "pillar") ||
        a.slug.localeCompare(b.slug),
    );
});

export async function getPostsByArea(area: PracticeAreaSlug): Promise<Post[]> {
  return (await getAllPosts()).filter((post) => post.area === area);
}

/** A published post; in development also an unpublished one. */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const post = (await loadAllPosts()).find((item) => item.slug === slug) ?? null;
  if (!post) return null;
  return isPublished(post) || SHOW_DRAFTS ? post : null;
}

/** Slugs whose page opens: links to any other /blog/<slug> are shown as plain text. */
export async function getLinkableSlugs(): Promise<Set<string>> {
  const posts = SHOW_DRAFTS ? await loadAllPosts() : await getAllPosts();
  return new Set(posts.map((post) => post.slug));
}

/**
 * Related posts: first the post's relatedSlugs, then its pillar, then posts of the same
 * cluster, then other posts of the same practice area. Published posts only.
 */
export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const all = (await getAllPosts()).filter((other) => other.slug !== post.slug);
  const bySlug = new Map(all.map((other) => [other.slug, other]));
  const ordered = [
    ...post.relatedSlugs.map((slug) => bySlug.get(slug)),
    post.type === "cluster" && post.pillar ? bySlug.get(post.pillar) : undefined,
    ...all.filter((other) => other.cluster === post.cluster),
    ...all.filter((other) => other.area === post.area),
  ];
  const result: Post[] = [];
  for (const item of ordered) {
    if (item && !result.includes(item)) result.push(item);
    if (result.length === limit) break;
  }
  return result;
}

export function isAreaSlug(value: string): value is PracticeAreaSlug {
  return (AREA_SLUGS as string[]).includes(value);
}

export function postHref(post: Pick<Post, "slug">): string {
  return `/blog/${post.slug}`;
}

export const RSS_HREF = "/blog/rss.xml";

/** Listing URL for a topic (or all posts) and a page number. */
export function blogHref(area?: PracticeAreaSlug | null, page = 1): string {
  const base = area ? `/blog/topic/${area}` : "/blog";
  return page > 1 ? `${base}/page/${page}` : base;
}

/** Route params may arrive percent-encoded; normalise. */
export function decodeSlug(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
