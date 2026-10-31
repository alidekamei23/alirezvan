import { notFound, permanentRedirect } from "next/navigation";
import { BlogIndex } from "@/components/BlogIndex";
import { blogCopy } from "@/content/pages";
import { getPracticeArea, practiceAreas } from "@/content/practice-areas";
import { NO_PARAMS, blogHref, getPostsByArea, isAreaSlug } from "@/lib/blog";
import { toPersianDigits } from "@/lib/format";
import { pageCount, parsePageParam } from "@/lib/pagination";
import { NOT_FOUND_METADATA, pageMetadata } from "@/lib/seo";

type Props = PageProps<"/blog/topic/[area]/page/[page]">;

// Pages 2..N of each topic. Page 1 is /blog/topic/<area>.
export async function generateStaticParams() {
  const params: { area: string; page: string }[] = [];
  for (const area of practiceAreas) {
    const total = pageCount((await getPostsByArea(area.slug)).length);
    for (let page = 2; page <= total; page++) {
      params.push({ area: area.slug, page: String(page) });
    }
  }
  return params.length > 0 ? params : [{ area: practiceAreas[0].slug, page: NO_PARAMS }];
}

export async function generateMetadata({ params }: Props) {
  const { area, page: pageParam } = await params;
  const page = parsePageParam(pageParam);
  if (!isAreaSlug(area) || !page) return NOT_FOUND_METADATA;
  // Past the last page, BlogIndex answers 404; the title must say so too.
  if (page > pageCount((await getPostsByArea(area)).length)) return NOT_FOUND_METADATA;
  const title = getPracticeArea(area).title;
  return pageMetadata({
    title: `${blogCopy.heading}: ${title}، صفحه ${toPersianDigits(page)}`,
    description: `مقاله‌های حقوقی درباره ${title}، نوشته علی رضوان، عضو کانون وکلای دادگستری مرکز.`,
    path: blogHref(area, page),
  });
}

// Fully static: an address that was not prerendered is rendered whole before anything is
// sent, so an unknown one gets a real 404 status. Without this, Next.js first streams the
// prerendered fallback shell with status 200 and the 404 arrives only inside the page.
export const ensureStatic = "navigation";

export default async function BlogTopicPagedPage({ params }: Props) {
  const { area, page: pageParam } = await params;
  if (!isAreaSlug(area)) notFound();
  // Page 1 would duplicate /blog/topic/<area>. next.config.js redirects it first; this is the fallback.
  if (pageParam === "1") permanentRedirect(blogHref(area));
  const page = parsePageParam(pageParam);
  if (!page) notFound();
  return <BlogIndex area={area} page={page} />;
}
