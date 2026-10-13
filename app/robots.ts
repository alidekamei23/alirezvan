import type { MetadataRoute } from "next";
import { ALLOW_INDEXING, absoluteUrl } from "@/lib/seo";

// Search engines are kept out everywhere until NEXT_PUBLIC_ALLOW_INDEXING is "true"
// (set it only on the real domain, after the lawyer has approved the copy).
export default function robots(): MetadataRoute.Robots {
  if (!ALLOW_INDEXING) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/design-system"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
