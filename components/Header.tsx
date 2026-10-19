// Header — sticky site header: name and grade, main navigation, the office phone and
// the consultation-request link. Below `lg` the navigation moves into MobileMenu.
// Mounted once in the layout.
import Link from "next/link";
import { Phone } from "lucide-react";
import { Container } from "@/components/Container";
import { LinkButton } from "@/components/LinkButton";
import { Ltr } from "@/components/Ltr";
import { MobileMenu } from "@/components/MobileMenu";
import { contactLinks, lawyer } from "@/content/lawyer";
import { practiceNav, requestNav, siteNav } from "@/content/navigation";
import { toPersianDigits } from "@/lib/format";

// Nine links: kept on one line each, with tight padding, so they fit beside the name and
// the request button from `lg` (and beside the phone number from `xl`).
const desktopNav = [...practiceNav, ...siteNav];

const mobileGroups = [
  { title: "حوزه‌های کاری", items: practiceNav },
  { title: "سایت", items: [...siteNav, requestNav] },
];

export function Header() {
  return (
    <header className="sticky top-0 z-sticky border-b border-line bg-surface">
      <Container className="flex min-h-(--header-height) items-center justify-between gap-3">
        <Link href="/" className="flex min-h-11 shrink-0 flex-col justify-center">
          <span className="text-lg font-bold leading-tight text-ink">{lawyer.name}</span>
          <span className="text-sm leading-tight text-muted">{lawyer.grade}</span>
        </Link>

        <nav aria-label="ناوبری اصلی" className="hidden lg:block">
          <ul className="flex items-center">
            {desktopNav.map((item) => (
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
          {/* Under 360px the full label does not fit beside the name; show a short one. */}
          <LinkButton
            href={requestNav.href}
            variant="secondary"
            size="sm"
            aria-label={requestNav.label}
            className="whitespace-nowrap max-xs:px-3"
          >
            <span className="xs:hidden">مشاوره</span>
            <span className="hidden xs:inline">{requestNav.label}</span>
          </LinkButton>
          <div className="lg:hidden">
            <MobileMenu groups={mobileGroups} />
          </div>
        </div>
      </Container>
    </header>
  );
}
