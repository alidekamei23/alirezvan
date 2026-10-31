import { notFound, permanentRedirect } from "next/navigation";
import { BlogIndex } from "@/components/BlogIndex";
import { blogCopy } from "@/content/pages";
import { NO_PARAMS, blogHref, getAllPosts } from "@/lib/blog";
import { toPersianDigits } from "@/lib/format";
import { pageCount, parsePageParam } from "@/lib/pagination";
import { NOT_FOUND_METADATA, pageMetadata } from "@/lib/seo";

type Props = PageProps<"/blog/page/[page]">;

// Pages 2..N. Page 1 is /blog.
export async function generateStaticParams() {
  const total = pageCount((await getAllPosts()).length);
  const params = Array.from({ length: total - 1 }, (_, i) => ({ page: String(i + 2) }));
  return params.length > 0 ? params : [{ page: NO_PARAMS }];
}

export async function generateMetadata({ params }: Props) {
  const page = parsePageParam((await params).page);
  // Past the last page, BlogIndex answers 404; the title must say so too.
  if (!page || page > pageCount((await getAllPosts()).length)) return NOT_FOUND_METADATA;
  return pageMetadata({
    title: `${blogCopy.heading}، صفحه ${toPersianDigits(page)}`,
    description: blogCopy.metaDescription,
    path: blogHref(null, page),
  });
}

// Fully static: an address that was not prerendered is rendered whole before anything is
// sent, so an unknown one gets a real 404 status. Without this, Next.js first streams the
// prerendered fallback shell with status 200 and the 404 arrives only inside the page.
export const ensureStatic = "navigation";

export default async function BlogPagedPage({ params }: Props) {
  const { page: pageParam } = await params;
  // /blog/page/1 would duplicate /blog. next.config.js redirects it first; this is the fallback.
  if (pageParam === "1") permanentRedirect(blogHref(null));
  const page = parsePageParam(pageParam);
  if (!page) notFound();
  return <BlogIndex area={null} page={page} />;
}
