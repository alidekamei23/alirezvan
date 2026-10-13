import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/BlogIndex";
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

// The page waits for the URL before rendering, so an unknown address gets a real 404
// status. `instant = false` tells Next.js that blocking here is intended.
export const instant = false;

export default async function BlogPagedPage({ params }: Props) {
  const page = parsePageParam((await params).page);
  if (!page) notFound();
  return <BlogIndex area={null} page={page} />;
}
