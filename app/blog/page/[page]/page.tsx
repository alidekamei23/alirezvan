import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/BlogIndex";
import { PageFallback } from "@/components/PageFallback";
import { blogCopy } from "@/content/pages";
import { NO_PARAMS, blogHref, getAllPosts } from "@/lib/blog";
import { toPersianDigits } from "@/lib/format";
import { pageCount, parsePageParam } from "@/lib/pagination";
import { pageMetadata } from "@/lib/seo";

type Props = PageProps<"/blog/page/[page]">;

// Pages 2..N. Page 1 is /blog.
export async function generateStaticParams() {
  const total = pageCount((await getAllPosts()).length);
  const params = Array.from({ length: total - 1 }, (_, i) => ({ page: String(i + 2) }));
  return params.length > 0 ? params : [{ page: NO_PARAMS }];
}

export async function generateMetadata({ params }: Props) {
  const page = parsePageParam((await params).page);
  if (!page) return {};
  return pageMetadata({
    title: `${blogCopy.heading}، صفحه ${toPersianDigits(page)}`,
    description: blogCopy.metaDescription,
    path: blogHref(null, page),
  });
}

// The content waits for the URL params inside <Suspense>, so navigation to this route
// can show a shell at once (Cache Components). Prebuilt pages are complete HTML.
export default function BlogPagedPage({ params }: Props) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<Props, "params">) {
  const page = parsePageParam((await params).page);
  if (!page) notFound();
  return <BlogIndex area={null} page={page} />;
}
