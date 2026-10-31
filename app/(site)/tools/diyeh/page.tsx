import { ContactCta } from "@/components/ContactCta";
import { DiyehCalculator } from "@/components/DiyehCalculator";
import { Disclosure, DisclosureGroup } from "@/components/Disclosure";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { RelatedTools } from "@/components/RelatedTools";
import { Section } from "@/components/Section";
import { diyehClosingNote, diyehCopy, diyehLegalNotes } from "@/content/diyeh";
import { TOOLS_INDEX_HREF, tools } from "@/content/tools";
import { LAW } from "@/lib/diyeh/diyeh-calc";
import { toolSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const tool = tools.diyeh;

export const metadata = pageMetadata({
  title: diyehCopy.metaTitle,
  description: diyehCopy.metaDescription,
  path: tool.href,
});

export default function Page() {
  return (
    <>
      <PageHeader
        title={diyehCopy.heading}
        lead={diyehCopy.lead}
        crumbs={[{ label: "ابزارهای محاسبه", href: TOOLS_INDEX_HREF }, { label: tool.title }]}
      />

      <Section>
        <DiyehCalculator />
      </Section>

      <Section id="reference" tone="surface" title="نکات قانونی">
        <DisclosureGroup>
          <Disclosure title="مبنا، نرخ، قاعده ثلث، صندوق، ارش و پرداخت">
            <div className="flex max-w-reading flex-col gap-6">
              <p className="text-sm text-muted">
                {LAW.title}. {LAW.rateSource}.
              </p>
              {diyehLegalNotes.map((note) => (
                <div key={note.title}>
                  <h3 className="font-bold text-ink">{note.title}</h3>
                  <p className="mt-2 text-ink">{note.text}</p>
                </div>
              ))}
              <p className="border-s-4 border-estimate-line ps-4 font-semibold text-ink">
                {diyehClosingNote}
              </p>
            </div>
          </Disclosure>
        </DisclosureGroup>
      </Section>

      <RelatedTools current="diyeh" />

      <ContactCta />

      <JsonLd data={toolSchema(tool)} />
    </>
  );
}
