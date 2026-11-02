import type { MetadataRoute } from "next";
import { practiceAreas } from "@/content/practice-areas";
import { QUESTIONS_HREF } from "@/content/questions";
import { TOOLS_INDEX_HREF, toolList } from "@/content/tools";
import { type Post, blogHref, getAllPosts, postHref } from "@/lib/blog";
import { cachedQuestionSitemap } from "@/lib/questions/cached";
import { questionHref } from "@/lib/questions/view";
import { absoluteUrl } from "@/lib/seo";

// Fixed pages that exist today. Add a path here when its page is built. They carry no
// lastModified: their copy has no date of its own, and a made-up one (the build time)
// would teach search engines to ignore the field.
const STATIC_PATHS = [
  "/about",
  "/contact",
  "/request",
  TOOLS_INDEX_HREF,
  ...toolList.map((tool) => tool.href),
  "/privacy",
  "/disclaimer",
];

/** The newest `updatedAt` among these posts, or nothing when there are none. */
function latest(posts: readonly Post[]): string | undefined {
  return posts.reduce<string | undefined>(
    (newest, post) => (!newest || post.updatedAt > newest ? post.updatedAt : newest),
    undefined,
  );
}

// Published blog posts (status "approved"), topic pages and published questions are added
// automatically. Paginated list pages are left out on purpose: every post they link to is
// already listed. Home, the blog, the hubs and the topic pages list the latest posts, so
// they change when a post does: their lastModified is that of their newest post.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, questions] = await Promise.all([getAllPosts(), cachedQuestionSitemap()]);
  const areaPosts = (slug: string) => posts.filter((post) => post.area === slug);
  const questionsUpdated = questions.reduce<number | undefined>(
    (newest, question) => Math.max(newest ?? 0, new Date(question.updatedAt).getTime()),
    undefined,
  );

  return [
    { url: absoluteUrl("/"), lastModified: latest(posts) },
    { url: absoluteUrl("/blog"), lastModified: latest(posts) },
    {
      url: absoluteUrl(QUESTIONS_HREF),
      lastModified: questionsUpdated ? new Date(questionsUpdated).toISOString() : undefined,
    },
    ...STATIC_PATHS.map((path) => ({ url: absoluteUrl(path) })),
    ...practiceAreas.map((area) => ({
      url: absoluteUrl(area.href),
      lastModified: latest(areaPosts(area.slug)),
    })),
    ...practiceAreas
      .filter((area) => areaPosts(area.slug).length > 0)
      .map((area) => ({
        url: absoluteUrl(blogHref(area.slug)),
        lastModified: latest(areaPosts(area.slug)),
      })),
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
