import type { MetadataRoute } from "next";
import { practiceAreas } from "@/content/practice-areas";
import { blogHref, getAllPosts, postHref } from "@/lib/blog";
import { jalaliToGregorianISO } from "@/lib/jalali";
import { absoluteUrl } from "@/lib/seo";

// Fixed pages that exist today. Add a path here when its page is built.
const STATIC_PATHS = [
  "/",
  "/about",
  "/contact",
  "/request",
  "/blog",
  "/tools/khesarat-takhir",
  "/tools/hazine-dadresi",
  "/privacy",
  "/disclaimer",
];

// Blog posts and topic pages are added automatically. Paginated list pages are left out
// on purpose: every post they link to is already listed.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const topicsWithPosts = practiceAreas.filter((area) =>
    posts.some((post) => post.area === area.slug),
  );

  return [
    ...STATIC_PATHS.map((path) => ({ url: absoluteUrl(path) })),
    ...practiceAreas.map((area) => ({ url: absoluteUrl(area.href) })),
    ...topicsWithPosts.map((area) => ({ url: absoluteUrl(blogHref(area.slug)) })),
    ...posts.map((post) => ({
      url: absoluteUrl(postHref(post)),
      lastModified: jalaliToGregorianISO(post.updatedAt) ?? undefined,
    })),
  ];
}
