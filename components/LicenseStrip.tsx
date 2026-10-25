// LicenseStrip — the lawyer's license particulars as one ruled row, like the head of an
// official document: licensing body (with its emblem), license number, city, and the
// lookup link when it is known. Sits directly under the Home hero. On phones the three
// share one row, centred, with the value above its label; the licensing body's emblem
// stands above its name there, and its label is left to screen readers.
// Every phone-only style is a `max-md:` addition; from `md` the strip is unchanged.
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
      value: <LicensingBody className="max-md:flex-col max-md:gap-1" />,
      className: "border-e md:ps-0",
      labelClassName: "max-md:sr-only",
      valueClassName: "max-md:text-sm max-md:font-normal max-md:text-muted",
    },
    {
      label: "شماره پروانه",
      value: <Ltr>{toPersianDigits(lawyer.licenseNumber)}</Ltr>,
      className: "border-e pe-4",
      valueClassName: "max-md:text-lg",
    },
    {
      label: "محل فعالیت",
      value: lawyer.city,
      className: "ps-4",
      valueClassName: "max-md:text-lg",
    },
  ];

  return (
    <div className="border-y border-line bg-surface">
      <Container className="flex flex-col md:flex-row md:items-stretch">
        <dl className="grid flex-1 grid-cols-3 md:grid-cols-[auto_1fr_1fr]">
          {items.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex flex-col gap-0.5 border-line py-3 md:px-8",
                "max-md:flex-col-reverse max-md:justify-center max-md:px-2 max-md:text-center",
                item.className,
              )}
            >
              <dt className={cn("text-sm text-muted", item.labelClassName)}>{item.label}</dt>
              {/* One fixed row height (the emblem's) so labels and values line up across columns. */}
              <dd
                className={cn(
                  "flex items-center font-semibold text-ink md:min-h-11",
                  "max-md:justify-center",
                  item.valueClassName,
                )}
              >
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
