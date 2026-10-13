import { MapPin } from "lucide-react";
import { BaleButton } from "@/components/BaleButton";
import { CallButton } from "@/components/CallButton";
import { Card } from "@/components/Card";
import { Grid } from "@/components/Grid";
import { LinkButton } from "@/components/LinkButton";
import { Ltr } from "@/components/Ltr";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { lawyer } from "@/content/lawyer";
import { consultationTypes, requestCopy } from "@/content/pages";
import { toPersianDigits } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: requestCopy.heading,
  description: requestCopy.metaDescription,
  path: "/request",
});

// Launch-test version: the request goes through a call or a message. The form with SMS
// verification (CLAUDE.md §5.3) replaces the contact block of this page later.
export default function RequestPage() {
  return (
    <>
      <PageHeader
        title={requestCopy.heading}
        lead={requestCopy.lead}
        crumbs={[{ label: requestCopy.heading }]}
      >
        <p className="mt-6 text-2xl font-bold text-ink">
          <Ltr>{toPersianDigits(lawyer.phone.display)}</Ltr>
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <CallButton variant="primary" size="lg" />
          <WhatsAppButton size="lg" />
          <BaleButton size="lg" />
        </div>
      </PageHeader>

      <Section id="prepare" title={requestCopy.prepareHeading}>
        <ul className="max-w-reading list-disc ps-6">
          {requestCopy.prepare.map((item) => (
            <li key={item} className="py-1">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-reading text-muted">{requestCopy.note}</p>
      </Section>

      <Section id="types" tone="surface" title="انواع مشاوره">
        <Grid cols={2}>
          <dl className="divide-y divide-line border-y border-line">
            {consultationTypes.map((type) => (
              <div key={type.value} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="font-semibold text-ink">{type.title}</dt>
                <dd className="text-muted">{type.description}</dd>
              </div>
            ))}
          </dl>
          <Card padding="lg">
            <p className="flex items-start gap-3">
              <MapPin aria-hidden="true" className="mt-1.5 size-5 shrink-0 text-muted" />
              <span>
                <span className="block text-sm text-muted">نشانی دفتر برای مشاوره حضوری</span>
                {lawyer.city}، {lawyer.address}
              </span>
            </p>
            <div className="mt-5">
              <LinkButton href="/contact" variant="secondary">
                نشانی و راه‌های تماس
              </LinkButton>
            </div>
          </Card>
        </Grid>
      </Section>
    </>
  );
}
