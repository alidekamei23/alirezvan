import { ContactCta } from "@/components/ContactCta";
import { Disclosure, DisclosureGroup } from "@/components/Disclosure";
import { MahriehCalculator } from "@/components/MahriehCalculator";
import { PageHeader } from "@/components/PageHeader";
import { RelatedTools } from "@/components/RelatedTools";
import { Section } from "@/components/Section";
import { Table } from "@/components/Table";
import { mahriehCopy, mahriehLegalNotes } from "@/content/mahrieh";
import { TOOLS_INDEX_HREF, tools } from "@/content/tools";
import { toPersianDigits } from "@/lib/format";
import { ANNUAL_YEARS, annualIndex } from "@/lib/mahrieh/mahrieh-calc";
import { pageMetadata } from "@/lib/seo";
import { formatIndex } from "@/lib/tadieh/present";
import { INDEX_SOURCE } from "@/lib/tadieh/tadieh-index";

const tool = tools.mahrieh;

export const metadata = pageMetadata({
  title: mahriehCopy.metaTitle,
  description: mahriehCopy.metaDescription,
  path: tool.href,
});

export default function Page() {
  return (
    <>
      <PageHeader
        title={mahriehCopy.heading}
        lead={mahriehCopy.lead}
        crumbs={[{ label: "ابزارهای محاسبه", href: TOOLS_INDEX_HREF }, { label: tool.title }]}
      >
        <div className="mt-6 border-s-4 border-primary-line ps-4">
          <p className="font-semibold text-ink">{mahriehCopy.formula}</p>
          <p className="mt-1 text-sm text-muted">{mahriehCopy.formulaNote}</p>
        </div>
      </PageHeader>

      <Section>
        <MahriehCalculator />
      </Section>

      <Section id="reference" tone="surface" title="شاخص‌ها و نکته‌ها">
        <DisclosureGroup>
          <Disclosure title="جدول شاخص سالانه">
            <p className="mb-4 text-sm text-muted">منبع: {INDEX_SOURCE}.</p>
            <div className="max-w-form tabular-nums">
              <Table
                caption="میانگین سالانه شاخص بهای کالاها و خدمات مصرفی"
                head={["سال", "شاخص سالانه"]}
                rows={[...ANNUAL_YEARS].reverse().map((year) => {
                  const index = annualIndex(year);
                  return [toPersianDigits(year), index == null ? "—" : formatIndex(index)];
                })}
              />
            </div>
          </Disclosure>
          <Disclosure title="مبنای قانونی و نکته‌ها">
            <ul className="flex max-w-reading list-disc flex-col gap-2 ps-5 text-ink marker:text-muted">
              {mahriehLegalNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Disclosure>
        </DisclosureGroup>
      </Section>

      <RelatedTools current="mahrieh" />

      <ContactCta />
    </>
  );
}
