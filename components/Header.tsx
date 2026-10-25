// Header — sticky site header: name and grade, main navigation, the office phone and
// the consultation-request link. Below `lg` the navigation moves into MobileMenu.
// Mounted once in the layout.
import Link from "next/link";
import { Phone } from "lucide-react";
import { Container } from "@/components/Container";
import { HeaderRequestLink } from "@/components/HeaderRequestLink";
import { Ltr } from "@/components/Ltr";
import { MobileMenu } from "@/components/MobileMenu";
import { NavDisclosure } from "@/components/NavDisclosure";
import { contactLinks, lawyer } from "@/content/lawyer";
import { practiceNav, practiceNavTitle, requestNav, siteNav } from "@/content/navigation";
import { toPersianDigits } from "@/lib/format";

const mobileGroups = [
  { title: practiceNavTitle, items: practiceNav },
  { title: "سایت", items: [...siteNav, requestNav] },
];

export function Header() {
  return (
    <header className="sticky top-0 z-sticky border-b border-line bg-surface">
      <Container className="flex min-h-(--header-height) items-center justify-between gap-3">
        {/* Below lg the name block may shrink: on the narrowest phones the grade wraps
            instead of pushing the menu button off the screen. From lg it keeps its width. */}
        <Link href="/" className="flex min-h-11 min-w-0 flex-col justify-center lg:shrink-0">
          <span className="text-lg font-bold leading-tight text-ink">{lawyer.name}</span>
          <span className="text-sm leading-tight text-muted">{lawyer.grade}</span>
        </Link>

        {/* The four practice areas share one disclosure, so the links, the name and grade on
            one line, and the request button fit from `lg` (and the phone number from `xl`). */}
        <nav aria-label="ناوبری اصلی" className="hidden lg:block">
          <ul className="flex items-center">
            <li>
              <NavDisclosure label={practiceNavTitle} items={practiceNav} />
            </li>
            {siteNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center rounded-sm px-2 text-sm font-semibold whitespace-nowrap text-ink transition-colors hover:bg-primary-soft hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href={contactLinks.call}
            className="hidden min-h-11 items-center gap-2 rounded-sm px-3 text-sm font-semibold text-ink transition-colors hover:bg-primary-soft hover:text-primary xl:flex"
          >
            <Phone aria-hidden="true" className="size-4" />
            <Ltr>{toPersianDigits(lawyer.phone.display)}</Ltr>
          </a>
          <HeaderRequestLink />
          <div className="lg:hidden">
            <MobileMenu groups={mobileGroups} />
          </div>
        </div>
      </Container>
    </header>
  );
}
