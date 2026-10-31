import { ContactCta } from "@/components/ContactCta";
import { Disclosure, DisclosureGroup } from "@/components/Disclosure";
import { JsonLd } from "@/components/JsonLd";
import { KarshenasiCalculator } from "@/components/KarshenasiCalculator";
import { PageHeader } from "@/components/PageHeader";
import { RelatedTools } from "@/components/RelatedTools";
import { Section } from "@/components/Section";
import { Table } from "@/components/Table";
import { karshenasiCopy, karshenasiLegalNotes } from "@/content/karshenasi";
import { TOOLS_INDEX_HREF, tools } from "@/content/tools";
import { formatRial } from "@/lib/karshenasi/karshenasi-calc";
import {
  ARZYABI_CAP,
  GENERAL_CAP,
  TARIFF_EFFECTIVE,
  TARIFF_TITLE,
} from "@/lib/karshenasi/karshenasi-tariff";
import { tierRows } from "@/lib/karshenasi/present";
import { toolSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const tool = tools["dastmozd-karshenasi"];

export const metadata = pageMetadata({
  title: karshenasiCopy.metaTitle,
  description: karshenasiCopy.metaDescription,
  path: tool.href,
});

export default function Page() {
  return (
    <>
      <PageHeader
        title={karshenasiCopy.heading}
        lead={karshenasiCopy.lead}
        crumbs={[{ label: "ابزارهای محاسبه", href: TOOLS_INDEX_HREF }, { label: tool.title }]}
      >
        <div className="mt-6 border-s-4 border-primary-line ps-4">
          <p className="font-semibold text-ink">
            {TARIFF_TITLE}، لازم‌الاجرا از {TARIFF_EFFECTIVE}
          </p>
          <p className="mt-1 text-sm text-muted">{karshenasiCopy.sourceNote}</p>
        </div>
      </PageHeader>

      <Section>
        <KarshenasiCalculator />
      </Section>

      <Section id="reference" tone="surface" title="تعرفه‌ها و نکته‌ها">
        <DisclosureGroup>
          <Disclosure title="جدول پلکانی ارزیابی (ماده ۱۱)">
            <div className="max-w-reading tabular-nums">
              <Table
                caption="پله‌های دستمزد ارزیابی ماده ۱۱"
                head={["از ارزش (ریال)", "تا ارزش (ریال)", "دستمزد"]}
                rows={tierRows().map((row) => [
                  <span key="from" className="whitespace-nowrap">
                    {row.from}
                  </span>,
                  <span key="to" className="whitespace-nowrap">
                    {row.to}
                  </span>,
                  row.rate,
                ])}
              />
            </div>
            <ul className="mt-4 flex max-w-reading list-disc flex-col gap-1 ps-5 text-sm text-muted">
              <li>
                سقف دستمزد هر کارشناس در ارزیابی: {formatRial(ARZYABI_CAP)} ریال؛ سقف یک کارشناس
                در یک موضوع: {formatRial(GENERAL_CAP)} ریال.
              </li>
              <li>{karshenasiCopy.tierNote}</li>
            </ul>
          </Disclosure>
          <Disclosure title="مبنای قانونی و نکته‌ها">
            <ul className="flex max-w-reading list-disc flex-col gap-2 ps-5 text-ink marker:text-muted">
              {karshenasiLegalNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Disclosure>
        </DisclosureGroup>
      </Section>

      <RelatedTools current="dastmozd-karshenasi" />

      <ContactCta />

      <JsonLd data={toolSchema(tool)} />
    </>
  );
}
