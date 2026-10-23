import { lawyer } from "@/content/lawyer";
import { blogCopy } from "@/content/pages";
import { RSS_HREF, getAllPosts, postHref } from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";

// RSS 2.0 feed of the published posts (status "approved"), newest first.

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** "2026-10-23" → RFC 822 date at the start of that day in Tehran. */
const rfc822 = (isoDate: string) => new Date(`${isoDate}T00:00:00+03:30`).toUTCString();

const imageType = (url: string) =>
  url.endsWith(".webp") ? "image/webp" : url.endsWith(".png") ? "image/png" : "image/jpeg";

export async function GET() {
  const posts = await getAllPosts();
  const items = posts
    .map((post) => {
      const url = absoluteUrl(postHref(post));
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.description)}</description>
      <category>${escapeXml(post.category)}</category>
      <pubDate>${rfc822(post.publishedAt)}</pubDate>
      <enclosure url="${absoluteUrl(post.ogImage.url)}" type="${imageType(post.ogImage.url)}" length="0" />
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(blogCopy.rssTitle)}</title>
    <link>${absoluteUrl("/blog")}</link>
    <description>${escapeXml(blogCopy.metaDescription)}</description>
    <language>fa-IR</language>
    <copyright>${escapeXml(lawyer.name)}</copyright>
    <atom:link href="${absoluteUrl(RSS_HREF)}" rel="self" type="application/rss+xml" />
${posts[0] ? `    <lastBuildDate>${rfc822(posts.map((post) => post.updatedAt).sort().at(-1)!)}</lastBuildDate>\n` : ""}${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
