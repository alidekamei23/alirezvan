// Disclosure — one collapsible block with free content (a table, a list), built on
// <details> like Faq, so it works with the keyboard and without JavaScript. For questions
// and answers use Faq. Stack several inside <DisclosureGroup>.
// Usage: <DisclosureGroup><Disclosure title="جدول کامل شاخص‌ها">…</Disclosure></DisclosureGroup>
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function DisclosureGroup({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-line border-y border-line">{children}</div>;
}

export function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-ink transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-primary transition-transform duration-(--duration-base) group-open:rotate-180"
        />
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}
