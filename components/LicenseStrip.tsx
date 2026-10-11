// LicenseStrip — the lawyer's license particulars as one ruled row, like the head of an
// official document: licensing body, license number, city, and the lookup link when it
// is known. Sits directly under the Home hero. For a boxed version use LawyerCard.
// Usage: <LicenseStrip />
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/Container";
import { Ltr } from "@/components/Ltr";
import { lawyer } from "@/content/lawyer";
import { toPersianDigits } from "@/lib/format";

export function LicenseStrip() {
  const items = [
    { label: "مرجع صدور پروانه", value: lawyer.licensingBody },
    {
      label: "شماره پروانه",
      value: <Ltr>{toPersianDigits(lawyer.licenseNumber)}</Ltr>,
    },
    { label: "محل فعالیت", value: lawyer.city },
  ];

  return (
    <div className="border-y border-line bg-surface">
      <Container className="flex flex-col md:flex-row md:items-stretch">
        <dl className="grid flex-1 grid-cols-1 divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0 md:divide-x-reverse">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-baseline justify-between gap-4 py-3 md:flex-col md:justify-start md:gap-0 md:px-6 md:py-4 md:first:ps-0"
            >
              <dt className="text-sm text-muted">{item.label}</dt>
              <dd className="font-semibold text-ink">{item.value}</dd>
            </div>
          ))}
        </dl>
        {lawyer.licenseLookupUrl && (
          <a
            href={lawyer.licenseLookupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-1.5 border-t border-line py-3 text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-hover md:border-t-0 md:border-s md:ps-6"
          >
            استعلام پروانه
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        )}
      </Container>
    </div>
  );
}
