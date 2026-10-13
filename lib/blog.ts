import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { ComponentType } from "react";
import { cache } from "react";
import { z } from "zod";
import { practiceAreas, type PracticeAreaSlug } from "@/content/practice-areas";
import { toPersianDigits } from "@/lib/format";
import { parseJalali } from "@/lib/jalali";

/*
 * Blog posts are MDX files in content/blog. Each file exports `meta` (validated here)
 * and its body is the default export. File names are Latin; the public URL uses the
 * Persian `slug` from meta. Files starting with "_" are fixtures, never posts.
 */

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const SAMPLE_FILE = "_sample";
const AREA_SLUGS = practiceAreas.map((area) => area.slug) as [
  PracticeAreaSlug,
  ...PracticeAreaSlug[],
];

/**
 * Placeholder route param for builds with nothing to prerender. Cache Components needs
 * generateStaticParams to return at least one entry; pages answer 404 for this value.
 */
export const NO_PARAMS = "__none__";

/** Route segments under /blog that a post slug must not shadow. */
const RESERVED_SLUGS = ["page", "topic"];

export const postMetaSchema = z.object({
  title: z.string().min(5),
  /** Persian, words joined by hyphens; becomes /blog/<slug>. */
  slug: z
    .string()
    .regex(/^[^\s/?#%]+$/, "slug must not contain spaces, slashes or ?, #, %")
    .refine((value) => !RESERVED_SLUGS.includes(value), "slug is reserved"),
  area: z.enum(AREA_SLUGS),
  /** One or two sentences for cards and the meta description. */
  summary: z.string().min(20).max(220),
  /** Jalali "YYYY-MM-DD", Latin digits. Shown as «آخرین به‌روزرسانی». */
  updatedAt: z.string().refine((value) => parseJalali(value) !== null, {
    message: "updatedAt must be a real Jalali date like 1405-07-21",
  }),
  cover: z.object({
    /** Path under /public, e.g. "/images/blog/check-bargashti.webp". */
    src: z.string().startsWith("/images/blog/"),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    alt: z.string().min(3),
  }),
  faqs: z.array(z.object({ q: z.string().min(5), a: z.string().min(5) })).default([]),
  /** Laws and other sources cited in the post. */
  references: z
    .array(z.object({ title: z.string().min(3), url: z.url().optional() }))
    .default([]),
  /** Hidden in production; visible in development. */
  draft: z.boolean().default(false),
});

export type PostMeta = z.infer<typeof postMetaSchema>;
export type Post = PostMeta & {
  /** MDX file name without extension. */
  file: string;
  readingMinutes: number;
};

const WORDS_PER_MINUTE = 200;

function readingMinutes(source: string): number {
  const body = source.replace(/export const meta = \{[\s\S]*?\n\};?\s*\n/, "");
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

async function loadFile(file: string): Promise<Post> {
  const postModule = await import(`@/content/blog/${file}.mdx`);
  const source = readFileSync(path.join(BLOG_DIR, `${file}.mdx`), "utf8");
  const parsed = postMetaSchema.safeParse(postModule.meta);
  if (!parsed.success) {
    throw new Error(
      `content/blog/${file}.mdx has invalid meta:\n${z.prettifyError(parsed.error)}`,
    );
  }
  return { ...parsed.data, file, readingMinutes: readingMinutes(source) };
}

/**
 * Development only: numbered copies of content/blog/_sample.mdx, spread unevenly over
 * the practice areas, so the listing, topic pages and pagination can be seen before
 * real posts exist. Never part of a production build.
 */
async function samplePosts(): Promise<Post[]> {
  const sample = await loadFile(SAMPLE_FILE);
  // 12 + 6 + 5 + 3 = 26 posts: three pages overall, two pages for the first area.
  const perArea = [12, 6, 5, 3];
  const posts: Post[] = [];
  let n = 0;
  AREA_SLUGS.forEach((area, areaIndex) => {
    for (let i = 0; i < perArea[areaIndex]; i++) {
      n++;
      const day = String(28 - (n % 27)).padStart(2, "0");
      const month = String(7 - (n % 6)).padStart(2, "0");
      posts.push({
        ...sample,
        title: `${sample.title} ${toPersianDigits(n)}`,
        slug: `${sample.slug}-${n}`,
        area,
        updatedAt: `1405-${month}-${day}`,
        cover: { ...sample.cover, src: `/images/blog/sample-${(n % 4) + 1}.webp` },
      });
    }
  });
  return posts;
}

/** Every visible post, newest first. */
export const getAllPosts = cache(async (): Promise<Post[]> => {
  const isProduction = process.env.NODE_ENV === "production";
  const files = readdirSync(BLOG_DIR)
    .filter((name) => name.endsWith(".mdx") && !name.startsWith("_"))
    .map((name) => name.slice(0, -".mdx".length));


  const posts = (await Promise.all(files.map(loadFile))).filter(
    (post) => !(isProduction && post.draft),
  );
  if (!isProduction) posts.push(...(await samplePosts()));

  const seen = new Set<string>();
  for (const post of posts) {
    if (seen.has(post.slug)) throw new Error(`Duplicate blog slug: ${post.slug}`);
    seen.add(post.slug);
  }

  return posts.sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.slug.localeCompare(b.slug),
  );
});

export async function getPostsByArea(area: PracticeAreaSlug): Promise<Post[]> {
  return (await getAllPosts()).filter((post) => post.area === area);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return (await getAllPosts()).find((post) => post.slug === slug) ?? null;
}

/** The post body as a component. */
export async function getPostBody(post: Post): Promise<ComponentType> {
  const postModule = await import(`@/content/blog/${post.file}.mdx`);
  return postModule.default;
}

/** Other posts from the same area, newest first. */
export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  return (await getPostsByArea(post.area))
    .filter((other) => other.slug !== post.slug)
    .slice(0, limit);
}

export function isAreaSlug(value: string): value is PracticeAreaSlug {
  return (AREA_SLUGS as string[]).includes(value);
}

export function postHref(post: Pick<Post, "slug">): string {
  return `/blog/${post.slug}`;
}

/** Listing URL for a topic (or all posts) and a page number. */
export function blogHref(area?: PracticeAreaSlug | null, page = 1): string {
  const base = area ? `/blog/topic/${area}` : "/blog";
  return page > 1 ? `${base}/page/${page}` : base;
}

/** Route params arrive percent-encoded for Persian slugs on some paths; normalise. */
export function decodeSlug(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
