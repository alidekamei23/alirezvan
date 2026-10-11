// Footer — license details (required on every page by CLAUDE.md §2.1), site links,
// office details and the site disclaimer. Mounted once in the layout.
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/Container";
import { Ltr } from "@/components/Ltr";
import { SITE_DISCLAIMER } from "@/content/legal";
import { contactLinks, lawyer } from "@/content/lawyer";
import {
  legalNav,
  practiceNav,
  siteNav,
  toolsNav,
  type NavItem,
} from "@/content/navigation";
import { toPersianDigits } from "@/lib/format";

const linkClass =
  "flex min-h-11 items-center text-sm text-muted underline-offset-4 hover:text-primary hover:underline";

function FooterList({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-1 text-sm font-bold text-ink">{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={linkClass}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <Container className="grid gap-x-8 gap-y-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="text-sm text-muted">
          <p className="text-lg font-bold text-ink">{lawyer.name}</p>
          <p>{lawyer.grade}</p>
          <p>{lawyer.licensingBody}</p>
          <p>
            شماره پروانه: <Ltr>{toPersianDigits(lawyer.licenseNumber)}</Ltr>
          </p>
          {lawyer.licenseLookupUrl && (
            <a
              href={lawyer.licenseLookupUrl}
              rel="noopener noreferrer"
              target="_blank"
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              استعلام پروانه
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          )}
        </div>

        <FooterList title="حوزه‌های کاری" items={practiceNav} />
        <FooterList title="ابزارها و راهنماها" items={[...toolsNav, ...siteNav]} />

        <div className="text-sm text-muted">
          <h2 className="mb-1 text-sm font-bold text-ink">دفتر</h2>
          <address className="not-italic">
            <p className="py-1.5">
              {lawyer.city}، {lawyer.address}
            </p>
            <p className="py-1.5">{lawyer.workingHours}</p>
            <a
              href={contactLinks.call}
              className="flex min-h-11 items-center font-semibold text-ink hover:text-primary"
            >
              <Ltr>{toPersianDigits(lawyer.phone.display)}</Ltr>
            </a>
          </address>
        </div>
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-col gap-x-8 gap-y-1 py-4 text-sm text-muted md:flex-row md:items-center md:justify-between">
          {/* TODO: lawyer review */}
          <p>{SITE_DISCLAIMER}</p>
          <ul className="flex shrink-0 gap-6">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  );
}
