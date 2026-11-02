import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/BlogIndex";
import { blogCopy } from "@/content/pages";
import { getPracticeArea, practiceAreas } from "@/content/practice-areas";
import { blogHref, getPostsByArea, isAreaSlug } from "@/lib/blog";
import { NOINDEX_FOLLOW, NOT_FOUND_METADATA, pageMetadata } from "@/lib/seo";

type Props = PageProps<"/blog/topic/[area]">;

export function generateStaticParams() {
  return practiceAreas.map((area) => ({ area: area.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { area } = await params;
  if (!isAreaSlug(area)) return NOT_FOUND_METADATA;
  const title = getPracticeArea(area).title;
  const metadata = pageMetadata({
    title: `${blogCopy.heading}: ${title}`,
    description: `مقاله‌های حقوقی درباره ${title}، نوشته علی رضوان، عضو کانون وکلای دادگستری مرکز.`,
    path: blogHref(area),
  });
  // A topic with no posts yet shows only an empty state: nothing for search results.
  const hasPosts = (await getPostsByArea(area)).length > 0;
  return hasPosts ? metadata : { ...metadata, robots: NOINDEX_FOLLOW };
}

// Fully static: an address that was not prerendered is rendered whole before anything is
// sent, so an unknown one gets a real 404 status. Without this, Next.js first streams the
// prerendered fallback shell with status 200 and the 404 arrives only inside the page.
export const ensureStatic = "navigation";

export default async function BlogTopicPage({ params }: Props) {
  const { area } = await params;
  if (!isAreaSlug(area)) notFound();
  return <BlogIndex area={area} page={1} />;
}
