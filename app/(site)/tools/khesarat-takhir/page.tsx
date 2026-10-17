import { ContactCta } from "@/components/ContactCta";
import { Disclosure, DisclosureGroup } from "@/components/Disclosure";
import { PageHeader } from "@/components/PageHeader";
import { RelatedTools } from "@/components/RelatedTools";
import { Section } from "@/components/Section";
import { Table } from "@/components/Table";
import { TadiehCalculator } from "@/components/TadiehCalculator";
import { tadiehCopy, tadiehLegalNotes } from "@/content/tadieh";
import { tools } from "@/content/tools";
import { toPersianDigits } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { formatIndex, periodLabel } from "@/lib/tadieh/present";
import { MONTH_NAMES, YEARS, latestAvailable } from "@/lib/tadieh/tadieh-calc";
import { CPI_INDEX, INDEX_SOURCE } from "@/lib/tadieh/tadieh-index";

const tool = tools["khesarat-takhir"];

export const metadata = pageMetadata({
  title: tadiehCopy.metaTitle,
  description: tadiehCopy.metaDescription,
  path: tool.href,
});

const indexCell = (value: number | null) => (value == null ? "—" : formatIndex(value));

export default function Page() {
  return (
    <>
      <PageHeader
        title={tadiehCopy.heading}
        lead={tadiehCopy.lead}
        crumbs={[{ label: tool.title }]}
      >
        <div className="mt-6 border-s-4 border-primary-line ps-4">
          {tadiehCopy.formula.map((line) => (
            <p key={line} className="font-semibold text-ink">
              {line}
            </p>
          ))}
          <p className="mt-1 text-sm text-muted">{tadiehCopy.formulaNote}</p>
        </div>
      </PageHeader>

      <Section>
        <TadiehCalculator />
      </Section>

      <Section id="reference" tone="surface" title="شاخص‌ها و نکته‌ها">
        <DisclosureGroup>
          <Disclosure title="جدول کامل شاخص‌ها">
            <p className="mb-4 text-sm text-muted">
              منبع: {INDEX_SOURCE}. آخرین ماه به‌روزرسانی:{" "}
              {periodLabel(latestAvailable(), "monthly")}.
            </p>
            <div className="tabular-nums">
              <Table
                caption="شاخص ماهانه و میانگین سالانه"
                head={["سال", ...MONTH_NAMES, "میانگین سالانه"]}
                rows={[...YEARS].reverse().map((year) => [
                  toPersianDigits(year),
                  ...CPI_INDEX[year].monthly.map(indexCell),
                  indexCell(CPI_INDEX[year].average),
                ])}
              />
            </div>
          </Disclosure>
          <Disclosure title="نکته‌های حقوقی">
            <ul className="flex max-w-reading list-disc flex-col gap-2 ps-5 text-ink marker:text-muted">
              {tadiehLegalNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Disclosure>
        </DisclosureGroup>
      </Section>

      <RelatedTools current="khesarat-takhir" />

      <ContactCta />
    </>
  );
}
