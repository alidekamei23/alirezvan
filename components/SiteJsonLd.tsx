// SiteJsonLd — the practice, the lawyer and the licensing body described for search
// engines, on every page (siteGraph in lib/schema.ts). Page schemas refer to these
// entities by @id. Mounted once in the layout.
import { JsonLd } from "@/components/JsonLd";
import { siteGraph } from "@/lib/schema";

export function SiteJsonLd() {
  return <JsonLd data={siteGraph()} />;
}
