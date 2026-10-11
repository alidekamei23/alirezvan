// Breadcrumbs — where this page sits in the site. The last item is the current page and
// is not a link. Usage:
// <Breadcrumbs items={[{ label: "خانه", href: "/" }, { label: "راهنماها", href: "/guides" }, { label: "عنوان" }]} />
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="مسیر صفحه">
      <ol className="flex flex-wrap items-center text-sm text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex min-h-11 min-w-11 items-center justify-center underline-offset-4 hover:text-primary hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="flex min-h-11 items-center font-semibold text-ink"
                >
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronLeft aria-hidden="true" className="mx-1.5 size-4" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
