import type { Metadata } from "next";
import { lawyer } from "@/content/lawyer";

/** Public origin, without a trailing slash. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

/**
 * Whether search engines may index this deployment. Off unless explicitly turned on, so a
 * preview or test deployment can never be indexed by accident.
 */
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

/** "/blog" → "https://example.ir/blog". */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

/** Link-preview image used by every page that has no image of its own (1200×630). */
export const DEFAULT_OG_IMAGE = {
  url: "/images/og.png",
  width: 1200,
  height: 630,
  alt: `${lawyer.name}، ${lawyer.grade}`,
};

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
      images: [DEFAULT_OG_IMAGE],
    },
  };
}
