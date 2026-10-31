import type { MetadataRoute } from "next";
import { TRACK_HREF } from "@/content/questions";
import { ALLOW_INDEXING, absoluteUrl } from "@/lib/seo";

// Never crawled, even on the real domain. Each of these pages also says noindex itself.
export const DISALLOWED_PATHS = ["/admin", "/admin/", "/api/", "/design-system", TRACK_HREF];

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
