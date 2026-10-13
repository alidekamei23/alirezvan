// JsonLd — emits one schema.org block. Relative `item`, `url`, `image` and
// `mainEntityOfPage` values are made absolute with the site URL, as search engines
// require. Usage: <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", … }} />
import { absoluteUrl } from "@/lib/seo";

const URL_KEYS = new Set(["item", "url", "image", "mainEntityOfPage", "@id"]);

function resolve(value: unknown, key?: string): unknown {
  if (typeof value === "string") {
    return key && URL_KEYS.has(key) && value.startsWith("/") ? absoluteUrl(value) : value;
  }
  if (Array.isArray(value)) return value.map((entry) => resolve(entry, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entry]) => [entryKey, resolve(entry, entryKey)]),
    );
  }
  return value;
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(resolve(data)).replace(/</g, "\\u003c"),
      }}
    />
  );
}
