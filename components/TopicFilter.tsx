// TopicFilter — the row of practice-area links above the blog list: «همه» plus one per
// area. Each is a real page (/blog/topic/<area>), not a client-side filter. On phones
// the row scrolls sideways inside itself; the page never does.
// Usage: <TopicFilter active="check-safte" /> or <TopicFilter active={null} />
import Link from "next/link";
import { practiceAreas, type PracticeAreaSlug } from "@/content/practice-areas";
import { blogHref } from "@/lib/blog";
import { cn } from "@/lib/cn";

export function TopicFilter({ active }: { active: PracticeAreaSlug | null }) {
  const items = [
    { key: "all", label: "همه", href: blogHref(), isActive: active === null },
    ...practiceAreas.map((area) => ({
      key: area.slug,
      label: area.title,
      href: blogHref(area.slug),
      isActive: active === area.slug,
    })),
  ];

  return (
    <nav aria-label="موضوع‌های وبلاگ" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      <ul className="flex w-max gap-2 py-1">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={item.isActive ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors",
                item.isActive
                  ? "border-primary bg-primary text-on-primary"
                  : "border-line-strong bg-surface text-ink hover:border-primary hover:text-primary active:bg-primary-soft",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
