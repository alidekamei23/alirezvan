import { BlogIndex } from "@/components/BlogIndex";
import { blogCopy } from "@/content/pages";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: blogCopy.heading,
  description: blogCopy.metaDescription,
  path: "/blog",
});

export default function BlogPage() {
  return <BlogIndex area={null} page={1} />;
}
