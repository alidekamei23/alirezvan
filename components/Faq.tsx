// Faq — an accordion of questions and answers built on <details>, so it works with the
// keyboard and without JavaScript, and the answers stay in the HTML for search engines.
// Usage: <Faq items={[{ q: "…", a: "…" }]} schema /> — `schema` also emits FAQPage JSON-LD
// (use it once per page).
import { ChevronDown } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { type FaqEntry, faqPageSchema } from "@/lib/schema";

export type FaqItem = FaqEntry;

export function Faq({ items, schema = false }: { items: FaqItem[]; schema?: boolean }) {
  return (
    <div className="max-w-reading divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-ink transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 text-primary transition-transform duration-(--duration-base) group-open:rotate-180"
            />
          </summary>
          <p className="pb-5 text-ink">{item.a}</p>
        </details>
      ))}
      {schema && <JsonLd data={faqPageSchema(items)} />}
    </div>
  );
}
