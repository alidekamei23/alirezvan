import type { MetadataRoute } from "next";
import { ALLOW_INDEXING, absoluteUrl } from "@/lib/seo";

// Never crawled, even on the real domain: the admin panel and the API, which have nothing
// for search engines. Pages that only need to stay out of results (/porsesh/peygiri,
// /design-system) are not listed: a blocked page is never fetched, so its noindex tag
// would go unseen and the bare address could still be listed. They say noindex instead.
export const DISALLOWED_PATHS = ["/admin", "/admin/", "/api/"];

// Search engines are kept out everywhere until NEXT_PUBLIC_ALLOW_INDEXING is "true"
// (set it only on the real domain, after the lawyer has approved the copy).
export default function robots(): MetadataRoute.Robots {
  if (!ALLOW_INDEXING) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: DISALLOWED_PATHS },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
