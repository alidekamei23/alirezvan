import { BlogIndex } from "@/components/BlogIndex";
import { blogCopy } from "@/content/pages";
import { RSS_HREF } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

const base = pageMetadata({
  title: blogCopy.heading,
  description: blogCopy.metaDescription,
  path: "/blog",
});

export const metadata = {
  ...base,
  alternates: {
    ...base.alternates,
    types: { "application/rss+xml": [{ url: RSS_HREF, title: blogCopy.rssTitle }] },
  },
};

export default function BlogPage() {
  return <BlogIndex area={null} page={1} />;
}
