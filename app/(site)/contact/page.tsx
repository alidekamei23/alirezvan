import { ExternalLink, MapPin, Phone } from "lucide-react";
import { BaleButton } from "@/components/BaleButton";
import { CallButton } from "@/components/CallButton";
import { Card } from "@/components/Card";
import { Grid } from "@/components/Grid";
import { LawyerCard } from "@/components/LawyerCard";
import { LinkButton } from "@/components/LinkButton";
import { Ltr } from "@/components/Ltr";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { lawyer } from "@/content/lawyer";
import { requestNav } from "@/content/navigation";
import { contactCopy } from "@/content/pages";
import { toPersianDigits } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: contactCopy.heading,
  description: contactCopy.metaDescription,
  path: "/contact",
});

const rowClass = "flex items-start gap-3";
const iconClass = "mt-1.5 size-5 shrink-0 text-muted";

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title={contactCopy.heading}
        lead={contactCopy.intro}
        crumbs={[{ label: "تماس" }]}
      >
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <LinkButton href={requestNav.href} size="lg">
            {requestNav.label}
          </LinkButton>
          <CallButton size="lg" />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-2">
          <WhatsAppButton variant="ghost" size="sm" />
          <BaleButton variant="ghost" size="sm" />
        </div>
      </PageHeader>

      <Section id="office" title="دفتر">
        <Grid cols={2}>
          <Card padding="lg">
            <address className="flex flex-col gap-4 not-italic">
              <p className={rowClass}>
                <MapPin aria-hidden="true" className={iconClass} />
                <span>
                  <span className="block text-sm text-muted">نشانی</span>
                  {lawyer.city}، {lawyer.address}
                </span>
              </p>
              <p className={rowClass}>
                <Phone aria-hidden="true" className={iconClass} />
                <span>
                  <span className="block text-sm text-muted">تلفن تماس</span>
                  <Ltr>{toPersianDigits(lawyer.phone.display)}</Ltr>
                </span>
              </p>
            </address>
          </Card>

          {/* TODO(lawyer): office location. Add a Neshan embed or a static map image served
              from our own domain (CLAUDE.md §2.2); until then only the outbound link shows. */}
          {lawyer.googleMapsUrl && (
            <div className="flex flex-col gap-4">
              <LinkButton
                href={lawyer.googleMapsUrl}
                external
                variant="secondary"
                icon={<ExternalLink />}
              >
                مسیریابی در Google Maps
              </LinkButton>
            </div>
          )}
        </Grid>
      </Section>

      <Section id="license" tone="surface" title="مشخصات پروانه وکالت">
        <div className="max-w-reading">
          <LawyerCard />
        </div>
      </Section>
    </>
  );
}
