import Link from "next/link";
import { contactLinks, lawyer } from "@/content/lawyer";
import {
  legalNav,
  practiceNav,
  siteNav,
  toolsNav,
  type NavItem,
} from "@/content/navigation";
import { toPersianDigits } from "@/lib/format";

function FooterList({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-bold text-ink">{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex min-h-11 items-center text-sm text-muted hover:text-accent"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface-alt">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="text-sm leading-7 text-muted">
          <p className="text-base font-bold text-ink">{lawyer.name}</p>
          <p>{lawyer.grade}</p>
          <p>{lawyer.licensingBody}</p>
          <p>شماره پروانه: {toPersianDigits(lawyer.licenseNumber)}</p>
          {lawyer.licenseLookupUrl && (
            <a
              href={lawyer.licenseLookupUrl}
              rel="noopener noreferrer"
              target="_blank"
              className="inline-flex min-h-11 items-center font-medium text-accent underline underline-offset-4"
            >
              استعلام پروانه وکالت
            </a>
          )}
        </div>

        <FooterList title="حوزه‌های کاری" items={practiceNav} />
        <FooterList title="ابزارها و راهنماها" items={[...toolsNav, ...siteNav]} />

        <div className="text-sm leading-7 text-muted">
          <h2 className="mb-2 text-sm font-bold text-ink">دفتر</h2>
          <address className="not-italic">
            <p>
              {lawyer.city}، {lawyer.address}
            </p>
            <p>{lawyer.workingHours}</p>
            <a
              href={contactLinks.call}
              className="inline-flex min-h-11 items-center font-medium text-ink hover:text-accent"
            >
              <span dir="ltr">{toPersianDigits(lawyer.phone.display)}</span>
            </a>
          </address>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs leading-6 text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            مطالب این وب‌سایت جنبه اطلاع‌رسانی دارد و مشاوره حقوقی محسوب
            نمی‌شود.
          </p>
          <ul className="flex gap-4">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
