import Link from "next/link";
import { Menu, Phone } from "lucide-react";
import { contactLinks, lawyer } from "@/content/lawyer";
import { practiceNav, siteNav, toolsNav } from "@/content/navigation";
import { toPersianDigits } from "@/lib/format";

const desktopNav = [...practiceNav, ...siteNav];
const mobileNav = [...practiceNav, ...toolsNav, ...siteNav];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex min-h-11 flex-col justify-center">
          <span className="text-lg font-bold leading-tight text-ink">
            {lawyer.name}
          </span>
          <span className="text-xs text-muted">{lawyer.grade}</span>
        </Link>

        <nav aria-label="ناوبری اصلی" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {desktopNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-ink hover:bg-surface-alt hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={contactLinks.call}
          className="hidden min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-strong lg:flex"
        >
          <Phone aria-hidden="true" className="size-4" />
          <span dir="ltr">{toPersianDigits(lawyer.phone.display)}</span>
        </a>

        <details className="group lg:hidden">
          <summary
            aria-label="فهرست"
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-md text-ink hover:bg-surface-alt [&::-webkit-details-marker]:hidden"
          >
            <Menu aria-hidden="true" className="size-6" />
          </summary>
          <nav
            aria-label="ناوبری موبایل"
            className="absolute inset-x-0 top-full border-b border-line bg-surface shadow-md"
          >
            <ul className="mx-auto max-w-6xl px-4 py-2">
              {mobileNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex min-h-11 items-center border-b border-line text-base font-medium text-ink last:border-b-0"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
