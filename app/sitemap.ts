import type { MetadataRoute } from "next";
import { practiceAreas } from "@/content/practice-areas";
import { QUESTIONS_HREF } from "@/content/questions";
import { TOOLS_INDEX_HREF, toolList } from "@/content/tools";
import { blogHref, getAllPosts, postHref } from "@/lib/blog";
import { cachedQuestionSitemap } from "@/lib/questions/cached";
import { questionHref } from "@/lib/questions/view";
import { absoluteUrl } from "@/lib/seo";

// Fixed pages that exist today. Add a path here when its page is built.
const STATIC_PATHS = [
  "/",
  "/about",
  "/contact",
  "/request",
  "/blog",
  QUESTIONS_HREF,
  TOOLS_INDEX_HREF,
  ...toolList.map((tool) => tool.href),
  "/privacy",
  "/disclaimer",
];

// Published blog posts (status "approved"), topic pages and published questions are added automatically. Paginated list pages are left out
// on purpose: every post they link to is already listed.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, questions] = await Promise.all([getAllPosts(), cachedQuestionSitemap()]);
  const topicsWithPosts = practiceAreas.filter((area) =>
    posts.some((post) => post.area === area.slug),
  );

  return [
    ...STATIC_PATHS.map((path) => ({ url: absoluteUrl(path) })),
    ...practiceAreas.map((area) => ({ url: absoluteUrl(area.href) })),
    ...topicsWithPosts.map((area) => ({ url: absoluteUrl(blogHref(area.slug)) })),
    ...posts.map((post) => ({
      url: absoluteUrl(postHref(post)),
      lastModified: post.updatedAt,
    })),
    ...questions.map((question) => ({
      url: absoluteUrl(encodeURI(questionHref(question.slug))),
      lastModified: new Date(question.updatedAt).toISOString(),
    })),
  ];
}
