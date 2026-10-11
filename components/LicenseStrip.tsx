// LicenseStrip — the lawyer's license particulars as one ruled row, like the head of an
// official document: licensing body (with its emblem), license number, city, and the
// lookup link when it is known. Sits directly under the Home hero. On phones the
// licensing body takes the full width and the other two share the row below it.
// For a boxed version use LawyerCard. Usage: <LicenseStrip />
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/Container";
import { LicensingBody } from "@/components/LicensingBody";
import { Ltr } from "@/components/Ltr";
import { lawyer } from "@/content/lawyer";
import { cn } from "@/lib/cn";
import { toPersianDigits } from "@/lib/format";

export function LicenseStrip() {
  const items = [
    {
      label: "مرجع صدور پروانه",
      value: <LicensingBody />,
      className: "col-span-2 border-b md:col-span-1 md:border-b-0 md:border-e md:ps-0",
    },
    {
      label: "شماره پروانه",
      value: <Ltr>{toPersianDigits(lawyer.licenseNumber)}</Ltr>,
      className: "border-e pe-4",
    },
    { label: "محل فعالیت", value: lawyer.city, className: "ps-4" },
  ];

  return (
    <div className="border-y border-line bg-surface">
      <Container className="flex flex-col md:flex-row md:items-stretch">
        <dl className="grid flex-1 grid-cols-2 md:grid-cols-[auto_1fr_1fr]">
          {items.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex flex-col gap-0.5 border-line py-3 md:px-8",
                item.className,
              )}
            >
              <dt className="text-sm text-muted">{item.label}</dt>
              {/* One fixed row height (the emblem's) so labels and values line up across columns. */}
              <dd className="flex items-center font-semibold text-ink md:min-h-11">
                {item.value}
              </dd>
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
