import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/BlogIndex";
import { blogCopy } from "@/content/pages";
import { getPracticeArea, practiceAreas } from "@/content/practice-areas";
import { NO_PARAMS, blogHref, getPostsByArea, isAreaSlug } from "@/lib/blog";
import { toPersianDigits } from "@/lib/format";
import { pageCount, parsePageParam } from "@/lib/pagination";
import { pageMetadata } from "@/lib/seo";

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
  if (!isAreaSlug(area) || !page) return {};
  const title = getPracticeArea(area).title;
  return pageMetadata({
    title: `${blogCopy.heading}: ${title}، صفحه ${toPersianDigits(page)}`,
    description: `مقاله‌های حقوقی درباره ${title}، نوشته علی رضوان، عضو کانون وکلای دادگستری مرکز.`,
    path: blogHref(area, page),
  });
}

// The page waits for the URL before rendering, so an unknown address gets a real 404
// status. `instant = false` tells Next.js that blocking here is intended.
export const instant = false;

export default async function BlogTopicPagedPage({ params }: Props) {
  const { area, page: pageParam } = await params;
  const page = parsePageParam(pageParam);
  if (!isAreaSlug(area) || !page) notFound();
  return <BlogIndex area={area} page={page} />;
}
