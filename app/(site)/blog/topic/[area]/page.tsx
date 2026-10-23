import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/BlogIndex";
import { blogCopy } from "@/content/pages";
import { getPracticeArea, practiceAreas } from "@/content/practice-areas";
import { blogHref, isAreaSlug } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

type Props = PageProps<"/blog/topic/[area]">;

export function generateStaticParams() {
  return practiceAreas.map((area) => ({ area: area.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { area } = await params;
  if (!isAreaSlug(area)) return {};
  const title = getPracticeArea(area).title;
  return pageMetadata({
    title: `${blogCopy.heading}: ${title}`,
    description: `مقاله‌های حقوقی درباره ${title}، نوشته علی رضوان، عضو کانون وکلای دادگستری مرکز.`,
    path: blogHref(area),
  });
}

// The page waits for the URL before rendering, so an unknown address gets a real 404
// status. `instant = false` tells Next.js that blocking here is intended.
export const instant = false;

export default async function BlogTopicPage({ params }: Props) {
  const { area } = await params;
  if (!isAreaSlug(area)) notFound();
  return <BlogIndex area={area} page={1} />;
}
