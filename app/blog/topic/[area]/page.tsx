import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/BlogIndex";
import { PageFallback } from "@/components/PageFallback";
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
    description: `مقاله‌های حقوقی درباره ${title}، نوشته علی رضوان، وکیل پایه یک دادگستری.`,
    path: blogHref(area),
  });
}

// The content waits for the URL params inside <Suspense>, so navigation to this route
// can show a shell at once (Cache Components). Prebuilt pages are complete HTML.
export default function BlogTopicPage({ params }: Props) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<Props, "params">) {
  const { area } = await params;
  if (!isAreaSlug(area)) notFound();
  return <BlogIndex area={area} page={1} />;
}
