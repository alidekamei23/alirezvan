import type { Metadata } from "next";
import { lawyer } from "@/content/lawyer";

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
