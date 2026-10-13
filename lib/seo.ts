import type { Metadata } from "next";
import { lawyer } from "@/content/lawyer";

/** Public origin, without a trailing slash. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

/** "/blog" → "https://example.ir/blog". */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

/**
 * Metadata for one page: title, description, canonical URL and Open Graph.
 * `path` starts with "/" and is resolved against `metadataBase` from the root layout.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: lawyer.name,
      locale: "fa_IR",
      type: "website",
    },
  };
}
