import { ContactCta } from "@/components/ContactCta";
import { Disclosure, DisclosureGroup } from "@/components/Disclosure";
import { ErsCalculator } from "@/components/ErsCalculator";
import { PageHeader } from "@/components/PageHeader";
import { RelatedTools } from "@/components/RelatedTools";
import { Section } from "@/components/Section";
import { ersCopy, ersLegalNotes, ersRules } from "@/content/ers";
import { tools } from "@/content/tools";
import { pageMetadata } from "@/lib/seo";

const tool = tools["sahm-ol-ers"];

export const metadata = pageMetadata({
  title: ersCopy.metaTitle,
  description: ersCopy.metaDescription,
  path: tool.href,
});

export default function Page() {
  return (
    <>
      <PageHeader title={ersCopy.heading} lead={ersCopy.lead} crumbs={[{ label: tool.title }]} />

      <Section>
        <ErsCalculator />
      </Section>

      <Section id="reference" tone="surface" title="قواعد و نکته‌ها">
        <DisclosureGroup>
          <Disclosure title="قواعد اصلی تقسیم">
            <div className="flex max-w-reading flex-col gap-6">
              {ersRules.map((rule) => (
                <div key={rule.title}>
                  <h3 className="font-bold text-ink">{rule.title}</h3>
                  <ul className="mt-2 flex list-disc flex-col gap-1.5 ps-5 text-ink marker:text-muted">
                    {rule.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Disclosure>
          <Disclosure title="نکته‌های حقوقی و محدودیت‌ها">
            <ul className="flex max-w-reading list-disc flex-col gap-2 ps-5 text-ink marker:text-muted">
              {ersLegalNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Disclosure>
        </DisclosureGroup>
      </Section>

      <RelatedTools current="sahm-ol-ers" />

      <ContactCta />
    </>
  );
}
